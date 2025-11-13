import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { verifyPIN } from '@/lib/storage';
import { getEncryptedWallet } from '@/lib/storage';
import { decryptMnemonic, restoreWallet } from '@/lib/crypto';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { autoLockService } from '@/lib/autolock';

export default function Unlock() {
  const navigate = useNavigate();
  const { setWallet, setIsLocked } = useWallet();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Check for wallet existence
    const encrypted = getEncryptedWallet();
    if (!encrypted) {
      // No wallet found, redirect to onboarding
      navigate('/');
      return;
    }
  }, [navigate]);
  
  const handleUnlock = async () => {
    setLoading(true);
    
    try {
      const isValid = await verifyPIN(pin);
      
      if (!isValid) {
        toast.error('Invalid PIN');
        setPin('');
        setLoading(false);
        return;
      }
      
      const encrypted = getEncryptedWallet();
      if (!encrypted) {
        toast.error('Wallet not found');
        navigate('/');
        return;
      }
      
      const mnemonic = await decryptMnemonic(encrypted, pin);
      if (!mnemonic) {
        toast.error('Failed to decrypt wallet');
        setPin('');
        setLoading(false);
        return;
      }
      
      const wallet = await restoreWallet(mnemonic);
      if (!wallet) {
        toast.error('Failed to restore wallet');
        setLoading(false);
        return;
      }
      
      // Reset auto-lock timer on successful unlock
      autoLockService.clearSession();
      autoLockService.updateLastActivity();
      autoLockService.startTimer();
      
      setWallet(wallet);
      setIsLocked(false);
      toast.success('Wallet unlocked');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to unlock wallet');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="p-8 text-center gradient-card shadow-glow">
          <div className="inline-flex p-4 bg-gradient-to-br from-primary to-secondary rounded-3xl mb-4">
            <Lock className="h-12 w-12 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground mb-6">
            Enter your PIN to unlock your wallet
          </p>
          
          <div className="mb-6">
            <Label className="mb-2 block text-left">PIN</Label>
            <PasswordInput
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter your PIN"
              maxLength={8}
              className="text-center text-2xl tracking-widest"
              onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
              autoFocus
            />
          </div>
          
          <Button 
            className="gradient-primary w-full mb-4"
            onClick={handleUnlock}
            disabled={!pin || loading}
          >
            {loading ? 'Unlocking...' : 'Unlock Wallet'}
          </Button>
          
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => navigate('/wallet-manager')}
          >
            Use Different Wallet
          </Button>
        </Card>
      </div>
    </div>
  );
}
