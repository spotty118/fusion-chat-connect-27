import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
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
          primary: "#2563EB", // Changed from purple to a professional blue
          secondary: "#3B82F6", // Lighter blue for gradient
          openai: "#00A67E",
          claude: "#0EA5E9", // Changed to sky blue
          google: "#4285F4",
        },
      },
      keyframes: {
        "typing-dot": {
          "0%, 100%": { opacity: "0" },
          "50%": { opacity: "1" },
        }
      },
      animation: {
        "typing-dot-1": "typing-dot 1s infinite 0s",
        "typing-dot-2": "typing-dot 1s infinite 0.2s",
        "typing-dot-3": "typing-dot 1s infinite 0.4s",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;