# ADR-027 — Arquitectura del sistema de color/tokens: fuente única + gate de contraste por pares + override por satélite

- Status: accepted
- Date: 2026-07-03
- Ticket: [ECO-133](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-133) (estrategia) — implementación en ECO-134/135/136
- Strategy: design-tokens
- Deciders: Operador (human gate = aprobación + merge del PR de estrategia #535)
- Contexto de gobierno: registra la decisión de la estrategia `emkeel-governance/strategy/design-tokens.md`
  (aprobada por merge de #535). **Supersede/absorbe ECO-123** (auditoría de color cuyo arreglo no se aplicó).

## Contexto

El sistema de color tenía tres problemas: (1) el valor de cada token vive DUPLICADO (crudo `--X` + literal
`--color-X` en `.dark`/`.light`) por el "freeze" de `@theme` de Tailwind v4 (design-system/tokens/tokens.css:335-340)
→ cambiar una decisión de color no propaga; (2) valores de bajo contraste (content-tertiary 0.55, borders
0.03-0.08, placeholder 0.3) que no cumplen WCAG AA; (3) tres fuentes divergentes (DS canónico, copia stale del
dashboard, fork inline del satélite) sin propagación gobernada ni mecanismo de override de marca.

## Decisión

Arquitectura decidida (estrategia design-tokens, Opción 2 + matriz de pares, por fases):

1. **Fuente única (Fase 0, ECO-134):** patrón oficial TW v4 — `@theme inline { --color-X: var(--X) }` + los
   valores crudos `--X` scopeados por tema (`:root`/`.dark`/`.light`) en `@layer theme`. Las utilidades
   referencian el crudo → cambiar el crudo propaga en runtime; se elimina el espejo literal `--color-*`.
2. **Contraste AA gobernado (Fase 1, ECO-135):** AA es propiedad del **par fg↔bg**, no del token; un `rgba` con
   alpha no tiene ratio hasta componerse (Porter-Duff `over`) sobre una superficie opaca. Artefacto de primera
   clase: una **matriz de composición de pares** (qué content sobre qué surface; qué α sobre qué superficie),
   por tema y por marca. `check-contrast.mjs` compone y valida cada par (4.5 texto / 3:1 grande / 3:1 no-texto,
   sin redondear). Bordes decorativos clasificados/exentos; **válvula de excepción auditada** (ADR) para marca
   no-AA. Los valores de bajo contraste se corrigen validados por el gate (cierra ECO-123).
3. **Override por satélite + propagación (Fase 2, ECO-136):** baseline semántico OBLIGATORIO (el gate corre
   sobre el set de PARES resuelto de CADA satélite → un override parcial no puede romper AA en silencio);
   satélite = capa de override por scope `[data-brand]` (deja el fork inline); tokens marcados **norma/estético**
   (opt-out de lo estético, la norma innegociable). Drift = gate de CI sobre el `em-ui diff` existente (sin
   generador — empujar a consumidores violaría el pull de em-ui, ADR-007).

## Consecuencias

- Cambiar un color = un cambio en el crudo → propaga (intra-DS por runtime; a consumidores por el gate de drift).
- Contraste AA verificable y bloqueante, computado correctamente (sobre pares compuestos, no por-token).
- Un satélite conserva su marca sin poder violar la norma; puede opt-out de lo estético, no de lo normativo.
- **NO-GOALS:** pipeline DTCG + generador (YAGNI para 2 consumidores; revisitar con ≥3-4 o cross-platform);
  rediseñar la paleta de marca (satellite-design/ECO-128); APCA como gate; 1.4.1/forced-colors (deuda a11y aparte).
- Validación real (estrategia): content-tertiary compuesto sobre surface-primary = 3.84:1 (< AA 4.5) — el gate
  por pares lo caza.

## Implementación (Fase 2, ECO-136)

- **Capa de override `[data-brand]`:** `design-system/tokens/brand.template.css` (template canónico) + comando
  `em-ui brand --name <m> --dest <src>` (scaffold gobernado, como `em-ui init`). El satélite importa el baseline
  (`em-ui-tokens.css`) + su marca (`em-ui-brand.css`) y marca `<html data-brand="…">`. Re-declara `--color-accent*`
  en el scope para escapar el freeze de `@theme` (mismo patrón que `.dark`/`.light`). Los gradientes de marca NO
  se re-derivan solos (se congelan en :root) → se re-declaran en la capa si se usan (documentado en el template).
- **Gate de contraste POR satélite:** `check-brand-contrast.mjs` fusiona el override de cada satélite sobre el
  baseline y corre la matriz de pares sobre la paleta RESUELTA (bloquea NORMA content/surface/border, informa el
  accent decorativo). Núcleo reutilizable exportado de `check-contrast.mjs`.
- **Gate de drift:** `em-ui diff` extendido para diffear la capa `tokens` (antes solo componentes) +
  `check-drift.mjs` (cada copia de consumidor DEBE ser idéntica a la fuente; falla CI y obliga a re-pull). Ambos
  cableados a `npm run coverage`.
- **Marcado norma/estético:** comentarios de sección en `tokens.css` (content/surface/border/feedback = NORMA;
  accent/gradientes = ESTÉTICO). El gate es la ENFORCEMENT; el marcado es la guía.
- **Propagación aplicada:** el dashboard estaba **stale** (bordes por debajo de AA, accent congelado, tokens de
  efectos ausentes — 135 declaraciones drifted) → re-sincronizado a la norma. `sat-cristian-garcia` migrado del
  fork de 648 líneas a `[data-brand]` (oro), build verificado (14 páginas), gates verdes.
- **Aclaración (refina el brand-fixed de Fase 1):** el accent del BASE es brand-fixed (placeholder). Un SATÉLITE
  SÍ puede flipar su accent por tema (legibilidad real de marca en dark) — `check-brand-contrast` valida su
  paleta resuelta en AMBOS temas, así que la libertad estética no puede romper la norma en silencio.
