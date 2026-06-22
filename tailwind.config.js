/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './pages/**/*.{js,ts,jsx,tsx,mdx}',
      './components/**/*.{js,ts,jsx,tsx,mdx}',
      './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            50: '#eff6ff',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
          },
          trust: {
            high: '#22c55e',
            medium: '#eab308',
            low: '#f97316',
            critical: '#ef4444',
          }
        },
        fontFamily: {
          sans: ['Inter', 'system-ui', 'sans-serif'],
        },
        keyframes: {
          shake: {
            '0%, 100%': { transform: 'translateX(0)' },
            '15%, 45%, 75%': { transform: 'translateX(-6px)' },
            '30%, 60%, 90%': { transform: 'translateX(6px)' },
          },
        },
        animation: {
          shake: 'shake 0.45s ease-in-out',
        },
      },
    },
    plugins: [],
  };