#!/usr/bin/env node
// check-selection-model — guard de regresión de la NORMA DEFINITIVA de selección (ECO-115).
//
// Modelo: el TEXTO es seleccionable por DEFECTO (como el navegador / el dashboard). NO hay select-none
// global ni opt-in por selector. SÓLO las superficies de control (button, [role="button"], …) llevan
// user-select:none; como user-select es HEREDADO, el texto dentro de un control hereda `none` sin necesidad
// de `button *`. Reemplaza el modelo "nada seleccionable + opt-in" de ECO-99/107, que dejaba SIN seleccionar
// el texto puesto en un <div> (p.ej. AlertBox) — y que este guard, en su versión vieja, NO cazaba.
//
// El guard es estático (regex sobre tokens.css), así que no computa la cascada; en su lugar protege el
// modelo por su ESTRUCTURA: (a) los controles deben ser select-none, y (b) el anti-patrón que rompía la
// selección de texto —`body { user-select: none }` global y el opt-in `user-select: text`— NO debe volver.
// El test de regresión a nivel de comportamiento vive en tests/selection-model.test.ts.
//
// Uso: node scripts/check-selection-model.mjs   (cwd = design-system/)

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(ds, "tokens", "tokens.css"), "utf8");

// DEBE existir: los controles se marcan user-select:none (sin caret al pulsarlos; el texto interno hereda none).
const mustHave = [
  [
    /button\s*,[\s\S]*?\[role="button"\][\s\S]*?\{[^}]*user-select:\s*none/,
    'los controles (`button`, `[role="button"]`, …) deben declarar user-select: none — así no muestran el caret al pulsarlos y su texto interno hereda `none`',
  ],
  [
    /\[role="button"\][^{]*\{[^}]*cursor:\s*pointer/,
    "los controles deben mostrar cursor: pointer (Tailwind v4 no lo pone en <button>)",
  ],
];

// NO debe existir: el anti-patrón del modelo viejo (ECO-99/107) que dejaba el texto puesto en un <div> sin
// seleccionar. Si vuelve, AlertBox y compañía vuelven a no ser copiables → regresión que el guard viejo no veía.
const mustNotHave = [
  [
    /body\s*\{[^}]*user-select:\s*none/,
    "`body { user-select: none }` global — es el anti-patrón que hacía NO seleccionable todo el texto que no estuviera en la lista de opt-in (p.ej. el texto en un <div> como AlertBox). El texto debe ser seleccionable por defecto (ECO-115)",
  ],
  [
    /user-select:\s*text/,
    "opt-in `user-select: text` por selector — pertenece al modelo viejo (ECO-99). Con la norma definitiva el texto ya es seleccionable por defecto; reintroducirlo señala que el select-none global ha vuelto",
  ],
];

let failed = 0;
for (const [re, msg] of mustHave) {
  if (!re.test(css)) {
    console.error(`✗ selection-model (falta): ${msg}`);
    failed++;
  }
}
for (const [re, msg] of mustNotHave) {
  if (re.test(css)) {
    console.error(`✗ selection-model (anti-patrón presente): ${msg}`);
    failed++;
  }
}

if (failed) {
  console.error(
    "\n✗ selection-model FALLA — la norma definitiva (ECO-115) no se cumple: el texto debe ser seleccionable por defecto y sólo los controles user-select:none.",
  );
  process.exit(1);
} else {
  console.log(
    "✓ selection-model OK — texto seleccionable por defecto; sólo los controles user-select:none (norma ECO-115).",
  );
}
