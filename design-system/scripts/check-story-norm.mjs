#!/usr/bin/env node
// check-story-norm — guard NO-SALTABLE de la NORMA CANÓNICA de stories del catálogo (ECO-112).
// La doc viva vive en `Foundations/Story Conventions`; este guard la OBLIGA, para que ningún elemento
// nuevo entre fuera de norma (no más correcciones a mano una por una).
//
// PRINCIPIO — 3 ejes ortogonales, cada uno con su sitio fijo, sin mezclar:
//   · Estilo  (variant/shape/brand)   → `AllVariants` (SIEMPRE presente y ÚLTIMA).
//   · Tamaño  (sm/md/lg)              → `AllSizes`    (obligatoria si el componente tiene eje de tamaño).
//   · Estado  (disabled/loading/…)    → story dedicada.
// Y `AllVariants` AGRUPA variantes que YA tienen su story — no ESTRENA variantes nuevas, y no repite tamaños.
//
// Aplica a TODA story de COMPONENTE (primitives, marketing, layout, sections, charts, decoration, showcase).
// `foundations/` documenta el catálogo (no registra componentes) → exento.
//
// Uso: node scripts/check-story-norm.mjs   (cwd = design-system/)

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function fail(msg) {
  console.error(`✗ story-norm: ${msg}`);
  process.exitCode = 1;
}

const SECTIONS = ["primitives", "marketing", "layout", "sections", "charts", "decoration", "showcase"];
const COMP = join(ds, "components");

// claves de matriz que NO se exigen como story (no son variantes de uso público) — alineado con check-variant-coverage.
const IGNORE = {
  IconButton: ["inside input"],
  Tabs: ["subtle"],
};

// un label que es SÓLO un tamaño no pertenece a AllVariants (su sitio es AllSizes)
const SIZE_ONLY = /^(xs|sm|md|lg|xl|2xl|3xl|small|medium|large)$/i;

// nombres de las exports `export const X` en orden de aparición
const storyExports = (src) => [...src.matchAll(/export const (\w+)\s*[:=]/g)].map((m) => m[1]);

// claves de 1er nivel de `export const <name> = { ... }`
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
  const keys = [];
  for (const raw of src.slice(open + 1, end).split("\n")) {
    const m = raw.trim().match(/^["']?([A-Za-z0-9_-]+)["']?\s*:/);
    if (m) keys.push(m[1]);
  }
  return keys;
}

// story canónica de un componente: 1º por NOMBRE de fichero (prioridad, para no confundir una COMPOSICIÓN
// que importa el componente con su story canónica); 2º por CONTENIDO (qué story importa el componente).
function storyFor(name) {
  for (const sub of SECTIONS) {
    const p = join(ds, "stories", sub, `${name}.stories.tsx`);
    if (existsSync(p)) return p;
  }
  const re = new RegExp(`@/components/(?:ui|sections)/${name}["']`);
  for (const sub of SECTIONS) {
    const dir = join(ds, "stories", sub);
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir)) {
      if (entry.endsWith(".stories.tsx") && re.test(readFileSync(join(dir, entry), "utf8"))) {
        return join(dir, entry);
      }
    }
  }
  return null;
}

