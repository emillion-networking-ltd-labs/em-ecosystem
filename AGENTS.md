# AGENTS.md — el contrato de este repositorio

Aquí solo va lo de este repositorio. Lo que el contrato del marco ordena no se repite.

## Qué bloquea una fusión
- Exigidos: `Security Gate (All Checks)`, `Tests & Build Gate` y `code-health` (el trinquete propio).
- Ningún control comprueba ticket-primero, presencia de spec ni formato de commit.

## El ciclo
1. **IMPORTANTE: el Issue existe antes que la rama, y la rama antes que el código.** Nada lo comprueba.
2. Una rama por trabajo: `feat/<N>-<slug>` con N = número del Issue; si no, `fix/`, `chore/`, `docs/`.
3. El slug de la rama es el mismo que el de `specs/<NNN>-<slug>/`.
4. Cada commit cita su Issue entre paréntesis: `fix: resuelve el reintento inestable (#286)`.
5. El trabajo que llega como prosa se convierte en spec antes de construir: `/speckit-specify`.
6. Toda suposición va a `Assumptions`; la ambigüedad real se pregunta con `/speckit-clarify`.
7. Nada pasa a plan, tareas ni código hasta que el operador aprueba el spec.
8. En `feat/`, el spec es `specs/<NNN>-<slug>/spec.md` con `Success Criteria` no vacío.
9. Todo arreglo de bug empieza por una prueba que falla.
10. La PR dice `Closes #<N>` y la fusión cierra el Issue; nunca lo cierres a mano antes.
11. No fusiones sin el visto explícito del operador.

## Estrategia
- Antes de trabajar una feature, lee la estrategia que sirve: `emkeel-governance/strategy/<area>.md`.
- El spec declara `Strategy: <area>` o `Strategy: none`.
- Si declara un área, lleva `## Alignment` con las decisiones que implementa o toca.
- Una PR que crea, edita o borra `strategy/*.md` lo declara como su propósito y espera aprobación.
- Nunca cambies la estrategia dentro de una feature para que el código encaje.

## Las cicatrices
- Cambio en credenciales, aislamiento, distribución, contrato del agente o un control de CI: añade
  prueba de INTEGRACIÓN de extremo a extremo. Un cambio de credenciales rompió en silencio la
  creación de tickets.
- La infraestructura crítica no depende de herramientas opcionales del entorno como `direnv`: lee en proceso lo que necesites.
- Nunca ocultes fallos con `2>/dev/null`, y verifica el destino antes de escribir: un `cd` silenciado
  arrasó un `.env` real.

## Separación
- `emkeel-governance/` guarda specs, ADR, registros y estrategias: es `export-ignore`, no se distribuye, y es el historial de decisiones del proyecto.

## docs/
- `docs/` es documentación de producto —arquitectura y cómo funciona—; la gobernanza nunca vive ahí.
- Los specs que reflejan el código (OpenAPI, modelo de datos) se regeneran de la fuente.
- `docs/archive/` guarda lo inactivo, cada documento con su cabecera de histórico.
- Un documento muerto se borra: el historial de git es el archivo.
