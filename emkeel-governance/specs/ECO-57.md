# ECO-57 — Satélites F6: tipo de sitio + la IA propone la composición + válvula "la IA recomienda"

Strategy: satellites

## Resumen
Último pilar del norte (§Refinamiento ECO-52 / [ADR-010](../adr/010-satellite-design-generation.md), **pilares
P2 y P4**): materializa el "puzzle" de la **opción 3 híbrida** — la IA **PROPONE** la composición y el humano
**confirma**. Añade al onboarding la pregunta de **tipo de sitio**, el paso en que la IA **propone qué
secciones / en qué orden / con qué variante**, y la **válvula "que la IA recomiende"**; y hace que el generador
**honre la composición elegida** del brief (en vez del armado determinista), sin romper el guardrail
omit-if-absent.

## Contexto / base
- Onboarding (SKILL.md) ya pregunta **fidelidad** (D4) y **colorMode**, nunca auto-elige. El brief lleva
  intakeMode/intent/colorMode/identity/fields/targetRoutes.
- Catálogo de **8 secciones** (ECO-54/55); el generador las componía de forma **determinista** (orden fijo + if-data).

## Decisiones que resuelve

### D — `siteType` + `composition` en el brief
- **`siteType`** (`business-multipage | landing | portfolio | other`): lo elige el cliente en el onboarding
  (`provided`); el agente puede sugerirlo (`proposed`). Igual que fidelidad/colorMode: **nunca auto-elegir**.
- **`composition`**: lista ordenada de `{section, variant?}` que la IA **propone** según tipo+negocio y el
  cliente **confirma** (capa `proposed`→`provided`). Es **creatividad** (§D4): nunca cambia los HECHOS.

### D — El generador honra la composición (omit-if-absent intacto)
La home se compone desde `composition` (explícita del brief) → si no, desde la **recomendada por tipo**
(`compositionFor(siteType)`, la cara de la válvula) → si no, el **default** (retrocompatible). El generador
**OMITE** cualquier sección sin datos reales (guardrail §D4): aunque la composición pida Pricing/Testimonials,
si el brief no trae precios/testimonios, no se compone — **jamás se fabrica**.

### D — Onboarding: pregunta de tipo + propuesta de composición + válvula (SKILL.md, prosa)
- Pregunta **siempre** el tipo (nunca auto-elige).
- La IA **propone** la composición (secciones/orden/variante) y el cliente confirma; **solo propone una sección
  si HAY datos reales** para ella (o propone recogerlos), nunca inventa contenido.
- **Válvula "que la IA recomiende / sorpréndeme"** en los menús de tipo y composición: aplica a
  diseño/estructura/secciones (capa `proposed`), **NUNCA a los hechos**.

## Scope
- `schema/brief.schema.json`: `siteType` + `composition` (opcionales).
- `scripts/lib/brief.mjs`: `SITE_TYPES`, `briefSiteType`, `briefComposition`, validación.
- `scripts/generate-satellite.mjs`: `compositionFor` + resolución + PAGE honra la composición (con variantes).
- `SKILL.md`: pregunta de tipo + propuesta de composición + válvula + guardrail.
- Tests (sin red). **NO** toca F1, las secciones, ni el SEO (ECO-56); el modelo de procedencia intacto.

## Acceptance Criteria
1. **Onboarding pregunta el tipo** (SKILL.md), nunca auto-elige; entra al brief como `siteType` (`provided`).
2. **La IA propone la composición** (prosa) y el cliente confirma → `composition` en el brief; **solo secciones
   con datos reales** (o propone recogerlos), nunca inventa contenido.
3. **Válvula "la IA recomienda"** documentada; aplica a diseño/estructura/secciones (`proposed`), **NUNCA a hechos**.
4. **El generador honra la composición:** compone en el orden/variante elegidos; sin `composition`, usa la
   recomendada por `siteType`; sin tipo, el default. **OMITE** secciones sin datos (guardrail §D4).
5. **Retrocompatible:** un brief sin `siteType`/`composition` genera **como hoy** (default).
6. **e2e:** (a) tipo "landing" + composición → compone esas secciones en ese orden/variante; (b) válvula/tipo →
   composición sensata sin inventar; (c) sección propuesta sin datos → omitida; `next build` verde.
7. **Gates verdes:** `gates` (`Strategy: satellites`, `check_ticket_link` ECO-57), Security Pipeline; tests skill+registry verdes.

## Out of scope
- Cambios en F1, en las secciones (ECO-54/55) o en el SEO (ECO-56).
- Una UI de preview/edición de la composición (el "preview" es el `next build` + Lighthouse del loop, ya existente).

## Alignment
Cierra el refinamiento del norte (`strategy/satellites.md` §Refinamiento ECO-52 / ADR-010 — **pilares P2 y
P4**): onboarding por **tipo de sitio** + la IA **propone** la composición (el humano confirma) + **válvula "la
IA recomienda"**. Honra el **split verdad/diseño** (§D4): la composición/tipo/variante son **creatividad**
(`proposed`→`provided`); los **hechos** nunca se tocan, y una sección sin datos reales **no se compone aunque se
proponga** — jamás se fabrica. Retrocompatible. No toca F1 ni el SEO.
