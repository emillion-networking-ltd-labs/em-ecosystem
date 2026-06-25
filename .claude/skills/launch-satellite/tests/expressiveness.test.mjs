// MÉTRICA DE EXPRESIVIDAD (G3, ECO-75 · ADR-015 §5) — este test PRUEBA QUE LA MÉTRICA FUNCIONA (la garantía de
// CI). NO juzga belleza: eso es el GATE VISUAL HUMANO (R5, Atis re-emitido) + la métrica VIVA en G4 (regenerar).
// Aquí se fija, con los MISMOS fixtures de la calibración, que:
//   · NO-genuinos (idéntico / sólo-tokens / sólo-reorden) → score 0.000 → NO pasan (no gameable).
//   · GENUINOS (distinta agrupación/layout/placement del MISMO contenido) → score alto → pasan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { compositionDistance, genuinelyDifferent, EXPRESSIVENESS_THRESHOLD } from "../scripts/builders/standard/expressiveness.mjs";

const D = (tree) => ({ designVersion: "1.0.0", variant: 0, blocks: 6, tree });
const A = D([{ layout: "section", bg: "surface-primary", children: [{ ref: 0 }, { ref: 1 }, { ref: 2 }, { ref: 3 }, { ref: 4 }, { ref: 5 }] }]);
const Atok = D([{ layout: "section", bg: "accent", children: [{ ref: 0 }, { ref: 1 }, { ref: 2 }, { ref: 3 }, { ref: 4 }, { ref: 5 }] }]);          // sólo tokens
const Aro = D([{ layout: "section", bg: "surface-primary", children: [{ ref: 2 }, { ref: 0 }, { ref: 5 }, { ref: 1 }, { ref: 4 }, { ref: 3 }] }]);   // sólo reorden
const B = D([
  { layout: "band", bg: "accent", align: "center", children: [{ ref: 0 }, { ref: 1 }] },
  { layout: "grid", cols: 3, bg: "surface-secondary", children: [{ ref: 2, as: "card" }, { ref: 3, as: "card" }, { ref: 4, as: "card" }] },
  { layout: "columns", bg: "surface-primary", children: [{ ref: 5, as: "figure" }] }]);
const C = D([
  { layout: "grid", cols: 2, children: [{ ref: 0, as: "card" }, { ref: 1, as: "card" }] },
  { layout: "grid", cols: 2, children: [{ ref: 2, as: "card" }, { ref: 3, as: "card" }] },
  { layout: "stack", children: [{ ref: 4 }, { ref: 5, as: "cta" }] }]);

test("métrica: NO-genuinos puntúan 0 y NO pasan (idéntico / sólo-tokens / sólo-reorden)", () => {
  for (const [lbl, x] of [["identical", A], ["token-only", Atok], ["reorder-only", Aro]]) {
    const d = compositionDistance(A, x);
    assert.equal(d.score, 0, `${lbl} debe puntuar 0 (la firma ignora tokens y orden) — fue ${d.score}`);
    assert.equal(genuinelyDifferent(A, x).ok, false, `${lbl} NO debe contar como genuinamente distinto`);
  }
});

test("métrica: GENUINOS puntúan alto y PASAN (distinta composición del mismo contenido)", () => {
  for (const [lbl, a, b] of [["A·B", A, B], ["A·C", A, C], ["B·C", B, C]]) {
    const d = compositionDistance(a, b);
    assert.ok(d.score >= 0.5, `${lbl} genuino debe puntuar ≥0.5 — fue ${d.score}`);
    assert.equal(genuinelyDifferent(a, b).ok, true, `${lbl} debe contar como genuinamente distinto`);
  }
});

test("métrica: el umbral 0.34 separa con margen (no-genuino 0 < 0.34 < 0.54 genuino mínimo)", () => {
  assert.equal(EXPRESSIVENESS_THRESHOLD, 0.34);
  const minGenuine = Math.min(compositionDistance(A, B).score, compositionDistance(A, C).score, compositionDistance(B, C).score);
  assert.ok(EXPRESSIVENESS_THRESHOLD < minGenuine, "el umbral debe quedar por DEBAJO del genuino más parecido");
  assert.ok(EXPRESSIVENESS_THRESHOLD > 0, "y por ENCIMA de los no-genuinos (0)");
});
