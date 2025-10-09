import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Copy, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

export default function Receive() {
  const navigate = useNavigate();
  const { wallet } = useWallet();
  
  if (!wallet) return null;
  
  const copyAddress = () => {
    navigator.clipboard.writeText(wallet.address);
    toast.success('Address copied to clipboard');
  };
  
  const shareAddress = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My TON Wallet Address',
          text: wallet.address
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      copyAddress();
    }
  };
  
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Wallet
          </Button>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 max-w-md">
        <Card className="p-8 text-center gradient-card shadow-glow">
          <h2 className="text-2xl font-bold mb-6">Receive TON</h2>
          
          <div className="bg-white p-6 rounded-2xl mb-6 inline-block">
            <QRCodeSVG 
              value={wallet.address}
              size={200}
              level="H"
              includeMargin
            />
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg mb-6">
            <p className="text-xs text-muted-foreground mb-2">Your TON Address</p>
            <code className="text-sm font-mono break-all">{wallet.address}</code>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline"
              onClick={copyAddress}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
            <Button 
              variant="outline"
              onClick={shareAddress}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
          
          <div className="bg-muted/30 p-4 rounded-lg mt-6 text-left">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">Note:</span> Only send TON to this address. 
              Sending other cryptocurrencies may result in permanent loss.
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
