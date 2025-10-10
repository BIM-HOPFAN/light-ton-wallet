import { EncryptedWallet } from './crypto';

const WALLETS_KEY = 'light_wallets_encrypted';
const ACTIVE_WALLET_KEY = 'light_active_wallet_id';
const PIN_KEY = 'light_wallet_pin_hash';

export interface StoredWallet {
  id: string;
  name: string;
  address: string;
  encrypted: EncryptedWallet;
  createdAt: number;
}

// Store multiple wallets
export function storeWallet(wallet: StoredWallet): void {
  const wallets = getAllWallets();
  const existingIndex = wallets.findIndex(w => w.id === wallet.id);
  
  if (existingIndex >= 0) {
    wallets[existingIndex] = wallet;
  } else {
    wallets.push(wallet);
  }
  
  localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets));
  
  // Set as active if it's the first wallet
  if (wallets.length === 1) {
    setActiveWallet(wallet.id);
  }
}

// Get all wallets
export function getAllWallets(): StoredWallet[] {
  const data = localStorage.getItem(WALLETS_KEY);
  return data ? JSON.parse(data) : [];
}

// Get wallet by ID
export function getWalletById(id: string): StoredWallet | null {
  const wallets = getAllWallets();
  return wallets.find(w => w.id === id) || null;
}

// Get active wallet
export function getActiveWallet(): StoredWallet | null {
  const activeId = localStorage.getItem(ACTIVE_WALLET_KEY);
  if (!activeId) return null;
  return getWalletById(activeId);
}

// Set active wallet
export function setActiveWallet(id: string): void {
  localStorage.setItem(ACTIVE_WALLET_KEY, id);
}

// Delete wallet by ID
export function deleteWalletById(id: string): void {
  const wallets = getAllWallets();
  const filtered = wallets.filter(w => w.id !== id);
  localStorage.setItem(WALLETS_KEY, JSON.stringify(filtered));
  
  // If deleted wallet was active, set first wallet as active
  const activeId = localStorage.getItem(ACTIVE_WALLET_KEY);
  if (activeId === id && filtered.length > 0) {
    setActiveWallet(filtered[0].id);
  } else if (filtered.length === 0) {
    localStorage.removeItem(ACTIVE_WALLET_KEY);
    localStorage.removeItem(PIN_KEY);
  }
}

// Delete all wallets
export function deleteAllWallets(): void {
  localStorage.removeItem(WALLETS_KEY);
  localStorage.removeItem(ACTIVE_WALLET_KEY);
  localStorage.removeItem(PIN_KEY);
}

// Check if any wallet exists
export function hasWallet(): boolean {
  return getAllWallets().length > 0;
}

// Legacy: Store encrypted wallet (for backward compatibility)
export function storeEncryptedWallet(encrypted: EncryptedWallet, address: string): void {
  const wallet: StoredWallet = {
    id: crypto.randomUUID(),
    name: 'Main Wallet',
    address,
    encrypted,
    createdAt: Date.now()
  };
  storeWallet(wallet);
}

// Legacy: Retrieve encrypted wallet (for backward compatibility)
export function getEncryptedWallet(): EncryptedWallet | null {
  const activeWallet = getActiveWallet();
  return activeWallet ? activeWallet.encrypted : null;
}

// Legacy: Delete wallet (for backward compatibility)
export function deleteWallet(): void {
  deleteAllWallets();
}

// Store PIN hash (simple hash for demo - use stronger KDF in production)
export async function storePINHash(pin: string): Promise<void> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  localStorage.setItem(PIN_KEY, hashHex);
}

// Verify PIN
export async function verifyPIN(pin: string): Promise<boolean> {
  const storedHash = localStorage.getItem(PIN_KEY);
  if (!storedHash) return false;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex === storedHash;
}
