// Web Audio API Sound Synthesizer for Arrows!
// Completely self-contained, no external asset dependencies, zero latency

let audioCtx = null;
let musicOscillators = [];
let isMusicPlaying = false;
let musicInterval = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const soundManager = {
  soundEnabled: true,
  musicEnabled: true,
  vibrationEnabled: true,
  voiceEnabled: true,

  init(settings = {}) {
    if (settings.sound !== undefined) this.soundEnabled = settings.sound;
    if (settings.music !== undefined) this.musicEnabled = settings.music;
    if (settings.vibration !== undefined) this.vibrationEnabled = settings.vibration;
    if (settings.voice !== undefined) this.voiceEnabled = settings.voice;
  },

  vibrate(pattern = 30) {
    if (this.vibrationEnabled && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignore vibration errors on unsupported platforms
      }
    }
  },

  playTap() {
    if (!this.soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
    this.vibrate(15);
  },

  playFly(combo = 1) {
    if (!this.soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const baseFreq = 523.25; // C5
    const pentatonic = [1, 1.125, 1.25, 1.5, 1.667, 2];
    const pitchMul = pentatonic[(combo - 1) % pentatonic.length] * Math.pow(1.2, Math.floor((combo - 1) / pentatonic.length));
    const freq = baseFreq * pitchMul;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq * 0.8, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.4, now + 0.18);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
    this.vibrate(25);
  },

  playError() {
    if (!this.soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.linearRampToValueAtTime(90, now + 0.16);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
    this.vibrate([40, 30, 60]);
  },

  playHint() {
    if (!this.soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [659.25, 830.61, 987.77, 1318.51]; // E5, G#5, B5, E6
    notes.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    });
    this.vibrate([20, 20, 20]);
  },

  playVictory() {
    if (!this.soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    // Major triumphant chord sequence
    const chords = [
      { notes: [523.25, 659.25, 783.99], time: 0, dur: 0.2 },       // C major
      { notes: [587.33, 739.99, 880.00], time: 0.18, dur: 0.2 },    // D major
      { notes: [659.25, 830.61, 987.77], time: 0.36, dur: 0.2 },    // E major
      { notes: [783.99, 987.77, 1174.66, 1567.98], time: 0.54, dur: 0.6 } // G major with high G
    ];

    chords.forEach(chord => {
      chord.notes.forEach(note => {
        const now = ctx.currentTime + chord.time;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note, now);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + chord.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + chord.dur);
      });
    });

    this.vibrate([60, 40, 80, 40, 120]);
  },

  startAmbientMusic() {
    if (!this.musicEnabled || isMusicPlaying) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    isMusicPlaying = true;
    const chords = [
      [261.63, 329.63, 392.00], // C
      [220.00, 261.63, 329.63], // Am
      [174.61, 220.00, 261.63], // F
      [196.00, 246.94, 293.66]  // G
    ];
    let chordIdx = 0;

    const playChordStep = () => {
      if (!this.musicEnabled || !isMusicPlaying) return;
      const notes = chords[chordIdx % chords.length];
      chordIdx++;
      const now = ctx.currentTime;

      notes.forEach(note => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, now);

        // Soft ambient swell
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.025, now + 1.2);
        gain.gain.linearRampToValueAtTime(0.001, now + 3.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 3.9);
      });
    };

    playChordStep();
    musicInterval = setInterval(playChordStep, 4000);
  },

  stopAmbientMusic() {
    isMusicPlaying = false;
    if (musicInterval) {
      clearInterval(musicInterval);
      musicInterval = null;
    }
  },

  setMusic(enabled) {
    this.musicEnabled = enabled;
    if (enabled) {
      this.startAmbientMusic();
    } else {
      this.stopAmbientMusic();
    }
  }
};
