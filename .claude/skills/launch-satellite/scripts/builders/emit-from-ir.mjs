#!/usr/bin/env node
// Builder DESDE-ARCHIVO — FASE DE EMISIÓN (FB2+FB5, ECO-67 / ADR-012+ADR-013). La SEGUNDA mitad del flujo
// desde-archivo: toma un IR ya CAPTURADO (y opcionalmente REVISADO/ENRIQUECIDO por el operador en el paso 4) y
// lo EMITE → satélite Next enriquecido + estándar profesional. Separar captura (from-file.mjs --out) de emisión
// (este script) es lo que permite la PAUSA de revisión/enriquecimiento ENTRE ambas (paso 4 del flujo): el
// operador informa/añade secciones reales al ir.json y LUEGO emite. build-from-file.mjs sigue siendo el atajo
// de una sola pasada (sin pausa) para regen/CI.
//
// El gate de CAPTURA (lossless fuente→IR) ya pasó en la fase de captura; aquí NO se re-corre (el IR enriquecido
// tiene MÁS que la fuente, por diseño). Aquí corren el gate de EMISIÓN (IR→sitio, nada del IR se cae) y el gate
// de LAUNCH-READINESS (estándar profesional, 15 checks).
// Uso: node emit-from-ir.mjs <ir.json> <destDir> [--brand "#0076a9"] [--color dark|light|system]
//   exit 0 = emitido + emisión lossless + launch-ready · exit 1 = IR inválido o gate FALLÓ
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { emitFromIR } from "./emit.mjs";
import { validateIR, irStats } from "./model/ir.mjs";
import { verifyEmit } from "./standard/emit-gate.mjs";
import { verifyLaunchReady } from "./standard/launch-ready.mjs";
import { verifyComponentDrift } from "./standard/component-drift.mjs";

export async function emitFromIRFile(irPath, destDir, opts = {}) {
  const ir = JSON.parse(readFileSync(irPath, "utf8"));
  const struct = validateIR(ir);
  if (struct.length) { const e = new Error("IR inválido:\n" + struct.map((s) => "  - " + s).join("\n")); e.code = "BAD_IR"; throw e; }
  const trace = await emitFromIR(ir, destDir, opts);          // FB2+FB5: IR → satélite + estándar pro
  const emit = verifyEmit(ir, destDir);                       // gate de emisión (IR → sitio)
  const launch = verifyLaunchReady(destDir);                  // gate de launch-readiness (estándar pro)
  const drift = verifyComponentDrift(destDir);                // gate de drift (componentes em-ui sin forkear, ADR-014 §2)
  return { ir, trace, emit, launch, drift };
}

async function main() {
  const irPath = process.argv[2] ? resolve(process.argv[2]) : null;
  const dest = process.argv[3] && !process.argv[3].startsWith("--") ? resolve(process.argv[3]) : null;
  if (!irPath || !dest) { console.error("uso: emit-from-ir.mjs <ir.json> <destDir> [--brand #hex] [--color dark|light|system]"); process.exit(2); }
  const bi = process.argv.indexOf("--brand"), ci = process.argv.indexOf("--color");
  const opts = { brand: bi > -1 ? process.argv[bi + 1] : undefined, colorMode: ci > -1 ? process.argv[ci + 1] : undefined };

  let r;
  try { r = await emitFromIRFile(irPath, dest, opts); }
  catch (e) { console.error(e.message); process.exit(1); }

  const s = irStats(r.ir);
  console.log(`emit-from-ir: IR ${s.pages} págs · ${s.blocks} bloques · ${s.media} imgs · ${s.words} palabras → emitido`);
  console.log("Gate de EMISIÓN (IR → sitio):"); for (const l of r.emit.lines) console.log(l);
  console.log("Gate de LAUNCH-READINESS (estándar profesional):"); for (const l of r.launch.lines) console.log(l);
  console.log("Gate de DRIFT (componentes em-ui sin forkear):"); for (const l of r.drift.lines) console.log(l);
  if (!r.emit.ok || !r.launch.ok || !r.drift.ok) {
    console.error("emit-from-ir: GATE FALLÓ — el satélite no está listo:\n" + [
      ...r.emit.problems, ...r.launch.problems, ...r.drift.problems,
    ].map((p) => "  - " + p).join("\n"));
    process.exit(1);
  }
  console.log(`emit-from-ir: ✓ satélite emitido en ${dest} — EMISIÓN LOSSLESS + LAUNCH-READY.`);
  console.log(`  preview: node ${new URL("../preview-satellite.mjs", import.meta.url).pathname} ${dest}`);
}
if (import.meta.url === `file://${process.argv[1]}`) main();
