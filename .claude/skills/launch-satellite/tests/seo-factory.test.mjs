// F5 (ECO-56): SEO de fábrica — Open Graph + JSON-LD (Organization/LocalBusiness condicional) + meta
// description + breadcrumbs + landmarks. e2e en los DOS sentidos. Guardrail §D4: nunca inventar LocalBusiness.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { generateSatellite } from "../scripts/generate-satellite.mjs";
import { SEO_AUDITS, reportSeoAudits } from "../scripts/lib/lighthouse.mjs";
import { SCHEMA_VERSION, field } from "../scripts/lib/brief.mjs";

const base = (fields) => ({
  schemaVersion: SCHEMA_VERSION, intakeMode: "b-with-brand",
  identity: { name: field("Clínica Aurora", "provided"), sector: field("fisioterapia", "provided"), language: field("es", "provided") },
  fields, targetRoutes: ["/", "/servicios", "/contacto"],
});
function gen(fields) {
  const dir = join(mkdtempSync(join(tmpdir(), "sat-seo-")), "d");
  const trace = generateSatellite(base(fields), dir);
  const read = (p) => readFileSync(join(dir, p), "utf8");
  return { dir, trace, read, cleanup: () => { try { rmSync(dirname(dir), { recursive: true, force: true }); } catch {} } };
}
const WITH_BIZ = {
  slogan: field("Tu recuperación, nuestra prioridad", "provided"),
  contactPhone: field("+34 955 00 00 00", "provided"),
  address: field("Calle Sol 12, Sevilla", "provided"),
  logo: field("https://cdn.example.com/logo.png", "provided"),   // logo remoto real → alimenta OG/JSON-LD (F7a: solo assets resolubles)
  services: field(["Fisioterapia", "Rehabilitación"], "provided"),
};

test("layout: Open Graph + JSON-LD + landmarks (header/nav/footer) generados por construcción", () => {
  const g = gen(WITH_BIZ);
  try {
    const layout = g.read("src/app/layout.tsx");
    assert.match(layout, /openGraph:/, "OG en metadata");
    assert.match(layout, /type: "website"/);
    assert.match(layout, /images: \["https:\/\/cdn\.example\.com\/logo\.png"\]/, "og:image = logo del brief");
    assert.match(layout, /application\/ld\+json/, "script JSON-LD");
    assert.match(layout, /<header/); assert.match(layout, /<nav aria-label="Principal"/); assert.match(layout, /<footer/);
    assert.match(layout, /metadataBase/);
  } finally { g.cleanup(); }
});

test("(a) CON dirección/teléfono: JSON-LD LocalBusiness construido de HECHOS reales", () => {
  const g = gen(WITH_BIZ);
  try {
    assert.equal(g.trace.jsonldType, "LocalBusiness");
    const layout = g.read("src/app/layout.tsx");
    assert.match(layout, /"@type":"LocalBusiness"/);
    assert.match(layout, /"streetAddress":"Calle Sol 12, Sevilla"/, "dirección REAL del brief");
    assert.match(layout, /"telephone":"\+34 955 00 00 00"/, "teléfono REAL del brief");
  } finally { g.cleanup(); }
});

test("(b) SIN dirección: Organization válido, SIN LocalBusiness inventado (guardrail §D4)", () => {
  const g = gen({ services: field(["Fisioterapia"], "provided"), contactEmail: field("hola@aurora.com", "provided") });
  try {
    assert.equal(g.trace.jsonldType, "Organization");
    const layout = g.read("src/app/layout.tsx");
    assert.match(layout, /"@type":"Organization"/);
    assert.doesNotMatch(layout, /LocalBusiness/, "NO debe fabricar un negocio local sin datos");
    assert.doesNotMatch(layout, /PostalAddress|streetAddress/, "NO debe inventar dirección");
  } finally { g.cleanup(); }
});

test("páginas: meta description única + Open Graph + canonical; BreadcrumbList en no-home (no en home)", () => {
  const g = gen(WITH_BIZ);
  try {
    const home = g.read("src/app/page.tsx");
    const serv = g.read("src/app/servicios/page.tsx");
    for (const p of [home, serv]) {
      assert.match(p, /description:/, "meta description por página");
      assert.match(p, /openGraph:/, "OG por página");
      assert.match(p, /alternates: \{ canonical:/, "canonical por página");
    }
    assert.match(home, /description: "Tu recuperación, nuestra prioridad"/, "home usa la tagline del brief");
    assert.match(serv, /BreadcrumbList/, "ruta no-home lleva BreadcrumbList");
    assert.doesNotMatch(home, /BreadcrumbList/, "home no lleva breadcrumb");
  } finally { g.cleanup(); }
});

test("gate F5: reportSeoAudits exige los audits nombrados (falla si alguno = 0; n/a no bloquea)", () => {
  assert.ok(SEO_AUDITS.includes("meta-description") && SEO_AUDITS.includes("canonical") && SEO_AUDITS.includes("link-text"));
  const allPass = Object.fromEntries(SEO_AUDITS.map((id) => [id, 1]));
  assert.equal(reportSeoAudits({ seoAudits: allPass }), true);
  assert.equal(reportSeoAudits({ seoAudits: { ...allPass, "meta-description": 0 } }), false, "un audit en 0 falla el gate");
  assert.equal(reportSeoAudits({ seoAudits: { ...allPass, canonical: null } }), true, "n/a (null) no bloquea");
});
