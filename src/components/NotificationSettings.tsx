import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, BellOff } from 'lucide-react';
import { useState, useEffect } from 'react';

export function NotificationSettings() {
  const { permission, isSupported, requestPermission, sendNotification } = useNotifications();
  const [settings, setSettings] = useState({
    transactions: true,
    priceAlerts: false,
    security: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem('notification_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const updateSetting = (key: string, value: boolean) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    localStorage.setItem('notification_settings', JSON.stringify(updated));
  };

  const handleTestNotification = () => {
    sendNotification('Test Notification', {
      body: 'Notifications are working correctly!',
      tag: 'test',
    });
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {permission === 'granted' ? (
              <Bell className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <h3 className="font-semibold">Push Notifications</h3>
              <p className="text-sm text-muted-foreground">
                {!isSupported && 'Not supported in this browser'}
                {isSupported && permission === 'default' && 'Click to enable notifications'}
                {isSupported && permission === 'denied' && 'Notifications blocked - enable in browser settings'}
                {isSupported && permission === 'granted' && 'Notifications enabled'}
              </p>
            </div>
          </div>
          {isSupported && permission !== 'granted' && (
            <Button onClick={requestPermission} variant="outline">
              Enable
            </Button>
          )}
        </div>

        {permission === 'granted' && (
          <>
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label htmlFor="transactions" className="flex flex-col gap-1">
                  <span>Transaction Alerts</span>
                  <span className="text-sm text-muted-foreground font-normal">
                    Get notified when you send or receive funds
                  </span>
                </Label>
                <Switch
                  id="transactions"
                  checked={settings.transactions}
                  onCheckedChange={(checked) => updateSetting('transactions', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="price" className="flex flex-col gap-1">
                  <span>Price Alerts</span>
                  <span className="text-sm text-muted-foreground font-normal">
                    Get notified about significant price changes
                  </span>
                </Label>
                <Switch
                  id="price"
                  checked={settings.priceAlerts}
                  onCheckedChange={(checked) => updateSetting('priceAlerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="security" className="flex flex-col gap-1">
                  <span>Security Alerts</span>
                  <span className="text-sm text-muted-foreground font-normal">
                    Get notified about security events
                  </span>
                </Label>
                <Switch
                  id="security"
                  checked={settings.security}
                  onCheckedChange={(checked) => updateSetting('security', checked)}
                />
              </div>
            </div>

            <Button onClick={handleTestNotification} variant="outline" className="w-full">
              Send Test Notification
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
