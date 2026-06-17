# ADR-005 — Taxonomía de docs: la autoridad vive solo en `emkeel-governance/`; `docs/` es referencia no vinculante

- **Estado:** Aceptada
- **Fecha:** 2026-06-17
- **Ticket:** [ECO-19](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-19)
- **Strategy:** none (es una decisión de gobierno, no un feature)
- **Decisor:** Operador (human gate)
- **Contexto de gobierno:** repo gobernado por Emkeel (ver `AGENTS.md`). Decisión propia de em-ecosystem (NexaCore): fija la frontera autoridad/referencia entre `emkeel-governance/` (lo que exigen y versionan los gates de CI de este repo) y `docs/` (que ningún gate referencia).

## Contexto

El repositorio acumula dos clases de documento que hasta ahora convivían sin una frontera declarada:

- **Artefactos de gobierno** bajo `emkeel-governance/` (`strategy/`, `specs/`, `adr/`, `records/`) — el material **gateado** por CI (los gates de Emkeel los exigen, versionan y enlazan a tickets).
- **Documentos de referencia** bajo `docs/` (incluido `docs/archive/`) — material descriptivo o histórico, **no gateado**, recuperado de repos congelados o archivado durante migraciones.

Sin una regla explícita, un agente (o una persona) puede tratar un doc de `docs/` como si fuera norma vigente y dejar que el código derive hacia una referencia histórica en lugar de hacia el norte gobernado. El inventario actual de `docs/` son tres ficheros con disposición ya acordada por el operador, que esta ADR ejecuta y registra.

**Grounding del design-system vivo:** `CONTRIBUTING.md:73-75` declara, bajo **«Design System»**, que **`/admin/design-system` es la fuente de verdad** (tokens semánticos + `componentRegistry` + `ComponentShowcase`). Por tanto el snapshot estático archivado de design tokens ya no es autoridad ni referencia útil: está superado por una fuente viva citada en el contrato de contribución.

## Decisión

1. **Monopolio de autoridad.** La autoridad **solo** vive en `emkeel-governance/` (`strategy/` + `specs/` + `adr/`), que es lo gateado. Ningún documento bajo `docs/` es vinculante. Ante conflicto, mandan los artefactos de gobierno.
2. **`docs/` es referencia NO vinculante**, retenida **por ahora** y **borrable cuando quede vacía o innecesaria** (git conserva el historial; no se mantiene una pila de "borrar más tarde" — un doc muerto se elimina).
3. **Inventario y disposición** de los tres docs actuales:

   | Documento | Disposición | Grounding / razón |
   |---|---|---|
   | `docs/archive/ui-design-system.md` | **BORRAR** (en este ticket) | Superseded — la fuente viva es `/admin/design-system`, declarada fuente de verdad en `CONTRIBUTING.md:73-75`. El snapshot Figma (extraído 2026-02-19) es un congelado redundante. |
   | `docs/archive/satellite-deployment-runbook.md` | **SE QUEDA** — pendiente de promoción | Documento operativo vigente (procedimiento SAT01). Se promoverá a una **estrategia gobernada** `strategy/satellites.md` en **ECO-20** (ceremonia `/strategy`). No se toca aquí. |
   | `docs/auth-v2-program.md` | **SE QUEDA** — referencia histórica | El "por qué" del programa original de 7 fases (D-001…D-010). Su autoridad ya es **redundante** con `strategy/auth.md` (APPROVED) + `ADR-002`; el propio doc declara que ante conflicto mandan esos dos. Se retiene como contexto histórico. |

4. **Forward-ref (ECO-20):** el runbook de satélites **no es referencia muerta**: es norte latente. Su promoción a `emkeel-governance/strategy/satellites.md` se hará en **ECO-20** vía la ceremonia `/strategy` (investigación grounded + human gate), no en este ticket.

## Consecuencias

- **Se elimina** `docs/archive/ui-design-system.md`. La guía de diseño vinculante para cualquier trabajo de UI es `/admin/design-system` (vía `CONTRIBUTING.md`); no queda un segundo "source of truth" estático que pueda divergir.
- **`docs/archive/` queda con un solo fichero** (el runbook), explícitamente marcado como pendiente de promoción a `strategy/` en ECO-20. Cuando se promueva, `docs/archive/` podrá vaciarse y eliminarse.
- **`docs/auth-v2-program.md` permanece** como referencia histórica no vinculante; cualquier decisión AUTH se gobierna por `strategy/auth.md` + `ADR-002`, nunca por este doc.
- **Frontera declarada para agentes:** a partir de esta ADR, "leer la doctrina" significa leer `emkeel-governance/`. `docs/` informa pero no obliga. Esto cierra la vía de drift por la que una referencia histórica se confunde con norma vigente.
- Esta ADR es **solo gobernanza**: no toca código de producto (`nexacore-api/`, `nexacore-dashboard/`) ni el runbook ni el auth-v2-program. Registra la doctrina y ejecuta una única retirada (el design-system archivado).

## Notas

- Disposición acordada por el operador y ejecutada bajo ECO-19. La promoción del runbook se traza en ECO-20.
- `docs/` no está gateado: su limpieza es un acto deliberado por ticket (como este), no un gate automático.
