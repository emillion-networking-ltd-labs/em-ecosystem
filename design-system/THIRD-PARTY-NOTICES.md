# THIRD-PARTY-NOTICES — design-system

Código de terceros **adoptado como fuente** en el design-system (ADR-019, fase 1 de `satellite-design`).
Todas las fuentes son de licencia **permisiva** (línea verde de la estrategia). Conservar este aviso cumple
la obligación de las licencias MIT (conservar el aviso de copyright) sin crédito visible en la UI.

## Componentes adoptados (fuente verbatim)

| Componente | Origen | Licencia | URL |
|---|---|---|---|
| `components/AnimatedGradientText.tsx` | Magic UI | MIT (© Magic UI) | https://magicui.design/r/animated-gradient-text.json |
| `components/Marquee.tsx` | Magic UI | MIT (© Magic UI) | https://magicui.design/r/marquee.json |
| `components/ShimmerButton.tsx` | Magic UI | MIT (© Magic UI) | https://magicui.design/r/shimmer-button.json |
| `components/BlurFade.tsx` | Magic UI | MIT (© Magic UI) | https://magicui.design/r/blur-fade.json |
| `lib/utils.ts` (`cn`) | Magic UI / shadcn | MIT | https://magicui.design/r/utils.json |

Licencia de Magic UI: MIT — https://github.com/magicuidesign/magicui/blob/main/LICENSE.md

### Tanda 2 — Aceternity UI (ECO-88)

| Componente | Origen | Licencia | URL |
|---|---|---|---|
| `components/Meteors.tsx` | Aceternity UI (© Manu Arora) | MIT | https://ui.aceternity.com/components/meteors |
| `components/AuroraBackground.tsx` | Aceternity UI (© Manu Arora) | MIT | https://ui.aceternity.com/components/aurora-background |
| `components/Spotlight.tsx` | Aceternity UI (© Manu Arora) | MIT | https://ui.aceternity.com/components/spotlight |
| `components/TextGenerateEffect.tsx` | Aceternity UI (© Manu Arora) | MIT | https://ui.aceternity.com/components/text-generate-effect |
| `components/BentoGrid.tsx` (`BentoGrid`/`BentoGridItem`) | Aceternity UI (© Manu Arora) | MIT | https://ui.aceternity.com/components/bento-grid |

Aceternity UI (componentes free): MIT — https://github.com/manuarora700/aceternity-ui. Adoptados **verbatim** (incluye sus
colores/keyframes propios). Solo componentes **free**; el tier Pro NO es redistribuible y no se usa. Los keyframes
`meteor`/`aurora`/`spotlight` que consumen viven (verbatim) en `tokens/tokens.css` (aditivos, ECO-88). `BentoGrid` NO
arrastra `@tabler/icons-react` (eso era solo del demo del registry); el icono entra por prop.

### Tanda 3 — Magic UI + Aceternity (ECO-101)

| Componente | Origen | Licencia | URL |
|---|---|---|---|
| `components/NumberTicker.tsx` | Magic UI | MIT (© Magic UI) | https://magicui.design/r/number-ticker.json |
| `components/AnimatedTestimonials.tsx` | basado en Aceternity UI (© Manu Arora) | MIT | https://ui.aceternity.com/components/animated-testimonials |
| `components/CardHoverEffect.tsx` (`CardHoverEffect`) | basado en Aceternity UI (© Manu Arora) | MIT | https://ui.aceternity.com/components/card-hover-effect |

`NumberTicker`: lógica/animación **verbatim**; solo theming a token (text-content-primary). `AnimatedTestimonials` y
`CardHoverEffect`: estructura/animación de Aceternity pero **RECONSTRUIDOS sobre los primitivos del design-system** —
los controles del carrusel son `IconButton` (variant boxed, shape circle, spinOnHover), la tarjeta es el primitivo
`Card`, la tipografía usa la escala (text-h1/h3/body/caption) y el color va por tokens (content/surface/border), sin
crudos. Usan solo `motion` + `cn` (+ `lucide-react` en Testimonials, ya presente); NO arrastran `@tabler/icons-react`.
Cero dependencias npm nuevas.

### Tanda 4 — texto animado de hero (ECO-105)

| Componente | Origen | Licencia | URL |
|---|---|---|---|
| `components/WordRotate.tsx` | Magic UI | MIT (© Magic UI) | https://magicui.design/r/word-rotate.json |
| `components/TypingAnimation.tsx` | Magic UI | MIT (© Magic UI) | https://magicui.design/r/typing-animation.json |
| `components/FlipWords.tsx` | Aceternity UI (© Manu Arora) | MIT | https://ui.aceternity.com/components/flip-words |

`WordRotate`: VERBATIM (sin color crudo). `TypingAnimation`: lógica verbatim; se quita el `leading-20`
arbitrario (line-height fuera de la escala) y el cursor usa el keyframe `blink-cursor`
(`--animate-blink-cursor`) añadido a `tokens.css` (append). `FlipWords`: estructura/animación verbatim; el
color crudo `text-neutral-900 dark:text-neutral-100` → token `text-content-primary`. Todos solo `motion` +
`cn` (ya presentes). Cero dependencias npm nuevas.

### Tanda 5 — CTAs de marketing + fondo (Tier 3, ECO-106)

