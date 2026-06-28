# ECO-91 — Storybook catalog: revisión de fidelidad componente a componente + fixes de distribución + Card/Charts

Strategy: satellite-design

## Resumen
Revisión interactiva **componente a componente** del catálogo Storybook (Primitives + relacionados), cotejando cada uno contra el `ComponentShowcase` del dashboard. Tras [ECO-90](ECO-90.md) (dark real + viewport + cobertura de matriz), aquí se **pule la presentación** y se cierran **gaps reales**: organización consistente (Default → Variants/Sizes → AllVariants), textos a **inglés**, anchos **fit-to-content** (no full-bleed), medidas con **px en mono**, y correcciones por componente. Además se arreglan varios **gaps de distribución** (utilidades/animaciones que vivían solo en el `globals` del dashboard y no llegaban al catálogo/satélites), se añaden **piezas nuevas** (Card, Charts + recharts, FullPageAlert), se **renombran** dos (BadgeIcon, ButtonIcon) y se **elimina ErrorAlert** del Core.

## Decisiones que resuelve

### D — Fidelidad componente a componente (presentación)
Cada primitive se revisó y corrigió: organización homogénea, inglés, ancho ajustado al contenido, sizes mayor→menor con px (`text-caption text-content-tertiary font-mono`). Correcciones concretas: Accordion (variante `uppercase`), Badge/BadgeIcon, Avatar/BeforeAfterSlider (imágenes reales libres), Breadcrumbs (collapsed navegable estilo Select), ConfirmModal (x en hover), Button (link-underline + icon, circular, links separados), AlertBox (fit-content), Checkbox/DateInput/Divider/EmailSelector/EmptyState, Input (filled documentada por uso real en LanguageSelector), InlineError (icono a la 1ª línea), MfaDigitInput (caret OTP oculto, label, Sizes responsive), Select (sin `danger` option en catálogo), SidebarNav (interactivo: toggle + footer + flyout), Slider (thumb visible + sin caret + extremos limpios), Tabs (solo `nav`/`nav-horizontal` + dots responsive), ThemeToggle/Tooltip (auto real en borde), Toast/ToastContainer (fit-content, icono centrado, 4 tipos, entrada progresiva), Toggle (Sizes + AllVariants), TurnstileWidget (ancho acotado), QrCodeCard/RecoveryCodesGrid (ancho acotado).

### D — Gaps de distribución (raíz)
Utilidades/keyframes que estaban **solo en el globals del dashboard** → portadas a `tokens.css` para que el catálogo y los satélites las tengan (el Core debe ser self-sufficient, no depender del consumidor):
- `@utility card / card-container / card-flat / card-container-flat` (superficies de tarjeta).
- `@utility scrollbar-hide`.
- `@keyframes infinity-spin` + `.infinity-spinner`.
- `@keyframes icon-success / icon-error` + `.icon-success / .icon-error`.
- `input[type="range"]` caret/cursor; `focus:outline-none` + anillo de foco en el thumb del Slider.

### D — Piezas nuevas
- **Card** — wrapper sobre las utilidades card (ejes `elevated` + `size`; plano por defecto, sombra reservada a ventanas).
- **Charts** (categoría nueva) — `SpeedometerChart` (SVG puro, theme-aware por clase), `DoughnutChart` y `TotalUsersChart` (**recharts**, theme vía toolbar). **recharts añadido como dependencia del Core.**
- **FullPageAlert** (Showcase) — pantallas de feedback error/success (composición de primitives), hover-to-preview.

### D — Renombrados + eliminación
- `IconBadge→BadgeIcon`, `IconButton→ButtonIcon` (orden de sidebar tras Badge/Button). `storyFor` del gate `variant-coverage` resuelve por **nombre canónico** + fallback por **contenido** (robusto a renames y a composiciones que importan un componente).
- **ErrorAlert eliminado del Core** (sin uso real en producto; lo cubre `AlertBox variant="error"`). Pendiente anotado: quitarlo del dashboard en su ticket.

### D — Tema JS sigue al toolbar
`preview.tsx` provee el `ThemeContext` mock con el tema del toolbar → `useTheme()` (charts, ThemeToggle) adapta al toolbar **sin** stories "Dark" aparte.

## Scope
- `design-system/tokens/tokens.css` — utilidades + keyframes distribuidas.
- `design-system/components/*` — nuevos (Card, SpeedometerChart, DoughnutChart, TotalUsersChart); ajustes (Slider, InlineError, Toast, MfaDigitInput, ConfirmModal, Accordion, Breadcrumbs, CountdownTimer, DateInput, Divider, InfinitySpinner); **ErrorAlert eliminado**.
- `design-system/stories/**` — revisadas/renombradas/nuevas (`charts/`, `showcase/FullPageAlert`).
- `design-system/.storybook/preview.tsx` + `mocks/context/ToastContext.tsx`.
- `design-system/scripts/check-variant-coverage.mjs` — `storyFor` robusto + ignores (`Tabs.subtle`).
- `design-system/package.json` + `package-lock.json` (recharts) + `registry.json` (77 items).

## Acceptance Criteria
1. **Fidelidad**: cada primitive revisado refleja el diseño (organización + inglés + fit-content + px mono); verificable en `npm run storybook`.
2. **Gaps cerrados**: card / scrollbar-hide / infinity / icon keyframes / range-caret en `tokens.css` → funcionan en el catálogo (y satélites).
3. **Nuevas piezas**: Card + Charts (recharts renderiza light/dark vía toolbar) + FullPageAlert.
4. **Renombrados** (BadgeIcon/ButtonIcon) ordenados tras su familia; **ErrorAlert fuera del Core**.
5. **Build + cobertura**: `build-storybook` verde; `coverage` (story 77/77 + variant) verde; closure de registry 5/5.
6. **Aislamiento**: el dashboard **no** se toca en este ticket (el catálogo refleja/lidera; la sección de diseño del dashboard se retirará en otro ticket). Suites api/dashboard + `dup:check` verdes; Dashboard-VRT verde.
7. **Gates** verdes (`Strategy: satellite-design`, ticket ECO-91), Security Pipeline (sin secretos).

## Out of scope
- Revisión de `sections/` + `showcase/` + `marketing/` → **segundo ticket** (mañana).
- Quitar **ErrorAlert del dashboard** (ticket propio).
- ADR/estrategia formal del re-encuadre "design-system = librería de TODO el proyecto + recharts" → **su propia lane** (no se toca `strategy/*.md` aquí).
- Baselines VRT del catálogo (snapshots).

## Alignment
Construye sobre [ADR-020](../adr/020-design-system-storybook-catalog.md) (catálogo como vitrina gobernada) y [ECO-89](ECO-89.md)/[ECO-90](ECO-90.md): de "existe + fiel a nivel de matriz" a "**revisado uno a uno y pulido**, con los gaps de distribución cerrados para que el Core sea **self-sufficient**" (no dependa del `globals` del dashboard). Refuerza el norte de **satellite-design**: el design-system como Core **portable y reutilizable**.

NOTA estratégica (a fijar en su lane, no aquí): el design-system se consolida como la **librería de diseño de TODO el proyecto** (dashboard incluido) — de ahí la entrada de **recharts/charts** — y la sección de diseño del dashboard se **retirará** una vez estabilizado. Ese re-encuadre + la dependencia recharts merecen un **ADR / strategy-change en su propia rama**. Aditivo y aislado del dashboard ([ADR-019](../adr/019-design-system-upstream-shadcn.md)): el catálogo lidera; el dashboard no se muta en este ticket.
