import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useFinancialNotifications } from '@/hooks/useFinancialNotifications';
import { cn } from '@/lib/utils';

export function TransactionNotificationBadge() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useFinancialNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'wallet_receive':
        return '💰';
      case 'wallet_send':
        return '📤';
      case 'bank_deposit':
        return '🏦';
      case 'bank_withdrawal':
        return '💸';
      case 'order_placed':
        return '🛒';
      case 'order_shipped':
        return '📦';
      case 'order_delivered':
        return '✅';
      case 'escrow_locked':
        return '🔒';
      case 'escrow_released':
        return '🔓';
      default:
        return '🔔';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Financial Activity</h3>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No financial activity yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                  className={cn(
                    'p-4 rounded-lg cursor-pointer transition-all border',
                    notification.read
                      ? 'bg-muted/20 border-transparent'
                      : 'bg-primary/5 hover:bg-primary/10 border-primary/20'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 leading-tight">
                        {notification.message}
                      </p>
                      {notification.amount && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="font-mono">
                            {notification.amount} {notification.token}
                          </Badge>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
