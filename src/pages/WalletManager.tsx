import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Plus, Wallet, Check, Trash2, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { getAllWallets, setActiveWallet, deleteWalletById, StoredWallet, getActiveWallet } from '@/lib/storage';
import { decryptMnemonic } from '@/lib/crypto';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { verifyPIN } from '@/lib/storage';

export default function WalletManager() {
  const navigate = useNavigate();
  const { setWallet, activeWalletId, setActiveWalletId, setIsLocked } = useWallet();
  const [wallets, setWallets] = useState<StoredWallet[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<string | null>(null);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pendingWalletId, setPendingWalletId] = useState<string | null>(null);
  
  useEffect(() => {
    loadWallets();
  }, []);
  
  const loadWallets = () => {
    const allWallets = getAllWallets();
    setWallets(allWallets);
  };
  
  const handleSwitchWallet = async (walletId: string) => {
    setPendingWalletId(walletId);
    setPin('');
    setPinError('');
    setShowPinDialog(true);
  };
  
  const handleVerifyAndSwitch = async () => {
    const isValid = await verifyPIN(pin);
    if (isValid && pendingWalletId) {
      const selectedWallet = wallets.find(w => w.id === pendingWalletId);
      if (selectedWallet) {
        const decrypted = await decryptMnemonic(selectedWallet.encrypted, pin);
        if (decrypted) {
          setActiveWallet(pendingWalletId);
          setActiveWalletId(pendingWalletId);
          setWallet({
            mnemonic: decrypted,
            address: selectedWallet.address,
            publicKey: ''
          });
          setShowPinDialog(false);
          setPin('');
          setPinError('');
          setPendingWalletId(null);
          toast.success('Wallet switched successfully');
          navigate('/dashboard');
        } else {
          setPinError('Failed to decrypt wallet');
        }
      }
    } else {
      setPinError('Incorrect PIN. Please try again.');
    }
  };
  
  const handleDeleteWallet = (walletId: string) => {
    setWalletToDelete(walletId);
    setShowDeleteDialog(true);
  };
  
  const confirmDelete = () => {
    if (walletToDelete) {
      deleteWalletById(walletToDelete);
      
      // If deleting active wallet, clear current wallet
      if (walletToDelete === activeWalletId) {
        const remaining = getAllWallets();
        if (remaining.length === 0) {
          setWallet(null);
          setActiveWalletId(null);
          setIsLocked(true);
          navigate('/');
        } else {
          setActiveWallet(remaining[0].id);
          setActiveWalletId(remaining[0].id);
          toast.info('Please unlock your wallet');
          navigate('/unlock');
        }
      }
      
      loadWallets();
      setShowDeleteDialog(false);
      setWalletToDelete(null);
      toast.success('Wallet deleted');
    }
  };
  
  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
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
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">My Wallets</h1>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/wallet-manager/create')}>
              <Plus className="mr-2 h-4 w-4" />
              New Wallet
            </Button>
            <Button variant="outline" onClick={() => navigate('/wallet-manager/import')}>
              <Download className="mr-2 h-4 w-4" />
              Import
            </Button>
          </div>
        </div>
        
        <div className="space-y-3">
          {wallets.map((wallet) => (
            <Card 
              key={wallet.id} 
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                wallet.id === activeWalletId ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => wallet.id !== activeWalletId && handleSwitchWallet(wallet.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    wallet.id === activeWalletId ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{wallet.name}</h3>
                      {wallet.id === activeWalletId && (
                        <span className="flex items-center gap-1 text-xs text-primary">
                          <Check className="h-3 w-3" />
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">
                      {formatAddress(wallet.address)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(wallet.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteWallet(wallet.id);
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
          
          {wallets.length === 0 && (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No wallets yet</h3>
              <p className="text-muted-foreground mb-4">Create or import a wallet to get started</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => navigate('/wallet-manager/create')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Wallet
                </Button>
                <Button variant="outline" onClick={() => navigate('/wallet-manager/import')}>
                  <Download className="mr-2 h-4 w-4" />
                  Import Wallet
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter PIN</DialogTitle>
              <DialogDescription>
                Enter your PIN to switch to this wallet
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
                    handleVerifyAndSwitch();
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
                setPendingWalletId(null);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleVerifyAndSwitch}
                disabled={pin.length < 4}
              >
                Unlock
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Wallet</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this wallet? Make sure you have saved the recovery phrase!
              </DialogDescription>
            </DialogHeader>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={confirmDelete}
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
