import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Trash2, Coins } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getTokens, addToken, removeToken, Token, SUPPORTED_NETWORKS, Network } from '@/lib/tokens';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

export default function Tokens() {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [removingToken, setRemovingToken] = useState<Token | null>(null);
  
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    decimals: '9',
    network: 'TON' as Network,
    contractAddress: '',
  });

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = () => {
    const allTokens = getTokens();
    setTokens(allTokens);
  };

  const handleAddToken = () => {
    try {
      if (!formData.symbol || !formData.name) {
        toast.error('Please fill in all required fields');
        return;
      }

      addToken({
        symbol: formData.symbol.toUpperCase(),
        name: formData.name,
        decimals: parseInt(formData.decimals) || 9,
        network: formData.network,
        contractAddress: formData.contractAddress || undefined,
      });

      toast.success('Token added successfully');
      setShowAddDialog(false);
      setFormData({ symbol: '', name: '', decimals: '9', network: 'TON', contractAddress: '' });
      loadTokens();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add token');
    }
  };

  const handleRemoveToken = (token: Token) => {
    if (token.isNative) {
      toast.error('Cannot remove native token');
      return;
    }
    setRemovingToken(token);
  };

  const confirmRemove = () => {
    if (removingToken) {
      removeToken(removingToken.id);
      toast.success('Token removed');
      setRemovingToken(null);
      loadTokens();
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Token
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-primary/10 rounded-full mb-4">
            <Coins className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Manage Tokens</h1>
          <p className="text-muted-foreground">
            Add or remove tokens from your wallet
          </p>
        </div>

        <div className="space-y-3">
          {tokens.map((token) => (
            <Card key={token.id} className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                  {token.icon || '🪙'}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold flex items-center gap-2">
                    {token.name}
                    {token.isNative && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                        Native
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">{token.symbol}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Network: {token.network}
                  </p>
                  {token.contractAddress && (
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {token.contractAddress}
                    </p>
                  )}
                </div>
                {token.balance && (
                  <div className="text-right">
                    <p className="font-semibold">{token.balance}</p>
                    <p className="text-xs text-muted-foreground">{token.symbol}</p>
                  </div>
                )}
                {!token.isNative && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveToken(token)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Token</DialogTitle>
              <DialogDescription>
                Add a token to your wallet by providing its details
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-4">
              <div>
                <Label>Token Symbol *</Label>
                <Input
                  placeholder="e.g., USDC"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                />
              </div>

              <div>
                <Label>Token Name *</Label>
                <Input
                  placeholder="e.g., USD Coin"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <Label>Network *</Label>
                <Select
                  value={formData.network}
                  onValueChange={(value: Network) => setFormData({ ...formData, network: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_NETWORKS.map((network) => (
                      <SelectItem key={network} value={network}>
                        {network}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Decimals</Label>
                <Input
                  type="number"
                  placeholder="9"
                  value={formData.decimals}
                  onChange={(e) => setFormData({ ...formData, decimals: e.target.value })}
                />
              </div>

              <div>
                <Label>Contract Address (Optional)</Label>
                <Input
                  placeholder="EQ..."
                  value={formData.contractAddress}
                  onChange={(e) => setFormData({ ...formData, contractAddress: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty for native tokens
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  setFormData({ symbol: '', name: '', decimals: '9', network: 'TON', contractAddress: '' });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddToken}>Add Token</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!removingToken} onOpenChange={() => setRemovingToken(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Token?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove {removingToken?.name} from your wallet?
                This will not affect your actual balance.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmRemove}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
