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
import AddressBook from "./pages/AddressBook";
import NFTGallery from "./pages/NFTGallery";
import TransactionDetail from "./pages/TransactionDetail";
import DAppBrowser from "./pages/DAppBrowser";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Bank from "./pages/Bank";
import MyOrders from "./pages/MyOrders";
import Swap from "./pages/Swap";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { hasWallet } from "./lib/storage";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  const walletExists = hasWallet();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!walletExists) {
    return <Navigate to="/create" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/unlock" />} />
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
      <Route path="/address-book" element={<AddressBook />} />
      <Route path="/nft-gallery" element={<NFTGallery />} />
      <Route path="/transaction/:txHash" element={<TransactionDetail />} />
      <Route path="/dapp-browser" element={<DAppBrowser />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/bank" element={<Bank />} />
      <Route path="/my-orders" element={<MyOrders />} />
      <Route path="/swap" element={<Swap />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <WalletProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="*" element={<ProtectedRoutes />} />
            </Routes>
          </BrowserRouter>
        </WalletProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
