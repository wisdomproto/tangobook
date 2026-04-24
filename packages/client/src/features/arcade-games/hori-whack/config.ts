export const GAME_CONFIG = {
  width: 1280,
  height: 720,
};

export const ASSET_BASE = '/mascot/hori';
export const GAME_SFX_BASE = '/sounds/game';
export const RUNNER_SFX_BASE = '/sounds/runner';

export const SPRITE_KEYS = {
  idle: 'whack-idle',
  celebrate: 'whack-celebrate',
  hurt: 'whack-hurt',
} as const;

export const ANIM_KEYS = {
  idle: 'whack-anim-idle',
  celebrate: 'whack-anim-celebrate',
  hurt: 'whack-anim-hurt',
} as const;

export const SFX_KEYS = {
  pop: 'whack-pop',
  hit: 'whack-hit',
  miss: 'whack-miss',
  gameover: 'whack-gameover',
  bgm: 'whack-bgm',
} as const;

export const GRID = {
  cols: 3,
  rows: 3,
  holeWidth: 220,
  holeHeight: 140,
  gapX: 40,
  gapY: 20,
  topOffset: 160,
};

export const GAME_RULES = {
  durationMs: 60_000,
  popUpMsStart: 1400,
  popUpMsMin: 700,
  spawnIntervalStart: 900,
  spawnIntervalMin: 450,
};
