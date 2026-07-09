# ADR-030 — Marcadores de modificabilidad por-elemento (regiones comentadas + merge-policy por-máscara sobre ECO-158); des-gatea el item 5 de ADR-028 a build-now

- Status: accepted
- Date: 2026-07-09
- Ticket: [ECO-162](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-162)
- Strategy: design-propagation
- Deciders: Operador (human gate = aprobación + merge del PR)
- Contexto de gobierno: **ENMIENDA ADR-028** — des-gatea su item 5 (marcadores por-elemento
  `@brand-locked`/`@ds-governed`/`@partial`), que ADR-028 había puesto tras el trigger de nº de consumidores.
  Refina `design-propagation.md` (item 5). Coordinado con `design-distribution` (ECO-161, que probó que el
  mecanismo NO es `::part`/SLDS) y `design-system-quality` (ECO-160). Preserva el invariante PULL.

## Contexto

ADR-028 gateó los marcadores por-elemento por nº de consumidores (hoy = 2). **El operador decide construirlos YA —
no diferir por coste** (base sólida desde el principio). El panel adversarial de design-distribution probó por
código que los patrones de mercado (`::part` de CSS Shadow Parts, styling-hooks de Salesforce SLDS) **NO mapean** a
nuestro stack (React + Tailwind en light-DOM, cero shadow-DOM), y que —como el código se COPIA y lo posee el
consumidor— un marcador dentro del `.tsx` es **advisory** salvo que algo FUERA lo fuerce al hacer pull. El research
del mecanismo (ECO-162, verificado inline contra `design-system/registry/_merge.mjs:17`) confirma un diseño
construible sobre la reconciliación ECO-158 (`reconcileMerge` content→content, `git merge-file -p --diff3`).

## Decisión

**Mecanismo:** regiones delimitadas por **comentarios-sentinela** —
`// @em-region:begin <policy> id="…"` … `// @em-region:end id="…"`— con 3 políticas:
- **brand-locked** — la adaptación del consumidor se conserva; el DS NO la reescribe al actualizar.
- **ds-governed** — el DS manda la estructura; el consumidor solo puede **re-apuntar un token semántico**.
- **partial** — merge a 3 bandas normal (adaptación + delta del DS conviven).

**Enforcement al PULL (no runtime), por MÁSCARA sobre el `reconcileMerge` existente** (cli.mjs:123): un wrapper
region-aware pre-enmascara los 3 textos por región y llama UNA vez a `reconcileMerge` (mismo contrato
`{clean,merged}`):
- brand-locked → `ours'[R] = base[R]` (el delta del DS en R se anula → la adaptación sobrevive sin conflicto).
- ds-governed → `theirs'[R] = base[R]` (el consumidor "no cambió" R → la estructura del DS aterriza limpia).
- partial → intacto (única región con 3-way real).
Los sentinelas (idénticos en base/theirs/ours, forzados por el gate) son los anclajes de alineación.

**Cambios de entrada:** `hasRegions()` OR'd en el gate `isAdapted` (cli.mjs:99) —o una región queda
blind-overwritten—; `recordEntry` guarda base para "adapted O hasRegions"; el parser vive en `_reconcile.mjs`,
compartido por CLI y gate (una sola fuente).

**Gate CI (`check-region-integrity`, required / no-bypass) — hace VINCULANTE el marcador** (un comentario en un
fichero copiado es editable): (1) buen-formado (begin/end casan, ids únicos, política conocida); (2) **anti-tamper**
(el consumidor NO puede mover/borrar/renombrar/degradar un sentinela); (3) **ds-governed token-only** (diff vs DS;
toda línea editada superviviente debe ser un re-apunte de token semántico, por allowlist). *(El botón "Merge" de
GitHub ignora drivers de merge propios → corre como job de CI, como ya hace `em-ui update`.)*

**Report** (console-ready): per-fichero → per-región `{id, política, outcome ∈ preserved | ds-updated | conflict |
token-violation | orphaned}`. **Región huérfana** (el DS borró una región que el consumidor había adaptado): si es
**brand-locked → HARD-BLOCK** la actualización hasta decisión humana; las demás → reporte lateral (patrón `.lost`,
nunca tirar en silencio la personalización del cliente).

**Decisiones fijadas (operador, 7/7):**
- Regiones **PLANAS** (no anidadas) en v1 — cada línea pertenece a UNA sola región, sin ambigüedad.
- Unidad mínima = **línea entera** (para bloquear un valor suelto va en su propia línea); mid-line = AST, escalado
  posterior NOMBRADO, no v1.
- Sentinelas **a mano por el autor del DS** (asignar la política es intención de diseño = humano; un codemod puede
  AYUDAR después —avisar de faltantes, plantilla— pero no asignar la política).
- ds-governed **token-only SÍ se construye** (es el valor real de ds-governed; no diferir).
- **Unificar** `@em-ui-adapted` con el modelo: el marcador de fichero = una región implícita de fichero.

## Consecuencias

- **Enmienda ADR-028**: su item 5 (marcadores por-elemento) pasa de trigger-gated a **build-now**. Los demás items
  gated de ADR-028 (allow-list por-componente, auto-codemod, `@layer` lock) siguen como estaban salvo decisión propia.
- `design-propagation.md` item 5 se actualiza (des-gated → build-now, ver este ADR).
- La implementación cae en la **Fase 2 del roadmap** (sobre el DS ya con contrato de variantes + reconciliación).
- **AST** (mid-line, node-precise) queda como escalado futuro nombrado, solo si se vuelve necesario.
- El mecanismo emite resultado estructurado por-región (console-ready) para la futura consola de aprobación del cliente.
