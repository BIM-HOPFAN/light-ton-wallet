import { supabase } from '@/integrations/supabase/client';
import { blockchainService } from '@/lib/blockchain';
import { Address } from '@ton/ton';

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

// Get transactions from blockchain
export async function getBlockchainTransactions(walletAddress: string): Promise<Transaction[]> {
  try {
    console.log('Fetching blockchain transactions for:', walletAddress);
    const rawTxs = await blockchainService.getTransactions(walletAddress, 50);
    console.log('Raw blockchain transactions:', rawTxs.length);
    
    const myAddress = Address.parse(walletAddress);
    
    const transactions = rawTxs.map((tx: any) => {
      // Determine if this is a send or receive transaction
      const inMsg = tx.inMessage;
      const outMsgs = tx.outMessages;
      
      let type: 'send' | 'receive' = 'receive';
      let amount = '0';
      let otherAddress = '';
      let fee = '0';
      
      // Check incoming message (receives)
      if (inMsg && inMsg.value) {
        const value = Number(inMsg.value) / 1e9;
        if (value > 0) {
          type = 'receive';
          amount = value.toFixed(6);
          otherAddress = inMsg.source?.toString() || '';
        }
      }
      
      // Check outgoing messages (sends)
      if (outMsgs && outMsgs.length > 0) {
        const outMsg = outMsgs[0];
        if (outMsg.value) {
          const value = Number(outMsg.value) / 1e9;
          if (value > 0) {
            type = 'send';
            amount = value.toFixed(6);
            otherAddress = outMsg.destination?.toString() || '';
          }
        }
      }

      // Calculate fees
      if (tx.totalFees) {
        fee = (Number(tx.totalFees) / 1e9).toFixed(6);
      }

      return {
        id: tx.hash().toString('hex'),
        type,
        amount,
        token: 'TON',
        network: blockchainService.getNetwork(),
        address: otherAddress,
        timestamp: new Date(tx.now * 1000),
        status: 'completed' as const,
        txHash: tx.hash().toString('hex'),
        fee,
      };
    }).filter(tx => parseFloat(tx.amount) > 0); // Filter out zero-value transactions
    
    console.log('Processed blockchain transactions:', transactions.length);
    return transactions;
  } catch (error) {
    console.error('Error fetching blockchain transactions:', error);
    return [];
  }
}

// Get transactions from Supabase (for app-specific data)
export async function getTransactions(userId: string, walletAddress: string): Promise<Transaction[]> {
  // Skip database query if userId is empty to avoid UUID errors
  if (!userId || userId.trim() === '') {
    console.log('Skipping database transactions - no user ID');
    return [];
  }

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

// Combined: Get all transactions (blockchain + database)
export async function getAllTransactions(userId: string, walletAddress: string): Promise<Transaction[]> {
  console.log('Fetching all transactions for:', { userId: userId || 'none', walletAddress });
  
  // Always fetch blockchain transactions (these are the real source of truth)
  const blockchainTxs = await getBlockchainTransactions(walletAddress);
  console.log('Blockchain transactions fetched:', blockchainTxs.length);
  
  // Only fetch database transactions if user is authenticated
  let dbTxs: Transaction[] = [];
  if (userId && userId.trim() !== '') {
    dbTxs = await getTransactions(userId, walletAddress);
    console.log('Database transactions fetched:', dbTxs.length);
  }

  // Merge and deduplicate by txHash
  const txMap = new Map<string, Transaction>();
  
  // Add blockchain transactions first (source of truth)
  blockchainTxs.forEach(tx => {
    if (tx.txHash) {
      txMap.set(tx.txHash, tx);
    }
  });
  
  // Add database transactions that aren't already in the map (for pending transactions)
  dbTxs.forEach(tx => {
    if (tx.txHash && !txMap.has(tx.txHash)) {
      txMap.set(tx.txHash, tx);
    } else if (!tx.txHash) {
      // Pending transactions without hash
      txMap.set(tx.id, tx);
    }
  });

  const allTxs = Array.from(txMap.values()).sort((a, b) => 
    b.timestamp.getTime() - a.timestamp.getTime()
  );
  
  console.log('Total transactions after merge:', allTxs.length);
  return allTxs;
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
      tx_hash: transaction.txHash || 'pending',
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
