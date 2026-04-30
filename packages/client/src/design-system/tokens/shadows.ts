export const boxShadow = {
  soft: '0 2px 8px rgba(0,0,0,0.06)',
  card: '0 4px 16px rgba(0,0,0,0.08)',
  pop: '0 6px 20px rgba(255,94,58,0.35)',
} as const;

export type BoxShadowTokens = typeof boxShadow;
