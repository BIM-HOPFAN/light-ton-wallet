import { EncryptedWallet } from './crypto';

const WALLET_KEY = 'light_wallet_encrypted';
const PIN_KEY = 'light_wallet_pin_hash';

// Store encrypted wallet in localStorage (IndexedDB would be better for production)
export function storeEncryptedWallet(encrypted: EncryptedWallet): void {
  localStorage.setItem(WALLET_KEY, JSON.stringify(encrypted));
}

// Retrieve encrypted wallet
export function getEncryptedWallet(): EncryptedWallet | null {
  const data = localStorage.getItem(WALLET_KEY);
  return data ? JSON.parse(data) : null;
}

// Delete wallet
export function deleteWallet(): void {
  localStorage.removeItem(WALLET_KEY);
  localStorage.removeItem(PIN_KEY);
}

// Check if wallet exists
export function hasWallet(): boolean {
  return localStorage.getItem(WALLET_KEY) !== null;
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
