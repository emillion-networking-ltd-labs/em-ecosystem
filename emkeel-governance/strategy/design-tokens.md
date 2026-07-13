# Strategy: design-tokens

Status: APPROVED
Strategy: design-tokens   <!-- feature specs reference this with a `Strategy: design-tokens` line -->
Impact: high

## Goal
Definir la arquitectura del sistema de color/tokens del ecosistema: **una fuente única en el design-system
fácil de cambiar**, que **propague** de forma gobernada a los consumidores (dashboard + satélites), con un
**gate de contraste WCAG AA obligatorio** y un **mecanismo baseline-obligatorio vs override-de-marca** (un
satélite puede pisar su marca sin poder romper la norma en silencio). Supersede/absorbe ECO-123.

**AMPLIACIÓN ECO-200 (refinamiento):** el norte cubre **TODO el sistema de tokens**, no solo color —
opacidad/atenuación, shadow, radius, border-width, spacing/sizing — fijando **LA LÍNEA** entre *estricto-token*
(lo semántico que PROPAGA a N satélites → obligatorio) y *arbitrario-justificado* (one-off de layout /
efectos de marketing → permitido pero medido), **gateada por dimensión**. Motivo: la migración del DS debe
quedar **100/100 propagable** antes de escalar a N satélites — un valor mágico en un primitivo core se copia a
N sitios y no se puede cambiar centralizado.

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

<!-- AMPLIACIÓN ECO-200 — evidencia grounded de las OTRAS dimensiones + enforcement (auditoría + research) -->
- **Dimensiones con escala-token pero SIN gate:** radius (9 tokens tokens.css:250-258, pero `rounded-[3px]` pasa
  — CountdownTimer.tsx:36), spacing (11 tokens :260-270, `w-/h-/max-w-[px]` libres ~65 usos). **Shadow: solo 2
  tokens** (:247-248) vs 8 `shadow-[..]` bespoke.
- **Dimensiones SIN token NI gate ("mágico"):** border-width (0 tokens; `border-[1.5px/3px]` SpinnerCircle.tsx:13),
  **opacidad/atenuación (0 tokens de opacidad; 70 usos de `/NN` ad-hoc** + alphas horneados en rgba de los
  semánticos tokens.css:289-293) — el mecanismo de atenuación de facto es ungated.
- **Agujero de enforcement activo:** `check-raw-color` no caza `rgba(...)` pegado a `_` (sintaxis arbitraria de
  Tailwind `_rgba(`) → color CRUDO se cuela en shadows arbitrarios (verificado Slider.tsx:111); `color-mix()`
  tampoco es detector. Residuo `foreground/25` no-token (Ripple.tsx:3, herencia Magic UI).
