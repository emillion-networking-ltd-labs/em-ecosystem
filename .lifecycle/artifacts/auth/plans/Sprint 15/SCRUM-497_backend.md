---
schema: ai-specs/schemas/plan.schema.yml
ticket: SCRUM-497
sprint: Sprint 15
scope: backend
module: auth
date: 2026-05-21
status: draft
last_completed_ticket: SCRUM-495
framework_version: 0.15.0
---

# Backend Implementation Plan: SCRUM-497 AUTH v2 Phase 2.2 — `AuthIntent` state machine (`POST /v2/auth/intents` + `POST /v2/auth/intents/:id/advance`)

## 1. Codebase State Snapshot

- **Date**: 2026-05-21
- **Last completed ticket**: SCRUM-495 (Phase 2.1 — Organization model + SubdomainTenantResolverMiddleware, merged `ee3f1ca`). Main coverage at **91.03% statements + lines** with +1.03 pp margin above 90% threshold. **Phase 0 + Phase 1 + Phase 2.1 of AUTH v2 program are COMPLETE.**
- **Integration state verified**: Yes (header reads `Last update: SCRUM-495`).
- **Files verified against live code** (all read from `nexacore-api/`):
  - `prisma/schema.prisma:20-76` — `enum AuditAction` has 55 values; last entry is `SUBDOMAIN_RESOLUTION_FAILED` (SCRUM-495). Will append 5 new values; remember SCRUM-495 Accepted-Trivial #1 (the 3-location pitfall: schema.prisma enum block + TS mirror + migration SQL `ALTER TYPE` all required).
  - `prisma/schema.prisma:83-127` — `User` model: has `organizationMemberships OrganizationMembership[]` relation (Phase 2.1) + `memberships TenantMembership[]` (Phase 0.1). No `authIntents` reverse relation today.
  - **`AuthIntent` Prisma model does NOT exist** — grep `AuthIntent` across `src/` returns 3 forward-reference docstrings (`src/auth/interfaces/jwt-payload-v2.interface.ts:19`, `src/tenants/tenants.module.ts:26`, `src/tenants/tenants.service.ts:87`) but **no model, no service, no controller**.
  - `src/auth/auth.module.ts` — current: 8 modules imported, 7 controllers (`AuthController`, `AuthV2Controller`, `OAuthController`, `AccountController`, `SessionController`, `MfaController`, `PasskeyController`), 22 providers, 5 exports (`AuthService`, `TokenService`, `PasswordBreachService`, `TrustedDeviceService`, `TokenDenyListService`).
  - `src/auth/auth-v2.controller.ts:55-62` — `AuthV2Controller(tokenServiceV2: TokenServiceV2, sessionsServiceV2: SessionsServiceV2, configService: ConfigService)` (3 deps). Hosts `POST /auth/v2/refresh`. Pattern to mirror: ApiTags 'Auth v2'; no class-level @UseGuards; Throttle decorator per method; ConfigService used for `app.isProduction` + parseDurationMs.
  - `src/auth/token.service.v2.ts:46-49` — `TokenServiceV2(jwt: JwtService)` (1 dep). `mintAccessToken(input: MintAccessTokenInput)` where `MintAccessTokenInput = { userId, sessionId, tenantId, tenantRole, isPlatformAdmin }`. Returns `string` (the access token).
  - `src/sessions/sessions.service.v2.ts:62-66` — `SessionsServiceV2(prisma: PrismaService, auditService: AuditService, configService: ConfigService)` (3 deps). `createSession(input: CreateSessionV2Input): Promise<MintResult>` where `CreateSessionV2Input = { userId, tenantId, tenantRole, isPlatformAdmin, ipAddress?, userAgent? }` and `MintResult = { sessionId, refreshToken, expiresAt }`. Internal scaffolding before SCRUM-494; EXPORTED from SessionsModule as of Phase 1.3.
  - `src/auth/login.service.ts:102` — `executeLogin(dto: LoginDto, requestMeta, ctx?, fingerprint?)` is the procedural v1 login this ticket replaces (strangler — v1 stays bit-identical).
  - `src/auth/mfa.service.ts:140-144` — `verifyLoginCode(mfaToken: string, code?: string, recoveryCode?: string): Promise<{ user: User }>` is the v1 MFA gate. v2 will NOT reuse the JWT-based `mfaToken` indirection (the AuthIntent id IS the challenge anchor). v2 MFA verification will inline the `otpVerify` + recovery-code check from MfaService logic OR delegate to a new helper method.
  - `src/tenants/tenants.service.ts:150-160` — `findFirstActiveMembership(userId): Promise<TenantMembership | null>` exists (used by `TenantContextInterceptor`). For Phase 2.2 we need ALL active memberships (not just first) — will inline a `prisma.tenantMembership.findMany({ where: { userId, status: 'active' } })` query in `AuthIntentService` (lightweight; no new TenantsService method needed).
  - `src/audit/audit.service.ts:13` — `async log(entry: AuditLogEntry): Promise<void>` accepts `{ action, userId?, targetUserId?, ipAddress?, userAgent?, metadata? }` — same shape SCRUM-493/494/495 use. Note: `organizationId` exists on the Prisma model (SCRUM-495) but is NOT yet on `AuditLogEntry` interface or written by `AuditService.log` — AuthIntent does NOT need to populate it (deferred to a later "audit interface expansion" ticket).
  - `src/audit/interfaces/audit-log-entry.interface.ts` — confirmed shape above.
  - `src/auth/constants/auth.constants.ts:70-82` — `AUTH_RATE_LIMITS.login = { ttl: 60_000, limit: 10 }`. Will reuse for both `/auth/v2/intents` (POST create) and `/auth/v2/intents/:id/advance` (POST advance). Also has `REFRESH_TOKEN_COOKIE_NAME_V2 = 'refresh_token_v2'` (SCRUM-494).
  - `src/auth/utils/jwt-payload-v2.guard.ts` — `isValidV2Payload` single source of truth for v2 shape (Phase 1.3). Not modified by this ticket.
  - `src/common/context/tenant-context.ts` — `TenantContext.run / runWithBypass` exist (Phase 0.2). AuthIntent will need `TenantContext.runWithBypass('auth-intent-resolution')` for the unauthenticated lookup window AND `TenantContext.run(tenantId, ...)` once `requires_tenant_pick` resolves.
  - `src/common/constants/error-messages.ts:2-5` — `ErrorMessages.auth.AUTHENTICATION_FAILED = 'Authentication failed'`. Single throw site constant. No new `ErrorMessages.authIntent.*` namespace needed (reuse `auth.AUTHENTICATION_FAILED` per no-failure-mode-enumeration discipline).
  - `src/config/app.config.ts:1-16` — `appConfig` factory: 6 keys today (`nodeEnv, frontendUrl, oauthAllowedRedirectUrls, isProduction, platformAdminSubdomain`). Pattern to follow for the 2 new keys.

