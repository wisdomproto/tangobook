export const borderRadius = {
  control: '8px',
  card: '16px',
  course: '24px',
  feature: '32px',
  xs: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
} as const;

export type BorderRadiusTokens = typeof borderRadius;
