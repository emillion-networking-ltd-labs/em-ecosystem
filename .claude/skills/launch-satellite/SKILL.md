---
name: launch-satellite
description: "Lanza un satélite (sitio de cliente) de NexaCore de extremo a extremo. RUTA COMPLETA HOY = desde archivo (backup): auto-detección del backup → captura LOSSLESS a IR común → revisión/enriquecimiento de secciones (el cliente aporta el contenido, nunca se inventa) → emisión a satélite Next ENRIQUECIDO con estándar profesional (formulario, favicon, 404, Cookiebot, a11y, SEO) → gates (captura lossless + emisión lossless + launch-readiness 15 checks) → preview local por defecto → provisión/lanzamiento (Jira + GitHub + Vercel + conexión Cookiebot, dry-run por defecto). Los otros modos de intake (URL viva / sin-diseño / con-marca / Instagram / inspiración) siguen aún en el flujo antiguo (brief → generate-satellite, con pérdida), pendientes de reconstruir sobre el builder. Úsalo cuando el operador quiera arrancar, generar o lanzar un satélite. Las acciones externas (Jira/Vercel/Cookiebot) solo se ejecutan con confirmación humana explícita (--apply --confirm)."
---

# /launch-satellite — lanzar un satélite end-to-end (builder desde-archivo → preview → provisión)

Lanzas un satélite de extremo a extremo. La **ruta completa hoy** es **desde archivo (backup)**: el **builder
desde-archivo** (FB0/FB1/FB2/FB5, [`ECO-63`](../../../emkeel-governance/specs/ECO-63.md)/[`ECO-65`](../../../emkeel-governance/specs/ECO-65.md)/[`ECO-66`](../../../emkeel-governance/specs/ECO-66.md),
[ADR-012](../../../emkeel-governance/adr/012-satellite-builders-architecture.md)+[ADR-013](../../../emkeel-governance/adr/013-satellite-launch-readiness-standard.md))
captura el backup **sin pérdida** a un **IR común**, deja revisarlo/enriquecerlo, y lo emite a un satélite Next
**enriquecido** (fiel en los HECHOS, creativo en el DISEÑO) con el **estándar profesional**. Los demás modos de
intake siguen en el **flujo antiguo** (brief → `generate-satellite`, *extract-then-compose*, con pérdida) — están
marcados como tal (§«Modos aún en flujo antiguo»), no se hacen pasar por el builder nuevo. Las acciones externas
(Jira/Vercel/Cookiebot) requieren confirmación humana explícita (`--apply --confirm`) — nada outward-facing a ciegas.

## Reglas duras (innegociables)
- **NO inventes datos del negocio.** Colores, marca, servicios, precios, bio, copy, fotos: solo entran si el
  cliente los **aporta** o se **extraen** de una fuente real suya. En el builder desde-archivo todo lo que el
  backup contiene entra **lossless** en el IR; lo que la fuente NO da queda declarado (`notInSource`), nunca se
  fabrica. Una sección añadida en el paso 4 la **rellena el cliente** (la IA sugiere el TIPO, no el contenido).
- **Split verdad/diseño (§D4).** Los **HECHOS** del cliente (nombre, servicios, contacto, copy real, assets) son
  intactos, jamás fabricados. La **CREATIVIDAD** (diseño, secciones sugeridas, redacción nueva) es bienvenida pero
  va **etiquetada y a confirmar** — y solo se propone una sección si **hay datos reales** para ella (o se ofrece
  recogerlos); jamás se inventa contenido para llenar un hueco.
- **Parte del núcleo común + em-ui.** No diseñas desde cero: el emitter reconstruye sobre la forma SAT01 y los
  componentes salen de `em-ui` (tokens + cierre transitivo). El estándar profesional (formulario/favicon/404/
  Cookiebot/a11y/SEO) lo **hereda todo builder** automáticamente (lista viva, ADR-013 §7).

---

## Paso 1 — Elegir la fuente (menú HONESTO)
Pregunta al operador de dónde viene el satélite. El menú dice la verdad sobre lo construido:
- **(A) Desde archivo (backup)** — *la ÚNICA ruta completa hoy.* Un backup local del sitio del cliente (WordPress
  el primer adapter; cualquier otro backup = otro adapter, mismo IR). Sigue los **pasos 2→9** de abajo (captura
  lossless → IR → revisar/enriquecer → emitir enriquecido + estándar profesional → preview → provisión).
