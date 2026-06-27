#!/usr/bin/env node
// check-story-coverage — guardrail de sincronía catálogo (Storybook) ↔ registry (em-ui), ADR-020.
//
// El registry.json es la verdad de DISTRIBUCIÓN (qué componentes existen + grafo de deps).
// Storybook es la VISUALIZACIÓN. Este check evita que se desincronicen, con DIENTES pero
// honesto sobre el alcance "muestra" de ECO-85:
//
//   FALLA si:
//     (a) una story referencia un componente que NO está en el registry (huérfana / desync real), o
//     (b) una EXCLUSIÓN declarada ya no es app-coupled (la lista no es un vertedero de "pendientes").
//   REPORTA (no falla): cubierto / excluido / PENDIENTE (con la lista completa — sin truncado silencioso),
//     porque la cobertura total de los 47 primitivos es incremento siguiente (ADR-020 §Consecuencias).
//
// Uso: node scripts/check-story-coverage.mjs   (cwd = design-system/)

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// --- Exclusiones documentadas: app-coupled (necesitan un provider de contexto que NO vive
//     en la fuente del design-system). Mismo criterio que CommandPalette en ADR-006.
//     Cada una se VERIFICA contra el código fuente (debe importar @/context/* o @/hooks/useTheme).
const EXCLUSIONS = {
  ThemeToggle: "usa @/hooks/useTheme → @/context/ThemeContext (no existe en la fuente)",
  TurnstileWidget: "usa @/hooks/useTheme → @/context/ThemeContext (no existe en la fuente)",
  ToastContainer: "usa @/context/ToastContext (no existe en la fuente)",
};
const APP_COUPLED_RE = /@\/context\/|@\/hooks\/useTheme/;

function fail(msg) {
  console.error(`✗ coverage: ${msg}`);
  process.exitCode = 1;
}

// --- 1) Items del registry
const registry = JSON.parse(readFileSync(join(ds, "registry.json"), "utf8"));
const registryNames = new Set(registry.items.map((i) => i.name));

// --- 2) Componentes cubiertos por una story (import `@/components/ui/<Name>`)
const storiesDir = join(ds, "stories");
const covered = new Set();
function walk(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith(".stories.tsx") || entry.name.endsWith(".stories.ts")) {
      const src = readFileSync(p, "utf8");
      for (const m of src.matchAll(/@\/components\/ui\/(\w+)/g)) covered.add(m[1]);
    }
  }
}
walk(storiesDir);

// --- (a) sin huérfanas: toda story debe mapear a un item del registry
for (const name of covered) {
  if (!registryNames.has(name)) fail(`story de "${name}" no existe en registry.json (huérfana/desync)`);
}

// --- (b) exclusiones honestas: cada excluida debe estar en el registry y ser app-coupled de verdad
for (const name of Object.keys(EXCLUSIONS)) {
  if (!registryNames.has(name)) {
    fail(`exclusión "${name}" no está en registry.json (lista obsoleta)`);
    continue;
  }
  const file = join(ds, "components", `${name}.tsx`);
  if (!existsSync(file) || !APP_COUPLED_RE.test(readFileSync(file, "utf8"))) {
    fail(`exclusión "${name}" ya no es app-coupled — quítala de la lista y dale una story`);
  }
}

// --- Reporte (sin truncado silencioso)
const excluded = new Set(Object.keys(EXCLUSIONS));
const pending = [...registryNames].filter((n) => !covered.has(n) && !excluded.has(n)).sort();

console.log(`Catálogo Storybook ↔ registry (${registryNames.size} items)`);
console.log(`  ✓ con story:  ${covered.size}  [${[...covered].sort().join(", ")}]`);
console.log(`  ⊘ excluidos:  ${excluded.size}  (app-coupled) [${[...excluded].sort().join(", ")}]`);
console.log(`  … pendientes: ${pending.length}  [${pending.join(", ")}]`);

if (process.exitCode) {
  console.error("\n✗ coverage FALLA (huérfana o exclusión inválida).");
} else {
  console.log("\n✓ coverage OK (sin huérfanas; exclusiones verificadas app-coupled).");
}
