# Strategy: design-system-quality

Status: APPROVED
Strategy: design-system-quality   <!-- feature specs reference this with a `Strategy: design-system-quality` line -->
Impact: high   <!-- low | medium | high — `low` lets a trivial strategy pass critiqued with 1 lens; absent = high (full ≥3-lens panel) -->

## Goal
Definir, de forma profesional y escalable, el **modelo de construcción y COMPOSICIÓN del design-system**: cómo se
construye correctamente cada pieza (primitivo), cómo se COMPONE por referencia dentro de otras (para que un cambio
en la base se propague), y cómo se ETIQUETA qué se mantiene fijo y qué varía según el uso — con la mejor arquitectura
moderna, **automatizado con gates**, con **auditoría** del corpus existente y **reconstrucción** a ese estándar.
Apunta a la versión EXCELENTE y completa (sin parches); las decisiones previas que choquen con ella son DEBATIBLES
(se re-abren, no se parchea alrededor).

## Context
<!-- grounded facts ONLY — cite file:line (repo) or a URL (market) for every claim -->

**El modelo de composición YA existe y en gran parte funciona:**
- Composición por referencia real pero PARCIAL: 24 de 83 componentes importan+renderizan a un hermano (ConfirmModal→Button+IconButton, Input→IconButton+SpinnerCircle, FormField→InlineError); los otros 59 son primitivos hoja correctos → el copy-en-vez-de-componer es un subconjunto PEQUEÑO y concreto, no el grueso — design-system/components/ConfirmModal.tsx:5.
- El "compón para que un cambio en la base se propague" YA ocurre a profundidad 3 (QrCodeCard→CopyField→Tooltip; un cambio en Tooltip sube solo) y ConfirmModal es el hub que reusa cada diálogo → un cambio en Button reestiliza todas las acciones de diálogo gratis — design-system/components/QrCodeCard.tsx:58.
- ECO-147 es prueba de dedup-por-composición: ChartCard se extrajo porque su markup vivía copiado e inlineado idéntico en 2 charts ("un solo sitio → un cambio propaga") — design-system/components/ChartCard.tsx:5.

**El registry YA declara el grafo (lo que pedías NO falta):**
- Cada item lleva `registryDependencies` (hermanos que compone) + `internalDependencies`, AUTO-derivados de los imports reales por build-registry.mjs, con un test anti-drift que falla CI si el grafo commiteado ≠ el recalculado — design-system/registry/build-registry.mjs:30.
- Solo se guardan aristas directas (1 salto); la clausura transitiva se computa on-demand (resolveClosure DFS) y YA la consume la propagación (`em-ui add|update` copia C + todo lo que compone) — design-system/registry/cli.mjs:61.
- PERO el registry NO distingue primitivo vs composite (Card hoja y ConfirmModal composite llevan el mismo `type: registry:ui`); ese split solo vive en el título de Storybook, desacoplado → no hay campo máquina-legible — design-system/registry.json:120.

**Los problemas reales (dónde apuntar):**
- Copy-en-vez-de-componer produce DRIFT de token vivo: ChartCard hardcodea border-strong vs el border-default del primitivo Card; MetricCard (llamado "Card") hardcodea su superficie y nunca importa Card → un cambio en Card no les llega — design-system/components/ChartCard.tsx:24.
- La duplicación se concentra donde NO hay primitivo: el panel de dropdown copiado byte-a-byte en 5 controles (Select/EmailSelector/LanguageSelector/SidebarNav/Breadcrumbs, no hay Popover/Menu), el tooltip de chart idéntico en 2 charts, skeletons a mano ×2 → el fix es CREAR el primitivo, no un lint — design-system/components/Select.tsx:34.
- "Lo fijo vs lo que varía por uso" está codificado de 4 formas INCOMPATIBLES (no hay cva/tailwind-variants; solo cn()): Button/Badge mapas+template-literal crudo; Card utilidades CSS+cn(); Input ternarios inline+specs-doc; IconButton mapas+cn() — design-system/components/Button.tsx:18.
- El contrato es inconsistente incluso donde parece compartido: `size` significa un eje distinto por primitivo (Button=escala, Input=altura, Card=radio); el TYPE de variante se declara de 3 formas; override diverge (cn() dedup via twMerge vs template-literal que solo concatena). Un consumidor NO puede asumir que 2 primitivos comparten contrato — design-system/components/Card.tsx:13.
- Governance solo estandariza PARCIAL: check-variant-coverage exige que SI hay matriz cada clave tenga story, pero NO obliga el idioma → Card e Input quedan exentos; ningún gate obliga un único estándar fixed-core-vs-variant — design-system/scripts/check-variant-coverage.mjs:2.

