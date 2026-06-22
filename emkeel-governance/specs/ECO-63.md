# ECO-63 — FB0/FB1: builder DESDE-ARCHIVO (núcleo + IR + adapter WordPress, captura LOSSLESS)

Strategy: satellite-builders

## Resumen
Construye **FB0/FB1** del norte [`satellite-builders`](../strategy/satellite-builders.md) ([ADR-012](../adr/012-satellite-builders-architecture.md),
opción 3): el **núcleo común** + el **modelo normalizado (IR)** + el **builder DESDE-ARCHIVO** con su **adapter
WordPress**, que lee la BD del backup + uploads → **IR lossless** y pasa un **gate de completitud** (fuente == IR).
Cierra el fallo histórico (*extract-then-compose* con **pérdida silenciosa**): hoy el brief captura ~15 campos y
1 imagen; el IR captura **todo**. El **emitter** (IR → satélite Next enriquecido) + el cableado visible end-to-end
es **FB2** — pero FB0/FB1 se diseña **apuntando** a esa integración, no como módulo suelto.

## Decisiones que resuelve

### D — Núcleo común + IR (FB0), AGNÓSTICO de la fuente
`scripts/builders/lib/ir.mjs` — el **modelo normalizado**: `site` · `pages[]` (route+title+`blocks[]`) ·
`block` (kind+text+media+**`raw`**) · `media[]` (manifest de TODAS las imágenes reales) · `menus[]` · `forms[]`.
El `raw` preserva el elemento original **tal cual** → garantía de que nada se pierde aunque el normalizador no
reconozca un widget. `validateIR` + `irStats` (la base del gate). **Cero conocimiento de WordPress en el núcleo.**

### D — Interfaz de adapter GENÉRICA + gate de completitud (FB0)
`lib/adapter.mjs` — un adapter es `{ kind, detect(dir), capture(dir)->IR }`; registro + selección. `lib/lossless.mjs`
— el **gate de COMPLETITUD**: compara lo que la fuente CONTENÍA (`coverage.source`) con lo que el IR CAPTURÓ
(medido del IR real), y **FALLA si se perdió algo** (páginas/bloques/imágenes in == out) o si el adapter miente
sobre lo emitido. Lo que el backup **no contiene** se **declara** (`notInSource`), no se inventa (§D4).

### D — Adapter WordPress (FB1) — el ÚNICO sitio con conocimiento de WP
`adapters/wordpress.mjs` — usa el parser genérico de mysqldump (`lib/sqldump.mjs`, streaming, neutral) con
conocimiento de WP: `wp_posts`/`wp_postmeta._elementor_data`/`wp_options`/menús ∪ el árbol `uploads`. Recorre el
árbol Elementor → un **bloque por widget** (raw preservado); captura **TODAS** las imágenes originales de uploads
(excluye miniaturas -WxH = derivados regenerables, y ruido de wp-core/plugins/temas); idioma real (i18n).
**Añadir otra fuente luego = otro adapter que produce el MISMO IR, sin tocar núcleo/IR/emitter.**

### D — Orquestador `from-file.mjs`
detecta la fuente → captura → `validateIR` → **gate lossless** → escribe el IR (`--out`). Exit 2 = fuente no
reconocida, 1 = gate lossless FALLÓ (pérdida). **Re-cablea SOLO el caso "mejorar desde un backup"**; los demás
casos (desde-URL, modos de creación) mantienen su flujo actual y se reconstruyen DESPUÉS, uno a uno.

## Evaluación (a tu decisión) — ¿builder como PROCESO GOBERNADO no-saltable?
> El operador pidió evaluar si el builder debe ser un proceso prereq-gated con evidencia (estilo el motor de
> `/strategy`) con un **gate de completitud/lossless** no-saltable. **Evaluación + recomendación; la decides tú.**

**Diagnóstico:** el fallo histórico es **pérdida silenciosa**. Un gate de completitud no-saltable es exactamente
el mecanismo que lo previene. La pregunta es la FORMA:

