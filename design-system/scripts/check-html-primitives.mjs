#!/usr/bin/env node
// check-html-primitives — gate de dimensión PRIMITIVOS HTML (design-enforcement / ADR-031, ECO-192).
//
// La norma: en el código de PRODUCTO (consumidor) no se dibuja un control interactivo a mano con `<button>`/
// `<input>`/`<select>`/`<textarea>` crudo — se compone el primitivo del DS (`<Button>`/`<Input>`/…). Un control
// crudo escapa a la pieza oficial (estilo, a11y, estados, foco) y no propaga.
//
// SCOPE = "consumidor-menos-primitivos": nexacore-dashboard/src + satellites/*/src, EXCLUYENDO `**/components/ui/`
// (las copias distribuidas de los primitivos, donde el `<button>` nativo es la DEFINICIÓN, legítima) y el propio
// design-system/ (idem). A scope-DS sería ~100% falsos positivos — por eso el scope es INVERSO al del gate de icono.
//
// MODO ratchet: no zero-tolerance. Un baseline (enforcement/ratchet-baseline.json) registra la deuda actual; el
// gate FALLA solo si SUBE. `--update` re-baja el baseline al arreglar (solo decrece). Escape por-línea (o la línea
// anterior, para JSX multi-línea): `html-ok: <razón>` (p.ej. página de crash DS-independiente, demo de estados).
//
// Uso, cwd = design-system/:  node scripts/check-html-primitives.mjs [--update]

import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ratchetCheck, nextBaseline } from "./_ratchet.mjs";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(ds, "..");
const UPDATE = process.argv.includes("--update");
const GATE_ID = "html-primitives";
const BASELINE_PATH = join(ds, "enforcement", "ratchet-baseline.json");

const roots = [join(repo, "nexacore-dashboard", "src")];
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
  "ui", // components/ui/ = copias distribuidas de primitivos (la definición nativa es legítima)
]);
const RE = /<(button|input|select|textarea)(?![A-Za-z0-9])/;

// Pura (lib): líneas con un primitivo HTML crudo, sin `html-ok` en la línea ni en la anterior. Exportada para test.
export function htmlHits(src) {
  const hits = [];
  const lines = src.split("\n");
  lines.forEach((line, i) => {
    if (line.includes("html-ok")) return;
    if (i > 0 && lines[i - 1].includes("html-ok")) return;
    const m = line.match(RE);
    if (m) hits.push({ line: i + 1, tag: m[1], ctx: line.trim().slice(0, 80) });
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
    for (const h of htmlHits(src))
      hits.push({ file: p.replace(repo + "/", ""), ...h });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const root of roots) walk(root);
  const baseline = existsSync(BASELINE_PATH)
    ? JSON.parse(readFileSync(BASELINE_PATH, "utf8"))
    : {};

  if (UPDATE) {
    const nb = nextBaseline(baseline, GATE_ID, hits.length);
    writeFileSync(BASELINE_PATH, JSON.stringify(nb, null, 2) + "\n");
    console.log(
      `↧ ratchet-baseline actualizado: ${GATE_ID} = ${nb[GATE_ID]} (solo decrece).`,
    );
    process.exit(0);
  }

  const r = ratchetCheck(baseline, GATE_ID, hits.length);
  if (r.fail) {
    console.error(
      `\n✗ check-html-primitives FALLA (ratchet) — ${r.current} primitivo(s) HTML crudo(s) > baseline ${r.allowed} (${r.exceeded} nuevo(s)). Compón <Button>/<Input>/… o declara \`html-ok: <razón>\`. (Al arreglar deuda existente: --update baja el baseline.)`,
    );
    for (const h of hits)
      console.error(`  ${h.file}:${h.line} <${h.tag}>  ${h.ctx}`);
    process.exit(1);
  }
  console.log(
    `✓ check-html-primitives OK (ratchet) — ${hits.length} crudo(s) ≤ baseline ${baseline[GATE_ID] ?? 0}; sin nuevos.`,
  );
}
