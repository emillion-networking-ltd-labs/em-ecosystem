#!/usr/bin/env node
// check-motion-tokens — gate de dimensión MOVIMIENTO (design-enforcement / ADR-031, ECO-194).
//
// La norma: la DURACIÓN de una transición sale de los tokens de movimiento (`duration-[var(--duration-fast|base|
// slow)]`) o de la escala de Tailwind (`duration-200`), nunca de un literal arbitrario `duration-[250ms]`. Un ms
// a mano no sigue el ritmo del sistema de motion.
//
// PRECISIÓN por-dimensión: caza SOLO `duration-[<número>ms|s]` — un literal de duración arbitrario. NO toca
// `duration-[var(--…)]` (token) ni `duration-200` (escala). El `[--duration:40s]` de Marquee es una DEFINICIÓN de
// var local (parámetro de animación del componente, no una transición de UI) → no matchea, correcto.
//
// SCOPE = fleet: DS (components/ + sections/) + nexacore-dashboard/src + satellites/*/src, excluyendo `ui/` y
// `stories/`. MODO enforce (hoy 0 violaciones — lock preventivo). Escape por-línea (o anterior): `motion-ok`.
//
// Uso, cwd = design-system/:  node scripts/check-motion-tokens.mjs

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(ds, "..");

const roots = [
  join(ds, "components"),
  join(ds, "sections"),
  join(repo, "nexacore-dashboard", "src"),
];
const satRoot = join(repo, "satellites");
if (existsSync(satRoot))
  for (const s of readdirSync(satRoot)) {
    const r = join(satRoot, s, "src");
    if (existsSync(r)) roots.push(r);
  }

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  "coverage",
  ".git",
  "ui",
  "stories",
]);
const RE = /duration-\[[0-9.]+m?s\]/;

// Pura (lib): líneas con una duración de transición arbitraria (no var), sin `motion-ok` en la línea ni la anterior.
export function motionHits(src) {
  const hits = [];
  const lines = src.split("\n");
  lines.forEach((line, i) => {
    if (line.includes("motion-ok")) return;
    if (i > 0 && lines[i - 1].includes("motion-ok")) return;
    const m = line.match(RE);
    if (m)
      hits.push({ line: i + 1, text: m[0], ctx: line.trim().slice(0, 80) });
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
    if (!e.isFile() || !e.name.endsWith(".tsx")) continue;
    const p = join(dir, e.name);
    let src;
    try {
      src = readFileSync(p, "utf8");
    } catch {
      continue;
    }
    for (const h of motionHits(src))
      hits.push({ file: p.replace(repo + "/", ""), ...h });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const root of roots) walk(root);
  if (hits.length) {
    console.error(
      `\n✗ check-motion-tokens FALLA — ${hits.length} duración(es) arbitraria(s). Usa un token (duration-[var(--duration-fast|base|slow)]) o la escala (duration-200), o declara \`motion-ok: <razón>\`.`,
    );
    for (const h of hits)
      console.error(`  ${h.file}:${h.line} ${h.text}  ${h.ctx}`);
    process.exit(1);
  }
  console.log(
    "✓ check-motion-tokens OK — ninguna duración de transición arbitraria (todas desde token/escala).",
  );
}
