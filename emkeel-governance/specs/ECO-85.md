# ECO-85 — Fase 1: Storybook como catálogo visual gobernado del design-system + gate VRT

Strategy: satellite-design

## Resumen
Implementa [ADR-020](../adr/020-design-system-storybook-catalog.md): adoptar **Storybook 10.x** (MIT) como la **capa de visualización/catálogo gobernada** del `design-system/`. Cierra el **lazo de validación VISUAL** que faltaba en la fase 1 de [`satellite-design`](../strategy/satellite-design.md): los incrementos previos (Magic UI ECO-82, tokens ECO-83) están verificados **estructural/aislamiento** pero **no visualmente** — la fuente solo se valida al consumirla en un satélite. Storybook prueba que los componentes **buildan/renderizan** y da una **vitrina navegable**. **Complementa, no reemplaza** a em-ui/registry (que sigue siendo la verdad de DISTRIBUCIÓN: copia gobernada + grafo de deps + drift). **Aditivo y aislado**: el `design-system/` pasa a tener su propio `package.json` + `.storybook/`; **no toca el dashboard**.

## Decisiones que resuelve

### D — Storybook 10.x + `@storybook/nextjs-vite`, dentro de `design-system/`
El `design-system/` era fuente sin build; se le añade `package.json` + `.storybook/` propios (target buildable nuevo, gateable en CI). Framework `@storybook/nextjs-vite` (soporta el alias `@/`, `next/font`, `next/image`, Tailwind). Las deps externas que los componentes asumían del consumidor (react, lucide-react, framer-motion, motion, react-easy-crop, @marsidev/react-turnstile, clsx, tailwind-merge, next) se declaran aquí para que Storybook las resuelva.

### D — Tailwind v4 = wiring MANUAL (fricción anticipada, no out-of-box)
No hay recipe oficial v4 para Storybook. Se integra: `@tailwindcss/vite` en el `viteFinal` de `.storybook/main.ts` + import de `design-system/tokens/tokens.css` en `preview.ts`. Los aliases que la fuente asume del consumidor (`@/ -> <consumer>/src`) se mapean en Vite contra el árbol fuente: `@/components/ui → components`, `@/lib → lib`, `@/hooks → hooks`.

### D — VRT = test-runner de Storybook (Playwright, MIT), NO Chromatic
Snapshots visuales vía el hook `postVisit` (código propio), consistente con el VRT Playwright que ya corre en el repo. Se **descarta Chromatic** (SaaS comercial de pago) — coherente con "gobernado/propio, sin lock-in SaaS" (igual que el registry propio).

### D — Una story por componente, cobertura verificada vs `registry.json`
Un script de cobertura asegura que catálogo y registry no se desincronicen: **cada item del registry tiene una story O está en una lista de exclusión documentada**. Exclusiones de esta tanda: los componentes **app-coupled** que importan un `@/context/*` inexistente en la fuente (`useTheme.ts → @/context/ThemeContext`; `@/context/ToastContext`) → `ThemeToggle`, `TurnstileWidget`, `ToastContainer` (mismo criterio que CommandPalette en [ADR-006](../adr/006-satellite-component-reuse.md)). Se documentan, no se ocultan.

### D — addon a11y incluido
Encaja con el estándar a11y del pilar A.

## Scope
- `design-system/package.json` (deps de runtime de los componentes + devDeps Storybook 10 + addon a11y + test-runner + `@tailwindcss/vite`; scripts `storybook`, `build-storybook`, `test-storybook`, `coverage`).
- `design-system/tsconfig.json` (alias `@/*` + `jsx: react-jsx`).
- `design-system/.storybook/main.ts` (framework nextjs-vite + `viteFinal` con `@tailwindcss/vite` + aliases + a11y addon).
- `design-system/.storybook/preview.ts` (import `tokens.css`, parámetros a11y, fondos light/dark).
- `design-system/.storybook/test-runner.ts` (hook `postVisit` → snapshot VRT).
- Stories: los **4 de marketing** (AnimatedGradientText, Marquee, ShimmerButton, BlurFade) + una **muestra representativa de los 47** primitivos.
- `design-system/scripts/check-story-coverage.mjs` (cobertura stories vs registry, con exclusiones).
- Workflow CI: gate que **buildea Storybook + corre el coverage-check** (y el test-runner cuando hay browsers).
- `THIRD-PARTY-NOTICES.md` (paquetes del árbol Storybook) + `scripts/check-licenses.mjs` allow-list si aparecen `unknown` revisados.
- Scripts root (`package.json`): `sb:build`, `sb:test`, `sb:coverage` → delegan en `design-system/`.

