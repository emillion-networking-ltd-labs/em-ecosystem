// Gate de LAUNCH-READINESS (FB5, ECO-65 / ADR-013). Verifica que el satélite emitido cumple el ESTÁNDAR
// PROFESIONAL COMPLETO antes de declararlo "lanzado". Igual que el gate lossless (verifyEmit) caza contenido
// caído, este gate caza INDISPENSABLES que falten → nada sale a medias. Extensible: añadir un indispensable
// aquí + en emit.mjs (núcleo común) → lo heredan TODOS los builders automáticamente (ADR-013 §7).
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Localiza la página de contacto REAL del satélite (la ruta del cliente: /contact, /contact-us, /contacto…,
// o la /contact sintética). Recorre src/app y devuelve el page.tsx cuyo directorio matchea el patrón de
// contacto. NO hardcodea /contact (ADR-013 §2). Devuelve la ruta absoluta del page.tsx o null.
const CONTACT_DIR_RE = /^contact(o|-?us)?$/i;
function findContactPage(satDir) {
  const walk = (dir) => {
    let entries = [];
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return null; }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const full = join(dir, e.name);
      if (CONTACT_DIR_RE.test(e.name) && existsSync(join(full, "page.tsx"))) return join(full, "page.tsx");
      const nested = walk(full);
      if (nested) return nested;
    }
    return null;
  };
  return walk(join(satDir, "src/app"));
}

// Tokens que NUNCA deben aparecer como TEXTO VISIBLE (artefactos de render: String(undefined/null/objeto)).
const ARTIFACT_TOKENS = ["undefined", "null", "[object Object]"];

// Escanea el sitio emitido por ARTEFACTOS de CALIDAD DE CONTENIDO (no estructura). El gate estructural no los
// caza: un <p>{"undefined"}</p> tiene markup válido pero el sitio se ve ROTO. Mira los nodos de texto JSX
// visibles {"…"} (lo que el renderer emite con JSON.stringify) + párrafos vacíos. Devuelve lista de hallazgos
// (ruta + descripción); vacía = limpio. Sólo .tsx bajo src/ (donde vive el contenido visible).
function scanContentArtifacts(satDir) {
  const hits = [];
  const walk = (dir) => {
    let entries = [];
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) { walk(full); continue; }
      if (!e.name.endsWith(".tsx")) continue;
      let src = "";
      try { src = readFileSync(full, "utf8"); } catch { continue; }
      const rel = full.slice(satDir.length + 1);
      // Nodos de texto JSX visibles: {"…"} — exactamente lo que emite el renderer (texto del IR JSON-stringificado).
      for (const m of src.matchAll(/\{"((?:[^"\\]|\\.)*)"\}/g)) {
        let s;
        try { s = JSON.parse('"' + m[1] + '"'); } catch { s = m[1]; }
        const trimmed = s.trim();
        if (ARTIFACT_TOKENS.includes(trimmed)) hits.push(`${rel}: texto visible "${trimmed}"`);
        else if (trimmed === "") hits.push(`${rel}: nodo de texto vacío {""}`);
        else if (/\{\{|\}\}|\$\{|%[A-Za-z0-9_]+%/.test(s)) hits.push(`${rel}: token del IR sin resolver ("${trimmed.slice(0, 40)}")`);
      }
      // Párrafos visualmente vacíos.
      if (/<p[^>]*>\s*<\/p>/.test(src)) hits.push(`${rel}: <p></p> vacío`);
    }
  };
  walk(join(satDir, "src"));
  return hits;
}

