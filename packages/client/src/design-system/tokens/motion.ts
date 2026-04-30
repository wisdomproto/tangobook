// keyframes — Tailwind animation에서 참조
export const keyframes = {
  shake: {
    '0%, 100%': { transform: 'translateX(0)' },
    '20%': { transform: 'translateX(-6px)' },
    '40%': { transform: 'translateX(6px)' },
    '60%': { transform: 'translateX(-4px)' },
    '80%': { transform: 'translateX(4px)' },
  },
} as const;

export const animation = {
  shake: 'shake 0.4s ease-in-out',
} as const;

export type KeyframesTokens = typeof keyframes;
export type AnimationTokens = typeof animation;
