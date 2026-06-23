// ECO-67 — lanzador /launch-satellite sobre el builder desde-archivo (flujo de 9 pasos). Cubre las piezas que
// permiten la PAUSA de revisión/enriquecimiento ENTRE captura y emisión: sectionsOf (informar secciones, paso 4),
// addSection (enriquecer, paso 4, §D4), detectSources (auto-detectar, paso 2), y la fase de emisión desde un IR
// ENRIQUECIDO (emit-from-ir, paso 6) con los gates de emisión + launch-readiness verdes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { sectionsOf, addSection, irStats, validateIR, IR_VERSION } from "../scripts/builders/lib/ir.mjs";
import { detectSources } from "../scripts/builders/detect-source.mjs";
import { emitFromIRFile } from "../scripts/builders/emit-from-ir.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const DB_SQL = readFileSync(join(HERE, "fixtures", "wp-backup", "db.sql"), "utf8");
// Logo PNG REAL (sharp lo reescala → favicons de verdad, el gate de launch-readiness los exige).
const writeLogo = (file) =>
  sharp({ create: { width: 64, height: 64, channels: 4, background: { r: 0, g: 118, b: 169, alpha: 1 } } }).png().toFile(file);

function tinyIR(logoFile) {
  return {
    irVersion: IR_VERSION, source: { kind: "test" },
    site: { name: "Demo Co", description: "Demo logistics", language: "es", url: "https://demo.test" },
    pages: [
      { id: 2, type: "page", slug: "home", route: "/", title: "Home", parent: null, order: 0,
        seo: { source: "test", title: "Demo Co — Inicio", description: "Demo home SEO" },
        blocks: [{ kind: "heading", text: "Welcome to Demo Co" }, { kind: "text-editor", text: "We move cargo, fast and safe." }] },
      { id: 3, type: "page", slug: "services", route: "/services", title: "Services", parent: null, order: 1, seo: null,
        blocks: [{ kind: "heading", text: "Our Services" }, { kind: "icon-box", text: "Air Cargo\nFast air freight." }] },
    ],
    media: logoFile ? [{ id: "logo.png", file: logoFile, src: null, usedBy: [2] }] : [],
    menus: [], forms: [],
  };
}

// --- paso 4: sectionsOf (informar lo que el sitio tiene) ---
test("sectionsOf: agrupa por heading igual que el emitter; reporta heading/bloques/palabras/imagen", () => {
  const pages = sectionsOf(tinyIR(null));
  assert.equal(pages.length, 2);
  const home = pages.find((p) => p.route === "/");
  assert.equal(home.sections.length, 1, "home: heading + text-editor = una sección");
  assert.equal(home.sections[0].heading, "Welcome to Demo Co");
  assert.equal(home.sections[0].blocks, 2);
  assert.ok(home.sections[0].words >= 6);
  const svc = pages.find((p) => p.route === "/services");
  assert.equal(svc.sections[0].heading, "Our Services");
});

// --- paso 4: addSection (enriquecer con contenido REAL aportado, §D4) ---
test("addSection: añade una sección aportada (heading + párrafos), sube el conteo del IR y la marca como provided", () => {
  const ir = tinyIR(null);
  const before = irStats(ir);
  addSection(ir, { route: "/", heading: "Testimonios", paragraphs: ["Gran servicio puntual. — Cliente real."] });
  const after = irStats(ir);
  assert.equal(after.blocks, before.blocks + 2, "heading + text-editor");
  assert.ok(after.words > before.words, "las palabras reales del cliente suben el conteo");
  const home = ir.pages.find((p) => p.route === "/");
  const added = home.blocks.slice(-2);
  assert.equal(added[0].kind, "heading");
  assert.equal(added[0].raw.provenance, "provided");
  assert.equal(added[1].kind, "text-editor");
  assert.match(added[1].text, /Cliente real/);
});

test("addSection: §D4 — RECHAZA secciones vacías (sin heading o sin contenido) y rutas inexistentes", () => {
  assert.throws(() => addSection(tinyIR(null), { route: "/", heading: "", paragraphs: ["x"] }), /heading/);
  assert.throws(() => addSection(tinyIR(null), { route: "/", heading: "X" }), /contenido/);
  assert.throws(() => addSection(tinyIR(null), { route: "/", heading: "X", paragraphs: ["  ", ""] }), /contenido/);
  assert.throws(() => addSection(tinyIR(null), { route: "/no-existe", heading: "X", paragraphs: ["y"] }), /no existe página/);
});

