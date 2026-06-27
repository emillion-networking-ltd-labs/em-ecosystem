# ECO-89 — Storybook: cobertura 100% del design-system (catálogo = realidad)

Strategy: satellite-design

## Resumen
Salda la **deuda de cobertura** de [ECO-85](ECO-85.md): el catálogo Storybook tenía solo una **muestra** (26 de 74 items), así que no reflejaba la realidad del design-system (faltaban Input, los inputs de códigos de seguridad, Select, las secciones, etc. — existían como componentes pero sin story). Este ticket lleva el catálogo a **100% alineado con el registry**: una story por cada item, y el guardrail de cobertura pasa a **exigir 100%** (falla si algo queda sin story). **Aditivo y aislado** (ADR-019): solo stories + infra de Storybook + una dep no declarada que faltaba; no toca el dashboard.

## Decisiones que resuelve

### D — Una story por CADA item del registry (74/74)
48 stories nuevas: **37 atoms** pendientes (Input, DateInput, MfaDigitInput, Select, FormField, DataTable, Tabs, Accordion, Calendar, Tooltip, etc.), **8 secciones** (Hero, CTA, Contact, FAQ, Portfolio, Pricing, Services, Testimonials, con datos de muestra representativos) y los **3 app-coupled**.

### D — Componentes app-coupled: catalogados con `@/context` MOCK (0 exclusiones)
`ThemeToggle`/`TurnstileWidget` (vía `useTheme → @/context/ThemeContext`) y `ToastContainer` (`useToast → @/context/ToastContext`) dependían de un contexto que NO vive en la fuente del DS. Antes se EXCLUÍAN; ahora el Storybook aliasa `@/context` → un **mock** (`.storybook/mocks/context/`) con valores por defecto (Theme) y toasts de muestra (Toast). Así se catalogan sin tocar la fuente ni el dashboard. **La lista de exclusiones queda vacía.**

### D — El coverage-check pasa a EXIGIR 100%
`check-story-coverage.mjs` ahora **falla** si hay cualquier item del registry sin story (antes solo reportaba el pendiente). El catálogo no puede volver a desincronizarse: cada componente nuevo deberá traer su story o el gate lo bloquea.

### D — Declarar `qrcode` (dep no declarada que faltaba)
`QrCodeCard` hace `await import("qrcode")` — `qrcode` (MIT) nunca se declaró en `design-system/package.json` (gap heredado de ECO-23, misma clase que `motion` en ECO-82); storyarlo lo destapó. Se añade `qrcode` + `@types/qrcode`. `lic:check:ds` verde.

## Scope
- `design-system/stories/primitives/` (40 stories nuevas: 37 atoms + 3 app-coupled) + `design-system/stories/sections/` (8).
- `design-system/.storybook/mocks/context/ThemeContext.tsx` + `ToastContext.tsx`; alias `@/context` en `.storybook/main.ts`.
- `design-system/scripts/check-story-coverage.mjs` (exige 100%; exclusiones vacías).
- `design-system/package.json` + `package-lock.json` (`qrcode` + `@types/qrcode`).

## Acceptance Criteria
1. **100% cobertura**: `coverage` reporta **74 con story, 0 pendientes, 0 excluidos** y pasa.
2. **El gate exige 100%**: el coverage-check **falla** si algún item del registry queda sin story (verificable quitando una story).
3. **App-coupled catalogados**: ThemeToggle/TurnstileWidget/ToastContainer renderizan en el catálogo vía `@/context` mock (sin tocar la fuente ni el dashboard).
4. **Build**: `build-storybook` verde (las 74 stories renderizan/compilan).
5. **Dep declarada**: `qrcode` + `@types/qrcode` en `package.json`; `npm ci` determinista; `lic:check:ds` verde (permisivas).
6. **Registry**: closure `node --test` 5/5 (sin cambios estructurales; el registry no cambia de items).
7. **Aislamiento**: **Dashboard-VRT verde**; suites api/dashboard verdes; `dup:check` verde; el dashboard **no** se toca.
8. **Gates** verdes (`Strategy: satellite-design`, ticket ECO-89), Security Pipeline.

## Out of scope
- **Baselines VRT del catálogo** (correr el test-runner con browsers + comprometer imágenes) — sigue siendo follow-up; aquí se cierra la cobertura de stories, no las baselines visuales.
- **Componentes nativos del dashboard NO portados** (icons, AuthGridLines, MetricCard/ChartCard, etc.) — son app-feature o portables aún sin elevar; decisión aparte. Este ticket cataloga lo que YA está en el design-system, no añade componentes.
- Alinear los colores verbatim de los componentes adoptados a tokens — refinamiento futuro.
- Tocar el dashboard (ADR-019: aditivo).

## Alignment
Cumple la promesa de [ADR-020](../adr/020-design-system-storybook-catalog.md) (Storybook = catálogo navegable del design-system) **de verdad**: un catálogo de muestra no sirve como vitrina ni base de VRT; debe reflejar **toda la realidad**. Salda la deuda explícita de [ECO-85](ECO-85.md) §Out of scope ("cobertura total = incremento siguiente"). Honra **ADITIVO y AISLADO** ([ADR-019](../adr/019-design-system-upstream-shadcn.md): stories + infra de Storybook + una dep faltante; no muta el dashboard; Dashboard-VRT lo prueba) y endurece el guardrail (100% permanente). No re-litiga el pilar A.
