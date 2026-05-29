# Frontend Implementation Plan: SAT01-4 Production Hardening

**Detected scope**: `frontend`

## 1. Codebase State Snapshot

- **Date**: 2026-05-01
- **Last completed ticket**: SAT01-1 (Done, deployed via PR #227, commit `e45c113`, live at https://sat-cristian-garcia.vercel.app)
- **Files verified against live code**:
  - `satellites/sat-cristian-garcia/next.config.mjs` (only webpack polling block, NO `headers()`)
  - `satellites/sat-cristian-garcia/src/app/layout.tsx` (has `metadataBase`, title template, description, OG — but NO `alternates.canonical`)
  - `satellites/sat-cristian-garcia/src/app/{sobre-mi,servicios,portfolio,testimonios,contacto,precios}/layout.tsx` (each has only `title`, NO description/canonical/openGraph override)
  - `satellites/sat-cristian-garcia/src/app/legal/{privacidad,terminos}/page.tsx` exist; **no `layout.tsx` for these routes** (need to be created)
  - `satellites/sat-cristian-garcia/public/` contains only `images/` and `videos/` — NO `robots.txt`, `sitemap.xml`, or favicons
  - `satellites/sat-cristian-garcia/package.json`: no `@vercel/speed-insights` or `@vercel/analytics` dependencies
- **Constants verified**: production URL is `https://sat-cristian-garcia.vercel.app` (deployed); custom domain `cristiangarcia.com` is in `metadataBase` but NOT yet wired in Vercel (deferred to a future ticket).
- **Discrepancies with reality**: `metadataBase` references `cristiangarcia.com` which is not yet active. For canonical URLs in this iteration we use the Vercel default URL until the custom domain ticket lands. Plan accepts this as Accepted-Risk (LOW): canonicals will all need updating in the same place when the domain switches, which is a 1-line change in `metadataBase`.

## 2. Regression Impact Analysis

**Blast radius**: 11 files modified, 4 files created, 0 files deleted.

| File | Type | Change |
|---|---|---|
| `next.config.mjs` | Modify | Add `headers()` config |
| `package.json` | Modify | Add 2 deps (`@vercel/speed-insights`, `@vercel/analytics`) |
| `src/app/layout.tsx` | Modify | Add `<SpeedInsights />` + `<Analytics />` components |
| `src/app/page.tsx` | Modify | Add metadata export (home page) |
| `src/app/sobre-mi/layout.tsx` | Modify | Extend metadata (description, canonical, OG) |
| `src/app/servicios/layout.tsx` | Modify | Extend metadata |
| `src/app/portfolio/layout.tsx` | Modify | Extend metadata |
| `src/app/testimonios/layout.tsx` | Modify | Extend metadata |
| `src/app/contacto/layout.tsx` | Modify | Extend metadata |
| `src/app/precios/layout.tsx` | Modify | Extend metadata |
| `src/app/legal/privacidad/page.tsx` | Modify | Add metadata export to page (no layout exists) |
| `src/app/legal/terminos/page.tsx` | Modify | Add metadata export to page (no layout exists) |
| `src/app/robots.ts` | **Create** | Generate robots.txt |
| `src/app/sitemap.ts` | **Create** | Generate sitemap.xml |
| `src/app/icon.tsx` *(optional)* | **Create** | Programmatic favicon (defer if logo asset not handy) |

**Breaking changes**: NONE. All changes are additive:
- Headers only ADD HTTP response headers (no client-visible behavior changes)
- Per-page metadata only ADDS `<meta>` tags (no existing tags removed)
- Speed Insights / Analytics are passive observers (no UI rendered)
- robots.ts / sitemap.ts replace nothing — they're new files

**API contract impact**: NONE (no API consumed).

**Schema migration impact**: NONE (no DB).

**Test files requiring updates**: NONE (satellite has no test framework, consistent with marketing satellite plan).

**Blast radius size**: 15 files. All within `satellites/sat-cristian-garcia/` — zero impact on `nexacore-api`, `nexacore-dashboard`, or other satellites.

## 3. Overview

Bring the deployed satellite from "technically deployed" to "production-grade":

- **Security**: send appropriate HTTP response headers on every route to prevent clickjacking (X-Frame-Options), MIME sniffing (X-Content-Type-Options), HTTP downgrade (HSTS), and untrusted script execution (CSP).
- **SEO foundations**: emit `robots.txt` + `sitemap.xml` automatically via Next.js metadata file conventions, and give every page its own title, description, canonical URL, and Open Graph override so search engines and social media render distinct previews per route.
- **Observability**: passive instrumentation via Vercel's first-party Speed Insights (Real User Core Web Vitals) and Web Analytics (page views, referrers) — both free at this scale, both privacy-respecting (no cookies, GDPR-compliant by design).

## 4. Architecture Context

- Stack unchanged: Next.js 14 App Router + TypeScript + Tailwind 3.4 + system-ui font stack
- All 9 routes remain SSG (no SSR introduced)
- Speed Insights and Analytics components inject minimal client-side JS; combined ~3 kB gzipped — acceptable on top of the current 87.3 kB First Load JS shared
- Metadata file conventions (`robots.ts`, `sitemap.ts`, `icon.tsx`) are App Router native — Next.js generates the static files at build time, no runtime cost

## 5. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: From latest `main`, create `feature/SAT01-4-frontend`
- **Commands**:
  ```bash
  cd em-ecosystem-code
  git checkout main && git pull origin main
  git checkout -b feature/SAT01-4-frontend
  git branch --show-current   # confirm
  ```

### Step 1: Install Vercel observability packages

- **File**: `satellites/sat-cristian-garcia/package.json`
- **Action**: Add `@vercel/speed-insights` and `@vercel/analytics` to `dependencies`
- **Commands**:
  ```bash
  cd satellites/sat-cristian-garcia
  npm install @vercel/speed-insights @vercel/analytics
  ```
- **Verify**: `npm ls @vercel/speed-insights @vercel/analytics` shows both installed

### Step 2: Configure security headers in next.config.mjs

- **File**: `satellites/sat-cristian-garcia/next.config.mjs`
- **Action**: Add an async `headers()` function returning a single rule that applies a security baseline to all routes (`source: "/(.*)"`)
- **Headers to set**:
  | Header | Value | Purpose |
  |---|---|---|
  | `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Force HTTPS for 2 years (preload-eligible) |
  | `X-Frame-Options` | `DENY` | Prevent clickjacking via iframe embedding |
  | `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
  | `Referrer-Policy` | `strict-origin-when-cross-origin` | Send full referrer same-origin only |
  | `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` | Disable powerful browser features (no opt-in for FLoC) |
  | `X-DNS-Prefetch-Control` | `on` | Faster external resource fetching |
- **CSP**: Skip in this iteration. Adding a strict CSP requires nonce setup or relaxing with `unsafe-inline` for Tailwind, which dilutes its security value. **Defer to a follow-up ticket** with proper nonce/hash strategy. Document this as Accepted-Risk (MEDIUM) in verify.
- **Implementation Notes**:
  - Preserve the existing `webpack` polling block — do not overwrite the file, only add the `async headers()` method to the same default export
  - Headers MUST apply in production deploys; verify with `curl -I https://sat-cristian-garcia.vercel.app` after deploy

### Step 3: Create src/app/robots.ts

- **File**: `satellites/sat-cristian-garcia/src/app/robots.ts` (NEW)
- **Action**: Export default function returning a `MetadataRoute.Robots` object
- **Content**: allow all user agents on all routes; reference the sitemap; use the production URL from env or hardcoded constant matching `metadataBase`
- **Note**: Since it's a marketing site that wants maximum visibility, no disallow rules. If a private route is added later, list it here.

### Step 4: Create src/app/sitemap.ts

- **File**: `satellites/sat-cristian-garcia/src/app/sitemap.ts` (NEW)
- **Action**: Export default function returning a `MetadataRoute.Sitemap` array of 9 entries:
  - `/` (priority 1.0, changeFrequency monthly)
  - `/sobre-mi`, `/servicios`, `/portfolio`, `/testimonios`, `/contacto`, `/precios` (priority 0.9, changeFrequency monthly)
  - `/legal/privacidad`, `/legal/terminos` (priority 0.3, changeFrequency yearly)
- **`lastModified`**: Use `new Date()` (build time) — Next.js will rebuild on each deploy so this auto-refreshes. No need for git-based detection in MVP.

### Step 5: Per-page metadata enrichment (8 layouts/pages)

For each existing per-page layout/page, extend the metadata block from `{ title }` only to a complete object:

| Route | Title (template-fed) | Description (~150 chars) | canonical |
|---|---|---|---|
| `/` (`page.tsx`) | uses default from layout | use root description | `metadataBase` (root) |
| `/sobre-mi` | "Sobre Mí" | "Conoce a Cristian García Espadas: campeón de España Sub 23, finalista Míster Universo. Formación, filosofía y trayectoria como entrenador personal." | `/sobre-mi` |
| `/servicios` | "Servicios" | "Servicios de entrenamiento personal: presencial, online, asesoramiento nutricional y seguimiento. Métodos basados en evidencia científica." | `/servicios` |
| `/portfolio` | "Portfolio" | "Galería profesional, palmarés y menciones en prensa. Trayectoria competitiva: Top 15 mundial Míster Universo." | `/portfolio` |
| `/testimonios` | "Testimonios" | "Testimonios reales de clientes transformados con el método de Cristian García. +500 personas, transformaciones documentadas." | `/testimonios` |
| `/contacto` | "Contacto" | "Reserva tu llamada gratuita de 15 minutos con Cristian García. Email, WhatsApp, Instagram. Respuesta en menos de 24 horas." | `/contacto` |
| `/precios` | "Precios" | "Planes de entrenamiento personalizado: prueba gratis, plan Pro y Elite. Sin permanencia. Cambia tu vida con un método contrastado." | `/precios` |
| `/legal/privacidad` | "Política de Privacidad" | "Política de privacidad y tratamiento de datos personales conforme al RGPD." | `/legal/privacidad` |
| `/legal/terminos` | "Términos y Condiciones" | "Términos y condiciones de uso del sitio web y servicios de entrenamiento." | `/legal/terminos` |

- **Per-route layout treatment**: extend `metadata` object with `description`, `alternates: { canonical: "<route>" }`, and `openGraph: { title, description }` (OG inherits images from root layout).
- **For `/legal/privacidad` and `/legal/terminos`**: since no `layout.tsx` exists, add `export const metadata` directly in their `page.tsx`.
- **For `/`**: add `metadata` to root `layout.tsx` `alternates: { canonical: "/" }` (or the `page.tsx`).

### Step 6: Wire Vercel Speed Insights and Analytics

- **File**: `satellites/sat-cristian-garcia/src/app/layout.tsx`
- **Action**: Import and render `<SpeedInsights />` and `<Analytics />` from their respective packages, inside `<body>` after `<Providers>`. Both components render nothing visible.
- **Order matters**: `<IntroLoader />` first (covers page from first paint), `<Providers>` next, then `<SpeedInsights />` and `<Analytics />` last so they don't block hydration of the visible content.

### Step 7: Build verification

- **Action**: From the satellite folder, run `npm run build`. Confirm:
  - Compiles successfully
  - All 13 routes still prerender as static (no SSR introduced)
  - Output reports `robots.txt` and `sitemap.xml` as ƒ Function (auto-generated routes)
  - Bundle size delta: < 10 kB increase (acceptable for the new packages)

### Step 8: Documentation update

This step is handled in `/update-docs` (Part 6 of the workflow auto-commits the implementation record + spec updates to ai-specs).

## 6. Implementation Order

```
Step 0  Create feature branch
Step 1  Install @vercel/speed-insights + @vercel/analytics
Step 2  Add headers() to next.config.mjs
Step 3  Create src/app/robots.ts
Step 4  Create src/app/sitemap.ts
Step 5  Enrich per-page metadata (8 routes)
Step 6  Wire Speed Insights + Analytics in root layout
Step 7  Local build verification
Step 8  /verify (next phase) — full AC validation including Lighthouse
```

## 7. Testing Checklist

Local (during `/develop`):

- [ ] `npm run build` clean from `satellites/sat-cristian-garcia/`
- [ ] All 13 routes still ○ Static (not ƒ Dynamic)
- [ ] Bundle size shared not greater than 95 kB First Load JS

Post-deploy (during `/verify`):

- [ ] `curl -I https://sat-cristian-garcia.vercel.app` shows all 6 security headers
- [ ] `curl https://sat-cristian-garcia.vercel.app/robots.txt` returns valid robots format with sitemap reference
- [ ] `curl https://sat-cristian-garcia.vercel.app/sitemap.xml` returns valid XML with all 9 URLs
- [ ] Each page's `<head>` has unique `<title>` + `<meta name=description>` (verify with curl + grep on at least 3 routes)
- [ ] Each page has `<link rel=canonical>` pointing to its own URL
- [ ] Lighthouse production audit (mobile, incognito):
  - Performance: ≥ 90
  - SEO: ≥ 95
  - Best Practices: ≥ 95
  - Accessibility: ≥ 90 (no regression)
- [ ] Vercel dashboard "Speed Insights" tab shows at least 1 event after a manual visit
- [ ] Vercel dashboard "Analytics" tab shows at least 1 page view

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Headers config breaks the IntroLoader (CSP-style restriction) | LOW | MEDIUM | We're skipping CSP in this iteration; HSTS + others are header-only and don't restrict client behavior |
| `metadataBase` URL mismatch (cristiangarcia.com vs sat-cristian-garcia.vercel.app) | MEDIUM | LOW | Documented as Accepted-Risk; canonical URLs use relative paths so they resolve from `metadataBase`. When custom domain lands, only `metadataBase` changes |
| Speed Insights / Analytics consume too much free quota | LOW | LOW | Free tier: 25K events/mo Speed Insights, 2.5K page views/mo Analytics. At launch traffic this is unreachable |
| @vercel/* packages add bundle weight | LOW | LOW | Both are <2 kB gzipped each, async-loaded |

## 9. Acceptance Criteria

Mirror the ticket SAT01-4 description (verbatim). The plan delivers all 7 ACs end-to-end.

## 10. Verification Approach

`/verify` will:

1. Read this plan step by step against actual code in `feature/SAT01-4-frontend`
2. Run `npm run build` locally to confirm clean compile
3. After deploy completes (Vercel auto-deploys on merge), run `curl -I` against production URL and assert all 6 headers
4. Fetch `/robots.txt` and `/sitemap.xml` and validate format
5. Run Lighthouse mobile audit against production URL via [PageSpeed Insights API](https://pagespeed.web.dev/) (or local `npx lighthouse`)
6. Check Vercel dashboard for Speed Insights + Analytics events
7. Generate verify report at `ai-specs/changes/sat-cristian-garcia/plans/SAT01 S2/SAT01-4_verify.md` with verdict

---

**Plan ready. Proceed to `/develop` (Step 0 onwards).**
