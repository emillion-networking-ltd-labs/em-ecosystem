#!/usr/bin/env node
// em-ui — registry + CLI interno del design system NexaCore (ECO-23, estrategia satellites / ADR-006 + ADR-007).
// Copia GOBERNADA con reconciliación. Fuente ÚNICA: design-system/ (jamás la app dashboard).
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import { dirname, join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { isAdapted } from "./_reconcile.mjs";

// em-ui vive en design-system/registry/ → la fuente (design-system/) es el directorio padre.
const DS = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY = JSON.parse(readFileSync(join(DS, "registry.json"), "utf8"));

// Hard invariant: la fuente es design-system/, jamás el dashboard.
if (REGISTRY.source !== "design-system") {
  console.error("em-ui: fuente inesperada; debe ser design-system/"); process.exit(2);
}
const byName = Object.fromEntries(REGISTRY.items.map((i) => [i.name, i]));

function die(msg) { console.error(`em-ui: ${msg}`); process.exit(1); }
function arg(flag, def) { const i = process.argv.indexOf(flag); return i > -1 ? process.argv[i + 1] : def; }

// Resuelve el cierre transitivo de un componente: él + sus registryDependencies (ui) + internalDependencies (hooks/lib).
function resolveClosure(name, seen = new Set()) {
  if (seen.has(name)) return seen;
  const item = byName[name];
  if (!item) die(`componente desconocido: ${name} (¿app-coupled/excluido, o typo?)`);
  seen.add(name);
  for (const dep of item.registryDependencies) resolveClosure(dep, seen);
  return seen;
}

// Mapea un fichero de la fuente a su ruta en el consumidor. Consumidor usa alias @/ -> src,
// igual que dashboard y satélites => sin reescritura de imports.
function destPathFor(srcRel, destSrc) {
  if (srcRel.startsWith("components/")) return join(destSrc, "components/ui", basename(srcRel));
  if (srcRel.startsWith("sections/")) return join(destSrc, "components/sections", basename(srcRel));
  if (srcRel.startsWith("hooks/")) return join(destSrc, "hooks", basename(srcRel));
  if (srcRel.startsWith("lib/")) return join(destSrc, "lib", basename(srcRel));
  die(`ruta de fuente no mapeable: ${srcRel}`);
}

// add    → no sobrescribe (copia solo lo que falta).
// update → RECONCILE por-fichero con guard (ECO-144, design-propagation Fase 1): reemplaza el `copyFileSync`
//          ciego que destruía las adaptaciones declaradas del consumidor. NUNCA pisa un `@em-ui-adapted` sin
//          `--force`; sí adopta el DS cuando el consumidor tiene drift SIN declarar (catch-up de stale).
function copyInto(name, destSrc, { update, force }) {
  const closure = [...resolveClosure(name)];
  const written = [];
  const seenDest = new Set(); // dedup por ruta DESTINO (lib/utils.ts llega desde varios items pero aterriza una vez)
  let blocked = 0;
  for (const cname of closure) {
    const item = byName[cname];
    const files = [item.file, ...item.internalDependencies];
    for (const f of files) {
      const from = join(DS, f);
      const to = destPathFor(f, destSrc);
      if (seenDest.has(to)) continue;
      seenDest.add(to);

      if (!existsSync(to)) { // nuevo: escribe (add y update por igual)
        mkdirSync(dirname(to), { recursive: true });
        copyFileSync(from, to);
        written.push(`+ ${to} (nuevo)`);
        continue;
      }
      if (!update) { written.push(`= ${to} (ya existe, sin tocar)`); continue; }

      // update: guard por-fichero (stateless: lee fuente + copia + marcador de cabecera).
      const src = readFileSync(from, "utf8");
      const mine = readFileSync(to, "utf8");
      if (src === mine) {
        written.push(`= ${to} (idéntico)`);
      } else if (isAdapted(mine)) {
        if (force) {
          copyFileSync(from, to);
          written.push(`↻ ${to} (--force: @em-ui-adapted DESCARTADO)`);
        } else {
          written.push(`⊘ ${to} (@em-ui-adapted: NO tocado — back-portea la mejora al DS, o --force para adoptarlo)`);
          blocked++;
        }
      } else {
        // divergencia SIN declarar → stale/accidental → catch-up: adopta el DS (propósito original de `update`).
        copyFileSync(from, to);
        written.push(`↻ ${to} (drift no declarado → adoptado del DS)`);
      }
    }
  }
  return { written, blocked };
}

const cmd = process.argv[2];

if (cmd === "list") {
  for (const i of REGISTRY.items) {
    const deps = [...i.registryDependencies, ...i.internalDependencies];
    console.log(`${i.name}${deps.length ? "  ← " + deps.join(", ") : ""}`);
  }
} else if (cmd === "add" || cmd === "update") {
  const name = process.argv[3];
  const destSrc = resolve(arg("--dest") || die("falta --dest <consumer-src-dir>"));
  if (!name) die(`uso: em-ui ${cmd} <Componente> --dest <src> [--force]`);
  const force = process.argv.includes("--force");
  const { written, blocked } = copyInto(name, destSrc, { update: cmd === "update", force });
  console.log(`em-ui ${cmd} ${name} (cierre: ${[...resolveClosure(name)].join(", ")})`);
  written.forEach((w) => console.log("  " + w));
  if (blocked > 0) {
    console.error(`\nem-ui update: ${blocked} fichero(s) @em-ui-adapted NO tocados (adaptación protegida).`);
    console.error(`  Resuélvelos: back-portea la mejora del DS a la adaptación a mano, o corre con --force (PERDERÁS la adaptación).`);
    process.exit(3);
  }
} else if (cmd === "diff") {
  const name = process.argv[3];
  const target = arg("--target") || die("falta --target <fichero-del-consumidor>");
  // `tokens` es un nombre especial: diffea la capa de tokens (baseline em-ui init), no un componente.
  // La copia del consumidor es literal (em-ui init) → cualquier diferencia es drift/tampering.
  const srcRel = name === "tokens" ? REGISTRY.tokens : (byName[name] || die(`componente desconocido: ${name} (¿o querías "tokens"?)`)).file;
  const sourceFile = join(DS, srcRel);
  const a = readFileSync(sourceFile, "utf8").split("\n");
  if (!existsSync(target)) die(`target no existe: ${target}`);
  const b = readFileSync(target, "utf8").split("\n");
  // diff de líneas simple (LCS-light por igualdad posicional + reporte de añadidas/quitadas)
  const setA = new Set(a), setB = new Set(b);
  const onlySource = a.filter((l) => l.trim() && !setB.has(l));
  const onlyTarget = b.filter((l) => l.trim() && !setA.has(l));
  if (!onlySource.length && !onlyTarget.length) {
    console.log(`em-ui diff ${name}: SIN DRIFT (idéntico a la fuente).`); process.exit(0);
  }
  console.log(`em-ui diff ${name}: DRIFT detectado (fuente=${srcRel} vs ${target})`);
  console.log(`  — en la FUENTE pero no en el consumidor (posible regresión si falta):`);
  onlySource.forEach((l) => console.log(`    - ${l.trim()}`));
  console.log(`  + en el CONSUMIDOR pero no en la fuente (divergencia per-cliente o drift):`);
  onlyTarget.forEach((l) => console.log(`    + ${l.trim()}`));
  process.exit(3);
} else if (cmd === "init") {
  const destSrc = resolve(arg("--dest") || die("falta --dest <consumer-src-dir>"));
  const to = join(destSrc, "styles", "em-ui-tokens.css");
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(join(DS, REGISTRY.tokens), to);
  console.log(`em-ui init: capa de tokens instalada → ${to}`);
  console.log(`  Impórtala desde tu CSS global del consumidor: @import "../styles/em-ui-tokens.css";`);
  console.log(`  (sin esto, los componentes referencian tokens inexistentes y renderizan rotos).`);
} else if (cmd === "brand") {
  // Capa de override de marca por satélite (ECO-136 / Fase 2). Copia el template [data-brand],
  // scopeado al nombre de la marca, para que el satélite pise SOLO su acento sin forkear tokens.css.
  const name = arg("--name") || die("falta --name <marca> (p.ej. cristian-garcia)");
  const destSrc = resolve(arg("--dest") || die("falta --dest <consumer-src-dir>"));
  if (!REGISTRY.brandTemplate) die("registry.json no declara brandTemplate");
  const tpl = readFileSync(join(DS, REGISTRY.brandTemplate), "utf8").replaceAll("__BRAND__", name);
  const to = join(destSrc, "styles", "em-ui-brand.css");
  if (existsSync(to) && !process.argv.includes("--force")) {
    die(`ya existe: ${to} — usa --force para regenerar (PERDERÁS tus valores de marca)`);
  }
  mkdirSync(dirname(to), { recursive: true });
  writeFileSync(to, tpl);
  console.log(`em-ui brand: capa de marca [data-brand="${name}"] instalada → ${to}`);
  console.log(`  1. Rellena los hex de tu marca (busca «REEMPLAZA»).`);
  console.log(`  2. Impórtala DESPUÉS del baseline: @import "../styles/em-ui-brand.css";`);
  console.log(`  3. Marca el root: <html data-brand="${name}"> (junto a la clase de tema).`);
} else {
  console.log(`em-ui — registry + CLI del design system (fuente: design-system/)
uso:
  em-ui list                              lista componentes y sus deps
  em-ui add <C> --dest <src>              copia C (+deps) al consumidor (no sobrescribe)
  em-ui update <C> --dest <src> [--force] re-pull de C (+deps), reconciliando: NO pisa @em-ui-adapted (salvo --force)
  em-ui diff <C> --target <fichero>       muestra drift del consumidor vs la fuente
  em-ui init --dest <src>                 instala la capa de tokens (baseline) en el consumidor
  em-ui brand --name <m> --dest <src>     instala la capa de override de marca [data-brand]`);
  if (cmd && cmd !== "help" && cmd !== "--help") process.exit(1);
}
