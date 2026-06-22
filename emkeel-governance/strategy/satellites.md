# Strategy: satellites

Status: APPROVED (base) · RE-AIM ECO-60 PENDIENTE (gate humano)   <!-- base aprobada 2026-06-18; refinamiento ECO-52 (diseño híbrido + producto SEO-ready) aprobado 2026-06-22; re-aim ECO-60 (SERVICIO con oficio + pilar de imágenes P5) PENDIENTE de aprobación en el gate humano -->
Strategy: satellites   <!-- feature specs reference this with a `Strategy: satellites` line -->

## Goal
Decidir el NORTE de un **SERVICIO de creación de satélites con OFICIO de agencia** (—no un builder genérico ni "un Lovable gobernado"—, con nuestro sistema de componentes, nuestros gates y el **código en nuestro control**; AIM re-apuntado en §«Re-aim ECO-60») para lanzar satélites (sitios de cliente) que sean un **PRODUCTO profesional, FIEL al cliente, SEO-ready y escalable** (no una simple web desplegada), de forma **recurrente, rápida y automatizada**: el **mecanismo de reuse** de nuestro UI Core (pieza base hoy inexistente), el **onboarding** multi-modo, la **generación** que reutiliza componentes (no greenfield), la **capa de diseño** (secciones gobernadas + SEO técnico de fábrica), la **automatización** end-to-end (Jira + GitHub + Vercel), la **gobernanza** (gates) y la **fasificación**. NO el cómo-paso-a-paso (eso es el runbook).

> **Elevación del norte (refinamiento ECO-52 — APROBADA, human gate 2026-06-22):** de *"genera un sitio"* a **"genera un PRODUCTO profesional, optimizado para indexar/rankear y escalable"**. Lo concreta la §«Refinamiento ECO-52» (enfoque de diseño **híbrido, opción 3**, ver [ADR-010](../adr/010-satellite-design-generation.md)). Absorbe y **supera** la sección de enfoque de diseño que abrió el PR #435 (cerrado como superado).

## Context
<!-- grounded facts ONLY — cite file:line (repo) o URL (mercado) for every claim -->

**Qué es HOY un satélite (A1 — SAT01, nuestro primer satélite ya creado):**
- `satellites/sat-cristian-garcia/` es una **app Next.js 16 + TypeScript + Tailwind + App Router** (`satellites/sat-cristian-garcia/package.json`), multi-ruta (7 rutas: `satellites/sat-cristian-garcia/src/app/page.tsx` + `sobre-mi/`, `servicios/`, `portfolio/`, `testimonios/`, `precios/`, `contacto/`), con hardening S2 (6 cabeceras `satellites/sat-cristian-garcia/next.config.mjs:15-26`, observabilidad `satellites/sat-cristian-garcia/src/app/layout.tsx:68-69`).
- Es un **EJEMPLO ya creado, no una herramienta**: nació reutilizando por **COPIA MANUAL** el UI Core del dashboard — *"Copy UI Core components from `nexacore-dashboard/src/components/ui/` to the new satellite's `src/components/ui/`"* (`docs/satellite-deployment-runbook.md:140-142`).

**El acelerador real es NUESTRO sistema de componentes (A2):**
- El **UI Core vive en el dashboard** y `/admin/design-system` es la **fuente de verdad** — *"Usar componentes `ui/` y tokens semánticos … `/admin/design-system` es la fuente de verdad"* (`CONTRIBUTING.md:73-75`).
- Catálogo real: **48 componentes** en `nexacore-dashboard/src/components/ui/` (p.ej. `Button.tsx`, `Input.tsx`, `Select.tsx`, `Tabs.tsx`, `FormField.tsx`…).

**El problema base a resolver: NO existe mecanismo de reuse, y la copia manual DERIVA (A3 — medido, no asumido):**
- **No hay `em-ui` CLI:** SCRUM-331 (el CLI de distribución de UI Core a satélites) está solo *referenciado* en el runbook como futuro — *"Once SCRUM-331's `em-ui` CLI ships, replace manual copy"* (`docs/satellite-deployment-runbook.md:140-142`; ver también `:27` y `:444`) — **nunca se implementó**.
- **No hay monorepo workspace / paquete compartido:** el `package.json` raíz no declara `workspaces` (`package.json:1`) y no existe `packages/`.
- **La copia manual ya divergió:** SAT01 copió **17 de los 48** componentes (`satellites/sat-cristian-garcia/src/components/ui/`), y al menos `Button` **derivó** del original: el SAT01 reescribió la resolución de `as`/`href` y **perdió los atributos de accesibilidad** `role="status"` / `aria-label="Loading"` que sí tiene el dashboard (`nexacore-dashboard/src/components/ui/Button.tsx:87`). ⇒ La copia manual es un generador de drift: sin single-source, los 17 divergen y arrastran regresiones (a11y) que los gates del satélite deberían cazar.

**"Lanzado" significa S2 PASS (A4 — definido por el runbook):** S1 deja el sitio *"technically deployed"*; el umbral es **S2** — *"production-grade … MANDATORY before inviting real users"* (`docs/satellite-deployment-runbook.md:262-268`), Lighthouse Perf≥90/SEO≥95/BP≥95/A11y≥90 (`docs/satellite-deployment-runbook.md:337`). El objetivo del operador: un satélite nuevo **~90% alineado** al cliente y a nuestra estandarización al lanzar, como SAT01.

**Gobernanza — y sus 2 HUECOS reales (A5):**
- Required checks de `main`: `gates` y `Security Gate (All Checks)` (branch protection, GitHub API).
- **HUECO 1:** el Security Pipeline NO audita satélites — matrix fijada a `[nexacore-api, nexacore-dashboard]` (`.github/workflows/security.yml:64-65`).
- **HUECO 2:** el gate visual/a11y está hardcoded a SAT01 — paths `satellites/sat-cristian-garcia/**` (`.github/workflows/visual-regression.yml:31-35`) y job sobre esa carpeta fija (`.github/workflows/visual-regression.yml:203`) ⇒ un satélite nuevo NO queda gateado hasta editar el workflow.

