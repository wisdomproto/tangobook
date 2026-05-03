// 폰트 패밀리 (2026-05-03 변경)
// sans (Body/UI): Pretendard Variable — 한국 모던 앱 표준, 한글+Latin 조형 통일, 가변 38KB
// display (Heading): NanumSquareRound — 둥근 모서리 한글체, 4-5세 친화 가독성
export const fontFamily = {
  sans: [
    'Pretendard Variable',
    'Pretendard',
    '-apple-system',
    'BlinkMacSystemFont',
    'system-ui',
    'Apple SD Gothic Neo',
    'Noto Sans KR',
    'sans-serif',
  ],
  display: ['NanumSquareRound', 'Pretendard Variable', 'Pretendard', 'sans-serif'],
} as const;

export type FontFamilyTokens = typeof fontFamily;
