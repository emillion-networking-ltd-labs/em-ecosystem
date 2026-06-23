---
name: launch-satellite
description: "Lanza un satélite (sitio de cliente) de NexaCore de extremo a extremo: onboarding (5 modos de intake — sin diseño / con marca / mejorar sitio / Instagram / inspiración → brief.json estructurado), generación (brief → satélite S2-ready reutilizando el UI Core vía em-ui), preview local por defecto (levanta el satélite renderizado para verlo antes de provisionar) y provisión/lanzamiento (Jira + Vercel, dry-run por defecto, Lighthouse remoto = lanzado). Úsalo cuando el operador quiera arrancar, generar o lanzar un satélite, recoger los datos de un cliente, o preparar su provisión. Las acciones externas (Jira/Vercel) solo se ejecutan con confirmación humana explícita (--apply --confirm)."
---

# /launch-satellite — lanzar un satélite end-to-end (onboarding F2a → generación F2b → provisión F3b)

Lanzas un satélite de extremo a extremo: **intake** → **`brief.json`** → **generación** (satélite S2-ready) →
**provisión/lanzamiento** (dry-run-first). Materializa [ADR-008](../../../emkeel-governance/adr/008-satellite-onboarding-generation.md)
([`ECO-24`](../../../emkeel-governance/specs/ECO-24.md) onboarding, [`ECO-25`](../../../emkeel-governance/specs/ECO-25.md)
generación) y [ADR-009](../../../emkeel-governance/adr/009-satellite-automation-governance.md)
([`ECO-28`](../../../emkeel-governance/specs/ECO-28.md) provisión). Las acciones externas (Jira/Vercel) requieren
confirmación humana explícita (`--apply --confirm`) — nada outward-facing ocurre a ciegas.

## Reglas duras (innegociables)
- **NO inventes datos del negocio.** Colores, marca, servicios, precios, bio, seguidores, fotos: solo
  entran si el cliente los **aporta** o se **extraen** de una fuente real suya. Todo dato sin fuente
  queda `missing` (pedirlo) o `proposed` (sugerencia a confirmar) — **nunca** `provided`.
- **Parte del UI Core + estructura SAT01.** No diseñas desde cero: las rutas/secciones objetivo salen de
  la forma satélite (como `satellites/sat-cristian-garcia/`); los componentes los pone F2b vía `em-ui`.
- **Procedencia por campo.** Cada dato del brief lleva `provenance: provided|extracted|proposed|missing`
  (y `source` si `extracted`). El validador rechaza `invented` y "missing con valor".

## Paso 1 — Elegir modo de intake
Pregunta al operador/cliente cuál encaja (puede combinarse, p.ej. b+d):
- **(a) Sin diseño/marca** → preguntas datos reales (negocio, servicios/precios, contacto) y **propones**
  2-3 paletas/tipografías para que **elija** (propuesta = `proposed`, no invención).
- **(b) Con diseño/marca** → el cliente aporta sus **tokens** (colores/tipografía/logo) → `provided`;
  se mapearán a la capa de tokens (`em-ui init`) en F2b.