**Cómo lo resuelve el mercado (A6 — research, ver §Sources):**
- **Distribución de design system — modelo registry + CLI (shadcn/ui):** copia el código fuente al proyecto consumidor (ownership), con un `registry.json` servido por HTTP e instalación vía CLI (`shadcn add @acme/button`); y en 2026 un `registry:base` distribuye **el design system entero (componentes + tokens + config) en un solo install**. *(ui.shadcn.com/docs/registry/getting-started, /docs/cli)*
- **Paquete compartido en monorepo (Turborepo/pnpm workspaces):** `packages/` para librerías + `apps/` para apps; el satélite **importa** `@em/ui` (cero copia, single-source fuerte) con caché de build. *(turborepo.dev/docs)*
- **Prompt-to-deployed (Lovable/v0/bolt):** Lovable hace *two-way GitHub sync* y auto-deploy (Netlify); v0 *one-click deploy* a Vercel; bolt export a GitHub. Confirma que el patrón "intake → genera → repo → deploy" es estándar. *(emergent.sh/learn/v0-vs-lovable-vs-bolt)*

## Options
<!-- ≥2 real options; cada celda Source = un único file:line COMMITEADO o URL bien formada. `emkeel strategy check` lo exige. -->
> El eje de decisión es el **mecanismo de reuse** (pieza base). Cada celda Source es un único `file:line` commiteado o URL; las citas de apoyo van en Pros/Cons y §Sources.

