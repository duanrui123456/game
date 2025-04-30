/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        dropdown: {
          '0%': {
            opacity: '0',
            transform: 'scaleY(0) translateY(-20px)'
          },
          '100%': {
            opacity: '1',
            transform: 'scaleY(1) translateY(0)'
          }
        }
      },
      animation: {
        dropdown: 'dropdown 0.5s ease-out forwards'
      }
    },
  },
  plugins: [],
}