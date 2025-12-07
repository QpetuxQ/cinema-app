/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#E50914", // фирменный красный Netflix
        accent: "#FFD700", // акцент для KaroFilm
        dark: "#0b0b0b", // почти чёрный фон
        grayNetflix: "#2f2f2f",
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(to bottom, rgba(20,20,20,0.7), rgba(10,10,10,1))',
        'gradient-red': 'linear-gradient(135deg, #E50914, #B00610)',
      },
      boxShadow: {
        glow: '0 0 20px rgba(229,9,20,0.4)',
        neon: '0 0 25px rgba(255,215,0,0.4)',
      },
      fontFamily: {
        sans: ['"Poppins"', "sans-serif"],
      },
    },
  },
  plugins: [],
};