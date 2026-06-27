# ADR-020 — Storybook como catálogo/visualización gobernada del design-system (complementa em-ui, no lo reemplaza)

- Status: accepted
- Date: 2026-06-27
- Ticket: [ECO-84](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-84)
- Strategy: satellite-design
- Deciders: Operador (human gate vía review + merge del PR de la lane, 2026-06-27)
- Contexto de gobierno: repo gobernado por Emkeel (ver `AGENTS.md`). Apoya la **fase 1** de [`satellite-design`](../strategy/satellite-design.md) ([ADR-018](018-satellite-design-generator.md)/[ADR-019](019-design-system-upstream-shadcn.md)): cerrar el **lazo de validación VISUAL** del design-system (hoy la fuente se valida solo en consumo) y dar un **catálogo navegable** de componentes.

## Contexto
Los incrementos de fase 1 (componentes Magic UI ECO-82, tokens de marketing ECO-83) están verificados **estructural/aislamiento** pero **no visualmente**: el `design-system/` es fuente, validada solo al consumirla en un satélite. Falta (a) probar que los componentes **buildan/renderizan** y (b) una **vitrina** donde entrar y consultar qué hay y cómo se ve. El `registry.json` es el catálogo *máquina* (distribución, grafo de deps, drift); falta el catálogo *humano*.

## Decisión
Adoptar **Storybook 10.x** (MIT) como la **capa de visualización/catálogo gobernada** del design-system. **Complementa, no reemplaza** a em-ui/registry: el registry sigue siendo la verdad de **distribución** (copia gobernada + cierre transitivo + drift + gates); Storybook es la **vitrina** (build + render + navegación + base de VRT).

Decisiones concretas (de la investigación, fundadas):
- **Versión + framework:** Storybook **10.x** (ESM-only, Node ≥20.16/22.19/24) con **`@storybook/nextjs-vite`** (soporta el alias `@/`, `next/font`, Tailwind). — https://github.com/storybookjs/storybook/blob/next/LICENSE · https://storybook.js.org/docs/get-started/frameworks/nextjs
- **Tailwind v4 = wiring manual (fricción anticipada, NO out-of-box):** no hay recipe oficial v4; se integra añadiendo `@tailwindcss/vite` al `viteFinal` de `.storybook/main.ts` + importando `design-system/tokens/tokens.css` en `preview.ts`. — https://storybook.js.org/recipes/tailwindcss · https://github.com/storybookjs/storybook/discussions/26323
- **VRT = test-runner de Storybook (Playwright, MIT), NO Chromatic:** el test-runner usa Jest+Playwright (consistente con el VRT Playwright que ya corre en el repo); los snapshots visuales se implementan con el hook `postVisit` (código propio). **Se descarta Chromatic** (SaaS comercial cerrado, de pago) — coherente con la cultura "gobernado/propio, sin lock-in SaaS", igual que se hizo registry propio en vez de adoptar uno. — https://storybook.js.org/docs/writing-tests/integrations/test-runner
- **Una story por componente** = el contenido del catálogo. Las stories pueden **sembrarse/chequearse contra `registry.json`** para que catálogo y registry no se desincronicen (los 59 componentes listados → cobertura verificable).
- **Addon a11y** (MIT) incluido — encaja con el estándar a11y del pilar A.

## Por qué Storybook y no el catálogo propio
Se evaluó un catálogo Next.js propio (in-stack, leyendo el registry). Storybook gana por ser el **estándar profesional** para esto (stories, controls, addon a11y, navegación lista) y porque NO compite con lo construido: em-ui/registry resuelve **distribución gobernada** (lo que Storybook no hace); Storybook resuelve **visualización** (lo que faltaba). Son capas complementarias.

## Consecuencias
- **Cumplimiento de licencias:** Storybook core+CLI+addon-a11y son **MIT** (pasa el guardrail no-copyleft de ECO-81). PERO el árbol de deps de Storybook es grande → al instalarlo, `npm run lic:check` debe correr sobre él; **esperar algunos `unknown`** (paquetes con campo license no-estándar) que requieren revisión humana + `--allow` por paquete. Actualizar `THIRD-PARTY-NOTICES`.
- **Superficie buildable nueva:** el `design-system/` es fuente sin build; Storybook le añade su propio `package.json` + `.storybook/` (dev-deps). Es un target de build nuevo, gateable en CI (Storybook debe buildear + test-runner verde).
- **Implementación por tickets feat** (`Strategy: satellite-design`, código vía el flujo normal): (1) scaffold Storybook 10 + nextjs-vite + wiring Tailwind v4 + cargar tokens.css; (2) primeras stories (los 4 de marketing + una muestra de los 47) + cobertura vs registry; (3) test-runner Playwright + gate en CI; (4) opcional: deploy del Storybook como sitio de referencia interno.
- **Anticipar fricción de setup** Tailwind v4 + Storybook (no canónico); presupuestar tiempo de wiring, no asumir out-of-box.
- No re-litiga el pilar A ni toca el dashboard (superficie nueva aislada).
