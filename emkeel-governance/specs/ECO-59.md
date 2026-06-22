# ECO-59 — Preview local por defecto en /launch-satellite (ver el satélite antes de F3)

Strategy: satellites

## Resumen
Cierra un hueco visto en el piloto **Grupo Atis**: tras generar el satélite (F2b), el flujo saltaba hacia
provisión/lanzamiento (F3) **sin que el operador VIERA el resultado** — solo había un `trace` JSON. Para juzgar
el diseño hay que **verlo corriendo**. Añade un paso de **preview local POR DEFECTO** (no opt-in) entre la
generación y cualquier acción externa: levanta el satélite en `next dev` y el flujo **se detiene** en un **gate
visual humano** antes de F3. Local y **reversible** — no toca nada externo.

## Contexto / base
- El flujo del skill es: intake (F2a) → `brief.json` → **generación (F2b)** → **provisión (F3)**.
- F3 (`provision-satellite.mjs`) ya es **dry-run-first** (nada externo sin `--apply --confirm`). Pero entre F2b
  y F3 no había forma de **ver** el satélite renderizado.

## Decisiones que resuelve

### D — Nuevo paso PREVIEW LOCAL, por defecto, antes de F3
Tras generar y **ANTES** de cualquier acción externa / rama / provisión, el flujo levanta el satélite en local
y **espera el OK visual** del operador. Es **por defecto** (no opt-in); el operador puede **saltárselo**.

### D — Helper `scripts/preview-satellite.mjs <satDir> [puerto]`
1. Instala deps si faltan (`npm install`).
2. Arranca `next dev` en **background** (detached) en un **puerto libre** (default **3100**; si está ocupado,
   **reubica** al siguiente — spawnea el binario `next` local directo para controlar el puerto, ya que el dev
   script del satélite hardcodea `-p 3100`). Puerto configurable (`PREVIEW_PORT=N` o 2º argumento).
3. Imprime la **URL** (`http://localhost:PUERTO`) + cómo pararlo (`kill <pid>`, logs en `<satDir>/.preview.log`).
Núcleo puro y testeable en `scripts/lib/preview.mjs` (`hasDeps`, `isPortFree`, `pickPort`, `nextBin`, `devArgs`,
`previewUrl`); el shell orquesta los side-effects.

### D — Gate visual humano
El flujo **SE DETIENE** en el preview: *"se ve bien"* → sigue a F3; *"ajusta X"* → vuelve al loop (refina el
brief en prosa → regenera → preview otra vez). Nada externo ocurre antes de pasar este gate.

## Scope
- `scripts/lib/preview.mjs` (NUEVO): núcleo (puerto + deps + comando next dev).
- `scripts/preview-satellite.mjs` (NUEVO): shell (instala + arranca next dev en background + URL + cómo parar).
- `generate-satellite.mjs`: `.gitignore` del satélite ignora `/.preview.log` (efímero del preview).
- `SKILL.md`: nuevo **Paso 6 — Preview local (por defecto)**; provisión pasa a **Paso 7**; lista de scripts.
- Tests (sin red). **NO** cambia F2b ni F3: la provisión sigue **dry-run-first** y el preview no toca nada externo.

## Acceptance Criteria
1. **Paso preview** en el flujo, **después** de F2b y **antes** de F3 (rama/provisión); local y reversible.
2. **Por defecto** (no opt-in); el operador puede saltárselo.
3. **`preview-satellite.mjs`**: instala deps si faltan, arranca `next dev` en background, imprime la URL + cómo
   pararlo; **puerto configurable con default sensato (3100)** y **reubicación** si está ocupado.
4. **Gate visual**: el flujo se detiene esperando el OK del operador antes de F3 (documentado en SKILL.md).
5. **No rompe el flujo actual**: la provisión sigue dry-run-first; el preview no ejecuta nada externo.
6. **e2e**: genera un satélite → el preview arranca solo y **sirve en localhost** (HTTP 200) → el flujo espera
   confirmación antes de F3. Tests del skill verdes.
7. **Gates verdes**: `gates` (`Strategy: satellites`, `check_ticket_link` ECO-59), Security Pipeline; tests skill+registry verdes.

## Out of scope
- Cambiar la generación (F2b) o la provisión (F3): siguen igual.
- Un preview **remoto**/desplegado (eso es F3 + Lighthouse remoto).
- Abrir el navegador automáticamente (se da la URL; abrirla es del operador).

## Alignment
Sirve al norte satellites (`strategy/satellites.md` — producto **profesional** y al loop iterativo D4: *propones
→ preview → el operador refina → regeneras*): el preview local es el eslabón que faltaba para **ver** antes de
ramificar/provisionar. Refuerza la **frontera humana** (nada externo sin gate): añade un gate **visual** previo
al gate de provisión, sin debilitar el dry-run-first de F3. No toca los hechos del cliente (§D4): solo levanta
lo ya generado.
