// Auto-lock timer with proper cleanup
export class AutoLockService {
  private lockTimer: number | null = null;
  private lockTimeoutMinutes: number = 5;
  private onLockCallback: (() => void) | null = null;
  private boundResetTimer: () => void;

  constructor() {
    this.boundResetTimer = this.resetTimer.bind(this);
  }

  setLockTimeout(minutes: number) {
    this.lockTimeoutMinutes = minutes;
  }

  setOnLockCallback(callback: () => void) {
    this.onLockCallback = callback;
  }

  startTimer() {
    this.resetTimer();
  }

  resetTimer() {
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
