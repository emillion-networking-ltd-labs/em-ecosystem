#!/usr/bin/env node
// check-manifest — gate de CI del manifest por-consumidor de em-ui (ECO-152, design-propagation Fase 1 E4a).
//
// Hermano de check-component-drift (que valida que la copia de cada consumidor es fiel a la FUENTE). Este gate
// valida la CAPA DE ESTADO nueva: cada consumidor lleva `<src>/em-ui.manifest.json` que registra, por copia
// gobernada, la fuente del DS (`from`) y el git blob SHA-1 de esa fuente al copiarse (`sha`, la BASE del
// reconcile asistido futuro) + un `hold` opcional (freeze de rollout). El manifest es fail-closed: sin él, o
// con él incompleto/corrupto, la flota no puede razonar sobre "¿esta copia está al día?" ni congelar un fichero.
//
// FALLA (exit 1) cuando, para algún consumidor con copias gobernadas:
//   - no existe el manifest (completitud dura), o una copia gobernada presente no tiene entrada (INCOMPLETO);
//   - una entrada tiene `from` que no es fuente del DS, clave ≠ mapeo destino de `from`, sha no-40-hex, apunta a
//     un fichero inexistente, o `hold` con valor ≠ true.
// NO re-chequea drift de bytes (eso es check-component-drift). Node stdlib puro (+ registry/_manifest.mjs),
// sin deps → corre en la cadena `governance`/`coverage` sin `npm ci`. Uso, cwd = design-system/:
//   node scripts/check-manifest.mjs

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { governedSources, validateManifest, readManifest, manifestPath, MANIFEST_NAME } from "../registry/_manifest.mjs";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(ds, "..");
const REGISTRY = JSON.parse(readFileSync(join(ds, "registry.json"), "utf8"));
const sources = governedSources(REGISTRY);

// Consumidores: dashboard + satélites (idéntico a check-component-drift → misma noción de "consumidor").
const consumers = [join(repo, "nexacore-dashboard")];
const satRoot = join(repo, "satellites");
if (existsSync(satRoot)) {
  for (const s of readdirSync(satRoot)) {
    const r = join(satRoot, s);
    try {
      if (statSync(r).isDirectory()) consumers.push(r);
    } catch {
      /* ignore */
    }
  }
}

let violations = 0;
let consumersChecked = 0;
for (const root of consumers) {
  const destSrc = join(root, "src");
  const present = sources.filter((s) => existsSync(join(destSrc, s.key)));
  if (present.length === 0) continue; // consumidor sin copias em-ui → el gate no aplica
  consumersChecked++;
  const rel = destSrc.replace(repo + "/", "");

  if (!existsSync(manifestPath(destSrc))) {
    console.error(`  [FALTA] ${rel}/${MANIFEST_NAME} — ${present.length} copia(s) gobernada(s) sin manifest`);
    violations++;
    continue;
  }
  const problems = validateManifest(sources, destSrc, readManifest(destSrc));
  for (const p of problems) console.error(`  [${rel}] ${p}`);
  violations += problems.length;
}

console.log(`\nem-ui manifest — ${consumersChecked} consumidor(es) con copias gobernadas revisado(s).`);
if (violations) {
  console.error(`✗ check-manifest FALLA — ${violations} violación(es).`);
  console.error(`  Regenera con em-ui add/update/pin (p.ej. \`em-ui pin all --dest <consumer>/src\`), o corrige el manifest.`);
  process.exit(1);
} else {
  console.log(`✓ check-manifest OK — todo manifest completo e íntegro.`);
}
