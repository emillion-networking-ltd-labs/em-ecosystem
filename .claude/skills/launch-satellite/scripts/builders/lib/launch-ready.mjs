// Gate de LAUNCH-READINESS (FB5, ECO-65 / ADR-013). Verifica que el satélite emitido cumple el ESTÁNDAR
// PROFESIONAL COMPLETO antes de declararlo "lanzado". Igual que el gate lossless (verifyEmit) caza contenido
// caído, este gate caza INDISPENSABLES que falten → nada sale a medias. Extensible: añadir un indispensable
// aquí + en emit.mjs (núcleo común) → lo heredan TODOS los builders automáticamente (ADR-013 §7).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

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

  // ── Formulario de contacto/lead funcional (ADR-013 §2: Vercel Server Action + Resend + Turnstile)
  chk("contact/page.tsx (formulario)", existsSync(join(satDir, "src/app/contact/page.tsx")));
  chk("actions/send-lead.ts (Server Action + Resend + Turnstile)",
    existsSync(join(satDir, "src/app/actions/send-lead.ts")));

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
