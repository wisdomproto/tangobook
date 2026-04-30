// 폰트 패밀리 — Nunito + 학교안심둥근체(없으면 Google IBM Plex Sans KR로 fallback)
export const fontFamily = {
  sans: ['Nunito', '학교안심둥근체', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  display: ['Nunito', '학교안심둥근체', 'sans-serif'],
} as const;

export type FontFamilyTokens = typeof fontFamily;
