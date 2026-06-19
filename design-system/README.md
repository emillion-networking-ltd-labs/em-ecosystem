# design-system/ — fuente canónica del UI Core (NexaCore)

Fuente **única** del design system, distribuida por **`em-ui`** (registry + CLI). Materializa
[ADR-007](../emkeel-governance/adr/007-design-system-source-location.md) (ubicación de la fuente) sobre
[ADR-006](../emkeel-governance/adr/006-satellite-component-reuse.md) (reuse = copia gobernada con
reconciliación) y la estrategia [`satellites`](../emkeel-governance/strategy/satellites.md). Ticket: ECO-23.

> **Invariante:** `em-ui` lee SIEMPRE de aquí, **nunca** de `nexacore-dashboard/`. El dashboard es un
> consumidor **legacy** (mantiene su copia; su repuntado es un ECO futuro). NO se toca en ECO-23.

## Contenido
- `components/` — **47 componentes portables**, idénticos a su origen (`nexacore-dashboard/src/components/ui/`).
  Consumidores con alias `@/ → src` (dashboard y satélites) no necesitan reescritura de imports.
- `hooks/useTheme.ts`, `lib/types.ts`, `lib/crop-image.ts` — deps internas legítimas (self-contained).
- `tokens/tokens.css` — **capa de tokens** semánticos (slice de `globals.css`: `@theme` + `:root`/`.light`/`.dark`).
  Sin ella, un componente referencia tokens inexistentes y **renderiza roto** → distribuir con `em-ui init`.
- `registry.json` — índice + grafo de dependencias (qué arrastra cada componente).

## Excluido (app-coupled — NO es design system)
- **`CommandPalette`** — importa `@/hooks/useAuth`, `@/hooks/usePermissions`, `@/lib/api` (atado a sesión/API
  del dashboard). No portable → se queda en el dashboard.

## Uso (em-ui)
```bash
node em-ui/cli.mjs list                          # componentes + deps
node em-ui/cli.mjs add Button --dest <src>       # copia Button (+deps) al consumidor (ownership)
node em-ui/cli.mjs init --dest <src>             # instala la capa de tokens
node em-ui/cli.mjs diff Button --target <fich>   # drift del consumidor vs la fuente
node em-ui/cli.mjs update Button --dest <src>    # re-pull reconciliando (sobrescribe)
```

## Reconciliación del drift de SAT01 (ECO-23, scope c)
`em-ui diff Button` contra `satellites/sat-cristian-garcia/` reveló **dos** divergencias respecto a la fuente:

| Divergencia | Clasificación | Acción |
|---|---|---|
| El spinner de carga perdió `role="status"` / `aria-label="Loading"` | **Regresión de a11y** (copia manual) | **Restaurada** en el Button de SAT01 |
| `const Component = as ?? (href ? "a" : "button")` (default a `<a>` si hay `href`) + su comentario | **Intencional per-cliente** (navegación del satélite) | **Preservada** (ownership) |

Resultado: tras la reconciliación, `em-ui diff Button` ya no reporta la regresión de a11y; solo queda la
divergencia intencional (documentada aquí). Es el patrón de ADR-006: el drift se vuelve **detectable y
reconciliable**, distinguiendo regresión (se corrige) de personalización (se conserva).
</content>
