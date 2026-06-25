// CONTRATO del IR (G1, ECO-73 · ADR-012/ADR-015). El IR es la FRONTERA entre captura (adapters) y diseño
// (emitter): todo adapter lo PRODUCE, todo aguas-abajo lo CONSUME. Este test lo CONGELA como contrato —
// rompe si la FORMA cambia (una clave nueva/quitada arriba, un sub-campo renombrado, el contrato de validateIR
// debilitado). Romper a propósito = actualizar estos literales Y subir IR_VERSION conscientemente. Es el
// guardarraíl que impide que la forma del IR derive en silencio y rompa adapters/emitter sin avisar.
import { test } from "node:test";
import assert from "node:assert/strict";
import { IR_VERSION, emptyIR, validateIR } from "../scripts/builders/model/ir.mjs";

// --- LA FORMA CONGELADA (el contrato). Cambiarla = romper el contrato = subir IR_VERSION. -------------------
const TOP_KEYS = ["irVersion", "source", "site", "pages", "media", "menus", "forms"];       // raíz del IR
const PAGE_KEYS = ["id", "type", "slug", "route", "title", "parent", "order", "seo", "blocks", "design"]; // una página (`design` opcional, G3/ECO-75)
const BLOCK_KEYS = ["kind", "text", "level", "href", "media", "raw", "children"];            // un bloque
const MEDIA_KEYS = ["id", "file", "src", "usedBy", "alt", "mime"];                            // un media

// IR canónico de referencia: cubre TODAS las variaciones del modelo (página/post, bloque con/sin texto, bloque
// con children anidados, media completo, menús, forms). Debe VALIDAR y mantenerse dentro de la forma congelada.
const CANONICAL_IR = {
  irVersion: IR_VERSION,
  source: { kind: "wordpress", backup: "/bk", dump: "/bk/db.sql" },
  site: { name: "Ref Co", description: "desc", url: "https://ref.example", language: "es", locale: "es_ES" },
  pages: [
    {
      id: 1, type: "page", slug: "home", route: "/", title: "Home", parent: null, order: 0,
      seo: { source: "yoast", title: "Home — Ref Co", description: "d" },
      blocks: [
        { kind: "heading", text: "Hola", level: 1, media: [], raw: {} },
        { kind: "image", text: undefined, media: ["hero.jpg"], raw: {} },
        { kind: "button", text: "Contacto", href: "/contacto", media: [], raw: {} },
        { kind: "section", media: [], raw: {}, children: [{ kind: "text-editor", text: "cuerpo", media: [], raw: {} }] },
      ],
    },
    { id: 2, type: "post", slug: "about", route: "/about", title: "About", parent: null, order: 1, seo: null,
      blocks: [{ kind: "html", text: "x", media: [], raw: { html: "<p>x</p>" } }] },
  ],
  media: [{ id: "hero.jpg", file: "/bk/hero.jpg", src: "https://ref.example/hero.jpg", usedBy: [1], alt: "hero", mime: "image/jpeg" }],
  menus: [{ name: "primary", items: [{ label: "Home", url: "/", order: 0, parent: null }] }],
  forms: [],
};

const subset = (obj, allowed) => Object.keys(obj).filter((k) => !allowed.includes(k));

test("contrato IR: IR_VERSION está PINNED (cambiarla es un acto consciente de ruptura)", () => {
  assert.equal(IR_VERSION, "1.0.0");
});

test("contrato IR: emptyIR() tiene EXACTAMENTE las claves de raíz congeladas", () => {
  // Si alguien añade/quita una clave de raíz, este test ROMPE → debe actualizar TOP_KEYS + subir IR_VERSION.
  assert.deepEqual(Object.keys(emptyIR()).sort(), [...TOP_KEYS].sort());
  const ir = emptyIR({ kind: "wordpress" });
  assert.equal(ir.irVersion, IR_VERSION);
  assert.deepEqual(ir.pages, []); assert.deepEqual(ir.media, []);
  assert.deepEqual(ir.menus, []); assert.deepEqual(ir.forms, []);
});

test("contrato IR: el IR canónico VALIDA y respeta la forma congelada (página/bloque/media)", () => {
  assert.deepEqual(validateIR(CANONICAL_IR), [], "el IR canónico debe ser válido");
  for (const pg of CANONICAL_IR.pages) {
    assert.deepEqual(subset(pg, PAGE_KEYS), [], `página ${pg.id}: clave fuera del contrato`);
    for (const req of ["id", "route", "blocks"]) assert.ok(req in pg, `página ${pg.id}: falta '${req}'`);
    const stack = [...pg.blocks];
    while (stack.length) {
      const b = stack.shift();
      assert.deepEqual(subset(b, BLOCK_KEYS), [], `bloque '${b.kind}': clave fuera del contrato`);
      assert.equal(typeof b.kind, "string", "todo bloque tiene 'kind' string");
      if (Array.isArray(b.children)) stack.push(...b.children);
    }
  }
  for (const m of CANONICAL_IR.media) {
    assert.deepEqual(subset(m, MEDIA_KEYS), [], `media ${m.id}: clave fuera del contrato`);
    assert.ok(m.id && (m.file || m.src), `media ${m.id}: requiere id + (file|src)`);
  }
});

test("contrato IR: validateIR RECHAZA cada violación estructural (no se debilita en silencio)", () => {
  const clone = () => JSON.parse(JSON.stringify(CANONICAL_IR));
  const bad = (mut, rx) => {
    const ir = clone(); mut(ir);
    const probs = validateIR(ir);
    assert.ok(probs.length > 0, "esperaba que validateIR rechazara");
    assert.ok(probs.some((p) => rx.test(p)), `esperaba un problema que casara ${rx} — obtuve: ${probs.join(" | ")}`);
  };
  bad((ir) => { ir.irVersion = "9.9.9"; }, /irVersion/);
  bad((ir) => { delete ir.source.kind; }, /source\.kind/);
  bad((ir) => { ir.site = "no-obj"; }, /site/);
  bad((ir) => { ir.pages = "no-array"; }, /pages debe ser un array/);
  bad((ir) => { ir.media = "no-array"; }, /media debe ser un array/);
  bad((ir) => { ir.menus = "no-array"; }, /menus debe ser un array/);
  bad((ir) => { ir.forms = "no-array"; }, /forms debe ser un array/);
  bad((ir) => { ir.pages[1].route = "/"; }, /route duplicada/);
  bad((ir) => { delete ir.pages[0].id; }, /sin id/);
  bad((ir) => { ir.pages[0].route = 123; }, /route debe ser string/);
  bad((ir) => { ir.pages[0].blocks = "no-array"; }, /blocks debe ser un array/);
  bad((ir) => { delete ir.pages[0].blocks[0].kind; }, /no tiene 'kind'/);                 // bloque top-level sin kind
  bad((ir) => { delete ir.pages[0].blocks[3].children[0].kind; }, /no tiene 'kind'/);     // bloque ANIDADO sin kind
  bad((ir) => { ir.media.push({ ...ir.media[0] }); }, /media id duplicado/);
  bad((ir) => { delete ir.media[0].file; delete ir.media[0].src; }, /sin file ni src/);
});
