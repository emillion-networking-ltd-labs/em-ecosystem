import type { Config } from "tailwindcss";

// Design tokens — single source of truth for TokenInspector and all components
export const designTokens = {
  fontSize: {
    h1: { size: "24px", lineHeight: "36px", letterSpacing: "-0.01em" },
    h2: { size: "20px", lineHeight: "28px", letterSpacing: "-0.01em" },
    h3: { size: "16px", lineHeight: "24px", letterSpacing: "0" },
    body: { size: "14px", lineHeight: "21px", letterSpacing: "0.01em" },
    caption: { size: "12px", lineHeight: "18px", letterSpacing: "0.02em" },
  },
  boxShadow: {
    card: "0 8px 32px rgba(0, 0, 0, 0.04)",
  },
  borderRadius: {
    md: "6px",
    lg: "8px",
    xl: "12px",
    "3xl": "24px",
    full: "100px",
  },
};

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Noto Sans",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        accent: {
          DEFAULT: "#1B5E20",
          light: "#2E7D32",
          dark: "#1B5E20",
        },
        surface: {
          primary: "var(--surface-primary)",
          secondary: "var(--surface-secondary)",
          tertiary: "var(--surface-tertiary)",
          subtle: "var(--surface-subtle)",
          inverse: "var(--surface-inverse)",
        },
        content: {
          primary: "rgb(var(--content-primary) / <alpha-value>)",
          secondary: "var(--content-secondary)",
          tertiary: "var(--content-tertiary)",
          disabled: "var(--content-disabled)",
          placeholder: "var(--content-placeholder)",
          inverse: "var(--content-inverse)",
        },
        border: {
          default: "var(--border-default)",
          strong: "var(--border-strong)",
          components: "var(--border-components)",
          subtle: "var(--border-subtle)",
        },
        hover: {
          DEFAULT: "var(--hover-bg)",
        },
        error: {
          DEFAULT: "rgb(var(--color-error) / <alpha-value>)",
          bg: "var(--color-error-bg)",
          border: "var(--color-error-border)",
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          bg: "var(--color-warning-bg)",
          border: "var(--color-warning-border)",
        },
        info: {
          DEFAULT: "var(--color-info)",
          bg: "var(--color-info-bg)",
          border: "var(--color-info-border)",
        },
        success: {
          DEFAULT: "var(--color-success)",
          bg: "var(--color-success-bg)",
          border: "var(--color-success-border)",
        },
        metric: {
          purple: "var(--metric-purple)",
          blue: "var(--metric-blue)",
        },
        notification: {
          purple: "var(--notification-purple)",
          blue: "var(--notification-blue)",
        },
      },
      fontSize: {
        h1: ["24px", { lineHeight: "36px", letterSpacing: "-0.01em" }],
        h2: ["20px", { lineHeight: "28px", letterSpacing: "-0.01em" }],
        h3: ["16px", { lineHeight: "24px", letterSpacing: "0" }],
        body: ["14px", { lineHeight: "21px", letterSpacing: "0.01em" }],
        caption: ["12px", { lineHeight: "18px", letterSpacing: "0.02em" }],
      },
      boxShadow: {
        card: "0 8px 32px rgba(0, 0, 0, 0.04)",
        avatar: "0 1px 2px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.1)",
      },
      borderRadius: {
        xs: "4px",
        sm: "5px",
        md: "6px",
        lg: "8px",
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
        full: "100px",
        circle: "50%",
      },
      spacing: {
        "0.5": "2px",
        "1": "4px",
        "1.5": "6px",
        "2": "8px",
        "2.5": "10px",
        "3": "12px",
        "4": "16px",
        "5": "20px",
        "6": "24px",
        "8": "32px",
        "9": "36px",
      },
    },
  },
  plugins: [],
};

export default config;
