/** @type {import('tailwindcss').Config} */
const heroUITheme = require('./heroui.theme.js');
const heroColors = heroUITheme.themes.light.colors;

module.exports = {
  darkMode: 'class',
  presets: [require('@heroui/tailwind-preset')],
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: heroColors,
    },
  },
  plugins: [],
};
