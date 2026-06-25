// VOCABULARIO em-ui (G2, ECO-74 · ADR-015 §6) — el BINDING DE PRODUCTO consultable por R4 (G3). Verifica que el
// catálogo expone las SECCIONES semánticas + las PRIMITIVAS + la superficie de TOKENS leídas del registry/tokens
// (fuente de verdad). Es lo que la IA-diseñador consultará en G3 para saber CON QUÉ compone.
import { test } from "node:test";
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { vocabulary, vocabularySummary } from "../scripts/builders/standard/vocabulary.mjs";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");   // tests→skill→.claude→repo

test("vocabulary: catálogo con secciones semánticas + primitivas + tokens (consultable por R4)", () => {
  const v = vocabulary(REPO);
  assert.equal(v.ok, true, v.reason);
  const sec = v.sections.map((s) => s.name);
  for (const s of ["Hero", "Services", "Testimonials", "FAQ", "CTA", "Contact"]) assert.ok(sec.includes(s), `falta sección ${s}`);
  assert.ok(v.primitives.some((p) => p.name === "Button"), "primitiva Button presente");
  assert.ok(v.components.length >= 50, "catálogo completo (≥50 componentes)");
  // superficie de tokens (la marca se aplica por tokens, no editando componentes — ADR-014 §2)
  assert.ok(v.tokens.colors.includes("color-accent"), "token de marca accent");
  assert.ok(v.tokens.typography.some((t) => /^text-h1/.test(t)), "escala tipográfica");
});

test("vocabulary: autodetecta el repo (sin pasar repoRoot)", () => {
  assert.equal(vocabulary().ok, true, "debe encontrar design-system/registry.json subiendo desde el módulo");
});

test("vocabularySummary: resumen legible (secciones + primitivas + tokens)", () => {
  const s = vocabularySummary(REPO);
  assert.match(s, /secciones/); assert.match(s, /primitivas/); assert.match(s, /tokens/);
});
