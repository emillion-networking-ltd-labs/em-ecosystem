# ADR-007 — Ubicación de la fuente del design system: `design-system/` dedicado, dashboard como legacy

- **Estado:** Aceptada
- **Fecha:** 2026-06-18
- **Ticket:** [ECO-23](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-23)
- **Strategy:** satellites
- **Decisor:** Operador (human gate)
- **Contexto de gobierno:** repo gobernado por Emkeel (ver `AGENTS.md`). Refina la decisión D1 de [ADR-006](006-satellite-component-reuse.md) — **solo la ubicación de la fuente**, no el mecanismo de reuse.

## Contexto

[ADR-006](006-satellite-component-reuse.md) decidió que el reuse de componentes en satélites es un **registry + CLI interno** (`em-ui`), copia gobernada con reconciliación sobre un **single-source**. ADR-006 situó ese single-source en `nexacore-dashboard/src/components/ui/`. Al arrancar la Fase 1 surge una cuestión de ubicación que ADR-006 no resolvió:

- Si `em-ui` leyera directamente de `nexacore-dashboard/src/components/ui/`, el **mecanismo de distribución quedaría acoplado a la app dashboard** (un consumidor del design system), no a una fuente neutral. El dashboard es **un consumidor más**, no el dueño natural del sistema.
- El dashboard tiene su propia copia ya en uso (48 componentes); reescribirlo para que *consuma* la fuente vía em-ui es un cambio grande y arriesgado que **no debe bloquear** la Fase 1.

## Decisión

1. **El design system canónico vive en `design-system/`** dentro de em-ecosystem — una ubicación **dedicada y neutral**, copiada **idéntica** desde `nexacore-dashboard/src/components/ui/` (los 48 componentes), preservando los tokens semánticos.
2. **`em-ui` lee SIEMPRE de `design-system/`, nunca de `nexacore-dashboard/`.** La fuente del registry es la ubicación nueva.
3. **Dashboard y satélites son CONSUMIDORES** del design system. El dashboard **mantiene su copia actual como legacy** y **no se toca** en esta fase.
4. **Repuntar el dashboard** para que consuma `design-system/` vía em-ui es un **ECO futuro** (fuera de alcance de la Fase 1).

`/admin/design-system` sigue siendo la **vista** de fuente de verdad para humanos (`CONTRIBUTING.md:73-75`); `design-system/` es su **encarnación versionada y distribuible**.

## Alternativas descartadas

- **em-ui lee del dashboard (`nexacore-dashboard/src/components/ui/`)** — acopla el mecanismo a una app consumidora; el dashboard no es dueño neutral; mezcla "fuente" y "consumidor".
- **Repuntar el dashboard ya, en Fase 1** — cambio grande y arriesgado en una app en producción; bloquearía la pieza base por un refactor que puede ir en su propio ECO.
- **Paquete en workspace / npm** — ya descartado en ADR-006 (refactor + rigidez per-cliente); ADR-007 no lo reabre.

## Consecuencias

- Se crea `design-system/` con los 48 componentes idénticos al dashboard (snapshot inicial). Es la **única fuente** que em-ui consume.
- **Coexistencia temporal de dos copias** (dashboard legacy + `design-system/` canónica) hasta el ECO de repuntado del dashboard. Es deuda **consciente y acotada**: el dashboard no regresiona porque no se toca; el riesgo es divergencia futura entre su copia legacy y la canónica, que el ECO de repuntado cierra.
- em-ui queda desacoplado de cualquier app: fuente neutral → consumidores (dashboard futuro, satélites).
- **Refina ADR-006** (punto 1 de su Decisión): el single-source pasa a ser `design-system/`; el mecanismo (registry+CLI, copia gobernada, reconciliación) **no cambia**.

## Notas

- Decisión del operador para arrancar la Fase 1 de la estrategia [`satellites`](../strategy/satellites.md). Trazada en el spec `emkeel-governance/specs/ECO-23.md`.
</content>
