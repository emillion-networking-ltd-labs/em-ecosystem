# ECO-24 — Satélites F2a: `/satellite` onboarding (5 modos → brief estructurado)

Strategy: satellites

## Resumen
Fase 2a de la estrategia [`satellites`](../strategy/satellites.md) (APPROVED). Construye la **parte de onboarding** del skill `/satellite`: una conversación guiada que, a través de **5 modos de intake**, produce un **brief estructurado** (schema versionado). El brief es la **costura/contrato** hacia la generación (ECO-25, F2b) — misma filosofía de "costura limpia" que ADR-006. NO genera el satélite (eso es ECO-25) ni despliega (eso es F3).

## Contexto / base (ya en main)
- F1 (ECO-23) MERGED: `design-system/` (fuente única, 47 comp. + `tokens/tokens.css`) + `em-ui/cli.mjs` (`list`/`add`/`update`/`init`/`diff`). La generación posterior reusa vía `em-ui add` (`design-system/registry.json`).
- SAT01 (`satellites/sat-cristian-garcia/`) es la **referencia de forma satélite** (rutas, estructura).
- Regla del design system: tokens semánticos, nunca hex crudos (`CONTRIBUTING.md:73-75`).

## Decisiones que resuelve

### D-A — Mecanismo de entrega del skill
`/satellite` se entrega como **skill conversacional** (en `.claude/skills/satellite/`) que orquesta el onboarding + invoca **scripts de soporte** (Node, sin red salvo los modos d/e) para las tareas mecánicas (fetch de URL, scrape IG best-effort, normalización del brief). El skill **pregunta**, los scripts **obtienen/validan**; el skill nunca decide datos del negocio por su cuenta.

### D-B — Los 5 modos de intake y cómo obtienen datos (regla dura: NO inventar)
- **(a) Cliente SIN diseño/marca:** se parte del **UI Core + estructura SAT01** como referencia; el skill **pregunta** datos reales (negocio, servicios/precios, contacto) y **propone** paletas/tipografías para que el cliente **elija** (propuesta ≠ invención: el cliente confirma).
- **(b) Cliente CON diseño/marca:** el cliente aporta sus **tokens** (colores/tipografía/logo); se mapean a la capa de tokens (`em-ui init`) — se **aplican**, no se inventan.
- **(c) Mejorar un sitio existente (clone-and-improve):** el skill **fetchea la URL** del cliente (script) y extrae **su** contenido/estructura/colores reales; reconstruye el plan con nuestros componentes. Lo que no se pueda extraer se **pregunta**.
- **(d) Perfil de Instagram:** la **vía primaria y fiable** es que el cliente aporte su **handle** y **confirme/pegue su propio contenido** (fotos/bio/stats) — es su cuenta, control y exactitud máximos. El **scrape es best-effort** (Playwright/Firecrawl/WebFetch): si funciona, **mejora/pre-rellena** lo que el cliente luego confirma; si falla o no está disponible, **no pasa nada** — se piden los datos. **ToS:** solo datos **públicos** de la **cuenta propia** del cliente, **sin** saltar auth-walls ni scrapear cuentas de terceros. Nunca se fabrican seguidores/bio (los no confirmados quedan `missing`/`proposed`).
- **(e) Páginas de inspiración:** URLs que el cliente aporta como **referencia de diseño** (no se copian datos; solo guían estética).
- **REGLA DURA (transversal):** colores/marca/contenido/IG entran al brief **solo** si el cliente los aporta o se **extraen** de una fuente real suya. Todo campo no resuelto queda marcado `missing` en el brief (no se rellena con invención).

### D-C — El brief estructurado (contrato hacia F2b)
Artefacto **`brief.json`** (schema versionado, p.ej. `schemaVersion`) con: identidad (nombre, sector, idioma), contacto, servicios/precios, tokens de marca (o `propose`), assets (rutas a fotos/logo reales o `placeholder`), rutas/secciones objetivo (derivadas de la estructura SAT01), modo de intake usado, y **procedencia por campo** (`provided` | `extracted:<fuente>` | `proposed` | `missing`). La procedencia hace auditable la regla "no inventar".

## Scope
- Skill `/satellite` (onboarding): la conversación de los 5 modos + el ensamblado del brief.
- Scripts de soporte: scrape IG (d), fetch de URL (c/e), normalización/validación del brief contra el schema.
- Schema del brief versionado + ejemplos.
- **NO** genera el satélite (ECO-25) ni toca `design-system/`/`em-ui/` (F1) ni despliega (F3).

## Acceptance Criteria
1. **Skill `/satellite` (onboarding)** existe y, conversacionalmente, conduce los **5 modos** (a–e) hasta un brief.
2. **`brief.json` validado** contra un **schema versionado**; incluye **procedencia por campo** (`provided`/`extracted`/`proposed`/`missing`).
3. **Regla "no inventar" verificable:** ningún campo de marca/contenido/IG queda con valor inventado — los no resueltos son `missing` o `proposed` (pendiente de confirmación del cliente). Test que falle si un dato sin fuente aparece como `provided`.
4. **Modo (d) Instagram:** el script extrae datos reales y, ante fallo, **degrada a preguntar** (no fabrica). Verificable con un fixture/fallback.
5. **Modo (c)/(e):** fetch de URL del cliente/inspiración alimenta el brief como `extracted`/referencia; sin red disponible, degrada a preguntar.
6. **Contrato estable:** el brief es consumible por F2b (ECO-25) sin ambigüedad (schema documentado).
7. **Gates verdes:** `gates` (incl. `check_strategy_link` con `Strategy: satellites`, `check_ticket_link` ECO-24), Security Pipeline / Security Gate, build + tests de lo afectado.

## Out of scope
- Generación del satélite y `em-ui add` (ECO-25, F2b).
- Automatización Jira/GitHub/Vercel y Lighthouse remoto (F3).
- Cambios en `design-system/` o `em-ui/` (F1, congelado).

## Alignment
Implementa el punto **1 (onboarding multi-modo)** del sistema `/satellite` del norte (`strategy/satellites.md` §Recommendation). Respeta: la **regla dura "no inventar"** (heredada del patrón destilado en la estrategia); **parte del UI Core + estructura SAT01** (no greenfield); el **brief como costura limpia** hacia F2b (consistente con la separación genérico/binding de ADR-006). No adelanta F3 (automatización). La decisión de enfoque se registra en [ADR-008](../adr/008-satellite-onboarding-generation.md).
</content>
