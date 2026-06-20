---
name: launch-satellite
description: "Lanza un satélite (sitio de cliente) de NexaCore de extremo a extremo: onboarding (5 modos de intake — sin diseño / con marca / mejorar sitio / Instagram / inspiración → brief.json estructurado), generación (brief → satélite S2-ready reutilizando el UI Core vía em-ui) y provisión/lanzamiento (Jira + Vercel, dry-run por defecto, Lighthouse remoto = lanzado). Úsalo cuando el operador quiera arrancar, generar o lanzar un satélite, recoger los datos de un cliente, o preparar su provisión. Las acciones externas (Jira/Vercel) solo se ejecutan con confirmación humana explícita (--apply --confirm)."
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

## Paso 6 — Provisión + lanzamiento (F3b, ECO-28) — DRY-RUN POR DEFECTO
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
- `scripts/lighthouse-local.mjs <url>` — gate S2 local; reporta gap si no hay chromium (no falsea).
- `scripts/provision-satellite.mjs <dir> [--apply --confirm] [--vercel-client-token X]` — F3b: prepara Jira+Vercel (dry-run por defecto).
- `scripts/lighthouse-remote.mjs <url-desplegada>` — F3b: gate S2 remoto = "lanzado"; gap honesto sin URL.
- `npm test` (en esta carpeta) — corre los tests (node:test): no-inventar, IG degrada, schema, generación, provisión dry-run/--apply.
</content>
