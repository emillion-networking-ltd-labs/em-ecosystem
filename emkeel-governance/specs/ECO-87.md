# ECO-87 — Fase 1: pieza-estrella HeroShowcase componible por preset de sector

Strategy: satellite-design

## Resumen
Sexto incremento de la **fase 1** de [`satellite-design`](../strategy/satellite-design.md) ([ADR-018](../adr/018-satellite-design-generator.md)/[ADR-019](../adr/019-design-system-upstream-shadcn.md)): el eje 5 de la anemia estructural — la **pieza-estrella**. `HeroShowcase` es el primer componente que **COMPONE** lo construido en fase 1 (layout primitives ECO-86 + slots decorativos ECO-86 + tokens de marketing ECO-83 + componentes marketing ECO-82) en un hero diferenciador. **Demuestra la tesis del pilar B**: belleza por composición gobernada, no por plantilla. Parametrizable por `preset` = el **sector como configuración MULTI-EJE** (no solo color): cambia familia tipográfica, atmósfera decorativa y énfasis. **Aditivo y aislado** (ADR-019): 1 sección nueva, **cero deps nuevas**, no toca el dashboard. Visible en el catálogo Storybook (ECO-85).

## Decisiones que resuelve

### D — `HeroShowcase` = composición, no átomo (vive en `sections/`)
Compone `Section`(isolateDecoration) + `Container` + `Split` + `Stack` + `Button` + slots (`GradientBackdrop`/`Blob`/`DotPattern`/`GridPattern`) + `AnimatedGradientText`. Registrada como `registry:section` (em-ui resuelve su cierre transitivo de átomos al hacer `add HeroShowcase`). `build-registry.mjs` recomputa las 10 `registryDependencies` + `lib/utils.ts` de los imports.

### D — `preset` = sector multi-eje (tipografía + atmósfera + énfasis), no tema de color
Tres presets que difieren de raíz (el panel: "el sector es preset multi-eje, no tema de color"):
- **`bold`** (gym/tech/startup) — `font-display` (sans potente) + halos de marca (`Blob` + `GradientBackdrop` radial). Energía.
- **`elegant`** (restaurante/lujo/clínica) — `font-serif` + atmósfera sutil (`DotPattern` + gradiente lineal suave). Calma.
- **`editorial`** (agencia/portfolio) — `font-display` + rejilla técnica (`GridPattern`). Editorial.
Además **tematizable por satélite** vía `--color-accent/-2` (tokens), sin editar el componente.

### D — HECHOS por props (jamás inventados) + omit-if-absent + LCP
`title` obligatorio (h1); `media`/`subtitle`/CTAs opcionales → sin media, hero a una columna centrado (nunca un placeholder); `Split` mantiene contenido-primero en el DOM (SEO/a11y). Above-the-fold → **SIN reveal** (protege el LCP).

### D — Storybook reconoce secciones
`.storybook/main.ts` añade el alias `@/components/sections → sections` (espejo del mapeo del consumidor em-ui: sections → `components/sections/`); el coverage-check reconoce `@/components/{ui,sections}/`. Habilita storyar/visualizar secciones, no solo átomos.

## Scope
- `design-system/sections/HeroShowcase.tsx` (la pieza-estrella).
- `design-system/registry.json` (regenerado por `build-registry.mjs`; 68→69).
- `design-system/stories/showcase/HeroShowcase.stories.tsx` (3 presets + con/sin media).
- `design-system/.storybook/main.ts` (alias de secciones) + `design-system/scripts/check-story-coverage.mjs` (regex ui|sections).

## Acceptance Criteria
1. **Composición**: `HeroShowcase` renderiza componiendo las primitivas + slots + marketing + Button (no reimplementa nada); `registry:section` con las 10 `registryDependencies` + `lib/utils.ts`.
2. **Presets multi-eje**: `bold`/`elegant`/`editorial` difieren en familia tipográfica (display/serif) + atmósfera decorativa; tematizables vía `--color-accent/-2`.
3. **Hechos/omit-if-absent**: `title` obligatorio; sin `media` → una columna centrada; CTAs/subtitle omitidos si faltan; contenido-primero en el DOM.
4. **Registry**: regenerado (69 items), closure `node --test` 5/5.
5. **Storybook**: `build-storybook` verde (renderiza los 3 presets + con/sin media); `coverage` verde (21 con story); categoría `Showcase/`; alias de secciones operativo.
6. **Zero deps nuevas**: `package.json` sin cambios; `lic:check:ds` verde.
7. **Aislamiento**: **Dashboard-VRT verde**; suites api/dashboard verdes; `dup:check` verde; el dashboard **no** se toca.
8. **Gates** verdes (`Strategy: satellite-design`, ticket ECO-87), Security Pipeline.

## Out of scope
- **Más presets** / más piezas-estrella (Stats, FeatureShowcase, Testimonial-hero) — incrementos siguientes.
- **El generador que elige el preset** y compone la página (pilar B) — futuro; aquí se entrega la PIEZA, no el motor.
- **Consumir** HeroShowcase en un satélite real + baselines VRT del catálogo + cobertura total de stories (deuda ECO-85).
- Tocar el dashboard o re-pull-ear primitivos (ADR-019: aditivo).

## Alignment
Materializa el **eje 5** ("pieza-estrella por preset") del PRERREQUISITO de [`satellite-design`](../strategy/satellite-design.md) ([ADR-018](../adr/018-satellite-design-generator.md) §Condiciones). Es la **primera demostración de COMPOSICIÓN gobernada** (la tesis del pilar B: belleza por composición, no plantilla) sobre el cimiento de fase 1 (tokens ECO-83 + primitivas/decoración ECO-86 + marketing ECO-82), visible en el catálogo [ECO-85](ECO-85.md). El `preset` realiza el "sector = multi-eje" del diagnóstico del panel (tipografía + atmósfera, no solo color). Honra **ADITIVO y AISLADO** ([ADR-019](../adr/019-design-system-upstream-shadcn.md): cero deps, no muta el dashboard; Dashboard-VRT lo prueba), **hechos-no-inventados + omit-if-absent**, y **LCP** (sin reveal above-the-fold). No re-litiga el pilar A.
