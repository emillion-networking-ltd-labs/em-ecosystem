# ADR-034 — Imposición sistemática de "código sano" (topología gate-mecánico / review-juicio, ratchet, generaliza a la flota el patrón de gate+ratchet del design-system)

- Status: accepted
- Date: 2026-07-15
- Ticket: [ECO-212](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-212) (este ADR) — registra la estrategia [ECO-211](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-211)
- Strategy: code-health
- Deciders: Operador (human gate = aprobación + merge del PR de estrategia #608)
- Contexto de gobierno: registra la decisión de la estrategia `code-health` (ECO-211, aprobada por merge de #608).
  **Generaliza a toda la flota** el patrón que el design-system ya probó por-pieza — gate por invariante + `_ratchet.mjs`
  (familia de gates de ADR-031, calidad de construcción de ADR-029, DoD por-ítem de `check-piece-complete`). No
  supersede a ninguno: extiende su filosofía del DS a `nexacore-api`/`nexacore-dashboard`/satélites.

## Contexto

Revisando `design-system/tokens/tokens.css` para un barrido de idioma aparecieron problemas que el idioma no cubre
(duplicación cross-block, líneas muertas, incoherencia de patrón, comentarios-prosa largos). La flota NO tenía un
sistema para que, **al MODIFICAR un fichero en un ticket**, esas cosas se controlaran solas — se confiaba a la
revisión manual y a la memoria (por eso la regla de idioma "se olvida"). Estado grounded: ESLint flojo (sin
complejidad/tamaño/naming/dead-code), sin stylelint, jscpd solo-avisa, sin knip; los gates de emkeel son todos de
PROCESO (ninguno de code-health); el ratchet existe solo en el DS. Revisar cada fichero a mano no escala.

## Decisión

**Modelo de dos naturalezas + topología de tres puntos + ratchet, con la línea gate-vs-review como invariante.**

1. **Gate-duro para lo MECÁNICO, review para el JUICIO.** Lo mecánico es un catálogo FINITO y automatizable (CISQ
   ASCMM = mantenibilidad, CWE-1130): complejidad, tamaño, dead-code, fronteras/ciclos, idioma, dead-props de CSS.
   El juicio (organización, abstracción, coherencia, largo de comentarios) NO se gatea en duro — gatearlo reproduce
   el desastre `exhaustive-deps`/SCRUM-377 (falsos positivos → se apaga). Consenso de industria fuerte.

2. **Capa mecánica = herramientas ESTÁNDAR (no reinventar):** ESLint endurecido (complexity/max-lines/sonarjs) ·
   `stylelint` (CSS/tokens, hueco actual) · `knip` (dead-code) · `eslint-plugin-boundaries`/`dependency-cruiser`
   (fronteras entre módulos NestJS + corte server/client de Next + ciclos) · `check-comment-language` (idioma).
   **La DUPLICACIÓN es ADVISORY, no gate duro** — es relacional (dos sitios), el ratchet "solo lo nuevo" no le
   mapea, y gatearla bloquearía coexistencia intencional (auth V1/V2).

3. **Ratchet "solo lo que tocas" (sin big-bang):** ESLint bulk-suppressions (nativo) + `betterer` para lo no-ESLint,
   doctrina de `_ratchet.mjs` — la deuda legacy solo decrece; el baseline se **recomputa desde `main` MERGEADO**,
   nunca lo escribe un actor anticipado.

4. **Topología de 3 puntos, una config compartida:** hook local (feedback) → **paso Verify del motor**
   (checkpoint proactivo por-diff, nuevo EXECUTOR que use `changed_files`) → **gate required de emkeel** (backstop
   no-bypasseable, hereda branch-protection + `doctor`). Espejo de cómo la corrección de ticket se impone en Enrich
   Y en `check_ticket_precedes_work`.

5. **Capa de juicio = revisor advisory, implementado como subagente propio `eco-reviewer`** (hermano de
   `eco-verifier`): lee el diff y da criterio razonado contra la rúbrica, independiente ("sin juicio previo" = sin
   apego de autor; varios + mayoría), PERO con rúbrica + convenciones/ADRs + fichero completo (no el diff aislado).
   Corre en Verify + pre-merge. Advisory, nunca gate duro.

6. **Drenaje proactivo = skill `/code-health <ámbito>` que AUDITA y PROPONE un diff** (no una máquina que
   auto-arregla): complementa al ratchet reactivo (que nunca drena un fichero frío). No commitea ni tickeza — la
   campaña entra por el flujo gobernado (`emkeel start` → branch → PR → gates), un ticket por tanda.

7. **Idioma como invariante gateado, escrito y bakeado en el proceso:** código + comentarios de código +
   JSDoc/docstrings en `.tsx/.ts/.mjs/.css` = INGLÉS; español SOLO en conversación + gobernanza
   (ADRs/specs/records/estrategias) + puntero/memoria. `check-comment-language` se **generaliza del design-system a
   TODA la flota**. La frontera = el SCOPE del gate (escanea código, no `emkeel-governance/`).

8. **Alcance = MANTENIBILIDAD.** El rendimiento (performance efficiency de ISO 25010) queda FUERA (otra estrategia);
   seguridad y tests no se re-cubren (ya tienen sus gates: Security Pipeline, gates de tests).

9. **Métrica de eficacia (para poder medir los kill-criteria):** tasa de aceptación de la IA-review, tasa de
   falsos-positivos por gate, y convergencia del ratchet (los baselines DEBEN bajar; si `comment-language`=1060 no
   baja, el ratchet no funciona).

### Sub-decisiones DIFERIDAS a la ejecución (las fija el operador; `/emkeel-engineer` implementa)

- **Duplicación:** advisory vs excluida, y qué exclusiones de coexistencia intencional (V1/V2).
- **SonarQube sí/no** — con el coste sobre la mesa (su PR-analysis es Developer Edition de pago vs. mantener ~9
  piezas propias). Es explícitamente el kill-criterion #2 (falsa economía): decisión económica, no de gobernanza.
- **Auto-fix del drenaje:** si el skill llega a auto-arreglar el subconjunto determinista (comentarios sin
  directiva, dead-props intra-bloque) o solo PROPONE — muta producción, riesgo propio.
- **eco-reviewer:** (a) subagente propio vs (b) herramienta de tercero (Claude Code Action / CodeRabbit); ambas
  advisory, combinables.
- **Qué dimensiones entran primero** y sus **umbrales** (complexity=N, max-lines=M, dup=%).

## Consecuencias

- **emkeel gana su primer gate de code-health** (hoy todos son de proceso) y el motor Verify su primer EXECUTOR
  por-diff. Ambos heredan infra existente: `_ratchet.mjs`, `changed_files`, la no-bypasseabilidad de emkeel, el
  patrón `eco-verifier`.
- **La regla de idioma deja de depender de la memoria** — se ejecuta con el ticket + los gates, siempre.
- **Coste asumido:** N herramientas a mantener + setup de baselines flota-wide + coste por-token de la capa IA por
  PR. La comparación con Sonar queda abierta como decisión de coste (kill-criterion #2).
- **Riesgo gobernado por los kill-criteria:** falsos positivos que apaguen la capa (#1), falsa economía (#2),
  por-diff que se bypasse (#3), ratchet que no converja (#4) — todos medibles por la métrica de eficacia.
- **Los features declaran `Strategy: code-health`** cuando toquen esta superficie (gate `check_strategy_link`).
