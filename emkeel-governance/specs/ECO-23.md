# ECO-23 — Satélites F1: em-ui (mecanismo de reuse del design system)

Strategy: satellites

## Resumen
Fase 1 de la estrategia [`satellites`](../strategy/satellites.md) (APPROVED) y de [ADR-006](../adr/006-satellite-component-reuse.md): construir **em-ui**, el mecanismo de reuse del design system — un **registry + CLI interno** con **copia gobernada y reconciliación** sobre una **fuente única**. Esta fase NO construye el skill `/satellite` (Fase 2) ni la automatización (Fase 3); entrega la **pieza base** sin la cual la generación de satélites propagaría drift.

## Contexto / problema (medido)
- El UI Core vive hoy en `nexacore-dashboard/src/components/ui/` (**48 componentes**) y `/admin/design-system` es la fuente de verdad declarada (`CONTRIBUTING.md:73-75`).
- No existe mecanismo de distribución: el `em-ui` CLI (SCRUM-331) nunca se implementó; no hay workspaces ni paquete compartido (`package.json` raíz sin `workspaces`).
- La copia manual deriva: SAT01 copió **17/48** y el `Button` ya **perdió** `role="status"` / `aria-label="Loading"` respecto al original (`nexacore-dashboard/src/components/ui/Button.tsx:87`). El drift es invisible y arrastra regresiones de a11y.

## Decisión de ubicación de la fuente (ver ADR-007)
El design system canónico se **extrae a `design-system/`** dentro de em-ecosystem, copiando los 48 componentes **idénticos** desde el dashboard. **em-ui lee SIEMPRE de `design-system/`, nunca del dashboard.** El **dashboard NO se toca** en esta fase: mantiene su propia copia como **legacy**; su repuntado a consumir `design-system/` vía em-ui es un **ECO futuro** (fuera de alcance aquí).

## Scope
- **(a) Fuente canónica `design-system/`:** crear el directorio con los **48 componentes copiados idénticos** desde `nexacore-dashboard/src/components/ui/` (verificable byte-a-byte salvo ajustes de import path documentados). Preserva los **tokens semánticos** (`text-content-primary`, `bg-surface-primary`, etc.) — sin hex/rgba crudos.
- **(b) Registry + CLI `em-ui`:** manifiesto de registry que indexa los componentes de `design-system/`, y CLI con al menos:
  - `add <componente>` — copia el componente (y sus deps internas) al proyecto consumidor (ownership).
  - `update <componente>` — re-pull desde la fuente, reconciliando.
  - `diff <componente>` — muestra la divergencia del consumidor frente a la fuente (drift detectable).
- **(c) Reconciliar el drift de SAT01:** usando `em-ui diff`/`update`, reconciliar los 17 componentes copiados de SAT01 empezando por el **`Button`** (restaurar la a11y perdida: `role="status"` / `aria-label="Loading"`). Documentar qué divergencias eran intencionales (per-cliente) vs regresiones.
- **(d) Tokens semánticos preservados:** la copia y el `add`/`update` mantienen los tokens semánticos; la propagación de cambios de la fuente al consumidor es intra-proyecto (vía em-ui), no manual.
- **(e) Dashboard intacto:** cero cambios en `nexacore-dashboard/`. Su copia queda como legacy hasta el ECO de repuntado.

## Out of scope
- El skill `/satellite` (Fase 2) y la automatización Jira/GitHub/Vercel (Fase 3).
- Repuntar el dashboard para consumir `design-system/` (ECO futuro).
- Convertir el repo a monorepo-workspaces (ADR-006 lo descarta por diseño).
- Cierre de los 2 huecos de CI (`security.yml` matrix, VRT auto-discovered) — Fase 3.

## Acceptance Criteria
1. **`design-system/` existe** con los **48** componentes presentes en `nexacore-dashboard/src/components/ui/` al momento de la copia; cada uno **idéntico** al original salvo ajustes de import documentados (verificable con un diff que liste solo esos ajustes).
2. **`em-ui` CLI** ejecuta `add`, `update` y `diff` contra `design-system/` como única fuente; `add <c>` materializa el componente en un proyecto consumidor de prueba reusando los tokens semánticos (sin hex crudos).
3. **`em-ui diff`** detecta el drift del `Button` de SAT01 frente a la fuente, y tras `update` (reconciliación) el `Button` de SAT01 **recupera** `role="status"` y `aria-label="Loading"`.
4. **em-ui NUNCA lee de `nexacore-dashboard/`** (verificable: el código del CLI referencia `design-system/`, no `nexacore-dashboard/src/components/ui/`).
5. **`nexacore-dashboard/` sin cambios** en este ticket (`git diff` no muestra ficheros bajo `nexacore-dashboard/`).
6. **Gates verdes:** `gates` (incl. `check_strategy_link` con `Strategy: satellites`), Security Pipeline / Security Gate, build + tests de los workspaces afectados.

## Alignment
Implementa/toca estas decisiones del norte (estrategia `satellites` + ADR-006/ADR-007):
- **D1 (ADR-006) — reuse = registry + CLI interno, copia gobernada con reconciliación, single-source.** Este ticket lo construye: `em-ui` con `add`/`update`/`diff` sobre una fuente única. Materializa AC #2, #3.
- **ADR-007 — ubicación de la fuente = `design-system/` dentro de em-ecosystem; dashboard legacy.** Este ticket crea `design-system/` y prohíbe que em-ui lea del dashboard. Materializa AC #1, #4, #5.
- **Estrategia §A3 — la copia manual deriva (drift del Button / a11y).** Este ticket lo resuelve volviendo el drift detectable y reconciliable. Materializa AC #3.
- **Estrategia, Fasificación F1.** Es la pieza base: sin ella, la generación de satélites (F2) propagaría drift. Respeta la dependencia de fase (no adelanta F2/F3).
- **`CONTRIBUTING.md:73-75` — tokens semánticos / `/admin/design-system` fuente de verdad.** Los componentes conservan tokens semánticos; la fuente de verdad se materializa en `design-system/`. Materializa AC #1.
</content>
