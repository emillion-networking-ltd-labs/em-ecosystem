# ECO-86 — Fase 1: layout primitives + slots decorativos gobernados del design-system

Strategy: satellite-design

## Resumen
Quinto incremento de la **fase 1** de [`satellite-design`](../strategy/satellite-design.md) ([ADR-018](../adr/018-satellite-design-generator.md)/[ADR-019](../adr/019-design-system-upstream-shadcn.md)): cubrir dos de los **6 ejes** que el panel adversarial marcó como la **anemia estructural** del design-system — **layout primitives** y **slots decorativos** (los otros ejes ya hechos: tokens marketing/familias ECO-83). El panel corrigió el diagnóstico: la falta no era de determinismo sino de **variedad estructural y atmósfera**; con tokens ricos pero sin primitivas de composición, el generador (pilar B) no puede armar layouts diversos y bellos sin recaer en plantilla. **Aditivo y aislado** (ADR-019): 9 componentes nuevos en `design-system/components/`, **cero deps nuevas** (solo `cn`), **no toca el dashboard**. Visibles ya en el catálogo Storybook (ECO-85).

## Decisiones que resuelve

### D — Layout primitives (riel de composición, gobernado por la escala)
5 primitivas que dan ritmo y estructura sin plantillar el contenido:
- **`Container`** — restringe la medida (max-width) + padding horizontal responsive.
- **`Section`** — banda vertical semántica (`<section>`) con ritmo (padding-block por escala) + superficie por token + `isolateDecoration` (lienzo `relative/overflow-hidden` para los slots).
- **`Grid`** — rejilla responsive (columnas + gap por escala; mobile-first 1-col).
- **`Split`** — dos paneles (contenido + media) que apilan en móvil y reparten por ratio; `reverse` altera el orden VISUAL sin tocar el DOM (contenido primero = SEO/a11y); `media` ausente → contenido a todo ancho (omit-if-absent).
- **`Stack`** — flujo vertical con gap + alineación (el primitivo más usado: eyebrow+titular+claim+CTA con ritmo).

### D — Slots decorativos (atmósfera por token, DECORACIÓN pura)
4 slots que aportan profundidad/atmósfera — todos `aria-hidden`, `pointer-events-none`, posicionados detrás del contenido, **jamás contenido ni un hecho del cliente**:
- **`GradientBackdrop`** — gradiente de marca multi-stop (tokens `--gradient-brand[-radial]` de ECO-83), linear/radial, intensidad gobernada.
- **`DotPattern`** / **`GridPattern`** — texturas SVG (`<pattern>`); color por `currentColor` → tematizable con una clase de texto por token (nunca hex).
- **`Blob`** — halo orgánico difuminado con el gradiente radial de marca.
Todos **tematizables por satélite** vía `--color-accent/-2` (no se edita el componente).

### D — Registro drift-proof + categorías nuevas en Storybook
`registry.json` se **regenera** con `build-registry.mjs` (recomputa deps de los imports — `lib/utils.ts`); 59→68 items. Stories nuevas bajo `Layout/` y `Decoration/`. Registradas como `registry:ui` en `components/` → em-ui/cli las mapea a `components/ui/` del consumidor **sin cambios en el cli** (no cross-cutting).

## Scope
- `design-system/components/`: `Container`, `Section`, `Grid`, `Split`, `Stack`, `GradientBackdrop`, `DotPattern`, `GridPattern`, `Blob` (9 `.tsx`).
- `design-system/registry.json` (regenerado por `build-registry.mjs`).
- `design-system/stories/layout/` (5) + `design-system/stories/decoration/` (4).

## Acceptance Criteria
1. **Layout primitives**: las 5 renderizan, gobernadas por tokens/escala (sin valores de color crudos); `Section.isolateDecoration` aísla los slots; `Split` mantiene contenido-primero en el DOM y omite el panel media si falta.
2. **Slots decorativos**: los 4 son `aria-hidden` + `pointer-events-none` + posicionados; usan tokens de marca; tematizables vía `--color-accent/-2` y clases de texto (sin hex).
3. **Zero deps nuevas**: `design-system/package.json` sin cambios; `lic:check:ds` verde.
4. **Registry**: regenerado (68 items), las 9 con `type: registry:ui` + `internalDependencies: ["lib/utils.ts"]`; `node --test` del registry (closure) verde.
5. **Storybook**: `build-storybook` verde (renderizan); `coverage` verde (20 con story, 3 excluidos, resto pendiente declarado); categorías `Layout/` + `Decoration/`.
6. **Aislamiento**: **Dashboard-VRT verde**; suites api/dashboard verdes; `dup:check` verde; el dashboard **no** se toca.
7. **Gates** verdes (`Strategy: satellite-design`, ticket ECO-86), Security Pipeline.

## Out of scope
- **Pieza-estrella por preset** (eje 5) — incremento siguiente; depende de tener estas primitivas debajo.
- **Tanda 2 de componentes** (Aceternity-free) — incremento aparte.
- **Consumir** las primitivas en un satélite / el generador que las compone (pilar B) — futuro; validación visual de composición = en consumo.
- Baselines VRT del catálogo + cobertura total de stories (deuda de ECO-85, follow-up).
- Tocar el dashboard o re-pull-ear primitivos base (ADR-019: aditivo).

## Alignment
Materializa dos de los **6 ejes** del PRERREQUISITO de [`satellite-design`](../strategy/satellite-design.md) ([ADR-018](../adr/018-satellite-design-generator.md) §Condiciones: "crecer el design-system ANTES de gatear — … slots decorativos, layout primitives …"): la **variedad estructural** y la **atmósfera** que el panel nombró como la anemia real (no solo más componentes). Honra **ADITIVO y AISLADO** ([ADR-019](../adr/019-design-system-upstream-shadcn.md): superficie nueva, cero deps, no muta el dashboard; Dashboard-VRT lo prueba) y el principio **gobernado por tokens** (sin hex; decoración tematizable por `--color-accent/-2`, no editando componentes). Se apoya en el catálogo de [ECO-85](ECO-85.md) (las piezas son visibles/verificables en Storybook). No re-litiga el pilar A.
