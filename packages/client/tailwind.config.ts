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
      colors: {
        ...colors,
        // Marketing semantic colors — var() passthroughs for .marketing-scope OKLCH tokens.
        // These names don't collide with Tangobook tokens (coral/peach/cream/ink/mint/semantic).
        // Collision check (2026-06-06): none of these keys exist in design-system/tokens/colors.ts.
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        popover: 'var(--popover)',
        'popover-foreground': 'var(--popover-foreground)',
        primary: 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
        secondary: 'var(--secondary)',
        'secondary-foreground': 'var(--secondary-foreground)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        accent: 'var(--accent)',
        'accent-foreground': 'var(--accent-foreground)',
        destructive: 'var(--destructive)',
        'destructive-foreground': 'var(--destructive-foreground)',
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        sidebar: 'var(--sidebar)',
        'sidebar-foreground': 'var(--sidebar-foreground)',
        'sidebar-primary': 'var(--sidebar-primary)',
        'sidebar-primary-foreground': 'var(--sidebar-primary-foreground)',
        'sidebar-accent': 'var(--sidebar-accent)',
        'sidebar-accent-foreground': 'var(--sidebar-accent-foreground)',
        'sidebar-border': 'var(--sidebar-border)',
        'sidebar-ring': 'var(--sidebar-ring)',
      },
      borderRadius,
      fontFamily,
      boxShadow,
      keyframes: keyframes as unknown as Config['theme']['keyframes'],
      animation,
    },
  },
  plugins: [],
} satisfies Config;
