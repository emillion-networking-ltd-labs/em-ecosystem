# ECO-83 — Fase 1.3: crecer tokens de marketing del design-system (display type + familias + gradientes)

Strategy: satellite-design

## Resumen
Tercer incremento de la **fase 1** de [`satellite-design`](../strategy/satellite-design.md) ([ADR-018](../adr/018-satellite-design-generator.md)/[ADR-019](../adr/019-design-system-upstream-shadcn.md)): **crecer los tokens de marketing** del design-system — el prerrequisito que el panel adversarial marcó como el corazón de la belleza (el design-system tenía tokens de DASHBOARD: `--text-h1` tope 24px, un solo `--font-sans`, `--color-accent == --color-accent-dark` → gradiente plano). Se **cosechan del benchmark `sat-cristian-garcia`** (el satélite bello: `.text-display` con `clamp()` fluido, tracking negativo, `--font-display`), no se inventan. **Aditivo y aislado** (ADR-019): append puro a `tokens.css`, **ningún token existente alterado**, no toca el dashboard.

## Decisiones que resuelve

### D — Escala DISPLAY fluida (marketing), cosechada del benchmark
`--text-display-1/2/3` con `clamp()` (de ~2.5rem a ~5rem el mayor), `line-height` ajustado (1.0–1.12) y `letter-spacing` negativo (−0.03 a −0.015em) — el estilo del `.text-display` del benchmark, extendido a una escala. La base `--text-h1..caption` (dashboard) se queda intacta para la app.

### D — Familias display/serif por sector (contrato con next/font del consumidor)
`--font-display` y `--font-serif` (Tailwind `@theme`) referencian la **cara real** que el satélite inyecta vía `next/font` como `--font-display-face` / `--font-serif-face`, con fallbacks de sistema. Habilita que un restaurante elegante (serif) y un gym (sans potente) difieran tipográficamente — el panel: "el sector es preset multi-eje, no tema de color".

### D — 2º acento + gradientes de marca multi-stop (atmósfera)
`--color-accent-2` (tematizable por satélite) + `--gradient-brand` / `--gradient-brand-radial` (vars planas, usables con `[background-image:var(--gradient-brand)]`). Resuelve el "gradiente plano" (accent==accent-dark) que el panel señaló; cada satélite puede repintar la atmósfera vía tokens, no editando componentes.

## Scope
- `design-system/tokens/tokens.css` (append: 1 bloque `@theme` con familias + escala display + accent-2, y un `:root` con los gradientes). **Append puro**, 0 líneas eliminadas.

## Acceptance Criteria
1. **Escala display**: `--text-display-1/2/3` con `clamp()` + `--line-height` + `--letter-spacing` (convención Tailwind v4, como `--text-h1`).
2. **Familias**: `--font-display` y `--font-serif` con `var(--font-*-face)` + fallbacks; documentado el contrato next/font del consumidor.
3. **Gradientes**: `--color-accent-2` + `--gradient-brand` / `--gradient-brand-radial` tematizables vía `--color-accent`/`-2`.
4. **Aditivo**: `git diff` de `tokens.css` = **0 líneas eliminadas** (ningún token previo tocado).
5. **Aislamiento**: **Dashboard-VRT verde**; suites api/dashboard verdes; `dup:check` verde; registry anti-drift 5/5 (los tokens no afectan el grafo).
6. **Gates** verdes (`Strategy: satellite-design`, ticket ECO-83), Security Pipeline.

## Out of scope
- **Consumir** los tokens (un satélite que use `.text-display-1`/`font-display`/`--gradient-brand` + inyecte la cara vía next/font) — futuro. Validación visual = en consumo.
- Tanda 2 de componentes (Aceternity-free), slots de decoración gobernados, layout primitives, pieza-estrella por preset — **incrementos siguientes de fase 1**.
- Cambiar valores de token existentes o tocar el dashboard (ADR-019: aditivo).

## Alignment
Materializa el **PRERREQUISITO** de [`satellite-design`](../strategy/satellite-design.md) ([ADR-018](../adr/018-satellite-design-generator.md) §Condiciones: "crecer el design-system ANTES de gatear — tokens de marketing, theming multi-stop, familias tipográficas") cosechando del benchmark que el panel nombró (`sat-cristian-garcia`). Honra **ADITIVO y AISLADO** ([ADR-019](../adr/019-design-system-upstream-shadcn.md): no mutar tokens existentes ni el dashboard; Dashboard-VRT lo prueba). Empieza a cerrar la "anemia de tokens" del diagnóstico del panel. No re-litiga el pilar A.
