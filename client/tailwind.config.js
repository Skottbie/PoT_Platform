/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: false,
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,vue}'],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
};

