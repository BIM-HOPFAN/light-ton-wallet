import { TonClient, WalletContractV4, internal, Address, beginCell } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';

// TON Client - Mainnet
const ENDPOINT = 'https://toncenter.com/api/v2/jsonRPC';

// Aggressive retry helper with exponential backoff for rate limiting
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  initialDelay: number = 2000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const is429 = error?.message?.includes('429') || error?.status === 429 || error?.message?.includes('rate limit');
      
      if (attempt < maxRetries - 1) {
        // More aggressive backoff: 2s, 4s, 8s, 16s, 32s
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`${is429 ? 'Rate limited' : 'Request failed'}, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        break;
      }
    }
  }
  
  throw lastError || new Error('Operation failed after retries');
}

export class TONService {
  private client: TonClient;
  
  constructor() {
    this.client = new TonClient({
      endpoint: ENDPOINT,
    });
  }
  
  // Get wallet balance
  async getBalance(address: string): Promise<string> {
    try {
      const addr = Address.parse(address);
      // Add small random delay to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
      const balance = await retryWithBackoff(() => this.client.getBalance(addr), 5, 2000);
      // Convert from nanoTON to TON
      return (Number(balance) / 1e9).toFixed(2);
    } catch (error: any) {
      console.error('Failed to get balance:', error);
      const errorMsg = error?.message || 'Unknown error';
      if (errorMsg.includes('429') || errorMsg.includes('rate limit')) {
        console.warn('Rate limit hit - balance will show 0.00');
      }
      return '0.00';
    }
  }
  
  // Send TON transaction
  async sendTON(params: {
    mnemonic: string;
    recipientAddress: string;
    amount: string;
    memo?: string;
  }): Promise<{ success: boolean; error?: string; txHash?: string }> {
    try {
      const keyPair = await mnemonicToPrivateKey(params.mnemonic.split(' '));
      
      const wallet = WalletContractV4.create({
        workchain: 0,
        publicKey: keyPair.publicKey
      });
      
      const contract = this.client.open(wallet);
      
      // Add small random delay before transaction
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
      
      const seqno = await retryWithBackoff(() => contract.getSeqno(), 5, 2000);
      
      // Convert TON to nanoTON
      const amountNano = Math.floor(parseFloat(params.amount) * 1e9).toString();
      
      // Create transfer with memo if provided
      const transfer = params.memo ? internal({
        to: params.recipientAddress,
        value: amountNano,
        body: beginCell()
          .storeUint(0, 32) // text comment op code
          .storeStringTail(params.memo)
          .endCell(),
        bounce: false
      }) : internal({
        to: params.recipientAddress,
        value: amountNano,
        bounce: false
      });
      
      await retryWithBackoff(() => contract.sendTransfer({
        seqno,
        secretKey: keyPair.secretKey,
        messages: [transfer]
      }), 5, 2000);
      
      // Wait for confirmation with retries
      const walletAddress = wallet.address.toString();
      for (let attempt = 0; attempt < 30; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        try {
          const currentSeqno = await retryWithBackoff(() => contract.getSeqno(), 3, 1000);
          if (currentSeqno > seqno) {
            return { 
              success: true,
              txHash: `${seqno}_${walletAddress}`
            };
          }
        } catch (seqnoError) {
          console.warn('Error checking confirmation, will retry...', seqnoError);
        }
      }
      
      return { success: false, error: 'Transaction timeout - transaction may still complete' };
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Send TON failed:', errorMsg);
      
      if (errorMsg.includes('429') || errorMsg.includes('rate limit') || error?.status === 429) {
        return {
          success: false,
          error: 'Network is busy. Please wait 30 seconds and try again.'
        };
      }
      
      return {
        success: false,
        error: errorMsg
      };
    }
  }
  
  // Send Jetton (Token) transaction
  async sendJetton(params: {
    mnemonic: string;
    jettonMasterAddress: string;
    recipientAddress: string;
    amount: string;
    decimals?: number;
  }): Promise<{ success: boolean; error?: string; txHash?: string }> {
    try {
      const keyPair = await mnemonicToPrivateKey(params.mnemonic.split(' '));
      
      const wallet = WalletContractV4.create({
        workchain: 0,
        publicKey: keyPair.publicKey
      });
      
      const contract = this.client.open(wallet);
      
      // Add small random delay before transaction
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
      
      const seqno = await retryWithBackoff(() => contract.getSeqno(), 5, 2000);
      const walletAddress = wallet.address;
      
      // Get the jetton wallet address for the sender
      const jettonMasterAddr = Address.parse(params.jettonMasterAddress);
      const addressCell = beginCell()
        .storeAddress(walletAddress)
        .endCell();
      
      const jettonWalletData = await retryWithBackoff(() => this.client.runMethod(
        jettonMasterAddr, 
        'get_wallet_address', 
        [{ type: 'slice', cell: addressCell }]
      ), 5, 2000);
      
      const jettonWalletAddress = jettonWalletData.stack.readAddress();
      
      // Convert amount to jetton units (with decimals)
      const decimals = params.decimals || 9;
      const amountInUnits = BigInt(Math.floor(parseFloat(params.amount) * Math.pow(10, decimals)));
      
      // Build jetton transfer message
      const recipientAddr = Address.parse(params.recipientAddress);
      
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
      
      await retryWithBackoff(() => contract.sendTransfer({
        seqno,
        secretKey: keyPair.secretKey,
        messages: [internalMessage]
      }), 5, 2000);
      
      // Wait for confirmation with retries
      for (let attempt = 0; attempt < 30; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        try {
          const currentSeqno = await retryWithBackoff(() => contract.getSeqno(), 3, 1000);
          if (currentSeqno > seqno) {
            return { 
              success: true,
              txHash: `${seqno}_${walletAddress.toString()}` 
            };
          }
        } catch (seqnoError) {
          console.warn('Error checking confirmation, will retry...', seqnoError);
        }
      }
      
      return { success: false, error: 'Transaction timeout - transaction may still complete' };
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Send Jetton failed:', errorMsg);
      
      if (errorMsg.includes('429') || errorMsg.includes('rate limit') || error?.status === 429) {
        return {
          success: false,
          error: 'Network is busy. Please wait 30 seconds and try again.'
        };
      }
      
      return {
        success: false,
        error: errorMsg
      };
    }
  }
  
  // Estimate fees (simplified)
  estimateFees(): string {
    return '0.008';
  }
}

export const tonService = new TONService();
