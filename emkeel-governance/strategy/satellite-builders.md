# Strategy: satellite-builders

Status: APPROVED   <!-- modelo aprobado 2026-06-22 (ECO-62, ADR-012); FB0/FB1 = ECO-63; refinamiento ECO-64 (estándar profesional completo del núcleo común + gate de launch-readiness; formulario = opción 1 Vercel+Resend+Turnstile) APROBADO en el gate humano 2026-06-22, ADR-013, FB5 = ECO-65; refinamiento ECO-69 (diseño GENERATIVO por composición + componentes INMUTABLES + estándar VIVO mantenido contra el mercado + registro del toggle de tema) PRESENTADO al gate humano 2026-06-23 — PENDIENTE de aprobación (no decidido); refinamiento ECO-71 (SEPARAR el ESQUELETO determinista de la BELLEZA: la IA-diseñador GENERA el diseño, se PERSISTE como artefacto propio, los gates lo VALIDAN — SUPERA el MECANISMO de generación de ADR-014/ECO-69, reusa su esqueleto) APROBADA en el gate humano 2026-06-25 — opción 3 (spec de diseño persistido → compilador delgado) con el constraint INNEGOCIABLE: el spec debe ser EXPRESIVO de verdad (diseño arbitrario sobre todo el vocabulario em-ui + tokens), NUNCA un menú role→shell; ADR-015 -->
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

**Estado: refinamiento APROBADO (gate humano, 2026-06-22; ECO-64) — formulario = opción 1; [ADR-013](../adr/013-satellite-launch-readiness-standard.md); FB5 = [ECO-65](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-65).** La estrategia fijó el MECANISMO
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
- **Formulario de contacto/lead FUNCIONAL** (backend/email real) — approach = **decisión ABIERTA** (abajo). El
  **anti-spam es PROPIO**: el **`TurnstileWidget` de em-ui** (Cloudflare Turnstile, `design-system/components/TurnstileWidget.tsx`,
  en el registry) — sin dependencia externa, consistente con el norte de ownership; cualquier opción de backend lo lleva.
