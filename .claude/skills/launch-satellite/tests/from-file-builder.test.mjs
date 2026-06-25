// FB0/FB1 (ECO-63 / ADR-012): builder DESDE-ARCHIVO — adapter de fuente → IR común LOSSLESS → gate de
// completitud. Tests sobre un fixture WP sintético commiteado (el dump real de Atis está gitignored → se prueba
// local; aquí, un mini-backup determinista). Verifica: captura lossless, escaping SQL, genericidad (cero
// supuestos WP fuera del adapter), y que el gate FALLA si se pierde algo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseValues, streamDump } from "../scripts/builders/capture/sqldump.mjs";
import { validateIR, irStats, IR_VERSION } from "../scripts/builders/model/ir.mjs";
import { losslessReport, assertLossless } from "../scripts/builders/capture/capture-gate.mjs";
import { isAdapter, makeRegistry } from "../scripts/builders/capture/adapter.mjs";
import { wordpressAdapter } from "../scripts/builders/capture/adapters/wordpress.mjs";
import { captureFromFile, REGISTRY } from "../scripts/builders/from-file.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const DB_SQL = readFileSync(join(HERE, "fixtures", "wp-backup", "db.sql"), "utf8");   // commiteado (texto)

// Ensambla un backup WP completo en un tmp dir: el db.sql commiteado + las imágenes de uploads (las imágenes no
// se commitean — `.gitignore` ignora `uploads/`; se generan en el test). Devuelve { dir, cleanup }.
function makeBackup() {
  const dir = mkdtempSync(join(tmpdir(), "wp-backup-"));
  const up = join(dir, "public_html", "wp-content", "uploads", "2024");
  const core = join(dir, "public_html", "wp-includes", "images");
  mkdirSync(up, { recursive: true }); mkdirSync(core, { recursive: true });
  writeFileSync(join(dir, "db.sql"), DB_SQL);
  writeFileSync(join(up, "hero.jpg"), "JPG");            // original real
  writeFileSync(join(up, "team.png"), "PNG");            // original real
  writeFileSync(join(up, "hero-150x150.jpg"), "THUMB");  // derivado → excluido
  writeFileSync(join(core, "wlw.png"), "CORE");          // ruido wp-core → excluido
  return { dir, cleanup: () => { try { rmSync(dir, { recursive: true, force: true }); } catch {} } };
}

test("sqldump: parseValues respeta strings, escaping (apóstrofo) y separadores dentro de valores", () => {
  const rows = parseValues("(1,'a','x'),(2,'b\\'c','y;,z'),(3,NULL,'q')");
  assert.equal(rows.length, 3);
  assert.deepEqual(rows[0], ["1", "a", "x"]);
  assert.deepEqual(rows[1], ["2", "b'c", "y;,z"]);      // \' → ' ; ';' y ',' DENTRO del string se preservan
  assert.deepEqual(rows[2], ["3", null, "q"]);          // NULL → null
});

test("sqldump: streamDump lee tablas + orden de columnas del fixture", async () => {
  let posts = 0, opts = 0;
  const dbPath = join(HERE, "fixtures", "wp-backup", "db.sql");
  const stat = await streamDump(dbPath, ["wp_posts", "wp_options"], (t) => { if (t === "wp_posts") posts++; else opts++; });
  assert.equal(posts, 3);
  assert.ok(opts >= 6);
  assert.ok(stat.columns.wp_posts.includes("post_status") && stat.columns.wp_posts.includes("post_content"));
});

test("adapter WordPress: captura LOSSLESS el fixture → IR correcto", async () => {
  const bk = makeBackup();
  try {
  const ir = await wordpressAdapter.capture(bk.dir);
  assert.equal(ir.irVersion, IR_VERSION);
  assert.equal(ir.source.kind, "wordpress");
  assert.equal(ir.site.name, "Fixture Co");
  assert.equal(ir.site.language, "es", "idioma real capturado (i18n)");
  // páginas: 3, front '/' = Home
  assert.equal(ir.pages.length, 3);
  const home = ir.pages.find((p) => p.route === "/");
  assert.ok(home && home.title === "Home", "front page detectada por page_on_front");
  // bloques Elementor del home: heading + image + text-editor
  const kinds = home.blocks.map((b) => b.kind);
  assert.ok(kinds.includes("heading") && kinds.includes("image") && kinds.includes("text-editor"));
  assert.ok(home.blocks.some((b) => b.text === "Welcome to Fixture Co"), "copy del heading VERBATIM");
  // copy difícil (apóstrofo + ';' + ',') preservado tal cual
  assert.ok(home.blocks.some((b) => b.text && b.text.includes("We don't quit") && b.text.includes("semicolons; and commas, kept")), "copy verbatim con escaping correcto");
  // raw preservado en cada bloque (garantía lossless)
  assert.ok(home.blocks.every((b) => b.raw), "cada bloque preserva su raw (lossless)");
  // media: solo originales reales (hero.jpg, team.png); miniatura y wp-core EXCLUIDAS
  const ids = ir.media.map((m) => m.id).sort();
  assert.deepEqual(ids, ["hero.jpg", "team.png"]);
  assert.ok(!ir.media.some((m) => /150x150|wlw/.test(m.id)), "miniaturas/core excluidos");
  const hero = ir.media.find((m) => m.id === "hero.jpg");
  assert.ok(hero.usedBy.includes(home.id), "media referenciada marca usedBy");
  // estructura válida + sin pérdida
  assert.deepEqual(validateIR(ir), []);
  assert.equal(losslessReport(ir).ok, true);
  } finally { bk.cleanup(); }
});

