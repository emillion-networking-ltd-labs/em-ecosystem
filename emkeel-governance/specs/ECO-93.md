# ECO-93 — Refinar los componentes de `sections/` a la calidad de sat-cristian (estructura nueva, lenguaje neutro)

Strategy: satellite-design

## Resumen
Los componentes de `design-system/sections/*.tsx` se extrajeron de `satellites/sat-cristian-garcia` (el
satélite real desplegado = benchmark) pero quedaron **a medio afinar**: usan la escala tipográfica del
dashboard (tope ~24–36px), no la `text-display-*`, y les faltan los **patrones estructurales** que el sat
demostró. Este ticket **replica la ESTRUCTURA** que el sat probó y la implementa con **nuestros componentes
y lenguaje NEUTRO** (tokens del design-system) — no copia la piel "gym" del sat (uppercase/peso 900/dorado
de marca). El cliente tematiza luego por `--color-accent/-2`; el design-system es el **lienzo en blanco**.

Hallazgo del estudio: **la craft se logra casi entera con los tokens que YA existen** (`text-display-*`,
`font-display`, `font-serif`, `--color-accent-2`, `--gradient-brand`, superficies `surface-*`,
`shadow-card`). El gap es que los componentes no los usan + faltan 2 patrones transversales. Único token
nuevo: **motion** (`--duration-*`/`--ease-*`) para gobernar reveals/stagger sin números mágicos.

## Decisiones fijadas (operador)
- **Estructura del sat + lenguaje nuestro:** replicar la composición/estructura, implementada con nuestros
  primitivos y tokens neutros. Quedarnos con "lo nuevo" (la estructura), no con el estilo del cliente.
- **Titulares display SIN uppercase:** subir a `text-display-*` + `font-display` (peso fuerte), pero **no**
  uppercase por defecto (eso es marca del sat, no neutro).
- **"Cabecera firma" SIN separador:** eyebrow en `text-accent` + título display al lado; **sin** el `»»` del sat.
- **Tokens de motion:** añadir `--duration-fast/base/slow` + `--ease-out-expo` a `tokens.css` (append puro).

## Patrones transversales (cimiento)
1. **`SectionHeader` compartido** (neutro): eyebrow `text-accent` opcional + título `text-display-*` +
   subtítulo opcional + footer opcional "divisor + enlace" (líneas `border-dashed` tematizadas por token).
   Reemplaza el `Badge` apilado disperso por una cabecera coherente en todas las secciones.
2. **Escala display:** los titulares de sección suben a `text-display-*`/`font-display` (hoy ninguna lo usa).

## Alcance — refinar las 8 secciones existentes
- **Hero** (alto): titular `text-display-1`; variante media-con-overlay (`surface-inverse`, legibilidad) +
  stat-cards de cristal (`surface-subtle` + blur). **Pieza que fija la dirección — se valida primero.**
- **Portfolio** (alto): variante editorial — imagen panorámica + tarjeta de texto superpuesta
  (`-mt`/`z-10`/`shadow-card`), cuerpo `font-serif` a 2 columnas + drop-cap (`text-accent`).
- **Services** (medio): `SectionHeader` + footer divisor + índice/etiqueta por tarjeta.
- **Testimonials** (medio): `SectionHeader` + variante de STATS (números `text-display-3` accent, grid 2→4).
- **CTA** (medio): título `text-display-2` + variante `inverse` (envuelve `dark`) + reveal escalonado.
- **FAQ** (bajo): animar la apertura del `<details>` (MANTENER nativo, sin JS) + `SectionHeader`.
- **Pricing** (bajo): `SectionHeader`; ya casi idéntico/superior.
- **Contact** (—): sin gap real (es pieza de HECHOS, no formulario); solo alinear su cabecera al patrón.

## Acceptance Criteria
1. **Estructura+lenguaje:** cada sección refinada replica la estructura del sat con tokens NEUTROS (display,
   serif, accent/-2, surfaces, shadow-card) — **cero hex**, cero colores de marca del sat, sin uppercase por defecto.
2. **Cimiento:** existe `SectionHeader` compartido (neutro, sin `»»`) y los titulares de sección usan
   `text-display-*`; `tokens.css` gana los tokens de motion (`--duration-*`/`--ease-*`), append puro.
3. **Tematizable:** todo color sale de `--color-accent/-2` + tokens → el cliente cambia la marca sin tocar
   el componente (lienzo en blanco verificable conmutando el accent).
4. **Catálogo:** las stories reflejan las secciones refinadas (variantes nuevas visibles); `build-storybook`
   verde, story-coverage 77/77 + variant-coverage verdes, closure 5/5.
5. **Aislamiento:** el dashboard **no** se toca; suites `test:api`/`test:dashboard` + `dup:check` verdes,
   Dashboard-VRT verde. Cambios contenidos en `design-system/` (sections + tokens + un nuevo SectionHeader + stories).
6. **Gates** verdes (`Strategy: satellite-design`, ticket ECO-93), Security Pipeline (sin secretos).

## Out of scope (piezas NUEVAS del sat sin contraparte → tickets futuros)
- `AppPreview` (promo de app), `TransformationsPreview` (carrusel before/after), `SocialProofSection`
  (banda de stats como sección propia), `ContactForm` (formulario real con consentimiento GDPR).
- La "newspaper card" editorial como pieza/treatment reutilizable independiente.
- Repoint del dashboard; baselines VRT del catálogo.

## Alignment
Refuerza `satellite-design` (pilar B): el design-system como Core del que la IA compone satélites **bellos
por composición gobernada**, no por plantilla. Refinar las sections a la calidad probada por `sat-cristian-garcia`
—con estructura nueva pero lenguaje NEUTRO tematizable— sube el casillero visual del catálogo (pilar A) y da a
la IA secciones de calidad real como vocabulario. Aditivo y aislado del dashboard ([ADR-019]).
