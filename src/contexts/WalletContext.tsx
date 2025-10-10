import React, { createContext, useContext, useState, useEffect } from 'react';
import { WalletData } from '@/lib/crypto';
import { hasWallet, getActiveWallet, StoredWallet } from '@/lib/storage';

interface WalletContextType {
  wallet: WalletData | null;
  setWallet: (wallet: WalletData | null) => void;
  activeWalletId: string | null;
  setActiveWalletId: (id: string | null) => void;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  balance: string;
  setBalance: (balance: string) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [activeWalletId, setActiveWalletId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(true);
  const [balance, setBalance] = useState('0.00');
  
  useEffect(() => {
    // Check if wallet exists on mount
    if (hasWallet() && !wallet) {
      setIsLocked(true);
      const active = getActiveWallet();
      if (active) {
        setActiveWalletId(active.id);
      }
    } else if (!hasWallet()) {
      setIsLocked(false);
    }
  }, [wallet]);
  
  return (
    <WalletContext.Provider value={{ wallet, setWallet, activeWalletId, setActiveWalletId, isLocked, setIsLocked, balance, setBalance }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}
