# ADR-034 — Imposición sistemática de "código sano" (topología gate-mecánico / review-juicio, ratchet, generaliza a la flota el patrón de gate+ratchet del design-system)

- Status: accepted
- Date: 2026-07-15
- Ticket: [ECO-212](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-212) (este ADR) — registra la estrategia [ECO-211](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-211)
- Strategy: code-health
- Deciders: Operador (human gate = aprobación + merge del PR de estrategia #608)
- Enmienda (ECO-224, 2026-07-16): consolidación del refinamiento — topología recortada a **2 puntos** (hook local + gate `check_code_health`, self-contained en em-ecosystem); **Sonar = NO** registrado; contradicciones internas resueltas (§5 eco-reviewer y §6 auto-fix: separado lo DECIDIDO de lo DIFERIDO).
- Enmienda (ECO-227, 2026-08-02): saneamiento — reconciliada la capa de fundamento (Context/Opciones) con las decisiones y eliminadas las referencias a `em-development-framework`; la topología se describe en positivo (hook local + `check_code_health`, self-contained). La decisión (2 puntos) no cambia.
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

**Modelo de dos naturalezas + topología de DOS puntos (self-contained en em-ecosystem) + ratchet, con la línea gate-vs-review como invariante.**

1. **Gate-duro para lo MECÁNICO, review para el JUICIO.** Lo mecánico es un catálogo FINITO y automatizable (CISQ
   ASCMM = mantenibilidad, CWE-1130): complejidad, tamaño, dead-code, fronteras/ciclos, idioma, dead-props de CSS.
   El juicio (organización, abstracción, coherencia, largo de comentarios) NO se gatea en duro — gatearlo reproduce
   el desastre `exhaustive-deps`/SCRUM-377 (falsos positivos → se apaga). Consenso de industria fuerte.

2. **Capa mecánica = herramientas ESTÁNDAR (no reinventar):** ESLint endurecido (complexity/max-lines/sonarjs) ·
   `stylelint` (CSS/tokens, hueco actual) · `knip` (dead-code) · `eslint-plugin-boundaries`/`dependency-cruiser`
   (fronteras entre módulos NestJS + corte server/client de Next + ciclos) · `check-comment-language` (idioma).
   **La DUPLICACIÓN es ADVISORY, no gate duro** — es relacional (dos sitios), el ratchet "solo lo nuevo" no le
   mapea, y gatearla bloquearía coexistencia intencional (auth V1/V2).

3. **Ratchet "solo lo que tocas" (sin big-bang):** el ratchet lo provee el gate **`check_code_health`** (compara el
   conteo de cada check contra su baseline en `code-health.toml`); las ESLint bulk-suppressions siguen siendo útiles
   DENTRO de ESLint. **`betterer` queda SUPERSEDED** — el gate ya hace de máquina de baselines (doctrina de
   `_ratchet.mjs`), no hace falta una segunda. La deuda legacy solo decrece; el baseline se **recomputa desde `main`
   MERGEADO**, nunca lo escribe un actor anticipado.

4. **Topología de 2 puntos, SELF-CONTAINED en em-ecosystem, una config compartida (`code-health.toml`):** hook local
   (feedback proactivo por-diff) → **gate required de emkeel** (`check_code_health`, backstop no-bypasseable, hereda
   branch-protection + `doctor`). El gate YA
   existe (emkeel ≥0.1.111); su config vive en `code-health.toml` (raíz, agent-editable — NO `emkeel.toml`, que emkeel
   regenera y el guard bloquea).

5. **Capa de juicio = revisor advisory `eco-reviewer`** (hermano de `eco-verifier`): lee el diff y da criterio
   razonado contra la rúbrica, independiente ("sin juicio previo" = sin apego de autor; varios + mayoría), PERO con
   rúbrica + convenciones/ADRs + fichero completo (no el diff aislado). Corre pre-merge. Advisory, nunca gate duro.
   **Lo DECIDIDO aquí es que el juicio va a review advisory (nunca a gate duro); su FORMA —subagente propio (a) vs
   herramienta de tercero (b)— es sub-decisión DIFERIDA (abajo).**

6. **Drenaje proactivo = skill `/code-health <ámbito>` que AUDITA y PROPONE un diff:** complementa al ratchet
   reactivo (que nunca drena un fichero frío). No commitea ni tickeza — la campaña entra por el flujo gobernado
   (`emkeel start` → branch → PR → gates), un ticket por tanda. **Por defecto PROPONE; si además puede AUTO-ARREGLAR
   el subconjunto determinista (comentario sin directiva, dead-props intra-bloque) es sub-decisión DIFERIDA (abajo).**

7. **Idioma como invariante gateado, escrito y bakeado en el proceso:** código + comentarios de código +
   JSDoc/docstrings en `.tsx/.ts/.mjs/.css` = INGLÉS; español SOLO en conversación + gobernanza
   (ADRs/specs/records/estrategias) + puntero/memoria. `check-comment-language` se **generaliza del design-system a
   TODA la flota**. La frontera = el SCOPE del gate (escanea código, no `emkeel-governance/`).

8. **Alcance = MANTENIBILIDAD.** El rendimiento (performance efficiency de ISO 25010) queda FUERA (otra estrategia);
   seguridad y tests no se re-cubren (ya tienen sus gates: Security Pipeline, gates de tests).

9. **Métrica de eficacia (para poder medir los kill-criteria):** tasa de aceptación de la IA-review, tasa de
   falsos-positivos por gate, y convergencia del ratchet (los baselines DEBEN bajar; si `comment-language`=1060 no
   baja, el ratchet no funciona).

### Parámetros de ejecución (NO decisiones de arquitectura de este ADR)

Este ADR decide la ARQUITECTURA. Lo que sigue son **parámetros que el operador elige al implementar cada pieza**, con casa en el runbook (`code-health.runbook.md`) — no decisiones que el ADR deje abiertas:
- **Sonar → NO** (cerrado en el refinamiento ECO-224): stack libre in-house; el análisis de PR de SonarQube es Developer Edition de pago; SonarCloud es gratis solo en repos PÚBLICOS y estos son privados; Community no hace análisis de PR; `eslint-plugin-sonarjs` v2+ (gratis) da la paridad de reglas de mantenibilidad. Cierra el kill-criterion #2 a favor del stack propio.
- **Duplicación → ADVISORY** (§2); la exclusión concreta de coexistencia V1/V2 se ajusta al configurar `jscpd`.
- **Orden de dimensiones + umbrales** (complexity=N, max-lines=M): parámetro por-pieza en el runbook.
- **Forma del revisor de juicio** (subagente propio vs tercero, pieza 10) y **si el drenaje auto-arregla el subconjunto determinista** (pieza 11): lo arquitectónico ya está decidido en §5 (juicio → review advisory) y §6 (drenaje → propone por defecto); solo la forma concreta se elige al construir la pieza.

## Consecuencias

- **emkeel gana su primer gate de code-health** (hoy todos son de proceso; ya shipeado en ≥0.1.111 como
  `check_code_health`). Hereda infra existente: `_ratchet.mjs`, `changed_files`, la no-bypasseabilidad de emkeel, el
  patrón `eco-verifier`. El punto proactivo por-diff lo da el **hook local**.
- **La regla de idioma deja de depender de la memoria** — se ejecuta con el ticket + los gates, siempre.
- **Coste asumido:** N herramientas a mantener + setup de baselines flota-wide + coste por-token de la capa IA por
  PR. La comparación con Sonar se **cerró = NO** (kill-criterion #2 a favor del stack in-house; `eslint-plugin-sonarjs`
  da la paridad de reglas gratis).
- **Riesgo gobernado por los kill-criteria:** falsos positivos que apaguen la capa (#1), falsa economía (#2),
  por-diff que se bypasse (#3), ratchet que no converja (#4) — todos medibles por la métrica de eficacia.
- **Los features declaran `Strategy: code-health`** cuando toquen esta superficie (gate `check_strategy_link`).
