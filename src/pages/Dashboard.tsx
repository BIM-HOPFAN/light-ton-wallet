import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import WalletCard from '@/components/WalletCard';
import TransactionList from '@/components/TransactionList';
import { Button } from '@/components/ui/button';
import { Settings, LogOut, ScanLine, Coins, ArrowRight } from 'lucide-react';
import { tonService } from '@/lib/ton';
import { deleteWallet } from '@/lib/storage';
import { toast } from 'sonner';

export default function Dashboard() {
  const { wallet, isLocked, balance, setBalance, setWallet, setIsLocked } = useWallet();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isLocked || !wallet) {
      navigate('/unlock');
      return;
    }
    
    // Fetch balance
    const fetchBalance = async () => {
      if (wallet?.address) {
        const bal = await tonService.getBalance(wallet.address);
        setBalance(bal);
      }
    };
    
    fetchBalance();
    const interval = setInterval(fetchBalance, 10000); // Refresh every 10s
    
    return () => clearInterval(interval);
  }, [wallet, isLocked, navigate, setBalance]);
  
  const handleLogout = () => {
    if (confirm('Are you sure you want to log out? Make sure you have your recovery phrase saved.')) {
      deleteWallet();
      setWallet(null);
      setIsLocked(true);
      toast.success('Logged out successfully');
      navigate('/');
    }
  };
  
  if (!wallet) return null;
  
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Light Wallet
          </h1>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/scan-connect')}
              title="Connect Apps"
            >
              <ScanLine className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/settings')}
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <WalletCard />
        
        {/* Bimcoin Earn Promotion */}
        <div className="my-8 relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 p-6 shadow-lg">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 rounded-full bg-primary/20 backdrop-blur-sm">
                <Coins className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-foreground">Earn with Bimcoin</h3>
                <p className="text-sm text-muted-foreground">Start earning rewards on TON Network today</p>
              </div>
            </div>
            <Button
              size="lg"
              onClick={() => window.open('https://bimlight.org', '_blank')}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all shadow-glow group min-w-fit"
            >
              Start Earning
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl -z-0" />
        </div>
        
        <TransactionList />
      </main>
    </div>
  );
}
