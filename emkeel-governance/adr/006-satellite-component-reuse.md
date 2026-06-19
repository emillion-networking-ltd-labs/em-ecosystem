# ADR-006 — Reuse de componentes en satélites: registry + CLI interno (estilo shadcn), copia gobernada con reconciliación

- **Estado:** Aceptada
- **Fecha:** 2026-06-18
- **Ticket:** [ECO-20](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-20)
- **Strategy:** satellites
- **Decisor:** Operador (human gate)
- **Contexto de gobierno:** repo gobernado por Emkeel (ver `AGENTS.md`). Materializa la decisión D1 de la estrategia [`satellites`](../strategy/satellites.md) sobre cómo los satélites reutilizan el UI Core de NexaCore.

## Contexto

Los satélites (sitios de cliente bajo `satellites/`) reutilizan el sistema de componentes de NexaCore. Hoy ese reuse es por **copia manual** — *"Copy UI Core components from `nexacore-dashboard/src/components/ui/` to the new satellite's `src/components/ui/`"* (`docs/satellite-deployment-runbook.md:140-142`) — y tiene tres problemas medidos, no asumidos:

- **No existe mecanismo de distribución.** El `em-ui` CLI previsto (SCRUM-331) **nunca se implementó** (solo referenciado en `docs/satellite-deployment-runbook.md:140-142,27,444`). No hay monorepo workspace ni paquete compartido: el `package.json` raíz no declara `workspaces`.
- **La copia manual deriva.** El UI Core del dashboard tiene **48 componentes** (`nexacore-dashboard/src/components/ui/`); SAT01 copió **17** (`satellites/sat-cristian-garcia/src/components/ui/`) y al menos `Button` **divergió**: la copia del satélite **perdió** los atributos de accesibilidad `role="status"` / `aria-label="Loading"` presentes en el original (`nexacore-dashboard/src/components/ui/Button.tsx:87`). Sin single-source, los componentes copiados divergen y arrastran regresiones silenciosas.
- **`/admin/design-system` es la fuente de verdad declarada** del UI Core (`CONTRIBUTING.md:73-75`), pero nada conecta esa fuente con las copias de los satélites.

A la vez, un satélite **necesita divergir per-cliente** (colores/marca, ocasionalmente un componente), así que un modelo de "cero copia" (paquete inmutable importado) chocaría con ese requisito.

## Decisión

El mecanismo de reuse de los satélites es un **registry + CLI interno estilo shadcn/ui** (`em-ui`), con estas propiedades:

1. **Single-source = el UI Core** (origen: `nexacore-dashboard/src/components/ui/`), consistente con `/admin/design-system` como fuente de verdad (`CONTRIBUTING.md:73-75`). *(Refinado por [ADR-007](007-design-system-source-location.md): la fuente canónica se extrae a `design-system/` dedicado; em-ui lee de ahí, no del dashboard, que pasa a consumidor legacy.)*
2. **Copia GOBERNADA con reconciliación, NO "cero copia".** El satélite *pull-ea* componentes + tokens del registry y los **posee** (puede personalizarlos per-cliente). El modelo shadcn lo soporta: copia el código fuente al proyecto consumidor vía un `registry.json` servido por HTTP e instalado por CLI, y `registry:base` distribuye el design system entero (componentes + tokens + config) en un solo install (https://ui.shadcn.com/docs/registry/getting-started, https://ui.shadcn.com/docs/cli).
3. **El drift se vuelve detectable y reconciliable**, no invisible: el re-pull gobernado + el gate de a11y/visual cazan divergencias como la del `Button`.

Esto es el **scope real de SCRUM-331**, ahora validado como el candidato correcto (no como respuesta dada).

## Alternativas descartadas

- **Paquete compartido en monorepo (pnpm/Turborepo workspaces).** Single-source más fuerte (import, cero copia — https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository), pero **exige convertir el repo a workspaces** (hoy inexistentes; `nexacore-dashboard/package.json` no es miembro de workspace) y un paquete inmutable **pelea con la divergencia per-cliente** que un satélite necesita.
- **Paquete npm publicado.** Versionado estándar, pero hereda la **misma rigidez** per-cliente y añade overhead de release; el satélite suma otra dependencia externa.
- **Status quo (copia manual).** Es el estado que ya falló (drift del `Button`); no es norte.

## Consecuencias

- Se construye `em-ui` (registry + CLI) con single-source en el dashboard; se hace **backfill** de los 48 componentes y se **reconcilia el drift de SAT01** (empezando por el `Button`). *(ECO de seguimiento, Fase 1 de la estrategia.)*
- Los satélites dejan de copiar a mano: *pull-ean* del registry, conservan ownership para personalizar, y el drift queda bajo gate.
- **Dependencia de fase:** el resto del sistema de facilitación `/satellite` (onboarding + generación, y luego automatización Jira+GitHub+Vercel + cierre de los 2 huecos de CI — `.github/workflows/security.yml:64-65`, `.github/workflows/visual-regression.yml:31-35`) se construye **encima** de este mecanismo; sin la pieza base, la generación propagaría drift.
- No se convierte el repo a monorepo-workspaces (la decisión lo evita por diseño).

## Notas

- Decisión tomada por el operador en el human gate de la ceremonia `/strategy` (ECO-20) y trazada en la estrategia [`satellites`](../strategy/satellites.md). El "cómo" procedimental sigue en el runbook (`docs/satellite-deployment-runbook.md`), que se mantiene como referencia (no se promueve a `emkeel-governance/`, consistente con ADR-005).
