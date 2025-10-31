import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { direction, amount, walletAddress, txHash } = await req.json();

    if (!direction || !amount || amount <= 0) {
      throw new Error('Invalid parameters');
    }

    if (direction === 'bank-to-wallet') {
      // Bank to Wallet: Atomic balance deduction and transaction recording
      
      // Use atomic update with balance check
      const { data: updateResult, error: updateError } = await supabaseClient
        .rpc('atomic_deduct_bimcoin_balance', {
          p_user_id: user.id,
          p_amount: amount
        });

      if (updateError || !updateResult) {
        throw new Error('Insufficient balance or update failed');
      }

      // Record pending transaction for treasury processing
      const { error: txError } = await supabaseClient
        .from('banking_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'bimcoin_bank_to_wallet',
          amount: amount,
          currency: 'BIMCOIN',
          status: 'pending',
          metadata: {
            wallet_address: walletAddress,
            direction: 'bank_to_wallet',
            created_at: new Date().toISOString()
          }
        });

      if (txError) throw txError;

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Swap initiated. Treasury will send tokens to your wallet.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (direction === 'wallet-to-bank') {
      // Wallet to Bank: Atomic balance credit after blockchain confirmation
      
      if (!txHash) {
        throw new Error('Transaction hash required for wallet-to-bank swap');
      }

      // Use atomic update to credit balance
      const { data: updateResult, error: updateError } = await supabaseClient
        .rpc('atomic_credit_bimcoin_balance', {
          p_user_id: user.id,
          p_amount: amount
        });

      if (updateError || !updateResult) {
        throw new Error('Balance update failed');
      }

      // Record completed transaction
      const { error: txError } = await supabaseClient
        .from('banking_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'bimcoin_wallet_to_bank',
          amount: amount,
          currency: 'BIMCOIN',
          status: 'completed',
          reference: txHash,
          metadata: {
            wallet_address: walletAddress,
            direction: 'wallet_to_bank',
            tx_hash: txHash,
            completed_at: new Date().toISOString()
          }
        });

      if (txError) throw txError;

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Swap completed successfully' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      throw new Error('Invalid swap direction');
    }

  } catch (error) {
    console.error('Bimcoin swap error:', error);
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