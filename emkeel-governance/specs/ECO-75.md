# ECO-75 — G3: EL CORAZÓN (R4, la IA-diseñador) — `page.design` expresivo → `compileFromSpec` → gate de expresividad

Strategy: satellite-builders

## Resumen
Tercera fase (**G3**) del rebuild generativo de [`satellite-builders`](../strategy/satellite-builders.md)
([ADR-015](../adr/015-satellite-ai-design-authoring.md) §5, roadmap G1…G5+). G3 es **EL CORAZÓN** (rol R4): la
IA-diseñador **AUTORA** un SPEC de diseño EXPRESIVO (`page.design`) y un **compilador tipógrafo TONTO**
(`compileFromSpec`) lo rinde con los componentes inmutables — **REEMPLAZANDO** la capa de decisión determinista
(la composición mecánica). Determinismo en **fijar+validar** (el spec persistido se rinde igual siempre), creatividad
**arriba** (la IA). Sobre G1 (IR congelado) + G2 (esqueleto + contrato del compilador + vocabulario).

## Decisiones que resuelve

### D — `page.design`: un ÁRBOL DE COMPOSICIÓN sobre primitivas de LAYOUT (NUNCA role→shell)
El spec (`standard/design-spec.mjs`) es un árbol de **primitivas de layout** (`section · band · grid · columns ·
stack · spacer`) con tokens (`bg/pad/maxWidth/align/cols/gap/box/emphasis`); las **hojas referencian bloques del IR
por índice** (`{ref:n, as}`) — **el contenido vive en el IR, el spec NO lleva copy**. Composición **ARBITRARIA**
(agrupación, columnas, anidado, jerarquía, ritmo), no un enum/menú de "tipos de sección". `page.design` es campo
**opcional** del IR (G1 contract extendido: aditivo, no rompe IRs 1.0.0).

### D — `compileFromSpec`: compilador TIPÓGRAFO TONTO (anti-relapse + determinista)
`standard/compiler.mjs` `compileFromSpec(page, ctx)` **traduce** los campos del spec → clases (lookups fijos
`bg→clase`, `cols→grid-cols-n`, `box→card/panel`, `as→envoltura`, `ref→renderBlock`). **CERO** clasificador, tabla
de layouts o heurística por CONTENIDO (ningún `if (block.kind…)`). **Mismo spec → mismo JSX** (determinista,
reproducible). Sin `page.design` → cae al **suelo** `compileMinimal` (G2). Sustituye a `compileMinimal` en el emit;
**reemplaza** `renderMain` (sin uso del builder desde G2).

### D — `validateDesign`: LOSSLESS POR REFS + anti-relapse + anti-invención (por construcción)
`standard/design-spec.mjs` exige: todo bloque con CONTENIDO (texto/media) **referenciado** (lossless — nada se
cae), refs en rango, `layout/as/box` conocidos, y **claves prohibidas** (`role/component/shell/kind/text/copy/html/
content`) que reintroducirían el role→shell o copy inventado → **falla**. `design.blocks` debe casar el nº de
bloques (guarda de IR cambiado).

### D — Gate de EXPRESIVIDAD con MÉTRICA ROBUSTA (no gameable)
`standard/expressiveness.mjs`: una **firma de composición** canonicalizada que **IGNORA tokens y orden de hermanos**;
distancia = `0.5·grouping + 0.3·layout-mix + 0.2·placement`. Dos diseños del MISMO contenido son **genuinamente
distintos** si `score ≥ umbral`. **Calibrado EMPÍRICAMENTE** (datos en `tests/expressiveness.test.mjs`): NO-genuinos
(idéntico / sólo-tokens / sólo-reorden) → **0.000**; genuinos → **0.54–0.90**; **umbral 0.34** separa con margen
amplio (FP imposible; plantilla no pasa). No gameable por recolorear ni reordenar.

### D — PROCESO DE AUTORÍA (la mitad creativa): `authoring.mjs` — rol DISEÑADOR SENIOR
`standard/authoring.mjs` `designBrief(page, {vocab, brand, siteName})` arma el brief que pone a la IA (R4) en rol de
diseñador senior: **(1)** sin menú de secciones — compón con primitivas (§5); **(2)** **diseña DESDE la estructura
capturada**, con **sesgo FUERTE a PRESERVAR agrupación+orden** (la arquitectura de información del cliente);
reordenar/reagrupar SÓLO con razón de diseño genuina, **nunca a ciegas ni al azar** (decisión del operador); **(3)**
lossless/§D4 — referencia todo, no inventa ni descarta. La IA lee el brief → autora `page.design` → se valida → se
persiste → se rinde.

