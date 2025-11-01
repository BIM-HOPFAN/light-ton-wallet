import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { transactionNotificationService, TransactionNotification } from '@/lib/transactionNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNotifications } from '@/hooks/useNotifications';

export function TransactionNotificationBadge() {
  const { user } = useAuth();
  const { sendNotification, permission } = useNotifications();
  const [notifications, setNotifications] = useState<TransactionNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const handleNotification = (notification: TransactionNotification) => {
      setNotifications(prev => {
        // Avoid duplicates
        if (prev.some(n => n.id === notification.id)) return prev;
        return [notification, ...prev];
      });
      
      if (!notification.read) {
        setUnreadCount(prev => prev + 1);

        // Show toast notification
        toast.success(notification.title, {
          description: notification.message,
        });

        // Show browser notification if enabled
        if (permission === 'granted') {
          sendNotification(notification.title, {
            body: notification.message,
            tag: notification.id,
          });
        }
      }
    };

    const cleanup = transactionNotificationService.subscribe(user.id, handleNotification);

    return cleanup;
  }, [user, permission, sendNotification]);

  const markAsRead = (id: string) => {
    if (!user) return;
    transactionNotificationService.markAsRead(user.id, id);
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    if (!user) return;
    transactionNotificationService.markAllAsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notification => (
                <button
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                    !notification.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{notification.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </div>
                      {notification.amount && (
                        <div className="text-xs font-mono mt-1">
                          {notification.amount} {notification.token}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.created_at).toLocaleString()}
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
