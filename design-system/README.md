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
node design-system/registry/cli.mjs list                          # componentes + deps
node design-system/registry/cli.mjs add Button --dest <src>       # copia Button (+deps) al consumidor (ownership)
node design-system/registry/cli.mjs init --dest <src>             # instala la capa de tokens
node design-system/registry/cli.mjs diff Button --target <fich>   # drift del consumidor vs la fuente
node design-system/registry/cli.mjs update Button --dest <src>    # re-pull reconciliando (NO pisa @em-ui-adapted; --force para forzar)
```

## Catálogo visual — Storybook (ECO-85, [ADR-020](../emkeel-governance/adr/020-design-system-storybook-catalog.md))
Storybook es la **vitrina** del design-system (complementa el registry, que es la verdad de *distribución*).
Cierra el lazo de validación **visual**: prueba que los componentes buildan/renderizan y da un catálogo navegable.

```bash
cd design-system && npm ci          # instala el tooling (Storybook 10 + addon-a11y + test-runner)
npm run storybook                    # dev server en :6006
npm run build-storybook              # build estático (storybook-static/, gitignored)
npm run coverage                     # catálogo (stories) ↔ registry.json no se desincronizan
```
Wiring Tailwind v4 = **manual** (`@tailwindcss/vite` en `.storybook/main.ts` + `tokens.css` en `preview.ts`);
los aliases que la fuente asume del consumidor (`@/components/ui`, `@/lib`, `@/hooks`) se mapean contra el
árbol fuente. VRT = test-runner Playwright (`postVisit`), **no** Chromatic. Gate CI:
`.github/workflows/design-system-storybook.yml` (build + coverage + licencias). Excluidos del catálogo los
componentes **app-coupled** (`ThemeToggle`, `TurnstileWidget`, `ToastContainer` — necesitan un `@/context/*`
que no vive en la fuente); la cobertura de esta tanda es **muestra** (4 marketing + 6 primitivos).

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
