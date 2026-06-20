# Strategy: satellites

Status: APPROVED   <!-- operador, human gate, 2026-06-18 -->
Strategy: satellites   <!-- feature specs reference this with a `Strategy: satellites` line -->

## Goal
Decidir el NORTE de un **sistema de facilitación gobernado** (tipo Lovable, pero con nuestro sistema de componentes y nuestros gates) para lanzar satélites (sitios de cliente) de forma **recurrente, rápida y automatizada**: el **mecanismo de reuse** de nuestro UI Core (pieza base hoy inexistente), el **onboarding** multi-modo, la **generación** que reutiliza componentes (no greenfield), la **automatización** end-to-end (Jira + GitHub + Vercel), la **gobernanza** (gates) y la **fasificación**. NO el cómo-paso-a-paso (eso es el runbook).

## Context
<!-- grounded facts ONLY — cite file:line (repo) o URL (mercado) for every claim -->

**Qué es HOY un satélite (A1 — SAT01, nuestro primer satélite ya creado):**
- `satellites/sat-cristian-garcia/` es una **app Next.js 16 + TypeScript + Tailwind + App Router** (`satellites/sat-cristian-garcia/package.json`), multi-ruta (7 rutas: `satellites/sat-cristian-garcia/src/app/page.tsx` + `sobre-mi/`, `servicios/`, `portfolio/`, `testimonios/`, `precios/`, `contacto/`), con hardening S2 (6 cabeceras `satellites/sat-cristian-garcia/next.config.mjs:15-26`, observabilidad `satellites/sat-cristian-garcia/src/app/layout.tsx:68-69`).
- Es un **EJEMPLO ya creado, no una herramienta**: nació reutilizando por **COPIA MANUAL** el UI Core del dashboard — *"Copy UI Core components from `nexacore-dashboard/src/components/ui/` to the new satellite's `src/components/ui/`"* (`docs/satellite-deployment-runbook.md:140-142`).

**El acelerador real es NUESTRO sistema de componentes (A2):**
- El **UI Core vive en el dashboard** y `/admin/design-system` es la **fuente de verdad** — *"Usar componentes `ui/` y tokens semánticos … `/admin/design-system` es la fuente de verdad"* (`CONTRIBUTING.md:73-75`).
- Catálogo real: **48 componentes** en `nexacore-dashboard/src/components/ui/` (p.ej. `Button.tsx`, `Input.tsx`, `Select.tsx`, `Tabs.tsx`, `FormField.tsx`…).

**El problema base a resolver: NO existe mecanismo de reuse, y la copia manual DERIVA (A3 — medido, no asumido):**
- **No hay `em-ui` CLI:** SCRUM-331 (el CLI de distribución de UI Core a satélites) está solo *referenciado* en el runbook como futuro — *"Once SCRUM-331's `em-ui` CLI ships, replace manual copy"* (`docs/satellite-deployment-runbook.md:140-142`; ver también `:27` y `:444`) — **nunca se implementó**.
- **No hay monorepo workspace / paquete compartido:** el `package.json` raíz no declara `workspaces` (`package.json:1`) y no existe `packages/`.
- **La copia manual ya divergió:** SAT01 copió **17 de los 48** componentes (`satellites/sat-cristian-garcia/src/components/ui/`), y al menos `Button` **derivó** del original: el SAT01 reescribió la resolución de `as`/`href` y **perdió los atributos de accesibilidad** `role="status"` / `aria-label="Loading"` que sí tiene el dashboard (`nexacore-dashboard/src/components/ui/Button.tsx:87`). ⇒ La copia manual es un generador de drift: sin single-source, los 17 divergen y arrastran regresiones (a11y) que los gates del satélite deberían cazar.

