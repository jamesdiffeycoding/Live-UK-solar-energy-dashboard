/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        slide: "slide 0.5s ease-out", // name: slide duration: 0.5seconds ease-in: animation starts slowly, then speeds up. ease-out: starts fast, slows down
        fade: "fade 0.7s ease-out", // matches the header's opacity transition
      },
      keyframes: {
        fade: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slide: {
          "0%": { transform: "translateY(100%)" }, // animation starts with element off-screen at the bottom
          "50%": { transform: "translateY(75%)" },
          "100%": { transform: "translateY(0)" }, // animation ends with element in its normal position
        },
      },
    },
  },
  plugins: [],
};
