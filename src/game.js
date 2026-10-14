import { soundManager } from './sounds.js';
import { canArrowEscape } from './mechanics.js';

export const THEMES = {
  cream: {
    id: 'cream',
    name: 'Warm Cream',
    bg: '#fbf9f4',
    boardBg: '#fbf9f4',
    arrowStroke: '#111625',
    arrowFlying: '#3552ff',
    arrowError: '#ef4444',
    dotColor: '#d6cfbc',
    cardBg: '#ffffff',
    textColor: '#111625',
    accent: '#3552ff'
  },
  mint: {
    id: 'mint',
    name: 'Mint Garden',
    bg: '#ddf3e4',
    boardBg: '#ddf3e4',
    arrowStroke: '#133526',
    arrowFlying: '#2563eb',
    arrowError: '#ef4444',
    dotColor: '#a7d7b5',
    cardBg: '#ffffff',
    textColor: '#133526',
    accent: '#10b981'
  },
  peach: {
    id: 'peach',
    name: 'Warm Sand',
    bg: '#f7ebd9',
    boardBg: '#f7ebd9',
    arrowStroke: '#3a1f0d',
    arrowFlying: '#2563eb',
    arrowError: '#ef4444',
    dotColor: '#d9be97',
    cardBg: '#ffffff',
    textColor: '#3a1f0d',
    accent: '#d97706'
  },
  slate: {
    id: 'slate',
    name: 'Dark Mode',
    bg: '#0f172a',
    boardBg: '#0f172a',
    arrowStroke: '#f8fafc',
    arrowFlying: '#38bdf8',
    arrowError: '#f87171',
    dotColor: '#334155',
    cardBg: '#1e293b',
    textColor: '#f8fafc',
    accent: '#38bdf8'
  },
  sky: {
    id: 'sky',
    name: 'Sky Breeze',
    bg: '#e0f2fe',
    boardBg: '#e0f2fe',
    arrowStroke: '#073b61',
    arrowFlying: '#2563eb',
    arrowError: '#ef4444',
    dotColor: '#a7d8f5',
    cardBg: '#ffffff',
    textColor: '#073b61',
    accent: '#0284c7'
  },
  white: {
    id: 'white',
    name: 'Pure Minimal',
    bg: '#ffffff',
    boardBg: '#ffffff',
    arrowStroke: '#09090b',
    arrowFlying: '#2563eb',
    arrowError: '#ef4444',
    dotColor: '#e4e4e7',
    cardBg: '#ffffff',
    textColor: '#09090b',
    accent: '#2563eb'
  }
};

const PRAISE_WORDS = ['Good!', 'Awesome!', 'Wonderful!', 'Eagle Eye! 👍', 'Flawless!', 'Brilliant!'];

export class ArrowGame {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = options;

    this.level = null;
    this.arrows = [];
    this.theme = THEMES.cream;

    // Game state
    this.lives = 3;
    this.maxLives = 3;
    this.combo = 0;
    this.score = 0;
    this.mistakes = 0;
    this.hintsUsed = 0;
    this.startTime = 0;
    this.elapsedTime = 0;
    this.timerInterval = null;
    this.isGameOver = false;
    this.isVictory = false;

    // Animation & rendering
    this.flyingArrows = [];
    this.floatingTexts = [];
    this.particles = [];
    this.hintArrowId = null;
    this.hintPulse = 0;

    // Pan & zoom transform
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.hasMoved = false;

    // Touch gesture state
    this.initialPinchDistance = null;
    this.initialScale = 1;

    this.cellSize = 44;
    this.lineWidth = 4.5;

