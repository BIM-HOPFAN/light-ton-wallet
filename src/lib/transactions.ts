import { supabase } from '@/integrations/supabase/client';

export interface Transaction {
  id: string;
  type: 'send' | 'receive';
  amount: string;
  token: string;
  network: string;
  address: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
  txHash?: string;
  memo?: string;
}

// Migration helper: Get transactions from localStorage for migration
export function getLegacyTransactions(): Transaction[] {
  const STORAGE_KEY = 'wallet_transactions';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  
  try {
    const parsed = JSON.parse(stored);
    return parsed.map((tx: any) => ({
      ...tx,
      timestamp: new Date(tx.timestamp)
    }));
  } catch {
    return [];
  }
}

// Get transactions from Supabase
export async function getTransactions(userId: string, walletAddress: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transaction_history')
    .select('*')
    .eq('user_id', userId)
    .eq('wallet_address', walletAddress)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  return data.map(tx => ({
    id: tx.id,
    type: tx.type as 'send' | 'receive',
    amount: tx.amount,
    token: tx.token,
    network: tx.network,
    address: tx.type === 'send' ? tx.recipient_address || '' : tx.sender_address || '',
    timestamp: new Date(tx.timestamp),
    status: tx.status as 'pending' | 'completed' | 'failed',
    txHash: tx.tx_hash || undefined,
    memo: tx.memo || undefined,
  }));
}

// Add transaction to Supabase
export async function addTransaction(
  userId: string,
  walletAddress: string,
  transaction: Omit<Transaction, 'id' | 'timestamp'>
): Promise<Transaction | null> {
  const { data, error } = await supabase
    .from('transaction_history')
    .insert({
      user_id: userId,
      wallet_address: walletAddress,
      type: transaction.type,
      amount: transaction.amount,
      token: transaction.token,
      network: transaction.network,
      sender_address: transaction.type === 'receive' ? transaction.address : walletAddress,
      recipient_address: transaction.type === 'send' ? transaction.address : walletAddress,
      status: transaction.status,
      tx_hash: transaction.txHash,
      memo: transaction.memo,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding transaction:', error);
    return null;
  }

  return {
    id: data.id,
    type: transaction.type,
    amount: transaction.amount,
    token: transaction.token,
    network: transaction.network,
    address: transaction.address,
    timestamp: new Date(data.timestamp),
    status: transaction.status,
    txHash: transaction.txHash,
    memo: transaction.memo,
  };
}

// Update transaction status in Supabase
export async function updateTransactionStatus(
  id: string, 
  status: Transaction['status'],
  txHash?: string
): Promise<void> {
  const updates: any = { status };
  if (txHash) updates.tx_hash = txHash;

  const { error } = await supabase
    .from('transaction_history')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating transaction:', error);
  }
}

// Migrate localStorage transactions to Supabase
export async function migrateTransactionsToSupabase(
  userId: string,
  walletAddress: string
): Promise<number> {
  const legacyTxs = getLegacyTransactions();
  if (legacyTxs.length === 0) return 0;

  let migrated = 0;
  for (const tx of legacyTxs) {
    const result = await addTransaction(userId, walletAddress, {
      type: tx.type,
      amount: tx.amount,
      token: tx.token,
      network: tx.network,
      address: tx.address,
      status: tx.status,
      txHash: tx.txHash,
      memo: tx.memo,
    });
    if (result) migrated++;
  }

  // Clear localStorage after successful migration
  if (migrated > 0) {
    localStorage.removeItem('wallet_transactions');
  }

  return migrated;
}
