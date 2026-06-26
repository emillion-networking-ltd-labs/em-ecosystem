# ADR-015 — Satélites: la IA-DISEÑADOR autora el diseño (spec persistido → compilador delgado → gates validan); separar ESQUELETO de BELLEZA

- Status: superseded
- Superseded-by: ADR-016
- Supersedes: ADR-014
- Date: 2026-06-25
- Ticket: [ECO-71](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-71) (decisión) · build por fases (G1…G5+) en ECOs aparte
- Strategy: satellite-builders
- Deciders: Operador (human gate vía **review + merge** del PR de la lane, 2026-06-25)
- Contexto de gobierno: repo gobernado por Emkeel (ver `AGENTS.md`). Materializa el **refinamiento ECO-71**
  del norte ([`strategy/satellite-builders.md` §«Refinamiento ECO-71»](../strategy/satellite-builders.md)).
  **SUPERA — sólo el MECANISMO de generación — de** [ADR-014](014-satellite-generative-composition.md). **Reutiliza,
  no re-litiga:** [ADR-010](010-satellite-design-generation.md) (diseño HÍBRIDO op.3), [ADR-012](012-satellite-builders-architecture.md)
  (builders→IR→emitter), [ADR-013](013-satellite-launch-readiness-standard.md) (estándar/gate), y el **ESQUELETO de
  ADR-014** (§2 componentes inmutables + gate de drift, §3 estándar vivo, §5 regenerar). **Aprobación (KEEL-104):** el
  `process.json` queda en `presented`; la aprobación humana **ES el review + merge de este PR** — no un campo `approved`
  auto-escrito.

## Contexto
ADR-010/ADR-014 decidieron el diseño **HÍBRIDO generativo (op.3)**, pero **cada implementación recayó en un MOTOR
DETERMINISTA** — un clasificador de secciones + una tabla de layouts + *shells* fijos (`generate-satellite.mjs:122`
`DEFAULT_HOME_COMPOSITION`; `builders/lib/emit-blocks.mjs:93` `renderMain`, bandas alternas `gi % 2`; y el motor de
ECO-70/FB6). Resultado **medido:** sitios CORRECTOS pero **NO BELLOS**; "mejorar" un sitio sale **peor** (la captura
lossless guarda el CONTENIDO, no el diseño del original, y el motor le pone sólo plantillas). **Causa raíz:** el
determinismo estaba puesto en **DECIDIR** el diseño. La IA "diseñando" era en realidad un clasificador eligiendo 1-de-2
variantes por rol — **"más reglas" ≠ diseño.**

La investigación (v0, Lovable, bolt, shadcn, determinismo del LLM, golden/axe, W3C Design Tokens) converge en **un
patrón**: la IA **GENERA** el artefacto (creativo, no determinista) → se **PERSISTE** como fuente propia → **gates
deterministas lo VALIDAN**. La reproducibilidad se compra **persistiendo la salida**, no haciendo determinista al modelo
(el LLM no lo es ni a `temperature` 0). ⇒ El determinismo debe vivir en **CAPTURAR + VALIDAR**, no en **DECIDIR**.

## Decisión

### 1. SEPARAR el ESQUELETO (determinista) de la BELLEZA (la IA)
El **esqueleto** es fuerte, aburrido y garantizado por construcción: captura → IR (lossless) → estándar/scaffold →
gates. La **belleza** la GENERA la IA como diseñador. El determinismo NO toca el diseño; **fija y valida** lo que la IA
creó.

### 2. ROLES del pipeline (cada etapa = un rol que la IA encarna; el IR es la frontera)
- **R1 · Archivista (captura):** backup → IR; captura TODO, no inventa, declara `notInSource`. *(reusa `adapters/wordpress.mjs`, `lib/lossless.mjs`.)*
- **R2 · Modelador:** normaliza CUALQUIER fuente al MISMO IR agnóstico — **el IR es el contrato** entre etapas. *(reusa `lib/ir.mjs`.)*
- **R3 · Arquitecto de sistema:** scaffold SAT01 + estándar profesional + **expone el VOCABULARIO GOBERNADO** (registry em-ui + tokens) = el SUELO que todo satélite hereda. *(reusa `lib/emit-professional.mjs`, `lib/launch-ready.mjs`.)*
- **R4 · Diseñador SENIOR (el CORAZÓN):** GENERA el diseño sobre IR + vocabulario + tokens; HECHOS intactos (§D4), **compone-no-modifica**; salida = un **artefacto de diseño PERSISTIDO**.
- **R5 · Crítico / director de arte:** revisa adversarialmente (bello/en-marca/accesible/lossless/sin-drift); el **gate visual humano** es la autoridad final.

