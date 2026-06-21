# ECO-46 — launch-satellite: persistir el brief.json como procedencia commiteada junto al satélite

Strategy: satellites

## Resumen
Implementa la decisión **D5 del norte** (ECO-44, [`strategy/satellites.md` Decisión D5](../strategy/satellites.md)):
el `brief.json` se **preserva commiteado** junto al satélite generado (en `satellites/sat-<x>/brief.json`, **fuera
de `public/`** → Next no lo sirve), **no efímero**. Hoy `generate-satellite.mjs` **lee** el brief (`briefPath`)
pero **no lo persiste** en el satélite; este ECO escribe el brief consumido en la **raíz** del satélite generado.

## Contexto / base
- D5 ya está en el norte (APPROVED): el brief es el **registro de procedencia** (cada campo lleva
  `provided|extracted|proposed|missing`), lo consume el **loop iterativo** para regenerar, y **viaja con el
  satélite** (que ya vive commiteado, p.ej. `satellites/sat-cristian-garcia/`).
- **Frontera (D5):** el **material CRUDO** del cliente (backups, credenciales) sigue **efímero** en
  `.satellite-intake/` (`.satellite-intake/.gitignore`, ECO-43) y **nunca se commitea**; el `brief.json` es la
  **destilación sanitizada** (los mismos hechos que el sitio público ya renderiza, más su procedencia).

## Decisión que resuelve

### D — Escribir el brief consumido en `<dest>/brief.json`
Tras generar el satélite, `generate-satellite.mjs` escribe el **brief tal cual lo consumió** en la **raíz** del
satélite (`<dest>/brief.json`), **fuera de `public/`** (el generador no crea `public/`; Next solo sirve `public/`
→ el brief no queda expuesto en web). Se persiste **mínimo y honesto**: el brief **intacto**, con cada `provenance`
y `source` como están — incluidas las rutas `source` que apunten a `.satellite-intake/` (son **procedencia
histórica**, no se reescriben ni se inventan). Copiar assets (logo) al satélite es **otro concern → fuera de
alcance**.

## Scope
- `scripts/generate-satellite.mjs`: escribir `<dest>/brief.json` (brief consumido, intacto) tras generar; `trace.brief`.
- Tests (sin red): el brief se escribe en la raíz; está **fuera de `public/`**; el contenido = el brief consumido.
- **NO** copia assets, **NO** reescribe rutas `source`, **NO** toca F1 ni la forma-SAT01 ni el reuse vía em-ui.

## Acceptance Criteria
1. **El brief se persiste:** tras `generateSatellite(brief, dest)`, existe `<dest>/brief.json` y su contenido
   **deserializa al brief consumido** (mismos campos, mismas `provenance`/`source` — intactos).
2. **Fuera de `public/`:** el brief vive en la **raíz** del satélite, **no** en `<dest>/public/` (Next no lo sirve).
   Test que **falle** si cae dentro de `public/`.
3. **Mínimo/honesto:** no se reescriben ni inventan rutas `source`; un `source` a `.satellite-intake/` se
   preserva tal cual (procedencia histórica). No se copian assets (fuera de alcance).
4. **CRUDO sigue efímero:** `.satellite-intake/` no se toca ni se commitea (sigue ignorado).
5. **Gates verdes:** `gates` (`Strategy: satellites`, `check_ticket_link` ECO-46), Security Pipeline / Security
   Gate, build + tests; Lighthouse S2 del satélite generado sigue verde (gate por mediana, ECO-41).

## Out of scope
- Copiar assets del cliente (logo/fotos) al satélite — concern aparte.
- Reescribir/normalizar las rutas `source` del brief.
- Cambios en `design-system/`/`em-ui/` (F1), en la forma-SAT01, o en el modelo de procedencia.

## Alignment
Materializa la **Decisión D5** del norte (`strategy/satellites.md`): el `brief.json` **preservado commiteado**
junto al satélite (no efímero) como **registro de procedencia auditable** y fuente del **loop iterativo**, fuera
de `public/`. Respeta la frontera de D5 (el CRUDO sigue efímero en `.satellite-intake/`; solo viaja la
destilación sanitizada) y no toca F1 ni la forma-SAT01.
