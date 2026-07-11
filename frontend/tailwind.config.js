/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        clove: '#0B4F4A',      // deep teal-green — primary brand
        clove2: '#0E6B63',
        sienna: '#C6641B',     // warm clay accent (uses/warnings, not CTA-teal)
        parchment: '#F7F4EC',  // warm off-white background
        ink: '#1B2421',        // near-black text
        mist: '#E7EFEC',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
