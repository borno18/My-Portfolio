/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  corePlugins: {
    preflight: false, // Disables standard preflight to keep existing portfolio typography and resets intact
  },
  theme: {
    extend: {
      colors: {
        orange: '#FF9800',
        black: '#0A0A0A',
        gray: '#1A1A1A',
        chakra: '#2196F3',
      },
      fontFamily: {
        main: ['Outfit', 'sans-serif'],
        accent: ['Playfair Display', 'serif'],
      }
    },
  },
  plugins: [],
}