- **(c) Mejorar un sitio existente** → **PREGUNTA SIEMPRE primero: "¿URL viva o material local? Si local,
  ¿qué ruta?"** (nunca auto-elijas la fuente).
  - **URL viva** → `scripts/fetch-url.mjs <url> c-improve-site` **extrae** título/descripción/colores reales
    (`extracted`, source=url). Lo no extraído se pregunta.
  - **Material local** (un backup, un export, una carpeta de assets — sea WordPress o cualquier otra cosa) →
    pide la **RUTA** (default `.satellite-intake/<cliente>/`, **parámetro** — el material es movible sin tocar
    código). El skill **apunta a ese directorio y TÚ lo lees con tus herramientas normales** (`ls`, `Read`),
    guiado por la **prosa del operador** sobre qué hay ahí. No hay parser por tipo de fuente: exploras el
    contenido **conversacionalmente** y aplicas la **regla dura "no inventar"** — lo que **está** en los
    ficheros entra como `extracted` (source = la ruta del fichero); lo que **no está** (p.ej. el texto de
    páginas de un backup solo-ficheros, que vive en la BD ausente) queda `missing` y **se pregunta**. Nunca
    fabricas lo que no encuentras.
    - **GUARDRAIL 1 — un "no lo veo" NO es `missing` (busca en TODO el árbol).** Antes de declarar un asset
      (imágenes, logo, fotos, PDFs…) `missing`, **busca en todo el árbol del intake desde la raíz**, no en un
      solo subdir — p.ej. `find <ruta-intake> -type f \( -iname '*.jpg' -o -iname '*.png' -o -iname '*.webp'
      -o -iname '*.svg' -o -iname '*.pdf' \)` (o `ls -R`). Un "no encontrado en la carpeta que miré primero"
      es un **falso `missing`**: solo marca `missing` **tras buscar a fondo** y no hallarlo. *(Piloto Grupo
      Atis: se declaró el media `missing` mirando un subdir cuando había **1834** imágenes en el árbol.)*
    - **GUARDRAIL 2 — un dump de CMS MEZCLA ruido demo/plugin/sample con el contenido del cliente.** Al
      extraer **copy** de un export/dump (WordPress u otro): quédate **SOLO** con bloques **inequívocamente
      del cliente** (mencionan **su marca / sus servicios reales** del brief); **DESCARTA** texto de
      **demo/plantilla/plugin/sample/lorem** (p.ej. "Astra Starter", "Hello world", textos de plugins).
      **Cita VERBATIM** (no suavices ni reescribas al extraer — eso es F2b creatividad, va como `proposed`).
      **Ante la duda, `proposed` NO `extracted`**: si no puedes afirmar que ese texto es del cliente, es una
      sugerencia a confirmar, no un hecho extraído. *(Piloto Grupo Atis: la BD traía mucho demo/plugin
      mezclado → riesgo de colar ruido como copy "extraído".)*
  - **Tras el intake, PREGUNTA SIEMPRE la FIDELIDAD** (gate D4 del norte; **nunca la auto-elijas**) — *"¿cómo
    lo quieres?"* → entra al brief como `intent` (`provided`):
    - **(A) `a-replica`** → réplica fiel del sitio llevada a la tecnología satélite (Next.js + hardening S2), sin rediseño.
    - **(B) `b-remodel` — DEFAULT** → remodel moderno con **nuestros componentes**: conserva sus **hechos**, diseño fresco sobre el UI Core. *("aporta valor… salvo que el cliente tenga otra idea")*.
    - **(C) `c-reimagine`** → reimaginación libre: propuesta de diseño/estructura nueva a partir de los hechos.
    **Split verdad/diseño (D4):** los **HECHOS** del cliente (nombre, servicios, contacto, copy real, assets)
    son `extracted`/`provided` — **intactos, jamás fabricados** en los tres modos; la **CREATIVIDAD** (diseño,
    redacción nueva, secciones sugeridas) va como `proposed` — **bienvenida, etiquetada, a confirmar**. En
    **(A)** lo `proposed` **no se renderiza** hasta confirmarse (`[PENDIENTE: …]`); en **(B)/(C)** sí (es el preview).
  - **Tras el intake, PREGUNTA SIEMPRE el modo de color por defecto** (**nunca lo auto-elijas; NO hardcodees
    dark**) — *"¿modo de color por defecto?"* → entra al brief como `colorMode` (`provided`):
    - **`dark`** → arranca en oscuro (salvo que el visitante haya elegido claro).
    - **`light`** → arranca en claro (salvo que haya elegido oscuro).
    - **`system`** → respeta la preferencia del sistema del visitante (`prefers-color-scheme`).
    Nuestro estándar es **dark/light + toggle** (paridad con el UI Core/SAT01); la generación scaffolda esa
    maquinaria (`ThemeProvider` + init-script anti-FOUC) con el **default que elija el cliente**. Ausente ⇒ `system`.
  - **Tras el intake, PREGUNTA SIEMPRE el TIPO DE SITIO** (pilar P2; **nunca lo auto-elijas**) — *"¿qué tipo de
    sitio?"* → entra al brief como `siteType` (`provided`): **`landing`** (una página) · **`business-multipage`**
    (negocio multipágina) · **`portfolio`** · **`other`**.
  - **La IA PROPONE la composición** (pilar P2 — el "puzzle" de la opción 3 híbrida): según **tipo + negocio**,
    propón qué **secciones** del catálogo (Hero/Services/Testimonials/Pricing/Portfolio/FAQ/Contact/CTA), en qué
    **orden** y con qué **variante**; preséntala y el cliente **confirma/ajusta** → entra al brief como
    `composition` (capa `proposed`→`provided`). **Regla dura §D4: solo propón una sección si HAY datos reales**
    para ella (no propongas Testimonials sin testimonios, ni Pricing sin precios) — o propón **recoger** ese
    dato; **jamás inventes contenido**. El generador honra la composición pero **OMITE** cualquier sección sin datos.
  - **Válvula "que la IA recomiende / sorpréndeme"** (pilar P4): en los menús de **tipo** y **composición**, la
    última opción es *"que la IA elija la mejor configuración para el negocio"* — propón la composición recomendada
    (no una lista cerrada). Aplica SOLO a **diseño/estructura/secciones** (capa `proposed`), **NUNCA a los HECHOS**
    (negocio/servicios/precios = siempre `extracted`/`provided`). Ausente ⇒ composición por tipo/default (retrocompatible).
