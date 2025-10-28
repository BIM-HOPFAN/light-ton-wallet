import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MonnifyAuthResponse {
  requestSuccessful: boolean;
  responseMessage: string;
  responseBody: {
    accessToken: string;
    expiresIn: number;
  };
}

interface VirtualAccountRequest {
  accountReference: string;
  accountName: string;
  currencyCode: string;
  contractCode: string;
  customerEmail: string;
  customerName: string;
  getAllAvailableBanks?: boolean;
}

interface TransferRequest {
  amount: number;
  reference: string;
  narration: string;
  destinationBankCode: string;
  destinationAccountNumber: string;
  currency: string;
  sourceAccountNumber: string;
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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, ...body } = await req.json();

    // Get Monnify credentials
    const MONNIFY_API_KEY = Deno.env.get('MONNIFY_API_KEY');
    const MONNIFY_SECRET_KEY = Deno.env.get('MONNIFY_SECRET_KEY');
    const MONNIFY_CONTRACT_CODE = Deno.env.get('MONNIFY_CONTRACT_CODE');
    const MONNIFY_BASE_URL = 'https://api.monnify.com';

    if (!MONNIFY_API_KEY || !MONNIFY_SECRET_KEY || !MONNIFY_CONTRACT_CODE) {
      throw new Error('Monnify credentials not configured');
    }

    // Authenticate with Monnify
    const authString = btoa(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`);
    console.log('Attempting Monnify authentication...');
    console.log('Base URL:', MONNIFY_BASE_URL);
    console.log('API Key (first 8 chars):', MONNIFY_API_KEY.substring(0, 8) + '...');
    
    const authResponse = await fetch(`${MONNIFY_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Auth response status:', authResponse.status);
    const authResponseText = await authResponse.text();
    console.log('Auth response body:', authResponseText);
    
    let authData: MonnifyAuthResponse;
    try {
      authData = JSON.parse(authResponseText);
    } catch (e) {
      throw new Error(`Failed to parse Monnify auth response: ${authResponseText}`);
    }
    
    if (!authData.requestSuccessful) {
      throw new Error(`Monnify authentication failed: ${authData.responseMessage}`);
    }

    const accessToken = authData.responseBody.accessToken;

    if (action === 'create_virtual_account') {
      // Check if user already has a virtual account
      const { data: existingAccount } = await supabaseClient
        .from('virtual_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingAccount) {
        return new Response(
          JSON.stringify({ success: true, data: existingAccount }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const accountReference = `BIM_${user.id.substring(0, 8)}_${Date.now()}`;
      const accountName = body.accountName || `Bimlight - ${user.email}`;

      const virtualAccountRequest: VirtualAccountRequest = {
        accountReference,
        accountName,
        currencyCode: 'NGN',
        contractCode: MONNIFY_CONTRACT_CODE,
        customerEmail: user.email || `${user.id}@bimlight.app`,
        customerName: accountName,
        getAllAvailableBanks: false,
      };

      console.log('Creating virtual account with request:', JSON.stringify(virtualAccountRequest, null, 2));
      
      const createAccountResponse = await fetch(
        `${MONNIFY_BASE_URL}/api/v2/bank-transfer/reserved-accounts`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(virtualAccountRequest),
        }
      );

      console.log('Create account response status:', createAccountResponse.status);
      const accountResponseText = await createAccountResponse.text();
      console.log('Create account response body:', accountResponseText);

      let accountData;
      try {
        accountData = JSON.parse(accountResponseText);
      } catch (e) {
        throw new Error(`Failed to parse Monnify create account response: ${accountResponseText}`);
      }

      if (!accountData.requestSuccessful) {
        console.error('Virtual account creation failed:', accountData);
        throw new Error(`Failed to create virtual account: ${accountData.responseMessage}`);
      }

      const accountDetails = accountData.responseBody.accounts[0];

      // Store in database
      const { data: savedAccount, error: saveError } = await supabaseClient
        .from('virtual_accounts')
        .insert({
          user_id: user.id,
          account_number: accountDetails.accountNumber,
          account_name: accountDetails.accountName,
          bank_name: accountDetails.bankName,
          bank_code: accountDetails.bankCode,
          account_reference: accountReference,
          currency_code: 'NGN',
        })
        .select()
        .single();

      if (saveError) {
        throw saveError;
      }

      return new Response(
        JSON.stringify({ success: true, data: savedAccount }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'initiate_transfer') {
      const { amount, recipientAccountNumber, recipientBankCode, narration } = body;

      // Check user's NGNB balance
      const { data: balanceData } = await supabaseClient
        .from('ngnb_balances')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (!balanceData || Number(balanceData.balance) < amount) {
        throw new Error('Insufficient NGNB balance');
      }

      // Get user's virtual account
      const { data: virtualAccount } = await supabaseClient
        .from('virtual_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!virtualAccount) {
        throw new Error('Virtual account not found');
      }

      const reference = `TRF_${user.id.substring(0, 8)}_${Date.now()}`;

      const transferRequest: TransferRequest = {
        amount: Number(amount),
        reference,
        narration: narration || 'Transfer from Bimlight',
        destinationBankCode: recipientBankCode,
        destinationAccountNumber: recipientAccountNumber,
        currency: 'NGN',
        sourceAccountNumber: virtualAccount.account_number,
      };

      const transferResponse = await fetch(
        `${MONNIFY_BASE_URL}/api/v2/disbursements/single`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transferRequest),
        }
      );

      const transferData = await transferResponse.json();

      if (!transferData.requestSuccessful) {
        throw new Error(`Transfer failed: ${transferData.responseMessage}`);
      }

      // Deduct NGNB balance
      const newBalance = Number(balanceData.balance) - amount;
      await supabaseClient
        .from('ngnb_balances')
        .update({ balance: newBalance })
        .eq('user_id', user.id);

      // Record transaction
      await supabaseClient
        .from('banking_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'withdrawal',
          amount: amount,
          ngnb_amount: amount,
          currency: 'NGN',
          status: 'completed',
          reference,
          metadata: {
            recipient_account: recipientAccountNumber,
            recipient_bank: recipientBankCode,
            monnify_response: transferData.responseBody,
          },
        });

      return new Response(
        JSON.stringify({ success: true, data: transferData.responseBody }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_virtual_account') {
      const { data: virtualAccount } = await supabaseClient
        .from('virtual_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      return new Response(
        JSON.stringify({ success: true, data: virtualAccount }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error:', error);
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