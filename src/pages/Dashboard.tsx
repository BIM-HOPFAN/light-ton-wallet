import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import WalletCard from '@/components/WalletCard';
import TransactionList from '@/components/TransactionList';
import { Button } from '@/components/ui/button';
import { Settings, LogOut, ScanLine, Coins, ArrowRight, Image, Globe, UserCircle, ShoppingBag, Building2 } from 'lucide-react';
import { tonService } from '@/lib/ton';
import { blockchainService } from '@/lib/blockchain';
import { autoLockService } from '@/lib/autolock';
import { deleteWallet } from '@/lib/storage';
import { toast } from 'sonner';
import { telegramService } from '@/lib/telegram';
import bimlightLogo from '@/assets/bimlight-logo.png';

export default function Dashboard() {
  const { wallet, isLocked, balance, setBalance, setWallet, setIsLocked } = useWallet();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isLocked || !wallet) {
      navigate('/unlock');
      return;
    }
    
    // Initialize Telegram WebApp if available
    if (telegramService.isAvailable()) {
      const webApp = telegramService.getWebApp();
      if (webApp) {
        // Apply Telegram theme
        document.documentElement.style.setProperty('--tg-theme-bg-color', webApp.backgroundColor);
        document.documentElement.style.setProperty('--tg-theme-text-color', webApp.themeParams.text_color || '');
      }
    }
    
    // Setup auto-lock
    autoLockService.setOnLockCallback(() => {
      setIsLocked(true);
      navigate('/unlock');
      toast.info('Wallet locked due to inactivity');
    });
    autoLockService.setupActivityListeners();
    autoLockService.startTimer();
    
    // Fetch balance using blockchain service
    const fetchBalance = async () => {
      if (wallet?.address) {
        const bal = await blockchainService.getBalance(wallet.address);
        setBalance(bal);
      }
    };
    
    fetchBalance();
    const interval = setInterval(fetchBalance, 10000); // Refresh every 10s
    
    return () => {
      clearInterval(interval);
      autoLockService.stopTimer();
      autoLockService.removeActivityListeners();
    };
  }, [wallet, isLocked, navigate, setBalance, setIsLocked]);
  
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
          <img src={bimlightLogo} alt="Bimlight Bank" className="h-8 w-auto" />
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
        
        {/* Quick Actions - Bimcart & Bank Featured */}
        <div className="grid grid-cols-2 gap-3 my-6">
          <Button
            onClick={() => navigate('/shop')}
            className="flex flex-col h-24 bg-gradient-to-br from-primary to-primary/80 hover:opacity-90 relative"
          >
            <ShoppingBag className="h-8 w-8 mb-2" />
            <span className="font-semibold">Bimcart Shop</span>
            <span className="text-xs opacity-80">Escrow Protected</span>
            {!user && (
              <span className="absolute top-1 right-1 text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                Sign in required
              </span>
            )}
          </Button>
          <Button
            onClick={() => navigate('/bank')}
            variant="outline"
            className="flex flex-col h-24 border-2 relative"
          >
            <Building2 className="h-8 w-8 mb-2" />
            <span className="font-semibold">Bimlight Bank</span>
            <span className="text-xs text-muted-foreground">Naira ⇄ NGNB</span>
            {!user && (
              <span className="absolute top-1 right-1 text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                Sign in required
              </span>
            )}
          </Button>
        </div>

        {/* Additional Quick Actions */}
        <div className="grid grid-cols-3 gap-3 my-6">
          <Button
            variant="outline"
            onClick={() => navigate('/address-book')}
            className="flex flex-col h-auto py-4"
          >
            <UserCircle className="h-6 w-6 mb-2" />
            <span className="text-xs">Addresses</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/nft-gallery')}
            className="flex flex-col h-auto py-4"
          >
            <Image className="h-6 w-6 mb-2" />
            <span className="text-xs">NFTs</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/dapp-browser')}
            className="flex flex-col h-auto py-4"
          >
            <Globe className="h-6 w-6 mb-2" />
            <span className="text-xs">DApps</span>
          </Button>
        </div>
        
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
              onClick={() => {
                telegramService.hapticFeedback('impact');
                telegramService.openLink('https://bimlight.org');
              }}
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
