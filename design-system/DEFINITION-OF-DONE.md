# Definition-of-Done por pieza + PASOS a seguir

> **Por qué existe:** el DoD vivía troceado (DSQ Pilares 1-4 + ADR-030) y en la cabeza → piezas salían a medias sin
> que nadie lo detectara. Aquí están **los pasos a seguir + verificar en CADA ticket**, en un solo sitio, para no
> repetirlos pieza a pieza. Cada parte la hace cumplir un gate. Nace en ECO-197, ampliado en ECO-198.

## PASOS por pieza — SÍGUELOS EN ORDEN, en cada ticket

1. **Idioma** — el **código y los comentarios en INGLÉS** (solo código; las docs de gobernanza / especs / ADRs se
   quedan como estén). El copy de Storybook también en inglés (StoryConventions).
2. **Contrato (A)** — `tailwind-variants` + `<name>Specs`.
3. **Tokens semánticos por rol** — sin valores crudos (color / tipografía / motion).
4. **Clasificar (B)** — `// @ds-role: primitive|composite` en el componente → `role` en el registry.
5. **Compone primitivos** — no copia la superficie de otra pieza.
6. **Modificabilidad (C)** — conforme a la NORMA (color modificable / estructura bloqueada) o excepción declarada.
7. **Story — ANALIZA la pieza y ORGANÍZALA por ejes.** Identifica cada eje ortogonal de la pieza; **cada eje →
   su propio bucket + su overview**, sin mezclar: variant→`AllVariants` (última), size→`AllSizes` (penúltima),
   y **cada eje ENUM propio** (surface, indicator, shape, direction, orientation…) → un overview `<Axis>` con su
   nombre. Un eje NUEVO → un bucket nuevo (el catálogo es extensible). Los booleanos/estados (borderless,
   loading…) → su story/overview dedicado. **Nunca mezclar ejes en un overview.** Mientras se verifica la pieza
   vive en `Migration/<Pieza>`; al promocionar, su título pasa a `Primitives/<Pieza>` **o** `Composite/<Pieza>`
   según su `@ds-role` (ver "Colocación Model B"). Gates: `check-story-norm` (variant/size) + `check-piece-complete`
   (un overview `<Axis>` por cada eje enum propio — un eje sin su bucket bloquea la promoción).
8. **VERIFICACIÓN — fidelidad viejo-vs-nuevo (TEST verídico, no una página)** — reconstruye el componente VIEJO en
   `tests/fixtures/<Name>Old.tsx` (desde git, pre-migración) y en `tests/<name>-fidelity.test.tsx` renderiza
   **viejo-vs-nuevo por CADA variación**, extrae los atributos del DOM (tag / clases / disabled / href…) y exige
   **`old = new`**. Es la verificación REAL (máquina): **la que caza la mala migración** — Button se migró mal y
   este test fue lo que lo cazó. La versión DÉBIL (comparar solo un string de clases inline, **sin fixture, sin
   render**) NO cuenta. No hace falta página: **el test lo garantiza**.
9. **Calidad** — a11y AA (axe + teclado/foco/ARIA) + docs de estados. (VRT = interruptor GLOBAL, se enciende aparte.)
10. **Reconciliar copias em-ui** — `em-ui update <Pieza> --dest <consumer>/src` (NUNCA editar la copia a mano →
    `check-fleet-report` rojo).
11. **Actualizar Corpus Status** — `node scripts/census.mjs --write` → la pieza aparece al día en el dashboard.
12. **Verde** — gates + tests + `npm run governance` (incluye `check-fleet-report`, que el pre-push NO corre).

**Medio-hecha NO es hecha.** Esto corta el goteo de "20 tickets de parche".

## Las 9 partes y su gate (el "qué" que cada paso satisface)

| # | Parte | Cómo se comprueba |
|---|-------|-------------------|
| 1 | **Contrato de variante (A)** — `tailwind-variants` + `<name>Specs` | `check-contract-tv` (Fase 1) |
| 2 | **Tokens semánticos por rol** — sin valores crudos | `check-raw-color`, `check-typography-tokens`, `check-motion-tokens` |
| 3 | **Clasificada (B)** — `role` máquina-legible en el registry | `check-classification` |
| 4 | **Compone primitivos** — no copia superficie | `check-composition-class` |
| 5 | **Modificabilidad (C)** — norma ↓ o excepción declarada | `check-region-integrity` (Fase 2) |
| 6 | **Calidad** — a11y AA + tests + docs + VRT | listón de calidad + `[H]` humano |
| 7 | **Story** — según la norma + título por role | `check-story-norm`, `check-story-coverage` |
| 8 | **Fidelidad viejo-vs-nuevo** — fixture `<Name>Old` + render viejo-vs-nuevo + atributos `old = new` | `<name>-fidelity` (al estándar) |
| 9 | **Registrada + self-contained** — registry + deps npm | `check-component-drift`, `check-manifest` |

## Colocación en Storybook (Model B) — la carpeta ES la declaración de estado

- **`Migration/<Pieza>` = WIP.** Toda pieza no certificada vive aquí. La carpeta dice "en migración, aún no fiable".
- **`Primitives/<Pieza>` / `Composite/<Pieza>` = CERTIFICADA.** Una pieza solo llega aquí cuando pasa **los 11 pasos**
  con evidencia **+ la aprobación final del humano [H]**. Si está aquí, está terminada.
- **Promoción = mover el título** `Migration/` → `Primitives/` o `Composite/` **según su `@ds-role`** (no todo es
  primitive). Es el acto que el gate `check-piece-complete` bloquea si falta un paso — imposible promocionar a medias.

## Norma C — modificabilidad (por defecto, SIN marcar zona por zona)

- **Modificable:** el/los **token(s) de color / marca**. Un satélite los re-apunta en su scope (`[data-brand]`).
- **Bloqueado (el DS lo gobierna):** **todo lo estructural** — forma, geometría de borde, sombra, radio, grosor,
  espaciado, markup, ARIA. La estructura es el idioma del DS; no se rebrandea.
- **Excepción por-satélite:** se **declara**, deliberada y visible, solo para esa pieza/ese satélite.

**Se hace cumplir al PULL** (`check-region-integrity`, token-only de ADR-030): lo único que sobrevive del cambio de
un satélite es un re-apunte de token de color; tocar estructura lo caza el gate. Propagación **segura por
construcción**. Regla general primero; se refina por-pieza/por-satélite donde la realidad lo pida.

## Completitud — por qué no se vuelve a olvidar

El gate **`check-piece-complete`** (required, no-bypass) hace cumplir esto por la **colocación**: una pieza en
`Primitives/`/`Composite/` (promocionada) DEBE tener evidencia de los 11 pasos —incluida la **fidelidad al
estándar**— o el gate va **rojo y bloquea el merge**; las de `Migration/` están exentas (WIP). El **censo**
(`scripts/census.mjs`, visible en `Foundations/Corpus Status`) muestra el estado **por-paso** de cada pieza.
Estructura escrita **+ gateada** = no depende de que nadie la recuerde, y **promocionar a medias es imposible**.
