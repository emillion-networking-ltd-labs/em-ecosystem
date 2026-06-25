# ECO-74 — G2: ESQUELETO + estándar (R3 Arquitecto) — aislar `standard/`, exponer el vocabulario em-ui, definir el contrato del compilador

Strategy: satellite-builders

## Resumen
Segunda fase (**G2**) del rebuild generativo de [`satellite-builders`](../strategy/satellite-builders.md)
([ADR-015](../adr/015-satellite-ai-design-authoring.md), roadmap G1…G5+). G2 es el **SUELO** (rol R3 Arquitecto):
**REUSAR y aislar**. Aísla en `standard/` el **scaffold SAT01 + estándar profesional + launch-readiness + el gate
de drift**; **expone el vocabulario em-ui** (registry + tokens) como **catálogo consultable** por R4 (el binding de
producto); y **define el contrato del compilador** (spec→JSX) cuya implementación real es G3. El esqueleto produce
el suelo (estándar, 16 checks + drift + emisión lossless) **SIN capa de composición** — un `<main>` lossless mínimo
basta. **Cero diseño** (la belleza la trae G3). Construye sobre G1 (IR congelado, ECO-73).

## Decisiones que resuelve

### D — `standard/` aísla el ESQUELETO (R3): scaffold + profesional + launch-readiness + drift
Nuevo directorio `scripts/builders/standard/` (ADR-015 §6, rol=directorio):
- **`scaffold.mjs`** (`writeScaffold`) — scaffold SAT01 (package.json + configs Next/TS/PostCSS + em-ui init/add +
  tema dark/light + analytics diferido + playwright). REUSA los templates probados del generador (no duplica);
  extraído de `emit.mjs` → el scaffold queda aislado.
- **`professional.mjs`** — estándar profesional (formulario Resend+Turnstile, favicon/manifest, 404, a11y test,
  Twitter Cards, FAQ/Service JSON-LD). *(movido de `lib/emit-professional.mjs`, `git mv`.)*
- **`launch-ready.mjs`** — el gate de launch-readiness (16 checks). *(movido de `lib/`.)*
- **`emit-gate.mjs`** — el gate de EMISIÓN (`verifyEmit`: IR→sitio lossless). *(movido de `lib/lossless.mjs`; G1
  había separado el gate de captura → `capture/`, prometiendo re-hogar el de emisión en `standard/` en G2.)*
- **`component-drift.mjs`** — el gate de DRIFT (ADR-014 §2): un componente em-ui copiado que difiera del registry
  FALLA. *(Implementado aquí: su impl era WIP de ECO-70 nunca mergeada; es esqueleto legítimo de G2.)*

### D — EXPONER el vocabulario em-ui como catálogo consultable (`standard/vocabulary.mjs`) — el binding de producto
El motor genérico no sabe de em-ui (G1); AQUÍ vive el catálogo que R4 (G3) consultará para saber **con qué compone**:
`vocabulary()` lee `design-system/registry.json` + `tokens.css` (fuente de verdad) y expone **secciones** (piezas
semánticas), **primitivas** y la **superficie de tokens**. Sólo-lectura; no emite ni decide diseño.

### D — DEFINIR el contrato del compilador (spec→JSX); impl = G3 (`standard/compiler.mjs`)
Contrato: `compile(page, ctx) -> string` (JSX del `<main>`), donde la decisión de diseño vive en `page.design`
(el SPEC EXPRESIVO que G3 persistirá, ADR-015 §5). G2 ship **`compileMinimal`**: el SUELO — IGNORA `page.design`
(aún no hay spec) y emite un `<main>` **LOSSLESS SIN composición** (apila `renderBlock` + las imágenes usadas que
ningún bloque colocó). Es la pieza que **G3 REEMPLAZA** por el compilador del spec (mismo contrato, mismos gates,
mismos componentes inmutables): **esqueleto (determinista) vs belleza (la IA)**.

### D — emit.mjs = orquestación + suelo (sin composición); 3 gates en los orquestadores
`emit.mjs` deja de componer: usa `writeScaffold` + `compileMinimal` (en vez de `renderMain`, que queda sin uso por
el builder). Los orquestadores (`emit-from-ir.mjs`, `build-from-file.mjs`) corren **3 gates**: emisión lossless +
launch-readiness + **drift**.

## Scope
- Nuevo `scripts/builders/standard/`: `scaffold.mjs`, `compiler.mjs`, `vocabulary.mjs`, `component-drift.mjs` (nuevos);
  `professional.mjs`, `launch-ready.mjs`, `emit-gate.mjs` (movidos de `lib/`).
- `emit.mjs` (orquestación + `compileMinimal`), `emit-from-ir.mjs` / `build-from-file.mjs` (3 gates + imports).
- Tests: `compiler.test.mjs`, `vocabulary.test.mjs`, `component-drift.test.mjs` (nuevos); imports actualizados.