### D — DÓNDE corre cada garantía (honestidad: no vender CI como ojo humano)
- **CI** prueba que la **MÉTRICA funciona** (fixtures: no-genuinos fallan, genuinos pasan) — no juzga belleza.
- **No-relapse VIVO** = el **GATE VISUAL HUMANO** (R5, Atis re-emitido) **+** la **métrica VIVA en G4** (regenerar:
  el nuevo variant debe ser genuinamente distinto del anterior). La belleza la valida el **ojo humano**, declarado.

### D — Decisión central: primitivas de layout en el COMPILADOR, no expansión de em-ui
Las primitivas compositionales (`grid/columns/stack/band/…`) son **emisores de layout del compilador** (estructura
Tailwind + tokens em-ui), **NO** nuevos componentes del design system → **no expande em-ui** (honra el diagnóstico
de G2), **sin nueva superficie de drift**, y da composición arbitraria ya. (Aprobado por el operador.)

## Scope
- `model/ir.mjs` (campo opcional `page.design`), `tests/ir-contract.test.mjs` (PAGE_KEYS + `design`).
- `standard/design-spec.mjs`, `standard/expressiveness.mjs`, `standard/authoring.mjs` (nuevos); `standard/compiler.mjs`
  (+`compileFromSpec`+`box`); `emit.mjs` (usa `compileFromSpec`).
- Tests: `design-spec.test.mjs`, `compiler-spec.test.mjs`, `expressiveness.test.mjs` (nuevos).

## Acceptance Criteria
1. **Spec arbitrario, sin role→shell**: árbol de primitivas de layout + refs al IR; `validateDesign` rechaza
   `role`/`text`/layout-desconocido y exige lossless-por-refs.
2. **Compilador tonto + determinista**: `compileFromSpec` rinde el árbol; mismo spec → JSX idéntico; sin clasificador;
   sin `page.design` → cae a `compileMinimal`.
3. **Métrica robusta calibrada**: no-genuinos (idéntico/tokens/reorden) → 0 → no pasan; genuinos ≥0.54 → pasan;
   umbral 0.34 documentado con datos.
4. **Proceso de autoría**: brief de diseñador senior (sin menú, diseña DESDE la estructura con preserve-bias fuerte,
   no inventa/descarta).
5. **Atis re-emitido con diseño de la IA**: `page.design` autorado (73 bloques de la home → 12 nodos: portada de
   marca, splits, rejillas de servicios/razones/testimonios, bandas CTA), **3 gates VERDES** (emisión lossless 4217
   palabras IR==sitio · launch-readiness 16/16 · drift 8/8). **Gate visual HUMANO**: mejor que el original (el operador juzga).
6. **Gates verdes**: suite del skill **144 verdes**; `gates` (`Strategy: satellite-builders`, `check_ticket_link`
   ECO-75), Security Pipeline.

## Out of scope (= G4 / después)
- **R5 crítica + "regenerar diseño"** en el gate visual + la métrica VIVA aplicada al regenerar — **G4**.
- Borrar `renderMain`/`DEFAULT_HOME_COMPOSITION` del repo (G3 deja de usarlas; la limpieza final puede ser G4).
- Autoría automatizada de las 22 páginas (G3 demuestra el mecanismo en la home; el resto cae al suelo hasta diseñarse).
- Ampliar em-ui (diagnóstico de G2; vía `/strategy` si G4/§5 lo exige).

## Alignment
Construye **G3 — el corazón** de [`satellite-builders`](../strategy/satellite-builders.md) /
[ADR-015](../adr/015-satellite-ai-design-authoring.md) §5 (rol R4). **REEMPLAZA** la capa de DECISIÓN determinista por
la IA-diseñador + compilador (no re-arquitectura captura/esqueleto: G1/G2 intactos). Honra el **CONSTRAINT
INNEGOCIABLE §5** (spec expresivo, nunca role→shell; compilador tonto; gate de expresividad con métrica robusta) y
§D4 (copy en el IR, jamás en el spec; lossless por refs). Conserva ADR-012/013 y el esqueleto de ADR-014 (§2
inmutables/drift). El gate visual humano sigue siendo la autoridad de belleza (no se finge en CI).
