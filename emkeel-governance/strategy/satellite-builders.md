# Strategy: satellite-builders

Status: APPROVED (modelo) · REFINAMIENTO ECO-64 PENDIENTE (gate humano)   <!-- modelo aprobado 2026-06-22 (ECO-62, ADR-012); FB0/FB1 = ECO-63; refinamiento ECO-64 (estándar profesional completo del núcleo común + gate de launch-readiness; approach de formulario abierto) PENDIENTE de aprobación -->
Strategy: satellite-builders   <!-- feature specs reference this with a `Strategy: satellite-builders` line -->

> **Re-encuadre del norte de satélites alrededor de BUILDERS de fuente.** SUPERA a
> [`satellites.md`](satellites.md) (preservado como historia, con puntero recíproco). El generador actual
> (*extract-then-compose*) sale con **PÉRDIDA** — el piloto Grupo Atis lo probó. Reutiliza lo válido de
> `satellites.md` (i18n, SEO, guardrails, secciones, em-ui, imágenes); **no lo re-litiga**.

## Goal
Decidir el NORTE de un sistema de **BUILDERS por FUENTE** (desde-archivo / desde-URL / …) que alimentan un
**NÚCLEO COMÚN** que **RECONSTRUYE ENRIQUECIDO** (fiel en los HECHOS, creativo en el DISEÑO) → un satélite
**Next.js propio y escalable**; **from-file primero** (WordPress = primer adapter, pero la arquitectura lee
CUALQUIER backup vía adapters pluggables). NO el cómo-paso-a-paso (eso es el runbook).

## Context
<!-- grounded facts ONLY — cite file:line (repo) o URL (mercado) -->
- **El generador de hoy es *extract-then-compose*, con PÉRDIDA por diseño:** mapea el sitio a ~15 campos
  escalares + 8 secciones fijas y **descarta el resto** (`.claude/skills/launch-satellite/scripts/generate-satellite.mjs`,
  `compositionFor`/`DEFAULT_HOME_COMPOSITION`); el contrato `brief.json` **no tiene modelo de páginas/bloques/
  media** (`.claude/skills/launch-satellite/schema/brief.schema.json`).
- **El piloto Grupo Atis lo expuso:** un sitio **Elementor + Astra** real (decenas de páginas, ~116 imágenes en
  `uploads`) se redujo a ~15 campos, el media se declaró `missing` con **~1834 ficheros presentes**, y el
  remodel salió **más feo que el original** (registrado en [`satellites.md` §«Re-aim ECO-60»](satellites.md)).
- **El contenido real vive en estructuras que el resumen ignora:** en WordPress+Elementor el cuerpo de cada
  página está en **`wp_postmeta._elementor_data` (JSON)**, no en `post_content`; el backup trae la **BD completa
  + `wp-content/uploads`** ⇒ la captura **LOSSLESS desde el archivo es factible** (no hay que adivinar).
