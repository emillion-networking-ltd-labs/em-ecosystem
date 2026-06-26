# Strategy: satellite-quality

Status: DRAFT
Strategy: satellite-quality   <!-- feature specs reference this with a `Strategy: satellite-quality` line -->

## Goal
Definir un ESTÁNDAR VIVO y versionado de "satélite óptimo/profesional" sobre nuestro stack (Next.js + `design-system/`) que sirva como rúbrica de evaluación en CI y como contrato para migrar satélites existentes cuando suba de versión — cubriendo SOLO el pilar técnico/profesional (i18n, SEO, a11y, rendimiento, seguridad, GDPR, formularios); el diseño/belleza (pilar B) es una estrategia posterior que servirá a este estándar.

## Context
<!-- grounded facts ONLY — cite file:line (repo) or a URL (market) for every claim -->

**Prior-art retirado (sólido; lo que falló fue el generador de diseño, no el estándar).**
- El gate `verifyLaunchReady()` de la línea retirada imponía ~16 checks de "lanzado": favicon+iconos+manifest, 404 de marca, formulario funcional + Turnstile, `send-lead.ts` (Server Action+Resend), Cookiebot CMP, Twitter Cards, a11y axe-core, 6 security headers, firma "Powered by EM", toggle de tema, y escaneo de artefactos de render (undefined/null/`[object Object]`/`<p></p>`) — `git show bf7bfb7:.claude/skills/launch-satellite/scripts/builders/standard/launch-ready.mjs:82-149`.
- ADR-010 (4 pilares P1-P4, "producto profesional SEO-ready": OG, JSON-LD Organization/LocalBusiness/BreadcrumbList, HTML semántico) — `emkeel-governance/adr/010-satellite-design-generation.md:34-40` (Status: superseded, `:4`).
- ADR-013 (estándar COMPLETO + gate de launch-readiness; §7 lo declara LISTA VIVA/EXTENSIBLE vía refinamiento `/strategy`) — `emkeel-governance/adr/013-satellite-launch-readiness-standard.md:22-80`.

**Stack que sobrevive.**
- `design-system/` ya trae primitivas: `FormField.tsx` (label+error, `aria-hidden` en el asterisco, `:41`), `TurnstileWidget.tsx`, `ThemeToggle.tsx` (`aria-label` dinámico, `:37`), `LanguageSelector.tsx` (i18n, `:13-17`), `Breadcrumbs.tsx`, y 8 secciones nivel-2 (`design-system/sections/Hero.tsx:15` obliga un único `<h1>`).
- `satellites/sat-cristian-garcia/` (satélite real) YA cumple: `<html lang="es">` (`src/app/layout.tsx:60`), metadata per-page + canonical (`src/app/contacto/layout.tsx:3-13`), 6 security headers (`next.config.mjs:13-27`), robots.ts + sitemap.ts. Le FALTAN vs el estándar: iconos/manifest, 404 de marca, Turnstile+`send-lead.ts`, Cookiebot, Twitter Cards, JSON-LD, test axe-core, ThemeToggle montado.
- Runbook fija targets Lighthouse Perf≥90/SEO≥95/BP≥95/A11y≥90 — `docs/satellite-deployment-runbook.md:337`.

