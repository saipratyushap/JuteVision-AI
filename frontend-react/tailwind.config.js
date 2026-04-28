/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#497A21',
          800: '#166534',
          900: '#14532d',
        },
        dark: {
          50:  '#f8fafc',
          100: '#1e293b',
          200: '#0f172a',
          300: '#0d1117',
          400: '#030712',
        },
        neon: {
          green:  '#22c55e',
          blue:   '#3b82f6',
          purple: '#8b5cf6',
          cyan:   '#06b6d4',
          red:    '#ef4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'grid-dark': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='rgba(255,255,255,0.03)' stroke-width='1'/%3E%3C/svg%3E\")",
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #030712 0%, #0f172a 50%, #0a1628 100%)',
      },
      animation: {
        'pulse-slow':  'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'glow-green':  'glow-green 2s ease-in-out infinite alternate',
        'glow-blue':   'glow-blue 2s ease-in-out infinite alternate',
        'float':       'float 6s ease-in-out infinite',
        'float-slow':  'float 9s ease-in-out infinite',
        'shimmer':     'shimmer 1.8s linear infinite',
        'gradient-x':  'gradient-x 8s ease infinite',
        'scan':        'scan 4s linear infinite',
        'spin-slow':   'spin 8s linear infinite',
        'bounce-slow': 'bounce 3s ease-in-out infinite',
        'fade-in':     'fadeIn 0.6s ease-out forwards',
        'slide-up':    'slideUp 0.6s ease-out forwards',
        'count-up':    'countUp 0.8s ease-out forwards',
      },
      keyframes: {
        'glow-green': {
          '0%':   { boxShadow: '0 0 5px rgba(34,197,94,0.3), 0 0 10px rgba(34,197,94,0.15)' },
          '100%': { boxShadow: '0 0 25px rgba(34,197,94,0.7), 0 0 50px rgba(34,197,94,0.4)' },
        },
        'glow-blue': {
          '0%':   { boxShadow: '0 0 5px rgba(59,130,246,0.3)' },
          '100%': { boxShadow: '0 0 25px rgba(59,130,246,0.7), 0 0 50px rgba(59,130,246,0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-24px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        scan: {
          '0%':   { top: '-2px' },
          '100%': { top: '100%' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        countUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'neon-green': '0 0 20px rgba(34,197,94,0.5), 0 0 40px rgba(34,197,94,0.25)',
        'neon-blue':  '0 0 20px rgba(59,130,246,0.5), 0 0 40px rgba(59,130,246,0.25)',
        'card-dark':  '0 4px 32px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 48px rgba(0,0,0,0.6)',
        'glass':      '0 8px 32px rgba(0,0,0,0.37)',
      },
      borderRadius: {
        '4xl': '2rem',
      }
    }
  },
  plugins: []
}
