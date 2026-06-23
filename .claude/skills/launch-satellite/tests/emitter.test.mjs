// FB2+FB5 (ECO-66+ECO-65 / ADR-012+ADR-013): EMITTER del builder (IR → satélite Next ENRIQUECIDO) + estándar
// profesional (formulario/favicon/404/Cookiebot/Twitter Cards/a11y). Unit: renderBlock/renderMain (puro, sin red).
// Integración: emitFromIR sobre un IR mínimo (corre em-ui) → páginas/layout/media/pro-items + verifyEmit +
// verifyLaunchReady. Cierra el ciclo: captura (FB1) + emisión (FB2) + estándar pro (FB5) = nada se cae.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderBlock, renderMain } from "../scripts/builders/lib/emit-blocks.mjs";
import { verifyEmit } from "../scripts/builders/lib/lossless.mjs";
import { verifyLaunchReady } from "../scripts/builders/lib/launch-ready.mjs";
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

test("emitFromIR: IR → satélite (páginas + layout + media) y el gate de EMISIÓN pasa (lossless IR→sitio)", async () => {
  const root = mkdtempSync(join(tmpdir(), "emit-"));
  const pic = join(root, "pic.png");
  writeFileSync(pic, "PNG");
  const dest = join(root, "sat");
  const ir = tinyIR(pic);
  try {
    const trace = await emitFromIR(ir, dest, { brand: "#0076a9", colorMode: "light" });
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
    // Twitter Cards por página (ECO-65/FB5)
    assert.match(home, /summary_large_image/, "Twitter Cards por página");
    // marca aplicada + i18n
    assert.match(readFileSync(join(dest, "src/app/globals.css"), "utf8"), /--color-accent: #0076a9/);
    assert.match(readFileSync(join(dest, "src/app/layout.tsx"), "utf8"), /<html lang="es">/);
    // GATE de emisión: el sitio preserva el contenido del IR
    const r = verifyEmit(ir, dest);
    assert.equal(r.ok, true, "emisión lossless: " + JSON.stringify(r.problems));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("emitFromIR FB5: estándar profesional emitido — formulario, 404, a11y, Cookiebot, Twitter Cards, manifest", async () => {
  const root = mkdtempSync(join(tmpdir(), "emit-pro-"));
  const pic = join(root, "pic.png");
  writeFileSync(pic, "PNG");
  const dest = join(root, "sat");
  const ir = tinyIR(pic);
  try {
    await emitFromIR(ir, dest, { brand: "#0076a9", colorMode: "light" });

    // Formulario de contacto + Server Action (ADR-013 §2)
    assert.ok(existsSync(join(dest, "src/app/contact/page.tsx")), "contact page");
    assert.ok(existsSync(join(dest, "src/app/actions/send-lead.ts")), "Server Action");
    const action = readFileSync(join(dest, "src/app/actions/send-lead.ts"), "utf8");
    assert.match(action, /"use server"/, "server action");
    assert.match(action, /Resend/, "Resend en el action");
    assert.match(action, /Turnstile|cf-turnstile/, "Turnstile en el action");

    // 404 de marca (ADR-013 §1)
    assert.ok(existsSync(join(dest, "src/app/not-found.tsx")), "404 de marca");
    assert.match(readFileSync(join(dest, "src/app/not-found.tsx"), "utf8"), /Demo Co/, "siteName en 404");

    // site.webmanifest (ADR-013 §1)
    assert.ok(existsSync(join(dest, "public/site.webmanifest")), "site.webmanifest");
    const manifest = JSON.parse(readFileSync(join(dest, "public/site.webmanifest"), "utf8"));
    assert.equal(manifest.name, "Demo Co");

    // Cookiebot en layout (ADR-013 §3)
    const layout = readFileSync(join(dest, "src/app/layout.tsx"), "utf8");
    assert.match(layout, /Cookiebot/, "Cookiebot CMP en layout");

    // Twitter Cards site-level (ADR-013 §5)
    assert.match(layout, /summary_large_image/, "Twitter Cards en layout");

    // Favicon links en layout (ADR-013 §1)
    assert.match(layout, /apple-touch-icon/, "apple-touch-icon link en layout");

    // Test de a11y (ADR-013 §4)
    assert.ok(existsSync(join(dest, "tests/accessibility.spec.ts")), "a11y test");
    const a11y = readFileSync(join(dest, "tests/accessibility.spec.ts"), "utf8");
    assert.match(a11y, /@axe-core\/playwright/, "axe-core en el test");
    assert.match(a11y, /wcag2aa/, "WCAG AA tags");

    // resend + @marsidev/react-turnstile en package.json
    const pkg = JSON.parse(readFileSync(join(dest, "package.json"), "utf8"));
    assert.ok(pkg.dependencies?.resend, "resend en deps");
    assert.ok(pkg.dependencies?.["@marsidev/react-turnstile"], "TurnstileWidget dep");
    assert.ok(pkg.devDependencies?.["@axe-core/playwright"], "@axe-core/playwright devDep");

    // Playwright config
    assert.ok(existsSync(join(dest, "playwright.config.ts")), "playwright.config.ts");

  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("emitFromIR FB5: verifyLaunchReady pasa (con favicons manuales — sharp requiere logo real)", async () => {
  const root = mkdtempSync(join(tmpdir(), "emit-launch-"));
  const pic = join(root, "pic.png");
  writeFileSync(pic, "PNG");
  const dest = join(root, "sat");
  const ir = tinyIR(pic);
  try {
    await emitFromIR(ir, dest, { brand: "#0076a9", colorMode: "light" });

    // Los favicons no se generan (sharp requiere un logo real PNG/JPG/SVG ≥1px, no "PNG" como texto).
    // Crear las imágenes manualmente para simular que se generaron (el gate no valida el contenido de las imágenes).
    writeFileSync(join(dest, "public/favicon.png"), "PNG");
    writeFileSync(join(dest, "public/apple-touch-icon.png"), "PNG");
    writeFileSync(join(dest, "public/android-chrome-192x192.png"), "PNG");
    writeFileSync(join(dest, "public/android-chrome-512x512.png"), "PNG");

    const r = verifyLaunchReady(dest);
    assert.equal(r.ok, true, "launch-readiness: " + r.problems.join("; "));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("gate de EMISIÓN: FALLA si el sitio pierde una página del IR", async () => {
  const root = mkdtempSync(join(tmpdir(), "emit-neg-"));
  const pic = join(root, "pic.png"); writeFileSync(pic, "PNG");
  const dest = join(root, "sat");
  const ir = tinyIR(pic);
  try {
    await emitFromIR(ir, dest, {});
    rmSync(join(dest, "src/app/services"), { recursive: true, force: true });   // simular página caída IR→sitio
    const r = verifyEmit(ir, dest);
    assert.equal(r.ok, false);
    assert.ok(r.problems.some((p) => /páginas/.test(p) && (/CAYER|cayer|faltan|missing/i.test(p))));
  } finally { rmSync(root, { recursive: true, force: true }); }
});
