import { ArrowGame, THEMES } from './game.js';
import { generateLevel, getDailyChallengeLevel, isHardLevel, getHardShapeForLevel } from './levels.js';
import { soundManager } from './sounds.js';
import { IN_GAME_PFPS, getAvatarHTML } from './avatars.js';
import { setLanguage, getCurrentLanguage, SUPPORTED_LANGUAGES, t, applyTranslations } from './i18n.js';

const STORAGE_KEY = 'arrows_game_state_v2';

export class UIManager {
  constructor() {
    this.state = this.loadState();
    this.game = null;
    this.currentView = 'splash'; // splash, home, game, challenge, collection, settings
    this.selectedDailyDay = new Date().getDate();
    this.selectedDailyMonth = new Date().getMonth();
    this.selectedDailyYear = 2026;

    // Temporary editing state for profile modal
    this.tempProfile = {
      name: this.state.profile.name || 'Player',
      pfpId: this.state.profile.pfpId || 'fox',
      customPhoto: this.state.profile.customPhoto || null
    };

    setLanguage(this.state.language || 'en');
    this.initAudioAndSettings();
    this.bindDOM();
    this.applyThemeMode(this.state.darkTheme);
    this.updateProfileUI();
    this.updateLockBadges();
    this.setupSplashScreen();
  }

