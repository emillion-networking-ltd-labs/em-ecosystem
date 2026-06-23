// Gate de LAUNCH-READINESS (FB5, ECO-65 / ADR-013). Verifica que verifyLaunchReady detecta correctamente
// presencia / ausencia del estándar profesional completo: favicon, 404, formulario, Cookiebot, Twitter Cards,
// a11y test. La integración real (emitFromIR → verifyLaunchReady) se cubre en emitter.test.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { verifyLaunchReady } from "../scripts/builders/lib/launch-ready.mjs";

// Crea un satélite MÍNIMO con todos los indispensables del estándar (ADR-013).
function makeFullSat(root) {
  const dir = join(root, "sat");
  const pub = join(dir, "public");
  const app = join(dir, "src", "app");
  const acts = join(app, "actions");
  const contact = join(app, "contact");
  const tests = join(dir, "tests");
  mkdirSync(pub, { recursive: true });
  mkdirSync(app, { recursive: true });
  mkdirSync(acts, { recursive: true });
  mkdirSync(contact, { recursive: true });
  mkdirSync(tests, { recursive: true });

  // Favicons
  writeFileSync(join(pub, "favicon.png"), "PNG");
  writeFileSync(join(pub, "apple-touch-icon.png"), "PNG");
  writeFileSync(join(pub, "android-chrome-192x192.png"), "PNG");
  writeFileSync(join(pub, "android-chrome-512x512.png"), "PNG");
  writeFileSync(join(pub, "site.webmanifest"), '{"name":"Test"}');

  // 404 de marca
  writeFileSync(join(app, "not-found.tsx"), "export default function NotFound() { return <p>404</p>; }");

  // Formulario + Server Action
  writeFileSync(join(contact, "page.tsx"), "export default function ContactPage() { return <form />; }");
  writeFileSync(join(acts, "send-lead.ts"), '"use server";\nexport async function sendLead() { return {}; }');

  // Layout con Cookiebot + Twitter Cards + favicon links + Powered by
  writeFileSync(join(app, "layout.tsx"), `
import Script from "next/script";
export const metadata = {
  twitter: { card: "summary_large_image" as const },
};
export default function RootLayout({ children }: any) {
  return (
    <html>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {process.env.NEXT_PUBLIC_COOKIEBOT_ID ? <Script id="Cookiebot" src="..." data-cbid={process.env.NEXT_PUBLIC_COOKIEBOT_ID} strategy="beforeInteractive" /> : null}
      </head>
      <body>{children}
        <footer><p>Powered by EM Ecosystem</p></footer>
      </body>
    </html>
  );
}
`);

  // Security headers en next.config.mjs
  writeFileSync(join(dir, "next.config.mjs"), `const cfg = { headers() { return [{ source:"/(.*)", headers:[{key:"Strict-Transport-Security",value:"max-age=63072000"}]}]; } };\nexport default cfg;\n`);

  // a11y test
  writeFileSync(join(tests, "accessibility.spec.ts"), "import AxeBuilder from '@axe-core/playwright';\n");

  return dir;
}

