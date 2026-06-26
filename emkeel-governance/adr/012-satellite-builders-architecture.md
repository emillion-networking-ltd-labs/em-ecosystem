# ADR-012 — Arquitectura de satélites: BUILDERS por fuente → núcleo común (IR) → emitter Next enriquecido

- Status: superseded
- Superseded-by: ADR-016
- Date: 2026-06-22
- Ticket: [ECO-62](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-62) (decisión) · seguimiento [ECO-63](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-63) (FB0/FB1: núcleo + IR + adapter WP)
- Strategy: satellite-builders
- Deciders: Operador (human gate, 2026-06-22)
- Contexto de gobierno: repo gobernado por Emkeel (ver `AGENTS.md`). Materializa el norte
  [`strategy/satellite-builders.md`](../strategy/satellite-builders.md), que **SUPERA** a `satellites.md`
  (preservado como historia). **Reutiliza — no re-litiga —** los cimientos válidos: i18n (ECO-58), SEO de
  fábrica + gate ([ADR-010](010-satellite-design-generation.md), ECO-56), guardrail HECHOS-vs-DISEÑO §D4,
  imágenes ([ADR-011](011-satellite-image-assets.md)), em-ui (ADR-006/007), secciones (F4/F5), preview.
  El proceso `/strategy satellite-builders` se condujo con research real → `approved`.

## Contexto
El generador actual es **extract-then-compose**: resume el sitio a ~15 campos escalares + 8 secciones fijas y
**descarta el resto** (`.claude/skills/launch-satellite/scripts/generate-satellite.mjs`,
`compositionFor`/`DEFAULT_HOME_COMPOSITION`; el `brief.json` no tiene modelo de páginas/bloques/media). El
**piloto Grupo Atis** lo expuso: un sitio Elementor+Astra real (decenas de páginas, ~116 imágenes) se redujo a
~15 campos, el media se declaró `missing` con ~1834 ficheros presentes, y el remodel salió **más feo que el
original**. Los importadores serios hacen lo inverso: **capturan el render/contenido primero** (lossless) y
luego mapean (html.to.design — https://html.to.design/; wp2static/Simply Static — https://simplystatic.com/;
html-to-react — https://github.com/aknuds1/html-to-react).

## Decisión

### 1. Modelo = builders por FUENTE → núcleo común (IR) → emitter Next ENRIQUECIDO (opción 3)
Split **adapter-por-fuente → modelo normalizado → emitter**, como el front-end/back-end de un compilador. Cada
builder de fuente (desde-archivo, desde-URL, …) **captura lossless** a un **modelo normalizado (IR)** común; el
núcleo lo **reconstruye enriquecido** a un satélite **Next.js propio**. **from-file primero** (WordPress = primer
adapter; arquitectura genérica vía adapters pluggables).

### 2. Modelo normalizado (IR) — captura LOSSLESS
`site` (marca, idioma, nav, SEO, options) · `pages[]` (route + title + `blocks[]` **ordenados**) · `blocks[]`
(tipo + **copy VERBATIM** + refs de media) · `media[]` (**manifest de TODAS las imágenes reales** + uso) ·
`menus[]` · `forms[]`. Es el **inverso** del brief escalar de hoy: **primero captura, luego mapea**. El
`brief.json` se mantiene como destilación/procedencia (§D5); el IR es la **fuente completa**.

### 3. Builder DESDE-ARCHIVO, adapter WordPress (genérico)
Lee la **BD del backup** (`wp_posts` filtrados + `wp_postmeta._elementor_data` JSON + `wp_options` + menús +
SEO meta) **∪** el árbol `wp-content/uploads` → el IR. El **interfaz del adapter es genérico** (cualquier backup
→ el mismo IR); WP/Elementor es el **primer adapter**, no la forma del núcleo. Un backup no-WP (HTML plano,
export de otro CMS) implementa el mismo interfaz.

### 4. Reconstrucción ENRIQUECIDA en UN solo flujo
El núcleo mapea los `blocks` del IR → nuestras `design-system/sections` + las imágenes reales, en **una pasada**:
**fiel en los HECHOS** (todo el copy/estructura/media del IR se preserva; nada se inventa) y **creativo en el
DISEÑO** (secciones frescas, marca aplicada, mejor que el original). **NO** "réplica 1:1 y luego mejorar aparte".

### 5. El núcleo común garantiza los transversales (reutilizados, por construcción)
i18n (`scripts/lib/i18n.mjs`) · SEO de fábrica + gate elevado (`scripts/lib/lighthouse.mjs`) · HECHOS-vs-DISEÑO
/no-inventar §D4 (`schema/brief.schema.json`, `SKILL.md`) · imágenes (ADR-011) · Next.js + em-ui = ownership
(`design-system/registry/`, `design-system/sections/`) · preview (`scripts/preview-satellite.mjs`) · S2/gobernanza.

### 6. Honestidad (constraint, NO promesa)
"Nada se pierde" está **acotado a lo que el backup CONTIENE**. Si la BD no está, o hay contenido dinámico fuera
de ella, ESO **se declara** (cobertura del adapter) — **nunca se inventa** para rellenar (§D4). La generación
**decorativa** (ADR-011) cubre lo visual que falte, jamás un HECHO.

## Alternativas descartadas
- **(1) Status quo *extract-then-compose*** — con PÉRDIDA por diseño; es el fallo del piloto. Es la deuda a cerrar.
- **(2) Clon estático del render** (wp2static/Simply Static, https://simplystatic.com/) — fiel pero copia el
  **markup WP/Elementor verbatim**, no nuestras secciones; sin ownership/escalabilidad/diseño propio.
- **(4) WP headless → Next** (Faust.js https://faustjs.org/ / WPGraphQL https://www.wpgraphql.com/) — exige una
  instancia **VIVA** de WP como backend; no parte de un backup muerto y deja a WP de CMS → no "código propio".

## Consecuencias
- **Fasificación (FB0–FB4):** FB0 núcleo + IR; **FB1** builder desde-archivo + adapter WP (captura lossless);
  FB2 reconstrucción enriquecida; FB3 builder desde-URL; FB4 más adapters. FB0/FB1 = [ECO-63](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-63).
- **`satellites.md` SUPERADO** (puntero recíproco; historia preservada). Lo superado es el **modelo de
  generación** (resumen→componer); sus cimientos (i18n/SEO/§D4/imágenes/em-ui/secciones/preview) se **reutilizan**.
- **ADR-006…011 siguen vigentes** (em-ui, ubicación del design system, onboarding/generación, automatización,
  diseño híbrido, imágenes): son el núcleo común que esta arquitectura consume.
- **Reproducible y gobernado:** el IR + el emitter son deterministas; S2 + gates + preview siguen siendo la barra.

## Notas
- Aprobada por el operador en el human gate de `/strategy satellite-builders` (ECO-62, 2026-06-22), conducido por
  el motor (`emkeel strategy` → `approved`) con provenance de research real (importadores reales + el backup WP
  del piloto, cuya BD confirma que la captura lossless es factible). El "cómo" detallado vive en los ECO por fase
  (FB0/FB1 = ECO-63); el procedimiento operativo, en el runbook.
