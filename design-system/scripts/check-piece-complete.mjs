#!/usr/bin/env node
// check-piece-complete — GATE de completitud de pieza (DEFINITION-OF-DONE, ECO-198).
//
// La COLOCACIÓN en Storybook ES la declaración de estado (Model B):
//   · Migration/<Pieza>              → WIP, EXENTA (aún se está verificando).
//   · Primitives/ | Composite/<P>    → CERTIFICADA → DEBE tener evidencia de los pasos verificables por MÁQUINA,
//                                      o el gate va ROJO. Promocionar a medias es IMPOSIBLE.
//
// Pasos verificables por MÁQUINA (por pieza), en `evaluate()`:
//   A  contrato    — components/<P>.tsx importa `tailwind-variants` + exporta `<name>Specs`
//   B  clasificada — `@ds-role` en el componente + `role` en el registry
//   F  fidelidad   — tests/<p>-fidelity.test.tsx importa `fixtures/<P>Old` + renderiza (la versión DÉBIL no cuenta)
//   Q  a11y        — tests/<p>-a11y.test.tsx existe
//   C  census      — census.json al día para la pieza (`census.mjs --write` hecho)
//
// Los demás pasos NO se re-chequean aquí (ya tienen gate required corpus-wide): tokens (raw-color/typography/
// motion), composición (composition-class), story (story-norm/coverage), self-contained (component-drift/manifest).
// Idioma + norma-C + calidad de DISEÑO = aprobación humana [H]. Máquina + gates corpus + [H] = los 11 pasos.
//
// La lógica por-paso (`evaluate`/`stepStatus`/`placements`) la consume también `census.mjs` (Corpus Status) → una
// sola fuente de verdad para el gate y el dashboard.
//
// Uso: node scripts/check-piece-complete.mjs   (cwd = design-system/)

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const TV_RE = /from "tailwind-variants"/;
const SPECS_RE = /export const \w+Specs\b/;
const ROLE_RE = /@ds-role:\s*(primitive|composite)\b/;

// Ejes de diseño ENUM = props opcionales cuyo tipo es una unión de ≥2 literales string (variant/surface/
// indicator/shape/size…). Multi-línea tolerante. Los booleanos (borderless…) NO son ejes enum (quedan en [H]).
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export function enumAxes(src) {
  const axes = {};
  for (const m of src.matchAll(/(\w+)\?:\s*((?:"[^"]+"\s*\|\s*)+"[^"]+")/g)) {
    axes[m[1]] = [...m[2].matchAll(/"([^"]+)"/g)].map((v) => v[1]);
  }
  return axes;
}
// Ejes enum que NO exige un overview propio aquí: `variant`→AllVariants y `size`→AllSizes ya los gatea
// check-story-norm (corpus). Una allow-list para props enum que NO son eje visual (raro; ninguno hoy).
const AXIS_HANDLED_ELSEWHERE = new Set(["variant", "size"]);
const AXIS_ALLOWLIST = {}; // p.ej. { Foo: ["bar"] } si `bar` es una prop enum que no es eje visual

function registryItem(name, root) {
  const reg = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"));
  return reg.items.find((i) => i.name === name);
}

// Source de la story de CATÁLOGO de una pieza (su meta title acaba en /<name>).
function storyFileFor(name, root = ds) {
  for (const f of walkStories(join(root, "stories"))) {
    const src = readFileSync(f, "utf8");
    if (metaTitle(src)?.split("/").pop() === name) return src;
  }
  return null;
}

// Evalúa los pasos verificables por máquina de UNA pieza (por nombre). Pura (lib). Fuente única del gate + dashboard.
// Devuelve { exists, A, B, F, Q, C, missing:[strings legibles] }.
export function evaluate(name, root = ds) {
  const comp = join(root, "components", `${name}.tsx`);
  if (!existsSync(comp))
    return { exists: false, A: false, B: false, F: false, Q: false, C: false, missing: ["componente inexistente en components/"] };

  const src = readFileSync(comp, "utf8");
  const item = registryItem(name, root);
  const lower = name.toLowerCase();
  const missing = [];

  // A — contrato de variante
  const A = TV_RE.test(src) && SPECS_RE.test(src);
  if (!TV_RE.test(src)) missing.push("A: no importa tailwind-variants");
  if (!SPECS_RE.test(src)) missing.push("A: no exporta <name>Specs");

  // B — clasificada
  const B = ROLE_RE.test(src) && !!item?.role;
  if (!ROLE_RE.test(src)) missing.push("B: falta // @ds-role en el componente");
  if (!item?.role) missing.push("B: falta `role` en el registry (regenerar el registry)");

  // F — fidelidad AL ESTÁNDAR (fixture + render viejo-vs-nuevo). Caza la versión DÉBIL.
  const fid = join(root, "tests", `${lower}-fidelity.test.tsx`);
  let F = false;
  if (!existsSync(fid)) {
    missing.push(`F: falta tests/${lower}-fidelity.test.tsx`);
  } else {
    const t = readFileSync(fid, "utf8");
    const importsOld = new RegExp(`fixtures/${name}Old\\b`).test(t);
    const rendersOld = /\brender\s*\(/.test(t);
    F = importsOld && rendersOld;
    if (!importsOld) missing.push(`F: ${lower}-fidelity NO importa fixtures/${name}Old → fidelidad DÉBIL`);
    if (!rendersOld) missing.push(`F: ${lower}-fidelity NO renderiza viejo-vs-nuevo (falta render()) → fidelidad DÉBIL`);
  }

  // Q — a11y (axe): un test dedicado por pieza
  const Q = existsSync(join(root, "tests", `${lower}-a11y.test.tsx`));
  if (!Q) missing.push(`Q: falta tests/${lower}-a11y.test.tsx (a11y AA / axe)`);

  // C — census al día (`census.mjs --write`): la fila de la pieza refleja el estado actual
  const censusPath = join(root, "census.json");
  let C = false;
  if (!existsSync(censusPath)) {
    missing.push("C: census.json no existe (corre `node scripts/census.mjs --write`)");
  } else {
    const row = (JSON.parse(readFileSync(censusPath, "utf8")).rows || []).find((r) => r.name === name);
    const now = { role: (src.match(ROLE_RE) || [])[1] || null, onTv: TV_RE.test(src), hasSpecs: SPECS_RE.test(src) };
    C = !!row && row.role === now.role && row.onTv === now.onTv && row.hasSpecs === now.hasSpecs;
    if (!row) missing.push("C: census.json sin fila para la pieza (corre `census.mjs --write`)");
    else if (!C) missing.push("C: census.json desactualizado para la pieza (corre `census.mjs --write`)");
  }

  // O — ORGANIZACIÓN de la story (paso 7): cada eje ENUM aparte de variant/size tiene su overview `<Axis>`
  // (un bucket por eje, sin mezclar). variant→AllVariants y size→AllSizes ya los gatea check-story-norm.
  const story = storyFileFor(name, root);
  const extraAxes = Object.keys(enumAxes(src)).filter(
    (a) => !AXIS_HANDLED_ELSEWHERE.has(a) && !(AXIS_ALLOWLIST[name] || []).includes(a),
  );
  let O = true;
  for (const a of extraAxes) {
    const overview = cap(a);
    if (!story || !new RegExp(`export const ${overview}\\b`).test(story)) {
      O = false;
      missing.push(`O: falta el overview \`${overview}\` para el eje "${a}" (un bucket por eje, sin mezclar en AllVariants)`);
    }
  }

  return { exists: true, A, B, F, Q, C, O, missing };
}

// Estado por-paso (booleanos) — para el dashboard Corpus Status.
export function stepStatus(name, root = ds) {
  const e = evaluate(name, root);
  return { A: e.A, B: e.B, F: e.F, Q: e.Q, C: e.C, O: e.O };
}

// Pasos que faltan (para el gate).
export const missingSteps = (name, root = ds) => evaluate(name, root).missing;

function walkStories(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walkStories(p));
    else if (e.name.endsWith(".stories.tsx")) out.push(p);
  }
  return out;
}

