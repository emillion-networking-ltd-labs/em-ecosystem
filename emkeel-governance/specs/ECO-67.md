# ECO-67 — Lanzador /launch-satellite sobre el builder desde-archivo (flujo de 9 pasos)

Strategy: satellite-builders

## Resumen
Alinea el **lanzador** `/launch-satellite` (SKILL.md) con el **builder desde-archivo** ya construido
([ECO-63](./ECO-63.md) captura/IR, [ECO-66](./ECO-66.md) emitter, [ECO-65](./ECO-65.md) estándar profesional +
gate de launch-readiness; [ADR-012](../adr/012-satellite-builders-architecture.md)+[ADR-013](../adr/013-satellite-launch-readiness-standard.md)).
**Hoy la SKILL está inconsistente:** documenta el builder nuevo en *Scripts* pero los PASOS del onboarding aún
describen el flujo viejo (*brief → `generate-satellite`*, con pérdida) para los backups. Esta entrega reescribe el
flujo a **9 pasos** sobre el builder desde-archivo y adapta el código para permitir una **pausa de revisión/
enriquecimiento del IR entre captura y emisión** (el punto que el flujo de una sola pasada no tenía).

No re-litiga FB0/1/2/5 (captura, IR, emitter, estándar profesional ya aprobados). Es la **capa de orquestación
humana** encima del builder: qué pregunta el agente, en qué orden, y dónde para a esperar al operador.

## Decisiones que resuelve

### D — Flujo de 9 pasos para el modo desde-archivo (reemplaza brief→generate para backups)
SKILL.md reescrito: (1) elegir fuente — menú **honesto** (desde-archivo = única ruta completa hoy; los demás modos
marcados "aún en flujo antiguo / por reconstruir", sin fingir que usan el builder); (2) **auto-detectar** el backup
(leer `.satellite-intake/` y sugerir, siempre con opción a corregir; si nada, preguntar); (3) **captura → IR**
(gate de captura lossless, automático); (4) **revisar secciones + enriquecer** (interactivo); (5) **pocas
decisiones** que el IR no trae (color + `missing` confirmados); (6) **emitir** (gate de emisión + launch-readiness,
automático); (7) **preview** por defecto; (8) **confirmar/iterar** (loop §D4); (9) **provisión/lanzamiento** (Jira +
GitHub + Vercel + **conexión Cookiebot**, dry-run-first). Los modos B–F conservan su flujo antiguo en una sección
aparte, marcados como tal.

### D — SE QUITA la fidelidad A/B/C del flujo
El builder reconstruye **fiel + enriquecido por defecto**; ya no se pregunta "réplica/remodel/reimaginación". El
ajuste de qué CONTIENE el sitio pasa al **paso 4** (revisar/añadir secciones). El paso 5 queda con lo mínimo que el
IR no puede traer: modo de color y hechos `missing`/marca confirmados — nunca auto-elegidos.

### D — Pausa de revisión/enriquecimiento ENTRE captura y emisión (separación de fases)
La captura (`from-file.mjs --out ir.json`) y la emisión (`emit-from-ir.mjs ir.json <dest>`) son **invocables por
separado** → el operador revisa/enriquece el `ir.json` ENTRE ambas (paso 4). `build-from-file.mjs` se mantiene como
**atajo de una sola pasada** (sin pausa) para regen/CI/e2e. Contrato de gates por fase:
- **Captura** corre `losslessReport` (fuente == IR) sobre el IR **capturado**.
- **Emisión** corre `verifyEmit` (IR == sitio) + `verifyLaunchReady` (15 checks) sobre el IR **final** (capturado +
  enriquecido). NO re-corre el gate de captura: el IR enriquecido tiene MÁS que la fuente por diseño (contenido
  nuevo, post-captura) — re-gatearlo sería incoherente.

### D — `sectionsOf` + `addSection` (núcleo del paso 4, §D4)
`sectionsOf(ir)` lista, por página, las secciones tal como el emitter las agrupa (heading + nº bloques/palabras/
imagen) → el "qué tiene el sitio" que el paso 4 informa. `addSection(ir, {route,heading,paragraphs,blocks})` da
**forma** a una sección **aportada por el cliente** (heading + contenido real) y la inserta en el IR; **rechaza
secciones vacías** (sin heading o sin contenido) → imposible colar ruido. Marca los bloques añadidos con
`raw.provenance` para trazabilidad. **§D4: la IA sugiere el TIPO; el contenido lo aporta el cliente, nunca se
inventa.** El contenido añadido sube el conteo → el gate de emisión exige que el sitio lo contenga (no se cae).

### D — `detect-source` (núcleo del paso 2)
`detect-source.mjs [root]` escanea el intake (`.satellite-intake/` por defecto) y, por cada candidato (el propio
root si es fuente, o sus subdirectorios), reporta el adapter que lo reconoce (o "no reconocido"), reutilizando el
`REGISTRY` de adapters. Da al agente la base para **sugerir** sin auto-elegir. exit 2 si ninguno reconocido
(→ preguntar la ruta).

