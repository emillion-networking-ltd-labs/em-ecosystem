# ECO-66 — FB2: EMITTER del builder (IR → satélite Next ENRIQUECIDO)

Strategy: satellite-builders

## Resumen
Construye **FB2** de [`satellite-builders`](../strategy/satellite-builders.md) ([ADR-012](../adr/012-satellite-builders-architecture.md),
opción 3): el **EMITTER** que convierte el **IR lossless** (FB0/FB1, ECO-63) en el satélite Next.js **visible**.
Reconstruye **FIEL en los HECHOS** (TODAS las páginas/copy/imágenes del IR se emiten — las 22 páginas de Atis) +
**CREATIVO en el DISEÑO** (mapea los bloques del IR a markup tokenizado em-ui, forma SAT01, código propio). Un
**gate de emisión lossless** cierra el ciclo: fuente→IR (FB1) + IR→sitio (FB2) = **nada se pierde de punta a punta**.
Integrado en `/launch-satellite`: la ruta "mejorar desde un backup" usa el builder **end-to-end** y es **previsualizable**.

## Decisiones que resuelve

### D — Emitter genérico (`scripts/builders/emit.mjs`), consume el IR, agnóstico de la fuente
`emitFromIR(ir, destDir, { brand?, colorMode? })` → satélite Next.js. **REUSA** el scaffold/layout/tema/SEO
probados del generador (templates **exportados** de `generate-satellite.mjs`: `NEXT_CONFIG`/`TSCONFIG`/`POSTCSS`/
`LAYOUT`/`PROVIDERS`/`THEME_CONTEXT`/`ROBOTS`/`SITEMAP`/`buildJsonLd`/`themeInitScript`/`navLabel`/`emui`) — no
duplica. Emite **una ruta por página del IR** + `em-ui init`/`add` (tokens + Button) + `ir.json` (procedencia, §D5).

### D — Reconstrucción ENRIQUECIDA: bloques del IR → markup tokenizado (`lib/emit-blocks.mjs`)
`renderMain(page)` mapea los `blocks` del IR a `<section>`s frescas con tokens em-ui (text-h*/content-*/surface-*/
accent): heading, prosa, imagen (`next/image`), botón (CTA), feature/icon-box, testimonio, lista, divider (con su
etiqueta). Agrupa por headings; el primer grupo de la HOME recibe **Hero de marca**. El HTML inline del original
(p.ej. `<br>`) se **limpia** (diseño fresco, no markup ajeno) preservando el copy. Es la base sobre la que la IA
**PROPONE** el mapeo IR→secciones (capa `proposed`, F6); el contenido real manda, el diseño se enriquece.

### D — Imágenes REALES del IR colocadas (ADR-011, assets reales)
El emitter **ingiere** las imágenes del IR a `public/images/` y las renderiza con `next/image`: logo en el header
(si la media es un logo local), fotos en las secciones. Las imágenes **usadas** por una página que no son de un
widget (p.ej. **fondos de sección** de Elementor) se colocan como **galería** al final → **ninguna imagen real se
pierde**. (La generación decorativa para rellenar huecos es aparte/después.)

### D — Aplica del IR/núcleo: marca, i18n, SEO, dark/light
**Marca** (`brand` → token `accent`), **i18n** (`ir.site.language` → `<html lang>` real + chrome ECO-58), **SEO**
(el **SEO por-página capturado** ECO-63 → metadata por ruta + la fábrica OG/JSON-LD ECO-56), **dark/light**
(`colorMode` del onboarding). Firma **"Powered by EM Ecosystem"** (heredada del LAYOUT).

### D — GATE de emisión LOSSLESS (`lib/lossless.mjs` `verifyEmit`)
Verifica que el SITIO emitido preserva el contenido del IR, **medido del output real** (las `page.tsx`): **mismas
páginas** (IR == sitio), **copy** (palabras reales, sin markup, en ambos lados → robusto a `<br>`/escapes) y
**imágenes usadas** referenciadas. **Falla si se cae algo.** Junto al gate de captura (FB1) → lossless de punta a
punta.

### D — Orquestador `build-from-file.mjs` + integración
`buildFromFile(backup, dest, opts)`: captura (FB1) → gate de captura → emit (FB2) → gate de emisión. Es la ruta
"mejorar desde un backup" de `/launch-satellite`, end-to-end y previsualizable (`preview-satellite.mjs`).

## Scope
- `scripts/builders/emit.mjs` (emitter), `lib/emit-blocks.mjs` (renderer), `build-from-file.mjs` (orquestador
  end-to-end); `lib/lossless.mjs` (+`verifyEmit`/`assertEmit`); `generate-satellite.mjs` (exporta templates
  reusables, sin cambio de comportamiento); `SKILL.md`. Tests + fixture WP sintético.
- **NO** el estándar profesional completo (form/favicon/404/Cookiebot/a11y = **FB5/ECO-65**) ni la **generación
  decorativa** de imágenes. **NO** toca los demás builders/modos.

## Acceptance Criteria
1. **Emitter** (`emitFromIR`): IR → satélite Next; **una ruta por página del IR**; reusa el scaffold/layout/tema/
   SEO del generador (no duplica).
2. **Reconstrucción fiel + creativa**: TODO bloque con contenido se emite (mapeado a markup tokenizado em-ui);
   HTML inline del original limpiado, copy preservado; Hero de marca en la home.
3. **Imágenes reales** del IR ingeridas a `public/images/` + renderizadas (`next/image`); las no-widget (fondos)
   como galería → ninguna se pierde.
4. **Aplica** marca + i18n (`<html lang>` real) + SEO por-página + dark/light; firma "Powered by EM".
5. **Gate de emisión lossless** (`verifyEmit`): páginas + copy + imágenes usadas IR == sitio; **falla** si se cae algo.
6. **e2e Atis** (local; dump gitignored): backup → IR (22 págs/170 bloques/27 imgs/SEO 22) → satélite emitido;
   `next build` **VERDE**; preview sirve el sitio con **TODO el contenido real + logo + fotos + marca**; **ambos
   gates pasan** (captura + emisión).
7. **Gates verdes**: `gates` (`Strategy: satellite-builders`, `check_ticket_link` ECO-66), Security Pipeline;
   tests skill + registry verdes (fixture sintético; el dump real corre local).

## Out of scope (= FB5 / después)
- Estándar profesional completo (formulario/favicon/404/Cookiebot/a11y) — FB5 ([ECO-65](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-65)).
- Generación **decorativa** de imágenes (rellenar huecos) — pilar de imágenes, después.
- El loop completo de mapeo `proposed` IR→secciones con confirmación (F6); FB2 deja el sustrato + el hook.

## Alignment
Construye **FB2** de [`satellite-builders`](../strategy/satellite-builders.md) / [ADR-012](../adr/012-satellite-builders-architecture.md):
IR (FB0/FB1) → **emitter** enriquecido. **Genérico** (consume el IR; cero conocimiento de la fuente). **Lossless
de punta a punta** (gate de emisión + el de captura). Honra §D4 (todo el contenido del IR se preserva; el diseño
se enriquece, no se inventan hechos) y reutiliza i18n/SEO/imágenes/em-ui del núcleo común (ECO-56/58, ADR-011).
