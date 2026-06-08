# ECO-1 — Auditoría de residuos del "otro sistema" (em-development-framework / ai-specs)

- **Ticket:** [ECO-1](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-1) (Task)
- **Rama:** `chore/ECO-1-audit-residuos`
- **Fecha:** 2026-06-08
- **Alcance:** SOLO LECTURA. No se borró ni movió nada. Este informe es la única salida.
- **Objetivo:** identificar archivos/carpetas que pertenezcan al sistema anterior
  (`em-development-framework` / `ai-specs` / governance del framework / symlinks `.claude`),
  y proponer una acción por hallazgo. La limpieza real se hará después, en tickets/PRs
  separados, uno por grupo, con visto bueno humano.

> **Nota de contexto (no es un hallazgo del árbol, pero es relevante):** el proyecto
> Jira `ECO` **no existía**; se creó (clave `ECO`, id `10100`) por instrucción explícita
> y se abrió `ECO-1`. Sin embargo, `emkeel.toml` declara `project_key = "SCRUM"` y todo
> el historial de git usa `SCRUM-…`. Conviene decidir si los tickets de limpieza viven
> en `ECO` o en `SCRUM` antes de proseguir.

---

## Resumen ejecutivo

| Grupo | Qué es | Tracked | Acción propuesta |
|-------|--------|:------:|------------------|
| **A. `.lifecycle/`** | Trail completo del lifecycle del framework ai-specs (903 ficheros) | 903 | **mover / dudoso** — rehome a `emkeel-governance/` o archivar (decisión humana) |
| **B. Refs `ai-specs/` en código** | 25 ficheros del producto con rutas obsoletas en comentarios/docs | 25 | **conservar** ficheros · actualizar texto (ticket aparte) |
| **C. Artefactos locales / output** | `logs/shadow-decisions.jsonl`, `nexacore-api/report/` | 0 (untracked) | **conservar/ignorar** · ajustar `.gitignore` |
| **D. Acoplamientos a vigilar** | Hooks/CI citan `*.mdc` que viven en `.lifecycle/specs/` | — | **conservar** tooling · coordinar rehome de specs |
| **E. Confirmaciones negativas** | Sin symlinks, sin `.claude/`, sin motor del framework | — | nada que limpiar |

La inmensa mayoría del peso (903 ficheros) está en **un solo grupo: `.lifecycle/`**.
Casi todo lo demás son **falsos positivos** (referencias textuales o tooling del producto
que solo *menciona* el framework por nombre).

---

## A. Residuo claro del framework — `.lifecycle/` (DECISIÓN HUMANA)

`.lifecycle/README.md` lo declara textualmente:

> *"NexaCore's lifecycle artifacts … driven by the **em-development-framework** engine.
> The engine lives in a separate repo … `LIFECYCLE_ROOT=… python3 <framework>/forge/tools/state-machine.py`"*

Es el trail de gobierno del sistema anterior, migrado a este repo en Wave 8
(SCRUM-572 / SCRUM-574). El motor que lo conduce **no** está en el repo (ver Grupo E).

| Ruta | Por qué se sospecha | Acción propuesta |
|------|---------------------|------------------|
| `.lifecycle/` (903 ficheros tracked) | Su propio README lo ata al motor `em-development-framework`. Emkeel ahora gobierna; este trail es del sistema que se está retirando. | **dudoso / mover** |
| `.lifecycle/artifacts/{auth,dashboard,common,tenants,users,sat-cristian-garcia}/{audit,plans,records,state}/` | Histórico de ejecución del lifecycle del framework (fases, planes, records, state por dominio). | **mover** → `emkeel-governance/records/` (archivo histórico) **o conservar** como archivo de solo lectura |
| `.lifecycle/specs/` → `api-spec.yml`, `data-model.md`, `product-roadmap.md`, `ui-design-system.md`, `integration-state.md`, `freeze-status.md`, `design-system-viewer.md`, `satellite-deployment-runbook.md`, `backend-standards.mdc`, `frontend-standards.mdc` | Specs/standards activos del producto que el framework dejó aquí. **Siguen referenciados por hooks/CI** (ver Grupo D). | **mover** → `emkeel-governance/specs/` (NO borrar sin rehome) |

