/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './App.tsx'],
  theme: {
    extend: {
      colors: {
        primary: '#2D5F4F',
        primaryDark: '#1E4538',
        accent: '#D4AF37',
        background: '#F8F6F3',
        surface: '#FFFFFF',
        textPrimary: '#2D2D2D',
        primaryTint: '#B8D4C8',
      },
      maxWidth: { app: '430px' },
      borderRadius: { '2xl': 16, '3xl': 24 },
    },
  },
  plugins: [],
};
