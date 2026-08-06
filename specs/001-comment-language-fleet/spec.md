# Feature Specification: Generalizar comment-language a la flota

**Feature Branch**: `feat/668-comment-language-fleet`

**Created**: 2026-08-06

**Status**: Draft

**Input**: Pieza 2 del runbook code-health (Issue #668). Hoy el check `comment-language` (idioma inglés en código) solo escanea el `design-system`; esta pieza lo extiende a TODA la flota — `nexacore-api`, `nexacore-dashboard` y los satélites — cada paquete con su propio baseline, bajo el gate `check_code_health`.

Strategy: code-health

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Un PR que añade español al código de la flota se caza (Priority: P1)
Un desarrollador (o un agente) abre un PR que añade una línea con un carácter español (comentario, JSDoc, string) en `nexacore-api`, `nexacore-dashboard` o un satélite. Hoy eso pasa desapercibido (el check solo mira el design-system). Con esta pieza, el gate `check_code_health` cuenta las violaciones del paquete tocado y, si el conteo sube por encima del baseline, **falla el PR** — igual que ya ocurre en el design-system.

**Why this priority**: es el valor central de la pieza — la regla de idioma (D1) deja de cubrir solo el DS y pasa a toda la flota; sin esto, el 75% del código del repo (api/dashboard/satélites) queda fuera del enforcement.

**Acceptance**: añadir una línea en español en `nexacore-api/src/` sube el conteo de ese paquete > baseline → el gate falla. Quitar/traducir una línea vieja lo baja → el baseline puede decrecer.

### User Story 2 — La deuda legacy no bloquea (ratchet, no big-bang) (Priority: P1)
Cada paquete arranca con un baseline igual a su deuda española REAL actual (el conteo hoy). El gate solo falla si un PR SUBE el conteo por encima de ese baseline; la deuda existente no fuerza un big-bang.

**Why this priority**: sin el ratchet por-paquete, generalizar el check rompería CI de golpe (miles de líneas legacy) — inaceptable.

**Acceptance**: con el código actual sin tocar, el gate pasa (conteo == baseline por paquete). El baseline nunca sube.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: El detector de idioma (una línea con carácter español-específico, excepto `lang-ok`) se aplica a los ROOTS de código de CADA paquete de la flota: `nexacore-api`, `nexacore-dashboard`, satélites — no solo el design-system.
- **FR-002**: Cada paquete escaneado se declara como un `[[check]]` propio en `code-health.toml` (raíz), con su `name` (p.ej. `comment-language-api`), su `command` (adaptador `--count` apuntando a sus ROOTS) y su `baseline` = conteo real actual.
- **FR-003**: Cada `command` imprime SOLO el entero de violaciones del paquete en la última línea de stdout (contrato de `check_code_health._parse_count`), corriendo desde la raíz del repo.
- **FR-004**: El gate `check_code_health` enforcea `count <= baseline` por cada check; el baseline solo DECRECE (ratchet, sin big-bang).
- **FR-005**: Reusa el detector existente (`spanishLineCount` / el walk de `check-comment-language.mjs`) generalizado por-paquete — no reimplementa la detección ni duplica lógica.
- **FR-006**: El scope de código de cada paquete excluye `node_modules` y artefactos de build; escanea las mismas extensiones que el check del DS (`.ts/.tsx/.js/.jsx/.mjs/.css/.scss`).

### Key Entities
- **Check por-paquete** (en `code-health.toml`): `{ name, command, baseline }` — una entrada por paquete de la flota.
- **Baseline por-paquete**: el conteo de líneas-español real de ese paquete al mergear; committed, solo decrece.

## Success Criteria *(mandatory)*
- **SC-001**: Los 3+ paquetes de la flota (api, dashboard, cada satélite) tienen su check `comment-language-*` en `code-health.toml` con baseline = su conteo real.
- **SC-002**: Con `main` sin tocar, `check_code_health` pasa (todos los conteos == baseline).
- **SC-003**: Un PR que añade una línea en español en cualquier paquete de la flota hace fallar el gate (conteo > baseline).
- **SC-004**: Cero regresión en el check del design-system (sigue funcionando igual).

## Assumptions
- El check del design-system (`design-system/scripts/check-comment-language.mjs`) es la fuente del detector a generalizar; su función `spanishLineCount` y su walk se reusan (no se reimplementan).
- Los ROOTS de código por paquete: `nexacore-api/src`, `nexacore-dashboard/src`, `satellites/*/src` (a confirmar contra la estructura real al construir).
- El ratchet interno del DS y su baseline propio se mantienen (fuera de scope de esta pieza — es la dedup, posterior).
- Baseline = conteo actual verificado por paquete al construir (no un número inventado).

## Alignment
<!-- Qué decisiones del norte (estrategia code-health) implementa esta pieza. -->
- **D1 — Idioma inglés gateado:** esta pieza es la razón de ser de D1 a escala flota — el enforcement de `comment-language` pasa de cubrir solo el design-system a `nexacore-api` + `nexacore-dashboard` + satélites. La regla de idioma deja de depender de la memoria en el 100% del código, no solo en el DS.
- **D6 — Ratchet = enforcement del gate:** cada check nuevo enforcea `count <= baseline` (baseline COMMITTED por paquete, leído de la rama base por `check_code_health`); el `--count` por-paquete es la mitad de MEDICIÓN. El recompute del baseline sigue siendo la Pieza 9 (aparte).
- **D7 — Topología 2 puntos, config en `code-health.toml`:** los checks nuevos se declaran en el mismo `code-health.toml` de la raíz; el gate de emkeel (backstop no-bypasseable) los corre. Sin infra nueva — extiende la de la Pieza 1.