test("addSection: inserta en index y acepta bloques extra (imagen/lista) ya en forma IR", () => {
  const ir = tinyIR(null);
  addSection(ir, { route: "/", heading: "Intro", paragraphs: ["Primera."], index: 0, blocks: [{ kind: "icon-list", text: "Uno\nDos" }] });
  const home = ir.pages.find((p) => p.route === "/");
  assert.equal(home.blocks[0].kind, "heading");
  assert.equal(home.blocks[0].text, "Intro");
  assert.ok(home.blocks.some((b) => b.kind === "icon-list" && b.raw.added));
});

// --- paso 2: detectSources (auto-detectar backups en el intake) ---
test("detectSources: reconoce un backup WP como subdirectorio del intake; null para lo no reconocido; [] si no existe", () => {
  const intake = mkdtempSync(join(tmpdir(), "intake-"));
  try {
    // un cliente con backup WP + una carpeta de ruido (no reconocida)
    const wp = join(intake, "grupox.com", "public_html", "wp-content", "uploads", "2024");
    mkdirSync(wp, { recursive: true });
    writeFileSync(join(intake, "grupox.com", "db.sql"), DB_SQL);
    writeFileSync(join(wp, "hero.jpg"), "JPG");
    mkdirSync(join(intake, "notas"), { recursive: true });

    const found = detectSources(intake);
    const wpHit = found.find((f) => f.name === "grupox.com");
    assert.ok(wpHit && wpHit.adapter === "wordpress", "el subdir con backup WP → adapter wordpress");
    const noise = found.find((f) => f.name === "notas");
    assert.equal(noise.adapter, null, "carpeta de ruido → no reconocida");

    assert.deepEqual(detectSources(join(intake, "no-existe")), []);
  } finally { rmSync(intake, { recursive: true, force: true }); }
});

// --- paso 6: emisión desde un IR ENRIQUECIDO (emit-from-ir) con gates verdes ---
test("emitFromIRFile: IR enriquecido (sección aportada) → emite + gate de EMISIÓN + LAUNCH-READINESS verdes; el copy añadido NO se cae", async () => {
  const root = mkdtempSync(join(tmpdir(), "emit-ir-"));
  try {
    const logo = join(root, "logo.png");
    await writeLogo(logo);
    const ir = tinyIR(logo);
    // paso 4: enriquecer con una sección de contenido REAL antes de emitir
    addSection(ir, { route: "/", heading: "Por qué nosotros", paragraphs: ["Veinte años moviendo carga sensible sin un solo retraso reportado."] });
    assert.deepEqual(validateIR(ir), [], "IR enriquecido sigue siendo estructuralmente válido");

    const irPath = join(root, "ir.json");
    writeFileSync(irPath, JSON.stringify(ir, null, 2));
    const dest = join(root, "sat");
    const r = await emitFromIRFile(irPath, dest, { brand: "#0076a9", colorMode: "light" });

    assert.equal(r.emit.ok, true, "emisión lossless: " + r.emit.problems.join("; "));
    assert.equal(r.launch.ok, true, "launch-readiness: " + r.launch.problems.join("; "));
    // el copy de la sección añadida llegó al sitio (no se cae)
    const home = readFileSync(join(dest, "src/app/page.tsx"), "utf8");
    assert.match(home, /Por qué nosotros/);
    assert.match(home, /Veinte años moviendo carga/);
    // cero artefactos de render (el check de contenido de ECO-65 sigue verde)
    assert.doesNotMatch(home, /\{"undefined"\}|\{"null"\}|\[object Object\]/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("emitFromIRFile: IR inválido → lanza BAD_IR (no emite basura)", async () => {
  const root = mkdtempSync(join(tmpdir(), "emit-ir-bad-"));
  try {
    const irPath = join(root, "ir.json");
    writeFileSync(irPath, JSON.stringify({ irVersion: "9.9.9", site: {}, pages: "nope", media: [] }));
    await assert.rejects(() => emitFromIRFile(irPath, join(root, "sat")), /IR inválido/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
