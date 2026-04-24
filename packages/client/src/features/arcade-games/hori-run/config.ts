export const GAME_CONFIG = {
  width: 1280,
  height: 720,
  groundY: 600,
};

export const HORI_CONFIG = {
  startX: 220,
  scale: 0.3,
  gravity: 2200,
  jumpVelocity: -950,
  doubleJumpVelocity: -780,
  scale_duck: 0.22,
};

export const WORLD_CONFIG = {
  baseScrollSpeed: 420,
  obstacleSpawnMin: 1300,
  obstacleSpawnMax: 2400,
  // Minimum horizontal distance (px) between consecutive obstacles
  minObstacleGap: 380,
  // Extra gap when previous was a specific type
  extraGapAfter: { rock: 0, spike: 60, bird: 90 } as const,
};

export const DIFFICULTY = {
  speedRampDurationMs: 60_000,
  speedMaxMultiplier: 1.9,
  spawnRampDurationMs: 60_000,
  spawnMinMultiplier: 0.6,
};

export const ASSET_BASE = '/mascot/hori';
export const SFX_BASE = '/sounds/runner';
export const GAME_SFX_BASE = '/sounds/game';

export const ANIM_KEYS = {
  run: 'hori-run-anim',
  jump: 'hori-jump-anim',
  hurt: 'hori-hurt-anim',
  idle: 'hori-idle-anim',
  celebrate: 'hori-celebrate-anim',
} as const;

export const SPRITE_KEYS = {
  run: 'hori-run',
  jump: 'hori-jump',
  hurt: 'hori-hurt',
  idle: 'hori-idle',
  celebrate: 'hori-celebrate',
} as const;

export const SFX_KEYS = {
  jump: 'sfx-jump',
  land: 'sfx-land',
  hurt: 'sfx-hurt',
  gameover: 'sfx-gameover',
  bgm: 'sfx-bgm',
  coin: 'sfx-coin',
  powerup: 'sfx-powerup',
  milestone: 'sfx-milestone',
} as const;

// ===== Obstacles =====
export type ObstacleType = 'rock' | 'spike' | 'bird';

export const OBSTACLES: Record<
  ObstacleType,
  {
    width: number;
    height: number;
    groundOffset: number; // distance above groundY where bottom sits
    mustDuck?: boolean;
    spawnWeight: number;
    unlockDistance: number; // min distance (m) before this obstacle can spawn
  }
> = {
  rock: {
    width: 70,
    height: 70,
    groundOffset: 0,
    spawnWeight: 50,
    unlockDistance: 0,
  },
  spike: {
    width: 60,
    height: 110,
    groundOffset: 0,
    spawnWeight: 30,
    unlockDistance: 100,
  },
  bird: {
    width: 80,
    height: 50,
    groundOffset: 210, // flying — must duck or high jump won't help
    mustDuck: true,
    spawnWeight: 20,
    unlockDistance: 250,
  },
};

// ===== Coins =====
export const COIN_CONFIG = {
  size: 34,
  scrollBuffer: 30,
  value: 1,
  magnetRadius: 220,
};

// Coin spawn patterns (relative positions from anchor)
export type CoinPattern = {
  name: string;
  points: Array<{ dx: number; dy: number }>;
};

export const COIN_PATTERNS: CoinPattern[] = [
  // Low line (ground height)
  { name: 'line-low', points: [0, 50, 100, 150, 200].map((dx) => ({ dx, dy: -60 })) },
  // Mid arc above rock (rewards jump)
  {
    name: 'arc',
    points: [
      { dx: 0, dy: -80 },
      { dx: 50, dy: -150 },
      { dx: 100, dy: -190 },
      { dx: 150, dy: -150 },
      { dx: 200, dy: -80 },
    ],
  },
  // High line (rewards jumping over small obstacles)
  { name: 'line-high', points: [0, 50, 100, 150].map((dx) => ({ dx, dy: -200 })) },
  // Stair up (diagonal)
  {
    name: 'stairs-up',
    points: [
      { dx: 0, dy: -60 },
      { dx: 50, dy: -110 },
      { dx: 100, dy: -160 },
      { dx: 150, dy: -210 },
    ],
  },
  // Cluster
  {
    name: 'cluster',
    points: [
      { dx: 0, dy: -120 },
      { dx: 40, dy: -100 },
      { dx: 80, dy: -130 },
      { dx: 40, dy: -160 },
    ],
  },
];

// ===== Power-ups =====
export type PowerUpType = 'magnet' | 'shield' | 'boost' | 'double';

export const POWERUPS: Record<
  PowerUpType,
  {
    emoji: string;
    color: number;
    durationMs: number;
    spawnWeight: number;
  }
> = {
  magnet: { emoji: '🧲', color: 0xff5555, durationMs: 6000, spawnWeight: 25 },
  shield: { emoji: '🛡️', color: 0x6aa8ff, durationMs: 0, spawnWeight: 25 }, // instant consumable (one hit block)
  boost: { emoji: '👟', color: 0x7bd77b, durationMs: 3500, spawnWeight: 25 },
  double: { emoji: '✨', color: 0xffd750, durationMs: 8000, spawnWeight: 25 },
};

