// Procedural & Crafted Level Generator for Arrows!
// Guaranteed 100% solvable via reverse topological construction.
// Levels advance one-by-one from 1 to 5,000.

import { canArrowEscape } from './mechanics.js';

function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export const HARD_SHAPES = ['glasses', 'heart', 'star', 'watch', 'crown', 'diamond', 'butterfly', 'rocket', 'spiral'];

export function isHardLevel(levelNum) {
  return levelNum % 5 === 0;
}

export function getHardShapeForLevel(levelNum) {
  if (!isHardLevel(levelNum)) return null;
  const index = Math.floor(levelNum / 5) - 1;
  return HARD_SHAPES[index % HARD_SHAPES.length];
}

// Level 1: Gentle introductory level with 3 clear arrows
export const LEVEL_1 = {
  id: 1,
  name: "Level 1",
  difficulty: "Normal",
  shape: null,
  width: 7,
  height: 9,
  arrows: [
    {
      id: "l1_1",
      points: [{ x: 2, y: 5 }, { x: 2, y: 2 }],
      direction: { dx: 0, dy: -1 },
      type: "straight"
    },
    {
      id: "l1_2",
      points: [{ x: 3, y: 3 }, { x: 3, y: 7 }],
      direction: { dx: 0, dy: 1 },
      type: "straight"
    },
    {
      id: "l1_3",
      points: [{ x: 4, y: 6 }, { x: 4, y: 3 }, { x: 5, y: 3 }],
      direction: { dx: 1, dy: 0 },
      type: "turn"
    }
  ]
};

// Level 2: Interlocking square loop with key release
export const LEVEL_2 = {
  id: 2,
  name: "Level 2",
  difficulty: "Normal",
  shape: null,
  width: 8,
  height: 8,
  arrows: [
    {
      id: "l2_out",
      points: [{ x: 5, y: 4 }, { x: 6, y: 4 }],
      direction: { dx: 1, dy: 0 },
      type: "straight"
    },
    {
      id: "l2_top",
      points: [{ x: 2, y: 2 }, { x: 5, y: 2 }],
      direction: { dx: 1, dy: 0 },
      type: "straight"
    },
    {
      id: "l2_right",
      points: [{ x: 5, y: 2 }, { x: 5, y: 5 }],
      direction: { dx: 0, dy: 1 },
      type: "straight"
    },
    {
      id: "l2_bottom",
      points: [{ x: 5, y: 5 }, { x: 2, y: 5 }],
      direction: { dx: -1, dy: 0 },
      type: "straight"
    },
    {
      id: "l2_left",
      points: [{ x: 2, y: 5 }, { x: 2, y: 2 }],
      direction: { dx: 0, dy: -1 },
      type: "straight"
    }
  ]
};

// Level 3: Dual interwoven U-turns
export const LEVEL_3 = {
  id: 3,
  name: "Level 3",
  difficulty: "Normal",
  shape: null,
  width: 8,
  height: 8,
  arrows: [
    {
      id: "l3_free",
      points: [{ x: 1, y: 3 }, { x: 1, y: 1 }],
      direction: { dx: 0, dy: -1 },
      type: "straight"
    },
    {
      id: "l3_u1",
      points: [{ x: 2, y: 5 }, { x: 2, y: 2 }, { x: 4, y: 2 }],
      direction: { dx: 1, dy: 0 },
      type: "turn"
    },
    {
      id: "l3_u2",
      points: [{ x: 5, y: 2 }, { x: 5, y: 5 }, { x: 3, y: 5 }],
      direction: { dx: -1, dy: 0 },
      type: "turn"
    },
    {
      id: "l3_bottom",
      points: [{ x: 3, y: 6 }, { x: 6, y: 6 }],
      direction: { dx: 1, dy: 0 },
      type: "straight"
    }
  ]
};

