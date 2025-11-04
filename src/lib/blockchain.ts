// Phase 1: Real blockchain integration with mainnet/testnet support
import { TonClient, Address, beginCell } from '@ton/ton';

export type Network = 'mainnet' | 'testnet';

class BlockchainService {
  private mainnetClient: TonClient;
  private testnetClient: TonClient;
  private currentNetwork: Network = 'mainnet'; // Production default

  constructor() {
    // Initialize mainnet (production)
    this.mainnetClient = new TonClient({
      endpoint: 'https://toncenter.com/api/v2/jsonRPC',
    });
    
    // Initialize testnet (development)
    this.testnetClient = new TonClient({
      endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
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
      const client = this.getClient();
      const addr = Address.parse(address);
      const balance = await client.getBalance(addr);
      return (Number(balance) / 1e9).toFixed(2);
    } catch (error) {
      console.error('Error fetching balance:', error);
      return '0.00';
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
      const jettonMasterData = await client.runMethod(tokenAddr, 'get_wallet_address', [
        { type: 'slice', cell: addressCell }
      ]);
      
      // Get the jetton wallet address from the response
      const jettonWalletAddress = jettonMasterData.stack.readAddress();
      
      // Now get the balance from the jetton wallet
      const walletData = await client.runMethod(jettonWalletAddress, 'get_wallet_data');
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
      const transactions = await client.getTransactions(addr, { limit });
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
      const jettonData = await client.runMethod(tokenAddr, 'get_jetton_data');
      
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
