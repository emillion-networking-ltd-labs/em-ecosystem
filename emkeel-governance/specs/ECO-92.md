# ECO-92 — Storybook catalog: revisión 1:1 de sections + marketing + layout + decoration

Strategy: satellite-design

## Resumen
Cierra la revisión **componente a componente** del catálogo Storybook iniciada en [ECO-90](ECO-90.md)
(fidelidad de matriz en `primitives/`) y [ECO-91](ECO-91.md) (revisión 1:1 de `primitives/` + Card/Charts).
Aquí se aplica el **mismo estándar de presentación** a lo que quedó fuera: `sections/` (8), `marketing/` (9),
`layout/` (5), `decoration/` (4) y `showcase/HeroShowcase`. `charts/` y `showcase/FullPageAlert` ya nacieron
con el estándar en ECO-91 → solo pasada de consistencia.

El estándar (exemplar = `primitives/Toggle.stories.tsx`):
- **Organización homogénea:** `Default` → estados/`Variants`/`Sizes` → **`AllVariants` SIEMPRE al final**.
- **Textos en INGLÉS** (estas stories estaban en español).
- **Ancho fit-content** (no full-bleed salvo `sections/`, que son `layout: fullscreen` por diseño).
- **Medidas con px en mono:** `text-caption text-content-tertiary font-mono`, sizes mayor→menor, default marcado.
- Correcciones puntuales por componente que surjan al cotejar contra la fuente real.

## Decisiones que resuelve

### D — Fidelidad 1:1 del resto del catálogo (presentación)
Cada story no-primitiva se revisa contra los props REALES de su componente y se reescribe al estándar:
organización consistente, inglés, fit-content, una vista `AllVariants`/`AllSizes` que recorre la matriz de
props (`variant`/`align`/`size`/`intensity`/`gap`/`cols`…) con su etiqueta en mono. Las `sections/` conservan
`layout: fullscreen` (son piezas de página completa) pero ganan el contenido en inglés + una vista que muestra
sus variantes de un vistazo.

### D — Solo presentación, aislado del dashboard
Es trabajo de **catálogo** (stories + un ajuste de primitives, ver abajo). No se tocan `nexacore-api/` ni
`nexacore-dashboard/`. El catálogo **lidera**; el dashboard no se muta aquí ([ADR-019](../adr/019-design-system-upstream-shadcn.md)).

### D — Primitives: convención de nombre de spinners + orden del catálogo
Surgido al revisar el listado (la revisión 1:1 es global por ticket). Los 3 spinners tenían nombres dispares y
caían dispersos en el sidebar. Se renombran a `Spinner<Tipo>` para agruparlos: **`SpinnerCircle`** (era
`Spinner`, circular border, lo usa Input), **`SpinnerRing`** (era `RingSpinner`), **`SpinnerInfinity`** (era
`InfinitySpinner`, el del Button). Y se fija **`storySort: { method: "alphabetical" }`** en `preview.tsx`
(ordena el sidebar por componente preservando el orden de stories dentro de cada uno → Default primero). Toca
los 3 componentes + importadores internos (`Button.tsx`/`Input.tsx`) + `registry.json` (regenerado) + el
closure test. **Drift consciente con el dashboard** (conserva los nombres viejos), como los renames
IconBadge/ButtonIcon de ECO-91 → repoint a su propio ticket.

## Scope
- `design-system/stories/sections/*` (8) — inglés + organización + AllVariants.
- `design-system/stories/marketing/*` (9) — inglés + organización + variantes/props.
- `design-system/stories/layout/*` (5) — inglés + AllSizes/AllVariants visualizando el comportamiento de layout.
- `design-system/stories/decoration/*` (4) — inglés + AllVariants (size/intensity), atmósferas tematizadas.
- `design-system/stories/showcase/HeroShowcase.stories.tsx` — pasada de consistencia.
- (consistencia) `design-system/stories/charts/*`, `design-system/stories/showcase/FullPageAlert.stories.tsx`.
- **Primitives — spinners:** `design-system/components/{SpinnerCircle,SpinnerRing,SpinnerInfinity}.tsx`
  (renombrados) + sus stories + `Button.tsx`/`Input.tsx` (importadores) + `registry.json` (regenerado) +
  `registry/tests/registry-closure.test.mjs` + `.storybook/preview.tsx` (`storySort`).

## Acceptance Criteria
1. **Inglés:** ninguna de las stories revisadas conserva copy en español; verificable en `npm run storybook`.
2. **Organización:** cada story sigue `Default → Variants/Sizes → AllVariants` (AllVariants/AllSizes al final),
   con las etiquetas de medida en `text-caption text-content-tertiary font-mono`.
3. **Cobertura de variantes:** cada story con matriz de props expone una vista que recorre TODAS sus opciones
   (`variant`/`align`/`size`/`intensity`/`gap`/`cols`).
4. **Build + cobertura:** `build-storybook` verde; `coverage` (story 77/77 + variant) verde; closure 5/5.
5. **Aislamiento:** el dashboard **no** se toca; suites `test:api`/`test:dashboard` + `dup:check` verdes;
   Dashboard-VRT verde. Cambios contenidos en `design-system/` (stories + rename de spinners + preview).
6. **Spinners (primitives):** los 3 quedan como `Spinner<Tipo>` (Circle/Ring/Infinity), agrupados y en su
   posición alfabética en el catálogo; `registry.json` regenerado y el closure test (Button→SpinnerInfinity)
   verdes.
7. **Gates** verdes (`Strategy: satellite-design`, ticket ECO-92), Security Pipeline (sin secretos).

## Out of scope
- Crecer el catálogo con piezas NUEVAS (más piezas-estrella/presets) → incrementos siguientes ("después seguimos").
- **Refinar los COMPONENTES de `sections/`** (afinarlos a la calidad de `sat-cristian-garcia`, neutros por los
  tokens del design-system = lienzo en blanco, tematizables por cliente) → **su propio ticket de refactor**.
  ECO-92 revisó la PRESENTACIÓN (stories) de las sections, no rediseñó los componentes.
- Repoint del dashboard a los nombres nuevos de spinner → ticket propio (drift consciente).
- Baselines VRT del catálogo (snapshots).
- El ADR / strategy-change de "design-system = librería de TODO el proyecto + recharts" → su propia lane.
- Quitar `ErrorAlert` del dashboard → ticket propio.

## Alignment
Construye sobre [ADR-020](../adr/020-design-system-storybook-catalog.md) (catálogo como vitrina gobernada) y
cierra la serie [ECO-89](ECO-89.md)/[ECO-90](ECO-90.md)/[ECO-91](ECO-91.md): de "primitivos revisados 1:1" a
"**catálogo ENTERO revisado 1:1**", con presentación homogénea en inglés y cobertura de variantes en cada pieza.
Refuerza el norte de **satellite-design**: el design-system como Core **portable, legible y fiel** que la IA
usará para componer satélites — un catálogo coherente es el casillero visual del estándar (pilar A).
