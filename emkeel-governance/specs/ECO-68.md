# ECO-68 — Toggle de tema MANUAL en el satélite emitido + estándar/gate

Strategy: satellite-builders

## Resumen
El emitter del núcleo común ya genera **ambos temas** (`ThemeContext`, default parametrizable por `colorMode` +
anti-FOUC `prefers-color-scheme`) pero **NO un control para que el visitante cambie a mano** light↔dark — solo
queda el default/SO. SAT01 tiene `ThemeToggle`; el emitter no lo montaba. Esta entrega añade el **toggle de tema
manual al header/nav de TODO satélite emitido** (cableado al `ThemeContext` que ya se genera, elección
**persistente**) y lo eleva a **indispensable del estándar**: un **check del gate de launch-readiness** lo exige
(y FALLA si falta), documentado en [ADR-013](../adr/013-satellite-launch-readiness-standard.md) como la **primera
extensión aplicada vía el mecanismo de lista viva (§7)**.

No re-litiga la máquina de tema (ECO-48) ni el estándar (ECO-64/65); **reutiliza** el `ThemeToggle` de em-ui
**vía el registry** (no copia local → cero drift) y **extiende** el núcleo común en un solo punto → lo heredan
todos los builders.

## Decisiones que resuelve

### D — El toggle se monta en el NÚCLEO COMÚN (LAYOUT compartido), no por builder
El `LAYOUT` lo comparten ambos builders (brief→`generate-satellite` y desde-archivo→`emit`). Montar `<ThemeToggle />`
en su header → lo heredan **todos** los builders sin tocar adapters (principio núcleo-común de ADR-012/013). Para
que `useTheme` no rompa en runtime, el `LAYOUT` se reestructura: `<Providers>` (el `ThemeProvider`) ahora envuelve
**header + children + footer** — antes solo envolvía `{children}`, dejando el header (y por tanto el toggle) FUERA
del provider.

### D — Reutiliza el `ThemeToggle` de em-ui VÍA REGISTRY (no copia local)
`ThemeToggle` **ya está en el registry** (`design-system/registry.json`: `registry:ui`, `registryDependencies`
`IconButton`/`Tooltip`, `internalDependencies` `hooks/useTheme.ts`). Su `useTheme` lee `@/context/ThemeContext`,
exactamente el contexto que el satélite genera → **compatible sin tocar nada**. Por eso NO hubo que generalizar el
de SAT01 (la condición "si no está en el registry" del encargo era falsa): ambos builders hacen
`emui add ThemeToggle` como cualquier otro componente → jala su cierre (IconButton/Tooltip + hook). Cero copia
local, cero drift.

### D — Nuevo indispensable del estándar + check del gate (lista viva, ADR-013 §7)
Se añade el **16º check** a `launch-ready.mjs`: el `LAYOUT` importa y monta `<ThemeToggle />` **DENTRO** de
`<Providers>` (verificado por ORDEN: provider antes que el toggle → el toggle es descendiente del provider, justo
lo que el estándar exige y la regresión que arreglamos), `ThemeToggle.tsx` usa `useTheme()`/`toggleTheme`, y existe
`src/context/ThemeContext.tsx`. Falla cualquiera ⇒ NO "lanzado". Documentado en ADR-013 (§1 NUEVO, §6 gate, §7
primera extensión aplicada).

### D — El §estándar del NORTE se tramita en su propio lane `/strategy`
Añadir un indispensable al **norte** (`strategy/satellite-builders.md` §estándar) es un **acto deliberado,
aprobado por humano** (la propia estrategia lo fija: «vía un refinamiento gobernado de `/strategy`») y el gate
`check_strategy_change` bloquea una `feat/` que toque `strategy/*.md`. Por eso esta entrega cierra la **decisión
técnica** (emitter + gate + ADR-013); el refinamiento del norte va en su **lane de estrategia** aparte.

## Scope
- `scripts/generate-satellite.mjs` (MODIFICADO, núcleo común): `LAYOUT` importa `ThemeToggle` y lo monta en el
  header (agrupado con el nav, visible en todos los anchos); `<Providers>` envuelve header+children+footer. El
  generador brief hace `emui add ThemeToggle` tras la máquina de tema.
- `scripts/builders/emit.mjs` (MODIFICADO, núcleo común): añade `"ThemeToggle"` a la lista de `emui add`.
- `scripts/builders/lib/launch-ready.mjs` (MODIFICADO): 16º check (toggle en header cableado al `ThemeContext`,
  dentro de `<Providers>`).
- `emkeel-governance/adr/013-...md` (MODIFICADO): §1 NUEVO + §6 gate + §7 primera extensión aplicada.
- Tests: `tests/theming.test.mjs` (el toggle dentro de `<Providers>` + el wrap nuevo); `tests/launch-ready.test.mjs`
  (el gate EXIGE el toggle → FALLA si falta).
- **NO** toca los adapters, el IR, ni la máquina de tema (ECO-48); el `ThemeToggle` se reutiliza del registry.
- **NO** toca `strategy/satellite-builders.md` (lane de estrategia aparte, ver decisión).

## Acceptance Criteria
1. **El satélite emitido monta un `<ThemeToggle />` en el header/nav**, visible, cableado al `ThemeContext` que el
   núcleo genera → el visitante cambia light↔dark a mano y la elección **persiste**.
2. **`ThemeToggle` se jala vía registry** (`emui add ThemeToggle`) en AMBOS builders — no copia local.
3. **El `LAYOUT` envuelve header+children+footer en `<Providers>`** → el `useTheme` del toggle nunca rompe.
4. **El gate de launch-readiness añade un check** que exige el toggle en el header cableado al `ThemeContext`,
   dentro de `<Providers>`; **FALLA si falta** (verificado por un test).
5. **ADR-013 documenta** el toggle como indispensable (lista viva §7); el §estándar del norte queda para su lane
   `/strategy`.
6. **E2e Atis** (re-emitido): el header tiene un toggle que cambia light↔dark de verdad (persiste), ambos temas se
   ven bien; el gate (16 checks) lo exige y pasa.
7. **Tests verdes**: suite del skill completa (node:test).

## Alignment
Extiende el **estándar profesional COMPLETO del núcleo común** del norte
[`satellite-builders`](../strategy/satellite-builders.md) (§«Refinamiento ECO-64», [ADR-013](../adr/013-satellite-launch-readiness-standard.md))
con un indispensable que faltaba: el **control manual de tema**. Honra el principio de **núcleo común que hereda
todo builder** (un solo punto de cambio: LAYOUT + gate; cero por-builder, cero adapters) y el de **ownership/no
drift** (reutiliza el `ThemeToggle` de em-ui vía registry, nunca una copia local). Ejercita explícitamente el
**mecanismo de lista viva / extensible** (ADR-013 §7): primer indispensable añadido tras el estándar inicial,
demostrando que el estándar crece con el producto sin re-litigar el norte. Respeta la **separación de lanes**: la
decisión técnica aquí (`feat/`), el refinamiento del norte en su lane `/strategy` (acto humano).
