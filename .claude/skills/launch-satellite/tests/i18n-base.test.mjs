// ECO-58: base i18n (nivel 1) — localización mono-idioma + chrome externalizado a UNA fuente keyed por
// idioma. <html lang> = idioma REAL del brief; el chrome usa su catálogo o el fallback (en). NO traduce el
// CONTENIDO del cliente (§D4). Retrocompatible: language=es sale idéntico a hoy. Sin red.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { generateSatellite } from "../scripts/generate-satellite.mjs";
import { chrome, chromeLang, CHROME_LANGS, FALLBACK_LANG } from "../scripts/lib/i18n.mjs";
import { SCHEMA_VERSION, field } from "../scripts/lib/brief.mjs";

const briefFor = (lang) => ({
  schemaVersion: SCHEMA_VERSION, intakeMode: "a-no-design",
  identity: { name: field("Acme Co", "provided"), sector: field("x", "provided"), language: field(lang, "provided") },
  fields: { services: field(["Corte de pelo", "Tinte"], "provided"), slogan: field("Slogan", "provided") },
  targetRoutes: ["/", "/servicios", "/contacto"],
});
function gen(lang) {
  const dir = join(mkdtempSync(join(tmpdir(), "sat-i18n-")), "d");
  const trace = generateSatellite(briefFor(lang), dir);
  const read = (p) => readFileSync(join(dir, p), "utf8");
  return { dir, trace, layout: read("src/app/layout.tsx"), home: read("src/app/page.tsx"),
    serv: read("src/app/servicios/page.tsx"), cleanup: () => { try { rmSync(dirname(dir), { recursive: true, force: true }); } catch {} } };
}

test("lib i18n: catálogos es+en, fallback=en, normalización de código", () => {
  assert.deepEqual([...CHROME_LANGS], ["es", "en"]);
  assert.equal(FALLBACK_LANG, "en");
  assert.equal(chromeLang("es"), "es");
  assert.equal(chromeLang("es-ES"), "es");
  assert.equal(chromeLang("EN"), "en");
  assert.equal(chromeLang("fr"), "en", "sin catálogo → fallback en");
  assert.equal(chromeLang(undefined), "en");
  assert.equal(chrome("es").ctaContact, "Contacto");
  assert.equal(chrome("en").ctaContact, "Contact");
  assert.equal(chrome("es").servicesHomeTitle("X"), "Lo que ofrece X");
});

test("(retrocompat) language=es: <html lang=es> + chrome VERBATIM como hoy", () => {
  const g = gen("es");
  try {
    assert.equal(g.trace.language, "es");
    assert.match(g.layout, /<html lang="es">/);
    assert.match(g.layout, /aria-label="Principal"/);
    assert.match(g.home, /eyebrow="Servicios"/);
    assert.match(g.home, /ctaText="Contacto"/);
    assert.match(g.home, /title=\{"Lo que ofrece Acme Co"\}/);
    assert.match(g.home, /viewAllText="Ver todos los servicios"/);
    assert.match(g.serv, /\\"name\\":\\"Inicio\\"/, "breadcrumb home label en ES");
  } finally { g.cleanup(); }
});

test("language=en: <html lang=en> + chrome en INGLÉS", () => {
  const g = gen("en");
  try {
    assert.equal(g.trace.language, "en");
    assert.match(g.layout, /<html lang="en">/);
    assert.match(g.layout, /aria-label="Main"/);
    assert.match(g.home, /eyebrow="Services"/);
    assert.match(g.home, /ctaText="Contact"/);
    assert.match(g.home, /title=\{"What Acme Co offers"\}/);
    assert.match(g.home, /viewAllText="View all services"/);
    assert.match(g.serv, /\\"name\\":\\"Home\\"/, "breadcrumb home label en EN");
    assert.doesNotMatch(g.home, /eyebrow="Servicios"|ctaText="Contacto"/, "nada de chrome ES en un satélite EN");
  } finally { g.cleanup(); }
});

test("language=fr (sin catálogo): <html lang=fr> REAL + chrome cae al fallback (en)", () => {
  const g = gen("fr");
  try {
    assert.equal(g.trace.language, "fr");
    assert.match(g.layout, /<html lang="fr">/, "lang SIEMPRE refleja el idioma real (SEO/a11y), no el fallback");
    assert.match(g.layout, /aria-label="Main"/, "chrome al fallback inglés");
    assert.match(g.home, /eyebrow="Services"/);
  } finally { g.cleanup(); }
});

test("guardrail §D4: el CONTENIDO del cliente NUNCA se auto-traduce (solo el chrome)", () => {
  const g = gen("en"); // brief en español ("Corte de pelo") pero language=en
  try {
    assert.match(g.home, /Corte de pelo/, "los servicios del cliente salen TAL CUAL del brief");
    assert.doesNotMatch(g.home, /Haircut|Hair cut/, "no se traduce el contenido del cliente");
  } finally { g.cleanup(); }
});
