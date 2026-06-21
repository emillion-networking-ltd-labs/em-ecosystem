// Tests de la persistencia del brief como PROCEDENCIA commiteada (ECO-46, D5 del norte). Sin red.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { generateSatellite } from "../scripts/generate-satellite.mjs";
import { SCHEMA_VERSION, field } from "../scripts/lib/brief.mjs";

// Brief con procedencia variada, incluido un `source` que apunta a .satellite-intake/ (procedencia histórica).
const brief = {
  schemaVersion: SCHEMA_VERSION,
  intakeMode: "c-improve-site",
  intent: { value: "b-remodel", provenance: "provided" },
  identity: {
    name: field("Grupo Atis", "provided"),
    sector: field("logística", "extracted", "backup:.satellite-intake/grupoatis.com/wp-content/themes"),
    language: field("es", "provided"),
  },
  fields: {
    contactPhone: field("+507 000 0000", "provided"),
    services: field(["Transporte", "Logística"], "proposed"),
  },
  targetRoutes: ["/", "/servicios", "/contacto"],
};

let dir, trace;
before(() => {
  dir = join(mkdtempSync(join(tmpdir(), "sat-brief-")), "sat-demo");
  trace = generateSatellite(brief, dir);
});
after(() => { try { rmSync(dirname(dir), { recursive: true, force: true }); } catch {} });

test("AC#1: persiste <dest>/brief.json y deserializa al brief consumido (procedencia intacta)", () => {
  const p = join(dir, "brief.json");
  assert.ok(existsSync(p), "falta <dest>/brief.json");
  const persisted = JSON.parse(readFileSync(p, "utf8"));
  assert.deepEqual(persisted, brief, "el brief persistido debe ser EL consumido, intacto");
  // procedencia + source intactos (incl. la ruta histórica a .satellite-intake/)
  assert.equal(persisted.identity.sector.provenance, "extracted");
  assert.equal(persisted.identity.sector.source, "backup:.satellite-intake/grupoatis.com/wp-content/themes");
  assert.equal(persisted.fields.services.provenance, "proposed");
  assert.equal(trace.brief, "brief.json");
});

test("AC#2: el brief vive en la RAÍZ, FUERA de public/ (Next no lo sirve)", () => {
  assert.ok(existsSync(join(dir, "brief.json")), "brief en la raíz del satélite");
  assert.ok(!existsSync(join(dir, "public", "brief.json")), "NO debe caer en public/");
  assert.ok(!existsSync(join(dir, "public")), "el generador no crea public/ (nada que servir)");
  assert.ok(!existsSync(join(dir, "src", "app", "brief.json")), "tampoco bajo src/app/");
});

test("AC#3: mínimo/honesto — no reescribe ni inventa rutas source", () => {
  const persisted = JSON.parse(readFileSync(join(dir, "brief.json"), "utf8"));
  // la ruta a .satellite-intake/ se preserva TAL CUAL (no se normaliza ni se borra)
  assert.match(persisted.identity.sector.source, /\.satellite-intake\//);
});
