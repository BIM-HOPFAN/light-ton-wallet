import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { financialNotificationService, FinancialNotification } from '@/lib/transactionNotifications';
import { useNotifications } from './useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Comprehensive hook to monitor all financial activities and send notifications
 */
export function useFinancialNotifications() {
  const { user } = useAuth();
  const { sendNotification, permission } = useNotifications();
  const [notifications, setNotifications] = useState<FinancialNotification[]>([]);

  useEffect(() => {
    if (!user) return;

    // Load existing notifications
    const existing = financialNotificationService.getNotifications(user.id);
    setNotifications(existing);

    // Subscribe to new notifications
    const unsubscribe = financialNotificationService.subscribe(user.id, (notification) => {
      setNotifications(prev => [notification, ...prev]);

      // Show toast
      toast.success(notification.title, {
        description: notification.message,
      });

      // Send browser notification if permission granted
      if (permission === 'granted') {
        sendNotification(notification.title, {
          body: notification.message,
          icon: '/pwa-192x192.png',
          badge: '/favicon.png',
          tag: notification.type,
        });
      }
    });

    // Set up realtime listeners for database changes
    const setupRealtimeListeners = () => {
      // Banking transactions
      const bankingChannel = supabase
        .channel('banking_transactions')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'banking_transactions',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const tx = payload.new as any;
            if (tx.type === 'deposit') {
              financialNotificationService.createNotification(
                user.id,
                'bank_deposit',
                'Bank Deposit Received',
                `₦${parseFloat(tx.amount).toLocaleString()} deposited to your account`,
                { amount: tx.amount, token: 'NGN' }
              );
            } else if (tx.type === 'withdrawal') {
              financialNotificationService.createNotification(
                user.id,
                'bank_withdrawal',
                'Bank Withdrawal Processed',
                `₦${parseFloat(tx.amount).toLocaleString()} withdrawn from your account`,
                { amount: tx.amount, token: 'NGN' }
              );
            }
          }
        )
        .subscribe();

      // Orders
      const ordersChannel = supabase
        .channel('orders_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `buyer_id=eq.${user.id}`,
          },
          (payload) => {
            const order = payload.new as any;
            if (payload.eventType === 'INSERT') {
              financialNotificationService.createNotification(
                user.id,
                'order_placed',
                'Order Placed Successfully',
                `Your order has been placed and is awaiting seller confirmation`,
                { amount: order.total_bimcoin.toString(), token: 'BIMCOIN' }
              );
            } else if (payload.eventType === 'UPDATE') {
              if (order.status === 'in_transit') {
                financialNotificationService.createNotification(
                  user.id,
                  'order_shipped',
                  'Order Shipped',
                  `Your order is on the way! Track: ${order.tracking_number || 'N/A'}`,
                  { amount: order.total_bimcoin.toString(), token: 'BIMCOIN' }
                );
              } else if (order.status === 'completed') {
                financialNotificationService.createNotification(
                  user.id,
                  'order_delivered',
                  'Order Delivered',
                  'Your order has been marked as delivered',
                  { amount: order.total_bimcoin.toString(), token: 'BIMCOIN' }
                );
              }
            }
          }
        )
        .subscribe();

      // Seller orders
      const sellerOrdersChannel = supabase
        .channel('seller_orders_changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `seller_id=eq.${user.id}`,
          },
          (payload) => {
            const order = payload.new as any;
            if (order.status === 'completed' && order.escrow_released_at) {
              financialNotificationService.createNotification(
                user.id,
                'escrow_released',
                'Payment Received',
                `${order.total_bimcoin} BIMCOIN released from escrow`,
                { amount: order.total_bimcoin.toString(), token: 'BIMCOIN' }
              );
            } else if (order.status === 'escrow_locked') {
              financialNotificationService.createNotification(
                user.id,
                'escrow_locked',
                'New Order Received',
                `Payment locked in escrow. Prepare shipment.`,
                { amount: order.total_bimcoin.toString(), token: 'BIMCOIN' }
              );
            }
          }
        )
        .subscribe();

      // Transaction history (wallet activity)
      const transactionChannel = supabase
        .channel('transaction_history')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'transaction_history',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const tx = payload.new as any;
            if (tx.type === 'send') {
              financialNotificationService.createNotification(
                user.id,
                'wallet_send',
                'Transaction Sent',
                `${tx.amount} ${tx.token} sent successfully`,
                { amount: tx.amount, token: tx.token }
              );
            } else if (tx.type === 'receive') {
              financialNotificationService.createNotification(
                user.id,
                'wallet_receive',
                'Payment Received',
                `${tx.amount} ${tx.token} received`,
                { amount: tx.amount, token: tx.token }
              );
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(bankingChannel);
        supabase.removeChannel(ordersChannel);
        supabase.removeChannel(sellerOrdersChannel);
        supabase.removeChannel(transactionChannel);
      };
    };

    const cleanupRealtime = setupRealtimeListeners();

    return () => {
      unsubscribe();
      cleanupRealtime();
    };
  }, [user, sendNotification, permission]);

  const markAsRead = (notificationId: string) => {
    if (!user) return;
    financialNotificationService.markAsRead(user.id, notificationId);
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    if (!user) return;
    financialNotificationService.markAllAsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    if (!user) return;
    financialNotificationService.clearAll(user.id);
    setNotifications([]);
  };

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}
