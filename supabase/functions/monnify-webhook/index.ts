import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, monnify-signature',
};

// In-memory cache for processed transaction references (5-minute expiry)
const processedTransactions = new Map<string, number>();
const TRANSACTION_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const WEBHOOK_MAX_AGE_MS = 5 * 60 * 1000; // Reject webhooks older than 5 minutes

// Cleanup expired transactions from cache
function cleanupExpiredTransactions() {
  const now = Date.now();
  for (const [key, timestamp] of processedTransactions.entries()) {
    if (now - timestamp > TRANSACTION_EXPIRY_MS) {
      processedTransactions.delete(key);
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const body = await req.text();
    const signature = req.headers.get('monnify-signature');
    const SECRET_KEY = Deno.env.get('MONNIFY_SECRET_KEY');

    // Verify webhook signature
    if (!signature || !SECRET_KEY) {
      console.error('Missing signature or secret key');
      throw new Error('Missing signature or secret key');
    }

    // Compute HMAC-SHA512 signature for verification
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SECRET_KEY);
    const msgData = encoder.encode(body);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (signature !== computedSignature) {
      console.error('Invalid webhook signature');
      throw new Error('Invalid signature');
    }

    const webhookData = JSON.parse(body);
    console.log('Webhook received:', { 
      eventType: webhookData.eventType,
      timestamp: new Date().toISOString(),
      reference: webhookData.eventData?.transactionReference 
    });

    // Validate webhook timestamp (if provided)
    if (webhookData.timestamp) {
      const webhookTime = new Date(webhookData.timestamp).getTime();
      const now = Date.now();
      if (now - webhookTime > WEBHOOK_MAX_AGE_MS) {
        console.error('Webhook too old:', { webhookTime, now, age: now - webhookTime });
        throw new Error('Webhook request too old - possible replay attack');
      }
    }

    const { eventType, eventData } = webhookData;

    // Handle successful payment
    if (eventType === 'SUCCESSFUL_TRANSACTION') {
      const {
        accountReference,
        amountPaid,
        transactionReference,
        paymentReference,
        customerEmail,
      } = eventData;

      // Cleanup old transaction records periodically
      cleanupExpiredTransactions();

      // Check for duplicate transaction (replay attack prevention)
      if (processedTransactions.has(transactionReference)) {
        console.warn('Duplicate transaction detected:', transactionReference);
        return new Response(
          JSON.stringify({ success: false, error: 'Transaction already processed' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 409 
          }
        );
      }

      // Check database for existing transaction reference
      const { data: existingTx } = await supabaseClient
        .from('banking_transactions')
        .select('id')
        .eq('reference', transactionReference)
        .maybeSingle();

      if (existingTx) {
        console.warn('Transaction reference already exists in database:', transactionReference);
        return new Response(
          JSON.stringify({ success: false, error: 'Transaction already processed' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 409 
          }
        );
      }

      // Find the user by account reference
      const { data: virtualAccount } = await supabaseClient
        .from('virtual_accounts')
        .select('user_id')
        .eq('account_reference', accountReference)
        .single();

      if (!virtualAccount) {
        console.error('Virtual account not found for reference:', accountReference);
        throw new Error('Virtual account not found');
      }

      const userId = virtualAccount.user_id;

      // Get or create NGNB balance
      const { data: balanceData } = await supabaseClient
        .from('ngnb_balances')
        .select('balance')
        .eq('user_id', userId)
        .single();

      let currentBalance = 0;
      if (balanceData) {
        currentBalance = Number(balanceData.balance);
      }

      const newBalance = currentBalance + Number(amountPaid);

      if (balanceData) {
        await supabaseClient
          .from('ngnb_balances')
          .update({ balance: newBalance })
          .eq('user_id', userId);
      } else {
        await supabaseClient
          .from('ngnb_balances')
          .insert({
            user_id: userId,
            balance: newBalance,
          });
      }

      // Record transaction
      await supabaseClient
        .from('banking_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'deposit',
          amount: amountPaid,
          ngnb_amount: amountPaid,
          currency: 'NGN',
          status: 'completed',
          reference: transactionReference,
          metadata: {
            payment_reference: paymentReference,
            customer_email: customerEmail,
            webhook_data: eventData,
            processed_at: new Date().toISOString()
          },
        });

      // Mark transaction as processed in memory cache
      processedTransactions.set(transactionReference, Date.now());

      console.log(`Successfully processed deposit of ${amountPaid} for user ${userId}`, {
        transactionReference,
        timestamp: new Date().toISOString()
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined
    });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});