#!/usr/bin/env node
// check-contrast — gate de contraste WCAG AA de los tokens de color (ECO-135, estrategia design-tokens).
//
// AA es propiedad del PAR foreground↔background, no de un token: un color con ALPHA no tiene ratio hasta
// componerse (Porter-Duff `over`) sobre una superficie OPACA concreta. Por eso este gate:
//  1) lee los valores crudos de los tokens por tema (:root = light, .dark) de tokens/tokens.css;
//  2) para cada PAR declarado (texto/borde sobre superficie), compone el alpha del fg sobre la superficie
//     opaca y calcula el ratio WCAG (L1+0.05)/(L2+0.05) — SIN redondear;
//  3) exige AA: 4.5 texto normal, 3.0 texto grande, 3.0 no-texto (bordes/UI). Falla el CI si algún par
//     BLOQUEANTE no llega. Los pares "informativos" (decorativos/exentos) se reportan pero no bloquean.
//
// El núcleo (parseo, matriz, run) se EXPORTA para que check-brand-contrast.mjs (gate POR satélite, Fase 2)
// corra la MISMA matriz sobre la paleta RESUELTA de cada marca (baseline + override [data-brand]).
//
// Umbrales y método: WCAG 2.2 (1.4.3 texto, 1.4.11 no-texto). Uso: node scripts/check-contrast.mjs (cwd = design-system/).

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// --- Extraer los valores crudos por tema de un CSS. Light = bloque `:root {…}`; Dark = primer `.dark {…}`. ---
export function parseThemes(css) {
  const block = (selectorRe) => {
    const m = css.match(selectorRe);
    if (!m) return {};
    const vars = {};
    for (const d of m[1].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g))
      vars[d[1]] = d[2].trim();
    return vars;
  };
  return {
    light: block(/:root\s*\{([\s\S]*?)\n\s*\}/),
    dark: block(/\.dark\s*\{([\s\S]*?)\n\s*\}/),
  };
}

