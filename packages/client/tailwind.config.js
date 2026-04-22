/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef3c7',
          100: '#fde68a',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
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
        danger: '#E75757', // CSS 변수 --color-error와 쌍 (Button variant 'danger'와 의미 통일)
        fun: '#A78BFA',
        // Ink (텍스트)
        ink: {
          100: '#EDE1D4',
          300: '#C9B8A8',
          500: '#9A8474',
          700: '#6F5A48',
          900: '#3A2B1F',
        },
        // Dark
        darkbg: '#1F1611',
        darktext: '#FFF0E0',
      },
      borderRadius: {
        xs: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
      fontFamily: {
        sans: ['Nunito', '학교안심둥근체', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Nunito', '학교안심둥근체', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0,0,0,0.06)',
        card: '0 4px 16px rgba(0,0,0,0.08)',
        pop: '0 6px 20px rgba(255,94,58,0.35)',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
      },
    },
  },
  plugins: [],
};
