// EMITTER del builder (FB2, ECO-66 / ADR-012): IR común → satélite Next.js ENRIQUECIDO. Consume el IR lossless
// (FB0/FB1) y reconstruye: FIEL en los HECHOS (TODAS las páginas/copy/imágenes del IR se emiten) + CREATIVO en
// el DISEÑO (bloques → markup tokenizado em-ui, forma SAT01, código propio). Agnóstico de la fuente. REUSA el
// scaffold/layout/tema/SEO probados del generador (templates exportados) — no duplica. Imágenes REALES del IR
// colocadas (ADR-011, parte assets reales); la generación decorativa es aparte. El gate de emisión (lossless.mjs
// verifyEmit) verifica que NADA del IR se cae en el sitio.
//
// ESTÁNDAR PROFESIONAL (FB5, ECO-65 / ADR-013): formulario (Resend + Turnstile), favicon (sharp), 404, Cookiebot,
// a11y test (axe-core), Twitter Cards, FAQPage/Service JSON-LD. La función es ASYNC (favicon usa sharp → import()).
import { mkdirSync, writeFileSync, copyFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  emui, NEXT_CONFIG, TSCONFIG, POSTCSS, PROVIDERS, THEME_CONTEXT, DEFERRED_ANALYTICS,
  ROBOTS, SITEMAP, LAYOUT, buildJsonLd, themeInitScript, navLabel,
} from "../generate-satellite.mjs";
import { chrome, FALLBACK_LANG } from "../lib/i18n.mjs";
import { renderMain } from "./lib/emit-blocks.mjs";
import {
  CONTACT_ACTION, CONTACT_PAGE, CONTACT_FORM_COMPONENT, CONTACT_FORM_IMPORT, CONTACT_FORM_SECTION,
  NOT_FOUND_PAGE, WEBMANIFEST, A11Y_TEST, PLAYWRIGHT_CONFIG, generateFavicons,
} from "./lib/emit-professional.mjs";

// Detecta la ruta de contacto del cliente en el IR (cualquier variante: /contact, /contact-us, /contacto…).
// El formulario funcional se monta SIEMPRE en ESTA ruta (ADR-013 §2): si el cliente ya la trae, su contenido
// real se reconstruye fiel del IR + se le AÑADE el formulario; si no, se crea /contact sintética con el form.
const CONTACT_ROUTE_RE = /\/contact(o|-?us)?$/i;
const isContactRoute = (route) => CONTACT_ROUTE_RE.test(String(route || ""));

const slug = (s) => String(s || "site").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "site";
const isHex = (s) => typeof s === "string" && /^#[0-9a-fA-F]{6}$/.test(s.trim());

// Función auxiliar: detecta tipo de página para structured data por tipo (ADR-013 §5)
function pageJsonLdScript(page) {
  const route = page.route || "";
  const blocks = page.blocks || [];
  const isFaq = /faq/i.test(route) || blocks.some((b) => b.kind === "accordion" || (b.kind === "heading" && /\?/.test(b.text || "")));
  const isService = /services?/i.test(route) && blocks.some((b) => b.kind === "icon-box" || b.kind === "heading");

  if (isFaq) {
    const items = blocks.filter((b) => b.kind === "accordion" || (b.kind === "text-editor" && /\?/.test(b.text || "")));
    if (!items.length) return null;
    const j = (v) => JSON.stringify(v ?? "");
    const pairs = items.slice(0, 10).map((b) => {
      const lines = String(b.text || "").split(/\n/).map((l) => l.trim()).filter(Boolean);
      const q = lines[0] || b.text || "";
      const a = lines.slice(1).join(" ") || b.text || "";
      return `    { "@type": "Question", "name": ${j(q)}, "acceptedAnswer": { "@type": "Answer", "text": ${j(a)} } }`;
    });
    if (!pairs.length) return null;
    return `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [${pairs.join(",")}] }) }} />`;
  }
  if (isService) {
    const j = (v) => JSON.stringify(v ?? "");
    const boxes = blocks.filter((b) => b.kind === "icon-box").slice(0, 8);
    if (!boxes.length) return null;
    const offers = boxes.map((b) => {
      const lines = String(b.text || "").split(/\n/).map((l) => l.trim()).filter(Boolean);
      return `    { "@type": "Offer", "name": ${j(lines[0] || b.text)}, "description": ${j(lines.slice(1).join(" "))} }`;
    });
    return `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Service", "name": ${j(page.title)}, "offers": [${offers.join(",")}] }) }} />`;
  }
  return null;
}

