import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Search, ExternalLink, Filter, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { getAllTransactions, Transaction } from '@/lib/transactions';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function TransactionHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wallet } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'send' | 'receive'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');

  useEffect(() => {
    if (user && wallet) {
      loadTransactions();
    }
  }, [user, wallet]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchQuery, filterType, filterStatus]);

  const loadTransactions = async () => {
    if (!user || !wallet) return;
    
    setLoading(true);
    try {
      const txs = await getAllTransactions(user.id, wallet.address);
      // Sort by timestamp descending (newest first)
      const sorted = txs.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setTransactions(sorted);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(tx => tx.type === filterType);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(tx => tx.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.address?.toLowerCase().includes(query) ||
        tx.txHash?.toLowerCase().includes(query) ||
        tx.token.toLowerCase().includes(query) ||
        tx.memo?.toLowerCase().includes(query)
      );
    }

    setFilteredTransactions(filtered);
  };

  const getStatusBadge = (status: Transaction['status']) => {
    const variants = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  const formatAddress = (address: string) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const openExplorer = (txHash: string) => {
    // TON Explorer link
    window.open(`https://tonscan.org/tx/${txHash}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Transaction History</h1>
          <p className="text-muted-foreground">
            View all your past transactions
          </p>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by address, hash, token..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="send">Send</SelectItem>
                <SelectItem value="receive">Receive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Transaction List */}
        <div className="space-y-4">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
              </Card>
            ))
          ) : filteredTransactions.length === 0 ? (
            <Card className="p-12 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || filterType !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Your transactions will appear here'}
              </p>
              {(searchQuery || filterType !== 'all' || filterStatus !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                    setFilterStatus('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </Card>
          ) : (
            filteredTransactions.map((tx) => (
              <Card 
                key={tx.id} 
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/transaction/${tx.id}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Icon */}
                    <div className={`
                      h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0
                      ${tx.type === 'send' 
                        ? 'bg-destructive/10 text-destructive' 
                        : 'bg-success/10 text-success'}
                    `}>
                      {tx.type === 'send' ? (
                        <ArrowUpRight className="h-5 w-5" />
                      ) : (
                        <ArrowDownLeft className="h-5 w-5" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold capitalize">
                          {tx.type === 'send' ? 'Sent' : 'Received'}
                        </h3>
                        {getStatusBadge(tx.status)}
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <span>
                            {tx.type === 'send' ? 'To:' : 'From:'}
                          </span>
                          <span className="font-mono">{formatAddress(tx.address)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(tx.timestamp), 'MMM dd, yyyy HH:mm')}</span>
                        </div>

                        {tx.memo && (
                          <div className="text-xs italic">
                            Memo: {tx.memo}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount and Actions */}
                  <div className="text-right flex-shrink-0">
                    <div className={`
                      text-lg font-bold mb-1
                      ${tx.type === 'send' ? 'text-destructive' : 'text-success'}
                    `}>
                      {tx.type === 'send' ? '-' : '+'}{tx.amount} {tx.token}
                    </div>
                    {tx.txHash && tx.status === 'completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openExplorer(tx.txHash!);
                        }}
                        className="text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Explorer
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Summary */}
        {!loading && filteredTransactions.length > 0 && (
          <Card className="p-4 mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Showing {filteredTransactions.length} of {transactions.length} transactions
              </span>
              {filteredTransactions.length !== transactions.length && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                    setFilterStatus('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