// --- Parseo de color → {r,g,b,a}. Soporta #hex, rgb()/rgba(), y "channels" (p.ej. `28 28 28`). ---
export function parseColor(v) {
  v = v.trim();
  let m;
  if ((m = v.match(/^#([0-9a-f]{6})$/i)))
    return {
      r: parseInt(m[1].slice(0, 2), 16),
      g: parseInt(m[1].slice(2, 4), 16),
      b: parseInt(m[1].slice(4, 6), 16),
      a: 1,
    };
  if ((m = v.match(/^#([0-9a-f]{3})$/i)))
    return {
      r: parseInt(m[1][0] + m[1][0], 16),
      g: parseInt(m[1][1] + m[1][1], 16),
      b: parseInt(m[1][2] + m[1][2], 16),
      a: 1,
    };
  if ((m = v.match(/^rgba?\(([^)]+)\)$/i))) {
    const p = m[1].split(/[,\s/]+/).filter(Boolean);
    return { r: +p[0], g: +p[1], b: +p[2], a: p[3] != null ? +p[3] : 1 };
  }
  if ((m = v.match(/^(\d+)\s+(\d+)\s+(\d+)$/)))
    return { r: +m[1], g: +m[2], b: +m[3], a: 1 }; // channels
  return null;
}
// Compone `over` (Porter-Duff) del color c (posible alpha) sobre el fondo opaco bg.
const composite = (c, bg) => ({
  r: Math.round(c.a * c.r + (1 - c.a) * bg.r),
  g: Math.round(c.a * c.g + (1 - c.a) * bg.g),
  b: Math.round(c.a * c.b + (1 - c.a) * bg.b),
});
const srgb = (c) => {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const lum = ({ r, g, b }) =>
  0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
const ratio = (a, b) => {
  const L1 = lum(a),
    L2 = lum(b);
  const hi = Math.max(L1, L2),
    lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
};

// --- MATRIZ DE PARES. kind: text (4.5) | large (3.0) | nontext (3.0). blocking: false = informativo. ---
export const SURFACES = [
  "surface-primary",
  "surface-secondary",
  "surface-tertiary",
];
export function buildPairs() {
  const PAIRS = [];
  // Texto sobre superficies (AA 4.5). content-disabled: EXENTO de 1.4.3 (estado deshabilitado) → informativo.
  for (const s of SURFACES) {
    PAIRS.push({
      fg: "content-primary",
      bg: s,
      kind: "text",
      min: 4.5,
      blocking: true,
    });
    PAIRS.push({
      fg: "content-secondary",
      bg: s,
      kind: "text",
      min: 4.5,
      blocking: true,
    });
    PAIRS.push({
      fg: "content-tertiary",
      bg: s,
      kind: "text",
      min: 4.5,
      blocking: true,
    });
    PAIRS.push({
      fg: "content-placeholder",
      bg: s,
      kind: "text",
      min: 4.5,
      blocking: false,
    }); // placeholder: reportar
    PAIRS.push({
      fg: "content-disabled",
      bg: s,
      kind: "text",
      min: 4.5,
      blocking: false,
    }); // disabled: exento
  }
  // Contenido inverso sobre la superficie inversa (banda oscura / footer). Texto 4.5.
  PAIRS.push({
    fg: "content-inverse",
    bg: "surface-inverse",
    kind: "text",
    min: 4.5,
    blocking: true,
  });
  // Feedback (error/warning/info/success): su color es TEXTO sobre su propio -bg (AlertBox) y como texto inline
  // sobre la superficie. Texto 4.5. (Los tokens se llaman `color-*` — no tienen crudo `--X` gemelo.)
  for (const f of ["error", "warning", "info", "success"]) {
    PAIRS.push({
      fg: `color-${f}`,
      bg: `color-${f}-bg`,
      kind: "text",
      min: 4.5,
      blocking: true,
    });
    PAIRS.push({
      fg: `color-${f}`,
      bg: "surface-primary",
      kind: "text",
      min: 4.5,
      blocking: true,
    });
  }
  // Bordes (no-texto 3.0). line-control = borde interactivo (input) → BLOQUEANTE. line-default/subtle = decorativo → informativo.
  // (El indicador de FOCO de los inputs es content-primary/75 — token de contenido, ya cubierto por su check de texto 4.5.)
  for (const s of SURFACES) {
    // primary/secondary/tertiary: un input/control puede ir sobre cualquiera
    PAIRS.push({
      fg: "line-control",
      bg: s,
      kind: "nontext",
      min: 3.0,
      blocking: true,
    });
    PAIRS.push({
      fg: "line-strong",
      bg: s,
      kind: "nontext",
      min: 3.0,
      blocking: false,
    }); // decorativo (cards/popups)
    PAIRS.push({
      fg: "line-default",
      bg: s,
      kind: "nontext",
      min: 3.0,
      blocking: false,
    }); // decorativo
  }
  // Accent como TEXTO sobre superficie (INFO). En el DS base el accent es DECORATIVO (glows/gradientes, exento
  // 1.4.11) → no bloquea. Pero es la var que un satélite PISA: reportar su ratio avisa si su marca lo llevara a
  // texto real. (Si un satélite usa accent como texto/botón de verdad, sube el par a blocking en su override.)
  for (const s of SURFACES) {
    PAIRS.push({
      fg: "accent",
      bg: s,
      kind: "text",
      min: 4.5,
      blocking: false,
    });
  }
  return PAIRS;
}

// Corre la matriz sobre una paleta {light, dark}. Devuelve {rows, failed}. `label` prefija cada fila.
export function runContrast(
  { light, dark },
  { label = "", pairs = buildPairs() } = {},
) {
  const val = (theme, name) => {
    const raw = (theme === "dark" ? dark : light)[name] ?? light[name];
    return raw ? parseColor(raw) : null;
  };
  // Resuelve un token a color OPACO en un tema: si tiene alpha, se compone sobre la superficie base opaca.
  const resolveOn = (theme, token, surfaceToken) => {
    const base = val(theme, surfaceToken);
    const baseOpaque =
      base.a < 1 ? composite(base, val(theme, "surface-primary")) : base;
    const c = val(theme, token);
    return { fg: c.a < 1 ? composite(c, baseOpaque) : c, bg: baseOpaque };
  };
  let failed = 0;
  const rows = [];
  const pfx = label ? `${label} · ` : "";
  for (const theme of ["light", "dark"]) {
    for (const p of pairs) {
      const fgv = val(theme, p.fg),
        bgv = val(theme, p.bg);
      if (!fgv || !bgv) continue; // token ausente en esta paleta (p.ej. accent-only override) → saltar
      const { fg, bg } = resolveOn(theme, p.fg, p.bg);
      const r = ratio(fg, bg);
      const pass = r >= p.min; // sin redondeo
      const flag = pass ? "ok " : p.blocking ? "FAIL" : "warn";
      if (!pass && p.blocking) failed++;
      rows.push(
        `  [${flag}] ${pfx}${theme.padEnd(5)} ${p.fg} on ${p.bg}: ${r.toFixed(2)}:1 (min ${p.min}${p.blocking ? "" : ", info"})`,
      );
    }
  }
  return { rows, failed };
}

// --- Ejecución directa: corre el gate sobre el baseline tokens/tokens.css. ---
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const themes = parseThemes(
    readFileSync(join(ds, "tokens", "tokens.css"), "utf8"),
  );
  const { rows, failed } = runContrast(themes);
  console.log("Contraste WCAG AA — pares compuestos (α sobre superficie):");
  console.log(rows.join("\n"));
  if (failed) {
    console.error(
      `\n✗ check-contrast FALLA — ${failed} par(es) bloqueante(s) por debajo de AA.`,
    );
    process.exit(1);
  } else {
    console.log(
      "\n✓ check-contrast OK — todos los pares bloqueantes cumplen AA.",
    );
  }
}
