#!/usr/bin/env node
// check-attenuation-usage — gate de dimensión ATENUACIÓN (design-tokens / ADR-033, ECO-203).
//
// La norma: la atenuación (alpha) sale de un TOKEN semántico, nunca de un modificador de opacidad ad-hoc
// (`text-content-primary/75`, `bg-black/25`…). El `/NN` a mano es un tono escrito a mano, sin fuente única
// (gobernado solo por contraste, no por consistencia). En el modelo de 4 categorías la atenuación es
// ESTRUCTURA-DS (tokenizada + bloqueada) → UNIVERSAL, sin exención de tier.
//
// PRECISIÓN: caza el modificador de opacidad `/NN` sobre una clase de COLOR
// (bg/text/border/ring/fill/stroke/from/via/to/outline/placeholder/decoration/accent/caret/shadow/divide-<color>/<NN>).
// EXIME dos cosas: `current` (currentColor = 20% del color HEREDADO, no tokenizable a un valor FIJO — p.ej. la
// pista del spinner, que hereda el color del botón), y la línea (o la anterior) con `attenuation-ok: <razón>`.
//
// SCOPE = ds (components/ + sections/). MODO ratchet (baseline la deuda existente; solo decrece). Deuda de scope:
// falta extender a dashboard/satélites (como icon/spinner). La deuda actual del baseline = los scrims de marketing
// (overlays sobre media en Hero/Portfolio), que van a su propia dimensión overlay/on-media.
//
// Uso, cwd = design-system/:  node scripts/check-attenuation-usage.mjs [--update]

import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ratchetCheck, nextBaseline } from "./_ratchet.mjs";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(ds, "..");
const UPDATE = process.argv.includes("--update");
const GATE_ID = "attenuation";
const BASELINE_PATH = join(ds, "enforcement", "ratchet-baseline.json");

const roots = [join(ds, "components"), join(ds, "sections")];
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  "coverage",
  ".git",
]);

const UTIL =
  "bg|text|border|ring|fill|stroke|divide|placeholder|from|via|to|outline|decoration|accent|caret|shadow";
const RE = new RegExp(`\\b(?:${UTIL})-([a-zA-Z][\\w-]*)\\/\\d{1,3}\\b`, "g");

// Pura (lib): líneas con atenuación /NN sobre color (no currentColor), sin `attenuation-ok` en la línea ni la anterior.
export function attenuationHits(src) {
  const hits = [];
  const lines = src.split("\n");
  lines.forEach((line, i) => {
    const t = line.trim();
    if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return; // comentario (documenta)
    if (line.includes("attenuation-ok")) return;
    if (i > 0 && lines[i - 1].includes("attenuation-ok")) return;
    for (const m of line.matchAll(RE)) {
      if (m[1] === "current") continue; // currentColor-relativo: 20% del color heredado, no tokenizable
      hits.push({ line: i + 1, text: m[0], ctx: line.trim().slice(0, 80) });
    }
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
    for (const h of attenuationHits(src))
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
      `\n✗ check-attenuation-usage FALLA (ratchet) — ${r.current} atenuación(es) /NN ad-hoc > baseline ${r.allowed} (${r.exceeded} nueva(s)). Usa un token semántico (content-secondary/tertiary/placeholder, border-*, surface-*, --overlay…) o declara \`attenuation-ok: <razón>\`. (--update baja el baseline al migrar.)`,
    );
    for (const h of hits)
      console.error(`  ${h.file}:${h.line} ${h.text}  ${h.ctx}`);
    process.exit(1);
  }
  console.log(
    `✓ check-attenuation-usage OK (ratchet) — ${hits.length} /NN ad-hoc ≤ baseline ${baseline[GATE_ID] ?? 0}; sin nuevos.`,
  );
}