// Emite el satélite desde el IR. opts: { brand?: "#hex", colorMode?: dark|light|system }.
// ASYNC: genera favicons via sharp (si está disponible).
export async function emitFromIR(ir, destDir, opts = {}) {
  const dest = resolve(destDir);
  const src = join(dest, "src");
  const app = join(src, "app");
  mkdirSync(app, { recursive: true });
  const trace = { dest, pages: [], media: [], emui: [], favicons: null };

  const siteName = ir.site?.name || "Site";
  const language = ir.site?.language || FALLBACK_LANG;
  const t = chrome(language);
  const colorMode = ["dark", "light", "system"].includes(opts.colorMode) ? opts.colorMode : "system";
  const brand = isHex(opts.brand) ? opts.brand.trim() : (isHex(ir.site?.brand) ? ir.site.brand.trim() : null);

  // --- scaffold forma-SAT01 (templates REUTILIZADOS del generador) ---
  writeFileSync(join(dest, "package.json"), JSON.stringify({
    name: `@em-ecosystem/sat-${slug(siteName)}`, version: "0.1.0", private: true,
    scripts: { dev: "next dev -p 3100", build: "next build", start: "next start -p 3100", lint: "eslint \"src/**/*.{ts,tsx}\"" },
    dependencies: {
      "@marsidev/react-turnstile": "^1.5.0",
      "@vercel/analytics": "^2.0.1", "@vercel/speed-insights": "^2.0.0",
      "lucide-react": "^1.14.0", next: "^16.2.6", react: "^19.2.6", "react-dom": "^19.2.6",
      resend: "^4.5.1",
    },
    devDependencies: {
      "@axe-core/playwright": "^4.10.0",
      "@playwright/test": "^1.49.0",
      "@tailwindcss/postcss": "^4.3.0", "@types/node": "^22.19.18",
      "@types/react": "^19.2.14", "@types/react-dom": "^19.2.3",
      eslint: "^9.39.4", "eslint-config-next": "^16.2.6",
      postcss: "^8.5.10", tailwindcss: "^4.3.0", typescript: "^6.0.3",
    },
    overrides: { next: { postcss: ">=8.5.10" } },
  }, null, 2) + "\n");
  writeFileSync(join(dest, "next.config.mjs"), NEXT_CONFIG);
  writeFileSync(join(dest, "tsconfig.json"), TSCONFIG);
  writeFileSync(join(dest, "postcss.config.mjs"), POSTCSS);
  writeFileSync(join(dest, "next-env.d.ts"), `/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n`);
  writeFileSync(join(dest, ".gitignore"), "/node_modules\n/.next\n/out\n/.preview.log\n");
  writeFileSync(join(dest, "playwright.config.ts"), PLAYWRIGHT_CONFIG());

  // --- em-ui: tokens + componentes (TurnstileWidget para el formulario; ThemeToggle para el cambio manual de
  //     tema del header, ECO-68 — vía registry, no copia local; jala IconButton/Tooltip + hooks/useTheme) ---
  trace.emui.push(emui(["init"], src).trim());
  for (const c of ["Button", "Badge", "Divider", "TurnstileWidget", "ThemeToggle"]) trace.emui.push(emui(["add", c], src).trim());
  writeFileSync(join(app, "globals.css"),
    `@import "../styles/em-ui-tokens.css";\n` +
    (brand ? `\n/* Marca del cliente → token de marca em-ui (accent). */\n:root { --color-accent: ${brand}; --color-accent-dark: ${brand}; }\n` : "") +
    `\nbody { font-family: var(--font-sans); }\n`);

  // --- tema dark/light (REUTILIZADO) ---
  mkdirSync(join(src, "context"), { recursive: true });
  writeFileSync(join(src, "context", "ThemeContext.tsx"), THEME_CONTEXT(colorMode));
  writeFileSync(join(app, "providers.tsx"), PROVIDERS);
  mkdirSync(join(src, "components"), { recursive: true });
  writeFileSync(join(src, "components", "DeferredAnalytics.tsx"), DEFERRED_ANALYTICS);

  // --- media REAL del IR → public/images/ (ingestión; ADR-011 assets reales) ---
  const pubDir = join(dest, "public");
  const imagesDir = join(pubDir, "images");
  const mediaWeb = new Map();   // id (basename) -> /images/<name>
  const used = new Set();
  for (const m of ir.media || []) {
    let file = m.file;
    try { if (!file || !statSync(file).isFile()) continue; } catch { continue; }
    if (mediaWeb.has(m.id)) continue;
    mkdirSync(imagesDir, { recursive: true });
    const ext = (String(m.id).match(/\.[a-z0-9]+$/i) || [".img"])[0].toLowerCase();
    const stem = slug(String(m.id).replace(/\.[a-z0-9]+$/i, "")) || "img";
    let name = stem + ext, i = 1; while (used.has(name)) name = `${stem}-${i++}${ext}`;
    used.add(name);
    copyFileSync(file, join(imagesDir, name));
    mediaWeb.set(String(m.id).toLowerCase(), `/images/${name}`);
    trace.media.push(`/images/${name}`);
  }
  // logo: la media marcada como logo, o por nombre; va al header (LAYOUT) si es local.
  const logoMedia = (ir.media || []).find((m) => /logo/i.test(m.id) && mediaWeb.has(String(m.id).toLowerCase()));
  const logoWeb = logoMedia ? mediaWeb.get(String(logoMedia.id).toLowerCase()) : null;

  // --- Favicons desde el logo real (ADR-013 §1 NUEVO, sharp) ---
  if (logoMedia?.file) {
    const favResult = await generateFavicons(logoMedia.file, pubDir, brand);
    trace.favicons = favResult;
    if (favResult.ok) {
      // site.webmanifest (necesita brand color + icons ya generados)
      writeFileSync(join(pubDir, "site.webmanifest"), WEBMANIFEST(siteName, brand));
    }
  } else {
    trace.favicons = { ok: false, reason: "no logo media in IR" };
  }
  // site.webmanifest siempre (incluso sin favicon images, el gate la necesita)
  if (!trace.favicons?.ok) {
    mkdirSync(pubDir, { recursive: true });
    writeFileSync(join(pubDir, "site.webmanifest"), WEBMANIFEST(siteName, brand));
  }

  // --- páginas + nav + SEO ---
  const pages = (ir.pages || []);
  const routes = pages.map((p) => p.route);
  const navPages = [pages.find((p) => p.route === "/"), ...pages.filter((p) => p.route !== "/")].filter(Boolean).slice(0, 6);
  const seo = {
    siteName, description: ir.site?.description || null, sector: null,
    email: null, phone: null, address: null, logo: logoWeb,
    nav: navPages.map((p) => ({ href: p.route, label: p.title || navLabel(p.route, t) })),
  };
  const jsonld = buildJsonLd(seo);
  trace.jsonldType = jsonld["@type"];
  // Layout con estándar profesional (ADR-013 §3 Cookiebot + §5 Twitter Cards + favicon links)
  writeFileSync(join(app, "layout.tsx"), LAYOUT(siteName, themeInitScript(colorMode), seo, jsonld, language, t, {
    cookiebot: true,
    favicons: true,
  }));

  // Ruta de contacto del cliente (la 1ª que matchea), o /contact sintética si no trae ninguna.
  const clientContactRoute = routes.find(isContactRoute) || null;
  const contactRoute = clientContactRoute || "/contact";
  const ctx = { siteName, t, media: mediaWeb, contactHref: contactRoute };
  for (const p of pages) {
    const seg = p.route === "/" ? "" : p.route.replace(/^\/+/, "");
    const dir = seg ? join(app, seg) : app;
    mkdirSync(dir, { recursive: true });
    const pageImages = (ir.media || []).filter((m) => (m.usedBy || []).includes(p.id))
      .map((m) => mediaWeb.get(String(m.id).toLowerCase())).filter(Boolean);
    // La página de contacto del cliente: contenido REAL del IR + formulario funcional AÑADIDO como sección.
    writeFileSync(join(dir, "page.tsx"), PAGE_FROM_IR(p, {
      ...ctx, isHome: p.route === "/", pageImages, withContactForm: isContactRoute(p.route),
    }));
    trace.pages.push(p.route);
  }

  // --- Estándar profesional (ADR-013 §1/§2): formulario de contacto FUNCIONAL SIEMPRE + 404 + a11y test ---
  // El formulario (client component ContactForm) se monta SIEMPRE en la página de contacto:
  //  · cliente YA trae página de contacto → su contenido real (arriba) + <ContactForm /> añadido (lossless).
  //  · cliente NO trae ninguna → /contact sintética (server component) que renderiza <ContactForm />.
  mkdirSync(join(src, "components"), { recursive: true });
  writeFileSync(join(src, "components", "ContactForm.tsx"), CONTACT_FORM_COMPONENT(t));
  if (!clientContactRoute) {
    mkdirSync(join(app, "contact"), { recursive: true });
    writeFileSync(join(app, "contact", "page.tsx"), CONTACT_PAGE(siteName, t));
    trace.pages.push("/contact");
  }
  // Server Action (siempre; el formulario lo invoca esté donde esté la página de contacto)
  mkdirSync(join(app, "actions"), { recursive: true });
  writeFileSync(join(app, "actions", "send-lead.ts"), CONTACT_ACTION());

  // 404 de marca
  writeFileSync(join(app, "not-found.tsx"), NOT_FOUND_PAGE(siteName, t));

  // Test de a11y (Playwright + axe-core) — incluye la ruta de contacto REAL del satélite
  mkdirSync(join(dest, "tests"), { recursive: true });
  const allRoutes = [...new Set([...routes, contactRoute])];
  writeFileSync(join(dest, "tests", "accessibility.spec.ts"), A11Y_TEST(allRoutes));

  writeFileSync(join(app, "robots.ts"), ROBOTS);
  writeFileSync(join(app, "sitemap.ts"), SITEMAP(routes));
  writeFileSync(join(dest, "ir.json"), JSON.stringify(ir, null, 2) + "\n");
  return trace;
}