**El etiquetado "adaptado vs propagado" hoy es de FICHERO entero, solo DS→consumidor:**
- `@em-ui-adapted` no aparece en NINGÚN fichero fuente del DS; es un marcador por-fichero en la copia del consumidor, identidad = git blob SHA-1 del fichero entero → no hay forma hoy de etiquetar "esta parte fija vs esta varía" DENTRO de un componente — design-system/registry/_manifest.mjs:131.

**Mercado — el patrón profesional/escalable exacto de lo que pediste:**
- Convergencia en el contrato de variante: cva/tailwind-variants/Stitches/Panda codifican "fixed core + lo que varía" como UN objeto (base+variants+compoundVariants+defaultVariants) y derivan el tipo TS del literal de estilo (`VariantProps`) → la declaración de estilo ES la de tipo — https://cva.style/getting-started/variants/.
- tailwind-variants añade SLOTS (multi-parte) — una Card con header/body/actions etiqueta cada parte — y es un superset NO-BUILD de cva sobre el Tailwind actual — https://www.tailwind-variants.org/docs/slots.
- Compose-by-reference resuelto: Radix `asChild`/Slot fusiona props+comportamiento sobre TU hijo (sin nodo wrapper, a cualquier profundidad); coste: forward ref + spread props — https://www.radix-ui.com/primitives/docs/guides/composition.
- Propagación a escala = grafo de token/dependencia, no copia: 3 capas de Brad Frost (primitive→semantic→component) + DTCG estable 2025.10 + Nx-affected/Bit-Ripple/Changesets — https://bradfrost.com/blog/post/the-many-faces-of-themeable-design-systems/.
- AUTOMATIZABLE: dependency-cruiser (reglas `required`) + ESLint no-restricted-syntax fuerzan "compón el primitivo, no superficie cruda" en CI — Atlassian shippea 43+ reglas en producción. Techo: el lint ve imports/AST, no el LOOK (eso lo caza VRT + humano) — https://atlassian.design/components/eslint-plugin-design-system/.
- Precedente escalable (Spectrum/Carbon/Primer/Polaris): SEPARAN comportamiento de visual y capan bottom-up desde tokens; regla EightShapes "haz configurable lo común, componible lo poco común" (props vs slots) — https://react-aria.adobe.com/blog/introducing-react-spectrum.

**Migración REVISABLE sin fatiga + higiene (cómo se reconstruye limpio, no un big-bang de 83):**
- El repo YA emite evidencia visual por-PR: la VRT (Playwright toHaveScreenshot 0.2%) es required, salta solo en PRs afectados, y en fallo sube imágenes-diff + un HTML report → el humano revisa SOLO las capturas que cambiaron; el cambio deliberado se re-basea por un workflow_dispatch manual — .github/workflows/visual-regression.yml.
- El estado de cada copia se deriva del git-blob SHA (up-to-date/stale/adapted/drifted/conflict/held) → una ETIQUETA no puede mentir sobre los bytes; check-component-drift exige byte-identidad a la fuente salvo @em-ui-adapted — design-system/registry/_manifest.mjs:213-257, design-system/scripts/check-component-drift.mjs:1-16.
- El auto-merge del subconjunto seguro YA existe (Dependabot patch/minor vía `gh pr merge --auto`, solo dispara con los required en verde) → se extiende a los PRs de migración byte-mecánicos VRT-verde sin que nadie pulse merge — .github/workflows/dependabot-auto-merge.yml:1-33.
- Codemods: se audita la REGLA + sus tests UNA vez, no miles de líneas idénticas; test-first con casos negativos, dry-run, y TODO-flags para lo que el transform no sabe (nunca reescribir en silencio) — https://martinfowler.com/articles/codemods-api-refactoring.html.
- Ratchet / bulk-suppression: un baseline de deuda que CI solo deja DECRECER (surfacea toda violación si un fichero sucio sube), en formato por-línea/TSV para migradores en paralelo sin conflictos — https://eslint.org/blog/2025/04/introducing-bulk-suppressions/, https://www.notion.com/blog/how-we-evolved-our-code-notions-ratcheting-system-using-custom-eslint-rules.
- LEAF-FIRST + PRs apilados de 50-200 líneas, un propósito por PR (mecánico O visual, nunca mezclados), revisados de abajo-arriba — https://www.skovhus.dev/blog/moving-linear-from-styled-components-to-stylex, https://graphite.com/guides/break-up-large-pull-requests, https://medium.com/airbnb-engineering/turbocharged-javascript-refactoring-with-codemods-b0cae8b326b9.

