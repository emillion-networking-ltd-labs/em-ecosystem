# ADR-032 — Iconos de estado: fuente única `STATUS_ICONS` + set canónico (amplía el sistema de iconos)

- Status: accepted
- Date: 2026-07-13
- Ticket: [ECO-199](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-199)
- Strategy: design-system-quality
- Deciders: Operador (human gate = aprobación + merge del PR)

## Contexto

El sistema de iconos (ECO-178/184/185/186) estandarizó el **TAMAÑO + el mecanismo** (todo glyph vía `<Icon>`,
tamaño desde la escala `ICON_SIZES`, gate `check-icon-usage`). Pero **NO el MAPEO SEMÁNTICO** — qué icono
representa cada estado. Cada componente de estado elegía el suyo → divergencia real (verificada por código):
- AlertBox: warning→⚠ triángulo, error→⊗ CircleX (coherente).
- Toast: warning/error **CAMBIADOS** (error→⚠ triángulo, warning→① CircleAlert).
- Input: error→⚠ triángulo.

Resultado: el **triángulo significaba "warning" en un componente y "error" en otro** — el mismo glyph, dos
significados. Y no había fuente única (cada uno definía su `VARIANT_ICON`).

## Decisión

**Set canónico = el de AlertBox** (el coherente): el **TRIÁNGULO reservado para `warning`** (la forma universal
de precaución); el resto, **círculos** con su símbolo distinto.

```
STATUS_ICONS = { warning: TriangleAlert (⚠), error: CircleX (⊗), success: CircleCheck (✓), info: Info (ⓘ) }
```

- **Fuente única** en `design-system/lib/statusIcons.ts` — viaja con el cierre de em-ui (`@/lib/*`, como
  `lib/types.ts`), así la copia del consumidor no rompe. Ningún componente mapea estado→icono a mano.
- **Gate `check-status-icons`** (required, en `coverage`): prohíbe importar un glyph de ALERTA
  (`TriangleAlert`/`AlertTriangle`/`CircleAlert`/`CircleX`) en un componente → debe usar `STATUS_ICONS[...]`.
  `Info` y `CircleCheck` NO se gatean (tienen usos genéricos fuera del semáforo de estado).
- Es una **ampliación del sistema de iconos**: **tamaño** (`ICON_SIZES`, ECO-184) + **semántica**
  (`STATUS_ICONS`), ambas fuente única + gateadas.

## Consecuencias

- **7 componentes alineados:** AlertBox, Toast, InlineError, EmptyState, RateLimitBanner, Input (FormField
  delega en InlineError). Cambios VISUALES: Toast (des-cambiado warning/error), InlineError/Input/EmptyState
  (error ⚠→⊗). AlertBox/RateLimitBanner: solo heredan la fuente (mismo glyph, `AlertTriangle`→`TriangleAlert`).
- `Info`/`CircleCheck` siguen disponibles para usos genéricos (no gateados).
- Nace de la revisión de iconos durante la migración de AlertBox (design-system-quality) — la migración
  precisamente barre y deja el DS coherente.
