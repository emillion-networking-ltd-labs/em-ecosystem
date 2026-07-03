# ADR-024 — Modelo de selección de texto: el caret sólo sobre texto (refina ECO-99), con el texto-en-div arreglado

- Status: accepted
- Date: 2026-07-02
- Ticket: [ECO-115](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-115)
- Strategy: satellite-design
- Deciders: Operador (human gate vía review + merge del PR, 2026-07-02)
- Contexto de gobierno: repo gobernado por Emkeel (ver `AGENTS.md`). **Refina** (no revierte) el modelo de
  selección de ECO-99/107, que no tenían ADR propio; esta decisión los documenta y los completa.

## Contexto

ECO-99 estableció en `design-system/tokens/tokens.css` el modelo **"nada es seleccionable por defecto + opt-in
del texto"**: `body { user-select: none }` (así el caret/I-beam no aparece al clicar cards, cajas, layout ni
decorados) + un opt-in `user-select: text` para las etiquetas de texto (`p, span, h1..h6, li, …`) y los
editables; ECO-107 añadió `button *`/`[role] *` → none para que el opt-in no reactivara el caret dentro de los
controles. **Objetivo del operador, confirmado al revisar en Storybook: el caret aparece SÓLO sobre texto.**

El modelo tenía un defecto: el opt-in enumera TAGS de texto, así que el texto puesto en un `<div>` (no listado)
quedaba en `user-select: none` → **no seleccionable**. El caso que lo destapó fue **AlertBox**
(`<div role="alert"><div>{texto}</div></div>`): mensaje no copiable, inconsistente con el resto. Además el guard
`check-selection-model` sólo comprobaba las reglas de tokens.css — **no cazaba** el texto-en-div mudo.

Nota de proceso: un primer intento de ECO-115 **invirtió** el modelo a "todo seleccionable por defecto" (estilo
dashboard). Al revisarlo en Storybook se vio que eso hace aparecer el caret sobre elementos NO-texto (cards,
layout, chrome) — justo lo que el operador NO quiere. Se descartó: el modelo correcto es el de ECO-99 (caret
sólo sobre texto); lo que faltaba era arreglar el texto-en-div, no cambiar el modelo.

## Decisión

**Mantener el modelo ECO-99/107** (nada seleccionable por defecto + opt-in del texto + controles y sus
descendientes none) y **arreglar el texto-en-div de forma integral**:

- Un componente que ponga texto en un `<div>` (fuera de la lista de tags del opt-in) **reabre la selección con
  la clase `select-text`** sobre ese contenedor — el texto vuelve a ser copiable **sin** reactivar el caret
  sobre los divs de layout (no se añade `div` al opt-in global, que reintroduciría el caret en las cajas).
  Aplicado a: AlertBox, BentoGrid (título + descripción), TextGenerateEffect, Calendar (cabecera de días).
  Los contenedores de texto que NO deben seleccionarse (placeholder "Loading…" de QrCodeCard, capa decorativa
  de ShimmerButton) declaran `select-none`.
- **Enlace-botón** (`Button` con `as="a"`, que rinde un `<a>` sin `role="button"`, p.ej. el CTA del Hero): su
  texto va en un `<span>` (que es opt-in → sería seleccionable y `button *`/`[role] *` no cubre al `<a>`), así
  que el primitivo `Button` marca `select-none` en las variantes no-link. Cubre el hueco que ECO-107 no tapaba.
- **Reforzar el guard** `check-selection-model.mjs`: además de verificar el modelo en tokens.css, ahora ESCANEA
  `components/` y `sections/` y EXIGE que todo `<div>` con una clase de **tamaño** de texto (`text-body`,
  `text-caption`, `text-h1..3`, `text-display`, `text-xs..xl`) declare `select-text` o `select-none`. Los
  contenedores de icono usan `text-content-*` (sólo color, sin tamaño) → no se marcan. Así el texto-en-div mudo
  no vuelve a colarse en NINGÚN componente/sección. Test de comportamiento en `tests/selection-model.test.ts`.

## Consecuencias

- Se preserva lo que el operador quiere: el caret/I-beam **sólo** sobre texto; nunca sobre cards, layout o chrome.
- El texto-en-div (AlertBox y los demás) vuelve a ser copiable; el guard lo hace enforce en todo el catálogo, no
  caso a caso "a ojo".
- Coste: cada texto-en-div nuevo debe declarar su intención de selección (una clase). Es explícito y cazado en CI.
- El dashboard no se toca: nunca tuvo el problema (era la referencia de uso correcto). Queda cerrada la supuesta
  "deuda de re-sync del modelo de selección".