## Options
<!-- at least 2 real options; EVERY row MUST cite a Source (file:line or URL). `emkeel strategy check` enforces it. -->
| # | Option | Source | Pros | Cons | Risk |
|---|--------|--------|------|------|------|
| A | **Unificar el modelo de construcción IN-PLACE** (sin re-plataformar): adoptar tailwind-variants (superset NO-BUILD de cva) como contrato único de variante+slots para todo primitivo; extraer los primitivos que faltan (Popover/Menu, Skeleton, ChartTooltip; MetricCard/ChartCard componen Card); convertir el grafo de dependencias ya-derivado del registry en la unidad de propagación forzada + gates dependency-cruiser/ESLint. | https://www.tailwind-variants.org/docs/slots | Se queda dentro del invariante pull/copia (no re-abre ADR-006/007); el registry YA trae el grafo + test anti-drift; tailwind-variants no añade build; colapsa los 4 idiomas en 1; gates probados (Atlassian 43+). Mata el drift-por-copia dando un primitivo a cada superficie duplicada. | Migra ~83 primitivos de 4 idiomas a 1 (churn); tailwind-variants sigue siendo string-builder, no single-source compilado; el tagging queda a nivel componente/slot, no diff-por-elemento; sin semver por-componente. | med |
| B | **Plataforma completa** (el extremo máximo-escalable): re-plataformar tokens a DTCG compilado por Style Dictionary (marca=modo); componentes sobre Panda slot-recipes (build-time) sobre el grafo 3-tier; SEPARAR comportamiento de visual con capa headless (Radix/React Aria); shippear el DS como paquete semver/registry con Changesets + Nx-affected reconstruyendo cada consumidor; lifecycle de madurez tipo Primer. | https://panda-css.com/docs/concepts/recipes | El modelo estándar-industria más escalable a muchos satélites; single-source compilado real; semver=rollout controlado; marca-como-modo multi-brand; a11y/i18n resuelto una vez; DTCG ya es estable (2025.10). | Un paquete compilado quita la capa "posee-tu-copia" del satélite → contradice ADR-006/007/027/028; dispara el DTCG EARLY (design-tokens lo difiere a ≥3-4 consumidores; hoy=2); re-plataforma pesada + build step. | high |
| C | **RECOMENDADA — el mejor modelo de composición YA, y debatir los candados de DISTRIBUCIÓN en carril aparte** (no dejar que lo capen): contrato de variante tipado+slots, extraer todo primitivo que falta, grafo 3-tier de tokens, capa headless donde la a11y pesa, el grafo del registry como unidad de propagación forzada (VRT de clausura afectada + gates), y un CENSO de todo el corpus que clasifica cada elemento contra el estándar (forward+backward = auditoría+reconstrucción). RE-ABRIR explícitamente los locks copy-by-value/DTCG/fase-del-gate como debate de estrategia propio, sin bloquear el rebuild en ellos. | emkeel-governance/strategy/design-propagation.md:181 | Entrega "la mejor versión" sin apostar toda la re-plataforma de distribución en un paso; el contrato+grafo+extracción valen bajo CUALQUIER modelo de distribución; NOMBRA los candados a debatir en vez de parchear alrededor (honra "re-abrir, no parchear"); el censo da auditoría + reconstrucción repetible. | Dos carriles coordinados (rebuild + debate de distribución); el tagging por-parte queda diferido salvo que el debate re-abra la fase; riesgo de que el modelo se adelante a la decisión de distribución. | med |
| D | **FOIL / mínimo (lo que el operador RECHAZA)**: estándar de construcción escrito (extensión de StoryConventions) + barrido de auditoría + censo en modo REPORT; sin lib de variantes, sin extraer primitivos, sin re-abrir ADRs. | emkeel-governance/strategy/design-propagation.md:176 | El más barato; sin dependencia nueva; sin re-abrir ADRs; la auditoría es útil ya. | Es el MÍNIMO que el operador rechaza: sobreviven los 4 idiomas, sin contrato único, sin primitivo para los clusters de duplicación, tagging whole-file, y el drift-por-copia solo se REPORTA, nunca se previene. No entrega "lo mejor/escalable". | low |

