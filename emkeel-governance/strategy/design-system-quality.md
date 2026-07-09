# Strategy: design-system-quality

Status: DRAFT
Strategy: design-system-quality   <!-- feature specs reference this with a `Strategy: design-system-quality` line -->
Impact: high   <!-- low | medium | high — `low` lets a trivial strategy pass critiqued with 1 lens; absent = high (full ≥3-lens panel) -->

## Goal
Definir un estándar gobernado de **construcción y calidad del design-system (la FUENTE)** — cómo se construye y
compone cada pieza para que el DS sea **sólido, compatible con la propagación y de calidad de mercado** — más la
**reconciliación** del DS actual a ese estándar y una **batería de gates** que lo haga no-violable. Es el espejo de
`satellite-quality` (que gobierna el RESULTADO/web) aplicado a la fuente.

## Context
<!-- grounded facts ONLY — cite file:line (repo) or a URL (market) for every claim -->

**El problema en la FUENTE — la familia card no compone el primitivo:**
- `ChartCard` no importa ni renderiza `<Card>`: pinta un `<div>` crudo con `rounded-xl border border-border-strong bg-surface-primary p-6` — design-system/components/ChartCard.tsx:24.
- `QrCodeCard` es la peor divergencia: superficie hardcodeada (con `qrCodeCardSpecs` documentado) que difiere en los 4 ejes (radio 8 vs 12, border-strong vs default, surface-qr vs surface-primary, padding 16 vs 24) — design-system/components/QrCodeCard.tsx:45.
- De toda la familia, SOLO `CardHoverEffect` compone el primitivo (`<Card size="md">`); ChartCard/MetricCard/StickyCard-flotante/QrCodeCard re-implementan la superficie → un compositor y cuatro re-implementadores — design-system/components/CardHoverEffect.tsx:13.
- MATIZ (panel de crítica): el defecto es la NO-COMPOSICIÓN, no el borde — el borde strong de ChartCard es NORMA-conforme (StoryConventions asigna panel/widget→border-strong; ChartCard es panel-de-card para widgets) y COINCIDE con el Card DESPLEGADO del dashboard; el borde canónico sigue SIN decidir (tokens.css default vs globals.css strong). ChartCard/MetricCard/QrCode-inner/StickyCard-flotante comparten la MISMA forma AST → separar bug de variante exige el ROL ([H]). Y MetricCard usa border-default y matchea card-flat en 3/4 ejes (el fix más fácil, no una divergencia) — design-system/components/MetricCard.tsx:24.

**Ningún gate lo caza (el hueco de composición):**
- Ninguno de los 13 gates del DS obliga ESTRUCTURA/COMPOSICIÓN; grep de card/compose/primitive/hardcoded/structure en los gates solo da comentarios incidentales — design-system/scripts/check-selection-model.mjs:8.
- El más cercano, check-component-drift, NO lo caza: solo compara ficheros con contraparte registrada en el DS y salta cualquier componente propio del consumidor sin contraparte — design-system/scripts/check-component-drift.mjs:49.
- check-raw-color obliga VOCABULARIO de token, no composición: una card a mano con tokens correctos pasa — design-system/scripts/check-raw-color.mjs:50.

**El enforcement es desigual (los gates existen pero casi no bloquean):**
- Las 13 comprobaciones se encadenan en el npm script `coverage`, sin un estándar único — design-system/package.json:11.
- Branch-protection tiene 5 contextos REQUERIDOS (gates de gobernanza, Security Gate, Dashboard VRT, Satellite VRT, Conflict markers); pero de los 13 gates de COVERAGE del DS solo conflict-markers tiene contrapartida requerida (su propio workflow always-run) — el resto corre en el workflow no-requerido de Storybook → **12 de 13 gates de coverage no bloquean el merge** — .github/scripts/check-branch-protection.mjs:36-44.
- El drift llega al primitivo: el dashboard define las 4 utilidades card DOS veces (slice del DS con border-default + re-declaración en globals.css con border-strong) — nexacore-dashboard/src/app/globals.css:32-58.
- No hay doc único de "cómo se construye un componente"; las normas están dispersas (README del DS, CONTRIBUTING, Story Conventions) — design-system/README.md:1-30, CONTRIBUTING.md:52-76.

