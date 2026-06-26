# ADR-019 — shadcn/ui (+ Magic UI / Aceternity-free / tweakcn) como ORIGEN UPSTREAM del `design-system/` (refina ADR-006/007)

- Status: accepted
- Date: 2026-06-26
- Ticket: [ECO-80](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-80)
- Strategy: satellite-design
- Deciders: Operador (human gate vía review + merge del PR de la lane, 2026-06-26)
- Contexto de gobierno: repo gobernado por Emkeel (ver `AGENTS.md`). Implementa la **fase 1** de la estrategia aprobada [`strategy/satellite-design.md`](../strategy/satellite-design.md) / [ADR-018](018-satellite-design-generator.md): crecer el design-system adoptando una base abierta permisiva ANTES de construir el generador. **Refina** (no supersede) [ADR-006](006-satellite-component-reuse.md) y [ADR-007](007-design-system-source-location.md).

## Contexto
El pilar B (ADR-018) decidió que el design-system actual es demasiado anémico (8 secciones × 1 variante, tokens de dashboard) para producir belleza, y que la fase 1 es **adoptar una base abierta permisiva** en vez de construir desde cero. Falta una decisión que ningún ADR cubre: **de dónde NACE el UI Core upstream y cómo se reconcilia con ese upstream.**
- ADR-006 ya define el mecanismo de reuse como "registry + CLI estilo shadcn/ui (`em-ui`): copia GOBERNADA con reconciliación" — `emkeel-governance/adr/006-satellite-component-reuse.md:22-26`. **em-ui YA ES el modelo shadcn**, internalizado.
- ADR-007 fija que el UI Core sale de `design-system/`, NUNCA del dashboard (invariante codificado en `design-system/registry/cli.mjs`) — `emkeel-governance/adr/007-design-system-source-location.md:19-21`.
- Hoy el origen declarado de ese `design-system/` es un snapshot propio del dashboard (`adr/007:19`) — la causa de la anemia.

## Decisión
Declarar **shadcn/ui como el origen UPSTREAM** del `design-system/`, **aumentando y conviviendo** con em-ui (NO lo reemplaza). El `design-system/` sigue siendo la **fuente única** que em-ui distribuye a satélites/dashboard; shadcn pasa a ser **un proveedor upstream** que lo alimenta. Se suma la capa que falta: **Magic UI** y **Aceternity-free** (marketing/animación) y **tweakcn** (theming/diferenciación por satélite).

Mecánica gobernada:
- **Adoptar hacia `design-system/`, no hacia los consumidores:** pull-ear componentes shadcn vía su CLI a `design-system/`, regenerar `design-system/registry.json` con `build-registry.mjs`; em-ui sigue distribuyendo. (Los registries de shadcn son isomorfos a nuestro registry — `registryDependencies` + cierre transitivo.)
- **Theming por tokens, no fork:** re-marcar = sobrescribir tokens (el modelo que ya tenemos en `design-system/tokens/tokens.css`), no editar componentes.
- **Reconciliación del nuevo eje de drift:** se añade `design-system/`↔shadcn-upstream (además del existente consumidor↔`design-system/`). `em-ui diff`/`update` ES el mecanismo de port y reconciliación (distingue regresión de personalización).
- **Acoplamiento a Tailwind:** ya pagado (Tailwind v4 — `tokens.css` ya hace `@import 'tailwindcss'`).

Condiciones (de la estrategia):
- **ADITIVA y AISLADA:** se añade la capa marketing + tokens NUEVOS **sin mutar** los componentes-app ni los **valores de token** que consume el dashboard (su copia em-ui en `nexacore-dashboard/src/components/ui/`); el required-check **Dashboard-VRT** bloquea cualquier propagación visual no intencionada.
- **Línea legal verde:** solo permisivas (MIT/Apache/BSD/ISC/OFL/CC0), avisos en `THIRD-PARTY-NOTICES`, gate **no-copyleft** (bloquea GPL/AGPL). **Veta** Tailwind Plus (su licencia prohíbe "website builders"); **cautela** Preline (Fair-Use + atribución) y tiers Pro (no redistribuibles).

## Por qué refina y no supersede ADR-006/007
ADR-006/007 deciden CÓMO se distribuye el UI Core y que su fuente es `design-system/` — ambas siguen vigentes. ADR-019 solo decide **de dónde nace upstream** ese `design-system/` (shadcn en vez de un snapshot del dashboard) y añade el eje de drift con upstream. Mantiene `design-system/` como fuente única que em-ui consume. (Igual que ADR-007 refinó a ADR-006 sin superseder.)

## Consecuencias
- Implementación por tickets feat (`Strategy: satellite-design`), **código pesado vía ventana scopeada**: (1) adoptar shadcn + Magic UI + Aceternity-free hacia `design-system/` y regenerar el registry; (2) crecer los tokens (tipografía display/familias, gradientes multi-stop, slots de decoración, layout primitives); (3) `THIRD-PARTY-NOTICES` + gate no-copyleft; (4) tweakcn para el theming por satélite.
- Cada paso bajo el invariante de gobierno: **todo entra por `design-system/` y se regenera el registry; nada se hand-edita en el consumidor**; Dashboard-VRT verde como prueba de aislamiento.
- Decisiones por-caso del operador: el set exacto de componentes a pull-ear, y los presets por sector (los decide el generador, pilar B).