## Acceptance Criteria
1. **Storybook buildea**: `npm run build-storybook` (en `design-system/`) produce `storybook-static/` sin error → prueba que los componentes renderizan/compilan.
2. **Wiring Tailwind v4**: las stories muestran los componentes con los tokens aplicados (clases Tailwind resueltas vía `@tailwindcss/vite` + `tokens.css` importado en `preview.ts`).
3. **Stories**: existen las 4 de marketing + ≥1 muestra de primitivos; cada story usa el componente real de la fuente (`@/components/ui/*`).
4. **Cobertura (sincronía, con dientes pero honesta del alcance "muestra")**: `check-story-coverage.mjs` clasifica cada item de `registry.json` en **cubierto / excluido (app-coupled) / pendiente** y **FALLA** si (a) una story referencia un componente que no está en el registry (huérfana/desync), o (b) una exclusión declarada ya no es app-coupled. Reporta el **pendiente completo** (sin truncado silencioso). La cobertura total de los 47 es incremento siguiente (ADR-020).
5. **a11y**: addon a11y activo en Storybook.
6. **Gate CI**: un job nuevo buildea Storybook + corre el coverage-check; verde-bloqueante en PRs que tocan `design-system/`.
7. **Aislamiento**: **Dashboard-VRT verde**; suites api/dashboard verdes; `dup:check` verde; el dashboard **no** se toca.
8. **Licencias**: `npm run lic:check` verde sobre el árbol nuevo (los `unknown` revisados → `--allow` por paquete); `THIRD-PARTY-NOTICES` actualizado.
9. **Gates** verdes (`Strategy: satellite-design`, ticket ECO-85), Security Pipeline.

## Out of scope
- **Stories de los 47 primitivos completos** — esta tanda siembra las de marketing + muestra; la cobertura total (una story rica por componente) es incremento siguiente. El coverage-check exige cobertura O exclusión, no riqueza.
- **VRT con baselines comprometidas** — el test-runner + `postVisit` quedan cableados; generar/commitear el set de baselines visuales es trabajo posterior (requiere browsers en CI; se corre cuando estén). El gate de esta tanda = build + coverage.
- **Deploy del Storybook** como sitio de referencia interno (ADR-020 §Consecuencias, opcional).
- **Componentes app-coupled** (Theme/Toast/Turnstile) — necesitan providers de contexto que no viven en la fuente; excluidos documentados.
- Tocar el dashboard o re-pull-ear primitivos base (ADR-019: aditivo).

## Alignment
Materializa [ADR-020](../adr/020-design-system-storybook-catalog.md) (decisión arquitectónica de la **fase 1** de [`satellite-design`](../strategy/satellite-design.md)): cierra el **lazo VISUAL** que el panel adversarial marcó como faltante (los incrementos previos solo verificados en estructura/aislamiento). Honra el principio **gobernado/propio sin lock-in SaaS** (test-runner Playwright propio, no Chromatic — igual que registry propio vs adoptar uno). Honra **ADITIVO y AISLADO** ([ADR-019](../adr/019-design-system-upstream-shadcn.md): superficie nueva, no muta el dashboard; Dashboard-VRT lo prueba) y el **guardrail de licencias** de [ECO-81](ECO-81.md) (lic:check + THIRD-PARTY-NOTICES sobre el árbol nuevo). Complementa em-ui/registry sin reemplazarlo (distribución vs visualización). No re-litiga el pilar A.
