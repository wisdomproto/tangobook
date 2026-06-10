// 색 토큰 — Tailwind config + CSS 변수(index.css)와 동기 유지
// 변경 시 src/index.css의 :root --color-* 도 함께 업데이트
export const colors = {
  // Warm base
  cream: { 50: '#FFF9F3' },
  peach: {
    50: '#FFF8EF',
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
  // 게임/Cool 톤 — success 주변. 학습자 게임하기 섹션 식별 톤.
  mint: {
    50: '#EFFAF5',
    100: '#D8F3E7',
    200: '#B6E5D8',
    300: '#87D3BA',
    400: '#5CC99F',
    500: '#3AA87E',
    600: '#2A8761',
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
    200: '#DBCDBE',
    300: '#C9B8A8',
    400: '#B29E8E',
    500: '#9A8474',
    600: '#6D5A4C',
    700: '#3F2F24',
    800: '#251C15',
    900: '#0B0805',
  },
  // Dark mode
  darkbg: '#1F1611',
  darktext: '#FFF0E0',
} as const;

export type ColorTokens = typeof colors;
