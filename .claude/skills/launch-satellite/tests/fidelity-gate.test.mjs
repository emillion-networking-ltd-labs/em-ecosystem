// Tests del GATE DE FIDELIDAD + núcleo del LOOP del modo (c) (ECO-45, D4 del norte). Sin red.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { generateSatellite, val } from "../scripts/generate-satellite.mjs";
import {
  SCHEMA_VERSION, field, validateBrief, briefIntent, DEFAULT_INTENT, INTENTS, confirmField, fieldProblems,
} from "../scripts/lib/brief.mjs";

// ── intent: default, validación, no rompe briefs previos ──────────────────────
test("intent ausente => default b-remodel (no se auto-impone)", () => {
  assert.equal(DEFAULT_INTENT, "b-remodel");
  assert.equal(briefIntent({}), "b-remodel");
  assert.equal(briefIntent({ intent: { value: "a-replica", provenance: "provided" } }), "a-replica");
  assert.deepEqual([...INTENTS], ["a-replica", "b-remodel", "c-reimagine"]);
});

const baseBrief = (extra = {}) => ({
  schemaVersion: SCHEMA_VERSION, intakeMode: "c-improve-site",
  identity: { name: field("Grupo Atis", "provided"), sector: field("logística", "provided"), language: field("es", "provided") },
  fields: {}, ...extra,
});

test("brief SIN intent sigue válido (no rompe briefs previos)", () => {
  assert.equal(validateBrief(baseBrief()).ok, true);
});

test("brief con intent válido pasa; intent.value fuera del enum falla", () => {
  assert.equal(validateBrief(baseBrief({ intent: { value: "b-remodel", provenance: "provided" } })).ok, true);
  const bad = validateBrief(baseBrief({ intent: { value: "z-nope", provenance: "provided" } }));
  assert.equal(bad.ok, false);
  assert.ok(bad.problems.some((p) => p.includes("intent.value")));
});

// ── latitud por modo (split verdad/diseño D4) — val() directo ─────────────────
test("HECHO (provided/extracted) se rinde intacto en los TRES modos", () => {
  for (const intent of INTENTS) {
    assert.equal(val(field("Grupo Atis", "provided"), "nombre", intent), "Grupo Atis");
    assert.equal(val(field("Servicios", "extracted", "backup:x"), "copy", intent), "Servicios");
  }
});

test("CREATIVIDAD (proposed): se renderiza en B/C, NO en A (réplica → [PENDIENTE])", () => {
  const prop = field("Tu logística, sin fricción", "proposed");
  assert.equal(val(prop, "tagline", "b-remodel"), "Tu logística, sin fricción");   // remodel: preview
  assert.equal(val(prop, "tagline", "c-reimagine"), "Tu logística, sin fricción");  // reimagine: preview
  assert.equal(val(prop, "tagline", "a-replica"), "[PENDIENTE: tagline]");          // réplica: no hasta confirmar
});

test("missing/ausente => placeholder visible, NUNCA fabricado (los tres modos)", () => {
  for (const intent of INTENTS) {
    assert.equal(val(field(null, "missing"), "email", intent), "[FALTA: email]");
    assert.equal(val(undefined, "tel", intent), "[FALTA: tel]");
  }
});

// ── no-inventar sobre HECHOS (duro) ───────────────────────────────────────────
test('un dato sin fuente NUNCA se cuela como provided/extracted', () => {
  // extracted exige source real → field() lo impide
  assert.throws(() => field("dato", "extracted"), /source/);
  // missing con valor = invención encubierta → fieldProblems lo caza
  assert.ok(fieldProblems("x", { value: "fabricado", provenance: "missing" }).length > 0);
  // y val() jamás convierte un missing en un valor renderizado
  assert.equal(val({ value: "fabricado", provenance: "missing" }, "x", "b-remodel"), "[FALTA: x]");
});

// ── núcleo del LOOP: confirmar proposed → provided ────────────────────────────
test("confirmField: proposed→provided; rechaza missing/sin valor", () => {
  assert.deepEqual(confirmField(field("Nuevo hero", "proposed")), { value: "Nuevo hero", provenance: "provided" });
  assert.throws(() => confirmField(field(null, "missing")), /proposed/);
  assert.throws(() => confirmField(field("x", "provided")), /proposed/);
});

// ── end-to-end: el intent llega al generador y cambia la latitud ──────────────
let dirA, dirB, traceA, traceB;
before(() => {
  // mismo brief, una sugerencia proposed en el sector; A no la renderiza, B sí.
  const mk = (intent) => baseBrief({
    identity: { name: field("Grupo Atis", "provided"), sector: field("logística premium", "proposed"), language: field("es", "provided") },
    intent: { value: intent, provenance: "provided" },
  });
  dirA = join(mkdtempSync(join(tmpdir(), "sat-A-")), "d");
  dirB = join(mkdtempSync(join(tmpdir(), "sat-B-")), "d");
  traceA = generateSatellite(mk("a-replica"), dirA);
  traceB = generateSatellite(mk("b-remodel"), dirB);
});
after(() => { for (const d of [dirA, dirB]) { try { rmSync(dirname(d), { recursive: true, force: true }); } catch {} } });

test("e2e: trace.intent refleja el gate; A no renderiza la propuesta, B sí", () => {
  assert.equal(traceA.intent, "a-replica");
  assert.equal(traceB.intent, "b-remodel");
  const pageA = readFileSync(join(dirA, "src/app/page.tsx"), "utf8");
  const pageB = readFileSync(join(dirB, "src/app/page.tsx"), "utf8");
  // el HECHO (nombre, provided) está en ambos (es el title del Hero)
  assert.ok(pageA.includes("Grupo Atis") && pageB.includes("Grupo Atis"));
  // la PROPUESTA (sector proposed, el eyebrow del Hero) se RENDERIZA solo en B; en A se OMITE (no se fabrica)
  assert.ok(pageB.includes("logística premium"), "B renderiza la propuesta (preview, eyebrow del Hero)");
  assert.ok(!pageA.includes("logística premium"), "A (réplica) NO renderiza la propuesta — la omite");
  // traza para el loop: B registra la propuesta a confirmar; A la deja como pendiente (placeholder)
  assert.ok(traceB.proposed.includes("identity.sector"), "B traza la propuesta a confirmar");
  assert.ok(traceA.placeholders.includes("identity.sector"), "A deja la propuesta como pendiente (omitida)");
});
