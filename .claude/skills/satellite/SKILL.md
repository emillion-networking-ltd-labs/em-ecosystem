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

## Paso 4 — Entregar el brief
El `brief.json` validado es el **entregable** de F2a. La **generación del satélite la hace F2b** (ECO-25)
consumiendo este brief vía `em-ui add`/`init` desde `design-system/`. Aquí **paras**: no scaffoldes ni
despliegues.

## Scripts
- `scripts/validate-brief.mjs <brief.json>` — valida estructura + regla "no inventar".
- `scripts/fetch-url.mjs <url> [c-improve-site|e-inspiration]` — modo (c)/(e), best-effort, degrada a preguntar.
- `scripts/instagram-intake.mjs <handle>` — modo (d), cliente-primario + scrape best-effort + fallback.
- `npm test` (en esta carpeta) — corre los tests (node:test): no-inventar (AC#3), IG degrada (AC#4), schema.
</content>
