import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { restoreWallet, encryptMnemonic } from '@/lib/crypto';
import { storeEncryptedWallet, storePINHash } from '@/lib/storage';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';

export default function RestoreWallet() {
  const navigate = useNavigate();
  const { setWallet, setIsLocked } = useWallet();
  const [step, setStep] = useState<'mnemonic' | 'pin'>('mnemonic');
  const [mnemonic, setMnemonic] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [walletData, setWalletData] = useState<any>(null);
  
  const handleRestore = async () => {
    const trimmedMnemonic = mnemonic.trim().toLowerCase();
    const words = trimmedMnemonic.split(/\s+/);
    
    if (words.length !== 12 && words.length !== 24) {
      toast.error('Please enter 12 or 24 words');
      return;
    }
    
    const wallet = await restoreWallet(trimmedMnemonic);
    
    if (!wallet) {
      toast.error('Invalid recovery phrase');
      return;
    }
    
    setWalletData(wallet);
    setStep('pin');
  };
  
  const handleSetPin = async () => {
    if (pin.length < 4) {
      toast.error('PIN must be at least 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      toast.error('PINs do not match');
      return;
    }
    
    if (!walletData) return;
    
    const encrypted = await encryptMnemonic(walletData.mnemonic, pin);
    storeEncryptedWallet(encrypted);
    await storePINHash(pin);
    
    setWallet(walletData);
    setIsLocked(false);
    toast.success('Wallet restored successfully!');
    navigate('/dashboard');
  };
  
  if (step === 'mnemonic') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <Card className="p-6 gradient-card shadow-glow">
            <h2 className="text-xl font-bold mb-4">Restore Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Enter your 12 or 24-word recovery phrase to restore your wallet.
            </p>
            
            <div className="mb-6">
              <Label className="mb-2 block">Recovery Phrase</Label>
              <Textarea
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                placeholder="Enter your recovery phrase (12 or 24 words)"
                rows={4}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Separate words with spaces
              </p>
            </div>
            
            <Button 
              className="gradient-primary w-full"
              onClick={handleRestore}
              disabled={!mnemonic.trim()}
            >
              Continue
            </Button>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => setStep('mnemonic')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Card className="p-6 gradient-card shadow-glow">
          <h2 className="text-xl font-bold mb-4">Set Up PIN</h2>
          <p className="text-muted-foreground mb-6">
            Create a PIN to secure your restored wallet.
          </p>
          
          <div className="space-y-4 mb-6">
            <div>
              <Label className="mb-2 block">Enter PIN (4+ digits)</Label>
              <Input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter PIN"
                maxLength={8}
              />
            </div>
            
            <div>
              <Label className="mb-2 block">Confirm PIN</Label>
              <Input
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Confirm PIN"
                maxLength={8}
              />
            </div>
          </div>
          
          <Button 
            className="gradient-primary w-full"
            onClick={handleSetPin}
            disabled={!pin || !confirmPin}
          >
            Restore Wallet
          </Button>
        </Card>
      </div>
    </div>
  );
}