## Recommendation
**Reencuadrada tras el panel adversarial (6 lentes, 5 must-fix).** El panel prueba que la "Opción C limpia"
(composición ahora, distribución en carril aparte) NO se sostiene, y que faltaba el listón de calidad. La
recomendación honesta es **C-ACOPLADA**: un programa de 3 pilares coordinados, sin diferir lo que pediste.

**Pilar 1 — Construcción y composición (build-now):**
1. **Contrato de variante ÚNICO tipado** con **tailwind-variants** (base/variants/compoundVariants + `VariantProps`)
   y **slots** multi-parte — colapsa los 4 idiomas (Button.tsx:18, Card.tsx:13). OJO: los slots son el eje de
   ESTILO ("cómo se ve cada parte"), NO el de modificabilidad (ver la decisión de scope abajo).
2. **Extraer los primitivos que faltan** (Popover/Menu para los 5 dropdowns, ChartTooltip, Skeleton) y que
   MetricCard/ChartCard COMPONGAN Card → mata el drift-por-copia (Select.tsx:34, ChartCard.tsx:24).
3. **Registry: campo primitivo/composite** máquina-legible (hoy solo en Storybook, registry.json:120).
4. **CENSO = el DETECTOR** (auditoría): clasifica todo el corpus contra el estándar + produce el worklist de
   reconstrucción (forward: autoría nueva conforme; backward: normaliza legacy) — tu "chequear lo hecho + reconstruir".

**Pilar 2 — Listón de CALIDAD por componente (build-now — EL punto que faltaba; la estrategia se llama *quality*):**
5. Definition-of-Done por componente: **a11y AA certificada** (axe + teclado/foco/ARIA), **tests**, **docs de
   estados**, y **ENCHUFAR los baselines VRT** (hoy cableados-pero-APAGADOS → la red de seguridad del rebuild está
   inerte) + un **required-check HUMANO [H]** de certificación (verde ≠ excelente).
6. **Capa de comportamiento headless** (Radix/React Aria) donde la a11y pesa — separar comportamiento de visual
   (como Spectrum/Carbon) → a11y/i18n una vez.

**Pilar 3 — Distribución RE-ABIERTA (ACOPLADA, no carril aparte):**
7. El panel lo probó por código: tailwind-variants y Radix meten **dependencias npm** en los primitivos, y em-ui
   **solo copia ficheros** (no propaga npm) → el satélite recibiría un fichero que importa un paquete que no tiene =
   build roto. Luego el mejor modelo de composición **EXIGE** cambiar la distribución. **RE-ABRIR ADR-006
   (copy-by-value) + ADR-019 (acople shadcn/Tailwind)**: o se extiende em-ui para propagar deps npm, o se va a un
   modelo de paquete. Prerequisito ACOPLADO, no "para luego".

