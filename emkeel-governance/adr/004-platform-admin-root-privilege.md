# ADR-004 — Privilegio root de plataforma (User.isPlatformAdmin) — bypass de guards

- **Estado:** Aceptada (modelo actual; enum `Role.SUPERADMIN` legacy en migración)
- **Fecha:** 2026-06-16
- **Ticket:** [ECO-18](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-18)
- **Strategy:** auth
- **Decisor:** Decisión YA implementada en código (SCRUM-489 / AUTH v2 Phase 0.3); extraída a ADR gobernado por el operador (ECO-18).
- **Contexto de gobierno:** repo gobernado por Emkeel (ver `AGENTS.md`).

## Contexto

La política original, de la era framework, era simple: *"`Role.SUPERADMIN` = root; los guards bypassan en `Role.SUPERADMIN`"*. Esa política quedó **SUPERSEDED** en el path real de guards/cross-tenant: AUTH v2 introdujo `User.isPlatformAdmin` (SCRUM-489) como el flag que efectivamente gatea el bypass de `RolesGuard`/`PermissionsGuard` y el bypass de tenant-role a nivel de controller documentado en ADR-003. Un borrador previo de esta ADR (ECO-18) se extrajo de un documento portado aspiracional y describía `Role.SUPERADMIN` como el mecanismo de bypass — eso **no era fiel al código**. Esta ADR corrige eso: registra el modelo **ACTUAL** (`isPlatformAdmin`) y el estado **transitorio** del enum legacy `Role.SUPERADMIN`.

## Decisión

**(a) Bypass de guards gateado por `isPlatformAdmin`, no por `Role.SUPERADMIN`:**

- `RolesGuard` bypassa todo el chequeo de roles tenant-scoped cuando `user?.isPlatformAdmin === true`, como **primera condición** del método (`nexacore-api/src/auth/guards/roles.guard.ts:44`). Si había `requiredRoles`, registra `AuditAction.SUPERADMIN_BYPASS` (`nexacore-api/src/auth/guards/roles.guard.ts:48`) — el nombre del enum de auditoría se conserva por continuidad de logs/histórico, aunque el gate real ya no sea el rol `SUPERADMIN` sino el flag `isPlatformAdmin` (comentario explícito en el propio código, líneas 38-43).
- `PermissionsGuard` aplica el mismo bypass, también como condición temprana: `user.isPlatformAdmin === true` (`nexacore-api/src/auth/guards/permissions.guard.ts:46`). A diferencia de `RolesGuard`, no emite una fila de auditoría separada (comentario en líneas 41-45: la decisión de bypass es la misma y ya quedó logueada cuando se requirieron roles).

**(b) Permisos implícitos a nivel de SERVICIO — TRANSITORIO:**

`PermissionsService` aún devuelve/trata `Role.SUPERADMIN` como wildcard de permisos en tres puntos (`nexacore-api/src/permissions/permissions.service.ts`):
- `getPermissionKeysForRole` (línea 89): si `role === Role.SUPERADMIN`, devuelve `['*']` sin consultar `RolePermission`.
- `getPermissionsForRole` (línea 107): si `role === Role.SUPERADMIN`, lanza `BadRequestException` (no se puede listar/editar permisos granulares para ese rol — sigue siendo wildcard implícito).
- `setPermissionsForRole` (línea 130): mismo guard — no se permite asignar permisos explícitos a `Role.SUPERADMIN`.

Este comportamiento es **transitorio**: vive a nivel de servicio de permisos, no de guard, y coexiste con (a) sin estar unificado bajo `isPlatformAdmin`.

**(c) `Role.SUPERADMIN` es LEGACY/transitorio — usos reales confirmados:**

