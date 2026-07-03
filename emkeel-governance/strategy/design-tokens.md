# Strategy: design-tokens

Status: DRAFT
Strategy: design-tokens   <!-- feature specs reference this with a `Strategy: design-tokens` line -->
Impact: high

## Goal
Definir la arquitectura del sistema de color/tokens del ecosistema: **una fuente única en el design-system
fácil de cambiar**, que **propague** de forma gobernada a los consumidores (dashboard + satélites), con un
**gate de contraste WCAG AA obligatorio** y un **mecanismo baseline-obligatorio vs override-de-marca** (un
satélite puede pisar su marca sin poder romper la norma en silencio). Supersede/absorbe ECO-123.

## Context
<!-- grounded facts ONLY — cite file:line (repo) or a URL (market) for every claim -->
- **Duplicación por el "freeze" de Tailwind v4:** `@theme` declara `--color-X: var(--X)` y se resuelve/congela
  en `:root`; para que el tema funcione hay que RE-declarar `--color-X` con literales en `.dark`/`.light`
  (design-system/tokens/tokens.css:335-340). Cada token de color se escribe **2× por tema** (crudo + literal).
- **El patrón oficial de Tailwind v4 para temas** es `@theme inline { --color-x: var(--x) }` + vars scopeadas
  en `:root`/`[data-*]` dentro de `@layer theme` (https://github.com/tailwindlabs/tailwindcss/discussions/18471,
  https://tailwindcss.com/docs/theme) — permite override en runtime, que es justo lo que el freeze actual impide.
- **Tres fuentes de verdad divergentes hoy:** el DS canónico (tokens.css), la copia **stale** del dashboard
  (nexacore-dashboard/src/styles/em-ui-tokens.css, le faltan selección/card/`--content-max`/marketing), y el
  **fork inline** del satélite (satellites/sat-cristian-garcia/src/app/globals.css:167 — "ONLY --accent changed").
- **`em-ui` distribuye por COPIA literal**, sin transformar (`copyFileSync`, design-system/registry/cli.mjs:94-101);
  no hay generación de tokens ni guard de drift/contraste. ADR-007 reconoce las dos copias como deuda consciente
  (emkeel-governance/adr/007-design-system-source-location.md:35).
- **Único branding de satélite = forkear todo el token file y cambiar `--accent`/`--accent-light`**
  (sat-cristian-garcia/globals.css:214-215) → un cambio en la fuente NO llega al satélite.
- **Valores de bajo contraste** (candidatos a fallar AA): `--content-tertiary: 0.55` (tokens.css:236, ~4:1 límite),
  `--content-placeholder: 0.3` (:238), `--border-default: 0.05` / `--border-strong: 0.08` / `--border-subtle: 0.03`
  (:242-245). ECO-123 lo auditó pero NO aplicó el arreglo.
- **Estándar DTCG** (formato JSON de tokens, `$value`/`$type`/alias) alcanzó su **primera versión estable
  2025.10** (28-oct-2025) (https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/).
- **Arquitectura de 3 capas** primitive→semantic→component con dirección de referencia fija habilita "cambiar un
  color base y propagar" (https://bradfrost.com/blog/post/the-many-faces-of-themeable-design-systems/).
- **Umbrales WCAG AA:** texto 4.5:1, texto grande 3:1, no-texto/UI 3:1; los ratios son umbrales, **no se redondea**
  (https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum). Libs de gate: `wcag-contrast`
  (https://www.npmjs.com/package/wcag-contrast), Color.js (https://colorjs.io/docs/contrast).
- **Generadores de tokens** que leen DTCG y emiten CSS vars (+ Tailwind): Style Dictionary v4
  (https://styledictionary.com/info/dtcg/) y Terrazzo (https://terrazzo.app/docs/guides/modes/).

## Options
<!-- at least 2 real options; EVERY row MUST cite a Source. -->
| # | Option | Source | Pros | Cons | Risk |
|---|--------|--------|------|------|------|
| 1 | **Arreglo mínimo, CSS a mano**: reescribir `.dark`/`.light` a `--color-X: var(--X)` (fuente única por tema, elimina el literal duplicado) + `scripts/check-contrast.mjs` (gate AA). Distribución y override sin cambios (copia em-ui, fork de satélite). | tokens.css:335-340; TW discussion #18471; wcag-contrast (npm) | Bajo esfuerzo, sin deps ni build; cambiar el crudo YA propaga dentro del DS; añade gate AA rápido. | No resuelve la propagación a consumidores (dashboard sigue stale, satélite sigue forkeado); sin manifiesto único ni capas primitive→semantic; override sigue siendo fork. | Bajo técnico, pero **deja fuera** propagación y mecanismo de override → sólo parcial. |
| 2 | **Var-layering en runtime (patrón oficial TW v4) + gate**: `@theme inline`→vars + baseline en `:root` y **override por scope** `[data-brand]`/`.dark` en `@layer theme`; el satélite sólo redefine las vars que difieren (no forkea); gate AA sobre el set RESUELTO de cada marca. Sigue CSS a mano (sin generador). | TW discussion #18471; tailwindcss.com/docs/theme; bradfrost (multi-brand); WCAG 2.2 understanding | Arregla el freeze; **mecanismo de override limpio** (baseline = norma; satélite pisa sólo lo suyo, en runtime, un solo bundle); gate valida cada combinación; sin build/deps pesados. | Los VALORES siguen a mano (sin fuente JSON única ni 3 capas formales); el dashboard aún necesita el CSS (copia/import); no cross-platform. | Bajo-medio. |
| 3 | **Pipeline de tokens (DTCG → generador)**: fuente única `tokens.json` (DTCG, primitive→semantic→component, alias) → **generador** (Style Dictionary v4 o Terrazzo) que EMITE tokens.css (patrón TW v4 de la opción 2) **y las copias de los consumidores** (dashboard), cerrando el drift por generación; satélite = capa de override de marca; gate AA sobre el set resuelto de cada satélite. | styledictionary.com/info/dtcg; terrazzo.app/docs/guides/modes; DTCG 2025.10 (w3.org); bradfrost; wcag-contrast | **Fuente única real**: un cambio propaga a DS+dashboard+satélites (generación cierra el drift del dashboard); AA gobernado por capa semántica + gate en cada marca; portable (DTCG); 3 capas. | Build step + dep nueva (SD/Terrazzo); migración (reescribir tokens a manifiesto); soporte DTCG 2025.10 aún madurando (SD lo cierra en v5); mayor curva. | Medio (migración + madurez de tooling; riesgo de over-engineering para un sistema pequeño). |

## Recommendation
**Opción 2 (var-layering runtime, patrón oficial TW v4) + un GATE basado en una MATRIZ DE COMPOSICIÓN de
pares, por fases. El pipeline DTCG (Opción 3) queda como NO-GOAL** (revisitar con ≥3-4 consumidores o
necesidad cross-platform). Revisado tras el panel de crítica — sus 4 hallazgos convergen en un artefacto que
faltaba y en recortar el alcance:

- **Fase 0 (freeze + valores) — verificada sólida:** reescribir tokens.css al patrón TW v4 (`@theme inline` +
  vars scopeadas en `@layer theme`) → cambiar el crudo propaga en runtime (confirmado en docs TW v4 +
  discussion #18471). Arreglar los valores de bajo contraste (content-tertiary, placeholder, borders). Cierra ECO-123.
- **Fase 1 (el artefacto que faltaba — MATRIZ DE COMPOSICIÓN + gate correcto):** el gate AA **no** es computable
  por-token: un `rgba` con alpha no tiene ratio hasta **componerse (Porter-Duff `over`) sobre una superficie
  opaca concreta**, y AA es propiedad del **par fg↔bg**, no del token. Por eso el artefacto de primera clase es
  una **matriz declarada**: qué content se pinta sobre qué surface, y qué token-alpha se compone sobre qué
  superficie, por tema (light/dark) y por marca. `scripts/check-contrast.mjs` compone α sobre cada superficie y
  valida cada PAR (4.5 texto / 3:1 grande / 3:1 no-texto, sin redondeo). Requisitos derivados: definir "texto
  grande" (≥24px, o ≥18.66px bold); **clasificar bordes decorativos** (los `border-*` a 0.03-0.08 fallan 1.4.11
  → o se marcan decorativos/exentos o se suben); y una **válvula de excepción AUDITADA** (registrada en ADR, no
  bypass silencioso) para el caso de una marca que exige un color no-AA — traslada la responsabilidad al que la firma.
- **Fase 2 (mecanismo baseline-obligatorio vs override):** el baseline de semantics = **obligatorio** (la norma
  vive aquí; el gate corre sobre el **set de PARES resuelto de CADA marca**, no sobre los tokens que el satélite
  tocó → caza el caso "pisar solo el surface rompe el content heredado", kill-criterion #1). El satélite deja el
  fork inline por una **capa de override por scope** (`[data-brand]`) que sólo redefine lo suyo. Marcar cada
  token **norma vs estético** en la fuente → un satélite puede opt-out de lo estético manteniendo lo normativo;
  para conservar un valor viejo debe **override explícito** (y si ese valor falla AA, sólo pasa vía la válvula
  de excepción auditada). (Corrige la redacción invertida previa: "no override" = RECIBIR el cambio del baseline.)
- **Propagación/drift (sin generador):** el drift del dashboard es de **distribución**, no de autoría — un
  generador que "empujara" la copia del dashboard **violaría el modelo pull de em-ui** (la fuente no conoce
  rutas de consumidor, ADR-007:14,28). Se cierra con un **gate de CI sobre el `em-ui diff` existente**
  (cli.mjs:85-93) que falla el merge si una copia de consumidor diverge de `tokens.css`. Cero deps, cero build.

Por qué NO el pipeline ahora: sólo hay **2 consumidores** de copia literal (dashboard + 1 satélite); un
generador DTCG→CSS emitiría un CSS byte-idéntico a un `cp` y su valor (propagación) ya lo dan el patrón TW v4
(intra-DS) + el gate de drift (consumidores). Adoptarlo hoy es el over-engineering que prohíbe la kill-criterion.

## Non-goals
- No rediseñar la PALETA de marca ni elegir los colores de NexaCore (el accent sigue placeholder; eso es
  satellite-design / la capa de coherencia de marca de ECO-128).
- No adoptar APCA como gate bloqueante (es borrador WCAG 3; sólo métrica informativa).
- No migrar el dashboard a importar del paquete en vez de copia (sigue el modelo em-ui de ADR-006/007).
- **No introducir el pipeline DTCG + generador (Style Dictionary/Terrazzo) por ahora** — YAGNI para 2
  consumidores de copia literal, y un generador que empuje a consumidores violaría el pull de em-ui (ADR-007).
  Revisitar con ≥3-4 consumidores o si se necesita salida cross-platform.
- No cubrir 1.4.1 (uso del color / daltonismo) ni forced-colors/High-Contrast en esta estrategia — quedan
  nombrados como deuda de accesibilidad aparte (el contraste AA no los cubre).

## Decisions
<!-- se registrará como ADR al aprobar (merge): emkeel-governance/adr/0XX-design-tokens-architecture.md -->
