import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Eye, Shield, Trash2, Download, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { deleteWallet, verifyPIN } from '@/lib/storage';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();
  const { wallet, setWallet, setIsLocked } = useWallet();
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  
  const handleVerifyPin = async () => {
    const isValid = await verifyPIN(pin);
    if (isValid) {
      setShowMnemonic(true);
      setShowPinDialog(false);
      setPin('');
      setPinError('');
    } else {
      setPinError('Incorrect PIN. Please try again.');
    }
  };

  const handleShowRecoveryPhrase = () => {
    if (showMnemonic) {
      setShowMnemonic(false);
    } else {
      setPin('');
      setPinError('');
      setShowPinDialog(true);
    }
  };
  
  const handleDeleteWallet = () => {
    if (confirmText === 'DELETE') {
      deleteWallet();
      setWallet(null);
      setIsLocked(true);
      toast.success('Wallet deleted');
      navigate('/');
    }
  };
  
  const exportWallet = () => {
    if (!wallet) return;
    
    const data = {
      address: wallet.address,
      mnemonic: wallet.mnemonic,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `light-wallet-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Wallet exported successfully');
  };
  
  if (!wallet) return null;
  
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
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Manage Wallets</h3>
                  <p className="text-sm text-muted-foreground">Add, import, or switch between wallets</p>
                </div>
              </div>
              <Button 
                variant="outline"
                onClick={() => navigate('/wallet-manager')}
              >
                Manage
              </Button>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Recovery Phrase</h3>
                  <p className="text-sm text-muted-foreground">View your secret recovery phrase</p>
                </div>
              </div>
              <Button 
                variant="outline"
                onClick={handleShowRecoveryPhrase}
              >
                {showMnemonic ? 'Hide' : 'Show'}
              </Button>
            </div>
            
            {showMnemonic && (
              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
                <p className="text-xs text-destructive mb-3">⚠️ Never share your recovery phrase with anyone!</p>
                <div className="grid grid-cols-3 gap-2">
                  {wallet.mnemonic.split(' ').map((word, index) => (
                    <div key={index} className="bg-background p-2 rounded text-sm">
                      <span className="text-muted-foreground mr-1">{index + 1}.</span>
                      <span className="font-mono">{word}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Download className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Export Wallet</h3>
                  <p className="text-sm text-muted-foreground">Download encrypted backup</p>
                </div>
              </div>
              <Button 
                variant="outline"
                onClick={exportWallet}
              >
                Export
              </Button>
            </div>
          </Card>
          
          <Card className="p-6 border-destructive/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg text-destructive">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-destructive">Delete Wallet</h3>
                  <p className="text-sm text-muted-foreground">Permanently remove this wallet</p>
                </div>
              </div>
              <Button 
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                Delete
              </Button>
            </div>
          </Card>
        </div>
        
        <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter PIN</DialogTitle>
              <DialogDescription>
                Enter your wallet PIN to view the recovery phrase
              </DialogDescription>
            </DialogHeader>
            
            <div className="my-4">
              <Label className="mb-2 block">PIN</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setPinError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && pin.length >= 4) {
                    handleVerifyPin();
                  }
                }}
                placeholder="Enter your PIN"
                className={pinError ? 'border-destructive' : ''}
              />
              {pinError && (
                <p className="text-sm text-destructive mt-2">{pinError}</p>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowPinDialog(false);
                setPin('');
                setPinError('');
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleVerifyPin}
                disabled={pin.length < 4}
              >
                Verify PIN
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Wallet</DialogTitle>
              <DialogDescription>
                This will permanently delete your wallet from this device. Make sure you have your recovery phrase saved!
              </DialogDescription>
            </DialogHeader>
            
            <div className="my-4">
              <Label className="mb-2 block">Type "DELETE" to confirm</Label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDeleteWallet}
                disabled={confirmText !== 'DELETE'}
              >
                Delete Wallet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
