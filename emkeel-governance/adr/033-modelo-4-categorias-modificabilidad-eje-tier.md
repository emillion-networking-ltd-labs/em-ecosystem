# ADR-033 — Modelo de 4 categorías de modificabilidad + eje `core|decorative` (amplía ADR-027 de color a TODO el sistema de tokens; enmienda el default binario de la Norma C / ADR-030)

- Status: accepted
- Date: 2026-07-13
- Ticket: [ECO-200](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-200) (estrategia) — cimientos en [ECO-202](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-202)
- Strategy: design-tokens
- Deciders: Operador (human gate = aprobación + merge del PR de estrategia #598)
- Contexto de gobierno: registra la decisión de la estrategia `design-tokens` **AMPLIADA** (ECO-200, aprobada por
  merge de #598). **Amplía ADR-027** (color → todo el sistema de tokens) y **enmienda el DEFAULT binario** de la
  Norma C ("color modificable / toda estructura bloqueada", asociado a ADR-030) al modelo de 4 categorías. El
  **MECANISMO** de marcadores por-región de ADR-030 (brand-locked/ds-governed/partial + `check-region-integrity`)
  se **conserva**; lo que cambia es la categoría por defecto de cada dimensión.

## Contexto

ADR-027 acotó el sistema de tokens a **COLOR** (fuente única + gate de contraste AA por pares + override por
satélite). Antes de migrar el DS a N satélites en producción hay que fijar el modelo para **TODAS las dimensiones**:
un valor mágico en un primitivo core propaga a N sitios y no se puede cambiar de forma centralizada.

El default de la Norma C (ADR-030) era **BINARIO** — "color modificable, toda estructura bloqueada" — insuficiente:
1. **radius / border-width / shadow SON marca** — un satélite querría re-apuntarlos (más redondo, bordes más
   gruesos, otra sombra), exactamente como el color. El binario los bloqueaba.
2. Muchas medidas "estructurales" hoy son **valores crudos sin tokenizar** (atenuación alpha ad-hoc gobernada solo
   por contraste, medidas de pieza de popups, sombra) → no hay fuente única para cambiarlas.

Auditoría grounded (`design-system/components/*.tsx`): **107** valores arbitrarios Tailwind `[..]`; **69** alpha
`/NN` sobre tokens; escalas-token existentes en `tokens.css` (color 146, radius 9, **shadow SOLO 2**). La **LÍNEA
estricto-vs-arbitrario no existía** como dato por-pieza (cero `@ds-tier`).

## Decisión

**1. Modelo de 4 categorías de modificabilidad** (qué categoría aplica se decide por DIMENSIÓN):

| Categoría | Dimensiones | Regla |
|---|---|---|
| **MARCA** | color · radius · border-width · shadow | Tokenizada + **modificable por satélite** (`[data-brand]` re-apunta el token, como `--accent`). |
| **ESTRUCTURA-DS** | spacing interior · medidas de pieza (diálogo/popup) · atenuación/alpha semántica · tipografía · motion | Tokenizada + **bloqueada** (el DS la gobierna; NO satélite-modificable). |
| **ESCAPE-HATCH** | layout one-off · spacing entre elementos de una composición | Arbitrario legítimo, **no gateado**. |
| **ESTRUCTURA PURA** | markup · ARIA | **Nunca** tokenizable. |

**2. La LÍNEA estricto-vs-arbitrario = por dimensión × `@ds-tier`** (`core|decorative`):
- **core** = primitivo/composite del sistema que propaga a N satélites → **estricto** (usa el token de su escala
  canónica).
- **decorative** = efecto cosechado (ShimmerButton, Meteors, AuroraBackground…) → **arbitrario a menudo legítimo**.
- El `@ds-tier` es un dato **por-pieza** (anotación `// @ds-tier:` + campo `tier` en el registry + gate
  `check-tier` de presencia), **detectado en masa** + **confirmado en la certificación `[H]`** (rectifica una
  detección dudosa). Es el **cimiento** que ECO-202 construye.

**3. Regla de escala canónica:** cada dimensión de MARCA/ESTRUCTURA-DS tiene una escala de tokens **pequeña y
canónica** que se **reutiliza**; un valor divergente en una pieza core es **deuda a reconciliar**, no un token
reactivo. Ejemplo verificado: hay UNA sombra canónica (`--shadow-card`, usada por cards y popups/dropdowns); las
divergentes (Slider `rgba` crudo, Toggle `shadow-sm`) son "mal escritas" a reconciliar, no tokens nuevos.

**4. Distribución sin cambios:** el modelo **copia-entera** (`copyFileSync` de `tokens.css`) + override
**por-variable** en `[data-brand]` es **dimension-agnóstico** → cualquier token nuevo (radius/border/shadow…) viaja
gratis en la misma copia y se sobreescribe igual que el color (precedente: typography ECO-193, motion ECO-194).
El pipeline DTCG + generador (Style Dictionary) sigue **diferido** (YAGNI para 2 consumidores web de copia literal;
revisitar con ≥3-4 consumidores o una 2ª plataforma).

## Consecuencias

- El eje `core|decorative` (ECO-202) es el **cimiento**; los gates ESTRICTOS por dimensión
  (radius/shadow/border/spacing/atenuación, *keyed on tier*) **ruedan por dimensión** en los pasos siguientes de la
  ejecución (no big-bang). El endurecimiento muerde de verdad en la **certificación** (`Primitives/`/`Composite/`),
  donde el tier ya está confirmado.
- **ADR-030:** su mecanismo de marcadores por-región + `check-region-integrity` **se conserva**; su DEFAULT binario
  queda **ampliado** al modelo de 4 categorías (radius/border/shadow pasan de "bloqueado" a MARCA satélite-modificable).
- **ADR-027:** queda **ampliado** de color a todo el sistema de tokens; su arquitectura (fuente única + override por
  `[data-brand]` + gate de drift) es la base sobre la que viajan las nuevas dimensiones.
- **Orden de ejecución** (tickets design-system-quality): cimientos (eje) → atenuación → escalas de marca
  (border-width/shadow/medidas de pieza) → gates por dimensión → barrido en tandas + drenar deuda ratchet.
- La DoD (`design-system/DEFINITION-OF-DONE.md`, sección "Norma C") refleja el modelo; el paso 4 añade la
  confirmación de `@ds-tier` en la certificación.
