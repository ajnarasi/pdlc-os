import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Editorial palette — warm cream paper, deep ink, sienna accent.
        // Modeled after considered print design rather than a tech dashboard.
        paper: "oklch(96% 0.012 75)",          // warm cream background
        paperAlt: "oklch(98% 0.008 75)",       // elevated surface (slightly lighter)
        paperDeep: "oklch(92% 0.014 75)",      // recessed surface (sidebar)
        ink: "oklch(22% 0.014 60)",            // deep warm ink — primary text
        inkMuted: "oklch(46% 0.012 60)",       // secondary text
        inkFaint: "oklch(62% 0.008 60)",       // tertiary / captions
        rule: "oklch(86% 0.008 60)",           // soft hairline
        ruleStrong: "oklch(78% 0.010 60)",     // emphasized hairline
        // Single confident accent — burnt sienna, NOT cyan.
        accent: "oklch(48% 0.13 35)",          // sienna primary
        accentBright: "oklch(56% 0.16 35)",    // hover/emphasis
        accentSoft: "oklch(94% 0.04 40)",      // pale tint for chip bg
        // Status colors — same warm family, restrained saturation.
        growth: "oklch(40% 0.10 145)",         // forest green
        growthSoft: "oklch(94% 0.035 140)",
        alert: "oklch(46% 0.16 28)",           // deeper red, warm
        alertSoft: "oklch(94% 0.045 30)",
        gold: "oklch(58% 0.13 75)",            // warm amber
        goldSoft: "oklch(94% 0.05 75)",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        hero: "clamp(2.5rem, 1.2rem + 5vw, 5.5rem)",
        eyebrow: "0.72rem",
      },
      letterSpacing: {
        eyebrow: "0.12em",
      },
      transitionTimingFunction: {
        expo: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      maxWidth: {
        prose: "72ch",
        frame: "1160px",
      },
    },
  },
  plugins: [],
};

export default config;
