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
