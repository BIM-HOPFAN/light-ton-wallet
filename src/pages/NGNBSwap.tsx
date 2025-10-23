import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowDownUp, Wallet, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@/contexts/WalletContext';
import { ProtectedFeature } from '@/components/ProtectedFeature';

const TREASURY_ADDRESS = 'UQCv2zOQoWzM8HI5jnNs8KJQngGNHfwnJ4n7DH8gT3wAt_Yk';

function NGNBSwapContent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { wallet } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const [bankBalance, setBankBalance] = useState('0.00');
  const [walletBalance, setWalletBalance] = useState('0.00');
  const [amount, setAmount] = useState('');
  const [swapDirection, setSwapDirection] = useState<'bank-to-wallet' | 'wallet-to-bank'>('bank-to-wallet');

  useEffect(() => {
    fetchBalances();
  }, []);

  const fetchBalances = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch internal NGNB balance
      const { data: balanceData } = await supabase
        .from('ngnb_balances')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (balanceData) {
        setBankBalance(balanceData.balance.toString());
      }

      // Wallet NGNB balance would come from blockchain
      // For now, set to 0 - would need TON integration
      setWalletBalance('0.00');
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  };

  const handleSwap = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount to swap',
        variant: 'destructive',
      });
      return;
    }

    if (!wallet?.address) {
      toast({
        title: 'No Wallet',
        description: 'Please unlock your wallet first',
        variant: 'destructive',
      });
      return;
    }

    const swapAmount = parseFloat(amount);
    const sourceBalance = parseFloat(swapDirection === 'bank-to-wallet' ? bankBalance : walletBalance);

    if (swapAmount > sourceBalance) {
      toast({
        title: 'Insufficient Balance',
        description: `You don't have enough NGNB to swap`,
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (swapDirection === 'bank-to-wallet') {
        // Swap internal NGNB to wallet NGNB
        // 1. Deduct from internal balance
        const newBalance = parseFloat(bankBalance) - swapAmount;
        const { error: updateError } = await supabase
          .from('ngnb_balances')
          .update({ balance: newBalance })
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        // 2. Record transaction
        await supabase.from('banking_transactions').insert([{
          user_id: user.id,
          transaction_type: 'swap_to_wallet' as const,
          amount: swapAmount,
          ngnb_amount: swapAmount,
          currency: 'NGNB',
          status: 'pending',
          metadata: {
            wallet_address: wallet.address,
            treasury_address: TREASURY_ADDRESS,
            direction: 'bank_to_wallet'
          }
        }]);

        toast({
          title: 'Swap Initiated',
          description: `Swapping ${swapAmount} NGNB to your wallet. Treasury will send tokens to ${wallet.address.slice(0, 8)}...`,
        });
      } else {
        // Swap wallet NGNB to internal NGNB
        // Note: This requires user to send tokens to treasury first
        // Then we credit their internal balance
        
        toast({
          title: 'Send NGNB Tokens',
          description: `Please send ${swapAmount} NGNB tokens to treasury: ${TREASURY_ADDRESS.slice(0, 8)}... then confirm`,
        });

        // For now, just show the instruction
        // In production, you'd verify the blockchain transaction first
        return;
      }

      setAmount('');
      await fetchBalances();
    } catch (error) {
      console.error('Swap error:', error);
      toast({
        title: 'Swap Failed',
        description: 'Failed to process swap. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleDirection = () => {
    setSwapDirection(prev => 
      prev === 'bank-to-wallet' ? 'wallet-to-bank' : 'bank-to-wallet'
    );
    setAmount('');
  };

  const sourceBalance = swapDirection === 'bank-to-wallet' ? bankBalance : walletBalance;
  const destinationBalance = swapDirection === 'bank-to-wallet' ? walletBalance : bankBalance;

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          ← Back
        </Button>
        <h1 className="text-2xl font-bold">NGNB Swap</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Swap NGNB</CardTitle>
          <CardDescription>
            Convert between Bank NGNB and Wallet NGNB tokens (1:1 ratio)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Source */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                {swapDirection === 'bank-to-wallet' ? (
                  <>
                    <Building2 className="h-4 w-4" />
                    From Bank
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4" />
                    From Wallet
                  </>
                )}
              </Label>
              <span className="text-sm text-muted-foreground">
                Balance: ₦{sourceBalance}
              </span>
            </div>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isProcessing}
            />
          </div>

          {/* Swap Direction Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleDirection}
              disabled={isProcessing}
            >
              <ArrowDownUp className="h-4 w-4" />
            </Button>
          </div>

          {/* Destination */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                {swapDirection === 'bank-to-wallet' ? (
                  <>
                    <Wallet className="h-4 w-4" />
                    To Wallet
                  </>
                ) : (
                  <>
                    <Building2 className="h-4 w-4" />
                    To Bank
                  </>
                )}
              </Label>
              <span className="text-sm text-muted-foreground">
                Balance: ₦{destinationBalance}
              </span>
            </div>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Info */}
          <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Exchange Rate</span>
              <span className="font-medium">1:1</span>
            </div>
            {swapDirection === 'bank-to-wallet' && (
              <p className="text-xs text-muted-foreground">
                Treasury will send NGNB tokens to your wallet address
              </p>
            )}
            {swapDirection === 'wallet-to-bank' && (
              <p className="text-xs text-muted-foreground">
                Send NGNB tokens to treasury: {TREASURY_ADDRESS.slice(0, 20)}...
              </p>
            )}
          </div>

          <Button
            className="w-full"
            onClick={handleSwap}
            disabled={isProcessing || !amount || parseFloat(amount) <= 0}
          >
            {isProcessing ? 'Processing...' : `Swap ${amount || '0'} NGNB`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NGNBSwap() {
  return (
    <ProtectedFeature featureName="Bimlight Bank">
      <NGNBSwapContent />
    </ProtectedFeature>
  );
}
