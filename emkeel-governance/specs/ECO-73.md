# ECO-73 — G1: CIMIENTO — congelar el IR como contrato + ordenar `capture/` + `model/` + endurecer la captura

Strategy: satellite-builders

## Resumen
Primera fase (**G1**) del rebuild generativo de [`satellite-builders`](../strategy/satellite-builders.md)
([ADR-015](../adr/015-satellite-ai-design-authoring.md), roadmap G1…G5+). G1 es el **CIMIENTO**: **congela el IR
como CONTRATO** (la frontera captura→diseño), **ordena** el motor de captura/modelo en sus directorios
(`model/` + `capture/`), y **endurece** el adapter WordPress y el gate de captura — con **lossless VERDE sobre el
backup real de Grupo Atis** (`source == IR`, `dropped=[]`). Es **REUSAR y endurecer** (roles R1 Archivista + R2
Modelador del norte): cero re-arquitectura de la captura, **cero diseño** — el resultado visible es el **IR + el
reporte del gate** (la web llega en G2). El motor genérico **no importa em-ui** (separación motor ↔ binding de
producto, ADR-015 §6).

## Decisiones que resuelve

### D — El IR es el CONTRATO (frontera captura→diseño): `IR_VERSION` PINNED + `validateIR` endurecido
`model/ir.mjs` es la única definición del modelo. `IR_VERSION = "1.0.0"` queda **fijado** (cambiarlo es un acto
consciente de ruptura). `validateIR` se **endurece**: valida la forma de raíz (`pages`/`media`/**`menus`/`forms`**
arrays) y exige que **cada bloque — incluidos los anidados en `children` — tenga un `kind` string** (el
discriminante del modelo; sin él el emitter no sabe qué es). Un **test de contrato** (`tests/ir-contract.test.mjs`)
**ROMPE si la forma cambia**: `IR_VERSION` pinned, las claves de raíz de `emptyIR()` congeladas, el vocabulario de
claves de página/bloque/media congelado, y una batería que verifica que `validateIR` **rechaza** cada violación
estructural (no se debilita en silencio).

### D — Ordenar el motor: `model/` (el contrato) + `capture/` (fuente→IR), gate de captura separado del de emisión
`scripts/builders/` se reorganiza por rol (norte §3, ADR-015 §6), con el IR como frontera:
- **`model/ir.mjs`** — el contrato del IR (movido de `lib/ir.mjs`).
- **`capture/`** — `adapter.mjs` (interfaz genérica), `sqldump.mjs`, `adapters/wordpress.mjs` (el primer adapter),
  y **`capture-gate.mjs`** (el gate de captura `losslessReport`/`assertLossless`, **separado** del gate de
  emisión). El gate de **emisión** (`verifyEmit`, IR→sitio) queda en `lib/lossless.mjs` (lado-emisión; G2 lo
  re-hogará en `standard/`). Movimientos con `git mv` (historial preservado); **comportamiento sin cambios** (la
  captura de Atis es **byte-idéntica** antes/después).

### D — Motor GENÉRICO: ni conocimiento de fuente ni de em-ui (guard test)
El test de **GENERICIDAD** se amplía a un **escáner recursivo** de `model/` + `capture/`: **(a)** el núcleo (sin
`adapters/`) no contiene conocimiento de WordPress/Elementor (vive SOLO en `capture/adapters/`); **(b)** **NINGÚN**
fichero del motor (incluidos los adapters) importa **em-ui / design-system / registry** — captura y modelo son
agnósticos de producto; el binding em-ui es del lado de emisión (G2). Future-proof: cubre ficheros nuevos en esos
directorios automáticamente.

### D — Endurecer el adapter WordPress + el gate de captura (sin cambiar la captura de Atis)
El adapter falla **LOUD** si un `.sql` **no es WordPress** (sin `wp_posts` ni `wp_options`) en vez de producir un
IR vacío que el gate aprobaría en falso (`0 == 0` = "captura silenciosa vacía"). El gate de captura
(`capture-gate.mjs`) conserva su rigor (dimensiones **+ sub-campos**, p.ej. SEO por-página, que se caen sin cambiar
el conteo de páginas). Atis/fixture (con `wp_posts`+`wp_options`) no se ven afectados.

### D — Selección de DB: NUNCA por tamaño → PRODUCCIÓN por dominio, o FALLA RUIDOSO (`selectDump`)
Antes el adapter cogía el `.sql` **más GRANDE** (`sort` por size) — frágil: con dos DBs (producción `grupoatis.com`
vs dev `dvp-grupoatis.emillion.link`) acertó **de chiripa** porque producción pesaba más; un dev mayor habría
cogido la equivocada **EN SILENCIO**. **Invariante: jamás por tamaño.** `selectDump(dir, { targetDomain })`:
**1 `.sql`** → ése; **N `.sql`** → el que casa el **DOMINIO objetivo** (hint `--domain`, o el `basename` del backup
por la convención `.satellite-intake/<dominio>/`), leyendo el `siteurl`/`home` de cada dump (streaming, con
early-abort); **0 o >1 casan (ambiguo)** → **FALLA RUIDOSO** listando cada DB + su `siteurl` ("hay N bases, dime
cuál: `--domain <dominio>`"), jamás a ciegas. El `--domain` se enchufa por `from-file.mjs` y `build-from-file.mjs`.

## Scope
- `scripts/builders/model/ir.mjs` (movido + `validateIR` endurecido), `scripts/builders/capture/**`
  (`adapter.mjs`, `sqldump.mjs`, `adapters/wordpress.mjs` movidos; `capture-gate.mjs` nuevo), `lib/lossless.mjs`
  (sólo gate de emisión), e imports de `from-file.mjs` / `build-from-file.mjs` / `emit-from-ir.mjs`.
- Tests: `tests/ir-contract.test.mjs` (nuevo) + GENERICIDAD ampliada (em-ui guard) + imports actualizados.

## Acceptance Criteria
1. **IR contrato**: `IR_VERSION` PINNED (`1.0.0`); `validateIR` endurecido (menus/forms arrays + `kind` obligatorio
   en todo bloque, incl. anidados); `tests/ir-contract.test.mjs` **rompe si la forma del IR cambia** (claves de
   raíz congeladas + batería de rechazos).
2. **Orden por rol**: `model/ir.mjs` + `capture/{adapter,sqldump,capture-gate,adapters/wordpress}.mjs`; gate de
   **captura** separado del de **emisión**; todos los imports actualizados; `git mv` preserva historial.
3. **Comportamiento congelado**: la captura del backup de **Atis es BYTE-IDÉNTICA** antes/después del reorg (cero
   cambio de diseño/semántica).
4. **Lossless VERDE sobre Atis**: `node from-file.mjs .satellite-intake/grupoatis.com` → `source == IR`
   (22 págs / 170 bloques / 27 imgs / SEO 22 págs), **`dropped=[]`**, `notInSource` declarado; exit 0.
5. **Motor sin em-ui**: el escáner recursivo de `model/`+`capture/` confirma cero import de em-ui/design-system; el
   núcleo (sin `adapters/`) cero conocimiento de WordPress.
6. **Endurecido (no-WP)**: un `.sql` no-WordPress falla LOUD (no IR vacío que pase el gate en falso).
7. **Selección de DB (NUNCA por tamaño)**: `selectDump` elige PRODUCCIÓN por dominio; 1 dump → ése; ambiguo →
   FALLA RUIDOSO listando DBs + siteurl; test reproduce el caso REAL de Atis (prod `grupoatis.com` vs dev más
   grande) y prueba que **jamás** coge la dev por tamaño. `--domain` enchufado en from-file/build-from-file.
8. **Gates verdes**: suite del skill (`node --test`) **119 verdes**; `gates` (`Strategy: satellite-builders`,
   `check_ticket_link` ECO-73), Security Pipeline.

## Out of scope (= G2+)
- El esqueleto/estándar profesional + launch-readiness + drift y su re-hogar en `standard/` — **G2**.
- Mover el gate de **emisión** (`verifyEmit`) a `standard/` — **G2** (G1 sólo separó el de captura).
- Cualquier cosa de **diseño**: la IA-diseñador, el spec de diseño, el compilador — **G3** (el corazón).
- Cambiar la **semántica** de captura (filtrar páginas, mejorar SEO, etc.): G1 **congela**, no re-arquitectura.

## Alignment
Construye **G1** de [`satellite-builders`](../strategy/satellite-builders.md) / [ADR-015](../adr/015-satellite-ai-design-authoring.md)
(roadmap §«Refinamiento ECO-71» G1; roles R1 Archivista + R2 Modelador). Materializa el principio **rol=directorio,
IR=frontera, motor genérico vs binding de producto** (ADR-015 §6) y **REUSAR y endurecer** el esqueleto (no
reemplazar nada — el reemplazo de la capa de decisión es G3). Honra §D4 (lossless: nada de la fuente se pierde, lo
que no contiene se declara `notInSource`, nada se inventa). El **contrato del IR** congelado es la base estable
sobre la que G2 (esqueleto/estándar) y G3 (la IA-diseñador) construyen.