- **Favicon + iconos + web manifest DERIVADOS del logo real** del cliente (parte del pilar de imágenes, ADR-011):
  de un logo ≥512² → `favicon.ico` (≥32²), `favicon.svg`, apple-touch-icon 180² (opaco, padding), 192²+512² PNG +
  `site.webmanifest` — el set mínimo moderno (https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs,
  https://faviconbuilder.com/guides/pwa-favicon-manifest-guide/). Generable de los assets reales (sharp), nunca inventado.
- **SEO ampliado** (sobre el OG/JSON-LD de ECO-56): **Twitter Cards** (`twitter:card=summary_large_image` +
  título/descripción/imagen, https://developer.x.com/en/docs/twitter-for-websites/cards/overview/abouts-cards) y
  **structured data POR TIPO de contenido** — **FAQPage** para secciones FAQ, **Service/Offer** para servicios
  (https://schema.org/FAQPage, https://schema.org/Service) — además de Organization/LocalBusiness/BreadcrumbList.
  Aplicable **según el contenido**; ausente → se **omite, nunca se inventa** (mismo guardrail §D4).
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
- **Toggle de tema MANUAL en el header** (añadido ECO-68; **registrado aquí por la lista viva**, §Refinamiento
  ECO-69 D): botón visible cableado al `ThemeContext`, montado **DENTRO del `ThemeProvider`**; es el `ThemeToggle`
  de em-ui vía registry (`design-system/components/ThemeToggle.tsx`, `design-system/registry.json:344`), **nunca**
  copia local. Exigido por el gate de launch-readiness (`.claude/skills/launch-satellite/scripts/builders/lib/launch-ready.mjs:151`).
  **Primer indispensable añadido por el mecanismo de lista viva** (§Refinamiento ECO-69 C).

### Eje de decisión ABIERTO — approach del FORMULARIO funcional (a aprobar en el gate)
> El operador decide; aquí van las opciones investigadas + recomendación. (Presentada, **no tomada**.)

| # | Approach del formulario | Source | Pros | Cons | Riesgo |
|---|---|---|---|---|---|
| 1 | **Vercel function/Server Action + Resend + Turnstile (em-ui)** | https://splitforms.com/blog/server-actions-vs-form-backend-nextjs | **formulario PROPIO** con deliverability (Resend) **y anti-spam PROPIO** (`TurnstileWidget`, `design-system/components/TurnstileWidget.tsx`) resueltos; ownership total, sin dep externa en runtime; satélite autosuficiente | mantenemos deliverability/dominio verificado; algo más a construir | medio |
| 2 | **Form-backend service (Formspree)** | https://formspree.io/guides/nextjs/ | email-a-inbox out-of-the-box, dashboard, anti-spam/deliverability resueltos, cero backend | dep externa por satélite; menos "código propio"; límites del plan free | bajo-medio |

**APROBADA por el operador (gate humano, 2026-06-22): Opción 1** (Vercel Server Action + Resend + Turnstile) —
formulario **propio** con deliverability y anti-spam resueltos, encaja con "código en nuestro control" y deja el
satélite autosuficiente; **pluggable** a un form-service por cliente cuando se prefiera cero mantenimiento.
Registrada en [ADR-013](../adr/013-satellite-launch-readiness-standard.md).

### El GATE de launch-readiness (extiende S2 a un gate profesional COMPLETO)
El núcleo común **NO declara "lanzado"** hasta que el satélite cumple TODO el estándar. Igual que el gate lossless
caza un sub-campo caído (SEO), este caza **cualquier indispensable que falte → nada sale a medias**. Verifica
(lab, por construcción): **Lighthouse S2** (Perf≥90/SEO≥95/BP≥95/A11y≥90) + audits SEO nombrados + OG/JSON-LD +
**Twitter Cards** + **structured data por tipo válido** (FAQPage/Service donde aplique) · **a11y AA con axe-core
sin violations** (incomplete → revisión humana) · **formulario** presente, su endpoint responde **y lleva el
anti-spam Turnstile** · **favicon/manifest/apple-touch** presentes · **404 de marca** · **Cookiebot CMP** presente
+ **analytics condicionado al consentimiento** · **toggle de tema manual** en el header, cableado al `ThemeContext`
y montado DENTRO del `ThemeProvider` (ECO-68) · **headers HTTPS S2** · **páginas legales** + **"Powered by EM"**.
Cada ítem = un check; **falla cualquiera ⇒ NO "lanzado"**. (CWV de **campo** = objetivo post-lanzamiento, no
gate — ADR-010.)

### El estándar es una LISTA VIVA / EXTENSIBLE (la escalabilidad, explícita)
El estándar **no es una lista cerrada**: es el **mecanismo de extensión** del producto. Una demanda futura
(otro indispensable que el mercado o un cliente exija) se añade **vía un refinamiento gobernado de `/strategy`**
(como este ECO-64) → entra al **ESTÁNDAR** del núcleo común **y** al **GATE de launch-readiness** → lo **heredan
TODOS los builders** (desde-archivo, desde-URL, los que vengan) **sin reescribir nada por builder**. El núcleo
común es el único punto de cambio; el gate garantiza que ningún satélite salga sin el nuevo indispensable. Así el
estándar **crece con el producto** sin re-litigar el norte ni tocar los adapters.

### Decisión — APROBADA (gate humano, 2026-06-22)
Estándar profesional completo (incl. anti-spam Turnstile propio, SEO ampliado Twitter Cards + structured-data-por-tipo)
+ gate de launch-readiness + el estándar como **lista viva/extensible**; **formulario = opción 1 (Vercel Server
Action + Resend + Turnstile)**. **APROBADA** por el operador. Registrada en
[ADR-013](../adr/013-satellite-launch-readiness-standard.md); reconcilia con ECO-56/58 + ADR-010/011/012; se
implementa en **FB5** ([ECO-65](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-65), con/sobre FB2).

## Refinamiento ECO-69 — DISEÑO GENERATIVO por composición + COMPONENTES INMUTABLES + estándar VIVO contra el mercado

**Estado: PRESENTADO al gate humano (2026-06-23) — PENDIENTE de aprobación (no decidido).** El operador
aprueba / refina / aborta en el gate (`/strategy` paso 7). Reutiliza [ADR-010](../adr/010-satellite-design-generation.md)
(diseño híbrido), [ADR-012](../adr/012-satellite-builders-architecture.md) (builders→IR→emitter) y
[ADR-013](../adr/013-satellite-launch-readiness-standard.md) (estándar+gate, lista viva §7); **no re-litiga**.
Cierra la brecha entre lo que el norte decidió (ADR-010 op.3: "la IA propone composición") y lo que el emit hace.

**El problema medido.** ADR-010 §1 fijó el diseño **HÍBRIDO**: biblioteca de secciones gobernada (sustrato S2/a11y/
SEO por construcción) **+** la IA **propone** tipo/secciones/composición como `proposed`, confirmable en el loop (§D4).
Pero el emit actual **NO compone generativamente**: la composición la fija `siteType` con un orden por defecto
(`.claude/skills/launch-satellite/scripts/generate-satellite.mjs:122`, `DEFAULT_HOME_COMPOSITION`) y cada bloque del IR
cae en su renderer por un `switch (b.kind)` (`.claude/skills/launch-satellite/scripts/builders/lib/emit-blocks.mjs:41`)
→ composición **MECÁNICA** (bloque→sección fija) → diseño **POBRE** (el piloto Atis salió "más feo que el original",
[`satellites.md`](satellites.md)). La opción 3 quedó **decidida pero sin implementar generativamente**.

### (A) DISEÑO GENERATIVO POR COMPOSICIÓN — cumple ADR-010 opción 3
La IA **DISEÑA** generativamente sobre el contenido real (lossless) + la marca: decide **qué componente** va en cada
sección, **en qué orden**, **con qué función**, **con qué layout y jerarquía visual** — para que el sitio resulte
**ATRACTIVO**, no solo correcto. La creatividad vive en el **CÓMO se componen** los componentes (como un diseñador con
un design system), **NO** en un mapeo mecánico bloque→sección-fija. Implementa el **"diseño libre" de §D4** que el
emit mecánico no honró. Es el patrón de los builders con IA serios: v0 genera **variaciones** de composición
(https://vercel.com/blog/how-to-prompt-v0), Lovable compone **sección a sección** y pregunta
(https://docs.lovable.dev/prompting/prompting-one), sobre un vocabulario gobernado (Tailwind UI marketing,
https://tailwindcss.com/plus/ui-blocks/marketing). **Guardrail intacto (§D4):** la libertad es de DISEÑO (capa
`proposed`); los HECHOS (copy/servicios/contacto del IR) jamás se inventan ni se pierden (lossless).

### (B) COMPONENTES INMUTABLES — nueva regla de gobierno de diseño + GATE de drift
La IA **USA y COMPONE** los componentes de em-ui / design-system; **NO los modifica**. Lo único que ajusta para la
marca es **TAMAÑO y COLORES**, vía **tokens** (no reescribiendo el componente). Es el patrón correcto de un design
system: shadcn/ui themea **sobreescribiendo tokens semánticos** (`background`/`foreground`/`primary`) "para cambiar el
aspecto **sin reescribir las clases del componente**" y **desaconseja modificar el código fuente del componente**
(mantén los originales intactos; envuelve con wrappers) — https://ui.shadcn.com/docs/theming. Razón: un componente
modificado **deriva (drift)** del registry y rompe la herencia transversal (el núcleo común deja de ser el único punto
de cambio). Un cambio de componente para **UN** satélite concreto se decide **aparte/después** (su propia decisión),
nunca como efecto colateral del diseño.
**GATE (nuevo check de drift):** el gate de launch-readiness detecta **componentes copiados al satélite que difieren
de los de em-ui** (fuente de verdad: `design-system/registry.json:344` + `design-system/components/`), salvo el theming
por tokens permitido → **falla**. Igual que el gate lossless caza un sub-campo caído, este caza un componente
"forkeado" → **nada deriva en silencio**.

### (C) El ESTÁNDAR es una LISTA VIVA MANTENIDA CONTRA EL MERCADO ("siempre al día")
Refina §7 (lista viva de ADR-013) con su **mecanismo de mantenimiento**. El estándar + el gate son un **SUELO
DETERMINISTA** (checklist fijo, verificado por construcción — **no** la IA adivinando requisitos cada vez; eso sería
no-reproducible, lo que ADR-010 descartó). Para que el suelo **no se congele** se declara un **MECANISMO DE REFRESCO**:
- **Disparador por norma:** cuando una norma del sector cambia, se abre un refinamiento `/strategy` que actualiza la
  lista viva. El suelo **se mueve con el mercado** — hechos: **CWV** cambió (INP **reemplazó** a FID como Core Web
  Vital, 12-mar-2024, https://web.dev/blog/inp-cwv-march-12); **WCAG 2.2** pasó a Recomendación W3C (5-oct-2023,
  https://www.w3.org/WAI/news/2023-10-05/wcag22rec/); **GDPR/consent** endureció (Google **Consent Mode v2**
  obligatorio en EEE, 6-mar-2024, https://support.google.com/google-ads/answer/13695607); **seguridad** evoluciona
  (OWASP Secure Headers Project mantiene el set recomendado, https://owasp.org/www-project-secure-headers/).
- **Revisión periódica:** además del disparador reactivo, una **revisión trimestral** del estándar contra las mejores
  prácticas del mercado (informada por research real, como este refinamiento), por si una práctica sube de
  "nice-to-have" a indispensable sin un cambio de norma formal.
- **Vía única:** cada cambio entra **solo** por un refinamiento gobernado de `/strategy` (gate humano) → al **estándar**
  del núcleo común **y** al **gate** → lo **heredan TODOS los builders** sin reescribir nada por builder. El suelo es
  determinista; el **mantenimiento** lo mantiene al día. (Acota el scope-creep: cada adición pasa por el gate humano y
  el único punto de cambio.)

### (D) REGISTRAR EL TOGGLE EN EL §ESTÁNDAR — primera extensión aplicada por la lista viva
Ya implementado (ECO-68 + [ADR-013](../adr/013-satellite-launch-readiness-standard.md) §6; **check 16** del gate,
`.claude/skills/launch-satellite/scripts/builders/lib/launch-ready.mjs:151`). Faltaba listarlo en el §estándar de este
norte → **registrado** (ver §«El ESTÁNDAR profesional completo»): **toggle de tema MANUAL en el header**, cableado al
`ThemeContext`, montado **DENTRO del `ThemeProvider`** — **exigido por el gate de launch-readiness** (`ThemeToggle` de
em-ui vía registry, `design-system/components/ThemeToggle.tsx`; nunca copia local). Es el **ejemplo vivo** del
mecanismo (C): un indispensable que entró por un refinamiento gobernado y ahora lo heredan todos los builders.

### (E) FLUJO — "REGENERAR DISEÑO" en el gate de fidelidad visual
La revisión humana del preview gana una **tercera** respuesta:
- **"se ve bien"** → avanza (a F3 / lanzar).
- **"ajusta X"** → ajuste **puntual** (un cambio acotado sobre la composición actual).
- **"regenera el diseño"** → la IA **rediseña la composición desde cero** (otra propuesta generativa: **mismos
  componentes inmutables + mismo contenido real lossless**, distinta composición / jerarquía). Materializa que el
  diseño es `proposed` y **reproponible** (§D4), no un one-shot.

### Eje de decisión — generación del diseño (a aprobar en el gate)
> El operador decide; aquí van las opciones investigadas + recomendación. (Presentada, **no tomada**.)

| # | Modelo de generación del diseño | Source | Pros | Cons | Riesgo |
|---|---|---|---|---|---|
| 1 | **Mecánico (status quo)** — bloque→sección fija, orden por `siteType` | .claude/skills/launch-satellite/scripts/builders/lib/emit-blocks.mjs:41 | simple, determinista, ya existe | diseño POBRE (Atis "más feo que el original"); **no honra** ADR-010 op.3 | **Alto** — es la brecha a cerrar |
| 2 | **Generativo por composición** — la IA compone (qué componente / orden / layout) sobre componentes **inmutables** + contenido **lossless** | https://vercel.com/blog/how-to-prompt-v0 | **cumple ADR-010 op.3**; diseño atractivo; **reproponible** ("regenerar"); HECHOS intactos (§D4); sin drift (gate B) | exige el motor de composición + el gate de drift + revisión humana en el gate visual | Medio — acotado por gate de drift + §D4 |

**Recomendación (PRESENTADA, no tomada):** **Opción 2** — diseño generativo por composición, con **componentes
inmutables** (gate de drift), el **estándar como lista viva mantenida contra el mercado**, el **toggle registrado** en
el §estándar como primer indispensable vivo, y **"regenerar diseño"** en el flujo visual. **El operador aprueba /
refina / aborta en el gate.** Si se aprueba → ADR-014 + ECO de build (FB6 sobre FB2/emit). **No re-litiga** ADR-010/012/013.

## Refinamiento ECO-71 — SEPARAR el ESQUELETO (determinista) de la BELLEZA (la IA diseñadora): la IA GENERA el diseño, se PERSISTE, los gates lo VALIDAN

**Estado: APROBADA en el gate humano (2026-06-25, ECO-71) — opción 3, con el constraint INNEGOCIABLE de expresividad (abajo). La aprobación se registra en el MERGE del PR de la lane; `process.json` queda en `presented`.** Re-examina DESDE CERO el
MECANISMO de diseño. **SUPERA el enfoque de generación de [ADR-014](../adr/014-satellite-generative-composition.md)/ECO-69**
("generativo por composición" *tal como se implementó*) y la deuda de ECO-70 (FB6). **NO re-litiga**: builders→IR→emitter
([ADR-012](../adr/012-satellite-builders-architecture.md)), el estándar+gate ([ADR-013](../adr/013-satellite-launch-readiness-standard.md)),
ni lo que de ADR-014 **SÍ es esqueleto y se conserva**: componentes INMUTABLES + gate de drift (§2), estándar VIVO contra el
mercado (§3), "regenerar" (§5). Re-piensa SOLO el corazón: **cómo nace la belleza** — y dónde vive el determinismo.

### El problema medido (por qué desde cero)
Cada intento de "que la IA diseñe" terminó siendo un **MOTOR DETERMINISTA** — reglas, plantillas, clasificadores — que produce
sitios CORRECTOS pero NO BELLOS:
- El emit mecánico agrupa bloques por heading y **alterna fondos** (`gi % 2`) → bandas uniformes (`.claude/skills/launch-satellite/scripts/builders/lib/emit-blocks.mjs:93`),
  y el orden lo fija una **constante** (`.claude/skills/launch-satellite/scripts/generate-satellite.mjs:122`, `DEFAULT_HOME_COMPOSITION`).
- ECO-70/FB6 intentó "componer generativamente" pero **salió OTRO motor determinista**: un CLASIFICADOR de secciones + una TABLA
  de layouts + N *shells* fijos → la **MÁQUINA decide** el diseño eligiendo 1-de-2 variantes por rol. **Más reglas variadas ≠ la IA diseña.**
- **"Mejorar" un sitio sale PEOR:** la captura lossless guarda el **CONTENIDO** (no el diseño del original); el motor le pone solo
  plantillas → se pierde el alma visual del original sin ganar una nueva.

**Causa raíz:** pusimos el DETERMINISMO en el lugar equivocado — en **DECIDIR** el diseño. El determinismo debe vivir en
**CAPTURAR** el contenido y en **VALIDAR** el resultado; la DECISIÓN de diseño es trabajo de un **DISEÑADOR** — y ese rol lo
encarna la **IA**, no un clasificador.

### Cómo lo hacen los builders reales (investigado) — el patrón dominante
Los builders con IA serios **NO usan un motor de reglas para diseñar**: la IA GENERA código/diseño real, y la reproducibilidad se
compra **PERSISTIENDO la salida**, no haciendo determinista al modelo.
- **v0 (Vercel):** el LLM **GENERA** código React/Tailwind/shadcn real ("copy and paste that code into your app") — no elige
  plantillas (https://vercel.com/blog/announcing-v0-generative-ui). Se mantiene en-sistema porque un **REGISTRY** le pasa los
  componentes + design tokens al modelo ("a distribution specification designed to pass context from your design system to AI
  Models", https://v0.app/docs/design-systems). Las generaciones se **PERSISTEN** (historial + GitHub sync, cada cambio = un
  commit) y el código es **TUYO** (https://v0.app/faq). v0 es un modelo COMPUESTO: RAG + LLM (Sonnet) + post-procesador de
  auto-fix (https://vercel.com/blog/v0-composite-model-family).
- **Lovable / bolt.new:** generan **CÓDIGO estándar que el usuario POSEE** ("clone your repository, modify it outside Lovable",
  https://docs.lovable.dev/tips-tricks/deployment-hosting-ownership); coherentes vía "knowledge"/reglas + stack fijo
  (https://docs.lovable.dev/features/knowledge); se itera **re-prompteando el proyecto persistido** o editando código, con git
  bidireccional (https://support.bolt.new/building/intro-bolt). Edición a nivel sección/estilo SIN prompt = "Visual Edits"
  (tokens/clases) (https://lovable.dev/blog/introducing-visual-edits).
- **shadcn/ui — codegen-as-source:** "a code distribution system" cuyo primer principio es **Open Code**: te entrega "the actual
  component code... you own it" → se **GENERA una vez y se COMETE como fuente propia** (https://ui.shadcn.com/docs). Es exactamente
  "generar → persistir como fuente → validar".
- **El modelo NO es reproducible por sí solo:** aun con `temperature` 0 "the results will not be fully deterministic" (Anthropic,
  https://platform.claude.com/docs/en/api/messages) ⇒ la reproducibilidad se OBTIENE persistiendo el artefacto, no re-rodando el
  modelo en cada render.
- **La validación es determinista (golden + por construcción):** regresión visual con golden images COMMITEADAS
  (`toHaveScreenshot`, "commit this directory to your version control", https://playwright.dev/docs/test-snapshots), a11y con
  axe-core (https://www.deque.com/axe/axe-core/), y **design tokens** como superficie de restricción (W3C Design Tokens,
  https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/).

**El patrón único que destila la investigación:** la IA **GENERA** el artefacto (creativo, no determinista) → el artefacto se
**PERSISTE** como fuente propia → **gates DETERMINISTAS lo VALIDAN**. Creatividad arriba; determinismo en **fijar + validar**.

### (1) ROLES del pipeline — cada etapa un rol de ingeniero que la IA encarna
El pipeline se lee como un EQUIPO; el **IR es la frontera** entre captura y diseño, y el **artefacto de diseño** es la frontera
entre diseño y validación.
- **R1 · Archivista (captura):** backup → IR. Mandato: capturar TODO lo que el backup contiene, **no inventar nada**, declarar
  `notInSource`. Determinista. *(reusa `adapters/wordpress.mjs`; gate `lib/lossless.mjs`.)*
- **R2 · Modelador (el contrato):** normaliza CUALQUIER fuente al MISMO IR agnóstico. Mandato: **el IR es la frontera** — todo
  adapter lo produce, todo aguas-abajo lo consume. *(reusa `lib/ir.mjs`.)*
- **R3 · Arquitecto de sistema (el ESQUELETO + estándares):** arma el scaffold SAT01 + el estándar profesional (formulario/favicon/
  404/Cookiebot/a11y/SEO) + **expone el VOCABULARIO GOBERNADO** (registry em-ui + tokens). Mandato: el **SUELO determinista** que
  TODO satélite hereda — fuerte, aburrido, garantizado. *(reusa `lib/emit-professional.mjs`, `lib/launch-ready.mjs`.)*
- **R4 · Diseñador SENIOR (el CORAZÓN, la BELLEZA):** la IA, como diseñador de producto senior, **GENERA** el diseño sobre el
  contenido real (IR) + el vocabulario gobernado + los tokens de marca. Mandato: **que sea BELLO**; HECHOS intactos (§D4: nunca
  inventar/perder copy); **COMPONER, no modificar** (componentes inmutables, tematizar por tokens). Salida: un **ARTEFACTO de
  diseño PERSISTIDO**.
- **R5 · Crítico / Director de arte (crítica):** revisa adversarialmente el diseño generado — ¿es bello? ¿en-marca? ¿accesible?
  ¿lossless? ¿sin drift? Mandato: **aceptar o devolver a regenerar**; el **gate visual humano** es la autoridad final
  ("se ve bien" / "ajusta X" / "regenera").

### (2) EL CORAZÓN — la IA GENERA belleza Y se mantiene REPRODUCIBLE + GATEADA
El mecanismo concreto, alineado con v0/Lovable/shadcn:
1. **La IA DISEÑA** (R4): recibe el IR (contenido real) + el registry em-ui (vocabulario) + tokens de marca, y GENERA el diseño
   **como un diseñador** — decide secciones, qué componente, orden, jerarquía, énfasis, layout, ritmo, tratamiento de hero. **NO**
   es elegir 1-de-2 en una tabla: es **composición libre sobre un vocabulario gobernado** (el modelo de v0: el registry le pasa
   componentes+tokens, la IA compone). Creatividad REAL.
2. **Se PERSISTE** el resultado de la IA como **ARTEFACTO PROPIO** en el satélite (codegen-as-source, patrón shadcn *Open Code*).
   Re-emitir **REPLAY-ea** el artefacto → reproducible (porque el output está COMMITEADO, **no re-rodado** — el modelo no es
   determinista ni a temp 0).
3. **Los gates lo VALIDAN** (deterministas): **lossless** (IR == sitio, nada se cae — `lib/lossless.mjs` `verifyEmit`), **estándar
   profesional** (launch-readiness — `lib/launch-ready.mjs`), **drift** (componentes em-ui sin forkear — ADR-014 §2), y **regresión
   visual + a11y** (golden images + axe-core).
4. **"Regenerar"** (ADR-014 §5) = una **NUEVA pasada creativa** de la IA (otro artefacto), NO un re-roll en render. El humano juzga
   en el gate visual.

**El determinismo vive en FIJAR + VALIDAR lo que la IA creó, no en decidir el diseño.** Eso resuelve la confusión histórica
("más reglas" ≠ diseño).

### Eje de decisión — el MECANISMO de generación del diseño (a aprobar en el gate)
> El operador decide; aquí van las opciones investigadas + recomendación. (Presentada, **no tomada**.)

| # | Mecanismo de generación | Source | Pros | Cons | Riesgo |
|---|---|---|---|---|---|
| 1 | **Motor determinista (status quo)** — clasificador + tabla de layouts + *shells* fijos; la MÁQUINA decide el diseño | .claude/skills/launch-satellite/scripts/generate-satellite.mjs:122 | simple, reproducible, ya existe | **NO genera belleza** (el fallo medido); es "más reglas", no diseño; "mejorar" sale peor | **Alto** — la brecha a cerrar |
| 2 | **IA en RENDER-time** — llamar al modelo en cada emisión | https://platform.claude.com/docs/en/api/messages | máxima libertad de la IA | **NO reproducible** (ni a temp 0) ni gateable; sin artefacto propio que validar/versionar | **Alto** — rompe la reproducibilidad que ADR-010 exigió |
| 3 | **IA escribe un SPEC de diseño PERSISTIDO** (composición en vocabulario em-ui) → **compilador determinista** lo emite | https://v0.app/docs/design-systems | la IA decide **TODO** el diseño; el **SUELO** (lossless/drift/estándar/tokens) queda garantizado **POR CONSTRUCCIÓN**; reproducible (spec persistido); regenerar = nuevo spec; lossless/drift triviales de gatear | exige el compilador + un spec **EXPRESIVO** (si es pobre, recae en el status quo) | **Medio** — acotado por gates + §D4 |
| 4 | **IA escribe el CÓDIGO final (JSX) directo** al satélite → gateado **a posteriori** | https://vercel.com/blog/announcing-v0-generative-ui | **techo creativo máximo** (patrón v0/bolt/Lovable: código real propio) | lossless/estándar/drift/tokens pasan a ser gates **POST-HOC** → bucles de reparación; el suelo **NO** está garantizado por construcción | **Medio-alto** — reabre la pérdida/drift que los gates existen para evitar |

**Recomendación (PRESENTADA, no tomada): Opción 3** — la IA escribe un **SPEC de diseño EXPRESIVO** (toda la decisión de diseño:
secciones/componente/orden/jerarquía/énfasis/layout/ritmo, sobre el vocabulario em-ui + tokens), **PERSISTIDO** en/junto al IR, y un
**COMPILADOR delgado** lo emite con componentes inmutables; los gates (lossless/estándar/drift/visual+a11y) lo validan. Razón: el
VALOR del producto es el **SUELO GOBERNADO** (lossless + estándar + sin-drift + reproducible) — la op.3 mueve **TODA** la decisión
de diseño a la IA (mata el clasificador/tabla que hacía gris a `compose`) **y** mantiene el suelo por construcción. La op.4 maximiza
el techo pero **reabre justo los riesgos** (pérdida silenciosa, drift, estándar a medias) que los gates existen para prevenir, como
bucle de reparación. **El operador aprueba / refina / aborta en el gate.**

**DECISIÓN — APROBADA (gate humano, 2026-06-25; ECO-71): Opción 3.** La IA escribe un spec de diseño persistido y un compilador
delgado lo emite con componentes inmutables; los gates lo validan. Se registra en [ADR-015](../adr/015-satellite-ai-design-authoring.md);
la aprobación queda en el **merge** del PR de la lane (`process.json` en `presented`). Build por fases (G1…G5+) en ECOs aparte.

> **⛔ CONSTRAINT INNEGOCIABLE (condición de la aprobación) — el SPEC debe ser EXPRESIVO DE VERDAD.** Capaz de expresar **diseño
> ARBITRARIO** sobre **TODO** el vocabulario em-ui + la superficie de tokens (secciones/componente/orden/jerarquía/énfasis/layout/
> ritmo/agrupado/anidado/spans), **NO** un menú `role→shell` ni un enum fijo de roles. **Si el spec recae en plantillas, volvemos al
> status quo** (el fallo que este refinamiento cierra) — es un FALLO de diseño, no un detalle de build. El gate de la fase G3 debe
> demostrar expresividad real (p.ej. dos satélites con composiciones genuinamente distintas del MISMO tipo de contenido), no sólo
> "compila y pasa lossless". El compilador es un tipógrafo tonto; **toda** la decisión de diseño vive en el spec que autora la IA.

### (3) ORGANIZACIÓN — un skill, un rol = un directorio, el IR como frontera
Sigue siendo **UN** skill (`launch-satellite`), pero **cada ROL vive en su propio directorio**, con el **IR como contrato** entre
etapas y el **ARTEFACTO de diseño** como contrato entre diseño y validación:
- **Motor genérico** (agnóstico de producto): captura+adapters, IR/modelo, gates lossless, el **contrato del compilador**, el gate
  de drift. No sabe de em-ui.
- **Binding de producto** (NexaCore): el **registry em-ui** (el vocabulario que R4 usa) + el estándar profesional.
El layout exacto de directorios es trabajo de **build** (runbook), no del norte; el norte FIJA el **principio**: rol=directorio,
IR=frontera, motor-genérico **vs** binding-de-producto.

### (4) ROADMAP por fases — una habilidad/rol por fase; cada una entregable y verificable sola
- **G1 — Captura + IR (R1/R2): REUSAR y endurecer.** Ya existe (`lib/ir.mjs`, `adapters/wordpress.mjs`, `lib/lossless.mjs`).
  Re-hogar en `capture/`+`model/`. *Verificable:* gate de captura verde sobre Atis.
- **G2 — Esqueleto + estándar (R3): REUSAR y aislar.** scaffold + estándar profesional + launch-readiness + drift
  (`lib/emit-professional.mjs`, `lib/launch-ready.mjs`, drift §2). *Verificable:* 16 checks + drift verdes.
- **G3 — El CORAZÓN (R4): REEMPLAZAR la capa de decisión.** La IA-diseñador + el **spec de diseño persistido** + el **compilador
  delgado**, sustituyendo `compose`/`renderMain`/`DEFAULT_HOME_COMPOSITION`. *Verificable:* emitir un satélite cuyo diseño AUTORÓ la
  IA, gates verdes, y **"mejor que el original"** en Atis (gate visual humano).
- **G4 — Crítica + regenerar (R5):** crítica adversarial + **"regenerar diseño"** en el gate visual, persistido.
- **G5+ — Generalización:** el corazón de diseño-autoría se reaplica a los otros modos de intake (URL/marca/…) cuando alimenten el IR.

### (5) QUÉ SE REUSA vs QUÉ SE REEMPLAZA
- **REUSAR (el esqueleto fuerte — mantener, endurecer, re-hogar):** IR (`lib/ir.mjs`); adapter de captura (`adapters/wordpress.mjs`);
  gates lossless captura+emisión (`lib/lossless.mjs`); scaffold + estándar profesional + ingestión de media (`lib/emit-professional.mjs`);
  launch-readiness (`lib/launch-ready.mjs:151`); componentes INMUTABLES + gate de drift (ADR-014 §2; registry `design-system/registry.json:344`);
  el **render lossless POR BLOQUE como PRIMITIVA** (`lib/emit-blocks.mjs` `renderBlock` — la IA **compone CON** estas primitivas, no
  las reescribe); preview, i18n, SEO.
- **REEMPLAZAR (la capa de DECISIÓN determinista → la IA-diseñador):** la composición mecánica — `DEFAULT_HOME_COMPOSITION`
  (`generate-satellite.mjs:122`), el agrupado-por-heading + bandas alternas de `renderMain` (`emit-blocks.mjs:93`), y el motor de
  ECO-70/FB6 (clasificador + tabla de layouts + *shells* fijos). La **DECISIÓN** de qué/cómo componer pasa de **código** a la **IA**;
  un compilador delgado RINDE lo que la IA decidió (lossless, con componentes inmutables).
- **Matiz clave:** se reusa el **RENDER LOSSLESS de contenido atómico** (`renderBlock`); se reemplaza la **DECISIÓN compositiva**
  (qué bloques agrupan en qué sección, con qué componente, en qué orden, con qué jerarquía y layout).

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
- **D — Estándar profesional COMPLETO del núcleo común + GATE de launch-readiness (ECO-64, APROBADA — gate
  humano 2026-06-22; [ADR-013](../adr/013-satellite-launch-readiness-standard.md); FB5 = [ECO-65](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-65)).** Fija de una vez el estándar de "sitio profesional óptimo" en el núcleo común
  (cross-cutting, todo builder lo hereda) para acabar con los indispensables a parches, + un gate que NO declara
  "lanzado" hasta cumplirlo TODO (ver §«Refinamiento ECO-64»). **(i)** Estándar = lo ya cubierto (SEO/i18n/S2/§D4/
  imágenes/em-ui/headers/legales/firma) **+** NUEVO: formulario funcional, favicon/manifest del logo real, 404 de
  marca, GDPR Cookiebot (free, pluggable), a11y AA con axe-core. **(ii)** Gate de launch-readiness = S2 + audits
  SEO/OG/JSON-LD + axe-core AA + form + favicon/manifest + 404 + Cookiebot + analytics-condicionado + headers +
  legales + firma; falla cualquiera ⇒ no "lanzado". CWV de campo = post-lanzamiento (ADR-010). **(iii) Formulario =
  opción 1 APROBADA:** Vercel Server Action + Resend + **anti-spam propio Turnstile** (`TurnstileWidget` de em-ui).
  **(iv)** Cookiebot DECIDIDO (pluggable, patrón del gateway de imágenes ADR-011). **(v)** estándar = **lista viva/
  extensible** (nuevo indispensable → refinamiento /strategy → estándar+gate → todos los builders). Reconcilia con
  ECO-56/58 + ADR-010/011/012, no re-litiga; fasificado en **FB5** (ECO-65).
- **D — Diseño GENERATIVO por composición + componentes INMUTABLES + estándar VIVO mantenido contra el mercado +
  registro del toggle (ECO-69). PRESENTADA al gate humano 2026-06-23 — PENDIENTE de aprobación (no decidido).** Cierra
  la brecha de ADR-010 op.3 (decidida pero implementada en emit MECÁNICO, `generate-satellite.mjs:122` /
  `emit-blocks.mjs:41`). **(A)** la IA **diseña** la composición (qué componente / orden / función / layout) sobre
  contenido lossless + marca — creatividad en el CÓMO, no en mapeo bloque→sección-fija (§D4 `proposed`). **(B)**
  **componentes inmutables**: se USAN/COMPONEN, no se modifican; solo tamaño/colores vía tokens (patrón shadcn:
  themear por tokens, no tocar el fuente); **GATE de drift** falla si un componente del satélite difiere del de em-ui
  (`design-system/registry.json:344`). **(C)** estándar = **suelo determinista** + **mecanismo de refresco** (disparador
  por cambio de norma GDPR/WCAG/CWV/seguridad + revisión trimestral) vía refinamiento `/strategy` → único punto de
  cambio; el suelo se mueve con el mercado (INP↔FID, WCAG 2.2, Consent Mode v2, OWASP). **(D)** **toggle** registrado en
  el §estándar (ya vivo en el gate, ECO-68, `launch-ready.mjs:151`) — 1ª extensión por la lista viva. **(E)** flujo
  visual gana **"regenerar diseño"** (rediseño desde cero, mismos componentes + mismo contenido). **Recomendación:
  opción 2 (generativo), PRESENTADA no tomada.** Si se aprueba → ADR-014 + build FB6. Reutiliza ADR-010/012/013, no re-litiga.
- **D — SEPARAR el ESQUELETO (determinista) de la BELLEZA (IA diseñadora): la IA GENERA el diseño, se PERSISTE, los gates lo VALIDAN
  (ECO-71). APROBADA en el gate humano 2026-06-25 — opción 3 (spec de diseño persistido → compilador delgado); [ADR-015](../adr/015-satellite-ai-design-authoring.md); aprobación = merge del PR de la lane (`process.json` en `presented`). CONSTRAINT INNEGOCIABLE de la aprobación: el spec debe ser EXPRESIVO DE VERDAD (diseño arbitrario sobre TODO el vocabulario em-ui + tokens), NUNCA un menú role→shell — si recae en plantillas, vuelve el status quo; el gate de G3 debe demostrar expresividad real.** Re-examina DESDE CERO el MECANISMO de
  diseño y **SUPERA** el de ADR-014/ECO-69 (la "composición generativa" *salió otro motor determinista*: clasificador + tabla de
  layouts + *shells*, `generate-satellite.mjs:122` / `emit-blocks.mjs:93`). **Causa raíz:** el determinismo estaba en DECIDIR el
  diseño; debe vivir en CAPTURAR + VALIDAR. **(1) Roles:** R1 Archivista (captura) · R2 Modelador (IR=frontera) · R3 Arquitecto
  (esqueleto+estándar+vocabulario em-ui) · **R4 Diseñador senior (GENERA la belleza)** · R5 Crítico (gate visual). **(2) El corazón
  (patrón v0/Lovable/shadcn):** la IA DISEÑA sobre IR+registry+tokens → se PERSISTE como artefacto propio (codegen-as-source) →
  gates deterministas lo VALIDAN (lossless/estándar/drift/visual+a11y); re-emitir replay-ea (reproducible porque está commiteado,
  no re-rodado — el modelo no es determinista ni a temp 0); "regenerar" = nueva pasada creativa. **(3) Organización:** un skill,
  rol=directorio, IR=frontera, motor genérico vs binding em-ui. **(4) Roadmap:** G1 captura+IR (reusar) · G2 esqueleto+estándar
  (reusar) · G3 el corazón (REEMPLAZAR la decisión) · G4 crítica+regenerar · G5+ generalizar. **(5) Reuse vs replace:** REUSAR
  IR/captura/lossless/estándar/drift/launch-readiness + `renderBlock` como primitiva lossless; REEMPLAZAR la composición mecánica
  (`generate-satellite.mjs:122`, `emit-blocks.mjs:93`, motor ECO-70/FB6) por la IA-diseñador + compilador delgado. **Eje abierto:**
  mecanismo de generación, **recomendación opción 3 (spec de diseño persistido → compilador delgado), PRESENTADA no tomada.** Si se
  aprueba → ADR-015 + ECO de build por fase. **No re-litiga** ADR-012/013 ni el esqueleto de ADR-014 (§2 inmutables/drift, §3
  estándar vivo, §5 regenerar); supersede SÓLO el MECANISMO de generación.

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
- Ajuste ECO-64 (anti-spam propio + SEO ampliado): `TurnstileWidget` (Cloudflare Turnstile, anti-spam PROPIO)
  COMMITEADO en `design-system/components/TurnstileWidget.tsx` (en `design-system/registry.json`); Twitter Cards
  — https://developer.x.com/en/docs/twitter-for-websites/cards/overview/abouts-cards ; structured data por tipo
  — https://schema.org/FAQPage y https://schema.org/Service .
- Refinamiento ECO-69 (diseño generativo + componentes inmutables + estándar vivo, research tight):
  - **Brecha medida (repo, COMMITEADO):** composición mecánica `generate-satellite.mjs:122` (`DEFAULT_HOME_COMPOSITION`)
    + `builders/lib/emit-blocks.mjs:41` (`switch (b.kind)`); toggle ya vivo en el gate `builders/lib/launch-ready.mjs:151`
    (check 16, ECO-68); componente inmutable `design-system/components/ThemeToggle.tsx` en `design-system/registry.json:344`.
  - **Composición generativa sobre vocabulario gobernado (mercado):** v0 genera variaciones
    (https://vercel.com/blog/how-to-prompt-v0); Lovable compone sección a sección y pregunta
    (https://docs.lovable.dev/prompting/prompting-one); vocabulario de secciones (Tailwind UI,
    https://tailwindcss.com/plus/ui-blocks/marketing). *(reusa lo ya citado en ADR-010; no re-litiga.)*
  - **Compose-not-modify = themear por tokens, no tocar el fuente (mercado):** shadcn/ui themea sobreescribiendo
    tokens semánticos "sin reescribir las clases del componente" y desaconseja modificar el código del componente —
    https://ui.shadcn.com/docs/theming .
  - **El suelo se mueve con el mercado (disparadores de refresco):** INP reemplazó a FID como Core Web Vital (12-mar-2024,
    https://web.dev/blog/inp-cwv-march-12); WCAG 2.2 → Recomendación W3C (5-oct-2023,
    https://www.w3.org/WAI/news/2023-10-05/wcag22rec/); Google Consent Mode v2 obligatorio en EEE (6-mar-2024,
    https://support.google.com/google-ads/answer/13695607); OWASP Secure Headers Project (set recomendado mantenido,
    https://owasp.org/www-project-secure-headers/).
- Refinamiento ECO-71 (separar esqueleto/belleza: la IA genera → se persiste → los gates validan, research real):
  - **Brecha medida (repo, COMMITEADO):** la decisión de diseño la toma el CÓDIGO, no la IA — orden fijo por constante
    `generate-satellite.mjs:122` (`DEFAULT_HOME_COMPOSITION`) + agrupado-por-heading con bandas alternas `gi % 2` en
    `builders/lib/emit-blocks.mjs:93` (`renderMain`); el render lossless por bloque a REUSAR como primitiva es `renderBlock`
    (`builders/lib/emit-blocks.mjs:38`); esqueleto a reusar: IR `builders/lib/ir.mjs`, gates `builders/lib/lossless.mjs`,
    launch-readiness `builders/lib/launch-ready.mjs:151`, adapter `builders/adapters/wordpress.mjs`, registry `design-system/registry.json:344`.
  - **La IA GENERA código real, no plantillas (mercado):** v0 genera React/Tailwind/shadcn que copias a tu app
    (https://vercel.com/blog/announcing-v0-generative-ui), constreñida por un REGISTRY que le pasa componentes + design tokens
    al modelo (https://v0.app/docs/design-systems); v0 = modelo compuesto RAG+LLM+auto-fix (https://vercel.com/blog/v0-composite-model-family).
  - **Código generado = fuente PROPIA persistida (mercado):** Lovable/bolt generan código estándar que el usuario posee, con git
    bidireccional (https://docs.lovable.dev/tips-tricks/deployment-hosting-ownership, https://support.bolt.new/building/intro-bolt);
    edición a nivel sección/estilo sin prompt = Visual Edits (https://lovable.dev/blog/introducing-visual-edits); coherencia vía
    knowledge/reglas (https://docs.lovable.dev/features/knowledge); shadcn "Open Code" = codegen-as-source, lo posees
    (https://ui.shadcn.com/docs).
  - **Reproducibilidad = persistir el artefacto, NO el modelo:** el LLM no es determinista ni a `temperature` 0 ("the results
    will not be fully deterministic", https://platform.claude.com/docs/en/api/messages) ⇒ se valida con gates deterministas:
    regresión visual con golden commiteadas (https://playwright.dev/docs/test-snapshots), a11y axe-core
    (https://www.deque.com/axe/axe-core/), design tokens como restricción (W3C DTCG estable 2025.10,
    https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/).
