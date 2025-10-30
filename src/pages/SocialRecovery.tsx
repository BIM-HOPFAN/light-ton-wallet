import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Users, Shield, Plus, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { getActiveWallet } from '@/lib/storage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Guardian {
  id: string;
  name: string;
  address: string;
}

export default function SocialRecovery() {
  const navigate = useNavigate();
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [newGuardianName, setNewGuardianName] = useState('');
  const [newGuardianAddress, setNewGuardianAddress] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [threshold, setThreshold] = useState(2);

  useEffect(() => {
    loadGuardians();
  }, []);

  const loadGuardians = () => {
    const wallet = getActiveWallet();
    if (!wallet) return;

    const stored = localStorage.getItem(`guardians_${wallet.id}`);
    if (stored) {
      const data = JSON.parse(stored);
      setGuardians(data.guardians || []);
      setThreshold(data.threshold || 2);
    }
  };

  const saveGuardians = (newGuardians: Guardian[], newThreshold: number) => {
    const wallet = getActiveWallet();
    if (!wallet) return;

    localStorage.setItem(
      `guardians_${wallet.id}`,
      JSON.stringify({ guardians: newGuardians, threshold: newThreshold })
    );
  };

  const handleAddGuardian = () => {
    if (!newGuardianName || !newGuardianAddress) {
      toast.error('Please fill in all fields');
      return;
    }

    if (guardians.length >= 5) {
      toast.error('Maximum 5 guardians allowed');
      return;
    }

    const newGuardian: Guardian = {
      id: Date.now().toString(),
      name: newGuardianName,
      address: newGuardianAddress,
    };

    const updated = [...guardians, newGuardian];
    setGuardians(updated);
    saveGuardians(updated, threshold);
    
    setNewGuardianName('');
    setNewGuardianAddress('');
    setShowAddDialog(false);
    toast.success('Guardian added successfully');
  };

  const handleRemoveGuardian = (id: string) => {
    const updated = guardians.filter((g) => g.id !== id);
    setGuardians(updated);
    saveGuardians(updated, threshold);
    toast.success('Guardian removed');
  };

  const handleThresholdChange = (value: number) => {
    if (value < 1 || value > guardians.length) return;
    setThreshold(value);
    saveGuardians(guardians, value);
    toast.success('Recovery threshold updated');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate('/settings')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Settings
        </Button>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Social Recovery</h1>
              <p className="text-muted-foreground mt-1">
                Add trusted guardians to help recover your wallet
              </p>
            </div>
          </div>

          {/* Info Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm space-y-2">
                  <p className="font-medium">How Social Recovery Works</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Add trusted contacts as recovery guardians</li>
                    <li>Set a threshold (e.g., 2 out of 3 guardians)</li>
                    <li>Guardians can help you recover wallet access</li>
                    <li>Keep guardian information private and secure</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Threshold Settings */}
          {guardians.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recovery Threshold</CardTitle>
                <CardDescription>
                  Number of guardians required to recover wallet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Label className="min-w-fit">Required approvals:</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleThresholdChange(threshold - 1)}
                      disabled={threshold <= 1}
                    >
                      -
                    </Button>
                    <div className="px-4 py-2 border rounded-md min-w-[60px] text-center font-medium">
                      {threshold}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleThresholdChange(threshold + 1)}
                      disabled={threshold >= guardians.length}
                    >
                      +
                    </Button>
                    <span className="text-muted-foreground">
                      of {guardians.length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Guardians List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recovery Guardians</CardTitle>
                  <CardDescription>
                    {guardians.length}/5 guardians added
                  </CardDescription>
                </div>
                <Button onClick={() => setShowAddDialog(true)} disabled={guardians.length >= 5}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Guardian
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {guardians.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">No guardians added yet</p>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Guardian
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {guardians.map((guardian) => (
                    <div
                      key={guardian.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{guardian.name}</p>
                          <p className="text-sm text-muted-foreground font-mono">
                            {guardian.address.slice(0, 8)}...{guardian.address.slice(-6)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveGuardian(guardian.id)}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Guardian Dialog */}
        <AlertDialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Add Recovery Guardian</AlertDialogTitle>
              <AlertDialogDescription>
                Enter the details of a trusted contact who can help recover your wallet
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Guardian Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., John Doe"
                  value={newGuardianName}
                  onChange={(e) => setNewGuardianName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Wallet Address</Label>
                <Input
                  id="address"
                  placeholder="Enter TON address"
                  value={newGuardianAddress}
                  onChange={(e) => setNewGuardianAddress(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleAddGuardian}>
                <Check className="h-4 w-4 mr-2" />
                Add Guardian
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
