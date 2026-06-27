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

## Dependencias npm que requieren estos componentes (las instala el satélite consumidor)

| Paquete | Usado por | Licencia | URL |
|---|---|---|---|
| `clsx` | `cn` (todos) | MIT (© Luke Edwards) | https://github.com/lukeed/clsx/blob/master/license |
| `tailwind-merge` | `cn` (todos) | MIT (© Dany Castillo) | https://github.com/dcastil/tailwind-merge/blob/main/LICENSE |
| `motion` | `BlurFade` | MIT (© Framer B.V.) | https://github.com/motiondivision/motion/blob/main/LICENSE.md |

> Estos paquetes se declararán en el `package.json` del satélite cuando consuma estos componentes; el gate
> `npm run lic:check` (ECO-81) verifica su licencia permisiva en ese momento. Aquí se registra el aviso de la
> fuente adoptada. Los keyframes/tokens de animación que consumen viven en `tokens/tokens.css` (aditivos).
