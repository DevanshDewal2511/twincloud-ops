/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        aws: {
          orange: '#FF9900',
          hover: '#EC7211',
          navy: '#232F3E',
          squid: '#131A22',
        },
        azure: {
          blue: '#0078D4',
          hover: '#005A9E',
          cyan: '#50E6FF',
          dark: '#102A43',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