// --- Pasada A (por STORY de componente): AllVariants última + AllVariants no mezcla tamaños.
let checked = 0;
for (const sub of SECTIONS) {
  const dir = join(ds, "stories", sub);
  if (!existsSync(dir)) continue;
  for (const entry of readdirSync(dir)) {
    if (!entry.endsWith(".stories.tsx")) continue;
    const rel = `${sub}/${entry}`;
    const src = readFileSync(join(dir, entry), "utf8");
    const exports = storyExports(src);
    checked++;

    // AllVariants: SI existe, debe ser la ÚLTIMA. La OBLIGATORIEDAD se verifica por componente (pasada C):
    // solo es obligatoria cuando el componente declara ≥2 variantes de estilo (`variantClasses`); un overview
    // de <2 variantes no aporta y se omite.
    if (exports.includes("AllVariants") && exports[exports.length - 1] !== "AllVariants") {
      fail(`${rel}: \`AllVariants\`, si existe, debe ser la ÚLTIMA story (ahora la última es \`${exports[exports.length - 1]}\`)`);
    }

    // AllSizes, si existe: penúltima (justo antes de AllVariants) cuando HAY AllVariants; si NO hay
    // AllVariants (componente con <2 variantes de estilo), AllSizes debe ser la ÚLTIMA.
    if (exports.includes("AllSizes")) {
      const szIdx = exports.indexOf("AllSizes");
      const hasAV = exports.includes("AllVariants");
      const expected = hasAV ? exports.length - 2 : exports.length - 1;
      if (szIdx !== expected) {
        fail(
          hasAV
            ? `${rel}: \`AllSizes\` debe ir JUSTO antes de \`AllVariants\` (penúltima); hay otra story entre medias`
            : `${rel}: \`AllSizes\` debe ser la ÚLTIMA story (no hay AllVariants); hay otra story después`,
        );
      }
    }

    const avStart = src.indexOf("AllVariants");
    if (avStart !== -1) {
      for (const m of src.slice(avStart).matchAll(/label:\s*["'`]([^"'`]+)["'`]/g)) {
        const lbl = m[1].trim();
        if (SIZE_ONLY.test(lbl)) {
          fail(`${rel}: \`AllVariants\` incluye el tamaño "${lbl}" — los tamaños van en \`AllSizes\`, no aquí`);
          break;
        }
        if (/\d+(?:\.\d+)?\s*(px|%|rem|em|pt)\b/i.test(lbl)) {
          fail(`${rel}: \`AllVariants\` lleva una medida en el label "${lbl}" — las medidas van en \`AllSizes\` o en stories de medida, NO en AllVariants (que es solo nombres de estilo)`);
          break;
        }
      }
    }
  }
}

// --- Pasada B (por COMPONENTE con eje de tamaño): su story canónica debe tener AllSizes.
// --- Pasada C (por COMPONENTE con eje de estilo): cada variante de variantClasses debe tener story PROPIA
//     ANTES de AllVariants — AllVariants agrupa variantes ya documentadas, no estrena variantes nuevas.
for (const file of readdirSync(COMP)) {
  if (!file.endsWith(".tsx")) continue;
  const name = file.slice(0, -4);
  const csrc = readFileSync(join(COMP, file), "utf8");

  if (/export const sizeClasses/.test(csrc)) {
    const sf = storyFor(name);
    if (sf && !storyExports(readFileSync(sf, "utf8")).includes("AllSizes")) {
      fail(`${name}: tiene eje de tamaño (sizeClasses) → su story (${sf.slice(ds.length + 1)}) debe incluir \`AllSizes\``);
    }
  }

  const variants = objectKeys(csrc, "variantClasses");
  if (variants && variants.length >= 2) {
    const sf = storyFor(name);
    if (sf) {
      const story = readFileSync(sf, "utf8");
      if (!/export const AllVariants/.test(story)) {
        fail(`${name}: declara ≥2 variantes (variantClasses) → su story debe incluir \`AllVariants\` que las agrupe`);
      }
      const avAt = story.indexOf("AllVariants");
      const before = avAt === -1 ? story : story.slice(0, avAt);
      const ignore = new Set(IGNORE[name] || []);
      for (const k of variants) {
        if (k === "default" || ignore.has(k)) continue;
        if (!before.includes(`"${k}"`) && !before.includes(`'${k}'`)) {
          fail(`${name}: la variante "${k}" solo aparece en AllVariants — debe tener su PROPIA story antes (AllVariants agrupa, no estrena)`);
        }
      }
    }
  }
}

if (process.exitCode) {
  console.error('\n✗ story-norm FALLA — alguna story no cumple la norma canónica (ver Foundations/Story Conventions).');
} else {
  console.log(`✓ story-norm OK — ${checked} stories cumplen la norma (AllVariants última + AllSizes donde hay tamaño + sin mezclar ejes + sin variantes estrenadas en AllVariants).`);
}
