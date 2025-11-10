import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Send, Download, Coins, ChevronDown, Network, ArrowLeftRight } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getTokens, Token } from '@/lib/tokens';
import { blockchainService, Network as NetworkType } from '@/lib/blockchain';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface WalletCardProps {
  isLoading?: boolean;
}

export default function WalletCard({ isLoading = false }: WalletCardProps) {
  const { wallet, balance } = useWallet();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [showAllTokens, setShowAllTokens] = useState(false);
  const [network, setNetwork] = useState<NetworkType>('mainnet');

  useEffect(() => {
    const loadTokensWithBalances = async () => {
      const allTokens = getTokens();
      
      // Fetch balances and metadata for ALL tokens with contract addresses
      if (wallet?.address) {
        const tokensWithBalances = await Promise.all(
          allTokens.map(async (token) => {
            if (token.contractAddress && token.network === 'TON') {
              try {
                // Fetch balance
                const balance = await blockchainService.getTokenBalance(
                  wallet.address,
                  token.contractAddress
                );
                
                // Fetch metadata from blockchain for ALL tokens (not just Bimcoin)
                try {
                  const metadata = await blockchainService.getJettonMetadata(token.contractAddress);
                  if (metadata.image) {
                    return { ...token, balance, icon: metadata.image };
                  }
                } catch (metadataError) {
                  console.log(`No blockchain metadata for ${token.symbol}, using default icon`);
                }
                
                return { ...token, balance };
              } catch (error) {
                console.error(`Failed to fetch data for ${token.symbol}:`, error);
                return { ...token, balance: '0.00' };
              }
            }
            return token;
          })
        );
        setTokens(tokensWithBalances);
      } else {
        setTokens(allTokens);
      }
    };
    
    loadTokensWithBalances();
    
    // Refresh balances every 10 seconds for better responsiveness
    const interval = setInterval(loadTokensWithBalances, 10000);
    return () => clearInterval(interval);
  }, [wallet?.address]);


  const handleNetworkChange = (newNetwork: NetworkType) => {
    setNetwork(newNetwork);
    blockchainService.setNetwork(newNetwork);
    toast.success(`Switched to ${newNetwork}`);
  };
  
  const copyAddress = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      toast.success('Address copied to clipboard');
    }
  };
  
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };
  
  return (
    <Card className="gradient-card shadow-glow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <Select value={network} onValueChange={(value) => handleNetworkChange(value as NetworkType)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mainnet">Mainnet</SelectItem>
            <SelectItem value="testnet">Testnet</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="text-center mb-6">
        <p className="text-sm text-muted-foreground mb-2">Total Balance</p>
        {isLoading ? (
          <Skeleton className="h-14 w-48" />
        ) : (
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {balance} TON
          </h1>
        )}
      </div>
      
      {wallet && (
        <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-muted/50 rounded-lg">
          <code className="text-sm font-mono">{formatAddress(wallet.address)}</code>
          <Button size="sm" variant="ghost" onClick={copyAddress}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Assets</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/tokens')}
          >
            <Coins className="h-4 w-4 mr-1" />
            Manage
          </Button>
        </div>
        
        <div className="space-y-2">
          {tokens.slice(0, showAllTokens ? tokens.length : 3).map((token) => (
            <div
              key={token.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate('/send', { state: { selectedToken: token } })}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-lg overflow-hidden">
                  {typeof token.icon === 'string' && (token.icon.includes('/assets/') || token.icon.startsWith('data:') || token.icon.endsWith('.svg') || token.icon.endsWith('.png')) ? (
                    <img src={token.icon} alt={token.name} className="w-6 h-6 object-contain" />
                  ) : (
                    <span>{token.icon || '🪙'}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{token.symbol}</p>
                    <span className="text-xs text-muted-foreground">({token.network})</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{token.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm">
                  {token.id === 'ton' ? balance : token.balance || '0.00'}
                </p>
                <p className="text-xs text-muted-foreground">{token.symbol}</p>
              </div>
            </div>
          ))}
        </div>
        
        {tokens.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllTokens(!showAllTokens)}
            className="w-full mt-2"
          >
            <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${showAllTokens ? 'rotate-180' : ''}`} />
            {showAllTokens ? 'Show Less' : `Show ${tokens.length - 3} More`}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button 
          className="gradient-primary transition-smooth"
          onClick={() => navigate('/send')}
        >
          <Send className="mr-2 h-4 w-4" />
          Send
        </Button>
        <Button 
          variant="outline" 
          className="transition-smooth"
          onClick={() => navigate('/receive')}
        >
          <Download className="mr-2 h-4 w-4" />
          Receive
        </Button>
      </div>
      
      {user && tokens.find(t => t.symbol === 'NGNB') && (
        <Button 
          variant="secondary" 
          className="w-full mt-3"
          onClick={() => navigate('/ngnb-swap')}
        >
          <ArrowLeftRight className="mr-2 h-4 w-4" />
          Swap NGNB (Bank ⇄ Wallet)
        </Button>
      )}
    </Card>
  );
}