  loadState() {
    const defaultState = {
      level: 1,
      maxLevelReached: 1,
      language: 'en',
      darkTheme: false,
      theme: 'cream',
      sound: true,
      music: false,
      vibration: true,
      guidelines: true,
      profile: {
        name: 'Player',
        pfpId: 'fox',
        customPhoto: null
      },
      completedDailyChallenges: {},
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
      voice: true
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

    const activeTheme = this.state.darkTheme ? 'slate' : (this.state.theme || 'cream');
    this.game.setTheme(activeTheme);

    // Navigation buttons
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetView = btn.getAttribute('data-nav');
        this.navigateTo(targetView);
      });
    });

    // Home Play button (starts current level)
    const homePlayBtn = document.getElementById('home-play-btn');
    if (homePlayBtn) {
      homePlayBtn.addEventListener('click', () => {
        soundManager.playTap();
        this.startLevel(this.state.level);
      });
    }

    // Profile Pill on Home screen
    const homeProfilePill = document.getElementById('home-profile-pill');
    if (homeProfilePill) {
      homeProfilePill.addEventListener('click', () => {
        soundManager.playTap();
        this.showProfileModal();
      });
    }

    // Theme button next to Settings in Bottom Nav
    const navThemeBtn = document.getElementById('nav-theme-btn');
    if (navThemeBtn) {
      navThemeBtn.addEventListener('click', () => {
        soundManager.playTap();
        this.toggleThemePicker();
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
          this.showToast(t('noSafeMoves'));
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

    // Profile Modal controls
    this.setupProfileModal();

    // Settings screen switches
    this.setupSettingsSwitches();

    // Challenge screen controls
    this.setupChallengeScreen();

    // Victory modal buttons
    const victoryNextBtn = document.getElementById('victory-next-btn');
    if (victoryNextBtn) {
      victoryNextBtn.addEventListener('click', () => {
        soundManager.playTap();
        document.getElementById('victory-modal')?.classList.add('hidden');
        this.state.level++;
        if (this.state.level > this.state.maxLevelReached) {
          this.state.maxLevelReached = this.state.level;
        }
        this.saveState();
        this.updateHomeLevelDisplay();
        this.updateLockBadges();
        this.startLevel(this.state.level);
      });
    }

    const victoryHomeBtn = document.getElementById('victory-home-btn');
    if (victoryHomeBtn) {
      victoryHomeBtn.addEventListener('click', () => {
        soundManager.playTap();
        document.getElementById('victory-modal')?.classList.add('hidden');
        this.navigateTo('home');
      });
    }

    // Game Over ("Out of Moves!") Modal buttons
    const goReviveBtn = document.getElementById('gameover-revive-btn');
    if (goReviveBtn) {
      goReviveBtn.addEventListener('click', () => {
        soundManager.playTap();
        document.getElementById('gameover-modal')?.classList.add('hidden');
        this.game.revive();
      });
    }

    const goRetryBtn = document.getElementById('gameover-retry-btn');
    if (goRetryBtn) {
      goRetryBtn.addEventListener('click', () => {
        soundManager.playTap();
        document.getElementById('gameover-modal')?.classList.add('hidden');
        this.game.restartLevel();
      });
    }

    const goHomeBtn = document.getElementById('gameover-home-btn');
    if (goHomeBtn) {
      goHomeBtn.addEventListener('click', () => {
        soundManager.playTap();
        document.getElementById('gameover-modal')?.classList.add('hidden');
        this.navigateTo('home');
      });
    }

    // Generic modal close buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        soundManager.playTap();
        const modalId = btn.getAttribute('data-close-modal');
        document.getElementById(modalId)?.classList.add('hidden');
      });
    });

    // In-game restart button inside in-game settings modal
    const igRestartBtn = document.getElementById('ig-restart-btn');
    if (igRestartBtn) {
      igRestartBtn.addEventListener('click', () => {
        soundManager.playTap();
        document.getElementById('in-game-settings-modal')?.classList.add('hidden');
        this.game.restartLevel();
      });
    }
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
    }, 35);
  }

  navigateTo(viewName) {
    if (viewName === 'collection' && this.state.level < 8) {
      this.showToast(t('collectionLockMsg'));
      return;
    }
    if (viewName === 'challenge' && this.state.level < 20) {
      this.showToast(t('challengeLockMsg'));
      return;
    }

    this.currentView = viewName;

    document.querySelectorAll('.screen-view').forEach(screen => {
      if (screen.id !== 'splash-screen') {
        screen.classList.add('hidden');
      }
    });

    const targetEl = document.getElementById(`${viewName}-screen`);
    if (targetEl) {
      targetEl.classList.remove('hidden');
    }

    document.querySelectorAll('.bottom-nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-nav') === viewName);
    });

    if (viewName === 'home') {
      this.updateHomeLevelDisplay();
      this.updateProfileUI();
      this.updateLockBadges();
    } else if (viewName === 'challenge') {
      this.renderCalendar();
    } else if (viewName === 'collection') {
      this.renderCollectionScreen();
    }

    const bottomNav = document.getElementById('bottom-navigation');
    if (bottomNav) {
      bottomNav.style.display = (viewName === 'game') ? 'none' : 'flex';
    }
  }

  updateHomeLevelDisplay() {
    const lvlNum = document.getElementById('home-level-number');
    const diffBadge = document.getElementById('home-difficulty-badge');

    if (lvlNum) {
      lvlNum.textContent = `${t('level')} ${this.state.level}`;
    }
    if (diffBadge) {
      const isHard = isHardLevel(this.state.level);
      diffBadge.textContent = isHard ? t('hard') : t('normal');
      diffBadge.className = `difficulty-pill ${isHard ? 'hard' : 'normal'}`;
    }
  }

  updateLockBadges() {
    const challengeLock = document.getElementById('nav-challenge-lock');
    if (challengeLock) {
      challengeLock.style.display = (this.state.level < 20) ? 'inline-block' : 'none';
    }

    const collectionLock = document.getElementById('nav-collection-lock');
    if (collectionLock) {
      collectionLock.style.display = (this.state.level < 8) ? 'inline-block' : 'none';
    }
  }

  updateProfileUI() {
    const nameEl = document.getElementById('home-player-name');
    if (nameEl) {
      nameEl.textContent = this.state.profile.name || 'Player';
    }
    const avatarEl = document.getElementById('home-avatar-icon');
    if (avatarEl) {
      avatarEl.innerHTML = getAvatarHTML(this.state.profile);
    }
  }

  setupProfileModal() {
    const grid = document.getElementById('pfp-grid-container');
    if (grid) {
      grid.innerHTML = IN_GAME_PFPS.map(pfp => `
        <div class="pfp-choice-item" data-pfp-id="${pfp.id}" title="${pfp.name}">
          <div class="pfp-choice-circle" style="background: ${pfp.bg};">${pfp.emoji}</div>
          <span class="pfp-choice-name">${pfp.name}</span>
        </div>
      `).join('');

      grid.querySelectorAll('.pfp-choice-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = item.getAttribute('data-pfp-id');
          this.tempProfile.pfpId = id;
          this.tempProfile.customPhoto = null; // clear custom when choosing in-game
          this.renderProfileModalPreview();
        });
      });
    }

    // Custom photo file input
    const uploadTrigger = document.getElementById('profile-upload-trigger-btn');
    const fileInput = document.getElementById('profile-photo-file-input');
    if (uploadTrigger && fileInput) {
      uploadTrigger.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
          // Compress image via offscreen canvas
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const size = 160;
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, size, size);
            this.tempProfile.customPhoto = canvas.toDataURL('image/jpeg', 0.85);
            this.renderProfileModalPreview();
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    // Save profile button
    const saveBtn = document.getElementById('profile-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        soundManager.playTap();
        const nameInput = document.getElementById('profile-name-input');
        const newName = nameInput?.value?.trim() || 'Player';
        this.state.profile.name = newName;
        this.state.profile.pfpId = this.tempProfile.pfpId;
        this.state.profile.customPhoto = this.tempProfile.customPhoto;
        this.saveState();
        this.updateProfileUI();
        document.getElementById('profile-modal')?.classList.add('hidden');
        this.showToast('Profile updated!');
      });
    }
  }

  showProfileModal() {
    this.tempProfile = {
      name: this.state.profile.name || 'Player',
      pfpId: this.state.profile.pfpId || 'fox',
      customPhoto: this.state.profile.customPhoto || null
    };

    const nameInput = document.getElementById('profile-name-input');
    if (nameInput) {
      nameInput.value = this.tempProfile.name;
    }
    this.renderProfileModalPreview();
    document.getElementById('profile-modal')?.classList.remove('hidden');
  }

  renderProfileModalPreview() {
    const preview = document.getElementById('profile-modal-avatar-preview');
    if (preview) {
      preview.innerHTML = getAvatarHTML(this.tempProfile);
    }
    document.querySelectorAll('.pfp-choice-item').forEach(item => {
      const isSelected = !this.tempProfile.customPhoto && item.getAttribute('data-pfp-id') === this.tempProfile.pfpId;
      item.classList.toggle('selected', isSelected);
    });
  }

  setupSettingsSwitches() {
    // Sound
    const soundSwitch = document.getElementById('setting-sound');
    if (soundSwitch) {
      soundSwitch.checked = this.state.sound;
      soundSwitch.addEventListener('change', (e) => {
        this.state.sound = e.target.checked;
        soundManager.soundEnabled = this.state.sound;
        this.saveState();
      });
    }

    // Haptic
    const vibSwitch = document.getElementById('setting-vibration');
    if (vibSwitch) {
      vibSwitch.checked = this.state.vibration;
      vibSwitch.addEventListener('change', (e) => {
        this.state.vibration = e.target.checked;
        soundManager.vibrationEnabled = this.state.vibration;
        this.saveState();
      });
    }

    // Music
    const musicSwitch = document.getElementById('setting-music');
    if (musicSwitch) {
      musicSwitch.checked = this.state.music;
      musicSwitch.addEventListener('change', (e) => {
        this.state.music = e.target.checked;
        soundManager.musicEnabled = this.state.music;
        if (this.state.music) soundManager.startMusic();
        else soundManager.stopMusic();
        this.saveState();
      });
    }

    // Dark Theme Switch
    const darkThemeSwitch = document.getElementById('setting-dark-theme');
    if (darkThemeSwitch) {
      darkThemeSwitch.checked = this.state.darkTheme;
      darkThemeSwitch.addEventListener('change', (e) => {
        this.state.darkTheme = e.target.checked;
        this.applyThemeMode(this.state.darkTheme);
        this.saveState();
      });
    }

    // Guideline
    const guideSwitch = document.getElementById('setting-guideline');
    if (guideSwitch) {
      guideSwitch.checked = this.state.guidelines;
      guideSwitch.addEventListener('change', (e) => {
        this.state.guidelines = e.target.checked;
        if (this.game) this.game.options.showGuidelines = this.state.guidelines;
        this.saveState();
      });
    }

    // Language Button
    const langBtn = document.getElementById('settings-language-btn');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        soundManager.playTap();
        this.showLanguageModal();
      });
    }

    // Rate Us Modal
    const rateBtn = document.getElementById('settings-rate-us-btn');
    if (rateBtn) {
      rateBtn.addEventListener('click', () => {
        soundManager.playTap();
        document.getElementById('rate-us-modal')?.classList.remove('hidden');
      });
    }

    const rateSubmitBtn = document.getElementById('rate-submit-btn');
    if (rateSubmitBtn) {
      rateSubmitBtn.addEventListener('click', () => {
        soundManager.playTap();
        document.getElementById('rate-us-modal')?.classList.add('hidden');
        this.showToast('Thank you for rating Arrows!!');
      });
    }

    document.querySelectorAll('.rate-star').forEach(star => {
      star.addEventListener('click', () => {
        const val = parseInt(star.getAttribute('data-star') || '5', 10);
        document.querySelectorAll('.rate-star').forEach(s => {
          const sVal = parseInt(s.getAttribute('data-star') || '0', 10);
          s.classList.toggle('active', sVal <= val);
        });
      });
    });

    // Feedback
    const feedbackBtn = document.getElementById('settings-feedback-btn');
    if (feedbackBtn) {
      feedbackBtn.addEventListener('click', () => {
        soundManager.playTap();
        document.getElementById('feedback-modal')?.classList.remove('hidden');
      });
    }

    const feedbackSubmitBtn = document.getElementById('feedback-submit-btn');
    if (feedbackSubmitBtn) {
      feedbackSubmitBtn.addEventListener('click', () => {
        soundManager.playTap();
        const textarea = document.getElementById('feedback-textarea');
        if (textarea) textarea.value = '';
        document.getElementById('feedback-modal')?.classList.add('hidden');
        this.showToast(t('feedbackSuccess'));
      });
    }

    // Privacy
    const privacyBtn = document.getElementById('settings-privacy-btn');
    if (privacyBtn) {
      privacyBtn.addEventListener('click', () => {
        soundManager.playTap();
        document.getElementById('privacy-modal')?.classList.remove('hidden');
      });
    }

    // Terms
    const termsBtn = document.getElementById('settings-terms-btn');
    if (termsBtn) {
      termsBtn.addEventListener('click', () => {
        soundManager.playTap();
        document.getElementById('terms-modal')?.classList.remove('hidden');
      });
    }
  }

  showLanguageModal() {
    const list = document.getElementById('language-list-container');
    if (list) {
      list.innerHTML = SUPPORTED_LANGUAGES.map(lang => {
        const isCurrent = lang.code === getCurrentLanguage();
        return `
          <button class="language-choice-row ${isCurrent ? 'selected' : ''}" data-lang-code="${lang.code}">
            <span class="lang-native-name">${lang.nativeName}</span>
            <span class="lang-en-name">${lang.name}</span>
            ${isCurrent ? '<span class="lang-check">✓</span>' : ''}
          </button>
        `;
      }).join('');

      list.querySelectorAll('.language-choice-row').forEach(row => {
        row.addEventListener('click', () => {
          soundManager.playTap();
          const code = row.getAttribute('data-lang-code');
          this.state.language = code;
          setLanguage(code);
          this.saveState();

          const curName = SUPPORTED_LANGUAGES.find(l => l.code === code)?.nativeName || 'English';
          const nameSpan = document.getElementById('settings-current-lang-name');
          if (nameSpan) nameSpan.textContent = curName;

          this.updateHomeLevelDisplay();
          document.getElementById('language-modal')?.classList.add('hidden');
        });
      });
    }

    document.getElementById('language-modal')?.classList.remove('hidden');
  }

  applyThemeMode(isDark) {
    const app = document.getElementById('app-container');
    if (app) {
      if (isDark) {
        app.classList.add('dark-theme');
      } else {
        app.classList.remove('dark-theme');
      }
    }

    const themeId = isDark ? 'slate' : (this.state.theme || 'cream');
    this.game?.setTheme(themeId);
  }

  setTheme(themeId) {
    this.state.theme = themeId;
    if (this.game) {
      this.game.setTheme(themeId);
    }
    this.saveState();
  }

  toggleThemePicker() {
    const popup = document.getElementById('theme-picker-popup');
    if (popup) {
      popup.classList.toggle('hidden');
    }
  }

  applyThemeToDOM(theme) {
    document.documentElement.style.setProperty('--game-bg', theme.bg);
    document.documentElement.style.setProperty('--game-text', theme.textColor);
    document.documentElement.style.setProperty('--game-accent', theme.accent);
  }

  showInGameSettingsModal() {
    const igModal = document.getElementById('in-game-settings-modal');
    if (igModal) {
      const snd = document.getElementById('ig-setting-sound');
      const vib = document.getElementById('ig-setting-vibration');
      const mus = document.getElementById('ig-setting-music');

      if (snd) snd.checked = this.state.sound;
      if (vib) vib.checked = this.state.vibration;
      if (mus) mus.checked = this.state.music;

      igModal.classList.remove('hidden');
    }
  }

  startLevel(levelNum) {
    const levelData = generateLevel(levelNum);
    this.navigateTo('game');

    const inGameTitle = document.getElementById('in-game-title');
    const inGameSubtitle = document.getElementById('in-game-subtitle');
    if (inGameTitle) inGameTitle.textContent = `${t('level')} ${levelNum}`;
    if (inGameSubtitle) inGameSubtitle.textContent = levelData.difficulty === 'Hard' ? t('hard') : t('normal');

    this.game.loadLevel(levelData);

    const zoomToast = document.getElementById('zoom-notice-toast');
    if (zoomToast) {
      if (levelData.difficulty === 'Hard' || levelData.width > 10) {
        zoomToast.classList.remove('hidden');
        setTimeout(() => zoomToast.classList.add('hidden'), 2500);
      } else {
        zoomToast.classList.add('hidden');
      }
    }
  }

  startDailyChallenge(day) {
    const date = new Date();
    const levelData = getDailyChallengeLevel(date.getFullYear(), date.getMonth(), day);
    this.navigateTo('game');

    const inGameTitle = document.getElementById('in-game-title');
    const inGameSubtitle = document.getElementById('in-game-subtitle');
    if (inGameTitle) inGameTitle.textContent = `Daily - Day ${day}`;
    if (inGameSubtitle) inGameSubtitle.textContent = t('daily');

    this.game.loadLevel(levelData);
  }

  renderDroplets(lives) {
    const container = document.getElementById('game-droplets-container');
    if (!container) return;

    let html = '';
    for (let i = 0; i < 3; i++) {
      const active = i < lives;
      html += `
        <span class="droplet-icon ${active ? 'active' : 'empty'}">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="${active ? '#ef4444' : '#cbd5e1'}">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
          </svg>
        </span>
      `;
    }
    container.innerHTML = html;
  }

  showVictoryModal(stats) {
    const modal = document.getElementById('victory-modal');
    if (!modal) return;

    const diffEl = document.getElementById('victory-difficulty');
    const timeEl = document.getElementById('victory-time');
    const scoreEl = document.getElementById('victory-score');
    const accEl = document.getElementById('victory-accuracy');
    const mistEl = document.getElementById('victory-mistakes');
    const hintEl = document.getElementById('victory-hints');

    if (diffEl) diffEl.textContent = stats.level?.difficulty || 'Normal';
    if (timeEl) {
      const m = String(Math.floor(stats.time / 60)).padStart(2, '0');
      const s = String(stats.time % 60).padStart(2, '0');
      timeEl.textContent = `${m}:${s}`;
    }
    if (scoreEl) scoreEl.textContent = String(stats.score || 1000);
    if (accEl) accEl.textContent = `🎯 ${stats.accuracy || 100}%`;
    if (mistEl) mistEl.textContent = `× ${stats.mistakes || 0}`;
    if (hintEl) hintEl.textContent = `💡 ${stats.hintsUsed || 0}`;

    // Level progress track
    const track = document.getElementById('victory-level-track');
    if (track) {
      const cur = this.state.level;
      let html = '';
      for (let i = Math.max(1, cur - 1); i <= cur + 2; i++) {
        html += `<span class="track-dot ${i === cur ? 'current' : ''}">${i}</span>`;
      }
      track.innerHTML = html;
    }

    modal.classList.remove('hidden');
  }

  showGameOverModal(stats) {
    const modal = document.getElementById('gameover-modal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  setupChallengeScreen() {
    const infoBtn = document.getElementById('challenge-info-btn');
    if (infoBtn) {
      infoBtn.addEventListener('click', () => {
        soundManager.playTap();
        document.getElementById('daily-challenge-info-modal')?.classList.remove('hidden');
      });
    }

    const dailyContBtn = document.getElementById('daily-info-continue-btn');
    if (dailyContBtn) {
      let slide = 1;
      dailyContBtn.addEventListener('click', () => {
        soundManager.playTap();
        if (slide === 1) {
          document.getElementById('daily-slide-1')?.classList.add('hidden');
          document.getElementById('daily-slide-2')?.classList.remove('hidden');
          document.getElementById('daily-dot-1')?.classList.remove('active');
          document.getElementById('daily-dot-2')?.classList.add('active');
          dailyContBtn.textContent = 'Got It!';
          slide = 2;
        } else {
          document.getElementById('daily-challenge-info-modal')?.classList.add('hidden');
          document.getElementById('daily-slide-2')?.classList.add('hidden');
          document.getElementById('daily-slide-1')?.classList.remove('hidden');
          document.getElementById('daily-dot-2')?.classList.remove('active');
          document.getElementById('daily-dot-1')?.classList.add('active');
          dailyContBtn.textContent = 'Continue';
          slide = 1;
        }
      });
    }

    const challengePlayBtn = document.getElementById('challenge-play-btn');
    if (challengePlayBtn) {
      challengePlayBtn.addEventListener('click', () => {
        soundManager.playTap();
        this.startDailyChallenge(this.selectedDailyDay);
      });
    }
  }

  renderCalendar() {
    const grid = document.getElementById('calendar-days-grid');
    if (!grid) return;

    const daysInMonth = 31;
    const startDayOffset = 3; // October starts on Thursday
    let html = '';

    for (let i = 0; i < startDayOffset; i++) {
      html += '<div class="calendar-day blank"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = day === this.selectedDailyDay;
      const isCompleted = !!this.state.completedDailyChallenges[`2026-10-${day}`];
      html += `
        <div class="calendar-day ${isSelected ? 'selected' : ''}" data-day="${day}">
          <span>${day}</span>
          ${isCompleted ? '<span class="green-dot">●</span>' : ''}
        </div>
      `;
    }

    grid.innerHTML = html;

    grid.querySelectorAll('.calendar-day[data-day]').forEach(el => {
      el.addEventListener('click', () => {
        soundManager.playTap();
        const d = parseInt(el.getAttribute('data-day') || '1', 10);
        this.selectedDailyDay = d;
        this.renderCalendar();
        const label = document.getElementById('challenge-selected-day-text');
        if (label) label.textContent = `Day ${d} Challenge`;
      });
    });
  }

  renderCollectionScreen() {
    const container = document.getElementById('collection-trophies-container');
    if (!container) return;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    container.innerHTML = months.map((m, idx) => `
      <div class="trophy-card">
        <div style="font-size: 32px; filter: ${idx === 9 ? 'none' : 'grayscale(1)'}; opacity: ${idx === 9 ? 1 : 0.4};">🏆</div>
        <div class="trophy-name">${m} 2026</div>
        <div class="trophy-stat">${idx === 9 ? 'In Progress' : 'Locked'}</div>
      </div>
    `).join('');
  }

  showToast(message) {
    const toast = document.getElementById('app-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('visible');
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.classList.add('hidden'), 250);
    }, 2800);
  }
}

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.uiManager = new UIManager();
});
