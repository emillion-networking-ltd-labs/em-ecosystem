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
  const comp = join(dir, "src", "components");
  const acts = join(app, "actions");
  const contact = join(app, "contact");
  const tests = join(dir, "tests");
  mkdirSync(pub, { recursive: true });
  mkdirSync(app, { recursive: true });
  mkdirSync(comp, { recursive: true });
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

  // Formulario funcional: la página de contacto MONTA <ContactForm />; el form vive en su client component
  // (TurnstileWidget + sendLead); + Server Action send-lead.ts.
  writeFileSync(join(contact, "page.tsx"), "import ContactForm from '@/components/ContactForm';\nexport default function ContactPage() { return <main><ContactForm /></main>; }");
  writeFileSync(join(comp, "ContactForm.tsx"), '"use client";\nimport TurnstileWidget from "@/components/ui/TurnstileWidget";\nimport { sendLead } from "@/app/actions/send-lead";\nexport default function ContactForm() { return <form onSubmit={() => sendLead(new FormData())}><TurnstileWidget /></form>; }');
  writeFileSync(join(acts, "send-lead.ts"), '"use server";\nexport async function sendLead() { return {}; }');

  // Toggle de tema (ECO-68): el ThemeToggle (em-ui, cableado a useTheme/toggleTheme) + el ThemeContext que el
  // núcleo genera. El gate exige que el header lo monte DENTRO de <Providers> y que el componente esté cableado.
  const ui = join(comp, "ui");
  const ctx = join(dir, "src", "context");
  mkdirSync(ui, { recursive: true });
  mkdirSync(ctx, { recursive: true });
  writeFileSync(join(ui, "ThemeToggle.tsx"), '"use client";\nimport { useTheme } from "@/hooks/useTheme";\nexport default function ThemeToggle() { const { theme, toggleTheme } = useTheme(); return <button onClick={toggleTheme}>{theme}</button>; }');
  writeFileSync(join(ctx, "ThemeContext.tsx"), '"use client";\nimport { createContext } from "react";\nexport const ThemeContext = createContext(null);\nexport default function ThemeProvider({ children }: any) { return <ThemeContext.Provider value={null}>{children}</ThemeContext.Provider>; }');

  // Layout con Cookiebot + Twitter Cards + favicon links + Powered by + ThemeToggle dentro de <Providers>
  writeFileSync(join(app, "layout.tsx"), `
import Script from "next/script";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Providers from "./providers";
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
      <body>
        <Providers>
          <header><nav aria-label="Principal"><ThemeToggle /></nav></header>
          {children}
          <footer><p>Powered by EM Ecosystem</p></footer>
        </Providers>
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

test("verifyLaunchReady: el formulario vale en la RUTA de contacto REAL (/contact-us, no /contact)", () => {
  const root = mkdtempSync(join(tmpdir(), "lr-realroute-"));
  try {
    const dir = makeFullSat(root);
    // El cliente trae su propia página de contacto en /contact-us (no /contact): movemos la página ahí.
    const app = join(dir, "src", "app");
    rmSync(join(app, "contact"), { recursive: true });
    const cu = join(app, "contact-us");
    mkdirSync(cu, { recursive: true });
    writeFileSync(join(cu, "page.tsx"), "import ContactForm from '@/components/ContactForm';\nexport default function Page() { return <main><h1>Contact Us</h1><ContactForm /></main>; }");
    const r = verifyLaunchReady(dir);
    assert.equal(r.ok, true, "debe detectar el form en /contact-us: " + r.problems.join("; "));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("verifyLaunchReady: falla si la página de contacto NO monta el formulario funcional", () => {
  const root = mkdtempSync(join(tmpdir(), "lr-formless-"));
  try {
    const dir = makeFullSat(root);
    // Página de contacto SIN <ContactForm /> (el bug original: contenido real reconstruido sin form).
    writeFileSync(join(dir, "src", "app", "contact", "page.tsx"),
      "export default function ContactPage() { return <main><h1>Contacto</h1><p>Llámanos.</p></main>; }");
    const r = verifyLaunchReady(dir);
    assert.equal(r.ok, false);
    assert.ok(r.problems.some((p) => /ContactForm|formulario/.test(p)), "debe reportar formulario ausente");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("verifyLaunchReady: falla si el sitio tiene artefactos de render ('undefined' visible)", () => {
  const root = mkdtempSync(join(tmpdir(), "lr-artifact-"));
  try {
    const dir = makeFullSat(root);
    // Inyecta el artefacto que destapó Atis: <p>{"undefined"}</p> como texto visible.
    writeFileSync(join(dir, "src", "app", "page.tsx"),
      'export default function Page() { return <main><h1>{"Welcome"}</h1><p>{"undefined"}</p></main>; }');
    const r = verifyLaunchReady(dir);
    assert.equal(r.ok, false);
    assert.ok(r.problems.some((p) => /artefacto|undefined/.test(p)), "debe reportar el artefacto: " + r.problems.join("; "));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("verifyLaunchReady: falla con <p></p> vacío, [object Object] o null visibles", () => {
  const root = mkdtempSync(join(tmpdir(), "lr-empty-"));
  try {
    const dir = makeFullSat(root);
    writeFileSync(join(dir, "src", "app", "page.tsx"),
      'export default function Page() { return <main><p></p><span>{"[object Object]"}</span><em>{"null"}</em></main>; }');
    const r = verifyLaunchReady(dir);
    assert.equal(r.ok, false);
    assert.ok(r.problems.some((p) => /artefacto|<p><\/p>|object Object|null/.test(p)), "debe reportar artefactos: " + r.problems.join("; "));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("verifyLaunchReady: NO false-positive — texto legítimo con 'undefined' dentro de una frase pasa", () => {
  const root = mkdtempSync(join(tmpdir(), "lr-nofp-"));
  try {
    const dir = makeFullSat(root);
    // 'undefined' como palabra dentro de una frase real NO es artefacto (sólo lo es un nodo entero === token).
    writeFileSync(join(dir, "src", "app", "page.tsx"),
      'export default function Page() { return <main><p>{"Behavior is undefined when the input is empty."}</p></main>; }');
    const r = verifyLaunchReady(dir);
    assert.equal(r.ok, true, "no debe marcar prosa legítima: " + r.problems.join("; "));
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

test("verifyLaunchReady: falla si el header NO monta el toggle de tema (ECO-68)", () => {
  const root = mkdtempSync(join(tmpdir(), "lr-notoggle-"));
  try {
    const dir = makeFullSat(root);
    // Layout completo SALVO el toggle: el hueco que arreglamos — ambos temas existen pero el visitante no puede
    // cambiar a mano (no hay <ThemeToggle/> en el header).
    writeFileSync(join(dir, "src", "app", "layout.tsx"), `
import Script from "next/script";
import Providers from "./providers";
export const metadata = { twitter: { card: "summary_large_image" as const } };
export default function RootLayout({ children }: any) {
  return <html><head><link rel="apple-touch-icon" href="/apple-touch-icon.png" />{process.env.NEXT_PUBLIC_COOKIEBOT_ID ? <Script id="Cookiebot" src="..." data-cbid={process.env.NEXT_PUBLIC_COOKIEBOT_ID} strategy="beforeInteractive" /> : null}</head><body><Providers>{children}<footer><p>Powered by EM Ecosystem</p></footer></Providers></body></html>;
}
`);
    const r = verifyLaunchReady(dir);
    assert.equal(r.ok, false);
    assert.ok(r.problems.some((p) => /toggle|ThemeToggle|tema/i.test(p)), "debe reportar el toggle ausente: " + r.problems.join("; "));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("verifyLaunchReady: falla si el toggle está FUERA de <Providers> (useTheme rompería en runtime — la regresión de ECO-68)", () => {
  const root = mkdtempSync(join(tmpdir(), "lr-toggleout-"));
  try {
    const dir = makeFullSat(root);
    // El toggle existe e importado, pero montado FUERA del provider (header antes que <Providers>) → useTheme rompe.
    writeFileSync(join(dir, "src", "app", "layout.tsx"), `
import Script from "next/script";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Providers from "./providers";
export const metadata = { twitter: { card: "summary_large_image" as const } };
export default function RootLayout({ children }: any) {
  return <html><head><link rel="apple-touch-icon" href="/apple-touch-icon.png" />{process.env.NEXT_PUBLIC_COOKIEBOT_ID ? <Script id="Cookiebot" src="..." data-cbid={process.env.NEXT_PUBLIC_COOKIEBOT_ID} strategy="beforeInteractive" /> : null}</head><body><header><nav aria-label="Principal"><ThemeToggle /></nav></header><Providers>{children}<footer><p>Powered by EM Ecosystem</p></footer></Providers></body></html>;
}
`);
    const r = verifyLaunchReady(dir);
    assert.equal(r.ok, false);
    assert.ok(r.problems.some((p) => /toggle|ThemeToggle|tema/i.test(p)), "debe reportar el toggle fuera del provider: " + r.problems.join("; "));
  } finally { rmSync(root, { recursive: true, force: true }); }
});
