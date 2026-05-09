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
      // SCRUM-377: kept disabled after audit. See nexacore-dashboard's
      // eslint.config.mjs for the full rationale — react-hooks v6 rules
      // produce too many false positives on canonical React patterns
      // (data fetching, theme/locale hydration, click-outside handlers).
      // Satellite has 100 such violations, all spot-checked as legitimate
      // patterns. Revisit when react-hooks v7 lands with calibrated heuristics.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
    },
  },
];