- **(d) Instagram** → **vía primaria:** el cliente aporta su **handle** y **confirma/pega** su contenido
  (bio, fotos, stats) → `provided`. El **scrape es best-effort** (`scripts/instagram-intake.mjs`, solo
  datos **públicos** de su **cuenta propia**, sin saltar auth-walls): si funciona, pre-rellena como
  `proposed` (a confirmar); si falla/ausente, se **degrada a preguntar** (`missing`). Nunca fabrica stats.
- **(e) Inspiración** → URLs que el cliente da como **referencia estética**; NO se copian datos al brief.

## Paso 2 — Recoger los datos (preguntar/extraer, agrupado)
Pregunta lo necesario en pocos mensajes (no interrogatorio). Para cada dato registra su procedencia.
Usa los scripts para las tareas mecánicas; tú decides preguntas y confirmaciones, el script obtiene/valida.

## Paso 3 — Ensamblar y validar el brief
Construye `brief.json` conforme a [`schema/brief.schema.json`](schema/brief.schema.json) (ver
`schema/brief.example.*.json`). Usa `scripts/lib/brief.mjs` (`field(value, provenance, source)`) — lanza
si intentas inventar (missing con valor, extracted sin source). Valida:

```bash
node scripts/validate-brief.mjs <ruta-brief.json>   # exit 0 = válido
```

## Paso 4 — Entregar el brief (fin de F2a)
El `brief.json` validado es el **entregable** del onboarding.

## Paso 5 — Generación (F2b, ECO-25): brief → satélite S2-ready
`scripts/generate-satellite.mjs <brief.json> <destDir>` ejecuta un pipeline determinista (NO greenfield):
1. **Scaffold forma-satélite** desde la estructura SAT01 (package.json, next.config.mjs con las 6 cabeceras
   S2, tsconfig, layout con observabilidad, robots/sitemap, rutas marketing del brief).
2. **Reuse de UI SOLO vía `em-ui`**: `em-ui init` (capa de tokens) + `em-ui add <C>` (cierre transitivo)
   desde `design-system/`. Jamás copia manual, jamás dashboard.
3. **Relleno desde el brief**: datos `provided`/`extracted`/`proposed` reales; los `missing` → **placeholders
   visibles** (`[FALTA: …]`), nunca inventados.

**Validación local "hasta S2-ready"**: `next build` verde + Lighthouse local
(`scripts/lighthouse-local.mjs <url>`, Perf≥90/SEO≥95/BP≥95/A11y≥90). Si un umbral no se alcanza —o no hay
chromium para correr Lighthouse— se **reporta el gap** (no se falsea el PASS). **Deploy/provisión/Lighthouse
remoto = F3**, no aquí.

> El satélite demo de validación es **efímero** (se genera en test/CI y se descarta); no se commitea.

**Loop iterativo (modo c, D4):** la generación lee `intent` y aplica la latitud — los **hechos** se rinden
intactos; lo `proposed` se renderiza en remodel/reimagine (es el **preview**) y queda trazado en
`trace.proposed`. El ciclo es: **propones** → preview (`next build` + Lighthouse local) → el operador/cliente
**refina en prosa** → **regeneras** → al confirmar una sugerencia, `confirmField(field)` la pasa de `proposed`
a `provided` (mecánica en `scripts/lib/brief.mjs`). Nada externo (Vercel/Jira) sin gate humano (Pasos 6–7).

## Paso 6 — Preview local (POR DEFECTO): ver el satélite antes de F3
Tras generar (Paso 5) y **ANTES de cualquier acción externa / rama / provisión (Paso 7)**, **levanta el satélite
en local** para juzgarlo con los ojos — un `trace` JSON no basta para evaluar el diseño. Es **por defecto**, no
opt-in; **local y reversible** (no toca nada externo).

