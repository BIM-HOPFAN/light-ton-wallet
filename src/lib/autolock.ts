// Auto-lock timer with persistent session tracking
const LAST_ACTIVITY_KEY = 'wallet_last_activity';
const LOCK_TIMEOUT_KEY = 'wallet_lock_timeout_minutes';

export class AutoLockService {
  private lockTimer: number | null = null;
  private lockTimeoutMinutes: number = 5;
  private onLockCallback: (() => void) | null = null;
  private boundResetTimer: () => void;

  constructor() {
    this.boundResetTimer = this.resetTimer.bind(this);
    // Load saved timeout setting
    const savedTimeout = localStorage.getItem(LOCK_TIMEOUT_KEY);
    if (savedTimeout) {
      this.lockTimeoutMinutes = parseInt(savedTimeout, 10);
    }
  }

  setLockTimeout(minutes: number) {
    this.lockTimeoutMinutes = minutes;
    localStorage.setItem(LOCK_TIMEOUT_KEY, minutes.toString());
  }

  setOnLockCallback(callback: () => void) {
    this.onLockCallback = callback;
  }

  // Check if session should be locked based on last activity
  shouldLock(): boolean {
    if (this.lockTimeoutMinutes === 0) return false;
    
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (!lastActivity) return false;

    const lastActivityTime = parseInt(lastActivity, 10);
    const currentTime = Date.now();
    const timeDiff = currentTime - lastActivityTime;
    const timeoutMs = this.lockTimeoutMinutes * 60 * 1000;

    return timeDiff > timeoutMs;
  }

  updateLastActivity() {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  }

  startTimer() {
    this.updateLastActivity();
    this.resetTimer();
  }

  resetTimer() {
    this.updateLastActivity();
    
    if (this.lockTimer) {
      window.clearTimeout(this.lockTimer);
    }

    if (this.lockTimeoutMinutes > 0) {
      this.lockTimer = window.setTimeout(() => {
        if (this.onLockCallback) {
          this.onLockCallback();
        }
      }, this.lockTimeoutMinutes * 60 * 1000);
    }
  }

  stopTimer() {
    if (this.lockTimer) {
      window.clearTimeout(this.lockTimer);
      this.lockTimer = null;
    }
  }

  clearSession() {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  }

  setupActivityListeners() {
    const events: (keyof DocumentEventMap)[] = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => {
      document.addEventListener(event, this.boundResetTimer, { passive: true });
    });
  }

  removeActivityListeners() {
    const events: (keyof DocumentEventMap)[] = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => {
      document.removeEventListener(event, this.boundResetTimer);
    });
  }
}

export const autoLockService = new AutoLockService();
