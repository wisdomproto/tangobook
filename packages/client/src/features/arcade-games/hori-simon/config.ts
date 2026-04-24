export const GAME_CONFIG = {
  width: 1280,
  height: 720,
};

export const ASSET_BASE = '/mascot/hori';
export const GAME_SFX_BASE = '/sounds/game';
export const RUNNER_SFX_BASE = '/sounds/runner';

export const SPRITE_KEYS = {
  idle: 'simon-idle',
  celebrate: 'simon-celebrate',
  hurt: 'simon-hurt',
  jump: 'simon-jump',
} as const;

export const ANIM_KEYS = {
  idle: 'simon-anim-idle',
  celebrate: 'simon-anim-celebrate',
  hurt: 'simon-anim-hurt',
  jump: 'simon-anim-jump',
} as const;

export const SFX_KEYS = {
  padRed: 'simon-pad-red',
  padBlue: 'simon-pad-blue',
  padGreen: 'simon-pad-green',
  padYellow: 'simon-pad-yellow',
  correct: 'simon-correct',
  wrong: 'simon-wrong',
  bgm: 'simon-bgm',
} as const;

export type PadId = 'red' | 'blue' | 'green' | 'yellow';

export const PADS: Record<PadId, { color: number; colorActive: number; sfxKey: string }> = {
  red: { color: 0xd94a4a, colorActive: 0xff6b6b, sfxKey: SFX_KEYS.padRed },
  blue: { color: 0x3976c4, colorActive: 0x5a9fe8, sfxKey: SFX_KEYS.padBlue },
  green: { color: 0x45a245, colorActive: 0x66cc66, sfxKey: SFX_KEYS.padGreen },
  yellow: { color: 0xdbb534, colorActive: 0xffd84d, sfxKey: SFX_KEYS.padYellow },
};
