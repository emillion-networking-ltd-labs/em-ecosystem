---
schema: ai-specs/schemas/plan.schema.yml
ticket: SCRUM-487
sprint: Sprint 15
scope: backend
module: tenants
date: 2026-05-18
status: draft
last_completed_ticket: SCRUM-485
framework_version: 0.15.0
---

# Backend Implementation Plan: SCRUM-487 Tenant Models + Bootstrap Migration

## 1. Codebase State Snapshot

- **Date**: 2026-05-18
- **Last completed ticket**: SCRUM-485 (CI gate-anticipation codified in `/plan` v1.1.0; merged `22a6b42`).
- **Integration state verified**: Yes — `integration-state.md` "Last update: SCRUM-485 (2026-05-18)".
- **Plan declares `framework_version: 0.15.0`** — current; this ticket does not bump framework version.

### Files verified against live code (READ at plan time)

- `nexacore-api/prisma/schema.prisma` — current shape: 10 models, 2 enums (`Role`, `Provider`), Postgres provider, prisma-client-js generator. `User` model (lines 67-103) has 27 fields + 8 reverse relations (sessions, auditLogs, auditLogsTarget, emailVerificationTokens, passwordResetTokens, trustedDevices, webAuthnCredentials, oauthAccounts). NO `memberships` relation yet.
- `nexacore-api/src/prisma/prisma.module.ts` — `@Global()` module exporting `PrismaService`. **Means: TenantsModule does NOT need to import PrismaModule explicitly; PrismaService is globally injectable.**
- `nexacore-api/src/prisma/prisma.service.ts` — extends `PrismaClient` with `@prisma/adapter-pg` (Prisma 7.8.0). Standard `OnModuleInit/OnModuleDestroy` lifecycle.
- `nexacore-api/src/permissions/permissions.module.ts` — pattern reference for new module: `@Global() @Module({ imports, providers, controllers, exports })`. Imports `AuditModule` because `PermissionsGuard` depends on it.
- `nexacore-api/src/permissions/dto/set-role-permissions.dto.ts` — DTO pattern: class-validator (`@IsArray`, `@IsString`) + `@nestjs/swagger` `@ApiProperty`. Use this convention for our DTOs.
- `nexacore-api/src/permissions/tests/permissions.service.spec.ts` — test pattern: `Test.createTestingModule` + mocked `PrismaService` via `useValue` with `jest.fn()` per delegate method.
- `nexacore-api/package.json` — Prisma `^7.8.0`, scripts include `prisma:migrate` (= `prisma migrate dev`), `test` (= `jest`), `build` (= `nest build`).
- `nexacore-api/prisma/migrations/` — 25+ historical migrations. Naming convention: `<YYYYMMDDHHMMSS>_<snake_case_description>`. Most recent: `20260418165311_add_user_deleted_at`. Prisma will auto-generate the timestamp prefix during `prisma migrate dev`.
- `nexacore-api/src/app.module.ts` — current imports list (lines 13-24): PrismaModule · AuthModule · UsersModule · AuditModule · SecurityModule · MailModule · PermissionsModule · RedisModule · GeolocationModule · StorageModule. `TenantsModule` will be added (alphabetical placement near existing modules).
- `ai-specs/changes/auth/programs/AUTH-v2.md` — canonical program doc; §2 multi-tenant model spec; §5 D-001..D-006 locked decisions; §8 risks MT-3 + MT-11 mitigated by this ticket.

### Constructor signatures verified

- `PrismaService()` — no constructor parameters (configures via process.env.DATABASE_URL internally). **New TenantsService constructor**: `constructor(private readonly prisma: PrismaService)` — single dependency, globally available.

### Methods verified to exist

- This ticket creates NEW methods only. No existing method references in plan.

### Guard dependency chain verified

- N/A — this ticket creates no controllers, no `@UseGuards()`.

### Discrepancies with integration-state.md

