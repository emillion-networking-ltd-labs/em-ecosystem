---
name: satellite
description: "Onboarding guiado para lanzar un satélite (sitio de cliente) de NexaCore. Conduce 5 modos de intake (sin diseño / con marca / mejorar sitio / Instagram / inspiración) hasta un brief.json estructurado que la generación (F2b) consume. Úsalo cuando el operador quiera arrancar un satélite nuevo, recoger los datos de un cliente, o preparar el brief de generación. NO genera el satélite (eso es F2b) ni despliega (F3)."
---

# /satellite — onboarding (F2a, ECO-24)

Conduces el **intake** de un satélite y produces un **`brief.json`** (contrato hacia la generación F2b).
Materializa [ADR-008](../../../emkeel-governance/adr/008-satellite-onboarding-generation.md) y el spec
[`ECO-24`](../../../emkeel-governance/specs/ECO-24.md). **NO** generas el satélite ni despliegas.

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
- **(c) Mejorar un sitio existente** → pide su URL y ejecuta `scripts/fetch-url.mjs <url> c-improve-site`
  para **extraer** título/descripción/colores reales (`extracted`, source=url). Lo no extraído se pregunta.
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

## Scripts
- `scripts/validate-brief.mjs <brief.json>` — valida estructura + regla "no inventar".
- `scripts/fetch-url.mjs <url> [c-improve-site|e-inspiration]` — modo (c)/(e), best-effort, degrada a preguntar.
- `scripts/instagram-intake.mjs <handle>` — modo (d), cliente-primario + scrape best-effort + fallback.
- `scripts/generate-satellite.mjs <brief.json> <destDir>` — F2b: brief → satélite S2-ready (scaffold + em-ui).
- `scripts/lighthouse-local.mjs <url>` — gate S2 local; reporta gap si no hay chromium (no falsea).
- `npm test` (en esta carpeta) — corre los tests (node:test): no-inventar (AC#3), IG degrada (AC#4), schema.
</content>