**"Lanzado" significa S2 PASS (A4 — definido por el runbook):** S1 deja el sitio *"technically deployed"*; el umbral es **S2** — *"production-grade … MANDATORY before inviting real users"* (`docs/satellite-deployment-runbook.md:262-268`), Lighthouse Perf≥90/SEO≥95/BP≥95/A11y≥90 (`docs/satellite-deployment-runbook.md:337`). El objetivo del operador: un satélite nuevo **~90% alineado** al cliente y a nuestra estandarización al lanzar, como SAT01.

**Gobernanza — y sus 2 HUECOS reales (A5):**
- Required checks de `main`: `gates` y `Security Gate (All Checks)` (branch protection, GitHub API).
- **HUECO 1:** el Security Pipeline NO audita satélites — matrix fijada a `[nexacore-api, nexacore-dashboard]` (`.github/workflows/security.yml:64-65`).
- **HUECO 2:** el gate visual/a11y está hardcoded a SAT01 — paths `satellites/sat-cristian-garcia/**` (`.github/workflows/visual-regression.yml:31-35`) y job sobre esa carpeta fija (`.github/workflows/visual-regression.yml:203`) ⇒ un satélite nuevo NO queda gateado hasta editar el workflow.

**Cómo lo resuelve el mercado (A6 — research, ver §Sources):**
- **Distribución de design system — modelo registry + CLI (shadcn/ui):** copia el código fuente al proyecto consumidor (ownership), con un `registry.json` servido por HTTP e instalación vía CLI (`shadcn add @acme/button`); y en 2026 un `registry:base` distribuye **el design system entero (componentes + tokens + config) en un solo install**. *(ui.shadcn.com/docs/registry/getting-started, /docs/cli)*
- **Paquete compartido en monorepo (Turborepo/pnpm workspaces):** `packages/` para librerías + `apps/` para apps; el satélite **importa** `@em/ui` (cero copia, single-source fuerte) con caché de build. *(turborepo.dev/docs)*
- **Prompt-to-deployed (Lovable/v0/bolt):** Lovable hace *two-way GitHub sync* y auto-deploy (Netlify); v0 *one-click deploy* a Vercel; bolt export a GitHub. Confirma que el patrón "intake → genera → repo → deploy" es estándar. *(emergent.sh/learn/v0-vs-lovable-vs-bolt)*

## Options
<!-- ≥2 real options; cada celda Source = un único file:line COMMITEADO o URL bien formada. `emkeel strategy check` lo exige. -->
> El eje de decisión es el **mecanismo de reuse** (pieza base). Cada celda Source es un único `file:line` commiteado o URL; las citas de apoyo van en Pros/Cons y §Sources.

