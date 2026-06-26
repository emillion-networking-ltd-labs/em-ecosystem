# ADR-018 — Generador de diseño de satélite (pilar B): composición gobernada + theming por tokens + motion + adherence-gate, sirviendo al estándar

- Status: accepted
- Date: 2026-06-26
- Ticket: [ECO-79](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-79)
- Strategy: satellite-design
- Deciders: Operador (human gate vía review + merge del PR #480 de la lane strategy, 2026-06-26)
- Contexto de gobierno: repo gobernado por Emkeel (ver `AGENTS.md`). Materializa la estrategia aprobada [`strategy/satellite-design.md`](../strategy/satellite-design.md), conducida por `/strategy` con **panel adversarial de 4 lentes DE SERIE** (emkeel 0.1.101) — reality outcome `mixed` honesto, registrado en `satellite-design.process.json`. SIRVE al pilar A ([ADR-017](017-satellite-quality-living-standard.md)); llega tras el retiro de la línea fallida ([ADR-016](016-satellite-design-line-retirement.md)).

## Contexto
El pilar A (ADR-017) define QUÉ debe cumplir un satélite. Falta decidir CÓMO la IA genera el diseño que lo cumple — sin recaer en plantilla, que mató la línea vieja. El panel corrigió el diagnóstico: G3/ECO-75 **ya componía sin plantillar** (no-determinista) y aun así falló **por NO-belleza** (`016:11`), con el token-audit en verde — así que "componer + auditar tokens" NO es por sí solo el anti-relapse. Y midió que el `design-system/` actual es **anémico** (8 secciones × 1 variante; tokens de dashboard; el único satélite bello no lo usa).

## Decisión
Adoptar la **Opción 2**: la IA **compone libremente** (qué secciones/orden/énfasis, preset por sector) y **tematiza por tokens**, sobre componentes/secciones gobernados (props/variantes finitas) + primitivas de motion a11y-safe; un **adherence-gate** (AST-estrecho) impide el drift. La libertad vive en composición + theming (donde los kits y el mercado la ponen con seguridad); la gobernanza en componentes/tokens/closed-sets. Cero determinismo en "decidir".

**Condiciones innegociables (del panel):**
- **PRERREQUISITO — crecer el design-system ANTES de gatear:** tokens de marketing (tipografía fluida hasta display), theming multi-stop, slots de decoración gobernados, layout primitives, una pieza-estrella POR preset, familias tipográficas por sector. Sin esto el gate suspende su propio Hero y converge a plantilla.
- **Gate ANTI-PLANTILLA con dientes** (diferenciación de belleza/sector, espejo del "expresividad real" de ADR-015 §5), no solo adherencia.
- **Gates en forma AST-estrecha y real:** adherence = cero literales de color en `className`/`style` (color solo por token), no "sin one-offs"; motion confinado a primitivas gobernadas + `<MotionConfig reducedMotion="user">` + `@media reduce`.
- **Unidad de versionado = el GENERADOR**, no la generación: el satélite generado se congela como artefacto commiteado y se re-valida contra `satellite-quality`, no se regenera.
- **Gate visual humano = el casillero de diseño que el pilar A reservó** (un único required-check).
- **Hechos-no-inventados + omit-if-absent** preservados.

## Fase 1 — adoptar una base abierta permisiva (no construir desde cero)
Crecer el design-system tomando **shadcn/ui + Magic UI + Aceternity-free + tweakcn** (todas MIT/Apache, fuertes en marketing/animación) como **upstream que alimenta `design-system/` vía em-ui** — ADITIVA y AISLADA (no toca el dashboard, que renderiza de su copia em-ui; el único eje compartido son los tokens, guardado por el required-check Dashboard-VRT). **Línea legal verde:** MIT/Apache/BSD/ISC/OFL conservando avisos en `THIRD-PARTY-NOTICES`; **veta** Tailwind Plus (prohíbe "website builders") y copyleft GPL/AGPL; cautela Preline + tiers Pro.

## Consecuencias
- Los specs de features de diseño declaran `Strategy: satellite-design` (gate `check_strategy_link`).
- **Requiere un ADR nuevo que refine [ADR-006](006-satellite-component-reuse.md)/[ADR-007](007-design-system-source-location.md):** declarar shadcn como origen upstream del `design-system/` (em-ui YA es el modelo shadcn, `006:22-26`; adoptar AUMENTA/CONVIVE, no reemplaza) — en su lane `strategy/`.
- Implementación por fases (tickets feat): fase 1 = crecer el design-system adoptando la base; luego el generador (composición+preset+theming+motion) + adherence-gate + gate anti-plantilla.
- Decisiones por-caso del operador: qué base abierta exacta, el ADR upstream, los presets por sector.
