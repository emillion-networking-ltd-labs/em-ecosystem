# ECO-28 — Satélites F3b: automatización end-to-end (Jira + GitHub + Vercel + Lighthouse remoto)

Strategy: satellites

## Resumen
Fase 3b de la estrategia [`satellites`](../strategy/satellites.md) (APPROVED). Orquesta el patrón **intake→genera→repo→deploy** end-to-end y cierra el **"lanzado" formal** (Lighthouse **remoto** sobre la URL desplegada = S2 PASS, el residual que F2b dejó como local). **Depende de ECO-27** (los satélites deben estar gateados antes de automatizar su creación). Construye sobre F1/F2 sin tocarlos.

## Contexto / base
- F1 (em-ui) + F2 (skill `/satellite`: onboarding→brief, generación→satélite S2-ready local) en main.
- SAT01 vive como **carpeta en el monorepo** (`satellites/sat-cristian-garcia/`), desplegada a Vercel; el runbook (`docs/satellite-deployment-runbook.md`) documenta el "cómo" (Vercel API, Ignored Build Step, dominio).
- ECO-27 (F3a): los satélites quedan auto-gateados en CI.

## Decisiones (resueltas por el operador en el gate, 2026-06-19 — ver [ADR-009](../adr/009-satellite-automation-governance.md))

### Q1 — Repo model: **carpeta en el monorepo** `satellites/sat-<x>/` (como SAT01)
Coherente con el reuse em-ui (mismo árbol), los gates de ECO-27 (auto-discover `satellites/sat-*`), y el runbook (un proyecto Vercel por carpeta con `rootDirectory` + Ignored Build Step). **No** repo propio por satélite.

### Q2 — Jira: **PROYECTO NUEVO E INDEPENDIENTE por satélite**
Cada satélite tiene **su propio proyecto Jira** (NO tickets en un proyecto existente). Crear el proyecto es **acción outward-facing** → bajo `--apply` (Q4), con permisos/plantilla. Lo gestiona este ticket (F3b).

### Q3 — Vercel: **nuestro Vercel empresarial por defecto + PLUGGABLE cuenta-cliente**
Deploy vía **Vercel API/CLI** (el runbook documenta el flujo). Por defecto, **nuestro team empresarial**; como handoff, **pluggable** a la cuenta del cliente con su **token en runtime, NUNCA almacenado**. Secrets (`VERCEL_TOKEN`, `VERCEL_TEAM_ID`) en el **entorno local del operador** ahora (patrón `integrations/vercel-api/.env`, team-scoped, **rotación 90d**) → GitHub Actions si se automatiza en CI. SAT01 = patrón de referencia (no se modifica).

### Q4 — Frontera AUTO vs HUMANO: **confirmación humana (`--dry-run` + `--apply`) para TODA acción outward-facing**
Crear proyecto Jira, repo/carpeta, deploy Vercel, dominio: el skill **PREPARA** (configs, scripts idempotentes con `--dry-run` por defecto, checklist); el **HUMANO dispara/confirma** con `--apply` explícito. Auditable y revisable. Nada se ejecuta a ciegas.

## Scope (Q1–Q4 fijadas)
- Orquestación: del `brief`+satélite generado (F2) → **proyecto Jira nuevo** + tickets de creación + **carpeta** `satellites/sat-<x>/` + deploy Vercel + Lighthouse remoto.
- Scripts idempotentes **dry-run-first**; checklist de provisión; lectura de secrets desde el entorno/Actions (no hardcode).
- **Lighthouse remoto** sobre la URL desplegada con los umbrales S2 (Perf≥90/SEO≥95/BP≥95/A11y≥90) = "lanzado".
- NO toca F1/F2; NO ejecuta acciones externas sin `--apply`/confirmación humana.

## Acceptance Criteria
1. **Pipeline preparatorio** que, dado un satélite generado (F2), produce: configs Vercel + script de deploy + el **proyecto Jira nuevo** (Q2) + sus tickets de creación + la **carpeta** `satellites/sat-<x>/` (Q1) — en **dry-run por defecto** (no ejecuta nada externo sin `--apply`).
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