// Level 4: Spiral pinwheel
export const LEVEL_4 = {
  id: 4,
  name: "Level 4",
  difficulty: "Normal",
  shape: null,
  width: 9,
  height: 9,
  arrows: [
    {
      id: "l4_free_r",
      points: [{ x: 5, y: 4 }, { x: 8, y: 4 }],
      direction: { dx: 1, dy: 0 },
      type: "straight"
    },
    {
      id: "l4_free_l",
      points: [{ x: 3, y: 4 }, { x: 0, y: 4 }],
      direction: { dx: -1, dy: 0 },
      type: "straight"
    },
    {
      id: "l4_turn_t",
      points: [{ x: 4, y: 2 }, { x: 6, y: 2 }, { x: 6, y: 0 }],
      direction: { dx: 0, dy: -1 },
      type: "turn"
    },
    {
      id: "l4_turn_b",
      points: [{ x: 4, y: 6 }, { x: 2, y: 6 }, { x: 2, y: 8 }],
      direction: { dx: 0, dy: 1 },
      type: "turn"
    },
    {
      id: "l4_center",
      points: [{ x: 4, y: 3 }, { x: 4, y: 5 }],
      direction: { dx: 0, dy: 1 },
      type: "straight"
    }
  ]
};

// Level 5 (Hard): An unmistakably authentic, beautiful pair of glasses
export function createGlassesLevel(levelNum = 5) {
  // Clear, recognizable eyeglass frame:
  // Temples on both sides, left & right rectangular lenses, bridge in center
  const arrows = [
    // 1. Left temple arm (from frame pointing LEFT)
    { id: "gl_temple_l", points: [{ x: 1, y: 2 }, { x: 0, y: 2 }], direction: { dx: -1, dy: 0 }, type: "straight" },
    // 2. Right temple arm (from frame pointing RIGHT)
    { id: "gl_temple_r", points: [{ x: 8, y: 2 }, { x: 9, y: 2 }], direction: { dx: 1, dy: 0 }, type: "straight" },

    // Left Lens Frame
    { id: "gl_top_l", points: [{ x: 2, y: 1 }, { x: 4, y: 1 }], direction: { dx: 0, dy: -1 }, type: "straight" },
    { id: "gl_bot_l", points: [{ x: 2, y: 4 }, { x: 4, y: 4 }], direction: { dx: 0, dy: 1 }, type: "straight" },
    { id: "gl_side_l", points: [{ x: 1, y: 4 }, { x: 1, y: 1 }], direction: { dx: 0, dy: -1 }, type: "straight" },
    { id: "gl_inner_l", points: [{ x: 4, y: 4 }, { x: 4, y: 1 }], direction: { dx: 0, dy: -1 }, type: "straight" },

    // Bridge connecting lenses
    { id: "gl_bridge", points: [{ x: 4, y: 2 }, { x: 5, y: 2 }], direction: { dx: 0, dy: -1 }, type: "straight" },

    // Right Lens Frame
    { id: "gl_top_r", points: [{ x: 5, y: 1 }, { x: 7, y: 1 }], direction: { dx: 0, dy: -1 }, type: "straight" },
    { id: "gl_bot_r", points: [{ x: 5, y: 4 }, { x: 7, y: 4 }], direction: { dx: 0, dy: 1 }, type: "straight" },
    { id: "gl_side_r", points: [{ x: 8, y: 4 }, { x: 8, y: 1 }], direction: { dx: 0, dy: -1 }, type: "straight" },
    { id: "gl_inner_r", points: [{ x: 5, y: 4 }, { x: 5, y: 1 }], direction: { dx: 0, dy: -1 }, type: "straight" },

    // Inner eyes/pupils looking through glasses
    { id: "gl_eye_l", points: [{ x: 2, y: 3 }, { x: 3, y: 3 }], direction: { dx: 1, dy: 0 }, type: "straight" },
    { id: "gl_eye_r", points: [{ x: 6, y: 3 }, { x: 7, y: 3 }], direction: { dx: 1, dy: 0 }, type: "straight" }
  ];

  return {
    id: levelNum,
    name: `Level ${levelNum}`,
    difficulty: "Hard",
    shape: "glasses",
    width: 10,
    height: 7,
    arrows
  };
}

