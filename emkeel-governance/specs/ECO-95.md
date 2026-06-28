# ECO-95 — Storybook Foundations: tokens visibles + conmutador de preset (tematización por familia)

Strategy: satellite-design

## Resumen
El catálogo Storybook muestra los COMPONENTES pero no los **tokens** que los gobiernan: hoy el único
addon es a11y y no hay ninguna página de fundamentos, así que la capa de design tokens (color, tipografía,
spacing, motion, gradientes) es invisible — no se puede juzgar el "lienzo en blanco". Este ticket añade
**(1) páginas de Foundations** que hacen VISIBLE cada token con su nombre y valor, y **(2) un conmutador de
preset** en la toolbar que reescribe en vivo SOLO los tokens de **marca** (`--color-accent/-2` + familia
tipográfica) sobre un ancestro —igual que el decorator de dark mode de ECO-90 aplica `.dark`— dejando los
tokens **semánticos** (content/surface/border/escala/spacing/motion) intactos.

Esto materializa el modelo de tokens decidido con el operador: la **gramática neutra** son nuestros tokens
semánticos (se quedan); la **marca** es el punto de tematización por **preset multi-eje** (color +
tipografía). El verde `#1b5e20` de hoy queda demostrado como **placeholder**, no como marca a fuego.

## Decisiones fijadas (operador)
- **Foundations en stories TSX** (no MDX/addon-docs): cero dependencias nuevas, reusa el wiring del
  catálogo, 100% visual (no docs-prosa). El addon-docs queda para más adelante si hace falta documentación escrita.
- **Conmutador = mecanismo + 2 presets demo** (NexaCore default + presets de contraste) para VER el concepto
  en vivo; los presets de sector REALES curados (clínica/gimnasio/…) van en el ticket de seguimiento, ya con
  el mecanismo probado.
- **El conmutador toca SOLO marca:** accent/-2 (+ derivados) y familia display/serif. Jamás los semánticos.

## Alcance
- **Conmutador de preset** (`.storybook/`):
  - `presets.ts`: presets de marca como token-swap (`{ id, name, vars }`) — NexaCore (default, sin override)
    + 2 de contraste (color + familia tipográfica distintos). Vive en el catálogo, NO en el core `tokens.css`
    (el core sigue neutro; los presets demo son ejemplos de consumidor).
  - `preview.tsx`: `globalTypes.preset` (toolbar, patrón idéntico al de `theme`) + el decorator aplica las
    `vars` del preset al wrapper que ya existe (junto al tema). Los gradientes de marca (`--gradient-brand`)
    se re-resuelven solos al consumir `--color-accent/-2` en contexto.
- **Foundations** (`stories/foundations/*.stories.tsx`, TSX): un grupo "Foundations/" con
  - Colors — semánticos (content/surface/border) + marca (accent/-2 + gradientes) + estado (error/warning/info/success)
  - Typography — escala display fluida `--text-display-*` + escala base h/body/caption + familias display/serif/sans
  - Spacing & Radius — escalas `--spacing-*` y `--radius-*`
  - Motion & Elevation — duraciones/easings (`--duration-*`/`--ease-out-expo`, animados) + sombras/superficies
  - Helper de presentación NO-story compartido (sin `.stories.`) para los swatches (evita duplicación / dup:check).

## Acceptance Criteria
1. **Tokens visibles:** existe un grupo "Foundations/" en el catálogo que renderiza, con nombre + valor,
   los tokens de color (semánticos + marca + estado + gradientes), tipografía (display + base + familias),
   spacing, radius, motion (duraciones/easings) y elevación (sombras/superficies).
2. **Conmutador en vivo:** la toolbar de Storybook tiene un selector de preset; al cambiarlo, los tokens de
   MARCA (accent/-2 + familia tipográfica) cambian en TODO el catálogo (componentes y Foundations), y los
   tokens semánticos (texto/fondos/bordes/escala) **no** cambian. Mínimo 2 presets conmutables además del default.
3. **Neutro verificable:** el preset por defecto reproduce el aspecto actual (NexaCore); conmutar a otro
   preset recolorea la marca sin alterar la estructura → demuestra el lienzo neutro.
4. **Aislamiento:** no se toca `nexacore-api/` ni `nexacore-dashboard/`; el core `design-system/tokens/tokens.css`
   no cambia sus valores; `build-storybook` verde; `npm run coverage` (story + variant) verde; closure 5/5;
   Dashboard-VRT verde.
5. **Licencias:** sin dependencias nuevas → `lic:check`/`lic:check:ds` sin cambios; cero copyleft introducido.
6. **Gates** verdes (`Strategy: satellite-design`, ticket ECO-95), Security Pipeline (sin secretos).

## Alignment
Sirve al pilar B (`satellite-design.md`, ADR-018) en sus condiciones innegociables:
- **"PRERREQUISITO — crecer el design-system ANTES de gatear":** sin VER los tokens no se puede juzgar si el
  design-system es un lienzo neutro suficiente; esta página + conmutador es el instrumento de ese juicio.
- **"El sector se codifica como PRESET MULTI-EJE, no como tema de color":** el conmutador implementa el
  mecanismo de preset (color + tipografía, no solo color) y lo deja probado para curar presets de sector reales.
- **"Libertad en theming por tokens; el cliente cambia la marca sin tocar el componente":** el conmutador
  demuestra el token-swap en vivo (cambiar marca = swap de `$value`, no fork — DTCG).
- **"El gate visual humano se queda (verde ≠ conformidad)":** Foundations + conmutador son herramienta del
  juicio visual humano, no un gate automático nuevo.
- **Adopción aditiva y aislada (ADR-019):** todo vive en `design-system/` (catálogo), sin mutar el dashboard.

## Out of scope (→ tickets futuros)
- Presets de SECTOR reales y curados (clínica/gimnasio/restaurante…) con sus familias tipográficas reales
  vía next/font — ticket de seguimiento (paso 2 del plan).
- tweakcn como editor de temas embebido; autodocs/MDX; baselines VRT del catálogo.
