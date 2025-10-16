// Phase 2: Auto-lock timer functionality
export class AutoLockService {
  private lockTimer: NodeJS.Timeout | null = null;
  private lockTimeoutMinutes: number = 5;
  private onLockCallback: (() => void) | null = null;

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
      clearTimeout(this.lockTimer);
    }

    if (this.lockTimeoutMinutes > 0) {
      this.lockTimer = setTimeout(() => {
        if (this.onLockCallback) {
          this.onLockCallback();
        }
      }, this.lockTimeoutMinutes * 60 * 1000);
    }
  }

  stopTimer() {
    if (this.lockTimer) {
      clearTimeout(this.lockTimer);
      this.lockTimer = null;
    }
  }

  setupActivityListeners() {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => {
      document.addEventListener(event, () => this.resetTimer());
    });
  }

  removeActivityListeners() {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => {
      document.removeEventListener(event, () => this.resetTimer());
    });
  }
}

export const autoLockService = new AutoLockService();
