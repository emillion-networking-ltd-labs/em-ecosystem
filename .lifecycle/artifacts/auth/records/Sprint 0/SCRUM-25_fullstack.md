# Implementation Record: SCRUM-25 Audit Logging System

## Summary

Implemented full-stack audit logging: 15 auditable action types, fire-and-forget pattern ensuring audit failures never block primary operations, RequestContext propagation (IP + User-Agent) through controllers to services, paginated/filterable admin API, SUPERADMIN bypass tracking, and frontend audit log viewer.

- **Scope**: fullstack
- **Branch**: `feature/SCRUM-23-oauth-security-hardening`
- **Implementation date**: 2026-02-26

## Plan Reference

- **Plan**: `ai-specs/changes/plans/SCRUM-25_fullstack.md`
- **Plan followed**: Partially — 10 deviations, mostly simplifications, pattern improvements, or bug corrections (see Deviations section)

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `d256d4d` | feat(SCRUM-25): audit logging system — full-stack implementation | 29 files (see below) |

**Files created (11):**
- `nexacore-api/prisma/migrations/20260226180647_add_audit_log/migration.sql` — Migration for AuditAction enum + AuditLog table with 4 indexes
- `nexacore-api/src/audit/audit.module.ts` — NestJS module exporting AuditService
- `nexacore-api/src/audit/audit.service.ts` — Core service: `log()` (fire-and-forget), `findAll()` (paginated+filters), `findById()`
- `nexacore-api/src/audit/audit.controller.ts` — `GET /audit-logs` + `GET /audit-logs/:id` (ADMIN-protected)
- `nexacore-api/src/audit/dto/list-audit-logs-query.dto.ts` — Validated query DTO with pagination, filters, sort
- `nexacore-api/src/audit/enums/audit-action.enum.ts` — TypeScript enum mirroring Prisma AuditAction
- `nexacore-api/src/audit/interfaces/audit-log-entry.interface.ts` — `AuditLogEntry` input interface + `RequestContext` type
- `nexacore-api/src/audit/tests/audit.service.spec.ts` — 14 unit tests for AuditService
- `nexacore-api/src/audit/tests/audit.controller.spec.ts` — 4 unit tests for AuditLogController
- `nexacore-dashboard/src/components/admin/AuditLogFilters.tsx` — Filter bar (action dropdown, userId search, date range)
- `nexacore-dashboard/src/components/admin/AuditLogsTable.tsx` — Table with color-coded action badges, user/target labels, metadata summary
- `nexacore-dashboard/src/app/admin/audit-logs/page.tsx` — Admin audit log viewer page with filters + pagination

**Files modified (18):**
- `nexacore-api/prisma/schema.prisma` — Added `AuditAction` enum (15 values), `AuditLog` model with indexes, two relation fields on `User`
- `nexacore-api/src/app.module.ts` — Added `AuditModule` to imports (preserved ThrottlerModule from SCRUM-24)
- `nexacore-api/src/auth/auth.module.ts` — Added `AuditModule` to imports
- `nexacore-api/src/users/users.module.ts` — Added `AuditModule` to imports
- `nexacore-api/src/auth/auth.service.ts` — Injected AuditService, added `ctx?: RequestContext` to methods, 9 audit event points
- `nexacore-api/src/auth/auth.controller.ts` — Added `@Request()` to register/login/refresh, extracts IP+UA, passes ctx to service
- `nexacore-api/src/users/users.service.ts` — Injected AuditService, added ctx to methods, 6 audit event points
- `nexacore-api/src/users/users.controller.ts` — Expanded `@Request()` typing, passes IP+UA+actorId to service
- `nexacore-api/src/auth/guards/roles.guard.ts` — Injected AuditService, SUPERADMIN_BYPASS logging with endpoint metadata
- `nexacore-api/src/auth/tests/auth.service.spec.ts` — Added AuditService mock provider
- `nexacore-api/src/auth/tests/auth.controller.spec.ts` — Added AuditService mock, mockReq/mockCtx fixtures, updated all call assertions
- `nexacore-api/src/auth/tests/oauth-exchange.spec.ts` — Added AuditService mock provider
- `nexacore-api/src/auth/tests/roles.guard.spec.ts` — Added AuditService mock, SUPERADMIN_BYPASS test, expanded mock context
- `nexacore-api/src/users/tests/users.service.spec.ts` — Added AuditService mock, updated lockAccount test
- `nexacore-api/src/common/filters/tests/http-exception.filter.spec.ts` — Fixed pre-existing SCRUM-24 bug (429 → RATE_LIMIT_EXCEEDED)
- `nexacore-dashboard/src/lib/types.ts` — Added `AuditAction`, `AuditLogUser`, `AuditLog` types
- `nexacore-dashboard/src/components/layout/Sidebar.tsx` — Added ScrollText icon import, "Audit Logs" nav item in adminItems

## Deviations from Plan

