# ECO-27 — Satélites F3a: gobernanza (auto-discover satélites en CI)

Strategy: satellites

## Resumen
Fase 3a de la estrategia [`satellites`](../strategy/satellites.md) (APPROVED). Cierra los **2 huecos de CI** para que los satélites queden **gateados automáticamente** — la red de seguridad que debe existir **antes** de que la automatización (F3b/ECO-28) cree satélites, "para que la automatización no escale drift" (norte, Fasificación F3). NO automatiza nada externo (eso es F3b). NO toca F1/F2.

## Contexto / huecos (medidos, en main)
- **Hueco 1 — Security Pipeline no audita satélites:** matrix fija a `[nexacore-api, nexacore-dashboard]` (`.github/workflows/security.yml:64-65`) ⇒ un satélite no recibe dependency-audit ni SAST propios.
- **Hueco 2 — VRT/a11y hardcoded a SAT01:** `visual-regression.yml` dispara solo por paths `satellites/sat-cristian-garcia/**` (`.github/workflows/visual-regression.yml:31-35`) y el job opera sobre esa carpeta fija (`:203`) ⇒ un satélite nuevo NO queda gateado hasta editar el workflow.

## Decisión de mecanismo (auto-discovery)
Un **job `discover`** glob-ea `satellites/sat-*/package.json` y emite la lista como **matrix dinámica** (`fromJSON`) que alimenta los jobs por-satélite (audit, SAST, VRT/a11y). Así un satélite nuevo entra a los gates **sin editar workflows**. Debe degradar limpio si no hay satélites (matrix vacía → job skip, no fallo).

## Scope
- **(a) Security Pipeline auto-discover:** añadir a `.github/workflows/security.yml` un `discover-satellites` job + hacer **dinámica la matrix de `dependency-audit`** (el Hueco 1, `security.yml:64-65`) para incluir los satélites descubiertos (sin quitar api/dashboard). *(El secret-scan ya cubre todo el checkout. SAST por-satélite —eslint— queda como follow-up: no es el hueco citado y arriesga aflorar deuda de lint ajena a este ticket.)*
- **(b) VRT/a11y auto-discover:** en `.github/workflows/visual-regression.yml`, sustituir los paths/job hardcoded a `sat-cristian-garcia` por descubrimiento dinámico (paths `satellites/sat-*/**` + matrix por satélite). SAT01 sigue cubierto, ahora por la vía genérica.
- **(c)** No tocar F1 (`design-system/`, `em-ui/`) ni F2 (`.claude/skills/launch-satellite/`); no automatización externa.

## Acceptance Criteria
1. **Un satélite NUEVO queda auditado** por el Security Pipeline (`dependency-audit`) **sin** editar el workflow (verificable: la matrix se deriva de `satellites/sat-*`).
2. **Un satélite NUEVO queda gateado** por VRT/a11y sin editar el workflow; **SAT01 sigue cubierto** por la vía genérica.
3. **Sin satélites, el CI no rompe** (matrix vacía → skip limpio); api/dashboard siguen auditados igual que hoy.
4. **No se tocó F1/F2** ni se ejecutó ninguna acción externa.
5. **Gates verdes:** `gates` (incl. `check_strategy_link` con `Strategy: satellites`, `check_ticket_link` ECO-27), Security Pipeline / Security Gate.

## Aviso (deuda que puede aflorar)
Al **meter SAT01 en la matrix de seguridad**, pueden **aflorar advisories pre-existentes** de sus deps (p.ej. los dependabot de `form-data`/`js-yaml` que hoy no se auditan). **Se remedian en un ticket aparte** (mismo patrón ECO-21/ECO-22), no en ECO-27 — para no mezclar el cableado del gate con la remediación de deps. Si afloran y bloquean, se reporta y se abre el fix.

## Out of scope
- Automatización Jira/GitHub/Vercel + Lighthouse remoto (ECO-28, F3b).
- Remediar advisories de satélites que afloren (ticket de deps aparte).
- Cambios en F1/F2.

## Alignment
Implementa la mitad **gobernanza** de la Fase 3 del norte (`strategy/satellites.md` Fasificación F3: "cerrar los 2 huecos de CI… para que la automatización no escale drift"). Es prerequisito de F3b. Decisión de mecanismo (auto-discovery) y frontera registradas en [ADR-009](../adr/009-satellite-automation-governance.md).
</content>
