#!/usr/bin/env node
// Builder DESDE-ARCHIVO END-TO-END (FB1+FB2+FB5, ECO-66+ECO-65 / ADR-012+ADR-013): backup → IR lossless
// (CAPTURA) → satélite Next ENRIQUECIDO (EMISIÓN) → estándar profesional (LAUNCH-READINESS). Es la ruta
// "mejorar desde un backup" de /launch-satellite. Reconstruye FIEL en los hechos (todo el IR se emite) +
// CREATIVO en el diseño (em-ui) + PROFESIONAL (formulario/favicon/404/Cookiebot/a11y/Twitter/JSON-LD).
// Uso: node build-from-file.mjs <dir-backup> <destDir> [--brand "#0076a9"] [--color dark|light|system]
//   exit 0 = satélite emitido + lossless de punta a punta + launch-ready
//   exit 2 = fuente no reconocida · exit 1 = gate lossless o launch-readiness FALLÓ
import { resolve } from "node:path";
import { captureFromFile } from "./from-file.mjs";
import { emitFromIR } from "./emit.mjs";
import { losslessReport } from "./capture/capture-gate.mjs";
import { verifyEmit } from "./lib/lossless.mjs";
import { verifyLaunchReady } from "./lib/launch-ready.mjs";
import { irStats } from "./model/ir.mjs";

export async function buildFromFile(backupDir, destDir, opts = {}) {
  const { adapter, ir } = await captureFromFile(backupDir);     // FB1: fuente → IR
  const cap = losslessReport(ir);                                // gate de captura (fuente → IR)
  const trace = await emitFromIR(ir, destDir, opts);             // FB2+FB5: IR → satélite + estándar pro
  const emit = verifyEmit(ir, destDir);                          // gate de emisión (IR → sitio)
  const launch = verifyLaunchReady(destDir);                     // gate de launch-readiness (estándar pro)
  return { adapter, ir, trace, cap, emit, launch };
}

async function main() {
  const backup = resolve(process.argv[2] || ".");
  const dest = process.argv[3] && !process.argv[3].startsWith("--") ? resolve(process.argv[3]) : null;
  if (!dest) { console.error("uso: build-from-file.mjs <dir-backup> <destDir> [--brand #hex] [--color dark|light|system]"); process.exit(2); }
  const bi = process.argv.indexOf("--brand"), ci = process.argv.indexOf("--color");
  const opts = { brand: bi > -1 ? process.argv[bi + 1] : undefined, colorMode: ci > -1 ? process.argv[ci + 1] : undefined };

  let r;
  try { r = await buildFromFile(backup, dest, opts); }
  catch (e) { console.error(e.message); process.exit(e.code === "NO_ADAPTER" ? 2 : 1); }

  const s = irStats(r.ir);
  console.log(`build-from-file: fuente=${r.adapter} → IR ${s.pages} págs · ${s.blocks} bloques · ${s.media} imgs · SEO ${s.seoPages} págs → emitido`);
  console.log("Gate de CAPTURA (fuente → IR):"); for (const l of r.cap.lines) console.log(l);
  console.log("Gate de EMISIÓN (IR → sitio):"); for (const l of r.emit.lines) console.log(l);
  console.log("Gate de LAUNCH-READINESS (estándar profesional):"); for (const l of r.launch.lines) console.log(l);
  if (!r.cap.ok || !r.emit.ok || !r.launch.ok) {
    console.error("build-from-file: GATE FALLÓ — el satélite no está listo:\n" + [
      ...r.cap.problems, ...r.emit.problems, ...r.launch.problems,
    ].map((p) => "  - " + p).join("\n"));
    process.exit(1);
  }
  console.log(`build-from-file: ✓ satélite emitido en ${dest} — LOSSLESS + LAUNCH-READY.`);
  console.log(`  preview: node ${new URL("../preview-satellite.mjs", import.meta.url).pathname} ${dest}`);
}
if (import.meta.url === `file://${process.argv[1]}`) main();
