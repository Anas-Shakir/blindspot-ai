import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        foreground: "#f4f4f5",
        brand: {
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#e11d48",
          600: "#be123c",
          700: "#9f1239",
          800: "#701a24",
          900: "#881337",
          950: "#4c0519",
        },
      },
      letterSpacing: {
        tighter: "-0.04em",
        tight: "-0.025em",
        snug: "-0.015em",
      },
      boxShadow: {
        "sprawling": "0 0 80px -20px rgba(112, 26, 36, 0.2), 0 30px 60px -15px rgba(0, 0, 0, 0.8)",
        "sprawling-hover": "0 0 100px -10px rgba(136, 19, 55, 0.25), 0 35px 70px -15px rgba(0, 0, 0, 0.9)",
        "sprawling-drag": "0 0 120px 0px rgba(136, 19, 55, 0.35), 0 0 30px 2px rgba(112, 26, 36, 0.25), 0 40px 80px -10px rgba(0, 0, 0, 0.95)",
        "inner-glow": "inset 0 1px 1px 0 rgba(255, 255, 255, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
