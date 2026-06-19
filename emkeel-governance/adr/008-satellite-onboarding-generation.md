# ADR-008 — Skill `/satellite`: brief-driven (onboarding) + generación por reuse (no greenfield)

- **Estado:** Aceptada
- **Fecha:** 2026-06-19
- **Tickets:** [ECO-24](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-24) (F2a onboarding), [ECO-25](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-25) (F2b generación)
- **Strategy:** satellites
- **Decisor:** Operador (human gate, 2026-06-19)
- **Contexto de gobierno:** repo gobernado por Emkeel (ver `AGENTS.md`). Materializa la Fase 2 del norte (`strategy/satellites.md` §Recommendation, punto sistema `/satellite`) sobre la base de [ADR-006](006-satellite-component-reuse.md)/[ADR-007](007-design-system-source-location.md) (reuse via em-ui desde `design-system/`).

## Contexto
La Fase 2 construye el sistema de facilitación `/satellite`: onboarding (5 modos) + generación. Dos riesgos a gobernar: (1) que la IA **fabrique** datos del negocio (contrario a la regla del norte "no inventar"); (2) que la generación haga **greenfield** o copia manual, rompiendo el reuse gobernado de F1.

## Decisión

1. **Arquitectura brief-driven con costura limpia.** El skill se parte en dos entregables con un **contrato explícito**: onboarding (ECO-24) produce un **`brief.json`** (schema versionado, con **procedencia por campo**); generación (ECO-25) **consume** ese brief. El brief es la costura — misma filosofía genérico/binding de ADR-006. Permite revisar/entregar cada mitad por separado.

2. **Onboarding = preguntar/extraer, nunca inventar.** Los 5 modos obtienen datos así: (a) sin-diseño → preguntar + **proponer** paletas (cliente elige); (b) con-marca → **aplicar** sus tokens; (c) mejorar-sitio → **fetch** de su URL (extraer); (d) Instagram → cliente aporta handle + **confirma/pega su contenido** (vía primaria); **scrape best-effort** de datos públicos de su cuenta como mejora; (e) inspiración → URLs solo como referencia estética. Cada campo del brief lleva procedencia `provided|extracted|proposed|missing`; **no existe `invented`**. Un dato sin fuente real queda `missing`/`proposed`, jamás `provided`.

3. **Generación = reuse, no greenfield.** El motor: scaffold de **forma satélite** desde la estructura **SAT01** (S2-ready) + **`em-ui add`/`init`** desde `design-system/` como **única** vía de UI (invariante de ADR-006/007: jamás copia manual, jamás dashboard) + relleno desde el brief (los `missing` → placeholders visibles).

4. **"Hasta S2" en F2 = S2-ready + validación local.** F2b entrega un satélite con el hardening S2 y lo valida en local (`next build` + Lighthouse local). El **deploy/provisión remota y el Lighthouse remoto** (el "lanzado" formal) son **F3** — frontera explícita.

## Alternativas descartadas
- **Generación greenfield (LLM dibuja la UI desde cero).** Rompe el single-source y el reuse gobernado; reintroduce drift que F1 resolvió. Descartada.
- **Un solo entregable F2 monolítico.** Onboarding y generación son dos piezas grandes; sin la costura del brief, el review y la entrega se acoplan. Se parte en ECO-24/ECO-25.
- **Onboarding que rellena huecos con datos plausibles.** Viola la regla dura "no inventar". Descartada: los huecos son `missing`/`proposed`.

## Consecuencias
- Dos tickets en Sprint 6: ECO-24 (onboarding→brief) y ECO-25 (brief→satélite S2-ready), secuenciales.
- El brief.json (schema versionado) queda como contrato estable y auditable (procedencia).
- La generación hereda el invariante de reuse: todo satélite nace de `em-ui add` desde `design-system/`.
- F3 (deploy + automatización Jira/GitHub/Vercel + Lighthouse remoto + cierre de los 2 huecos de CI) se construye encima, fuera de F2.

## Notas
- Decisión aprobada por el operador en el human gate de la planificación de F2 (2026-06-19). El "cómo" detallado de cada mitad vive en sus specs (`specs/ECO-24.md`, `specs/ECO-25.md`).
- Refinamiento del gate: en el modo (d) Instagram, la vía **primaria y fiable** es que el cliente aporte su handle y **confirme/pegue su propio contenido** (es su cuenta); el scrape es **best-effort** (mejora si funciona), solo datos **públicos** de la **cuenta propia**, sin saltar auth-walls (ToS).
</content>
