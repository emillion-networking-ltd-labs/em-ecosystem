# ADR-031 — Superficie de enforcement del DS: familia de gates + manifiesto + capas

- Status: accepted
- Date: 2026-07-12
- Ticket: [ECO-189](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-189)
- Strategy: design-enforcement
- Deciders: Operador (human gate = aprobación + merge del PR)
- Contexto de gobierno: bajo **design-system-quality** (ADR-029); es la capa de enforcement que hace
  no-eludibles las decisiones ya tomadas (tokens, contrato de variante, composición). No reabre el contrato.

## Contexto

El DS se ha reconstruido ~3 veces porque las convenciones vivían en la cabeza de quien programaba y, sin nada que
las hiciera cumplir, el corpus se re-ensuciaba. Con el código escrito por IA (o por un generador de satélites)
esto empeora: la documentación son sugerencias ignorables; solo un gate de CI es una regla no-eludible que
sobrevive al autor. Hoy solo 2 de ~13 dimensiones de fuente única están gateadas (icono, color); el resto
(spinner, primitivos HTML, tipografía, movimiento, contrato de variante, composición, espaciado/radio/sombra) son
hand-rolleables. Ver la estrategia `emkeel-governance/strategy/design-enforcement.md` (research + panel adversarial).

## Decisión

**Piso = extender la familia de gates `.mjs` existente (UN solo mundo), no una torre de herramientas.** Se
descarta ESLint/stylelint/dependency-cruiser como sistema base (fragmentaría 4 runtimes + dispersaría el libro de
excepciones greppable `-ok:`; el caso AST-difícil ya lo resuelve grep + path-scope + exención por-basename; el
equipo ya rechazó un rule-pack AST por falsos positivos). ESLint queda diferido: se adopta SOLO si una dimensión
se demuestra grep-hostil, registrándose como excepción documentada en el manifiesto.

**Capas honestas.** PISO = gates deterministas (lo mecánico: glyph directo, spinner a mano, color crudo). TECHO =
VRT + revisión humana + censo/auditoría-IA con cadencia declarada (lo que ningún grep ve: la re-implementación
*parafraseada*, el drift visual). No se finge un gate omnipotente.

**Scope y modo son campos POR-DIMENSIÓN, no heredados.** Cada dimensión declara su scope (p.ej. HTML-crudo =
"consumidor-menos-primitivos", porque en el DS el `<button>` crudo es legítimo) y su modo (nace en **ratchet/warn**
con baseline que solo decrece; gana el zero-tolerance al llegar a cero — sin big-bang).

**Arbitrary values = token-obligatorio POR-PROPIEDAD, no ban de sintaxis** (color/tipografía), con allowlist
declarada (`var()` en arbitrary, pseudo-elementos, animación cosechada). Radio/spacing arbitrarios → techo.

**El corazón — la meta-regla operativa:** un **manifiesto de dimensiones protegidas** (`{ pieza, gate, scope,
escape, modo }` por dimensión) + un **meta-gate** que verifica manifiesto ↔ gates vivos en ambos sentidos. Una
dimensión nueva no entra sin su gate; el manifiesto no puede driftar. Esto hace mecánica la garantía y corta el
ciclo de reconstrucción.

## Consecuencias

- Ejecución por orden (un ticket por dimensión, receta idéntica: manifiesto → gate `.mjs` → report → migrar
  stragglers → enforce en ratchet): cerrar scope de icono (a dashboard/satélites), y construir spinner (validado),
  HTML-crudo, tipografía, movimiento, contrato-tv. Radio/spacing/re-impl van al techo (VRT/censo).
- Se construye primero el esqueleto (manifiesto + meta-gate + modo ratchet en el patrón `.mjs`).
- Excepciones legítimas (Tabs→SidebarNav) vía escape declarado, `grep`-auditable — nunca debilitando el gate.
- Validación registrada `mixed` (honesta): el prototipo del gate de spinner cazó el hand-roll real
  (`IconButton.tsx:106`) y un regex naive falseó en `ShimmerButton` — resuelto por la precisión por-dimensión que
  esta decisión prescribe.
