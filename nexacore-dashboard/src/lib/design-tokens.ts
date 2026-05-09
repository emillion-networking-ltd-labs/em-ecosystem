// Design tokens — single source of truth for TokenInspector and any
// runtime code that needs to read the design system values. Mirrors what
// is now defined CSS-side in globals.css (@theme block) under Tailwind 4.
// Originally lived in tailwind.config.ts (Tailwind 3 JS config); moved here
// during the SCRUM-373 Tailwind 3 -> 4 migration.
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
