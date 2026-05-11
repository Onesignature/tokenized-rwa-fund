import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        // Backgrounds (true black with a slight blue cast)
        bg: {
          DEFAULT: "#08080B",      // page background
          surface: "#0F0F12",      // card background
          raised: "#16161B",       // raised card (modal, hover)
          input: "#0B0B0E",
        },
        // Borders
        line: {
          DEFAULT: "rgba(255,255,255,0.06)",
          strong: "rgba(255,255,255,0.10)",
        },
        // Text
        fg: {
          DEFAULT: "#FAFAFA",
          muted: "#A1A1AA",
          subtle: "#71717A",
          faint: "#52525B",
        },
        // Signature accent: warm institutional gold
        gold: {
          DEFAULT: "#D4B370",
          50: "#FAF6EB",
          100: "#F2E8C9",
          200: "#E8D7A6",
          300: "#DEC683",
          400: "#D4B370",
          500: "#C49A4A",
          600: "#A37D34",
        },
        // Status
        gain: {
          DEFAULT: "#34D399",
          soft: "rgba(52,211,153,0.12)",
          glow: "rgba(52,211,153,0.30)",
        },
        loss: {
          DEFAULT: "#F87171",
          soft: "rgba(248,113,113,0.12)",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(212,179,112,0.18), 0 8px 30px -10px rgba(212,179,112,0.25)",
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        "grid-dot":
          "radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)",
        "radial-fade":
          "radial-gradient(circle at 30% 0%, rgba(212,179,112,0.10), transparent 50%)",
      },
    },
  },
  plugins: [],
};

export default config;
