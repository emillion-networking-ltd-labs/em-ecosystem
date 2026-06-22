# ECO-54 — Satélites F4: biblioteca de secciones nivel-2 (el generador compone desde ellas)

Strategy: satellites

## Resumen
Materializa la **Fase 4** del norte (refinamiento ECO-52 / [ADR-010](../adr/010-satellite-design-generation.md),
**opción 3 híbrida**): el generador deja de emitir **bloques pelados/stub** y **compone** la página desde una
**biblioteca de secciones diseñadas y parametrizadas** (nivel 2), distribuidas por el registry igual que los
átomos de nivel 1. **Batch 1: Hero, Services, CTA, Contact.** Cierra el "esqueleto" que dejó el piloto Grupo
Atis (subpáginas en stub, sin diseño/marca).

## Contexto / base
- F1 (em-ui) + F2 (`/launch-satellite`) en main; el reorg ECO-53 dejó el registry en `design-system/registry/`.
- El generador (`generate-satellite.mjs`) emitía `<section>` pelados + stub "Ruta X"; las secciones BUENAS
  existían **solo hechas a mano** en `satellites/sat-cristian-garcia/src/components/sections/`.
- El token layer (`em-ui init`) provee semánticos (`accent`=marca, `content`, `surface`, `border`) +
  tipografía `text-h1..caption`; **no** `card-flat`/`text-display` (app-specific) → las secciones deben ser
  autosuficientes.

## Decisiones que resuelve

### D — Secciones nivel-2 parametrizadas, distribuidas por el registry
`design-system/sections/{Hero,Services,CTA,Contact}.tsx`: mismo diseño/animaciones/responsive/a11y que SAT01,
pero **contenido por props** (desde el brief, nunca inventado); **marca de primera clase** vía el token
`accent`; **≥1 variante** por sección. **Autosuficientes** (token layer + Tailwind estándar + `useReveal`
propio). El registry las escanea (`type: registry:section`) y `em-ui add <Section>` jala la sección + su
**cierre transitivo de átomos** (Button/Badge) + su hook (internalDependency), misma vía que nivel 1.

### D — El generador compone
`em-ui add` de las 4 secciones; `globals.css` aplica los `brandTokens` del brief como override del token de
marca; `PAGE` compone Hero+Services+CTA (home), Contact (/contacto), etc. **Guardrail §D4:** solo hechos
`provided`/`extracted` (proposed fuera de réplica); lo ausente se **omite**, nunca se inventa contenido.

## Scope
- `design-system/sections/` (4 secciones) + `design-system/hooks/useReveal.ts`.
- Registry: `build-registry` escanea `sections/`; `cli destPathFor` mapea `sections/`→`components/sections/`; `registry.json` regenerado.
- `generate-satellite.mjs`: compone desde secciones + aplica brandTokens.
- Tests (sin red) + build local. **NO** renombra `design-system`; **NO** toca F1 (átomos/tokens) ni la forma-SAT01.

## Acceptance Criteria
1. **Biblioteca nivel-2:** existen `design-system/sections/{Hero,Services,CTA,Contact}.tsx` parametrizadas
   (contenido por props), token-safe (capa de tokens + Tailwind estándar), con ≥1 variante y a11y/responsive.
2. **Distribución por registry:** `em-ui add <Section>` jala la sección (a `components/sections/`) + su cierre
   de átomos (Button/Badge a `components/ui/`) + su hook (`hooks/useReveal.ts`); `em-ui diff` sin drift.
3. **El generador COMPONE:** la página se arma desde las secciones rellenadas con el brief (no bloques pelados
   ni stub); la marca (`brandTokens`) se aplica al token `accent`.
4. **Guardrail no-inventar (§D4):** solo `provided`/`extracted` (proposed fuera de réplica); lo ausente se omite.
5. **End-to-end:** un satélite generado renderiza las 4 secciones reales con marca (no stubs); **`next build`
   verde** y **Lighthouse S2 verde** (gate por mediana, ECO-41). Tests del registry + de generación verdes.
6. **Gates verdes:** `gates` (`Strategy: satellites`, `check_ticket_link` ECO-54), Security Pipeline / Security Gate.

## Out of scope
- Las secciones restantes (Testimonials, Pricing, Portfolio, etc.) — Batch 2+.
- Cambios en F1 (`design-system/components`/`tokens`), en la forma-SAT01 o en el modelo de procedencia.
- Un formulario de contacto con backend (Contact es info+CTA con hechos reales; el form con endpoint es aparte).

## Alignment
Implementa la **Fase 4** del norte (`strategy/satellites.md` §«Refinamiento ECO-52» + §Fasificación F4, ADR-010
**opción 3 híbrida**): biblioteca de secciones determinista como **sustrato gobernado** + composición desde el
brief. Honra el **split verdad/diseño** (§D4: hechos `extracted`/`provided`, creatividad `proposed`; lo ausente
omitido, nunca fabricado), el **reuse vía em-ui** (ADR-006/007: secciones distribuidas por el registry, fuente
única `design-system/`) y la **forma-SAT01**. Sube el listón de calidad de diseño (P3: "remodel mejor que el
original") con secciones diseñadas y marca aplicada. No adelanta F5/F6 ni toca F1.
