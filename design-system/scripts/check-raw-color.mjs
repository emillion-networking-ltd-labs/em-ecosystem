#!/usr/bin/env node
// check-raw-color — gate de CI (ECO-145, design-propagation Fase 1 E2).
//
// La clase de error GREP-CATCHABLE del estándar design-propagation: un elemento pinta con un VALOR CRUDO de
// color (hex, rgb/hsl, arbitrary Tailwind `-[#…]`, o una clase de PALETA cruda tipo `text-slate-500`) en vez
// del vocabulario de TOKENS (content-*/surface-*/border-*/accent-*/feedback). El color crudo (1) no sigue el
// tema, (2) no respeta la marca, (3) escapa a check-contrast/check-brand-contrast. Este gate lo caza en el DS
// y en el código de cada consumidor (barrido total).
//
// EXENTOS: los ficheros que DEFINEN los valores crudos (tokens.css, brand.template.css, em-ui-tokens.css,
// em-ui-brand.css) — ahí el hex es legítimo (es la fuente). Escape declarado por línea: `raw-color-ok`.
//
// Uso, cwd = design-system/:  node scripts/check-raw-color.mjs [--report]   (--report = lista sin fallar)

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { dirname, join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(ds, "..");
const REPORT = process.argv.includes("--report");

// Raíces de código que DEBE usar tokens (no incluye los ficheros de definición de tokens).
const roots = [
  join(ds, "components"),
  join(ds, "sections"),
  join(ds, "stories"),
  join(repo, "nexacore-dashboard", "src"),
];
const satRoot = join(repo, "satellites");
if (existsSync(satRoot)) {
  for (const s of readdirSync(satRoot)) {
    const r = join(satRoot, s, "src");
    if (existsSync(r)) roots.push(r);
  }
}

const SKIP_DIRS = new Set(["node_modules", ".next", ".turbo", "dist", "build", "coverage", ".git", "storybook-static", "test-results", "playwright-report"]);
const CODE_EXT = /\.(tsx?|jsx?|css|scss)$/;
// Ficheros que DEFINEN/DOCUMENTAN valores crudos → exentos. TokenInspector es la herramienta de dev que
// MUESTRA el valor crudo de cada token junto a su cssVar (los raws son su DATO, no un uso de color).
const EXEMPT_BASENAME = new Set(["tokens.css", "brand.template.css", "em-ui-tokens.css", "em-ui-brand.css", "TokenInspector.tsx", "ComponentShowcase.tsx", "design-tokens.ts"]);
// Un match dentro de un COMENTARIO no pinta nada (documenta un valor) → no cuenta.
const COMMENT_LINE = /^\s*(\/\/|\/\*|\*|<!--)/;
// Una línea que DEFINE un custom property (`--token: valor`) es la FUENTE del token (donde el valor vive una
// vez), no un uso crudo — se permite en cualquier fichero (así un consumidor puede declarar sus primitivos
// locales, p.ej. el `--paper` del satélite). El USO crudo (background: #hex, bg-[#hex]) sí se caza.
const DEFINE_LINE = /^\s*--[\w-]+\s*:/;

const PALETTE = "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const UTIL = "bg|text|border|ring|fill|stroke|from|via|to|shadow|outline|decoration|divide|accent|caret|placeholder";
const DETECTORS = [
  ["hex", new RegExp(`#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\\b`)],
  // rgb/hsl con NÚMEROS crudos; `rgb(var(--token))` es uso de TOKEN (con alpha) → exento por el lookahead.
  ["rgb/hsl", /\b(?:rgba?|hsla?)\s*\(\s*(?!var)/],
  ["arbitrary", new RegExp(`\\b(?:${UTIL})-\\[\\s*(?:#|rgb|hsl)`)],
  ["paleta", new RegExp(`\\b(?:${UTIL})-(?:${PALETTE})-(?:50|[1-9]00|950)\\b`)],
];

// Pura (lib): ¿esta línea USA un valor crudo de color? Devuelve {kind,text} o null. Salta declaraciones,
// comentarios, definiciones de token y `raw-color-ok`. Exportada para test.
export function rawColorMatch(line) {
  if (line.includes("raw-color-ok")) return null;
  if (COMMENT_LINE.test(line)) return null;
  if (DEFINE_LINE.test(line)) return null;
  for (const [kind, re] of DETECTORS) {
    const m = line.match(re);
    if (m) return { kind, text: m[0] };
  }
  return null;
}

const hits = [];
function walk(dir) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(join(dir, e.name)); continue; }
    if (!e.isFile() || !CODE_EXT.test(e.name) || EXEMPT_BASENAME.has(e.name)) continue;
    const p = join(dir, e.name);
    let lines;
    try { lines = readFileSync(p, "utf8").split("\n"); } catch { continue; }
    lines.forEach((line, i) => {
      const r = rawColorMatch(line);
      if (r) hits.push({ file: p.replace(repo + "/", ""), line: i + 1, kind: r.kind, text: r.text, ctx: line.trim().slice(0, 80) });
    });
  }
}

// Sólo escanea cuando se ejecuta como CLI (no al importarlo desde un test).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
for (const root of roots) walk(root);

// Agrupar por fichero para el report.
const byFile = new Map();
for (const h of hits) { if (!byFile.has(h.file)) byFile.set(h.file, []); byFile.get(h.file).push(h); }
const byKind = {};
for (const h of hits) byKind[h.kind] = (byKind[h.kind] || 0) + 1;

if (REPORT || hits.length) {
  console.log(`\ncheck-raw-color — ${hits.length} valor(es) de color crudo en ${byFile.size} fichero(s). Por tipo: ${JSON.stringify(byKind)}`);
  for (const [file, hs] of [...byFile.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${file}  (${hs.length})`);
    for (const h of hs.slice(0, REPORT ? 100 : 6)) console.log(`    :${h.line} [${h.kind}] ${h.text}   — ${h.ctx}`);
  }
}
if (!hits.length) {
  console.log("✓ check-raw-color OK — sin valores de color crudo fuera de los tokens.");
} else if (!REPORT) {
  console.error(`\n✗ check-raw-color FALLA — ${hits.length} valor(es) crudo(s). Usa un token (content-*/surface-*/border-*/accent-*) o declara \`raw-color-ok: <razón>\` en la línea.`);
  process.exit(1);
}
}
