import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#ff1616",
          accent: "#ff4d4d",
          slate: "#101010",
          card: "#171717",
          outline: "#2a2a2a",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...defaultTheme.fontFamily.sans],
        mono: ["var(--font-geist-mono)", ...defaultTheme.fontFamily.mono],
      },
      boxShadow: {
        glow: "0 0 32px rgba(255, 22, 22, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;