/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0B1F4B',
        blue: '#2563EB',
        brand: {
          50: '#f2efff',
          100: '#e4dfff',
          500: '#22d3ee',
          600: '#8b5cf6',
          700: '#6d4aff',
          800: '#5235c8',
        },
        sky: '#F8FAFC',
      },
    },
  },
  plugins: [],
};