- **Los importadores REALES capturan el RENDER primero, luego mapean** (no resumen): html.to.design convierte
  cualquier página viva en capas editables (https://html.to.design/); wp2static / Simply Static **clonan el
  render exacto** (https://simplystatic.com/); html-to-react parsea el DOM a un **árbol de componentes**
  (https://github.com/aknuds1/html-to-react). El patrón es **adapter por fuente → modelo normalizado → emitter**,
  igual que el split front-end/back-end de un compilador.
- **Lo válido del norte actual se REUTILIZA** (ver §«Núcleo común»): i18n (`scripts/lib/i18n.mjs`), SEO de fábrica
  + gate elevado (`scripts/lib/lighthouse.mjs`), guardrail HECHOS-vs-DISEÑO/no-inventar
  (`schema/brief.schema.json`, `SKILL.md`), imágenes ([ADR-011](../adr/011-satellite-image-assets.md)),
  biblioteca de secciones (`design-system/sections/`), em-ui (`design-system/registry/`), preview
  (`scripts/preview-satellite.mjs`), S2/gobernanza.

## Options
<!-- ≥2 real options; cada celda Source = un único file:line COMMITEADO o URL bien formada. `emkeel strategy check` lo exige. -->
> El eje de decisión es el **modelo de builder**. Cada celda Source es un único `file:line` commiteado o URL.

| # | Option (modelo de builder) | Source | Pros | Cons | Risk |
|---|--------|--------|------|------|------|
| 1 | **Status quo — *extract-then-compose*** (resumen del sitio a ~15 campos + 8 secciones fijas) | .claude/skills/launch-satellite/scripts/generate-satellite.mjs:1 | simple; ya existe | **con PÉRDIDA** (descarta páginas/copy/imágenes reales); el piloto salió **peor** que el original | **Alto** — es el fallo a cerrar |
| 2 | **Clon estático del render** (estilo wp2static / Simply Static) | https://simplystatic.com/ | fiel pixel-a-pixel; capta todo el render | copia el markup **WP/Elementor verbatim**, NO nuestras secciones; **sin ownership/escalabilidad/diseño propio**; pierde lo dinámico | Medio-alto — choca con "código propio + mejor que el original" |
| 3 | **Builders por FUENTE → núcleo común (modelo normalizado) → emitter Next ENRIQUECIDO** | https://github.com/aknuds1/html-to-react | captura **LOSSLESS** (el adapter lee TODO) + reconstrucción **enriquecida** con nuestras secciones+imágenes; **genérico** (adapters pluggables); **código propio**; incremental (from-file primero) | hay que construir el núcleo + el modelo normalizado + el adapter WP | Medio — acotado y por fases |
| 4 | **WP headless → Next** (Faust.js / WPGraphQL) | https://faustjs.org/ | modelo tipado; render con tus componentes | exige una instancia **VIVA** de WP como backend (no un backup muerto); WP sigue siendo el CMS ⇒ **NO "código en nuestro control"** | Medio-alto — no encaja (queremos estático, propio, desde archivo) |

## Recommendation
<!-- which option + why — this is judgment; the human approves it at the gate -->
**APROBADA por el operador (gate humano, 2026-06-22): Opción 3 — *builders por fuente → núcleo común (modelo
normalizado/IR) → emitter Next enriquecido***. Arquitectura registrada en [ADR-012](../adr/012-satellite-builders-architecture.md);
FB0/FB1 (núcleo + IR + adapter WP) en [ECO-63](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-63).

- La **1** es el estado actual y **ya falló** (pérdida; piloto Atis): es la deuda a cerrar, no el norte.
- La **2** (clon estático) es fiel pero copia el **markup ajeno**: no da diseño propio ni escalabilidad ni
  "mejor que el original" — sería un fork de WP/Elementor, no un satélite nuestro.
- La **4** (headless) exige **WP vivo** como backend: no parte de un backup muerto y deja a WP de CMS — rompe
  "código en nuestro control".
- La **3** es la única que captura **TODO lo real** (adapter lossless) **y** lo reconstruye con **nuestras
  secciones + imágenes** (ownership, escalable), con un **interfaz de adapter genérico** que abre from-url y
  otras fuentes después. Es el patrón que usan los importadores serios (adapter → modelo → emitter). El "cómo"
  va en el plan de construcción.

## Núcleo común — los transversales que garantiza para CADA builder
El núcleo (compartido por todos los builders de fuente) **reutiliza** lo ya construido y lo impone por
construcción, sin re-litigarlo:
- **i18n** — idioma real del cliente: chrome externalizado + `<html lang>` real (`scripts/lib/i18n.mjs`, ECO-58).
- **SEO de fábrica** — OG + JSON-LD + HTML semántico + audits nombrados + gate elevado (`scripts/lib/lighthouse.mjs`, ECO-56).
- **HECHOS-vs-DISEÑO + no-inventar** — los hechos `extracted`/`provided` jamás se fabrican; el diseño se crea
  libre (`schema/brief.schema.json`, `SKILL.md` §D4).
- **Imágenes** — assets reales on-screen + generación decorativa; logo/real nunca generados ([ADR-011](../adr/011-satellite-image-assets.md)).
- **Código propio + escalable** — Next.js + em-ui (ownership) (`design-system/registry/`, `design-system/sections/`).
- **Gate de preview** + **S2/gobernanza** (`scripts/preview-satellite.mjs`; Lighthouse S2 + gates).

## Arquitectura (Opción 3, concreta) — el builder DESDE-ARCHIVO
**Adapter por fuente → núcleo común (modelo normalizado/IR) → emitter Next** (split front-end/back-end).

- **Modelo normalizado (IR) — captura LOSSLESS** (el inverso del brief escalar de hoy: primero captura, luego
  mapea): `site` (marca, idioma, nav, SEO, options) · `pages[]` (route + title + `blocks[]` **ordenados**) ·
  `blocks[]` (tipo + **copy VERBATIM** + refs de media) · `media[]` (**manifest de TODAS las imágenes reales** +
  dónde se usan) · `menus[]` · `forms[]`. El `brief.json` actual se mantiene como **destilación/procedencia** (D5),
  pero el IR es la **fuente completa**.
- **Adapter DESDE-ARCHIVO (WordPress primero, GENÉRICO):** lee la **BD del backup** (`wp_posts` filtrados +
  `wp_postmeta._elementor_data` + `wp_options` + menús + SEO meta) **∪** el árbol `wp-content/uploads` → el IR.
  El **interfaz del adapter es genérico** (cualquier backup → el mismo IR); WP/Elementor es el **primer adapter**,
  no la forma del núcleo. Un backup no-WP (HTML plano, export de otro CMS) implementa el mismo interfaz.
- **Reconstrucción ENRIQUECIDA en UN solo flujo creativo:** el núcleo mapea los `blocks` del IR → nuestras
  `design-system/sections` + las imágenes reales, en **una sola pasada** — **fiel en los HECHOS** (todo el
  copy/estructura/media del IR se preserva; nada se inventa) y **creativo en el DISEÑO** (secciones frescas,
  marca aplicada, mejor que el original). **NO** "réplica 1:1 y luego mejorar aparte" — enriquecido de una.
- **Honestidad (constraint, NO promesa):** "nada se pierde" está **acotado a lo que el backup CONTIENE**. Si la
  BD no está en el backup, o hay contenido servido dinámicamente fuera de ella, ESO no se captura y se **declara
  explícitamente** (cobertura del adapter) — nunca se inventa para rellenar (eso sería violar §D4). La generación
  **decorativa** (ADR-011) rellena lo visual que falte, jamás un HECHO.

## Plan de construcción (incremental — FROM-FILE PRIMERO; cada fase pasa pruebas antes de la siguiente)
- **FB0 — Núcleo común + IR:** definir el modelo normalizado (IR) + el contrato del emitter + cablear los
  transversales (i18n/SEO/guardrails/imágenes/em-ui/preview/S2) sobre el IR.
- **FB1 — Builder DESDE-ARCHIVO, adapter WordPress:** parser de la BD + uploads → IR **lossless** (todas las
  páginas/copy/bloques/media/nav); el interfaz del adapter queda genérico; reporta cobertura.
- **FB2 — Reconstrucción enriquecida:** IR `blocks` → nuestras secciones + imágenes reales, en un flujo;
  S2/SEO/i18n por construcción; preview; comparación "mejor que el original".
- **FB3 — Builder DESDE-URL (web viva):** segundo adapter (captura el render → IR), reutilizando el núcleo.
- **FB4 — Más adapters** (otros CMS/exports) según se necesiten y pasen pruebas.
- **FB5 — Estándar profesional + gate de launch-readiness (ECO-64):** implementar los indispensables que faltan
  en el núcleo común + el gate que los verifica (ver §«Refinamiento ECO-64»). *(se construye con/sobre FB2)*

## Refinamiento ECO-64 — estándar profesional COMPLETO del núcleo común + gate de launch-readiness

**Estado: refinamiento — PENDIENTE DE APROBACIÓN (gate humano, ECO-64).** La estrategia fijó el MECANISMO
(builders→IR→emitter) pero no un estándar COMPLETO de "sitio profesional óptimo" → los indispensables (formulario,
favicon, 404, GDPR, a11y) salían **a parches**. Aquí se fija el estándar COMPLETO en el **NÚCLEO COMÚN**
(**cross-cutting: lo hereda TODO builder** — desde-archivo, desde-URL, los que vengan; no por builder) + un **GATE
de launch-readiness** que lo verifica. Reutiliza lo ya definido (ECO-56/58, ADR-010/011/012); **no re-litiga**.

### El ESTÁNDAR profesional completo (núcleo común)
**Ya cubierto — codificado como estándar (no re-litigado):** SEO de fábrica (ECO-56), i18n idioma real (ECO-58),
rendimiento/CWV-lab S2 (Lighthouse Perf/SEO/BP/A11y), responsive, HECHOS-vs-DISEÑO/no-inventar (§D4), imágenes
reales + decorativas (ADR-011), código propio + em-ui (ownership), seguridad/headers HTTPS (6 cabeceras),
analytics respetuoso, páginas legales, firma **"Powered by EM Ecosystem"**.
**NUEVO — los indispensables que faltaban:**
- **Formulario de contacto/lead FUNCIONAL** (backend/email real) — approach = **decisión ABIERTA** (abajo).
- **Favicon + iconos + web manifest DERIVADOS del logo real** del cliente (parte del pilar de imágenes, ADR-011):
  de un logo ≥512² → `favicon.ico` (≥32²), `favicon.svg`, apple-touch-icon 180² (opaco, padding), 192²+512² PNG +
  `site.webmanifest` — el set mínimo moderno (https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs,
  https://faviconbuilder.com/guides/pwa-favicon-manifest-guide/). Generable de los assets reales (sharp), nunca inventado.
- **Página 404 personalizada y de marca** (no la genérica de Next).
- **GDPR/cookies = Cookiebot** (plan **GRATIS**, https://www.cookiebot.com): script CMP + **Consent Mode v2**
  (incluido en el free, https://support.cookiebot.com/hc/en-us/articles/12756353963292-About-Google-Consent-Mode)
  → **bloquea cookies/scripts hasta el consentimiento**, y el **analytics se condiciona al consentimiento**.
  **DECIDIDO por el operador**, **pluggable** hasta tener el nuestro (mismo patrón que el gateway de imágenes,
  ADR-011). Nota: el free es **un default global** (sin geo-targeting).
- **Accesibilidad WCAG AA real** (teclado, foco, ARIA, contraste, alt, landmarks) — verificada con **axe-core**
  (@axe-core/playwright, MPL-2.0 libre para CI, ~90 reglas WCAG A/AA/AAA + ARIA, https://www.deque.com/axe/axe-core/,
  https://www.w3.org/WAI/standards-guidelines/act/implementations/axe-core/) en el gate, más allá del a11y de
  Lighthouse. **Honestidad:** axe-core caza ~57% de los criterios automatizables; lo no automatizable (alt
  significativo, orden de foco lógico) queda marcado `incomplete` para revisión humana — no se finge AA total.

### Eje de decisión ABIERTO — approach del FORMULARIO funcional (a aprobar en el gate)
> El operador decide; aquí van las opciones investigadas + recomendación. (Presentada, **no tomada**.)

| # | Approach del formulario | Source | Pros | Cons | Riesgo |
|---|---|---|---|---|---|
| 1 | **Vercel function / Server Action + servicio de email (Resend)** | https://splitforms.com/blog/server-actions-vs-form-backend-nextjs | **código propio** (ownership, encaja con el norte "código en nuestro control"); sin dep de terceros en el front; coste casi nulo; satélite autosuficiente | nosotros mantenemos deliverability/anti-spam/dominio verificado; algo más a construir | medio |
| 2 | **Form-backend service (Formspree)** | https://formspree.io/guides/nextjs/ | email-a-inbox out-of-the-box, dashboard, anti-spam/deliverability resueltos, cero backend | dep externa por satélite; menos "código propio"; límites del plan free | bajo-medio |

**Recomendación (PENDIENTE de tu aprobación):** **Opción 1** (Vercel function + Resend) como **default** — encaja
con "código en nuestro control" y deja el satélite autosuficiente; **pluggable** a un form-service por cliente
cuando se prefiera cero mantenimiento. **Tú decides el approach en el gate; no lo decido yo.**

### El GATE de launch-readiness (extiende S2 a un gate profesional COMPLETO)
El núcleo común **NO declara "lanzado"** hasta que el satélite cumple TODO el estándar. Igual que el gate lossless
caza un sub-campo caído (SEO), este caza **cualquier indispensable que falte → nada sale a medias**. Verifica
(lab, por construcción): **Lighthouse S2** (Perf≥90/SEO≥95/BP≥95/A11y≥90) + audits SEO nombrados + OG/JSON-LD
(ECO-56) · **a11y AA con axe-core sin violations** (incomplete → revisión humana) · **formulario** presente y su
endpoint responde · **favicon/manifest/apple-touch** presentes · **404 de marca** · **Cookiebot CMP** presente +
**analytics condicionado al consentimiento** · **headers HTTPS S2** · **páginas legales** + **"Powered by EM"**.
Cada ítem = un check; **falla cualquiera ⇒ NO "lanzado"**. (CWV de **campo** = objetivo post-lanzamiento, no
gate — ADR-010.)

### Decisión — PRESENTADA al gate (no tomada)
Estándar profesional completo + gate de launch-readiness para el núcleo común; approach de formulario **(1)
recomendado**. **PENDIENTE de tu aprobación** (`approved`). Reconcilia con ECO-56/58 + ADR-010/011/012; se
implementa en **FB5** (con/sobre FB2). El operador aprueba/ajusta en el gate.

## Non-goals
- NO re-litiga lo válido de `satellites.md` (lo **trae**: i18n/SEO/guardrails/secciones/em-ui/imágenes).
- NO el cómo-paso-a-paso (eso es el **runbook**).
- NO promete capturar lo que el backup **no contiene** (BD ausente / contenido dinámico): se **declara**, no se inventa.
- NO mantiene WordPress como backend (descarta el headless-vivo).
- NO construye los builders aquí: fija el norte + la arquitectura + el plan; el cómo va en los ECO por fase.

## Decisions
- **D — Modelo = Opción 3 (builders por fuente → núcleo común → emitter enriquecido). APROBADA (gate humano,
  2026-06-22; ECO-62).** Arquitectura en [ADR-012](../adr/012-satellite-builders-architecture.md); FB0/FB1 en
  [ECO-63](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-63). Reúsa el núcleo transversal de `satellites.md`.
- **D — `satellites.md` queda SUPERADO** por este doc (puntero recíproco; historia preservada, no se borra).
- **D — Roadmap from-file primero;** los demás builders se añaden incrementalmente tras pasar pruebas.
- **D — Estándar profesional COMPLETO del núcleo común + GATE de launch-readiness (ECO-64, PENDIENTE de
  aprobación — gate humano).** Fija de una vez el estándar de "sitio profesional óptimo" en el núcleo común
  (cross-cutting, todo builder lo hereda) para acabar con los indispensables a parches, + un gate que NO declara
  "lanzado" hasta cumplirlo TODO (ver §«Refinamiento ECO-64»). **(i)** Estándar = lo ya cubierto (SEO/i18n/S2/§D4/
  imágenes/em-ui/headers/legales/firma) **+** NUEVO: formulario funcional, favicon/manifest del logo real, 404 de
  marca, GDPR Cookiebot (free, pluggable), a11y AA con axe-core. **(ii)** Gate de launch-readiness = S2 + audits
  SEO/OG/JSON-LD + axe-core AA + form + favicon/manifest + 404 + Cookiebot + analytics-condicionado + headers +
  legales + firma; falla cualquiera ⇒ no "lanzado". CWV de campo = post-lanzamiento (ADR-010). **(iii) DECISIÓN
  ABIERTA presentada:** approach del formulario — (1) Vercel function + Resend [recomendado] / (2) Formspree. **(iv)**
  Cookiebot DECIDIDO (pluggable, patrón del gateway de imágenes ADR-011). Reconcilia con ECO-56/58 + ADR-010/011/012,
  no re-litiga; fasificado en **FB5**.

## Sources (verificadas)
- Repo (estado actual, COMMITEADO): generador *extract-then-compose* `.claude/skills/launch-satellite/scripts/generate-satellite.mjs`;
  contrato escalar `.claude/skills/launch-satellite/schema/brief.schema.json`; piloto/fallo en
  [`satellites.md`](satellites.md). Reuse: `scripts/lib/i18n.mjs`, `scripts/lib/lighthouse.mjs`,
  `scripts/preview-satellite.mjs`, `design-system/sections/`, `design-system/registry/`, [ADR-011](../adr/011-satellite-image-assets.md).
- Mercado / arquitectura de importadores: captura-del-render html.to.design (https://html.to.design/); clon
  estático WP wp2static / Simply Static (https://simplystatic.com/); HTML→componentes html-to-react
  (https://github.com/aknuds1/html-to-react); WP headless Faust.js (https://faustjs.org/) y WPGraphQL
  (https://www.wpgraphql.com/); modelo de contenido WP+Elementor en `wp_postmeta._elementor_data`
  (https://developers.elementor.com/docs/).
- Refinamiento ECO-64 (estándar + gate, research tight): Cookiebot free + Consent Mode v2 (bloquea hasta
  consentimiento) — https://www.cookiebot.com/ y https://support.cookiebot.com/hc/en-us/articles/12756353963292-About-Google-Consent-Mode ;
  form-backend (Vercel function+Resend vs Formspree) — https://splitforms.com/blog/server-actions-vs-form-backend-nextjs
  y https://formspree.io/guides/nextjs/ ; a11y axe-core (WCAG A/AA, MPL-2.0, ~57% automatizable) —
  https://www.deque.com/axe/axe-core/ y https://www.w3.org/WAI/standards-guidelines/act/implementations/axe-core/ ;
  favicon/manifest desde el logo — https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs
  y https://faviconbuilder.com/guides/pwa-favicon-manifest-guide/ .
