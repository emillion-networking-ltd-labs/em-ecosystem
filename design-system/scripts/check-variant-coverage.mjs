#!/usr/bin/env node
// check-variant-coverage — anti-regresión de fidelidad del catálogo (ECO-90).
// Para cada componente que EXPORTA su matriz (`variantClasses` / `sizeClasses`), verifica que
// CADA clave de la matriz aparezca referenciada en su story file. Así, si alguien añade una
// variante/tamaño nuevo al componente, el catálogo debe mostrarlo o el gate lo bloquea.
//
// Claves intencionalmente NO expuestas como story (no son variantes de uso público) → IGNORE.
//
// Uso: node scripts/check-variant-coverage.mjs   (cwd = design-system/)

import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// claves de matriz que NO se exigen en stories (no son variantes de uso público).
const IGNORE = {
  IconButton: ["inside input"], // está en variantClasses pero no en el union type público
  Tabs: ["subtle"], // variante en desuso (no aparece en el dashboard); ese patrón lo cubre SegmentedControl
};

function fail(msg) {
  console.error(`✗ variant-coverage: ${msg}`);
  process.exitCode = 1;
}

// Extrae las claves de `export const <name> = { ... }` de un fuente TS (objeto plano de 1er nivel).
function objectKeys(src, name) {
  const start = src.indexOf(`export const ${name}`);
  if (start === -1) return null;
  const open = src.indexOf("{", start);
  if (open === -1) return null;
  let depth = 0, end = -1;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) return null;
  const body = src.slice(open + 1, end);
  const keys = [];
  // claves de 1er nivel: `name:` o `"name":` al inicio de línea (ignora anidados por depth)
  let d = 0;
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (d === 0) {
      const m = line.match(/^["']?([A-Za-z0-9_-]+)["']?\s*:/);
      if (m) keys.push(m[1]);
    }
    d += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
  }
  return keys;
}

import { readdirSync } from "node:fs";

// Mapea nombre de componente → su story file. 1º por NOMBRE de fichero canónico (<name>.stories.tsx);
// 2º por CONTENIDO (qué story importa @/components/{ui,sections}/<name>) como fallback robusto a renames
// (p.ej. IconButton vive en ButtonIcon.stories.tsx). El nombre canónico tiene prioridad para no
// confundir una COMPOSICIÓN que importa el componente (p.ej. FullPageAlert importa Button) con su
// story canónica (Button.stories.tsx) — que es la que lleva la matriz de variantes/sizes.
function storyFor(name) {
  for (const sub of ["primitives", "sections", "marketing", "layout", "decoration", "showcase", "charts"]) {
    const p = join(ds, "stories", sub, `${name}.stories.tsx`);
    if (existsSync(p)) return p;
  }
  const re = new RegExp(`@/components/(?:ui|sections)/${name}["']`);
  const stack = [join(ds, "stories")];
  while (stack.length) {
    const dir = stack.pop();
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) stack.push(p);
      else if (entry.name.endsWith(".stories.tsx") && re.test(readFileSync(p, "utf8"))) return p;
    }
  }
  return null;
}
const COMP = join(ds, "components");
const components = readdirSync(COMP).filter((f) => f.endsWith(".tsx")).map((f) => f.slice(0, -4));

let checked = 0, missing = 0;
for (const name of components) {
  const src = readFileSync(join(COMP, `${name}.tsx`), "utf8");
  const matrices = ["variantClasses", "sizeClasses"]
    .map((m) => [m, objectKeys(src, m)])
    .filter(([, k]) => k && k.length);
  if (!matrices.length) continue;
  const storyPath = storyFor(name);
  if (!storyPath) { fail(`${name}: exporta matriz pero no tiene story file`); continue; }
  const story = readFileSync(storyPath, "utf8");
  const ignore = new Set(IGNORE[name] || []);
  for (const [matrix, keys] of matrices) {
    for (const key of keys) {
      if (ignore.has(key)) continue;
      checked++;
      // referencia textual de la clave en la story (como string)
      if (!story.includes(`"${key}"`) && !story.includes(`'${key}'`)) {
        missing++;
        fail(`${name}: la clave ${matrix}.${key} no aparece en ${name}.stories.tsx`);
      }
    }
  }
}

if (process.exitCode) {
  console.error(`\n✗ variant-coverage FALLA — ${missing} clave(s) de matriz sin reflejar en stories.`);
} else {
  console.log(`✓ variant-coverage OK — ${checked} claves de variante/size reflejadas en sus stories.`);
}