- **Constructor signatures verified**:
  - **NEW** `AuthIntentService(prisma: PrismaService, auditService: AuditService, tokenServiceV2: TokenServiceV2, sessionsServiceV2: SessionsServiceV2, mfaService: MfaService, usersService: UsersService, configService: ConfigService)` — **7 deps**. Reusing existing primitives; no new dependencies introduced beyond what AuthModule already provides.
    - Note: `MfaService` is currently DI-resolvable in AuthModule (it's a provider). `UsersService` is exported from UsersModule which AuthModule already imports (forwardRef).
  - **NEW** `AuthIntentController(authIntentService: AuthIntentService, configService: ConfigService)` — **2 deps**. ConfigService used to read `app.authIntentV2Enabled` for the early-404 gate.
  - **UNCHANGED** `AuthV2Controller(tokenServiceV2, sessionsServiceV2, configService)` — 3 deps. Phase 2.2 does NOT modify this class.
  - **UNCHANGED** `TokenServiceV2(jwt)` — 1 dep. Used as-is via `mintAccessToken`.
  - **UNCHANGED** `SessionsServiceV2(prisma, auditService, configService)` — 3 deps. Used as-is via `createSession`.

- **Methods verified to exist**:
  - `tokenServiceV2.mintAccessToken(input)` at `src/auth/token.service.v2.ts:53`. Returns `string`.
  - `sessionsServiceV2.createSession(input)` at `src/sessions/sessions.service.v2.ts:72`. Returns `MintResult`.
  - `mfaService.verifyLoginCode(mfaToken, code?, recoveryCode?)` at `src/auth/mfa.service.ts:140` — **CANNOT be reused as-is** because v2 doesn't have an `mfaToken` JWT; the AuthIntent id IS the challenge. v2 MFA gate will inline `otpVerify` from `@otplib/preset-default` (used by `mfa.service.ts`) OR add a private helper.
  - `usersService.findById(userId)` at `src/users/users.service.ts:findById` — exists (verified by grep). v2 credentials gate uses it.
  - `usersService.findByEmail(email)` — exists, v1 LoginService line 109 uses it.
  - `tenantsService.findFirstActiveMembership(userId)` at `src/tenants/tenants.service.ts:150`. AuthIntent does NOT reuse this directly — needs `findMany` instead.
  - `auditService.log(entry)` at `src/audit/audit.service.ts:13`. Standard.
  - `TenantContext.run(tenantId, fn)` + `TenantContext.runWithBypass(reason, fn)` at `src/common/context/tenant-context.ts`. Standard primitives.

- **Guard dependency chain verified**: N/A — `AuthIntentController` does NOT use `@UseGuards()`. No guards are constructed for this ticket. The intent itself IS the auth state.

- **Discrepancies with integration-state.md**: **None** (header confirms SCRUM-495 last; live code matches).

### Plan-time decisions

Operator-locked from `/enrich-us` [enhanced] (6 decisions D1-D6):

| # | Decision | Locked value |
|---|---|---|
| D1 | Persistence | Prisma `AuthIntent` model (NOT Redis). TTL-bounded rows via expiresAt + lazy expiry check. |
| D2 | Expiry | 15 min default (15 × 60_000 = 900_000 ms). Configurable via `app.authIntentTtlMs`. |
| D3 | Garbage collection | On-the-fly expiry check in `advance()` (compare `expiresAt < now()`); lazy flip to `failed` status if expired (write audit `AUTH_INTENT_EXPIRED` once). Nightly sweep job DEFERRED to Phase 6. |
| D4 | Replay protection | `GoneException` (410) on `advance()` if `intent.status ∈ {succeeded, failed, expired}` — terminal states. No idempotent caching. |
| D5 | Subdomain auto-resolution | YES — if `TenantContext.getActiveTenantId()` is set by middleware AND that tenantId appears in user's active memberships, `requires_tenant_pick` auto-resolves to `succeeded` (or `requires_mfa` if MFA still pending — depends on credential-gate ordering, see Step 6.4). |
| D6 | Feature flag | `app.authIntentV2Enabled` config key + `AUTH_INTENT_V2_ENABLED` env var. Default `false` in prod, `true` in CI/test. |

**Plan-time decisions resolved here** (per SCRUM-495 #6/#7 precedent — slots reserved at /enrich-us):

| # | Decision | Locked value | Rationale |
|---|---|---|---|
| A | Feature flag mechanism (D6 implementation) | **Controller registered unconditionally + private `assertEnabled()` helper called at the top of every endpoint method that throws `NotFoundException` if flag off.** | Simplest NestJS-canonical pattern. Dynamic-module-forRoot was rejected because it would force every test module to pass `{ enabled }` explicitly (high friction). Per-method check has one drawback (small repetition) but keeps the test surface uniform. Returns 404 (not 503) when disabled to mimic "endpoint doesn't exist", consistent with SCRUM-495's `RESERVED_SUBDOMAINS → 404` pattern. |
| B | `advance()` DTO shape | **Single discriminated-union DTO with `kind` discriminator** (`{kind: 'credentials', email, password}` \| `{kind: 'mfa', code}` \| `{kind: 'tenant_pick', tenantId}` \| `{kind: 'passkey', assertion}` — passkey shape declared for Phase 3 forward-compat, transition unwired). class-validator + `@Type` with discriminator handles it. ValidationPipe rejects unknown `kind`. | Program doc §4 explicitly says "POST /v2/auth/intents/:id/advance" — single endpoint. Per-kind sub-endpoints rejected (breaks the "single advance" semantic). |
| C | v2 MFA gate implementation | **Inline `otpVerify` + recovery-code matching in `AuthIntentService.advanceMfa()` private method** (do NOT reuse `MfaService.verifyLoginCode` because that method requires an `mfaToken` JWT v1 doesn't apply to v2). However, **DO reuse** `MfaService`'s `cryptoService.decrypt` call for the MFA secret + the recovery-code matching helper. Inject `MfaService` into `AuthIntentService` constructor so the private decrypt/match helpers can be invoked. | v1 `mfaToken` is a JWT — v2's AuthIntent.id is its replacement. Wiring v2 to expect a v1 mfaToken creates impossible-to-maintain coupling. Inlining keeps the strangler invariant. |
| D | Single-tenant short-circuit | **YES** — if user has exactly one active membership AND no MFA required AND no subdomain auto-resolution conflict, transitions `requires_credentials → succeeded` directly (skipping `requires_tenant_pick`). Most users in MVP are single-tenant. | Avoids unnecessary round-trip for single-tenant users. Multi-tenant users still get `requires_tenant_pick`. |
| E | Status enum value choice for "expired" | **Add `expired` as 8th status value** (program §2.1 lists 7 statuses; expired is implicit but should be explicit for clean audit trail + state-machine determinism). | Lazy expiry flip needs a distinct status from `failed` so audit queries can distinguish "user gave up" from "user gave wrong creds". Status enum becomes: `requires_credentials, requires_tenant_pick, requires_mfa, requires_passkey, requires_setup, succeeded, failed, expired`. The 7→8 expansion is documented in this plan as decision E. |

### CI Gate Anticipation (per SCRUM-485 mandate — em-ecosystem Security Pipeline)

| CI gate | Expected behavior |
|---|---|
| Layer 1: Secrets Detection | PASS / unchanged |
| Layer 2: Dependency Audit (nexacore-api) | PASS / unchanged. **Zero new deps** — Node stdlib + existing Prisma + `@nestjs/common` + `class-validator` (existing). |
| Layer 2: Dependency Audit (nexacore-dashboard) | PASS / unchanged (not touched). |
| Layer 3: SAST (Backend) | PASS — no `process.env` direct reads (`ConfigService` only); ErrorMessages.auth.AUTHENTICATION_FAILED single constant; no `any` in production code; no new `@Public` decorators; no new `ForbiddenException` (404 + 410 only). |
| Layer 3: SAST (Frontend) | PASS / unchanged. |
| **Layer 4: Tests (Backend)** | **PASS** — ~34 new tests on heavily-testable surface (state-machine driver + controller). Existing test files require NO modifications (no constructor signatures change on existing classes; AuthModule's `controllers[]` and `providers[]` arrays just gain new entries). Main coverage 91.03% baseline. |
| Layer 4: Tests (Frontend) | PASS / unchanged. |
| Layer 5: Build (Backend) | PASS (gated by L4); DI bootstrap of `AppModule` must remain clean (new service with 7 deps + new controller with 2 deps; all resolvable through existing module imports). |
| Layer 5: Build (Frontend) | PASS / unchanged. |
| Security Gate (All Checks) | PASS (cascade). |

**Migration handling**: 1 new Prisma migration `<timestamp>_phase_2_2_auth_intent` (additive: NEW model + NEW enum + 5 new ALTER TYPE on AuditAction; no column adds on existing tables, no NOT NULL adds). Hand-written SQL per the SCRUM-487/491/493/495 convention. Run `npx prisma migrate deploy` against dev DB + `npx prisma generate` (the second step is critical per SCRUM-493 lesson). Remember `rm -rf node_modules/.prisma` if generate cache becomes stale.

**ai-specs CI**: not exercised by this ticket — em-ecosystem PR does not touch ai-specs. Plan + verify + record handled by lifecycle commands.

## 2. Regression Impact Analysis

- **Blast radius**:
  - **Direct dependents — files MODIFIED in this ticket**:
    - `prisma/schema.prisma` (MOD: +1 model `AuthIntent` + 1 enum `AuthIntentStatus` + 5 new `AuditAction` enum values + 1 reverse relation on `User`)
    - `prisma/migrations/<timestamp>_phase_2_2_auth_intent/migration.sql` (NEW)
    - `src/audit/enums/audit-action.enum.ts` (MOD: +5 mirror values)
    - `src/config/app.config.ts` (MOD: +2 keys — `authIntentV2Enabled` + `authIntentTtlMs`)
    - `src/auth/auth.module.ts` (MOD: +AuthIntentService provider + AuthIntentController controller — both unconditional per decision A)
  - **Direct dependents — files NEW**:
    - `src/auth/auth-intent.service.ts` (NEW — main state-machine driver, ~300 LOC estimated)
    - `src/auth/auth-intent.controller.ts` (NEW — ~140 LOC)
    - `src/auth/dto/create-auth-intent.dto.ts` (NEW — minimal class-validator body; likely empty for create, expects only request meta)
    - `src/auth/dto/advance-auth-intent.dto.ts` (NEW — discriminated union with `kind` discriminator + per-kind shapes)
    - `src/auth/dto/auth-intent-response.dto.ts` (NEW — response shape)
    - `src/auth/tests/auth-intent.service.spec.ts` (NEW — ~22 tests)
    - `src/auth/tests/auth-intent.controller.spec.ts` (NEW — ~12 tests)
  - **Transitive dependents**: NONE. Phase 2.2 introduces a wholly-new HTTP surface under `/auth/v2/intents/*`. No existing class is modified beyond pure additions (AuthModule providers/controllers arrays gain entries; no constructor signatures change on existing classes).
  - **Test dependents** (existing specs): NONE require updates. AuthIntentService is wholly new (no existing tests mock it). The only AuthModule changes are array additions — existing controller/service specs continue to compile and pass unchanged.

- **Breaking changes identified**: **NONE**. This is a pure-additive ticket. The strangler invariant is preserved:
  - `LoginService.executeLogin` (v1) stays bit-identical.
  - `AuthController` (v1) stays bit-identical.
  - `AuthV2Controller` (Phase 1.3) stays bit-identical.
  - Existing `AuditAction` enum values are unchanged (only additions).
  - `app.config` adds 2 new keys with defaults; no existing key changes type.

- **API contract impact**: 2 NEW endpoints (`POST /auth/v2/intents` + `POST /auth/v2/intents/:id/advance`) added under a new OpenAPI tag `Auth v2 — AuthIntent`. NO modification of existing endpoints. `/update-docs` adds the spec entries (per wave convention).

- **Schema migration impact**:
  - NEW table `auth_intents` — additive, zero conflict.
  - NEW enum `AuthIntentStatus` (8 values per decision E) — additive.
  - 5 new `AuditAction` enum values — additive (`ALTER TYPE "AuditAction" ADD VALUE 'AUTH_INTENT_*'`).
  - NEW reverse relation `User.authIntents AuthIntent[]` — Prisma-side only; no DB column.
  - Backward compatibility: **all changes are forward-only**. Rollback drops the new table + enum; the 5 new AuditAction values remain (Postgres enum value removal requires recreating the enum — documented in `/update-docs` record §12 as acceptable for revert).

- **Test files requiring updates**: **NONE**. Wholly-additive ticket.

- **Blast radius size**: **7 NEW files + 5 MOD files = 12 files**. Below the "flag for careful review" threshold of >5 affected EXISTING files. (12 is the total count; only 5 are existing-file mods, the other 7 are net-new with no backward dependencies.)

## 3. Overview

Second sub-phase of Phase 2 of the AUTH v2 + Tenancy v1 program. Replaces the procedural `executeLogin` in v1 `LoginService` with a server-side state-machine driving login orchestration via the `AuthIntent` Prisma model. **Strangler-pattern**: v1 `LoginService` + `AuthController` stay bit-identical and continue to serve production traffic; v2 endpoints live behind a feature flag (`app.authIntentV2Enabled`, default off in prod).

**Architecture principles applied**:
- **State machine instead of procedure**: each `advance()` call reads the persisted intent, applies the next transition based on the input `kind`, persists the new status + context inside `prisma.$transaction`. Atomic state transitions — no half-advanced rows possible.
- **No failure-mode enumeration**: 5 distinct rejection categories (bad credentials, wrong MFA, invalid tenant pick, expired, terminal) all converge to a single `UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED)` throw site, with the differentiation captured in the audit `AUTH_INTENT_FAILED` metadata (`{ fromStatus, reason }`).
- **410 Gone discipline on terminal states**: `succeeded`, `failed`, `expired` intents return 410 on `advance()` — different from 401 to clearly signal "this orchestration has ended" without leaking which terminal state it ended in.
- **Single source of truth for v2 shape**: reuse `isValidV2Payload` util (Phase 1.3) when the intent reaches `succeeded` and mints the access token via `TokenServiceV2`.
- **Tenant binding via existing primitives**: subdomain middleware (Phase 2.1) contributes the canonical tenantId hint when `Host` resolves cleanly; AuthIntent honors it during the `requires_tenant_pick` auto-resolution (decision D5). Session creation goes through `SessionsServiceV2` (Phase 1.2), which wraps the cross-tenant lookup window inside `TenantContext.runWithBypass`.

## 4. Architecture Context

- **Modules involved**:
  - **`AuthModule`** (`src/auth/auth.module.ts`) — gains 1 new provider (`AuthIntentService`) + 1 new controller (`AuthIntentController`). Existing imports (`UsersModule forwardRef`, `AuditModule`, `SessionsModule forwardRef`, `CryptoModule`, `MailModule`, `SecurityModule`, `PassportModule`, `JwtModule`) all remain — no new module imports required. DI for the 7-dep `AuthIntentService` resolves entirely through existing AuthModule providers + forwardRef-imported UsersModule + forwardRef-imported SessionsModule.
  - **`AuditModule`** (no changes; consumed by `AuthIntentService` for audit emission).
  - **`UsersModule`** (no changes; consumed by `AuthIntentService` for `findByEmail` + `findById`).
  - **`SessionsModule`** (no changes; consumed by `AuthIntentService` via `SessionsServiceV2.createSession`, already exported as of Phase 1.3).
  - **`AppModule`** (no changes; no global registrations).

- **Components affected**:
  - 1 NEW Prisma migration.
  - 1 NEW Prisma model (`AuthIntent`) + 1 NEW enum (`AuthIntentStatus`, 8 values) + 5 NEW AuditAction enum values.
  - 1 NEW NestJS service (`AuthIntentService`, `@Injectable`, 7 deps).
  - 1 NEW NestJS controller (`AuthIntentController`, `@Controller('auth/v2/intents')`, 2 deps, NO @UseGuards).
  - 3 NEW DTOs (create + advance + response).
  - 2 NEW config keys (`authIntentV2Enabled` + `authIntentTtlMs`).
  - 1 MODIFIED module (`AuthModule.providers[]` + `AuthModule.controllers[]` arrays each gain one entry).

- **Files referenced**:
  - `nexacore-api/prisma/schema.prisma` (MOD)
  - `nexacore-api/prisma/migrations/<timestamp>_phase_2_2_auth_intent/migration.sql` (NEW)
  - `nexacore-api/src/auth/auth-intent.service.ts` (NEW)
  - `nexacore-api/src/auth/auth-intent.controller.ts` (NEW)
  - `nexacore-api/src/auth/dto/create-auth-intent.dto.ts` (NEW)
  - `nexacore-api/src/auth/dto/advance-auth-intent.dto.ts` (NEW)
  - `nexacore-api/src/auth/dto/auth-intent-response.dto.ts` (NEW)
  - `nexacore-api/src/auth/tests/auth-intent.service.spec.ts` (NEW)
  - `nexacore-api/src/auth/tests/auth-intent.controller.spec.ts` (NEW)
  - `nexacore-api/src/audit/enums/audit-action.enum.ts` (MOD)
  - `nexacore-api/src/config/app.config.ts` (MOD)
  - `nexacore-api/src/auth/auth.module.ts` (MOD)

## 5. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: `feature/SCRUM-497-auth-backend` from latest main.
- **Implementation Steps**:
  1. `cd ~/projects/em-ecosystem && git checkout main && git pull origin main`.
  2. Confirm `git log --oneline -1` shows `ee3f1ca` (SCRUM-495 squash merge).
  3. `git checkout -b feature/SCRUM-497-auth-backend`.
  4. `git branch --show-current` → `feature/SCRUM-497-auth-backend`.

### Step 1: Schema additions (Prisma)

- **File**: `nexacore-api/prisma/schema.prisma` (MOD).
- **Implementation Steps**:
  1. **Append 5 new values to `enum AuditAction` block** (line 20-76). After `SUBDOMAIN_RESOLUTION_FAILED`:
     ```
     AUTH_INTENT_CREATED
     AUTH_INTENT_ADVANCED
     AUTH_INTENT_SUCCEEDED
     AUTH_INTENT_FAILED
     AUTH_INTENT_EXPIRED
     ```
     **3-location pitfall (per SCRUM-495 Accepted-Trivial #1)**: these 5 values must appear in (a) schema.prisma enum block here, (b) `src/audit/enums/audit-action.enum.ts` TS mirror, (c) migration SQL `ALTER TYPE`.
  2. **Append `enum AuthIntentStatus`** after `enum EmailVerificationTokenType` (~line 78):
     ```prisma
     enum AuthIntentStatus {
       requires_credentials
       requires_tenant_pick
       requires_mfa
       requires_passkey
       requires_setup
       succeeded
       failed
       expired
     }
     ```
     (8 values per decision E. The `requires_passkey` + `requires_setup` slots are declared but no transition function will be wired in this ticket — Phase 3+ implements those.)
  3. **Append `model AuthIntent`** (placement: after `SessionV2` model or at the auth-clustered end of schema):
     ```prisma
     /// AuthIntent — server-side state machine for v2 login orchestration.
     /// SCRUM-497 / AUTH v2 + Tenancy v1 Phase 2.2. See program doc §4 Phase 2 + §5 D-004.
     model AuthIntent {
       id              String            @id @default(uuid())
       status          AuthIntentStatus  @default(requires_credentials)
       userId          String?
       user            User?             @relation("AuthIntentUser", fields: [userId], references: [id], onDelete: SetNull)
       tenantId        String?
       tenant          Tenant?           @relation("AuthIntentTenant", fields: [tenantId], references: [id], onDelete: SetNull)
       organizationId  String?
       organization    Organization?     @relation("AuthIntentOrganization", fields: [organizationId], references: [id], onDelete: SetNull)
       context         Json              @default("{}")
       ipAddress       String?
       userAgent       String?
       createdAt       DateTime          @default(now())
       updatedAt       DateTime          @updatedAt
       expiresAt       DateTime
       fulfilledAt     DateTime?

       @@index([userId])
       @@index([tenantId])
       @@index([status, expiresAt])
       @@map("auth_intents")
     }
     ```
  4. **Add reverse relations**:
     - `User` model: add `authIntents AuthIntent[] @relation("AuthIntentUser")` near the `memberships` + `organizationMemberships` block.
     - `Tenant` model: add `authIntents AuthIntent[] @relation("AuthIntentTenant")` near the existing reverse relations.
     - `Organization` model: add `authIntents AuthIntent[] @relation("AuthIntentOrganization")` near the existing reverse relations.

### Step 2: Migration SQL + deploy

- **File**: `nexacore-api/prisma/migrations/<timestamp>_phase_2_2_auth_intent/migration.sql` (NEW). Use timestamp at generation time, e.g. `20260522000000_phase_2_2_auth_intent`.
- **Implementation Steps**:
  1. **5 `ALTER TYPE` statements** for new AuditAction values:
     ```sql
     ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'AUTH_INTENT_CREATED';
     ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'AUTH_INTENT_ADVANCED';
     ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'AUTH_INTENT_SUCCEEDED';
     ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'AUTH_INTENT_FAILED';
     ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'AUTH_INTENT_EXPIRED';
     ```
     (Postgres ≥12 supports `IF NOT EXISTS`. Each on its own statement — Postgres does not allow combining enum ALTER VALUEs in one statement.)
  2. **`CREATE TYPE "AuthIntentStatus"`** with 8 values matching the Prisma enum.
  3. **`CREATE TABLE "auth_intents"`** matching the model columns + FK definitions with `ON DELETE SET NULL` for all 3 nullable FKs.
  4. **3 `CREATE INDEX`** for `userId`, `tenantId`, `(status, expiresAt)`.
  5. Run `npx prisma migrate deploy` → exit 0.
  6. Run `npx prisma generate` → ensures Prisma client gets the new model + AuditIntentStatus enum. If the generated client appears stale (TS error like "Property 'authIntent' does not exist on type 'PrismaClient'"), `rm -rf node_modules/.prisma && npx prisma generate` (SCRUM-493 lesson).

### Step 3: TS mirror — `audit-action.enum.ts`

- **File**: `nexacore-api/src/audit/enums/audit-action.enum.ts` (MOD).
- **Action**: Append 5 new enum entries matching the schema additions:
  ```typescript
  AUTH_INTENT_CREATED = 'AUTH_INTENT_CREATED',
  AUTH_INTENT_ADVANCED = 'AUTH_INTENT_ADVANCED',
  AUTH_INTENT_SUCCEEDED = 'AUTH_INTENT_SUCCEEDED',
  AUTH_INTENT_FAILED = 'AUTH_INTENT_FAILED',
  AUTH_INTENT_EXPIRED = 'AUTH_INTENT_EXPIRED',
  ```

### Step 4: app.config.ts — add 2 new config keys

- **File**: `nexacore-api/src/config/app.config.ts` (MOD).
- **Action**: Add 2 keys to the `appConfig` factory return value, following the existing `platformAdminSubdomain` pattern.
- **Implementation Steps**:
  ```typescript
  /**
   * SCRUM-497 / Phase 2.2 (D-004): feature flag for the AuthIntent state machine.
   * When false, AuthIntentController endpoints return 404 (mimics "endpoint
   * does not exist"); when true, the v2 login orchestration is reachable.
   * Default false in production, true in CI/test env per plan decision D6.
   */
  authIntentV2Enabled: process.env.AUTH_INTENT_V2_ENABLED === 'true',
  /**
   * SCRUM-497 / Phase 2.2: TTL for AuthIntent rows in milliseconds.
   * 15 min default per plan decision D2; configurable via env for testing.
   */
  authIntentTtlMs: parseInt(process.env.AUTH_INTENT_TTL_MS || '900000', 10),
  ```

### Step 5: NEW DTOs

#### 5a. `create-auth-intent.dto.ts`

- **File**: `nexacore-api/src/auth/dto/create-auth-intent.dto.ts` (NEW).
- **Action**: Empty body DTO (no fields needed — the request brings only request meta extracted in the controller). Define as empty class with `class-validator` no-op decorator to satisfy NestJS ValidationPipe contract.
- **Body**:
  ```typescript
  export class CreateAuthIntentDto {}
  ```
  (Optional fields may emerge in Phase 3/4 — leave open for future extension.)

#### 5b. `advance-auth-intent.dto.ts` (DISCRIMINATED UNION per decision B)

- **File**: `nexacore-api/src/auth/dto/advance-auth-intent.dto.ts` (NEW).
- **Implementation Steps**: 4 per-kind DTO classes + 1 discriminator wrapper. Use `class-transformer`'s `Type` with `discriminator` option.
  ```typescript
  // Credential kind
  export class AdvanceCredentialsDto {
    @IsIn(['credentials']) kind!: 'credentials';
    @IsEmail() email!: string;
    @IsString() @MinLength(8) password!: string;
  }
  // MFA kind
  export class AdvanceMfaDto {
    @IsIn(['mfa']) kind!: 'mfa';
    @IsString() @Length(6, 6) @IsOptional() code?: string;
    @IsString() @IsOptional() recoveryCode?: string;
  }
  // Tenant-pick kind
  export class AdvanceTenantPickDto {
    @IsIn(['tenant_pick']) kind!: 'tenant_pick';
    @IsUUID() tenantId!: string;
  }
  // Passkey kind (declared, transition NOT wired — Phase 3+)
  export class AdvancePasskeyDto {
    @IsIn(['passkey']) kind!: 'passkey';
    @IsObject() assertion!: Record<string, unknown>;
  }
  // Discriminator wrapper
  export class AdvanceAuthIntentDto {
    @Type(() => Object, {
      discriminator: {
        property: 'kind',
        subTypes: [
          { value: AdvanceCredentialsDto, name: 'credentials' },
          { value: AdvanceMfaDto, name: 'mfa' },
          { value: AdvanceTenantPickDto, name: 'tenant_pick' },
          { value: AdvancePasskeyDto, name: 'passkey' },
        ],
      },
    })
    @ValidateNested()
    input!: AdvanceCredentialsDto | AdvanceMfaDto | AdvanceTenantPickDto | AdvancePasskeyDto;
  }
  ```
- **Note**: ValidationPipe rejects unknown `kind` values with 400.

#### 5c. `auth-intent-response.dto.ts`

- **File**: `nexacore-api/src/auth/dto/auth-intent-response.dto.ts` (NEW).
- **Body**:
  ```typescript
  export class AuthIntentResponseDto {
    id!: string;
    status!: AuthIntentStatus;
    nextStep?: 'credentials' | 'mfa' | 'tenant_pick' | 'passkey' | null;
    expiresAt!: Date;
    accessToken?: string; // present only when status === 'succeeded'
    user?: { id: string; tenantId: string; tenantRole: string; isPlatformAdmin: boolean }; // ditto
  }
  ```

### Step 6: `AuthIntentService` — state-machine driver

- **File**: `nexacore-api/src/auth/auth-intent.service.ts` (NEW).
- **Constructor**: 7 deps as verified in §1.
- **Public methods**:
  - `async createIntent(meta: { ipAddress?, userAgent? }): Promise<AuthIntent>` — creates intent at `requires_credentials`, emits `AUTH_INTENT_CREATED` audit, returns the row.
  - `async advance(intentId: string, input: AdvanceInput, meta: { ipAddress?, userAgent? }): Promise<AuthIntent>` — central dispatcher.

#### 6.1 `createIntent()`

- **Implementation Steps**:
  1. Compute `expiresAt = new Date(Date.now() + configService.get('app.authIntentTtlMs'))`.
  2. `await prisma.authIntent.create({ data: { status: 'requires_credentials', expiresAt, ipAddress, userAgent } })`.
  3. `await auditService.log({ action: AUTH_INTENT_CREATED, userId: null, ipAddress, userAgent, metadata: { intentId, expiresAt } })`.
  4. Return the created row.

#### 6.2 `advance()` — central dispatcher

- **Implementation Steps**:
  1. **Fetch the intent**: `const intent = await prisma.authIntent.findUnique({ where: { id: intentId } })`.
  2. **Not-found check**: if `!intent` → throw `NotFoundException(ErrorMessages.auth.AUTHENTICATION_FAILED)` (404; no information leak).
  3. **Terminal-state check (decision D4)**: if `intent.status ∈ {succeeded, failed, expired}` → throw `new GoneException(ErrorMessages.auth.AUTHENTICATION_FAILED)` (410).
  4. **Expiry check (decision D3)**: if `intent.expiresAt < new Date()`:
     - `await prisma.authIntent.update({ where: { id }, data: { status: 'expired', fulfilledAt: new Date() } })`.
     - `await auditService.log({ action: AUTH_INTENT_EXPIRED, userId: intent.userId, ... })`.
     - throw `GoneException(ErrorMessages.auth.AUTHENTICATION_FAILED)`.
  5. **Dispatch by status × input.kind**:
     - `status: requires_credentials` + `input.kind: credentials` → `advanceCredentials(intent, input)`
     - `status: requires_mfa` + `input.kind: mfa` → `advanceMfa(intent, input)`
     - `status: requires_tenant_pick` + `input.kind: tenant_pick` → `advanceTenantPick(intent, input)`
     - `status: requires_passkey` + `input.kind: passkey` → **NOT WIRED in this ticket** (Phase 3). Throw `UnauthorizedException(AUTHENTICATION_FAILED)`.
     - Any other `status × kind` mismatch (e.g. mfa input on requires_credentials state) → `markFailed(intent, 'state_mismatch')` then throw.

#### 6.3 `advanceCredentials(intent, { email, password })` — credential gate

- **Implementation Steps**:
  1. `const user = await usersService.findByEmail(email)`.
  2. If `!user`: `await bcrypt.compare(password, DUMMY_PASSWORD_HASH)` (timing equalization, matching v1 LoginService:111). Then `markFailed(intent, 'user_not_found')` + throw.
  3. Lockout check: if `user.lockedUntil && user.lockedUntil > new Date()`: `bcrypt.compare(password, DUMMY_PASSWORD_HASH)`; `markFailed(intent, 'account_locked')` + throw.
  4. `const ok = await bcrypt.compare(password, user.passwordHash!)`. If !ok → `markFailed(intent, 'bad_password')` + throw.
  5. Email-verified check (mirrors v1 `checkEmailVerification` at LoginService:134) — if !user.emailVerified: `markFailed(intent, 'email_not_verified')` + throw.
  6. **Compute next status** (single source of truth for fan-out):
     - Determine `activeMemberships = await prisma.tenantMembership.findMany({ where: { userId: user.id, status: 'active' } })`.
     - Determine `mfaRequired = user.mfaEnabled` (Phase 2.2 honors per-user MFA only; per-tenant authPolicy MFA defer to Phase 3+).
     - Determine `subdomainHint = TenantContext.getActiveTenantId()` (from middleware; null on skip-paths).
     - **Decision tree**:
       - `mfaRequired` → next = `requires_mfa` (preserve userId).
       - `!mfaRequired` + `activeMemberships.length === 0` → `markFailed(intent, 'no_tenant_membership')` + throw.
       - `!mfaRequired` + `activeMemberships.length === 1` → decision D (single-tenant short-circuit) → `succeed(intent, activeMemberships[0])`.
       - `!mfaRequired` + `activeMemberships.length > 1` + `subdomainHint && activeMemberships.some(m => m.tenantId === subdomainHint)` → decision D5 → `succeed(intent, activeMemberships.find(m => m.tenantId === subdomainHint))`.
       - otherwise → next = `requires_tenant_pick` (preserve userId; context += `{ availableTenantIds }` for client UI).
  7. **Persist**: `prisma.authIntent.update({ where: { id }, data: { status: next, userId: user.id, context: { ...intent.context, ...newContextDelta } } })`.
  8. **Audit**: `AUTH_INTENT_ADVANCED` with metadata `{ fromStatus: 'requires_credentials', toStatus: next, kind: 'credentials' }`.
  9. Return updated intent (and access token + cookie shape if succeed-path).

#### 6.4 `advanceMfa(intent, { code?, recoveryCode? })` — MFA gate (decision C)

- **Implementation Steps**:
  1. Require `intent.userId`. If null → `markFailed(intent, 'invalid_state')` + throw.
  2. `const user = await usersService.findById(intent.userId!)`.
  3. If `!user || !user.mfaEnabled || !user.mfaSecret` → `markFailed(intent, 'mfa_state_invalid')` + throw.
  4. If `code`: decrypt MFA secret via `mfaService` (inject for `cryptoService.decrypt` reuse — see decision C) and call `otpVerify({ token: code, secret })` (same primitive v1 uses at mfa.service.ts:170-172). If invalid → `markFailed(intent, 'mfa_code_wrong')` + throw.
  5. If `recoveryCode`: reuse `MfaService.findMatchingRecoveryCode` if extractable as `public`, OR duplicate the bcrypt-compare loop inline (3-4 LOC). LOCK at /develop: **expose** `findMatchingRecoveryCode` as `public` on MfaService (single small addition; v1 contract not broken since the method becomes available to additional callers).
  6. **Compute next status** — same logic as 6.3 step 6, but starting from "MFA-cleared". Most common: `requires_tenant_pick` or `succeeded`.
  7. Persist + audit + return.

#### 6.5 `advanceTenantPick(intent, { tenantId })`

- **Implementation Steps**:
  1. Require `intent.userId`. If null → `markFailed(intent, 'invalid_state')` + throw.
  2. `const membership = await prisma.tenantMembership.findFirst({ where: { userId: intent.userId, tenantId, status: 'active' } })`.
  3. If !membership → `markFailed(intent, 'tenant_pick_invalid')` + throw.
  4. `succeed(intent, membership)`.

#### 6.6 `succeed(intent, membership)` — terminal happy path

- **Implementation Steps**:
  1. Wrap in `TenantContext.runWithBypass('auth-intent-succeed-mint')` (so cross-tenant Prisma writes during mint happen with an explicit, audited bypass per SCRUM-488 convention).
  2. Get user for `isPlatformAdmin` flag: `const user = await usersService.findById(intent.userId!)`.
  3. Mint session via `sessionsServiceV2.createSession({ userId: user.id, tenantId: membership.tenantId, tenantRole: membership.role, isPlatformAdmin: user.isPlatformAdmin, ipAddress: intent.ipAddress, userAgent: intent.userAgent })`. Returns `{ sessionId, refreshToken, expiresAt }`.
  4. Mint access via `tokenServiceV2.mintAccessToken({ userId: user.id, sessionId, tenantId: membership.tenantId, tenantRole: membership.role, isPlatformAdmin: user.isPlatformAdmin })`. Returns access token string.
  5. **Persist intent** to `succeeded`: `prisma.authIntent.update({ where: { id }, data: { status: 'succeeded', userId: user.id, tenantId: membership.tenantId, fulfilledAt: new Date() } })`.
  6. **Audit**: `AUTH_INTENT_SUCCEEDED` with metadata `{ tenantId, role: membership.role }`.
  7. Return composite payload to controller (intent + accessToken + refreshToken + refreshTokenMaxAgeMs).

#### 6.7 `markFailed(intent, reasonClass)` — terminal sad path

- **Implementation Steps**:
  1. `prisma.authIntent.update({ where: { id }, data: { status: 'failed', fulfilledAt: new Date(), context: { ...intent.context, failReason: reasonClass } } })`.
  2. `auditService.log({ action: AUTH_INTENT_FAILED, userId: intent.userId, metadata: { intentId, fromStatus: intent.status, reason: reasonClass } })`.
  3. Caller throws after this (single throw site `UnauthorizedException(AUTHENTICATION_FAILED)`).

#### 6.8 `assertCanAdvance(intent)` — early gate (called by every advanceX)

- Centralizes terminal/expiry check from §6.2 so per-kind methods don't repeat it.

### Step 7: `AuthIntentController`

- **File**: `nexacore-api/src/auth/auth-intent.controller.ts` (NEW).
- **Constructor**: `(authIntentService: AuthIntentService, configService: ConfigService)` (2 deps).
- **Implementation Steps**:
  1. **Class header**: `@ApiTags('Auth v2 — AuthIntent') @Controller('auth/v2/intents')`. No class-level @UseGuards.
  2. **`private assertEnabled(): void`** (decision A): reads `configService.get<boolean>('app.authIntentV2Enabled')`; if false throws `NotFoundException(ErrorMessages.auth.AUTHENTICATION_FAILED)`. Call at the top of every public method.
  3. **`POST /auth/v2/intents`** — `@Throttle({ global: AUTH_RATE_LIMITS.login }) @HttpCode(HttpStatus.CREATED)`:
     ```typescript
     async create(@Req() req: Request, @Body() _dto: CreateAuthIntentDto): Promise<AuthIntentResponseDto> {
       this.assertEnabled();
       const intent = await this.authIntentService.createIntent({
         ipAddress: req.ip,
         userAgent: req.headers['user-agent'],
       });
       return { id: intent.id, status: intent.status, nextStep: 'credentials', expiresAt: intent.expiresAt };
     }
     ```
  4. **`POST /auth/v2/intents/:id/advance`** — `@Throttle({ global: AUTH_RATE_LIMITS.login })`:
     ```typescript
     async advance(
       @Param('id') id: string,
       @Body() dto: AdvanceAuthIntentDto,
       @Req() req: Request,
       @Res({ passthrough: true }) res: Response,
     ): Promise<AuthIntentResponseDto> {
       this.assertEnabled();
       const result = await this.authIntentService.advance(id, dto.input, { ipAddress: req.ip, userAgent: req.headers['user-agent'] });
       // If succeeded → set refresh cookie (mirrors AuthV2Controller pattern)
       if (result.status === 'succeeded') {
         setCookieFromConfig(res, {
           name: REFRESH_TOKEN_COOKIE_NAME_V2,
           value: result.refreshToken!,
           options: { httpOnly: true, secure: this.isProduction, sameSite: 'strict', path: '/', maxAge: Math.floor(result.refreshMaxAgeMs! / 1000) },
         });
         return { id: result.id, status: 'succeeded', expiresAt: result.expiresAt, accessToken: result.accessToken, user: result.user, nextStep: null };
       }
       return { id: result.id, status: result.status, expiresAt: result.expiresAt, nextStep: this.computeNextStep(result.status) };
     }
     ```
  5. **Private `computeNextStep(status)`** helper maps an enum value to the hint string (`requires_credentials → 'credentials'`, etc.).

### Step 8: Wire into `AuthModule`

- **File**: `nexacore-api/src/auth/auth.module.ts` (MOD).
- **Implementation Steps**:
  1. Add imports: `import { AuthIntentController } from './auth-intent.controller'; import { AuthIntentService } from './auth-intent.service';`.
  2. Add `AuthIntentController` to `controllers: []` array.
  3. Add `AuthIntentService` to `providers: []` array.
  4. Do NOT add to `exports: []` — internal-only (no consumers outside `AuthIntentController`).
  5. **No new module imports needed** — all 7 deps of `AuthIntentService` already DI-resolvable through existing module imports.

### Step 9: Write specs

#### 9a. `auth-intent.service.spec.ts` (~22 tests, ~450 LOC)

- **File**: `nexacore-api/src/auth/tests/auth-intent.service.spec.ts` (NEW).
- **Pattern**: mocked PrismaService + spy AuditService + mocked TokenServiceV2 + mocked SessionsServiceV2 + mocked MfaService + mocked UsersService + mocked ConfigService (mirrors SCRUM-491/493/495 idiom).
- **Coverage**:
  - **`createIntent`** (2): emits AUTH_INTENT_CREATED; persists with computed expiresAt.
  - **`advance` not-found** (1): non-existent intentId → 404.
  - **`advance` terminal** (3): succeeded → 410, failed → 410, expired → 410.
  - **`advance` expired-at-advance** (1): row exists but `expiresAt < now()` → lazy flip to `expired` + AUTH_INTENT_EXPIRED audit + 410.
  - **`advanceCredentials` happy fan-outs** (3): single-tenant + no MFA → succeeded; multi-tenant + no MFA + no subdomain hint → requires_tenant_pick; multi-tenant + MFA → requires_mfa.
  - **`advanceCredentials` subdomain auto-resolve** (1, decision D5): multi-tenant + no MFA + TenantContext set + user is member → succeeded directly.
  - **`advanceCredentials` sad paths** (4): user not found (with bcrypt timing equalization assertion); account locked; bad password; email not verified.
  - **`advanceMfa`** (3): valid TOTP code → next status; invalid code → failed; recovery code valid → next status.
  - **`advanceTenantPick`** (2): user is member → succeeded; user not a member → failed.
  - **State-mismatch** (1): `mfa` input on `requires_credentials` state → failed.
  - **Audit emission asserted** (1): every transition writes exactly one AUTH_INTENT_ADVANCED row except terminal succeeded (which writes AUTH_INTENT_SUCCEEDED instead) and failed (AUTH_INTENT_FAILED).

#### 9b. `auth-intent.controller.spec.ts` (~12 tests, ~220 LOC)

- **File**: `nexacore-api/src/auth/tests/auth-intent.controller.spec.ts` (NEW).
- **Pattern**: mocked AuthIntentService + mocked ConfigService.
- **Coverage**:
  - **POST /intents happy** (1): 201, returns id + status: requires_credentials.
  - **POST /intents/:id/advance fan-outs** (4): credentials → requires_mfa shape; mfa → requires_tenant_pick shape; tenant_pick → succeeded shape (+ accessToken + cookie set + user payload); succeeded shape includes nextStep: null.
  - **POST /intents/:id/advance failure** (1): UnauthorizedException propagates with AUTHENTICATION_FAILED.
  - **POST /intents/:id/advance terminal** (1): GoneException propagates (410).
  - **Validation** (1): malformed `kind` → 400 from ValidationPipe.
  - **Cookie shape** (1): on succeeded, cookie is httpOnly + sameSite=strict + path=/ + name=refresh_token_v2 (mirrors AuthV2Controller posture).
  - **Feature flag OFF** (2): `assertEnabled` throws 404 on both endpoints; service NOT called.

### Step 10: Build + lint + jest + DI smoke + grep invariants

- **Implementation Steps**:
  1. `npm run build` → exit 0 (Prisma regen + DI typing both clean).
  2. `npx jest --testPathPatterns='auth-intent' --maxWorkers=1 --forceExit` → all targeted specs pass.
  3. Full project: `npx jest --maxWorkers=1 --forceExit` → 1357 + ~34 = ~1391 tests pass.
  4. Coverage: `--coverage` → global ≥ 90.5%; per-file ≥ 95% (target 100%) on `auth-intent.service.ts` + `auth-intent.controller.ts`.
  5. ESLint: `npx eslint <staged files> --fix`.
  6. DI bootstrap smoke: `nest start` (briefly) to confirm `AppModule.compile()` succeeds with the new 7-dep service + 2-dep controller. (Optionally extract into an integration spec that builds the full `Test.createTestingModule({ imports: [AppModule] }).compile()` matrix.)
  7. **Grep invariants**:
     - `grep -rn "AuthIntentService\|AuthIntentController" src/` → service decl + controller decl + module wiring + 2 spec files.
     - **v1 invariant strangler check**: `git diff main -- src/auth/login.service.ts src/auth/auth.service.ts src/auth/auth.controller.ts src/auth/login-security.service.ts` → all 4 paths return **empty** (no changes).
     - **Phase 1/2.1 invariant check**: `git diff main -- src/auth/token.service.v2.ts src/sessions/sessions.service.v2.ts src/auth/auth-v2.controller.ts src/auth/strategies/jwt-v2.strategy.ts src/tenants/middleware/subdomain-tenant-resolver.middleware.ts src/tenants/organizations.service.ts` → all empty (no changes).
     - `grep -rn "AUTH_INTENT_" src/` → expected 5 places in audit-action.enum.ts + 5 in schema.prisma enum block + ~10 in service code (audit emissions) + ~5 in tests.

### Step 11: Update Technical Documentation

- **Action**: Deferred-by-design to `/update-docs`.
- **Implementation Steps**: NOT in this branch. `/update-docs` will:
  - Update `ai-specs/specs/integration-state.md`: header bump (Last update SCRUM-497) + Module Registry annotation on AuthModule (+1 controller + 1 provider) + new Controller Guard Chains entry (no guards but listed for completeness) + new Service Dependency Chains entry (`AuthIntentService → PrismaService, AuditService, TokenServiceV2, SessionsServiceV2, MfaService, UsersService, ConfigService`) + Test Mock Requirements entry + Changelog row.
  - Update `ai-specs/changes/auth/programs/AUTH-v2.md` §6 Phase 2.2 row marked complete.
  - Update `ai-specs/specs/api-spec.yml`: NEW `Auth v2 — AuthIntent` tag + 2 new paths under it.
  - Update `ai-specs/specs/data-model.md`: NEW `AuthIntent` entity entry (§28) + `AuthIntentStatus` enum + 5 new AuditAction values.

## 6. Implementation Order

1. Step 0: Create feature branch.
2. Step 1: Schema additions (Prisma).
3. Step 2: Migration SQL + deploy.
4. Step 3: TS enum mirror.
5. Step 4: `app.config.ts` adds.
6. Step 5a-c: DTOs.
7. Step 6: `AuthIntentService`.
8. Step 7: `AuthIntentController`.
9. Step 8: Wire into `AuthModule`.
10. Step 9a-b: Specs.
11. Step 10: Build + lint + jest + DI smoke + grep invariants.
12. Step 11: Docs deferred to `/update-docs`.

## 7. Testing Checklist

- [ ] `npm run build` exit 0.
- [ ] Targeted jest: `auth-intent.service.spec` (22) + `auth-intent.controller.spec` (12) pass.
- [ ] Full project: ~1391/1391 pass.
- [ ] Coverage global ≥ 90.5%; per-file ≥ 95% (target 100%) on new files.
- [ ] ESLint clean.
- [ ] DI smoke: `AppModule.compile()` succeeds.
- [ ] **v1 invariant grep**: `git diff main -- src/auth/login.service.ts src/auth/auth.service.ts src/auth/auth.controller.ts src/auth/login-security.service.ts` empty.
- [ ] **Phase 1/2.1 invariant grep**: existing v2/middleware files bit-identical.
- [ ] Feature flag OFF returns 404 from both endpoints (integration test).
- [ ] Feature flag ON allows full happy path (e2e in spec: create → advance creds → advance mfa → advance tenant_pick → succeeded + cookie set).

**Regression test checklist** (from §2):

| File | Updated? | Why |
|---|---|---|
| (no existing spec files need updates — pure-additive ticket) | N/A | All new tests are in 2 NEW spec files. |

## 8. Error Response Format

Follows `HttpExceptionFilter` pattern. All endpoints emit `ErrorResponse` shape:

- **400** Validation: malformed DTO body (unknown `kind`, missing required field) → `{ statusCode: 400, message: [...class-validator messages...], error: 'Bad Request' }`.
- **401** Unauthorized: every authentication failure (bad creds, wrong MFA, invalid tenant pick, expired-at-advance pre-flip) → `{ statusCode: 401, message: 'Authentication failed', error: 'Unauthorized' }`. **Single message constant** (`ErrorMessages.auth.AUTHENTICATION_FAILED`).
- **404** Not Found: intent id not found OR feature flag disabled → same single message constant.
- **410** Gone: terminal-state replay (`succeeded`/`failed`/`expired`) → same single message constant.
- **429** Throttled: rate limit exceeded → `{ statusCode: 429, message: 'Too many requests' }`.

HTTP status code mapping:
| Failure mode | HTTP code | Notes |
|---|---|---|
| Validation failure | 400 | from ValidationPipe |
| Auth failure (any cause) | 401 | single throw site |
| Intent not found / feature flag off | 404 | intentional ambiguity |
| Terminal replay | 410 | distinct from 401 — orchestration ended |
| Rate limited | 429 | from ThrottlerGuard |

## 9. Partial Update Support

N/A — `advance()` is a state-transition operation, not a CRUD update. Each call moves the state forward by exactly one transition; no partial accumulation across calls. The `context` Json field accumulates information across transitions but is internal (not part of the request body shape).

## 10. Dependencies

- **No new external libraries**. Only stdlib (`crypto.randomBytes` via Prisma uuid), `@nestjs/common`, `@nestjs/config`, `class-validator`, `class-transformer`, `bcrypt` (already used by v1 LoginService), `@otplib/preset-default` (already used by `MfaService`), `prisma`. All pinned in `package.json` already.

## 11. Notes

- **Strangler-pattern invariant**: v1 `LoginService` + `AuthController` + `LoginSecurityService` + `AuthService` ALL stay bit-identical. CI gate at `/verify` will assert `git diff main` returns 0 lines for these files.
- **No failure-mode enumeration**: 5+ distinct failure reasons all converge to the same `UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED)` — discrimination only in audit metadata, never in HTTP response.
- **Tenant binding discipline**: `succeed()` wraps the cross-tenant mint inside `TenantContext.runWithBypass('auth-intent-succeed-mint')` per the Phase 0.2 audit convention.
- **No `@UseGuards`** on the controller — the intent IS the orchestration state. Authentication completes inside the state machine.
- **Cookie posture** mirrors AuthV2Controller (Phase 1.3): `refresh_token_v2`, httpOnly, secure-in-prod, sameSite=strict, path=/, maxAge=refreshTtlMs (from `auth.jwtRefreshExpiration`).
- **§15 AUTH change-control**: this ticket touches `src/auth/**` (8 NEW + 1 MOD) + `src/audit/enums/audit-action.enum.ts` mirror + `prisma/schema.prisma`. Single in-domain AUTH ticket → §15.3.3 single-PR. Verify report will mark applied.
- **Frontend not modified**. Phase 2.3 (separate ticket, to-be-created after this ships) covers the dashboard reference impl.
- **Language**: all code, comments, commit messages, and ai-specs artifacts in English.

## 12. Next Steps After Implementation

After `/develop` + `/verify` + `/commit` + `/update-docs`:
1. Phase 2.3 (Dashboard wiring) can be drafted and ticketed. Operator-approval required per `feedback_auth_program_ticket_creation`.
2. Phase 3 (Passkey-first reframing) becomes unblocked — the `requires_passkey` slot in the AuthIntentStatus enum gets its transition function wired.
3. Phase 4 (AuthChallenge step-up) remains independent — schedulable in parallel with Phase 3.

## 13. Implementation Verification

Final verification checklist:

- **Code Quality**: ESLint clean; no `any` in production code; no `process.env` direct reads (ConfigService only); single throw site discipline; English only.
- **Functionality**: all 5 happy paths covered (single-tenant fast, multi-tenant w/ MFA, multi-tenant w/o MFA, subdomain auto-resolve, recovery code).
- **Testing**: 1391/1391 jest passes; per-file 100% on new files; global ≥90.5%.
- **Regression**: v1 invariant grep empty; Phase 1/2.1 invariant grep empty; no existing spec files need updates.
- **Integration**: `AppModule.compile()` smoke passes; DI for 7-dep AuthIntentService resolves cleanly.
- **Documentation**: deferred to `/update-docs` per Step 11.

## 14. Module-Level Planning

N/A — Phase 2.2 extends the existing `AuthModule`; does not create a new NexaCore module.

## 15. Satellite App Planning

N/A — Phase 2.2 is internal to the NexaCore monolith (`nexacore-api`).
