#!/usr/bin/env node
// check-typography-tokens — gate de dimensión TIPOGRAFÍA (design-enforcement / ADR-031, ECO-193).
//
// La norma: el TAMAÑO de fuente sale de los tokens de tipografía (`text-body/caption/h1/…`), nunca de un valor
// arbitrario `text-[14px]`. Un px a mano no sigue la escala tipográfica ni el ritmo del sistema.
//
// PRECISIÓN por-dimensión (token-por-propiedad, no ban de sintaxis): se caza SOLO `text-[<número><px|rem|em>]`
// — un TAMAÑO de fuente arbitrario. NO se toca `text-[var(--…)]` (uso de token), ni `text-[#hex]` (eso es color,
// lo caza check-raw-color), ni otros arbitrary de text-*. Así se evita el falso positivo que el panel advirtió.
//
// SCOPE = fleet: DS (components/ + sections/) + nexacore-dashboard/src + satellites/*/src, EXCLUYENDO `ui/`
// (copias distribuidas) y las `stories/` (demos que muestran el px a propósito). MODO ratchet (baseline la deuda
// existente; solo decrece). Escape por-línea (o la anterior): `type-ok: <razón>`.
//
// Uso, cwd = design-system/:  node scripts/check-typography-tokens.mjs [--update]

import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ratchetCheck, nextBaseline } from "./_ratchet.mjs";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(ds, "..");
const UPDATE = process.argv.includes("--update");
const GATE_ID = "typography";
const BASELINE_PATH = join(ds, "enforcement", "ratchet-baseline.json");

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
  "ui", // copias distribuidas de primitivos
  "stories", // demos que muestran el px a propósito
]);
const RE = /text-\[[0-9.]+(px|rem|em)\]/;

// Pura (lib): líneas con un tamaño de fuente arbitrario (no var/token), sin `type-ok` en la línea ni la anterior.
export function typographyHits(src) {
  const hits = [];
  const lines = src.split("\n");
  lines.forEach((line, i) => {
    if (line.includes("type-ok")) return;
    if (i > 0 && lines[i - 1].includes("type-ok")) return;
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
    for (const h of typographyHits(src))
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
      `\n✗ check-typography-tokens FALLA (ratchet) — ${r.current} tamaño(s) de fuente arbitrario(s) > baseline ${r.allowed} (${r.exceeded} nuevo(s)). Usa un token (text-body/caption/h1/…) o declara \`type-ok: <razón>\`. (--update baja el baseline al migrar.)`,
    );
    for (const h of hits)
      console.error(`  ${h.file}:${h.line} ${h.text}  ${h.ctx}`);
    process.exit(1);
  }
  console.log(
    `✓ check-typography-tokens OK (ratchet) — ${hits.length} arbitrario(s) ≤ baseline ${baseline[GATE_ID] ?? 0}; sin nuevos.`,
  );
}