| # | Option (mecanismo de reuse) | Source | Pros | Cons | Risk |
|---|--------|--------|------|------|------|
| 1 | **Status quo — copia manual** del UI Core a cada satélite | docs/satellite-deployment-runbook.md:140 | Cero infra; arranque inmediato; cada satélite es dueño de su copia | **Genera drift** (Button ya perdió a11y, `Button.tsx:87`); 17/48 copiados; sin single-source; irreproducible | **Alto**: divergencia y regresiones silenciosas; incumple "recurrente gobernado" |
| 2 | **Registry + CLI interno (estilo shadcn)** — `em-ui` sobre el UI Core del dashboard como única fuente; el satélite *pull-ea* componentes+tokens (ownership) vía CLI; **es SCRUM-331 bien hecho** | nexacore-dashboard/src/components/ui/Button.tsx:1 | Single-source = dashboard; ownership por satélite (permite tweaks per-cliente) **sin** refactor a monorepo; `registry:base` instala design system entero; re-pull gobernado **resuelve el drift** (https://ui.shadcn.com/docs/registry/getting-started) | Hay que **construir** el registry+CLI (es el scope real de SCRUM-331); el re-pull no es automático (disciplina + gate) | Medio: coste de construir la pieza base, acotado y reutilizable |
| 3 | **Paquete compartido en monorepo (pnpm/Turborepo)** — `@em/ui` importado por dashboard y satélites | nexacore-dashboard/package.json:1 | Single-source más fuerte (import, **cero copia**, sin drift posible); caché de build (https://turborepo.dev/docs) | Exige **convertir el repo a workspaces** (hoy el `package.json` raíz no declara `workspaces`); un paquete inmutable **pelea con la divergencia per-cliente** que un satélite necesita | Medio-alto: refactor grande del repo + rigidez para personalizar por cliente |
| 4 | **Paquete npm publicado** — `@em/ui` versionado y publicado, consumido como dep | satellites/sat-cristian-garcia/package.json:1 | Versionado estándar (semver); desacopla del repo | Overhead de publish/release; **misma rigidez** que (3) frente a tweaks per-cliente; el satélite añade otra dep externa | Medio: fricción operativa sin resolver la personalización |

## Recommendation
<!-- which option + why — this is judgment; the human approves it at the gate -->
**APROBADA por el operador (human gate, 2026-06-18): Opción 2 (Registry + CLI interno estilo shadcn, `em-ui`) como mecanismo de reuse**, sobre el que se construye el sistema de facilitación `/launch-satellite`.

> **Matiz clave de la 2 (decidido a propósito): es COPIA GOBERNADA con reconciliación, NO "cero copia".** Se elige precisamente porque los satélites **necesitan divergir per-cliente** (colores/marca, a veces un componente) y un paquete inmutable (workspace/npm) lo impediría. Single-source = dashboard UI Core; *ownership* por satélite; el **re-pull gobernado + el gate de a11y** hacen el drift **detectable y reconciliable** (la regresión real del `Button` — `nexacore-dashboard/src/components/ui/Button.tsx:87` — es la prueba de por qué hace falta).

**Por qué la 2 y no las demás:**
- La **1 (copia manual)** es el estado actual y ya falló: `Button` perdió a11y (`nexacore-dashboard/src/components/ui/Button.tsx:87` vs la copia del satélite). No es norte, es la deuda a cerrar.
- La **3 (workspace)** da el single-source más fuerte pero exige convertir el repo a workspaces (hoy inexistentes, `package.json:1`) y un paquete importado **resiste la divergencia per-cliente** que un satélite necesita (cada cliente cambia colores/marca, a veces un componente). La **4 (npm)** hereda esa rigidez y añade release overhead.
- La **2** es el punto óptimo para nuestro caso: **single-source = dashboard UI Core** (lo que `CONTRIBUTING.md:73-75` ya declara fuente de verdad), pero **copiando con ownership** (el satélite puede personalizar) y con un **re-pull gobernado** que hace el drift *detectable y reconciliable* en vez de invisible — justo lo que el modelo shadcn resuelve (https://ui.shadcn.com/docs/registry/getting-started), y **sin** refactor a monorepo. Es **SCRUM-331 ejecutado de verdad**, validado aquí como el candidato correcto (no como respuesta dada).

**El sistema de facilitación `/launch-satellite` (norte, apoyado en la Opción 2):**
1. **Onboarding guiado** — antes de generar, elegir modo de entrada (la IA NUNCA fabrica diseño desde cero; parte del UI Core + estructura SAT01):
   - **(a) Cliente SIN diseño/marca** → UI Core + estructura de SAT01 como referencia; pregunta datos reales (negocio, servicios/precios, contacto) y propone paletas/tipografías.
   - **(b) Cliente CON diseño/marca** → introducir/aplicar sus tokens (colores, tipografía, logo) sobre el UI Core.
   - **(c) Mejorar un sitio existente** → tomar sus **hechos** (contenido, estructura, marca) y **remodelar con valor** usando nuestros componentes (UI Core, `nexacore-dashboard/src/components/ui/`), **no fotocopiarlo**. El **default es remodel moderno con valor añadido**; el cliente elige la fidelidad (ver §«Modo (c) — remodelar con valor» abajo). Los **hechos** son `extracted`/`provided`; el diseño/redacción **nuevos** son `proposed` (a confirmar).
   - **(d) Perfil de Instagram** → extraer fotos/bio/datos como contenido real.
   - **(e) Páginas de inspiración** → referencia de diseño.
   Colores del cliente/marca/IG **solo si se piden o se extraen** (regla: no inventar datos).
2. **Generación que reutiliza componentes** (vía el registry, no greenfield) y **adapta a la forma satélite** (Next.js multi-ruta en monorepo, como SAT01) hasta **S2 PASS** (`docs/satellite-deployment-runbook.md:262-268`).
3. **Automatización end-to-end** — el skill crea **proyecto Jira + sprint inicial + sus tickets** de creación, **repo/carpeta en GitHub**, y **deploy en Vercel** (nuestro target en monorepo, no Netlify) — el patrón "intake→genera→repo→deploy" que Lovable/v0 ya prueban (emergent.sh/learn/v0-vs-lovable-vs-bolt), pegado a nuestro flujo (Jira ECO/SAT, GitHub, Vercel).
4. **Gobernanza** — la salida pasa los gates; se cierran los 2 huecos: satélites en la matrix de `.github/workflows/security.yml:64-65` y VRT/a11y **auto-discovered** en vez de hardcoded a `sat-cristian-garcia` (`.github/workflows/visual-regression.yml:31-35`). El gate de a11y habría cazado la regresión del `Button`.

**Modo (c) — remodelar con valor (no fotocopiar): gate de fidelidad, split verdad/diseño, loop**

El satélite es una **herramienta de facilitación** (tipo Lovable — `emkeel-governance/strategy/satellites.md:7`), **no una fotocopia**: debe **aportar valor** — diseño, frescura, tecnología moderna y **nuestros componentes** (UI Core, `nexacore-dashboard/src/components/ui/`, fuente única en `design-system/components/` vía em-ui). Por eso el modo (c) **ya no se limita a "cambiar solo colores"**.

- **Gate de fidelidad — lo elige el cliente; default = aportar valor:**
  - **(A) Réplica fiel** → el mismo sitio llevado a la tecnología satélite (Next.js + hardening S2), sin rediseño.
  - **(B) Remodel moderno con nuestros componentes — *DEFAULT*** → conserva los **hechos** del cliente y los presenta con un diseño fresco sobre el UI Core. Premisa del operador: *"aporta valor… salvo que el cliente tenga otra idea."*
  - **(C) Reimaginación libre** → propuesta de diseño/estructura nueva a partir de los hechos.

- **Split verdad/diseño — qué significa "no inventar":** "no inventar" = **no mentir sobre los HECHOS**; nunca significó "no crear".
  - **HECHOS del cliente** (nombre, servicios, contacto, copy real, assets de marca) → `extracted`/`provided`, **jamás fabricados** (`.claude/skills/launch-satellite/schema/brief.schema.json:49`; el contrato declara que `missing`/`proposed` se rinden como pendientes, **"nunca como datos fabricados"** y *'invented' no existe* — `.claude/skills/launch-satellite/schema/brief.schema.json:5`).
  - **CREATIVIDAD** (diseño, frescura, redacción nueva, secciones sugeridas) → `proposed`: **bienvenida**, etiquetada y **a confirmar** (`proposed` = *"sugerencia pendiente de confirmar"*, `.claude/skills/launch-satellite/schema/brief.schema.json:49`). Confirmar la vuelve `provided`.

- **Loop iterativo (a lo Lovable):** el agente **propone** → **preview** → el operador/cliente **refina en prosa** → **regenera** → **confirma** (`proposed`→`provided`). La barra técnica de cada iteración la fija **S2 PASS** (`docs/satellite-deployment-runbook.md:262-268`). Nada externo (Vercel/Jira) se ejecuta sin **gate humano** (dry-run-first), consistente con la Fase 3.

**Cómo cubre el CASO DE PRUEBA (validación del norte):**
- *Modo (a), cliente nuevo sin diseño:* onboarding pregunta datos reales (o IG) → `/launch-satellite` *pull-ea* UI Core+tokens del registry y scaffolda la estructura SAT01 → genera `satellites/sat-<x>/` Next.js reusando componentes → crea Jira (proyecto+sprint+tickets) + GitHub + deploy Vercel → S2 + gates → "lanzado" ~90% alineado. ✔ cubierto por reuse(2)+onboarding(1)+generación(2)+automatización(3)+gobernanza(4).
- *Modo (c), cliente CON web:* onboarding toma sus **hechos** → **remodela con valor** (default B; o A/C si el cliente lo pide) con nuestros componentes → adapta a forma satélite hasta S2 + gates, en un **loop iterativo** (propone→preview→refina→confirma). ✔ cubierto; la 2 lo permite porque la copia es personalizable y con *ownership* (la 3/4 lo dificultarían).

## Refinamiento ECO-52 — de "genera un sitio" a "genera un PRODUCTO profesional"

**Estado: refinamiento del norte — APROBADO (human gate, 2026-06-22): enfoque de diseño HÍBRIDO (opción 3)** +
elevación del Goal a producto profesional SEO-ready ([ADR-010](../adr/010-satellite-design-generation.md)).
Supera la sección «enfoque de diseño»
del PR #435 (su decisión 1/2/3 se absorbe aquí, enriquecida con investigación de mercado real; #435 cerrado
como superado). Cierra el
**fallo del piloto** (el remodel de Grupo Atis salió *más feo* que el original). Reconcilia con §D4 (intent +
split verdad/diseño), §D5 (brief persistido) y el reuse vía em-ui — **no los re-litiga**.

### Hueco medido (de partida)
El generador emite hoy `robots.ts` + `sitemap.ts` + `metadata` básica + 6 cabeceras
(`.claude/skills/launch-satellite/scripts/generate-satellite.mjs:117`), pero **NO Open Graph, NI datos
estructurados (Schema.org/JSON-LD), NI breadcrumbs**; el listón es un Lighthouse **lab** (`docs/satellite-deployment-runbook.md:337`).
Y el output de diseño es un **esqueleto** (subpáginas en stub) frente al vocabulario de secciones que SAT01
tiene **solo hecho a mano** (`satellites/sat-cristian-garcia/src/components/sections/HeroSection.tsx:1`).

### El eje de decisión: enfoque de generación de DISEÑO (absorbe #435)
| # | Enfoque | Source | Pros | Cons | Riesgo |
|---|---|---|---|---|---|
| 1 | **Biblioteca de secciones determinista** — vocabulario parametrizado (hero, features, pricing, testimonios, CTA, FAQ, contacto, footer) que el generador compone desde el brief | `satellites/sat-cristian-garcia/src/components/sections/HeroSection.tsx:1` | reproducible; S2/a11y por construcción; reuse em-ui; el vocabulario es el estándar del sector (Tailwind UI Marketing: 16 categorías de sección, https://tailwindcss.com/plus/ui-blocks/marketing) | output acotado al catálogo; cada vertical nueva = sección nueva | bajo (repro/gobernanza); riesgo "plantillero" si el catálogo es pobre |
| 2 | **Bespoke por IA al generar** — la IA maqueta cada satélite a medida | https://docs.lovable.dev/prompting/prompting-one | máxima libertad de diseño | **NO reproducible** (rompe §D4/§D5); S2/a11y/SEO no garantizados por construcción; difícil de gobernar | **alto**: choca con repro y gobernanza |
| 3 | **Híbrido** — biblioteca determinista como **sustrato gobernado** + el agente **propone** tipo/secciones/composición/redacción como `proposed`, confirmable en el loop | `.claude/skills/launch-satellite/schema/brief.schema.json:48` | reproducible **y** creativo; S2/a11y/SEO por construcción; **es lo que hace TODO builder con IA** (Lovable construye sección a sección hero→features→testimonios→CTA y *pregunta antes de generar*, https://docs.lovable.dev/prompting/prompting-one; v0 genera variaciones, https://vercel.com/blog/how-to-prompt-v0) | hay que modelar "tipo + composición elegida" en el brief; creatividad acotada al catálogo+parámetros | medio (complejidad), bajo en repro/gobernanza |

**Reproducibilidad** (§D5) y **gobernanza por construcción** descartan (2); (1) es el sustrato de (3). La
investigación confirma que el sector entero opera en (3): el AI propone una estructura de secciones nombrada
y el usuario refina en un loop (Lovable, v0, Framer, Wix, bolt — todos prompt→preview→refinar).

### Los 4 pilares del refinamiento (todos cuelgan de la opción 3 híbrida)

**P1 — Producto profesional, SEO-ready, escalable (subir el listón por encima del S2 actual).** El satélite
nace **listo para indexar y rankear**, no solo desplegado. Se eleva el gate de fábrica con SEO técnico
**generado por construcción**:
- **Meta por página** únicas y descriptivas (título + `meta description` por ruta) — Google Search Central
  (https://developers.google.com/search/docs/appearance/snippet).
- **Open Graph** (`og:title/type/image/url`) en el layout — protocolo OGP (https://ogp.me/).
- **Datos estructurados JSON-LD** (Google recomienda JSON-LD): **Organization** + **LocalBusiness** (subtipo
  más específico) + **BreadcrumbList** — Google structured-data (https://developers.google.com/search/docs/appearance/structured-data/local-business).
- **HTML semántico + landmarks** (header/nav/main/footer, jerarquía de headings) — beneficio SEO+a11y (MDN,
  https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Accessibility/HTML).
- **Listón medible más alto que el lab actual, en dos planos:**
  - *Gate de lanzamiento (lab, por construcción):* además del Lighthouse S2, exigir los **audits SEO nombrados**
    de Lighthouse (meta-description, descriptive link text, `rel=canonical` válido, structured-data válido…) —
    no solo el agregado ≥95 — más OG y JSON-LD presentes y válidos.
  - *Objetivo post-lanzamiento (campo, monitorizado — NO gateable al lanzar por falta de tráfico):* **Core Web
    Vitals "good" p75: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1** (web.dev, https://web.dev/articles/vitals). El
    lab no garantiza el campo, así que el campo es objetivo de seguimiento, no condición de "lanzado".

**P2 — Onboarding: tipo de sitio + secciones que el agente SUGIERE.** Antes de generar, **preguntar el tipo**
(multipágina de negocio / landing / portfolio / otros) — patrón estándar de los builders (taxonomía por tipo;
Webflow clasifica plantillas en 26 categorías, https://webflow.com/templates/categories). Según **tipo +
negocio**, la IA **propone** las secciones adecuadas del catálogo (no solo pregunta) y el usuario confirma/ajusta
(estilo Lovable). Se acopla a los modos a/b/c/e ya existentes; el tipo y las secciones entran al brief como
**`proposed`** (confirmables) — encaja con el loop §D4.

**P3 — Subir el listón de calidad de diseño (el fallo del piloto).** Regla dura: **un remodel (c) SIEMPRE
mejor que el original, nunca peor.** Diseño fresco, marca aplicada (los `brandTokens` del brief → tokens em-ui,
`.claude/skills/launch-satellite/schema/brief.schema.json:48`), resultado claramente superior. Operacionalmente:
la composición sale de la **biblioteca de secciones gobernada** (opción 3), no de un stub; se ata a un
**criterio de "mejor que el original"** verificable en el loop (preview + el listón P1 + revisión humana en el gate de fidelidad).

**P4 — Válvula de escape "que la IA recomiende / sorpréndeme" en cada menú.** En cada menú (tipo, secciones,
diseño) la última opción es **"que la IA elija la mejor configuración según el negocio"** — no una lista cerrada
(el patrón "generar variaciones / deja que la IA decida" de v0/Hostinger, https://vercel.com/blog/how-to-prompt-v0).
Es la **cara abierta de la opción 3**. **Guardrail (heredado de §D4):** la válvula aplica a **diseño/estructura/
secciones** (capa `proposed`, confirmable en el loop), **NUNCA a los HECHOS** (negocio/servicios/precios/contacto
= siempre `extracted`/`provided`, jamás inventados — `.claude/skills/launch-satellite/schema/brief.schema.json:49`).

### Decisión — APROBADA (human gate, 2026-06-22): Híbrido (opción 3)
**Híbrido (opción 3)** como enfoque de diseño, con los 4 pilares colgando de él: **(1)** sustrato de secciones
gobernado (SEO/a11y/CWV por construcción) que **eleva el producto a profesional** (P1); **(2)** onboarding que
pregunta el **tipo** y la IA **propone secciones** (P2); **(3)** regla "remodel siempre mejor" anclada al
catálogo + el listón medible (P3); **(4)** válvula "la IA recomienda" en cada menú, acotada a la capa `proposed`
y **nunca** a los hechos (P4). Es el único enfoque **reproducible y gobernado** que además **es el estándar del
sector** para builders con IA. **Decisión arquitectónica registrada en [ADR-010](../adr/010-satellite-design-generation.md)**;
los ECO de seguimiento van en §Fasificación (F4–F6).

## Re-aim ECO-60 — de "Lovable gobernado" a SERVICIO con OFICIO + pilar de IMÁGENES

**Estado: re-apunte del norte — PENDIENTE DE APROBACIÓN (gate humano, ECO-60).** NO destruye la base (código
propio, biblioteca de secciones, no-inventar HECHOS, em-ui, F1–F6, ADR-010 — son correctos): **re-apunta el AIM**
y **añade el pilar de imágenes/assets** (el gran hueco que hundió el piloto Grupo Atis). Reconcilia con §D4/§D5/§D6
y ADR-010; **no los re-litiga**.

### Por qué (fallo del piloto Grupo Atis, modo c)
El remodel salió **peor que el original**: soso, sin imágenes, sin creatividad. Dos causas medidas:
1. **Benchmark equivocado.** Nos comparamos con builders genéricos (Lovable/v0) en vez de con *"mejor que el
   original del cliente, sensación bespoke"*. No es nuestra liga ni nuestro objetivo.
2. **El guardrail "no inventar" se aplicó también al DISEÑO**, ahogándolo. El diseño **no es un hecho**.

### Re-aim 1 — qué ES el norte (corrige la framing "tipo Lovable")
NO es "ser un Lovable gobernado" ni competir con builders genéricos. Es un **SERVICIO** que produce sitios de
cliente **FIELES, con OFICIO/creatividad de agencia, y con el CÓDIGO en nuestro control** (escalable, propiedad
nuestra). **Benchmark = "mejor que el original del cliente + sensación bespoke" + satisfacción del cliente** — NO
paridad con builders genéricos. Los builders se usan como **referencia de oficio**, no como rival ni techo
(Framer posiciona el *design control* por encima de la mera generación, https://www.framer.com/compare/framer-vs-lovable).

### Re-aim 2 — la línea HECHOS vs DISEÑO (resuelve "fiel Y creativo")
El guardrail fue conservador con AMBOS → soso. **Separarlos explícitamente** (afina §D4, no lo cambia):
- **HECHOS** (servicios, precios, contacto, testimonios, datos del negocio) → **nunca inventar**; se **bloquean**
  (`extracted`/`provided`; lo `missing` se pregunta).
- **DISEÑO** (layout, composición, **imágenes decorativas**, visuales, redacción de chrome) → **crear libremente**.
  El diseño **NO es un hecho**; aquí la IA se suelta (capa `proposed`, confirmable en el loop §D4).

### Pilar P5 — IMÁGENES / ASSETS (el hueco que hundió el piloto)
Un sitio "profesional, bespoke" **necesita imágenes**; el generador hoy no las pone. P5 lo cubre respetando la
línea hechos-vs-diseño:
- **Assets REALES del cliente, EN PANTALLA.** El **logo** siempre visible (header/hero); las **fotos reales** se
  **ingieren al satélite** (a `public/`), no se quedan en el backup. (El Guardrail 1 de intake ya obliga a
  buscarlas en TODO el árbol — el piloto declaró el media `missing` con **1834** imágenes presentes.)
- **Generación con IA = un SET ORIGINAL y COHERENTE por cliente** (mismo estilo/paleta/ambiente, alineado a
  marca+rubro). Es **diseño → permitido**. La industria entera lo hace dentro del builder (Lovable genera
  imágenes server-side sin claves, https://docs.lovable.dev/integrations/ai; v0/Vercel vía AI Gateway
  multi-proveedor, https://vercel.com/docs/ai-gateway/capabilities/image-generation).
- **La línea decorativo-vs-real (§D4 aplicada a imágenes — honestidad):**
  - **Logo y assets reales → NUNCA generados** (intactos).
  - **Generado = ilustrativo / decorativo / atmosférico.** NO fabricar un HECHO concreto: nada de una foto falsa
    de "su flota / su equipo / su oficina" presentada como real — eso **erosiona la confianza** y es la práctica
    que la industria marca como deshonesta (foto real para lo documental; divulgar / no tergiversar:
    https://www.rocketspark.com/blog/post/380/the-ethics-of-using-ai-images-in-business-navigating-the-fine-line/,
    https://www.boralagency.com/ethical-practices-with-ai-images-and-video-explained/).
  - **Real para lo documental, generado para lo decorativo / lo que falta.**
- **Ownership:** los assets generados se **hornean en el `public/` del satélite** → propiedad y código que
  controlamos (encaja con la escalabilidad y con §D5).
- **Firma de marca:** *"Powered by EM Ecosystem"* en el footer (como SAT01).

### Cross-mode — P5 aplica a TODOS los modos (no solo c)
La **capacidad** y la **línea hechos-vs-diseño** son las MISMAS; cambia el **balance real-vs-generado**:
- **(a) Sin diseño/marca** → máxima generación: set original completo + proponer dirección de marca/paleta.
- **(b) Con marca** → usar su marca/assets + generar para rellenar **EN SU estilo** (guiado por marca).
- **(c) Mejorar existente** → extraer assets reales + contenido; usar lo real + generar decorativo para elevar
  (remodel mejor que el original — P3).
- **(d) Instagram** → fotos reales de IG + generar decorativo donde falte.
- **(e) Inspiración** → estética de referencia (sin copiar datos) que **informa** la generación.

### Eje de decisión ABIERTO — approach de GENERACIÓN de imágenes (a aprobar en el gate)
> El **operador decide**; aquí van las opciones investigadas + recomendación. (Decisión presentada, **no tomada**.)

| # | Approach de generación | Source | Pros | Cons | Riesgo |
|---|---|---|---|---|---|
| 1 | **API hosted vía gateway multi-proveedor** (Flux en fal / Vercel AI Gateway), horneado a `public/` | https://fal.ai/learn/tools/ai-image-generators | Calidad tope (Flux.1.1 Pro); barato (~$0.03/MP, $0.02–0.12/img); cero infra; proveedor **pluggable**; ownership del output (uso comercial) | coste+latencia por generación; dependencia externa; licencia varía por modelo; hay que orquestar prompts para coherencia | bajo-medio |
| 2 | **Proveedor copyright-safe** (Adobe Firefly — entrenado solo en contenido licenciado → indemnización) | https://www.getaiperks.com/en/blogs/45-best-ai-image-generators-2026 | máxima seguridad legal para un producto-cliente comercial | más caro; estética menos "wow" que Flux/MJ; acceso API acotado | bajo legal / medio producto |
| 3 | **Self-hosted open-weight** (Flux dev/schnell, SDXL) | https://huggingface.co/black-forest-labs/FLUX.1-schnell | control total; sin coste por imagen a escala; ownership; offline | GPU + ops; conveniencia menor; schnell < pro en calidad | medio-alto (infra) |
| 4 | **Solo stock curado licenciado** (sin generación), filtrado por marca | https://www.boralagency.com/ethical-practices-with-ai-images-and-video-explained/ | fotos reales; coste cero de generación; honesto por defecto | genérico / **no bespoke** (justo lo que queremos superar); no brand-coherente | bajo / pero **no cumple el aim** |

**Recomendación (PENDIENTE de tu aprobación — gate humano):** **Opción 1** (Flux hosted vía un **gateway
multi-proveedor**, horneado a `public/`) como **default**, por la relación calidad/coste/ownership y porque el
proveedor queda **pluggable**: permite escalar a **(2) Firefly** cuando un cliente exija indemnización de
copyright, o a **(3) self-hosted** si el volumen lo justifica. **Siempre** se prefiere el **asset real** para lo
documental; la generación cubre lo **decorativo / lo que falta**. **Optimización de imágenes pobres:**
normalizar/redimensionar al hornear (`next/image` + formatos modernos) — el detalle, en el ECO de seguimiento.
**Tú eliges el approach en el gate; no lo decido yo.**

## Fasificación
El orden lo fija la dependencia: **no se puede generar reutilizando lo que aún no es reutilizable.**
- **Fase 1 — Mecanismo de reuse (pieza base):** construir el registry + CLI interno (`em-ui`, scope real de SCRUM-331) con **single-source = dashboard UI Core**; backfill de los 48 y **reconciliar el drift de SAT01** (empezando por el `Button`). Sin esto, todo lo demás propaga drift.
- **Fase 2 — Onboarding + generación (`/launch-satellite`):** los 5 modos de intake → brief estructurado → generación que *pull-ea* del registry y adapta a forma satélite hasta S2.
- **Fase 3 — Automatización + gobernanza:** orquestar Jira+GitHub+Vercel end-to-end y **cerrar los 2 huecos de CI** (satélites bajo Security Pipeline + VRT auto-discovered). La gobernanza se cablea aquí para que la automatización no escale drift.

**Capa de diseño + producto profesional (refinamiento ECO-52, opción 3 híbrida — APROBADA; [ADR-010](../adr/010-satellite-design-generation.md)).** Se construye sobre F1/F2, sin re-litigarlas:
- **Fase 4 — Biblioteca de secciones gobernada (sustrato de la opción 3):** generalizar el vocabulario de secciones que SAT01 tiene a mano (`satellites/sat-cristian-garcia/src/components/sections/HeroSection.tsx:1`) a un catálogo parametrizado (hero/features/pricing/testimonios/CTA/FAQ/contacto/footer) que el generador compone desde el brief, S2/a11y por construcción. Cierra el esqueleto del piloto.
- **Fase 5 — Producto SEO-ready (P1):** SEO técnico de fábrica — meta por página + Open Graph (https://ogp.me/) + JSON-LD Organization/LocalBusiness/BreadcrumbList (https://developers.google.com/search/docs/appearance/structured-data/local-business) + HTML semántico + audits SEO nombrados en el gate de lanzamiento; CWV de campo p75 como objetivo post-lanzamiento (https://web.dev/articles/vitals).
- **Fase 6 — Onboarding tipo-de-sitio + secciones sugeridas + válvula IA (P2/P3/P4):** preguntar el **tipo** de sitio; la IA **propone** secciones del catálogo (capa `proposed`); regla "remodel siempre mejor que el original"; válvula "la IA recomienda" acotada a `proposed`, nunca a los hechos. *(depende de F4/F5)*

**Pilar de imágenes/assets (re-aim ECO-60 — PENDIENTE de aprobación; depende del approach elegido en el gate).**
- **Fase 7 — IMÁGENES / ASSETS (P5):** ingerir los assets REALES del cliente a `public/` (logo siempre on-screen + fotos reales); **generación IA de un set decorativo original y coherente** por cliente (approach a elegir en el gate, ver §«Eje de decisión ABIERTO»); línea decorativo-vs-real (logo/real nunca generados; generado = decorativo, jamás un hecho falso); optimización de imágenes pobres (`next/image` + formatos modernos); firma *"Powered by EM Ecosystem"* en el footer. *(depende de F4/F5; cross-mode a/b/c/d/e)*

## Non-goals
- NO es el cómo-paso-a-paso (scaffold, curl a Vercel, gotchas): eso es el **runbook** (`docs/satellite-deployment-runbook.md`), que esta estrategia referencia, no reemplaza.
- NO construye el registry/CLI ni el skill `/launch-satellite` aquí: fija el norte; el cómo es el/los ECO de seguimiento por fase.
- NO decide el diseño/branding de un satélite concreto (es per-cliente).
- NO convierte el repo a monorepo-workspaces (la Opción 2 lo evita por diseño).
- NO promete backend/integración con la API NexaCore (un satélite es marketing estático salvo que un ticket lo pida — `docs/satellite-deployment-runbook.md:28`).

## Decisions
<!-- optional: link the chosen decision as an ADR, e.g. emkeel-governance/adr/006-<slug>.md -->
**APROBADA (human gate, 2026-06-18).** Decisión arquitectónica registrada en [`emkeel-governance/adr/006-satellite-component-reuse.md`](../adr/006-satellite-component-reuse.md). Los specs de features de satélite llevarán la línea `Strategy: satellites` (lo exige `check_strategy_link`).

### Decisiones del operador (eran preguntas; resueltas en el gate)
- **D1 — Mecanismo de reuse = Opción 2 (registry + CLI interno estilo shadcn, `em-ui`).** Es **copia GOBERNADA con reconciliación, NO "cero copia"**: single-source = dashboard UI Core; *ownership* por satélite (permite divergencia per-cliente); re-pull gobernado + gate de a11y hacen el drift detectable y reconciliable. **Descartadas** la 3 (workspace: exige refactor del repo + rigidez per-cliente) y la 4 (npm: misma rigidez + release overhead).
- **D2 — Automatización (Jira proyecto+sprint+tickets, GitHub, Vercel) = Fase 3, DENTRO del norte** (no se difiere fuera de alcance). Se construye tras validar reuse (Fase 1) y generación (Fase 2), porque automatizar sobre una base aún no validada escala riesgo.
- **D3 — El runbook es el "cómo" procedimental y vive en `docs/`** (NO en `emkeel-governance/`): se **promovió de `docs/archive/` a `docs/satellite-deployment-runbook.md`** como referencia operativa activa y `docs/archive/` se eliminó — completando lo que ADR-005 ya anticipó. La estrategia sigue siendo el norte; el runbook no es gobernanza.
- **D4 — Ampliación del modo (c) (ECO-44, 2026-06-20):** el satélite **aporta valor**, no fotocopia. Formaliza tres piezas (ver §«Modo (c) — remodelar con valor»): **(i) gate de fidelidad** A réplica / **B remodel moderno [DEFAULT]** / C reimaginación, a elección del cliente; **(ii) split verdad/diseño** — los HECHOS son `extracted`/`provided` y nunca se fabrican, la CREATIVIDAD vive en `proposed` (a confirmar) → "no inventar" = no mentir sobre hechos, no "no crear"; **(iii) loop iterativo** propone→preview→refina→regenera→confirma. No es un norte nuevo (el feel Lovable y el modelo de procedencia ya estaban); afina el modo (c), antes limitado a "solo colores".

- **D5 — Dónde vive el `brief.json` a largo plazo (ECO-44): PRESERVADO commiteado junto al satélite, NO efímero.** El brief se commitea con el satélite generado (p.ej. `satellites/sat-<x>/brief.json`, **fuera de `public/`** → Next no lo sirve), no se descarta tras generar. Razones: **(i)** el brief **es el registro de procedencia** — cada campo lleva `provided|extracted|proposed|missing` (`.claude/skills/launch-satellite/schema/brief.schema.json:5`) → preservarlo hace **auditable** qué hecho vino de dónde y qué fue creatividad `proposed` confirmada (coherente con el split verdad/diseño de D4); **(ii)** el **loop iterativo** (D4) regenera desde el brief (`.claude/skills/launch-satellite/scripts/generate-satellite.mjs:217` lo consume como input) → sin él persistido habría que **re-onboardear** para iterar; **(iii)** el satélite **ya vive commiteado** (SAT01 = `satellites/sat-cristian-garcia/`, 118 ficheros tracked) y el brief debe **viajar con él**, no con la gobernanza de NexaCore (`emkeel-governance/` es `export-ignore`, `AGENTS.md:27`). **Frontera:** el **material CRUDO** del cliente (backups, credenciales, assets sin procesar) **sigue efímero y nunca se commitea** (`.satellite-intake/.gitignore`); el `brief.json` es la **destilación sanitizada** (los mismos hechos que el sitio público ya renderiza, más su procedencia) → seguro y correcto de versionar. Así no hay que moverlo después.
- **D7 — Re-aim del norte + pilar de imágenes (ECO-60, PENDIENTE de aprobación — gate humano).** Tras el fallo del piloto Grupo Atis (remodel *más feo* que el original), re-apunta el AIM y añade el pilar P5. **(i) Re-aim:** NO es "un Lovable gobernado" ni competir con builders genéricos — es un **SERVICIO con oficio de agencia**, sitios **fieles + bespoke**, **código en nuestro control**; benchmark = *"mejor que el original + sensación bespoke" + satisfacción del cliente*, NO paridad con builders (referencia de oficio, no rival — https://www.framer.com/compare/framer-vs-lovable). **(ii) Línea HECHOS vs DISEÑO afinada (no cambia §D4):** nunca inventar HECHOS (se bloquean); **el DISEÑO se crea libremente** (no es un hecho) — el guardrail era conservador con ambos → soso. **(iii) Pilar P5 imágenes/assets:** assets reales on-screen (logo + fotos reales ingeridas a `public/`) + **set decorativo generado por IA, coherente, por cliente** (diseño → permitido); **línea decorativo-vs-real** (logo/real NUNCA generados; generado = decorativo/atmosférico, jamás un hecho falso de equipo/flota/oficina — erosiona confianza, https://www.rocketspark.com/blog/post/380/the-ethics-of-using-ai-images-in-business-navigating-the-fine-line/); horneado a `public/` (ownership); firma *"Powered by EM Ecosystem"*. **(iv) Cross-mode** a/b/c/d/e (misma capacidad+línea, distinto balance real-vs-generado). **DECISIÓN ABIERTA presentada al gate (no tomada):** approach de generación de imágenes (1 hosted Flux vía gateway [recomendado] / 2 Firefly copyright-safe / 3 self-hosted / 4 solo stock) — ver §«Eje de decisión ABIERTO». Reconcilia con D4/D5/D6 + ADR-010, no los re-litiga; fasificada en **F7**.
- **D6 — Enfoque de generación de DISEÑO + producto profesional (ECO-52, APROBADA human gate 2026-06-22): HÍBRIDO (opción 3).** Eleva el norte de "genera un sitio" a **"producto profesional, SEO-ready y escalable"**. Biblioteca de secciones determinista (S2/a11y/SEO por construcción, reproducible §D5) como **sustrato**, sobre el que el agente **propone** tipo/secciones/composición/redacción como `proposed`, confirmable en el loop §D4 — el estándar del sector (Lovable/v0/Tailwind UI/Webflow, ver §«Refinamiento ECO-52»). Cuatro pilares: **P1** SEO técnico de fábrica (OG + JSON-LD + audits SEO nombrados en el gate; CWV de campo p75 como objetivo post-lanzamiento, no gate); **P2** onboarding tipo-de-sitio + secciones sugeridas; **P3** "remodel siempre mejor que el original" (fallo del piloto); **P4** válvula "la IA recomienda" acotada a `proposed`, **nunca a los hechos**. Descartadas **(2)** bespoke (rompe §D5/gobernanza) y **(1)** como techo (sustrato válido pero acotado). Registrada en [ADR-010](../adr/010-satellite-design-generation.md); fasificada en F4–F6. Supera el PR #435 (cerrado).

### ECOs de seguimiento propuestos (títulos/scope; los números Jira los crea el operador)
1. **ECO-Fase1 — Mecanismo de reuse `em-ui`:** registry + CLI interno con single-source = dashboard UI Core; backfill de los 48 componentes + **reconciliación del drift de SAT01** (empezando por el `Button`). Cierra el scope de **SCRUM-331**. *(pieza base; sin dependencias)*
2. **ECO-Fase2 — Skill `/launch-satellite`:** 5 modos de onboarding + generación que *pull-ea* del registry + adaptación a forma satélite hasta **S2 PASS**. *(depende de Fase 1)*
3. **ECO-Fase3 — Automatización + gobernanza:** orquestación Jira+GitHub+Vercel end-to-end + cierre de los 2 huecos de CI (satélites en la matrix de `.github/workflows/security.yml` + VRT auto-discovered en `.github/workflows/visual-regression.yml`). *(depende de Fase 2)*
4. **ECO-Fase4 — Biblioteca de secciones gobernada (opción 3, refinamiento ECO-52):** catálogo de secciones parametrizado (hero/features/pricing/testimonios/CTA/FAQ/contacto/footer) que el generador compone; generaliza el vocabulario de `satellites/sat-cristian-garcia/src/components/sections/HeroSection.tsx:1`. *(sustrato del híbrido)*
5. **ECO-Fase5 — Producto SEO-ready (P1):** OG + JSON-LD (Organization/LocalBusiness/BreadcrumbList) + HTML semántico + audits SEO nombrados en el generador; eleva el gate de lanzamiento por encima del S2 lab. *(depende de F4)*
6. **ECO-Fase6 — Onboarding tipo-de-sitio + secciones sugeridas + válvula IA (P2/P3/P4):** preguntar el tipo; la IA propone secciones; regla "remodel siempre mejor"; válvula "la IA recomienda" acotada a `proposed`. *(depende de F4/F5)*

## Sources (verificadas con tool — cada una abierta)
- SAT01 (Next.js en monorepo, COMMITEADO): `satellites/sat-cristian-garcia/package.json`; rutas `satellites/sat-cristian-garcia/src/app/page.tsx`; cabeceras `satellites/sat-cristian-garcia/next.config.mjs:15-26`; observabilidad `satellites/sat-cristian-garcia/src/app/layout.tsx:68-69`; 17 componentes copiados en `satellites/sat-cristian-garcia/src/components/ui/`.
- UI Core / fuente de verdad (COMMITEADO): `nexacore-dashboard/src/components/ui/` (48 comp.); `nexacore-dashboard/src/components/ui/Button.tsx:1,87` (a11y `role="status"`/`aria-label="Loading"` perdida en la copia del satélite); `CONTRIBUTING.md:73-75` (`/admin/design-system` fuente de verdad).
- Estado del reuse (COMMITEADO): `package.json:1` (sin `workspaces`); runbook copia manual + em-ui/SCRUM-331 `docs/satellite-deployment-runbook.md:140-142,27,444`; "lanzado"/S2 `:262-268,337`; out-of-scope backend `:28`.
- Gates / huecos (COMMITEADO): `.github/workflows/security.yml:64-65` (matrix api+dashboard); `.github/workflows/visual-regression.yml:31-35` (paths SAT01), `:203` (job satélite). Required checks de `main`: `gates`, `Security Gate (All Checks)`.
- Mercado: shadcn/ui registry+CLI (copy-based, `registry.json` HTTP, `registry:base` = design system en un install) — https://ui.shadcn.com/docs/registry/getting-started y https://ui.shadcn.com/docs/cli ; Turborepo/pnpm workspaces (`packages/`+`apps/`, caché) — https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository ; prompt-to-deployed (Lovable two-way GitHub sync + Netlify; v0 one-click Vercel; bolt export) — https://emergent.sh/learn/v0-vs-lovable-vs-bolt .
- Re-aim ECO-60 — imágenes/assets (research, cada una abierta):
  - Manejo visual de builders (referencia de oficio): Lovable genera imágenes server-side sin claves — https://docs.lovable.dev/integrations/ai ; v0/Vercel imagen vía AI Gateway multi-proveedor — https://vercel.com/docs/ai-gateway/capabilities/image-generation ; Framer prioriza *design control* sobre la mera generación — https://www.framer.com/compare/framer-vs-lovable .
  - Modelos/approaches de generación (calidad/coste/control/ownership): catálogo + Flux ~$0.03/MP — https://fal.ai/learn/tools/ai-image-generators ; comparativa de APIs (DALL-E/Imagen/Flux/Midjourney) — https://www.novakit.ai/blog/ai-image-generation-apis-2026-compared ; precios $0.02–0.12/img — https://tokenmix.ai/blog/ai-image-generation-api-comparison ; Firefly copyright-safe/indemnización — https://www.getaiperks.com/en/blogs/45-best-ai-image-generators-2026 ; open-weight self-hosted — https://huggingface.co/black-forest-labs/FLUX.1-schnell .
  - Línea decorativo-vs-real (honestidad en la industria): fotos IA de equipo/oficina erosionan la confianza; real para documental, divulgar/no tergiversar — https://www.rocketspark.com/blog/post/380/the-ethics-of-using-ai-images-in-business-navigating-the-fine-line/ y https://www.boralagency.com/ethical-practices-with-ai-images-and-video-explained/ .