| # | Planned | Actual | Reason |
|---|---------|--------|--------|
| 1 | Create branch `feature/SCRUM-25-audit-logging` (Step 0) | Used existing `feature/SCRUM-23-oauth-security-hardening` | Continuing on the same branch as SCRUM-23 and SCRUM-24 to keep the feature branch cohesive until the epic is complete |
| 2 | `ctx: RequestContext` required parameter on service methods (Step 14) | `ctx?: RequestContext` optional parameter | Required would break internal calls — e.g. `lockAccount()` called from auth.service doesn't have request context available. Optional preserves backward compatibility. |
| 3 | RolesGuard endpoint format: `${controller}.${handler}` (Step 16) | `${request.method} ${request.route?.path}` (e.g., `GET /users/:id`) | HTTP method + path is more useful for forensic analysis than NestJS class.method names. Admins reading audit logs don't know internal class names. |
| 4 | UsersService uses `ctx.actorId` combined in RequestContext (Step 15) | `softDelete()` has separate `actorId?: string` param; `adminUpdateUser()` gets actorId from `actingUser.id` | Cleaner separation — actorId isn't part of HTTP request context (IP/UA), it's domain logic. Keeps RequestContext focused on HTTP metadata. |
| 5 | Metadata keys `oldRole`/`newRole` for USER_ROLE_CHANGE (Step 15) | `previousRole`/`newRole` | More descriptive; `previous` is unambiguous vs `old` which could be confused with "old data" in a diff context |
| 6 | AuditLogFilters uses `search`/`onSearchChange` props for generic user search (Step 22) | Uses `userId`/`onUserIdChange` props for userId-specific filter | Backend API filters by userId, not by email search. Frontend props match the actual API contract. |
| 7 | AuditLogsTable uses hex colors for badges (`#e6fdf0`, `#fde6e6`, etc.) (Step 23) | Uses semantic design tokens (`bg-status-success/10`, `bg-status-error/10`, etc.) | Follows existing ui-design-system.md token conventions. Hardcoded hex values would break theme consistency. |
| 8 | Step 26: Update `api-spec.yml` with new endpoints | Not done | Deferred — documentation updates are tracked separately and should be done as a batch after the epic completes (same decision made for SCRUM-23 and SCRUM-24) |
| 9 | Plan Step 9 app.module.ts snapshot missing ThrottlerModule (stale) | Correctly merged AuditModule into existing code that includes ThrottlerModule + CustomThrottlerGuard from SCRUM-24 | Plan contained pre-SCRUM-24 snapshot. Same issue documented in SCRUM-24 record. |
| 10 | `Prisma.InputJsonValue` cast not mentioned in plan | Added `(entry.metadata as Prisma.InputJsonValue)` cast in audit.service.ts | Required for compilation — Prisma's strict Json field typing rejects `Record<string, unknown>`. Plan oversight. |

## Subtask Mapping (Plan vs Jira vs Code)

| Key | Plan Description | Implemented? |
|-----|-----------------|-------------|
| SCRUM-31 | Prisma schema + migration for AuditLog model | YES |
| SCRUM-32 | AuditService (log, findAll, findById) + AuditModule | YES |
| SCRUM-33 | Instrument AuthService (9 audit events) + RequestContext | YES |
| SCRUM-34 | Instrument UsersService (6 audit events) + RolesGuard SUPERADMIN_BYPASS | YES |
| SCRUM-35 | GET /audit-logs + GET /audit-logs/:id endpoints (ADMIN-protected) | YES |
| SCRUM-36 | Frontend audit log viewer + sidebar nav | YES |

## Test Results

- **Unit tests**: 137 passed / 0 failed (16 suites)
- **Backend build**: `nest build` succeeded
- **Frontend build**: `next build` compiled + type-checked OK (15 pages generated)

**Bugs found during implementation:**
1. `'auditLog' does not exist on type 'PrismaService'` — Prisma Client types not regenerated after migration. Fix: ran `npx prisma generate` before build.
2. `Type 'Record<string, unknown>' is not assignable to 'InputJsonValue'` — Prisma Json field strict typing. Fix: cast `(entry.metadata as Prisma.InputJsonValue)`.
3. `Nest can't resolve dependencies of the RolesGuard (Reflector, ?)` — RolesGuard now requires AuditService via DI. Any test module creating a controller with `@UseGuards(RolesGuard)` must provide an AuditService mock. Fix: added mock to auth.controller.spec.ts and oauth-exchange.spec.ts.
4. `http-exception.filter.spec.ts` 429 test expected `UNKNOWN_ERROR` but filter returns `RATE_LIMIT_EXCEEDED` — pre-existing SCRUM-24 test regression. Fix: corrected assertion.

## Documentation Updates

Deferred — same as SCRUM-23 and SCRUM-24. API spec, data model, and standards docs will be updated in batch after the SCRUM-22 epic completes.

## Lessons Learned

- When a guard (`RolesGuard`) gains a new DI dependency, ALL test modules that use controllers decorated with that guard must provide the new dependency. This cascading effect affected 3 test files (auth.controller, oauth-exchange, roles.guard).
- `Prisma.InputJsonValue` cast is required when writing `Record<string, unknown>` to a Prisma `Json` field. The plan's TypeScript snippets didn't account for this — always verify Prisma's strict type requirements.
- Making `ctx?: RequestContext` optional (vs required) is better for service methods that can be called both from controllers (with HTTP context) and from other services (without it). The plan's required parameter would have broken internal service-to-service calls.
- RolesGuard endpoint metadata using `${request.method} ${request.route?.path}` is more operationally useful than plan's `${controller}.${handler}` — audit consumers care about HTTP routes, not NestJS class names.
- Semantic design tokens (`bg-status-success/10`) should always be preferred over hardcoded hex colors in frontend components, even when the plan specifies hex values.
