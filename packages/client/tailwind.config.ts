import type { Config } from 'tailwindcss';
import { colors, borderRadius, boxShadow, keyframes, animation } from './src/design-system/tokens';

// 폰트 패밀리 — Tailwind 가 typography.ts import 캐시 이슈가 있어 inline 정의 (2026-05-03)
// sans (Body/UI): Pretendard Variable / display (Heading): NanumSquareRound
const fontFamily = {
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
};

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors,
      borderRadius,
      fontFamily,
      boxShadow,
      keyframes: keyframes as unknown as Config['theme']['keyframes'],
      animation,
    },
  },
  plugins: [],
} satisfies Config;
