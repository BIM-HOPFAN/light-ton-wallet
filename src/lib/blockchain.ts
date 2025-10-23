// Phase 1: Real blockchain integration with mainnet/testnet support
import { TonClient, Address, beginCell } from '@ton/ton';

export type Network = 'mainnet' | 'testnet';

class BlockchainService {
  private mainnetClient: TonClient;
  private testnetClient: TonClient;
  private currentNetwork: Network = 'mainnet';

  constructor() {
    // Initialize both mainnet and testnet clients
    this.mainnetClient = new TonClient({
      endpoint: 'https://toncenter.com/api/v2/jsonRPC',
    });
    
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
}

export const blockchainService = new BlockchainService();
