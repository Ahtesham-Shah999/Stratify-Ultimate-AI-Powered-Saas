import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#f90606",
        "background-light": "#f8f5f5",
        "background-dark": "#230f0f",
        "card-light": "#ffffff",
        "card-dark": "#1a1a1a",
        "border-light": "#e5e7eb",
        "border-dark": "#2d2d2d",
      },
      fontFamily: {
        display: ["Manrope", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