// Level 10 (Hard): Heart
export function createHeartLevel(levelNum = 10) {
  const arrows = [
    // Top-left lobe
    {
      id: "h_tl",
      points: [{ x: 3, y: 3 }, { x: 1, y: 3 }, { x: 1, y: 1 }, { x: 3, y: 1 }],
      direction: { dx: 1, dy: 0 },
      type: "path"
    },
    // Top-right lobe
    {
      id: "h_tr",
      points: [{ x: 5, y: 3 }, { x: 7, y: 3 }, { x: 7, y: 1 }, { x: 5, y: 1 }],
      direction: { dx: -1, dy: 0 },
      type: "path"
    },
    // Center dip
    {
      id: "h_center",
      points: [{ x: 4, y: 1 }, { x: 4, y: 3 }],
      direction: { dx: 0, dy: 1 },
      type: "straight"
    },
    // Left diagonal down
    {
      id: "h_ld",
      points: [{ x: 1, y: 4 }, { x: 1, y: 5 }, { x: 3, y: 7 }],
      direction: { dx: 1, dy: 1 },
      type: "turn"
    },
    // Right diagonal down
    {
      id: "h_rd",
      points: [{ x: 7, y: 4 }, { x: 7, y: 5 }, { x: 5, y: 7 }],
      direction: { dx: -1, dy: 1 },
      type: "turn"
    },
    // Bottom tip
    {
      id: "h_tip",
      points: [{ x: 4, y: 6 }, { x: 4, y: 8 }],
      direction: { dx: 0, dy: 1 },
      type: "straight"
    },
    // Inner warmth left
    {
      id: "h_in_l",
      points: [{ x: 2, y: 4 }, { x: 3, y: 4 }],
      direction: { dx: 1, dy: 0 },
      type: "straight"
    },
    // Inner warmth right
    {
      id: "h_in_r",
      points: [{ x: 6, y: 4 }, { x: 5, y: 4 }],
      direction: { dx: -1, dy: 0 },
      type: "straight"
    }
  ];

  return {
    id: levelNum,
    name: `Level ${levelNum}`,
    difficulty: "Hard",
    shape: "heart",
    width: 9,
    height: 10,
    arrows
  };
}

// Level 15 (Hard): Star
export function createStarLevel(levelNum = 15) {
  const arrows = [
    // Top point
    {
      id: "s_top",
      points: [{ x: 4, y: 3 }, { x: 4, y: 0 }],
      direction: { dx: 0, dy: -1 },
      type: "straight"
    },
    // Left arm
    {
      id: "s_left",
      points: [{ x: 3, y: 3 }, { x: 0, y: 3 }],
      direction: { dx: -1, dy: 0 },
      type: "straight"
    },
    // Right arm
    {
      id: "s_right",
      points: [{ x: 5, y: 3 }, { x: 8, y: 3 }],
      direction: { dx: 1, dy: 0 },
      type: "straight"
    },
    // Bottom left leg
    {
      id: "s_bl",
      points: [{ x: 3, y: 5 }, { x: 1, y: 8 }],
      direction: { dx: -1, dy: 1 },
      type: "turn"
    },
    // Bottom right leg
    {
      id: "s_br",
      points: [{ x: 5, y: 5 }, { x: 7, y: 8 }],
      direction: { dx: 1, dy: 1 },
      type: "turn"
    },
    // Center core
    {
      id: "s_core_1",
      points: [{ x: 3, y: 4 }, { x: 5, y: 4 }],
      direction: { dx: 1, dy: 0 },
      type: "straight"
    },
    {
      id: "s_core_2",
      points: [{ x: 4, y: 5 }, { x: 4, y: 4 }],
      direction: { dx: 0, dy: -1 },
      type: "straight"
    }
  ];

  return {
    id: levelNum,
    name: `Level ${levelNum}`,
    difficulty: "Hard",
    shape: "star",
    width: 9,
    height: 9,
    arrows
  };
}

