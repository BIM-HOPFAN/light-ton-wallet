import { TonClient, WalletContractV4, internal, Address } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';

// TON Client (testnet for demo - switch to mainnet for production)
const ENDPOINT = 'https://testnet.toncenter.com/api/v2/jsonRPC';

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
      const balance = await this.client.getBalance(addr);
      // Convert from nanoTON to TON
      return (Number(balance) / 1e9).toFixed(2);
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0.00';
    }
  }
  
  // Send TON transaction
  async sendTON(params: {
    mnemonic: string;
    recipientAddress: string;
    amount: string;
    memo?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const keyPair = await mnemonicToPrivateKey(params.mnemonic.split(' '));
      
      const wallet = WalletContractV4.create({
        workchain: 0,
        publicKey: keyPair.publicKey
      });
      
      const contract = this.client.open(wallet);
      const seqno = await contract.getSeqno();
      
      // Convert TON to nanoTON
      const amountNano = Math.floor(parseFloat(params.amount) * 1e9).toString();
      
      const transfer = internal({
        to: params.recipientAddress,
        value: amountNano,
        body: params.memo || '',
        bounce: false
      });
      
      await contract.sendTransfer({
        seqno,
        secretKey: keyPair.secretKey,
        messages: [transfer]
      });
      
      // Wait for confirmation
      for (let attempt = 0; attempt < 30; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const currentSeqno = await contract.getSeqno();
        if (currentSeqno > seqno) {
          return { success: true };
        }
      }
      
      return { success: false, error: 'Transaction timeout' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  // Estimate fees (simplified)
  estimateFees(): string {
    return '0.008';
  }
}

export const tonService = new TONService();
