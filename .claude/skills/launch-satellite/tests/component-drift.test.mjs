// Gate de DRIFT de componentes (G2, ECO-74 · ADR-014 §2 / ADR-015). Los componentes em-ui copiados al satélite
// deben COMPONERSE, no MODIFICARSE (la marca va por tokens/uso, no editando el fuente). Verifica: una copia
// VERBATIM del registry pasa; un componente EDITADO (forkeado) FALLA. Fuente de verdad: design-system/registry.json.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyComponentDrift, assertNoDrift } from "../scripts/builders/standard/component-drift.mjs";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");   // tests→skill→.claude→repo
const BUTTON_SRC = join(REPO, "design-system", "components", "Button.tsx");

function satWithUi() {
  const sat = mkdtempSync(join(tmpdir(), "sat-drift-"));
  const ui = join(sat, "src", "components", "ui");
  mkdirSync(ui, { recursive: true });
  return { sat, ui, cleanup: () => rmSync(sat, { recursive: true, force: true }) };
}

test("drift: componente copiado VERBATIM del registry → SIN drift", () => {
  assert.ok(existsSync(BUTTON_SRC), "fixture: design-system/components/Button.tsx debe existir");
  const s = satWithUi();
  try {
    copyFileSync(BUTTON_SRC, join(s.ui, "Button.tsx"));
    const r = verifyComponentDrift(s.sat, REPO);
    assert.equal(r.ok, true, JSON.stringify(r.problems));
    assert.ok(r.lines.some((l) => /Button\.tsx.*idéntico/.test(l)), "reporta idéntico");
  } finally { s.cleanup(); }
});

test("drift: componente MODIFICADO (forkeado) → FALLA (ADR-014 §2)", () => {
  const s = satWithUi();
  try {
    writeFileSync(join(s.ui, "Button.tsx"), readFileSync(BUTTON_SRC, "utf8") + "\n// edición local prohibida — esto es drift\n");
    const r = verifyComponentDrift(s.sat, REPO);
    assert.equal(r.ok, false, "un componente editado debe fallar");
    assert.ok(r.problems.some((p) => /Button\.tsx.*MODIFICADO/.test(p)), "reporta MODIFICADO");
    assert.throws(() => assertNoDrift(s.sat, REPO), /DRIFT/);
  } finally { s.cleanup(); }
});

test("drift: satélite sin componentes em-ui copiados → ok (nada que verificar)", () => {
  const s = satWithUi();
  try {
    const r = verifyComponentDrift(s.sat, REPO);
    assert.equal(r.ok, true);
  } finally { s.cleanup(); }
});
