import { test } from "node:test";
import assert from "node:assert/strict";
import { validateBrief, field, SCHEMA_VERSION } from "../scripts/lib/brief.mjs";

function baseBrief(fields = {}) {
  return {
    schemaVersion: SCHEMA_VERSION,
    intakeMode: "a-no-design",
    identity: {
      name: field("Clínica Demo", "provided"),
      sector: field("clínica", "provided"),
      language: field("es", "provided"),
    },
    fields,
  };
}

test("brief válido (provided/extracted/proposed/missing) pasa", () => {
  const b = baseBrief({
    contactEmail: field("hola@demo.es", "provided"),
    brandColors: field(["#1b5e20"], "extracted", "https://demo.es"),
    slogan: field("Tu salud primero", "proposed"),
    logo: field(null, "missing"),
  });
  const { ok, problems } = validateBrief(b);
  assert.equal(ok, true, problems.join("; "));
});

// AC#3: un dato SIN fuente no puede presentarse como real.
test("AC#3: valor con provenance=missing (sin fuente) => INVÁLIDO", () => {
  const b = baseBrief({ followers: { value: "50k", provenance: "missing" } });
  const { ok, problems } = validateBrief(b);
  assert.equal(ok, false);
  assert.ok(problems.some((p) => /invencion encubierta/.test(p)), problems.join("; "));
});

test("AC#3: 'extracted' sin source => INVÁLIDO (dato sin fuente)", () => {
  const b = baseBrief({ bio: { value: "experta en X", provenance: "extracted" } });
  const { ok, problems } = validateBrief(b);
  assert.equal(ok, false);
  assert.ok(problems.some((p) => /sin 'source'/.test(p)), problems.join("; "));
});

test("AC#3: provenance 'invented' está prohibida", () => {
  const b = baseBrief({ price: { value: "99€", provenance: "invented" } });
  const { ok, problems } = validateBrief(b);
  assert.equal(ok, false);
  assert.ok(problems.some((p) => /no valida|prohibida/.test(p)), problems.join("; "));
});

test("field(): missing con valor lanza (no se puede inventar)", () => {
  assert.throws(() => field("algo", "missing"), /no puede llevar valor/);
});

test("field(): extracted sin source lanza", () => {
  assert.throws(() => field("x", "extracted"), /requiere 'source'/);
});

test("schemaVersion incorrecta => inválido", () => {
  const b = baseBrief();
  b.schemaVersion = "9.9.9";
  assert.equal(validateBrief(b).ok, false);
});