| # | Option (mecanismo de reuse) | Source | Pros | Cons | Risk |
|---|--------|--------|------|------|------|
| 1 | **Status quo — copia manual** del UI Core a cada satélite | docs/satellite-deployment-runbook.md:140 | Cero infra; arranque inmediato; cada satélite es dueño de su copia | **Genera drift** (Button ya perdió a11y, `Button.tsx:87`); 17/48 copiados; sin single-source; irreproducible | **Alto**: divergencia y regresiones silenciosas; incumple "recurrente gobernado" |
| 2 | **Registry + CLI interno (estilo shadcn)** — `em-ui` sobre el UI Core del dashboard como única fuente; el satélite *pull-ea* componentes+tokens (ownership) vía CLI; **es SCRUM-331 bien hecho** | nexacore-dashboard/src/components/ui/Button.tsx:1 | Single-source = dashboard; ownership por satélite (permite tweaks per-cliente) **sin** refactor a monorepo; `registry:base` instala design system entero; re-pull gobernado **resuelve el drift** (https://ui.shadcn.com/docs/registry/getting-started) | Hay que **construir** el registry+CLI (es el scope real de SCRUM-331); el re-pull no es automático (disciplina + gate) | Medio: coste de construir la pieza base, acotado y reutilizable |
| 3 | **Paquete compartido en monorepo (pnpm/Turborepo)** — `@em/ui` importado por dashboard y satélites | nexacore-dashboard/package.json:1 | Single-source más fuerte (import, **cero copia**, sin drift posible); caché de build (https://turborepo.dev/docs) | Exige **convertir el repo a workspaces** (hoy el `package.json` raíz no declara `workspaces`); un paquete inmutable **pelea con la divergencia per-cliente** que un satélite necesita | Medio-alto: refactor grande del repo + rigidez para personalizar por cliente |
| 4 | **Paquete npm publicado** — `@em/ui` versionado y publicado, consumido como dep | satellites/sat-cristian-garcia/package.json:1 | Versionado estándar (semver); desacopla del repo | Overhead de publish/release; **misma rigidez** que (3) frente a tweaks per-cliente; el satélite añade otra dep externa | Medio: fricción operativa sin resolver la personalización |

## Recommendation
<!-- which option + why — this is judgment; the human approves it at the gate -->
**APROBADA por el operador (human gate, 2026-06-18): Opción 2 (Registry + CLI interno estilo shadcn, `em-ui`) como mecanismo de reuse**, sobre el que se construye el sistema de facilitación `/launch-satellite`.

> **Matiz clave de la 2 (decidido a propósito): es COPIA GOBERNADA con reconciliación, NO "cero copia".** Se elige precisamente porque los satélites **necesitan divergir per-cliente** (colores/marca, a veces un componente) y un paquete inmutable (workspace/npm) lo impediría. Single-source = dashboard UI Core; *ownership* por satélite; el **re-pull gobernado + el gate de a11y** hacen el drift **detectable y reconciliable** (la regresión real del `Button` — `nexacore-dashboard/src/components/ui/Button.tsx:87` — es la prueba de por qué hace falta).

**Por qué la 2 y no las demás:**
- La **1 (copia manual)** es el estado actual y ya falló: `Button` perdió a11y (`nexacore-dashboard/src/components/ui/Button.tsx:87` vs la copia del satélite). No es norte, es la deuda a cerrar.
- La **3 (workspace)** da el single-source más fuerte pero exige convertir el repo a workspaces (hoy inexistentes, `package.json:1`) y un paquete importado **resiste la divergencia per-cliente** que un satélite necesita (cada cliente cambia colores/marca, a veces un componente). La **4 (npm)** hereda esa rigidez y añade release overhead.
- La **2** es el punto óptimo para nuestro caso: **single-source = dashboard UI Core** (lo que `CONTRIBUTING.md:73-75` ya declara fuente de verdad), pero **copiando con ownership** (el satélite puede personalizar) y con un **re-pull gobernado** que hace el drift *detectable y reconciliable* en vez de invisible — justo lo que el modelo shadcn resuelve (https://ui.shadcn.com/docs/registry/getting-started), y **sin** refactor a monorepo. Es **SCRUM-331 ejecutado de verdad**, validado aquí como el candidato correcto (no como respuesta dada).

**El sistema de facilitación `/launch-satellite` (norte, apoyado en la Opción 2):**
1. **Onboarding guiado** — antes de generar, elegir modo de entrada (la IA NUNCA fabrica diseño desde cero; parte del UI Core + estructura SAT01):
   - **(a) Cliente SIN diseño/marca** → UI Core + estructura de SAT01 como referencia; pregunta datos reales (negocio, servicios/precios, contacto) y propone paletas/tipografías.
   - **(b) Cliente CON diseño/marca** → introducir/aplicar sus tokens (colores, tipografía, logo) sobre el UI Core.
   - **(c) Mejorar un sitio existente** → tomar sus **hechos** (contenido, estructura, marca) y **remodelar con valor** usando nuestros componentes (UI Core, `nexacore-dashboard/src/components/ui/`), **no fotocopiarlo**. El **default es remodel moderno con valor añadido**; el cliente elige la fidelidad (ver §«Modo (c) — remodelar con valor» abajo). Los **hechos** son `extracted`/`provided`; el diseño/redacción **nuevos** son `proposed` (a confirmar).
   - **(d) Perfil de Instagram** → extraer fotos/bio/datos como contenido real.
   - **(e) Páginas de inspiración** → referencia de diseño.
   Colores del cliente/marca/IG **solo si se piden o se extraen** (regla: no inventar datos).
2. **Generación que reutiliza componentes** (vía el registry, no greenfield) y **adapta a la forma satélite** (Next.js multi-ruta en monorepo, como SAT01) hasta **S2 PASS** (`docs/satellite-deployment-runbook.md:262-268`).
3. **Automatización end-to-end** — el skill crea **proyecto Jira + sprint inicial + sus tickets** de creación, **repo/carpeta en GitHub**, y **deploy en Vercel** (nuestro target en monorepo, no Netlify) — el patrón "intake→genera→repo→deploy" que Lovable/v0 ya prueban (emergent.sh/learn/v0-vs-lovable-vs-bolt), pegado a nuestro flujo (Jira ECO/SAT, GitHub, Vercel).
4. **Gobernanza** — la salida pasa los gates; se cierran los 2 huecos: satélites en la matrix de `.github/workflows/security.yml:64-65` y VRT/a11y **auto-discovered** en vez de hardcoded a `sat-cristian-garcia` (`.github/workflows/visual-regression.yml:31-35`). El gate de a11y habría cazado la regresión del `Button`.

**Modo (c) — remodelar con valor (no fotocopiar): gate de fidelidad, split verdad/diseño, loop**

El satélite es una **herramienta de facilitación** (tipo Lovable — `emkeel-governance/strategy/satellites.md:7`), **no una fotocopia**: debe **aportar valor** — diseño, frescura, tecnología moderna y **nuestros componentes** (UI Core, `nexacore-dashboard/src/components/ui/`, fuente única en `design-system/components/` vía em-ui). Por eso el modo (c) **ya no se limita a "cambiar solo colores"**.

- **Gate de fidelidad — lo elige el cliente; default = aportar valor:**
  - **(A) Réplica fiel** → el mismo sitio llevado a la tecnología satélite (Next.js + hardening S2), sin rediseño.
  - **(B) Remodel moderno con nuestros componentes — *DEFAULT*** → conserva los **hechos** del cliente y los presenta con un diseño fresco sobre el UI Core. Premisa del operador: *"aporta valor… salvo que el cliente tenga otra idea."*
  - **(C) Reimaginación libre** → propuesta de diseño/estructura nueva a partir de los hechos.

- **Split verdad/diseño — qué significa "no inventar":** "no inventar" = **no mentir sobre los HECHOS**; nunca significó "no crear".
  - **HECHOS del cliente** (nombre, servicios, contacto, copy real, assets de marca) → `extracted`/`provided`, **jamás fabricados** (`.claude/skills/launch-satellite/schema/brief.schema.json:49`; el contrato declara que `missing`/`proposed` se rinden como pendientes, **"nunca como datos fabricados"** y *'invented' no existe* — `.claude/skills/launch-satellite/schema/brief.schema.json:5`).
  - **CREATIVIDAD** (diseño, frescura, redacción nueva, secciones sugeridas) → `proposed`: **bienvenida**, etiquetada y **a confirmar** (`proposed` = *"sugerencia pendiente de confirmar"*, `.claude/skills/launch-satellite/schema/brief.schema.json:49`). Confirmar la vuelve `provided`.

- **Loop iterativo (a lo Lovable):** el agente **propone** → **preview** → el operador/cliente **refina en prosa** → **regenera** → **confirma** (`proposed`→`provided`). La barra técnica de cada iteración la fija **S2 PASS** (`docs/satellite-deployment-runbook.md:262-268`). Nada externo (Vercel/Jira) se ejecuta sin **gate humano** (dry-run-first), consistente con la Fase 3.

**Cómo cubre el CASO DE PRUEBA (validación del norte):**
- *Modo (a), cliente nuevo sin diseño:* onboarding pregunta datos reales (o IG) → `/launch-satellite` *pull-ea* UI Core+tokens del registry y scaffolda la estructura SAT01 → genera `satellites/sat-<x>/` Next.js reusando componentes → crea Jira (proyecto+sprint+tickets) + GitHub + deploy Vercel → S2 + gates → "lanzado" ~90% alineado. ✔ cubierto por reuse(2)+onboarding(1)+generación(2)+automatización(3)+gobernanza(4).
- *Modo (c), cliente CON web:* onboarding toma sus **hechos** → **remodela con valor** (default B; o A/C si el cliente lo pide) con nuestros componentes → adapta a forma satélite hasta S2 + gates, en un **loop iterativo** (propone→preview→refina→confirma). ✔ cubierto; la 2 lo permite porque la copia es personalizable y con *ownership* (la 3/4 lo dificultarían).

## Fasificación
El orden lo fija la dependencia: **no se puede generar reutilizando lo que aún no es reutilizable.**
- **Fase 1 — Mecanismo de reuse (pieza base):** construir el registry + CLI interno (`em-ui`, scope real de SCRUM-331) con **single-source = dashboard UI Core**; backfill de los 48 y **reconciliar el drift de SAT01** (empezando por el `Button`). Sin esto, todo lo demás propaga drift.
- **Fase 2 — Onboarding + generación (`/launch-satellite`):** los 5 modos de intake → brief estructurado → generación que *pull-ea* del registry y adapta a forma satélite hasta S2.
- **Fase 3 — Automatización + gobernanza:** orquestar Jira+GitHub+Vercel end-to-end y **cerrar los 2 huecos de CI** (satélites bajo Security Pipeline + VRT auto-discovered). La gobernanza se cablea aquí para que la automatización no escale drift.

## Non-goals
- NO es el cómo-paso-a-paso (scaffold, curl a Vercel, gotchas): eso es el **runbook** (`docs/satellite-deployment-runbook.md`), que esta estrategia referencia, no reemplaza.
- NO construye el registry/CLI ni el skill `/launch-satellite` aquí: fija el norte; el cómo es el/los ECO de seguimiento por fase.
- NO decide el diseño/branding de un satélite concreto (es per-cliente).
- NO convierte el repo a monorepo-workspaces (la Opción 2 lo evita por diseño).
- NO promete backend/integración con la API NexaCore (un satélite es marketing estático salvo que un ticket lo pida — `docs/satellite-deployment-runbook.md:28`).

## Decisions
<!-- optional: link the chosen decision as an ADR, e.g. emkeel-governance/adr/006-<slug>.md -->
**APROBADA (human gate, 2026-06-18).** Decisión arquitectónica registrada en [`emkeel-governance/adr/006-satellite-component-reuse.md`](../adr/006-satellite-component-reuse.md). Los specs de features de satélite llevarán la línea `Strategy: satellites` (lo exige `check_strategy_link`).

### Decisiones del operador (eran preguntas; resueltas en el gate)
- **D1 — Mecanismo de reuse = Opción 2 (registry + CLI interno estilo shadcn, `em-ui`).** Es **copia GOBERNADA con reconciliación, NO "cero copia"**: single-source = dashboard UI Core; *ownership* por satélite (permite divergencia per-cliente); re-pull gobernado + gate de a11y hacen el drift detectable y reconciliable. **Descartadas** la 3 (workspace: exige refactor del repo + rigidez per-cliente) y la 4 (npm: misma rigidez + release overhead).
- **D2 — Automatización (Jira proyecto+sprint+tickets, GitHub, Vercel) = Fase 3, DENTRO del norte** (no se difiere fuera de alcance). Se construye tras validar reuse (Fase 1) y generación (Fase 2), porque automatizar sobre una base aún no validada escala riesgo.
- **D3 — El runbook es el "cómo" procedimental y vive en `docs/`** (NO en `emkeel-governance/`): se **promovió de `docs/archive/` a `docs/satellite-deployment-runbook.md`** como referencia operativa activa y `docs/archive/` se eliminó — completando lo que ADR-005 ya anticipó. La estrategia sigue siendo el norte; el runbook no es gobernanza.
- **D4 — Ampliación del modo (c) (ECO-44, 2026-06-20):** el satélite **aporta valor**, no fotocopia. Formaliza tres piezas (ver §«Modo (c) — remodelar con valor»): **(i) gate de fidelidad** A réplica / **B remodel moderno [DEFAULT]** / C reimaginación, a elección del cliente; **(ii) split verdad/diseño** — los HECHOS son `extracted`/`provided` y nunca se fabrican, la CREATIVIDAD vive en `proposed` (a confirmar) → "no inventar" = no mentir sobre hechos, no "no crear"; **(iii) loop iterativo** propone→preview→refina→regenera→confirma. No es un norte nuevo (el feel Lovable y el modelo de procedencia ya estaban); afina el modo (c), antes limitado a "solo colores".

### ECOs de seguimiento propuestos (títulos/scope; los números Jira los crea el operador)
1. **ECO-Fase1 — Mecanismo de reuse `em-ui`:** registry + CLI interno con single-source = dashboard UI Core; backfill de los 48 componentes + **reconciliación del drift de SAT01** (empezando por el `Button`). Cierra el scope de **SCRUM-331**. *(pieza base; sin dependencias)*
2. **ECO-Fase2 — Skill `/launch-satellite`:** 5 modos de onboarding + generación que *pull-ea* del registry + adaptación a forma satélite hasta **S2 PASS**. *(depende de Fase 1)*
3. **ECO-Fase3 — Automatización + gobernanza:** orquestación Jira+GitHub+Vercel end-to-end + cierre de los 2 huecos de CI (satélites en la matrix de `.github/workflows/security.yml` + VRT auto-discovered en `.github/workflows/visual-regression.yml`). *(depende de Fase 2)*

## Sources (verificadas con tool — cada una abierta)
- SAT01 (Next.js en monorepo, COMMITEADO): `satellites/sat-cristian-garcia/package.json`; rutas `satellites/sat-cristian-garcia/src/app/page.tsx`; cabeceras `satellites/sat-cristian-garcia/next.config.mjs:15-26`; observabilidad `satellites/sat-cristian-garcia/src/app/layout.tsx:68-69`; 17 componentes copiados en `satellites/sat-cristian-garcia/src/components/ui/`.
- UI Core / fuente de verdad (COMMITEADO): `nexacore-dashboard/src/components/ui/` (48 comp.); `nexacore-dashboard/src/components/ui/Button.tsx:1,87` (a11y `role="status"`/`aria-label="Loading"` perdida en la copia del satélite); `CONTRIBUTING.md:73-75` (`/admin/design-system` fuente de verdad).
- Estado del reuse (COMMITEADO): `package.json:1` (sin `workspaces`); runbook copia manual + em-ui/SCRUM-331 `docs/satellite-deployment-runbook.md:140-142,27,444`; "lanzado"/S2 `:262-268,337`; out-of-scope backend `:28`.
- Gates / huecos (COMMITEADO): `.github/workflows/security.yml:64-65` (matrix api+dashboard); `.github/workflows/visual-regression.yml:31-35` (paths SAT01), `:203` (job satélite). Required checks de `main`: `gates`, `Security Gate (All Checks)`.
- Mercado: shadcn/ui registry+CLI (copy-based, `registry.json` HTTP, `registry:base` = design system en un install) — https://ui.shadcn.com/docs/registry/getting-started y https://ui.shadcn.com/docs/cli ; Turborepo/pnpm workspaces (`packages/`+`apps/`, caché) — https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository ; prompt-to-deployed (Lovable two-way GitHub sync + Netlify; v0 one-click Vercel; bolt export) — https://emergent.sh/learn/v0-vs-lovable-vs-bolt .
