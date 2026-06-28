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

### D — Solo presentación, aislado
Es trabajo de **stories** (catálogo). No se tocan los componentes salvo que el cotejo destape un fix real y
acotado; en ese caso se documenta. Cero cambios en `nexacore-api/` ni `nexacore-dashboard/`. El catálogo
**lidera**; el dashboard no se muta aquí ([ADR-019](../adr/019-design-system-upstream-shadcn.md)).

## Scope
- `design-system/stories/sections/*` (8) — inglés + organización + AllVariants.
- `design-system/stories/marketing/*` (9) — inglés + organización + variantes/props.
- `design-system/stories/layout/*` (5) — inglés + AllSizes/AllVariants visualizando el comportamiento de layout.
- `design-system/stories/decoration/*` (4) — inglés + AllVariants (size/intensity), atmósferas tematizadas.
- `design-system/stories/showcase/HeroShowcase.stories.tsx` — pasada de consistencia.
- (consistencia) `design-system/stories/charts/*`, `design-system/stories/showcase/FullPageAlert.stories.tsx`.

## Acceptance Criteria
1. **Inglés:** ninguna de las stories revisadas conserva copy en español; verificable en `npm run storybook`.
2. **Organización:** cada story sigue `Default → Variants/Sizes → AllVariants` (AllVariants/AllSizes al final),
   con las etiquetas de medida en `text-caption text-content-tertiary font-mono`.
3. **Cobertura de variantes:** cada story con matriz de props expone una vista que recorre TODAS sus opciones
   (`variant`/`align`/`size`/`intensity`/`gap`/`cols`).
4. **Build + cobertura:** `build-storybook` verde; `coverage` (story 77/77 + variant) verde; closure 5/5.
5. **Aislamiento:** el dashboard **no** se toca; suites `test:api`/`test:dashboard` + `dup:check` verdes;
   Dashboard-VRT verde. Cambios = solo `design-system/stories/**` (+ ajuste de componente acotado si se justifica).
6. **Gates** verdes (`Strategy: satellite-design`, ticket ECO-92), Security Pipeline (sin secretos).

## Out of scope
- Crecer el catálogo con piezas NUEVAS (más piezas-estrella/presets) → incrementos siguientes ("después seguimos").
- Baselines VRT del catálogo (snapshots).
- El ADR / strategy-change de "design-system = librería de TODO el proyecto + recharts" → su propia lane.
- Quitar `ErrorAlert` del dashboard → ticket propio.

## Alignment
Construye sobre [ADR-020](../adr/020-design-system-storybook-catalog.md) (catálogo como vitrina gobernada) y
cierra la serie [ECO-89](ECO-89.md)/[ECO-90](ECO-90.md)/[ECO-91](ECO-91.md): de "primitivos revisados 1:1" a
"**catálogo ENTERO revisado 1:1**", con presentación homogénea en inglés y cobertura de variantes en cada pieza.
Refuerza el norte de **satellite-design**: el design-system como Core **portable, legible y fiel** que la IA
usará para componer satélites — un catálogo coherente es el casillero visual del estándar (pilar A).
