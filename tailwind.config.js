/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/client/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        body: ['Outfit', 'sans-serif'],
      },
      colors: {
        mansion: {
          950: 'hsl(220, 20%, 5%)',
          900: 'hsl(220, 18%, 8%)',
          800: 'hsl(220, 16%, 12%)',
          700: 'hsl(220, 14%, 18%)',
          600: 'hsl(220, 12%, 25%)',
        },
        amber: {
          400: 'hsl(45, 95%, 60%)',
          500: 'hsl(45, 90%, 50%)',
          600: 'hsl(38, 85%, 42%)',
        },
        ghost: {
          100: 'hsl(220, 10%, 92%)',
          300: 'hsl(220, 8%, 70%)',
          500: 'hsl(220, 6%, 45%)',
        },
        trap: {
          red: 'hsl(0, 85%, 60%)',
          blue: 'hsl(205, 95%, 60%)',
          purple: 'hsl(280, 95%, 65%)',
          green: 'hsl(140, 85%, 55%)',
        },
      },
      backgroundImage: {
        'gothic-radial':
          'radial-gradient(at 10% 10%, hsla(280,70%,15%,0.15) 0px, transparent 50%), radial-gradient(at 90% 90%, hsla(205,70%,15%,0.15) 0px, transparent 50%)',
      },
      boxShadow: {
        'glow-amber': '0 0 20px hsla(45,95%,55%,0.4)',
        'glow-blue':  '0 0 20px hsla(205,95%,60%,0.3)',
        'glow-red':   '0 0 20px hsla(0,85%,60%,0.4)',
        'inner-dark': 'inset 0 2px 8px rgba(0,0,0,0.6)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'float':      'float 4s ease-in-out infinite',
        'shimmer':    'shimmer 2.5s linear infinite',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
