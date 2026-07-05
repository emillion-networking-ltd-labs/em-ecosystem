#!/usr/bin/env node
// check-brand-contrast — gate de contraste WCAG AA POR SATÉLITE (ECO-136, Fase 2 de la estrategia design-tokens).
//
// La NORMA vive en el baseline (tokens/tokens.css). Un satélite pisa su MARCA en una capa [data-brand]
// (styles/em-ui-brand.css). Este gate corre la MISMA matriz de pares de check-contrast sobre la paleta
// RESUELTA de CADA satélite (baseline + su override) → un override no puede romper AA en silencio:
//   - si el satélite solo pisa accent (estético/decorativo), los pares de NORMA (content/surface/border) son
//     los del baseline → pasan; el ratio del accent como texto se REPORTA (info).
//   - si el satélite pisa un surface/content (vía la válvula de excepción), la matriz se RE-COMPUTA sobre su
//     valor → caza el kill-criterion "pisar solo el surface rompe el content heredado".
//
// Descubre satélites por `satellites/<*>/src/**/em-ui-brand.css`. Uso: node scripts/check-brand-contrast.mjs
// (cwd = design-system/). Falla el CI si ALGÚN satélite tiene un par bloqueante por debajo de AA.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseThemes, runContrast } from "./check-contrast.mjs";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(ds, "..");

// Extrae los overrides de marca de un em-ui-brand.css: bloque light `[data-brand="X"]{…}` y dark `.dark[data-brand="X"]{…}`.
function parseBrand(css) {
  const grab = (re) => {
    const m = css.match(re);
    if (!m) return {};
    const vars = {};
    for (const d of m[1].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) vars[d[1]] = d[2].trim();
    return vars;
  };
  return {
    light: grab(/(?:^|\n)\s*\[data-brand="[^"]*"\]\s*\{([^}]*)\}/), // no precedido por .dark
    dark: grab(/\.dark\[data-brand="[^"]*"\]\s*\{([^}]*)\}/),
  };
}

// Busca recursivamente ficheros em-ui-brand.css bajo satellites/ (ignora node_modules/.next).
function findBrandFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === "dist") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) findBrandFiles(full, out);
    else if (name === "em-ui-brand.css") out.push(full);
  }
  return out;
}

const baseline = parseThemes(readFileSync(join(ds, "tokens", "tokens.css"), "utf8"));
const brandFiles = findBrandFiles(join(repo, "satellites"));

if (!brandFiles.length) {
  console.log("check-brand-contrast: sin satélites con em-ui-brand.css (nada que validar).");
  process.exit(0);
}

let totalFailed = 0;
for (const file of brandFiles) {
  const rel = file.replace(repo + "/", "");
  const brandName = (readFileSync(file, "utf8").match(/\[data-brand="([^"]*)"\]/) || [])[1] || rel;
  const b = parseBrand(readFileSync(file, "utf8"));
  const merged = {
    light: { ...baseline.light, ...b.light },
    dark: { ...baseline.dark, ...b.dark },
  };
  const { rows, failed } = runContrast(merged, { label: brandName });
  console.log(`\n■ ${brandName}  (${rel}) — paleta resuelta (baseline + override):`);
  console.log(rows.join("\n"));
  totalFailed += failed;
}

if (totalFailed) {
  console.error(`\n✗ check-brand-contrast FALLA — ${totalFailed} par(es) bloqueante(s) por debajo de AA en satélites.`);
  process.exit(1);
} else {
  console.log(`\n✓ check-brand-contrast OK — ${brandFiles.length} satélite(s), todos los pares bloqueantes cumplen AA.`);
}