// Verifica que el directorio de satélite cumple el estándar profesional (ADR-013).
// Devuelve { ok, problems, lines } — mismo contrato que verifyEmit / losslessReport.
export function verifyLaunchReady(satDir) {
  const problems = [];
  const lines = [];

  function chk(label, passes, hint = "") {
    if (passes) {
      lines.push(`  ✓ ${label}`);
    } else {
      const msg = hint ? `${label} — ${hint}` : label;
      problems.push(msg);
      lines.push(`  ✗ ${msg}`);
    }
  }

  // Leer layout.tsx una vez (se reutiliza en varios checks)
  let layout = "";
  try { layout = readFileSync(join(satDir, "src/app/layout.tsx"), "utf8"); } catch {}

  // ── Favicon + iconos + web manifest (ADR-013 §1 NUEVO, sharp desde logo real)
  const hasFaviconSvg = existsSync(join(satDir, "public/favicon.svg"));
  const hasFaviconPng = existsSync(join(satDir, "public/favicon.png"));
  const hasFaviconIco = existsSync(join(satDir, "public/favicon.ico"));
  chk("favicon (svg | png | ico)", hasFaviconSvg || hasFaviconPng || hasFaviconIco,
    "generar con sharp desde el logo real (generateFavicons)");
  chk("apple-touch-icon.png (180×180)", existsSync(join(satDir, "public/apple-touch-icon.png")));
  chk("android-chrome-192x192.png", existsSync(join(satDir, "public/android-chrome-192x192.png")));
  chk("android-chrome-512x512.png", existsSync(join(satDir, "public/android-chrome-512x512.png")));
  chk("site.webmanifest", existsSync(join(satDir, "public/site.webmanifest")));

  // ── Favicon links en layout.tsx (referenciados en el <head>)
  chk("favicon links en layout.tsx", layout.includes("apple-touch-icon") || layout.includes("favicon"),
    "añadir <link rel='favicon'> / <link rel='apple-touch-icon'> en el <head>");

  // ── 404 de marca (ADR-013 §1 NUEVO)
  chk("not-found.tsx (404 de marca)", existsSync(join(satDir, "src/app/not-found.tsx")));

  // ── Formulario de contacto/lead funcional en la RUTA de contacto REAL (ADR-013 §2). NO hardcodea /contact:
  // localiza la página de contacto del satélite (/contact-us, /contacto, la que sea) y verifica que monta el
  // formulario funcional ahí. El form vive en el client component ContactForm (Turnstile + sendLead).
  const contactPagePath = findContactPage(satDir);
  let contactPage = "";
  try { if (contactPagePath) contactPage = readFileSync(contactPagePath, "utf8"); } catch {}
  let contactForm = "";
  try { contactForm = readFileSync(join(satDir, "src/components/ContactForm.tsx"), "utf8"); } catch {}
  chk("formulario funcional en la ruta de contacto (ContactForm + Turnstile)",
    !!contactPagePath && /<ContactForm/.test(contactPage) && /TurnstileWidget/.test(contactForm),
    "la página de contacto del satélite debe montar <ContactForm /> y ContactForm.tsx referenciar TurnstileWidget");
  chk("actions/send-lead.ts (Server Action + Resend + Turnstile) cableado en el formulario",
    existsSync(join(satDir, "src/app/actions/send-lead.ts")) && /sendLead/.test(contactForm),
    "ContactForm.tsx debe invocar sendLead del Server Action");

  // ── GDPR Cookiebot CMP (ADR-013 §3, Consent Mode v2)
  chk("Cookiebot CMP en layout.tsx", layout.includes("Cookiebot"),
    "Script Cookiebot en layout (<head>)");

  // ── Twitter Cards (ADR-013 §5 SEO ampliado)
  chk("Twitter Cards (summary_large_image) en layout.tsx",
    layout.includes("summary_large_image"),
    "añadir twitter: { card: 'summary_large_image' } en metadata del layout");

  // ── Test de a11y WCAG AA con axe-core (ADR-013 §4)
  chk("tests/accessibility.spec.ts (axe-core WCAG AA)",
    existsSync(join(satDir, "tests/accessibility.spec.ts")));

  // ── Security headers S2 (ya en NEXT_CONFIG — chequeamos que el emitter no lo haya quitado)
  const hasConfig = existsSync(join(satDir, "next.config.mjs"));
  let nextCfg = "";
  try { nextCfg = readFileSync(join(satDir, "next.config.mjs"), "utf8"); } catch {}
  chk("security headers S2 (next.config.mjs)", hasConfig && nextCfg.includes("Strict-Transport-Security"),
    "NEXT_CONFIG debe incluir las 6 cabeceras de seguridad S2");

  // ── Firma "Powered by EM Ecosystem" (governance, en footer del layout)
  chk("Powered by EM Ecosystem (footer)", layout.includes("Powered by"),
    "el footer del layout debe llevar la firma 'Powered by EM Ecosystem'");

  // ── Toggle de tema MANUAL en el header, cableado al ThemeContext (ADR-013 §1 NUEVO, ECO-68). El emitter ya
  // genera AMBOS temas (ThemeContext) pero el visitante necesita un control MANUAL light↔dark (no solo
  // default/SO). El ThemeToggle (em-ui, vía registry) usa useTheme→toggleTheme; el LAYOUT debe montarlo DENTRO
  // de <Providers> (si queda fuera, useTheme rompe en runtime). Verifica las piezas + el ORDEN (provider antes
  // que el toggle → el toggle es descendiente del provider, que es justo lo que este estándar exige).
  let themeToggle = "";
  try { themeToggle = readFileSync(join(satDir, "src/components/ui/ThemeToggle.tsx"), "utf8"); } catch {}
  const provIdx = layout.indexOf("<Providers");
  const togIdx = layout.indexOf("<ThemeToggle");
  const toggleInsideProvider = provIdx !== -1 && togIdx !== -1 && provIdx < togIdx;
  chk("toggle de tema en el header, cableado al ThemeContext y DENTRO de <Providers> (ThemeToggle + useTheme)",
    /import\s+ThemeToggle\s+from\s+["']@\/components\/ui\/ThemeToggle["']/.test(layout) && toggleInsideProvider
      && /useTheme/.test(themeToggle) && /toggleTheme/.test(themeToggle)
      && existsSync(join(satDir, "src/context/ThemeContext.tsx")),
    "el LAYOUT debe importar y montar <ThemeToggle /> DENTRO de <Providers>, ThemeToggle.tsx usar useTheme()/toggleTheme, y existir src/context/ThemeContext.tsx");

  // ── CALIDAD DE CONTENIDO (ADR-013): cero artefactos de render visibles. El gate estructural mira QUE existan
  // las piezas; este check mira que el contenido no se vea ROTO ("undefined"/"null"/"[object Object]"/<p></p>/
  // tokens sin resolver). Cubre el punto ciego: estructura válida pero basura visible.
  const artifacts = scanContentArtifacts(satDir);
  chk(`contenido sin artefactos de render (undefined/null/[object Object]/<p></p>)${artifacts.length ? ` — ${artifacts.length} hallazgo(s)` : ""}`,
    artifacts.length === 0,
    artifacts.length ? artifacts.slice(0, 8).join(" · ") + (artifacts.length > 8 ? ` · …(+${artifacts.length - 8})` : "") : "");

  return { ok: problems.length === 0, problems, lines };
}

// Lanza si el gate falla. exit code convencional: exit 1.
export function assertLaunchReady(satDir) {
  const r = verifyLaunchReady(satDir);
  if (!r.ok) {
    const e = new Error(
      "gate de LAUNCH-READINESS FALLÓ — el satélite NO está listo para lanzar:\n" +
      r.problems.map((p) => "  - " + p).join("\n")
    );
    e.report = r;
    throw e;
  }
  return r;
}
