export const GAME_CONFIG = {
  width: 720, // Tall canvas — more fitting for vertical jumper
  height: 1000,
};

export const ASSET_BASE = '/mascot/hori';
export const GAME_SFX_BASE = '/sounds/game';
export const RUNNER_SFX_BASE = '/sounds/runner';

export const SPRITE_KEYS = {
  idle: 'jump-sprite-idle',
  jump: 'jump-sprite-jump',
  hurt: 'jump-sprite-hurt',
  celebrate: 'jump-sprite-celebrate',
} as const;

export const ANIM_KEYS = {
  idle: 'jump-anim-idle',
  jump: 'jump-anim-jump',
  hurt: 'jump-anim-hurt',
  celebrate: 'jump-anim-celebrate',
} as const;

export const SFX_KEYS = {
  bounce: 'jmp-bounce',
  gameover: 'jmp-gameover',
  bgm: 'jmp-bgm',
} as const;

export const HORI_CONFIG = {
  scale: 0.24,
  gravity: 2200,
  jumpVelocity: -1100,
  moveSpeed: 520,
  startX: 360,
  startY: 800,
  screenFollowY: 400, // hori is pinned at this screen-y when rising
};

export const PLATFORM_CONFIG = {
  width: 140,
  height: 22,
  color: 0x8a5c30,
  topColor: 0x5a9039,
  spawnGapMin: 90,
  spawnGapMax: 160,
};
