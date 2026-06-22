// F4 Batch 2 (ECO-55): el generador compone las secciones nuevas CUANDO hay datos y las OMITE cuando faltan.
// Guardrail §D4 CRÍTICO: jamás inventar testimonios/precios. Sin red.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { generateSatellite } from "../scripts/generate-satellite.mjs";
import { SCHEMA_VERSION, field } from "../scripts/lib/brief.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "../../../..");
const EM_UI = join(REPO_ROOT, "design-system", "registry", "cli.mjs");

const base = (fields) => ({
  schemaVersion: SCHEMA_VERSION, intakeMode: "b-with-brand",
  identity: { name: field("Estudio Vértice", "provided"), sector: field("arquitectura", "provided"), language: field("es", "provided") },
  fields,
  targetRoutes: ["/", "/servicios", "/precios", "/portfolio", "/contacto"],
});

const richFields = {
  services: field(["Proyecto", "Reforma"], "provided"),
  testimonials: field([{ name: "Marta R.", quote: "Transformaron nuestra casa.", result: "Reforma" }], "provided"),
  pricing: field([{ name: "Integral", price: "Desde 6.000€", highlighted: true, features: ["Proyecto", "Obra"], cta: "Reservar" }], "provided"),
  portfolio: field([{ title: "Casa Olivar", description: "Unifamiliar" }], "provided"),
  faqs: field([{ question: "¿Dirección de obra?", answer: "Sí." }], "provided"),
};

function gen(fields) {
  const dir = join(mkdtempSync(join(tmpdir(), "sat-b2-")), "d");
  const trace = generateSatellite(base(fields), dir);
  const read = (p) => readFileSync(join(dir, p), "utf8");
  return { dir, trace, read, cleanup: () => { try { rmSync(dirname(dir), { recursive: true, force: true }); } catch {} } };
}

const NEW = ["Testimonials", "Pricing", "Portfolio", "FAQ"];

test("(a) CON datos: las 4 secciones se añaden (via em-ui, sin drift) y se componen con su contenido real", () => {
  const g = gen(richFields);
  try {
    const home = g.read("src/app/page.tsx");
    for (const s of NEW) {
      assert.ok(existsSync(join(g.dir, "src/components/sections", `${s}.tsx`)), `falta la sección ${s}`);
      const out = execFileSync("node", [EM_UI, "diff", s, "--target", join(g.dir, "src/components/sections", `${s}.tsx`)], { cwd: REPO_ROOT, encoding: "utf8" });
      assert.match(out, /SIN DRIFT/, `${s} debe ser idéntico a la fuente`);
      assert.ok(home.includes(`<${s} `), `home debe componer <${s}>`);
      assert.ok(g.trace.sections.includes(s), `trace.sections debe incluir ${s}`);
    }
    // contenido REAL presente (no inventado)
    assert.match(home, /Marta R\./); assert.match(home, /Desde 6\.000€/);
    assert.match(home, /Casa Olivar/); assert.match(home, /Dirección de obra/);
  } finally { g.cleanup(); }
});

test("(b) SIN datos: las 4 secciones se OMITEN limpio (ni se añaden ni se componen ni se inventan)", () => {
  const g = gen({ services: field(["Proyecto"], "provided") });   // solo servicios; nada de testimonios/precios/portfolio/faq
  try {
    const home = g.read("src/app/page.tsx");
    for (const s of NEW) {
      assert.ok(!existsSync(join(g.dir, "src/components/sections", `${s}.tsx`)), `${s} NO debe añadirse sin datos`);
      assert.ok(!home.includes(`<${s} `), `home NO debe componer <${s}> sin datos`);
      assert.ok(!g.trace.sections.includes(s), `trace.sections NO debe incluir ${s}`);
    }
    assert.doesNotMatch(home, /\[FALTA|\[PENDIENTE/, "no rinde placeholders feos");
  } finally { g.cleanup(); }
});

test("GUARDRAIL §D4: sin testimonios reales NO hay sección Testimonials; sin precios NO hay Pricing (nunca fabricar)", () => {
  const g = gen({ testimonials: field(null, "missing"), pricing: field(null, "missing") });
  try {
    assert.ok(!g.trace.sections.includes("Testimonials"), "Testimonials omitida sin datos");
    assert.ok(!g.trace.sections.includes("Pricing"), "Pricing omitida sin datos");
    const home = g.read("src/app/page.tsx");
    assert.ok(!home.includes("<Testimonials") && !home.includes("<Pricing"), "no se compone lo que no hay");
    // ni rastro de testimonios/precios inventados (heurística: comillas de cita o símbolo €)
    assert.doesNotMatch(home, /€/, "no debe fabricar precios");
  } finally { g.cleanup(); }
});
