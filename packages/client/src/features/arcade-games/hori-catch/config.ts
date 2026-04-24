export const GAME_CONFIG = {
  width: 1280,
  height: 720,
  groundY: 620,
  skyColor: 0x87ceeb,
  grassColor: 0x7fb756,
};

export const HORI_CONFIG = {
  startX: 640,
  scale: 0.32,
  moveSpeed: 650, // px/s
  // Basket render offset (below Hori hands)
  basketWidth: 140,
  basketHeight: 40,
  basketOffsetY: 30,
};

export const ITEM_CONFIG = {
  fallSpeedMin: 240,
  fallSpeedMax: 380,
  spawnIntervalMin: 800,
  spawnIntervalMax: 1500,
  size: 70,
};

export const DIFFICULTY = {
  rampDurationMs: 60_000,
  spawnMinMultiplier: 0.55,
  speedMaxMultiplier: 1.6,
};

export const GAME_RULES = {
  startLives: 3,
  maxLives: 3,
};

export type ItemType = 'star' | 'cherry' | 'apple' | 'gift' | 'diamond' | 'bomb';

export const ITEMS: Record<
  ItemType,
  { emoji: string; score: number; weight: number; bad?: boolean }
> = {
  star: { emoji: '⭐', score: 1, weight: 40 },
  cherry: { emoji: '🍒', score: 2, weight: 25 },
  apple: { emoji: '🍎', score: 3, weight: 15 },
  gift: { emoji: '🎁', score: 5, weight: 10 },
  diamond: { emoji: '💎', score: 10, weight: 3 },
  bomb: { emoji: '💣', score: 0, weight: 7, bad: true },
};

export const ASSET_BASE = '/mascot/hori';
export const SFX_BASE = '/sounds/runner';
export const GAME_SFX_BASE = '/sounds/game';

export const ANIM_KEYS = {
  idle: 'hori-catch-idle',
  run: 'hori-catch-run',
  hurt: 'hori-catch-hurt',
  celebrate: 'hori-catch-celebrate',
} as const;

export const SPRITE_KEYS = {
  idle: 'hori-catch-s-idle',
  run: 'hori-catch-s-run',
  hurt: 'hori-catch-s-hurt',
  celebrate: 'hori-catch-s-celebrate',
} as const;

export const SFX_KEYS = {
  catchGood: 'catch-good',
  catchBad: 'catch-bad',
  gameover: 'catch-gameover',
  bgm: 'catch-bgm',
} as const;
