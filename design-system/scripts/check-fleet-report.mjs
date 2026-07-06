#!/usr/bin/env node
// check-fleet-report — gate de sync de FLOTA de em-ui (ECO-155, design-propagation Fase 1 E4b).
//
// El "reporter de flota pull-only + halt-on-red" de E4b, en versión gate: recorre la flota (dashboard +
// satélites), calcula el estado de sync de cada consumidor contra el DS usando la BASE del manifest de E4a, y
// FALLA (exit 1) si ALGÚN consumidor está ROJO — drift NO declarado, marcadores de conflicto, o manifest
// corrupto/incompleto. `stale` (la copia es fiel a su base y el DS avanzó → hay update disponible) es ÁMBAR, no
// rojo; `adapted`/`held` = divergencia intencional, tampoco rojo.
//
// ADVISORY (ECO-155, decisión del operador): corre en la cadena `governance`/`coverage`, que ejecuta el workflow
// em-ui-governance NO-required → informa (enrojece un check no bloqueante), no bloquea el merge. La INTEGRIDAD
// del manifest ya bloquea vía check-manifest; esto es la capa de VISIBILIDAD de sync de la flota.
//
// PULL-only: SOLO lee (comparte statusForConsumer con el verbo `em-ui report` → CLI y gate nunca discrepan).
// Node stdlib puro (+ registry/_manifest.mjs), sin deps → corre en la cadena sin `npm ci`. Uso, cwd = design-system/:
//   node scripts/check-fleet-report.mjs

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { governedSources, discoverConsumers, fleetStatus, isRedStatus } from "../registry/_manifest.mjs";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(ds, "..");
const REGISTRY = JSON.parse(readFileSync(join(ds, "registry.json"), "utf8"));
const sources = governedSources(REGISTRY);

// fleetStatus recorre TODA la flota (no para en el 1er rojo → reporta todos); el gate decide el exit code.
const fleet = fleetStatus(sources, ds, discoverConsumers(repo));
let red = 0;
for (const c of fleet) {
  const rel = c.root.replace(repo + "/", "");
  if (c.red) {
    red++;
    console.error(`  [ROJO] ${rel} — peor estado: ${c.worst}`);
    for (const v of c.violations) console.error(`     ! ${v}`);
    for (const e of c.entries.filter((x) => isRedStatus(x.status))) console.error(`     ✗ ${e.status}  ${e.key}`);
  } else {
    console.log(`  [ok] ${rel} — ${c.worst}`);
  }
}
const consumersChecked = fleet.length;

console.log(`\nem-ui fleet report — ${consumersChecked} consumidor(es) revisado(s).`);
if (red) {
  console.error(`✗ check-fleet-report FALLA — ${red} consumidor(es) en ROJO (drift no declarado / conflicto / manifest corrupto).`);
  console.error(`  Resuélvelo: em-ui update <C> --dest <consumer>/src (adopta el DS), back-portea al DS, o declara @em-ui-adapted / em-ui hold.`);
  process.exit(1);
} else {
  console.log(`✓ check-fleet-report OK — flota sincronizada (stale = update disponible, adapted/held = intencional; nada rojo).`);
}
