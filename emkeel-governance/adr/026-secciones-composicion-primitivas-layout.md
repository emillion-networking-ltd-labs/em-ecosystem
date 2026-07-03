# ADR-026 — Las secciones se componen con las primitivas de layout (no con max-w/py/grid ad-hoc)

- Status: accepted
- Date: 2026-07-03
- Ticket: [ECO-120](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-120)
- Strategy: satellite-design
- Deciders: Operador (human gate vía review visual en Storybook + merge del PR)
- Contexto de gobierno: repo gobernado por Emkeel (ver `AGENTS.md`). Depende de [ADR-025](025-layout-primitivas-niquelado.md)
  (las primitivas se niquelaron primero en ECO-131).

## Contexto

La revisión de ECO-111 destapó que las 8 secciones (Hero, Contact, FAQ, Pricing, Services, Testimonials,
Portfolio, CTA) **hand-rolleaban el layout** con Tailwind crudo (`mx-auto max-w-…`, `px-6`, `py-20 sm:py-24`,
`grid grid-cols-…`) en vez de usar sus propias primitivas de layout. Consecuencia: **drift** — el mismo tipo de
banda usaba anchos distintos (max-w-3xl/6xl/7xl), `py` distintos (una no escalaba) y gaps distintos; y no se
hacía dogfooding del sistema. ECO-131 dejó las primitivas listas (escala de gap única, Grid responsive, Cluster,
Section inverse, Container prose/canónico). Ahora las secciones las adoptan.

## Decisión

**Las secciones/páginas se componen con las primitivas de layout**, no con medidas ad-hoc:
- `Section` = la banda (surface + ritmo vertical gobernado). `Container` = la medida centrada. `Grid` = rejillas
  uniformes. `Cluster` = filas horizontales con wrap. `Stack` = flujo vertical.
- **Ancho de contenido por rol:** `xl` (1280, canónico de marketing) para bandas anchas de tarjetas
  (Pricing/Testimonials/Contact/Portfolio); `md` (896) para listas/contenido (Services) y para el acordeón de
  FAQ (un acordeón es UI, no prosa pura → medida cómoda que no apila el texto en pantallas grandes); `sm` (672)
  para bloques centrados estrechos (CTA). `Section` con `spacing` `md` por defecto (banda de marketing 80→96).
- **Referencia canónica de composición: `sections/Pricing.tsx`** (Section + Container + Grid). Sustituye a
  HeroShowcase, retirado en ECO-114/ADR-023.
- **CTA** migra su `.dark` manual a `Section surface="inverse"` (el scope de tema de ECO-131).
- **Rejillas internas bespoke** (form+métodos de Contact: asimétrica 3/2, condicional) **se mantienen custom** —
  `Grid` modela rejillas uniformes, no layouts de formulario. El estándar gobierna banda/medida/rejilla-uniforme,
  no cada flex.

### Hero queda FUERA (deliberado)

`Hero` NO se refactoriza en ECO-120. Es un patrón **`Cover`** (altura de viewport 50/60vh + media a sangre con
overlay + contenido anclado abajo + padding propio) que las primitivas actuales no modelan (Section=py-bandas;
Container=medida centrada; Grid fuerza `display:grid` y rompería el `hidden lg:grid` de las stats). Forzarlas
quedaría peor. Se migrará cuando exista la primitiva **`Cover`** (diferida en ADR-025). **Seguimiento: ECO-132**
(nota permanente en `sections/Hero.tsx`).

## Consecuencias

- 7 de 8 secciones componen con primitivas → spacing/anchos gobernados, drift eliminado, dogfooding real.
- Cambios visibles (revisados en Storybook): Pricing/Portfolio-grid ensanchan a 1280 (canónico); Services estrecha
  su cabecera a 896 y su banda ahora escala en desktop; FAQ pasa a 896; CTA a 672; galería de Portfolio gap 12→16
  (el 12 no existe en la escala unificada). Testimonials/Contact quedan casi iguales.
- Hero pendiente de la primitiva Cover (ECO-132) — no tocar a mano hasta entonces.
