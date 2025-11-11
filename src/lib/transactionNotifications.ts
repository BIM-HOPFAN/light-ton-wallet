// Transaction notification system using localStorage
export interface TransactionNotification {
  id: string;
  user_id: string;
  type: 'send' | 'receive' | 'swap' | 'escrow';
  title: string;
  message: string;
  amount?: string;
  token?: string;
  read: boolean;
  created_at: string;
}

class TransactionNotificationService {
  private listeners: Set<(notification: TransactionNotification) => void> = new Set();
  private STORAGE_KEY = 'transaction_notifications';

  // Subscribe to transaction notifications
  subscribe(userId: string, onNotification: (notification: TransactionNotification) => void) {
    this.listeners.add(onNotification);

    // Load existing unread notifications
    const notifications = this.getNotifications(userId);
    const unread = notifications.filter(n => !n.read);
    unread.forEach(notification => this.notifyListeners(notification));

    // Start polling for new notifications (simpler than realtime)
    const interval = setInterval(() => {
      const current = this.getNotifications(userId);
      const newUnread = current.filter(n => !n.read);
      newUnread.forEach(notification => {
        // Only notify if not already notified
        if (!this.hasNotified(notification.id)) {
          this.notifyListeners(notification);
          this.markAsNotified(notification.id);
        }
      });
    }, 5000); // Check every 5 seconds

    return () => {
      clearInterval(interval);
    };
  }

  unsubscribe(onNotification: (notification: TransactionNotification) => void) {
    this.listeners.delete(onNotification);
  }

  private notifyListeners(notification: TransactionNotification) {
    this.listeners.forEach(listener => listener(notification));
  }

  private getNotifications(userId: string): TransactionNotification[] {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveNotifications(userId: string, notifications: TransactionNotification[]) {
    localStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(notifications));
  }

  private hasNotified(id: string): boolean {
    const notified = localStorage.getItem('notified_ids');
    if (!notified) return false;
    return JSON.parse(notified).includes(id);
  }

  private markAsNotified(id: string) {
    const notified = localStorage.getItem('notified_ids');
    const ids = notified ? JSON.parse(notified) : [];
    ids.push(id);
    localStorage.setItem('notified_ids', JSON.stringify(ids));
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
    type: TransactionNotification['type'],
    title: string,
    message: string,
    options?: { amount?: string; token?: string }
  ) {
    const notification: TransactionNotification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      type,
      title,
      message,
      amount: options?.amount,
      token: options?.token,
      read: false,
      created_at: new Date().toISOString(),
    };

    const notifications = this.getNotifications(userId);
    notifications.unshift(notification);
    
    // Keep only last 50 notifications
    if (notifications.length > 50) {
      notifications.splice(50);
    }
    
    this.saveNotifications(userId, notifications);
    this.notifyListeners(notification);
  }
}

export const transactionNotificationService = new TransactionNotificationService();
