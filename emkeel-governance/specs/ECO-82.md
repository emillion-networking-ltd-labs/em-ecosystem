# ECO-82 — Fase 1.2: primera tanda de componentes de marketing (Magic UI, MIT) → design-system

Strategy: satellite-design

## Resumen
Segundo incremento de la **fase 1** de [`satellite-design`](../strategy/satellite-design.md) ([ADR-018](../adr/018-satellite-design-generator.md)/[ADR-019](../adr/019-design-system-upstream-shadcn.md)): **adoptar la primera tanda de componentes de MARKETING** desde Magic UI (MIT) hacia `design-system/` — la capa que el design-system (anémico, derivado del dashboard) no tenía. Aditivo y aislado (ADR-019): **no toca el dashboard** ni los valores de token existentes. Las fuentes se traen **verbatim** del registry oficial de Magic UI; el guardrail de licencias (ECO-81) y este `THIRD-PARTY-NOTICES` cubren el cumplimiento.

## Decisiones que resuelve

### D — `cn` util (clsx + tailwind-merge), estándar shadcn/Magic UI
`design-system/lib/utils.ts` exporta `cn`. Los componentes lo importan como `@/lib/utils` (lo rastrea el registry como dep interna). `clsx`/`tailwind-merge` son deps npm (MIT) que el satélite consumidor instalará.

### D — 4 componentes de marketing verbatim (Magic UI, MIT)
`AnimatedGradientText`, `Marquee`, `ShimmerButton` (CSS/Tailwind v4 puro) y `BlurFade` (reveal con desenfoque, usa `motion`). Nombres PascalCase para el registry. **Verbatim** (no parafraseados) — fidelidad de la fuente oficial.

### D — Keyframes/tokens de animación en `tokens/tokens.css` (aditivo, Tailwind v4)
`@theme inline { --animate-* }` + `@keyframes` (`gradient`/`marquee`/`marquee-vertical`/`shimmer-slide`/`spin-around`) que consumen los componentes. **Aditivo**: no altera ningún token existente; el dashboard tiene su propia copia y Tailwind v4 emite utilidades on-demand (no usadas → no emitidas).

### D — THIRD-PARTY-NOTICES del código adoptado
`design-system/THIRD-PARTY-NOTICES.md` registra la fuente (Magic UI MIT) + sus deps npm (clsx/tailwind-merge/motion, MIT) con URLs — cumple "conservar el aviso".

## Scope
- `design-system/lib/utils.ts` (cn).
- `design-system/components/{AnimatedGradientText,Marquee,ShimmerButton,BlurFade}.tsx` (verbatim).
- `design-system/tokens/tokens.css` (append: 5 keyframes + tokens `--animate-*`).
- `design-system/registry.json` (regenerado por `build-registry.mjs`: 55→59 items).
- `design-system/THIRD-PARTY-NOTICES.md`.

## Acceptance Criteria
1. **4 componentes + `cn`** presentes en `design-system/`, **verbatim** de Magic UI (MIT).
2. **Registry regenerado**: 59 items; los 4 nuevos con `type: registry:ui`; `AnimatedGradientText`/`Marquee`/`ShimmerButton` rastrean `lib/utils.ts` como dep interna.
3. **Keyframes aditivos** en `tokens.css`: los 5 `@keyframes` + `--animate-*`; **ningún token existente alterado**.
4. **Cumplimiento**: `THIRD-PARTY-NOTICES.md` con las 5 fuentes + 3 deps npm (todas MIT); `npm run lic:check` (repo) sigue verde.
5. **Aislamiento**: **Dashboard-VRT verde** (no se tocó el dashboard); suites api/dashboard verdes; `dup:check` verde.
6. **Gates** verdes (`Strategy: satellite-design`, ticket ECO-82), Security Pipeline.

## Out of scope
- **Consumir** estos componentes en un satélite (instalar `motion`/`clsx`/`tailwind-merge`, usarlos en una página) — futuro (el generador del pilar B / un satélite concreto).
- Validación visual/build de los componentes — ocurre al consumirlos (el design-system es fuente, validada en consumo, como sus 47 componentes existentes).
- Tanda 2 (Aceternity-free) + crecer tokens (tipografía display/familias, gradientes multi-stop, slots, layout primitives) — **fase 1.3**.
- Cualquier cambio a componentes-app o valores de token existentes (ADR-019: aditivo).

## Alignment
Materializa la **fase 1** de [`satellite-design`](../strategy/satellite-design.md) ([ADR-019](../adr/019-design-system-upstream-shadcn.md) §Decisión: adoptar la base abierta permisiva hacia `design-system/` vía em-ui, **ADITIVA y AISLADA**). Empieza a cerrar la brecha "design-system anémico" que el panel adversarial diagnosticó (ADR-018: falta capa de marketing/animación). Honra la **línea legal verde** (solo MIT, THIRD-PARTY-NOTICES) y el guardrail de ECO-81. No re-litiga el estándar del pilar A.
