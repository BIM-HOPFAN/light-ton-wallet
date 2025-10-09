import * as bip39 from 'bip39';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { WalletContractV4, TonClient, Address } from '@ton/ton';

export interface WalletData {
  mnemonic: string;
  address: string;
  publicKey: string;
}

export interface EncryptedWallet {
  encryptedMnemonic: string;
  salt: string;
  iv: string;
}

// Generate new wallet with 24-word mnemonic
export async function createWallet(): Promise<WalletData> {
  const mnemonic = bip39.generateMnemonic(256); // 24 words
  const keyPair = await mnemonicToPrivateKey(mnemonic.split(' '));
  
  const wallet = WalletContractV4.create({
    workchain: 0,
    publicKey: keyPair.publicKey
  });
  
  return {
    mnemonic,
    address: wallet.address.toString({ bounceable: false }),
    publicKey: Buffer.from(keyPair.publicKey).toString('hex')
  };
}

// Restore wallet from mnemonic
export async function restoreWallet(mnemonic: string): Promise<WalletData | null> {
  if (!bip39.validateMnemonic(mnemonic)) {
    return null;
  }
  
  try {
    const keyPair = await mnemonicToPrivateKey(mnemonic.split(' '));
    const wallet = WalletContractV4.create({
      workchain: 0,
      publicKey: keyPair.publicKey
    });
    
    return {
      mnemonic,
      address: wallet.address.toString({ bounceable: false }),
      publicKey: Buffer.from(keyPair.publicKey).toString('hex')
    };
  } catch (error) {
    console.error('Failed to restore wallet:', error);
    return null;
  }
}

// Encrypt mnemonic with password using Web Crypto API
export async function encryptMnemonic(mnemonic: string, password: string): Promise<EncryptedWallet> {
  const encoder = new TextEncoder();
  const data = encoder.encode(mnemonic);
  
  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(32));
  
  // Derive key from password using PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  
  // Generate IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  return {
    encryptedMnemonic: arrayBufferToBase64(encryptedData),
    salt: arrayBufferToBase64(salt.buffer),
    iv: arrayBufferToBase64(iv.buffer)
  };
}

// Decrypt mnemonic with password
export async function decryptMnemonic(encrypted: EncryptedWallet, password: string): Promise<string | null> {
  try {
    const encoder = new TextEncoder();
    
    const salt = base64ToArrayBuffer(encrypted.salt);
    const iv = base64ToArrayBuffer(encrypted.iv);
    const encryptedData = base64ToArrayBuffer(encrypted.encryptedMnemonic);
    
    // Derive key from password
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    
    // Decrypt
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}

// Helper functions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Validate TON address
export function isValidAddress(address: string): boolean {
  try {
    Address.parse(address);
    return true;
  } catch {
    return false;
  }
}
