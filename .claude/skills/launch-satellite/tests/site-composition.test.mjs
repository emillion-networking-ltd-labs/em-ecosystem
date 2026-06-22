// F6 (ECO-57): tipo de sitio + composición que la IA PROPONE y el cliente confirma + válvula "la IA
// recomienda". El generador honra la composición elegida pero OMITE secciones sin datos (§D4). Sin red.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { generateSatellite } from "../scripts/generate-satellite.mjs";
import { SITE_TYPES, briefSiteType, briefComposition, validateBrief, SCHEMA_VERSION, field } from "../scripts/lib/brief.mjs";

const base = (extra) => ({
  schemaVersion: SCHEMA_VERSION, intakeMode: "a-no-design",
  identity: { name: field("Studio Lux", "provided"), sector: field("foto", "provided"), language: field("es", "provided") },
  fields: {
    services: field(["Bodas", "Retrato"], "provided"),
    testimonials: field([{ name: "Ana", quote: "Geniales" }], "provided"),
    portfolio: field([{ title: "Boda A" }], "provided"),
  },
  targetRoutes: ["/"], ...extra,
});
function gen(extra) {
  const dir = join(mkdtempSync(join(tmpdir(), "sat-f6-")), "d");
  const trace = generateSatellite(base(extra), dir);
  const home = readFileSync(join(dir, "src/app/page.tsx"), "utf8");
  const order = [...home.matchAll(/<(Hero|Services|Testimonials|Pricing|Portfolio|FAQ|Contact|CTA)\b/g)].map((m) => m[1]);
  return { dir, trace, home, order, cleanup: () => { try { rmSync(dirname(dir), { recursive: true, force: true }); } catch {} } };
}

test("lib: SITE_TYPES, briefSiteType, briefComposition + validación", () => {
  assert.deepEqual([...SITE_TYPES], ["business-multipage", "landing", "portfolio", "other"]);
  assert.equal(briefSiteType({ siteType: { value: "landing", provenance: "provided" } }), "landing");
  assert.equal(briefSiteType({}), null);
  assert.ok(briefComposition({ composition: { value: [{ section: "Hero" }], provenance: "provided" } }));
  assert.equal(briefComposition({}), null);
  const bad = validateBrief({ ...base(), siteType: { value: "nope", provenance: "provided" } });
  assert.ok(bad.problems.some((p) => p.includes("siteType.value")));
});

test("(a) siteType 'landing': compone el orden landing (sin Portfolio aunque haya datos)", () => {
  const g = gen({ siteType: { value: "landing", provenance: "provided" } });
  try {
    assert.equal(g.trace.compositionSource, "type:landing");
    assert.deepEqual(g.order, ["Hero", "Services", "Testimonials", "CTA"]); // landing: sin Portfolio; Pricing/FAQ omitidos (sin datos)
    assert.ok(!g.order.includes("Portfolio"), "landing no lleva Portfolio aunque haya datos");
  } finally { g.cleanup(); }
});

test("(b) composición EXPLÍCITA honrada: orden + variante propios", () => {
  const g = gen({ composition: { value: [{ section: "Hero" }, { section: "Portfolio", variant: "grid" }, { section: "Services" }, { section: "CTA", variant: "brand" }], provenance: "provided" } });
  try {
    assert.equal(g.trace.compositionSource, "brief");
    assert.deepEqual(g.order, ["Hero", "Portfolio", "Services", "CTA"]);
    assert.match(g.home, /<Portfolio[^>]*variant="grid"/, "variante elegida respetada");
    assert.match(g.home, /<CTA variant="brand"/, "variante CTA respetada");
  } finally { g.cleanup(); }
});

test("(c) GUARDRAIL §D4: una sección pedida en la composición SIN datos se OMITE (no se inventa)", () => {
  // composición pide Pricing y FAQ, pero el brief no trae precios ni faqs → se omiten
  const g = gen({ composition: { value: [{ section: "Hero" }, { section: "Pricing" }, { section: "FAQ" }, { section: "CTA" }], provenance: "provided" } });
  try {
    assert.deepEqual(g.order, ["Hero", "CTA"], "Pricing y FAQ omitidas: no hay datos reales");
    assert.doesNotMatch(g.home, /<Pricing|<FAQ/, "no se compone lo que no hay");
    assert.doesNotMatch(g.home, /€/, "no se fabrican precios");
  } finally { g.cleanup(); }
});

test("(válvula) siteType 'portfolio': composición sensata Portfolio-forward, sin inventar", () => {
  const g = gen({ siteType: { value: "portfolio", provenance: "provided" } });
  try {
    assert.equal(g.trace.compositionSource, "type:portfolio");
    assert.equal(g.order[0], "Hero");
    assert.equal(g.order[1], "Portfolio", "portfolio va por delante");
    assert.ok(g.order.includes("CTA"));
  } finally { g.cleanup(); }
});

test("(back-compat) brief SIN siteType/composition → orden por defecto, como antes", () => {
  const g = gen({});
  try {
    assert.equal(g.trace.compositionSource, "default");
    // default: Hero, Services, Portfolio, Testimonials, (Pricing/FAQ omitidos sin datos), CTA
    assert.deepEqual(g.order, ["Hero", "Services", "Portfolio", "Testimonials", "CTA"]);
  } finally { g.cleanup(); }
});
