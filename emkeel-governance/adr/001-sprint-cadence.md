# ADR-001 — Cadencia de sprints

- Status: accepted
- Date: 2026-06-11
- Ticket: [ECO-5](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-5)
- Deciders: Operador (em-ecosystem)
- Contexto de gobierno: repo gobernado por Emkeel (ver `AGENTS.md`).

## Contexto

El proyecto Jira `ECO` arranca su organización de trabajo y necesita una cadencia
explícita para planificar y cerrar incrementos. El equipo es pequeño y prioriza
flujo sobre ceremonia; no se quiere la sobrecarga de un Scrum completo (estimación
por velocity, ceremonias formales), pero sí un marco time-boxed que dé foco y un
punto de corte regular. Hasta ahora `ECO Sprint 1` existía vacío y sin objetivo.

## Decisión

Se adopta una cadencia de **sprints time-boxed ligeros**:

1. **Duración:** sprints de **2 semanas**, time-boxed (fecha de cierre fija; no se
   alarga el sprint para "terminar" trabajo pendiente).
2. **Un único Sprint Goal por sprint.** Cada sprint persigue un objetivo claro y
   acotado.
3. **Nomenclatura:** `ECO Sprint N — <goal>` (p. ej. *"ECO Sprint 1 — Cutover &
   limpieza"*).
4. **Ligero:** **sin velocity** y **sin ceremonias formales** (sin planning/review/
   retro como ritos obligatorios). El foco es el Sprint Goal, no la métrica.
5. **Flujo backlog ⇄ sprint:** el backlog es la fuente de verdad. En *planning* se
   mete un **set** de tickets al sprint alineados con el goal. Lo que quede
   **inacabado al cierre vuelve al backlog** (no se arrastra automáticamente);
   se replantea en el siguiente planning.

## Consecuencias

- **Positivas:** punto de corte regular cada 2 semanas; foco gracias al goal único;
  baja sobrecarga de proceso; el backlog refleja siempre el trabajo real pendiente.
- **A vigilar:** sin velocity no hay forecast cuantitativo de capacidad — la
  planificación se apoya en el criterio del operador. El time-box estricto puede
  dejar trabajo a medias que vuelve al backlog; es esperado y aceptado.

## Alternativas consideradas

- **Scrum completo (con velocity y ceremonias):** descartado por sobrecarga para un
  equipo pequeño.
- **Kanban (flujo continuo, sin sprints):** **no** ahora, pero se reserva como
  **fallback futuro** si la cadencia por sprints estorba al flujo. Esa transición,
  si ocurre, se registrará en **otro ADR** que supersede a este.

## Notas

Decisión registrada por el lifecycle de Emkeel (ticket ECO-5, rama
`docs/ECO-5-adr-sprint-cadence`, PR enlazado). No sustituye a ninguna regla de
CI/branch-protection; es un acuerdo de proceso.
