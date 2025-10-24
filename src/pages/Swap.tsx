import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowDownUp, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedFeature } from '@/components/ProtectedFeature';
import { useAuth } from '@/contexts/AuthContext';

export default function Swap() {
  return (
    <ProtectedFeature featureName="Swap">
      <SwapContent />
    </ProtectedFeature>
  );
}

function SwapContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ngnbBalance, setNgnbBalance] = useState<number>(0);
  const [ngnbAmount, setNgnbAmount] = useState('');
  const [bimcoinAmount, setBimcoinAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Simplified rate: 1 NGNB = 0.1 BIM (adjustable)
  const NGNB_TO_BIM_RATE = 0.1;

  useEffect(() => {
    fetchNGNBBalance();
  }, []);

  const fetchNGNBBalance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ngnb_balances')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setNgnbBalance(data ? parseFloat(data.balance.toString()) : 0);
    } catch (error) {
      console.error('Error fetching NGNB balance:', error);
      toast.error('Failed to load balance');
    } finally {
      setLoading(false);
    }
  };

  const handleNGNBChange = (value: string) => {
    setNgnbAmount(value);
    const amount = parseFloat(value) || 0;
    setBimcoinAmount((amount * NGNB_TO_BIM_RATE).toFixed(4));
  };

  const handleBimcoinChange = (value: string) => {
    setBimcoinAmount(value);
    const amount = parseFloat(value) || 0;
    setNgnbAmount((amount / NGNB_TO_BIM_RATE).toFixed(2));
  };

  const handleSwap = async () => {
    const amount = parseFloat(ngnbAmount);
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

      const bimAmount = parseFloat(bimcoinAmount);

      // Update NGNB balance
      const newNgnbBalance = ngnbBalance - amount;
      const { error: balanceError } = await supabase
        .from('ngnb_balances')
        .update({ balance: newNgnbBalance })
        .eq('user_id', user.id);

      if (balanceError) throw balanceError;

      // Credit Bimcoin balance
      const { data: existingBimcoin } = await supabase
        .from('bimcoin_balances')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      const newBimcoinBalance = existingBimcoin
        ? parseFloat(existingBimcoin.balance.toString()) + bimAmount
        : bimAmount;

      if (existingBimcoin) {
        const { error: bimcoinError } = await supabase
          .from('bimcoin_balances')
          .update({ balance: newBimcoinBalance })
          .eq('user_id', user.id);
        if (bimcoinError) throw bimcoinError;
      } else {
        const { error: bimcoinError } = await supabase
          .from('bimcoin_balances')
          .insert([{ user_id: user.id, balance: newBimcoinBalance }]);
        if (bimcoinError) throw bimcoinError;
      }

      // Record swap transaction
      const { error: txError } = await supabase
        .from('banking_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'swap',
          amount: amount,
          ngnb_amount: bimAmount,
          status: 'completed',
          reference: `SWAP${Date.now()}`,
          metadata: { from: 'NGNB', to: 'BIM', rate: NGNB_TO_BIM_RATE }
        });

      if (txError) throw txError;

      toast.success(`Swapped ${amount} NGNB to ${bimAmount} Bimcoin`, {
        description: 'Bimcoin will appear in your wallet'
      });

      setNgnbAmount('');
      setBimcoinAmount('');
      fetchNGNBBalance();
    } catch (error) {
      console.error('Swap error:', error);
      toast.error('Swap failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-md">
        <Button variant="ghost" onClick={() => navigate('/bank')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Bank
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Swap NGNB to Bimcoin</CardTitle>
            <CardDescription>
              Convert your NGNB to Bimcoin for shopping
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* From: NGNB */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="ngnb">From: NGNB</Label>
                <span className="text-xs text-muted-foreground">
                  Balance: {ngnbBalance.toFixed(2)}
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  id="ngnb"
                  type="number"
                  placeholder="0.00"
                  value={ngnbAmount}
                  onChange={(e) => handleNGNBChange(e.target.value)}
                  className="text-lg"
                />
                <Button
                  variant="outline"
                  onClick={() => handleNGNBChange(ngnbBalance.toString())}
                  className="whitespace-nowrap"
                >
                  Max
                </Button>
              </div>
            </div>

            {/* Swap Icon */}
            <div className="flex justify-center">
              <div className="p-2 rounded-full bg-muted">
                <ArrowDownUp className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            {/* To: Bimcoin */}
            <div className="space-y-2">
              <Label htmlFor="bimcoin">To: Bimcoin (BIM)</Label>
              <Input
                id="bimcoin"
                type="number"
                placeholder="0.0000"
                value={bimcoinAmount}
                onChange={(e) => handleBimcoinChange(e.target.value)}
                className="text-lg"
              />
            </div>

            {/* Rate Info */}
            <div className="bg-muted p-3 rounded-lg text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-muted-foreground">Exchange Rate</span>
                <span className="font-medium">1 NGNB = {NGNB_TO_BIM_RATE} BIM</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">You'll receive</span>
                <span className="font-bold text-primary">{bimcoinAmount || '0.0000'} BIM</span>
              </div>
            </div>

            {/* Swap Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleSwap}
              disabled={processing || !ngnbAmount || parseFloat(ngnbAmount) <= 0 || parseFloat(ngnbAmount) > ngnbBalance}
            >
              {processing ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Swapping...
                </>
              ) : (
                <>
                  <ArrowDownUp className="h-5 w-5 mr-2" />
                  Swap to Bimcoin
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Use Bimcoin to shop on Bimcart with escrow protection
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}