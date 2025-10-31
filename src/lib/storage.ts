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

// Store PIN hash using PBKDF2 with salt
export async function storePINHash(pin: string): Promise<void> {
  const encoder = new TextEncoder();
  const pinData = encoder.encode(pin);
  
  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Derive key using PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    pinData,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const saltArray = Array.from(salt);
  
  // Store both hash and salt
  const stored = {
    hash: hashArray.map(b => b.toString(16).padStart(2, '0')).join(''),
    salt: saltArray.map(b => b.toString(16).padStart(2, '0')).join('')
  };
  
  localStorage.setItem(PIN_KEY, JSON.stringify(stored));
}

// Verify PIN using PBKDF2 with stored salt
export async function verifyPIN(pin: string): Promise<boolean> {
  const storedData = localStorage.getItem(PIN_KEY);
  if (!storedData) return false;
  
  try {
    const stored = JSON.parse(storedData);
    const encoder = new TextEncoder();
    const pinData = encoder.encode(pin);
    
    // Convert hex salt back to Uint8Array
    const salt = new Uint8Array(
      stored.salt.match(/.{1,2}/g).map((byte: string) => parseInt(byte, 16))
    );
    
    // Derive key using same parameters
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      pinData,
      'PBKDF2',
      false,
      ['deriveBits']
    );
    
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );
    
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex === stored.hash;
  } catch (error) {
    console.error('PIN verification error:', error);
    return false;
  }
}
