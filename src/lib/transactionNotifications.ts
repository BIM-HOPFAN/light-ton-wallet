// Comprehensive financial notification system
export interface FinancialNotification {
  id: string;
  user_id: string;
  type: 'wallet_send' | 'wallet_receive' | 'swap' | 'bank_deposit' | 'bank_withdrawal' | 'order_placed' | 'order_shipped' | 'order_delivered' | 'escrow_locked' | 'escrow_released';
  title: string;
  message: string;
  amount?: string;
  token?: string;
  read: boolean;
  created_at: string;
  data?: any;
}

class FinancialNotificationService {
  private listeners: Set<(notification: FinancialNotification) => void> = new Set();
  private STORAGE_KEY = 'financial_notifications';

  // Subscribe to financial notifications
  subscribe(userId: string, onNotification: (notification: FinancialNotification) => void) {
    this.listeners.add(onNotification);

    // Load existing unread notifications
    const notifications = this.getNotifications(userId);
    const unread = notifications.filter(n => !n.read);
    unread.forEach(notification => this.notifyListeners(notification));

    return () => {
      this.listeners.delete(onNotification);
    };
  }

  unsubscribe(onNotification: (notification: FinancialNotification) => void) {
    this.listeners.delete(onNotification);
  }

  private notifyListeners(notification: FinancialNotification) {
    this.listeners.forEach(listener => listener(notification));
  }

  getNotifications(userId: string): FinancialNotification[] {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveNotifications(userId: string, notifications: FinancialNotification[]) {
    localStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(notifications));
  }

  // Mark notification as read
  markAsRead(userId: string, notificationId: string) {
    const notifications = this.getNotifications(userId);
    const updated = notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    this.saveNotifications(userId, updated);
  }

  // Mark all notifications as read
  markAllAsRead(userId: string) {
    const notifications = this.getNotifications(userId);
    const updated = notifications.map(n => ({ ...n, read: true }));
    this.saveNotifications(userId, updated);
  }

  // Create a new notification
  createNotification(
    userId: string,
    type: FinancialNotification['type'],
    title: string,
    message: string,
    options?: { amount?: string; token?: string; data?: any }
  ) {
    const notification: FinancialNotification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      type,
      title,
      message,
      amount: options?.amount,
      token: options?.token,
      read: false,
      created_at: new Date().toISOString(),
      data: options?.data,
    };

    const notifications = this.getNotifications(userId);
    notifications.unshift(notification);
    
    // Keep only last 100 notifications
    if (notifications.length > 100) {
      notifications.splice(100);
    }
    
    this.saveNotifications(userId, notifications);
    this.notifyListeners(notification);
  }

  // Clear all notifications
  clearAll(userId: string) {
    this.saveNotifications(userId, []);
  }
}

export const financialNotificationService = new FinancialNotificationService();