| Componente | Origen | Licencia | URL |
|---|---|---|---|
| `components/PulsatingButton.tsx` | Magic UI | MIT (© Magic UI) | https://magicui.design/r/pulsating-button.json |
| `components/InteractiveHoverButton.tsx` | Magic UI | MIT (© Magic UI) | https://magicui.design/r/interactive-hover-button.json |
| `components/Ripple.tsx` | Magic UI | MIT (© Magic UI) | https://magicui.design/r/ripple.json |

Los dos CTAs usan el esquema de color del `Button` primary (NO el accent): `bg-primary`/`text-primary-foreground`
→ `surface-inverse`/`content-inverse`, y la misma redondez del `Button` del sistema (`rounded-md`, no la
`pill`/`lg` del original — sin redondez huérfana). `PulsatingButton`: reconstruido — el pulso = halo `box-shadow`
que late (keyframe `button-pulse` añadido a `tokens.css`, append); se omiten la variante `ripple` y el
`useLayoutEffect` de sync `--bg` del original (innecesario con color por token). `InteractiveHoverButton`: verbatim salvo colores → tokens
(`surface-primary`/`content-primary`/`surface-inverse`/`content-inverse`/`border-components`) y flecha lucide
`size-4`. `Ripple`: verbatim salvo `bg-foreground/25` + `var(--foreground)` → token `content-primary`; el latido
usa el keyframe `ripple` (`--animate-ripple`) añadido a `tokens.css` (append). Solo `cn`/`lucide-react` (ya
presentes). Cero dependencias npm nuevas.

## Dependencias npm que requieren estos componentes (las instala el satélite consumidor)

| Paquete | Usado por | Licencia | URL |
|---|---|---|---|
| `clsx` | `cn` (todos) | MIT (© Luke Edwards) | https://github.com/lukeed/clsx/blob/master/license |
| `tailwind-merge` | `cn` (todos) | MIT (© Dany Castillo) | https://github.com/dcastil/tailwind-merge/blob/main/LICENSE |
| `motion` | `BlurFade` | MIT (© Framer B.V.) | https://github.com/motiondivision/motion/blob/main/LICENSE.md |

> Estos paquetes se declararán en el `package.json` del satélite cuando consuma estos componentes; el gate
> `npm run lic:check` (ECO-81) verifica su licencia permisiva en ese momento. Aquí se registra el aviso de la
> fuente adoptada. Los keyframes/tokens de animación que consumen viven en `tokens/tokens.css` (aditivos).

## Tooling de catálogo: Storybook (ECO-85 / ADR-020)

El `design-system/` adquiere un `package.json` propio con el tooling de **Storybook 10.x** (catálogo/VRT).
Es **dev/build tooling**: NO se distribuye a sitios de cliente (el em-ui copia los `.tsx` fuente, nunca
`node_modules`). El grueso del árbol (577 deps) es **permisivo** (MIT/Apache/BSD/ISC) y pasa
`npm run lic:check:ds` tal cual. Storybook core + CLI + `@storybook/addon-a11y` + `@storybook/test-runner`
son **MIT**.

### Excepciones revisadas (`--allow`) — dev-tooling copyleft débil / LGPL, usado SIN MODIFICAR

ADR-020 anticipó que el árbol de Storybook traería paquetes no-permisivos que requieren **revisión humana +
`--allow` por paquete**. Tras revisión, se permiten estos 4 — todos **build/dev tooling, no redistribuidos**,
y enlazados/usados **sin modificar** (la obligación copyleft de MPL es a nivel-fichero y LGPL aplica a la
biblioteca enlazada, no a nuestro código):

| Paquete | Licencia | Por qué se permite | URL |
|---|---|---|---|
| `axe-core` | MPL-2.0 | Motor de a11y de `@storybook/addon-a11y`; dev-only, sin modificar. | https://github.com/dequelabs/axe-core/blob/develop/LICENSE |
| `lightningcss` | MPL-2.0 | Transformador CSS de Vite/Tailwind v4; dev/build, sin modificar. | https://github.com/parcel-bundler/lightningcss/blob/master/LICENSE |
| `lightningcss-linux-x64-gnu` · `-musl` | MPL-2.0 | Binarios nativos de `lightningcss` (linux-x64 glibc/musl). | https://github.com/parcel-bundler/lightningcss/blob/master/LICENSE |
| `@img/sharp-libvips-linux-x64` · `-linuxmusl-x64` | LGPL-3.0-or-later | libvips de `sharp` (optimización de imágenes de next), enlazado dinámicamente, sin modificar (binarios linux-x64 glibc/musl). | https://github.com/lovell/sharp-libvips/blob/main/LICENSE |
| `@img/sharp-wasm32` | Apache-2.0 AND LGPL-3.0-or-later AND MIT | Variante WASM de `sharp` (opcional, misma familia libvips; llegó con el bump sharp≥0.35 por CVE-2026-33327 et al.). Dev/build, sin modificar; el runner Linux usa el binario nativo, no el WASM. | https://github.com/lovell/sharp/blob/main/LICENSE |

> La línea verde de **DISTRIBUCIÓN** sigue intacta: `npm run lic:check` (root, target de distribución) y los
> satélites NO permiten copyleft. El `--allow` aquí es exclusivo del árbol de **tooling** del catálogo.
