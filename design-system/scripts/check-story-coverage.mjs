#!/usr/bin/env node
// check-story-coverage — guardrail de sincronía catálogo (Storybook) ↔ registry (em-ui), ADR-020.
//
// El registry.json es la verdad de DISTRIBUCIÓN (qué componentes existen + grafo de deps).
// Storybook es la VISUALIZACIÓN. Desde ECO-89 el catálogo está 100% ALINEADO con la realidad:
//
//   FALLA si:
//     (a) una story referencia un componente que NO está en el registry (huérfana / desync real),
//     (b) una EXCLUSIÓN declarada ya no es app-coupled (la lista no es un vertedero), o
//     (c) HAY PENDIENTES: algún item del registry sin story y sin exclusión (cobertura < 100%).
//
// Los componentes app-coupled (Theme/Toast) se catalogan con un @/context MOCK (ver
// .storybook/mocks/context) → ya NO se excluyen; la lista de exclusión queda vacía.
//
// Uso: node scripts/check-story-coverage.mjs   (cwd = design-system/)

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// --- Exclusiones documentadas (app-coupled SIN forma de catalogar). Hoy VACÍA: los app-coupled
//     se catalogan vía @/context mock. Si algo se excluye, debe ser app-coupled de verdad (se verifica).
const EXCLUSIONS = {};
const APP_COUPLED_RE = /@\/context\/|@\/hooks\/useTheme/;

function fail(msg) {
  console.error(`✗ coverage: ${msg}`);
  process.exitCode = 1;
}

// --- 1) Items del registry
const registry = JSON.parse(readFileSync(join(ds, "registry.json"), "utf8"));
const registryNames = new Set(registry.items.map((i) => i.name));

// --- 2) Componentes cubiertos por una story (import `@/components/{ui,sections}/<Name>`)
const storiesDir = join(ds, "stories");
const covered = new Set();
function walk(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith(".stories.tsx") || entry.name.endsWith(".stories.ts")) {
      const src = readFileSync(p, "utf8");
      for (const m of src.matchAll(/@\/components\/(?:ui|sections)\/(\w+)/g)) covered.add(m[1]);
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

// --- (c) cobertura 100%: ningún item del registry puede quedar sin story (salvo exclusión válida)
const excluded = new Set(Object.keys(EXCLUSIONS));
const pending = [...registryNames].filter((n) => !covered.has(n) && !excluded.has(n)).sort();
if (pending.length) {
  fail(`${pending.length} item(s) del registry SIN story (catálogo ≠ realidad): ${pending.join(", ")}`);
}

// --- Reporte (sin truncado silencioso)
console.log(`Catálogo Storybook ↔ registry (${registryNames.size} items)`);
console.log(`  ✓ con story:  ${covered.size}  [${[...covered].sort().join(", ")}]`);
console.log(`  ⊘ excluidos:  ${excluded.size}  [${[...excluded].sort().join(", ")}]`);
console.log(`  … pendientes: ${pending.length}  [${pending.join(", ")}]`);

if (process.exitCode) {
  console.error("\n✗ coverage FALLA (huérfana, exclusión inválida o cobertura < 100%).");
} else {
  console.log("\n✓ coverage OK — catálogo 100% alineado con el registry.");
}
