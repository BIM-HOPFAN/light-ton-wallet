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
import { blockchainService } from '@/lib/blockchain';
import { tonService } from '@/lib/ton';
import { decryptMnemonic } from '@/lib/crypto';
import { getActiveWallet } from '@/lib/storage';

const TREASURY_ADDRESS = 'UQCv2zOQoWzM8HI5jnNs8KJQngGNHfwnJ4n7DH8gT3wAt_Yk';
const NGNB_CONTRACT = 'EQBqvuMEkR9XHTE0qRVzIJ7gVSxVvB93757VV3nNEhKwb06q';

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

      // Fetch actual NGNB token balance from blockchain
      if (wallet?.address) {
        const tokenBalance = await blockchainService.getTokenBalance(
          wallet.address,
          NGNB_CONTRACT
        );
        setWalletBalance(tokenBalance);
      }
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
        // Call edge function for atomic bank-to-wallet swap
        const { data, error } = await supabase.functions.invoke('ngnb-swap', {
          body: {
            direction: 'bank-to-wallet',
            amount: swapAmount,
            walletAddress: wallet.address
          }
        });

        if (error) throw error;

        toast({
          title: 'Swap Initiated',
          description: `Swapping ${swapAmount} NGNB to your wallet. Treasury will send tokens to ${wallet.address.slice(0, 8)}...`,
        });
      } else {
        // Swap wallet NGNB to internal NGNB
        
        // Get stored wallet with encrypted mnemonic
        const storedWallet = getActiveWallet();
        if (!storedWallet) {
          toast({
            title: 'Wallet Error',
            description: 'Unable to access wallet',
            variant: 'destructive',
          });
          return;
        }

        // Prompt for PIN to decrypt wallet
        const pin = prompt('Enter your PIN to confirm the swap:');
        if (!pin) {
          toast({
            title: 'Cancelled',
            description: 'Swap cancelled',
          });
          return;
        }

        // Get decrypted mnemonic
        const mnemonic = await decryptMnemonic(storedWallet.encrypted, pin);
        if (!mnemonic) {
          toast({
            title: 'Invalid PIN',
            description: 'Unable to decrypt wallet. Please check your PIN.',
            variant: 'destructive',
          });
          return;
        }

        // Send NGNB tokens to treasury
        const result = await tonService.sendJetton({
          mnemonic,
          jettonMasterAddress: NGNB_CONTRACT,
          recipientAddress: TREASURY_ADDRESS,
          amount: swapAmount.toString(),
          decimals: 9
        });

        if (!result.success) {
          throw new Error(result.error || 'Token transfer failed');
        }

        // Call edge function for atomic wallet-to-bank swap
        const { data, error: swapError } = await supabase.functions.invoke('ngnb-swap', {
          body: {
            direction: 'wallet-to-bank',
            amount: swapAmount,
            walletAddress: wallet.address,
            txHash: result.txHash
          }
        });

        if (swapError) throw swapError;

        toast({
          title: 'Swap Successful',
          description: `${swapAmount} NGNB swapped to Bank successfully`,
        });
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
