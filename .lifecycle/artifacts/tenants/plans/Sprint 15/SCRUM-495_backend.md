---
schema: ai-specs/schemas/plan.schema.yml
ticket: SCRUM-495
sprint: Sprint 15
scope: backend
module: tenants
date: 2026-05-20
status: draft
last_completed_ticket: SCRUM-494
framework_version: 0.15.0
---

# Backend Implementation Plan: SCRUM-495 AUTH v2 Phase 2.1 — `Organization` model + `SubdomainTenantResolverMiddleware` (D-007 + D-008 batched)

## 1. Codebase State Snapshot

- **Date**: 2026-05-20
- **Last completed ticket**: SCRUM-494 (AUTH v2 Phase 1.3 — `JwtV2Strategy` + first consumer endpoint, merged `e33fe6b`). Main coverage at **91.29% statements + lines** with +1.29 pp margin above 90% threshold. **Phase 1 of AUTH v2 program is COMPLETE.**
- **Integration state verified**: Yes (read header confirms `Last update: SCRUM-494`).
- **Files verified against live code** (all read from `nexacore-api/`):
  - `prisma/schema.prisma:317-330` — `Tenant` model: 5 scalar fields (id, slug @unique, name, status, createdAt/updatedAt/deletedAt) + 3 relations (settings, memberships, invitations) + `@@index([status])` + `@@map("tenants")`. **Does NOT have `subdomain` field today.**
  - `prisma/schema.prisma:177-197` — `AuditLog` model: 7 scalar fields + 2 user relations + 6 indexes. **Does NOT have `organizationId` field today.**
  - `prisma/schema.prisma:354-368` — `TenantMembership` model with `@@unique([tenantId, userId])` at line 368 (note: order is `tenantId, userId` → Prisma composite key is `tenantId_userId`, NOT `userId_tenantId`).
  - `src/tenants/tenants.module.ts` (NEW @Global module, line 22) — current: `imports: [AuditModule]`, `controllers: [TenantsController]`, `providers: [TenantsService, InvitationsService, MembershipsService]`, `exports: [TenantsService, MembershipsService]`. **No middleware configuration yet** (no `configure(consumer)` method).
  - `src/tenants/tenants.service.ts:27` — constructor `TenantsService(prisma: PrismaService)` (1 dep). Methods: `findById(id)` line 34, `findBySlug(slug)` line 43, `create(dto)` line 57 (uses `prisma.$transaction` for Tenant + TenantSettings atomic create), `update(id, dto)` line 89, `findFirstActiveMembership(userId)` line 123.
  - `src/tenants/memberships.service.ts:46-66` — `requireMembership(tenantId, userId, isPlatformAdmin)` pattern with **404 (NotFoundException) NOT 403** on cross-tenant denial (deliberate: hides tenant existence). Wrapped in `TenantContext.runWithBypass('membership-check', ...)`. Platform admins return `null` short-circuit.
  - `src/common/interceptors/tenant-context.interceptor.ts:43-83` — current `TenantContextInterceptor` (Phase 0.2 / SCRUM-488). **CRITICAL FINDING** (see §3 Regression Impact): currently does `TenantContext.run(membership.tenantId, ...)` based on user's first-active membership. With Phase 2.1's subdomain middleware binding context FIRST, this interceptor would RE-bind via nested `run(...)`, overriding the middleware's subdomain-derived tenantId. Must be modified (validator instead of binder) — see §3.
  - `src/app.module.ts:75` — `TenantContextInterceptor` registered as `APP_INTERCEPTOR` globally. Position 2 (after `OnlineMlScorerInterceptor`).
  - `src/common/context/tenant-context.ts:36-68` — `TenantContext` public API: `run(tenantId, fn)`, `runWithBypass(reason, fn)`, `getActiveTenantId()`, `isBypassed()`, `getBypassReason()`, `getOrThrow()`. AsyncLocalStorage-backed.
  - `src/common/constants/error-messages.ts:77-85` — `ErrorMessages.tenants.NOT_FOUND = 'Tenant not found'` + `ErrorMessages.tenantContext.MISSING / CROSS_TENANT / BYPASS_WITHOUT_REASON` exist. **Need to add `ErrorMessages.organizations.*` namespace** (NOT_FOUND, etc.).
  - `src/audit/enums/audit-action.enum.ts:1` — current enum has 51 values (last 5 are SESSION_V2_* from SCRUM-493). **Will append 4 new values** (ORGANIZATION_CREATED, ORGANIZATION_MEMBER_ADDED, ORGANIZATION_MEMBER_REMOVED, SUBDOMAIN_RESOLUTION_FAILED).
  - `src/tenants/invitations.service.ts` (referenced; not re-read in this plan — pattern for audit emission + tenant-context wrapping already understood).
  - `src/common/interceptors/audit-bypass.helper.ts` — `auditAndRunBypass(audit, reason, ctx, fn)` exists; reusable for the platform-admin canonical subdomain bypass.

- **Constructor signatures verified**:
  - `TenantsService(prisma: PrismaService)` — Phase 0.1, unchanged.
  - `MembershipsService(prisma: PrismaService)` — Phase 0.4, unchanged.
  - `TenantContextInterceptor(tenants: TenantsService)` — Phase 0.2 / SCRUM-488. **WILL CHANGE in Phase 2.1**: needs `MembershipsService` to validate user-tenant binding (replacing the user-first-active-membership lookup). New signature: `TenantContextInterceptor(tenants: TenantsService, memberships: MembershipsService)`.
  - **NEW** `OrganizationsService(prisma: PrismaService, auditService: AuditService)` — 2 deps.
  - **NEW** `SubdomainTenantResolverMiddleware(tenants: TenantsService, configService: ConfigService)` — 2 deps. LRU cache held as instance state.