- **(B) URL viva · (C) Sin diseño · (D) Con marca · (E) Instagram · (F) Inspiración** — **AÚN EN FLUJO ANTIGUO /
  POR RECONSTRUIR.** Usan el camino *brief → `generate-satellite`* (*extract-then-compose*, con **pérdida**); **no
  uses el builder nuevo para ellos** (todavía no los alimenta). Si el operador elige uno, dilo claro
  ("este modo sigue en el flujo antiguo con pérdida; lo completo equivalente es el modo desde-archivo") y opera
  según §«Modos aún en flujo antiguo». No finjas que pasan por el builder.

> El resto de esta guía (pasos 2→9) es el **modo (A) desde-archivo**.

## Paso 2 — Auto-detectar el backup
NO auto-elijas a ciegas: **lee el intake y SUGIERE**, siempre con opción a corregir.
```bash
node scripts/builders/detect-source.mjs            # escanea .satellite-intake/ (o pásale otra ruta)
```
Lista cada candidato con el adapter que lo reconoce. Propónselo al operador — *"encontré un backup WordPress de
&lt;X&gt; en `.satellite-intake/&lt;X&gt;` — ¿uso este?"* — y **acepta corrección** (por si no es ese, o quiere otra
ruta/proyecto). Si **no encuentra nada**, **pregunta** la ruta/proyecto (default `.satellite-intake/<cliente>/`,
movible — el material no toca código).

## Paso 3 — Captura → IR (gate de captura lossless). Automático.
```bash
node scripts/builders/from-file.mjs <dir-backup> --out <ir.json>
```
El adapter (WordPress el primero: BD + Elementor `_elementor_data` + uploads + SEO por-página) → **IR común
LOSSLESS**. El **gate de captura** (`losslessReport`) FALLA si se pierde algo (páginas/bloques/imágenes/SEO
fuente == IR). Escribe `ir.json` e **imprime las secciones capturadas** (la entrada del paso 4).

