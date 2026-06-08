/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        flame: '#FF6B35',
        ember: '#F7C59F',
        smoke: '#22222E',
        ash: '#1A1A24',
        coal: '#0A0A0F',
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 1.8s linear infinite',
        'pulse-slow': 'pulseSlow 2.8s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideDown: { '0%': { transform: 'translateY(-20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        pulseSlow: { '0%, 100%': { opacity: '1', transform: 'scale(1)' }, '50%': { opacity: '.78', transform: 'scale(1.04)' } },
      },
      boxShadow: {
        'brand': '0 0 30px rgba(249, 115, 22, 0.15)',
        'brand-lg': '0 0 60px rgba(249, 115, 22, 0.2)',
        'glow-sm': '0 0 18px rgba(255,107,53,0.12)',
        'glow-md': '0 0 30px rgba(255,107,53,0.15)',
        'glow-lg': '0 0 60px rgba(255,107,53,0.22)',
      },
    },
  },
  plugins: [],
};