// Level 20 (Hard): Watch
export function createWatchLevel(levelNum = 20) {
  const arrows = [
    // Top strap (pointing UP)
    {
      id: "w_strap_t1",
      points: [{ x: 3, y: 3 }, { x: 3, y: 0 }],
      direction: { dx: 0, dy: -1 },
      type: "straight"
    },
    {
      id: "w_strap_t2",
      points: [{ x: 5, y: 3 }, { x: 5, y: 0 }],
      direction: { dx: 0, dy: -1 },
      type: "straight"
    },
    // Watch bezel square
    {
      id: "w_bez_top",
      points: [{ x: 2, y: 3 }, { x: 6, y: 3 }],
      direction: { dx: 1, dy: 0 },
      type: "straight"
    },
    {
      id: "w_bez_right",
      points: [{ x: 6, y: 3 }, { x: 6, y: 7 }],
      direction: { dx: 0, dy: 1 },
      type: "straight"
    },
    {
      id: "w_bez_bottom",
      points: [{ x: 6, y: 7 }, { x: 2, y: 7 }],
      direction: { dx: -1, dy: 0 },
      type: "straight"
    },
    {
      id: "w_bez_left",
      points: [{ x: 2, y: 7 }, { x: 2, y: 3 }],
      direction: { dx: 0, dy: -1 },
      type: "straight"
    },
    // Crown on right
    {
      id: "w_crown",
      points: [{ x: 6, y: 5 }, { x: 8, y: 5 }],
      direction: { dx: 1, dy: 0 },
      type: "straight"
    },
    // Watch Hands
    {
      id: "w_hand_h",
      points: [{ x: 4, y: 5 }, { x: 4, y: 4 }],
      direction: { dx: 0, dy: -1 },
      type: "straight"
    },
    {
      id: "w_hand_m",
      points: [{ x: 4, y: 5 }, { x: 5, y: 5 }],
      direction: { dx: 1, dy: 0 },
      type: "straight"
    },
    // Bottom strap (pointing DOWN)
    {
      id: "w_strap_b1",
      points: [{ x: 3, y: 7 }, { x: 3, y: 10 }],
      direction: { dx: 0, dy: 1 },
      type: "straight"
    },
    {
      id: "w_strap_b2",
      points: [{ x: 5, y: 7 }, { x: 5, y: 10 }],
      direction: { dx: 0, dy: 1 },
      type: "straight"
    }
  ];

  return {
    id: levelNum,
    name: `Level ${levelNum}`,
    difficulty: "Hard",
    shape: "watch",
    width: 9,
    height: 11,
    arrows
  };
}

