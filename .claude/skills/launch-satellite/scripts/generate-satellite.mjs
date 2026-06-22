#!/usr/bin/env node
// Motor de generación del skill /launch-satellite (ECO-25, F2b). brief.json -> satélite S2-ready.
// Pipeline determinista, NO greenfield: scaffold forma-SAT01 + reuse de UI SOLO via `em-ui add`
// (cierre transitivo) + `em-ui init` (tokens) + relleno desde el brief. Los `missing` -> placeholders
// visibles, NUNCA datos fabricados. NO despliega (eso es F3).
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateBrief, briefIntent, briefColorMode, DEFAULT_INTENT } from "./lib/brief.mjs";

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
function emui(args, destSrc) {
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
  writeFileSync(join(dest, ".gitignore"), "/node_modules\n/.next\n/out\n");

  // --- b. Reuse SOLO via em-ui: tokens + SECCIONES nivel-2 (cada `add` jala su cierre de átomos/hooks) ---
  trace.emui.push(emui(["init"], src).trim());
  for (const s of sections) { trace.emui.push(emui(["add", s], src).trim()); trace.sections.push(s); }

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

  // --- layout + observabilidad DIFERIDA (S2: no bloquea el main-thread) + tema (Providers + init-script) ---
  const siteName = fillField(brief.identity?.name, "nombre del negocio", "identity.name");
  writeFileSync(join(app, "layout.tsx"), LAYOUT(siteName, themeInitScript(colorMode)));
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

  const sector = track("identity.sector", brief.identity?.sector);
  const tagline = track("tagline", f.slogan || f.tagline || f.subtitle);
  const rawServices = track("services", f.services);
  const serviceItems = Array.isArray(rawServices)
    ? rawServices.map((s) => (typeof s === "string" ? { title: s } : { title: s.title || s.name || String(s), description: s.description || s.desc }))
    : null;
  const email = track("contactEmail", f.contactEmail);
  const phone = track("contactPhone", f.contactPhone);
  const address = track("address", f.address);
  const contactRoute = routes.find((r) => /contact/i.test(r)) || "/contact";
  const servicesRoute = routes.find((r) => /servic/i.test(r)) || null;
  const ctx = { siteName, sector, tagline, serviceItems, email, phone, address, contactRoute, servicesRoute };

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
const NEXT_CONFIG = `import { fileURLToPath } from "node:url";
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
const TSCONFIG = JSON.stringify({
  compilerOptions: { lib: ["dom", "dom.iterable", "esnext"], allowJs: true, skipLibCheck: true, strict: true, noEmit: true, esModuleInterop: true, module: "esnext", moduleResolution: "bundler", resolveJsonModule: true, isolatedModules: true, jsx: "react-jsx", incremental: true, plugins: [{ name: "next" }], paths: { "@/*": ["./src/*"] }, target: "ES2017" },
  include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"], exclude: ["node_modules"],
}, null, 2) + "\n";
const POSTCSS = `/** @type {import('postcss-load-config').Config} */\nconst config = { plugins: { '@tailwindcss/postcss': {} } };\nexport default config;\n`;
const LAYOUT = (siteName, initScript) => `import type { Metadata } from "next";
import DeferredAnalytics from "@/components/DeferredAnalytics";
import Providers from "./providers";
import "./globals.css";

// metadataBase env-driven (S2): cae al default de Vercel hasta que F3 cablee el dominio.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.vercel.app"),
  title: ${JSON.stringify(siteName)},
  description: ${JSON.stringify(`${siteName} — sitio oficial`)},
};

// Anti-FOUC (ECO-48): fija la clase \`dark\` en <html> ANTES del primer paint según el colorMode
// elegido (parametrizado) + la preferencia guardada del usuario. Síncrono → no hay flash de tema.
const THEME_INIT_SCRIPT = ${JSON.stringify(initScript)};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        {/* ThemeProvider (dark/light + toggle) envuelve la app → useTheme nunca rompe. */}
        <Providers>{children}</Providers>
        {/* Observabilidad diferida: no bloquea el main-thread (S2 Performance). */}
        <DeferredAnalytics />
      </body>
    </html>
  );
}
`;

// --- maquinaria de TEMA (GENÉRICA, modelada en SAT01 proven): default parametrizado por colorMode ---
// initScript anti-FOUC: añade `dark` a <html> antes del paint. dark → salvo 'light' guardado;
// light → solo si 'dark' guardado; system → preferencia guardada o prefers-color-scheme.
const themeInitScript = (mode) => {
  const decide = mode === "light"
    ? "t==='dark'"
    : mode === "system"
      ? "(t==='dark'||t==='light' ? t==='dark' : (window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches))"
      : "t!=='light'";   // dark (default de la marca cuando el cliente lo elige)
  const onError = mode === "light" ? "" : "document.documentElement.classList.add('dark')";
  return `(function(){try{var t=localStorage.getItem('theme');if(${decide}){document.documentElement.classList.add('dark')}}catch(e){${onError}}})()`;
};

const PROVIDERS = `"use client";

