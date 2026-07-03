# ADR-025 — Niquelado de las primitivas de layout (escala de gap única, Grid responsive, Cluster, Section inverse)

- Status: accepted
- Date: 2026-07-03
- Ticket: [ECO-131](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-131)
- Strategy: satellite-design
- Deciders: Operador (human gate vía review + merge del PR)
- Contexto de gobierno: repo gobernado por Emkeel (ver `AGENTS.md`). Endurece las primitivas de layout creadas
  en ECO-86 (Section/Container/Grid/Stack/Split). **Prerequisito de [ECO-120](...)** (refactor de las secciones
  a las primitivas): las secciones no deben adoptar primitivas con defectos → primero se dejan "niqueladas".

## Contexto

La revisión de calidad de la sección Layout (código + Storybook + benchmark contra Radix Themes, Chakra UI,
Braid, MUI, Every Layout) destapó defectos que hacían huir a las secciones de las primitivas y que se
propagarían al refactor:

- **`gap` inconsistente:** cada primitiva tenía SU escala → `gap="md"` valía 24/16/32 px según fuera
  Grid/Stack/Split. Footgun de DX: el mismo token daba resultados distintos.
- **`Grid.cols` rígido:** el número mapeaba a una curva responsive FIJA (1→2→3); no expresaba 1→3 (bug vivo
  en Pricing: en tablet salían 2 columnas + una tarjeta huérfana) ni control por breakpoint.
- **Falta `Cluster`:** no había primitiva para una fila horizontal con wrap (chips, grupos de botones) — cada
  sección lo improvisaría con Tailwind crudo, justo lo que el DS quiere evitar.
- **`Section surface="inverse"` superficial:** solo cambiaba `bg`+`text`; cualquier hijo con otro token
  seguía en tema claro → texto oscuro sobre fondo oscuro. Por eso CTA usaba `.dark` a mano (patrón duplicado).
- **`Container prose`=768px** no cumplía la medida de lectura que prometía (≈90–100 car. vs 45–75).
- **`Split.stackAt` clavado en `lg`**; `as`/polimorfismo ausente en Stack/Grid/Split; sin `align`/`justify`.

## Decisión

Niquelar las primitivas (alcance crítico + debería), alineado con los estándares de industria:

1. **Escala de gap ÚNICA y compartida** (`lib/layout.ts`): un solo mapa clave→px (`none/xs/sm/md/lg/xl/2xl`
   = 0/8/16/24/32/48/64, rejilla 8pt) que consumen Grid/Stack/Split/Cluster → `gap="md"` significa lo MISMO
   en todas. Lo que difiere por ROL es el DEFAULT (Stack apretado `sm`, Grid `md`, Split aireado `xl`), no la
   definición de la clave. (Patrón Radix/Braid: escala de spacing única.)
2. **`Grid.cols` flexible:** acepta un número (curva mobile-first 1→2→N) **o** un objeto responsive por
   breakpoint (`{ base, sm, md, lg, xl }`) → expresa 1→3 y cualquier curva. Además `minItemWidth` para columnas
   content-driven (`auto-fit`/`minmax`). Clases en tabla ESTÁTICA (Tailwind escanea literales). + `align`/`justify`.
3. **`Cluster` (primitiva nueva):** fila horizontal con `flex-wrap`, gap de la escala compartida, `align`/
   `justify`/`wrap`/`as`. Cubre chips, filas de botones, logos, metadatos. (Every Layout "Cluster" / Braid "Inline".)
4. **`Section surface="inverse"` abre un SCOPE DE TEMA OSCURO** (clase `dark` + `bg-surface-primary`): todos los
   tokens de los hijos se resuelven en oscuro → sin trampas de contraste. CTA podrá migrar de `.dark` manual.
   Escala de spacing 8pt con `md` (banda de marketing 80→96) como DEFAULT y `sm` que ahora sí escala por breakpoint.
5. **`Container`:** `prose` = `max-w-prose` (65ch, medida de lectura real); `xl` = ancho canónico de marketing
   tokenizado en `--content-max` (1280, fuente única); `lg` (1152) queda como default de propósito general
   (alineado con MUI/Radix). El dashboard mantiene su ancho de app (1200) — otra superficie, no consume el token.
6. **`as`/polimorfismo** en Stack/Grid/Split/Cluster; `align`/`justify` donde faltaban; `Split.stackAt`
   configurable (md/lg/xl) + ratios 4-8/8-4.

## Consecuencias

- Las secciones (ECO-120) adoptarán primitivas sólidas: `gap` predecible, `Grid` que expresa su curva real,
  `Cluster` para grupos, bandas oscuras sin romper contraste.
- Cambio de significado de algunas claves `gap` (unificación) y del default de Section (`lg`→`md`) y Container
  `prose` (768→65ch): solo afectan a stories y a la prueba de Pricing (las secciones aún no adoptaban las
  primitivas), sin impacto en producto. El refactor de secciones (ECO-120) revisará cada cambio visual en Storybook.
- Diferido a nice-to-have / futuro: `gap`/`cols` responsive por breakpoint en TODAS las props (hoy solo `cols`),
  primitiva `Cover` (hero full-height), Flex genérico, decoplar `align`↔texto en Stack.