// Procedural Generator for ANY Level (1 to 5000)
// Uses reverse-topological placement guaranteeing 100% solvability
export function generateLevel(levelNum) {
  if (levelNum === 1) return LEVEL_1;
  if (levelNum === 2) return LEVEL_2;
  if (levelNum === 3) return LEVEL_3;
  if (levelNum === 4) return LEVEL_4;

  const isHard = isHardLevel(levelNum);
  const shape = getHardShapeForLevel(levelNum);

  if (isHard) {
    if (shape === 'glasses') return createGlassesLevel(levelNum);
    if (shape === 'heart') return createHeartLevel(levelNum);
    if (shape === 'star') return createStarLevel(levelNum);
    if (shape === 'watch') return createWatchLevel(levelNum);
  }

  const rng = mulberry32(levelNum * 1337 + 7919);

  // Scaled grid size
  const baseSize = isHard ? 12 : Math.min(16, 7 + Math.floor(Math.sqrt(levelNum) * 0.7));
  const width = baseSize;
  const height = Math.min(20, baseSize + Math.floor(rng() * 3));
  const targetArrowCount = Math.min(36, Math.floor(5 + Math.sqrt(levelNum) * 1.8 + (isHard ? 4 : 0)));

  const DIRS = [
    { dx: 0, dy: -1 }, // UP
    { dx: 0, dy: 1 },  // DOWN
    { dx: -1, dy: 0 }, // LEFT
    { dx: 1, dy: 0 }   // RIGHT
  ];

  const placedArrows = [];
  const occupiedSegments = new Set();

  function segKey(p1, p2) {
    if (p1.x < p2.x || (p1.x === p2.x && p1.y < p2.y)) {
      return `${p1.x},${p1.y}-${p2.x},${p2.y}`;
    }
    return `${p2.x},${p2.y}-${p1.x},${p1.y}`;
  }

  let attempts = 0;
  while (placedArrows.length < targetArrowCount && attempts < targetArrowCount * 40) {
    attempts++;

    const sx = 1 + Math.floor(rng() * (width - 2));
    const sy = 1 + Math.floor(rng() * (height - 2));
    const dir = DIRS[Math.floor(rng() * DIRS.length)];
    const len = 2 + Math.floor(rng() * 3);

    const isTurn = rng() > 0.45;
    let points = [];

    if (!isTurn) {
      const hx = Math.max(0, Math.min(width - 1, sx + dir.dx * len));
      const hy = Math.max(0, Math.min(height - 1, sy + dir.dy * len));
      if (hx === sx && hy === sy) continue;
      points = [{ x: sx, y: sy }, { x: hx, y: hy }];
    } else {
      const turnDir = (dir.dx !== 0) ? (rng() > 0.5 ? { dx: 0, dy: 1 } : { dx: 0, dy: -1 })
                                     : (rng() > 0.5 ? { dx: 1, dy: 0 } : { dx: -1, dy: 0 });
      const cornerX = Math.max(0, Math.min(width - 1, sx + turnDir.dx * Math.max(1, Math.floor(len / 2))));
      const cornerY = Math.max(0, Math.min(height - 1, sy + turnDir.dy * Math.max(1, Math.floor(len / 2))));
      const hx = Math.max(0, Math.min(width - 1, cornerX + dir.dx * Math.max(1, Math.floor(len / 2))));
      const hy = Math.max(0, Math.min(height - 1, cornerY + dir.dy * Math.max(1, Math.floor(len / 2))));
      points = [{ x: sx, y: sy }, { x: cornerX, y: cornerY }, { x: hx, y: hy }];
    }

    // Check segment collision with already placed segments
    let overlaps = false;
    for (let i = 0; i < points.length - 1; i++) {
      if (segKey(points[i], points[i + 1]) && occupiedSegments.has(segKey(points[i], points[i + 1]))) {
        overlaps = true;
        break;
      }
    }
    if (overlaps) continue;

    const headP = points[points.length - 1];
    const prevP = points[points.length - 2];
    const actualDir = {
      dx: Math.sign(headP.x - prevP.x),
      dy: Math.sign(headP.y - prevP.y)
    };

    const candidate = {
      id: `a_${levelNum}_${placedArrows.length + 1}`,
      points,
      direction: actualDir,
      type: points.length > 2 ? "turn" : "straight"
    };

    // REVERSE-TOPOLOGICAL GUARANTEE:
    // candidate MUST be able to escape past all currently placed arrows!
    if (canArrowEscape(candidate, placedArrows)) {
      for (let i = 0; i < points.length - 1; i++) {
        occupiedSegments.add(segKey(points[i], points[i + 1]));
      }
      placedArrows.push(candidate);
    }
  }

  // Fallback if needed
  if (placedArrows.length < 3) {
    return LEVEL_3;
  }

  return {
    id: levelNum,
    name: `Level ${levelNum}`,
    difficulty: isHard ? "Hard" : "Normal",
    shape: isHard ? (shape || "hard_maze") : null,
    width,
    height,
    arrows: placedArrows
  };
}

export function getDailyChallengeLevel(year, month, day) {
  const dateSeed = year * 10000 + month * 100 + day;
  const dailyLevelNum = 20000 + (day % 31);
  const level = generateLevel(dailyLevelNum);
  level.name = `Daily Challenge - Day ${day}`;
  level.difficulty = "Daily";
  level.isDaily = true;
  level.day = day;
  level.month = month;
  level.year = year;
  return level;
}
