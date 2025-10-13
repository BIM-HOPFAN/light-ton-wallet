import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Send, Download, Coins, ChevronDown } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getTokens, Token } from '@/lib/tokens';

export default function WalletCard() {
  const { wallet, balance } = useWallet();
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [showAllTokens, setShowAllTokens] = useState(false);

  useEffect(() => {
    const allTokens = getTokens();
    setTokens(allTokens);
  }, []);
  
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
      <div className="text-center mb-6">
        <p className="text-sm text-muted-foreground mb-2">Total Balance</p>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          {balance} TON
        </h1>
        <p className="text-muted-foreground mt-2">≈ ${(parseFloat(balance) * 2.5).toFixed(2)} USD</p>
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
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                  {token.icon || '🪙'}
                </div>
                <div>
                  <p className="font-semibold text-sm">{token.symbol}</p>
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
    </Card>
  );
}
