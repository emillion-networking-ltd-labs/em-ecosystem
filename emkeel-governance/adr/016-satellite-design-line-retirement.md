# ADR-016 — Retiro de la línea de diseño de satélite (skill + estrategias + ADRs); pizarra limpia, el PRODUCTO sigue vivo

- Status: accepted
- Supersedes: ADR-008, ADR-009, ADR-010, ADR-011, ADR-012, ADR-013, ADR-015
- Date: 2026-06-26
- Ticket: [ECO-77](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-77)
- Deciders: Operador (human gate vía review + merge del PR de la lane strategy, 2026-06-26)
- Contexto de gobierno: repo gobernado por Emkeel (ver `AGENTS.md`). Esta ADR **retira** el norte de satélite (`strategy/satellites.md` + `strategy/satellite-builders.md`) y el sistema que lo materializaba; va en una lane `strategy/` (su propio ticket, human-approved), como exige el gate `check_strategy_change`.

## Contexto
La línea de diseño de satélite vía **generación/composición por IA** (onboarding → brief → generador, y su evolución a IA-diseñador G1…G5) no produjo sitios buenos. El hito que lo cerró: el **gate visual de G3 (ECO-75) falló** — la composición resultaba incoherente y de baja calidad. El anti-relapse técnico funcionaba (la IA componía, no plantillaba), pero el resultado no era profesional. Iterar sobre esa base habría arrastrado el sesgo del enfoque fallido.

Decisión del operador: **no replantear sobre la línea fallida, sino retirarla** y reconstruir una línea nueva con la pizarra limpia. El **producto satélite sigue siendo un objetivo vivo** — esto retira un ENFOQUE, no la ambición.

## Decisión
Retirar, en un solo cambio atómico en lane `strategy/`:

1. **Las dos estrategias** `emkeel-governance/strategy/satellites.md` y `satellite-builders.md` (con sus `.process.json`) — borradas como retiro limpio (par doc+sidecar), permitido por `check_strategy_process` desde emkeel 0.1.99 (KEEL del retiro).
2. **El skill** `.claude/skills/launch-satellite/` completo — incluye los motores `capture/`, `model/` y `standard/` que vivían dentro de `scripts/builders/`.
3. **El workflow** `.github/workflows/satellite-lighthouse.yml` — existía solo para medir Lighthouse sobre un satélite generado por el skill; sin skill queda sin sujeto.
4. **Supersede** las ADRs que decidieron este enfoque: ADR-008, ADR-009, ADR-010, ADR-011, ADR-012, ADR-013, ADR-015 (ADR-014 ya estaba superseded por ADR-015 — la cadena 014→015→016 cuenta la historia).

## Qué SOBREVIVE (lo reusable — NO re-derivar desde cero)
- **`design-system/`** completo: `registry/` (fuente + registry de componentes em-ui) y `sections/` (biblioteca de secciones nivel-2). Son bloques reutilizables; la línea nueva podrá apoyarse en ellos.
- **`satellites/sat-cristian-garcia/`** — satélite real desplegado, vivo en producción.
- **`docs/satellite-deployment-runbook.md`** — referencia de despliegue, vigente.
- **[ADR-006](006-satellite-component-reuse.md)** (reuse de componentes) y **[ADR-007](007-design-system-source-location.md)** (ubicación del design-system) — **intactas**: deciden la casa de los bloques reutilizables, no el enfoque retirado.
- Los jobs `discover-satellites` de Security y Visual-Regression — escanean `satellites/sat-*`, que se queda.

## Consecuencias
- La línea nueva de satélite arranca sin estrategia ni ADR de enfoque heredados: se diseñará y aprobará por su propia lane `strategy/`, sin el sesgo de lo retirado.
- Las ADRs superseded quedan como registro histórico (por qué se intentó y por qué no surtió), no como guía vigente — su `Status: superseded` lo deja explícito para cualquier agente futuro.
- No se pierde nada reutilizable: el design-system y el satélite real son la base sobre la que construir.
