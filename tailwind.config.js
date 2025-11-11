/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#84CC16',
          foreground: '#0A0A0A',
        },
        background: '#0A0A0A',
        sidebar: '#1A1A1A',
        foreground: '#FFFFFF',
        muted: {
          DEFAULT: '#27272A',
          foreground: '#A1A1AA',
        },
        accent: {
          DEFAULT: '#84CC16',
          foreground: '#0A0A0A',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(132, 204, 22, 0.5)',
          },
          '50%': {
            boxShadow: '0 0 40px rgba(132, 204, 22, 0.8)',
          },
        },
      },
    },
  },
  plugins: [],
}
