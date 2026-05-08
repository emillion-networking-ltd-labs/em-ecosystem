// Flat ESLint config — required by ESLint 9 + eslint-config-next@16.
// Mirrors the legacy .eslintrc.json (next/core-web-vitals + next/typescript).
// SCRUM-372 will tighten this and bump to ESLint 10.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "node_modules/**", "out/**"],
  },
  {
    rules: {
      // The react-hooks plugin v6 (shipped with Next 16) introduces several
      // new rules not active under Next 14. Keeping the lint baseline equal
      // to pre-migration: tracked as tech-debt for a follow-up ticket.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
    },
  },
];
