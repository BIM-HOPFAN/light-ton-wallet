import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Send, Download } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function WalletCard() {
  const { wallet, balance } = useWallet();
  const navigate = useNavigate();
  
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
