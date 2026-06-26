# ADR-009 — Satélites F3: auto-discovery en CI, repo-model monorepo, y frontera auto/humano

- Status: superseded
- Superseded-by: ADR-016
- Date: 2026-06-19
- Ticket: [ECO-27](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-27) (F3a gobernanza), [ECO-28](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-28) (F3b automatización)
- Strategy: satellites
- Deciders: Operador (human gate, 2026-06-19)
- Contexto de gobierno: repo gobernado por Emkeel (ver `AGENTS.md`). Materializa la Fase 3 del norte (`strategy/satellites.md` Fasificación F3) sobre F1 (em-ui) + F2 (skill `/launch-satellite`), sin tocarlos.

## Contexto
F3 automatiza "intake→genera→repo→deploy" y cierra el "lanzado" formal (Lighthouse remoto). Dos riesgos a gobernar: (1) que satélites nuevos **escapen a los gates** (huecos de CI actuales); (2) que la automatización ejecute **acciones outward-facing/irreversibles** (crear repos, deploys, proyectos Jira) a ciegas.

## Decisión

1. **Gobernanza primero (F3a antes que F3b).** Cerrar los 2 huecos de CI vía **auto-discovery** (`satellites/sat-*` → matrix dinámica) es prerequisito: la red de gates debe existir antes de que la automatización cree satélites. Sin esto, automatizar **escala drift**.

2. **Auto-discovery por glob, no hardcode.** Un job `discover` deriva la lista de satélites de `satellites/sat-*/package.json` y la emite como matrix (`fromJSON`) a los jobs por-satélite (audit, SAST, VRT/a11y). Un satélite nuevo entra a los gates sin editar workflows; sin satélites, skip limpio.

3. **Repo model = carpeta en el monorepo** (`satellites/sat-<x>/`, como SAT01). Coherente con el reuse em-ui (mismo árbol), el auto-discovery de gates (glob `satellites/sat-*`) y el deploy Vercel por `rootDirectory` + Ignored Build Step que el runbook ya documenta. *(Repo propio por satélite rompería el reuse intra-repo y duplicaría gates — descartado salvo decisión explícita del operador.)*

4. **Frontera AUTO/HUMANO para lo irreversible.** El skill **PREPARA** (configs, scripts idempotentes **`--dry-run` por defecto**, checklist de provisión); el **HUMANO dispara/confirma** la acción real (crear repo/carpeta, deploy Vercel, tickets/proyecto Jira, dominio) vía `--apply` explícito. Ninguna acción outward-facing ocurre a ciegas. Auditable y revisable.

5. **"Lanzado" = Lighthouse remoto** sobre la URL desplegada cumpliendo los umbrales S2 (cierra el residual que F2b dejó como validación local).

## Alternativas descartadas
- **Hardcodear cada satélite en los workflows.** Es el estado actual (hueco 2); no escala y reintroduce drift. Descartado a favor del glob/auto-discovery.
- **Repo propio por satélite.** Aísla pero rompe reuse em-ui intra-repo y complica monorepo Vercel + gates. Descartado salvo decisión del operador (Q1).
- **Automatización full-auto (sin frontera humana).** Ejecutaría repos/deploys/proyectos a ciegas — inaceptable para acciones irreversibles. Descartado: dry-run-first + confirmación humana.

## Consecuencias
- **F3a (ECO-27):** `security.yml` + `visual-regression.yml` auto-discover `satellites/sat-*`. **Aviso:** meter SAT01 en la matrix de seguridad puede aflorar advisories pre-existentes (form-data/js-yaml) → remediación en ticket de deps aparte (patrón ECO-21/22).
- **F3b (ECO-28):** orquestación dry-run-first + checklist; secrets (`VERCEL_TOKEN`, `VERCEL_TEAM_ID`) desde entorno/Actions, nunca en el repo; Lighthouse remoto = "lanzado".
- **Resueltas por el operador en el gate (2026-06-19):**
  - **Q1 — Repo model: carpeta en el monorepo** `satellites/sat-<x>/` (como SAT01). Confirmado.
  - **Q2 — Jira: PROYECTO NUEVO E INDEPENDIENTE por satélite** (cada satélite tiene su propio proyecto; NO tickets en un proyecto existente — *corrige la recomendación previa*). Crear el proyecto es **acción outward-facing** → bajo `--apply` (Q4), con permisos/plantilla; lo gestiona **F3b/ECO-28**.
  - **Q3 — Vercel: nuestro Vercel empresarial por defecto + PLUGGABLE cuenta-cliente** (token del cliente en **runtime, nunca almacenado**) como handoff. Secrets en el **entorno local del operador** ahora (patrón `integrations/vercel-api/.env`, team-scoped, rotación 90d) → GitHub Actions si se automatiza en CI. SAT01 = patrón de referencia (no se modifica).
  - **Q4 — Frontera auto/humano: confirmación humana (`--dry-run` + `--apply`) para TODA acción outward-facing** (crear proyecto Jira, repo/carpeta, deploy Vercel, dominio).

## Notas
- Decisión aprobada por el operador en el human gate de la planificación de F3 (2026-06-19), con Q1–Q4 resueltas (ver Consecuencias). El "cómo" detallado vive en `specs/ECO-27.md` y `specs/ECO-28.md`. El procedimiento de provisión se apoya en el runbook (`docs/satellite-deployment-runbook.md`).
</content>
