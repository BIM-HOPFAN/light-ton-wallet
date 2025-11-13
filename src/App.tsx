import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WalletProvider } from "./contexts/WalletContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Onboarding from "./pages/Onboarding";
import CreateWallet from "./pages/CreateWallet";
import RestoreWallet from "./pages/RestoreWallet";
import Unlock from "./pages/Unlock";
import Dashboard from "./pages/Dashboard";
import Send from "./pages/Send";
import Receive from "./pages/Receive";
import Tokens from "./pages/Tokens";
import Settings from "./pages/Settings";
import WalletManager from "./pages/WalletManager";
import AddWallet from "./pages/AddWallet";
import ImportWallet from "./pages/ImportWallet";
import ScanConnect from "./pages/ScanConnect";
import ConnectedApps from "./pages/ConnectedApps";
import Install from "./pages/Install";
import TransactionDetail from "./pages/TransactionDetail";
import TransactionHistory from "./pages/TransactionHistory";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import SellerDashboard from "./pages/SellerDashboard";
import Bank from "./pages/Bank";
import MyOrders from "./pages/MyOrders";
import Swap from "./pages/Swap";
import NGNBSwap from "./pages/NGNBSwap";
import BimcoinSwap from "./pages/BimcoinSwap";
import AdminKYC from "./pages/AdminKYC";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import SocialRecovery from "./pages/SocialRecovery";
import Staking from "./pages/Staking";
import ScheduledTransactions from "./pages/ScheduledTransactions";
import { hasWallet } from "./lib/storage";

const queryClient = new QueryClient();

const App = () => {
  const walletExists = hasWallet();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WalletProvider>
            <BrowserRouter>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Auth route - optional for wallet, required for bank/shop */}
                <Route path="/auth" element={<Auth />} />
                
                {/* Wallet-first flow - no auth required */}
                <Route path="/" element={walletExists ? <Navigate to="/unlock" /> : <Onboarding />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/create" element={<CreateWallet />} />
                <Route path="/restore" element={<RestoreWallet />} />
                <Route path="/unlock" element={<Unlock />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/send" element={<Send />} />
                <Route path="/receive" element={<Receive />} />
                <Route path="/tokens" element={<Tokens />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/wallet-manager" element={<WalletManager />} />
                <Route path="/wallet-manager/create" element={<AddWallet />} />
                <Route path="/wallet-manager/import" element={<ImportWallet />} />
                <Route path="/scan-connect" element={<ScanConnect />} />
                <Route path="/connected-apps" element={<ConnectedApps />} />
                <Route path="/install" element={<Install />} />
                <Route path="/transaction/:txHash" element={<TransactionDetail />} />
                <Route path="/transactions" element={<TransactionHistory />} />
                
                {/* Backend features - auth required (handled in components) */}
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/seller-dashboard" element={<SellerDashboard />} />
                <Route path="/bank" element={<Bank />} />
                <Route path="/my-orders" element={<MyOrders />} />
                <Route path="/swap" element={<Swap />} />
                <Route path="/ngnb-swap" element={<NGNBSwap />} />
                <Route path="/bimcoin-swap" element={<BimcoinSwap />} />
                <Route path="/admin/kyc" element={<AdminKYC />} />
                
                {/* New Features */}
                <Route path="/social-recovery" element={<SocialRecovery />} />
                <Route path="/staking" element={<Staking />} />
                <Route path="/scheduled" element={<ScheduledTransactions />} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </WalletProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