### 3. EL CORAZÓN — la IA GENERA, se PERSISTE, los gates VALIDAN
1. **La IA DISEÑA** (R4): sobre IR + registry em-ui + tokens → decide secciones, componente, orden, jerarquía, énfasis, layout, ritmo. **Composición libre sobre vocabulario gobernado** (modelo de v0: el registry le pasa componentes+tokens; la IA compone).
2. **Se PERSISTE** como **artefacto propio** en el satélite (codegen-as-source, patrón shadcn *Open Code*). Re-emitir **REPLAY-ea** → reproducible (porque está COMMITEADO, no re-rodado).
3. **Los gates VALIDAN** (deterministas): lossless (`lib/lossless.mjs` `verifyEmit`), estándar (`lib/launch-ready.mjs`), drift (ADR-014 §2), y **regresión visual + a11y** (golden images commiteadas + axe-core).
4. **"Regenerar"** (ADR-014 §5) = NUEVA pasada creativa (otro artefacto), no un re-roll en render.

### 4. MECANISMO = Opción 3 (spec de diseño persistido → compilador delgado)
La IA escribe un **SPEC de diseño** (toda la decisión de diseño, en vocabulario em-ui + tokens); un **compilador
delgado** lo emite con componentes inmutables; los gates lo validan. El suelo (lossless/drift/estándar/tokens) queda
garantizado **POR CONSTRUCCIÓN**. Descartadas: op.1 (motor determinista = el fallo), op.2 (IA en render-time = no
reproducible ni gateable), op.4 (JSX directo = más techo pero reabre pérdida/drift como bucle post-hoc).

### 5. ⛔ CONSTRAINT INNEGOCIABLE — el SPEC debe ser EXPRESIVO DE VERDAD (condición de la aprobación)
El spec debe poder expresar **diseño ARBITRARIO** sobre **TODO** el vocabulario em-ui + la superficie de tokens
(secciones/componente/orden/jerarquía/énfasis/layout/ritmo/agrupado/anidado/spans), **NUNCA** un menú `role→shell` ni
un enum fijo de roles. **Si el spec recae en plantillas, vuelve el status quo** — es un FALLO de diseño que invalida la
decisión, no un detalle de build. El **compilador es un tipógrafo tonto**: toda la decisión de diseño vive en el spec que
autora la IA. El gate de la fase G3 debe **demostrar expresividad real** (p.ej. dos satélites con composiciones
genuinamente distintas del MISMO tipo de contenido), no sólo "compila + pasa lossless".

### 6. ORGANIZACIÓN — un skill, rol = directorio, IR = frontera
Sigue siendo **UN** skill (`launch-satellite`); cada rol vive en su directorio, con el IR como contrato entre captura y
diseño y el **artefacto de diseño** como contrato entre diseño y validación. **Motor genérico** (captura/IR/gates/
contrato del compilador/drift — agnóstico de producto) **vs binding de producto** (registry em-ui + estándar). El layout
exacto es trabajo de build; el norte fija el principio.

## Consecuencias
- **Build por fases (ECOs aparte):** **G1** captura+IR (REUSAR/endurecer) · **G2** esqueleto+estándar (REUSAR/aislar) ·
  **G3 — el corazón: REEMPLAZAR la capa de decisión** (IA-diseñador + spec persistido + compilador delgado, sustituyendo
  `compose`/`renderMain`/`DEFAULT_HOME_COMPOSITION`) · **G4** crítica + "regenerar" · **G5+** generalizar a otros intakes.
  Cada fase es entregable y verificable sola; G3 lleva el gate de **expresividad real** (§5).
- **REUSE vs REPLACE:** se REUSA el esqueleto (IR, captura, gates lossless, estándar, drift, launch-readiness) y el
  **render lossless por bloque** (`builders/lib/emit-blocks.mjs` `renderBlock`) como **primitiva** con la que la IA
  compone; se REEMPLAZA la **capa de DECISIÓN determinista** (composición mecánica) por la IA-diseñador + compilador.
- **Reproducibilidad por persistencia, no por modelo:** el LLM no es determinista ni a temp 0 → el artefacto persistido
  es la fuente reproducible; los gates (lossless/estándar/drift/golden+axe) son la red determinista.
- **Honestidad / §D4:** la generatividad aplica al **DISEÑO**, **nunca a los HECHOS** (negocio/servicios/precios/contacto
  = `extracted`/`provided`, jamás inventados, jamás perdidos — lossless). "Bello" no es totalmente automatizable: el gate
  visual **humano** (R5) es la autoridad final; golden+axe cazan regresión/a11y, no belleza (declarado, no fingido).
- **No re-litiga el norte:** ADR-012/013 intactos; el ESQUELETO de ADR-014 (§2/§3/§5) se conserva; se supersede **sólo**
  el MECANISMO de generación de ADR-014 (la "composición generativa" mecánica), que era una decisión presentada aún mal
  implementada (deuda ECO-70/FB6).
- **Aprobación por merge (KEEL-104):** el `process.json` queda en `presented`; este PR, **revisado y mergeado** por el
  operador, **ES** la aprobación.

## Notas
- Refinamiento **ECO-71** conducido por el motor (`/strategy satellite-builders` → `presented` con research real:
  v0 genera código real constreñido por un registry; Lovable/bolt/shadcn = código propio persistido/codegen-as-source;
  el LLM no es determinista ni a temp 0; validación por golden/axe + W3C Design Tokens). El "cómo" detallado vive en los
  ECOs de build (G1…G5+); el norte lo consagra en `strategy/satellite-builders.md §«Refinamiento ECO-71»`.
