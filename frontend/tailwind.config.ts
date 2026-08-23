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
        background: "#07080a",
        foreground: "#f4f4f5",
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
      },
      letterSpacing: {
        tighter: "-0.04em",
        tight: "-0.025em",
        snug: "-0.015em",
      },
      boxShadow: {
        "sprawling": "0 0 100px -20px rgba(37, 99, 235, 0.12), 0 30px 60px -15px rgba(0, 0, 0, 0.7)",
        "sprawling-hover": "0 0 120px -10px rgba(37, 99, 235, 0.2), 0 35px 70px -15px rgba(0, 0, 0, 0.8)",
        "sprawling-drag": "0 0 140px 0px rgba(37, 99, 235, 0.35), 0 0 40px 2px rgba(59, 130, 246, 0.25), 0 40px 80px -10px rgba(0, 0, 0, 0.9)",
        "inner-glow": "inset 0 1px 1px 0 rgba(255, 255, 255, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
