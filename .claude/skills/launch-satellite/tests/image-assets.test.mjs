// F7a (ECO-61, pilar P5 / ADR-011): USAR LOS ASSETS REALES del cliente. Ingerir (copiar) los ficheros reales
// a public/images/ del satélite y renderizarlos on-screen con next/image. SOLO reales (provided/extracted);
// sin asset → se OMITE con gracia (jamás placeholder ni inventar). La generación decorativa es F7b. Sin red.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { generateSatellite } from "../scripts/generate-satellite.mjs";
import { SCHEMA_VERSION, field } from "../scripts/lib/brief.mjs";

// PNG real mínimo (1x1) para que la ingestión copie un fichero de verdad.
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

function withAssets() {
  const root = mkdtempSync(join(tmpdir(), "sat-f7a-"));
  const assets = join(root, "intake");
  mkdirSync(assets, { recursive: true });
  for (const n of ["logo.png", "hero.png", "g1.png", "g2.png", "svc.png"]) writeFileSync(join(assets, n), PNG);
  const dest = join(root, "sat");
  const brief = {
    schemaVersion: SCHEMA_VERSION, intakeMode: "c-improve-site",
    identity: { name: field("Grupo Demo", "provided"), sector: field("logística", "provided"), language: field("es", "provided") },
    fields: {
      slogan: field("Tu carga, nuestra prioridad", "extracted", "url"),
      logo: field(join(assets, "logo.png"), "extracted", "intake"),
      heroImage: field(join(assets, "hero.png"), "extracted", "intake"),
      services: field([
        { title: "Air Cargo", description: "Carga aérea", image: join(assets, "svc.png") },
        { title: "Sea Freight", description: "Carga marítima" },
      ], "extracted", "url"),
      gallery: field([join(assets, "g1.png"), join(assets, "g2.png")], "extracted", "intake"),
    },
    targetRoutes: ["/", "/services", "/contact"],
  };
  const trace = generateSatellite(brief, dest);
  const read = (p) => readFileSync(join(dest, p), "utf8");
  return { dest, trace, read, cleanup: () => { try { rmSync(root, { recursive: true, force: true }); } catch {} } };
}

test("ingestión: copia los assets REALES del cliente a public/images/", () => {
  const g = withAssets();
  try {
    assert.ok(existsSync(join(g.dest, "public/images/logo.png")), "logo copiado");
    assert.ok(existsSync(join(g.dest, "public/images/hero.png")), "hero copiado");
    assert.ok(existsSync(join(g.dest, "public/images/gallery-1.png")) && existsSync(join(g.dest, "public/images/gallery-2.png")), "galería copiada");
    assert.ok(existsSync(join(g.dest, "public/images/service-1.png")), "imagen de servicio copiada");
    assert.ok((g.trace.assets || []).includes("/images/logo.png"), "trace.assets registra la ingestión");
  } finally { g.cleanup(); }
});

test("logo EN PANTALLA: header con next/image + firma 'Powered by EM Ecosystem'", () => {
  const g = withAssets();
  try {
    const layout = g.read("src/app/layout.tsx");
    assert.match(layout, /import Image from "next\/image"/, "next/image importado");
    assert.match(layout, /<Image src="\/images\/logo\.png"[^>]*fill/, "logo renderizado en el header con next/image fill");
    assert.match(layout, /Powered by <span[^>]*>EM Ecosystem<\/span>/, "firma de marca en el footer");
    // y sigue alimentando OG/JSON-LD con la ruta ingerida
    assert.match(layout, /images: \["\/images\/logo\.png"\]/);
  } finally { g.cleanup(); }
});

test("Hero restaura el visual con la foto real; gallery → Portfolio con next/image", () => {
  const g = withAssets();
  try {
    const home = g.read("src/app/page.tsx");
    assert.match(home, /<Hero[^>]*imageSrc="\/images\/hero\.png"/, "Hero recibe la foto real");
    // la galería entra como items de Portfolio (la sección se compone porque hay fotos reales)
    assert.match(home, /<Portfolio/, "Portfolio compuesto desde la galería real");
    const svc = g.read("src/app/services/page.tsx");
    assert.match(svc, /imageSrc/, "el servicio con foto real la lleva");
  } finally { g.cleanup(); }
});

test("GUARDRAIL: assets proposed/missing/inexistentes NO se ingieren (solo reales)", () => {
  const root = mkdtempSync(join(tmpdir(), "sat-f7a-neg-"));
  const dest = join(root, "sat");
  const brief = {
    schemaVersion: SCHEMA_VERSION, intakeMode: "a-no-design",
    identity: { name: field("Sin Assets SA", "provided"), sector: field("x", "provided"), language: field("es", "provided") },
    fields: {
      slogan: field("Claim", "provided"),
      logo: field("/logo.png", "provided"),                       // path web sin fichero → no ingerible
      heroImage: field("/tmp/no-existe-12345.png", "proposed"),   // proposed → F7b, no ahora
      services: field(["Uno", "Dos"], "provided"),
    },
    targetRoutes: ["/", "/contact"],
  };
  const trace = generateSatellite(brief, dest);
  try {
    assert.ok(!existsSync(join(dest, "public/images")), "sin assets reales → no se crea public/images");
    assert.deepEqual(trace.assets, [], "nada ingerido");
    const layout = readFileSync(join(dest, "src/app/layout.tsx"), "utf8");
    assert.doesNotMatch(layout, /import Image from "next\/image"/, "sin logo real → marca textual, sin next/image");
    assert.match(layout, /text-h3 font-bold/, "marca textual de fallback");
    assert.match(layout, /Powered by/, "la firma del footer no depende de assets");
    const home = readFileSync(join(dest, "src/app/page.tsx"), "utf8");
    assert.doesNotMatch(home, /imageSrc=/, "Hero sin imagen (omit-if-absent), sin placeholder");
  } finally { try { rmSync(root, { recursive: true, force: true }); } catch {} }
});
