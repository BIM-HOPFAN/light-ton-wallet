import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WalletProvider } from "./contexts/WalletContext";
import Onboarding from "./pages/Onboarding";
import CreateWallet from "./pages/CreateWallet";
import RestoreWallet from "./pages/RestoreWallet";
import Unlock from "./pages/Unlock";
import Dashboard from "./pages/Dashboard";
import Send from "./pages/Send";
import Receive from "./pages/Receive";
import Settings from "./pages/Settings";
import WalletManager from "./pages/WalletManager";
import AddWallet from "./pages/AddWallet";
import ImportWallet from "./pages/ImportWallet";
import ScanConnect from "./pages/ScanConnect";
import ConnectedApps from "./pages/ConnectedApps";
import NotFound from "./pages/NotFound";
import { hasWallet } from "./lib/storage";

const queryClient = new QueryClient();

const App = () => {
  const walletExists = hasWallet();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WalletProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={walletExists ? <Navigate to="/unlock" /> : <Onboarding />} />
              <Route path="/create" element={<CreateWallet />} />
              <Route path="/restore" element={<RestoreWallet />} />
              <Route path="/unlock" element={<Unlock />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/send" element={<Send />} />
              <Route path="/receive" element={<Receive />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/wallet-manager" element={<WalletManager />} />
              <Route path="/wallet-manager/create" element={<AddWallet />} />
              <Route path="/wallet-manager/import" element={<ImportWallet />} />
              <Route path="/scan-connect" element={<ScanConnect />} />
              <Route path="/connected-apps" element={<ConnectedApps />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </WalletProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
