import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Users, Shield, Check, X, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface Signer {
  address: string;
  name: string;
}

interface MultiSigWallet {
  id: string;
  name: string;
  address: string;
  signers: Signer[];
  threshold: number;
  createdAt: number;
}

interface PendingTransaction {
  id: string;
  walletId: string;
  to: string;
  amount: string;
  token: string;
  approvals: string[];
  createdAt: number;
  createdBy: string;
}

export default function MultiSig() {
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<MultiSigWallet[]>([]);
  const [pendingTxs, setPendingTxs] = useState<PendingTransaction[]>([]);
  const [newWalletName, setNewWalletName] = useState('');
  const [signers, setSigners] = useState<Signer[]>([{ address: '', name: '' }]);
  const [threshold, setThreshold] = useState(2);

  useEffect(() => {
    loadMultiSigData();
  }, []);

  const loadMultiSigData = () => {
    const storedWallets = localStorage.getItem('multisig_wallets');
    const storedTxs = localStorage.getItem('multisig_pending_txs');
    
    if (storedWallets) setWallets(JSON.parse(storedWallets));
    if (storedTxs) setPendingTxs(JSON.parse(storedTxs));
  };

  const saveWallets = (newWallets: MultiSigWallet[]) => {
    localStorage.setItem('multisig_wallets', JSON.stringify(newWallets));
    setWallets(newWallets);
  };

  const savePendingTxs = (txs: PendingTransaction[]) => {
    localStorage.setItem('multisig_pending_txs', JSON.stringify(txs));
    setPendingTxs(txs);
  };

  const handleAddSigner = () => {
    if (signers.length >= 10) {
      toast.error('Maximum 10 signers allowed');
      return;
    }
    setSigners([...signers, { address: '', name: '' }]);
  };

  const handleRemoveSigner = (index: number) => {
    if (signers.length <= 2) {
      toast.error('Minimum 2 signers required');
      return;
    }
    setSigners(signers.filter((_, i) => i !== index));
    if (threshold > signers.length - 1) {
      setThreshold(signers.length - 1);
    }
  };

  const updateSigner = (index: number, field: 'address' | 'name', value: string) => {
    const updated = [...signers];
    updated[index][field] = value;
    setSigners(updated);
  };

  const handleCreateWallet = () => {
    if (!newWalletName) {
      toast.error('Please enter wallet name');
      return;
    }

    const validSigners = signers.filter((s) => s.address && s.name);
    if (validSigners.length < 2) {
      toast.error('At least 2 signers required');
      return;
    }

    if (threshold < 1 || threshold > validSigners.length) {
      toast.error('Invalid threshold');
      return;
    }

    const newWallet: MultiSigWallet = {
      id: Date.now().toString(),
      name: newWalletName,
      address: `EQ${Math.random().toString(36).substring(2, 15)}`,
      signers: validSigners,
      threshold,
      createdAt: Date.now(),
    };

    saveWallets([...wallets, newWallet]);
    setNewWalletName('');
    setSigners([{ address: '', name: '' }]);
    setThreshold(2);
    toast.success('Multi-sig wallet created');
  };

  const handleApprove = (txId: string, walletId: string) => {
    const tx = pendingTxs.find((t) => t.id === txId);
    if (!tx) return;

    const wallet = wallets.find((w) => w.id === walletId);
    if (!wallet) return;

    const userAddress = 'current_user'; // Replace with actual user address
    if (tx.approvals.includes(userAddress)) {
      toast.error('Already approved');
      return;
    }

    const updatedTx = {
      ...tx,
      approvals: [...tx.approvals, userAddress],
    };

    const updated = pendingTxs.map((t) => (t.id === txId ? updatedTx : t));

    if (updatedTx.approvals.length >= wallet.threshold) {
      // Execute transaction
      toast.success('Transaction executed', {
        description: `Sent ${tx.amount} ${tx.token} to ${tx.to.slice(0, 8)}...`,
      });
      savePendingTxs(updated.filter((t) => t.id !== txId));
    } else {
      savePendingTxs(updated);
      toast.success('Transaction approved', {
        description: `${updatedTx.approvals.length}/${wallet.threshold} approvals`,
      });
    }
  };

  const handleReject = (txId: string) => {
    savePendingTxs(pendingTxs.filter((t) => t.id !== txId));
    toast.success('Transaction rejected');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Multi-Signature Wallets</h1>
              <p className="text-muted-foreground mt-1">
                Create wallets requiring multiple approvals for transactions
              </p>
            </div>
          </div>

          <Tabs defaultValue="wallets" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="wallets">My Wallets</TabsTrigger>
              <TabsTrigger value="create">Create New</TabsTrigger>
              <TabsTrigger value="pending">
                Pending
                {pendingTxs.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {pendingTxs.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="wallets" className="space-y-4">
              {wallets.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Shield className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">No multi-sig wallets yet</p>
                    <Button onClick={() => {
                      const createTab = document.querySelector<HTMLButtonElement>('[value="create"]');
                      createTab?.click();
                    }}>
                      Create Your First Wallet
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                wallets.map((wallet) => (
                  <Card key={wallet.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{wallet.name}</CardTitle>
                          <CardDescription className="font-mono mt-1">
                            {wallet.address.slice(0, 12)}...{wallet.address.slice(-8)}
                          </CardDescription>
                        </div>
                        <Badge variant="outline">
                          {wallet.threshold}/{wallet.signers.length}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{wallet.signers.length} Signers</span>
                        </div>
                        <div className="space-y-2">
                          {wallet.signers.map((signer, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 rounded-full bg-primary" />
                              <span className="font-medium">{signer.name}</span>
                              <span className="text-muted-foreground font-mono text-xs">
                                {signer.address.slice(0, 8)}...
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="create" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Create Multi-Sig Wallet</CardTitle>
                  <CardDescription>
                    Set up a wallet requiring multiple approvals
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="walletName">Wallet Name</Label>
                    <Input
                      id="walletName"
                      placeholder="e.g., Team Treasury"
                      value={newWalletName}
                      onChange={(e) => setNewWalletName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Signers</Label>
                      <Button size="sm" variant="outline" onClick={handleAddSigner}>
                        Add Signer
                      </Button>
                    </div>
                    {signers.map((signer, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          placeholder="Name"
                          value={signer.name}
                          onChange={(e) => updateSigner(i, 'name', e.target.value)}
                        />
                        <Input
                          placeholder="Address"
                          value={signer.address}
                          onChange={(e) => updateSigner(i, 'address', e.target.value)}
                          className="font-mono"
                        />
                        {signers.length > 2 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveSigner(i)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label>Required Approvals (Threshold)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        min={1}
                        max={signers.length}
                        value={threshold}
                        onChange={(e) => setThreshold(parseInt(e.target.value) || 2)}
                        className="max-w-[100px]"
                      />
                      <span className="text-sm text-muted-foreground">
                        of {signers.filter((s) => s.address && s.name).length} signers
                      </span>
                    </div>
                  </div>

                  <Button className="w-full" size="lg" onClick={handleCreateWallet}>
                    <Shield className="h-5 w-5 mr-2" />
                    Create Multi-Sig Wallet
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {pendingTxs.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No pending transactions</p>
                  </CardContent>
                </Card>
              ) : (
                pendingTxs.map((tx) => {
                  const wallet = wallets.find((w) => w.id === tx.walletId);
                  if (!wallet) return null;

                  return (
                    <Card key={tx.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold">
                                Send {tx.amount} {tx.token}
                              </div>
                              <div className="text-sm text-muted-foreground font-mono">
                                To: {tx.to.slice(0, 12)}...{tx.to.slice(-8)}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                From: {wallet.name}
                              </div>
                            </div>
                            <Badge>
                              {tx.approvals.length}/{wallet.threshold}
                            </Badge>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              className="flex-1"
                              onClick={() => handleApprove(tx.id, tx.walletId)}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              className="flex-1"
                              variant="destructive"
                              onClick={() => handleReject(tx.id)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
