#!/usr/bin/env node
// AUTO-DETECCIÓN de fuentes (ECO-67 / ADR-012) — paso 2 del flujo desde-archivo. Escanea un directorio de intake
// (`.satellite-intake/` por defecto) y SUGIERE qué encuentra: por cada candidato, qué adapter lo reconoce (o
// "no reconocido"). El agente lo usa para proponer ("encontré un backup WordPress de <X> — ¿uso este?") SIEMPRE
// con opción a corregir. No captura nada; sólo mira (barato: usa adapter.detect, que no parsea todo).
// Uso: node detect-source.mjs [root]   (default .satellite-intake)
//   exit 0 = al menos un candidato reconocido · exit 2 = ninguno (preguntar la ruta al operador)
import { readdirSync, existsSync } from "node:fs";
import { resolve, join, basename } from "node:path";
import { REGISTRY } from "./from-file.mjs";

// Devuelve [{ dir, name, adapter|null }]. El intake tiene UNA carpeta por cliente → escanea los subdirectorios
// inmediatos y detecta cada uno (no auto-detecta la raíz por su walk profundo: `.satellite-intake/` entero NO es
// un backup, sus hijos sí). Si la raíz no tiene subdirectorios pero ella misma es una fuente (el operador apuntó
// directo a un backup), reporta la raíz.
export function detectSources(root) {
  const abs = resolve(root);
  if (!existsSync(abs)) return [];
  let entries = [];
  try { entries = readdirSync(abs, { withFileTypes: true }); } catch { return []; }
  const dirs = entries.filter((e) => e.isDirectory());
  if (dirs.length) {
    return dirs.map((e) => {
      const dir = join(abs, e.name);
      const a = REGISTRY.detect(dir);
      return { dir, name: e.name, adapter: a ? a.kind : null };
    });
  }
  const self = REGISTRY.detect(abs);
  return self ? [{ dir: abs, name: basename(abs), adapter: self.kind }] : [];
}

function main() {
  const root = process.argv[2] || ".satellite-intake";
  const found = detectSources(root);
  const known = found.filter((f) => f.adapter);
  console.log(`detect-source: escaneando ${resolve(root)} (adapters: ${REGISTRY.list.map((a) => a.kind).join(", ")})`);
  if (!found.length) { console.log("  (nada — el directorio no existe o está vacío)"); }
  for (const f of found) {
    console.log(`  ${f.adapter ? "✓" : "·"} ${f.name} → ${f.adapter || "no reconocido"}   (${f.dir})`);
  }
  if (known.length) {
    console.log(`\ndetect-source: ${known.length} candidato(s) reconocido(s). SUGERENCIA (confirma o corrige la ruta):`);
    for (const f of known) console.log(`  node scripts/builders/from-file.mjs ${f.dir} --out <ir.json>   # ${f.adapter}`);
    process.exit(0);
  }
  console.log("\ndetect-source: ningún backup reconocido — PREGUNTA al operador la ruta / el proyecto.");
  process.exit(2);
}
if (import.meta.url === `file://${process.argv[1]}`) main();
