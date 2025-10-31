import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeftRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedFeature } from '@/components/ProtectedFeature';
import { decryptMnemonic } from '@/lib/crypto';
import { getActiveWallet } from '@/lib/storage';
import { tonService } from '@/lib/ton';
import { blockchainService } from '@/lib/blockchain';

const BIMCOIN_CONTRACT = 'UQCv2zOQoWzM8HI5jnNs8KJQngGNHfwnJ4n7DH8gT3wAt_Yk';

function BimcoinSwapContent() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [direction, setDirection] = useState<'bank-to-wallet' | 'wallet-to-bank'>('bank-to-wallet');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bankBalance, setBankBalance] = useState('0.00');
  const [walletBalance, setWalletBalance] = useState('0.00');
  const [pin, setPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchBalances();
    }
  }, [session]);

  const fetchBalances = async () => {
    if (!session?.user?.id) return;

    try {
      // Fetch internal bank balance
      const { data: bankData } = await supabase
        .from('bimcoin_balances')
        .select('balance')
        .eq('user_id', session.user.id)
        .maybeSingle();

      setBankBalance(bankData?.balance?.toString() || '0.00');

      // Fetch wallet token balance
      const activeWallet = getActiveWallet();
      if (activeWallet?.address) {
        const tokenBalance = await blockchainService.getTokenBalance(
          activeWallet.address,
          BIMCOIN_CONTRACT
        );
        setWalletBalance(tokenBalance);
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  };

  const handleSwap = async () => {
    if (!session?.user?.id || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const swapAmount = parseFloat(amount);
    const sourceBalance = direction === 'bank-to-wallet' ? parseFloat(bankBalance) : parseFloat(walletBalance);

    if (swapAmount > sourceBalance) {
      toast.error(`Insufficient ${direction === 'bank-to-wallet' ? 'bank' : 'wallet'} balance`);
      return;
    }

    if (direction === 'wallet-to-bank') {
      setShowPinInput(true);
      return;
    }

    // Bank to Wallet flow
    setIsProcessing(true);
    try {
      const activeWallet = getActiveWallet();
      
      // Call edge function for atomic bank-to-wallet swap
      const { data, error } = await supabase.functions.invoke('bimcoin-swap', {
        body: {
          direction: 'bank-to-wallet',
          amount: swapAmount,
          walletAddress: activeWallet?.address
        }
      });

      if (error) throw error;

      toast.success('Swap initiated! Bimcoin will be sent to your wallet shortly.');
      setAmount('');
      fetchBalances();
    } catch (error) {
      console.error('Swap error:', error);
      toast.error('Failed to initiate swap');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWalletToBankSwap = async () => {
    if (!pin) {
      toast.error('Please enter your PIN');
      return;
    }

    setIsProcessing(true);
    try {
      const activeWallet = getActiveWallet();
      if (!activeWallet) {
        throw new Error('No active wallet found');
      }

      // Decrypt mnemonic
      const mnemonic = await decryptMnemonic(activeWallet.encrypted, pin);
      if (!mnemonic) {
        throw new Error('Invalid PIN');
      }

      // Send Bimcoin to treasury
      const result = await tonService.sendJetton({
        mnemonic,
        jettonMasterAddress: BIMCOIN_CONTRACT,
        recipientAddress: BIMCOIN_CONTRACT, // Treasury receives at contract address
        amount: amount.toString(),
        decimals: 9
      });

      if (!result.success) {
        throw new Error(result.error || 'Transaction failed');
      }

      // Call edge function for atomic wallet-to-bank swap
      const { data, error: swapError } = await supabase.functions.invoke('bimcoin-swap', {
        body: {
          direction: 'wallet-to-bank',
          amount: parseFloat(amount),
          walletAddress: activeWallet.address,
          txHash: result.txHash
        }
      });

      if (swapError) throw swapError;

      toast.success('Swap completed successfully!');
      setAmount('');
      setPin('');
      setShowPinInput(false);
      fetchBalances();
    } catch (error: any) {
      console.error('Wallet to bank swap error:', error);
      toast.error(error.message || 'Failed to complete swap');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleDirection = () => {
    setDirection(prev => prev === 'bank-to-wallet' ? 'wallet-to-bank' : 'bank-to-wallet');
    setAmount('');
    setShowPinInput(false);
    setPin('');
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Button variant="ghost" onClick={() => navigate('/bank')} className="mb-4">
        ← Back to Bank
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Swap Bimcoin</CardTitle>
          <CardDescription>
            Transfer Bimcoin between your bank and wallet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="text-sm">
              <p className="text-muted-foreground">Bank Balance</p>
              <p className="text-lg font-semibold">{bankBalance} BIMCOIN</p>
            </div>
            <Button variant="outline" size="icon" onClick={toggleDirection}>
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
            <div className="text-sm text-right">
              <p className="text-muted-foreground">Wallet Balance</p>
              <p className="text-lg font-semibold">{walletBalance} BIMCOIN</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              From: {direction === 'bank-to-wallet' ? 'Bank' : 'Wallet'}
            </Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isProcessing}
              />
              <Button
                variant="outline"
                onClick={() => setAmount(direction === 'bank-to-wallet' ? bankBalance : walletBalance)}
                disabled={isProcessing}
              >
                MAX
              </Button>
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="text-muted-foreground">Exchange Rate</p>
            <p className="font-semibold">1 BIMCOIN = 1 BIMCOIN</p>
          </div>

          {!showPinInput ? (
            <Button
              onClick={handleSwap}
              disabled={isProcessing || !amount || parseFloat(amount) <= 0}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Swap to ${direction === 'bank-to-wallet' ? 'Wallet' : 'Bank'}`
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin">Enter PIN to confirm</Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="Enter your PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  disabled={isProcessing}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPinInput(false);
                    setPin('');
                  }}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleWalletToBankSwap}
                  disabled={isProcessing || !pin}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Confirm Swap'
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function BimcoinSwap() {
  return (
    <ProtectedFeature featureName="Bimlight Bank">
      <BimcoinSwapContent />
    </ProtectedFeature>
  );
}
