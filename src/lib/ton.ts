import { TonClient, WalletContractV4, internal, Address, beginCell } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';

// TON Client - Mainnet
const ENDPOINT = 'https://toncenter.com/api/v2/jsonRPC';

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
      const seqno = await contract.getSeqno();
      const walletAddress = wallet.address;
      
      // Get the jetton wallet address for the sender
      const jettonMasterAddr = Address.parse(params.jettonMasterAddress);
      const addressCell = beginCell()
        .storeAddress(walletAddress)
        .endCell();
      
      const jettonWalletData = await this.client.runMethod(
        jettonMasterAddr, 
        'get_wallet_address', 
        [{ type: 'slice', cell: addressCell }]
      );
      
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
      
      await contract.sendTransfer({
        seqno,
        secretKey: keyPair.secretKey,
        messages: [internalMessage]
      });
      
      // Wait for confirmation
      for (let attempt = 0; attempt < 30; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const currentSeqno = await contract.getSeqno();
        if (currentSeqno > seqno) {
          return { 
            success: true,
            txHash: `${seqno}_${walletAddress.toString()}` 
          };
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
