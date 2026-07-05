#!/usr/bin/env node
// check-drift — gate de CI de drift de la capa de tokens em-ui (ECO-136, Fase 2 de la estrategia design-tokens).
//
// em-ui distribuye la capa de tokens por COPIA literal (em-ui init → styles/em-ui-tokens.css en cada consumidor;
// pull, no push — ADR-006/007). Una copia DEBE ser idéntica a la fuente (design-system/tokens/tokens.css): si
// diverge, el consumidor quedó stale (no recibió un fix — p.ej. el dashboard corría con bordes por debajo de AA)
// o alguien editó la copia a mano. Este gate compara cada copia con la fuente y FALLA el CI si hay drift → obliga
// a re-pull (`em-ui init --dest <consumer>/src`). NO propaga por generación (eso violaría el pull de em-ui).
//
// Descubre consumidores por `<repo>/*/src/**/em-ui-tokens.css` (dashboard + satélites). Uso, cwd = design-system/:
//   node scripts/check-drift.mjs

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(ds, "..");
const source = readFileSync(join(ds, "tokens", "tokens.css"), "utf8").split("\n");

// Busca recursivamente copias em-ui-tokens.css bajo el repo (ignora node_modules/.next/dist y la propia fuente).
function findCopies(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === "dist" || name === ".git") continue;
    const full = join(dir, name);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) findCopies(full, out);
    else if (name === "em-ui-tokens.css") out.push(full);
  }
  return out;
}

// Solo consumidores (apps con src/): dashboard + satélites. La fuente vive en design-system/tokens, sin match.
const copies = [
  ...findCopies(join(repo, "nexacore-dashboard")),
  ...findCopies(join(repo, "satellites")),
];

if (!copies.length) {
  console.log("check-drift: sin copias em-ui-tokens.css de consumidores (nada que validar).");
  process.exit(0);
}

let drifted = 0;
for (const copy of copies) {
  const rel = copy.replace(repo + "/", "");
  const target = readFileSync(copy, "utf8").split("\n");
  const setA = new Set(source), setB = new Set(target);
  const onlySource = source.filter((l) => l.trim() && !setB.has(l));
  const onlyTarget = target.filter((l) => l.trim() && !setA.has(l));
  if (!onlySource.length && !onlyTarget.length) {
    console.log(`  [ok ] ${rel} — idéntico a la fuente.`);
    continue;
  }
  drifted++;
  console.log(`  [DRIFT] ${rel} — ${onlySource.length} línea(s) de la fuente ausentes, ${onlyTarget.length} línea(s) ajenas.`);
  onlySource.slice(0, 6).forEach((l) => console.log(`      - ${l.trim()}`));
  onlyTarget.slice(0, 6).forEach((l) => console.log(`      + ${l.trim()}`));
  if (onlySource.length + onlyTarget.length > 12) console.log(`      … (${onlySource.length + onlyTarget.length - 12} más)`);
}

console.log(`\nem-ui token drift — ${copies.length} consumidor(es) revisado(s).`);
if (drifted) {
  console.error(`✗ check-drift FALLA — ${drifted} consumidor(es) con drift. Re-pull: em-ui init --dest <consumer>/src`);
  process.exit(1);
} else {
  console.log("✓ check-drift OK — todas las copias idénticas a la fuente.");
}