test("SEO por-página GENÉRICO: AIOSEO (Home) + Yoast (About) capturados; sin plugin → null", async () => {
  const bk = makeBackup();
  try {
    const ir = await wordpressAdapter.capture(bk.dir);
    const home = ir.pages.find((p) => p.route === "/");
    const about = ir.pages.find((p) => p.slug === "about");
    const news = ir.pages.find((p) => p.type === "post");
    // Home: SEO custom de AIOSEO (tabla)
    assert.equal(home.seo.source, "aioseo");
    assert.equal(home.seo.title, "Custom Home SEO Title");
    assert.match(home.seo.description, /Custom home meta description/);
    // About: SEO custom de Yoast (postmeta) — genericidad: otro plugin, mismo IR
    assert.equal(about.seo.source, "yoast");
    assert.equal(about.seo.title, "About Page — Yoast Title");
    assert.match(about.seo.description, /Yoast about meta description/);
    // News (post sin plugin de SEO) → null (no se inventa)
    assert.equal(news.seo, null);
  } finally { bk.cleanup(); }
});

test("gate SEO: la fuente declara 2 páginas con SEO; si el IR pierde una → FALLA (sub-campo caído)", async () => {
  const bk = makeBackup();
  try {
    const ir = await wordpressAdapter.capture(bk.dir);
    assert.equal(ir.coverage.subfields.seo.source, 2, "la fuente tiene SEO en 2 páginas");
    assert.equal(losslessReport(ir).ok, true, "captura completa → pasa");
    ir.pages.find((p) => p.seo).seo = null;   // simular SEO caído en una página que lo tenía
    const r = losslessReport(ir);
    assert.equal(r.ok, false);
    assert.ok(r.problems.some((p) => /sub-campo seo/.test(p) && /CAYÓ/.test(p)), "el gate caza el SEO caído");
  } finally { bk.cleanup(); }
});

test("gate de COMPLETITUD: FALLA si el IR pierde algo que la fuente tenía", async () => {
  const bk = makeBackup();
  try {
    const ir = await wordpressAdapter.capture(bk.dir);
    // simular pérdida silenciosa: la fuente tenía 1 página más de la capturada
    ir.coverage.source.pages = ir.pages.length + 1;
    const r = losslessReport(ir);
    assert.equal(r.ok, false);
    assert.ok(r.problems.some((p) => /PÉRDIDA/.test(p)));
    assert.throws(() => assertLossless(ir), /gate lossless de CAPTURA FALLÓ/);
  } finally { bk.cleanup(); }
});

test("from-file: detecta la fuente y captura; dir sin backup → NO_ADAPTER", async () => {
  const bk = makeBackup();
  try {
    const { adapter, ir } = await captureFromFile(bk.dir);
    assert.equal(adapter, "wordpress");
    assert.ok(irStats(ir).pages === 3);
    assert.ok(isAdapter(wordpressAdapter) && REGISTRY.detect(bk.dir) === wordpressAdapter);
  } finally { bk.cleanup(); }
  const empty = mkdtempSync(join(tmpdir(), "no-backup-"));
  try { await assert.rejects(() => captureFromFile(empty), (e) => e.code === "NO_ADAPTER"); }
  finally { rmSync(empty, { recursive: true, force: true }); }
});

test("GENERICIDAD (requisito duro): motor genérico sin conocimiento de fuente NI de em-ui (model/ + capture/)", () => {
  const root = join(HERE, "..", "scripts", "builders");
  const walk = (d) => { let e; try { e = readdirSync(d, { withFileTypes: true }); } catch { return []; }
    return e.flatMap((x) => { const p = join(d, x.name); return x.isDirectory() ? walk(p) : (x.name.endsWith(".mjs") ? [p] : []); }); };
  const rel = (p) => p.substring(root.length + 1).replace(/\\/g, "/");
  const modelCapture = [...walk(join(root, "model")), ...walk(join(root, "capture"))];
  assert.ok(modelCapture.length >= 5, "el escáner debe ver model/ + capture/ (no apuntar a un dir vacío)");

  // (a) El NÚCLEO (model/ + capture/ SIN los adapters) no conoce ninguna fuente concreta: cero WordPress/Elementor.
  // TODO ese conocimiento vive SOLO en capture/adapters/. Añadir otra fuente = otro adapter, sin tocar el núcleo.
  for (const f of modelCapture.filter((p) => !/[/\\]adapters[/\\]/.test(p))) {
    const src = readFileSync(f, "utf8");
    assert.ok(!/wordpress|elementor|wp_[a-z]+|wp-content/i.test(src), `${rel(f)} no debe tener conocimiento de WordPress (vive en capture/adapters/)`);
  }

  // (b) El MOTOR GENÉRICO entero (model/ + capture/, INCLUIDOS los adapters) NO importa em-ui / design-system:
  // captura y modelo son AGNÓSTICOS de producto; el binding em-ui es del lado de emisión (G2), nunca aquí (ADR-015 §6).
  for (const f of modelCapture) {
    const src = readFileSync(f, "utf8");
    assert.ok(!/(?:from|import)\s+["'][^"']*(?:em-ui|design-system|registry)[^"']*["']/i.test(src),
      `${rel(f)} no debe importar em-ui/design-system (motor genérico vs binding de producto)`);
  }

  // El registro es genérico: añadir otra fuente = otro adapter (mismo IR), sin tocar el núcleo.
  const reg = makeRegistry([wordpressAdapter]);
  assert.equal(reg.byKind("wordpress"), wordpressAdapter);
  const empty = mkdtempSync(join(tmpdir(), "no-src-"));
  try { assert.equal(reg.detect(empty), null); } finally { rmSync(empty, { recursive: true, force: true }); }
});
