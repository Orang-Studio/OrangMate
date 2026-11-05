/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // brutalistic
    borderRadius: {
      none: '0',
      DEFAULT: '0',
    },
    boxShadow: {
      none: 'none',
      DEFAULT: 'none',
    },
    extend: {
      screens: {
        xs: '400px',
      },
      colors: {
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        ink: {
          950: '#0b0b0b',
          900: '#0f0f0f',
          850: '#141414',
          800: '#161616',
          750: '#1c1c1c',
          700: '#222222',
          600: '#2a2a2a',
          500: '#333333',
          400: '#444444',
          300: '#5a5a5a',
        },
        cls: {
          brilliant: '#22c1bd',
          great: '#3b82f6',
          best: '#22c55e',
          excellent: '#7dd87d',
          good: '#9aa0a6',
          book: '#7b7b7b',
          inaccuracy: '#e6b800',
          mistake: '#e07b1f',
          blunder: '#e5484d',
          forced: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'system-ui', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
    },
  },
  plugins: [],
}