import { ArrowGame, THEMES } from './game.js';
import { generateLevel, getDailyChallengeLevel, isHardLevel, getHardShapeForLevel } from './levels.js';
import { soundManager } from './sounds.js';

// Local storage keys
const STORAGE_KEY = 'arrows_game_state_v1';

export class UIManager {
  constructor() {
    this.state = this.loadState();
    this.game = null;
    this.currentView = 'splash'; // splash, home, game, challenge, collection, settings
    this.selectedDailyDay = new Date().getDate();
    this.selectedDailyMonth = new Date().getMonth();
    this.selectedDailyYear = 2026;

    this.initAudioAndSettings();
    this.bindDOM();
    this.setupSplashScreen();
  }

  loadState() {
    const defaultState = {
      level: 1,
      maxLevelReached: 1,
      streak: 1,
      lastPlayDate: new Date().toDateString(),
      completedDailyChallenges: {}, // key: "YYYY-MM-DD"
      theme: 'mint',
      sound: true,
      music: false,
      vibration: true,
      voice: true,
      guidelines: true,
      records: {
        longestStreak: 1,
        highestWinStreak: 10,
        mostWins: 19
      },
      awards: {
        levelLegend: false,
        perfectPlay: 1,
        unstoppable: false,
        leagueClimber: true,
        leagueFighter: false,
        leagueWinner: false
      }
    };

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...defaultState, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Could not read state from localStorage', e);
    }
    return defaultState;
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Could not save state to localStorage', e);
    }
  }

  initAudioAndSettings() {
    soundManager.init({
      sound: this.state.sound,
      music: this.state.music,
      vibration: this.state.vibration,
      voice: this.state.voice
    });
  }

  bindDOM() {
    // Canvas setup
    const canvas = document.getElementById('game-canvas');
    this.game = new ArrowGame(canvas, {
      showGuidelines: this.state.guidelines,
      onLivesChange: (lives) => this.renderDroplets(lives),
      onTimeUpdate: (seconds) => {
        const timeEl = document.getElementById('in-game-timer');
        if (timeEl) {
          const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
          const secs = String(seconds % 60).padStart(2, '0');
          timeEl.textContent = `${mins}:${secs}`;
        }
      },
      onVictory: (stats) => this.showVictoryModal(stats),
      onGameOver: (stats) => this.showGameOverModal(stats),
      onThemeChange: (theme) => this.applyThemeToDOM(theme)
    });

    this.game.setTheme(this.state.theme);

    // Navigation buttons
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetView = btn.getAttribute('data-nav');
        this.navigateTo(targetView);
      });
    });

    // Home Play button
    const homePlayBtn = document.getElementById('home-play-btn');
    if (homePlayBtn) {
      homePlayBtn.addEventListener('click', () => {
        soundManager.playTap();
        this.startLevel(this.state.level);
      });
    }

    // Home Daily Card Play button
    const homeDailyPlayBtn = document.getElementById('home-daily-play-btn');
    if (homeDailyPlayBtn) {
      homeDailyPlayBtn.addEventListener('click', () => {
        soundManager.playTap();
        if (this.state.level < 20) {
          this.showLockToast('Daily Challenge unlocks at Level 20! Keep playing.');
          return;
        }
        this.startDailyChallenge(new Date().getDate());
      });
    }

    // Level selector button / jump
    const levelJumpBtn = document.getElementById('level-jump-btn');
    if (levelJumpBtn) {
      levelJumpBtn.addEventListener('click', () => {
        this.showLevelSelectModal();
      });
    }

    // Streak pill
    const streakBadge = document.getElementById('home-streak-badge');
    if (streakBadge) {
      streakBadge.addEventListener('click', () => {
        soundManager.playTap();
        this.showStreakModal();
      });
    }

    // In-game top bar buttons
    const gameBackBtn = document.getElementById('game-back-btn');
    if (gameBackBtn) {
      gameBackBtn.addEventListener('click', () => {
        soundManager.playTap();
        this.navigateTo('home');
      });
    }

    const gameRestartBtn = document.getElementById('game-restart-btn');
    if (gameRestartBtn) {
      gameRestartBtn.addEventListener('click', () => {
        soundManager.playTap();
        this.game.restartLevel();
      });
    }

    const gamePaletteBtn = document.getElementById('game-palette-btn');
    if (gamePaletteBtn) {
      gamePaletteBtn.addEventListener('click', () => {
        soundManager.playTap();
        this.toggleThemePicker();
      });
    }

    const gameSettingsBtn = document.getElementById('game-settings-btn');
    if (gameSettingsBtn) {
      gameSettingsBtn.addEventListener('click', () => {
        soundManager.playTap();
        this.showInGameSettingsModal();
      });
    }

    const gameHintBtn = document.getElementById('game-hint-btn');
    if (gameHintBtn) {
      gameHintBtn.addEventListener('click', () => {
        soundManager.playTap();
        const success = this.game.useHint();
        if (!success) {
          this.showToast('No safe moves right now! Look closely.');
        }
      });
    }

    // Theme selector swatches
    document.querySelectorAll('[data-theme-choice]').forEach(el => {
      el.addEventListener('click', () => {
        const themeId = el.getAttribute('data-theme-choice');
        this.setTheme(themeId);
        document.getElementById('theme-picker-popup')?.classList.add('hidden');
      });
    });

    // Settings screen switches
    this.setupSettingsSwitches();

    // Challenge screen controls
    this.setupChallengeScreen();

    // Generic modal close buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        soundManager.playTap();
        const modalId = btn.getAttribute('data-close-modal');
        document.getElementById(modalId)?.classList.add('hidden');
      });
    });
  }

  setupSplashScreen() {
    const splash = document.getElementById('splash-screen');
    const progressBar = document.getElementById('splash-loading-line');
    const loadingPercent = document.getElementById('splash-loading-percent');

    let progress = 0;
    const interval = setInterval(() => {
      progress += 4;
      if (progressBar) progressBar.style.width = `${progress}%`;
      if (loadingPercent) loadingPercent.textContent = `${Math.min(100, progress)}%`;

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          splash.classList.add('fade-out');
          setTimeout(() => {
            splash.classList.add('hidden');
            this.navigateTo('home');
          }, 450);
        }, 200);
      }
    }, 40);
  }

  navigateTo(viewName) {
    // Check level locks for Collection and Challenges
    if (viewName === 'collection' && this.state.level < 8) {
      this.showLockToast('Collection unlocks at Level 8! Clear 8 levels to view your trophies.');
      return;
    }
    if (viewName === 'challenge' && this.state.level < 20) {
      this.showLockToast('Daily Challenge unlocks at Level 20! Keep playing.');
      return;
    }

    this.currentView = viewName;

    // Hide all view screens
    ['home-screen', 'game-screen', 'challenge-screen', 'collection-screen', 'settings-screen'].forEach(id => {
      document.getElementById(id)?.classList.add('hidden');
    });

    // Update active tab in bottom nav
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
      if (item.getAttribute('data-nav') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Show active screen
    const targetEl = document.getElementById(`${viewName}-screen`);
    if (targetEl) {
      targetEl.classList.remove('hidden');
    }

    // Update screen specific state
    if (viewName === 'home') {
      this.renderHomeScreen();
    } else if (viewName === 'challenge') {
      this.renderChallengeScreen();
    } else if (viewName === 'collection') {
      this.renderCollectionScreen();
    } else if (viewName === 'settings') {
      this.renderSettingsScreen();
    }

    // Toggle bottom nav visibility (visible on home, challenge, collection, settings; hidden on game screen)
    const bottomNav = document.getElementById('bottom-navigation');
    if (bottomNav) {
      if (viewName === 'game') {
        bottomNav.classList.add('hidden');
      } else {
        bottomNav.classList.remove('hidden');
      }
    }
  }

  renderHomeScreen() {
    // Update Streak
    const streakEl = document.getElementById('streak-count-val');
    if (streakEl) streakEl.textContent = this.state.streak;

    // Update Level and Difficulty
    const levelNumberEl = document.getElementById('home-level-number');
    if (levelNumberEl) levelNumberEl.textContent = `Level ${this.state.level}`;

    const diffBadge = document.getElementById('home-difficulty-badge');
    const isHard = isHardLevel(this.state.level);
    if (diffBadge) {
      if (isHard) {
        const shape = getHardShapeForLevel(this.state.level);
        diffBadge.textContent = `Hard (${shape || 'Maze'})`;
        diffBadge.className = 'difficulty-pill hard';
      } else {
        diffBadge.textContent = 'Normal';
        diffBadge.className = 'difficulty-pill normal';
      }
    }

    // Update Daily Challenge Card state (locked or unlocked)
    const dailyCard = document.getElementById('home-daily-card');
    const dailyLockOverlay = document.getElementById('home-daily-lock-overlay');
    if (this.state.level < 20) {
      if (dailyLockOverlay) dailyLockOverlay.classList.remove('hidden');
    } else {
      if (dailyLockOverlay) dailyLockOverlay.classList.add('hidden');
    }

    // Update locks on bottom nav icons
    const collectionNavLock = document.getElementById('nav-collection-lock');
    if (collectionNavLock) {
      collectionNavLock.style.display = this.state.level < 8 ? 'inline-block' : 'none';
    }
    const challengeNavLock = document.getElementById('nav-challenge-lock');
    if (challengeNavLock) {
      challengeNavLock.style.display = this.state.level < 20 ? 'inline-block' : 'none';
    }
  }

  startLevel(levelNum) {
    const levelData = generateLevel(levelNum);
    this.navigateTo('game');

    // Update In-Game Header
    const titleEl = document.getElementById('in-game-title');
    if (titleEl) titleEl.textContent = `Level ${levelNum}`;

    const subtitleEl = document.getElementById('in-game-subtitle');
    if (subtitleEl) {
      if (levelData.difficulty === 'Hard') {
        subtitleEl.textContent = 'Hard';
        subtitleEl.style.color = '#8b5cf6';
      } else {
        subtitleEl.textContent = 'Normal';
        subtitleEl.style.color = 'inherit';
      }
    }

    // Show "Pinch to zoom" guidance if hard level
    const zoomNotice = document.getElementById('zoom-notice-toast');
    if (zoomNotice) {
      if (levelData.difficulty === 'Hard' || levelData.arrows.length > 15) {
        zoomNotice.classList.remove('hidden');
        setTimeout(() => zoomNotice.classList.add('hidden'), 3200);
      } else {
        zoomNotice.classList.add('hidden');
      }
    }

    this.game.loadLevel(levelData);
  }

  startDailyChallenge(day) {
    const dailyData = getDailyChallengeLevel(this.selectedDailyYear, this.selectedDailyMonth + 1, day);
    this.navigateTo('game');

    const titleEl = document.getElementById('in-game-title');
    if (titleEl) titleEl.textContent = `Daily ${day}`;

    const subtitleEl = document.getElementById('in-game-subtitle');
    if (subtitleEl) {
      subtitleEl.textContent = 'Challenge';
      subtitleEl.style.color = '#10b981';
    }

    this.game.loadLevel(dailyData);
  }

  // RED DROPLETS ( Mistouches / Lives ) - Explicit requirement: "and the droplets in game red which are blue in photos"
  renderDroplets(livesRemaining) {
    const container = document.getElementById('game-droplets-container');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 0; i < 3; i++) {
      const drop = document.createElement('span');
      drop.className = `droplet-icon ${i < livesRemaining ? 'active' : 'empty'}`;
      // SVG red droplet icon
      drop.innerHTML = `
        <svg viewBox="0 0 24 24" width="22" height="22" fill="${i < livesRemaining ? '#ef4444' : '#cbd5e1'}">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
      `;
      container.appendChild(drop);
    }
  }

  toggleThemePicker() {
    const popup = document.getElementById('theme-picker-popup');
    popup?.classList.toggle('hidden');
  }

  setTheme(themeId) {
    this.state.theme = themeId;
    this.saveState();
    this.game.setTheme(themeId);
    this.applyThemeToDOM(THEMES[themeId]);
  }

  applyThemeToDOM(theme) {
    if (!theme) return;
    document.documentElement.style.setProperty('--game-bg', theme.bg);
    document.documentElement.style.setProperty('--game-text', theme.textColor);
    document.documentElement.style.setProperty('--game-accent', theme.accent);

    // Active indicator in theme picker
    document.querySelectorAll('[data-theme-choice]').forEach(el => {
      if (el.getAttribute('data-theme-choice') === theme.id) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
  }

  setupSettingsSwitches() {
    const soundToggle = document.getElementById('setting-sound');
    if (soundToggle) {
      soundToggle.checked = this.state.sound;
      soundToggle.addEventListener('change', (e) => {
        this.state.sound = e.target.checked;
        soundManager.soundEnabled = e.target.checked;
        this.saveState();
      });
    }

    const vibrationToggle = document.getElementById('setting-vibration');
    if (vibrationToggle) {
      vibrationToggle.checked = this.state.vibration;
      vibrationToggle.addEventListener('change', (e) => {
        this.state.vibration = e.target.checked;
        soundManager.vibrationEnabled = e.target.checked;
        this.saveState();
      });
    }

    const musicToggle = document.getElementById('setting-music');
    if (musicToggle) {
      musicToggle.checked = this.state.music;
      musicToggle.addEventListener('change', (e) => {
        this.state.music = e.target.checked;
        soundManager.setMusic(e.target.checked);
        this.saveState();
      });
    }

    const voiceToggle = document.getElementById('setting-voice');
    if (voiceToggle) {
      voiceToggle.checked = this.state.voice;
      voiceToggle.addEventListener('change', (e) => {
        this.state.voice = e.target.checked;
        soundManager.voiceEnabled = e.target.checked;
        this.saveState();
      });
    }

    const guidelineToggle = document.getElementById('setting-guideline');
    if (guidelineToggle) {
      guidelineToggle.checked = this.state.guidelines;
      guidelineToggle.addEventListener('change', (e) => {
        this.state.guidelines = e.target.checked;
        this.game.options.showGuidelines = e.target.checked;
        this.saveState();
      });
    }

    // Modal triggers in settings
    document.getElementById('settings-rate-us-btn')?.addEventListener('click', () => {
      soundManager.playTap();
      document.getElementById('rate-us-modal')?.classList.remove('hidden');
    });

    document.getElementById('settings-feedback-btn')?.addEventListener('click', () => {
      soundManager.playTap();
      document.getElementById('feedback-modal')?.classList.remove('hidden');
    });

    document.getElementById('settings-privacy-btn')?.addEventListener('click', () => {
      soundManager.playTap();
      document.getElementById('privacy-modal')?.classList.remove('hidden');
    });

    document.getElementById('settings-terms-btn')?.addEventListener('click', () => {
      soundManager.playTap();
      document.getElementById('terms-modal')?.classList.remove('hidden');
    });

    // Star rating click handler in Rate Us modal
    document.querySelectorAll('.rate-star').forEach(star => {
      star.addEventListener('click', (e) => {
        soundManager.playTap();
        const rating = parseInt(star.getAttribute('data-star') || '5', 10);
        document.querySelectorAll('.rate-star').forEach(s => {
          const sRating = parseInt(s.getAttribute('data-star') || '0', 10);
          if (sRating <= rating) {
            s.classList.add('active');
          } else {
            s.classList.remove('active');
          }
        });
      });
    });

    document.getElementById('rate-submit-btn')?.addEventListener('click', () => {
      soundManager.playTap();
      this.showToast('Thank you for your rating! ⭐');
      document.getElementById('rate-us-modal')?.classList.add('hidden');
    });
  }

  showInGameSettingsModal() {
    const modal = document.getElementById('in-game-settings-modal');
    if (!modal) return;

    // Sync in-game toggles
    const igSound = document.getElementById('ig-setting-sound');
    if (igSound) igSound.checked = this.state.sound;

    const igVib = document.getElementById('ig-setting-vibration');
    if (igVib) igVib.checked = this.state.vibration;

    const igMusic = document.getElementById('ig-setting-music');
    if (igMusic) igMusic.checked = this.state.music;

    const igVoice = document.getElementById('ig-setting-voice');
    if (igVoice) igVoice.checked = this.state.voice;

    modal.classList.remove('hidden');

    const igRestart = document.getElementById('ig-restart-btn');
    if (igRestart) {
      igRestart.onclick = () => {
        modal.classList.add('hidden');
        this.game.restartLevel();
      };
    }
  }

  setupChallengeScreen() {
    const infoBtn = document.getElementById('challenge-info-btn');
    if (infoBtn) {
      infoBtn.addEventListener('click', () => {
        soundManager.playTap();
        this.showDailyInfoModal();
      });
    }

    const playDailyBtn = document.getElementById('challenge-play-btn');
    if (playDailyBtn) {
      playDailyBtn.addEventListener('click', () => {
        soundManager.playTap();
        this.startDailyChallenge(this.selectedDailyDay);
      });
    }

    // Daily info modal carousel pagination
    const dailyInfoCarouselBtn = document.getElementById('daily-info-continue-btn');
    if (dailyInfoCarouselBtn) {
      dailyInfoCarouselBtn.addEventListener('click', () => {
        soundManager.playTap();
        const slide1 = document.getElementById('daily-slide-1');
        const slide2 = document.getElementById('daily-slide-2');
        const dot1 = document.getElementById('daily-dot-1');
        const dot2 = document.getElementById('daily-dot-2');

        if (!slide1.classList.contains('hidden')) {
          slide1.classList.add('hidden');
          slide2.classList.remove('hidden');
          dot1.classList.remove('active');
          dot2.classList.add('active');
        } else {
          document.getElementById('daily-challenge-info-modal')?.classList.add('hidden');
          slide2.classList.add('hidden');
          slide1.classList.remove('hidden');
          dot2.classList.remove('active');
          dot1.classList.add('active');
        }
      });
    }
  }

  renderChallengeScreen() {
    const calendarGrid = document.getElementById('calendar-days-grid');
    if (!calendarGrid) return;
    calendarGrid.innerHTML = '';

    const daysInMonth = 31;
    // October 2026 starts on Thursday (index 3 if Monday=0)
    const firstDayOffset = 3;

    // Blank cells before day 1
    for (let i = 0; i < firstDayOffset; i++) {
      const blank = document.createElement('div');
      blank.className = 'calendar-day blank';
      calendarGrid.appendChild(blank);
    }

    let completedDotsCount = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayCell = document.createElement('div');
      dayCell.className = 'calendar-day';
      if (day === this.selectedDailyDay) {
        dayCell.classList.add('selected');
      }

      const dateKey = `2026-10-${String(day).padStart(2, '0')}`;
      const isCompleted = this.state.completedDailyChallenges[dateKey];
      if (isCompleted) {
        completedDotsCount++;
      }

      dayCell.innerHTML = `
        <span class="day-number">${day}</span>
        ${isCompleted ? '<span class="green-dot">●</span>' : ''}
      `;

      dayCell.addEventListener('click', () => {
        soundManager.playTap();
        this.selectedDailyDay = day;
        document.querySelectorAll('.calendar-day').forEach(c => c.classList.remove('selected'));
        dayCell.classList.add('selected');
        document.getElementById('challenge-selected-day-text').textContent = `Day ${day} Challenge`;
      });

      calendarGrid.appendChild(dayCell);
    }

    // Update progress bar
    const progressFill = document.getElementById('challenge-progress-fill');
    if (progressFill) {
      progressFill.style.width = `${(completedDotsCount / 31) * 100}%`;
    }
    const dotCountEl = document.getElementById('challenge-dot-count');
    if (dotCountEl) {
      dotCountEl.textContent = completedDotsCount;
    }
  }

  showDailyInfoModal() {
    const modal = document.getElementById('daily-challenge-info-modal');
    const slide1 = document.getElementById('daily-slide-1');
    const slide2 = document.getElementById('daily-slide-2');
    const dot1 = document.getElementById('daily-dot-1');
    const dot2 = document.getElementById('daily-dot-2');

    slide1?.classList.remove('hidden');
    slide2?.classList.add('hidden');
    dot1?.classList.add('active');
    dot2?.classList.remove('active');

    modal?.classList.remove('hidden');
  }

  renderCollectionScreen() {
    // Records
    document.getElementById('record-longest-streak').textContent = this.state.records.longestStreak;
    document.getElementById('record-highest-win').textContent = this.state.records.highestWinStreak;
    document.getElementById('record-most-wins').textContent = this.state.records.mostWins;

    // Challenge trophies grid (12 months)
    const trophiesContainer = document.getElementById('collection-trophies-container');
    if (trophiesContainer) {
      trophiesContainer.innerHTML = '';
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

      months.forEach((m, idx) => {
        const item = document.createElement('div');
        item.className = 'trophy-card';
        item.innerHTML = `
          <div class="trophy-model">
            <svg viewBox="0 0 100 100" width="70" height="70">
              <path d="M25 25 L75 25 L65 60 C65 72 55 76 50 76 C45 76 35 72 35 60 Z" fill="#dbeafe" stroke="#93c5fd" stroke-width="2"/>
              <path d="M25 32 C15 32 15 50 25 50" fill="none" stroke="#93c5fd" stroke-width="4" stroke-linecap="round"/>
              <path d="M75 32 C85 32 85 50 75 50" fill="none" stroke="#93c5fd" stroke-width="4" stroke-linecap="round"/>
              <rect x="44" y="76" width="12" height="12" fill="#bfdbfe"/>
              <rect x="35" y="88" width="30" height="6" rx="3" fill="#93c5fd"/>
            </svg>
          </div>
          <div class="trophy-name">${m}</div>
          <div class="trophy-stat">0 of ${days[idx]}</div>
        `;
        trophiesContainer.appendChild(item);
      });
    }
  }

  renderSettingsScreen() {
    // Ensure clean white background and black text as explicitly required
    const screen = document.getElementById('settings-screen');
    if (screen) {
      screen.style.backgroundColor = '#ffffff';
      screen.style.color = '#111827';
    }
  }

  showVictoryModal(stats) {
    const modal = document.getElementById('victory-modal');
    if (!modal) return;

    // Title variation based on performance
    const titleEl = document.getElementById('victory-title');
    if (titleEl) {
      if (stats.mistakes === 0) {
        titleEl.textContent = 'Flawless!';
      } else if (stats.mistakes <= 1) {
        titleEl.textContent = 'Perfect!';
      } else {
        titleEl.textContent = 'Comeback Win!';
      }
    }

    // Stats
    document.getElementById('victory-difficulty').textContent = stats.level.difficulty;
    const mins = String(Math.floor(stats.time / 60)).padStart(2, '0');
    const secs = String(stats.time % 60).padStart(2, '0');
    document.getElementById('victory-time').textContent = `${mins}:${secs}`;
    document.getElementById('victory-score').textContent = stats.score;
    document.getElementById('victory-today-levels').textContent = stats.level.id;
    document.getElementById('victory-accuracy').textContent = `${stats.accuracy}%`;
    document.getElementById('victory-mistakes').textContent = `× ${stats.mistakes}`;
    document.getElementById('victory-hints').textContent = `💡 ${stats.hintsUsed}`;

    // Level track dots
    const trackContainer = document.getElementById('victory-level-track');
    if (trackContainer) {
      trackContainer.innerHTML = '';
      const curr = stats.level.id;
      for (let i = Math.max(1, curr - 2); i <= curr + 2; i++) {
        const dot = document.createElement('div');
        dot.className = `track-dot ${i === curr ? 'current' : ''}`;
        dot.textContent = i;
        trackContainer.appendChild(dot);
      }
    }

    // Advance player level if playing normal campaign
    if (!stats.level.isDaily && stats.level.id === this.state.level) {
      this.state.level = Math.min(5000, this.state.level + 1);
      this.state.maxLevelReached = Math.max(this.state.maxLevelReached, this.state.level);
      this.state.records.mostWins++;
      this.saveState();
    } else if (stats.level.isDaily) {
      const dateKey = `2026-10-${String(stats.level.day).padStart(2, '0')}`;
      this.state.completedDailyChallenges[dateKey] = true;
      this.saveState();
    }

    modal.classList.remove('hidden');

    document.getElementById('victory-next-btn').onclick = () => {
      soundManager.playTap();
      modal.classList.add('hidden');
      if (stats.level.isDaily) {
        this.navigateTo('challenge');
      } else {
        this.startLevel(this.state.level);
      }
    };

    document.getElementById('victory-home-btn').onclick = () => {
      soundManager.playTap();
      modal.classList.add('hidden');
      this.navigateTo('home');
    };
  }

  showGameOverModal(stats) {
    const modal = document.getElementById('gameover-modal');
    if (!modal) return;
    modal.classList.remove('hidden');

    document.getElementById('gameover-retry-btn').onclick = () => {
      soundManager.playTap();
      modal.classList.add('hidden');
      this.game.restartLevel();
    };

    document.getElementById('gameover-revive-btn').onclick = () => {
      soundManager.playTap();
      modal.classList.add('hidden');
      this.game.revive();
      this.showToast('Revived with 2 lives! Keep going.');
    };

    document.getElementById('gameover-home-btn').onclick = () => {
      soundManager.playTap();
      modal.classList.add('hidden');
      this.navigateTo('home');
    };
  }

  showStreakModal() {
    const modal = document.getElementById('streak-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
  }

  showLevelSelectModal() {
    const modal = document.getElementById('level-select-modal');
    const input = document.getElementById('level-select-input');
    if (!modal || !input) return;

    input.value = this.state.level;
    modal.classList.remove('hidden');

    document.getElementById('level-select-confirm-btn').onclick = () => {
      soundManager.playTap();
      let chosen = parseInt(input.value, 10);
      if (isNaN(chosen) || chosen < 1) chosen = 1;
      if (chosen > 5000) chosen = 5000;
      this.state.level = chosen;
      this.saveState();
      modal.classList.add('hidden');
      this.renderHomeScreen();
      this.startLevel(chosen);
    };
  }

  showLockToast(msg) {
    this.showToast(msg, 3000);
    soundManager.playError();
  }

  showToast(message, duration = 2500) {
    const toast = document.getElementById('app-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('visible');

    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.classList.add('hidden'), 300);
    }, duration);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.uiManager = new UIManager();
});
