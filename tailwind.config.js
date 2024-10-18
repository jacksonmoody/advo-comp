const ui = require('@supabase/ui/dist/config/ui.config.js')

module.exports = ui({
  darkMode: 'class', // or 'media' or 'class'
  content: [
    // purge styles from app
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './internals/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './lib/**/**/*.{js,ts,jsx,tsx}',
    // purge styles from supabase ui theme
    './node_modules/@supabase/ui/dist/config/default-theme.js',
  ],
  theme: {
    fontFamily: {
      sans: ['EB Garamond', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
    },
    borderColor: (theme) => ({
      ...theme('colors'),
      DEFAULT: 'var(--colors-scale5)',
      dark: 'var(--colors-scale4)',
    }),
    divideColor: (theme) => ({
      ...theme('colors'),
      DEFAULT: 'var(--colors-scale3)',
      dark: 'var(--colors-scale2)',
    }),
    extend: {
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
          },
        },
      }),
      colors: {
        /*  typography */
        'typography-body': {
          light: 'var(--colors-scale11)',
          dark: 'var(--colors-scale11)',
        },
        'typography-body-secondary': {
          light: 'var(--colors-scale10)',
          dark: 'var(--colors-scale10)',
        },
        'typography-body-strong': {
          light: 'var(--colors-scale12)',
          dark: 'var(--colors-scale12)',
        },
        'typography-body-faded': {
          light: 'var(--colors-scale9)',
          dark: 'var(--colors-scale9)',
        },

        /* borders */
        'border-secondary': {
          light: 'var(--colors-scale7)',
          dark: 'var(--colors-scale7)',
        },
        'border-secondary-hover': {
          light: 'var(--colors-scale9)',
          dark: 'var(--colors-scale9)',
        },

        /*  app backgrounds */
        'bg-primary': {
          light: 'var(--colors-scale2)',
          dark: 'var(--colors-scale2)',
        },
        'bg-secondary': {
          light: 'var(--colors-scale2)',
          dark: 'var(--colors-scale2)',
        },
        'bg-alt': {
          light: 'var(--colors-scale2)',
          dark: 'var(--colors-scale2)',
        },
      },
      animation: {
        gradient: 'gradient 60s ease infinite',
        'ping-once': 'ping-once 1s cubic-bezier(0, 0, 0.2, 1);',
        scrollX: 'scrollX 20s linear infinite',
        scrollXReverse: 'scrollXReverse 20s linear infinite',
        scrollY: 'scrollY 8000s linear infinite',
        scrollYReverse: 'scrollYReverse 8000s linear infinite',
      },
      keyframes: {
        gradient: {
          '0%': {
            'background-position': '0% 50%',
          },
          '50%': {
            'background-position': '100% 50%',
          },
          '100%': {
            'background-position': '0% 50%',
          },
        },
        'ping-once': {
          '75%': {
            transform: 'scale(2)',
            opacity: 0,
          },
          '100%': {
            transform: 'scale(2)',
            opacity: 0,
          },
        },
        scrollX: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        scrollXReverse: {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0)' },
        },
        scrollY: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-50%)' },
        },
        scrollYReverse: {
          '0%': { transform: 'translateY(-50%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography')],
})
