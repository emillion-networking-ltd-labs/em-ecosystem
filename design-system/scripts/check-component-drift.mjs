#!/usr/bin/env node
// check-component-drift — gate de CI de drift de COMPONENTES em-ui (ECO-136, Fase 2 de la estrategia design-tokens).
//
// Hermano de check-drift (que cubre la capa de tokens). em-ui distribuye los componentes por COPIA literal
// (em-ui add/update, mismo alias @/ → sin reescritura de imports), así que la copia de un componente registrado
// en un consumidor DEBE ser idéntica a la fuente design-system/. Si diverge, el consumidor quedó STALE (no hizo
// pull de la evolución del DS — el bug que este ticket destapó: 34 componentes viejos en el dashboard con bordes
// mal, LanguageSelector pesado, etc.) o editó su copia a mano. Ambos casos = la norma se propaga MAL en silencio.
//
// Este gate compara cada copia de consumidor con su fuente y FALLA el CI si hay drift → obliga a:
//   - re-pull:  em-ui update <Componente> --dest <consumer>/src   (adoptar la fuente), o
//   - back-port: subir la adaptación legítima a la fuente (para que se comparta), NO dejar divergir la copia.
// Los componentes propios del consumidor (sin contraparte en el DS) se ignoran.
//
// Mapeo em-ui: DS components/<X>.tsx → consumer components/ui/<X>.tsx ; DS sections/<X>.tsx → consumer
// components/sections/<X>.tsx. Uso, cwd = design-system/:  node scripts/check-component-drift.mjs

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isAdapted, hasConflictMarkers } from "../registry/_reconcile.mjs";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(ds, "..");

// Fuentes DS por nombre de fichero (components + sections). name.tsx → ruta fuente.
const dsSources = new Map();
for (const srcDir of ["components", "sections"]) {
  const dir = join(ds, srcDir);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir)) if (f.endsWith(".tsx")) dsSources.set(f, join(dir, f));
}

// Consumidores: dashboard + satélites. Cada uno copia a components/ui y components/sections.
const consumers = [join(repo, "nexacore-dashboard")];
const satRoot = join(repo, "satellites");
if (existsSync(satRoot)) {
  for (const s of readdirSync(satRoot)) {
    const r = join(satRoot, s);
    try { if (statSync(r).isDirectory()) consumers.push(r); } catch { /* ignore */ }
  }
}

let drifted = 0, adapted = 0, checked = 0, consumersWithCopies = 0;
for (const root of consumers) {
  let any = false;
  for (const d of ["src/components/ui", "src/components/sections"]) {
    const dir = join(root, d);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".tsx")) continue;
      const src = dsSources.get(f);
      if (!src) continue; // propio del consumidor (sin contraparte DS) → no es una copia gobernada, ignorar
      any = true; checked++;
      const a = readFileSync(src, "utf8"), b = readFileSync(join(dir, f), "utf8");
      const rel = join(root, d, f).replace(repo + "/", "");
      if (a === b) continue;
      // Marcadores de conflicto SIN resolver → falla SIEMPRE, ANTES del valve (el `@em-ui-adapted` NO los excusa;
      // romperían el build del consumidor). El gate dedicado check-conflict-markers los caza en todo el árbol.
      if (hasConflictMarkers(b)) {
        drifted++;
        console.error(`  [CONFLICTO] ${rel} — marcadores de conflicto git SIN resolver (resuélvelos)`);
        continue;
      }
      const al = a.split("\n"), bl = b.split("\n");
      const setA = new Set(al), setB = new Set(bl);
      const diff = al.filter((l) => l.trim() && !setB.has(l)).length + bl.filter((l) => l.trim() && !setA.has(l)).length;
      // Válvula: una copia que diverge A PROPÓSITO (adaptación de app/marca) lo DECLARA con `@em-ui-adapted` EN LA
      // CABECERA (isAdapted, estructurado — un marcador incrustado en el cuerpo NO cuenta). Sin él, divergir =
      // drift stale (no hizo pull) → falla. Con él = adaptación consciente (se reporta).
      if (isAdapted(b)) {
        adapted++;
        console.log(`  [adaptado] ${rel} — ${diff} línea(s) divergen (declarado @em-ui-adapted)`);
        continue;
      }
      drifted++;
      console.log(`  [DRIFT] ${rel} — ${diff} línea(s) divergen de la fuente (${f})`);
    }
  }
  if (any) consumersWithCopies++;
}

console.log(`\nem-ui component drift — ${checked} copia(s) revisada(s) en ${consumersWithCopies} consumidor(es); ${adapted} adaptada(s) declarada(s).`);
if (drifted) {
  console.error(`✗ check-component-drift FALLA — ${drifted} componente(s) con drift NO declarado.`);
  console.error(`  Re-pull: em-ui update <Componente> --dest <consumer>/src (adoptar la fuente),`);
  console.error(`  o back-portea la adaptación a la fuente, o si es divergencia consciente decláralo con \`@em-ui-adapted: <razón>\`.`);
  process.exit(1);
} else {
  console.log(`✓ check-component-drift OK — copias idénticas a la fuente o divergencia declarada (${adapted} adaptada).`);
}