**Prior-art a CONSUMIR/EXTENDER (no duplicar):**
- Ya existe y está APROBADO un "estándar de construcción" (4 ejes: organización de clases, aplicación de token, markup/composición, construcción desorganizada) dentro de design-propagation, aterrizado como extensión de StoryConventions — emkeel-governance/strategy/design-propagation.md:176-179.
- Reencuadre: el contrato de construcción NO es el flujo de aprobación — es el estándar ESCRITO de cómo se construye correctamente un elemento (qué primitivo/markup, qué token semántico por rol, organización canónica de clases, anidamiento mínimo, sin redundancia real) — emkeel-governance/strategy/design-propagation.md:41-44.
- Guardarraíl: el censo es CONFORMIDAD-al-estándar, no dedup ingenuo (design-propagation.md:208-212); y un gate estático que INFIERA el ROL desde el JSX es NON-GOAL explícito, DECLARADO INVIABLE (rol-equivocado = revisión de diseño) → un gate mecánico de composición da falsos positivos — emkeel-governance/strategy/design-propagation.md:220-221.
- ADR-028 (aceptado 2026-07-05) nombra y ratifica el estándar de construcción como build-now → la nueva estrategia lo CONSUME/EXTIENDE — emkeel-governance/adr/028-mecanismo-propagacion-gobernanza-diseno.md:1.

**Plantilla a imitar — satellite-quality (gobierna el RESULTADO; esta es su espejo para la FUENTE):**
- Estándar VIVO y versionado, rúbrica en CI + contrato de migración cuando sube de versión — emkeel-governance/strategy/satellite-quality.md:7.
- Cada requisito etiquetado [M] (máquina→gate) o [H] (humano→revisión) — satellite-quality.md:22.
- Gate consciente de versión: cada consumidor registra a qué versión se construyó; falla/warn si queda >1 major atrás → deuda VISIBLE ticketeada + "no tocar sin migrar" — satellite-quality.md:60.
- 'Verde ≠ conformidad': el gate se auto-rotula; la certificación real es un required-check HUMANO aparte — satellite-quality.md:61.
- Baseline antes de imponer: el artefacto existente nace en deuda ticketeada (no rojo bloqueante) — satellite-quality.md:44.

**Mercado:**
- DoD de componente de IBM Carbon: ≥80% cobertura unitaria, AVT en el default y cada estado complejo, ≥1 VRT (Percy) en la story default, verificación manual con lector de pantalla — automático no basta — https://carbondesignsystem.com/contributing/component-checklist/.
- Regla de composición de atomic design: moléculas/organismos se construyen A PARTIR de átomos ya establecidos (responsabilidad única, reutilización) — justo lo que la familia card viola — https://atomicdesign.bradfrost.com/chapter-2/.
- La respuesta de mercado al hand-roll es una API de COMPOSICIÓN, no un lint: Radix `asChild` compone comportamiento/a11y sobre TU elemento (coste: spread props + forwardRef); shadcn = "interfaz común y componible" — https://www.radix-ui.com/primitives/docs/guides/composition.
- Frontera [M] vs [H]: ESLint no-restricted-syntax puede prohibir por AST "div crudo, usa `<Card>`" pero es SINTAXIS no semántica; axe-core caza ~57% de WCAG → composición-estructura es [M], pero "el primitivo/rol correcto" queda [H] — https://eslint.org/docs/latest/rules/no-restricted-syntax.
- Precedente de versión-como-software: typescript-eslint versiona en semver (endurecer regla = MAJOR) y `ng update` de Angular se niega si el consumidor está >1 major atrás — https://typescript-eslint.io/users/versioning/.