### D — Conexión Cookiebot en la provisión (paso 9)
El emitter ya inyecta el script de Cookiebot con **ID configurable** (`NEXT_PUBLIC_COOKIEBOT_ID`, ECO-65). El paso 9
añade explícitamente la **conexión**: registrar el dominio en Cookiebot + plugar el CBID real → el banner queda
operativo en producción. Acción externa: solo con `--apply --confirm` (frontera humana).

### D — Desviación (e2e): el `package.json` emitido pineaba una versión inexistente de Turnstile
Durante la prueba e2e el `npm install` del satélite emitido FALLÓ: `emit.mjs` pineaba
`@marsidev/react-turnstile@^0.9.0`, versión que **no existe** (el paquete arranca en 1.x). Es un **bloqueo de
lanzamiento real** que el gate de launch-readiness no caza (escanea archivos emitidos, no la resolubilidad de
dependencias). Fix mínimo de una línea: `^0.9.0 → ^1.5.0` (estable actual; el resto de pines resuelven). Sin esto el
paso 7 (preview) y cualquier despliegue serían imposibles. Pequeña excepción a "no tocar el emitter" — un pin roto,
no un cambio de comportamiento.

## Scope
- `SKILL.md` (REESCRITO): flujo de 9 pasos sobre el builder desde-archivo + menú honesto + sección "Modos aún en
  flujo antiguo" (B–F con brief→generate, marcados) + *Scripts* actualizado + frontmatter `description` honesto.
- `scripts/builders/lib/ir.mjs` (MODIFICADO): `sectionsOf(ir)` + `addSection(ir, spec)` (aditivo; no toca
  `irStats`/`validateIR`/`walkBlocks`).
- `scripts/builders/from-file.mjs` (MODIFICADO): imprime las **secciones** capturadas tras el gate (entrada del
  paso 4) + apunta al emit-from-ir al escribir el IR. Captura sin cambios de comportamiento.
- `scripts/builders/emit-from-ir.mjs` (NUEVO): fase de emisión desde un IR file → `emitFromIR` + `verifyEmit` +
  `verifyLaunchReady`. Permite la pausa del paso 4.
- `scripts/builders/detect-source.mjs` (NUEVO): auto-detección de backups en el intake (paso 2).
- Tests: `tests/from-file-flow.test.mjs` (NUEVO): `sectionsOf`, `addSection` (incl. rechazo de vacías + sube
  conteo), `detectSources`, y emisión desde IR enriquecido con gates verdes.
- `scripts/builders/emit.mjs` (1 LÍNEA, desviación e2e): pin de Turnstile `^0.9.0 → ^1.5.0` (versión inexistente →
  estable). Único toque al emitter; sin cambio de comportamiento (ver decisión arriba).
- **NO** toca el gate (`launch-ready.mjs`), el adapter WordPress, ni el flujo antiguo
  (`generate-satellite.mjs`/brief) salvo la documentación; el único cambio en `emit.mjs` es el pin roto.

## Acceptance Criteria
1. **SKILL.md describe los 9 pasos** del modo desde-archivo, en orden, con el menú honesto (desde-archivo = única
   ruta completa; B–F marcados "aún en flujo antiguo / por reconstruir") y SIN la fidelidad A/B/C.
2. **Pausa captura↔emisión**: `from-file.mjs --out` y `emit-from-ir.mjs` invocables por separado; entre ambos el IR
   se puede revisar/enriquecer. `build-from-file.mjs` sigue siendo el atajo de una pasada.
3. **`sectionsOf(ir)`** lista las secciones por página (heading + bloques/palabras/imagen) coherente con cómo el
   emitter agrupa.
4. **`addSection`** inserta una sección aportada (heading + contenido real), sube el conteo del IR, y **lanza** si
   la sección no trae heading o no trae contenido (§D4 — no se añade vacío/inventado).
5. **`detect-source`** reconoce un backup en el intake (el propio dir o un subdir) y reporta su adapter; exit 2 si
   ninguno.
6. **Gates por fase**: emisión desde un IR **enriquecido** pasa `verifyEmit` (incl. las palabras de la sección
   añadida) + `verifyLaunchReady` (15 checks); el gate de captura corre en la fase de captura.
7. **E2e Atis** (auto-detectado): captura → muestra secciones → (sin añadir y añadiendo una sección de prueba con
   datos reales) → emite → preview con TODO el contenido + estándar profesional, **3 gates verdes**, **cero
   "undefined"**.
8. **Tests verdes**: suite del skill completa (node:test) verde, incl. el nuevo `from-file-flow.test.mjs`.

## Alignment
Implementa la **capa de orquestación humana** del norte [`satellite-builders`](../strategy/satellite-builders.md)
sobre los builders ya entregados (FB0/1/2/5). Honra §D4 (split verdad/diseño: la IA sugiere el TIPO de sección, el
cliente aporta el CONTENIDO; nada se inventa; secciones vacías rechazadas) y el principio de **núcleo común que
hereda todo builder** (el flujo y los gates son del builder, no del modo). Mantiene la honestidad del norte: el menú
**no finge** que los modos no reconstruidos usan el builder nuevo. **No re-litiga** ADR-012/013 ni ECO-63/65/66;
reutiliza captura/IR/emitter/gates tal cual. El flujo antiguo (brief→generate) se preserva marcado, no se borra
(historia + modos aún sin reconstruir).
