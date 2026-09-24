/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // CIVICCARE ocean-blue brand palette
        ocean: {
          50: '#F0F9FF',
          100: '#DBEEFB',
          200: '#B5DFF7',
          300: '#7CCBF0',
          400: '#38B1E2',
          500: '#0090C1',
          600: '#0077B6',
          700: '#02639B',
          800: '#023E8A',
          900: '#023060',
        },
      },
    },
  },
  plugins: [],
};
