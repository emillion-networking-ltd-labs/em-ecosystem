# ADR-004 — Política del rol root (SUPERADMIN) — bypass de guards + permisos implícitos

- **Estado:** Aceptada (decisión existente; en migración — ver §Consecuencias)
- **Fecha:** 2026-06-16
- **Ticket:** [ECO-18](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-18)
- **Strategy:** auth
- **Decisor:** Decisión YA documentada en la era framework; extraída a ADR gobernado por el operador (ECO-18).
- **Contexto de gobierno:** repo gobernado por Emkeel (ver `AGENTS.md`).

## Contexto

El modelo de privilegio raíz del EM Ecosystem vivía como sección dentro de `docs/backend-standards.mdc`
(snapshot heredado del framework, retirado en este mismo ticket — git conserva el historial). Se extrae
aquí a un ADR gobernado.

> **Origen fiel (`docs/backend-standards.mdc` §"SUPERADMIN Role Policy"):** *"The `SUPERADMIN` role is the
> root role of the EM Ecosystem … the highest level of authority across the entire platform — both within
> EM NexaCore and across all satellite applications."*

## Decisión

1. **`SUPERADMIN` es el rol root** con acceso total a todos los módulos del Core y a todas las Satellite Apps registradas, sin restricciones.
2. **Bypass automático de guards:** `RolesGuard` y `PermissionsGuard` devuelven `true` de inmediato si `user.role === Role.SUPERADMIN`. El check de SUPERADMIN debe ser **la primera condición** de `canActivate()`.
3. **Permisos implícitos:** SUPERADMIN **siempre tiene todos los permisos**, aunque no estén asignados explícitamente en la tabla `permissions` (existentes y futuros). Patrón a nivel de servicio: `if (user.role === Role.SUPERADMIN) return true;` antes de comprobar `user.permissions.includes(...)`.
4. **Capacidades de gestión:** users, roles, permissions, internal modules, satellite apps, global settings, global billing — sin asignación de permisos explícita.
5. **Reglas de generación (agentes/código):** todo `RolesGuard`/`PermissionsGuard` generado incluye el bypass como primera condición; toda suite de tests de guard/endpoint protegido incluye los casos *"should allow SUPERADMIN to access regardless of required roles/permissions"*; la documentación de endpoints protegidos anota *"SUPERADMIN: full access (bypasses all guards)"*; los satélites propagan el rol SUPERADMIN desde los claims del JWT.

## Consecuencias

- Privilegio raíz uniforme y predecible en Core y satélites; el bypass es un invariante de cada guard generado, con cobertura de test obligatoria.
- **⚠️ Evolución en curso (estado actual, fiel):** el programa **AUTH v2** introdujo `User.isPlatformAdmin` como **flag de capacidad cross-tenant que reemplaza la semántica conflada de `Role.SUPERADMIN`** (SCRUM-489; ver `emkeel-governance/adr/003-tenant-authz-service-layer.md` y `emkeel-governance/strategy/auth.md`). El `Role` enum se mantiene **transitorio** hasta que JWT v2 lo retire. En la superficie tenant-scoped, el bypass cross-tenant ya se evalúa vía `req.user.isPlatformAdmin === true` (ADR-003), no vía `Role.SUPERADMIN`.
- ⇒ Esta ADR **registra la política de rol root tal como se decidió**, y deja **trazada** su migración a `isPlatformAdmin`. Cualquier reconciliación final (retiro del `Role` enum) será su propio ticket bajo §15 AUTH change-control.
- `docs/backend-standards.mdc` se retira (esta política queda aquí; el resto era convención destilada a `CONTRIBUTING.md` o ya enforced por tooling).

## Alternativas consideradas

- **Asignación explícita de permisos también para el root:** descartada — un rol root debe tener todos los permisos de forma implícita (incl. permisos futuros) sin mantenimiento manual.
- **Sin bypass de guards (root como un rol más):** descartada — necesidad operativa de un superusuario de plataforma; el bypass-first evita evaluar condiciones redundantes.
- **Mantener `Role.SUPERADMIN` como única vía cross-tenant:** superada por AUTH v2 (`isPlatformAdmin`) — la capacidad cross-tenant se desacopla del enum `Role` (ver ADR-003).

## Notas

- Origen: `docs/backend-standards.mdc` §"SUPERADMIN Role Policy" (retirado en ECO-18; git conserva). Relación: ADR-003 (tenant-authz, `isPlatformAdmin` bypass), `strategy/auth.md` + ADR-002 (programa AUTH v2).
- Documenta una decisión existente; **NO cambia código** → §15 no aplica aquí.
