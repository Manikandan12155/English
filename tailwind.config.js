/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        known: {
          light: '#ecfdf5',
          border: '#a7f3d0',
          text: '#047857',
          DEFAULT: '#10b981',
          hover: '#059669',
          dark: '#064e3b'
        },
        understand: {
          light: '#fffbeb',
          border: '#fde68a',
          text: '#b45309',
          DEFAULT: '#f59e0b',
          hover: '#d97706',
          dark: '#78350f'
        },
        newword: {
          light: '#fef2f2',
          border: '#fecaca',
          text: '#b91c1c',
          DEFAULT: '#ef4444',
          hover: '#dc2626',
          dark: '#7f1d1d'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
