// COMPILADOR del esqueleto (G2, ECO-74 · ADR-015 §6). El SUELO `compileMinimal`: <main> LOSSLESS SIN composición.
// Verifica que (a) preserva TODO el copy/imágenes (lossless), (b) NO compone (ni hero de marca ni bandas — eso es
// G3), (c) coloca las imágenes usadas que ningún bloque puso (lossless). El contrato (page,ctx)->JSX lo cumple G3
// con el compilador del spec; aquí se fija el suelo determinista.
import { test } from "node:test";
import assert from "node:assert/strict";
import { compileMinimal } from "../scripts/builders/standard/compiler.mjs";

const ctx = { siteName: "Demo Co", t: {}, media: new Map([["hero.jpg", "/images/hero.jpg"]]), contactHref: "/contact", pageImages: [] };

test("compileMinimal: LOSSLESS — emite TODO el copy de los bloques; cero artefactos", () => {
  const page = { route: "/", blocks: [
    { kind: "heading", text: "Welcome" }, { kind: "text-editor", text: "<p>Real copy.</p>" },
    { kind: "image", media: ["hero.jpg"] }, { kind: "shortcode" }, { kind: "text-editor", text: null },
  ] };
  const main = compileMinimal(page, ctx);
  assert.match(main, /\{"Welcome"\}/, "heading real preservado");
  assert.match(main, /\{"Real copy\."\}/, "copy real preservado");
  assert.match(main, /\/images\/hero\.jpg/, "imagen real renderizada");
  assert.doesNotMatch(main, /undefined|\bnull\b|\[object Object\]/, "cero artefactos (omit-if-absent)");
});

test("compileMinimal: SUELO sin composición — NO hero de marca ni bandas (eso lo trae G3)", () => {
  const page = { route: "/", blocks: [{ kind: "heading", text: "Welcome" }, { kind: "text-editor", text: "x" }] };
  const main = compileMinimal(page, { ...ctx, isHome: true });
  assert.doesNotMatch(main, /from-accent to-accent-dark/, "el suelo NO compone un hero de marca (G3 sí)");
  // sólo superficies neutras (sin alternar bandas para 'ritmo' — eso es diseño, no suelo)
  assert.doesNotMatch(main, /bg-surface-secondary/, "el suelo no alterna superficies (sin composición)");
});

test("compileMinimal: imágenes usadas que ningún bloque colocó → galería final (lossless)", () => {
  const page = { route: "/", blocks: [{ kind: "heading", text: "Hi" }] };
  const main = compileMinimal(page, { ...ctx, pageImages: ["/images/bg.jpg"] });
  assert.match(main, /\/images\/bg\.jpg/, "fondo no-widget colocado (ninguna imagen real se pierde)");
});

test("compileMinimal: página vacía → '' (sin secciones basura)", () => {
  assert.equal(compileMinimal({ route: "/x", blocks: [{ kind: "shortcode" }] }, ctx), "");
});