import ThemeProvider from "@/context/ThemeContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
`;

// ThemeContext GENÉRICO: el default (dark/light/system) lo fija DEFAULT_MODE (parametrizado por el brief).
const THEME_CONTEXT = (mode) => `"use client";

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
const DEFERRED_ANALYTICS = `"use client";
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
const navLabel = (route) => {
  if (route === "/") return "Inicio";
  const seg = route.replace(/^\/+|\/+$/g, "");
  return seg ? seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ") : "Inicio";
};

// Compone la página desde la biblioteca de SECCIONES (ECO-54), rellenada con HECHOS del brief (ctx).
// Solo importa las secciones que usa; lo ausente se omite (no se inventa). Labels de UI = chrome permitido.
const PAGE = (route, ctx) => {
  const { siteName, sector, tagline, serviceItems, email, phone, address, contactRoute, servicesRoute } = ctx;
  const j = (v) => JSON.stringify(v);
  const isContact = /contact/i.test(route);
  const isServices = servicesRoute && route === servicesRoute;
  const used = new Set();
  const blocks = [];

  if (route === "/") {
    used.add("Hero");
    blocks.push(`<Hero${sector ? ` eyebrow={${j(sector)}}` : ""} title={${j(siteName)}}${tagline ? ` subtitle={${j(tagline)}}` : ""} ctaText="Contacto" ctaHref={${j(contactRoute)}}${servicesRoute ? ` secondaryCtaText="Ver servicios" secondaryCtaHref={${j(servicesRoute)}}` : ""} />`);
    if (serviceItems && serviceItems.length) {
      used.add("Services");
      blocks.push(`<Services eyebrow="Servicios" title={${j(`Lo que ofrece ${siteName}`)}} services={${j(serviceItems)}}${servicesRoute ? ` viewAllText="Ver todos los servicios" viewAllHref={${j(servicesRoute)}}` : ""} />`);
    }
    used.add("CTA");
    blocks.push(`<CTA title={${j(tagline || siteName)}} primaryCtaText="Contacto" primaryCtaHref={${j(contactRoute)}}${servicesRoute ? ` secondaryCtaText="Ver servicios" secondaryCtaHref={${j(servicesRoute)}}` : ""} />`);
  } else if (isContact) {
    used.add("Contact");
    const attrs = [email && `email={${j(email)}}`, phone && `phone={${j(phone)}}`, address && `address={${j(address)}}`].filter(Boolean).join(" ");
    blocks.push(`<Contact title="Contacto"${tagline ? ` description={${j(tagline)}}` : ""}${attrs ? " " + attrs : ""} variant="split" />`);
  } else if (isServices && serviceItems && serviceItems.length) {
    used.add("Services");
    blocks.push(`<Services eyebrow="Servicios" title={${j(`Servicios de ${siteName}`)}} services={${j(serviceItems)}} />`);
    used.add("CTA");
    blocks.push(`<CTA title={${j(siteName)}} primaryCtaText="Contacto" primaryCtaHref={${j(contactRoute)}} />`);
  } else {
    used.add("Hero");
    blocks.push(`<Hero variant="soft" title={${j(navLabel(route))}}${sector ? ` eyebrow={${j(sector)}}` : ""} ctaText="Contacto" ctaHref={${j(contactRoute)}} />`);
    used.add("CTA");
    blocks.push(`<CTA variant="surface" title={${j(siteName)}} primaryCtaText="Contacto" primaryCtaHref={${j(contactRoute)}} />`);
  }

  const imports = [...used].sort().map((s) => `import ${s} from "@/components/sections/${s}";`).join("\n");
  return `${imports}

export const metadata = { title: ${j(`${siteName} — ${navLabel(route)}`)}, alternates: { canonical: ${j(route)} } };

export default function Page() {
  return (
    <main className="bg-surface-primary text-content-primary">
${blocks.map((b) => "      " + b).join("\n")}
    </main>
  );
}
`;
};
const ROBOTS = `import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" }, sitemap: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.vercel.app") + "/sitemap.xml" };
}
`;
const SITEMAP = (routes) => `import type { MetadataRoute } from "next";
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
