import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send as SendIcon, ChevronDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { isValidAddress } from '@/lib/crypto';
import { tonService } from '@/lib/ton';
import { toast } from 'sonner';
import { getTokens, Token } from '@/lib/tokens';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addTransaction, updateTransactionStatus } from '@/lib/transactions';

export default function Send() {
  const navigate = useNavigate();
  const location = useLocation();
  const { wallet, balance } = useWallet();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const allTokens = getTokens();
    setTokens(allTokens);
    
    // Check if token was passed from navigation state
    const stateToken = location.state?.selectedToken;
    if (stateToken) {
      setSelectedToken(stateToken);
    } else {
      setSelectedToken(allTokens.find(t => t.id === 'ton') || allTokens[0]);
    }
  }, [location]);
  
  const currentBalance = selectedToken?.id === 'ton' ? balance : (selectedToken?.balance || '0.00');
  const fee = tonService.estimateFees();
  const total = amount ? (parseFloat(amount) + parseFloat(fee)).toFixed(2) : '0.00';
  const maxAmount = Math.max(0, parseFloat(currentBalance) - parseFloat(fee)).toFixed(2);
  
  const handleSend = async () => {
    if (!wallet) return;
    
    if (!isValidAddress(recipient)) {
      toast.error('Invalid recipient address');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Invalid amount');
      return;
    }
    
    if (parseFloat(amount) > parseFloat(maxAmount)) {
      toast.error('Insufficient balance');
      return;
    }
    
    setLoading(true);
    
    // Create pending transaction
    const pendingTx = addTransaction({
      type: 'send',
      amount,
      token: selectedToken?.symbol || 'TON',
      network: selectedToken?.network || 'TON',
      address: recipient,
      status: 'pending',
      memo
    });
    
    try {
      const result = await tonService.sendTON({
        mnemonic: wallet.mnemonic,
        recipientAddress: recipient,
        amount,
        memo
      });
      
      if (result.success) {
        updateTransactionStatus(pendingTx.id, 'completed');
        toast.success('Transaction sent successfully!');
        navigate('/dashboard');
      } else {
        updateTransactionStatus(pendingTx.id, 'failed');
        toast.error(result.error || 'Failed to send transaction');
      }
    } catch (error) {
      updateTransactionStatus(pendingTx.id, 'failed');
      toast.error('Failed to send transaction');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Wallet
          </Button>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 max-w-md">
        <Card className="p-6 gradient-card shadow-glow">
          <h2 className="text-2xl font-bold mb-6">Send Tokens</h2>
          
          <div className="space-y-4 mb-6">
            <div>
              <Label className="mb-2 block">Select Token</Label>
              <Select
                value={selectedToken?.id}
                onValueChange={(value) => {
                  const token = tokens.find(t => t.id === value);
                  if (token) setSelectedToken(token);
                }}
              >
                <SelectTrigger>
                  <SelectValue>
                    {selectedToken && (
                      <div className="flex items-center gap-2">
                        <span>{selectedToken.icon || '🪙'}</span>
                        <span>{selectedToken.symbol}</span>
                        <span className="text-muted-foreground text-sm">
                          {selectedToken.network} - ({selectedToken.id === 'ton' ? balance : selectedToken.balance || '0.00'})
                        </span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {tokens.map((token) => (
                    <SelectItem key={token.id} value={token.id}>
                      <div className="flex items-center gap-2">
                        <span>{token.icon || '🪙'}</span>
                        <span>{token.symbol}</span>
                        <span className="text-muted-foreground text-sm">
                          {token.network} - ({token.id === 'ton' ? balance : token.balance || '0.00'})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Recipient Address</Label>
              <Input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="EQD..."
                className="font-mono"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Amount ({selectedToken?.symbol || 'TON'})</Label>
                <button
                  className="text-xs text-primary hover:underline"
                  onClick={() => setAmount(maxAmount)}
                >
                  Max: {maxAmount} {selectedToken?.symbol || 'TON'}
                </button>
              </div>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              {amount && (
                <p className="text-sm text-muted-foreground mt-1">
                  ≈ ${(parseFloat(amount) * 2.5).toFixed(2)} USD
                </p>
              )}
            </div>
            
            <div>
              <Label className="mb-2 block">Memo (Optional)</Label>
              <Textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Add a note..."
                rows={3}
              />
            </div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium">{amount || '0.00'} {selectedToken?.symbol || 'TON'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Network Fee</span>
              <span className="font-medium">{fee} TON</span>
            </div>
            <div className="h-px bg-border my-2" />
            <div className="flex justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-bold">{total} {selectedToken?.symbol || 'TON'}</span>
            </div>
          </div>
          
          <Button 
            className="gradient-primary w-full"
            onClick={handleSend}
            disabled={!recipient || !amount || loading}
          >
            {loading ? (
              'Sending...'
            ) : (
              <>
                <SendIcon className="mr-2 h-4 w-4" />
                Send Transaction
              </>
            )}
          </Button>
        </Card>
      </main>
    </div>
  );
}
