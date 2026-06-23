#!/usr/bin/env node
// Motor de generación del skill /launch-satellite (ECO-25, F2b). brief.json -> satélite S2-ready.
// Pipeline determinista, NO greenfield: scaffold forma-SAT01 + reuse de UI SOLO via `em-ui add`
// (cierre transitivo) + `em-ui init` (tokens) + relleno desde el brief. Los `missing` -> placeholders
// visibles, NUNCA datos fabricados. NO despliega (eso es F3).
import { mkdirSync, writeFileSync, existsSync, copyFileSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { validateBrief, briefIntent, briefColorMode, briefSiteType, briefComposition, DEFAULT_INTENT } from "./lib/brief.mjs";
import { chrome, FALLBACK_LANG } from "./lib/i18n.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "../../../..");        // scripts -> satellite -> skills -> .claude -> root
const EM_UI = join(REPO_ROOT, "design-system", "registry", "cli.mjs");

// Componentes UI por defecto de un sitio marketing (existen en el registry). Reuse, no greenfield.
export const DEFAULT_COMPONENTS = ["Button", "Badge", "Divider"];
// Biblioteca de SECCIONES nivel-2 (ECO-54): el generador COMPONE la página desde ellas. `em-ui add <Section>`
// jala cada sección + su cierre transitivo de átomos/hooks (misma vía que los componentes de nivel 1).
export const DEFAULT_SECTIONS = ["Hero", "Services", "CTA", "Contact"];

function slugify(s) { return String(s || "demo").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "demo"; }
export function val(field, label, intent = DEFAULT_INTENT) {
  // Split verdad/diseño (D4) + latitud de fidelidad:
  // - HECHO confirmado (provided/extracted) → se usa intacto, en los TRES modos.
  // - proposed (creatividad/sugerencia a confirmar) → se usa en remodel/reimagine (es el preview a confirmar),
  //   pero en réplica (a-replica) NO se renderiza (la réplica solo refleja hechos confirmados) → [PENDIENTE].
  // - missing/ausente → placeholder visible. NUNCA se fabrica (no-inventar sobre los hechos).
  const p = field?.provenance;
  const has = field && field.value != null && field.value !== "";
  if ((p === "provided" || p === "extracted") && has) return field.value;
  if (p === "proposed" && has) return intent === "a-replica" ? `[PENDIENTE: ${label}]` : field.value;
  return `[FALTA: ${label}]`;
}
export function emui(args, destSrc) {
  return execFileSync("node", [EM_UI, ...args, "--dest", destSrc], { cwd: REPO_ROOT, encoding: "utf8" });
}

// Color de marca del brief → hex para overridear el token `accent` (marca de primera clase, ECO-54).
// Acepta f.brandColors (array, primer hex), f.brandTokens (value.primary|brand|accent o string) o f.brandColor.
// Respeta el split D4: provided/extracted siempre; proposed solo fuera de réplica (a-replica). null si no hay hex.
function brandAccent(brief, intent) {
  const f = brief.fields || {};
  const field = f.brandColors || f.brandTokens || f.brandColor;
  if (!field) return null;
  const p = field.provenance;
  if (!(p === "provided" || p === "extracted" || (p === "proposed" && intent !== "a-replica"))) return null;
  const v = field.value;
  const hex = Array.isArray(v) ? v[0] : (v && typeof v === "object" ? (v.primary || v.brand || v.accent) : v);
  return typeof hex === "string" && /^#[0-9a-fA-F]{6}$/.test(hex.trim()) ? hex.trim() : null;
}

// Normalizadores Batch-2 (ECO-55): valor del brief → props de la sección. Filtran items inválidos y
// devuelven null si no queda nada → la sección se OMITE. Nunca rellenan ni fabrican.
const asArr = (v) => (Array.isArray(v) ? v : null);
function normTestimonials(v) {
  const a = asArr(v); if (!a) return null;
  const items = a.filter((t) => t && typeof t === "object").map((t) => ({ name: t.name || t.author, quote: t.quote || t.text, result: t.result }))
    .filter((t) => t.name && t.quote).map((t) => (t.result ? { name: t.name, quote: t.quote, result: t.result } : { name: t.name, quote: t.quote }));
  return items.length ? items : null;
}
function normPlans(v) {
  const a = asArr(v); if (!a) return null;
  const items = a.filter((p) => p && typeof p === "object").map((p) => {
    const o = { name: p.name || p.title, price: p.price != null ? String(p.price) : null, highlighted: !!p.highlighted };
    if (p.period) o.period = p.period;
    if (p.description || p.desc) o.description = p.description || p.desc;
    if (Array.isArray(p.features)) { const fs = p.features.filter((x) => typeof x === "string"); if (fs.length) o.features = fs; }
    if (p.cta) o.cta = p.cta;
    return o;
  }).filter((p) => p.name && p.price);
  return items.length ? items : null;
}
function normPortfolio(v) {
  const a = asArr(v); if (!a) return null;
  const items = a.map((it) => (typeof it === "string" ? { title: it } : (it && typeof it === "object" ? { title: it.title || it.name, description: it.description || it.desc, imageSrc: it.imageSrc || it.image || it.src, href: it.href || it.url } : null)))
    .filter((it) => it && it.title).map((it) => { const o = { title: it.title }; if (it.description) o.description = it.description; if (it.imageSrc) o.imageSrc = it.imageSrc; if (it.href) o.href = it.href; return o; });
  return items.length ? items : null;
}
function normFaqs(v) {
  const a = asArr(v); if (!a) return null;
  const items = a.filter((q) => q && typeof q === "object").map((q) => ({ question: q.question || q.q, answer: q.answer || q.a }))
    .filter((q) => q.question && q.answer).map((q) => ({ question: q.question, answer: q.answer }));
  return items.length ? items : null;
}

// F7a (ECO-61, pilar P5 / ADR-011 — USAR ASSETS REALES): resuelve un path de asset a un FICHERO LEGIBLE real.
// Acepta rutas absolutas, relativas al repo o al cwd. Las URLs http(s) NO son ficheros locales (no se copian).
// Devuelve la ruta absoluta del fichero o null. No fabrica nada: solo encuentra lo que YA existe.
function realAssetFile(pathStr) {
  if (typeof pathStr !== "string" || !pathStr || /^https?:\/\//i.test(pathStr)) return null;
  const cands = [
    isAbsolute(pathStr) ? pathStr : null,
    resolve(REPO_ROOT, pathStr.replace(/^\/+/, "")),
    resolve(pathStr),
  ].filter(Boolean);
  for (const c of cands) {
    try { if (statSync(c).isFile()) return c; } catch {}
  }
  return null;
}

// JSON-LD site-wide (F5): de los HECHOS del cliente. LocalBusiness SOLO si hay dirección real (su rasgo
// definitorio); si no, Organization. JAMÁS se inventa un negocio local (guardrail §D4). url/logo los
// completa el layout a runtime con SITE_URL (no se hornean aquí porque dependen del env del deploy).
export function buildJsonLd(seo) {
  const isLocal = !!seo.address;
  const ld = { "@context": "https://schema.org", "@type": isLocal ? "LocalBusiness" : "Organization", name: seo.siteName };
  if (seo.description) ld.description = seo.description;
  if (isLocal) {
    ld.address = { "@type": "PostalAddress", streetAddress: seo.address };
    if (seo.phone) ld.telephone = seo.phone;
  }
  return ld;
}

// Composición de la HOME (F6): lista ordenada de {section,variant?}. El generador omite las secciones sin
// datos (guardrail §D4). DEFAULT = el orden de hoy (retrocompatible). compositionFor da la "recomendación"
// por tipo de sitio (la cara de la válvula "que la IA recomiende"); el agente puede sobreescribir con una
// composition explícita en el brief.
const DEFAULT_HOME_COMPOSITION = [
  { section: "Hero" }, { section: "Services" }, { section: "Portfolio" },
  { section: "Testimonials" }, { section: "Pricing" }, { section: "FAQ" }, { section: "CTA" },
];
function compositionFor(siteType) {
  switch (siteType) {
    case "landing":   // one-page: todo en la home, cierre de marca
      return [{ section: "Hero" }, { section: "Services" }, { section: "Testimonials" },
        { section: "Pricing" }, { section: "FAQ" }, { section: "CTA", variant: "brand" }];
    case "portfolio": // trabajo por delante
      return [{ section: "Hero" }, { section: "Portfolio", variant: "featured" }, { section: "Testimonials" },
        { section: "Services" }, { section: "Contact" }, { section: "CTA" }];
    default:          // business-multipage / other → el orden por defecto
      return DEFAULT_HOME_COMPOSITION;
  }
}

export function generateSatellite(brief, destDir, { sections = DEFAULT_SECTIONS } = {}) {
  const { ok, problems } = validateBrief(brief);
  if (!ok) throw new Error(`brief inválido: ${problems.join("; ")}`);

  const name = brief.identity?.name?.value || "Demo";
  const slug = slugify(name);
  const dest = resolve(destDir);
  const src = join(dest, "src");
  const app = join(src, "app");
  mkdirSync(app, { recursive: true });

  const routes = (brief.targetRoutes && brief.targetRoutes.length ? brief.targetRoutes : ["/", "/servicios", "/contacto"]);
  const intent = briefIntent(brief);   // gate de fidelidad (D4): a-replica | b-remodel (default) | c-reimagine
  const trace = { slug, dest, intent, components: [], sections: [], emui: [], placeholders: [], proposed: [] };

  // Resuelve un campo aplicando el split D4 + la latitud del intent, y deja traza para el LOOP:
  // un `proposed` rendido (B/C) entra en trace.proposed (lo que el cliente confirma → provided).
  const fillField = (field, label, key) => {
    const text = val(field, label, intent);
    if (text.startsWith("[FALTA") || text.startsWith("[PENDIENTE")) trace.placeholders.push(key);
    else if (field?.provenance === "proposed") trace.proposed.push(key);   // rendido como propuesta (preview a confirmar)
    return text;
  };

  // --- a. Scaffold forma-satélite (config) ---
  writeFileSync(join(dest, "package.json"), JSON.stringify({
    name: `@em-ecosystem/sat-${slug}`, version: "0.1.0", private: true,
    scripts: { dev: "next dev -p 3100", build: "next build", start: "next start -p 3100", lint: "eslint \"src/**/*.{ts,tsx}\"" },
    dependencies: { "@vercel/analytics": "^2.0.1", "@vercel/speed-insights": "^2.0.0", "lucide-react": "^1.14.0", next: "^16.2.6", react: "^19.2.6", "react-dom": "^19.2.6" },
    devDependencies: { "@tailwindcss/postcss": "^4.3.0", "@types/node": "^22.19.18", "@types/react": "^19.2.14", "@types/react-dom": "^19.2.3", eslint: "^9.39.4", "eslint-config-next": "^16.2.6", postcss: "^8.5.10", tailwindcss: "^4.3.0", typescript: "^6.0.3" },
    overrides: { next: { postcss: ">=8.5.10" } },
  }, null, 2) + "\n");

  writeFileSync(join(dest, "next.config.mjs"), NEXT_CONFIG);
  writeFileSync(join(dest, "tsconfig.json"), TSCONFIG);
  writeFileSync(join(dest, "postcss.config.mjs"), POSTCSS);
  writeFileSync(join(dest, "next-env.d.ts"), `/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n`);
  writeFileSync(join(dest, ".gitignore"), "/node_modules\n/.next\n/out\n/.preview.log\n");

  // --- b. Reuse SOLO via em-ui: capa de tokens. Las SECCIONES se añaden más abajo, SOLO las que el brief
  // tiene datos para componer (em-ui add dinámico) — cada `add` jala su cierre de átomos/hooks. ---
  trace.emui.push(emui(["init"], src).trim());

  // --- c. globals.css: capa de tokens + (si el brief aporta marca) override del token de marca `accent` ---
  const brand = brandAccent(brief, intent);
  if (brand) trace.brand = brand;
  writeFileSync(join(app, "globals.css"),
    `@import "../styles/em-ui-tokens.css";\n` +
    (brand ? `\n/* Marca del cliente (brandTokens del brief) → token de marca em-ui (accent). */\n:root { --color-accent: ${brand}; --color-accent-dark: ${brand}; }\n` : "") +
    `\nbody { font-family: var(--font-sans); }\n`);

  // --- maquinaria de TEMA dark/light (paridad SAT01, GENÉRICA): ThemeProvider + init-script anti-FOUC.
  // El DEFAULT lo parametriza colorMode del brief (NO hardcodeado dark). useTheme nunca rompe (hay provider).
  const colorMode = briefColorMode(brief);   // dark | light | system (default system)
  trace.colorMode = colorMode;
  mkdirSync(join(src, "context"), { recursive: true });
  writeFileSync(join(src, "context", "ThemeContext.tsx"), THEME_CONTEXT(colorMode));
  writeFileSync(join(app, "providers.tsx"), PROVIDERS);

  // --- nombre del negocio (hecho) — usado por el layout (SEO) y por las páginas. El layout se escribe MÁS
  //     ABAJO, tras computar los hechos SEO (logo/dirección/teléfono) que alimentan OG + JSON-LD. ---
  const siteName = fillField(brief.identity?.name, "nombre del negocio", "identity.name");
  // i18n base (ECO-58): el idioma REAL del brief manda en <html lang> (SEO/a11y); el CHROME usa su catálogo
  // o el fallback. NO traduce el contenido del cliente (§D4). Antes: lang="es" + labels hardcodeados en ES.
  const language = brief.identity?.language?.value || FALLBACK_LANG;
  const t = chrome(language);
  mkdirSync(join(src, "components"), { recursive: true });
  writeFileSync(join(src, "components", "DeferredAnalytics.tsx"), DEFERRED_ANALYTICS);

  // --- páginas: el generador COMPONE desde la biblioteca de secciones (ECO-54), rellenadas con HECHOS del
  // brief. Guardrail §D4: solo provided/extracted (y proposed fuera de réplica); lo ausente se OMITE (no se
  // inventa contenido, no se rinde placeholder feo). Los labels de UI (eyebrow/nav/CTA) son chrome, no contenido.
  const f = brief.fields || {};
  const fact = (field) => {
    const p = field?.provenance;
    const has = field && field.value != null && field.value !== "" && !(Array.isArray(field.value) && !field.value.length);
    if ((p === "provided" || p === "extracted") && has) return field.value;
    if (p === "proposed" && has && intent !== "a-replica") return field.value;
    return null;
  };
  const track = (key, field) => {
    const v = fact(field);
    if (v == null) trace.placeholders.push(key);
    else if (field?.provenance === "proposed") trace.proposed.push(key);
    return v;
  };

  // --- F7a (ECO-61, P5): INGESTIÓN de ASSETS REALES → public/images/ del satélite, renderizados con next/image.
  // SOLO assets reales (provided/extracted) cuyo path apunte a un fichero legible; jamás proposed/missing ni
  // generados (eso es F7b). Devuelve la ruta web "/images/<file>" o null (→ on-screen se OMITE con gracia).
  const imagesDir = join(dest, "public", "images");
  const ingestedByFile = new Map();      // dedup por fichero origen
  const usedNames = new Set();
  trace.assets = [];
  const ingestPath = (pathStr, provenance, preferredName) => {
    if (!(provenance === "provided" || provenance === "extracted")) return null;
    if (typeof pathStr === "string" && /^https?:\/\//i.test(pathStr)) return pathStr;   // remoto real → tal cual (OG/JSON-LD; sin copia)
    const file = realAssetFile(pathStr);
    if (!file) return null;
    if (ingestedByFile.has(file)) return ingestedByFile.get(file);
    mkdirSync(imagesDir, { recursive: true });
    const ext = (file.match(/\.[A-Za-z0-9]+$/) || [".img"])[0].toLowerCase();
    const stem = (preferredName || file.split(/[/\\]/).pop().replace(/\.[A-Za-z0-9]+$/, ""))
      .toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "img";
    let name = stem + ext, i = 1;
    while (usedNames.has(name)) name = `${stem}-${i++}${ext}`;
    usedNames.add(name);
    copyFileSync(file, join(imagesDir, name));
    const web = `/images/${name}`;
    ingestedByFile.set(file, web);
    trace.assets.push(web);
    return web;
  };
  const ingestAsset = (fld, preferredName) => (fld ? ingestPath(fld.value, fld.provenance, preferredName) : null);

  const sector = track("identity.sector", brief.identity?.sector);
  const tagline = track("tagline", f.slogan || f.tagline || f.subtitle);
  const rawServices = track("services", f.services);
  const servicesProv = (f.services)?.provenance;
  const serviceItems = Array.isArray(rawServices)
    ? rawServices.map((s, i) => {
        const o = typeof s === "string" ? { title: s } : { title: s.title || s.name || String(s), description: s.description || s.desc };
        const img = (s && typeof s === "object") ? ingestPath(s.image || s.imageSrc || s.photo, servicesProv, `service-${i + 1}`) : null;
        if (img) o.imageSrc = img;          // foto REAL opcional por servicio (omit-if-absent)
        return o;
      })
    : null;
  const email = track("contactEmail", f.contactEmail);
  const phone = track("contactPhone", f.contactPhone);
  const address = track("address", f.address);
  // Batch-2 (ECO-55): solo HECHOS reales; ausentes → null → sección OMITIDA. JAMÁS inventar testimonios/precios.
  const testimonials = normTestimonials(track("testimonials", f.testimonials));
  const plans = normPlans(track("pricing", f.pricing || f.plans));
  // Portfolio: items reales del brief; sus imágenes (si son ficheros reales) se ingieren. Más una GALERÍA de
  // fotos reales (f.gallery/photos/images) → tiles solo-imagen. F7a: solo reales; sin imagen real → omit-if-absent.
  const portfolioField = f.portfolio || f.projects;
  let portfolioItems = normPortfolio(track("portfolio", portfolioField));
  if (portfolioItems) portfolioItems = portfolioItems.map((it, i) => {
    const img = ingestPath(it.imageSrc, portfolioField?.provenance, `work-${i + 1}`);
    const o = { ...it }; if (img) o.imageSrc = img; else delete o.imageSrc; return o;
  });
  const galleryField = f.gallery || f.photos || f.images;
  const galleryProv = galleryField?.provenance;
  if (Array.isArray(galleryField?.value) && (galleryProv === "provided" || galleryProv === "extracted")) {
    const tiles = galleryField.value.map((p, i) => {
      const path = typeof p === "string" ? p : (p && (p.src || p.path || p.imageSrc || p.value));
      const img = ingestPath(path, galleryProv, `gallery-${i + 1}`);
      if (!img) return null;
      const o = { imageSrc: img };
      const title = (p && typeof p === "object") ? (p.title || p.caption) : null;
      if (title) o.title = title;          // título solo si es REAL; si no, tile solo-imagen
      return o;
    }).filter(Boolean);
    if (tiles.length) portfolioItems = (portfolioItems || []).concat(tiles);
  }
  // Hero: foto REAL de portada (opcional). Sin ella → hero de solo texto (omit-if-absent).
  const heroImage = ingestAsset(f.heroImage || f.hero || f.coverImage || f.cover, "hero");
  const faqs = normFaqs(track("faqs", f.faqs || f.faq));
  const contactRoute = routes.find((r) => /contact/i.test(r)) || "/contact";
  const servicesRoute = routes.find((r) => /servic/i.test(r)) || null;
  const portfolioRoute = routes.find((r) => /portfolio|proyecto|trabajo/i.test(r)) || null;
  const pricingRoute = routes.find((r) => /precio|pricing|tarifa|plan/i.test(r)) || null;
  // F6: tipo de sitio + composición de la home. La IA PROPONE (composition en el brief) y el cliente confirma;
  // si no hay composition explícita, se usa la recomendada por tipo (válvula "la IA recomienda") o el default.
  // El generador la HONRA pero omite cualquier sección sin datos reales (guardrail §D4) — más abajo, en PAGE.
  const siteType = briefSiteType(brief);
  if (brief.siteType !== undefined) track("siteType", brief.siteType);
  const composition = briefComposition(brief) || compositionFor(siteType);
  trace.siteType = siteType;
  trace.compositionSource = briefComposition(brief) ? "brief" : (siteType ? `type:${siteType}` : "default");
  const ctx = { siteName, sector, tagline, serviceItems, email, phone, address, testimonials, plans,
    portfolioItems, faqs, contactRoute, servicesRoute, portfolioRoute, pricingRoute, composition, t, heroImage };

  // --- SEO de fábrica (F5/P1): el layout lleva metadata + Open Graph + JSON-LD site-wide + landmarks. ---
  // F7a: el logo REAL se INGIERE a public/images/ → va EN PANTALLA (header) y también a OG/JSON-LD. Solo si es
  // un fichero real del cliente (extracted/provided); si no, no hay logo on-screen (omit-if-absent, no inventa).
  const logoSrc = ingestAsset(f.logo || f.logoCandidate, "logo");
  const seo = {
    siteName, description: tagline || null, sector, email, phone, address,
    logo: logoSrc,
    nav: routes.map((r) => ({ href: r, label: navLabel(r, t) })),
  };
  const jsonld = buildJsonLd(seo);   // LocalBusiness SOLO si hay dirección real; si no, Organization (§D4)
  trace.jsonldType = jsonld["@type"];
  trace.language = language;
  if (seo.logo) trace.logo = seo.logo;
  writeFileSync(join(app, "layout.tsx"), LAYOUT(siteName, themeInitScript(colorMode), seo, jsonld, language, t));

  // em-ui add DINÁMICO: solo las secciones que el brief tiene datos para componer (la shell base siempre).
  const usedSections = new Set(["Hero", "CTA", "Contact"]);
  if (serviceItems) usedSections.add("Services");
  if (testimonials) usedSections.add("Testimonials");
  if (plans) usedSections.add("Pricing");
  if (portfolioItems) usedSections.add("Portfolio");
  if (faqs) usedSections.add("FAQ");
  for (const s of [...usedSections].sort()) { trace.emui.push(emui(["add", s], src).trim()); trace.sections.push(s); }

  for (const route of routes) {
    const seg = route === "/" ? "" : route.replace(/^\//, "");
    const dir = seg ? join(app, seg) : app;
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "page.tsx"), PAGE(route, ctx));
  }

  writeFileSync(join(app, "robots.ts"), ROBOTS);
  writeFileSync(join(app, "sitemap.ts"), SITEMAP(routes));

  // --- d. Persistir el brief como PROCEDENCIA (D5 del norte): viaja commiteado con el satélite, en su
  // RAÍZ (<dest>/brief.json, FUERA de public/ → Next no lo sirve). Se escribe TAL CUAL el brief consumido
  // (cada campo con su provenance + source intactos, incluidas rutas a .satellite-intake/ = procedencia
  // histórica). El material CRUDO del cliente sigue efímero; esto es solo la destilación sanitizada.
  writeFileSync(join(dest, "brief.json"), JSON.stringify(brief, null, 2) + "\n");
  trace.brief = "brief.json";

  return trace;
}

// ---- plantillas (derivadas de la forma SAT01) ----
export const NEXT_CONFIG = `import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
// Baseline de seguridad S2 (6 cabeceras) aplicado a toda ruta.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() { return [{ source: "/(.*)", headers: securityHeaders }]; },
  turbopack: { root: __dirname },
};
export default nextConfig;
`;
export const TSCONFIG = JSON.stringify({
  compilerOptions: { lib: ["dom", "dom.iterable", "esnext"], allowJs: true, skipLibCheck: true, strict: true, noEmit: true, esModuleInterop: true, module: "esnext", moduleResolution: "bundler", resolveJsonModule: true, isolatedModules: true, jsx: "react-jsx", incremental: true, plugins: [{ name: "next" }], paths: { "@/*": ["./src/*"] }, target: "ES2017" },
  include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"], exclude: ["node_modules"],
}, null, 2) + "\n";
export const POSTCSS = `/** @type {import('postcss-load-config').Config} */\nconst config = { plugins: { '@tailwindcss/postcss': {} } };\nexport default config;\n`;
// opts: { cookiebot?: boolean, favicons?: boolean } — activados por el emitter (FB5, ECO-65).
// cookiebot: añade script Cookiebot CMP (GDPR, Consent Mode v2) en <head> + analytics condicionado.
// favicons: añade <link> tags al <head> para favicon.png/svg, apple-touch-icon, manifest.
export const LAYOUT = (siteName, initScript, seo, jsonld, language, t, opts = {}) => {
  const j = (v) => JSON.stringify(v);
  const navLis = seo.nav
    .map((n) => `            <li><Link href={${j(n.href)}} className="text-body text-content-secondary transition-colors hover:text-accent">{${j(n.label)}}</Link></li>`)
    .join("\n");
  const footerContact = [seo.phone, seo.email].filter(Boolean);
  // F7a: el logo REAL LOCAL (ya ingerido a /images/) va EN PANTALLA en el header con next/image. Un logo remoto
  // (URL) alimenta OG/JSON-LD pero no se renderiza con next/image (evita config de dominios) → marca textual.
  // Sin logo → marca textual (omit-if-absent, nunca un placeholder).
  const localLogo = typeof seo.logo === "string" && seo.logo.startsWith("/images/");
  const imageImport = localLogo ? `\nimport Image from "next/image";` : "";
  const brandEl = localLogo
    ? `<Link href="/" className="flex items-center" aria-label={${j(siteName)}}>
              <span className="relative block h-9 w-36"><Image src=${j(seo.logo)} alt={${j(siteName)}} fill priority sizes="144px" className="object-contain object-left" /></span>
            </Link>`
    : `<Link href="/" className="text-h3 font-bold text-content-primary">{${j(siteName)}}</Link>`;

  // ECO-65/FB5 additions
  const scriptImport = opts.cookiebot ? `\nimport Script from "next/script";` : "";
  const cookiebotScript = opts.cookiebot
    ? `\n        {process.env.NEXT_PUBLIC_COOKIEBOT_ID ? <Script id="Cookiebot" src="https://consent.cookiebot.com/uc.js" data-cbid={process.env.NEXT_PUBLIC_COOKIEBOT_ID} type="text/javascript" strategy="beforeInteractive" /> : null}`
    : "";
  const faviconLinks = opts.favicons
    ? `\n        <link rel="icon" type="image/png" href="/favicon.png" />\n        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />\n        <link rel="manifest" href="/site.webmanifest" />`
    : "";
  const analyticsEl = opts.cookiebot
    ? `{/* Analytics condicionado a consentimiento Cookiebot (Consent Mode v2, ADR-013 §3). */}\n        {!process.env.NEXT_PUBLIC_COOKIEBOT_ID && <DeferredAnalytics />}`
    : `{/* Observabilidad diferida: no bloquea el main-thread (S2 Performance). */}\n        <DeferredAnalytics />`;
  // Twitter Cards site-level (ECO-65/FB5 SEO ampliado)
  const twitterMeta = `\n  twitter: { card: "summary_large_image" as const, title: ${j(siteName)}${seo.description ? `, description: ${j(seo.description)}` : ""}${seo.logo ? `, images: [${j(seo.logo)}]` : ""} },`;

  return `import type { Metadata } from "next";
import Link from "next/link";${imageImport}${scriptImport}
import DeferredAnalytics from "@/components/DeferredAnalytics";
import Providers from "./providers";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.vercel.app";

// SEO de fábrica (ECO-56/F5): metadata + Open Graph + Twitter Cards site-wide.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: ${j(siteName)}, template: ${j(`%s · ${siteName}`)} },${seo.description ? `\n  description: ${j(seo.description)},` : ""}
  openGraph: {
    type: "website",
    siteName: ${j(siteName)},
    title: ${j(siteName)},
    url: SITE_URL,${seo.description ? `\n    description: ${j(seo.description)},` : ""}${seo.logo ? `\n    images: [${j(seo.logo)}],` : ""}
  },${twitterMeta}
};

// JSON-LD (Google recomienda JSON-LD): ${jsonld["@type"]} de los HECHOS del cliente (nunca inventado).
const JSONLD = ${j(jsonld)};

// Anti-FOUC (ECO-48): fija la clase \`dark\` en <html> ANTES del primer paint. Síncrono → sin flash.
const THEME_INIT_SCRIPT = ${j(initScript)};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const ld = { ...JSONLD, url: SITE_URL${seo.logo ? `, logo: ${j(seo.logo)}.startsWith("http") ? ${j(seo.logo)} : SITE_URL + ${j(seo.logo)}` : ""} };
  return (
    <html lang="${language}">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />${faviconLinks}${cookiebotScript}
      </head>
      <body>
        <header className="border-b border-border-default">
          <nav aria-label="${t.navAria}" className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
            ${brandEl}
            <ul className="hidden gap-6 sm:flex">
${navLis}
            </ul>
          </nav>
        </header>
        {/* ThemeProvider (dark/light + toggle) envuelve la app → useTheme nunca rompe. */}
        <Providers>{children}</Providers>
        <footer className="border-t border-border-default">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-10 text-caption text-content-tertiary">
            <p>© {new Date().getFullYear()} {${j(siteName)}}</p>${footerContact.length ? `\n            <p>{${j(footerContact.join(" · "))}}</p>` : ""}
            <p className="mt-2">Powered by <span className="font-medium text-content-secondary">EM Ecosystem</span></p>
          </div>
        </footer>
        ${analyticsEl}
      </body>
    </html>
  );
}
`;
};

// --- maquinaria de TEMA (GENÉRICA, modelada en SAT01 proven): default parametrizado por colorMode ---
// initScript anti-FOUC: añade `dark` a <html> antes del paint. dark → salvo 'light' guardado;
// light → solo si 'dark' guardado; system → preferencia guardada o prefers-color-scheme.
export const themeInitScript = (mode) => {
  const decide = mode === "light"
    ? "t==='dark'"
    : mode === "system"
      ? "(t==='dark'||t==='light' ? t==='dark' : (window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches))"
      : "t!=='light'";   // dark (default de la marca cuando el cliente lo elige)
  const onError = mode === "light" ? "" : "document.documentElement.classList.add('dark')";
  return `(function(){try{var t=localStorage.getItem('theme');if(${decide}){document.documentElement.classList.add('dark')}}catch(e){${onError}}})()`;
};

export const PROVIDERS = `"use client";

import ThemeProvider from "@/context/ThemeContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
`;

// ThemeContext GENÉRICO: el default (dark/light/system) lo fija DEFAULT_MODE (parametrizado por el brief).
export const THEME_CONTEXT = (mode) => `"use client";

import { createContext, useState, useEffect, useCallback } from "react";

type Theme = "light" | "dark";
type ColorMode = "dark" | "light" | "system";
// Modo por defecto elegido en el onboarding (ECO-48): "dark" | "light" | "system". No hardcodeado.
// Tipo ANCHO (no el literal) para que las comparaciones de las 3 ramas type-checkeen.
const DEFAULT_MODE: ColorMode = ${JSON.stringify(mode)};

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function systemTheme(): Theme {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "dark";
}

function defaultTheme(): Theme {
  if (DEFAULT_MODE === "light") return "light";
  if (DEFAULT_MODE === "system") return systemTheme();
  return "dark";
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Estado inicial SSR-safe; el init-script ya fijó la clase antes del paint, el effect reconcilia.
  const [theme, setThemeState] = useState<Theme>(DEFAULT_MODE === "light" ? "light" : "dark");
  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    const initial: Theme = stored === "light" || stored === "dark" ? stored : defaultTheme();
    setThemeState(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
`;

// ECO-39: monta @vercel/analytics + speed-insights ON-IDLE (fuera del hilo crítico de hydration)
// para no inflar el Total Blocking Time. Son scripts INVISIBLES → el render visible no cambia (VRT verde).
export const DEFERRED_ANALYTICS = `"use client";
import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function DeferredAnalytics() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(() => setReady(true), { timeout: 4000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(() => setReady(true), 2500);
    return () => clearTimeout(t);
  }, []);
  if (!ready) return null;
  return (
    <>
      <SpeedInsights />
      <Analytics />
    </>
  );
}
`;
// El label "Inicio"/"Home" es CHROME (del catálogo i18n); el label de una ruta no-home se deriva de su SLUG
// (que ya viene en el idioma del cliente vía targetRoutes), así que es language-neutral.
export const navLabel = (route, t) => {
  if (route === "/") return t.navHome;
  const seg = route.replace(/^\/+|\/+$/g, "");
  return seg ? seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ") : t.navHome;
};

// Compone la página desde la biblioteca de SECCIONES (ECO-54), rellenada con HECHOS del brief (ctx).
// Solo importa las secciones que usa; lo ausente se omite (no se inventa). Labels de UI = chrome permitido.
const PAGE = (route, ctx) => {
  const { siteName, sector, tagline, serviceItems, email, phone, address, testimonials, plans,
    portfolioItems, faqs, contactRoute, servicesRoute, portfolioRoute, pricingRoute, composition, t, heroImage } = ctx;
  const j = (v) => JSON.stringify(v);
  const used = new Set();
  const blocks = [];
  const add = (name, jsx) => { used.add(name); blocks.push(jsx); };

  // Builders de bloque (eyebrow/título = labels de UI; el CONTENIDO sale de los hechos del brief).
  // `variant` (opcional) viene de la composición elegida (F6) y sobreescribe el default de la sección.
  const va = (variant, def) => (variant ? ` variant=${j(variant)}` : def ? ` variant="${def}"` : "");
  const heroBlock = (soft, variant) => `<Hero${va(variant, soft ? "soft" : "")}${sector ? ` eyebrow={${j(sector)}}` : ""} title={${j(soft ? navLabel(route, t) : siteName)}}${tagline && !soft ? ` subtitle={${j(tagline)}}` : ""} ctaText="${t.ctaContact}" ctaHref={${j(contactRoute)}}${servicesRoute && !soft ? ` secondaryCtaText="${t.ctaSeeServices}" secondaryCtaHref={${j(servicesRoute)}}` : ""}${heroImage && !soft ? ` imageSrc=${j(heroImage)} imageAlt=${j(siteName)}` : ""} />`;
  const servicesBlock = (full, variant) => `<Services eyebrow="${t.servicesEyebrow}" title={${j(full ? t.servicesFullTitle(siteName) : t.servicesHomeTitle(siteName))}} services={${j(serviceItems)}}${va(variant)}${!full && servicesRoute ? ` viewAllText="${t.servicesViewAll}" viewAllHref={${j(servicesRoute)}}` : ""} />`;
  const portfolioBlock = (full, variant) => `<Portfolio eyebrow="${t.portfolioEyebrow}" title={${j(full ? t.portfolioFullTitle(siteName) : t.portfolioHomeTitle)}} items={${j(portfolioItems)}}${!full && portfolioRoute ? ` viewAllText="${t.portfolioViewAll}" viewAllHref={${j(portfolioRoute)}}` : ""}${va(variant, "featured")} />`;
  const testimonialsBlock = (full, variant) => `<Testimonials eyebrow="${t.testimonialsEyebrow}" title={${j(full ? t.testimonialsFullTitle : t.testimonialsHomeTitle)}} items={${j(testimonials)}}${va(variant)} />`;
  const pricingBlock = () => `<Pricing eyebrow="${t.pricingEyebrow}" title="${t.pricingTitle}" plans={${j(plans)}} ctaHref={${j(contactRoute)}} />`;
  const faqBlock = (variant) => `<FAQ eyebrow="${t.faqEyebrow}" title="${t.faqTitle}" items={${j(faqs)}}${va(variant)} />`;
  const ctaBlock = (surface, variant) => `<CTA${va(variant, surface ? "surface" : "")} title={${j(tagline || siteName)}} primaryCtaText="${t.ctaContact}" primaryCtaHref={${j(contactRoute)}}${servicesRoute ? ` secondaryCtaText="${t.ctaSeeServices}" secondaryCtaHref={${j(servicesRoute)}}` : ""} />`;
  const contactHomeBlock = (variant) => { const a = [email && `email={${j(email)}}`, phone && `phone={${j(phone)}}`, address && `address={${j(address)}}`].filter(Boolean).join(" "); return `<Contact title="${t.contactTitle}"${tagline ? ` description={${j(tagline)}}` : ""}${a ? " " + a : ""}${va(variant, "split")} />`; };

  // Builders para la HOME por composición: (variant) => jsx | null. null = sin datos → se OMITE (§D4).
  const homeBuilders = {
    Hero: (v) => heroBlock(false, v),
    Services: (v) => (serviceItems ? servicesBlock(false, v) : null),
    Portfolio: (v) => (portfolioItems ? portfolioBlock(false, v) : null),
    Testimonials: (v) => (testimonials ? testimonialsBlock(false, v) : null),
    Pricing: (v) => (plans ? pricingBlock(v) : null),
    FAQ: (v) => (faqs ? faqBlock(v) : null),
    Contact: (v) => ((email || phone || address) ? contactHomeBlock(v) : null),
    CTA: (v) => ctaBlock(false, v),
  };

  const isContact = /contact/i.test(route);
  const isServices = servicesRoute && route === servicesRoute;
  const isPricing = pricingRoute && route === pricingRoute;
  const isPortfolio = portfolioRoute && route === portfolioRoute;
  const isTestim = /testimon/i.test(route);
  const isFaq = /faq|pregunt/i.test(route);

  if (route === "/") {
    // HONRA la composición elegida (F6): orden + variante. OMITE las secciones sin datos (§D4).
    for (const { section, variant } of composition) {
      const build = homeBuilders[section];
      if (!build) continue;
      const jsx = build(variant);
      if (jsx) add(section, jsx);
    }
  } else if (isContact) {
    used.add("Contact");
    const attrs = [email && `email={${j(email)}}`, phone && `phone={${j(phone)}}`, address && `address={${j(address)}}`].filter(Boolean).join(" ");
    blocks.push(`<Contact title="${t.contactTitle}"${tagline ? ` description={${j(tagline)}}` : ""}${attrs ? " " + attrs : ""} variant="split" />`);
  } else if (isServices && serviceItems) {
    add("Services", servicesBlock(true)); add("CTA", ctaBlock(true));
  } else if (isPricing && plans) {
    add("Pricing", pricingBlock()); add("CTA", ctaBlock(true));
  } else if (isPortfolio && portfolioItems) {
    add("Portfolio", portfolioBlock(true)); add("CTA", ctaBlock(true));
  } else if (isTestim && testimonials) {
    add("Testimonials", testimonialsBlock(true)); add("CTA", ctaBlock(true));
  } else if (isFaq && faqs) {
    add("FAQ", faqBlock()); add("CTA", ctaBlock(true));
  } else {
    add("Hero", heroBlock(true)); add("CTA", ctaBlock(true));
  }

  const imports = [...used].sort().map((s) => `import ${s} from "@/components/sections/${s}";`).join("\n");
  // meta description: del brief (tagline) en home; en otras rutas, metadata derivada de hechos (nombre+sección),
  // como el title — nunca prosa de negocio inventada. Open Graph por página. Title absoluto (no doble marca).
  const title = `${siteName} — ${navLabel(route, t)}`;
  const desc = route === "/" ? (tagline || `${siteName}${sector ? `, ${sector}` : ""}`) : `${navLabel(route, t)} · ${siteName}`;
  const breadcrumb = route === "/" ? null : {
    "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: t.navHome, item: "/" },
      { "@type": "ListItem", position: 2, name: navLabel(route, t), item: route },
    ],
  };
  const bcScript = breadcrumb ? `      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ${j(JSON.stringify(breadcrumb))} }} />\n` : "";
  return `${imports}

export const metadata = {
  title: { absolute: ${j(title)} },
  description: ${j(desc)},
  alternates: { canonical: ${j(route)} },
  openGraph: { type: "website", title: ${j(title)}, description: ${j(desc)}, url: ${j(route)} },
};

export default function Page() {
  return (
    <main className="bg-surface-primary text-content-primary">
${bcScript}${blocks.map((b) => "      " + b).join("\n")}
    </main>
  );
}
`;
};
export const ROBOTS = `import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" }, sitemap: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.vercel.app") + "/sitemap.xml" };
}
`;
export const SITEMAP = (routes) => `import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.vercel.app";
  return ${JSON.stringify(routes)}.map((r) => ({ url: base + (r === "/" ? "" : r), priority: r === "/" ? 1 : 0.7 }));
}
`;

if (import.meta.url === `file://${process.argv[1]}`) {
  const briefPath = process.argv[2], dest = process.argv[3];
  if (!briefPath || !dest) { console.error("uso: generate-satellite.mjs <brief.json> <destDir>"); process.exit(2); }
  const brief = JSON.parse((await import("node:fs")).readFileSync(briefPath, "utf8"));
  const trace = generateSatellite(brief, dest);
  console.log(JSON.stringify(trace, null, 2));
}
