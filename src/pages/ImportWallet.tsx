import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { restoreWallet, encryptMnemonic } from '@/lib/crypto';
import { storeWallet, StoredWallet } from '@/lib/storage';
import { verifyPIN } from '@/lib/storage';
import { toast } from 'sonner';

export default function ImportWallet() {
  const navigate = useNavigate();
  const [walletName, setWalletName] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleImportWallet = async () => {
    if (!walletName.trim()) {
      setError('Please enter a wallet name');
      return;
    }
    
    const mnemonicTrimmed = mnemonic.trim();
    if (!mnemonicTrimmed) {
      setError('Please enter your recovery phrase');
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
      
      // Restore wallet from mnemonic
      const wallet = await restoreWallet(mnemonicTrimmed);
      
      if (!wallet) {
        setError('Invalid recovery phrase. Please check and try again.');
        setLoading(false);
        return;
      }
      
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
      
      toast.success('Wallet imported successfully');
      navigate('/wallet-manager');
    } catch (err) {
      console.error('Failed to import wallet:', err);
      setError('Failed to import wallet. Please try again.');
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
          <h1 className="text-2xl font-bold mb-6">Import Wallet</h1>
          
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
                placeholder="e.g., Imported Wallet"
                maxLength={50}
                disabled={loading}
              />
            </div>
            
            <div>
              <Label htmlFor="mnemonic">Recovery Phrase</Label>
              <Textarea
                id="mnemonic"
                value={mnemonic}
                onChange={(e) => {
                  setMnemonic(e.target.value);
                  setError('');
                }}
                placeholder="Enter your 24-word recovery phrase"
                rows={4}
                disabled={loading}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter all words separated by spaces
              </p>
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
              onClick={handleImportWallet}
              disabled={loading || !walletName.trim() || !mnemonic.trim() || pin.length < 4}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import Wallet
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
