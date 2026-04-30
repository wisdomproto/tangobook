// 색 토큰 — Tailwind config + CSS 변수(index.css)와 동기 유지
// 변경 시 src/index.css의 :root --color-* 도 함께 업데이트
export const colors = {
  // Warm base
  cream: { 50: '#FFF9F3' },
  peach: {
    100: '#FFF0E0',
    200: '#FFDDBF',
    300: '#FFC19B',
    500: '#FF9A5A',
  },
  // Accent CTA
  coral: {
    100: '#FFE4DC',
    200: '#FFBFA8',
    400: '#FF7A59',
    500: '#FF5E3A',
    600: '#E84B2A',
  },
  // Semantic
  success: '#5CC99F',
  info: '#6BAEE8',
  warn: '#FFC857',
  danger: '#E75757',
  fun: '#A78BFA',
  // Ink (텍스트) — 900은 실질 검정 (유아 가독성 우선)
  ink: {
    100: '#EDE1D4',
    300: '#C9B8A8',
    500: '#9A8474',
    700: '#3F2F24',
    900: '#0B0805',
  },
  // Dark mode
  darkbg: '#1F1611',
  darktext: '#FFF0E0',
} as const;

export type ColorTokens = typeof colors;
