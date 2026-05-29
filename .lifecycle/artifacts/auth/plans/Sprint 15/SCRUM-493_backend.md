---
schema: ai-specs/schemas/plan.schema.yml
ticket: SCRUM-493
sprint: Sprint 15
scope: backend
module: auth
date: 2026-05-19
status: draft
last_completed_ticket: SCRUM-490
framework_version: 0.15.0
---

# Backend Implementation Plan: SCRUM-493 AUTH v2 Phase 1.2 — Opaque Refresh Tokens + `SessionsServiceV2` (tenant-aware)

## 1. Codebase State Snapshot

- **Date**: 2026-05-19
- **Last completed ticket**: SCRUM-490 (Backend coverage debt sweep, merged `6d80f66`). Main coverage at **91.00% statements + lines** with +1.0 pp margin above 90% threshold.
- **Integration state verified**: Yes (read header line confirms `Last update: SCRUM-490`)
- **Files verified against live code** (all read from `nexacore-api/`):
  - `prisma/schema.prisma:118-143` — `Session` model (v1, 13 fields incl. `tokenFamily`, `refreshTokenHash` (bcrypt), `isRevoked`, geolocation columns)
  - `prisma/schema.prisma:21-67` — `AuditAction` enum (47 values, ending at `TENANT_MEMBERSHIP_CREATED` line 66). New SESSION_V2_* values will be appended alphabetically/positionally — final lock at /develop time.
  - `prisma/schema.prisma:343-355` — `TenantRole` + `MembershipStatus` enums (TenantRole: OWNER/ADMIN/MEMBER/VIEWER/CUSTOM).
  - `src/sessions/sessions.service.ts:57-66` — constructor: 4 deps (prisma, auditService, geolocationService, tokenDenyListService via `forwardRef(() => TokenDenyListService)`).
  - `src/sessions/sessions.module.ts` — imports `[AuditModule, forwardRef(() => AuthModule)]`, providers `[SessionsService]`, exports `[SessionsService]`. PrismaModule NOT in imports (it's `@Global()`).
  - `src/auth/token.service.ts:48-56` — constructor: 7 deps (jwtService, sessionsService, usersService, tokenDenyListService, auditService, configService, loginSecurityService). Refresh expiration read at line 58-60 from `auth.jwtRefreshExpiration`.
  - `src/auth/auth.module.ts:109-116` — exports `[AuthService, TokenService, PasswordBreachService, TrustedDeviceService, TokenDenyListService]` (TokenServiceV2 NOT in exports — strangler-pattern invariant from SCRUM-492).
  - `src/auth/token.service.v2.ts:43-101` — Phase 1.1 reference: standalone `@Injectable` with single constructor dep (`JwtService`). All failure paths throw `UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED)`. `// WARNING: AUTH DOMAIN` header present.
  - `src/common/context/tenant-context.ts:36-68` — `TenantContext` public API: `run(tenantId, fn)`, `runWithBypass(reason, fn)`, `getActiveTenantId()`, `isBypassed()`, `getBypassReason()`, `getOrThrow()`. Backed by `AsyncLocalStorage`.
  - `src/common/interceptors/audit-bypass.helper.ts:29-43` — `auditAndRunBypass(audit, reason, ctx, fn)` writes `AuditAction.TENANT_FILTER_BYPASS` FIRST then runs `TenantContext.runWithBypass(reason, fn)`.
  - `src/audit/enums/audit-action.enum.ts:19-46` — confirms 1:1 mirror of Prisma enum. New SESSION_V2_* must mirror schema additions.
  - `src/config/auth.config.ts:5-6` — `jwtAccessExpiration: '15m'` (default), `jwtRefreshExpiration: '12h'` (default). **NOTE**: v1's effective TTL is 12h, NOT 7 days as the enriched ticket assumed. Plan locks at **same as v1 (12h)** per operator decision #2.
  - `prisma/migrations/20260519144836_invitation_audit_actions/migration.sql` — reference for standalone `ALTER TYPE "AuditAction" ADD VALUE 'X'` enum extension pattern (SCRUM-491 convention).
  - `src/tenants/tests/tenants.integration.spec.ts:1-7` — **reference integration spec pattern**: "real Controller + real Services with a mocked PrismaService + spy AuditService" — NOT a real DB. Critical refinement vs the enriched ticket's "mock-free" language.
  - `src/auth/tests/token.service.v2.spec.ts` (289 LOC) — Phase 1.1 reference spec idiom for standalone `Test.createTestingModule({ providers: [TokenServiceV2] })`.
- **Constructor signatures verified**: **`SessionsServiceV2` does not yet exist** (grep confirmed in src/). New class. Other classes unchanged: TokenService 7-dep + SessionsService 4-dep constructors untouched.
- **Methods verified to exist**: N/A — this plan introduces NEW methods on a NEW class; no integration points into existing v1 methods.
- **Guard dependency chain verified**: N/A — no `@UseGuards()` introduced (no HTTP surface).
- **Discrepancies with integration-state.md**: **None** (header confirms SCRUM-490 is the last update; live code matches).

### Plan-time decisions (operator-locked)

Locking the 5 open decisions from the enriched ticket:

| # | Decision | Locked value | Rationale |
|---|---|---|---|
| 1 | **Schema path** | **B — new `SessionV2` model** | Clean sunset at Phase 6 (single `DROP TABLE`); v1 + v2 share zero rows; matches the SCRUM-491 idiom of distinct tables for distinct concerns. |
| 2 | **Refresh token TTL** | **Same as v1: `auth.jwtRefreshExpiration` (default 12h)** | v2 isn't about TTL changes. Reusing the same ConfigService key keeps ops alignment + minimizes blast radius. |
| 3 | **Rotation semantics** | **Strict one-time-use** | Old refresh token is invalidated atomically inside the same transaction that mints the replacement. No grace window. |
| 4 | **Audit emission frequency** | **One row per state transition** | Same discipline as v1; defensible at scale (sessions are infrequent compared to access tokens). |
| 5 | **`tenantId` re-validation in `createSession`** | **No** | Caller (TokenServiceV2-adjacent v2 login orchestrator, Phase 2) has already validated membership. Re-validation duplicates work. |
| 6 (new) | **Module placement** | **`SessionsModule.providers[]` (NOT exported)** | File-system cohesion with v1 SessionsService. Test spec uses standalone `Test.createTestingModule` so no wiring on `SessionsModule` is needed at test time. Phase 1.3 will decide whether to export. |
| 7 (new) | **Test infrastructure** | **Mocked PrismaService + spy AuditService** (NOT real DB) | Refines the enriched ticket's aspirational "mock-free integration spec with real PrismaService". The repo doesn't currently have integration-DB infrastructure; SCRUM-491's spec follows the mocked-Prisma pattern and that's our canonical idiom. Atomicity of `validateAndRotate` (AC #4) becomes a unit-of-behavior assertion via mock call order, not a real-transaction proof. **Flag this as a documented limitation** at /verify time (Accepted-Quality if the user wants formal DB integration tests as a follow-up). |

### CI Gate Anticipation (per SCRUM-485 mandate)

This is em-ecosystem CI (Security Pipeline), NOT ai-specs CI:

| CI gate | Expected behavior |
|---|---|
| Layer 1: Secrets Detection | PASS / unchanged (opaque tokens generated at runtime; test fixtures use deterministic non-secret strings) |
| Layer 2: Dependency Audit (nexacore-api) | PASS / unchanged (`crypto.randomBytes` + `crypto.createHash` are Node builtins; **zero new deps**) |
| Layer 2: Dependency Audit (nexacore-dashboard) | PASS / unchanged (not touched) |
| Layer 3: SAST (Backend) | PASS — zero `process.env` direct reads; ErrorMessages constants only; zero `any` types in production code; new exception sites all use the canonical `AUTHENTICATION_FAILED` constant. |
| Layer 3: SAST (Frontend) | PASS / unchanged |
| **Layer 4: Tests (Backend)** | **PASS — first PR in the wave post-SCRUM-490 with comfortable coverage margin** (main 91.00% / 91.00% +1.0pp margin; +16 new tests on a heavily-testable infra service expected to ADD ~50–80 covered statements; net delta positive). |
| Layer 4: Tests (Frontend) | PASS / unchanged |
| Layer 5: Build (Backend) | PASS (gated by L4) |
| Layer 5: Build (Frontend) | PASS / unchanged |
| Security Gate (All Checks) | PASS (cascade from L4) |

**ai-specs CI** (not exercised by this ticket — em-ecosystem PR doesn't touch ai-specs):
- No new files under `ai-specs/changes/**` or `ai-specs/registers/**` (plan + verify + record handled by lifecycle commands at /plan, /verify, /update-docs respectively — all schema-routed automatically).

**Migration handling**: `prisma migrate dev` requires shadow DB CREATE; per SCRUM-487's Accepted-Trivial deviation the DB user lacks CREATE DATABASE. Apply via hand-written SQL migration file + `prisma migrate deploy`, byte-equivalent to what `migrate dev` would generate. **Pre-commit lock**: developer must run `npx prisma migrate deploy` against dev DB before staging the migration.

## 2. Regression Impact Analysis

- **Blast radius**: **0 production files modified**. This ticket adds NEW files only (NEW Prisma model + NEW service + NEW spec + NEW migration). Strangler invariant: v1 untouched.
- **Direct dependents of touched code**:
  - The 5 new `AuditAction.SESSION_V2_*` enum values: zero existing consumers (additive enum extension). v1 audit emission paths unchanged.
  - New `SessionV2` model: zero existing consumers. v1 `Session` model untouched.
  - New `SessionsServiceV2` class: zero production consumers (strangler invariant — AC #8). Spec file is the only importer.
- **Transitive dependents**:
  - `SessionsModule.providers[]` gains 1 entry — no effect on `SessionsModule.exports[]` consumers (AuthModule + v1 SessionsService consumers unchanged).
  - Prisma client regeneration on `migrate deploy` → all consumers of generated types continue to work (additive types).
- **Test dependents** (existing specs that may need re-running, NOT modifying):
  - `src/auth/tests/token.service.v2.spec.ts` — uses `JwtPayloadV2` (Phase 1.1); unchanged.
  - `src/sessions/tests/sessions.service.spec.ts` — unchanged (v1 untouched).
  - `src/tenants/tests/tenants.integration.spec.ts` — unchanged.
  - Full jest run will pick up the new `sessions.service.v2.spec.ts` automatically. No mock propagation needed.
- **Breaking changes identified**: **None**. No constructor signature changes, no method removals/renames, no DTO mutations, no module exports[] changes, no guard behavior changes.
- **API contract impact**: **None**. No HTTP endpoints added/modified/removed. `api-spec.yml` requires no update at /update-docs.
- **Schema migration impact**:
  - NEW `SessionV2` model with `tenantId String NOT NULL`. **No backfill needed** (v2 has zero existing rows at deploy time — first writes happen at Phase 1.3 when a consumer is wired).
  - NEW 5 enum values appended to `AuditAction`. Standalone `ALTER TYPE ... ADD VALUE` pattern (Prisma P3014 workaround per SCRUM-491 + SCRUM-488). **Forward-only** (PostgreSQL cannot remove enum values atomically; rollback = leave them as dead values, harmless).
- **Test files requiring updates**: **None**. Zero existing test files need provider updates (zero constructor changes; zero shared mock requirements introduced).
- **Blast radius size**: **0 production files affected · 0 test files affected**. Smallest possible blast radius — same shape as SCRUM-492.

## 3. Overview

Second sub-phase of Phase 1 of the AUTH v2 + Tenancy v1 program. Builds the **REFRESH** half of the v2 mint surface (Phase 1.1 / SCRUM-492 shipped the ACCESS half). Strangler-pattern: zero production consumers in this phase; v1 endpoints unchanged.

**Architecture principles applied**:
- **Defense in depth on the security primitive**: 256-bit CSPRNG (`crypto.randomBytes(32)`) → base64url plaintext → SHA-256 hash at rest. Opaque tokens carry zero payload (cannot be replayed cross-system the way JWT-format refresh can).
- **No failure-mode enumeration**: every failure path in `validateAndRotate` throws the SAME `UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED)` — matches Phase 1.1's discipline. Token-not-found, expired, already-rotated, hash-mismatch, tenant-mismatch all collapse to the single generic message.
- **Tenant-binding at session row level**: every row carries `tenantId` (NOT NULL). Mitigates MT-2 (CRITICAL).
- **One-time-use rotation**: enforced atomically inside `prisma.$transaction` — the OLD row is marked `isRevoked = true` in the same transaction that creates the NEW row.
- **Cross-tenant lookup pattern**: `validateAndRotate` doesn't know `tenantId` until it finds the row → wrap initial lookup in `TenantContext.runWithBypass('refresh-token-lookup-cross-tenant')` then `TenantContext.run(session.tenantId, ...)` for the transactional materialization (mirrors SCRUM-491's `invitation-token-lookup` pattern).
- **Strangler invariant**: enforced by acceptance criteria #8 + #9 (grep-checkable).

## 4. Architecture Context

- **Modules involved**:
  - `SessionsModule` (gains 1 new provider, `SessionsServiceV2`). `exports[]` **UNCHANGED**.
  - `PrismaModule` (no changes; provider already covers extended client via SCRUM-488's `useFactory`).
  - `AuditModule` (no changes; consumed unchanged).
- **Components affected** (all NEW):
  - 1 NEW Prisma model: `SessionV2` (+ regenerated client types).
  - 1 NEW NestJS provider: `SessionsServiceV2` (`@Injectable`).
  - 1 NEW migration: standalone `ALTER TYPE AuditAction ADD VALUE` + `CREATE TABLE session_v2`.
  - 5 NEW `AuditAction` enum values (mirror in `audit-action.enum.ts`).
  - 1 NEW spec file: `sessions.service.v2.spec.ts`.
- **Files referenced**:
  - `nexacore-api/prisma/schema.prisma` (MOD: +new model)
  - `nexacore-api/prisma/migrations/<timestamp>_session_v2_and_audit_actions/migration.sql` (NEW)
  - `nexacore-api/src/sessions/sessions.service.v2.ts` (NEW)
  - `nexacore-api/src/sessions/tests/sessions.service.v2.spec.ts` (NEW)
  - `nexacore-api/src/sessions/sessions.module.ts` (MOD: +1 provider in `providers[]`, NOT in `exports[]`)
  - `nexacore-api/src/audit/enums/audit-action.enum.ts` (MOD: +5 enum values)

## 5. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-493-backend` from latest `main`.
- **Branch Naming**: `feature/SCRUM-493-backend` (REQUIRED). Do NOT branch from another feature branch.
- **Implementation Steps**:
  1. `cd ~/projects/em-ecosystem && git checkout main && git pull origin main`.
  2. Confirm `git log --oneline -1` shows `6d80f66` (SCRUM-490 squash merge).
  3. `git checkout -b feature/SCRUM-493-backend`.
  4. `git branch --show-current` → `feature/SCRUM-493-backend`.
- **Notes**: Per `workflow-standards.mdc §2`. NEVER branch from another feature branch.

### Step 1: Add `SessionV2` Prisma model + extend `AuditAction` enum

- **File**: `nexacore-api/prisma/schema.prisma` (MOD).
- **Action**: Append a new `SessionV2` model. Append 5 new values to the `AuditAction` enum.
- **Implementation Steps**:
  1. Append AFTER the `Session` model (after line 143) — keeps v1 + v2 colocated:
     ```prisma
     /// Phase 1.2 / SCRUM-493 — v2 opaque-refresh session. Strangler-pattern:
     /// lives alongside v1 `Session`, zero production consumers in Phase 1.2.
     /// Sunsetting at Phase 6 = single `DROP TABLE`.
     model SessionV2 {
       id                String   @id @default(uuid())
       userId            String
       user              User     @relation("SessionV2User", fields: [userId], references: [id], onDelete: Cascade)
       tenantId          String
       /// @sensitive — SHA-256 hex of opaque refresh token. Deterministic hashing
       /// required because the @unique constraint cannot enforce uniqueness on
       /// bcrypt salted hashes. Plaintext returned ONCE on mint; never logged.
       refreshTokenHash  String   @unique
       isRevoked         Boolean  @default(false)
       ipAddress         String?
       userAgent         String?
       createdAt         DateTime @default(now())
       updatedAt         DateTime @updatedAt
       lastUsedAt        DateTime @default(now())
       expiresAt         DateTime

       @@index([userId])
       @@index([userId, tenantId])
       @@index([userId, tenantId, isRevoked])
       @@map("sessions_v2")
     }
     ```
  2. Update `User` model to add the reverse relation (mirroring v1's `Session` relation pattern):
     ```prisma
     // somewhere in the User model existing relations list:
     sessionsV2  SessionV2[]  @relation("SessionV2User")
     ```
  3. Append the 5 new enum values at the END of `AuditAction` (after `TENANT_MEMBERSHIP_CREATED` on line 66 — preserves alphabetical sub-clustering for SESSION_V2_*):
     ```prisma
     SESSION_V2_CREATED
     SESSION_V2_REFRESH_REJECTED
     SESSION_V2_REVOKED
     SESSION_V2_ROTATED
     SESSION_V2_TENANT_BULK_REVOKED
     ```
- **Implementation Notes**:
  - Schema diff is purely additive. Existing types regenerate cleanly.
  - Note `tenantId: String` (NOT `@relation` to `Tenant`): keeps `SessionV2` row decoupled from `Tenant` lifecycle. If a tenant is deleted, lingering session rows become orphan-but-harmless (next `validateAndRotate` will fail because cross-tenant membership lookup will return null). Symmetry with v1's `Session` which doesn't FK to tenant either.

### Step 2: Generate Prisma migration (hand-written SQL per SCRUM-487/491 convention)

- **File**: `nexacore-api/prisma/migrations/<timestamp>_session_v2_and_audit_actions/migration.sql` (NEW).
- **Action**: Hand-write migration SQL (since dev DB lacks shadow CREATE privileges per SCRUM-487 Accepted-Trivial). Byte-equivalent to what `migrate dev` would generate.
- **Implementation Steps**:
  1. Pick the timestamp: `YYYYMMDDhhmmss` matching the moment of `/develop` execution (e.g., `20260520010000`).
  2. Create the folder: `mkdir prisma/migrations/<timestamp>_session_v2_and_audit_actions`.
  3. Write `migration.sql`:
     ```sql
     -- AlterEnum
     ALTER TYPE "AuditAction" ADD VALUE 'SESSION_V2_CREATED';
     ALTER TYPE "AuditAction" ADD VALUE 'SESSION_V2_REFRESH_REJECTED';
     ALTER TYPE "AuditAction" ADD VALUE 'SESSION_V2_REVOKED';
     ALTER TYPE "AuditAction" ADD VALUE 'SESSION_V2_ROTATED';
     ALTER TYPE "AuditAction" ADD VALUE 'SESSION_V2_TENANT_BULK_REVOKED';

     -- CreateTable
     CREATE TABLE "sessions_v2" (
         "id" TEXT NOT NULL,
         "userId" TEXT NOT NULL,
         "tenantId" TEXT NOT NULL,
         "refreshTokenHash" TEXT NOT NULL,
         "isRevoked" BOOLEAN NOT NULL DEFAULT false,
         "ipAddress" TEXT,
         "userAgent" TEXT,
         "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
         "updatedAt" TIMESTAMP(3) NOT NULL,
         "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
         "expiresAt" TIMESTAMP(3) NOT NULL,

         CONSTRAINT "sessions_v2_pkey" PRIMARY KEY ("id")
     );

     -- CreateIndex
     CREATE UNIQUE INDEX "sessions_v2_refreshTokenHash_key" ON "sessions_v2"("refreshTokenHash");
     CREATE INDEX "sessions_v2_userId_idx" ON "sessions_v2"("userId");
     CREATE INDEX "sessions_v2_userId_tenantId_idx" ON "sessions_v2"("userId", "tenantId");
     CREATE INDEX "sessions_v2_userId_tenantId_isRevoked_idx" ON "sessions_v2"("userId", "tenantId", "isRevoked");

     -- AddForeignKey
     ALTER TABLE "sessions_v2" ADD CONSTRAINT "sessions_v2_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
     ```
  4. Run `npx prisma migrate deploy` against dev DB. Confirm exit 0.
  5. Run `npx prisma generate` to refresh client types (should be automatic on subsequent `npm install` but explicit is safer).
- **Implementation Notes**:
  - **Two ALTER TYPE in one transaction is allowed** in PostgreSQL 12+ (the SCRUM-491 migration had 6 in one file). Combined with CREATE TABLE → single migration is fine.
  - **Forward-only**: PostgreSQL cannot remove enum values atomically. If we later rip out v2 (Phase 6 sunset), the 5 SESSION_V2_* values stay as dead enum members — harmless because no code will reference them.
  - If `prisma migrate deploy` fails due to P3014 (shadow DB), the migration is already structured to bypass that (hand-written; `migrate deploy` doesn't need shadow DB — only `migrate dev` does).

### Step 3: Mirror new enum values in TS audit-action enum

- **File**: `nexacore-api/src/audit/enums/audit-action.enum.ts` (MOD).
- **Action**: Add 5 new enum values, mirroring the schema.prisma additions exactly (string values match member names — repo convention).
- **Implementation Steps**:
  1. Append at the END of the enum (after `TENANT_MEMBERSHIP_CREATED`):
     ```typescript
     SESSION_V2_CREATED = 'SESSION_V2_CREATED',
     SESSION_V2_REFRESH_REJECTED = 'SESSION_V2_REFRESH_REJECTED',
     SESSION_V2_REVOKED = 'SESSION_V2_REVOKED',
     SESSION_V2_ROTATED = 'SESSION_V2_ROTATED',
     SESSION_V2_TENANT_BULK_REVOKED = 'SESSION_V2_TENANT_BULK_REVOKED',
     ```
  2. Verify `nest build` exit 0 after.
- **Implementation Notes**: The TS enum mirror is the consumed type by `AuditService.log({ action: AuditAction.SESSION_V2_CREATED })`. Must mirror schema 1:1.

### Step 4: Implement `SessionsServiceV2`

- **File**: `nexacore-api/src/sessions/sessions.service.v2.ts` (NEW, ~150–200 LOC).
- **Action**: Create the v2 service class. Follow Phase 1.1's discipline.
- **Function Signatures**:
  ```typescript
  constructor(prisma: PrismaService, auditService: AuditService, configService: ConfigService)

  async createSession(input: CreateSessionV2Input): Promise<MintResult>
  async validateAndRotate(opaqueToken: string): Promise<RotateResult>
  async revokeAllForTenant(userId: string, tenantId: string): Promise<{ revokedCount: number }>
  async revokeSession(sessionId: string): Promise<void>

  private generateOpaqueToken(): string  // randomBytes(32).toString('base64url')
  private hashOpaqueToken(plain: string): string  // crypto.createHash('sha256').update(plain).digest('hex')
  private getRefreshTtlMs(): number  // parseDurationMs(configService.get('auth.jwtRefreshExpiration'))
  ```
- **Implementation Steps**:
  1. **File header** (mandatory per AUTH-domain convention, same as `token.service.v2.ts`):
     ```typescript
     // WARNING: AUTH DOMAIN — changes require Jira ticket + owner approval (see workflow-standards.mdc §15 Auth Change-Control)

     /**
      * SessionsServiceV2 — internal scaffolding for AUTH v2 + Tenancy v1 Phase 1.2.
      *
      * SCRUM-493. See ai-specs/changes/auth/programs/AUTH-v2.md §4 Phase 1 + §2.4.
      *
      * Strangler-pattern: v2 opaque-refresh session lifecycle. v1 SessionsService
      * untouched in production. Zero consumers exist for this class until Phase 1.3.
      *
      * Security primitives:
      * - 256-bit CSPRNG opaque tokens → base64url plaintext → SHA-256 hex at rest.
      * - One-time-use rotation enforced in the same prisma.$transaction.
      * - No failure-mode enumeration: every reject path throws the same
      *   UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED).
      */
     ```
  2. **Imports**:
     ```typescript
     import { createHash, randomBytes } from 'crypto';
     import { Injectable, UnauthorizedException } from '@nestjs/common';
     import { ConfigService } from '@nestjs/config';
     import { TenantRole } from '@prisma/client';
     import { PrismaService } from '../prisma/prisma.service';
     import { AuditService } from '../audit/audit.service';
     import { AuditAction } from '../audit/enums/audit-action.enum';
     import { TenantContext } from '../common/context/tenant-context';
     import { ErrorMessages } from '../common/constants/error-messages';
     import { parseDurationMs } from '../auth/utils/parse-duration';  // confirm file exists at /develop time
     ```
  3. **Interface declarations** (in same file, kept local — no `dto/` folder since these are internal types, not DTOs):
     ```typescript
     export interface CreateSessionV2Input {
       userId: string;
       tenantId: string;
       tenantRole: TenantRole;
       isPlatformAdmin: boolean;
       ipAddress?: string;
       userAgent?: string;
     }
     export interface MintResult {
       sessionId: string;
       refreshToken: string;  // plaintext, returned ONCE
       expiresAt: Date;
     }
     export interface RotateResult extends MintResult {
       userId: string;
       tenantId: string;
       tenantRole: TenantRole;
       isPlatformAdmin: boolean;
     }
     ```
  4. **`createSession` implementation**:
     - Generate opaque token + hash.
     - `prisma.sessionV2.create({ data: { userId, tenantId, refreshTokenHash, ipAddress, userAgent, expiresAt: now + ttl } })`.
     - Emit `AuditAction.SESSION_V2_CREATED` (metadata: `{ sessionId, tenantId, tenantRole, isPlatformAdmin }`).
     - Return `{ sessionId: created.id, refreshToken: plaintext, expiresAt: created.expiresAt }`.
     - **Caller passes `tenantRole + isPlatformAdmin` for audit context**; they're NOT stored on the SessionV2 row (canonical source is `TenantMembership` + `User.isPlatformAdmin`; storing duplicates would create drift).
  5. **`validateAndRotate` implementation** (the security-critical path):
     - Hash the incoming `opaqueToken`.
     - **Step 5a (cross-tenant lookup)**: wrap in `TenantContext.runWithBypass('session-v2-refresh-lookup', ...)`:
       ```typescript
       const session = await TenantContext.runWithBypass('session-v2-refresh-lookup', () =>
         this.prisma.sessionV2.findUnique({ where: { refreshTokenHash } })
       );
       ```
     - **Step 5b (gate)**: if `!session || session.isRevoked || session.expiresAt <= now`, audit `SESSION_V2_REFRESH_REJECTED` (metadata: `{ reasonClass: 'not-found' | 'revoked' | 'expired' }`, NOT exposed to caller) + throw the generic exception.
     - **Step 5c (rotation transaction)** inside `TenantContext.run(session.tenantId, ...)`:
       ```typescript
       const newPlaintext = this.generateOpaqueToken();
       const newHash = this.hashOpaqueToken(newPlaintext);
       const result = await this.prisma.$transaction(async (tx) => {
         // Atomic: revoke OLD + create NEW in same tx
         await tx.sessionV2.update({
           where: { id: session.id },
           data: { isRevoked: true, lastUsedAt: now },
         });
         const created = await tx.sessionV2.create({
           data: {
             userId: session.userId,
             tenantId: session.tenantId,
             refreshTokenHash: newHash,
             ipAddress: session.ipAddress,
             userAgent: session.userAgent,
             expiresAt: new Date(now.getTime() + this.getRefreshTtlMs()),
           },
         });
         return created;
       });
       ```
     - **Step 5d**: emit `AuditAction.SESSION_V2_ROTATED` (metadata: `{ oldSessionId: session.id, newSessionId: result.id, tenantId: session.tenantId }`).
     - **Step 5e**: fetch `tenantRole` + `isPlatformAdmin` for the return payload. Two queries: `prisma.tenantMembership.findUnique({ where: { userId_tenantId: ... } })` for role, `prisma.user.findUnique({ where: { id: session.userId }, select: { isPlatformAdmin: true } })` for flag. Both inside the `TenantContext.run(session.tenantId, ...)` scope already. If either lookup fails → audit `SESSION_V2_REFRESH_REJECTED` (`reasonClass: 'membership-stale'`) + throw generic.
     - **Step 5f**: return `RotateResult`.
  6. **`revokeSession(sessionId)`**:
     - `prisma.sessionV2.update({ where: { id: sessionId }, data: { isRevoked: true } })` — must be inside a tenant context OR use `runWithBypass('session-v2-direct-revoke')`. Decision: caller's responsibility to set context; the method runs whatever context the caller provides. If caller is in `runWithBypass`, the Prisma extension allows the cross-tenant update.
     - Emit `AuditAction.SESSION_V2_REVOKED` (metadata: `{ sessionId }`).
     - If `update` throws `P2025` (record not found), swallow silently — idempotent revoke matches v1 behavior.
  7. **`revokeAllForTenant(userId, tenantId)`**:
     - `prisma.sessionV2.updateMany({ where: { userId, tenantId, isRevoked: false }, data: { isRevoked: true } })`. Must be inside `TenantContext.run(tenantId, ...)` to satisfy the tenant-filter extension.
     - Emit `AuditAction.SESSION_V2_TENANT_BULK_REVOKED` (metadata: `{ userId, tenantId, revokedCount: result.count }`).
     - Return `{ revokedCount: result.count }`.
- **Implementation Notes**:
  - **No `forwardRef` needed** — `SessionsServiceV2` has 3 standard deps (`PrismaService`, `AuditService`, `ConfigService`). All three are available globally without cycle risk.
  - **No `TokenDenyListService` injection** — v2 opaque tokens are revoked by row deletion/flag, not by Redis deny-list. This is a deliberate divergence from v1 (which uses deny-list for instant jti-level revocation).
  - **`parseDurationMs` utility** lives at `src/auth/utils/parse-duration.ts` (referenced by v1 `TokenService:61`). Confirm path at /develop time; if it's moved, follow the import.

### Step 5: Register `SessionsServiceV2` in `SessionsModule`

- **File**: `nexacore-api/src/sessions/sessions.module.ts` (MOD).
- **Action**: Add to `providers[]`. Do NOT add to `exports[]`.
- **Implementation Steps**:
  1. Import: `import { SessionsServiceV2 } from './sessions.service.v2';`
  2. Add to `providers[]`: `providers: [SessionsService, SessionsServiceV2]`.
  3. **`exports[]` MUST remain unchanged**: only `SessionsService` (v1) stays exported.
- **Implementation Notes**: After this, `git diff main -- src/sessions/sessions.module.ts` shows exactly 2 lines added (1 import + 1 providers entry). Zero changes to imports[] or exports[].

### Step 6: Write `sessions.service.v2.spec.ts` (mocked Prisma + spy AuditService)

- **File**: `nexacore-api/src/sessions/tests/sessions.service.v2.spec.ts` (NEW, estimated ~350 LOC).
- **Action**: Standalone `Test.createTestingModule` with `SessionsServiceV2` + mocked `PrismaService` + spy `AuditService` + real `ConfigService`. Mirrors the SCRUM-491 integration-spec idiom (`tenants/tests/tenants.integration.spec.ts`).
- **Implementation Steps**:
  1. Standalone testing module setup:
     ```typescript
     beforeEach(async () => {
       const moduleRef = await Test.createTestingModule({
         providers: [
           SessionsServiceV2,
           { provide: PrismaService, useValue: prismaMock },
           { provide: AuditService, useValue: { log: jest.fn() } },
           { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('12h') } },
         ],
       }).compile();
       service = moduleRef.get(SessionsServiceV2);
       audit = moduleRef.get(AuditService);
     });
     ```
  2. **`prismaMock` shape** — function mocks for the 4 used calls:
     ```typescript
     const prismaMock = {
       sessionV2: {
         create: jest.fn(),
         findUnique: jest.fn(),
         update: jest.fn(),
         updateMany: jest.fn(),
       },
       tenantMembership: { findUnique: jest.fn() },
       user: { findUnique: jest.fn() },
       $transaction: jest.fn(async (cb) => cb(prismaMock)),  // pass-through
     };
     ```
  3. **Test coverage** (target: ~18+ tests, lines coverage ≥ 95% on the service):
     - **describe('createSession')** — 3 tests:
       - mints with all input fields → calls `prisma.sessionV2.create` with correct shape; emits `SESSION_V2_CREATED`; returns `{ sessionId, refreshToken, expiresAt }` with token = 43-char base64url.
       - two consecutive mints produce different `refreshTokenHash` values.
       - `expiresAt` is `now + 12h` (within ±2s).
     - **describe('validateAndRotate — happy path')** — 4 tests:
       - valid token → finds session via `findUnique({ refreshTokenHash })`, marks old `isRevoked=true`, creates new row, emits `SESSION_V2_ROTATED`, returns RotateResult with NEW plaintext.
       - rotation is wrapped in `prisma.$transaction` (assert mock was called once).
       - returned `tenantRole` matches `tenantMembership.findUnique` mock value.
       - returned `isPlatformAdmin` matches `user.findUnique` mock value.
     - **describe('validateAndRotate — rejection paths')** — 5 tests, all emit `SESSION_V2_REFRESH_REJECTED` with the reason class in metadata AND all throw the SAME `UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED)`:
       - token not found (`findUnique` returns null) → `reasonClass: 'not-found'`.
       - token already revoked (`session.isRevoked: true`) → `reasonClass: 'revoked'`.
       - token expired (`session.expiresAt < now`) → `reasonClass: 'expired'`.
       - membership lookup returns null (`tenantMembership.findUnique` returns null) → `reasonClass: 'membership-stale'`.
       - exception message is bit-identical across all 5 cases (no enumeration).
     - **describe('revokeSession')** — 2 tests:
       - revokes existing session → calls `prisma.sessionV2.update({ where: { id }, data: { isRevoked: true } })` + emits `SESSION_V2_REVOKED`.
       - swallows `P2025` (record-not-found) silently → no throw, no audit emission.
     - **describe('revokeAllForTenant')** — 2 tests:
       - happy path → `updateMany` with `{ userId, tenantId, isRevoked: false }`; returns `{ revokedCount }`; emits `SESSION_V2_TENANT_BULK_REVOKED`.
       - zero matches → returns `{ revokedCount: 0 }`; STILL emits the audit (consistent with v1 audit-on-attempt discipline).
     - **describe('tenant-context invariants')** — 2 tests:
       - `validateAndRotate` enters `TenantContext.runWithBypass('session-v2-refresh-lookup', ...)` for the initial lookup (assert via TenantContext.getBypassReason() inside the prisma mock).
       - `validateAndRotate` post-lookup runs the rotation in `TenantContext.run(session.tenantId, ...)` (assert via TenantContext.getActiveTenantId() inside the prisma `$transaction` mock).
- **Implementation Notes**:
  - The `$transaction` mock above passes the prisma mock as the tx — that's deliberately simplistic. The atomicity guarantee (revoke-old + create-new in one tx) is verifiable by **assertion order on the mock**: `sessionV2.update` (revoke) must be called BEFORE `sessionV2.create` (mint), both inside the `$transaction` callback. This is "atomicity of intent" testing, not real-DB atomicity — flagged as documented limitation in /verify.
  - Spec is **mock-based**, NOT mock-free. Refines the enriched ticket's aspirational language. AC #6 in the ticket text mentions "mock-free" — that needs to be adjusted at /verify time (Accepted-Trivial deviation: chose the canonical integration-spec idiom from SCRUM-491 instead).

### Step 7: Build, lint, jest verification

- **File**: N/A (verification only).
- **Action**: Confirm the implementation compiles + passes locally before staging.
- **Implementation Steps**:
  1. `cd nexacore-api && npm run build` → exit 0 (catches Prisma client regen issues + DI typing).
  2. `npx jest --maxWorkers=1 --forceExit --testPathPattern='sessions.service.v2'` → 18+ tests pass.
  3. Full project: `npx jest --maxWorkers=1 --forceExit` → 1279 + N new = ~1297 tests pass, zero failures.
  4. Coverage check: `npx jest --coverage --maxWorkers=1 --forceExit` → global ≥ 90.5% maintained; `sessions.service.v2.ts` ≥ 95% lines.
  5. ESLint: `npx eslint src/sessions/sessions.service.v2.ts src/sessions/tests/sessions.service.v2.spec.ts --fix`.
  6. Grep strangler invariant: `grep -rn "SessionsServiceV2" src/` MUST return exactly: declaration file + providers[] entry in sessions.module.ts + the spec file. **Anything else = AC #8 violation**.

### Step 8: Update Technical Documentation

- **Action**: Per `documentation-standards.mdc`, the post-merge update happens at `/update-docs`. No spec files modified IN this branch (deferred-by-design, matching SCRUM-487 / 491 / 492 wave convention).
- **Implementation Steps**:
  1. **NOT in this branch**: ai-specs/specs/integration-state.md Changelog row + Service Dependency Chains entry (`SessionsServiceV2 → PrismaService, AuditService, ConfigService [SCRUM-493 — Phase 1.2]`) + Module Registry annotation (`SessionsModule providers: ..., SessionsServiceV2 [SCRUM-493 internal-only]`).
  2. **NOT in this branch**: ai-specs/changes/auth/programs/AUTH-v2.md §6 Phase 1.2 row mark complete + Phase 1 umbrella row update + Next milestone footer update to Phase 1.3.
  3. **Updated by /update-docs**: data-model.md (NEW SessionV2 entity entry), api-spec.yml UNCHANGED (no endpoints).
- **Notes**: All documentation updates land via `/update-docs` after the em-ecosystem PR merges.

## 6. Implementation Order

1. Step 0: Create feature branch.
2. Step 1: Append `SessionV2` model + 5 enum values in `schema.prisma`.
3. Step 2: Write migration SQL + run `prisma migrate deploy`.
4. Step 3: Mirror 5 enum values in `audit-action.enum.ts`.
5. Step 4: Implement `SessionsServiceV2` class (~150-200 LOC).
6. Step 5: Register in `SessionsModule.providers[]` (NOT exports[]).
7. Step 6: Write `sessions.service.v2.spec.ts` (~350 LOC, 18+ tests).
8. Step 7: Build + lint + jest + coverage + grep verification.
9. Step 8: Documentation deferred-by-design to `/update-docs`.

Then: `/verify SCRUM-493` → `/commit SCRUM-493` → `/update-docs SCRUM-493`.

## 7. Testing Checklist

- [ ] `npm run build` exit 0 (Prisma client regens cleanly; DI compiles).
- [ ] `npx jest --testPathPattern='sessions.service.v2'` → 18+ pass.
- [ ] Full project: `npx jest --maxWorkers=1 --forceExit` → ~1297 pass, 0 fail.
- [ ] Coverage on `sessions.service.v2.ts` ≥ 95% statements + lines.
- [ ] Global coverage stays ≥ 90% (margin from SCRUM-490 protects this).
- [ ] ESLint clean on both new files.
- [ ] Grep invariant: `SessionsServiceV2` referenced ONLY in 3 files (decl + module providers entry + spec).
- [ ] `git diff main -- src/sessions/sessions.service.ts` returns empty (v1 untouched).
- [ ] `git diff main -- src/sessions/sessions.module.ts` shows ONLY +1 import + +1 providers entry (zero changes to imports[] / controllers[] / exports[]).
- [ ] No new `process.env` reads (config goes through `ConfigService` only).
- [ ] All `UnauthorizedException` instances use `ErrorMessages.auth.AUTHENTICATION_FAILED` (no inline strings).

**Regression test checklist** (from §2 — empty):

| File from blast radius | Updated? | Why |
|---|---|---|
| (none — zero production blast radius) | N/A | New surface only; v1 untouched |

## 8. Error Response Format

**N/A** — no HTTP endpoints. All errors are programmatic exceptions (`UnauthorizedException`) thrown from `SessionsServiceV2.validateAndRotate` for future callers (Phase 1.3 will wrap in a controller).

When Phase 1.3 wraps in HTTP, the global `HttpExceptionFilter` will produce the standard JSON response with `statusCode: 401`. That's NOT this ticket's concern.

## 9. Dependencies

- **Node stdlib only**: `crypto.randomBytes`, `crypto.createHash`. No new deps.
- **Existing deps used**: `@nestjs/common`, `@nestjs/config`, `@prisma/client` (after regeneration with new model).
- **Zero `package.json` edits**.

## 10. Notes

- **English only** in all code + comments + spec test names (per `base-standards.mdc`).
- **Strangler invariant is THE acceptance criterion**. Grep `SessionsServiceV2` in src/ after every commit on this branch — if more than 3 references show up (decl + provider + spec), an unintended consumer was added. Stop and revert.
- **No `JwtV2Strategy` here** — Phase 1.3 only.
- **No HTTP surface here** — Phase 1.3 only.
- **No frontend touch** — `nexacore-dashboard/**` is zero-diff.
- **§15 AUTH change-control applies**: PR will touch `src/auth/**` (audit enum mirror file) AND `src/sessions/**` (new service + module wiring) AND `prisma/schema.prisma` (new model + enum) AND `prisma/migrations/**` (new migration). Per `workflow-standards.mdc §15.3.3`, **single-domain AUTH** (sessions are AUTH-domain per program doc §15.1) → no split-PR required, but mandatory §15 review path + §12 Rollback Playbook in the record.
- **CODEOWNERS** will auto-route AUTH reviewers based on `src/auth/**` + `src/sessions/**` + `prisma/schema.prisma` touch patterns.

## 11. Next Steps After Implementation

- `/verify SCRUM-493`: confirm strangler invariant + atomicity-of-intent in spec + zero production v1 modification. Flag the "mocked-Prisma vs enriched-ticket-promised-mock-free" deviation as Accepted-Trivial.
- `/commit SCRUM-493`: expect **one-shot CI green** (post-SCRUM-490 coverage margin protects Layer 4; +18 tests on new infra add covered statements). If CI fails on Layer 4 again, the SCRUM-490 sweep was insufficient — return to add more tests OR investigate.
- `/update-docs SCRUM-493`: AUTH-v2.md §6 Phase 1.2 row marked complete + Next milestone updated to Phase 1.3 (JwtV2Strategy + first consumer endpoint). integration-state.md Module Registry + Service Dependency Chains + Changelog row.
- **Phase 1.3 unblocked**: it can now wire `SessionsServiceV2` + `TokenServiceV2` together behind a `/v2/auth/refresh` endpoint with a `JwtV2Strategy`.

## 12. Implementation Verification

- **Code Quality**: NEW service follows Phase 1.1 (`token.service.v2.ts`) discipline byte-for-byte (file header, no-enumeration, ErrorMessages constant, deterministic crypto choices).
- **Functionality**: 4 public methods cover the mint-rotate-revoke lifecycle. Spec exercises every decorator path + every failure branch.
- **Testing**: spec mirrors SCRUM-491's tenants.integration.spec.ts idiom (mocked Prisma + spy AuditService).
- **Regression**: blast radius empty — only green CI to verify.
- **Integration**: SessionsModule.providers[] +1 entry, exports[] unchanged → zero existing consumers affected.
- **Documentation**: deferred-by-design to `/update-docs`.

## 13. Open considerations for /develop time

1. **Path of `parseDurationMs`** — referenced by v1 TokenService at line 61 but may live in a util folder. Confirm path: `find src -name "parse-duration.ts"`. If absent, inline a small helper in `sessions.service.v2.ts`.
2. **Whether to inject `User.findUnique` and `TenantMembership.findUnique`** vs. accepting `tenantRole + isPlatformAdmin` from caller in `validateAndRotate`. Plan recommends the former (canonical source) — but if the lookups are expensive at scale, Phase 2 may revisit. Lock at /develop: do the lookups.
3. **`expiresAt` precision** — `Date()` arithmetic vs `parseDurationMs` returning ms. The `ms` library (already used elsewhere for `StringValue` types) is the canonical parser. Confirm import path at /develop.
4. **Index strategy** — the 3 indices in Step 1 (`userId`, `userId+tenantId`, `userId+tenantId+isRevoked`) cover the 4 query paths. `refreshTokenHash` is `@unique` (auto-indexed). If Phase 1.3 introduces a fifth query path (e.g., paginated listing of all sessions across tenants for a platform-admin endpoint), a new index is additive — defer.
