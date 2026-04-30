import type { Config } from 'tailwindcss';
import {
  colors,
  borderRadius,
  boxShadow,
  fontFamily,
  keyframes,
  animation,
} from './src/design-system/tokens';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors,
      borderRadius,
      fontFamily: fontFamily as unknown as Record<string, string[]>,
      boxShadow,
      keyframes: keyframes as unknown as Config['theme']['keyframes'],
      animation,
    },
  },
  plugins: [],
} satisfies Config;