- `permissions.service.ts:89,107,130` — wildcard de permisos (ver (b)).
- `nexacore-api/src/auth/login.service.ts:145` — gate de flujo de onboarding MFA: si `user.role === Role.ADMIN || user.role === Role.SUPERADMIN` y `!user.mfaEnabled`, fuerza `handleMfaSetupRequired`.
- `nexacore-api/src/security/suspicious-login.service.ts:312` — `getAdminEmails()` selecciona usuarios con `role: { in: [Role.ADMIN, Role.SUPERADMIN] }` para notificación de login sospechoso.
- `nexacore-api/src/users/users.service.ts:804` — guard que prohíbe asignar `Role.SUPERADMIN` vía operación normal de asignación de rol (comentario en línea 800: "Role-enum-value gate (KEEPS Role.SUPERADMIN check)").

El flag `isPlatformAdmin` (`nexacore-api/prisma/schema.prisma:103`, comentario líneas 99-102) es la columna real: *"Cross-tenant capability flag. Replaces the conflated Role.SUPERADMIN concept. Backfill: pre-existing SUPERADMIN users got isPlatformAdmin=true in the migration that introduced this column. User.role kept transitional until Phase 1 (JWT v2) — SCRUM-489 / AUTH v2 Phase 0.3."*

Es decir: `Role.SUPERADMIN` se retira con **JWT v2 (Phase 1)**; hasta entonces sigue vivo en permisos, MFA-onboarding y notificación de seguridad, todos ellos puntos no migrados a `isPlatformAdmin`.

## Consecuencias

- El bypass de **autorización por guard** (lo que importa para acceso cross-tenant y RBAC de endpoints) ya está unificado bajo `isPlatformAdmin` — un solo flag, comprobado primero en ambos guards.
- El bypass de **permisos a nivel de servicio** (catálogo de permisos) sigue acoplado al enum `Role.SUPERADMIN`, no a `isPlatformAdmin`. Mientras esto no se migre, un usuario con `isPlatformAdmin=true` pero `role !== SUPERADMIN` pasaría los guards pero no obtendría el wildcard `['*']` de `PermissionsService` — son dos mecanismos distintos, no unificados todavía. Esto es deuda conocida, no un bug a ocultar.
- `AuditAction.SUPERADMIN_BYPASS` seguirá llamándose así (compatibilidad de logs/histórico) aunque el gate real sea `isPlatformAdmin`; no renombrar sin plan de migración de logs.
- Login (MFA-onboarding) y notificación de seguridad (`suspicious-login`) seguirán tratando `Role.SUPERADMIN` como "admin-like" hasta que se decida explícitamente su migración a `isPlatformAdmin` en JWT v2.

## Alternativas consideradas

- **Mantener el bypass gateado por `Role.SUPERADMIN`** (política original framework-era): descartada — ya no es lo que hace el código; documentarlo así falsificaría el ADR.
- **Migrar ya `permissions.service.ts` / `login.service.ts` / `suspicious-login.service.ts` a `isPlatformAdmin` dentro de este ticket**: descartada — es un cambio de comportamiento en dominio AUTH (requiere ticket + owner approval per `workflow-standards.mdc §15`), fuera de alcance de ECO-18 (que es de documentación/gobernanza). Queda como trabajo de JWT v2 (Phase 1).
- **Eliminar ya el enum `Role.SUPERADMIN`**: descartada por la misma razón — todavía hay producción dependiente de él (3 servicios), no solo tests.

## Notas

- **Origen:** ADR-003 (`emkeel-governance/adr/003-tenant-authz-service-layer.md`) documenta el bypass `isPlatformAdmin` a nivel de controller para tenant-role; esta ADR documenta el mismo flag a nivel de `RolesGuard`/`PermissionsGuard` (HTTP-level) y el estado transitorio del enum legacy. Ver también `emkeel-governance/strategy/auth.md` y ADR-002 (activación de la estrategia AUTH v2).
- El documento `docs/backend-standards.mdc`, de donde se portó por error una versión previa y no fiel de esta ADR, se retiró en ECO-18; git conserva su historial si se necesita reconstruir el origen del error.
- Esta ADR **documenta una decisión ya implementada y en `main`**; no cambia código → §15 AUTH change-control no aplica a este commit.