export const POWERUP_SPAWN_INTERVAL_MS = { min: 14_000, max: 24_000 };

// ===== Combo =====
export const COMBO_CONFIG = {
  window: 2200, // ms — coin must be collected within this window to keep combo
  multipliers: [1, 1, 1.5, 2, 2.5, 3, 3.5, 4], // index = combo count, capped at last
  maxDisplay: 7,
};

// ===== Biomes =====
export type BiomeId = 'meadow' | 'forest' | 'mountain' | 'night';

export interface BiomeSpec {
  id: BiomeId;
  name: string;
  startDistanceM: number;
  skyTop: number;
  skyBottom: number;
  farHillColor: number;
  mountainColor: number;
  mountainSnow: number;
  cloudColor: number;
  cloudAlpha: number;
  treeTrunk: number;
  treeFoliage: number;
  treeFoliage2: number;
  bushColor: number;
  grassBase: number;
  grassTuft: number;
  flowerColors: number[];
  starsVisible: boolean;
  moonVisible: boolean;
  sunColor?: number;
  fireflies?: boolean;
}

export const BIOMES: BiomeSpec[] = [
  {
    id: 'meadow',
    name: '초원',
    startDistanceM: 0,
    skyTop: 0x87ceeb,
    skyBottom: 0xffe4c4,
    farHillColor: 0x9fc4bd,
    mountainColor: 0x6d8e9e,
    mountainSnow: 0xffffff,
    cloudColor: 0xffffff,
    cloudAlpha: 0.92,
    treeTrunk: 0x5a3a22,
    treeFoliage: 0x4a7a3c,
    treeFoliage2: 0x5d9348,
    bushColor: 0x4a7a3c,
    grassBase: 0x5a9039,
    grassTuft: 0x4a7a30,
    flowerColors: [0xff8c7a, 0xffd166, 0xc9a3f4, 0xfff0a3],
    starsVisible: false,
    moonVisible: false,
    sunColor: 0xffd750,
  },
  {
    id: 'forest',
    name: '숲',
    startDistanceM: 500,
    skyTop: 0x5c8fa8,
    skyBottom: 0x98b89c,
    farHillColor: 0x5d7a70,
    mountainColor: 0x3e5f50,
    mountainSnow: 0xd0d8cc,
    cloudColor: 0xd4d8c8,
    cloudAlpha: 0.6,
    treeTrunk: 0x3a2414,
    treeFoliage: 0x2a5628,
    treeFoliage2: 0x3a7236,
    bushColor: 0x2a5628,
    grassBase: 0x3a7236,
    grassTuft: 0x2a5628,
    flowerColors: [0xffd1a3, 0xd8a3c4, 0xa3d8a3],
    starsVisible: false,
    moonVisible: false,
    sunColor: 0xffaf50,
  },
  {
    id: 'mountain',
    name: '산길',
    startDistanceM: 1000,
    skyTop: 0xbac7d0,
    skyBottom: 0xe0d4be,
    farHillColor: 0x7a8188,
    mountainColor: 0x545b62,
    mountainSnow: 0xffffff,
    cloudColor: 0xffffff,
    cloudAlpha: 0.85,
    treeTrunk: 0x4a3626,
    treeFoliage: 0x3a6648,
    treeFoliage2: 0x4a7a58,
    bushColor: 0x5a6862,
    grassBase: 0x7a8870,
    grassTuft: 0x5a6650,
    flowerColors: [0xffffff, 0xffd7a1, 0xe0b8d8],
    starsVisible: false,
    moonVisible: false,
    sunColor: 0xfff0c0,
  },
  {
    id: 'night',
    name: '밤하늘',
    startDistanceM: 1500,
    skyTop: 0x1a1f40,
    skyBottom: 0x3d3470,
    farHillColor: 0x2a2858,
    mountainColor: 0x1f1d44,
    mountainSnow: 0x8088b8,
    cloudColor: 0x3a3868,
    cloudAlpha: 0.4,
    treeTrunk: 0x1a1020,
    treeFoliage: 0x1e3050,
    treeFoliage2: 0x2a4068,
    bushColor: 0x1e3050,
    grassBase: 0x2a3858,
    grassTuft: 0x1e2a40,
    flowerColors: [0xe0c8ff, 0xffffff, 0xa3c8e8],
    starsVisible: true,
    moonVisible: true,
    fireflies: true,
  },
];

export const BIOME_TRANSITION_MS = 2500;

// ===== Milestones =====
export const MILESTONES_M = [100, 250, 500, 1000, 1500, 2000, 3000, 5000];

// ===== Storage =====
export const STORAGE_KEY = 'hori-run-stats-v1';
export interface HoriRunStats {
  bestDistance: number;
  totalCoins: number;
  bestCoinsPerRun: number;
  runsPlayed: number;
  bestCombo: number;
}
export const DEFAULT_STATS: HoriRunStats = {
  bestDistance: 0,
  totalCoins: 0,
  bestCoinsPerRun: 0,
  runsPlayed: 0,
  bestCombo: 0,
};
