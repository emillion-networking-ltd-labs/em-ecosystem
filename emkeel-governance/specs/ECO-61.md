# ECO-61 — Satélites F7a: pilar de imágenes (1ª tanda) — USAR LOS ASSETS REALES del cliente

Strategy: satellites

## Resumen
Primera tanda del **pilar P5** ([ADR-011](../adr/011-satellite-image-assets.md), opción 1): **ingerir y
renderizar los assets que el cliente YA tiene** — logo + fotos reales. **NO** toca la generación IA todavía
(eso es **F7b**). Cierra el síntoma visual del piloto **Grupo Atis** (logo solo en metadata, ~1834 imágenes
reales sin usar, Hero solo-texto).

## Contexto / base (estado a cambiar)
- El logo se capturaba (`seo.logo`) pero solo iba al **metadata OG/JSON-LD**, **nunca en pantalla**.
- El generador **no copiaba ningún asset** al `public/` del satélite.
- El **Hero** parametrizado (`design-system/sections/Hero.tsx`) quedó **solo-texto** (perdió el visual de SAT01);
  Portfolio pintaba imagen por `background-image`; otras secciones no.

## Decisiones que resuelve

### D — Ingestión de assets REALES → `public/images/`
El generador copia los ficheros REALES del cliente (logo + fotos) desde su ubicación (intake/repo) a
`<dest>/public/images/`. **SOLO assets reales** (`provided`/`extracted`) cuyo path apunte a un **fichero
legible**; un asset `proposed`/`missing` o un path sin fichero → **no se ingiere** (la generación decorativa
para rellenar es **F7b**). Un logo en **URL http(s)** se respeta tal cual para OG/JSON-LD (sin copia). Los
assets ingeridos quedan **horneados en `public/`** → propiedad y código que controlamos (§D5 / ownership).

### D — Render on-screen con `next/image` (optimización + formatos modernos)
- **Logo en el header/nav** (antes ausente) — `next/image` (local), `priority`; remoto/ausente → marca textual.
- **Hero**: `imageSrc` restaura el visual (layout split texto+imagen, `priority` para el LCP).
- **Portfolio**: `next/image` para los items con foto real; `title` opcional → una **galería** (`gallery`) de
  fotos reales son tiles solo-imagen.
- **Services**: `imageSrc` opcional por servicio (foto real ilustrativa).
- **Guardrail**: solo assets REALES; si una sección necesitaría imagen y no hay → **se omite con gracia**
  (omit-if-absent), **nunca** un placeholder feo ni inventar.

### D — Firma de marca
*"Powered by EM Ecosystem"* en el footer (como SAT01).

### D — Cross-mode
Funciona para **cualquier modo** con assets reales (b/c/d los usan; a casi no tiene → mayormente omite hasta F7b).

## Scope
- `generate-satellite.mjs`: `realAssetFile` + ingestión (`ingestPath`/`ingestAsset`, copia a `public/images/`,
  dedup) + wiring logo/heroImage/services/portfolio/gallery; LAYOUT logo en header + firma del footer.
- `design-system/sections/`: `Hero` (imagen + split), `Portfolio` (`next/image` + `title` opcional), `Services`
  (`imageSrc` opcional).
- Tests (sin red). **NO** toca generación IA (F7b), ni el SEO/i18n/preview, ni el modelo de procedencia.

## Acceptance Criteria
1. **Ingestión**: los assets REALES (logo + fotos) se copian a `public/images/`; solo `provided`/`extracted` con
   fichero legible; `proposed`/`missing`/inexistente → **no se ingiere**.
2. **Logo on-screen** en el header con `next/image` (antes ausente); sigue alimentando OG/JSON-LD.
3. **Hero** restaura el visual con la foto real; **Portfolio** con fotos reales (`next/image`); **Services** con
   foto real opcional.
4. **Omit-if-absent**: sin asset real, la sección se omite con gracia (sin placeholder, sin inventar).
5. **Firma** *"Powered by EM Ecosystem"* en el footer.
6. **Cross-mode**: cualquier modo con assets reales los usa.
7. **e2e**: re-generar **Grupo Atis** → logo en pantalla + fotos reales renderizadas + firma; `next build` verde;
   visible en el **preview local**. Cliente **SIN assets** → omite con gracia (sin imágenes rotas).
8. **Gates verdes**: `gates` (`Strategy: satellites`, `check_ticket_link` ECO-61), Security Pipeline; tests
   skill + registry verdes.

## Out of scope (= F7b)
- **Generación IA** de un set decorativo (Flux vía gateway) para rellenar huecos.
- Optimización avanzada / re-encode de imágenes pobres más allá de lo que `next/image` ya da.
- Selección automática de qué fotos del intake usar (en F7a las elige el agente en el onboarding).

## Alignment
Implementa la **1ª tanda del pilar P5** del norte (`strategy/satellites.md` §«Re-aim ECO-60» / F7 / ADR-011 —
opción 1): usar los assets **reales** del cliente, on-screen, optimizados, horneados en `public/` (ownership).
Honra el **split verdad/diseño** (§D4) aplicado a imágenes: **solo assets reales** (`extracted`/`provided`),
nunca fabricados; sin asset real → omit-if-absent (jamás un placeholder). La **generación decorativa** (lo que
rellena huecos) queda explícitamente para **F7b**. No toca el SEO/i18n/preview ni el modelo de procedencia.
