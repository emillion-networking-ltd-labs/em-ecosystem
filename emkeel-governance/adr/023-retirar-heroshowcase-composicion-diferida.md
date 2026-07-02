# ADR-023 — Retirar HeroShowcase: la composición de heroes se difiere hasta la capa de coherencia de marca

- Status: accepted
- Date: 2026-07-02
- Ticket: [ECO-114](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-114)
- Strategy: satellite-design
- Deciders: Operador (human gate vía review + merge del PR, 2026-07-02)
- Contexto de gobierno: repo gobernado por Emkeel (ver `AGENTS.md`). Revierte parcialmente [ADR-018](018-satellite-design-generator.md)/
  [ADR-019](019-design-system-upstream-shadcn.md) en lo tocante a la "pieza-estrella" compuesta (ECO-87).

## Contexto

ECO-87 entregó `HeroShowcase` como la **pieza-estrella**: un hero que se BELLEZA por **composición gobernada**
(compone layout primitives + slots decorativos + marketing + Button), parametrizable por `preset` de sector
(pilar B de `satellite-design`). ECO-114 intentó hacerlo **de verdad diferenciado** (presets distintos →
4 arquetipos immersive/aurora/bento/editorial).

Ambos intentos demostraron que **componer diseño de nivel hero no es fiable hoy** (en particular por IA):
jerarquía/proporción/estructura salen pobres, y faltan piezas de coherencia de marca — el **accent de marca
no se lee sobre fondos oscuros**, y el DS **no tiene** tokens de `scrim`/`on-media` ni de `accent-on-dark`.
El resultado compuesto era feo y de bajo contraste.

## Decisión

**Retirar `HeroShowcase` por completo** del design-system:
- Borrar `design-system/sections/HeroShowcase.tsx` y `design-system/stories/showcase/HeroShowcase.stories.tsx`.
- Regenerar `registry.json` (86 items; HeroShowcase era un `registry:section` hoja, nada dependía de él).
- **Mantener `design-system/sections/Hero.tsx`** como el hero del catálogo (hero básico de sección).
- El spec ECO-87 se conserva como **registro histórico** (documenta lo que se construyó y por qué se revierte aquí).

Regla derivada: enriquecer el catálogo **solo con elementos ÍNTEGROS ya diseñados** (harvest de componentes
completos de fuentes permisivas), **no** con composiciones que exijan criterio de diseño.

La **pieza-estrella compuesta vuelve solo cuando exista una "capa de coherencia" de marca** (tokens
`accent-on-dark`/`scrim`/`on-media` + reglas de contraste *encoded*/gate + guía que la IA lea al construir).
Esa capa es una **estrategia PENDIENTE**, en su propio lane `strategy/<KEY>` — no se lanza aquí.

## Consecuencias

- El catálogo deja de ofrecer una pieza-estrella "hero por composición"; la tesis del pilar B (belleza por
  composición) queda **diferida**, no abandonada — vuelve tras la capa de coherencia.
- `sections/Hero.tsx` es el hero disponible. Los satélites bespoke (p.ej. sat-cristian) siguen como benchmark.
- Menos superficie que mantener y cero riesgo de que la IA reuse una pieza de bajo contraste como "buena".
