/**
 * Chronicle WorkPulse - Live Work Session & Pomodoro Timer
 */

class WorkTimer {
  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.secondsElapsed = 0;
    this.timerInterval = null;
    this.sessionStartTime = null;
    this.mode = 'stopwatch'; // 'stopwatch' | 'pomodoro'
    this.pomodoroTargetSeconds = 25 * 60;
    this.audioContext = null;

    this.initElements();
    this.bindEvents();
    this.restoreSession();
  }

  initElements() {
    this.pill = document.getElementById('header-timer-pill');
    this.displayEl = document.getElementById('timer-display');
    this.startBtn = document.getElementById('timer-start-btn');
    this.pauseBtn = document.getElementById('timer-pause-btn');
    this.logBtn = document.getElementById('timer-log-btn');
    this.resetBtn = document.getElementById('timer-reset-btn');
    this.taskNameInput = document.getElementById('quick-timer-task');
  }

  bindEvents() {
    if (this.startBtn) {
      this.startBtn.addEventListener('click', () => this.start());
    }
    if (this.pauseBtn) {
      this.pauseBtn.addEventListener('click', () => this.togglePause());
    }
    if (this.logBtn) {
      this.logBtn.addEventListener('click', () => this.logSession());
    }
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => this.reset());
    }
  }

  playChime(type = 'start') {
    if (!window.workStorage?.settings?.soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      const now = this.audioContext.currentTime;

      if (type === 'start') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.36);
      } else if (type === 'complete') {
        // High melodic chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.12); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
        osc.start(now);
        osc.stop(now + 0.66);
      } else if (type === 'pause') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(330, now + 0.15);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.21);
      }
    } catch (e) {
      // Audio autoplay policy may prevent until user gesture
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    if (!this.sessionStartTime) {
      this.sessionStartTime = new Date();
    }
    this.playChime('start');
    this.updateUI();

    this.timerInterval = setInterval(() => {
      this.secondsElapsed++;
      this.updateDisplay();
      this.saveSession();

      if (this.mode === 'pomodoro' && this.secondsElapsed >= this.pomodoroTargetSeconds) {
        this.onPomodoroComplete();
      }
    }, 1000);
  }

  togglePause() {
    if (!this.isRunning) return;
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      clearInterval(this.timerInterval);
      this.playChime('pause');
      window.showToast?.('Timer paused', 'info');
    } else {
      this.playChime('start');
      this.timerInterval = setInterval(() => {
        this.secondsElapsed++;
        this.updateDisplay();
        this.saveSession();
      }, 1000);
      window.showToast?.('Timer resumed', 'info');
    }
    this.updateUI();
  }

  reset() {
    clearInterval(this.timerInterval);
    this.isRunning = false;
    this.isPaused = false;
    this.secondsElapsed = 0;
    this.sessionStartTime = null;
    sessionStorage.removeItem('chronicle_timer_state');
    this.updateDisplay();
    this.updateUI();
  }

  onPomodoroComplete() {
    this.togglePause();
    this.playChime('complete');
    window.showToast?.('🎉 Focus interval complete! Take a 5 minute break or log your work.', 'success');
  }

  logSession() {
    if (this.secondsElapsed < 60) {
      window.showToast?.('Session is under 1 minute. Let timer run longer before logging.', 'error');
      return;
    }

    const durationMinutes = Math.max(1, Math.round(this.secondsElapsed / 60));
    const now = new Date();
    const start = this.sessionStartTime || new Date(now.getTime() - this.secondsElapsed * 1000);

    const pad = (n) => String(n).padStart(2, '0');
    const startTimeStr = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
    const endTimeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const dateStr = start.toISOString().split('T')[0];

    const currentTitle = this.taskNameInput?.value?.trim() || '';

    // Stop and reset timer
    this.reset();

    // Trigger modal opening with pre-filled fields
    if (window.workApp) {
      window.workApp.openLogModal({
        title: currentTitle,
        date: dateStr,
        startTime: startTimeStr,
        endTime: endTimeStr,
        durationMinutes: durationMinutes
      });
    }
  }

  formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  }

  updateDisplay() {
    if (this.displayEl) {
      this.displayEl.textContent = this.formatTime(this.secondsElapsed);
    }
  }

  updateUI() {
    if (!this.pill) return;
    if (this.isRunning && !this.isPaused) {
      this.pill.classList.add('is-active');
      if (this.startBtn) this.startBtn.style.display = 'none';
      if (this.pauseBtn) {
        this.pauseBtn.style.display = 'inline-flex';
        this.pauseBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
        `;
        this.pauseBtn.title = "Pause Timer";
      }
      if (this.logBtn) this.logBtn.style.display = 'inline-flex';
      if (this.resetBtn) this.resetBtn.style.display = 'inline-flex';
    } else if (this.isRunning && this.isPaused) {
      this.pill.classList.remove('is-active');
      if (this.pauseBtn) {
        this.pauseBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        `;
        this.pauseBtn.title = "Resume Timer";
      }
    } else {
      this.pill.classList.remove('is-active');
      if (this.startBtn) this.startBtn.style.display = 'inline-flex';
      if (this.pauseBtn) this.pauseBtn.style.display = 'none';
      if (this.logBtn) this.logBtn.style.display = 'none';
      if (this.resetBtn) this.resetBtn.style.display = 'none';
    }
  }

  saveSession() {
    try {
      const state = {
        secondsElapsed: this.secondsElapsed,
        isRunning: this.isRunning,
        isPaused: this.isPaused,
        sessionStartTime: this.sessionStartTime ? this.sessionStartTime.toISOString() : null,
        taskName: this.taskNameInput?.value || ''
      };
      sessionStorage.setItem('chronicle_timer_state', JSON.stringify(state));
    } catch (e) {}
  }

  restoreSession() {
    try {
      const raw = sessionStorage.getItem('chronicle_timer_state');
      if (raw) {
        const state = JSON.parse(raw);
        this.secondsElapsed = state.secondsElapsed || 0;
        this.sessionStartTime = state.sessionStartTime ? new Date(state.sessionStartTime) : null;
        if (this.taskNameInput && state.taskName) {
          this.taskNameInput.value = state.taskName;
        }
        this.updateDisplay();
        if (state.isRunning && !state.isPaused) {
          this.start();
        } else if (state.isRunning && state.isPaused) {
          this.isRunning = true;
          this.isPaused = true;
          this.updateUI();
        }
      }
    } catch (e) {}
  }
}

window.WorkTimer = WorkTimer;
