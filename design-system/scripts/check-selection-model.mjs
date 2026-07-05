#!/usr/bin/env node
// check-selection-model — guard de la NORMA DEFINITIVA de selección (ECO-115, refina ECO-99/107; ECO-141).
//
// ECO-141: el caret sólo sobre TEXTO también significa que el WIDGET de un control no lo lleva — los
// `<input type="checkbox|radio|…">` nativos son user-select:none (no heredan el opt-in de `input`, que se
// estrecha a inputs de texto). La ETIQUETA `<label>` sí es seleccionable (es texto), no se saca del opt-in.
//
// Norma: el caret/I-beam aparece SÓLO sobre TEXTO — nunca sobre elementos no-texto (cards, layout, chrome).
// Modelo: en tokens.css, `body { user-select: none }` (nada seleccionable por defecto → sin caret en cajas) +
// un opt-in `user-select: text` para las etiquetas de texto y los editables; los controles y sus descendientes
// son user-select:none. El texto que un componente ponga en un <div> (fuera de la lista de tags) NO hereda el
// opt-in → debe reabrir la selección con la clase `select-text` sobre ese contenedor (y `select-none` si es un
// contenedor de texto que NO debe seleccionarse, p.ej. un placeholder). El fallo que destapó ECO-115: AlertBox
// ponía su mensaje en un <div> sin `select-text` → no era copiable, y el guard viejo NO lo cazaba.
//
// Este guard hace dos cosas:
//  (1) verifica que tokens.css mantiene el modelo (body none + opt-in text + descendientes de control none);
//  (2) escanea components/ y sections/ y EXIGE que todo <div> con una clase de TAMAÑO de texto declare su
//      intención de selección (`select-text` o `select-none`) — así no vuelve a colarse un texto-en-div mudo.
//      Los contenedores de icono usan `text-content-*` (sólo color, sin tamaño) → no se marcan.
//
// Uso: node scripts/check-selection-model.mjs   (cwd = design-system/)

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(ds, "tokens", "tokens.css"), "utf8");

let failed = 0;

// (1) Modelo en tokens.css.
const cssChecks = [
  [/body\s*\{[^}]*user-select:\s*none/s, "`body` debe declarar user-select: none (nada seleccionable por defecto → sin caret en cajas/layout/no-texto)"],
  [/user-select:\s*text/, "debe existir un opt-in user-select: text para el texto (copiable)"],
  // ECO-141: el opt-in de texto de `input` se estrecha para EXCLUIR los tipos de control (checkbox/radio/…),
  // de modo que el caret/selección no aparezca sobre el WIDGET del control.
  [/input:not\(\[type="checkbox"\]\)[^{]*\{[^}]*user-select:\s*text/s, "el opt-in de texto de `input` debe excluir los tipos de control (`input:not([type=\"checkbox\"])…`) — sólo los inputs de TEXTO reciben user-select: text (ECO-141)"],
  // ECO-141: los inputs de control NATIVOS (no-texto) deben ser user-select: none (sin caret sobre el widget).
  [/input\[type="checkbox"\][^{}]*\{[^}]*user-select:\s*none/s, "los inputs de control nativos (checkbox/radio/button/range/…) deben declarar user-select: none — el caret no debe aparecer sobre el widget (ECO-141)"],
  // ECO-141: la etiqueta `label` permanece SELECCIONABLE (es texto) — no sale del opt-in.
  [/\blabel\b[^{}]*\{[^}]*user-select:\s*text/s, "la etiqueta `label` debe permanecer en el opt-in de texto (seleccionable) — es texto, no chrome (ECO-141)"],
  [/button\s*\*[^{]*\{[^}]*user-select:\s*none/s, "los descendientes de un control (`button *`, `[role] *`) deben ser user-select: none — el opt-in de texto NO debe reactivar el caret dentro de un botón"],
];
for (const [re, msg] of cssChecks) {
  if (!re.test(css)) {
    console.error(`✗ selection-model (tokens.css): ${msg}`);
    failed++;
  }
}

// (2) Escaneo de componentes/secciones: todo <div> con clase de TAMAÑO de texto declara select-text/select-none.
const TEXT_SIZE = /\btext-(?:body|caption|h[1-3]|display|xs|sm|base|lg|xl|[0-9]xl)\b/;
const SELECT_DECL = /\bselect-(?:text|none|all)\b/;
const DIV_OPEN = /<div\b[^>]*>/g; // etiqueta de apertura hasta el primer '>' (className rara vez contiene '>')

function tsxFiles(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".tsx"))
    .map((e) => join(dir, e.name));
}

const violations = [];
for (const dir of [join(ds, "components"), join(ds, "sections")]) {
  for (const file of tsxFiles(dir)) {
    const src = readFileSync(file, "utf8");
    for (const m of src.matchAll(DIV_OPEN)) {
      const tag = m[0];
      if (TEXT_SIZE.test(tag) && !SELECT_DECL.test(tag)) {
        const line = src.slice(0, m.index).split("\n").length;
        violations.push(`${file.replace(ds + "/", "")}:${line}`);
      }
    }
  }
}
if (violations.length) {
  console.error(
    "✗ selection-model: hay <div> con clase de tamaño de texto SIN declarar select-text/select-none (texto que no se podría seleccionar, como AlertBox):",
  );
  for (const v of violations) console.error(`    - ${v}`);
  console.error(
    "  Añade `select-text` si su texto debe ser copiable, o `select-none` si es un contenedor que no debe seleccionarse.",
  );
  failed++;
}

if (failed) {
  console.error(
    '\n✗ selection-model FALLA — la norma "el caret sólo sobre texto; todo el texto seleccionable" (ECO-115) no se cumple.',
  );
  process.exit(1);
} else {
  console.log(
    "✓ selection-model OK — modelo en tokens.css + todo <div> de texto declara su selección (norma ECO-115).",
  );
}
