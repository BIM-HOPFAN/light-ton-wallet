import { Card } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'send' | 'receive';
  amount: string;
  address: string;
  timestamp: Date;
  status: 'pending' | 'completed';
}

// Mock data - replace with real transaction history
const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'receive',
    amount: '10.50',
    address: 'EQD...abc',
    timestamp: new Date(Date.now() - 3600000),
    status: 'completed'
  },
  {
    id: '2',
    type: 'send',
    amount: '5.25',
    address: 'EQD...xyz',
    timestamp: new Date(Date.now() - 7200000),
    status: 'completed'
  }
];

export default function TransactionList() {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
      
      {mockTransactions.length === 0 ? (
        <Card className="p-8 text-center">
          <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No transactions yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {mockTransactions.map((tx) => (
            <Card key={tx.id} className="p-4 hover:shadow-md transition-smooth cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    tx.type === 'receive' 
                      ? 'bg-success/10 text-success' 
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {tx.type === 'receive' ? (
                      <ArrowDownLeft className="h-5 w-5" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {tx.type === 'receive' ? 'Received' : 'Sent'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatAddress(tx.address)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    tx.type === 'receive' ? 'text-success' : 'text-foreground'
                  }`}>
                    {tx.type === 'receive' ? '+' : '-'}{tx.amount} TON
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(tx.timestamp)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
