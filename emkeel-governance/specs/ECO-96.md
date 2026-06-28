# ECO-96 — Afinar el preset de marca EMILLION con los colores reales del brand kit

Strategy: satellite-design

## Resumen
En ECO-95 el preset de marca EMILLION se montó con hex ESTIMADOS a ojo del logotipo. Este ticket los
reemplaza por los **valores reales del brand kit**: verde oscuro `#04433e` (acento principal) y teal
`#1d9284` (2º acento → gradiente verde→teal del wordmark). El negro de marca se cubre con los neutros
del core (content/surface-inverse). Solo cambia `.storybook/presets.ts` (catálogo); no toca el core ni
ningún componente.

## Acceptance Criteria
1. El preset `emillion` usa `--color-accent: #04433e` y `--color-accent-2: #1d9284` (+ derivados accent/-light/-dark coherentes); el `--gradient-brand` resultante va verde→teal como el logo.
2. Aislamiento: solo `design-system/.storybook/presets.ts`; el core `tokens.css` no cambia; cero deps nuevas; `build-storybook` + `npm run coverage` verdes; Dashboard-VRT verde.
3. Gates verdes (`Strategy: satellite-design`, ticket ECO-96), Security Pipeline (sin secretos).

## Alignment
Sirve al pilar B (`satellite-design.md`, ADR-018): es el "primer preset de familia REAL" que la estrategia
pide como prueba del lienzo neutro tematizable — la marca real EMILLION aplicada por token-swap, sin tocar
los tokens semánticos. Reemplaza el placeholder/estimación por la marca verificable.

## Out of scope (→ tickets futuros)
- Tipografía de marca (fuente real vía next/font) y presets de SECTOR reales (clínica/gimnasio…).
- Limpiar el verde placeholder del core `tokens.css` (lane del ADR "design-system = librería de todo el proyecto").