- None. Integration state lists no `tenants` module (correct — it doesn't exist yet). This ticket adds it.

### Plan-time decisions

1. **Module convention**: Follow `permissions` module pattern (the closest analog in size + responsibility). `@Global()` decorator since TenantsService will be needed across modules (auth, users, future business entities). Mirrors PermissionsModule (`@Global()` + exports PermissionsService for cross-module use).
2. **PrismaModule import**: NOT needed in TenantsModule — `PrismaModule` is `@Global()` so PrismaService is injectable directly.
3. **AuditModule import**: NOT needed in this ticket — no audit events emitted yet (tenant lifecycle events come in later phases when audit-tenant-id ties into Phase 1).
4. **Bootstrap strategy**: TWO migrations, not one. (a) `<ts>_tenancy_primitives_phase_0/` — Prisma auto-generated structural CREATE TABLE / CREATE INDEX / FK constraints. (b) `<ts>_bootstrap_default_tenants/` — custom hand-written SQL migration with INSERT...SELECT for idempotent bootstrap. Separating these means rollback of (b) doesn't drop tables; we can re-run bootstrap independently.
5. **Slug strategy**: `personal-{user.id.substr(0,8)}`. UUID v4 collision probability over 8 hex chars = 1 in ~2^32. Acceptable. Migration SQL uses `substring(id::text, 1, 8)` PostgreSQL function. The constraint `Tenant.slug @unique` will catch any theoretical collision at INSERT time; the migration is written to skip already-migrated users so a single retry resolves it (in practice, will never trigger).
6. **Default tenant naming**: `name = COALESCE(NULLIF(split_part("email", '@', 1), ''), 'Personal') || ' Workspace'`. Examples: `john.doe@example.com → john.doe Workspace`; empty/null → `Personal Workspace`. Readable, low-PII (only the email local-part).
7. **Test isolation**: Service tests mock PrismaService entirely (no test DB). Migration idempotence test uses a real test DB via a separate integration test category if jest config supports it; otherwise document as "smoke-test post-migration via `psql` in /verify Step 4c".
8. **DO NOT touch User model in this ticket** — adding `memberships TenantMembership[]` reverse relation IS necessary (Prisma requires both sides of relations defined), but no other User changes here. The `isPlatformAdmin` flag + Role refactor is SCRUM-489.
9. **`prisma/seed.ts` exists** — irrelevant for this ticket. Bootstrap runs as a migration, not via seed (seed is dev-only; migrations run on prod).
10. **NOT-§15 compliance**: this ticket touches `prisma/schema.prisma` (AUTH domain boundary). Branch must be `feature/SCRUM-487-tenants-backend` (no `auth` suffix even though §15 applies — naming follows code path which is `tenants/`). `/commit` will require Jira reference + §15.3.3 separate review path.

### CI Gate Anticipation (per `/plan` v1.1.0 SCRUM-485 rule)

| CI gate | Expected behavior |
|---------|-------------------|
| Job 1: `py_compile (all tools)` | PASS / unchanged (no Python tool changes) |
| Job 2: `Schema validate (changed artifacts)` | PASS (plan + verify + record markdown validate via frontmatter `schema:`) |
| Job 2: `Groundedness (warn-only)` | PASS / no new SHA/PR/file:line refs introduced |
| Job 2: `Audit: coupling check (warn-only)` | PASS / exit 0 (no F-resolutions or G-findings touched) |
| Job 2: `Audit: completion check (warn-only)` | SKIP (no `ai-specs/changes/*/audits/**` files touched) |
| Job 3: `Schema validate (historical)` | SKIP (no `ai-specs/schemas/` changes) |
| Job 4: `Smoke test: state-machine.py` | PASS / unchanged |
| Job 5: `pytest (linchpin tests)` | PASS / 243 collected unchanged (no new framework tests; ai-specs tests not affected by NestJS code) |

**Note**: this ticket's primary CI surface is **`em-ecosystem-code` repo CI** (NestJS/Jest), NOT `em-development-framework` CI. The `em-ecosystem-code` CI runs `nest build` + `jest` + lint. Those are NOT covered by the framework's `/plan` template — they live in nexacore-api's own `.github/workflows/`. For nexacore-api CI: expect `nest build` PASS + Jest tests PASS (existing baseline + new TenantsService tests).

**New `.md`/`.yml` files this ticket creates under `ai-specs/changes/**`** (must each have schema routing):

| Path | Schema routing |
|------|----------------|
| `ai-specs/changes/tenants/plans/Sprint 15/SCRUM-487_backend.md` | Frontmatter `schema: ai-specs/schemas/plan.schema.yml` ✓ |
| `ai-specs/changes/tenants/plans/Sprint 15/SCRUM-487_verify.md` (later) | SCHEMA_BY_PATH rule `/plans/[^/]+/[A-Z][A-Z0-9]*-\d+_verify\.md$` ✓ |
| `ai-specs/changes/tenants/records/Sprint 15/SCRUM-487_backend.md` (later) | SCHEMA_BY_PATH rule `/records/[^/]+/...` ✓ |
| `ai-specs/changes/tenants/state/SCRUM-487.yml` (auto-created by state-machine) | SCHEMA_BY_PATH rule `/state/[A-Z][A-Z0-9]*-\d+\.ya?ml$` ✓ |

All four routes are covered by existing SCHEMA_BY_PATH rules. **No new SCHEMA_BY_PATH or SKIP_PATHS rules needed**. CI green expected on first push for ai-specs side.

## 2. Regression Impact Analysis

### Blast radius

| File | Type | Change |
|------|------|--------|
| `nexacore-api/prisma/schema.prisma` | MOD | +4 models, +3 enums, +1 User.memberships relation |
| `nexacore-api/prisma/migrations/<ts>_tenancy_primitives_phase_0/migration.sql` | NEW | Auto-generated structural |
| `nexacore-api/prisma/migrations/<ts>_bootstrap_default_tenants/migration.sql` | NEW | Hand-written SQL |
| `nexacore-api/src/tenants/tenants.module.ts` | NEW | NestJS module |
| `nexacore-api/src/tenants/tenants.service.ts` | NEW | Service with 4 methods |
| `nexacore-api/src/tenants/dto/create-tenant.dto.ts` | NEW | class-validator DTO |
| `nexacore-api/src/tenants/dto/update-tenant.dto.ts` | NEW | class-validator DTO |
| `nexacore-api/src/tenants/tests/tenants.service.spec.ts` | NEW | Jest unit tests |
| `nexacore-api/src/app.module.ts` | MOD | +1 import (TenantsModule), +1 in imports array |

### Direct dependents (files importing modified classes)

- `nexacore-api/src/app.module.ts` — imports `TenantsModule` (NEW).
- No existing service imports `User` model from a typed perspective such that `User.memberships` relation addition is a breaking change. Prisma adds the relation at type level; consumers that don't use it are unaffected.
- No `.spec.ts` mocks need updates — TenantsService is new; User mock objects in existing tests do NOT need to include `memberships: []` (Prisma generates types but `include` is opt-in).

### Breaking changes identified

- **None**. All additions:
  - 4 new tables (no impact on existing queries)
  - 3 new enums (no impact)
  - 1 new optional reverse relation on User (no impact unless code explicitly opts in via `include`)
  - 1 new module registered in app.module.ts

### API contract impact

- **N/A** — this ticket exposes ZERO HTTP endpoints (no controllers). `api-spec.yml` not touched.

### Schema migration impact

- New tables, new FK relations (all with `onDelete: Cascade` for tenant-scoped children — documented per `data-model.md` GDPR convention).
- Bootstrap: every existing User gets a default Tenant + TenantSettings + TenantMembership (role=OWNER, status=active). 100% migration target.
- No data loss possible — purely additive. Down migration drops new tables (loses any tenant data created post-migration, acceptable per rollback playbook).
- Forward-only? No — reversible. Down migration tested in dev.

### Test files requiring updates

- **None** in existing test files. New tests are in `src/tenants/tests/tenants.service.spec.ts`. Existing User mocks don't need `memberships` field (Prisma includes are opt-in).

### Blast radius size

**9 files affected** (4 NEW source + 2 NEW migrations + 1 NEW test + 2 MOD). Above 5-file flag — flagged for careful regression at `/verify`. But: **0 existing test files modified**, **0 existing services modified**, **0 existing API contracts modified**. Net regression risk is LOW.

## 3. Overview

Establishes the multi-tenant primitive layer for AUTH v2 + Tenancy v1 program — Phase 0.1. Adds 4 new Prisma models (`Tenant`, `TenantSettings`, `TenantMembership`, `TenantInvitation`) + 3 enums (`TenantStatus`, `TenantRole`, `MembershipStatus`). Bootstraps every existing User as the OWNER of a freshly-created default Tenant. Foundation for SCRUM-488 (Prisma tenant-filter middleware) and SCRUM-489 (User refactor). NO AUTH flow changes; no API surface; no JWT changes.

**Architecture principle**: cross-cutting tenancy infrastructure as a `@Global()` NestJS module mirroring the `PermissionsModule` pattern. Clean separation: models + service in `src/tenants/`; integration with other modules happens later phases.

## 4. Architecture Context

- **New module**: `nexacore-api/src/tenants/` (`@Global()`)
- **Module dependencies**: PrismaService (globally injectable via `@Global() PrismaModule`); NOTHING else in this ticket
- **Exports**: `TenantsService` (will be consumed by future SCRUM-488 + SCRUM-489 + Phase 1 AUTH integration)
- **Database**: 4 new tables, 3 new enums, 1 new reverse relation on `users` table (column unchanged; relation declared in Prisma schema)
- **Files affected**: see §2 blast radius table
- **Standards**: `backend-standards.mdc` (NestJS modular architecture, SOLID, testing) + `data-model.md` (entity documentation convention; doc step at `/update-docs`)

## 5. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create feature branch from latest `main`.
- **Branch name**: `feature/SCRUM-487-tenants-backend`
- **Implementation Steps**:
  1. `git checkout main`
  2. `git pull origin main`
  3. `git checkout -b feature/SCRUM-487-tenants-backend`
  4. `git branch` — verify
- **Notes**: NOT-§15 applies (touches `prisma/schema.prisma`). Branch naming follows code path (`tenants`) not domain (`auth`); §15 review path still required at `/commit`.

### Step 1: Add Prisma models + enums to schema.prisma

- **File**: `nexacore-api/prisma/schema.prisma` (MOD — append after existing models, before final `@@map` of last model)
- **Action**: Add 4 models + 3 enums + 1 User.memberships reverse relation.
- **Exact additions** (target shape locked in /enrich-us — copy verbatim from the enriched Jira description's "Exact schema" code block).
- **Reverse relation on User**: inside the existing `User { ... }` block, after `oauthAccounts OAuthAccount[]` line, add:
  ```prisma
  memberships    TenantMembership[]
  ```
- **Implementation Notes**:
  1. Place new models at the end of `schema.prisma` for cleanliness (grouped by domain).
  2. Order within section: `Tenant` → `TenantStatus enum` → `TenantSettings` → `TenantMembership` → `TenantRole enum` → `MembershipStatus enum` → `TenantInvitation`.
  3. `@@map("tenants")`, `@@map("tenant_settings")`, `@@map("tenant_memberships")`, `@@map("tenant_invitations")` — snake_case per existing convention (`users`, `sessions`, etc.).
  4. After editing, run `prisma format` (if available) or rely on editor format-on-save with Prisma extension.

### Step 2: Generate structural migration

- **Action**: Auto-generate Prisma migration for the structural changes.
- **Command**: `npm run prisma:migrate -- --name tenancy_primitives_phase_0`
- **Implementation Steps**:
  1. With `DATABASE_URL` pointing to local dev DB, run the command.
  2. Prisma generates `prisma/migrations/<timestamp>_tenancy_primitives_phase_0/migration.sql`.
  3. Inspect generated SQL — confirm 4 CREATE TABLE + 3 CREATE TYPE + indices + FK constraints + 1 ALTER TABLE on `users` (for the reverse relation it's a virtual relation; no actual column added to users — confirm).
  4. Verify migration applies cleanly: `prisma migrate status` → "up to date".
- **Implementation Notes**:
  - Naming: `tenancy_primitives_phase_0` is descriptive + traceable. If Prisma chooses a different timestamp prefix, that is fine.
  - Confirm Postgres-specific types (e.g., `JSONB` for Json columns, enum types as native PG enums).
  - DO NOT manually edit the auto-generated migration unless Prisma got something wrong (rare).

### Step 3: Author custom bootstrap SQL migration

- **Action**: Create a separate Prisma migration containing hand-written SQL that bootstraps default tenants for all existing users.
- **File**: `nexacore-api/prisma/migrations/<timestamp>_bootstrap_default_tenants/migration.sql` (NEW — manually create folder + file using a fresh timestamp newer than Step 2's)
- **Implementation Steps**:
  1. Generate timestamp: `date -u +%Y%m%d%H%M%S` (a few seconds after Step 2's).
  2. Create folder: `prisma/migrations/<ts>_bootstrap_default_tenants/`
  3. Create `migration.sql` with content (idempotent INSERT...SELECT):
  ```sql
  -- Bootstrap: every existing User → default Tenant as OWNER
  -- Idempotent via LEFT JOIN guard (skips users already mapped).
  -- SCRUM-487 Phase 0.1.

  -- 1. Create default Tenant for each user without a membership
  INSERT INTO "tenants" (id, slug, name, status, "createdAt", "updatedAt")
  SELECT
    gen_random_uuid(),
    'personal-' || substring(u.id::text, 1, 8),
    COALESCE(NULLIF(split_part(u.email, '@', 1), ''), 'Personal') || ' Workspace',
    'active',
    NOW(),
    NOW()
  FROM "users" u
  LEFT JOIN "tenant_memberships" m ON m."userId" = u.id
  WHERE m.id IS NULL
    AND u."deletedAt" IS NULL;

  -- 2. Create TenantSettings for each new tenant (those without settings)
  INSERT INTO "tenant_settings" (id, "tenantId", branding, modules, "authPolicy", "createdAt", "updatedAt")
  SELECT
    gen_random_uuid(),
    t.id,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    NOW(),
    NOW()
  FROM "tenants" t
  LEFT JOIN "tenant_settings" s ON s."tenantId" = t.id
  WHERE s.id IS NULL;

  -- 3. Create OWNER membership linking each User to their default Tenant
  --    We can resolve the pairing by slug pattern ('personal-' + 8 chars of user id)
  INSERT INTO "tenant_memberships" (id, "tenantId", "userId", role, status, "joinedAt", "lastActiveAt", "createdAt", "updatedAt")
  SELECT
    gen_random_uuid(),
    t.id,
    u.id,
    'OWNER',
    'active',
    NOW(),
    NOW(),
    NOW(),
    NOW()
  FROM "users" u
  JOIN "tenants" t ON t.slug = 'personal-' || substring(u.id::text, 1, 8)
  LEFT JOIN "tenant_memberships" m ON m."userId" = u.id
  WHERE m.id IS NULL
    AND u."deletedAt" IS NULL;
  ```
  4. Apply migration: `prisma migrate dev` (no `--create-only`; will detect new migration folder + run it).
  5. Verify with smoke query:
  ```sql
  SELECT COUNT(*)
  FROM "users" u
  LEFT JOIN "tenant_memberships" m ON m."userId" = u.id
  WHERE m.id IS NULL AND u."deletedAt" IS NULL;
  ```
  Expected result: `0`.
- **Implementation Notes**:
  - Postgres `gen_random_uuid()` requires `pgcrypto` extension. Check if already enabled (`SELECT * FROM pg_extension WHERE extname='pgcrypto';`). If not, add `CREATE EXTENSION IF NOT EXISTS pgcrypto;` at the top of the migration. **Likely already present** since the User model uses uuid id; verify.
  - Idempotence verified by LEFT JOIN guards. Re-running the migration produces 0 new rows.
  - **Soft-deleted users excluded** (`u."deletedAt" IS NULL`) — they don't need a tenant.
  - The 3-step pattern (tenant → settings → membership) is intentionally ordered to respect FK constraints. Each step is independent and idempotent.

### Step 4: Create `Tenant` DTOs

- **File**: `nexacore-api/src/tenants/dto/create-tenant.dto.ts` (NEW)
- **Action**: Create DTO with class-validator decorators for `TenantsService.create()`.
- **Implementation Steps**:
  1. Class `CreateTenantDto` with fields:
     - `slug: string` — `@IsString() @IsNotEmpty() @Matches(/^[a-z][a-z0-9-]*$/) @MaxLength(50)`
     - `name: string` — `@IsString() @IsNotEmpty() @MaxLength(100)`
     - `status?: TenantStatus` — `@IsOptional() @IsEnum(TenantStatus)`
  2. Add `@ApiProperty` decorators with descriptions + examples (Swagger).
  3. Re-export `TenantStatus` enum from Prisma Client.
- **File**: `nexacore-api/src/tenants/dto/update-tenant.dto.ts` (NEW)
- **Action**: `export class UpdateTenantDto extends PartialType(CreateTenantDto) {}` — NestJS `@nestjs/mapped-types` PartialType.

### Step 5: Create `TenantsService`

- **File**: `nexacore-api/src/tenants/tenants.service.ts` (NEW)
- **Action**: NestJS injectable service with 4 methods.
- **Function Signatures**:
  ```typescript
  @Injectable()
  export class TenantsService {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: string): Promise<Tenant | null>
    async findBySlug(slug: string): Promise<Tenant | null>
    async create(dto: CreateTenantDto): Promise<Tenant>
    async update(id: string, dto: UpdateTenantDto): Promise<Tenant>
  }
  ```
- **Implementation Steps**:
  1. **findById(id)**: `return this.prisma.tenant.findUnique({ where: { id } });`
  2. **findBySlug(slug)**: `return this.prisma.tenant.findUnique({ where: { slug } });`
  3. **create(dto)**: wrap in `this.prisma.$transaction()` to atomically create Tenant + TenantSettings together (1:1 relation guarantee). Pseudo:
     ```typescript
     return this.prisma.$transaction(async (tx) => {
       const tenant = await tx.tenant.create({ data: { slug: dto.slug, name: dto.name, status: dto.status ?? 'active' } });
       await tx.tenantSettings.create({ data: { tenantId: tenant.id } });
       return tenant;
     });
     ```
     If slug already exists → Prisma throws `P2002` (unique constraint) → catch and rethrow as `ConflictException(ErrorMessages.tenants.SLUG_TAKEN)`.
  4. **update(id, dto)**: `try { return await this.prisma.tenant.update({ where: { id }, data: dto }); } catch (e) { if (P2025 → throw NotFoundException) }`
- **Dependencies / Imports**:
  - `@nestjs/common`: Injectable, ConflictException, NotFoundException
  - `@prisma/client`: Tenant, TenantStatus
  - `../prisma/prisma.service`: PrismaService
  - `./dto/create-tenant.dto`, `./dto/update-tenant.dto`

### Step 6: Create `TenantsModule`

- **File**: `nexacore-api/src/tenants/tenants.module.ts` (NEW)
- **Action**: NestJS module declaration following `PermissionsModule` pattern.
- **Content**:
  ```typescript
  import { Global, Module } from '@nestjs/common';
  import { TenantsService } from './tenants.service';

  @Global()
  @Module({
    providers: [TenantsService],
    exports: [TenantsService],
  })
  export class TenantsModule {}
  ```
- **Implementation Notes**:
  - `@Global()` because future modules (auth Phase 1, business entities) will need `TenantsService` without ceremony.
  - No `imports: [PrismaModule]` needed — PrismaModule is also `@Global()`.
  - No `controllers` — this ticket does NOT expose endpoints.

### Step 7: Register `TenantsModule` in `app.module.ts`

- **File**: `nexacore-api/src/app.module.ts` (MOD)
- **Action**: Add 1 import line + 1 entry in module imports array.
- **Implementation Steps**:
  1. Add import line (alphabetical placement near other module imports, around line 24):
     ```typescript
     import { TenantsModule } from './tenants/tenants.module';
     ```
  2. Add `TenantsModule` to the `imports: [...]` array of `@Module()` — placement near other domain modules (after `StorageModule` or alphabetical insertion among AuthModule/AuditModule etc.).
- **Implementation Notes**:
  - No `controllers` change in app.module.ts (TenantsModule has none).
  - No global provider change (TenantsService is global via @Global() decorator on its module).

### Step 8: Write unit tests for `TenantsService`

- **File**: `nexacore-api/src/tenants/tests/tenants.service.spec.ts` (NEW)
- **Action**: Jest unit tests following `permissions.service.spec.ts` pattern.
- **Test categories**:
  1. **findById**:
     - Happy path: returns Tenant when found.
     - Not found: returns null.
  2. **findBySlug**:
     - Happy path: returns Tenant when found.
     - Not found: returns null.
  3. **create**:
     - Happy path: creates Tenant + TenantSettings atomically; returns Tenant.
     - Duplicate slug: throws `ConflictException` with `ErrorMessages.tenants.SLUG_TAKEN`.
     - Optional status: defaults to `'active'` when DTO omits it.
  4. **update**:
     - Happy path: updates Tenant fields; returns updated record.
     - Not found: throws `NotFoundException`.
- **Implementation Steps**:
  1. Mock PrismaService with `jest.fn()` per delegate method (tenant.findUnique, tenant.create, tenant.update, tenantSettings.create, $transaction).
  2. `$transaction` mock: invokes callback with the same mocked client (`useValue.$transaction = jest.fn(async (cb) => cb(useValue))`).
  3. Use real `Tenant` type from `@prisma/client` for test fixtures (typed assertions).
  4. Verify counts: assert mock function was called with expected args (`expect(prisma.tenant.create).toHaveBeenCalledWith({ data: { slug: 'foo', ... } })`).
- **Coverage target**: ≥85% branch coverage on `tenants.service.ts` (matches `permissions.service.ts` baseline).

### Step 9: Add `ErrorMessages.tenants` entry

- **File**: `nexacore-api/src/common/constants/error-messages.ts` (MOD — actual path may differ; verify at impl time via grep)
- **Action**: Add `tenants: { SLUG_TAKEN: 'Tenant slug already in use', NOT_FOUND: 'Tenant not found' }` to existing `ErrorMessages` constant.
- **Implementation Note**: this follows the convention from earlier audit findings (SCRUM-433 batch of 15 Tier-1 WARNs) — hardcoded error strings forbidden; all live in `ErrorMessages` catalog.

### Step 10: Run full test suite + lint

- **Action**: Verify zero regression in existing baseline.
- **Commands**:
  - `npm run prisma:generate` — regenerate types
  - `nest build` — compile clean
  - `npm test` — full Jest suite
  - `npm run lint:security` — eslint security rules
- **Gate**: all 4 commands clean.

### Step N+1: Update Technical Documentation

- **Action**: Documentation updates at `/update-docs` phase.
- **Implementation Steps**:
  1. **ai-specs/specs/data-model.md** (MOD): Document the 4 new entities. Each entity gets: fields, relations, indices, business invariants, cascade behavior. Per the GDPR/SOC2 convention from prior audit finding D-09 (Cascade Behavior subsections — 2026-05-14 audit).
  2. **ai-specs/specs/integration-state.md** (MOD): Module Registry table gains TenantsModule entry; Changelog row added.
  3. **ai-specs/specs/api-spec.yml** (NOT MOD): no endpoints exposed in this ticket.
  4. **Program doc** `ai-specs/changes/auth/programs/AUTH-v2.md` (MOD): §6 Current Phase State — SCRUM-487 marked `completed`; potential append to §5 Decision Log if any deviation classified (no anticipated deviations).
- **References**: `ai-specs/specs/documentation-standards.mdc`. English only.

## 6. Implementation Order

1. Step 0 — Create feature branch
2. Step 1 — Add models + enums + User.memberships relation to `schema.prisma`
3. Step 2 — Generate structural migration (`prisma migrate dev --name tenancy_primitives_phase_0`)
4. Step 3 — Author custom bootstrap SQL migration (hand-written file)
5. Step 4 — Create DTOs
6. Step 5 — Create `TenantsService`
7. Step 6 — Create `TenantsModule`
8. Step 7 — Register `TenantsModule` in `app.module.ts`
9. Step 8 — Write unit tests
10. Step 9 — Add `ErrorMessages.tenants`
11. Step 10 — Full test suite + lint
12. Step N+1 — Documentation updates (deferred to `/update-docs`)

## 7. Testing Checklist

- [ ] `nest build` compiles clean (no DI errors)
- [ ] `npm test` — full suite green; baseline tests unchanged; new `tenants.service.spec.ts` PASS
- [ ] `npm run lint:security` clean
- [ ] `prisma migrate status` → "up to date" after both migrations applied
- [ ] Smoke SQL post-migration: `SELECT COUNT(*) FROM users u LEFT JOIN tenant_memberships m ON m."userId" = u.id WHERE m.id IS NULL AND u."deletedAt" IS NULL;` → 0
- [ ] Re-run bootstrap migration → 0 new rows (idempotence verified)
- [ ] Cascade test: manually delete a test Tenant → confirm TenantSettings + TenantMembership rows cascaded
- [ ] Unique constraint test: attempt `tenant.create({ data: { slug: 'duplicate' }})` twice → second throws `P2002` → service rethrows as `ConflictException`
- [ ] `prisma generate` regenerates client types successfully
- [ ] AC-9 NOT-§15: `git diff main..HEAD -- "*auth*" "prisma/schema*"` shows only `prisma/schema.prisma` + (later) `auth.module.ts` if applicable (NOT applicable in this ticket; verify diff is clean)

### Regression test checklist

- 0 existing test files modified → no regression checklist items.

## 8. Error Response Format

Following the standard `HttpExceptionFilter` pattern (other modules):

| Scenario | Exception | HTTP | Body |
|----------|-----------|------|------|
| Slug collision on create | `ConflictException(ErrorMessages.tenants.SLUG_TAKEN)` | 409 | `{ statusCode: 409, message: "Tenant slug already in use", error: "Conflict" }` |
| Tenant not found on update | `NotFoundException(ErrorMessages.tenants.NOT_FOUND)` | 404 | `{ statusCode: 404, message: "Tenant not found", error: "Not Found" }` |
| Validation failure (DTO) | `BadRequestException` via class-validator pipe | 400 | Standard NestJS validation error shape |

## 9. Partial Update Support

`UpdateTenantDto = PartialType(CreateTenantDto)` — all fields optional. `TenantsService.update()` passes the DTO directly to `prisma.tenant.update({ data: dto })` — Prisma handles partial updates natively (only provided keys are updated).

## 10. Dependencies

- **External libraries**: NONE new — all already in use:
  - `@prisma/client` ^7.8.0
  - `@nestjs/common` (Injectable, exceptions, decorators)
  - `@nestjs/mapped-types` (PartialType)
  - `@nestjs/swagger` (ApiProperty)
  - `class-validator` (validators)
- **Tools**: `prisma migrate dev`, `prisma generate`, `nest build`, `jest`

## 11. Notes

- **NOT-§15**: touches `prisma/schema.prisma` — AUTH change-control applies. Branch follows code path (`feature/SCRUM-487-tenants-backend`). `/commit` requires separate review path per §15.3.3.
- **No new pip deps**: framework-side has no changes.
- **No skill version bumps**: `/plan` v1.1.0 (SCRUM-485) + `/audit` v1.1.0 + `/verify` v1.1.0 all untouched.
- **No VERSION bump**: framework stays at 0.15.0. This ticket modifies `em-ecosystem-code`, not the framework.
- **Performance**: bootstrap target < 30s. For environments with > 10k users, consider chunked INSERT (batch of 1000). Currently this is a near-instantaneous operation given current user count is small.
- **Privacy**: tenant `name` includes email local-part. Acceptable for a "default workspace" name; not a PII leak (it's the user's own data, displayed to them only).
- **No production deployment in this ticket** — migration runs in dev/staging; production rollout is operator-scheduled after `/commit` merge.

## 12. Next Steps After Implementation

- `/verify SCRUM-487` — apply ADR-008 4-step CI-equivalent norm. Expected verdict: PASS or PASS-WITH-DEBT (low deviation risk given tight scope).
- `/commit SCRUM-487` — PR to em-ecosystem-code repo. Expected PR # depends on em-ecosystem PR counter. Branch deletion + squash-merge per workflow-standards §2.
- `/update-docs SCRUM-487` — record + `integration-state.md` Module Registry update + program doc §6 + Jira transition to Done.
- **Sequence Phase 0**: SCRUM-487 done → SCRUM-488 (Prisma tenant-filter middleware) AND/OR SCRUM-489 (User.isPlatformAdmin) can start (both depend on this; can run in parallel).

## 13. Implementation Verification

- **Code Quality**:
  - TypeScript strict mode clean.
  - No `any` types in production code.
  - DTO validation decorators present.
  - `@Injectable()` on service; `@Module()` on module.
- **Functionality**:
  - 4 new models exist in DB (verified via `prisma studio` or `\dt` in psql).
  - All existing users have exactly one default tenant + OWNER membership.
  - TenantsService 4 methods work end-to-end (covered by unit tests).
- **Testing**:
  - Unit tests pass; coverage ≥85% on tenants.service.ts.
  - Existing test baseline preserved.
  - Migration idempotence verified.
- **Regression**:
  - 0 existing files semantically changed (only +1 import in app.module.ts, +1 line in User model for reverse relation).
  - `nest build` clean.
  - Lint clean.
- **Integration**:
  - TenantsService is injectable in any module (verified by writing a small consumer in tests or smoke-test in main.ts startup).
  - PrismaService correctly returns Tenant types after `prisma generate`.
- **Documentation**:
  - Deferred to `/update-docs` per Step N+1. data-model.md + integration-state.md + program doc.

## 14. Module-Level Planning (NexaCore new module)

- **Module Scope Assessment**: Creates a **new NexaCore-internal module** (`tenants`). Not a satellite app.
- **Entity Design** (4 new entities, not in the original 15 entity list from `data-model.md` — adds to the canonical list):
  - **Tenant**: top-level identity unit. Fields per §1 schema snapshot.
  - **TenantSettings**: 1:1 with Tenant. White-label config (branding, modules, authPolicy).
  - **TenantMembership**: User × Tenant join with role + status.
  - **TenantInvitation**: pending invitations to join a tenant.
- **Business invariants**:
  - Every Tenant has exactly one TenantSettings.
  - A User can be member of multiple Tenants (multiple TenantMemberships).
  - `(tenantId, userId)` is unique in TenantMembership (no duplicate memberships).
  - Tenant deletion cascades to children (settings + memberships + invitations).
  - Suspended/deleted Tenant prevents new memberships (enforced in later phases when business UX consumes this; not in this ticket).
- **API Surface**: NONE in this ticket. Future tickets will expose `/tenants/*` endpoints.
- **Cross-Module Dependencies**:
  - TenantsService depends on PrismaService (globally injectable).
  - No other module imports TenantsService in this ticket. Future consumers: AuthModule (Phase 1), permissions (Phase 1), every business module (when tenancy lands per entity).
- **Domain Events**: NONE emitted in this ticket. Future: `tenant.created`, `tenant.suspended`, `membership.created`, `membership.role_changed`, `invitation.sent`, `invitation.accepted`.
- **Transaction Boundaries**:
  - `TenantsService.create()` uses `$transaction()` to atomically create Tenant + TenantSettings (1:1 invariant).
- **PlatformModule Registration**: N/A — Tenant is the top-level container, not a per-project toggleable feature.
- **Permissions**: NONE seeded in this ticket. Tenant-scoped permissions are introduced in Phase 1.

## 15. Satellite App Planning

**N/A** — internal NexaCore module, not a satellite app.