**Tensión a resolver (por eso es "dudoso"):** se *adoptó* deliberadamente en `main`
hace poco (commit `bfc3369`, *"adopt .lifecycle/{artifacts,specs}/ trail"*), pero su
README lo ata a un motor externo que Emkeel sustituye. La decisión —archivar tal cual,
rehome bajo `emkeel-governance/`, o borrar el histórico— es del humano. `emkeel.toml`
**no** referencia `.lifecycle/` como raíz de gobierno, así que nada activo se rompe al
moverlo salvo lo descrito en el Grupo D.

---

## B. Referencias textuales obsoletas a `ai-specs/` dentro del PRODUCTO

**No son ficheros residuo.** Son ficheros legítimos del producto (código, migraciones,
specs de test, README) cuyos **comentarios/docstrings** apuntan a rutas `ai-specs/…` de un
árbol que ya no existe en el repo. Ejemplos:

- `nexacore-api/src/auth/auth-intent.service.ts:7` → `See ai-specs/changes/auth/programs/AUTH-v2.md …`
- `nexacore-api/prisma/schema.prisma:326` → `See ai-specs/changes/auth/programs/AUTH-v2.md §2`
- `nexacore-api/src/common/services/online-ml-scorer.service.ts:24` → `Mirror of ai-specs/templates/online-ml-scorer-nestjs.ts`
- `nexacore-dashboard/playwright.config.ts:7` → `ai-specs/changes/auth/plans/Sprint 12/SCRUM-350_frontend.md`
- `README.md:171-173` → *"All development follows the standards defined in the `ai-specs/` framework"*

**Acción propuesta:** **conservar** todos los ficheros; **actualizar el texto** de las
referencias (apuntar a `emkeel-governance/` o `.lifecycle/specs/` según donde quede el
canon) en un ticket de saneamiento documental aparte. No es residuo borrable; es deuda
de documentación.

Inventario completo de los **25 ficheros tracked** con `ai-specs/`:

```
nexacore-api/prisma/migrations/20260519084738_tenancy_primitives_phase_0/migration.sql
nexacore-api/prisma/migrations/20260519084838_bootstrap_default_tenants/migration.sql
nexacore-api/prisma/migrations/20260519115702_user_platform_admin/migration.sql
nexacore-api/prisma/migrations/20260519144838_invitation_partial_unique/migration.sql
nexacore-api/prisma/migrations/20260522115127_phase_2_2_auth_intent/migration.sql
nexacore-api/prisma/schema.prisma
nexacore-api/src/auth/auth-intent.service.ts
nexacore-api/src/auth/interfaces/jwt-payload-v2.interface.ts
nexacore-api/src/auth/token.service.v2.ts
nexacore-api/src/common/constants/auth-skip-paths.constants.ts
nexacore-api/src/common/context/tenant-context.errors.ts
nexacore-api/src/common/context/tenant-context.ts
nexacore-api/src/common/services/online-ml-scorer.service.ts
nexacore-api/src/prisma/tenant-filter.extension.ts
nexacore-api/src/sessions/sessions.service.v2.ts
nexacore-api/src/tenants/dto/create-invitation.dto.ts
nexacore-api/src/tenants/dto/create-tenant.dto.ts
nexacore-api/src/tenants/invitations.service.ts
nexacore-api/src/tenants/memberships.service.ts
nexacore-api/src/tenants/tenants.controller.ts
nexacore-api/src/tenants/tenants.module.ts
nexacore-api/src/tenants/tenants.service.ts
nexacore-dashboard/playwright.config.ts
nexacore-dashboard/tests/e2e/auth-flows.spec.ts
README.md
```

---

## C. Artefactos locales / salida de herramientas

