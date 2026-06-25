# ADR-014 — Satélites: diseño GENERATIVO por composición + COMPONENTES INMUTABLES (cumple ADR-010 op.3) + estándar VIVO + regenerar

- Status: superseded
- Superseded-by: ADR-015
- Date: 2026-06-23
- Ticket: [ECO-69](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-69) (decisión) · seguimiento [ECO-70](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-70) (FB6, build sobre el emit)
- Strategy: satellite-builders
- Deciders: Operador (human gate vía **review + merge** del PR de la lane, 2026-06-23)
- Contexto de gobierno: repo gobernado por Emkeel (ver `AGENTS.md`). Materializa el **refinamiento ECO-69**
  del norte ([`strategy/satellite-builders.md` §«Refinamiento ECO-69»](../strategy/satellite-builders.md)).
  **Reutiliza — no re-litiga —** [ADR-010](010-satellite-design-generation.md) (diseño HÍBRIDO op.3),
  [ADR-012](012-satellite-builders-architecture.md) (builders→IR→emitter), [ADR-013](013-satellite-launch-readiness-standard.md)
  (estándar/gate de launch-readiness). **Aprobación (KEEL-104, emkeel 0.1.88):** el `process.json` queda en
  `presented`; la aprobación humana **ES el review + merge de este PR** (branch protection exige review),
  **no** un campo `approved` auto-escrito — un proceso commiteado que afirme `approved` FALLA el gate.

## Contexto
ADR-010 decidió el enfoque **HÍBRIDO (op.3)**: una biblioteca de secciones determinista como **sustrato
gobernado** + la IA **propone** tipo/secciones/composición como `proposed`, confirmable en el loop (§D4). Pero
el **emit** implementado se quedó en lo **MECÁNICO**: bloque→sección fija por tipo
(`generate-satellite.mjs:122` `DEFAULT_HOME_COMPOSITION` + `builders/lib/emit-blocks.mjs:41` `switch (b.kind)`)
→ la capa **generativa** de op.3 **nunca se materializó en el render** → el diseño sale pobre/uniforme. ECO-69
cierra esa brecha **sin re-litigar** el norte.

## Decisión

### 1. DISEÑO GENERATIVO POR COMPOSICIÓN (materializa ADR-010 op.3)
La IA diseña **generativamente** la composición: **qué componente por sección, orden, función, layout y
jerarquía visual** — sobre el contenido **LOSSLESS** (IR) + la **marca**. La creatividad está en el **CÓMO** se
componen los componentes (honra el diseño libre §D4), no en inventar hechos. **Reproducible:** la composición
se **PERSISTE** como `proposed` en el brief/IR (§D5), confirmable en el loop → **NO** es freestyle por render.
El sustrato gobernado (secciones + componentes inmutables) mantiene **S2/a11y/SEO por construcción** → sigue
siendo **HÍBRIDO** (op.3), no **bespoke** (op.2, descartada en ADR-010 por no-reproducible).

### 2. COMPONENTES INMUTABLES (compone, no modifica)
La IA **usa y compone** los componentes de em-ui; **NO los modifica**. Solo ajusta **tamaño + colores vía
TOKENS** semánticos (patrón shadcn/ui: themea por tokens "sin reescribir las clases del componente"; desaconseja
tocar el fuente). **GATE de drift:** compara los componentes emitidos contra `design-system/registry.json`;
**PERMITE** la superficie de tokens/tamaño/color; cualquier `structural-diff` **más allá** de esa superficie =
**drift → falla**. (El "cómo" exacto del diff = build FB6; la decisión es firme.)

### 3. ESTÁNDAR = LISTA VIVA mantenida contra el mercado
El estándar (ADR-013 §7) es un **suelo determinista** + un **MECANISMO DE REFRESCO**. Disparadores: **(a)
cambio de norma** — GDPR/WCAG/CWV/seguridad (el suelo **SE MUEVE**: INP reemplazó a FID el 12-mar-2024; WCAG 2.2
→ Recommendation W3C el 5-oct-2023; Consent Mode v2 obligatorio en el EEE el 6-mar-2024); **(b) revisión
periódica** (trimestral, backstop). Cada cambio se tramita por **`/strategy` gobernado** (gate humano) → al
**estándar** + al **gate** → lo heredan **todos los builders** (núcleo común = único punto de cambio). El
disparador-por-norma es **primario**; el trimestral, **backstop**.

### 4. El TOGGLE de tema registrado en el §estándar
El **toggle de tema MANUAL (ECO-68)** queda listado como **indispensable** del estándar — **primera extensión
concreta** materializada vía la lista viva (§3). Cableado al `ThemeContext`, montado **DENTRO** del
`ThemeProvider`; `ThemeToggle` de em-ui vía **registry** (`design-system/registry.json:344`, no copia local);
verificado en el gate (`launch-ready.mjs:151`). (Ya consagrado en ADR-013 §1/§6/§7; ECO-69 lo fija
explícitamente en el §estándar del norte.)

### 5. FLUJO "REGENERAR DISEÑO" en el gate visual
En la pausa visual del loop: **"se ve bien"** → avanza · **"ajusta X"** → cambio puntual · **"regenera"** → la
IA **re-diseña la composición desde cero** (mismos componentes inmutables + mismo contenido lossless, nueva
composición). Da control creativo **sin tocar hechos ni componentes**.

## Consecuencias
- **Build FB6 ([ECO-70](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-70)):** implementar
  (1)–(2)–(5) sobre el **emit del núcleo común** — composición generativa que reemplaza el bloque→sección
  mecánico, gate de drift de componentes, flujo regenerar. **Único punto de cambio** → lo heredan **todos** los
  builders, sin tocar adapters.
- **Reproducibilidad preservada:** la composición vive en el IR/brief (`proposed`), no en el render → el loop
  §D4/§D5 y el brief-como-fuente siguen intactos; **no** se cae en bespoke (op.2).
- **No re-litiga el norte:** **CUMPLE** ADR-010 op.3 (no la contradice); ADR-012 (builders→IR→emitter) y
  ADR-013 (estándar/gate) quedan **intactos**; el estándar crece por su mecanismo de lista viva.
- **Honestidad / §D4:** la generatividad aplica al **CÓMO** (composición/diseño), **nunca a los HECHOS**
  (negocio/servicios/precios/contacto = `extracted`/`provided`, jamás inventados).
- **Aprobación por merge (KEEL-104):** el `process.json` se queda en `presented`; este PR, al ser **revisado y
  mergeado** por el operador, **ES** la aprobación — no hay campo `approved` auto-certificado en el archivo.

## Notas
- Refinamiento **ECO-69** conducido por el motor (`/strategy satellite-builders` → `presented` con research
  real: shadcn/ui theming por tokens; INP/WCAG 2.2/Consent Mode v2 con fecha; anclas de repo del
  emit/registry/gate). El "cómo" detallado vive en **FB6 (ECO-70)**; el norte lo consagra en
  `strategy/satellite-builders.md §«Refinamiento ECO-69»`.
