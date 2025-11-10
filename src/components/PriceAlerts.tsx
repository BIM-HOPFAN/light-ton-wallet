import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, BellOff, Trash2, Plus } from 'lucide-react';
import { usePriceAlerts } from '@/hooks/usePriceAlerts';
import { useAuth } from '@/contexts/AuthContext';
import { Currency } from '@/lib/currency';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';

export function PriceAlerts() {
  const { user } = useAuth();
  const { alerts, isLoading, createAlert, deleteAlert, toggleAlert } = usePriceAlerts(user?.id);
  const [showForm, setShowForm] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [condition, setCondition] = useState<'above' | 'below'>('above');

  const handleCreateAlert = async () => {
    if (!targetPrice || parseFloat(targetPrice) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      await createAlert(parseFloat(targetPrice), currency, condition);
      toast.success('Price alert created');
      setTargetPrice('');
      setShowForm(false);
    } catch (error) {
      toast.error('Failed to create alert');
    }
  };

  const handleDelete = async (alertId: string) => {
    try {
      await deleteAlert(alertId);
      toast.success('Alert deleted');
    } catch (error) {
      toast.error('Failed to delete alert');
    }
  };

  const handleToggle = async (alertId: string, isActive: boolean) => {
    try {
      await toggleAlert(alertId, !isActive);
      toast.success(isActive ? 'Alert disabled' : 'Alert enabled');
    } catch (error) {
      toast.error('Failed to update alert');
    }
  };

  if (!user) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">Sign in to set price alerts</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6 space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h3 className="font-semibold">Price Alerts</h3>
        </div>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? 'ghost' : 'default'}
        >
          <Plus className="h-4 w-4 mr-1" />
          {showForm ? 'Cancel' : 'New Alert'}
        </Button>
      </div>

      {showForm && (
        <div className="mb-4 p-4 border rounded-lg space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Condition</label>
              <Select value={condition} onValueChange={(val) => setCondition(val as 'above' | 'below')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">Price goes above</SelectItem>
                  <SelectItem value="below">Price drops below</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Currency</label>
              <Select value={currency} onValueChange={(val) => setCurrency(val as Currency)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="JPY">JPY</SelectItem>
                  <SelectItem value="RUB">RUB</SelectItem>
                  <SelectItem value="NGN">NGN</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Target Price</label>
            <Input
              type="number"
              step="0.01"
              placeholder="Enter target price"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
            />
          </div>
          <Button onClick={handleCreateAlert} className="w-full">
            Create Alert
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No alerts yet. Create one to get notified!
          </p>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
            >
              <div className="flex items-center gap-3">
                {alert.is_active ? (
                  <Bell className="h-4 w-4 text-primary" />
                ) : (
                  <BellOff className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {alert.condition === 'above' ? 'Above' : 'Below'} ${alert.target_price.toFixed(2)} {alert.currency}
                  </p>
                  {alert.triggered_at && (
                    <p className="text-xs text-muted-foreground">
                      Triggered {new Date(alert.triggered_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={alert.is_active}
                  onCheckedChange={() => handleToggle(alert.id, alert.is_active)}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(alert.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
