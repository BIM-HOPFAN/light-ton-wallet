import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { TonClient, WalletContractV4, Address, beginCell, internal } from 'npm:@ton/ton@15.4.0';
import { mnemonicToPrivateKey } from 'npm:@ton/crypto@3.3.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NGNB_CONTRACT = 'EQBqvuMEkR9XHTE0qRVzIJ7gVSxVvB93757VV3nNEhKwb06q';
const TON_ENDPOINT = 'https://toncenter.com/api/v2/jsonRPC'; // Use mainnet

interface ProcessSwapRequest {
  action: 'process_swaps';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action } = await req.json() as ProcessSwapRequest;

    if (action === 'process_swaps') {
      console.log('Processing pending swaps...');

      // Get pending swap_to_wallet transactions
      const { data: pendingSwaps, error: fetchError } = await supabaseClient
        .from('banking_transactions')
        .select('*')
        .eq('transaction_type', 'swap_to_wallet')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(10);

      if (fetchError) {
        throw new Error(`Failed to fetch swaps: ${fetchError.message}`);
      }

      if (!pendingSwaps || pendingSwaps.length === 0) {
        console.log('No pending swaps to process');
        return new Response(
          JSON.stringify({ success: true, processed: 0, message: 'No pending swaps' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Found ${pendingSwaps.length} pending swaps`);

      // Get treasury mnemonic
      const treasuryMnemonic = Deno.env.get('TREASURY_MNEMONIC');
      if (!treasuryMnemonic) {
        throw new Error('Treasury mnemonic not configured');
      }

      // Initialize TON client
      const tonClient = new TonClient({ endpoint: TON_ENDPOINT });

      // Process each swap
      const results = [];
      for (const swap of pendingSwaps) {
        try {
          console.log(`Processing swap ${swap.id} for user ${swap.user_id}`);

          const metadata = swap.metadata as any;
          const walletAddress = metadata?.wallet_address;
          const amount = swap.ngnb_amount;

          if (!walletAddress || !amount) {
            console.error(`Invalid swap data for ${swap.id}`);
            // Mark as failed
            await supabaseClient
              .from('banking_transactions')
              .update({ 
                status: 'failed',
                metadata: { ...metadata, error: 'Invalid swap data' }
              })
              .eq('id', swap.id);
            continue;
          }

          // Send NGNB tokens from treasury to user wallet
          const txResult = await sendNGNBFromTreasury({
            tonClient,
            treasuryMnemonic,
            recipientAddress: walletAddress,
            amount: amount.toString(),
          });

          if (txResult.success) {
            // Update transaction as completed
            await supabaseClient
              .from('banking_transactions')
              .update({ 
                status: 'completed',
                reference: txResult.txHash,
                metadata: { 
                  ...metadata, 
                  tx_hash: txResult.txHash,
                  processed_at: new Date().toISOString()
                }
              })
              .eq('id', swap.id);

            console.log(`Successfully processed swap ${swap.id}, tx: ${txResult.txHash}`);
            results.push({ id: swap.id, success: true, txHash: txResult.txHash });
          } else {
            // Update as failed
            await supabaseClient
              .from('banking_transactions')
              .update({ 
                status: 'failed',
                metadata: { 
                  ...metadata, 
                  error: txResult.error,
                  failed_at: new Date().toISOString()
                }
              })
              .eq('id', swap.id);

            console.error(`Failed to process swap ${swap.id}: ${txResult.error}`);
            results.push({ id: swap.id, success: false, error: txResult.error });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Error processing swap ${swap.id}:`, error);
          results.push({ id: swap.id, success: false, error: errorMessage });
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          processed: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          results 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in ngnb-treasury function:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendNGNBFromTreasury(params: {
  tonClient: TonClient;
  treasuryMnemonic: string;
  recipientAddress: string;
  amount: string;
}): Promise<{ success: boolean; error?: string; txHash?: string }> {
  try {
    const { tonClient, treasuryMnemonic, recipientAddress, amount } = params;

    // Get key pair from mnemonic
    const keyPair = await mnemonicToPrivateKey(treasuryMnemonic.split(' '));

    // Create wallet contract
    const wallet = WalletContractV4.create({
      workchain: 0,
      publicKey: keyPair.publicKey
    });

    const contract = tonClient.open(wallet);
    const seqno = await contract.getSeqno();
    const walletAddress = wallet.address;

    console.log(`Treasury wallet: ${walletAddress.toString()}`);
    console.log(`Sending ${amount} NGNB to ${recipientAddress}`);

    // Get jetton wallet address for treasury
    const jettonMasterAddr = Address.parse(NGNB_CONTRACT);
    const addressCell = beginCell()
      .storeAddress(walletAddress)
      .endCell();

    const jettonWalletData = await tonClient.runMethod(
      jettonMasterAddr,
      'get_wallet_address',
      [{ type: 'slice', cell: addressCell }]
    );

    const jettonWalletAddress = jettonWalletData.stack.readAddress();
    console.log(`Treasury jetton wallet: ${jettonWalletAddress.toString()}`);

    // Convert amount to jetton units (9 decimals)
    const amountInUnits = BigInt(Math.floor(parseFloat(amount) * 1e9));

    // Build jetton transfer message
    const recipientAddr = Address.parse(recipientAddress);

    const transferBody = beginCell()
      .storeUint(0xf8a7ea5, 32) // jetton transfer op code
      .storeUint(0, 64) // query id
      .storeCoins(amountInUnits) // amount
      .storeAddress(recipientAddr) // destination
      .storeAddress(walletAddress) // response destination
      .storeBit(0) // no custom payload
      .storeCoins(1n) // forward amount (1 nanoton)
      .storeBit(0) // no forward payload
      .endCell();

    const internalMessage = internal({
      to: jettonWalletAddress,
      value: '50000000', // 0.05 TON for gas
      body: transferBody
    });

    // Send transfer
    await contract.sendTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      messages: [internalMessage]
    });

    // Wait for confirmation
    console.log('Waiting for transaction confirmation...');
    for (let attempt = 0; attempt < 30; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const currentSeqno = await contract.getSeqno();
      if (currentSeqno > seqno) {
        const txHash = `${seqno}_${walletAddress.toString()}`;
        console.log(`Transaction confirmed: ${txHash}`);
        return { success: true, txHash };
      }
    }

    return { success: false, error: 'Transaction timeout' };
  } catch (error) {
    console.error('Error sending NGNB:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
