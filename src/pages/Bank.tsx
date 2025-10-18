import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, ArrowUpRight, ArrowDownLeft, RefreshCw, Wallet, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface NGNBBalance {
  balance: number;
}

interface BankingTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  ngnb_amount: number;
  status: string;
  created_at: string;
  reference: string;
}

export default function Bank() {
  const navigate = useNavigate();
  const [ngnbBalance, setNgnbBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<BankingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchBankingData();
  }, []);

  const fetchBankingData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch NGNB balance
      const { data: balanceData, error: balanceError } = await supabase
        .from('ngnb_balances')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (balanceError && balanceError.code !== 'PGRST116') throw balanceError;

      if (!balanceData) {
        // Create initial balance record
        await supabase
          .from('ngnb_balances')
          .insert({ user_id: user.id, balance: 0 });
        setNgnbBalance(0);
      } else {
        setNgnbBalance(parseFloat(balanceData.balance.toString()));
      }

      // Fetch transactions
      const { data: txData, error: txError } = await supabase
        .from('banking_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (txError) throw txError;
      setTransactions(txData || []);
    } catch (error) {
      console.error('Error fetching banking data:', error);
      toast.error('Failed to load banking data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create deposit transaction
      const reference = `DEP${Date.now()}`;
      const { error: txError } = await supabase
        .from('banking_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'deposit',
          amount: amount,
          currency: 'NGN',
          ngnb_amount: amount,
          status: 'completed',
          reference
        });

      if (txError) throw txError;

      // Update NGNB balance
      const newBalance = ngnbBalance + amount;
      const { error: balanceError } = await supabase
        .from('ngnb_balances')
        .update({ balance: newBalance })
        .eq('user_id', user.id);

      if (balanceError) throw balanceError;

      setNgnbBalance(newBalance);
      setDepositAmount('');
      setShowDeposit(false);
      toast.success(`₦${amount.toFixed(2)} deposited successfully`, {
        description: `${amount.toFixed(2)} NGNB minted`
      });
      fetchBankingData();
    } catch (error) {
      console.error('Deposit error:', error);
      toast.error('Deposit failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > ngnbBalance) {
      toast.error('Insufficient NGNB balance');
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create withdrawal transaction
      const reference = `WD${Date.now()}`;
      const { error: txError } = await supabase
        .from('banking_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'withdrawal',
          amount: amount,
          currency: 'NGN',
          ngnb_amount: amount,
          status: 'completed',
          reference
        });

      if (txError) throw txError;

      // Update NGNB balance
      const newBalance = ngnbBalance - amount;
      const { error: balanceError } = await supabase
        .from('ngnb_balances')
        .update({ balance: newBalance })
        .eq('user_id', user.id);

      if (balanceError) throw balanceError;

      setNgnbBalance(newBalance);
      setWithdrawAmount('');
      setShowWithdraw(false);
      toast.success(`₦${amount.toFixed(2)} withdrawn`, {
        description: `${amount.toFixed(2)} NGNB burned`
      });
      fetchBankingData();
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error('Withdrawal failed');
    } finally {
      setProcessing(false);
    }
  };

  const formatTransactionType = (type: string) => {
    const types: Record<string, string> = {
      deposit: 'Deposit',
      withdrawal: 'Withdrawal',
      swap: 'Swap',
      purchase: 'Purchase',
      escrow_lock: 'Escrow Lock',
      escrow_release: 'Escrow Release'
    };
    return types[type] || type;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Bimlight Bank</h1>
          </div>
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            Back to Wallet
          </Button>
        </div>

        {/* NGNB Balance Card */}
        <Card className="mb-6 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader>
            <CardDescription>Your NGNB Balance</CardDescription>
            <CardTitle className="text-4xl">₦{ngnbBalance.toFixed(2)}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              <span>{ngnbBalance.toFixed(2)} NGNB</span>
              <Badge variant="outline" className="ml-auto">1:1 Naira Peg</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => setShowDeposit(true)} className="w-full">
                <ArrowDownLeft className="h-4 w-4 mr-2" />
                Deposit
              </Button>
              <Button onClick={() => setShowWithdraw(true)} variant="outline" className="w-full">
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Withdraw
              </Button>
            </div>
            <Button variant="secondary" className="w-full" onClick={() => navigate('/swap')}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Swap NGNB to Bimcoin
            </Button>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">What is NGNB?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              NGNB is a 1:1 Naira-pegged stablecoin. Deposit Naira to mint NGNB, use it to buy Bimcoin for shopping.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">How to Use</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Deposit → Get NGNB → Swap to Bimcoin → Shop with Escrow Protection → Sellers swap back to NGNB → Withdraw to bank
            </CardContent>
          </Card>
        </div>

        {/* Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded hover:bg-muted transition-colors">
                    <div>
                      <div className="font-medium">{formatTransactionType(tx.transaction_type)}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()} • {tx.reference}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${
                        tx.transaction_type === 'deposit' ? 'text-green-600' : 
                        tx.transaction_type === 'withdrawal' ? 'text-red-600' : 
                        'text-foreground'
                      }`}>
                        {tx.transaction_type === 'deposit' ? '+' : '-'}₦{tx.amount.toFixed(2)}
                      </div>
                      <Badge variant={tx.status === 'completed' ? 'secondary' : 'outline'} className="text-xs">
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Deposit Dialog */}
      <Dialog open={showDeposit} onOpenChange={setShowDeposit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deposit Naira</DialogTitle>
            <DialogDescription>
              Deposit Naira to mint NGNB tokens
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="depositAmount">Amount (₦)</Label>
              <Input
                id="depositAmount"
                type="number"
                placeholder="0.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="text-lg"
              />
            </div>
            {depositAmount && parseFloat(depositAmount) > 0 && (
              <div className="bg-primary/10 p-3 rounded text-sm">
                You will receive: <span className="font-bold">{parseFloat(depositAmount).toFixed(2)} NGNB</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeposit(false)}>Cancel</Button>
            <Button onClick={handleDeposit} disabled={processing}>
              {processing ? 'Processing...' : 'Deposit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw to Bank</DialogTitle>
            <DialogDescription>
              Burn NGNB to withdraw Naira to your bank account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="withdrawAmount">Amount (₦)</Label>
              <Input
                id="withdrawAmount"
                type="number"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="text-lg"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Available: ₦{ngnbBalance.toFixed(2)}
              </p>
            </div>
            {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
              <div className="bg-primary/10 p-3 rounded text-sm">
                {parseFloat(withdrawAmount).toFixed(2)} NGNB will be burned
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdraw(false)}>Cancel</Button>
            <Button onClick={handleWithdraw} disabled={processing}>
              {processing ? 'Processing...' : 'Withdraw'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}