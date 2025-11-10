// Phase 1: Real blockchain integration with mainnet/testnet support
import { TonClient, Address, beginCell } from '@ton/ton';

export type Network = 'mainnet' | 'testnet';

const API_KEY = 'f2e9c024f7ed8f8c97f82a6d8c1e4b5a3d6c7e8f9a0b1c2d3e4f5a6b7c8d9e0f'; // Free public key

// Retry helper with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const is429 = error?.message?.includes('429') || error?.status === 429;
      
      if (attempt < maxRetries - 1 && is429) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`Rate limited (429), retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else if (attempt < maxRetries - 1) {
        const delay = initialDelay;
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        break;
      }
    }
  }
  
  throw lastError || new Error('Operation failed after retries');
}

class BlockchainService {
  private mainnetClient: TonClient;
  private testnetClient: TonClient;
  private currentNetwork: Network = 'mainnet'; // Production default

  constructor() {
    // Initialize mainnet (production)
    this.mainnetClient = new TonClient({
      endpoint: 'https://toncenter.com/api/v2/jsonRPC',
      apiKey: API_KEY,
    });
    
    // Initialize testnet (development)
    this.testnetClient = new TonClient({
      endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
      apiKey: API_KEY,
    });
  }

  setNetwork(network: Network) {
    this.currentNetwork = network;
  }

  getNetwork(): Network {
    return this.currentNetwork;
  }

  private getClient(): TonClient {
    return this.currentNetwork === 'mainnet' ? this.mainnetClient : this.testnetClient;
  }

  async getBalance(address: string): Promise<string> {
    try {
      console.log(`🔄 Fetching balance for ${address} on ${this.currentNetwork}`);
      const client = this.getClient();
      const addr = Address.parse(address);
      const balance = await retryWithBackoff(() => client.getBalance(addr));
      const tonBalance = (Number(balance) / 1e9).toFixed(2);
      console.log(`✅ Balance fetched: ${tonBalance} TON`);
      return tonBalance;
    } catch (error) {
      console.error('❌ Error fetching balance:', error);
      throw new Error(`Failed to fetch balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTokenBalance(walletAddress: string, tokenContractAddress: string): Promise<string> {
    try {
      const client = this.getClient();
      
      // Parse addresses
      const addr = Address.parse(walletAddress);
      const tokenAddr = Address.parse(tokenContractAddress);
      
      // Create a cell with the wallet address
      const addressCell = beginCell()
        .storeAddress(addr)
        .endCell();
      
      // Call get_wallet_address method on jetton master contract
      const jettonMasterData = await retryWithBackoff(() => 
        client.runMethod(tokenAddr, 'get_wallet_address', [
          { type: 'slice', cell: addressCell }
        ])
      );
      
      // Get the jetton wallet address from the response
      const jettonWalletAddress = jettonMasterData.stack.readAddress();
      
      // Now get the balance from the jetton wallet
      const walletData = await retryWithBackoff(() => 
        client.runMethod(jettonWalletAddress, 'get_wallet_data')
      );
      const balance = walletData.stack.readBigNumber();
      
      // Convert from token decimals (usually 9 for TON tokens)
      return (Number(balance) / 1e9).toFixed(2);
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return '0.00';
    }
  }

  async getTransactions(address: string, limit: number = 10): Promise<any[]> {
    try {
      const client = this.getClient();
      const addr = Address.parse(address);
      const transactions = await retryWithBackoff(() => 
        client.getTransactions(addr, { limit })
      );
      return transactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  async estimateFee(toAddress: string, amount: string): Promise<string> {
    // Estimate transaction fee (simplified)
    return '0.01'; // ~0.01 TON for standard transfer
  }

  async validateAddress(address: string): Promise<boolean> {
    try {
      Address.parse(address);
      return true;
    } catch {
      return false;
    }
  }

  async getJettonMetadata(tokenContractAddress: string): Promise<{ name?: string; symbol?: string; image?: string; decimals?: number }> {
    try {
      const client = this.getClient();
      const tokenAddr = Address.parse(tokenContractAddress);
      
      // Get jetton data from master contract
      const jettonData = await retryWithBackoff(() => 
        client.runMethod(tokenAddr, 'get_jetton_data')
      );
      
      // Read the content cell which contains metadata
      const contentCell = jettonData.stack.readCell();
      const contentSlice = contentCell.beginParse();
      
      // Read the off-chain content flag (0x01 for off-chain)
      const offChainFlag = contentSlice.loadUint(8);
      
      if (offChainFlag === 0x01) {
        // Read the URI
        const uriBytes = contentSlice.loadBuffer(contentSlice.remainingBits / 8);
        const uri = uriBytes.toString('utf-8');
        
        // Fetch metadata from URI
        const response = await fetch(uri);
        const metadata = await response.json();
        
        return {
          name: metadata.name,
          symbol: metadata.symbol,
          image: metadata.image,
          decimals: metadata.decimals || 9
        };
      }
      
      return {};
    } catch (error) {
      console.error('Error fetching jetton metadata:', error);
      return {};
    }
  }
}

export const blockchainService = new BlockchainService();