## Options
<!-- at least 2 real options; EVERY row MUST cite a Source (file:line or URL). `emkeel strategy check` enforces it. -->
| # | Option | Source | Pros | Cons | Risk |
|---|--------|--------|------|------|------|
| 1 | **Solo-doc**: promover/extender el estándar de construcción ya ratificado (ECO-142/ADR-028) como el contrato escrito "cómo se construye un componente", aplicado SOLO en revisión humana. | emkeel-governance/strategy/design-propagation.md:176-179 | El más barato; se apoya en prior-art APROBADO sin reinventar; cero falsos positivos; respeta el non-goal de no inferir rol. | Sin enforcement — la divergencia ChartCard/QrCodeCard YA ocurrió bajo revisión-humana-sola y reincidiría en silencio; verde no significa nada. | El problema que esta estrategia existe para resolver queda sin resolver en la práctica. |
| 2 | **Estándar vivo + gate de conformidad en CI + consciente de versión** (espejo de satellite-quality): estándar versionado con cada requisito [M]/[H], gate que marca componentes >1 major atrás como deuda ticketeada, auto-rótulo verde≠conformidad. | emkeel-governance/strategy/satellite-quality.md:7 | Simétrico con el estándar del RESULTADO ya ratificado (ADR-017); hace el drift deuda VISIBLE; baseline-como-deuda no bloquea el DS vivo; CONSUME (no duplica) el estándar de ECO-142. | Coste de construcción; hay que definir un campo-versión que el DS hoy no tiene; requiere el required-check [H] o la "certificación" no existe. | Los gates [M] cazan vocabulario/estructura pero NO la elección de rol; sin un check estructural la divergencia-card cabecera queda solo-[H]. |
| 3 | **Gate estructural de composición** (AST tipo no-restricted-syntax) sobre el estándar vivo: prohíbe por máquina "superficie card cruda / compuesto que no compone el primitivo", con escape de divergencia DECLARADA. | https://eslint.org/docs/latest/rules/no-restricted-syntax | Caza directamente la clase ChartCard/MetricCard/QrCodeCard que todos los gates actuales pierden; convierte la evidencia central en un gate rojo. | AST es sintaxis no semántica y ECO-142 hace el rol-inferido NON-GOAL; la divergencia 4-ejes de QrCode es INTENCIONAL → necesita allowlist de divergencia o da falsos positivos. | Sobre-ajuste/falsos positivos erosionan confianza; decidir qué divergencias son bug vs variante bendecida es en sí una decisión de diseño. |
| 4 | **Pipeline de ciclo de vida completo** (nivel Polaris/Carbon): etapas de madurez (Alpha/Beta/Stable), suelo de cobertura 80–100%, AVT + baselines VRT cableados + lector de pantalla, y codemods por cada breaking change. | https://carbondesignsystem.com/contributing/component-checklist/ | El listón de mercado más alto; codemods + gate consciente-de-versión = contrato de migración real; por fin enchufa el baseline VRT hoy solo cableado. | Pesado para un DS interno de ~80 componentes de un equipo; codemods/etapas = escalado nombrado-no-construido en la estrategia hermana (YAGNI). | Sobre-ingeniería; gran coste de tooling cuyo retorno escala con muchos consumidores que el DS aún no tiene. |

## Recommendation
**Reencuadrada tras el panel adversarial (6 lentes, todos must-fix).** La recomendación original (Opción 2+3:
estándar vivo + gate estructural build-now + consciente de versión) NO sobrevive la crítica:
- **El gate AST de composición (Opción 3) es INVIABLE:** casa tipos de nodo, no valores de className, y no ve
  `TemplateLiteral` ni `cn()`/`clsx` — así está escrito ChartCard.tsx:24 y el propio `Card` (cn()); perdería la
  evidencia central + 264 sitios con la utilidad opaca `card`, y daría ~90% falsos positivos sobre ~110 paneles
  no-card (Tooltip/ConfirmModal/dropdowns/DataTable/Avatar) — https://eslint.org/docs/latest/rules/no-restricted-syntax.
- **Separar "bug" de "variante" exige el ROL** (card vs panel/widget), que ADR-028 ya declaró INVIABLE por máquina
  y reservó a revisión [H] scale-gated (design-propagation.md:220-221) → un gate build-now bloqueante RE-DECIDE la
  fase de ADR-028 (necesitaría un ADR que enmiende, no "consume/extend").
