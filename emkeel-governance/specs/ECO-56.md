# ECO-56 — Satélites F5: SEO de fábrica (Open Graph + JSON-LD + meta description + landmarks) + gate elevado

Strategy: satellites

## Resumen
Materializa el **pilar P1** del norte (§Refinamiento ECO-52 / [ADR-010](../adr/010-satellite-design-generation.md)):
el satélite nace **listo para indexar y rankear**, no solo desplegado. El generador emite **por construcción**
SEO técnico — Open Graph, JSON-LD, meta description por página, HTML semántico con landmarks — y el **gate de
lanzamiento sube** por encima del agregado Lighthouse: exige los audits SEO nombrados + OG/JSON-LD presentes y
válidos. (Los **CWV de campo** son objetivo **post-lanzamiento**, NO gate — ya decidido en ADR-010; no se mete.)

## Contexto / base
- El generador ya emitía robots, sitemap, metadata por ruta (title + canonical) y `metadataBase`, pero **NO**
  Open Graph, **NO** JSON-LD, **NO** breadcrumbs; el gate era solo el agregado Lighthouse ≥95.
- Fuentes (citadas en `strategy/satellites.md` §Refinamiento ECO-52): Google structured-data (JSON-LD,
  Organization/LocalBusiness), ogp.me (Open Graph), MDN (HTML semántico), web.dev (CWV).

## Decisiones que resuelve

### D — SEO técnico generado por construcción (layout + páginas)
- **Open Graph** site-wide en el layout (`og:title/type/url/siteName`, `images` = logo del brief si existe) +
  por página (`og:title/description/url`).
- **JSON-LD** (Google recomienda JSON-LD):
  - **Organization** site-wide (name, url, logo).
  - **LocalBusiness** **SOLO si el brief trae dirección real** (de hechos `extracted`/`provided`), con
    `address`/`telephone`. Sin dirección → **no hay LocalBusiness** (cae a Organization). **Guardrail §D4:
    jamás se inventa un negocio local.**
  - **BreadcrumbList** por ruta no-home.
- **Meta description única por página**: del brief (tagline) en home; en otras rutas, metadata **derivada de
  hechos** (nombre + sección), como el title — nunca prosa de negocio inventada.
- **HTML semántico + landmarks**: `<header><nav>` + `<main>` (las páginas) + `<footer>`, jerarquía de headings.

### D — Gate de lanzamiento ELEVADO
Además del agregado Lighthouse (mediana de N, ECO-41), el gate exige: **audits SEO nombrados** (`meta-description`,
`link-text`, `canonical`, `document-title`, `is-crawlable`) y **OG + JSON-LD presentes y válidos** en el HTML
servido (`validateSeoHtml` con `fetch`). CWV de campo = objetivo post-lanzamiento, **no gate**.

## Scope
- `generate-satellite.mjs`: ctx SEO (logo) + `buildJsonLd` + LAYOUT (OG/JSON-LD/landmarks) + PAGE (description/OG/breadcrumb).
- `lib/lighthouse.mjs`: `SEO_AUDITS`, `reportSeoAudits`, `validateSeoHtml`; `lighthouse-local.mjs` los gatea.
- Tests (sin red) + build. **NO** toca F1, las secciones (ECO-54/55) ni el modelo de procedencia.

## Acceptance Criteria
1. **Open Graph** presente (layout + por página): `og:title/type/url`, `images`=logo si lo hay.
2. **JSON-LD**: Organization site-wide; **LocalBusiness solo con dirección real** (address/telephone de hechos);
   BreadcrumbList en rutas no-home. Válido (parsea, `@type` correcto).
3. **Meta description** única por página; del brief en home; ausente → metadata derivada de hechos (no inventada).
4. **Landmarks**: header/nav/main/footer presentes; jerarquía de headings.
5. **Gate elevado**: el job exige audits SEO nombrados + OG/JSON-LD válidos, además del agregado Lighthouse.
   **CWV de campo NO es gate.**
6. **e2e doble**: (a) brief con negocio → OG + JSON-LD válidos (validados), breadcrumbs, audits pasan,
   **Lighthouse S2 verde**; (b) brief sin dirección → **Organization válido, SIN LocalBusiness inventado**.
7. **Gates verdes**: `gates` (`Strategy: satellites`, `check_ticket_link` ECO-56), Security Pipeline; tests skill + registry verdes.

## Out of scope
- CWV de campo como gate (es objetivo post-lanzamiento — ADR-010).
- F6 (onboarding tipo-de-sitio + secciones sugeridas + válvula IA); cambios en F1/secciones.

## Alignment
Implementa el **pilar P1** del norte (`strategy/satellites.md` §Refinamiento ECO-52 / ADR-010 — "producto
SEO-ready"): SEO técnico de fábrica + gate de lanzamiento elevado. Honra el **split verdad/diseño** (§D4):
LocalBusiness y todo dato estructurado salen de hechos `extracted`/`provided` — **nunca inventados** (sin
dirección no hay negocio local); la meta description ausente no se fabrica como prosa. No mete CWV de campo
como gate (decisión de ADR-010). No toca F1 ni las secciones.
