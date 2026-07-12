#!/usr/bin/env node
// check-animation-import — gate de dimensión ANIMACIÓN/import (design-enforcement / ADR-031, ECO-195).
//
// La norma: la librería de animación (Motion, antes "Framer Motion") se importa SIEMPRE por su nombre canónico
// `motion/react`, NUNCA por el alias legacy `framer-motion`. Son la MISMA librería con dos nombres; arrastrar los
// dos = version-soup (dos entradas en package.json, dos specifiers en el registry para la misma dep).
//
// PRECISIÓN por-dimensión: caza SOLO el specifier de un import/re-export — `from "framer-motion"` (comillas simples
// o dobles). NO matchea una mención en string/array (`files: ["framer-motion"]`) ni un comentario: sin `from`
// delante, no es un import. El paquete oficial es `motion` (import `motion/react`).
//
// SCOPE = fleet: DS (components/ + sections/) + nexacore-dashboard/src + satellites/*/src, en .tsx y .ts,
// excluyendo node_modules/build. MODO enforce (hoy 0 — lock preventivo). Escape por-línea (o anterior):
// `animation-ok`.
//
// Uso, cwd = design-system/:  node scripts/check-animation-import.mjs

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
]);
const RE = /from\s+["']framer-motion["']/;

// Pura (lib): líneas que importan del alias legacy `framer-motion`, sin `animation-ok` en la línea ni la anterior.
export function animationImportHits(src) {
  const hits = [];
  const lines = src.split("\n");
  lines.forEach((line, i) => {
    if (line.includes("animation-ok")) return;
    if (i > 0 && lines[i - 1].includes("animation-ok")) return;
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
    if (!e.isFile()) continue;
    if (!e.name.endsWith(".tsx") && !e.name.endsWith(".ts")) continue;
    if (e.name.endsWith(".d.ts")) continue;
    const p = join(dir, e.name);
    let src;
    try {
      src = readFileSync(p, "utf8");
    } catch {
      continue;
    }
    for (const h of animationImportHits(src))
      hits.push({ file: p.replace(repo + "/", ""), ...h });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const root of roots) walk(root);
  if (hits.length) {
    console.error(
      `\n✗ check-animation-import FALLA — ${hits.length} import(s) del alias legacy. Usa \`motion/react\` (paquete \`motion\`), no \`framer-motion\`, o declara \`animation-ok: <razón>\`.`,
    );
    for (const h of hits)
      console.error(`  ${h.file}:${h.line} ${h.text}  ${h.ctx}`);
    process.exit(1);
  }
  console.log(
    "✓ check-animation-import OK — ningún import de `framer-motion` (todos por `motion/react`).",
  );
}
