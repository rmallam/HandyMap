/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        quote: {
          light: '#fef3c7',
          DEFAULT: '#f59e0b',
          dark: '#b45309',
        },
        quoted: {
          light: '#ede9fe',
          DEFAULT: '#8b5cf6',
          dark: '#6d28d9',
        },
        progress: {
          light: '#dcfce7',
          DEFAULT: '#10b981',
          dark: '#047857',
        },
        urgent: {
          light: '#fee2e2',
          DEFAULT: '#ef4444',
          dark: '#b91c1c',
        },
        completed: {
          light: '#f1f5f9',
          DEFAULT: '#64748b',
          dark: '#334155',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce 2s infinite',
      }
    },
  },
  plugins: [],
}
