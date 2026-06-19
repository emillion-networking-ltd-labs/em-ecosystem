# ECO-28 — Satélites F3b: automatización end-to-end (Jira + GitHub + Vercel + Lighthouse remoto)

Strategy: satellites

## Resumen
Fase 3b de la estrategia [`satellites`](../strategy/satellites.md) (APPROVED). Orquesta el patrón **intake→genera→repo→deploy** end-to-end y cierra el **"lanzado" formal** (Lighthouse **remoto** sobre la URL desplegada = S2 PASS, el residual que F2b dejó como local). **Depende de ECO-27** (los satélites deben estar gateados antes de automatizar su creación). Construye sobre F1/F2 sin tocarlos.

## Contexto / base
- F1 (em-ui) + F2 (skill `/satellite`: onboarding→brief, generación→satélite S2-ready local) en main.
- SAT01 vive como **carpeta en el monorepo** (`satellites/sat-cristian-garcia/`), desplegada a Vercel; el runbook (`docs/satellite-deployment-runbook.md`) documenta el "cómo" (Vercel API, Ignored Build Step, dominio).
- ECO-27 (F3a): los satélites quedan auto-gateados en CI.

## Decisiones ABIERTAS — del operador (se exponen, NO se asumen)

### Q1 — Repo model: ¿monorepo-folder o repo propio?
- **Opción A (recomendada): carpeta en el monorepo** `satellites/sat-<x>/` (como SAT01). Coherente con el reuse em-ui (mismo árbol), los gates de ECO-27 (auto-discover `satellites/sat-*`), y el runbook (un proyecto Vercel por carpeta con Ignored Build Step). Deploy Vercel apunta a `rootDirectory`.
- **Opción B: repo propio por satélite en GitHub.** Aísla el ciclo de vida del cliente, pero rompe el reuse intra-repo (em-ui add cruzaría repos), duplica gates y complica el monorepo Vercel. Mayor coste.
→ **Decisión del operador.** (La recomendación es A por consistencia con SAT01/em-ui/gates.)

### Q2 — Jira: ¿proyecto nuevo por satélite o tickets en proyecto existente?
- **Opción A (recomendada): tickets en un proyecto existente** (p.ej. ECO o un `SAT` ya creado) con un epic/etiqueta por satélite. Ligero, sin admin.
- **Opción B: proyecto Jira nuevo por satélite.** Aísla el board del cliente, pero **crear proyecto es admin/pesado** y outward-facing.
→ **Decisión del operador.**

### Q3 — Vercel: mecanismo + secrets
- Deploy vía **Vercel API/CLI** (el runbook ya documenta el flujo: crear proyecto, `rootDirectory`, Node version, Ignored Build Step `git diff HEAD^ HEAD --quiet ./`, gotcha del primer deploy).
- **Secrets necesarios:** `VERCEL_TOKEN`, `VERCEL_TEAM_ID`, (GitHub App de Vercel instalada). Dónde viven (GitHub Actions secrets / entorno local del operador) → **decisión del operador**.

### Q4 — Frontera AUTO vs HUMANO (propuesta firme)
Las acciones **outward-facing/irreversibles** (crear repo, crear proyecto Jira, deploy a Vercel, comprar/wire dominio) **NO se ejecutan a ciegas**. **Propuesta (al menos inicialmente):** el skill **PREPARA** — genera configs, scripts idempotentes con `--dry-run` por defecto, y un **checklist** de provisión — y el **HUMANO dispara/confirma** la acción real (`--apply` explícito o ejecución manual del paso). Auditable y reversible-por-revisión.

## Scope (sujeto a las decisiones Q1–Q4)
- Orquestación: del `brief`+satélite generado (F2) → tickets Jira de creación + (carpeta o repo) + deploy Vercel + Lighthouse remoto.
- Scripts idempotentes **dry-run-first**; checklist de provisión; lectura de secrets desde el entorno/Actions (no hardcode).
- **Lighthouse remoto** sobre la URL desplegada con los umbrales S2 (Perf≥90/SEO≥95/BP≥95/A11y≥90) = "lanzado".
- NO toca F1/F2; NO ejecuta acciones externas sin `--apply`/confirmación humana.

## Acceptance Criteria
1. **Pipeline preparatorio** que, dado un satélite generado (F2), produce: configs Vercel + script de deploy + tickets Jira de creación (en el modelo Q1/Q2 aprobado) — en **dry-run por defecto** (no ejecuta nada externo sin `--apply`).
2. **Frontera auto/humano:** ninguna acción outward-facing ocurre sin confirmación humana explícita; verificable (dry-run no crea repos/deploys/proyectos).
3. **Deploy + Lighthouse remoto:** tras la provisión (disparada por el humano), Lighthouse **remoto** sobre la URL valida los umbrales S2 = "lanzado" (o reporta gap; no falsea).
4. **Secrets:** se leen del entorno/Actions; cero credenciales en el repo (Gitleaks verde).
5. **Construye sobre F1/F2/ECO-27 sin tocarlos.**
6. **Gates verdes:** `gates` (incl. `check_strategy_link` `Strategy: satellites`, `check_ticket_link` ECO-28), Security Pipeline / Security Gate.

## Out of scope
- Cerrar los huecos de CI (ECO-27, dependencia).
- Cambios en F1/F2.
- Ejecutar provisión real en este ticket sin la frontera humana (Q4).

## Alignment
Implementa la mitad **automatización** de la Fase 3 del norte (`strategy/satellites.md` §Recommendation punto 3 "automatización end-to-end" + Fasificación F3) y cierra el residual de F2b (Lighthouse remoto = "lanzado"). Respeta la frontera auto/humano para acciones irreversibles. Decisiones Q1–Q4 + frontera en [ADR-009](../adr/009-satellite-automation-governance.md).
</content>
