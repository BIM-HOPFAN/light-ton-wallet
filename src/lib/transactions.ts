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

const STORAGE_KEY = 'wallet_transactions';

export function getTransactions(): Transaction[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  
  try {
    const parsed = JSON.parse(stored);
    // Convert timestamp strings back to Date objects
    return parsed.map((tx: any) => ({
      ...tx,
      timestamp: new Date(tx.timestamp)
    }));
  } catch {
    return [];
  }
}

export function addTransaction(transaction: Omit<Transaction, 'id' | 'timestamp'>): Transaction {
  const transactions = getTransactions();
  const newTransaction: Transaction = {
    ...transaction,
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date()
  };
  
  transactions.unshift(newTransaction); // Add to beginning
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  
  return newTransaction;
}

export function updateTransactionStatus(
  id: string, 
  status: Transaction['status'],
  txHash?: string
): void {
  const transactions = getTransactions();
  const index = transactions.findIndex(tx => tx.id === id);
  
  if (index !== -1) {
    transactions[index].status = status;
    if (txHash) transactions[index].txHash = txHash;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }
}

export function clearTransactions(): void {
  localStorage.removeItem(STORAGE_KEY);
}