| Opción | Qué | Pro | Contra |
|---|---|---|---|
| **A** | **Gate siempre-activo en el orquestador** (lo construido): capture→validate→lossless, exit 1 si pierde | no-saltable por camino de código; simple; ya hecho | sin trail de auditoría persistido por build |
| **B** | **State machine GOBERNADA** (mismo patrón prereq-gated que `emkeel.process`/`/strategy`, portado a JS): `captured→modeled→reconstructed→emitted→VERIFIED`, evidencia (coverage) en disco por build | auditable + resumable; el paso `verified` (lossless) es el gate duro no-saltable; viaja commiteado con el satélite (como el brief §D5) | más peso; el valor pleno aparece con el emitter (FB2) |
| **C** | **Híbrido por fases:** gate siempre-activo AHORA (FB0/FB1); formalizar la state machine cuando aterrice el emitter (FB2 end-to-end) | coste cuando aporta; no bloquea FB1 | la formalización llega en FB2 |

**Recomendación: B en espíritu, ejecutado como C.** Adoptar la **state machine gobernada no-saltable** —
reusando la *disciplina* del motor de `/strategy` (`emkeel.process`: pasos ordenados + evidencia + el motor se
NIEGA a saltar), portada a un equivalente JS pequeño dentro del builder (Node) — con la **verificación lossless
como paso `verified` no-saltable**. Implementar **ya** la captura+gate (FB0/FB1, este PR), y cablear la state
machine completa (`captured→IR→reconstructed→emitted→verified`) **cuando aterrice el emitter (FB2)**, con el
**coverage report commiteado** junto al satélite (auditable). Así el "N páginas in == N out, TODAS las imágenes,
TODOS los bloques" es un gate que **no se puede omitir**, no una buena intención. **Tú decides A/B/C.**

## Scope
- `scripts/builders/lib/{ir,adapter,lossless,sqldump}.mjs` (núcleo, NEUTRAL), `adapters/wordpress.mjs` (WP),
  `from-file.mjs` (orquestador). Fixture WP sintético + tests. `SKILL.md` (script listado).
- **NO** construye el emitter (IR → satélite) ni re-cablea el flujo visible: **eso es FB2**. **NO** toca los
  demás builders/modos. **NO** decide la forma del proceso gobernado (se presenta; la decides tú).

## Acceptance Criteria
1. **IR común agnóstico** (`ir.mjs`) + `validateIR`/`irStats`; **cero conocimiento de WordPress en el núcleo**
   (ir/adapter/lossless/sqldump) — verificado por test.
2. **Adapter WordPress** captura desde la BD + uploads → IR **lossless**: todas las páginas/posts publicados,
   un bloque por widget Elementor (raw preservado), todas las imágenes originales (miniaturas/core excluidas), idioma real.
3. **Interfaz de adapter genérica** + registro; añadir otra fuente = otro adapter, mismo IR, sin tocar el núcleo.
4. **Gate de completitud** (`lossless.mjs`): pasa cuando fuente == IR; **FALLA** si se pierde algo o el adapter miente.
5. **Prueba LOSSLESS de Atis** (local; el dump está gitignored): 22 páginas · 170 bloques · 27 imágenes ·
   26 ítems de menú · idioma `es` — vs el brief de hoy (~15 campos, 1 imagen).
6. **Evaluación del proceso no-saltable** presentada (A/B/C + recomendación) — el operador decide.
7. **Gates verdes**: `gates` (`Strategy: satellite-builders`, `check_ticket_link` ECO-63), Security Pipeline;
   tests skill + registry verdes (fixture WP sintético commiteado; el dump real corre local).

## Out of scope (= FB2 y posteriores)
- El **emitter** (IR → satélite Next enriquecido con nuestras secciones+imágenes, un flujo) + el cableado visible
  end-to-end + el preview de ese output.
- La **forma definitiva** del proceso gobernado (se decide tras esta evaluación).
- Los **demás builders** (desde-URL) y los modos de creación (a/b/d/e) — se reconstruyen después, uno a uno.

## Alignment
Construye **FB0/FB1** de [`satellite-builders`](../strategy/satellite-builders.md) / [ADR-012](../adr/012-satellite-builders-architecture.md)
(opción 3): adapter de fuente → núcleo común (IR) → (emitter = FB2). **Genérico** (requisito duro #1: toda la
lógica WP vive SOLO en el adapter; el núcleo no la conoce). **Lossless** (cierra la pérdida silenciosa del piloto;
gate de completitud). Reúsa los transversales del núcleo común (i18n/SEO/§D4/imágenes/em-ui/preview/S2) — los
consume el emitter en FB2. Honra §D4: captura solo lo que el backup tiene; lo ausente se **declara**, no se inventa.
