import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createWallet, encryptMnemonic } from '@/lib/crypto';
import { storeWallet, StoredWallet } from '@/lib/storage';
import { verifyPIN } from '@/lib/storage';
import { toast } from 'sonner';

export default function AddWallet() {
  const navigate = useNavigate();
  const [walletName, setWalletName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleCreateWallet = async () => {
    if (!walletName.trim()) {
      setError('Please enter a wallet name');
      return;
    }
    
    if (pin.length < 4) {
      setError('Please enter your PIN');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Verify PIN
      const isValidPin = await verifyPIN(pin);
      if (!isValidPin) {
        setError('Incorrect PIN');
        setLoading(false);
        return;
      }
      
      // Create new wallet
      const wallet = await createWallet();
      const encrypted = await encryptMnemonic(wallet.mnemonic, pin);
      
      // Store wallet
      const storedWallet: StoredWallet = {
        id: crypto.randomUUID(),
        name: walletName.trim(),
        address: wallet.address,
        encrypted,
        createdAt: Date.now()
      };
      
      storeWallet(storedWallet);
      
      toast.success('Wallet created successfully');
      navigate('/wallet-manager');
    } catch (err) {
      console.error('Failed to create wallet:', err);
      setError('Failed to create wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost"
            onClick={() => navigate('/wallet-manager')}
            disabled={loading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6">
          <h1 className="text-2xl font-bold mb-6">Create New Wallet</h1>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="walletName">Wallet Name</Label>
              <Input
                id="walletName"
                value={walletName}
                onChange={(e) => {
                  setWalletName(e.target.value);
                  setError('');
                }}
                placeholder="e.g., Personal Wallet, Savings"
                maxLength={50}
                disabled={loading}
              />
            </div>
            
            <div>
              <Label htmlFor="pin">Enter Your PIN</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="Enter your existing PIN"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use the same PIN you set for your other wallets
              </p>
            </div>
            
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            
            <Button 
              onClick={handleCreateWallet}
              disabled={loading || !walletName.trim() || pin.length < 4}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Wallet
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
