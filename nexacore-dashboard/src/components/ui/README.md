# UI Core del dashboard — em-ui-managed (ECO-31)

Estos componentes **ya NO se hand-mantienen**: son **copias gobernadas por `em-ui`** desde la fuente
única `design-system/` (modelo de [ADR-006](../../../../emkeel-governance/adr/006-satellite-component-reuse.md)
/ [ADR-007](../../../../emkeel-governance/adr/007-design-system-source-location.md): *copy con
reconciliación*, NO import/workspace). El dashboard es **consumidor** de `design-system/`, igual que un
satélite. Esto cierra el dual-source que ADR-007 dejó como deuda (ECO-31).

## Reglas
- **No edites a mano** los 47 componentes em-ui-managed ni las deps compartidas. Para cambiarlos:
  edita la fuente en `design-system/` y re-pull con `em-ui update <C> --dest nexacore-dashboard/src`.
- Detecta drift con `em-ui diff <C> --target src/components/ui/<C>.tsx` (debe quedar *SIN DRIFT*).
- **Tokens:** la capa vive en `src/styles/em-ui-tokens.css` (instalada por `em-ui init`, copia de
  `design-system/tokens/tokens.css`); `src/app/globals.css` la **`@import`a** y solo conserva el CSS
  **app-specific** (`@layer base`, `@utility` card/auth-card/scrollbar, `@keyframes`).

## App-owned (se QUEDA en el dashboard — NO es design system)
- **`CommandPalette.tsx`** — app-coupled (importa `@/hooks/useAuth`, `@/hooks/usePermissions`, `@/lib/api`).
  No entra a `design-system/`; se mantiene aquí a mano.
- Las deps compartidas `@/hooks/useTheme`, `@/lib/types`, `@/lib/crop-image` también son em-ui-managed
  (idénticas a `design-system/`); el resto de `@/hooks` y `@/lib` (auth/api/permissions) es app-owned.

## Fuente
`design-system/` (registry `design-system/registry.json`; CLI `design-system/registry/cli.mjs`). `/admin/design-system`
sigue siendo la vista viva del UI Core.
</content>
