# Runbook: code-health

Strategy: code-health   <!-- the strategy this runbook implements -->

> Norte de ejecución de la estrategia `code-health` (ADR-034). **El motor del gate YA existe** (`emkeel.gates.check_code_health`, emkeel ≥0.1.111, cableado en el workflow `emkeel-ci`); lee `code-health.toml` en la raíz del repo. Lo que este runbook construye son los CHECKS que declara ese `.toml` + las capas advisory (juicio, drenaje) + la métrica. Topología = **2 puntos self-contained en em-ecosystem**: hook local → gate emkeel. Cada check: un comando que imprime un ENTERO (violaciones actuales); el ratchet exige `count <= baseline`, y el baseline solo DECRECE.

## Implementation
<!-- `Implements` cita las decisiones (Dn) de `## Recommendation` de la estrategia; el gate verifica AMBAS
     direcciones (toda decisión tiene pieza, toda cita existe). `done_when` usa vocabulario RESOLVABLE:
     `path:line`, URL, `test:<name>` o `gate:<name>` — nunca prosa. -->
| # | Piece | Implements | Ticket | Done when (resolves) | Status |
|---|-------|------------|--------|----------------------|--------|
| 1 | **Despertar el gate**: crear `code-health.toml` + primer check `comment-language` (adaptador `--count` que imprime el entero) | D1, D6, D7 | ECO-214 | ./code-health.toml:1 | pending |
| 2 | **Generalizar `comment-language` a la FLOTA** (nexacore-api + nexacore-dashboard + satélites) con sus baselines | D1 | #668 | gate:comment-language-fleet | pending |
| 3 | **stylelint** (CSS/tokens): config + check que imprime conteo + baseline. Caza dead custom-properties intra-bloque | D3 | ECO-219 | ./.stylelintrc.json:1 | pending |
| 4 | **knip** (dead-code): config + check + baseline | D4 | (por crear) | ./knip.json:1 | pending |
| 5 | **ESLint endurecido** (complexity / max-lines / `eslint-plugin-sonarjs`) + bulk-suppressions como baseline interno | D2 | (por crear) | gate:eslint-code-health | pending |
| 6 | **Fronteras + ciclos** (`eslint-plugin-boundaries` o `dependency-cruiser`): config + check + baseline | D5 | (por crear) | ./.dependency-cruiser.js:1 | pending |
| 7 | **Hook local** (punto proactivo de la topología): corre los checks de `code-health.toml` sobre lo staged/por-pushear | D7 | (por crear) | scripts/code-health-local.mjs:1 | pending |
| 8 | **Duplicación ADVISORY**: report (no gate duro) + **exclusiones declaradas** de coexistencia intencional (auth V1/V2, copias em-ui) | D8 | (por crear) | gate:dup-advisory | pending |
| 9 | **Recompute de baselines desde `main` MERGEADO** — el mecanismo que hace que la deuda solo DECREZCA (nunca lo escribe un actor anticipado) | D6 | (por crear) | scripts/code-health-baseline.mjs:1 | pending |
| 10 | **`eco-reviewer` advisory** (juicio): lee el diff con rúbrica + convenciones + fichero completo, pre-merge | D9 | (por crear) | .claude/agents/eco-reviewer.md:1 | pending |
| 11 | **Skill `/code-health <ámbito>`** (drenaje proactivo): audita y PROPONE un diff, entra por flujo gobernado | D10 | (por crear) | .claude/skills/code-health/SKILL.md:1 | pending |
| 12 | **Métrica de eficacia**: aceptación IA-review · falsos-positivos por gate · convergencia de baselines | D11 | (por crear) | emkeel-governance/records/code-health-efficacy.md:1 | pending |

## Orden de arranque recomendado
**Pieza 1 primero** (`comment-language`): ya existe, ya tiene ratchet, y con ella el gate pasa de **DORMIDO a VIVO** con riesgo casi cero — es el "hola mundo" del motor. Luego **pieza 3** (stylelint), ya validada como capaz de cazar 24 dead-props reales en `tokens.css`. El resto según decida el operador pieza a pieza.

## Fuera de alcance (para que no se cuele)
- **RENDIMIENTO** (performance efficiency de ISO 25010) — otra estrategia.
- **SEGURIDAD y TESTS** — ya tienen sus gates (Security Pipeline; gates de tests). Un SAST profundo (Semgrep/CodeQL) sería su propia estrategia.
- **Sonar** — descartado (ver Decisions de la estrategia): stack libre in-house; `eslint-plugin-sonarjs` da la paridad de reglas gratis.
- **`betterer`** — superseded: el ratchet completo son dos mitades, `check_code_health` (enforcement: conteo vs baseline COMMITTED) + la Pieza 9 (recompute del baseline desde main); betterer hacía AMBAS, y esas dos juntas la reemplazan.