// Página del IR → page.tsx (metadata per-página del SEO capturado + Twitter Cards + JSON-LD por tipo + <main>).
function PAGE_FROM_IR(page, ctx) {
  const j = (v) => JSON.stringify(v == null ? "" : v);
  const seo = page.seo || {};
  const title = seo.title || `${page.title || ctx.siteName}${page.route === "/" ? "" : " — " + ctx.siteName}`;
  const desc = seo.description || null;
  const main = renderMain(page, ctx);
  const jsonldBlock = pageJsonLdScript(page);
  // Página de contacto del cliente: contenido real del IR + formulario funcional como sección (ADR-013 §2).
  const withForm = !!ctx.withContactForm;
  return `import Image from "next/image";
import Button from "@/components/ui/Button";
${withForm ? CONTACT_FORM_IMPORT + "\n" : ""}
export const metadata = {
  title: { absolute: ${j(title)} },${desc ? `\n  description: ${j(desc)},` : ""}
  alternates: { canonical: ${j(page.route)} },
  openGraph: { type: "website", title: ${j(title)},${desc ? ` description: ${j(desc)},` : ""} url: ${j(page.route)} },
  twitter: { card: "summary_large_image" as const, title: ${j(title)}${desc ? `, description: ${j(desc)}` : ""} },
};

export default function Page() {
  return (
    <main className="bg-surface-primary text-content-primary">
${main}${withForm ? `\n${CONTACT_FORM_SECTION}` : ""}${jsonldBlock ? `\n      ${jsonldBlock}` : ""}
    </main>
  );
}
`;
}
