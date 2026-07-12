#!/usr/bin/env node
// check-spinner-usage — gate de dimensión SPINNER (estrategia design-enforcement / ADR-031, ECO-191).
//
// La norma: un indicador de carga circular se compone con el primitivo `SpinnerCircle` (o Ring/Infinity), nunca
// a mano con `animate-spin` + borde. Un spinner hand-rolled escapa a la pieza oficial (tamaño/borde/color/a11y):
// no propaga si el primitivo cambia. Registrado en enforcement/protected-dimensions.json.
//
// PRECISIÓN por-dimensión: se caza `animate-spin` como clase COMPLETA — `animate-spin(?![-\w])` — NO el
// `animate-spin-around` de ShimmerButton (otra animación, un shimmer de borde, no un spinner de carga). Esta
// precisión es la que la validación de la estrategia demostró necesaria (outcome mixed).
//
// EXENTO: los primitivos que DEFINEN el spinner (SpinnerCircle/Ring/Infinity). Escape por-línea: `spinner-ok`.
// SCOPE: ds (components/ + sections/).
//
// Uso, cwd = design-system/:  node scripts/check-spinner-usage.mjs

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const roots = [join(ds, "components"), join(ds, "sections")];
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  "coverage",
  ".git",
]);
const EXEMPT_BASENAME = new Set([
  "SpinnerCircle.tsx",
  "SpinnerRing.tsx",
  "SpinnerInfinity.tsx",
]);

// Pura (lib): líneas con un `animate-spin` a mano (clase completa, no `animate-spin-around`), sin `spinner-ok`.
export function spinnerHits(src) {
  const hits = [];
  src.split("\n").forEach((line, i) => {
    if (line.includes("spinner-ok")) return;
    if (/animate-spin(?![-\w])/.test(line))
      hits.push({ line: i + 1, ctx: line.trim().slice(0, 80) });
  });
  return hits;
}

const hits = [];
function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(join(dir, e.name));
      continue;
    }
    if (!e.isFile() || !e.name.endsWith(".tsx") || EXEMPT_BASENAME.has(e.name))
      continue;
    const p = join(dir, e.name);
    let src;
    try {
      src = readFileSync(p, "utf8");
    } catch {
      continue;
    }
    for (const h of spinnerHits(src))
      hits.push({ file: p.replace(resolve(ds, "..") + "/", ""), ...h });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const root of roots) walk(root);
  if (hits.length) {
    console.error(
      `\n✗ check-spinner-usage FALLA — ${hits.length} spinner(s) a mano. Compón <SpinnerCircle size="…" tone="…" /> (Ring/Infinity), o declara \`spinner-ok: <razón>\` en la línea.`,
    );
    for (const h of hits) console.error(`  ${h.file}:${h.line}  ${h.ctx}`);
    process.exit(1);
  }
  console.log(
    "✓ check-spinner-usage OK — ningún spinner circular a mano (todos vía SpinnerCircle/Ring/Infinity).",
  );
}
