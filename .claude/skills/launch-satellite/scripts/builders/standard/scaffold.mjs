// SCAFFOLD SAT01 (G2, ECO-74 · ADR-015 esqueleto, R3 Arquitecto). El "suelo" de TODO satélite: package.json +
// configs Next/TS/PostCSS + em-ui (tokens + componentes vía registry) + tema dark/light + analytics diferido +
// playwright. REUSA los templates PROBADOS del generador (no duplica). Aislado del emit (composición/diseño): el
// scaffold es idéntico para todo builder y NO toca diseño. Devuelve la traza de em-ui (qué se añadió).
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  emui, NEXT_CONFIG, TSCONFIG, POSTCSS, PROVIDERS, THEME_CONTEXT, DEFERRED_ANALYTICS,
} from "../../generate-satellite.mjs";
import { PLAYWRIGHT_CONFIG } from "./professional.mjs";

const slug = (s) => String(s || "site").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "site";

// Dependencias/scripts del satélite (forma SAT01). El `name` se completa por sitio en writeScaffold.
const PACKAGE_BASE = {
  version: "0.1.0", private: true,
  scripts: { dev: "next dev -p 3100", build: "next build", start: "next start -p 3100", lint: "eslint \"src/**/*.{ts,tsx}\"" },
  dependencies: {
    "@marsidev/react-turnstile": "^1.5.0",
    "@vercel/analytics": "^2.0.1", "@vercel/speed-insights": "^2.0.0",
    "lucide-react": "^1.14.0", next: "^16.2.6", react: "^19.2.6", "react-dom": "^19.2.6",
    resend: "^4.5.1",
  },
  devDependencies: {
    "@axe-core/playwright": "^4.10.0",
    "@playwright/test": "^1.49.0",
    "@tailwindcss/postcss": "^4.3.0", "@types/node": "^22.19.18",
    "@types/react": "^19.2.14", "@types/react-dom": "^19.2.3",
    eslint: "^9.39.4", "eslint-config-next": "^16.2.6",
    postcss: "^8.5.10", tailwindcss: "^4.3.0", typescript: "^6.0.3",
  },
  overrides: { next: { postcss: ">=8.5.10" } },
};

// Escribe el scaffold SAT01 en `dest`. opts: { siteName, brand?: "#hex", colorMode }. Devuelve { emui: [...] }.
export function writeScaffold(dest, src, app, { siteName, brand = null, colorMode = "system" } = {}) {
  writeFileSync(join(dest, "package.json"),
    JSON.stringify({ name: `@em-ecosystem/sat-${slug(siteName)}`, ...PACKAGE_BASE }, null, 2) + "\n");
  writeFileSync(join(dest, "next.config.mjs"), NEXT_CONFIG);
  writeFileSync(join(dest, "tsconfig.json"), TSCONFIG);
  writeFileSync(join(dest, "postcss.config.mjs"), POSTCSS);
  writeFileSync(join(dest, "next-env.d.ts"), `/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n`);
  writeFileSync(join(dest, ".gitignore"), "/node_modules\n/.next\n/out\n/.preview.log\n");
  writeFileSync(join(dest, "playwright.config.ts"), PLAYWRIGHT_CONFIG());

  // em-ui: tokens + componentes (TurnstileWidget para el formulario; ThemeToggle manual del header, ECO-68 — vía
  // registry, no copia local; jala IconButton/Tooltip + hooks/useTheme). El gate de drift los verifica intactos.
  const emuiTrace = [emui(["init"], src).trim()];
  for (const c of ["Button", "Badge", "Divider", "TurnstileWidget", "ThemeToggle"]) emuiTrace.push(emui(["add", c], src).trim());
  writeFileSync(join(app, "globals.css"),
    `@import "../styles/em-ui-tokens.css";\n` +
    (brand ? `\n/* Marca del cliente → token de marca em-ui (accent). */\n:root { --color-accent: ${brand}; --color-accent-dark: ${brand}; }\n` : "") +
    `\nbody { font-family: var(--font-sans); }\n`);

  // tema dark/light (REUTILIZADO)
  mkdirSync(join(src, "context"), { recursive: true });
  writeFileSync(join(src, "context", "ThemeContext.tsx"), THEME_CONTEXT(colorMode));
  writeFileSync(join(app, "providers.tsx"), PROVIDERS);
  mkdirSync(join(src, "components"), { recursive: true });
  writeFileSync(join(src, "components", "DeferredAnalytics.tsx"), DEFERRED_ANALYTICS);
  return { emui: emuiTrace };
}
