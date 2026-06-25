/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Themeable via CSS variables so dark mode is a single class flip.
        ink: "rgb(var(--ink) / <alpha-value>)", // primary text/foreground
        paper: "rgb(var(--paper) / <alpha-value>)", // card/surface
        ball: "#ff5a1f", // table-tennis orange — the one accent, both themes
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "bounce-in": {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "bounce-in": "bounce-in 0.18s ease-out",
      },
    },
  },
  plugins: [],
};
