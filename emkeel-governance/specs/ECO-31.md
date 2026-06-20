# ECO-31 — Repoint del dashboard a `design-system/` vía em-ui (retirar la copia legacy)

Strategy: satellites

## Resumen
Materializa el "ECO futuro" que nombró [ADR-007](../adr/007-design-system-source-location.md): el dashboard deja de **hand-mantener** su copia legacy de UI Core y pasa a consumir **`design-system/`** como **copia gobernada por em-ui** (modelo de [ADR-006](../adr/006-satellite-component-reuse.md): copy con reconciliación, NO import/workspace). Es refactor de app en producción → el render **NO debe cambiar** (VRT required lo caza). Esta es **Parte 1 (diseño)**; la implementación va tras el human gate.

## Mapa del dual-source actual (medido, no asumido)
| Dimensión | Estado real |
|---|---|
| **Componentes UI** | Dashboard `src/components/ui/` = **48**; `design-system/components/` = **47**. **46 IDÉNTICOS** (`em-ui diff` sin drift). **1 derivado: `Divider`** — el dashboard está **adelante** (lleva el fix a11y de ECO-30: `text-content-secondary`); `design-system/components/Divider.tsx` aún tiene `text-content-primary/50`. |
| **App-owned (se QUEDA en el dashboard)** | **`CommandPalette.tsx`** (no está en design-system; app-coupled: importa `@/hooks/useAuth`, `@/hooks/usePermissions`, `@/lib/api`). |
| **Deps compartidas** | `hooks/useTheme.ts`, `lib/types.ts`, `lib/crop-image.ts` — **IDÉNTICAS** entre design-system y dashboard. |
| **Tokens** | `design-system/tokens/tokens.css` (slice de ECO-23) vs el bloque de tokens del dashboard `globals.css` (`@theme` 24-118 + `:root/.light/.dark` 211-445): **IDÉNTICOS** (cero diff de `@theme` y de valores de canal). El resto de `globals.css` (base, `@utility` card/auth-card, keyframes) es **app-specific** y se queda. |

**Conclusión del mapa (válvula NO disparada):** el repoint es **bajo riesgo** — 46/47 componentes y las 3 deps ya son idénticos; los tokens single-sourcean **limpio** (idénticos → render inalterado). El único drift es el fix a11y del `Divider` (el dashboard adelante), que se reconcilia **hacia** design-system.

## Plan de repoint (modelo em-ui copy, ADR-006/007)
1. **Reconciliar el `Divider`:** llevar el fix a11y de ECO-30 (`text-content-primary/50` → `text-content-secondary`) a **`design-system/components/Divider.tsx`** → los 47 quedan idénticos. (Es el invariante de "el dashboard adelante se reconcilia hacia el canon".)
2. **Tokens single-sourced vía em-ui:** `em-ui init --dest nexacore-dashboard/src` instala la capa de tokens (`styles/em-ui-tokens.css`, idéntica al bloque actual). `globals.css` pasa a **`@import "../styles/em-ui-tokens.css"`** + conserva su CSS **app-specific** (`@layer base`, `@utility` card/auth-card/scrollbar, `@keyframes`). Como la capa importada == el bloque actual → **render inalterado**.
3. **Componentes em-ui-gestionados:** los 47 portables + las 3 deps internas quedan como **copias em-ui** del dashboard (sourced de `design-system/`, drift-detectable con `em-ui diff`/reconciliable con `em-ui update`), en su misma ruta `src/components/ui/`. Físicamente idénticos → **render inalterado**. Se documenta que ya **no** se hand-mantienen.
4. **App-owned intacto:** `CommandPalette` + `useAuth`/`usePermissions`/`lib/api` se quedan en el dashboard (no son design system).
5. **Gobernanza:** registrar (manifiesto/nota) que `nexacore-dashboard/src/components/ui/` (salvo `CommandPalette`) + las 3 deps + la capa de tokens son **em-ui-managed desde `design-system/`** → cierra el dual-source que ADR-007 dejó como deuda.

## Plan de verificación (el render NO cambia — VRT required)
- `npm run build` (dashboard) + `jest` verdes.
- **VRT "Dashboard visual regression" VERDE** (required tras ECO-38): el render debe quedar **byte-igual** (tokens idénticos + componentes idénticos). Si por la reconciliación del `Divider` cambiara algún píxel del label "OR" en `/login,/register`, ya está cubierto por las baselines refrescadas en ECO-36 (que capturaron el render CON el fix a11y) → debe seguir verde sin re-capturar.
- `em-ui diff` de los 47 contra el dashboard → **sin drift** tras el repoint.

## Acceptance Criteria
1. **`design-system/components/Divider.tsx` reconciliado** con el fix a11y de ECO-30 (`text-content-secondary`) → los 47 componentes idénticos entre design-system y dashboard (`em-ui diff` sin drift).
2. **Tokens single-sourced:** `globals.css` consume la capa de tokens vía em-ui (`@import` de `em-ui-tokens.css`) en vez de inlinearla; el dashboard conserva su CSS app-specific. Sin cambio de valores de token.
3. **Componentes/deps em-ui-managed:** los 47 portables + `useTheme`/`types`/`crop-image` quedan como copias em-ui de `design-system/` (drift-detectable); `CommandPalette` + app-coupled (auth/API) **se quedan** app-owned, sin tocar.
4. **Render INALTERADO:** `npm run build` + `jest` verdes y **VRT "Dashboard visual regression" VERDE** (required) — el render queda byte-igual; cero re-captura de baselines (las de ECO-36 ya reflejan el fix a11y).
5. **Gates verdes** (`gates` con `Strategy: satellites`, Security Pipeline / Security Gate); diff acotado al repoint (dashboard ui/tokens + design-system/Divider); cero refs a tickets de otro repo.

## Out of scope
- NO convierte el repo a workspace/monorepo (ADR-006 lo descarta; el modelo es copy).
- NO toca `CommandPalette` ni las deps app-coupled (auth/API).
- NO cambia el diseño visual (cualquier cambio de render sería un bug; VRT lo caza).
- NO toca F2/F3 (skill `/launch-satellite`, automatización).

## Alignment
Cierra la deuda **dual-source** que [ADR-007](../adr/007-design-system-source-location.md) nombró como "ECO futuro": el dashboard pasa de copia legacy hand-mantenida a **consumidor em-ui de `design-system/`** (single-source canónico), honrando el modelo **copy-gobernado-con-reconciliación** de ADR-006 (no import). Reconcilia el fix a11y de ECO-30 hacia el canon. Respeta la frontera app-owned (CommandPalette/auth/API). Es la pieza que faltaba para que `design-system/` sea la **única** fuente del UI Core (la estrategia `satellites` se apoya en ese single-source).
</content>