**Best-practice de mercado por dimensión (testable; [M]=machine-checkable, [H]=juicio humano).**
- SEO técnico [M]: `<title>` por página, canonical absoluto único, `/robots.txt`, sitemap XML, OG (`og:title/type/image/url`) — https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls · https://ogp.me/
- Structured data: JSON-LD [M]; **fork [H] Organization vs LocalBusiness** (un portfolio/agencia SIN local físico usa `Organization`, no LocalBusiness) — https://developers.google.com/search/docs/appearance/structured-data/local-business · https://schema.org/LocalBusiness
- i18n [M]: `<html lang>` BCP47, `hreflang` bidireccional + `x-default` — https://www.w3.org/International/questions/qa-html-language-declarations · https://developers.google.com/search/docs/specialty/international/localized-versions
- Redacción SEO [M]: un único `h1`, sin saltos de nivel, sin headings vacíos; [H] contenido people-first sin keyword-stuffing — https://developers.google.com/style/headings · https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- a11y WCAG 2.2 AA: contraste ≥4.5:1 [M], target ≥24×24px [M] (nuevo en 2.2), `alt` presente [M]/calidad [H] — https://www.w3.org/WAI/WCAG22/quickref/
- Rendimiento [M]: Core Web Vitals "good" p75 = LCP≤2.5s, INP≤200ms (reemplazó FID), CLS≤0.1 — https://web.dev/articles/vitals · https://web.dev/articles/inp
- Seguridad [M]: HSTS `max-age`≥1año, `X-Content-Type-Options: nosniff`, CSP sin `unsafe-inline`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy` seguro — https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
- GDPR/cookies [M]: no-esenciales NO cargan antes del consentimiento, "Rechazar" al mismo nivel que "Aceptar", sin casillas pre-marcadas, retirada tan fácil como dar — https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/ · https://gdpr.eu/cookies/
- Formularios [M]: validación server-side, label programático por control, errores ligados (`aria-describedby`+`aria-live`) — https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation · https://www.w3.org/WAI/tutorials/forms/labels/

**Arquitectura de un estándar vivo (versionar + auto-evaluar + migrar) — patrones reales.**
- Auto-evaluar: Lighthouse CI con aserciones estilo-ESLint (`minScore`/`maxNumericValue`/budgets; `error`→exit≠0 bloquea el merge) — https://googlechrome.github.io/lighthouse-ci/docs/configuration.html ; auditores de conformidad axe/pa11y en CI capturan solo **~30-40% de los CRITERIOS WCAG** (cota conservadora Deque/WebAIM; ojo: el "57%" de Deque mide VOLUMEN de issues, otro eje — no mezclar) → el verde es "piso mínimo, no certificación", el resto es juicio humano — https://www.deque.com/blog/automated-testing-study-identifies-57-percent-of-digital-accessibility-issues/
- Versionar: el estándar como paquete semver; añadir/quitar regla = breaking = major (política literal de typescript-eslint); semver comunica la **categoría** del cambio (major/minor/patch), no el detalle → un **changelog** es necesario para decir QUÉ cambió (inferencia propia; convención keepachangelog) — https://typescript-eslint.io/users/configs/ · https://semver.org/ · https://keepachangelog.com/
- Migrar: codemod versionado emparejado por cada breaking change (jscodeshift; AST→reescritura), con límites duros (no migra alias/estilos raros) → inserta TODOs y exige **revisión humana del diff, nunca auto-merge** — https://martinfowler.com/articles/codemods-api-refactoring.html · https://dev.to/danieldelcore/a-new-way-to-ship-codemods-4h11

## Options
<!-- at least 2 real options; EVERY row MUST cite a Source (file:line or URL). `emkeel strategy check` enforces it. -->
| # | Option | Source | Pros | Cons | Risk |
|---|--------|--------|------|------|------|
| 1 | **Rúbrica-doc viva, sin gate** — estándar = checklist markdown versionada; un agente la aplica al construir + revisión humana; sin gate CI ni codemods | https://typescript-eslint.io/users/configs/ | Ligerísimo, rápido, flexible; cero infra | No se IMPONE (depende de diligencia); evaluación subjetiva | Alta deriva: los satélites no se miden → dispara la kill-criterion "óptimo no checkable" |
| 2 | **Estándar versionado + gate de conformidad en CI; migración MANUAL ticketeada** — doc con cada requisito etiquetado [M]/[H]; los [M] se imponen en CI (recuperar los ~16 checks de `launch-ready` + LHCI perf/budgets + axe a11y/SEO); los [H] son rúbrica de revisión humana; semver del estándar + changelog; migrar satélites = tarea manual por ticket cuando sube de versión | https://googlechrome.github.io/lighthouse-ci/docs/configuration.html | Impone el piso real hoy; reusa prior-art probado; versionado comunica el cambio; barato con POCOS satélites | La migración no escala si crecen los satélites (churn manual) | Si N satélites crece, migrar a mano duele → hay que subir a la capa codemod |
| 3 | **Estándar compuesto completo con migración por codemod** — Opción 2 + cada major publica un codemod emparejado (jscodeshift) que un CLI secuencia sobre cada carpeta-satélite, con revisión humana obligatoria del diff | https://martinfowler.com/articles/codemods-api-refactoring.html | Cubre (a)+(b)+(c) a escala; migrar = un comando por satélite | El más pesado; mantener un codemod por breaking change; jscodeshift falla en casos límite | Sobre-ingeniería HOY (hay 1 satélite real) → dispara la kill-criterion "versionado+migración cuesta más que su valor" |

## Recommendation
**Opción 2 ahora, con la capa codemod de la Opción 3 como ruta de escalado nombrada (no construida).** Hoy hay un solo satélite real (`satellites/sat-cristian-garcia/`), así que la maquinaria de codemods (Opción 3) es sobre-ingeniería que dispara la kill-criterion de coste; y la rúbrica-doc sin gate (Opción 1) dispara la kill-criterion de "no checkable / deriva". La Opción 2 entrega lo que pediste: (1) rúbrica de evaluación REAL — un gate CI que recupera los ~16 checks del `launch-ready` retirado + LHCI (perf/budgets) + axe (a11y/SEO), corrido por carpeta-satélite; (2) versionado semver del estándar + changelog como contrato de "qué cambió"; (3) migración como tarea manual ticketeada mientras los satélites sean pocos. El estándar se redacta con cada requisito etiquetado **[M]** (al gate) o **[H]** (a la revisión humana). Umbral de escalado a la Opción 3: cuando migrar a mano N satélites por un major sea más caro que escribir+mantener el codemod (señal concreta a vigilar, no una fecha).

**Condiciones de diseño innegociables (del pase adversarial — sin ellas la Opción 2 repite la trampa que mató la línea vieja):**
- **Gate VERSION-AWARE contra la deriva:** cada satélite registra a qué versión del estándar se construyó; el gate **falla (o warn-loud) si queda >1 major por detrás** → la deriva se vuelve deuda VISIBLE y ticketeada, no silenciosa. Regla complementaria "no tocar un satélite sin migrarlo a la versión vigente" (espejo de bug→test). Sin esto, "migración manual" es un backlog que nadie prioriza.
- **Verde ≠ conformidad:** el gate se **auto-rotula** ("PISO PASADO — revisión humana de diseño NO hecha") en su salida y en el PR; la certificación real es un **artefacto/required-check humano separado** que el verde NO sustituye. Si "certificación" no tiene su propio check, en la práctica no existe.
- **Alcance ampliado (huecos profesionales/legales que el pase destapó):** además de las dimensiones técnicas, el estándar incluye **páginas legales** (aviso legal/privacidad/cookies/términos), **consent-mode ANTES de cargar trackers** (gateado — cargar analytics sin consentimiento es la infracción GDPR más común), **error monitoring** en producción, y los estados **404/500**, favicon/manifest, redirects HTTPS/canonical (varios ya estaban en los 16 checks retirados).
- **CWV de campo = monitor post-lanzamiento, no omisión:** fuera del gate de lanzamiento (el día 0 no hay tráfico real), PERO entra como **alerta post-lanzamiento** (no gate de deploy) — el lab no predice INP real; no se omite del roadmap.

## Non-goals
- El generador/mecanismo de diseño (pilar B, belleza) — estrategia posterior que SERVIRÁ a este estándar.
- Competir con builders tipo Lovable/v0 — el norte es "óptimo/profesional + fiel", no paridad de features.
- Inventar hechos del cliente — el estándar evalúa forma/calidad técnica, jamás fabrica contenido (negocio/servicios/precios = `provided`/`extracted`, nunca `proposed`).
- Construir la capa de codemods ahora (diferida hasta que el nº de satélites lo justifique).
- Gatear Core Web Vitals de CAMPO en el lanzamiento (p75 de datos reales = objetivo post-lanzamiento monitorizado, no gate — ADR-010 P1).

## Decisions
<!-- optional: link the chosen decision as an ADR, e.g. emkeel-governance/adr/007-<slug>.md -->
<!-- on approval: record as ADR-017 (satellite-quality living standard) -->
