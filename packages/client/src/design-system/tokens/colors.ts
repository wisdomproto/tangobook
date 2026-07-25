// 색 토큰 — Tailwind config + CSS 변수(index.css)와 동기 유지
// 변경 시 src/index.css의 :root --color-* 도 함께 업데이트
export const colors = {
  // Warm base
  // 🔴 램프에 구멍이 있으면 그 클래스는 조용히 아무것도 안 한다(Tailwind 가 클래스를 안 만듦).
  // `text-coral-700` 이 없어서 파닉스 음절 글자가 상속색으로 흐리게 나온 적이 있다(2026-07-25).
  // 새 셰이드를 쓰기 전에 여기부터 채울 것. 추가 후 client dev 서버 재시작(JIT).
  cream: { 50: '#FFF9F3', 100: '#FFF3E8', 200: '#FFEAD8' },
  peach: {
    50: '#FFF8EF',
    100: '#FFF0E0',
    200: '#FFDDBF',
    300: '#FFC19B',
    500: '#FF9A5A',
  },
  // Accent CTA
  coral: {
    50: '#FFF2EE',
    100: '#FFE4DC',
    200: '#FFBFA8',
    300: '#FF9C7E',
    400: '#FF7A59',
    500: '#FF5E3A',
    600: '#E84B2A',
    700: '#C43A1C',
    800: '#9C2C13',
    900: '#71200D',
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
    700: '#1F6749',
  },
  // Semantic
  success: '#5CC99F',
  info: '#6BAEE8',
  warn: '#FFC857',
  danger: '#E75757',
  fun: '#A78BFA',
  // Ink (텍스트) — 900은 실질 검정 (유아 가독성 우선)
  ink: {
    50: '#F7F0E8',
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