## Paso 4 — Revisar secciones + enriquecer (INTERACTIVO, §D4)
Tras capturar, **INFORMA** las secciones que el sitio **tiene** (del IR / salida del paso 3) y **ofrece AÑADIR**:
- La **IA RECOMIENDA el TIPO** de sección a la vista del sitio leído + buenas prácticas (p.ej. "no veo testimonios
  ni FAQ; un negocio así suele beneficiarse de una sección de testimonios y una de FAQ — ¿las añadimos?").
- El **CLIENTE aporta los datos** (o la IA **propone** un borrador y el cliente **confirma/corrige**). **§D4: la IA
  sugiere el TIPO; el CONTENIDO lo aporta el cliente, NUNCA se inventa.** Sin datos reales → no se añade (o se
  recogen primero).
- Las secciones **confirmadas** se añaden al `ir.json` **antes de emitir** — la sección lleva un heading + el
  contenido real aportado:
  ```bash
  # helper programático (da forma a lo aportado; rechaza secciones vacías — §D4):
  #   import { addSection } from "scripts/builders/lib/ir.mjs"
  #   addSection(ir, { route: "/", heading: "<título real>", paragraphs: ["<copy real del cliente>"] })
  # o edita ir.json a mano (es JSON): añade los bloques { kind:"heading", text } + { kind:"text-editor", text }.
  ```
  El contenido añadido sube el conteo del IR → el **gate de emisión** (paso 6) exige que el sitio lo contenga (no
  se cae). El gate de captura ya pasó sobre el IR capturado; esto es contenido **nuevo**, post-captura.

> Si no hay nada que añadir, sigue directo al paso 5 con el IR capturado tal cual.

## Paso 5 — Las pocas decisiones que el IR no trae (nunca auto-elegir)
El builder reconstruye **fiel + enriquecido por defecto** (no hay que elegir "fidelidad A/B/C" — eso **se quitó**;
el ajuste de qué contiene el sitio va por el paso 4). Solo quedan:
- **Modo de color** — PREGUNTA SIEMPRE el modo de color, nunca lo auto-elijas: `dark` | `light` | `system`
  (`system` = respeta el `prefers-color-scheme` del visitante). *"¿modo de color por defecto?"*. Ausente ⇒ `system`.
  Entra como `--color` en el paso 6.
- **Hechos `missing` confirmados** — datos que el backup no podía dar (p.ej. autor de un testimonio, un teléfono):
  pregúntalos; lo que el cliente confirme entra (paso 4 o como dato real), lo que no, queda `missing` (no se inventa).
- **Marca** — color de marca si el cliente lo aporta y no vino en el IR (`--brand "#RRGGBB"`).

## Paso 6 — Emitir → satélite enriquecido (gate de emisión + launch-readiness). Automático.
```bash
node scripts/builders/emit-from-ir.mjs <ir.json> <destDir> [--brand "#RRGGBB"] [--color dark|light|system]
```
El emitter consume el **IR final** (capturado + lo enriquecido en el paso 4) → satélite Next con TODO el contenido
(páginas/copy/imágenes reales mapeadas a markup tokenizado em-ui) + **estándar profesional** (formulario funcional
Resend+Turnstile en la ruta de contacto real, favicon, 404, Cookiebot, a11y, Twitter Cards, JSON-LD). Corren dos
gates: **emisión lossless** (`verifyEmit`: IR == sitio, nada se cae) + **launch-readiness** (`verifyLaunchReady`:
**15 checks** del estándar, incl. cero artefactos de render). *(El atajo de una sola pasada sin pausa —para regen/
CI— es `build-from-file.mjs <dir-backup> <destDir>`; el flujo interactivo usa from-file + emit-from-ir por separado
para permitir el paso 4.)*

## Paso 7 — Preview local (POR DEFECTO): ver el satélite
```bash
node scripts/preview-satellite.mjs <destDir>
```
Instala deps si faltan, arranca `next dev` en **background**, da la **URL** (`http://localhost:3100`, reubica si el
puerto está ocupado) + cómo pararlo (`kill <pid>`, logs en `<destDir>/.preview.log`). El operador **VE** el sitio
renderizado — un `trace` JSON no basta para juzgar el diseño. Local y reversible (no toca nada externo).

## Paso 8 — Confirmar / iterar (loop §D4)
**GATE VISUAL (humano):** el flujo **espera tu OK**. *"se ve bien"* → paso 9. *"ajusta X"* → vuelve al **paso 4**
(añadir/quitar/corregir secciones en el `ir.json`) o al **paso 5** (color/marca) → **re-emite** (paso 6) → preview
otra vez. El ciclo es **propone → preview → confirma**. Nada externo ocurre antes de pasar este gate.

## Paso 9 — Provisión + lanzamiento (F3b) — DRY-RUN POR DEFECTO
```bash
node scripts/provision-satellite.mjs <destDir> [--apply --confirm] [--vercel-client-token X]
```
PREPARA la provisión y, por defecto, **no ejecuta nada externo** (ADR-009 Q4). Imprime las acciones + checklist:
- **(a) Jira** — proyecto NUEVO e independiente por satélite + tickets S1/S2/S3.
- **(b) GitHub** — repo/branch del satélite según runbook.
- **(c) Vercel** — proyecto → `rootDirectory satellites/sat-<x>/`, Ignored Build Step + bypass del 1.er deploy,
  `nodeVersion 22.x`; team empresarial por defecto, o cuenta-cliente pluggable con `--vercel-client-token`
  (token en **runtime, nunca almacenado**).
- **(d) CONEXIÓN COOKIEBOT** — **registrar el dominio en Cookiebot** y **plugar el CBID real** en el sitio
  (`NEXT_PUBLIC_COOKIEBOT_ID`). El emitter **ya** inyecta el script de Cookiebot con **ID configurable** (paso 6);
  aquí se conecta la cuenta real → el banner de consentimiento queda operativo en producción.

**Frontera humana:** las acciones reales (crear proyecto Jira, deploy Vercel, registrar dominio Cookiebot) solo con
**`--apply --confirm`** (operación **humana**, secrets desde el entorno; **nunca en CI**). `--apply` sin `--confirm`
se niega. **"Lanzado" = Lighthouse REMOTO** (`scripts/lighthouse-remote.mjs <url>`) sobre la URL desplegada; sin
URL/chromium → reporta gap (no falsea). Deploy = operación humana.

---

## Modos aún en flujo antiguo (por reconstruir)
Los modos **(B) URL viva · (C) sin diseño · (D) con marca · (E) Instagram · (F) inspiración** todavía operan con el
camino **brief → `generate-satellite`** (*extract-then-compose*, con **pérdida** por diseño — el piloto Grupo Atis
lo probó). No los hagas pasar por el builder nuevo. Mecánica vigente mientras se reconstruyen:
- **Intake → `brief.json`** (`schema/brief.schema.json`): cada dato lleva `provenance: provided|extracted|proposed|
  missing` (+ `source` si `extracted`); `scripts/lib/brief.mjs` (`field()`) lanza si intentas inventar. Valida con
  `node scripts/validate-brief.mjs <brief.json>`.
  - **(B) URL viva** → `scripts/fetch-url.mjs <url> c-improve-site` extrae título/descripción/colores (`extracted`).
  - **(C) sin diseño** → preguntas datos reales + propones 2-3 paletas/tipografías a **elegir** (`proposed`).
  - **(D) con marca** → el cliente aporta tokens (colores/tipografía/logo) → `provided`.
  - **(E) Instagram** → `scripts/instagram-intake.mjs <handle>`: cliente-primario + scrape best-effort + fallback a
    preguntar; nunca fabrica stats.
  - **(F) inspiración** → URLs de referencia estética; NO se copian datos al brief.
- **Generación** → `scripts/generate-satellite.mjs <brief.json> <destDir>` (scaffold SAT01 + em-ui; `missing` →
  placeholders visibles `[FALTA: …]`, nunca inventados). Preview (paso 7) y provisión (paso 9) son comunes.
- **Guardrails de material local heredados** (siguen valiendo si exploras un backup a mano): un *"no lo veo"* NO es
  `missing` — **busca en TODO el árbol** antes de declarar un asset ausente (piloto Atis: media declarado `missing`
  con 1834 imágenes presentes). Un dump de CMS **mezcla ruido demo/plugin/sample** con el contenido del cliente —
  quédate solo con lo inequívocamente suyo, cita verbatim, ante la duda `proposed` no `extracted`. *(El builder
  desde-archivo automatiza esto en el adapter; aquí es para exploración manual.)*

## Scripts
**Builder desde-archivo (modo A — ruta completa hoy):**
- `scripts/builders/detect-source.mjs [root]` — **paso 2**: escanea `.satellite-intake/` y SUGIERE backups reconocidos (adapter por candidato). exit 2 si ninguno.
- `scripts/builders/from-file.mjs <dir-backup> [--out ir.json]` — **paso 3 CAPTURA** (FB1, ECO-63): adapter de fuente → **IR común LOSSLESS** + gate de captura; imprime las **secciones** capturadas (entrada del paso 4). WordPress = primer adapter; cualquier backup = otro adapter, mismo IR.
- `scripts/builders/lib/ir.mjs` — `sectionsOf(ir)` (listar secciones, paso 4) + `addSection(ir, {route,heading,paragraphs,blocks})` (**paso 4 ENRIQUECER**: da forma a la sección aportada por el cliente; rechaza vacías — §D4).
- `scripts/builders/emit-from-ir.mjs <ir.json> <destDir> [--brand #hex] [--color …]` — **paso 6 EMISIÓN** (FB2+FB5, ECO-66+ECO-65): IR final → satélite Next **enriquecido** + estándar profesional + **gate de emisión lossless** + **gate de launch-readiness (15 checks)**.
- `scripts/builders/build-from-file.mjs <dir-backup> <destDir> [--brand #hex] [--color …]` — atajo de **una sola pasada** (captura + emisión, **sin la pausa** del paso 4) para regen/CI/e2e.
- `scripts/preview-satellite.mjs <destDir>` — **paso 7**: instala deps si faltan, `next dev` en background, da la URL + cómo pararlo.
- `scripts/provision-satellite.mjs <dir> [--apply --confirm] [--vercel-client-token X]` — **paso 9** F3b: Jira+GitHub+Vercel+Cookiebot (dry-run por defecto).
- `scripts/lighthouse-remote.mjs <url-desplegada>` — F3b: gate S2 remoto = "lanzado"; gap honesto sin URL.

**Flujo antiguo (modos B–F, por reconstruir):**
- `scripts/validate-brief.mjs <brief.json>` — valida estructura + regla "no inventar".
- `scripts/fetch-url.mjs <url> [c-improve-site|e-inspiration]` — modo (B)/(F), best-effort, degrada a preguntar.
- `scripts/instagram-intake.mjs <handle>` — modo (E), cliente-primario + scrape best-effort + fallback.
- `scripts/generate-satellite.mjs <brief.json> <destDir>` — brief → satélite S2-ready (scaffold + em-ui).
- `scripts/lighthouse-local.mjs <url>` — gate S2 local; reporta gap si no hay chromium (no falsea).

- `npm test` (en esta carpeta) — corre los tests (node:test): builder desde-archivo (captura/emisión/secciones/enrich/launch-readiness), no-inventar, IG degrada, schema, generación, provisión dry-run/--apply.
