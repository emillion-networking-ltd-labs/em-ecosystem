# Strategy: satellite-builders

Status: APPROVED   <!-- gate humano 2026-06-22 (ECO-62): modelo = opción 3 (builders por fuente → núcleo común/IR → emitter Next enriquecido); arquitectura en ADR-012; FB0/FB1 = ECO-63 -->
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
