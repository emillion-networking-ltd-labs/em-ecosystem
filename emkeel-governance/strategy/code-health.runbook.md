# Runbook: code-health

Strategy: code-health   <!-- the strategy this runbook implements -->

> Norte de ejecución de la estrategia `code-health` (ADR-034). **El motor del gate YA existe** (`emkeel.gates.check_code_health`, emkeel ≥0.1.111, cableado en `emkeel-ci`); lee `code-health.toml` en la raíz del repo. Lo que este runbook construye son los CHECKS que declara ese `.toml` + las dos capas advisory (review de juicio, drenaje). Topología = **2 puntos self-contained en em-ecosystem**: hook local → gate emkeel. Cada check: un comando que imprime un ENTERO (violaciones actuales); el ratchet exige `count <= baseline`, y el baseline solo DECRECE.

## Implementation
<!-- Cada pieza: qué construir · su ticket · `done_when` RESOLVABLE (file:line, test, o gate verde — no prosa) · status. `emkeel strategy check` resuelve los `done_when` para el % done. Debe haber una pieza por TODO lo que decidió la Recommendation. -->
| # | Piece | Ticket | Done when (resolves) | Status |
|---|-------|--------|----------------------|--------|
| 1 | **Despertar el gate: `code-health.toml` + primer check `comment-language`** (adaptador `--count` en `check-comment-language.mjs` que imprime el entero) | ECO-214 | `code-health.toml` (raíz) declara `[[check]] name="comment-language"`; el gate `check_code_health` corre VERDE en `emkeel-ci` sobre un PR | pending |
| 2 | **Generalizar `comment-language` del design-system a la FLOTA** (nexacore-api + nexacore-dashboard + satélites) con sus baselines | (por crear) | `code-health.toml` declara checks `comment-language` con SCOPE `nexacore-api/` y `nexacore-dashboard/` y baseline recomputado desde main | pending |
| 3 | **stylelint (CSS/tokens)** — caza dead custom-properties (p.ej. `tokens.css:493` pisado por `:543`) | ECO-219 | `.stylelintrc*` existe; comando de check imprime un entero; declarado en `code-health.toml` con baseline | pending |
| 4 | **knip (dead-code)** — estándar de monorepo | (por crear) | `knip.json*` existe; comando imprime un entero; declarado en `code-health.toml` con baseline | pending |
| 5 | **ESLint endurecido** (complexity / max-lines / `eslint-plugin-sonarjs`) con ratchet vía bulk-suppressions | (por crear) | `nexacore-*/eslint.config.mjs` declara `complexity`+`max-lines`+`sonarjs`; `eslint-suppressions.json` (baseline) presente; check en `code-health.toml` | pending |
| 6 | **Fronteras + ciclos** (`eslint-plugin-boundaries` o `dependency-cruiser`) — la dimensión estructural inter-módulo (CWE-1047) | (por crear) | config de boundaries/dep-cruiser presente; comando imprime un entero; declarado en `code-health.toml` con baseline | pending |
| 7 | **Hook local (punto proactivo de la topología)** — corre los checks de code-health sobre lo staged/por-pushear | (por crear) | `.husky/pre-commit` o `.husky/pre-push` invoca los checks de `code-health.toml` | pending |
| 8 | **Capa de juicio = `eco-reviewer` advisory** (lee el diff + rúbrica+convenciones+fichero completo, pre-merge). *Sub-decisión diferida: subagente propio (a) vs tercero (b).* | (por crear) | existe el revisor (subagente `.claude/agents/eco-reviewer*` o action de tercero) y emite criterio advisory en un PR | pending |
| 9 | **Drenaje proactivo = skill `/code-health <ámbito>`** que AUDITA y PROPONE un diff (entra por flujo gobernado). *Sub-decisión diferida: auto-fix del subconjunto determinista vs solo propone.* | (por crear) | existe `.claude/skills/code-health/` y produce un diff propuesto sobre un ámbito | pending |
| 10 | **Métrica de eficacia** (para medir los kill-criteria): aceptación IA-review · falsos-positivos/gate · convergencia de baselines (deben BAJAR) | (por crear) | doc/registro que reporta las 3 métricas; los baselines de `code-health.toml` muestran descenso trimestre a trimestre | pending |

## Decisiones DIFERIDAS que afectan al orden (las fija el operador)
- **Qué dimensión primero + umbrales.** Recomendación de arranque: **pieza 1 (`comment-language`)** — ya existe, ya tiene ratchet, y con ella el gate pasa de DORMIDO a VIVO con riesgo casi cero (es el "hola mundo" del motor). Luego stylelint (pieza 3), ya validado que caza 24 dead-props reales en `tokens.css`.
- **Auto-fix del drenaje** (pieza 9): auto-arregla el subconjunto determinista o solo propone.
- **eco-reviewer** (pieza 8): subagente propio vs tercero.

## Fuera de alcance (para que no se cuele)
- **RENDIMIENTO** (performance efficiency de ISO 25010) — otra estrategia.
- **SEGURIDAD y TESTS** — ya tienen sus gates (Security Pipeline; gates de tests).
- **Sonar** — descartado (ver Decisions de la estrategia). Stack libre in-house; `eslint-plugin-sonarjs` da la paridad de reglas gratis.
- **Duplicación como gate duro** — es ADVISORY (relacional; coexistencia intencional V1/V2).
- **`em-development-framework`** — su paso Verify quedó FUERA de la topología (self-contained en em-ecosystem).
