# ECO-45 — launch-satellite modo (c): gate de fidelidad (A/B/C) + núcleo del loop iterativo

Strategy: satellites

## Resumen
Implementa en el skill/generador la decisión **D4 del norte** (ECO-44, [`strategy/satellites.md` §«Modo (c)
— remodelar con valor»](../strategy/satellites.md)): el modo (c) ya no es "solo colores" → ofrece un **gate
de fidelidad** que el cliente elige y separa **HECHOS** de **CREATIVIDAD** (split verdad/diseño). Añade el
campo `intent` al brief, el onboarding que **pregunta siempre** la fidelidad (default **B**, sin imponerla),
la **latitud creativa** por modo en la generación, y el **núcleo del loop** (confirmar `proposed`→`provided`).

## Contexto / base
- D4 ya está en el norte (APPROVED): gate A/B/C, split verdad/diseño, loop iterativo.
- El modelo de procedencia existe (`provided|extracted|proposed|missing`, `.claude/skills/launch-satellite/schema/brief.schema.json:49`).
- El generador reusa vía em-ui y rellena desde el brief; los `missing` ya salen como placeholder visible.

## Decisiones que resuelve

### D — `intent` en el brief (gate de fidelidad)
Nuevo campo **opcional** `intent` (`{value: a-replica|b-remodel|c-reimagine, provenance: provided|proposed}`).
**Lo elige el cliente** (`provided`); el agente puede sugerirlo (`proposed`) y el cliente confirma. **Ausente
⇒ default `b-remodel`** (no se auto-impone: el default es explícito, el onboarding pregunta). No rompe briefs
previos (opcional).

### D — Latitud creativa por modo (split verdad/diseño, D4)
La generación lee `intent` y aplica la latitud, **respetando siempre** que los **HECHOS** del cliente
(identidad, contacto, servicios, copy real, assets) son `extracted`/`provided`, **intactos y jamás
fabricados** en los tres modos; lo ausente es placeholder visible:
- **(A) a-replica** — diseño fiel portado a forma satélite; **mínima creatividad**: una sugerencia `proposed`
  **no se renderiza** hasta confirmarse (`[PENDIENTE: …]`) — la réplica solo refleja hechos confirmados.
- **(B) b-remodel [DEFAULT]** — diseño fresco con nuestros componentes; lo **NUEVO** (diseño/redacción/
  secciones) va como `proposed` y **se renderiza** (es el preview a confirmar), trazado en `trace.proposed`.
- **(C) c-reimagine** — propuesta nueva; igual que B en latitud (`proposed` se renderiza), con más libertad
  de estructura.

### D — Núcleo del loop iterativo
`confirmField(proposed) → provided` (lib): la mecánica de confirmación. El **preview** de cada iteración es
`next build` + **Lighthouse local** (ya existe, `scripts/lighthouse-local.mjs`); el **refinamiento
conversacional** lo conduce el agente (prosa en SKILL.md). Nada externo (Vercel/Jira) sin gate humano.

## Scope
- `schema/brief.schema.json`: campo `intent` (enum, opcional).
- `scripts/lib/brief.mjs`: `INTENTS`, `DEFAULT_INTENT`, `briefIntent()`, validación de `intent`, `confirmField()`.
- `scripts/generate-satellite.mjs`: lee `intent`, aplica latitud A/B/C, hechos intactos, traza `proposed`.
- `SKILL.md` modo (c): **pregunta siempre** la fidelidad (A/B/C, default B) tras el intake; documenta el loop.
- Tests (sin red). **NO** toca F1 (`design-system/`, `em-ui/`); **NO** cambia la forma-SAT01 ni el reuse vía em-ui.

## Acceptance Criteria
1. **Onboarding pregunta la fidelidad y NO auto-elige:** SKILL.md modo (c) instruye preguntar A/B/C (default B)
   tras el intake; el brief lleva `intent` (lo elige el cliente, `provided`).
2. **Brief válido con `intent`:** `validateBrief` acepta `intent` (enum) y lo rechaza si `value` no es A/B/C;
   un brief **sin** `intent` sigue siendo válido (default `b-remodel`) — no rompe briefs previos.
3. **Latitud correcta por modo:** un campo `proposed` se **renderiza en B/C** (y se traza en `trace.proposed`)
   y **NO en A** (sale `[PENDIENTE: …]`); un **HECHO** `provided`/`extracted` se renderiza intacto en los tres.
4. **No-inventar sobre hechos (duro):** un dato sin fuente **nunca** se cuela como `provided`/`extracted`
   (lo enforce `field`/`fieldProblems`); un `missing` se rinde como placeholder, jamás fabricado. Test que falle.
5. **Loop:** `confirmField` convierte un `proposed` (con valor) en `provided`; rechaza confirmar `missing`/sin valor.
6. **Reuse + forma-SAT01 intactos:** la generación sigue usando em-ui y la estructura SAT01 (suite del skill verde).
7. **Gates verdes:** `gates` (`Strategy: satellites`, `check_ticket_link` ECO-45), Security Pipeline / Security
   Gate, build + tests; Lighthouse S2 del satélite generado sigue verde (gate por mediana de ECO-41).

## Out of scope
- La redacción creativa concreta (la conduce el agente en prosa, no el generador determinista).
- Automatización externa (Vercel/Jira) — sigue tras gate humano (F3).
- Cambios en `design-system/`/`em-ui/` (F1) o en la forma-SAT01.

## Alignment
Implementa la decisión **D4** del norte (`strategy/satellites.md` §«Modo (c) — remodelar con valor» + Decisión
D4): **gate de fidelidad** (A réplica / **B remodel [default]** / C reimaginación, a elección del cliente),
**split verdad/diseño** (HECHOS `extracted`/`provided` intactos; CREATIVIDAD `proposed` a confirmar — "no
inventar" = no mentir sobre hechos, no "no crear") y el **núcleo del loop** (`proposed`→`provided`). Respeta el
reuse vía em-ui (ADR-006/007) y la forma-SAT01. No adelanta F3 ni toca F1.
