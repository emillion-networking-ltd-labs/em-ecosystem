// SPEC DE DISEÑO (G3, ECO-75 · ADR-015 §5) — validateDesign: el contrato + LOSSLESS POR REFS + anti-relapse
// (sin role→shell, sin copy en el spec). El compilador confía en que esto pasó.
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateDesign } from "../scripts/builders/standard/design-spec.mjs";

// 4 bloques: 0,1,2 con contenido; 3 vacío (shortcode) → opcional.
const page = { blocks: [
  { kind: "heading", text: "H" }, { kind: "text-editor", text: "copy real" },
  { kind: "image", media: ["x.jpg"] }, { kind: "shortcode" },
] };
const ok = { designVersion: "1.0.0", variant: 0, blocks: 4,
  tree: [{ layout: "section", bg: "surface-primary", children: [{ ref: 0 }, { ref: 1 }, { ref: 2, as: "figure" }] }] };

test("validateDesign: spec válido → [] (bloque vacío NO obligatorio)", () => {
  assert.deepEqual(validateDesign(ok, page), []);
});

test("validateDesign: LOSSLESS — un bloque con contenido sin ref → FALLA", () => {
  const bad = { ...ok, tree: [{ layout: "section", children: [{ ref: 0 }, { ref: 2, as: "figure" }] }] };   // falta ref 1
  const p = validateDesign(bad, page);
  assert.ok(p.some((x) => /bloque 1 .*NO referenciado/.test(x)), p.join(" | "));
});

test("validateDesign: ref fuera de rango → FALLA", () => {
  assert.ok(validateDesign({ ...ok, tree: [{ layout: "section", children: [{ ref: 0 }, { ref: 1 }, { ref: 2 }, { ref: 9 }] }] }, page)
    .some((x) => /fuera de rango/.test(x)));
});

test("validateDesign: ANTI-RELAPSE — clave 'role' (role→shell) prohibida → FALLA", () => {
  assert.ok(validateDesign({ ...ok, tree: [{ layout: "section", role: "hero", children: [{ ref: 0 }, { ref: 1 }, { ref: 2 }] }] }, page)
    .some((x) => /clave prohibida 'role'/.test(x)));
});

test("validateDesign: ANTI-INVENCIÓN — copy en el spec ('text') prohibido → FALLA", () => {
  assert.ok(validateDesign({ ...ok, tree: [{ layout: "section", children: [{ ref: 0, text: "inventado" }, { ref: 1 }, { ref: 2 }] }] }, page)
    .some((x) => /clave prohibida 'text'/.test(x)));
});

test("validateDesign: layout / as / box desconocidos → FALLA", () => {
  assert.ok(validateDesign({ ...ok, tree: [{ layout: "zigzag", children: [{ ref: 0 }, { ref: 1 }, { ref: 2 }] }] }, page).some((x) => /layout desconocido/.test(x)));
  assert.ok(validateDesign({ ...ok, tree: [{ layout: "section", children: [{ ref: 0, as: "neon" }, { ref: 1 }, { ref: 2 }] }] }, page).some((x) => /'as' desconocido/.test(x)));
  assert.ok(validateDesign({ ...ok, tree: [{ layout: "section", box: "glass", children: [{ ref: 0 }, { ref: 1 }, { ref: 2 }] }] }, page).some((x) => /'box' desconocido/.test(x)));
});

test("validateDesign: design.blocks ≠ bloques de la página (IR cambió) → FALLA", () => {
  assert.ok(validateDesign({ ...ok, blocks: 99 }, page).some((x) => /design\.blocks=99/.test(x)));
});
