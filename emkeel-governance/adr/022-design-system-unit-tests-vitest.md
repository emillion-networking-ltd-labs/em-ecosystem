# ADR-022 — Tests unitarios del design-system con vitest+jsdom (complementa Storybook/VRT, no lo reemplaza)

- Status: accepted
- Date: 2026-07-02
- Ticket: [ECO-116](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-116)
- Strategy: none (infraestructura de test del design-system)
- Deciders: Operador (human gate vía review + merge del PR, 2026-07-02)
- Contexto de gobierno: repo gobernado por Emkeel (ver `AGENTS.md`). Toda corrección de bug empieza por un
  test de regresión permanente — este ADR fija CÓMO se cumple eso para la LÓGICA de un componente del DS.

## Contexto

El design-system se validaba solo por **Storybook + VRT (test-runner Playwright)** ([ADR-020](020-design-system-storybook-catalog.md))
y por **guards** (scripts node: coverage, story-norm, selection-model). No había runner de **tests unitarios**.

Arreglando ECO-116 (el Tooltip `position: fixed` no re-anclaba en scroll/resize) chocamos con que ese modelo
no permite un test de regresión fiable para LÓGICA de componente:

- El **test-runner de Storybook** (a) requiere navegador (Playwright) — no operativo por defecto en dev
  (faltaban libs del SO) — y (b) **ningún workflow de CI lo corre** → un play test no sería guard permanente.
- Peor: en el harness de Storybook el tooltip `position: fixed` **ya seguía al scroll** (un ancestro con
  transform del preview lo hacía contenible) → el play test **no podía fallar**, así que no servía de regresión.
- El test-runner además se rompía ("Invalid hook call / more than one copy of React") cuando otro agente
  tenía un **worktree** en `.claude/worktrees/` (segunda copia de React que jest-haste-map escaneaba).

## Decisión

Adoptar **vitest + jsdom + @testing-library/react** como runner de tests unitarios del design-system, para
**LÓGICA** de componente (listeners, cálculo de posición, estado) que el catálogo visual no puede aseverar de
forma determinista. **Complementa, no reemplaza** a Storybook/VRT (que sigue siendo la validación visual/render).

Concreto:
- `vitest.config.ts`: `environment: jsdom`, `include: tests/**/*.test.tsx`, `exclude: node_modules/** y
  **.claude/**** (nunca escanea worktrees de agentes → inmune al doble-React que rompe el runner de navegador).
- `vitest.setup.ts`: matchers de `@testing-library/jest-dom` + mock de `matchMedia` (jsdom no lo trae).
- Script `test: vitest run`; cableado en CI en `design-system-storybook.yml` (mismo nivel que la guard
  `coverage`). Deps nuevas: todas `devDependencies` (0 high/critical en audit).
- Primer test: `tests/Tooltip.test.tsx` — mockea `getBoundingClientRect`, abre el tooltip, mueve el trigger,
  dispara `scroll`/`resize` y asevera que las coords re-anclan. Falla contra el componente pre-fix, pasa tras él.

**Cablear el test-runner de Storybook (VRT + play tests) con navegador en CI queda como follow-up** (para
tests que SÍ necesitan layout real) — desacoplado de esto.

## Consecuencias

- La regla "todo bug empieza por un test" es cumplible para la LÓGICA de componentes del DS con un guard
  determinista, rápido (~1.5s), sin navegador y enforce-able en CI.
- jsdom no tiene layout: los tests de POSICIÓN mockean rects y prueban CUÁNDO se recalcula (no píxeles
  reales). Lo visual/píxel sigue siendo territorio de VRT.
- Nueva superficie de dev-deps (vitest/jsdom/testing-library) en el design-system; solo dev, fuera de la
  matriz de audit de CI.
