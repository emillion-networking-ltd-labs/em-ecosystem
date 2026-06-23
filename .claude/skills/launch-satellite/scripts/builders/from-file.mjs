#!/usr/bin/env node
// Builder DESDE-ARCHIVO (FB1, ECO-63 / ADR-012) — orquestador. Reconoce la fuente (adapter genérico), captura
// al IR común LOSSLESS, valida estructura, y pasa el GATE DE COMPLETITUD (fuente == IR; falla si se pierde algo).
// El EMITTER (IR → satélite Next enriquecido) es FB2; aquí se produce y verifica el IR (la mitad de captura).
// Uso: node from-file.mjs <dir-backup> [--out ir.json]
//   exit 0 = IR capturado y lossless OK · 2 = fuente no reconocida · 1 = gate lossless FALLÓ (pérdida)
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { makeRegistry } from "./lib/adapter.mjs";
import { validateIR, irStats, sectionsOf } from "./lib/ir.mjs";
import { losslessReport } from "./lib/lossless.mjs";
import { wordpressAdapter } from "./adapters/wordpress.mjs";

// Registro de adapters de fuente. Añadir otra fuente = añadir su adapter aquí (mismo IR, sin tocar el núcleo).
export const REGISTRY = makeRegistry([wordpressAdapter]);

export async function captureFromFile(dir) {
  const adapter = REGISTRY.detect(dir);
  if (!adapter) { const e = new Error(`from-file: ninguna fuente reconocida en ${dir} (adapters: ${REGISTRY.list.map((a) => a.kind).join(", ")})`); e.code = "NO_ADAPTER"; throw e; }
  const ir = await adapter.capture(dir);
  return { adapter: adapter.kind, ir };
}

async function main() {
  const dir = resolve(process.argv[2] || ".");
  const outArg = process.argv.indexOf("--out");
  const out = outArg > -1 ? process.argv[outArg + 1] : null;

  let cap;
  try { cap = await captureFromFile(dir); }
  catch (e) { console.error(e.message); process.exit(e.code === "NO_ADAPTER" ? 2 : 1); }
  const { adapter, ir } = cap;

  console.log(`from-file: fuente reconocida = ${adapter}`);
  const struct = validateIR(ir);
  if (struct.length) { console.error("IR inválido:\n" + struct.map((s) => "  - " + s).join("\n")); process.exit(1); }

  const stats = irStats(ir);
  console.log(`IR capturado: ${stats.pages} páginas · ${stats.blocks} bloques · ${stats.media} imágenes · ${stats.menuItems} ítems de menú · ${stats.words} palabras`);
  console.log("Gate de COMPLETITUD / lossless (fuente == IR):");
  const r = losslessReport(ir);
  for (const l of r.lines) console.log(l);

  // Secciones que el sitio TIENE (paso 4: informar antes de enriquecer). El operador decide si AÑADE secciones
  // reales al ir.json (aporta el contenido, §D4) y luego emite con emit-from-ir.mjs.
  console.log("\nSecciones capturadas (lo que el sitio TIENE — base para revisar/enriquecer en el paso 4):");
  for (const pg of sectionsOf(ir)) {
    console.log(`  ${pg.route}${pg.title ? ` — ${pg.title}` : ""}  (${pg.sections.length} sección/es)`);
    for (const s of pg.sections) console.log(`      · ${s.heading || "(sin título)"} — ${s.blocks} bloque(s), ${s.words} palabra(s)${s.hasMedia ? ", con imagen" : ""}`);
  }

  if (out) { writeFileSync(out, JSON.stringify(ir, null, 2) + "\n"); console.log(`\nIR escrito → ${out}   (revísalo/enriquécelo y emite con: node scripts/builders/emit-from-ir.mjs ${out} <destDir>)`); }

  if (!r.ok) { console.error("from-file: GATE LOSSLESS FALLÓ (pérdida silenciosa):\n" + r.problems.map((p) => "  - " + p).join("\n")); process.exit(1); }
  console.log("from-file: ✓ captura LOSSLESS (nada de la fuente se perdió). Emitter enriquecido = FB2.");
}

if (import.meta.url === `file://${process.argv[1]}`) main();