test("verifyLaunchReady: satélite COMPLETO pasa todos los checks", () => {
  const root = mkdtempSync(join(tmpdir(), "lr-full-"));
  try {
    const dir = makeFullSat(root);
    const r = verifyLaunchReady(dir);
    assert.equal(r.ok, true, "debe pasar: " + r.problems.join("; "));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("verifyLaunchReady: falla si falta el favicon", () => {
  const root = mkdtempSync(join(tmpdir(), "lr-nofav-"));
  try {
    const dir = makeFullSat(root);
    // Borrar todos los favicon
    rmSync(join(dir, "public", "favicon.png"));
    const r = verifyLaunchReady(dir);
    assert.equal(r.ok, false);
    assert.ok(r.problems.some((p) => /favicon/.test(p)), "debe reportar favicon");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("verifyLaunchReady: falla si falta not-found.tsx (404 de marca)", () => {
  const root = mkdtempSync(join(tmpdir(), "lr-no404-"));
  try {
    const dir = makeFullSat(root);
    rmSync(join(dir, "src", "app", "not-found.tsx"));
    const r = verifyLaunchReady(dir);
    assert.equal(r.ok, false);
    assert.ok(r.problems.some((p) => /not-found/.test(p)), "debe reportar 404");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("verifyLaunchReady: falla si falta contact/page.tsx (formulario)", () => {
  const root = mkdtempSync(join(tmpdir(), "lr-noform-"));
  try {
    const dir = makeFullSat(root);
    rmSync(join(dir, "src", "app", "contact"), { recursive: true });
    const r = verifyLaunchReady(dir);
    assert.equal(r.ok, false);
    assert.ok(r.problems.some((p) => /contact/.test(p)), "debe reportar formulario");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("verifyLaunchReady: falla si el layout no tiene Cookiebot", () => {
  const root = mkdtempSync(join(tmpdir(), "lr-nocookiebot-"));
  try {
    const dir = makeFullSat(root);
    // Sobrescribir layout sin Cookiebot
    writeFileSync(join(dir, "src", "app", "layout.tsx"), `
export const metadata = { twitter: { card: "summary_large_image" as const } };
export default function RootLayout({ children }: any) {
  return <html><head><link rel="apple-touch-icon" href="/apple-touch-icon.png" /></head><body>{children}<footer><p>Powered by EM Ecosystem</p></footer></body></html>;
}
`);
    const r = verifyLaunchReady(dir);
    assert.equal(r.ok, false);
    assert.ok(r.problems.some((p) => /Cookiebot/.test(p)), "debe reportar Cookiebot");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("verifyLaunchReady: falla si el layout no tiene Twitter Cards", () => {
  const root = mkdtempSync(join(tmpdir(), "lr-notwitter-"));
  try {
    const dir = makeFullSat(root);
    writeFileSync(join(dir, "src", "app", "layout.tsx"), `
export const metadata = {};
export default function RootLayout({ children }: any) {
  return <html><head><link rel="apple-touch-icon" href="/apple-touch-icon.png" />{process.env.NEXT_PUBLIC_COOKIEBOT_ID ? "Cookiebot placeholder" : null}</head><body>{children}<footer><p>Powered by EM Ecosystem</p></footer></body></html>;
}
`);
    const r = verifyLaunchReady(dir);
    assert.equal(r.ok, false);
    assert.ok(r.problems.some((p) => /Twitter/.test(p) || /summary_large_image/.test(p)), "debe reportar Twitter Cards");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("verifyLaunchReady: falla si falta tests/accessibility.spec.ts (a11y)", () => {
  const root = mkdtempSync(join(tmpdir(), "lr-noa11y-"));
  try {
    const dir = makeFullSat(root);
    rmSync(join(dir, "tests", "accessibility.spec.ts"));
    const r = verifyLaunchReady(dir);
    assert.equal(r.ok, false);
    assert.ok(r.problems.some((p) => /accessibility|axe/.test(p)), "debe reportar a11y test");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("verifyLaunchReady: falla si el layout no tiene Powered by EM Ecosystem", () => {
  const root = mkdtempSync(join(tmpdir(), "lr-nopowered-"));
  try {
    const dir = makeFullSat(root);
    writeFileSync(join(dir, "src", "app", "layout.tsx"), `
export const metadata = { twitter: { card: "summary_large_image" as const } };
export default function RootLayout({ children }: any) {
  return <html><head><link rel="apple-touch-icon" href="/apple-touch-icon.png" />{process.env.NEXT_PUBLIC_COOKIEBOT_ID ? "Cookiebot" : null}</head><body>{children}</body></html>;
}
`);
    const r = verifyLaunchReady(dir);
    assert.equal(r.ok, false);
    assert.ok(r.problems.some((p) => /Powered/.test(p)), "debe reportar Powered by");
  } finally { rmSync(root, { recursive: true, force: true }); }
});
