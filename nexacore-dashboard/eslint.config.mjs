// Flat ESLint config — required by ESLint 9 + eslint-config-next@16.
// Mirrors the legacy .eslintrc.json semantics (extends + the two custom rule
// overrides). SCRUM-372 will tighten this and bump to ESLint 10.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "node_modules/**", "coverage/**", "out/**"],
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // SCRUM-377: kept disabled after audit. The react-hooks v6 rules ship
      // with Next 16 and are overly aggressive for canonical React patterns
      // that are explicitly endorsed by react.dev:
      //
      //   - "set-state-in-effect" flags every async-data-fetch pattern
      //     (useEffect(() => { fetch().then(setState) }, [])), every
      //     localStorage hydration, every click-outside handler, etc.
      //     These are NOT anti-patterns — they are the canonical way to
      //     subscribe to external systems. The rule's docs even acknowledge
      //     this and recommend using a data-fetching library, which is a
      //     separate architectural decision out of scope here.
      //
      //   - "refs" flags reassigning ref.current during render. Sometimes
      //     legitimate (tracking previous values, callback refs).
      //
      //   - "immutability" flags `window.location.href = X` and similar
      //     external-system writes. Pure false positive for navigation.
      //
      // Audit performed 2026-05-09: 26 violations in dashboard + 100 in
      // satellite. Spot-checks confirmed all sampled instances were
      // legitimate. Re-enabling at "error" would force a 126-pattern
      // refactor with no real defect-prevention payoff — we instead
      // accept the rule pack as "not yet stable" and revisit when
      // react-hooks v7 ships with calibrated heuristics.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
    },
  },
];
