// EMITTER del builder (FB2, ECO-66 / ADR-012): IR común → satélite Next.js ENRIQUECIDO. Consume el IR lossless
// (FB0/FB1) y reconstruye: FIEL en los HECHOS (TODAS las páginas/copy/imágenes del IR se emiten) + CREATIVO en
// el DISEÑO (bloques → markup tokenizado em-ui, forma SAT01, código propio). Agnóstico de la fuente. REUSA el
// scaffold/layout/tema/SEO probados del generador (templates exportados) — no duplica. Imágenes REALES del IR
// colocadas (ADR-011, parte assets reales); la generación decorativa es aparte. El gate de emisión (lossless.mjs
// verifyEmit) verifica que NADA del IR se cae en el sitio.
import { mkdirSync, writeFileSync, copyFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  emui, NEXT_CONFIG, TSCONFIG, POSTCSS, PROVIDERS, THEME_CONTEXT, DEFERRED_ANALYTICS,
  ROBOTS, SITEMAP, LAYOUT, buildJsonLd, themeInitScript, navLabel,
} from "../generate-satellite.mjs";
import { chrome, FALLBACK_LANG } from "../lib/i18n.mjs";
import { renderMain } from "./lib/emit-blocks.mjs";

const slug = (s) => String(s || "site").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "site";
const isHex = (s) => typeof s === "string" && /^#[0-9a-fA-F]{6}$/.test(s.trim());

// Emite el satélite desde el IR. opts: { brand?: "#hex", colorMode?: dark|light|system }.
export function emitFromIR(ir, destDir, opts = {}) {
  const dest = resolve(destDir);
  const src = join(dest, "src");
  const app = join(src, "app");
  mkdirSync(app, { recursive: true });
  const trace = { dest, pages: [], media: [], emui: [] };

  const siteName = ir.site?.name || "Site";
  const language = ir.site?.language || FALLBACK_LANG;
  const t = chrome(language);
  const colorMode = ["dark", "light", "system"].includes(opts.colorMode) ? opts.colorMode : "system";
  const brand = isHex(opts.brand) ? opts.brand.trim() : (isHex(ir.site?.brand) ? ir.site.brand.trim() : null);

  // --- scaffold forma-SAT01 (templates REUTILIZADOS del generador) ---
  writeFileSync(join(dest, "package.json"), JSON.stringify({
    name: `@em-ecosystem/sat-${slug(siteName)}`, version: "0.1.0", private: true,
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

  // --- em-ui: tokens + Button (el renderer usa <Button> + next/image; el resto es markup tokenizado) ---
  trace.emui.push(emui(["init"], src).trim());
  for (const c of ["Button", "Badge", "Divider"]) trace.emui.push(emui(["add", c], src).trim());
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
  const imagesDir = join(dest, "public", "images");
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
  writeFileSync(join(app, "layout.tsx"), LAYOUT(siteName, themeInitScript(colorMode), seo, jsonld, language, t));

  const ctx = { siteName, t, media: mediaWeb, contactHref: routes.find((r) => /contact|contacto/i.test(r)) || "/" };
  for (const p of pages) {
    const seg = p.route === "/" ? "" : p.route.replace(/^\/+/, "");
    const dir = seg ? join(app, seg) : app;
    mkdirSync(dir, { recursive: true });
    // imágenes REALES usadas por ESTA página (para que el renderer coloque hasta los fondos no-widget → lossless)
    const pageImages = (ir.media || []).filter((m) => (m.usedBy || []).includes(p.id))
      .map((m) => mediaWeb.get(String(m.id).toLowerCase())).filter(Boolean);
    writeFileSync(join(dir, "page.tsx"), PAGE_FROM_IR(p, { ...ctx, isHome: p.route === "/", pageImages }));
    trace.pages.push(p.route);
  }

  writeFileSync(join(app, "robots.ts"), ROBOTS);
  writeFileSync(join(app, "sitemap.ts"), SITEMAP(routes));
  writeFileSync(join(dest, "ir.json"), JSON.stringify(ir, null, 2) + "\n");   // procedencia (como brief.json, §D5)
  return trace;
}

// Página del IR → page.tsx (metadata per-página del SEO capturado + <main> con los bloques reconstruidos).
function PAGE_FROM_IR(page, ctx) {
  const j = (v) => JSON.stringify(v == null ? "" : v);
  const seo = page.seo || {};
  const title = seo.title || `${page.title || ctx.siteName}${page.route === "/" ? "" : " — " + ctx.siteName}`;
  const desc = seo.description || null;
  const main = renderMain(page, ctx);
  return `import Image from "next/image";
import Button from "@/components/ui/Button";

export const metadata = {
  title: { absolute: ${j(title)} },${desc ? `\n  description: ${j(desc)},` : ""}
  alternates: { canonical: ${j(page.route)} },
  openGraph: { type: "website", title: ${j(title)},${desc ? ` description: ${j(desc)},` : ""} url: ${j(page.route)} },
};

export default function Page() {
  return (
    <main className="bg-surface-primary text-content-primary">
${main}
    </main>
  );
}
`;
}
