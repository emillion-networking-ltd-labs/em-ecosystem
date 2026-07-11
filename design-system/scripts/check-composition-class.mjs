#!/usr/bin/env node
// check-composition-class — una pieza en `Composite/` DEBE componer primitivos de verdad (ECO-176).
// Fuente ÚNICA del grafo: `registryDependencies` en registry.json. Complementa el banner "Composed of"
// (que muestra lo mismo, también leído del registry).
//
//   · `Composite/*` → registryDependencies NO vacío (compone al menos un primitivo). ENFORCED.
//   · `Simple/*`    → NO se enforce la ausencia de deps: un primitivo puede usar un HELPER interno sin ser
//                     compuesto (p.ej. Button usa SpinnerInfinity para el estado de carga y sigue siendo el
//                     primitivo de referencia). "Compuesto" es *hecho de otros primitivos como esencia*
//                     (SegmentedControl → Button), no *"usa un helper"* — eso es juicio, no se automatiza aquí.
//
// (El detector que caza "RE-IMPLEMENTA un primitivo en vez de componerlo" —el caso SegmentedControl previo—
//  es la auditoría de duplicación del censo, aparte y más fuerte que esta guarda.)
//
// Uso: node scripts/check-composition-class.mjs   (cwd = design-system/)

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const registry = JSON.parse(readFileSync(join(ds, "registry.json"), "utf8"));
const byName = Object.fromEntries(registry.items.map((i) => [i.name, i]));

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name.endsWith(".stories.tsx")) out.push(p);
  }
  return out;
}

const errors = [];
for (const f of walk(join(ds, "stories"))) {
  const src = readFileSync(f, "utf8");
  const title = src.match(/title:\s*["']([^"']+)["']/)?.[1];
  if (!title || !title.startsWith("Composite/")) continue;

  // El último segmento del título de un Composite == su nombre en el registry (convención).
  const name = title.split("/").pop();
  const item = byName[name];
  if (!item) {
    errors.push(
      `${title}: no encuentro '${name}' en el registry (el título de un Composite debe = el nombre del registry).`,
    );
    continue;
  }
  const deps = item.registryDependencies ?? [];
  if (deps.length === 0)
    errors.push(
      `${title}: está en Composite/ pero registryDependencies está VACÍO (no compone ningún primitivo) → debería ir a Simple/, o compone algo y falta declararlo.`,
    );
}

if (errors.length) {
  console.error("✗ composition-class:\n  " + errors.join("\n  "));
  process.exit(1);
}
console.log(
  "✓ composition-class OK — cada pieza Composite/ compone primitivos de verdad (registryDependencies no vacío).",
);