    this.setupListeners();
    this.startRenderLoop();
  }

  setTheme(themeId) {
    if (THEMES[themeId]) {
      this.theme = THEMES[themeId];
      if (this.options.onThemeChange) {
        this.options.onThemeChange(this.theme);
      }
    }
  }

  loadLevel(levelData) {
    this.level = levelData;
    this.arrows = JSON.parse(JSON.stringify(levelData.arrows)).map(a => ({
      ...a,
      solved: false,
      shake: 0,
      shakeDir: { x: 0, y: 0 },
      isError: false
    }));

    this.lives = 3;
    this.combo = 0;
    this.mistakes = 0;
    this.hintsUsed = 0;
    this.score = 0;
    this.isGameOver = false;
    this.isVictory = false;
    this.flyingArrows = [];
    this.floatingTexts = [];
    this.hintArrowId = null;

    this.startTime = Date.now();
    this.elapsedTime = 0;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (!this.isGameOver && !this.isVictory) {
        this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
        if (this.options.onTimeUpdate) {
          this.options.onTimeUpdate(this.elapsedTime);
        }
      }
    }, 1000);

    this.fitToScreen();

    if (this.options.onLivesChange) {
      this.options.onLivesChange(this.lives);
    }
    if (this.options.onLevelLoaded) {
      this.options.onLevelLoaded(this.level);
    }
  }

  fitToScreen() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || (window.innerHeight - 150);

    const dpr = Math.min(3, window.devicePixelRatio || 1);
    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);

    if (!this.level) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    this.arrows.forEach(a => {
      a.points.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      });
    });

    if (minX === Infinity) {
      minX = 0; maxX = this.level.width || 8;
      minY = 0; maxY = this.level.height || 10;
    }

    const gridW = (maxX - minX + 2.5) * this.cellSize;
    const gridH = (maxY - minY + 2.5) * this.cellSize;

    const scaleX = (width * 0.88) / gridW;
    const scaleY = (height * 0.82) / gridH;
    this.scale = Math.min(1.4, Math.max(0.45, Math.min(scaleX, scaleY)));

    const boardCenterX = ((minX + maxX) / 2) * this.cellSize;
    const boardCenterY = ((minY + maxY) / 2) * this.cellSize;

    this.offsetX = width / 2 - boardCenterX * this.scale;
    this.offsetY = height / 2 - boardCenterY * this.scale;
  }

  setupListeners() {
    window.addEventListener('resize', () => this.fitToScreen());

    // Mouse handlers
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.hasMoved = false;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.dragStartX;
      const dy = e.clientY - this.dragStartY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        this.hasMoved = true;
        this.offsetX += dx;
        this.offsetY += dy;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (this.isDragging && !this.hasMoved) {
        const rect = this.canvas.getBoundingClientRect();
        this.handleClick(e.clientX - rect.left, e.clientY - rect.top);
      }
      this.isDragging = false;
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newScale = Math.min(2.5, Math.max(0.35, this.scale * zoomFactor));
      this.offsetX = mouseX - (mouseX - this.offsetX) * (newScale / this.scale);
      this.offsetY = mouseY - (mouseY - this.offsetY) * (newScale / this.scale);
      this.scale = newScale;
    }, { passive: false });

    // Touch handlers for Android and mobile devices
    let touchStartX = 0, touchStartY = 0;
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.hasMoved = false;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        this.dragStartX = touchStartX;
        this.dragStartY = touchStartY;
      } else if (e.touches.length === 2) {
        this.isDragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        this.initialPinchDistance = Math.hypot(dx, dy);
        this.initialScale = this.scale;
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && this.isDragging) {
        const dx = e.touches[0].clientX - this.dragStartX;
        const dy = e.touches[0].clientY - this.dragStartY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
          this.hasMoved = true;
          this.offsetX += dx;
          this.offsetY += dy;
          this.dragStartX = e.touches[0].clientX;
          this.dragStartY = e.touches[0].clientY;
        }
      } else if (e.touches.length === 2 && this.initialPinchDistance) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const factor = dist / this.initialPinchDistance;
        this.scale = Math.min(2.5, Math.max(0.35, this.initialScale * factor));
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', (e) => {
      if (this.isDragging && !this.hasMoved && e.changedTouches.length === 1) {
        const rect = this.canvas.getBoundingClientRect();
        this.handleClick(e.changedTouches[0].clientX - rect.left, e.changedTouches[0].clientY - rect.top);
      }
      this.isDragging = false;
      this.initialPinchDistance = null;
    });
  }

  screenToWorld(sx, sy) {
    return {
      x: (sx - this.offsetX) / (this.scale * this.cellSize),
      y: (sy - this.offsetY) / (this.scale * this.cellSize)
    };
  }

  handleClick(screenX, screenY) {
    if (this.isGameOver || this.isVictory) return;
    const worldPos = this.screenToWorld(screenX, screenY);

    // Responsive hit threshold for Android touch screens (at least 36px on screen)
    const hitThreshold = Math.max(0.7, 36 / (this.scale * this.cellSize));
    let clickedArrow = null;
    let minDist = hitThreshold;

    for (const arrow of this.arrows) {
      if (arrow.solved) continue;
      for (let i = 0; i < arrow.points.length - 1; i++) {
        const p1 = arrow.points[i];
        const p2 = arrow.points[i + 1];
        const dist = this.distToSegment(worldPos, p1, p2);
        if (dist < minDist) {
          minDist = dist;
          clickedArrow = arrow;
        }
      }
    }

    if (clickedArrow) {
      this.onArrowTapped(clickedArrow);
    }
  }

  distToSegment(p, v, w) {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
  }

  canArrowEscape(arrow, arrowList = null) {
    return canArrowEscape(arrow, arrowList || this.arrows);
  }

  onArrowTapped(arrow) {
    if (this.hintArrowId === arrow.id) {
      this.hintArrowId = null;
    }

    const canEscape = this.canArrowEscape(arrow);

    if (canEscape) {
      // SUCCESS! Fly out smoothly in blue
      this.combo++;
      const earnedScore = 100 * this.combo;
      this.score += earnedScore;

      soundManager.playFly(this.combo);

      // Launch flying arrow animation rigidly in direction of arrowhead
      this.flyingArrows.push({
        arrow: JSON.parse(JSON.stringify(arrow)),
        progress: 0,
        vx: arrow.direction.dx * 1.5,
        vy: arrow.direction.dy * 1.5,
        alpha: 1
      });

      arrow.solved = true;

      // Spawn praise text if combo > 1 or randomly
      const headP = arrow.points[arrow.points.length - 1];
      const word = PRAISE_WORDS[(this.combo - 1) % PRAISE_WORDS.length];
      this.floatingTexts.push({
        text: word,
        x: headP.x * this.cellSize,
        y: headP.y * this.cellSize,
        alpha: 1,
        vy: -1.5,
        color: this.theme.arrowFlying || '#3552ff'
      });

      this.spawnParticles(headP.x * this.cellSize, headP.y * this.cellSize, this.theme.arrowFlying);

      if (this.options.onScoreUpdate) {
        this.options.onScoreUpdate(this.score, this.combo);
      }

      // Check win condition
      const remaining = this.arrows.filter(a => !a.solved).length;
      if (remaining === 0) {
        this.handleVictory();
      }
    } else {
      // BLOCKED! Bump & shake, lose 1 RED droplet
      this.combo = 0;
      this.mistakes++;
      this.lives = Math.max(0, this.lives - 1);

      arrow.shake = 18;
      arrow.shakeDir = {
        x: arrow.direction.dx * 8,
        y: arrow.direction.dy * 8
      };
      arrow.isError = true;
      setTimeout(() => { arrow.isError = false; }, 400);

      const headP = arrow.points[arrow.points.length - 1];
      this.spawnDropletSplash(headP.x * this.cellSize, headP.y * this.cellSize);

      soundManager.playError();

      if (this.options.onLivesChange) {
        this.options.onLivesChange(this.lives);
      }

      if (this.lives <= 0) {
        this.handleGameOver();
      }
    }
  }

  useHint() {
    const freeArrows = this.arrows.filter(a => !a.solved && canArrowEscape(a, this.arrows));
    if (freeArrows.length > 0) {
      const chosen = freeArrows[0];
      this.hintArrowId = chosen.id;
      this.hintPulse = 0;
      this.hintsUsed++;
      soundManager.playHint();
      return true;
    }
    return false;
  }

  restartLevel() {
    if (this.level) {
      this.loadLevel(this.level);
    }
  }

  revive() {
    this.lives = 2;
    this.isGameOver = false;
    if (this.options.onLivesChange) {
      this.options.onLivesChange(this.lives);
    }
  }

  handleVictory() {
    this.isVictory = true;
    clearInterval(this.timerInterval);
    soundManager.playVictory();

    this.spawnVictoryConfetti();

    if (this.options.onVictory) {
      const accuracy = Math.max(10, Math.round(((this.arrows.length) / (this.arrows.length + this.mistakes)) * 100));
      this.options.onVictory({
        level: this.level,
        time: this.elapsedTime,
        score: this.score,
        mistakes: this.mistakes,
        accuracy,
        hintsUsed: this.hintsUsed
      });
    }
  }

  handleGameOver() {
    this.isGameOver = true;
    clearInterval(this.timerInterval);
    if (this.options.onGameOver) {
      this.options.onGameOver({
        level: this.level,
        score: this.score
      });
    }
  }

  spawnParticles(x, y, color = null) {
    const starColors = color ? [color, '#ffffff', '#ffd700'] : ['#ff4d5e', '#2eb5fa', '#27324c', '#ffd700', '#ffffff'];
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.6 + Math.random() * 3.4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 5 + Math.random() * 5,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        alpha: 1,
        decay: 0.03 + Math.random() * 0.02,
        isStar: true,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.25
      });
    }
  }

  spawnDropletSplash(x, y) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.15,
        size: 3 + Math.random() * 3,
        color: '#ef4444',
        alpha: 1,
        decay: 0.04,
        isDroplet: true
      });
    }
  }

  drawSparkleStar(ctx, x, y, size, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    const rOuter = size;
    const rInner = size * 0.24;
    for (let i = 0; i < 8; i++) {
      const r = i % 2 === 0 ? rOuter : rInner;
      const angle = (i * Math.PI) / 4;
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  spawnVictoryConfetti() {
    const colors = ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444'];
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    for (let i = 0; i < 60; i++) {
      this.particles.push({
        x: width / 2 + (Math.random() - 0.5) * 200,
        y: height / 2 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 12,
        vy: -5 - Math.random() * 8,
        gravity: 0.25,
        size: 5 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.015,
        isConfetti: true,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2
      });
    }
  }

  startRenderLoop() {
    const render = () => {
      this.update();
      this.draw();
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }

  update() {
    this.hintPulse += 0.08;

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.02;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    for (let i = this.flyingArrows.length - 1; i >= 0; i--) {
      const fa = this.flyingArrows[i];
      fa.progress += 0.05;
      fa.arrow.points.forEach(p => {
        p.x += fa.vx;
        p.y += fa.vy;
      });
      fa.vx *= 1.15;
      fa.vy *= 1.15;
      fa.alpha -= 0.04;
      if (fa.alpha <= 0) {
        this.flyingArrows.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.gravity) p.vy += p.gravity;
      if (p.rotation !== undefined && p.rotSpeed) p.rotation += p.rotSpeed;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    this.arrows.forEach(a => {
      if (a.shake > 0) {
        a.shake *= 0.82;
        if (a.shake < 0.2) a.shake = 0;
      }
    });
  }

  draw() {
    const ctx = this.ctx;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    ctx.fillStyle = this.theme.bg;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    if (this.level && this.options.showGuidelines !== false) {
      this.drawDotGrid(ctx);
    }

    // Active arrows
    this.arrows.forEach(arrow => {
      if (!arrow.solved) {
        this.drawArrow(ctx, arrow, false);
      }
    });

    // Flying arrows (vibrant electric blue)
    this.flyingArrows.forEach(fa => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, fa.alpha);
      this.drawArrow(ctx, fa.arrow, true);
      ctx.restore();
    });

    // Floating text
    this.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = 'bold 24px "Outfit", sans-serif';
      ctx.fillStyle = ft.color || '#3552ff';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    // Particles
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      if (p.isStar) {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        this.drawSparkleStar(ctx, 0, 0, p.size, p.color);
      } else if (p.isConfetti) {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    ctx.restore();
  }

  drawDotGrid(ctx) {
    if (!this.level) return;
    const minX = -1;
    const maxX = (this.level.width || 10) + 1;
    const minY = -1;
    const maxY = (this.level.height || 12) + 1;

    ctx.fillStyle = this.theme.dotColor;
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        ctx.beginPath();
        ctx.arc(x * this.cellSize, y * this.cellSize, 2.0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /**
   * Draws a crisp, true arrow:
   * - Sleek line stroke with round joins and caps
   * - Sharp, classic arrow tip pointing forward
   * - Vibrant blue when flying
   * - Flashes red when blocked
   */
  drawArrow(ctx, arrow, isFlying = false) {
    const isHinted = this.hintArrowId === arrow.id;

    ctx.save();

    if (arrow.shake > 0) {
      const shakeOffset = Math.sin(Date.now() * 0.05) * arrow.shake;
      ctx.translate(arrow.shakeDir.x * (shakeOffset / 10), arrow.shakeDir.y * (shakeOffset / 10));
    }

    let strokeColor = this.theme.arrowStroke;
    if (arrow.isError) {
      strokeColor = this.theme.arrowError || '#ef4444';
    } else if (isFlying) {
      strokeColor = this.theme.arrowFlying || '#3552ff';
    } else if (isHinted) {
      const pulse = (Math.sin(this.hintPulse) + 1) / 2;
      strokeColor = pulse > 0.5 ? '#10b981' : '#34d399';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 14;
    }

    const strokeWidth = this.lineWidth;

    // Draw Arrow Shaft / Line
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    arrow.points.forEach((p, idx) => {
      const px = p.x * this.cellSize;
      const py = p.y * this.cellSize;
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Draw Arrow Head at the front tip
    const headP = arrow.points[arrow.points.length - 1];
    const prevP = arrow.points[arrow.points.length - 2] || headP;
    const angle = Math.atan2(headP.y - prevP.y, headP.x - prevP.x);

    this.drawArrowHead(ctx, headP.x * this.cellSize, headP.y * this.cellSize, angle, strokeColor);

    ctx.restore();
  }

  drawArrowHead(ctx, x, y, angle, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const headLength = 16;
    const headWidth = 14;

    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';

    // Sharp, crisp classic arrow tip
    ctx.beginPath();
    ctx.moveTo(headLength * 0.6, 0); // Tip
    ctx.lineTo(-headLength * 0.4, -headWidth * 0.5); // Wing Left
    ctx.lineTo(-headLength * 0.15, 0); // Inner Notch
    ctx.lineTo(-headLength * 0.4, headWidth * 0.5); // Wing Right
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}