// Título de catálogo (la META de una CSF: `const meta = { title: … }` o `export default { … }`). OJO: un fichero
// puede tener OTROS `title:` que NO son el de catálogo (items de datos: una FAQ del Accordion, etc.) → arrancamos
// la búsqueda en la meta para no cogerlos.
export function metaTitle(src) {
  const from = src.search(/const\s+meta\b|export\s+default\s*\{/);
  return (from >= 0 ? src.slice(from) : src).match(/title:\s*["']([^"']+)["']/)?.[1] ?? null;
}

// name -> sección de su story (Migration | Primitives | Composite | Layout | …). Para el dashboard.
export function placements(storiesDir = join(ds, "stories")) {
  const map = {};
  for (const f of walkStories(storiesDir)) {
    const m = metaTitle(readFileSync(f, "utf8"))?.match(/^([^/]+)\/([^/]+)$/);
    if (m) map[m[2]] = m[1];
  }
  return map;
}

// Piezas PROMOCIONADAS = título Primitives/<P> o Composite/<P>.
export function promotedPieces(storiesDir = join(ds, "stories")) {
  return Object.entries(placements(storiesDir))
    .filter(([, section]) => section === "Primitives" || section === "Composite")
    .map(([name]) => name);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pieces = promotedPieces();
  const failures = [];
  for (const name of pieces) {
    const miss = missingSteps(name);
    if (miss.length) failures.push(`  ✗ ${name} (en Primitives//Composite/):\n      - ${miss.join("\n      - ")}`);
  }
  if (failures.length) {
    console.error(
      "✗ check-piece-complete — pieza(s) CERTIFICADA(s) sin todos los pasos (imposible promocionar a medias):\n" +
        failures.join("\n") +
        "\n  → o se completan los pasos, o la pieza vuelve a Migration/.",
    );
    process.exit(1);
  }
  console.log(
    `✓ check-piece-complete OK — ${pieces.length} pieza(s) promocionada(s) con evidencia máquina de los pasos ` +
      "(idioma / norma-C / calidad de diseño = aprobación [H]).",
  );
}