- **La maquinaria consciente-de-versión (Opción 2) es un ESPEJO FALSO:** `satellite-quality` la justifica por una
  flota federada; el DS es 1 repo/1 equipo/1 build, sin flota que versionar, y la version-awareness ya existe una
  capa abajo (`em-ui.manifest.json`, SHAs por fichero) → YAGNI, lo dispara el propio kill-criterion.

**Recomendación calibrada — lo defendible que de verdad mueve la aguja:**
1. **Decidir PRIMERO la superficie canónica de card** (borde default vs strong; roles card vs panel/widget) — es
   decisión de diseño [H] (coordinar con `design-tokens` + StoryConventions), porque "componer `<Card>`" está
   INDEFINIDO hasta decidirla (tokens.css=default vs globals.css=strong; ChartCard border-strong es norma-conforme).
   Desbloquea la deuda de la familia card.
2. **CONSUMIR el estándar de construcción ya ratificado** (ECO-142/ADR-028) como el contrato ESCRITO [H] (rol,
   composición, organización de clases) — sin re-decidir su fase (design-propagation.md:176-179).
3. **Arreglar el ENFORCEMENT (la palanca real y barata):** subir a contextos REQUERIDOS los gates [M] FACTIBLES
   que ya existen y hoy corren en el workflow no-requerido de Storybook (raw-color, story-norm, coverage, selección,
   contraste). NO re-litiga ADR-028 (obligan vocabulario/story/selección, no rol) — check-branch-protection.mjs:36-44.
4. **Añadir el required-check HUMANO [H] de certificación de la FUENTE** — el innegociable de `satellite-quality`
   (:61): sin su propio check, la certificación "en la práctica no existe". Aquí vive el juicio rol/composición.
5. **Reconciliar la familia card = el censo ECO-143 + revisión [H] ya trackeados** (design-propagation) — no un
   baseline mecánico nuevo; la estrategia lo cita/coordina. Primer fix más fácil: MetricCard (ya border-default,
   matchea card-flat 3/4 ejes).
6. **Listón de calidad de mercado por componente**, incremental sobre lo que YA existe (stories/coverage/
   no-raw-color/selección) + a11y AA + test de lógica + docs + **enchufar los baselines VRT** hoy solo cableados;
   suelo de cobertura a decidir (Carbon 80% / Polaris 100%) — https://carbondesignsystem.com/contributing/component-checklist/.

**Se DIFIERE (escalado nombrado, no construido):** el gate estructural/censo auto-codemod de composición (queda
[H]/scale-gated como en ADR-028), el campo-versión por componente y el estándar-como-semver — YAGNI a esta escala.

## Non-goals
- No construir un gate MECÁNICO de composición/rol build-now bloqueante — ADR-028 ya lo declaró inviable y lo reservó a revisión [H] scale-gated; forzarlo re-decidiría ADR-028 (requeriría un ADR que enmiende). Queda como escalado NOMBRADO.
- No inventar un campo-versión por componente ni tratar el estándar como semver (>1 major atrás) — espejo FALSO de `satellite-quality` (no hay flota federada; `em-ui.manifest` ya da version-awareness una capa abajo). YAGNI.
- No re-abrir ni duplicar el estándar de construcción de ADR-028 ni el censo ECO-143 — esta estrategia los CONSUME y coordina.
- No inferir el ROL de un elemento desde el JSX (rol-equivocado = revisión de diseño humana, no gate) — non-goal heredado de ECO-142.
- No pisar `satellite-design` (compone secciones en una web) ni `design-tokens` (capa de color/tokens; la decisión de superficie canónica se coordina CON ella) ni re-hacer la distribución de `design-propagation`.
- No un pipeline DTCG / generador de tokens (ya descartado por `design-tokens`).

## Decisions
<!-- optional: link the chosen decision as an ADR, e.g. emkeel-governance/adr/007-<slug>.md -->
