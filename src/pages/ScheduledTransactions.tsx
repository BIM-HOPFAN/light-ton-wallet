import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar, Clock, Send, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ScheduledTransaction {
  id: string;
  to: string;
  toName?: string;
  amount: string;
  token: string;
  scheduleType: 'once' | 'recurring';
  scheduledDate: number;
  frequency?: 'daily' | 'weekly' | 'monthly';
  lastExecuted?: number;
  nextExecution: number;
  status: 'pending' | 'active' | 'paused' | 'completed';
  createdAt: number;
}

export default function ScheduledTransactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<ScheduledTransaction[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  
  // Form state
  const [recipient, setRecipient] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState('TON');
  const [scheduleType, setScheduleType] = useState<'once' | 'recurring'>('once');
  const [scheduledDate, setScheduledDate] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  useEffect(() => {
    loadScheduledTransactions();
    const interval = setInterval(checkPendingTransactions, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const loadScheduledTransactions = () => {
    const stored = localStorage.getItem('scheduled_transactions');
    if (stored) {
      setTransactions(JSON.parse(stored));
    }
  };

  const saveTransactions = (txs: ScheduledTransaction[]) => {
    localStorage.setItem('scheduled_transactions', JSON.stringify(txs));
    setTransactions(txs);
  };

  const checkPendingTransactions = () => {
    const now = Date.now();
    const updated = transactions.map((tx) => {
      if (tx.status === 'active' && now >= tx.nextExecution) {
        // Execute transaction
        console.log('Executing scheduled transaction:', tx);
        
        if (tx.scheduleType === 'once') {
          return { ...tx, status: 'completed' as const, lastExecuted: now };
        } else {
          // Calculate next execution
          let nextExec = tx.nextExecution;
          switch (tx.frequency) {
            case 'daily':
              nextExec += 24 * 60 * 60 * 1000;
              break;
            case 'weekly':
              nextExec += 7 * 24 * 60 * 60 * 1000;
              break;
            case 'monthly':
              nextExec += 30 * 24 * 60 * 60 * 1000;
              break;
          }
          return { ...tx, lastExecuted: now, nextExecution: nextExec };
        }
      }
      return tx;
    });
    
    if (JSON.stringify(updated) !== JSON.stringify(transactions)) {
      saveTransactions(updated);
    }
  };

  const handleCreateSchedule = () => {
    if (!recipient || !amount || !scheduledDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const scheduleTimestamp = new Date(scheduledDate).getTime();
    if (scheduleTimestamp <= Date.now()) {
      toast.error('Schedule date must be in the future');
      return;
    }

    const newTransaction: ScheduledTransaction = {
      id: Date.now().toString(),
      to: recipient,
      toName: recipientName,
      amount,
      token,
      scheduleType,
      scheduledDate: scheduleTimestamp,
      frequency: scheduleType === 'recurring' ? frequency : undefined,
      nextExecution: scheduleTimestamp,
      status: 'active',
      createdAt: Date.now(),
    };

    saveTransactions([...transactions, newTransaction]);
    
    // Reset form
    setRecipient('');
    setRecipientName('');
    setAmount('');
    setScheduledDate('');
    setShowCreate(false);
    
    toast.success('Transaction scheduled', {
      description: `Will execute on ${new Date(scheduleTimestamp).toLocaleDateString()}`,
    });
  };

  const handleDelete = (id: string) => {
    saveTransactions(transactions.filter((tx) => tx.id !== id));
    toast.success('Scheduled transaction deleted');
  };

  const handlePauseResume = (id: string) => {
    const updated = transactions.map((tx) =>
      tx.id === id
        ? { ...tx, status: tx.status === 'active' ? ('paused' as const) : ('active' as const) }
        : tx
    );
    saveTransactions(updated);
    toast.success(
      updated.find((tx) => tx.id === id)?.status === 'paused'
        ? 'Transaction paused'
        : 'Transaction resumed'
    );
  };

  const getStatusColor = (status: ScheduledTransaction['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  const formatNextExecution = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = timestamp - now.getTime();
    
    if (diff < 0) return 'Overdue';
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `In ${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">Scheduled Transactions</h1>
                <p className="text-muted-foreground mt-1">
                  Set up automatic or recurring payments
                </p>
              </div>
            </div>
            <Button onClick={() => setShowCreate(!showCreate)}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Transaction
            </Button>
          </div>

          {showCreate && (
            <Card>
              <CardHeader>
                <CardTitle>Schedule New Transaction</CardTitle>
                <CardDescription>
                  Create a one-time or recurring payment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient Address</Label>
                    <Input
                      id="recipient"
                      placeholder="Enter TON address"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipientName">Recipient Name (Optional)</Label>
                    <Input
                      id="recipientName"
                      placeholder="e.g., John Doe"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="token">Token</Label>
                    <Select value={token} onValueChange={setToken}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TON">TON</SelectItem>
                        <SelectItem value="NGNB">NGNB</SelectItem>
                        <SelectItem value="BIM">Bimcoin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Schedule Type</Label>
                  <Select
                    value={scheduleType}
                    onValueChange={(v: 'once' | 'recurring') => setScheduleType(v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">One-time</SelectItem>
                      <SelectItem value="recurring">Recurring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {scheduleType === 'recurring' && (
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select
                      value={frequency}
                      onValueChange={(v: 'daily' | 'weekly' | 'monthly') => setFrequency(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="date">
                    {scheduleType === 'once' ? 'Execution Date' : 'First Execution Date'}
                  </Label>
                  <Input
                    id="date"
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleCreateSchedule}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Create Schedule
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreate(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {transactions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">No scheduled transactions</p>
                  <Button onClick={() => setShowCreate(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Your First Transaction
                  </Button>
                </CardContent>
              </Card>
            ) : (
              transactions.map((tx) => (
                <Card key={tx.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Send className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {tx.amount} {tx.token}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          To: {tx.toName || tx.to.slice(0, 12) + '...'}
                        </div>
                        {tx.scheduleType === 'recurring' && (
                          <Badge variant="outline" className="mt-2">
                            {tx.frequency}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(tx.status)}>{tx.status}</Badge>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Next execution:</span>
                        <span className="font-medium">
                          {formatNextExecution(tx.nextExecution)}
                        </span>
                      </div>
                      {tx.lastExecuted && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last executed:</span>
                          <span>{new Date(tx.lastExecuted).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePauseResume(tx.id)}
                        disabled={tx.status === 'completed'}
                      >
                        {tx.status === 'active' ? 'Pause' : 'Resume'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(tx.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
