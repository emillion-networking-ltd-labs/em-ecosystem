// FB2 (ECO-66 / ADR-012): EMITTER del builder (IR → satélite Next ENRIQUECIDO) + gate de EMISIÓN lossless.
// Unit: renderBlock/renderMain (puro, sin red). Integración: emitFromIR sobre un IR mínimo (corre em-ui) →
// páginas/layout/media + verifyEmit. Cierra el ciclo: captura (FB1) + emisión (FB2) = nada se cae punta a punta.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderBlock, renderMain } from "../scripts/builders/lib/emit-blocks.mjs";
import { verifyEmit } from "../scripts/builders/lib/lossless.mjs";
import { emitFromIR } from "../scripts/builders/emit.mjs";
import { IR_VERSION } from "../scripts/builders/lib/ir.mjs";

const ctx = { siteName: "Demo Co", t: {}, media: new Map([["hero.jpg", "/images/hero.jpg"]]), contactHref: "/contact", isHome: true, pageImages: [] };

test("renderBlock: heading limpia el HTML inline (sin <br> crudo) y preserva el copy", () => {
  const h = renderBlock({ kind: "heading", text: "Any Question?<br>\nWrite Us" }, ctx);
  assert.match(h, /<h2[^>]*>\{"Any Question\? Write Us"\}<\/h2>/);
  assert.doesNotMatch(h, /<br>/);
});
test("renderBlock: image usa next/image con la ruta REAL ingerida", () => {
  const i = renderBlock({ kind: "image", media: ["hero.jpg"] }, ctx);
  assert.match(i, /<Image src="\/images\/hero\.jpg"[^>]*fill/);
});
test("renderBlock: divider con texto NO se pierde (etiqueta + línea)", () => {
  assert.match(renderBlock({ kind: "divider", text: "Main Office" }, ctx), /Main Office/);
  assert.match(renderBlock({ kind: "divider" }, ctx), /<hr/);
});
test("renderBlock: button real → CTA con su href; shortcode dinámico sin texto → se omite", () => {
  assert.match(renderBlock({ kind: "button", text: "Contact", raw: { settings: { link: { url: "/contact" } } } }, ctx), /<Button[^>]*href="\/contact"[^>]*>\{"Contact"\}/);
  assert.equal(renderBlock({ kind: "shortcode", text: "" }, ctx), "");
});
test("renderMain: HOME → primer grupo en Hero de marca; coloca imágenes usadas no-widget (fondos) como galería", () => {
  const page = { route: "/", blocks: [{ kind: "heading", text: "Welcome" }, { kind: "text-editor", text: "<p>Real copy.</p>" }] };
  const main = renderMain(page, { ...ctx, pageImages: ["/images/hero.jpg"] });
  assert.match(main, /from-accent to-accent-dark/, "hero de marca");
  assert.match(main, /\{"Welcome"\}/);
  assert.match(main, /\{"Real copy\."\}/);
  assert.match(main, /\/images\/hero\.jpg/, "imagen de fondo no-widget colocada (lossless)");
});

// --- Integración: emitFromIR sobre un IR mínimo (corre em-ui init/add) ---
function tinyIR(mediaFile) {
  return {
    irVersion: IR_VERSION, source: { kind: "test" },
    site: { name: "Demo Co", description: "Demo logistics", language: "es", url: "https://demo.test" },
    pages: [
      { id: 2, type: "page", slug: "home", route: "/", title: "Home", parent: null, order: 0,
        seo: { source: "test", title: "Demo Co — Inicio", description: "Demo home SEO" },
        blocks: [{ kind: "heading", text: "Welcome to Demo Co" }, { kind: "image", media: ["pic.png"] }, { kind: "text-editor", text: "We move cargo, fast and safe." }] },
      { id: 3, type: "page", slug: "services", route: "/services", title: "Services", parent: null, order: 1, seo: null,
        blocks: [{ kind: "heading", text: "Our Services" }, { kind: "icon-box", text: "Air Cargo\nFast air freight." }] },
    ],
    media: [{ id: "pic.png", file: mediaFile, src: null, usedBy: [2] }],
    menus: [], forms: [],
  };
}

test("emitFromIR: IR → satélite (páginas + layout + media) y el gate de EMISIÓN pasa (lossless IR→sitio)", () => {
  const root = mkdtempSync(join(tmpdir(), "emit-"));
  const pic = join(root, "pic.png");
  writeFileSync(pic, "PNG");
  const dest = join(root, "sat");
  const ir = tinyIR(pic);
  try {
    const trace = emitFromIR(ir, dest, { brand: "#0076a9", colorMode: "light" });
    // páginas emitidas (una por ruta del IR)
    assert.ok(existsSync(join(dest, "src/app/page.tsx")), "home");
    assert.ok(existsSync(join(dest, "src/app/services/page.tsx")), "services");
    assert.ok(existsSync(join(dest, "src/app/layout.tsx")), "layout");
    // media REAL ingerida a public/images
    assert.ok(existsSync(join(dest, "public/images/pic.png")), "imagen real copiada");
    assert.ok((trace.media || []).some((m) => m.includes("pic")));
    // contenido fiel: copy + SEO por-página
    const home = readFileSync(join(dest, "src/app/page.tsx"), "utf8");
    assert.match(home, /\{"Welcome to Demo Co"\}/);
    assert.match(home, /We move cargo/);
    assert.match(home, /Demo home SEO/, "SEO por-página del IR aplicado");
    assert.match(home, /\/images\/pic\.png/, "imagen real renderizada");
    // marca aplicada + i18n
    assert.match(readFileSync(join(dest, "src/app/globals.css"), "utf8"), /--color-accent: #0076a9/);
    assert.match(readFileSync(join(dest, "src/app/layout.tsx"), "utf8"), /<html lang="es">/);
    // GATE de emisión: el sitio preserva el contenido del IR
    const r = verifyEmit(ir, dest);
    assert.equal(r.ok, true, "emisión lossless: " + JSON.stringify(r.problems));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("gate de EMISIÓN: FALLA si el sitio pierde una página del IR", () => {
  const root = mkdtempSync(join(tmpdir(), "emit-neg-"));
  const pic = join(root, "pic.png"); writeFileSync(pic, "PNG");
  const dest = join(root, "sat");
  const ir = tinyIR(pic);
  try {
    emitFromIR(ir, dest, {});
    rmSync(join(dest, "src/app/services"), { recursive: true, force: true });   // simular página caída IR→sitio
    const r = verifyEmit(ir, dest);
    assert.equal(r.ok, false);
    assert.ok(r.problems.some((p) => /páginas/.test(p) && /CAYÓ/.test(p)));
  } finally { rmSync(root, { recursive: true, force: true }); }
});
