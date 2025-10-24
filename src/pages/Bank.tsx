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
import { Building2, ArrowUpRight, ArrowDownLeft, RefreshCw, Wallet, ShieldCheck, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProtectedFeature } from '@/components/ProtectedFeature';
import { useAuth } from '@/contexts/AuthContext';

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

interface VirtualAccount {
  id: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  bank_code: string;
}

export default function Bank() {
  return (
    <ProtectedFeature featureName="Bimlight Bank">
      <BankContent />
    </ProtectedFeature>
  );
}

function BankContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ngnbBalance, setNgnbBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<BankingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [recipientBank, setRecipientBank] = useState('');
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [virtualAccount, setVirtualAccount] = useState<VirtualAccount | null>(null);

  useEffect(() => {
    fetchBankingData();
    fetchVirtualAccount();
  }, []);

  const fetchVirtualAccount = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('monnify', {
        body: { action: 'get_virtual_account' }
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        setVirtualAccount(data.data);
      } else {
        // Create virtual account if it doesn't exist
        await createVirtualAccount();
      }
    } catch (error) {
      console.error('Error fetching virtual account:', error);
    }
  };

  const createVirtualAccount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const accountName = `Bimlight - ${user.email?.split('@')[0] || 'User'}`;
      
      const { data, error } = await supabase.functions.invoke('monnify', {
        body: { 
          action: 'create_virtual_account',
          accountName 
        }
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        setVirtualAccount(data.data);
        toast.success('Virtual account created successfully');
      }
    } catch (error) {
      console.error('Error creating virtual account:', error);
      toast.error('Failed to create virtual account');
    }
  };

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

  const handleDeposit = () => {
    // Show account details for deposit
    setShowAccountDetails(true);
    setShowDeposit(false);
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

    if (!recipientAccount || !recipientBank) {
      toast.error('Please enter recipient account details');
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('monnify', {
        body: { 
          action: 'initiate_transfer',
          amount,
          recipientAccountNumber: recipientAccount,
          recipientBankCode: recipientBank,
          narration: 'Transfer from Bimlight'
        }
      });

      if (error) throw error;

      if (data?.success) {
        setNgnbBalance(prev => prev - amount);
        setWithdrawAmount('');
        setRecipientAccount('');
        setRecipientBank('');
        setShowWithdraw(false);
        toast.success(`₦${amount.toFixed(2)} withdrawn successfully`, {
          description: `${amount.toFixed(2)} NGNB burned`
        });
        fetchBankingData();
      } else {
        throw new Error(data?.error || 'Transfer failed');
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Withdrawal failed';
      toast.error(errorMessage);
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
            {virtualAccount && (
              <div className="bg-background/50 p-3 rounded-lg mb-2 text-sm">
                <div className="font-medium mb-1">Your Account</div>
                <div className="text-muted-foreground">
                  {virtualAccount.account_number} • {virtualAccount.bank_name}
                </div>
              </div>
            )}
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
            <div className="space-y-2">
              <Button variant="secondary" className="w-full" onClick={() => navigate('/swap')}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Swap NGNB to Bimcoin
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" className="w-full" onClick={() => navigate('/ngnb-swap')}>
                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                  NGNB Bank ⇄ Wallet
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => navigate('/bimcoin-swap')}>
                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                  Bimcoin Bank ⇄ Wallet
                </Button>
              </div>
            </div>
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
            <DialogTitle>Deposit Options</DialogTitle>
            <DialogDescription>
              Choose how you want to deposit funds
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start h-auto p-4"
              onClick={handleDeposit}
            >
              <div className="text-left">
                <div className="font-medium">Bank Transfer (Naira)</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Transfer from any Nigerian bank
                </div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start h-auto p-4"
              onClick={() => toast.info('USD deposit coming soon')}
            >
              <div className="text-left">
                <div className="font-medium">USD Deposit</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Deposit USD and convert to NGNB
                </div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start h-auto p-4"
              onClick={() => toast.info('Crypto deposit coming soon')}
            >
              <div className="text-left">
                <div className="font-medium">Crypto Deposit</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Deposit crypto and swap to NGNB
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Account Details Dialog */}
      <Dialog open={showAccountDetails} onOpenChange={setShowAccountDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your Virtual Account</DialogTitle>
            <DialogDescription>
              Transfer to this account to fund your Bimlight wallet
            </DialogDescription>
          </DialogHeader>
          {virtualAccount ? (
            <div className="space-y-4">
              <div className="bg-primary/10 p-4 rounded-lg space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Account Number</Label>
                  <div className="text-2xl font-bold">{virtualAccount.account_number}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Account Name</Label>
                  <div className="font-medium">{virtualAccount.account_name}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Bank Name</Label>
                  <div className="font-medium">{virtualAccount.bank_name}</div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Transfer any amount from your bank app. Your NGNB will be credited automatically within seconds.
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading account details...</p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowAccountDetails(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw to Bank</DialogTitle>
            <DialogDescription>
              Burn NGNB to withdraw Naira to any Nigerian bank account
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
            <div>
              <Label htmlFor="recipientAccount">Recipient Account Number</Label>
              <Input
                id="recipientAccount"
                type="text"
                placeholder="0123456789"
                value={recipientAccount}
                onChange={(e) => setRecipientAccount(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="recipientBank">Recipient Bank Code</Label>
              <Input
                id="recipientBank"
                type="text"
                placeholder="e.g., 058 for GTBank"
                value={recipientBank}
                onChange={(e) => setRecipientBank(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Common codes: GTB=058, Access=044, Zenith=057, First=011, UBA=033
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