- **Mercado — atenuación:** los DS maduros usan **token de color con nombre**, NO opacidad a mano: Material MIGRÓ
  de opacidad (M2) a token `on-surface-variant` (M3)
  (https://developer.android.com/develop/ui/compose/designsystems/material2-material3); Radix paso-11 = muted
  (https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale); Primer `fgColor-muted`
  (https://primer.style/product/primitives/token-names/). Opacidad solo para overlays/disabled.
- **Mercado — enforcement:** el arbitrario `[..]` de Tailwind **no se apaga desde el framework**; ESLint
  `no-arbitrary-value` es **todo-o-nada, no scopea por dimensión** (cita literal:
  https://github.com/francoismassart/eslint-plugin-tailwindcss/blob/master/docs/rules/no-arbitrary-value.md); el
  enforcement maduro es **scoped por propiedad** (Carbon stylelint `layout-use`/`type-use`:
  https://github.com/carbon-design-system/stylelint-plugin-carbon-tokens) → hace falta un **gate propio por regex**.
- **Mercado — la línea:** nadie prohíbe todo; token = regla, arbitrario = **escape hatch** excepcional (cita
  literal Tailwind: "once in a while you need to break out of those constraints",
  https://tailwindcss.com/docs/adding-custom-styles). La excepción legítima se **integra/documenta/gobierna**, no se
  prohíbe (https://www.browserlondon.com/blog/2025/06/03/how-to-break-your-design-system-rules — gobernanza por
  conversación, integrar la excepción; NO trae umbral numérico). Traducción a nuestro mecanismo: **medir/exponer con
  ratchet**, no romper binario.
- **Propagación (refuerza el non-goal DTCG):** un token NUEVO en tokens.css **ya propaga** por el copy-by-value
  existente (`copyFileSync` + `check-drift` exige idéntico, check-drift.mjs:65-67) → añadir las dimensiones que
  faltan **no exige generador** (KC4 refutado).

## Options
<!-- at least 2 real options; EVERY row MUST cite a Source. -->
| # | Option | Source | Pros | Cons | Risk |
|---|--------|--------|------|------|------|
| 1 | **Arreglo mínimo, CSS a mano**: reescribir `.dark`/`.light` a `--color-X: var(--X)` (fuente única por tema, elimina el literal duplicado) + `scripts/check-contrast.mjs` (gate AA). Distribución y override sin cambios (copia em-ui, fork de satélite). | tokens.css:335-340; TW discussion #18471; wcag-contrast (npm) | Bajo esfuerzo, sin deps ni build; cambiar el crudo YA propaga dentro del DS; añade gate AA rápido. | No resuelve la propagación a consumidores (dashboard sigue stale, satélite sigue forkeado); sin manifiesto único ni capas primitive→semantic; override sigue siendo fork. | Bajo técnico, pero **deja fuera** propagación y mecanismo de override → sólo parcial. |
| 2 | **Var-layering en runtime (patrón oficial TW v4) + gate**: `@theme inline`→vars + baseline en `:root` y **override por scope** `[data-brand]`/`.dark` en `@layer theme`; el satélite sólo redefine las vars que difieren (no forkea); gate AA sobre el set RESUELTO de cada marca. Sigue CSS a mano (sin generador). | TW discussion #18471; tailwindcss.com/docs/theme; bradfrost (multi-brand); WCAG 2.2 understanding | Arregla el freeze; **mecanismo de override limpio** (baseline = norma; satélite pisa sólo lo suyo, en runtime, un solo bundle); gate valida cada combinación; sin build/deps pesados. | Los VALORES siguen a mano (sin fuente JSON única ni 3 capas formales); el dashboard aún necesita el CSS (copia/import); no cross-platform. | Bajo-medio. |
| 3 | **Pipeline de tokens (DTCG → generador)**: fuente única `tokens.json` (DTCG, primitive→semantic→component, alias) → **generador** (Style Dictionary v4 o Terrazzo) que EMITE tokens.css (patrón TW v4 de la opción 2) **y las copias de los consumidores** (dashboard), cerrando el drift por generación; satélite = capa de override de marca; gate AA sobre el set resuelto de cada satélite. | styledictionary.com/info/dtcg; terrazzo.app/docs/guides/modes; DTCG 2025.10 (w3.org); bradfrost; wcag-contrast | **Fuente única real**: un cambio propaga a DS+dashboard+satélites (generación cierra el drift del dashboard); AA gobernado por capa semántica + gate en cada marca; portable (DTCG); 3 capas. | Build step + dep nueva (SD/Terrazzo); migración (reescribir tokens a manifiesto); soporte DTCG 2025.10 aún madurando (SD lo cierra en v5); mayor curva. | Medio (migración + madurez de tooling; riesgo de over-engineering para un sistema pequeño). |
| **4** | **AMPLIACIÓN ECO-200 — RECOMENDADA — IN-PLACE: tokens semánticos que faltan + gates propios scopeados por dimensión + ratchet + escape-hatch** (extender el modelo existente, NO re-plataformar): añadir a tokens.css lo que falta (atenuación SEMÁNTICA retirando `/NN` ad-hoc; shadow 2→~6; border-width; confirmar radius/spacing); **gates propios por regex** (infra `design-enforcement`) que cazan arbitrario en dimensiones ESTRICTAS en primitivos CORE, en **RATCHET** (mide, solo decrece) con escape-hatch (comentario/allow-list) para one-off/marketing; **arreglar el hole `_rgba`** de check-raw-color. LA LÍNEA: core/producto estricto, marketing/efectos/layout-one-off arbitrario-medido; el repetido gradúa a token. | Carbon stylelint per-property (github.com/carbon-design-system/stylelint-plugin-carbon-tokens); Material M2→M3; TW escape-hatch + Browser London (medir≠prohibir); ratchet `_ratchet.mjs` + `design-enforcement` del repo | Encaja con el modelo YA existente (ratchet, copy-by-value, design-enforcement); sin deps/build; incremental; la línea es **máquina-checkable** (regex scopeado por dimensión); **propaga gratis** (KC4); mata la deuda en la fuente; escape-hatch = mercado. | tokens.css sigue a mano; construir un gate scopeado por-dimensión es trabajo (N dimensiones); la línea core-vs-marketing necesita juicio codificado (allow-list/clase de componente). | med |
| 5 | **DTCG + Style Dictionary (re-plataforma, para todas las dimensiones)** — autor en JSON DTCG → generador emite tokens.css + copias; enforcement por theme generado + lint. | styledictionary.com/info/dtcg; designtokens.org/tr/drafts/format | Fuente única real + portable + cross-platform; generación cierra drift. | Build + dep; migración; **overkill para 2 consumidores web** (research); choca con ADR-027 (YAGNI) + modelo pull; empujar copias violaría el pull. | high |
| 6 | **FOIL (insuficiente) — solo-lint `no-arbitrary-value` (todo-o-nada)** — encender el ESLint global. | github.com/francoismassart/eslint-plugin-tailwindcss | Cero infra. | **Todo-o-nada** → falsos positivos en marketing/layout → se desactiva → sin enforcement real; NO añade los tokens que faltan; NO traza la línea. | bajo técnico, **NO resuelve** |

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

### AMPLIACIÓN ECO-200 — el sistema de tokens completo + modelo de modificabilidad (conclusión: panel adversarial + refinamiento con el operador)

**Recomendación: Opción 4 (in-place), AFINADA por el panel y REFINADA en revisión con el operador — quirúrgica, con
un MODELO DE MODIFICABILIDAD DE 4 CATEGORÍAS que ENMIENDA la Norma C binaria (ADR-030).** Kill-criteria: KC1 no
dispara; **KC4 refutado** (las dimensiones nuevas propagan gratis por copy-by-value; precedente typography ECO-193 +
motion ECO-194 post-ADR-027); KC2 no dispara (con prerequisito); **KC3 re-encuadrado** (border/shadow no son deuda
one-off a hand-fix, sino ejes de MARCA a futuro — ver categoría 1).

**El modelo — 4 categorías (enmienda la Norma C, que era binaria color/estructura):**

| # | Categoría | Dimensiones | ¿Satélite re-apunta? | Tokenizado | Enforcement |
|---|-----------|-------------|----------------------|------------|-------------|
| 1 | **MARCA (firma)** | color, **radius, border-width, shadow** | **SÍ** (declarado, por-scope `[data-brand]`) | escalas | `check-brand-contrast` + `check-drift` |
| 2 | **ESTRUCTURA-DS** | **spacing INTERIOR** de pieza, **medidas INTRÍNSECAS** de pieza (tamaños de diálogo/componente), atenuación (content-*), typography, motion | **NO** (el DS gobierna; cambia central y propaga por copia) | escalas | gate por dimensión + ratchet + escape |
| 3 | **ESCAPE-HATCH** | layout/composición genuinamente one-off, spacing ENTRE piezas | n/a (arbitrario permitido, declarado) | no | no gateado (declarado legítimo) |
| 4 | **ESTRUCTURA PURA** | markup, ARIA, lógica de layout | NO | n/a (no es token) | Norma C / `check-region-integrity` |

**Por dimensión + los pasos concretos:**

1. **Atenuación (TODO alpha ad-hoc, por ROL) → los tokens `content-*` que YA existen (EL barrido real).** Los ~183
   `/NN` (`/75`×45, `/50`×15, y TODO el rango `/30 /20 /16 /14 /5 /4 /2 /1` — **no solo `/50,/75`**) son la deuda
   sistémica grande (19+ ficheros). **Diagnóstico corregido:** NO faltan tokens — son `content-secondary`/`tertiary`/
   `placeholder`/`disabled` re-derivados a mano (tokens.css:290-303). Arreglo = **usar el token de su ROL** (no swap
   mecánico `/75→secondary`: trampa cross-tema light 0.65 / dark 0.75, VALIDADO en Breadcrumbs.tsx:21). Clases
   APARTE: **overlays** (`bg-white/8`) y **hairlines** (`border-current/20`) — composición sobre superficie, no
   atenuación de content (decisión menor: ¿escala de overlay tokenizada?). **El gate caza el PATRÓN** (`/NN` sobre
   `content-*`), no valores concretos → cubre "y si hay más casos". Categoría 2.
2. **Arreglar el agujero `_rgba` de `check-raw-color`** (el `\b` no caza `_rgba(` → color CRUDO se cuela en shadows
   arbitrarios, Slider.tsx:111; `color-mix()` tampoco). Bug ACTIVO — va primero.
3. **radius, border-width, shadow = escalas de MARCA (categoría 1), satélite-modificables.** REFINADO en revisión:
   NO son "sin escala / hand-fix" (mi versión post-panel) — son **firmas de marca plausibles** (redondo vs afilado;
   bordes finos vs gruesos; estilos de elevación) que otros satélites querrán variar por diseño. → escalas pequeñas
   (radius ya tiene 9; border-width `thin/base/thick`; shadow ~4-6 niveles) **re-apuntables por `[data-brand]`**,
   como el color. Los valores actuales (SpinnerCircle `border-[1.5px]`, Slider shadow) usan la escala. *(El panel
   las juzgó por deuda ACTUAL — 1 componente → over-engineering; el NORTE las juzga por eje de MARCA a futuro para
   N satélites → gana el eje de marca. Reversa consciente del hallazgo del panel, con su motivo nombrado.)*
4. **Spacing PARTIDO:** **interior de pieza** (`p-4`, gaps internos) = **estructura-DS, tokenizada + bloqueada**
   (escala spacing) → propaga por copia; un `p-[13px]` interno = deuda. **Entre piezas** (márgenes/gaps de
   layout/sección) = **escape-hatch** (composición, lo decide el consumidor).
5. **Medidas INTRÍNSECAS de pieza = tokenizadas (estructura-DS).** REFINADO: los anchos que definen el TAMAÑO de una
   pieza (diálogos: `ConfirmModal max-w-[390|480|600|720]` = una escala sm/md/lg/xl; tamaños de componente) → **a
   token** (parte del diseño de la pieza, propaga, puede variar central). El escape-hatch se estrecha a **layout/
   composición genuinamente one-off** (un contenedor puntual de una sección). El barrido clasifica por-caso al
   reconstruir: ¿medida de pieza (→token) o layout one-off (→escape)?
6. **Enforcement: gate por dimensión + ratchet + escape,** con el **eje `core|decorative` máquina-legible como
   PREREQUISITO.** El gate no distingue `rounded-[3px]` (deuda core) de `rounded-[9999px]` (marketing legítimo) por
   regex — solo por QUÉ componente. El `@ds-role: primitive|composite` es el eje EQUIVOCADO (+ 82/84 vacío). →
   declarar `core|decorative` (extender `@ds-role` o `category` en el registry). Estricto en core, permisivo en
   decorativo. Juicio **O(84 piezas), una vez por pieza, NO O(satélites)** → escala.
7. **Ejecución (design-system-quality):** entra en el runbook `DEFINITION-OF-DONE.md` como paso de tokenización +
   los gates; se barre en **tandas** (ratchet); **drena la deuda ratchet ya existente** (typography 38, html 24).

**Distribución: sin cambios** (copy-by-value; los tokens nuevos —incluidas las escalas de MARCA— propagan gratis y
overridean por-var en `[data-brand]`, exactamente como el color; KC4 refutado). **Camino medio futuro (no ahora):**
autorar los tokens como JSON DTCG-shaped (solo formato, portable) SIN generador; el pipeline se difiere a ≥3-4
consumidores / cross-platform.

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
- **(ECO-200) NO re-plataformar** — sin DTCG/generador (Style Dictionary/Terrazzo); el formato-DTCG-JSON (solo
  formato, sin pipeline) es opcional futuro a ≥3-4 consumidores / cross-platform.
- **(ECO-200) NO tokenizar el layout/composición genuinamente one-off ni el spacing ENTRE piezas** — es la
  categoría 3 (escape-hatch declarado); arbitrario permitido y legítimo ahí, no marcado como deuda.
- **(ECO-200) NO tokenizar por tokenizar** — solo lo que es firma de MARCA (cat.1), estructura-DS que propaga
  (cat.2: spacing interior, medidas de pieza, atenuación, typo, motion), o medida intrínseca de pieza. Lo
  genuinamente one-off se queda arbitrario-declarado (evita el over-engineering que rechaza la kill-criterion).

## Decisions
<!-- se registrará como ADR al aprobar (merge): emkeel-governance/adr/0XX-design-tokens-architecture.md -->

**(ECO-200 — a FIJAR por el operador en el merge; enmienda ADR-027, ENMIENDA Norma C/ADR-030, coordina con ADR-031):**
- El norte `design-tokens` cubre **TODO el sistema de tokens**, no solo color; la **LÍNEA** estricto-token vs
  arbitrario-justificado es por **dimensión** + por **clase de componente** (core vs decorativo), gateada por ratchet.
- **MODELO DE MODIFICABILIDAD DE 4 CATEGORÍAS (enmienda la Norma C binaria — decisión de norte del operador):**
  - **1. MARCA** (el satélite re-apunta por `[data-brand]`, declarado): **color, radius, border-width, shadow**.
  - **2. ESTRUCTURA-DS** (bloqueada, tokenizada, propaga por copia; el DS la gobierna): **spacing INTERIOR** de pieza,
    **medidas INTRÍNSECAS** de pieza (tamaños de diálogo/componente), **atenuación** (`content-*`), typography, motion.
  - **3. ESCAPE-HATCH** (arbitrario permitido y declarado): layout/composición one-off, spacing ENTRE piezas.
  - **4. ESTRUCTURA PURA** (bloqueada, no-token): markup, ARIA (Norma C / `check-region-integrity`).
- **Atenuación** (TODO alpha ad-hoc por ROL) = usar los tokens `content-*` que YA existen; overlays/hairlines aparte;
  cuidar la trampa cross-tema (0.65 light / 0.75 dark); el gate caza el patrón `/NN`, no valores.
- **radius / border-width / shadow** = **escalas pequeñas de MARCA** (satélite-modificables), NO hand-fix — son
  firmas de marca a futuro para N satélites.
- **Medidas intrínsecas de pieza** (diálogos, tamaños) = **tokenizar** (estructura-DS); el layout one-off = escape.
- **Eje `core|decorative`** máquina-legible = PREREQUISITO del gate (el `@ds-role` actual es el eje equivocado).
- **Arreglar el agujero `_rgba`** de `check-raw-color` (color crudo escapando en shadows arbitrarios).
- **Distribución sin cambios** (copy-by-value; los tokens de MARCA overridean por-var como el color; KC4 refutado);
  DTCG diferido, formato-DTCG opcional futuro.
- **Ejecución** en `DEFINITION-OF-DONE.md` (design-system-quality), en tandas + ratchet, drenando la deuda existente
  (typography 38, html 24).
