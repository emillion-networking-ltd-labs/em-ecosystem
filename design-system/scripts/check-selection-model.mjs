#!/usr/bin/env node
// check-selection-model — guard de regresión (ECO-99). Verifica que el core tokens.css mantiene el
// modelo "solo el texto es seleccionable": `body` con user-select:none (ningún caret dentro de cards/
// elementos no-texto) + un opt-in user-select:text para el texto y los campos editables. Si alguien lo
// quita, reaparece el caret de texto metido en elementos no-texto (el bug que destapó el catálogo).
//
// Uso: node scripts/check-selection-model.mjs   (cwd = design-system/)

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(ds, "tokens", "tokens.css"), "utf8");

const checks = [
  [/body\s*\{[^}]*user-select:\s*none/s, "`body` debe declarar user-select: none (elementos no seleccionables → sin caret)"],
  [/user-select:\s*text/, "debe existir un opt-in user-select: text para el texto (copiable)"],
  [/input,\s*textarea[^{]*\{[^}]*user-select:\s*text/s, "input/textarea deben reactivar user-select: text"],
];

let failed = 0;
for (const [re, msg] of checks) {
  if (!re.test(css)) {
    console.error(`✗ selection-model: ${msg}`);
    failed++;
  }
}

if (failed) {
  console.error('\n✗ selection-model FALLA — el modelo "solo el texto es seleccionable" no está completo en tokens.css.');
  process.exit(1);
} else {
  console.log("✓ selection-model OK — solo el texto (y editables) es seleccionable; elementos sin caret.");
}
