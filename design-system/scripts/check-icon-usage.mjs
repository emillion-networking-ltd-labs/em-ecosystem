#!/usr/bin/env node
// check-icon-usage — gate de CI (ECO-186, cierre del rollout del sistema de icono).
//
// La norma: TODO glyph de `lucide-react` se renderiza vía `<Icon icon={Glyph} size="..." />` — nunca directo
// (`<Search .../>`). Un glyph directo escapa a la escala registrada (`ICON_SIZES`): su tamaño queda A MANO (el
// prop `size={N}`, la clase `size-N`/`h-N w-N`, o el default de lucide) → número mágico que no propaga si la
// escala cambia. El contenedor `<Icon>` impone el tamaño desde la fuente única.
//
// EXENTO: Icon.tsx (DEFINE el render del glyph). Escape declarado por línea: `icon-ok: <razón>` (para un caso
// legítimo de render crudo, p.ej. una animación que `<Icon>` no cubra).
//
// SCOPE: el DS shipped (components/ + sections/). El código de features del dashboard va en su propio barrido
// (deuda aparte); cuando se limpie, se añade su raíz aquí.
//
// Uso, cwd = design-system/:  node scripts/check-icon-usage.mjs [--report]   (--report = lista sin fallar)

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(ds, "..");
const REPORT = process.argv.includes("--report");

const roots = [join(ds, "components"), join(ds, "sections")];
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  "coverage",
  ".git",
]);
const EXEMPT_BASENAME = new Set(["Icon.tsx"]);

// Pura (lib): nombres LOCALES de glyph importados de lucide-react (value imports). `type X` no se renderiza;
// `X as Y` → el nombre local es Y (lo que aparece en el JSX). Exportada para test.
export function lucideGlyphs(src) {
  const names = new Set();
  const re = /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+["']lucide-react["']/g;
  let m;
  while ((m = re.exec(src))) {
    for (let part of m[1].split(",")) {
      part = part.trim();
      if (!part || part.startsWith("type ")) continue; // `type X` es un tipo, no un glyph renderizable
      const local = part.includes(" as ")
        ? part.split(/\s+as\s+/)[1].trim()
        : part.trim();
      if (/^[A-Z]/.test(local)) names.add(local);
    }
  }
  return names;
}

// Pura (lib): líneas donde un glyph de `glyphs` se RENDERIZA directo (`<Glyph` con `/`, `>` o espacio detrás).
// `icon={Glyph}` (pasar el componente) NO cuenta — solo el render JSX. `icon-ok` en la línea la exime.
export function directGlyphHits(src, glyphs) {
  const hits = [];
  src.split("\n").forEach((line, i) => {
    if (line.includes("icon-ok")) return;
    for (const g of glyphs) {
      // `<Glyph` no seguido de [A-Za-z0-9] → matchea `<Check`, `<Check>`, `<Check `, `<Check/` y `<Check` a
      // final de línea (JSX multi-línea), pero NO `<CheckboxThing`. Sin esto se colaban los opens multi-línea.
      if (new RegExp(`<${g}(?![A-Za-z0-9])`).test(line)) {
        hits.push({ line: i + 1, glyph: g, ctx: line.trim().slice(0, 80) });
      }
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
    if (!e.isFile() || !e.name.endsWith(".tsx") || EXEMPT_BASENAME.has(e.name))
      continue;
    const p = join(dir, e.name);
    let src;
    try {
      src = readFileSync(p, "utf8");
    } catch {
      continue;
    }
    const glyphs = lucideGlyphs(src);
    if (!glyphs.size) continue;
    for (const h of directGlyphHits(src, glyphs)) {
      hits.push({ file: p.replace(repo + "/", ""), ...h });
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const root of roots) walk(root);

  const byFile = new Map();
  for (const h of hits) {
    if (!byFile.has(h.file)) byFile.set(h.file, []);
    byFile.get(h.file).push(h);
  }

  if (REPORT || hits.length) {
    console.log(
      `\ncheck-icon-usage — ${hits.length} glyph(s) de lucide renderizado(s) directo en ${byFile.size} fichero(s).`,
    );
    for (const [file, hs] of [...byFile.entries()].sort(
      (a, b) => b[1].length - a[1].length,
    )) {
      console.log(`  ${file}  (${hs.length})`);
      for (const h of hs.slice(0, REPORT ? 100 : 6))
        console.log(`    :${h.line} <${h.glyph}>   — ${h.ctx}`);
    }
  }
  if (!hits.length) {
    console.log(
      "✓ check-icon-usage OK — todo glyph de lucide pasa por <Icon> (tamaño desde la escala).",
    );
  } else if (!REPORT) {
    console.error(
      `\n✗ check-icon-usage FALLA — ${hits.length} glyph(s) directo(s). Usa \`<Icon icon={Glyph} size="md" />\` (el contenedor impone el tamaño desde ICON_SIZES), o declara \`icon-ok: <razón>\` en la línea si es un render crudo legítimo.`,
    );
    process.exit(1);
  }
}
