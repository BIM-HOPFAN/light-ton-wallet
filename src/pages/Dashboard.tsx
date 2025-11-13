import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import WalletCard from '@/components/WalletCard';
import TransactionList from '@/components/TransactionList';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Settings, LogOut, ScanLine, Coins, ArrowRight, Image, Globe, UserCircle, ShoppingBag, Building2, BarChart3 } from 'lucide-react';
import { TransactionNotificationBadge } from '@/components/TransactionNotificationBadge';
import { blockchainService } from '@/lib/blockchain';
import { autoLockService } from '@/lib/autolock';
import { deleteWallet } from '@/lib/storage';
import { getAllTransactions } from '@/lib/transactions';
import { toast } from 'sonner';
import { telegramService } from '@/lib/telegram';
import bimlightLogo from '@/assets/bimlight-logo.png';

export default function Dashboard() {
  const { wallet, isLocked, balance, setBalance, setWallet, setIsLocked } = useWallet();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [touchStart, setTouchStart] = useState(0);

  // Fetch balance and transactions functions
  const fetchBalance = async (showLoading = false) => {
    if (!wallet?.address) return;
    
    try {
      if (showLoading) setIsLoadingBalance(true);
      const bal = await blockchainService.getBalance(wallet.address);
      setBalance(bal);
    } catch (error) {
      console.error('Balance fetch error:', error);
      setBalance('0.00');
    } finally {
      if (showLoading) setIsLoadingBalance(false);
    }
  };

  const fetchTransactions = async () => {
    if (!wallet?.address) return;
    
    try {
      const txs = user?.id 
        ? await getAllTransactions(user.id, wallet.address)
        : await getAllTransactions('', wallet.address);
      setTransactions(txs);
    } catch (error) {
      console.error('Transaction fetch error:', error);
    }
  };
  
  useEffect(() => {
    // Check if wallet is unlocked
    if (!wallet || isLocked) {
      navigate('/unlock');
      return;
    }

    // Reset the auto-lock timer when Dashboard mounts
    autoLockService.updateLastActivity();
    
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
    
    // Fetch both in parallel for instant loading
    Promise.all([fetchBalance(true), fetchTransactions()]);
    
    // Refresh every 15 seconds
    const interval = setInterval(() => {
      Promise.all([fetchBalance(false), fetchTransactions()]);
    }, 15000);
    
    return () => {
      clearInterval(interval);
      autoLockService.stopTimer();
      autoLockService.removeActivityListeners();
    };
  }, [wallet, isLocked, navigate, setBalance, setIsLocked, user]);
  
  const handleLogout = () => {
    if (confirm('Are you sure you want to log out? Make sure you have your recovery phrase saved.')) {
      deleteWallet();
      autoLockService.clearSession(); // Clear session data on logout
      setWallet(null);
      setIsLocked(true);
      toast.success('Logged out successfully');
      navigate('/');
    }
  };

  const handleRefresh = async () => {
    setIsLoadingBalance(true);
    await Promise.all([
      fetchBalance(true),
      fetchTransactions()
    ]);
    toast.success('Data refreshed');
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop === 0) {
      setTouchStart(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop === 0 && touchStart > 0) {
      const currentTouch = e.touches[0].clientY;
      const distance = Math.max(0, currentTouch - touchStart);
      
      if (distance > 0 && distance <= 100) {
        setPullDistance(distance);
        setIsPulling(true);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60) {
      await handleRefresh();
    }
    setIsPulling(false);
    setPullDistance(0);
    setTouchStart(0);
  };
  
  if (!wallet) return null;
  
  return (
    <div 
      className="min-h-screen"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      {isPulling && (
        <div 
          className="fixed top-0 left-0 right-0 flex justify-center items-center z-50 transition-all"
          style={{ 
            height: `${pullDistance}px`,
            opacity: pullDistance / 100
          }}
        >
          <div className="bg-primary/10 backdrop-blur-sm rounded-full p-3 animate-pulse">
            <ArrowRight className="h-6 w-6 text-primary rotate-[-90deg]" />
          </div>
        </div>
      )}
      
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img src={bimlightLogo} alt="Bimlight Bank" className="h-8 w-auto" />
          <div className="flex gap-2">
            <TransactionNotificationBadge />
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
        <WalletCard isLoading={isLoadingBalance} />
        
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

        {/* Tabs for Overview and Analytics */}
        <Tabs defaultValue="overview" className="w-full my-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Additional Quick Actions */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Quick Actions</h3>
              <div className="grid grid-cols-3 gap-3">
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
            </Card>

            {/* Bimcoin Earn Promotion */}
            <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 p-6 shadow-lg">
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
            
            {/* View All Transactions Button */}
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                onClick={() => navigate('/transactions')}
                className="w-full md:w-auto"
              >
                View All Transactions
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AnalyticsDashboard transactions={transactions} balance={balance} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
