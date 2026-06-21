# ECO-48 — launch-satellite: theming dark/light en satélites generados (paridad SAT01) + onboarding pregunta el modo

Strategy: satellites

## Resumen
Da a los satélites **generados** la maquinaria de **tema dark/light + toggle** que es **nuestro estándar**
(UI Core/SAT01), y hace que el onboarding **pregunte siempre** el modo por defecto. Hoy
`generate-satellite.mjs` **no** scaffolda esa maquinaria (cero refs a tema): el satélite generado se lleva los
tokens dark vía em-ui **pero sin activarlos** (sin `ThemeProvider` → un componente con `useTheme` rompería;
sin default; sin toggle). SAT01 lo tiene **solo por ser hecho a mano**. Este ECO lo generaliza.

## Contexto / base (verificado)
- Nuestro estándar **es** dark/light: SAT01 trae `src/context/ThemeContext.tsx` + `src/app/providers.tsx` +
  un `THEME_INIT_SCRIPT` anti-FOUC en el layout (probado en producción).
- `useTheme` (`design-system/hooks/useTheme.ts:6-11`) hace `useContext(ThemeContext)` y **lanza** si no hay
  provider — un satélite generado con un componente de tema **rompería**.
- Los componentes por defecto (Button/Badge/Divider) no arrastran tema → el satélite generado hoy no tiene
  ninguna maquinaria de tema.

## Decisiones que resuelve

### D — `colorMode` en el brief (modo por defecto, lo elige el cliente)
Nuevo campo **opcional** `colorMode` (`{value: dark|light|system, provenance: provided|proposed}`). **Lo elige
el cliente** en el onboarding (`provided`); **NO se hardcodea dark**. **Ausente ⇒ default `system`** (neutral:
respeta `prefers-color-scheme` del visitante, sin imponer dark ni light). No rompe briefs previos.

### D — Scaffolding de tema GENÉRICO (modelado en SAT01), default parametrizado
La generación escribe la maquinaria **genérica** (cualquier default + toggle):
- `src/context/ThemeContext.tsx` — `ThemeProvider` + `ThemeContext` (lo que importa `useTheme`), con
  `DEFAULT_MODE` **parametrizado** por `colorMode` (no hardcodeado).
- `src/app/providers.tsx` — `Providers` que envuelve en `ThemeProvider`.
- En el **LAYOUT**: el `THEME_INIT_SCRIPT` anti-FOUC (síncrono, parametrizado por `colorMode`) + `<Providers>`
  envolviendo la app → **`useTheme` nunca rompe**.
- Comportamiento del default: **dark** → arranca oscuro salvo `light` guardado; **light** → arranca claro
  salvo `dark` guardado; **system** → preferencia guardada o `prefers-color-scheme`.

## Scope
- `schema/brief.schema.json`: campo `colorMode` (enum, opcional).
- `scripts/lib/brief.mjs`: `COLOR_MODES`, `DEFAULT_COLOR_MODE` (`system`), `briefColorMode()`, validación.
- `scripts/generate-satellite.mjs`: scaffold `ThemeContext`/`providers` + init-script + wrap en LAYOUT; `trace.colorMode`.
- `SKILL.md` modo (c): **pregunta siempre** el modo de color (dark|light|system), sin hardcodear.
- Tests (sin red). **NO** toca F1 (`design-system/`, `em-ui/`), el reuse vía em-ui, ni la forma-SAT01 (la complementa).

## Acceptance Criteria
1. **Scaffolding presente:** la generación escribe `src/context/ThemeContext.tsx` + `src/app/providers.tsx`, y
   el LAYOUT importa `Providers`, **envuelve la app** (`<Providers>{children}</Providers>`) e incluye el
   `THEME_INIT_SCRIPT` → un satélite generado tiene `ThemeProvider` y **`useTheme` no rompe**.
2. **Default parametrizado (no hardcodeado):** `DEFAULT_MODE` del `ThemeContext` refleja el `colorMode` del
   brief (dark/light/system); el **init-script anti-FOUC** refleja el modo (3 casos verificables).
3. **El skill PREGUNTA, no asume:** SKILL.md modo (c) instruye preguntar dark|light|system; **no** hardcodea
   dark. `colorMode` ausente ⇒ default `system` (documentado); no rompe briefs previos.
4. **Build OK:** un satélite generado con la maquinaria **`next build` verde** y **Lighthouse S2 sigue verde**
   (gate por mediana, ECO-41) — la maquinaria no degrada performance.
5. **Reuse + forma-SAT01 intactos:** sigue usando em-ui y la estructura SAT01 (suite del skill verde).
6. **Gates verdes:** `gates` (`Strategy: satellites`, `check_ticket_link` ECO-48), Security Pipeline / Security Gate.

## Out of scope
- Un **botón visible** de toggle en las páginas generadas (la maquinaria está; añadir un control UI es estética per-cliente / F2b creatividad).
- Cambios en `design-system/`/`em-ui/` (F1) o en el modelo de tema del dashboard.

## Alignment
Materializa parte de la **Decisión D4** del norte (`strategy/satellites.md` §«Modo (c) — remodelar con
valor»): "aporta **valor**… con **nuestros componentes**" **incluye nuestro estándar de theming** (dark/light
+ toggle). Sin esto, un satélite generado se lleva los tokens dark pero inertes. Respeta el split
verdad/diseño (el `colorMode` es una elección `provided` del cliente, no un dato inventado), el reuse vía
em-ui y la forma-SAT01. No adelanta F3 ni toca F1.
