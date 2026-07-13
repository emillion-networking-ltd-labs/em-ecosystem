# Definition-of-Done por pieza + PASOS a seguir

> **Por qué existe:** el DoD vivía troceado (DSQ Pilares 1-4 + ADR-030) y en la cabeza → piezas salían a medias sin
> que nadie lo detectara. Aquí están **los pasos a seguir + verificar en CADA ticket**, en un solo sitio, para no
> repetirlos pieza a pieza. Cada parte la hace cumplir un gate. Nace en ECO-197, ampliado en ECO-198.

## PASOS por pieza — SÍGUELOS EN ORDEN, en cada ticket

1. **Idioma** — el **código y los comentarios en INGLÉS** (solo código; las docs de gobernanza / especs / ADRs se
   quedan como estén). El copy de Storybook también en inglés (StoryConventions).
2. **Contrato (A)** — `tailwind-variants` + `<name>Specs`.
3. **Tokens semánticos por rol** — sin valores crudos (color / tipografía / motion).
4. **Clasificar (B + tier)** — `// @ds-role: primitive|composite` **y** `// @ds-tier: core|decorative` en el
   componente → `role` + `tier` en el registry. El `@ds-tier` (eje de modificabilidad, ECO-202) se detecta en masa
   y se **CONFIRMA aquí**, en la certificación: el `[H]` rectifica una detección dudosa (marcada "?" en el Corpus
   Status). Gates: `check-classification` (role, ratchet) + `check-tier` (tier, presencia).
5. **Compone primitivos** — no copia la superficie de otra pieza.
6. **Modificabilidad (C)** — conforme al **modelo de 4 categorías** (ADR-033, ver "Norma C" abajo); el gate estricto
   por dimensión se apoya en el `@ds-tier` (core = estricto/usa el token; decorative = arbitrario a menudo legítimo).
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
| 3 | **Clasificada (B + tier)** — `role` + `tier` (core/decorative) máquina-legibles en el registry | `check-classification` + `check-tier` |
| 4 | **Compone primitivos** — no copia superficie | `check-composition-class` |
| 5 | **Modificabilidad (C)** — modelo de 4 categorías (ADR-033) ↓, *keyed on* `@ds-tier` | `check-region-integrity` + gates por dimensión (ruedan) |
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

## Norma C — modificabilidad: modelo de 4 categorías (ADR-033, amplía el binario de ADR-030)

La estrategia design-tokens ampliada (ECO-200) reemplaza el binario "color modificable / resto bloqueado" por
**4 categorías** de modificabilidad. Qué categoría aplica se decide por DIMENSIÓN × `@ds-tier` de la pieza:

1. **MARCA — modificable por satélite** (`[data-brand]` re-apunta el token): **color · radius · border-width ·
   shadow**. Cada uno es una escala de tokens; el satélite la re-apunta como ya hace con `--accent`.
2. **ESTRUCTURA-DS — bloqueada + tokenizada** (el DS la gobierna, NO satélite-modificable): **spacing interior ·
   medidas de pieza** (tamaños de diálogo/popup) **· atenuación/alpha semántica · tipografía · motion**.
3. **ESCAPE-HATCH — arbitrario legítimo** (no gateado): **layout one-off · spacing entre elementos** de una composición.
4. **ESTRUCTURA PURA — nunca tokenizable:** **markup · ARIA**.

**La LÍNEA estricto-vs-arbitrario** se apoya en `@ds-tier`: una pieza **core** es estricta (usa el token de su
escala canónica); una **decorative** (efecto cosechado) admite valor arbitrario a menudo legítimo. **Sombra**: hay
UNA sombra canónica (`--shadow-card`); un valor de sombra divergente en una core es deuda a reconciliar, no un
token nuevo (regla general: escala canónica pequeña, se reutiliza).

**Enforcement:** el eje `@ds-tier` (ECO-202) es el cimiento; el gate ESTRICTO por dimensión (radius/shadow/
border/spacing/atenuación, *keyed on tier*) **rueda por dimensión** en los pasos siguientes de la ejecución
design-tokens (no es big-bang). Excepción por-satélite: se **declara**, deliberada y visible. Propagación segura
por construcción; regla general primero, refinada por-pieza donde la realidad lo pida.

## Completitud — por qué no se vuelve a olvidar

El gate **`check-piece-complete`** (required, no-bypass) hace cumplir esto por la **colocación**: una pieza en
`Primitives/`/`Composite/` (promocionada) DEBE tener evidencia de los 11 pasos —incluida la **fidelidad al
estándar**— o el gate va **rojo y bloquea el merge**; las de `Migration/` están exentas (WIP). El **censo**
(`scripts/census.mjs`, visible en `Foundations/Corpus Status`) muestra el estado **por-paso** de cada pieza.
Estructura escrita **+ gateada** = no depende de que nadie la recuerde, y **promocionar a medias es imposible**.
