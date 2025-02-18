import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx,jsx,js}",
  ],
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
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        fusion: {
          primary: "#2563EB",
          secondary: "#3B82F6",
          openai: "#00A67E",
          claude: "#0EA5E9",
          google: "#4285F4",
        },
      },
      keyframes: {
        "typing-dot": {
          "0%": { transform: "translateY(0px)", opacity: "0.2" },
          "25%": { transform: "translateY(-3px)", opacity: "0.8" },
          "50%": { transform: "translateY(0px)", opacity: "0.2" },
          "75%": { transform: "translateY(3px)", opacity: "0.8" },
          "100%": { transform: "translateY(0px)", opacity: "0.2" },
        },
        "electric-surge": {
          "0%, 100%": {
            opacity: "0",
            transform: "scale(1)",
          },
          "5%, 95%": {
            opacity: "0.1",
          },
          "10%, 90%": {
            opacity: "0.2",
          },
          "15%, 85%": {
            opacity: "0.3",
          },
          "20%, 80%": {
            opacity: "0.4",
          },
          "25%, 75%": {
            opacity: "0.5",
          },
          "30%, 70%": {
            opacity: "0.6",
          },
          "35%, 65%": {
            opacity: "0.7",
          },
          "40%, 60%": {
            opacity: "0.8",
          },
          "45%, 55%": {
            opacity: "0.9",
          },
          "50%": {
            opacity: "1",
            transform: "scale(1.2)",
          },
        },
      },
      animation: {
        "typing-dot-1": "typing-dot 1s infinite",
        "typing-dot-2": "typing-dot 1s infinite 0.2s",
        "typing-dot-3": "typing-dot 1s infinite 0.4s",
        "electric-surge": "electric-surge 2s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;