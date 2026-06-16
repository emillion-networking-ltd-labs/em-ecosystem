# ADR-003 — Autorización de tenant-role a nivel de servicio (no NestJS guards) + 404-not-403

- **Estado:** Aceptada
- **Fecha:** 2026-06-16
- **Ticket:** [ECO-16](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-16)
- **Strategy:** auth
- **Decisor:** Decisión YA implementada en la era framework (SCRUM-491/488/495); extraída a ADR gobernado por el operador (ECO-16).
- **Contexto de gobierno:** repo gobernado por Emkeel (ver `AGENTS.md`).

## Contexto

La introducción de multi-tenancy (programa AUTH v2, Fases 0–2) exigió decidir **dónde y cómo** se aplican los checks de rol-de-tenant en los endpoints tenant-scoped (`TenantsController`, `OrganizationsController`). NestJS expone guards (`RolesGuard`/`PermissionsGuard`), pero **no pueden leer limpiamente el path param `:tenantId` vía `ExecutionContext`**.

Esta decisión vivía **solo como nota** dentro de `docs/integration-state.md` —un snapshot de estado heredado del framework viejo, sin mantener desde el cutover—. Se **extrae aquí** a un ADR gobernado y el snapshot se **retira** (su única parte con valor de decisión queda registrada aquí; el resto era estado descriptivo stale). git conserva el historial.

> **Origen fiel (cita textual, `docs/integration-state.md` §"TenantsController Method Guards [SCRUM-491]", nota):** *"TenantsController deliberately does NOT use `RolesGuard` or `PermissionsGuard`. Tenant-role checks are service-layer (helpers in `MembershipsService`) because NestJS guards cannot cleanly read `:tenantId` path params via `ExecutionContext`. Cross-tenant denial returns 404 (not 403) per plan §1 decision Q1. Platform-admin (`req.user.isPlatformAdmin === true`) bypasses tenant-role checks at the controller layer — Prisma extension (SCRUM-488) remains the backstop for cross-tenant data access."*

## Decisión

1. **Autorización de tenant-role en la capa de SERVICIO, no por NestJS guards.** Los controllers tenant-scoped **NO** usan `RolesGuard`/`PermissionsGuard`; los checks van en servicio vía helpers de `MembershipsService` (`requireTenantRole(:tenantId, userId, [roles], isPlatformAdmin)`, `requireMembership(:tenantId, userId, isPlatformAdmin)`). **Razón:** los guards de NestJS no leen limpiamente `:tenantId` del path vía `ExecutionContext`.
2. **Denegación cross-tenant devuelve 404, no 403** (per plan §1 decision Q1) — oculta la existencia del tenant (anti-enumeración).
3. **Platform-admin bypass en el controller:** `req.user.isPlatformAdmin === true` bypassa los checks de tenant-role a nivel de controller.
4. **La extensión Prisma (SCRUM-488) es el backstop:** el filtro tenant-aware de Prisma sigue siendo la última línea de defensa para el acceso a datos cross-tenant (defensa en profundidad).
5. **(Secundaria) `TenantContextInterceptor` = "validator-not-binder":** cuando el contexto ya viene atado por `SubdomainTenantResolverMiddleware` (request enrutado por subdominio), el interceptor **valida** membership (`requireMembership`) **SIN re-atar** contexto — un `TenantContext.run` anidado pisaría el scope de `AsyncLocalStorage` fijado por el middleware. Mantiene la misma disciplina 404-not-403.

## Consecuencias

- Authz uniforme y testeable en servicio (no acoplada a la mecánica de guards de NestJS); el problema `ExecutionContext` vs `:tenantId` desaparece.
- **404-not-403** es la disciplina consistente para denegación cross-tenant en toda la superficie tenant-scoped.
- **Defensa en profundidad:** controller (tenant-role) + servicio (membership) + **extensión Prisma** (filtro de datos, SCRUM-488).
- Platform-admin opera cross-tenant por diseño en el controller; la extensión Prisma sigue siendo el backstop a nivel de datos.
- El interceptor **no** debe re-atar contexto cuando el middleware de subdominio ya lo fijó (evita shadowing de `AsyncLocalStorage`).
- `docs/integration-state.md` se **retira** en este ticket (decisión preservada aquí; resto = estado stale).

## Alternativas consideradas

- **NestJS `RolesGuard`/`PermissionsGuard` para tenant-role:** descartada — no leen `:tenantId` del path vía `ExecutionContext` de forma limpia; forzarían un parsing frágil del contexto.
- **403 en denegación cross-tenant:** descartada — revela la existencia del tenant (enumeración); 404 la oculta.
- **Interceptor re-atando contexto siempre (MODE único):** descartada — pisaría el binding por subdominio del middleware (`AsyncLocalStorage` scope nesting), de ahí el patrón "validator-not-binder".

## Notas

- **Origen:** `docs/integration-state.md` (§"TenantsController Method Guards [SCRUM-491]", nota; §"Global Interceptors (APP_INTERCEPTOR)" — `TenantContextInterceptor`). Tickets de implementación: **SCRUM-491** (TenantsController HTTP surface), **SCRUM-488** (Prisma extension + `TenantContext`), **SCRUM-495** (Organizations + subdomain middleware). Plan **§1 decision Q1** (404-not-403).
- Esta ADR **documenta una decisión YA implementada y en `main`**; **NO cambia código** → §15 AUTH change-control no aplica.
- `Strategy: auth`: el aislamiento multi-tenant es base del programa AUTH v2 (ver `emkeel-governance/strategy/auth.md`, ADR-002).