- **Methods verified to exist**:
  - `tenantsService.findBySlug(slug)` at line 43 — returns `Tenant | null`. **Will add `findBySubdomain(subdomain)` mirroring it** (line target ~50, after `findBySlug`).
  - `tenantsService.create(dto)` line 57 — Will be modified to also `INSERT` the default `Organization` row in the same `$transaction` (per Open Decision #4 below).
  - `membershipsService.requireMembership(tenantId, userId, isPlatformAdmin)` line 46 — Reusable in the modified `TenantContextInterceptor`.

- **Guard dependency chain verified**: N/A — Phase 2.1 introduces no new guards. The middleware runs before guards and binds context; existing guards (JwtAuthGuard, etc.) are unaffected.

- **Discrepancies with integration-state.md**: **None** (header confirms SCRUM-494 last; live code matches).

### Plan-time decisions (operator-locked from enriched ticket open decisions)

| # | Decision | Locked value | Rationale |
|---|---|---|---|
| 1 | Module placement of `OrganizationsService` | **`src/tenants/`** | Domain is "tenant + its orgs"; splitting into `src/organizations/` is premature. Matches ORCH-DRAFT-001 §Cross-module impact map. |
| 2 | HTTP controller scope | **Read paths + addMember now**; full controller surface deferred to Phase 2.3 | Middleware needs no HTTP surface; read paths give dashboard a way to surface orgs; `addMember` unlocks tenant admins. `removeMember` + full CRUD lands when dashboard wiring (Phase 2.3) demands it. |
| 3 | Reserved subdomain blocklist | **Hardcoded set**: `admin`, `api`, `app`, `auth`, `dashboard`, `mail`, `support`, `status`, `www`, `static`, `cdn`, `health`, `metrics`, `platform`, `internal` | Conservative initial list. `tenants.slug` collision check at /develop time (grep against dev DB). Manual rename step added to migration if any existing slug collides. |
| 4 | Auto-create default-org on `TenantsService.create()` | **YES** | Mirrors bootstrap migration invariant. `create()` modified to use `$transaction` for Tenant + TenantSettings + default-Organization in one atomic operation. |
| 5 | Cache invalidation events | **Only on `Tenant.subdomain` mutation** (not any `Tenant.*` mutation) | `subdomain` is the cache key; other Tenant fields don't affect lookup. Cheaper invalidation. Invalidation hook on `TenantsService.update` checks if `dto.subdomain !== current.subdomain`. |
| 6 (NEW at /plan) | **Middleware vs Interceptor interaction** | **Modify `TenantContextInterceptor` to validate, not re-bind**: when middleware has bound subdomain → tenantId, interceptor checks user has active membership in that tenant; if no → ForbiddenException; if yes → leaves middleware's context binding alone | The current interceptor `TenantContext.run(membership.tenantId, ...)` would override middleware's subdomain binding via AsyncLocalStorage scope nesting. Validator-instead-of-binder is the cleanest semantic — subdomain is the canonical user-facing tenant identity. Adds `MembershipsService` as 2nd constructor dep on the interceptor. Documented at /plan as the most consequential behavior change in this ticket. |
| 7 (NEW at /plan) | Unauthenticated request handling under middleware | **Middleware-resolved tenant takes precedence**: if subdomain resolves to a valid tenant, bind context with `TenantContext.run(tenantId, ...)` — even for unauthenticated requests (login, register, OAuth callback). Only fall back to `runWithBypass('unauthenticated')` for the platform-admin canonical subdomain + skip-paths. | Phase 2.2 (AuthIntent) needs unauthenticated requests on `acme.platform.com/auth/v2/intents` to land scoped to `acme`. The current `unauthenticated` bypass was a Phase 0.2 stopgap; subdomain makes proper tenant-scoping possible. |

### CI Gate Anticipation (per SCRUM-485 mandate — em-ecosystem Security Pipeline)

| CI gate | Expected behavior |
|---|---|
| Layer 1: Secrets Detection | PASS / unchanged |
| Layer 2: Dependency Audit (nexacore-api) | PASS / unchanged. **Zero new deps** — Node stdlib + existing Prisma + existing `@nestjs/common` (NestMiddleware). |
| Layer 2: Dependency Audit (nexacore-dashboard) | PASS / unchanged (not touched). |
| Layer 3: SAST (Backend) | PASS — no `process.env` direct reads (config via `ConfigService`); ErrorMessages constants only; no `any` types; cookies untouched. |
| Layer 3: SAST (Frontend) | PASS / unchanged. |
| **Layer 4: Tests (Backend)** | **PASS** — coverage delta favorable: ~27 new tests on heavily-testable surface (service + middleware + interceptor changes). Existing `tenant-context.interceptor.spec.ts` MUST be updated to reflect the validator-vs-binder behavior change — flagged in §3. Main at 91.29% baseline. |
| Layer 4: Tests (Frontend) | PASS / unchanged. |
| Layer 5: Build (Backend) | PASS (gated by L4); DI bootstrap of `AppModule` must remain clean (new middleware + interceptor 2-dep change). |
| Layer 5: Build (Frontend) | PASS / unchanged. |
| Security Gate (All Checks) | PASS (cascade). |

**Migration handling**: 1 new Prisma migration `<timestamp>_phase_2_1_organization_and_subdomain` (additive: NEW tables, NEW enum, ADD COLUMN with backfill, default-org bootstrap INSERT). Hand-written SQL per the SCRUM-487 / SCRUM-491 / SCRUM-493 convention (dev DB lacks shadow CREATE privilege). Run `npx prisma migrate deploy` against dev DB + `npx prisma generate` (the second step is critical per SCRUM-493 lesson).

**ai-specs CI**: not exercised by this ticket — em-ecosystem PR does not touch ai-specs. Plan + verify + record handled by lifecycle commands.

## 2. Regression Impact Analysis

- **Blast radius**:
  - **Direct dependents — files MODIFIED in this ticket**:
    - `prisma/schema.prisma` (MOD: +2 models + 1 enum + 1 column on Tenant + 1 column on AuditLog + 1 relation on User)
    - `prisma/migrations/<timestamp>_phase_2_1_organization_and_subdomain/migration.sql` (NEW)
    - `src/tenants/tenants.service.ts` (MOD: +`findBySubdomain` method; modified `create` to include default-org)
    - `src/tenants/tenants.module.ts` (MOD: +1 provider `OrganizationsService`, +1 controller `OrganizationsController` if Open Decision #2 ships controller, +`configure()` method for middleware registration, +`MiddlewareConsumer` import)
    - `src/common/interceptors/tenant-context.interceptor.ts` (**MOD — BEHAVIOR CHANGE**: validator instead of binder when context already bound; constructor gains `MembershipsService` dep)
    - `src/common/interceptors/tests/tenant-context.interceptor.spec.ts` (MOD: tests rewritten for new behavior; constructor mock gains MembershipsService provider)
    - `src/audit/enums/audit-action.enum.ts` (MOD: +4 new enum values)
    - `src/common/constants/error-messages.ts` (MOD: +1 namespace `organizations` with `NOT_FOUND`, etc.)
  - **Direct dependents — files NEW**:
    - `src/tenants/organizations.service.ts`
    - `src/tenants/middleware/subdomain-tenant-resolver.middleware.ts`
    - `src/tenants/dto/create-organization.dto.ts` + `add-member.dto.ts` + `organization-response.dto.ts` (if Open Decision #2 ships HTTP)
    - `src/tenants/organizations.controller.ts` (if Open Decision #2 ships HTTP)
    - `src/tenants/tests/organizations.service.spec.ts`
    - `src/tenants/tests/subdomain-tenant-resolver.middleware.spec.ts`
    - `src/tenants/tests/organizations.controller.spec.ts` (if Open Decision #2 ships HTTP)
  - **Transitive dependents of `TenantContextInterceptor` behavior change**: every authenticated request post-deploy. **Behavioral change**: previously, user without active memberships → `ForbiddenException` from interceptor. After Phase 2.1: same behavior on subdomain-bound paths IF user has no membership in that tenant. For platform-admin canonical subdomain + skip-paths, behavior unchanged. **e2e tests at `test/auth-e2e/setup.ts:699`** bootstrap full AppModule and will exercise this new interceptor behavior — must verify e2e specs still pass (they don't currently use subdomain-routed requests; default Host = `localhost` → middleware skip-path → falls through to current interceptor behavior). Low risk.
  - **Test dependents** (existing specs that may need updates):
    - `src/common/interceptors/tests/tenant-context.interceptor.spec.ts` (**MOD MANDATORY** — constructor gains `MembershipsService`; behavior change to validator-when-bound).
    - `src/tenants/tests/tenants.controller.spec.ts` — should pass unchanged (no controller modification).
    - `src/tenants/tests/tenants.integration.spec.ts` — should pass unchanged (uses mocked Prisma, no real middleware exercised).
    - `test/auth-e2e/*.e2e-spec.ts` — should pass unchanged (default `Host: localhost` triggers middleware skip-path).

- **Breaking changes identified**:
  - **`TenantContextInterceptor` constructor signature change**: 1 dep → 2 deps. Since registered as `APP_INTERCEPTOR` via `useClass` (NestJS DI auto-resolves), no consumer code change needed beyond making `MembershipsService` injectable into it. **MembershipsService is already a provider in TenantsModule** (Phase 0.4 / SCRUM-491) and TenantsModule is `@Global()` (Phase 0.1), so it's already DI-resolvable globally. NO MODULE WIRING CHANGES needed for this.
  - `TenantContextInterceptor` behavior change (validator vs binder): documented above as transitive but NOT a contract break for the rest of the application.

- **API contract impact**: NEW endpoints (Open Decision #2 scope):
  - `POST /tenants/:tenantId/organizations` (admin-only, requires `requireTenantRole(OWNER|ADMIN)`)
  - `GET /tenants/:tenantId/organizations`
  - `POST /organizations/:orgId/members` (admin-only of the org)
  All under new `Organizations` tag in `api-spec.yml`. NO modification of existing endpoints. `/update-docs` adds the spec entries (per wave convention).

- **Schema migration impact**:
  - NEW tables `organizations` + `organization_memberships` — additive, zero conflict.
  - NEW enum `OrganizationRole` — additive.
  - `Tenant.subdomain` (NOT NULL, `@unique`) — backfill from `slug` in same migration. Risk: if any existing slug is in the reserved blocklist (Open Decision #3), migration must include a manual rename step. **Lock at /develop**: run `SELECT slug FROM tenants WHERE slug IN ('admin', 'api', ...)` against dev DB; if any rows, append `UPDATE tenants SET subdomain = 'tenant-' || slug WHERE slug IN (...)` to the migration.
  - `AuditLog.organizationId` (nullable) — additive, zero conflict.
  - User reverse relation `organizationMemberships: OrganizationMembership[]` — Prisma-side only; no DB column.
  - Default-org bootstrap: idempotent `INSERT ... SELECT ... WHERE NOT EXISTS` ensures every existing tenant gets one default org.
  - Backward compatibility: **all changes are forward-only**. Rollback drops the new tables + columns; data on `Tenant.subdomain` is lost but `slug` (the source for backfill) remains.

- **Test files requiring updates**:
  - `src/common/interceptors/tests/tenant-context.interceptor.spec.ts` — MANDATORY rewrite. Old tests assume `TenantContext.run(membership.tenantId, ...)`; new tests must cover both "context already bound (middleware ran)" and "context not bound (middleware skip-path)" branches.
  - `src/tenants/tests/tenants.service.spec.ts` — MOD if any: `create()` now creates default-org in the same `$transaction`. Spec must assert the org row exists post-create.
  - No other existing spec files need updates.

- **Blast radius size**: **8 NEW files + 8 MOD files = 16 files**. Flagged for careful regression testing in `/verify`. Larger than Phase 1.3 (9 files) but well-scoped.

## 3. Overview

First sub-phase of Phase 2 of the AUTH v2 + Tenancy v1 program. Bundles **D-007** (separate `Organization` from `Tenant`) and **D-008** (subdomain → tenant binding at request boundary) into a single batched ticket per Q8 in ORCH-DRAFT-001. Unblocks Phase 2.2 (AuthIntent) and Phase 2.3 (Dashboard wiring) — both within the 3-week MVP window per D-010.

**Architecture principles applied**:
- **Defense-in-depth on tenant isolation**: subdomain middleware fires at the request boundary (BEFORE guards/interceptors/controllers), pinning `TenantContext` from `Host`. Phase 0.2's Prisma `$extends` tenant-filter remains the row-level backstop (verified: extension is unaware of how context was bound). If middleware fails to resolve a subdomain → 404 with generic message; if subdomain valid but user has no membership → 403 from the updated interceptor.
- **Validator-not-binder interceptor**: previously `TenantContextInterceptor` bound context from user's first-active membership (Phase 0.2 stopgap). With Phase 2.1, the middleware is the canonical binder; the interceptor's job becomes: "given the bound subdomain-tenant, verify user has active membership in it". This is a **named behavior change** documented as Open Decision #6.
- **404-not-403 for cross-tenant denial**: matches `MembershipsService.requireMembership` discipline from SCRUM-491. Subdomain-not-found → 404 generic (hides which subdomains exist). Cross-tenant access → 404 generic.
- **In-process LRU cache** for subdomain → tenantId: 1024 entries × 5min TTL. Invalidate only on `Tenant.subdomain` mutation. No Redis dependency (deferred to Phase 2.2+ if metrics show miss rate >5%).
- **Single source of truth for tenant identity**: subdomain is the user-facing identifier; user JWT (Phase 1.1) still carries `tenantId` but in the multi-tenant-user case, subdomain wins (verified by the validator interceptor).

## 4. Architecture Context

- **Modules involved**:
  - **`TenantsModule`** (gains 1-2 new providers + middleware configuration; `exports[]` gains `OrganizationsService` for downstream consumers).
  - **`AuditModule`** (no changes; consumed by `OrganizationsService` for audit emission).
  - **`AppModule`** (no changes; `TenantContextInterceptor` is already registered as `APP_INTERCEPTOR`).

- **Components affected**:
  - 1 NEW Prisma migration.
  - 2 NEW Prisma models (`Organization`, `OrganizationMembership`) + 1 NEW enum (`OrganizationRole`) + 2 column adds + 1 default-org bootstrap.
  - 1 NEW NestJS service (`OrganizationsService`, `@Injectable`).
  - 1 NEW NestJS middleware (`SubdomainTenantResolverMiddleware`, `@Injectable implements NestMiddleware`).
  - 1 NEW controller (`OrganizationsController`, `@Controller('tenants/:tenantId/organizations')` + `@Controller('organizations/:orgId/members')`) — read paths + `addMember` per Open Decision #2.
  - 1 MODIFIED interceptor (`TenantContextInterceptor`) — validator-not-binder.
  - 4 NEW `AuditAction` enum values + TS mirror.
  - 1 NEW ErrorMessages namespace `organizations`.
  - 1 MODIFIED service method (`TenantsService.create()` adds default-org in same `$transaction`).

- **Files referenced**:
  - `nexacore-api/prisma/schema.prisma` (MOD)
  - `nexacore-api/prisma/migrations/<timestamp>_phase_2_1_organization_and_subdomain/migration.sql` (NEW)
  - `nexacore-api/src/tenants/organizations.service.ts` (NEW)
  - `nexacore-api/src/tenants/middleware/subdomain-tenant-resolver.middleware.ts` (NEW)
  - `nexacore-api/src/tenants/organizations.controller.ts` (NEW, scope per Open Decision #2)
  - `nexacore-api/src/tenants/dto/create-organization.dto.ts` (NEW)
  - `nexacore-api/src/tenants/dto/add-organization-member.dto.ts` (NEW)
  - `nexacore-api/src/tenants/dto/organization-response.dto.ts` (NEW)
  - `nexacore-api/src/tenants/tests/organizations.service.spec.ts` (NEW)
  - `nexacore-api/src/tenants/tests/subdomain-tenant-resolver.middleware.spec.ts` (NEW)
  - `nexacore-api/src/tenants/tests/organizations.controller.spec.ts` (NEW)
  - `nexacore-api/src/tenants/tenants.service.ts` (MOD)
  - `nexacore-api/src/tenants/tenants.module.ts` (MOD)
  - `nexacore-api/src/common/interceptors/tenant-context.interceptor.ts` (MOD — behavior change)
  - `nexacore-api/src/common/interceptors/tests/tenant-context.interceptor.spec.ts` (MOD — rewritten)
  - `nexacore-api/src/audit/enums/audit-action.enum.ts` (MOD)
  - `nexacore-api/src/common/constants/error-messages.ts` (MOD)

## 5. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: `feature/SCRUM-495-tenants-backend` from latest main.
- **Implementation Steps**:
  1. `cd ~/projects/em-ecosystem && git checkout main && git pull origin main`.
  2. Confirm `git log --oneline -1` shows `e33fe6b` (SCRUM-494 squash merge).
  3. `git checkout -b feature/SCRUM-495-tenants-backend`.
  4. `git branch --show-current` → `feature/SCRUM-495-tenants-backend`.

### Step 1: Schema additions (Prisma)

- **File**: `nexacore-api/prisma/schema.prisma` (MOD).
- **Implementation Steps**:
  1. Append AFTER `TenantInvitation` (around line ~430):
     ```prisma
     /// Phase 2.1 / SCRUM-495 — D-007 separates Organization (sub-grouping inside
     /// a tenant) from Tenant (billing/contract identity).
     model Organization {
       id          String   @id @default(uuid())
       tenantId    String
       tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
       name        String
       slug        String
       description String?
       isDefault   Boolean  @default(false)
       createdAt   DateTime @default(now())
       updatedAt   DateTime @updatedAt
       members     OrganizationMembership[]
       @@unique([tenantId, slug])
       @@index([tenantId])
       @@map("organizations")
     }

     model OrganizationMembership {
       id              String   @id @default(uuid())
       organizationId  String
       organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
       userId          String
       user            User         @relation("OrganizationMembershipUser", fields: [userId], references: [id], onDelete: Cascade)
       role            OrganizationRole @default(MEMBER)
       joinedAt        DateTime @default(now())
       @@unique([organizationId, userId])
       @@index([userId])
       @@index([organizationId])
       @@map("organization_memberships")
     }

     enum OrganizationRole {
       OWNER
       ADMIN
       MEMBER
       VIEWER
     }
     ```
  2. Modify `Tenant` model (line 317-330): add `subdomain String @unique` field + reverse relation `organizations Organization[]`.
  3. Modify `AuditLog` model (line 177-197): add `organizationId String?` field.
  4. Modify `User` model: add `organizationMemberships OrganizationMembership[] @relation("OrganizationMembershipUser")`.
  5. `npx prisma format` + `npx prisma validate`.

### Step 2: Migration SQL + deploy

- **File**: `nexacore-api/prisma/migrations/<timestamp>_phase_2_1_organization_and_subdomain/migration.sql` (NEW).
- **Implementation Steps**:
  1. Pick timestamp at /develop time: `date -u +"%Y%m%d%H%M%S"`.
  2. Create migration folder.
  3. Write `migration.sql` (hand-written byte-equivalent to `migrate dev` output):
     ```sql
     -- CreateEnum
     CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');

     -- CreateTable organizations + organization_memberships
     CREATE TABLE "organizations" ( /* ... */ );
     CREATE TABLE "organization_memberships" ( /* ... */ );

     -- CreateIndex on both tables
     /* unique + secondary */

     -- AddForeignKey
     /* org→tenant CASCADE, org_member→org CASCADE, org_member→user CASCADE */

     -- AlterTable tenants — add subdomain
     ALTER TABLE "tenants" ADD COLUMN "subdomain" TEXT;
     -- Reserved-name collision check (RUN AT /develop time):
     -- SELECT slug FROM tenants WHERE slug IN (
     --   'admin', 'api', 'app', 'auth', 'dashboard', 'mail', 'support',
     --   'status', 'www', 'static', 'cdn', 'health', 'metrics', 'platform', 'internal'
     -- );
     -- If any rows: prepend `UPDATE tenants SET subdomain = 'tenant-' || slug WHERE slug IN (...)`.
     UPDATE "tenants" SET "subdomain" = "slug";  -- backfill (after any rename)
     ALTER TABLE "tenants" ALTER COLUMN "subdomain" SET NOT NULL;
     CREATE UNIQUE INDEX "tenants_subdomain_key" ON "tenants"("subdomain");

     -- AlterTable audit_logs — add organizationId
     ALTER TABLE "audit_logs" ADD COLUMN "organizationId" TEXT;

     -- Default-organization bootstrap (idempotent)
     INSERT INTO "organizations" ("id", "tenantId", "name", "slug", "isDefault", "createdAt", "updatedAt")
     SELECT gen_random_uuid(), id, 'Default', 'default', true, NOW(), NOW()
     FROM "tenants" t
     WHERE NOT EXISTS (
       SELECT 1 FROM "organizations" o WHERE o."tenantId" = t.id AND o."isDefault" = true
     );

     -- AlterEnum AuditAction — 4 new values (appended; positional order matters for Prisma)
     ALTER TYPE "AuditAction" ADD VALUE 'ORGANIZATION_CREATED';
     ALTER TYPE "AuditAction" ADD VALUE 'ORGANIZATION_MEMBER_ADDED';
     ALTER TYPE "AuditAction" ADD VALUE 'ORGANIZATION_MEMBER_REMOVED';
     ALTER TYPE "AuditAction" ADD VALUE 'SUBDOMAIN_RESOLUTION_FAILED';
     ```
  4. **Pre-migration sanity** (at /develop):
     - Run the SELECT against dev DB to identify reserved-name collisions.
     - If any, prepend UPDATE statements to the migration.
  5. `npx prisma migrate deploy` → confirm exit 0.
  6. `npx prisma generate` → refresh TS client types.

### Step 3: Mirror new enum values in TS

- **File**: `nexacore-api/src/audit/enums/audit-action.enum.ts` (MOD).
- **Implementation Steps**: Append 4 new values (alphabetical-ish; after `SESSION_V2_*` from Phase 1.2):
  ```typescript
  ORGANIZATION_CREATED = 'ORGANIZATION_CREATED',
  ORGANIZATION_MEMBER_ADDED = 'ORGANIZATION_MEMBER_ADDED',
  ORGANIZATION_MEMBER_REMOVED = 'ORGANIZATION_MEMBER_REMOVED',
  SUBDOMAIN_RESOLUTION_FAILED = 'SUBDOMAIN_RESOLUTION_FAILED',
  ```

### Step 4: Add ErrorMessages.organizations namespace

- **File**: `nexacore-api/src/common/constants/error-messages.ts` (MOD).
- **Implementation Steps**: Add namespace after `tenants` (line 80):
  ```typescript
  organizations: {
    NOT_FOUND: 'Organization not found',
    SLUG_TAKEN: 'Organization slug already in use within this tenant',
    DEFAULT_PROTECTED: 'Cannot delete or modify the default organization',
  },
  ```

### Step 5: Add `TenantsService.findBySubdomain()` + modify `TenantsService.create()`

- **File**: `nexacore-api/src/tenants/tenants.service.ts` (MOD).
- **Implementation Steps**:
  1. **Add `findBySubdomain(subdomain: string): Promise<Tenant | null>`** after `findBySlug` (line ~46). Body mirrors `findBySlug` but queries on `subdomain`.
  2. **Modify `create(dto)` at line 57**: extend the `$transaction` to also insert the default `Organization` row. Atomic.
     ```typescript
     async create(dto: CreateTenantDto): Promise<Tenant> {
       return this.prisma.$transaction(async (tx) => {
         const tenant = await tx.tenant.create({
           data: { slug: dto.slug, subdomain: dto.subdomain ?? dto.slug, name: dto.name },
         });
         await tx.tenantSettings.create({ data: { tenantId: tenant.id } });
         await tx.organization.create({  // NEW: default org
           data: { tenantId: tenant.id, name: 'Default', slug: 'default', isDefault: true },
         });
         return tenant;
       });
     }
     ```
  3. If `CreateTenantDto` doesn't have `subdomain` field yet, add it (defaults to `slug` if absent).

### Step 6: Implement `OrganizationsService`

- **File**: `nexacore-api/src/tenants/organizations.service.ts` (NEW, ~150 LOC).
- **Implementation Steps**:
  1. File header (AUTH-domain `// WARNING` comment).
  2. Imports: `@Injectable`, `NotFoundException`, `ConflictException`; `PrismaService`, `AuditService`, `AuditAction`, `TenantContext`, `ErrorMessages`, Prisma error codes.
  3. Constructor: `(prisma: PrismaService, auditService: AuditService)`.
  4. Public methods:
     - `findById(orgId, tenantId)` — tenant-scoped; returns `Organization | null`. Wrapped in `TenantContext.runWithBypass('organization-lookup')` IF context isn't already bound to `tenantId` (defense-in-depth).
     - `findBySlug(tenantId, slug)` — same shape.
     - `create(tenantId, dto)` — `$transaction`; P2002 → `ConflictException(ErrorMessages.organizations.SLUG_TAKEN)`; emits `ORGANIZATION_CREATED`.
     - `listForTenant(tenantId)` — `prisma.organization.findMany({ where: { tenantId }, orderBy: { createdAt: 'asc' } })`.
     - `addMember(orgId, userId, role)` — atomic via `$transaction`: verify org exists + verify user has tenant-membership (404 not 403 if not) + insert OrganizationMembership; emits `ORGANIZATION_MEMBER_ADDED`.
     - `removeMember(orgId, userId)` — delete row; emits `ORGANIZATION_MEMBER_REMOVED`. P2025 → swallow silently (idempotent).
     - `requireMembership(userId, orgId)` — 404 (not 403) on non-membership (mirrors `MembershipsService.requireMembership`). Platform admins return `null`.

### Step 7: Implement `SubdomainTenantResolverMiddleware`

- **File**: `nexacore-api/src/tenants/middleware/subdomain-tenant-resolver.middleware.ts` (NEW, ~120 LOC).
- **Implementation Steps**:
  1. File header (AUTH-domain `// WARNING` comment).
  2. Imports: `@Injectable`, `NestMiddleware`, `NotFoundException`; `Request, Response, NextFunction` from express; `ConfigService`; `TenantsService`; `TenantContext`; `AuditService` + `AuditAction`; `ErrorMessages`.
  3. **LRU cache class** (internal, ~20 LOC): simple `Map<string, { tenantId: string, expiresAt: number }>` with size-bound eviction. Per-process instance.
  4. Constants:
     ```typescript
     const RESERVED_SUBDOMAINS = new Set(['admin', 'api', 'app', 'auth', 'dashboard',
       'mail', 'support', 'status', 'www', 'static', 'cdn', 'health', 'metrics',
       'platform', 'internal']);
     const SKIP_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);
     const SKIP_PATHS = ['/health', '/metrics'];
     const CACHE_SIZE = 1024;
     const CACHE_TTL_MS = 5 * 60 * 1000;
     ```
  5. Constructor: `(tenants: TenantsService, configService: ConfigService, auditService: AuditService)`. Inject `auditService` for the `SUBDOMAIN_RESOLUTION_FAILED` event (rate-limited).
  6. `async use(req: Request, res: Response, next: NextFunction)` body:
     - Extract `host = req.headers.host` (strip port: `host.split(':')[0]`).
     - **Skip-path check**: if `host` in `SKIP_HOSTS` OR `req.path` in `SKIP_PATHS` → `next()` (no context binding; existing `TenantContextInterceptor` falls back to its old behavior).
     - Derive subdomain: `subdomain = host.split('.')[0].toLowerCase()`.
     - **Platform-admin canonical check**: if `subdomain === configService.get<string>('app.platformAdminSubdomain')` (default `'admin'` or `'platform-admin'`) → wrap remainder in `auditAndRunBypass(this.auditService, 'platform-admin-route', requestMeta, () => next())` and return.
     - **Reserved-subdomain check**: if `subdomain` in `RESERVED_SUBDOMAINS` AND not the configured platform-admin → throw `NotFoundException(ErrorMessages.tenants.NOT_FOUND)` (generic; hides which reserved subdomains exist).
     - **Cache check**: if `cache.has(subdomain)` and not expired → use cached `tenantId`, bind context, `next()`.
     - **Cache miss**: call `tenants.findBySubdomain(subdomain)`.
     - If null OR `tenant.status === 'suspended' || 'deleted'` → audit `SUBDOMAIN_RESOLUTION_FAILED` (rate-limited via in-memory token bucket; 10/min) + throw `NotFoundException(ErrorMessages.tenants.NOT_FOUND)`.
     - Cache the result + bind: `TenantContext.run(tenant.id, () => next())`.
  7. **Cache invalidation hook**: export a static method `SubdomainTenantResolverMiddleware.invalidate(subdomain: string)` that `TenantsService.update` calls when `dto.subdomain !== current.subdomain`.

### Step 8: Modify `TenantContextInterceptor` — validator-not-binder

- **File**: `nexacore-api/src/common/interceptors/tenant-context.interceptor.ts` (MOD).
- **Implementation Steps**:
  1. Update constructor: `(tenants: TenantsService, memberships: MembershipsService)` (2 deps).
  2. Update body of `intercept()`:
     - **Check `TenantContext.getActiveTenantId()`** FIRST.
     - **If bound (middleware ran)**:
       - If `req.user?.sub` present: call `memberships.requireMembership(boundTenantId, sub, req.user?.isPlatformAdmin ?? false)`. If throws → propagate the 404. If succeeds → simply `next.handle()` (don't re-bind).
       - If no `req.user` (unauthenticated path on tenant subdomain): just `next.handle()` (middleware already bound; route is unauthenticated by design — login on `acme.platform.com/auth/v2/intents`).
     - **If not bound (middleware skip-path)**: fall back to OLD behavior (first-active-membership lookup; `runWithBypass('unauthenticated')` if no user).
  3. Update docstring to reflect Phase 2.1 changes.

### Step 9: (Conditional per Open Decision #2) Implement `OrganizationsController`

- **File**: `nexacore-api/src/tenants/organizations.controller.ts` (NEW, ~120 LOC).
- **Implementation Steps**:
  1. File header.
  2. `@ApiTags('Organizations')` + `@Controller()` (no class-level prefix; per-route prefixes for clarity).
  3. Endpoints:
     - `@Get('tenants/:tenantId/organizations')` — `@UseGuards(JwtAuthGuard)`, calls `requireMembership` then `organizationsService.listForTenant(tenantId)`.
     - `@Get('tenants/:tenantId/organizations/:orgId')` — same guards, calls `organizationsService.findById`. 404 if not found.
     - `@Post('tenants/:tenantId/organizations')` — `@UseGuards(JwtAuthGuard)` + `requireTenantRole([OWNER, ADMIN])`. Body: `CreateOrganizationDto`. Returns `OrganizationResponseDto`.
     - `@Post('organizations/:orgId/members')` — `@UseGuards(JwtAuthGuard)`. Body: `AddOrganizationMemberDto`. `requireMembership` on the org's tenant for the actor + role check (OWNER|ADMIN of the org or platform admin).

### Step 10: Wire everything into `TenantsModule`

- **File**: `nexacore-api/src/tenants/tenants.module.ts` (MOD).
- **Implementation Steps**:
  1. Add imports: `MiddlewareConsumer, NestModule` from `@nestjs/common`; `OrganizationsService`, `SubdomainTenantResolverMiddleware`, `OrganizationsController` (if Open Decision #2).
  2. Change `export class TenantsModule {}` → `export class TenantsModule implements NestModule { configure(consumer: MiddlewareConsumer) { consumer.apply(SubdomainTenantResolverMiddleware).forRoutes('*'); } }`.
  3. Add `OrganizationsService` to `providers[]`.
  4. Add `SubdomainTenantResolverMiddleware` to `providers[]` (must be a provider to be DI-resolvable when NestJS instantiates it for middleware).
  5. Add `OrganizationsController` to `controllers[]` (if Open Decision #2).
  6. Add `OrganizationsService` to `exports[]` (for Phase 2.2 consumer).

### Step 11: Write specs

#### 11a: `organizations.service.spec.ts` (~250 LOC, ~15 tests)

- **File**: `nexacore-api/src/tenants/tests/organizations.service.spec.ts` (NEW).
- **Pattern**: mock-free testing module with mocked PrismaService + spy AuditService (mirrors SCRUM-491 / SCRUM-493 idiom).
- **Coverage**: create (happy + slug-collision-ConflictException) + findById (tenant-scoped) + findBySlug + listForTenant + addMember (happy + already-member-Conflict) + removeMember (happy + P2025-swallow) + requireMembership (404-not-403 for non-member, platform-admin short-circuit). Audit emission asserted for each mutation.

#### 11b: `subdomain-tenant-resolver.middleware.spec.ts` (~250 LOC, ~14 tests)

- **File**: `nexacore-api/src/tenants/tests/subdomain-tenant-resolver.middleware.spec.ts` (NEW).
- **Pattern**: real middleware instance + mocked `TenantsService` + mocked `Request` shape + spy `next`.
- **Coverage**:
  - Happy (4): valid subdomain → `TenantContext.run` bound + next() called; cache hit on second call; cache miss triggers DB lookup; platform-admin canonical → `runWithBypass('platform-admin-route')`.
  - Skip paths (3): `localhost` host → skip; `/health` path → skip; `/metrics` path → skip.
  - Reserved-subdomain (1): `subdomain='api'` (not configured as platform-admin) → 404 generic.
  - Lookup failures (3): tenant not found → 404 + audit `SUBDOMAIN_RESOLUTION_FAILED`; tenant suspended → 404; tenant deleted → 404.
  - Cache (3): LRU eviction at size; TTL expiry; invalidation via `invalidate(subdomain)`.

#### 11c: `tenant-context.interceptor.spec.ts` — REWRITE

- **File**: `nexacore-api/src/common/interceptors/tests/tenant-context.interceptor.spec.ts` (MOD).
- **Implementation Steps**:
  1. Constructor mock gains `MembershipsService` provider with `requireMembership: jest.fn()`.
  2. Tests cover BOTH branches:
     - **Context already bound (middleware ran)**:
       - User has membership in bound tenant → `next.handle()` called; `memberships.requireMembership` was invoked.
       - User has no membership → `requireMembership` throws `NotFoundException`; interceptor propagates.
       - No `req.user` (unauthenticated on tenant subdomain) → `next.handle()` called; no membership check.
     - **Context NOT bound (middleware skip-path)**:
       - Authenticated user → falls back to `findFirstActiveMembership` + `TenantContext.run(...)` (old behavior).
       - Unauthenticated → `runWithBypass('unauthenticated')`.

#### 11d: (Conditional) `organizations.controller.spec.ts` (~280 LOC, ~12 tests)

- **File**: `nexacore-api/src/tenants/tests/organizations.controller.spec.ts` (NEW, if Open Decision #2 ships controller).
- **Pattern**: mocked services (SCRUM-491 controller spec idiom).
- **Coverage**: read paths (4) + create (3 incl. ConflictException) + addMember (3) + auth failures (2 — non-member 404, role-mismatch 404).

### Step 12: Build, lint, jest verification

- **Implementation Steps**:
  1. `npm run build` → exit 0 (Prisma regen + DI typing both clean — critical for e2e AppModule bootstrap).
  2. `npx jest --testPathPatterns='organizations|subdomain-tenant-resolver|tenant-context.interceptor|tenants.service' --maxWorkers=1 --forceExit` → all targeted specs pass.
  3. Full project: `npx jest --maxWorkers=1 --forceExit` → 1320 + ~27 = ~1347 tests pass.
  4. Coverage: `--coverage` → global ≥ 90.5%; per-file ≥ 95% on `organizations.service.ts`, `subdomain-tenant-resolver.middleware.ts`; `tenant-context.interceptor.ts` coverage stays ≥ existing baseline.
  5. ESLint: `npx eslint <staged files> --fix`.
  6. DI bootstrap smoke: a one-line e2e harness or `nest start` (briefly) to confirm `AppModule.compile()` succeeds with the new middleware + interceptor 2-dep change.
  7. Grep invariants:
     - `grep -rn "OrganizationsService" src/` → service decl + module providers + spec + controller (if Open Decision #2) + Phase 2.2 plan reference.
     - `grep -rn "SubdomainTenantResolverMiddleware" src/` → middleware decl + module wiring + spec.
     - `git diff main -- src/tenants/invitations.service.ts src/tenants/memberships.service.ts` → both **empty** (no changes to Phase 0.4 services; Phase 2.1 adds new files).

### Step 13: Update Technical Documentation

- **Action**: Deferred-by-design to `/update-docs`.
- **Implementation Steps**: NOT in this branch. `/update-docs` will:
  - Update `ai-specs/specs/integration-state.md`: header bump + Module Registry annotation on TenantsModule (new providers + middleware + controller) + new Service Dependency Chains entry + new Controller Guard Chains entry (if Open Decision #2 ships controller) + Changelog row.
  - Update `ai-specs/changes/auth/programs/AUTH-v2.md` §6 Phase 2.1 row marked complete.
  - Update `ai-specs/specs/api-spec.yml`: NEW `Organizations` tag + 4 new paths (read paths + create + addMember).
  - Update `ai-specs/specs/data-model.md`: NEW `Organization` + `OrganizationMembership` entity entries.

## 6. Implementation Order

1. Step 0: Create feature branch.
2. Step 1: Schema additions (Prisma).
3. Step 2: Migration SQL + deploy (incl. reserved-name collision pre-check).
4. Step 3: TS enum mirror.
5. Step 4: `ErrorMessages.organizations` namespace.
6. Step 5: `TenantsService.findBySubdomain()` + `create()` default-org extension.
7. Step 6: `OrganizationsService`.
8. Step 7: `SubdomainTenantResolverMiddleware`.
9. Step 8: `TenantContextInterceptor` — validator-not-binder.
10. Step 9 (conditional): `OrganizationsController`.
11. Step 10: Wire into `TenantsModule`.
12. Step 11a-d: Specs.
13. Step 12: Build + lint + jest + DI smoke + grep invariants.
14. Step 13: Docs deferred to `/update-docs`.

## 7. Testing Checklist

- [ ] `npm run build` exit 0.
- [ ] Targeted jest: `organizations.service.spec` (15) + `subdomain-tenant-resolver.middleware.spec` (14) + `tenant-context.interceptor.spec` (rewritten) + `tenants.service.spec` (default-org assert) all pass.
- [ ] Full project: ~1347/1347 pass.
- [ ] Coverage global ≥ 90.5%; per-file ≥ 95% on new files.
- [ ] ESLint clean.
- [ ] DI smoke: `AppModule.compile()` succeeds.
- [ ] Reserved-subdomain collision check executed against dev DB; manual renames added to migration if any.
- [ ] `git diff main -- src/tenants/invitations.service.ts src/tenants/memberships.service.ts` empty.

**Regression test checklist** (from §2):

| File | Updated? | Why |
|---|---|---|
| `src/common/interceptors/tests/tenant-context.interceptor.spec.ts` | **YES — MANDATORY** | Constructor signature changed (gained `MembershipsService`); behavior changed (validator-not-binder when bound). |
| `src/tenants/tests/tenants.service.spec.ts` | **YES** | `create()` now creates default-org row in `$transaction`; spec must assert the org row exists post-create. |
| `test/auth-e2e/*.e2e-spec.ts` | NO update needed; re-run | Default `Host: localhost` → middleware skip-path → falls through to old interceptor branch. Validate at /develop time. |

## 8. Error Response Format

Standard HttpExceptionFilter JSON. Status codes used:

- `200 / 201` — success.
- `400` — DTO validation failure (existing class-validator).
- `401` — `JwtAuthGuard` failure on guarded endpoints.
- `404` — subdomain not found · tenant suspended/deleted · org not found · cross-tenant access · cross-org access · wrong role. **All 404s use generic `Tenant not found` or `Organization not found` message — no enumeration leak.**
- `409` — `OrganizationsService.create` slug collision.
- `429` — rate limit on `Throttle`-decorated endpoints (if applied).
- `500` — unexpected (audit `SUBDOMAIN_RESOLUTION_FAILED` written for observability).

## 9. Dependencies

- **No new dependencies**. All used (`@nestjs/common`, `@nestjs/config`, `@nestjs/swagger`, `passport-jwt`, `express`, `@prisma/client`) already in `nexacore-api/package.json`.
- **Zero `package.json` edits**.

## 10. Notes

- **English only** in all code + comments + spec test names.
- **§15 AUTH change-control APPLIES**. PR touches: `prisma/schema.prisma` + `prisma/migrations/**` + `src/tenants/**` + `src/common/interceptors/**` + `src/audit/enums/**` + `src/common/constants/**`. **Single-domain AUTH per §15.3.3 → no split-PR required**. Mandatory §12 Rollback Playbook in record.
- **`TenantContextInterceptor` behavior change is the most consequential modification** in this ticket. Old behavior: bind from user's first-active membership. New behavior: validate user has membership in middleware-bound subdomain tenant. Documented in the record under "Deviations" as Accepted-Trivial (it's the operator-decided behavior per Open Decision #6), but flag the existing spec rewrite as part of the implementation.
- **Reserved-subdomain blocklist** is hardcoded for Phase 2.1; **TODO: extract to a config file in Phase 3+** for runtime configurability (operational nice-to-have, not a blocker).
- **Subdomain spoofing via Host header (R-2.1.5)**: documented as an operational requirement on the CDN/reverse proxy. The Prisma `$extends` tenant-filter from Phase 0.2 remains the row-level backstop.

## 11. Next Steps After Implementation

- `/verify SCRUM-495`: confirm middleware + interceptor coexistence works; confirm v1 paths bit-identical (`git diff main -- src/auth/**`); confirm e2e tests pass under the modified interceptor.
- `/commit SCRUM-495`: expect **one-shot CI green** (post-SCRUM-490 coverage margin protects; +27 tests on heavily-testable surface).
- `/update-docs SCRUM-495`: integration-state.md + AUTH-v2.md §6 row 2.1 marked complete + api-spec.yml NEW paths + data-model.md NEW Organization entries.
- **Phase 2.2 unblocked**: AuthIntent state machine — first endpoint will consume the subdomain-bound tenant context + create AuthIntents scoped to the bound tenant.

## 12. Implementation Verification

- **Code Quality**: NEW files follow SCRUM-491 (`tenants.controller.spec.ts`) / SCRUM-493 (`sessions.service.v2.spec.ts`) discipline.
- **Functionality**: middleware → interceptor chain produces correct tenant binding for both authenticated and unauthenticated requests under all subdomain shapes (incl. skip-paths + platform-admin canonical).
- **Testing**: 4 spec files (3 NEW + 1 MOD) covering ≥ 95% per-file on new code.
- **Regression**: zero v1 path modifications; e2e tests pass under modified interceptor; Phase 0.2 / 0.4 services bit-identical.
- **Integration**: TenantsModule gains 1-2 controllers + 2 providers + middleware configuration; AppModule unchanged.
- **Documentation**: deferred-by-design to `/update-docs`.

## 13. Open considerations for /develop time

1. **Reserved-subdomain collision pre-check on dev DB** — run `SELECT slug FROM tenants WHERE slug IN (RESERVED_SET)` at /develop start; if any rows, add `UPDATE` statements to the migration before deploying.
2. **`app.platformAdminSubdomain` config key** — confirm it exists in `auth.config.ts` or `app.config.ts`; if absent, add with default `'admin'`.
3. **Audit emission rate-limiter for `SUBDOMAIN_RESOLUTION_FAILED`** — pick a simple token-bucket impl (e.g., 10/min per host) OR defer the rate-limit logic to Phase 2.2 / Phase 3+ if too complex for this ticket (operator decision at /develop).
4. **`OrganizationsService.requireMembership` 404 message** — should it use `ErrorMessages.organizations.NOT_FOUND` (precise) or `ErrorMessages.tenants.NOT_FOUND` (consistent with cross-tenant denial)? Recommendation: **`organizations.NOT_FOUND`** — same discipline but org-specific.
5. **Default-org cleanup on tenant deletion** — `CASCADE` from `Tenant` → `Organization` already handles this via FK. Verify no manual cleanup needed.
6. **`CreateTenantDto` field addition** — does `subdomain` belong in the DTO, or always derived from `slug`? Lock at /develop: **derived from slug if not provided** (backward-compatible).
