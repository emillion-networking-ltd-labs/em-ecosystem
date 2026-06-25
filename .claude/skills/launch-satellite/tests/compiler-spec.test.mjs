// compileFromSpec (G3, ECO-75 · ADR-015) — el TIPÓGRAFO TONTO que rinde page.design. Verifica: DETERMINISTA
// (mismo spec → mismo JSX), LOSSLESS (todo el copy + imágenes), rinde el ÁRBOL (band/grid/card/columns), y SIN
// page.design cae al SUELO (compileMinimal). NO hay clasificador: el output sigue el spec, no el contenido.
import { test } from "node:test";
import assert from "node:assert/strict";
import { compileFromSpec, compileMinimal } from "../scripts/builders/standard/compiler.mjs";

const ctx = { siteName: "Demo Co", t: {}, media: new Map([["hero.jpg", "/images/hero.jpg"]]), contactHref: "/contact", pageImages: [] };
const page = () => ({
  route: "/", blocks: [
    { kind: "heading", text: "Welcome" }, { kind: "icon-box", text: "Air\nfast freight" },
    { kind: "icon-box", text: "Sea\nsafe freight" }, { kind: "image", media: ["hero.jpg"] },
  ],
  design: { designVersion: "1.0.0", variant: 0, blocks: 4, tree: [
    { layout: "band", bg: "accent", align: "center", emphasis: "hero", children: [{ ref: 0 }] },
    { layout: "grid", cols: 2, gap: "lg", bg: "surface-secondary", children: [
      { layout: "stack", box: "card", children: [{ ref: 1 }] },
      { layout: "stack", box: "card", children: [{ ref: 2 }] } ] },
    { layout: "columns", bg: "surface-primary", children: [{ ref: 3, as: "figure" }] },
  ] },
});

test("compileFromSpec: DETERMINISTA — mismo spec → JSX byte-idéntico", () => {
  assert.equal(compileFromSpec(page(), ctx), compileFromSpec(page(), ctx));
});

test("compileFromSpec: LOSSLESS — emite todo el copy + imagen del IR", () => {
  const m = compileFromSpec(page(), ctx);
  assert.match(m, /\{"Welcome"\}/); assert.match(m, /Air/); assert.match(m, /Sea/);
  assert.match(m, /\/images\/hero\.jpg/);
  assert.doesNotMatch(m, /undefined|\[object Object\]/);
});

test("compileFromSpec: rinde el ÁRBOL del spec (banda de marca + grid 2col + cards + columns)", () => {
  const m = compileFromSpec(page(), ctx);
  assert.match(m, /from-accent to-accent-dark/, "banda de marca (bg accent)");
  assert.match(m, /sm:grid-cols-2/, "grid de 2 columnas");
  assert.match(m, /rounded-2xl border/, "box card");
  assert.match(m, /lg:grid-cols-2/, "columns (split)");
});

test("compileFromSpec: el árbol MANDA, no el contenido — distinta composición del MISMO contenido", () => {
  const a = page();
  const b = page(); b.design = { designVersion: "1.0.0", variant: 1, blocks: 4,
    tree: [{ layout: "stack", bg: "surface-primary", children: [{ ref: 0 }, { ref: 1 }, { ref: 2 }, { ref: 3, as: "figure" }] }] };
  const A = compileFromSpec(a, ctx), B = compileFromSpec(b, ctx);
  assert.notEqual(A, B, "dos specs distintos → JSX distinto (el compilador sigue el spec)");
  assert.doesNotMatch(B, /sm:grid-cols-2/, "el variant en stack NO tiene grid (sin clasificador que lo imponga)");
});

test("compileFromSpec: sin page.design → cae al SUELO (idéntico a compileMinimal)", () => {
  const p = page(); delete p.design;
  assert.equal(compileFromSpec(p, ctx), compileMinimal(p, ctx));
});
