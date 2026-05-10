export const GAME_CONFIG = {
  width: 1280,
  height: 720,
};

export const ASSET_BASE = '/mascot/hori';
export const GAME_SFX_BASE = '/sounds/game';
export const RUNNER_SFX_BASE = '/sounds/runner';

export const CARD_KEYS = {
  idle: 'memory-idle',
  run: 'memory-run',
  jump: 'memory-jump',
  hurt: 'memory-hurt',
  celebrate: 'memory-celebrate',
  waving: 'memory-waving',
} as const;

export type CardKey = keyof typeof CARD_KEYS;

export const CARD_IMAGES: Record<CardKey, string> = {
  idle: '/mascot/hori/idle/idle-frame-1.webp',
  run: '/mascot/hori/run/run-frame-1.webp',
  jump: '/mascot/hori/jump/jump-frame-3.webp',
  hurt: '/mascot/hori/hurt/hurt-frame-1.webp',
  celebrate: '/mascot/hori/celebrate/celebrate-frame-2.webp',
  waving: '/mascot/hori/waving.webp',
};

export const SFX_KEYS = {
  flip: 'mem-flip',
  match: 'mem-match',
  mismatch: 'mem-mismatch',
  win: 'mem-win',
  bgm: 'mem-bgm',
} as const;

export const GRID = {
  cols: 4,
  rows: 3,
  cardWidth: 180,
  cardHeight: 220,
  gap: 18,
  topOffset: 110,
};
