import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createWallet, encryptMnemonic } from '@/lib/crypto';
import { storeEncryptedWallet, storePINHash } from '@/lib/storage';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';

export default function CreateWallet() {
  const navigate = useNavigate();
  const { setWallet, setIsLocked } = useWallet();
  const [step, setStep] = useState<'generate' | 'verify' | 'pin'>('generate');
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(true);
  const [verificationIndices] = useState([2, 7, 15]); // Random words to verify
  const [verificationInputs, setVerificationInputs] = useState<string[]>(['', '', '']);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [walletData, setWalletData] = useState<any>(null);
  
  const handleGenerate = async () => {
    const wallet = await createWallet();
    setWalletData(wallet);
    setMnemonic(wallet.mnemonic.split(' '));
  };
  
  const copyMnemonic = () => {
    navigator.clipboard.writeText(mnemonic.join(' '));
    setCopied(true);
    toast.success('Recovery phrase copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleContinue = () => {
    if (step === 'generate' && confirmed) {
      setStep('verify');
    } else if (step === 'verify') {
      const isValid = verificationIndices.every((idx, i) => 
        verificationInputs[i].toLowerCase() === mnemonic[idx].toLowerCase()
      );
      
      if (isValid) {
        setStep('pin');
      } else {
        toast.error('Verification failed. Please check the words.');
      }
    } else if (step === 'pin') {
      if (pin.length < 4) {
        toast.error('PIN must be at least 4 digits');
        return;
      }
      if (pin !== confirmPin) {
        toast.error('PINs do not match');
        return;
      }
      finishSetup();
    }
  };
  
  const finishSetup = async () => {
    if (!walletData) return;
    
    const encrypted = await encryptMnemonic(walletData.mnemonic, pin);
    storeEncryptedWallet(encrypted);
    await storePINHash(pin);
    
    setWallet(walletData);
    setIsLocked(false);
    toast.success('Wallet created successfully!');
    navigate('/dashboard');
  };
  
  if (mnemonic.length === 0) {
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
          
          <Card className="p-8 text-center gradient-card shadow-glow">
            <h1 className="text-2xl font-bold mb-4">Create New Wallet</h1>
            <p className="text-muted-foreground mb-6">
              Generate a secure 24-word recovery phrase to create your wallet.
            </p>
            <Button 
              className="gradient-primary w-full"
              onClick={handleGenerate}
            >
              Generate Recovery Phrase
            </Button>
          </Card>
        </div>
      </div>
    );
  }
  
  if (step === 'generate') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => setMnemonic([])}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <Card className="p-6 gradient-card shadow-glow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Recovery Phrase</h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowMnemonic(!showMnemonic)}
              >
                {showMnemonic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg mb-4">
              <p className="text-sm text-destructive mb-2">⚠️ Important:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Write down these 24 words in order</li>
                <li>Keep them safe and private</li>
                <li>Never share them with anyone</li>
                <li>You'll need them to restore your wallet</li>
              </ul>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-6">
              {mnemonic.map((word, index) => (
                <div key={index} className="bg-background p-3 rounded-lg">
                  <span className="text-xs text-muted-foreground mr-2">{index + 1}.</span>
                  <span className={`font-mono ${showMnemonic ? '' : 'blur-sm'}`}>
                    {word}
                  </span>
                </div>
              ))}
            </div>
            
            <Button
              variant="outline"
              className="w-full mb-4"
              onClick={copyMnemonic}
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy to Clipboard
                </>
              )}
            </Button>
            
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox 
                id="confirm" 
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked as boolean)}
              />
              <Label htmlFor="confirm" className="text-sm cursor-pointer">
                I have securely saved my recovery phrase
              </Label>
            </div>
            
            <Button 
              className="gradient-primary w-full"
              disabled={!confirmed}
              onClick={handleContinue}
            >
              Continue
            </Button>
          </Card>
        </div>
      </div>
    );
  }
  
  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => setStep('generate')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <Card className="p-6 gradient-card shadow-glow">
            <h2 className="text-xl font-bold mb-4">Verify Recovery Phrase</h2>
            <p className="text-muted-foreground mb-6">
              Enter the following words from your recovery phrase to continue.
            </p>
            
            <div className="space-y-4 mb-6">
              {verificationIndices.map((wordIndex, i) => (
                <div key={i}>
                  <Label className="mb-2 block">Word #{wordIndex + 1}</Label>
                  <Input
                    value={verificationInputs[i]}
                    onChange={(e) => {
                      const newInputs = [...verificationInputs];
                      newInputs[i] = e.target.value;
                      setVerificationInputs(newInputs);
                    }}
                    placeholder={`Enter word #${wordIndex + 1}`}
                  />
                </div>
              ))}
            </div>
            
            <Button 
              className="gradient-primary w-full"
              onClick={handleContinue}
              disabled={verificationInputs.some(v => !v)}
            >
              Verify
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
          onClick={() => setStep('verify')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Card className="p-6 gradient-card shadow-glow">
          <h2 className="text-xl font-bold mb-4">Set Up PIN</h2>
          <p className="text-muted-foreground mb-6">
            Create a PIN to secure your wallet. You'll need this to access your wallet.
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
            onClick={handleContinue}
            disabled={!pin || !confirmPin}
          >
            Create Wallet
          </Button>
        </Card>
      </div>
    </div>
  );
}