`scripts/preview-satellite.mjs <satDir>`: instala deps si faltan, arranca `next dev` en **background** y te da la
**URL** (`http://localhost:3100`; reubica si el puerto está ocupado) + cómo pararlo (`kill <pid>`, logs en
`<satDir>/.preview.log`). Puerto configurable (`PREVIEW_PORT=N` o 2º argumento).

**GATE VISUAL (humano):** el flujo **SE DETIENE** aquí esperando tu OK — *"se ve bien"* → sigue a F3; *"ajusta
X"* → vuelve al loop (refina el brief en prosa → regenera → preview otra vez). Puedes **saltarte** el preview si
quieres. Nada externo (Vercel/Jira) ocurre antes de pasar este gate.

## Paso 7 — Provisión + lanzamiento (F3b, ECO-28) — DRY-RUN POR DEFECTO
`scripts/provision-satellite.mjs <satellite-dir>` PREPARA la provisión end-to-end y, **por defecto, NO ejecuta
nada externo** (ADR-009 Q4). Imprime las acciones que se ejecutarían + un checklist:
- **(a) Jira (Q2):** proyecto **NUEVO e independiente** por satélite + tickets S1/S2/S3.
- **(b) Vercel (Q1/Q3):** proyecto → `rootDirectory satellites/sat-<x>/`, Ignored Build Step + bypass del primer
  deploy (runbook §1.5), `nodeVersion 22.x`; target **nuestro team empresarial por defecto**, o **cuenta-cliente
  pluggable** con `--vercel-client-token` (token en **runtime, nunca almacenado**).
- **(c) Checklist** de provisión.

**Frontera humana:** las acciones reales (crear proyecto Jira, deploy Vercel) solo con **`--apply --confirm`**
(operación **humana**, secrets desde el entorno; **nunca en CI**). `--apply` sin `--confirm` se niega.

**"Lanzado" = Lighthouse REMOTO:** tras el deploy (humano), `scripts/lighthouse-remote.mjs <url>` valida los
umbrales S2 sobre la URL desplegada. Sin URL/chromium → **reporta gap** (no falsea). Deploy = operación humana.

## Scripts
- `scripts/validate-brief.mjs <brief.json>` — valida estructura + regla "no inventar".
- `scripts/fetch-url.mjs <url> [c-improve-site|e-inspiration]` — modo (c) URL / (e), best-effort, degrada a preguntar.
- `scripts/instagram-intake.mjs <handle>` — modo (d), cliente-primario + scrape best-effort + fallback.
- `scripts/generate-satellite.mjs <brief.json> <destDir>` — F2b: brief → satélite S2-ready (scaffold + em-ui).
- `scripts/builders/from-file.mjs <dir-backup> [--out ir.json]` — **CAPTURA** (FB1, ECO-63 / [ADR-012](../../../emkeel-governance/adr/012-satellite-builders-architecture.md)): adapter de fuente → **IR común LOSSLESS** + gate de completitud (fuente == IR). WordPress = primer adapter (BD + Elementor + uploads + SEO por-página); cualquier backup = otro adapter, mismo IR.
- `scripts/builders/build-from-file.mjs <dir-backup> <destDir> [--brand #hex] [--color dark|light|system]` — **builder DESDE-ARCHIVO END-TO-END** (FB1+FB2, ECO-66): backup → IR (captura) → **EMITTER** (IR → satélite Next **enriquecido**: todas las páginas/copy/imágenes reales del IR, mapeadas a markup tokenizado em-ui; marca + i18n + SEO + dark/light) → **gate de emisión lossless** (IR == sitio). Es la ruta **"mejorar desde un backup"** (modo (c) material-local), end-to-end y **previsualizable** (`preview-satellite.mjs`). Reemplaza el resumen *extract-then-compose* para backups. *(El estándar profesional completo —form/favicon/404/Cookiebot/a11y— y la generación decorativa son FB5/ECO-65 + después.)*
- `scripts/lighthouse-local.mjs <url>` — gate S2 local; reporta gap si no hay chromium (no falsea).
- `scripts/provision-satellite.mjs <dir> [--apply --confirm] [--vercel-client-token X]` — F3b: prepara Jira+Vercel (dry-run por defecto).
- `scripts/lighthouse-remote.mjs <url-desplegada>` — F3b: gate S2 remoto = "lanzado"; gap honesto sin URL.
- `npm test` (en esta carpeta) — corre los tests (node:test): no-inventar, IG degrada, schema, generación, provisión dry-run/--apply.
</content>
