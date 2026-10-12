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

/** UI 역할만 정의한다. 쓰기 캔버스의 B/EB 폰트·채점 마스크는 별도 계약이다. */
export const fontSize: Record<string, [string, { lineHeight: string; fontWeight: string }]> = {
  'page-title': ['clamp(1.75rem, 3vw, 2rem)', { lineHeight: '1.25', fontWeight: '800' }],
  'section-title': ['clamp(1.375rem, 2vw, 1.5rem)', { lineHeight: '1.3', fontWeight: '700' }],
  'learning-body': ['1.125rem', { lineHeight: '1.5', fontWeight: '500' }],
  'learning-label': ['1.125rem', { lineHeight: '1.4', fontWeight: '700' }],
  'learning-meta': ['0.875rem', { lineHeight: '1.5', fontWeight: '500' }],
};
