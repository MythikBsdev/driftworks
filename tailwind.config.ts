import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const withAlpha = (variable: string) =>
  `rgb(var(${variable}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: withAlpha("--color-brand-primary"),
          accent: withAlpha("--color-brand-accent"),
          highlight: withAlpha("--color-brand-highlight"),
          slate: withAlpha("--color-brand-slate"),
          card: withAlpha("--color-brand-card"),
          outline: withAlpha("--color-brand-outline"),
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...defaultTheme.fontFamily.sans],
        mono: ["var(--font-geist-mono)", ...defaultTheme.fontFamily.mono],
      },
      boxShadow: {
        glow: "0 0 32px rgb(var(--color-brand-primary) / 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