| Ruta | Por qué se sospecha | Estado git | Acción propuesta |
|------|---------------------|-----------|------------------|
| `logs/shadow-decisions.jsonl` | Telemetría "shadow-mode" (`cap":"ml_inference"`, `/__shadow_probe__`). Suena a framework, pero corresponde al feature del producto `online-ml-scorer.service.ts`. | **untracked**, gitignored (`.gitignore:91`) | **conservar/ignorar** (no entra al PR). Borrable localmente si molesta. **Dudoso** que sea del "otro sistema". |
| `nexacore-api/report/` (5 ficheros: `html/index.html`, `html/jscpd-report.json`, `html/js`, `html/styles`) | Salida HTML de la herramienta **jscpd**. Fue lo único marcado por `git status` al inicio. | **untracked, NO ignorado** | **conservar** (no es residuo del framework) · **añadir a `.gitignore`** para que no se commitee output de tooling (ticket aparte). |

---

## D. Acoplamientos a vigilar ANTES de limpiar (no borrar a ciegas)

| Elemento | Acoplamiento | Acción propuesta |
|----------|--------------|------------------|
| `.husky/pre-commit`, `.husky/pre-push`, `.jscpd.json` | Citan por **nombre** `backend-standards.mdc`, `workflow-standards.mdc`, `audit-standards.mdc Phase 10c`. Esos `.mdc` viven en `.lifecycle/specs/`. Si se borra `.lifecycle/` sin rehome, se rompe la trazabilidad de las reglas que el tooling **activo** referencia. | **conservar** (son hooks del producto) · coordinar el rehome de specs del Grupo A |
| `.github/workflows/structural-probe.yml`, `upgrade-baseline.yml`, `weekly-audit.yml` | Matchearon "framework", pero se refieren a migraciones **Tailwind/Next** y a `workflow-standards.mdc`, **no** a `em-development-framework`. Falso positivo. | **conservar** (CI del producto) |
| `.github/workflows/emkeel-ci.yml`, `jira-transition.yml` | Automatización de **Emkeel** (el sistema que gobierna). | **conservar** |

---

## E. Confirmaciones negativas (lo que se buscó y NO existe)

Reduce la superficie de sospecha planteada en el encargo:

- **Symlinks:** `find -type l` → **ninguno** en el repo. La preocupación ".claude/commands symlinked" **no se materializa**.
- **Directorio `.claude/` a nivel de repo:** **no existe**. Los `.claude` hallados están todos dentro de `*/node_modules/{resolve,nanoid}/.claude` → ficheros legítimos de dependencias, no residuo.
- **Motor del framework en el árbol:** sin `forge/`, sin `state-machine.py`, sin directorio `ai-specs/` literal, sin `changes/`/`programs/`. El motor vive en repo aparte (correcto).
- **Reglas de otros asistentes:** sin `.cursor/`, `.cursorrules`, `.windsurfrules`.
- **`.mdc` huérfanos:** solo 2 (`backend-standards.mdc`, `frontend-standards.mdc`), ambos bajo `.lifecycle/specs/` (cubiertos en Grupo A).
- **`nexacore-api/scripts/`:** solo `security-smoke-test.sh`; **sin** referencias al motor del framework.

---

## Componentes de Emkeel (sistema que gobierna) — CONSERVAR

No son residuo; son la base del nuevo gobierno: `emkeel-governance/` (adr/records/specs),
`emkeel.toml`, `AGENTS.md`, `CLAUDE.md`, `.env.example`, `.gitattributes`
(`emkeel-governance/ export-ignore`), `.github/workflows/emkeel-ci.yml` y `jira-transition.yml`.

Productos legítimos (no tocar): `nexacore-api/`, `nexacore-dashboard/`,
`satellites/sat-cristian-garcia/` (app Next.js; corresponde a SAT01).

---

## Tickets de limpieza propuestos (para que el humano decida — uno por grupo)

1. **`.lifecycle/` → rehome o archivo** (Grupo A): decidir mover bajo `emkeel-governance/`
   vs. conservar como archivo histórico vs. borrar. Incluye rescatar `.lifecycle/specs/*.mdc`
   por la dependencia D. **El grupo más pesado y la única decisión de fondo.**
2. **Saneamiento de referencias `ai-specs/`** (Grupo B): actualizar las 25 refs textuales
   al nuevo canon. Documental, sin riesgo funcional.
3. **`.gitignore` para output de tooling** (Grupo C): ignorar `nexacore-api/report/`
   (y revisar otros outputs de jscpd/coverage).

**Nada de lo anterior se ejecuta en este PR.** Este PR solo añade este informe.
