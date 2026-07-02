# ADR-024 — Modelo de selección de texto: texto seleccionable por defecto, sólo controles no

- Status: accepted
- Date: 2026-07-02
- Ticket: [ECO-115](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-115)
- Strategy: satellite-design
- Deciders: Operador (human gate vía review + merge del PR, 2026-07-02)
- Contexto de gobierno: repo gobernado por Emkeel (ver `AGENTS.md`). **Revierte** el modelo de selección
  introducido en ECO-99 y afinado en ECO-107 (ambos sin ADR propio; esta decisión los documenta y sustituye).

## Contexto

ECO-99 estableció en `design-system/tokens/tokens.css` el modelo **"nada es seleccionable por defecto"**:
`body { user-select: none }` + un **opt-in por selector** (`p, span, li, …` → `user-select: text`) para
devolver la selección al texto, y ECO-107 añadió `button *` para quitar el caret I-beam dentro de los controles.

Ese modelo es **frágil por construcción**: el opt-in enumera etiquetas de texto, así que cualquier componente
que ponga su texto en un `<div>` (no listado) queda en `user-select: none` y **su texto no se puede seleccionar**.
El caso que lo destapó fue **AlertBox** (`<div role="alert"><div>{texto}</div></div>`): texto no copiable, de
forma inconsistente con el resto del catálogo. Además el guard `check-selection-model` sólo verificaba la
presencia de las reglas del modelo viejo — **no cazaba** el texto no seleccionable, así que AlertBox pasaba en verde.

Dato clave: **el dashboard nunca tuvo este problema** — no aplica ningún modelo de selección (todo seleccionable,
comportamiento nativo del navegador) y es la referencia de uso correcto. El problema era **exclusivo del
design-system / catálogo Storybook**, que importa este core.

## Decisión

**Invertir el modelo** al del dashboard: **el texto es seleccionable por defecto** (comportamiento nativo);
**sólo las superficies de control** interactivas se marcan `user-select: none`.

- Eliminar de `tokens.css` el `body { user-select: none }` global, el opt-in `user-select: text` por selector
  y la regla `button *` de descendientes de control.
- Conservar únicamente el bloque de control: `button, [role="button"], summary, [role="checkbox"|"switch"|
  "radio"|"tab"|"option"|"menuitem"|"menuitemradio"]` → `user-select: none` + `cursor: pointer`.
- Como `user-select` es **heredado**, el texto DENTRO de un control hereda `none` → sigue sin aparecer el caret
  I-beam sobre botones (se preserva el logro de ECO-107) **sin** necesidad de `button *`.
- **Enlace-botón** (`Button` con `as="a"`, que rinde un `<a>` sin `role="button"`, p.ej. el CTA del Hero): se
  marca `select-none` en el propio primitivo `Button` (variantes no-link). Escape hatch del modelo: un
  primitivo que necesite texto copiable dentro de un control lo reabre con `select-text`.
- **Reescribir el guard** `check-selection-model.mjs`: además de exigir que los controles sean `user-select:none`,
  ahora **prohíbe el anti-patrón** (`body { user-select: none }` global y el opt-in `user-select: text`), que es
  lo que rompía la selección de texto. Test de comportamiento en `tests/selection-model.test.ts` (AlertBox).

## Consecuencias

- El texto en `<div>` (AlertBox y cualquier otro) vuelve a ser seleccionable **automáticamente** — el arreglo es
  integral, no caso a caso; no hace falta auditar los ~90 componentes uno a uno para reactivar selección.
- Los `select-none` explícitos donde la no-selección es deseada (drag/decorativo: BeforeAfterSlider, Ripple,
  Avatar, Portfolio) son independientes del modelo global → intactos.
- Los card-link (p.ej. Testimonials, un `<a>` que envuelve la tarjeta) siguen seleccionables — se puede copiar
  su cita; no son controles y no se tocan.
- El dashboard no requiere cambios: ya funcionaba con este comportamiento (era la referencia). Queda cerrada la
  "deuda de re-sync" que se creía pendiente: el design-system se alinea al dashboard, no al revés.
