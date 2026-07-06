#!/usr/bin/env node
// check-conflict-markers — gate de CI dedicado (ECO-144, design-propagation Fase 1).
//
// Backstop del reconcile de em-ui: NINGÚN fichero de código (DS o consumidor) puede llevar marcadores de
// conflicto de merge git sin resolver. Es independiente del valve `@em-ui-adapted` (que excusa divergencia
// declarada pero NUNCA un merge a medias) porque un `<<<<<<<` rompe `next build`/`tsc` del consumidor, y los
// PRs de satélite no corren typecheck/build (security.yml) → sin este gate, un conflicto colado llega a main.
//
// Uso, cwd = design-system/:  node scripts/check-conflict-markers.mjs

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { hasConflictMarkers } from "../registry/_reconcile.mjs";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(ds, "..");

// Árboles a escanear: la fuente del DS + el código de cada consumidor. Se recorren en profundidad.
const roots = [ds, join(repo, "nexacore-dashboard", "src"), join(repo, "nexacore-api", "src")];
const satRoot = join(repo, "satellites");
if (existsSync(satRoot)) {
  for (const s of readdirSync(satRoot)) {
    const r = join(satRoot, s, "src");
    if (existsSync(r)) roots.push(r);
  }
}

const SKIP_DIRS = new Set(["node_modules", ".next", ".turbo", "dist", "build", "coverage", ".git", "storybook-static", "test-results", "playwright-report"]);
// Solo código que ROMPE el build/tsc si lleva un conflicto. Se excluye .md (ejemplos de diff = falsos positivos)
// y config suelta; el objetivo es proteger las copias em-ui y el código de app.
const CODE_EXT = /\.(tsx?|jsx?|mjs|cjs|css|scss)$/;

const hits = [];
function walk(dir) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(join(dir, e.name));
      continue;
    }
    if (!e.isFile() || !CODE_EXT.test(e.name)) continue;
    const p = join(dir, e.name);
    let content;
    try { content = readFileSync(p, "utf8"); } catch { continue; }
    if (hasConflictMarkers(content)) hits.push(p.replace(repo + "/", ""));
  }
}
for (const root of roots) walk(root);

if (hits.length) {
  console.error(`✗ check-conflict-markers FALLA — ${hits.length} fichero(s) con marcadores de conflicto git SIN resolver:`);
  for (const h of hits) console.error(`    - ${h}`);
  console.error(`  Resuelve el conflicto (elimina <<<<<<< / ======= / >>>>>>> ) antes de commitear — rompen el build.`);
  process.exit(1);
} else {
  console.log("✓ check-conflict-markers OK — sin marcadores de conflicto en DS ni consumidores.");
}
