import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import WalletCard from '@/components/WalletCard';
import TransactionList from '@/components/TransactionList';
import { Button } from '@/components/ui/button';
import { Settings, LogOut, ScanLine } from 'lucide-react';
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
        <TransactionList />
      </main>
    </div>
  );
}
