import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Space Grotesk", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        void:    '#F5F0FF',
        plum:    '#44174E',
        crimson: '#662249',
        rose:    '#A34054',
        gold:    '#ED9E59',
        blush:   '#E9BCB9',
        background: '#F5F0FF',
        foreground:  '#2D1B4E',
        primary: {
          DEFAULT:    '#44174E',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT:    '#F5F0FF',
          foreground: '#2D1B4E',
        },
        muted: {
          DEFAULT:    '#EDE5FF',
          foreground: 'rgba(45,27,78,0.55)',
        },
        accent: {
          DEFAULT:    '#EBE1FF',
          foreground: '#2D1B4E',
        },
        destructive: {
          DEFAULT:    '#A34054',
          foreground: '#FFFFFF',
        },
        border:  'rgba(68,23,78,0.12)',
        input:   'rgba(68,23,78,0.12)',
        ring:    '#ED9E59',
        card: {
          DEFAULT:    '#FFFFFF',
          foreground: '#2D1B4E',
        },
        popover: {
          DEFAULT:    '#FFFFFF',
          foreground: '#2D1B4E',
        },
        sidebar: {
          DEFAULT: '#F5F0FF',
          foreground: '#2D1B4E',
          primary: '#44174E',
          "primary-foreground": '#FFFFFF',
          accent: '#EDE5FF',
          "accent-foreground": '#2D1B4E',
          border: 'rgba(68,23,78,0.12)',
          ring: '#ED9E59',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1.5rem",
        "2xl": "1.75rem",
        "3xl": "2rem",
        "4xl": "2.5rem",
        pill: "9999px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0", opacity: "0" },
          to: { height: "var(--radix-accordion-content-height)", opacity: "1" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
          to: { height: "0", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
