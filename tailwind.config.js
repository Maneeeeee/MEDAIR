/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        /* Surface palette — values resolve to CSS custom properties so
           theme swap is instant (light ↔ dark via [data-theme="dark"]).
           Use the alpha slash syntax: bg-paper-50/85, text-ink-900/60 etc. */
        paper: {
          50:  "rgb(var(--bg) / <alpha-value>)",
          100: "rgb(var(--bg-raised) / <alpha-value>)",
          150: "rgb(var(--bg-hover) / <alpha-value>)",
          200: "rgb(var(--border-strong) / <alpha-value>)",
          300: "rgb(var(--border) / <alpha-value>)",
          400: "rgb(var(--border-strong) / <alpha-value>)",
          500: "rgb(var(--fg-muted) / <alpha-value>)",
        },
        ink: {
          900: "rgb(var(--fg) / <alpha-value>)",
          800: "rgb(var(--fg) / <alpha-value>)",
          700: "rgb(var(--fg-secondary) / <alpha-value>)",
          600: "rgb(var(--fg-tertiary) / <alpha-value>)",
          500: "rgb(var(--fg-muted) / <alpha-value>)",
        },
        primary: {
          50:  "rgb(var(--primary-wash) / <alpha-value>)",
          500: "rgb(var(--primary) / <alpha-value>)",
          600: "rgb(var(--primary-deep) / <alpha-value>)",
        },
        warn: {
          50:  "rgb(var(--warn-wash) / <alpha-value>)",
          500: "rgb(var(--warn) / <alpha-value>)",
        },
        critical: {
          50:  "rgb(var(--critical-wash) / <alpha-value>)",
          500: "rgb(var(--critical) / <alpha-value>)",
          600: "rgb(var(--critical) / <alpha-value>)",
        },
        ok: {
          50:  "rgb(var(--ok-wash) / <alpha-value>)",
          500: "rgb(var(--ok) / <alpha-value>)",
          600: "rgb(var(--ok) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: [
          "IBM Plex Sans",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "IBM Plex Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "1.2" }],
        "display-sm": ["28px", { lineHeight: "1.15", letterSpacing: "-0.015em" }],
        "display-md": ["36px", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-lg": ["48px", { lineHeight: "1.05", letterSpacing: "-0.025em" }],
      },
      boxShadow: {
        soft: "0 1px 2px rgb(var(--shadow-color) / 0.06), 0 1px 1px rgb(var(--shadow-color) / 0.04)",
        panel:
          "0 1px 2px rgb(var(--shadow-color) / 0.06), 0 4px 12px rgb(var(--shadow-color) / 0.06), 0 1px 0 rgb(255 255 255 / 0.4) inset",
        float:
          "0 2px 6px rgb(var(--shadow-color) / 0.08), 0 12px 32px rgb(var(--shadow-color) / 0.10), 0 1px 0 rgb(255 255 255 / 0.5) inset",
      },
      borderRadius: {
        DEFAULT: "10px",
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "20px",
        "2xl": "28px",
      },
    },
  },
  plugins: [
    function ({ addBase, addUtilities }) {
      const noPrefMotion = "@media (prefers-reduced-motion: no-preference)";
      addBase({
        [noPrefMotion]: {
          "@keyframes pulseRing": {
            "0%": { transform: "scale(0.85)", opacity: "0.55" },
            "80%, 100%": { transform: "scale(2.0)", opacity: "0" },
          },
          "@keyframes dashFlow": {
            to: { strokeDashoffset: "-40" },
          },
          "@keyframes breathe": {
            "0%, 100%": { opacity: "1" },
            "50%": { opacity: "0.65" },
          },
          "@keyframes slideUp": {
            from: { transform: "translateY(8px)", opacity: "0" },
            to: { transform: "translateY(0)", opacity: "1" },
          },
          "@keyframes phosphor": {
            "0%, 100%": { opacity: "1" },
            "50%": { opacity: "0.78" },
          },
        },
      });
      addUtilities({
        [noPrefMotion]: {
          ".animate-pulseRing": {
            animation: "pulseRing 2.6s cubic-bezier(0.4,0,0.6,1) infinite",
          },
          ".animate-dashFlow": {
            animation: "dashFlow 1.8s linear infinite",
          },
          ".animate-breathe": {
            animation: "breathe 2.8s ease-in-out infinite",
          },
          ".animate-slideUp": {
            animation: "slideUp 260ms ease-out both",
          },
          ".animate-phosphor": {
            animation: "phosphor 3s ease-in-out infinite",
          },
        },
      });
    },
  ],
};