**Pilar 4 — Migración LIMPIA y REVISABLE ("las máquinas sudan, el humano juzga" — nunca big-bang, nunca revisar 83 de golpe):**
- **Worklist del CENSO, no un doc extenso:** un panel-estado por componente (sobre `em-ui report` + gates) que es a la vez la lista y el progreso.
- **3 carriles por carga humana:** (A) mecánico/uniforme → **codemod** (AST, test-first), VRT DEBE quedar verde; (B) cambio visual intencional → VRT roja, el humano mira SOLO los píxeles que cambiaron; (C) juicio/semántico → el humano diseña. Secuencia **LEAF-FIRST**, solo sobre primitivos STABLE.
- **La máquina prueba lo mecánico** (VRT=se ve igual · tests=se comporta igual · byte-SHA=las etiquetas cuadran · gates=conforme) → el humano NO re-verifica eso: revisa (1) cada codemod UNA vez, (2) los deltas visuales del puñado que cambió, (3) los juicios del carril C.
- **Auto-merge SOLO del subconjunto seguro** (carril A, VRT-verde + required en verde) vía `gh pr merge --auto` (extiende el wiring de Dependabot ya probado); el cambio-de-aspecto SIEMPRE va a revisión humana de solo los deltas.
- **Ratchet:** baseline de deuda que CI solo deja DECRECER; el estándar nuevo corre NO-bloqueante hasta estabilizar, luego required → nunca "parar el mundo". PRs de 50-200 líneas, un propósito por PR (mecánico O visual, nunca mezclados), apilados y revisados de abajo-arriba.
- **Definition-of-Done TODO-O-NADA** por componente: todos los sitios migrados (src/ Y tests/) + coverage + classify=up-to-date + VRT verde + huérfano borrado SIN borrado-a-ciegas (grep 0 usos + portar tests). Medio-migrado NO es "hecho" — esto es lo que impide el goteo de "20 tickets de parche".
- **Higiene innegociable (con nombre propio):** censo-primero · DoD todo-o-nada · anti-drift atado a bytes (la etiqueta no miente) · VRT como guardia de cambio-accidental · gates required no-bypass · sin borrados a ciegas · codemod AST test-first (no search-replace) · mecánico/visual separados · árbol git limpio antes del codemod.

**DECISIÓN DE SCOPE que fija el operador (no la decido yo):** el etiquetado por-ELEMENTO de MODIFICABILIDAD ("qué
puede rebrandear un satélite vs qué está bloqueado" — marcadores @brand-locked/@ds-governed/@partial, hoy
scale-gated en ADR-028) — ¿se construye YA (re-abriendo la fase de ADR-028) o es dominio de `design-propagation`?
Tu directiva "no diferir" apunta a construirlo; es grande y entrelazado con distribución. **Tu llamada.**

**El gate, HONESTO:** el CENSO detecta el drift; dependency-cruiser + ESLint son un **RATCHET post-rebuild** (una vez
un componente compone el primitivo, prohíben quitar el import) — NO detectan la superficie card cruda (el grafo del
registry está VACÍO donde vive el drift; la superficie está en template-literals hostiles al AST). Automatizado sí,
como candado anti-regresión, no como el descubridor.

**Descartadas:** **D** (el mínimo que rechazas); **B puro** (re-plataforma todo de golpe); **A/C-limpias** (fingen
que distribución es separable — refutado por código). La recomendación es **C-acoplada**: los 3 pilares como
programa coordinado que RE-ABRE los candados que de verdad bloquean (ADR-006/019; y ADR-028 si decides el etiquetado
por-elemento ya).

## Non-goals
- NO el mínimo (Opción D): no dejar los 4 idiomas, no solo-reportar el drift, no confundir "construido correctamente" con "excelente".
- NO fingir que la distribución es un carril separable — el modelo de composición mete deps npm que la copia-por-valor no propaga; ADR-006/019 se RE-ABREN como prerequisito ACOPLADO.
- NO vender el gate dependency-cruiser/ESLint como el DETECTOR del drift (es un RATCHET post-rebuild; el detector es el censo).
- NO conflar los slots (eje de ESTILO) con el etiquetado de MODIFICABILIDAD por-elemento (permiso de rebrand) — son ejes distintos.
- NO inferir el ROL desde el JSX (rol-equivocado = revisión humana).
- NO tocar los VALORES de color/token (eso es `design-tokens`; la capa 3-tier se coordina).

## Decisions
<!-- optional: link the chosen decision as an ADR, e.g. emkeel-governance/adr/007-<slug>.md -->
APROBADA por el operador (merge de PR #556, Sprint 5). Reco = **C-acoplada** (4 pilares: construcción+composición /
calidad / distribución RE-ABIERTA / migración limpia+revisable). Quedan ABIERTAS 2 decisiones de scope, a fijar al
arrancar la ejecución (no bloquean la aprobación de la dirección): (1) re-abrir la distribución ADR-006/019 ahora;
(2) el etiquetado por-elemento de modificabilidad — build-now (re-abrir fase ADR-028) vs dominio de design-propagation.
Pendiente: registrar la decisión como ADR.
