# Implementation Record: SCRUM-30 Advanced RBAC & Permissions

## 2. Summary

Implemented Layer 8 of auth security hardening: a granular RBAC permissions system with a Permission entity, RolePermission assignments, PermissionsGuard, PermissionsCache (in-memory), default permission seeding on startup, and admin UI for viewing/modifying role permissions.

- **Scope:** fullstack
- **Branch:** feature/SCRUM-30-backend (backend); feature/SCRUM-30-frontend (dashboard)
- **Implementation date:** 2026-02-27 (audited 2026-02-27)

## 3. Plan Reference

- Plan: `ai-specs/changes/plans/SCRUM-30_fullstack.md`
- Plan followed: **Yes** — with one bug fixed during implementation (see section 7).

## 4. Commits

Git history not available. Audit conducted from code inspection (2026-02-27).

Key files implemented:

| Component | File |
|-----------|------|
| PermissionsService | `src/permissions/permissions.service.ts` |
| PermissionsCache | `src/permissions/permissions.cache.ts` |
| PermissionsController | `src/permissions/permissions.controller.ts` |
| PermissionsModule | `src/permissions/permissions.module.ts` |
| PermissionsGuard | `src/auth/guards/permissions.guard.ts` |
| @RequirePermissions | `src/common/decorators/permissions.decorator.ts` |
| Permission entity | `src/permissions/entities/permission.entity.ts` |
| Default permissions | `src/permissions/constants/default-permissions.ts` |
| SetRolePermissionsDto | `src/permissions/dto/set-role-permissions.dto.ts` |
| Schema | `prisma/schema.prisma` (Permission, RolePermission models) |
| Dashboard admin | `src/app/admin/permissions/page.tsx` |
| PermissionsMatrix | `src/components/admin/PermissionsMatrix.tsx` |

## 5. Deviations from Plan

Implementation followed the plan. One bug was found and fixed during implementation (see section 7).

## 6. Test Results

- **Overall (full suite):** 234 passed, 0 failed (Fase 1 audit)
- **SCRUM-30 specific:**
  - `permissions.service.spec.ts` — 75.8% coverage (lines 29-81 uncovered)
  - `permissions.controller.spec.ts` — 100% coverage
  - `permissions.cache.spec.ts` — 100% coverage
  - `permissions.guard.spec.ts` — 100% coverage
- **Startup verification:** 9 permissions seeded on startup (USER: 2, ADMIN: 8, SUPERADMIN: bypass)
- **Routes registered:** `GET /permissions`, `GET /permissions/roles/:role`, `PUT /permissions/roles/:role`

## 7. Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| AuditModule not imported in PermissionsModule | HIGH | Fixed | RolesGuard injects AuditService; PermissionsModule must import AuditModule. Added to imports. |
| permissions.service.ts lines 29-81 not covered | LOW | Open | Complex DB transaction logic needs additional test cases in a future ticket |

## 8. Documentation Updates

| File | Changes Made |
|------|-------------|
| `integration-state.md` | Added PermissionsModule (@Global), PermissionsGuard, updated AuthController/UsersController/AuditLogController guard chains, added permissions registry (9 perms), test mock requirements |
| `api-spec.yml` | STALE — `POST /permissions/roles/{role}` should be `PUT` (method mismatch found in Fase 2 audit) |

## 9. Lessons Learned

- PermissionsModule being @Global was the right choice — avoids importing it in every consumer module
- The PermissionsCache (in-memory Map) avoids DB queries on every request — critical for performance
- SUPERADMIN bypass in PermissionsGuard must be the FIRST check (same pattern as RolesGuard)
- The AuditModule import bug is a common pattern: guards with service dependencies must be traceable through module imports
