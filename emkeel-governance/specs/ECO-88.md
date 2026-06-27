# ECO-88 — Fase 1: tanda 2 de componentes de marketing (Aceternity-free, MIT)

Strategy: satellite-design

## Resumen
Séptimo incremento de la **fase 1** de [`satellite-design`](../strategy/satellite-design.md) ([ADR-018](../adr/018-satellite-design-generator.md)/[ADR-019](../adr/019-design-system-upstream-shadcn.md)): **engordar el vocabulario de marketing** adoptando una segunda tanda de componentes de **Aceternity UI free (MIT)** — continúa el arco de adopción que empezó con Magic UI (ECO-82). Se adoptan **verbatim** (fidelidad, como la tanda 1), con su atribución en `THIRD-PARTY-NOTICES`. **Aditivo y aislado** (ADR-019): 5 ficheros nuevos en `design-system/components/`, **cero deps npm nuevas**, no toca el dashboard. Visibles en el catálogo Storybook (ECO-85).

## Decisiones que resuelve

### D — 5 componentes Aceternity-free, adoptados verbatim (MIT)
Elegidos por ser **dependency-light** (solo `cn` + `motion/react`, ya presentes) y útiles para satélites:
- **`Meteors`** — lluvia de meteoros decorativa (motion + keyframe `meteor`).
- **`AuroraBackground`** — fondo animado de auroras (keyframe `aurora`).
- **`Spotlight`** — foco SVG decorativo (keyframe `spotlight`).
- **`TextGenerateEffect`** — revelado de texto palabra a palabra (motion `useAnimate`/`stagger`).
- **`BentoGrid` + `BentoGridItem`** — rejilla bento para destacar features (solo `cn`).

### D — Cero deps npm nuevas; los keyframes van a tokens.css (aditivo)
Ningún componente arrastra una dep nueva: usan `cn` (`lib/utils`) y `motion` (ya declarados). `BentoGrid` **no** arrastra `@tabler/icons-react` (eso era del *demo* del registry, no del componente; el icono entra por prop). Los keyframes `meteor`/`aurora`/`spotlight` (definiciones **verbatim** de Aceternity) se añaden a `tokens/tokens.css` como tokens `--animate-*` + `@keyframes` (aditivo, mismo patrón que ECO-82). `lic:check:ds` verde.

### D — Verbatim incluye sus colores propios
Los componentes traen sus colores/efectos originales (slate/zinc/hex de Aceternity). Se conservan **verbatim** (fidelidad + cumplimiento MIT con atribución), como en la tanda 1. La alineación a tokens de marca, si se quisiera, es un refinamiento futuro — aquí se prioriza adoptar fiel.

## Scope
- `design-system/components/`: `Meteors`, `AuroraBackground`, `Spotlight`, `TextGenerateEffect`, `BentoGrid` (5 `.tsx` verbatim).
- `design-system/tokens/tokens.css` (append: `--animate-meteor-effect|aurora|spotlight` + sus `@keyframes`).
- `design-system/registry.json` (regenerado por `build-registry.mjs`; 69→74).
- `design-system/stories/marketing/` (5 stories).
- `design-system/THIRD-PARTY-NOTICES.md` (tanda 2 Aceternity).

## Acceptance Criteria
1. **Verbatim + atribución**: los 5 son la fuente de Aceternity sin alterar la lógica; `THIRD-PARTY-NOTICES` lista cada uno con origen + MIT + URL.
2. **Cero deps nuevas**: `design-system/package.json` sin cambios; `lic:check:ds` verde; `BentoGrid` sin `@tabler`.
3. **Keyframes**: `tokens.css` gana `--animate-meteor-effect`/`aurora`/`spotlight` + `@keyframes` (append puro, 0 tokens previos alterados).
4. **Registry**: regenerado (74 items), los 5 = `registry:ui` + `internalDependencies: ["lib/utils.ts"]`; closure `node --test` 5/5.
5. **Storybook**: `build-storybook` verde (los 5 renderizan/compilan); `coverage` verde (26 con story).
6. **Aislamiento**: **Dashboard-VRT verde**; suites api/dashboard verdes; `dup:check` verde; el dashboard **no** se toca.
7. **Gates** verdes (`Strategy: satellite-design`, ticket ECO-88), Security Pipeline.

## Out of scope
- **Alinear los colores verbatim a tokens de marca** — refinamiento futuro (aquí se adopta fiel).
- Más componentes Aceternity / otras fuentes (tweakcn) — incrementos siguientes.
- **Consumir** los componentes en un satélite + baselines VRT + cobertura total de stories (deuda ECO-85).
- Tocar el dashboard o re-pull-ear primitivos base (ADR-019: aditivo).

## Alignment
Continúa la **Fase 1 = ADOPTAR base abierta permisiva** de [`satellite-design`](../strategy/satellite-design.md) ([ADR-019](../adr/019-design-system-upstream-shadcn.md) §Decisión: "shadcn/ui + Magic UI + **Aceternity-free** + tweakcn, todas MIT/Apache, como upstream que alimenta `design-system/`"). Engorda el vocabulario de marketing/animación tras la tanda 1 (Magic UI, [ECO-82](ECO-82.md)). Honra la **línea legal verde** (solo permisivas MIT; tier Pro vetado por no-redistribuible — el guardrail de [ECO-81](ECO-81.md) lo verifica) y **ADITIVO y AISLADO** ([ADR-019](../adr/019-design-system-upstream-shadcn.md): cero deps, no muta el dashboard; Dashboard-VRT lo prueba). Visibles/verificables en el catálogo [ECO-85](ECO-85.md). No re-litiga el pilar A.
