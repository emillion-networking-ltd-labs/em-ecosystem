import { test } from "node:test";
import assert from "node:assert/strict";
import { instagramIntake } from "../scripts/instagram-intake.mjs";
import { validateBrief, field, SCHEMA_VERSION } from "../scripts/lib/brief.mjs";

// AC#4: el scrape es best-effort; ante fallo/ausencia se DEGRADA a preguntar y NO fabrica datos.
test("AC#4: sin scraper y sin datos del cliente => todo 'missing' + asks (degrada a preguntar)", async () => {
  const { fields, asks } = await instagramIntake({ handle: "cuenta_cliente" });
  for (const k of ["ig_name", "ig_bio", "ig_followers", "ig_photos"]) {
    assert.equal(fields[k].provenance, "missing", `${k} debería ser missing`);
    assert.ok(!("value" in fields[k]), `${k} no debe llevar valor fabricado`);
  }
  assert.ok(asks.length >= 4, "debe pedir los datos que no tiene");
});

test("AC#4: scraper que FALLA no rompe ni inventa", async () => {
  const scraper = async () => { throw new Error("IG bloqueó / red caída"); };
  const { fields } = await instagramIntake({ handle: "cuenta_cliente", scraper });
  assert.equal(fields.ig_followers.provenance, "missing");
  assert.ok(!("value" in fields.ig_followers));
});

test("vía primaria: lo aportado por el cliente es 'provided'", async () => {
  const clientProvided = { bio: "Coach de negocios", followers: "12000" };
  const { fields } = await instagramIntake({ handle: "cuenta_cliente", clientProvided });
  assert.equal(fields.ig_bio.provenance, "provided");
  assert.equal(fields.ig_bio.value, "Coach de negocios");
  assert.equal(fields.ig_followers.provenance, "provided");
});

test("scrape best-effort exitoso => 'proposed' (pendiente de confirmar), NO 'provided'", async () => {
  const scraper = async () => ({ bio: "scraped bio", followers: "9999" });
  const { fields, asks } = await instagramIntake({ handle: "cuenta_cliente", scraper });
  assert.equal(fields.ig_bio.provenance, "proposed");
  assert.equal(fields.ig_followers.provenance, "proposed");
  assert.ok(asks.some((a) => /confirmar/.test(a)));
});

test("el fragmento de IG encaja en un brief válido", async () => {
  const { fields } = await instagramIntake({ handle: "cuenta_cliente", clientProvided: { bio: "x" } });
  const brief = {
    schemaVersion: SCHEMA_VERSION,
    intakeMode: "d-instagram",
    identity: {
      name: field("Marca Personal", "provided"),
      sector: field("coaching", "provided"),
      language: field("es", "provided"),
    },
    fields,
  };
  const { ok, problems } = validateBrief(brief);
  assert.equal(ok, true, problems.join("; "));
});
