# ADR-005 — Arquitectura Core + Satellite (comunicación REST-only, DB por satélite)

- **Estado:** Aceptada (decisión existente)
- **Fecha:** 2026-06-16
- **Ticket:** [ECO-18](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-18)
- **Decisor:** Decisión YA documentada en la era framework; extraída a ADR gobernado por el operador (ECO-18).
- **Contexto de gobierno:** repo gobernado por Emkeel (ver `AGENTS.md`).

## Contexto

La arquitectura del EM Ecosystem vivía como sección dentro de `docs/backend-standards.mdc` (snapshot
heredado del framework, retirado en este mismo ticket — git conserva el historial). Se extrae aquí a un
ADR gobernado.

> **Origen fiel (`docs/backend-standards.mdc` §"EM Ecosystem Architecture — Core + Satellite Apps"):**
> *"EM NexaCore is the Core App — a NestJS monolith providing authentication, user management, RBAC … Satellite
> Apps are independent NestJS applications … Communication between Core and Satellites is exclusively via REST
> API — no shared database, no message bus, no gRPC."*

## Decisión

1. **Topología Core + Satellite.** **EM NexaCore** (monolito NestJS) es el Core: auth, users, RBAC, projects/teams, billing, notifications, settings, y registries de módulos/apps. Las **Satellite Apps** son aplicaciones NestJS independientes que extienden el ecosistema por dominio.
2. **Comunicación EXCLUSIVAMENTE vía REST API** entre Core y satélites — **sin base de datos compartida, sin message bus, sin gRPC**.
3. **Aislamiento por satélite.** Cada satélite tiene su propio repo, `package.json`, `prisma/schema.prisma` y **su propia base de datos PostgreSQL**. **Nunca** se conecta a la Postgres del Core directamente.
4. **Referencias por UUID.** Los satélites referencian entidades del Core por **UUID (`String`)** únicamente — sin foreign keys, sin duplicar la entidad completa.
5. **Auth federada al Core.** Los satélites validan el JWT contra NexaCore (`JWT_SECRET` compartido o `GET /auth/me`) vía un `NexaCoreAuthModule`; consumen datos vía un `NexaCoreClientModule` (Bearer token).
6. **Registro.** Cada satélite se registra en el Core como `App` (`POST /projects/{projectId}/apps`); los módulos toggle-ables se trackean en el `PlatformModule` registry.

## Consecuencias

- Independencia de despliegue y de datos: un satélite puede evolucionar/escalar sin tocar el Core ni su DB.
- Integración vía REST con **mapeo de errores** Core→satélite (401→`UnauthorizedException`, 403→`ForbiddenException`, 404→`NotFoundException`, 5xx→`InternalServerErrorException` + retry/circuit-breaker a considerar).
- Recursos compartidos accedidos por REST: auth tokens (claims `sub`/`email`/`role`), permisos (`GET /permissions/roles/{role}` en formato `resource:action`), settings, notifications, identidad `SafeUser`.
- Coste: latencia de red + consistencia eventual entre Core y satélites (aceptado a cambio del aislamiento).
- `docs/backend-standards.mdc` se retira (esta arquitectura queda aquí; el resto = convención (`CONTRIBUTING.md`) o enforced por tooling).

## Alternativas consideradas

- **Base de datos compartida entre Core y satélites:** descartada — acopla esquemas y despliegues; rompe el aislamiento por dominio.
- **Message bus / eventos:** descartada (por ahora) — añade infraestructura y complejidad operativa no justificada a la escala actual; REST cubre la integración.
- **gRPC:** descartada — REST/JSON es suficiente y más simple para clientes heterogéneos (satélites, dashboard, futuros).
- **FKs cross-DB a entidades del Core:** descartada — imposible/indeseable entre bases separadas; se referencia por UUID.

## Notas

- Origen: `docs/backend-standards.mdc` §"EM Ecosystem Architecture — Core + Satellite Apps" (retirado en ECO-18; git conserva). Realidad actual del repo: `nexacore-api` (Core), `nexacore-dashboard` (consumidor), `satellites/sat-cristian-garcia` (satélite SAT01).
- Documenta una decisión existente; **NO cambia código** → §15 no aplica.
