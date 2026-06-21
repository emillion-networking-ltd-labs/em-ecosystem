# ECO-47 — launch-satellite modo (c): 2 guardrails de integridad del intake (piloto Grupo Atis)

Strategy: satellites

## Resumen
Endurece la regla **"no inventar"** del modo (c) con **dos guardrails de prosa** en
[`SKILL.md`](../../.claude/skills/launch-satellite/SKILL.md), surgidos del **piloto Grupo Atis**, que el
agente sigue al **leer material local** (sin parser por fuente):
1. **No falso-`missing`:** antes de declarar un asset `missing`, **buscar en TODO el árbol** del intake.
2. **Anti-ruido demo/plugin:** un dump de CMS mezcla contenido demo/plantilla/plugin/sample con el del
   cliente; al extraer copy, quedarse **solo** con lo inequívocamente del cliente, verbatim; ante la duda
   `proposed` no `extracted`.

## Contexto / base (lo que falló en el piloto)
- **(1) Falso `missing`:** el agente declaró el media `missing` por mirar **un subdir equivocado** cuando
  había **1834 imágenes** en el árbol del intake. Un "no lo veo aquí" **no** es `missing`.
- **(2) Ruido del dump:** la BD del cliente traía mucho contenido **demo/plugin/sample** mezclado con el real
  → riesgo de colar ruido como copy "extraído" (violaría el split verdad/diseño: lo `extracted` debe ser un
  **hecho real del cliente**).

Ambos son fallos de **lectura/criterio**, no de un parser → la corrección vive como **prosa** que el agente
aplica a cualquier fuente, coherente con el cableado de superficie del modo (c) (ECO-43).

## Decisión que resuelve

### D — Guardrail 1: un "no lo veo" NO es `missing` (buscar en todo el árbol)
Antes de marcar un asset `missing`, **buscar en todo el árbol del intake desde la raíz** (`find`/`ls -R`),
no en un solo subdir. `missing` **solo** tras buscar a fondo y no hallarlo. Genérico (cualquier fuente).

### D — Guardrail 2: un dump de CMS MEZCLA ruido con el contenido del cliente
Al extraer **copy** de un dump/export: quedarse **SOLO** con bloques **inequívocamente del cliente**
(mencionan su marca / sus servicios reales del brief); **descartar** demo/plantilla/plugin/sample/lorem;
**citar verbatim** (no suavizar — reescribir es creatividad F2b → `proposed`); **ante la duda, `proposed` no
`extracted`**. Refuerza el modelo de procedencia: `extracted` = hecho real del cliente, con fuente.

## Scope
- `SKILL.md` (modo c / lectura de material local): 2 guardrails de prosa.
- **Prosa, sin helper:** son reglas de **criterio del agente** ("¿este texto es del cliente?", "¿busqué a
  fondo?") no mecanizables sin un parser/LLM → no se añade código (consistente con el no-parser de ECO-43).
- **NO** rompe el flujo del modo (c) ni el **gate de fidelidad** (ECO-45); **NO** toca F1, la forma-SAT01 ni
  el generador.

## Acceptance Criteria
1. **Guardrail "no falso-`missing`"** queda escrito: el agente busca en **todo el árbol** del intake antes de
   declarar un asset `missing`; un "no encontrado en un subdir" no es `missing`.
2. **Guardrail "anti-ruido demo/plugin"** queda escrito: al extraer copy de un dump, solo lo inequívocamente
   del cliente entra como `extracted` (verbatim); demo/plugin/sample se descarta; **ante la duda `proposed`**.
3. **Genéricos:** ambos guardrails aplican a **cualquier fuente** (no atados a WordPress).
4. **Consistencia:** coherentes con el split verdad/diseño (D4) y el modelo de procedencia (`extracted`
   requiere fuente real; nada sin fuente se cuela como `extracted`/`provided`); no rompen el gate de fidelidad.
5. **Gates verdes:** `gates` (`Strategy: satellites`, `check_ticket_link` ECO-47), Security Pipeline / Security
   Gate, build + tests (la suite del skill sigue verde; cambio de prosa, sin código nuevo).

## Out of scope
- Un parser/analizador del dump o del árbol de assets (criterio del agente, no código) — descartado por altitud (ECO-43).
- Copiar assets al satélite (ECO-46 persiste el brief; copiar media es otro concern aparte).
- Cambios en el generador, la forma-SAT01, F1, o el gate de fidelidad (ECO-45).

## Alignment
Refuerza el **split verdad/diseño** (D4 del norte, `strategy/satellites.md` §«Modo (c) — remodelar con
valor»): los **HECHOS** del cliente son `extracted`/`provided` **reales** y nunca fabricados. Los dos
guardrails cierran dos vías por las que un fallo de lectura corrompería esa regla — declarar un hecho
inexistente (`missing` falso) o extraer ruido como hecho del cliente — manteniendo el modelo de procedencia
(`proposed` ante la duda). Genéricos a cualquier fuente; no tocan F1 ni adelantan F3.
