# ECO-90 — Storybook fidelity: dark mode real + viewport + cobertura de sizes y variantes

Strategy: satellite-design

## Resumen
Hace que el catálogo Storybook refleje **fielmente el diseño del dashboard** (al que se le dedicó mucho trabajo). Tras [ECO-89](ECO-89.md) el catálogo tenía las 74 stories pero **de muestra mínima**: el **dark mode no aplicaba a los componentes** (solo oscurecía el fondo), faltaban **sizes/variantes/estados**, y no se podía ver el **responsive**. Este ticket: (1) arregla el dark mode real (por clase, como en producción), (2) añade viewport, (3) enriquece las stories con toda la matriz real de cada componente (derivada de la fuente + cotejada con el ComponentShowcase del dashboard), y (4) añade un **gate anti-regresión** de variantes. **Aditivo y aislado**: solo stories + infra de Storybook; no toca el dashboard ni los componentes.

## Decisiones que resuelve

### D — Dark mode REAL por clase (la causa raíz)
El design-system conmuta el tema por **clase**: `@custom-variant dark (&:is(.dark *))` + un bloque `.dark { --color-* }` (re-declara las utility-vars, como exige el patrón TW4 del structural-probe). El toggle de *fondo* de Storybook solo pintaba el canvas → los componentes no cambiaban. Se añade un **decorator de tema** (`preview.tsx`) con toolbar **light/dark** que pone la clase `.dark`/`.light` en un ancestro de la story — igual que el ThemeProvider del dashboard/satélite — y el fondo/color del lienzo siguen al **token** (no hex). Ahora el dark conmuta los componentes de verdad.

### D — Viewport responsive en la toolbar
`preview.tsx` declara viewports (móvil 375 / tablet 768 / laptop 1280 / desktop 1536). Los componentes ya eran responsive (Tailwind); faltaba poder **verlo** en el catálogo.

### D — Cobertura fiel de sizes/variantes/estados (derivada de la fuente)
Se enriquecen las stories de los componentes con matriz real: stories `AllSizes`/`AllVariants` + estados (disabled/error/loading/…), **mapeando sobre las claves reales** que el componente exporta (`sizeClasses`/`variantClasses`/`*Specs`) o su tipo union, y **cotejando con `ComponentShowcase.tsx`** del dashboard (la referencia de cómo se diseñó mostrar cada uno). No se inventan variantes; donde un componente no tiene sizes/variantes, se cubren sus estados/props reales.

### D — Gate anti-regresión de variantes
`check-variant-coverage.mjs`: para cada componente que exporta `variantClasses`/`sizeClasses`, **falla** si alguna clave de la matriz no aparece en su story. Encadenado al script `coverage` (gate CI). Así, una variante nueva sin reflejar en el catálogo bloquea el merge. Excepción documentada: `IconButton."inside input"` (está en `variantClasses` pero no es variante de uso público).

## Scope
- `design-system/.storybook/preview.tsx` (reemplaza `preview.ts`): decorator de tema light/dark + toolbar + viewport.
- `design-system/stories/primitives/*.stories.tsx` (37 enriquecidas con sizes/variantes/estados reales).
- `design-system/scripts/check-variant-coverage.mjs` + `package.json` (`coverage` encadena story + variant).

## Acceptance Criteria
1. **Dark real**: el toggle de tema conmuta la clase `.dark`/`.light` en un ancestro → los componentes resuelven sus tokens dark (no solo el fondo). Verificable en `npm run storybook` (toolbar Tema).
2. **Viewport**: la toolbar permite ver móvil/tablet/laptop/desktop.
3. **Cobertura de matriz**: cada componente con `variantClasses`/`sizeClasses` muestra TODAS sus claves; los que tienen estados (disabled/error/loading) los muestran; sin inventar variantes inexistentes.
4. **Gate anti-regresión**: `check-variant-coverage.mjs` pasa (claves reflejadas) y **falla** si se añade una variante sin story; encadenado a `npm run coverage`.
5. **Build + cobertura**: `build-storybook` verde; `coverage` (story 74/74 + variant) verde; closure 5/5.
6. **Aislamiento**: **Dashboard-VRT verde**; suites api/dashboard verdes; `dup:check` verde; el dashboard y los componentes **no** se tocan (solo stories + infra).
7. **Gates** verdes (`Strategy: satellite-design`, ticket ECO-90), Security Pipeline.

## Out of scope
- **Baselines VRT del catálogo** (snapshots con browsers) — sigue siendo follow-up; aquí se cubre el dark/viewport/variantes a nivel de stories, no las imágenes base.
- **Alinear los colores verbatim** de los componentes adoptados (Magic UI/Aceternity) a tokens de marca — refinamiento aparte.
- Nuevas piezas-estrella — pospuestas (la prioridad era la fidelidad de lo existente).
- Tocar el dashboard o los componentes (ADR-019: aditivo; el catálogo refleja, no modifica).

## Alignment
Hace que [ADR-020](../adr/020-design-system-storybook-catalog.md) cumpla su propósito como **vitrina fiel**: un catálogo que no muestra el dark real, los tamaños ni las variantes no refleja el diseño invertido en el dashboard. Construye sobre la cobertura 100% de [ECO-89](ECO-89.md) (de "existe una story" a "la story es fiel"). Honra **ADITIVO y AISLADO** ([ADR-019](../adr/019-design-system-upstream-shadcn.md): solo stories + infra; no muta el dashboard ni los componentes; Dashboard-VRT lo prueba) y replica el mecanismo de tema de producción (clase, no `prefers-color-scheme`). No re-litiga el pilar A.
