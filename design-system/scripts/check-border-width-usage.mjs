#!/usr/bin/env node
// check-border-width-usage — gate de dimensión BORDER-WIDTH (ECO-205 / design-tokens, ADR-033: border-width ∈ MARCA).
//
// La norma: el grosor de borde sale de un TOKEN — `border` (1px base, default de Tailwind) o
// `border-[var(--border-width-sm|md|lg)]` para bordes/anillos gruesos —, nunca de un `border-[Npx]` crudo ni de la
// escala genérica de Tailwind (`border-2/4/8`). TIER-AWARE: las piezas `@ds-tier: decorative` (efectos) usan grosor
// propio → exentas.
//
// SCOPE = ds (components/). MODO enforce (0 en core tras ECO-205 → lock preventivo). Escape: `border-width-ok`.
//
// Uso, cwd = design-system/:  node scripts/check-border-width-usage.mjs
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const componentsDir = join(ds, "components");
const TIER_RE = /@ds-tier:\s*(core|decorative)\b/;
const RAW = /\bborder(?:-[xytrbl])?-\[[0-9.]+(?:px|rem|em)\]/; // border-[1.5px] (arbitrario crudo; border-[var(--…)] NO matchea)
const SCALE = /\bborder(?:-[xytrbl])?-[248]\b/; // border-2/4/8 (escala genérica de Tailwind)

// Pura (lib): grosores de borde ad-hoc en una pieza NO-decorative. Exportada para test.
export function borderWidthHits(src) {
  if (src.match(TIER_RE)?.[1] === "decorative") return []; // efecto cosechado → exento
  const hits = [];
  src.split("\n").forEach((line, i) => {
    const t = line.trim();
    if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return; // comentario
    if (line.includes("border-width-ok")) return;
    const m = line.match(RAW) || line.match(SCALE);
    if (m)
      hits.push({ line: i + 1, text: m[0], ctx: line.trim().slice(0, 80) });
  });
  return hits;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = readdirSync(componentsDir).filter((f) => f.endsWith(".tsx"));
  const hits = [];
  for (const f of files)
    for (const h of borderWidthHits(
      readFileSync(join(componentsDir, f), "utf8"),
    ))
      hits.push({ file: `components/${f}`, ...h });
  if (hits.length) {
    console.error(
      `\n✗ check-border-width-usage FALLA — ${hits.length} grosor(es) de borde ad-hoc en pieza(s) core. Usa ` +
        `\`border\` (1px base) o \`border-[var(--border-width-sm|md|lg)]\`, o declara \`border-width-ok: <razón>\`. ` +
        `Los efectos \`@ds-tier: decorative\` están exentos.`,
    );
    for (const h of hits)
      console.error(`  ${h.file}:${h.line} ${h.text}  ${h.ctx}`);
    process.exit(1);
  }
  console.log(
    `✓ check-border-width-usage OK — grosor de borde desde token/base en piezas core.`,
  );
}