## Acceptance Criteria
1. **`standard/` aislado**: scaffold + profesional + launch-readiness + emit-gate + drift viven en `standard/`;
   `git mv` preserva historial; imports actualizados.
2. **Vocabulario expuesto**: `vocabulary()` lista 8 secciones (Hero/Services/Testimonials/FAQ/CTA/Contact/Pricing/
   Portfolio) + 47 primitivas + 96 tokens, leídos del registry/tokens; autodetecta el repo.
3. **Contrato del compilador**: `compile(page,ctx)->JSX` definido; `compileMinimal` = suelo LOSSLESS sin composición
   (no hero/bandas); G3 implementa el real.
4. **Suelo sin composición**: el `<main>` mínimo preserva TODO el contenido (lossless) sin decisiones de diseño.
5. **Atis end-to-end (3 gates verdes)**: backup → satélite; **emisión lossless** (22 rutas, 4217 palabras IR==sitio,
   13 imgs) + **launch-readiness 16/16** + **drift** (8 componentes idénticos al registry). Cero diseño.
6. **Gates verdes**: suite del skill (`node --test`) **129 verdes**; `gates` (`Strategy: satellite-builders`,
   `check_ticket_link` ECO-74), Security Pipeline.

## Out of scope (= G3+)
- La IA-diseñador (R4) + el SPEC de diseño expresivo + el compilador del spec (`compileFromSpec`) — **G3** (el corazón).
- Borrar `renderMain`/`DEFAULT_HOME_COMPOSITION` (la composición mecánica) — **G3** (G2 sólo deja de usarlas en el builder).
- Cualquier ampliación del vocabulario em-ui — fuera (este ticket DIAGNOSTICA, no amplía; ver abajo).

## Diagnóstico — ¿da em-ui para diseño VARIADO en G3? (diagnóstico, NO se amplía aquí)
Al exponer el vocabulario se evaluó su riqueza contra el gate de expresividad de ADR-015 §5 ("dos composiciones
genuinamente distintas del mismo contenido"):
- **Lo que HAY (suficiente para ARRANCAR G3):** **8 secciones SEMÁNTICAS reales** (no sólo primitivas) con contenido
  por props (lossless-friendly), marca por tokens, a11y/SEO gobernados; **47 primitivas**; **superficie de tokens rica**
  (36 color / 16 tipografía / 9 radius). La variedad a nivel PÁGINA es viable: selección + orden + variante + theming
  → composiciones genuinamente distintas.
- **La BRECHA (para variedad PROFUNDA):** **(a)** las variantes por sección son **poco profundas** — 7 de 8 tienen
  exactamente **2** (`Services` cards|list, `Testimonials` cards|list, `CTA` brand|surface, …; `Hero` es la más rica:
  gradient|soft × left|center), y `Pricing` no tiene variante de layout. **(b)** **No hay primitivas COMPOSICIONALES**
  de propósito general (un `Section`/`Grid`/`Split`/`Band`/`Stack` con hijos arbitrarios) que dejen a la IA **componer
  layouts libres**; las secciones son semánticas y autocontenidas. ⇒ La creatividad de R4 vendría sobre todo de
  **elegir/ordenar/variar/tematizar**, menos de **inventar layouts** por sección.
- **Recomendación (para la DECISIÓN de G3, no se actúa aquí):** arrancar G3 con el vocabulario actual; **si** el gate
  de expresividad §5 resulta demasiado constreñido en la práctica, las adiciones puntuales (por prioridad) serían
  **(1)** más variantes de layout en las secciones de alto uso (Services/Testimonials/Hero), y/o **(2)** un set pequeño
  de **primitivas composicionales** (Section/Grid/Split/Band) para composición libre. Cualquiera de ellas, al tocar el
  estándar, entra por un refinamiento gobernado de `/strategy` (ADR-013 §7 lista viva) — **no** en este ticket.

## Alignment
Construye **G2** de [`satellite-builders`](../strategy/satellite-builders.md) / [ADR-015](../adr/015-satellite-ai-design-authoring.md)
(roadmap §«Refinamiento ECO-71» G2; rol R3 Arquitecto). Materializa **rol=directorio + motor genérico vs binding de
producto** (ADR-015 §6: `standard/` = el suelo; `vocabulary.mjs` = el binding em-ui) y **REUSAR y aislar** (no
reemplaza nada — el reemplazo de la capa de decisión por la IA es G3). El **contrato del compilador** es la frontera
diseño→validación sobre la que G3 enchufa al diseñador. Honra §D4 (el suelo es lossless; nada se inventa). Conserva
intactos ADR-012/013 y el esqueleto de ADR-014 (§2 inmutables + gate de drift, ahora implementado).
