# Definition-of-Done por pieza del design-system

> **Por qué este archivo existe:** el DoD vivía troceado (design-system-quality Pilares 1-4 + design-propagation
> ADR-030) y en la cabeza de quien programaba → piezas salían a medias sin que nadie lo detectara (14 migradas a
> `tv` sin su etiqueta de clasificación ni sus marcadores). Aquí está **la estructura completa, en un solo sitio**.
> Y no basta escribirla: **cada parte la hace cumplir un gate** — una pieza no puede quedar "registrada/hecha" sin
> todas sus partes (ver "Completitud" abajo). Nace en ECO-197 (design-system-quality, Fase 1).

## Una pieza está HECHA solo con TODO esto

| # | Parte | Cómo se comprueba |
|---|-------|-------------------|
| 1 | **Contrato de variante (A)** — `tailwind-variants` + `<name>Specs` | `check-contract-tv` (Fase 1) |
| 2 | **Tokens semánticos por rol** — sin valores crudos (color/tipografía/motion) | `check-raw-color`, `check-typography-tokens`, `check-motion-tokens` |
| 3 | **Clasificada (B)** — `role` (primitive/composite) + contrato, máquina-legible en el registry | `check-classification` (Fase 1) |
| 4 | **Compone primitivos** — no copia la superficie de otra pieza | `check-composition-class` |
| 5 | **Modificabilidad (C)** — conforme a la NORMA ↓ o excepción declarada | `check-region-integrity` (Fase 1/2) |
| 6 | **Calidad** — a11y AA (axe + teclado/foco/ARIA) + tests + docs de estados + VRT baseline ON | listón de calidad + `[H]` humano |
| 7 | **Story** — según la norma de stories | `check-story-norm`, `check-story-coverage` |
| 8 | **Fidelidad** — el render viejo y el nuevo pintan las MISMAS clases (test permanente) | test `<name>-fidelity` |
| 9 | **Registrada + self-contained** — en el registry, con sus deps npm declaradas | `check-component-drift`, `check-manifest` |

**Medio-hecha NO es hecha.** Esto es lo que corta el goteo de "20 tickets de parche".

**Idioma:** todo el **código, comentarios y copy de Storybook en inglés** (CONTRIBUTING.md:7 · StoryConventions:75).
Las piezas con comentarios en español se traducen **al tocarlas** en el lote (no big-bang). *(El estándar de las
propias páginas Foundation — título/intro/márgenes uniformes — es un ticket aparte: sección en StoryConventions +
shell compartido, alinea las ~7 Foundation.)*

## Norma C — modificabilidad (por defecto, SIN marcar zona por zona)

La pregunta "¿qué parte es gobernada vs modificable?" **no se decide pieza a pieza** — la decide esta norma:

- **Modificable:** el/los **token(s) de color / marca**. Un satélite los re-apunta en su scope (`[data-brand]`),
  para toda su marca, en un solo sitio. El color es la firma de marca legítima.
- **Bloqueado (el DS lo gobierna):** **todo lo estructural** — forma, geometría de borde, sombra, radio, grosor,
  espaciado, markup, ARIA. La estructura es el idioma del DS; no se rebrandea.
- **Excepción por-satélite:** para el satélite X que de verdad quiere un rasgo estructural como firma (p.ej. un
  radio distinto) → se **declara**, deliberada y visible, solo para esa pieza/ese satélite. Por defecto bloqueado;
  abrir es un acto consciente, nunca un descuido.

**Se hace cumplir al PULL, no en runtime** (`check-region-integrity`, token-only de ADR-030): cuando un satélite
actualiza, lo único que sobrevive de su cambio es un **re-apunte de token de color**; si tocó estructura, el gate
lo caza. Así la propagación es **segura por construcción** — una pieza self-describing (identidad registrada +
tokens semánticos + esta norma) no le rompe la marca a nadie al actualizar.

Empezamos con esta regla **general** aplicada a todo (barato, sin marcar 84 piezas) y se **refina** por-pieza o
por-satélite donde la realidad lo pida (iterativo, no de golpe).

## Completitud — por qué no se vuelve a olvidar

Un gate de **completitud de pieza** verifica que toda pieza registrada tiene sus 9 partes (es el meta-gate, pero
sobre la pieza entera, no solo sobre las dimensiones). El **censo** (`scripts/census.mjs`) reporta los huecos; el
gate de completitud impide huecos nuevos. Estructura escrita **+ gateada** = no depende de que nadie la recuerde.

## Cómo se construye una pieza (carriles, LEAF-FIRST — DSQ Pilar 4)

- **Ya migradas (idioma + clasificación ciertos)** → **lotes**: solo se añaden etiquetas (B + C) + se cierran huecos
  de calidad. No cambia el aspecto → riesgo bajo.
- **Migración de idioma (a `tv`)** → **una a una / lotes pequeños**: cambia el idioma → cada una con su fidelidad +
  VRT verde.
- **Primitivos que faltan** (Popover/Menu/Skeleton/ChartTooltip) → **una a una**: construcción + diseño.
- La máquina prueba lo mecánico (VRT/tests/fidelidad/gates); el humano juzga (marcadores, primitive/composite,
  deltas visuales) y aprueba en Storybook.
