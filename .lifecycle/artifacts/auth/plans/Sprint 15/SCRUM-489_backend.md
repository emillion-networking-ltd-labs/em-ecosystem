---
schema: ai-specs/schemas/plan.schema.yml
ticket: SCRUM-489
sprint: Sprint 15
scope: backend
module: auth
date: 2026-05-19
status: draft
last_completed_ticket: SCRUM-488
framework_version: 0.15.0
---

# Backend Implementation Plan: SCRUM-489 User.isPlatformAdmin + Role Refactor (AUTH v2 Phase 0.3)

## 1. Codebase State Snapshot

- **Date**: 2026-05-19
- **Last completed ticket**: SCRUM-488 (Prisma tenant-filter middleware — merged `c88fa88` on `main`)
- **Integration state verified**: Yes — `integration-state.md` re-read post-SCRUM-488 update; TenantContextInterceptor registered, PrismaModule factory provider documented.
- **Framework version**: 0.15.0.

### Files verified against live code

Every claim below traces to a file actually read on 2026-05-19:

- `nexacore-api/src/auth/guards/roles.guard.ts` — confirms current bypass at line 39 (`user?.role === Role.SUPERADMIN`), audit-log call at line 41-55 with `SUPERADMIN_BYPASS` action.
- `nexacore-api/src/auth/guards/permissions.guard.ts` — confirms current bypass at line 42 (`user.role === Role.SUPERADMIN`).
- `nexacore-api/src/users/users.service.ts` — confirms the 5 SUPERADMIN sites: lines 795, 800, 808, 874, 1134. Read each in context (lines 788-815, 865-885, 1125-1145).
- `nexacore-api/src/users/entities/user.entity.ts` — confirms `User` interface shape (22 fields, no `isPlatformAdmin`); `SafeUser = Omit<User, ...sensitive>` excludes `passwordHash`, `pendingEmail`, `mfaSecret`, `mfaRecoveryCodes`, `failedAttempts`, `lockedUntil`, `lockoutCount`; **`toSafeUser` assigns fields EXPLICITLY (not via spread)** — adding `isPlatformAdmin` requires one extra line in the assignment, not just an interface change.
- `nexacore-api/src/users/enums/role.enum.ts` — confirms `Role = { SUPERADMIN, ADMIN, USER }` (3 values, unchanged).
- `nexacore-api/src/auth/strategies/jwt.strategy.ts` — confirms `validate()` returns `toSafeUser(user)`; Passport attaches result to `req.user`. No change needed if `toSafeUser` pass-through is added.
- `nexacore-api/src/common/interfaces/jwt-payload.interface.ts` — confirms current JWT payload `{sub, email, role, jti, sessionId?, iat?}`. **NOT touched by this ticket** (Phase 1 work).
- `nexacore-api/src/auth/login.service.ts:145` — read in context: `(user.role === Role.ADMIN || user.role === Role.SUPERADMIN) && ...` MFA enforcement. **KEEP on role** (tenant-scoped policy).
- `nexacore-api/src/security/suspicious-login.service.ts:312` — `role: { in: [Role.ADMIN, Role.SUPERADMIN] }` alert query. **KEEP on role** (tenant-scoped).
- `nexacore-api/src/permissions/permissions.service.ts` lines 89, 107, 130 — Role-enum-machinery: `getPermissionKeysForRole(SUPERADMIN)` → `['*']`; `getPermissionsForRole(SUPERADMIN)` + `setPermissionsForRole(SUPERADMIN)` → `BadRequestException('INVALID_ROLE_OPERATION')`. **KEEP on role** (operates on Role enum value, not capability).
- `nexacore-api/prisma/schema.prisma` — confirms current User model has 22 fields; Role enum at line 9-13.
- `nexacore-api/prisma/migrations/20260225230005_add_profile_fields_and_superadmin/migration.sql` — sample SUPERADMIN-related migration (already inspected).
- `nexacore-api/prisma/migrations/20260328194437_add_oauth_auto_verified_audit_action/migration.sql` — sample enum-extension migration (template for any future enum work).
- `nexacore-api/src/auth/tests/roles.guard.spec.ts` — confirms 4 bypass test cases (lines 88, 107, 117, 142) each mock `role: Role.SUPERADMIN`.
- `nexacore-api/src/auth/tests/permissions.guard.spec.ts` — confirms 1 bypass test case (line 61).
- `nexacore-api/src/users/tests/users.service.spec.ts` — confirms ~10 SUPERADMIN test cases across `updateUser`, `deleteUser`, `selfDeleteAccount`.

### Constructor signatures verified (current state)

- `RolesGuard(reflector: Reflector, auditService: AuditService)` — 2 args, unchanged.
- `PermissionsGuard(reflector: Reflector, permissionsService: PermissionsService)` — 2 args (verified live), unchanged.
- `UsersService(prisma, audit, sessions, mail, trustedDevice (forwardRef), tokenDenyListService (forwardRef))` — 6 args, unchanged by this ticket.
- `JwtStrategy(usersService, tokenDenyListService, configService)` — 3 args, unchanged.

### Methods verified to exist

- `RolesGuard.canActivate(context)` — `roles.guard.ts:21-72`.
- `PermissionsGuard.canActivate(context)` — verified live.
- `UsersService.updateUser(actingUser, targetId, dto, ctx?)` — line 780+.
- `UsersService.deleteUser(...)` — verified by SUPERADMIN guard at line 874.
- `UsersService.selfDeleteAccount(userId, dto, ctx?)` — `users.service.ts:1126+`, SUPERADMIN guard at 1134.
- `toSafeUser(user)` — `user.entity.ts:44`.

### Guard dependency chain verified

No new `@UseGuards()` introduced. Existing chains unchanged. `RolesGuard` still requires `AuditModule` (verified — already imported by all modules using it).

### Discrepancies with integration-state.md

**One.** `integration-state.md` Guard Dependency Map says `PermissionsGuard` deps are `[Reflector, PermissionsService]`. Live code (verified via the file): matches. No drift.

### CI Gate Anticipation (per workflow-standards §22 / SCRUM-485)

| CI gate                                       | Expected behavior |
|-----------------------------------------------|-------------------|
| Job 1: `py_compile (all tools)`               | PASS / unchanged |
| Job 2: `Schema validate (changed artifacts)`  | PASS — plan/verify/record under `ai-specs/changes/auth/{plans,records}/Sprint 15/` matches existing SCHEMA_BY_PATH rules (the `auth` module folder already has rules from prior Sprint 14 tickets) |
| Job 2: `Groundedness (warn-only)`             | PASS / unchanged |
| Job 2: `Audit: coupling check (warn-only)`    | PASS / unchanged (no F/G findings touched) |
| Job 2: `Audit: completion check (warn-only)`  | SKIP (no new audit folder) |
| Job 3: `Schema validate (historical)`         | SKIP (no `ai-specs/schemas/**` change) |
| Job 4: `Smoke test: state-machine.py`         | PASS / unchanged |
| Job 5: `pytest (linchpin tests)`              | PASS / unchanged |
| em-ecosystem CI Layer 4 (Backend Tests)       | expected PASS — adds ~10-15 new test cases (bypass via flag for both guards + capability checks for 4 UsersService sites + propagation tests). Coverage-net-positive. |

**SKIP_PATHS / SCHEMA_BY_PATH expectations**: NO new `.md`/`.yml` files outside `ai-specs/changes/auth/{plans,records}/Sprint 15/`. Existing routing covers this ticket.

### Plan-time decisions (locked from /enrich-us)

| ID | Decision |
|----|----------|
| D-A | Additive schema only: `User.isPlatformAdmin Boolean @default(false)` |
| D-B | Single migration, two statements: ADD COLUMN + UPDATE backfill |
| D-C | Keep `User.role` + `Role` enum unchanged (transitional until Phase 1) |
| D-D | Migration-by-concept: 6 sites MIGRATE to `isPlatformAdmin`; 6 sites KEEP on `role` (see §3) |
| D-E | `toSafeUser` requires ONE new explicit line (no spread pattern in current code) |
| D-F | JWT payload UNCHANGED (Phase 1 work) |
| D-G | `SUPERADMIN_BYPASS` audit action enum value STAYS (no breaking rename) |
| D-H | RolesGuard + PermissionsGuard bypass condition switch (1 line each) |
| D-I | TenantMembership.role NOT touched (already populated by SCRUM-487 bootstrap) |

## 2. Regression Impact Analysis

### Blast radius

**Direct production code dependents (Role.SUPERADMIN grep, excluding spec files)**: 7 files, 12 sites total.

| # | File:Line | Site context | Phase 0.3 disposition |
|---|-----------|--------------|------------------------|
| 1 | `src/auth/guards/roles.guard.ts:39` | Cross-tenant bypass | **MIGRATE** to `user.isPlatformAdmin` |
| 2 | `src/auth/guards/permissions.guard.ts:42` | Cross-tenant bypass | **MIGRATE** to `user.isPlatformAdmin` |
| 3 | `src/users/users.service.ts:795` | "Cannot modify SUPERADMIN" (updateUser) | **MIGRATE** to `target.isPlatformAdmin === true` |
| 4 | `src/users/users.service.ts:800` | "SUPERADMIN role cannot be assigned" (guards Role-enum value passed in dto) | **KEEP** on `dto.role === Role.SUPERADMIN` (enum-pathway protection) |
| 5 | `src/users/users.service.ts:808` | "Only SUPERADMIN can assign ADMIN role" (acting user check) | **MIGRATE** to `!actingUser.isPlatformAdmin` |
| 6 | `src/users/users.service.ts:874` | "Cannot delete SUPERADMIN" | **MIGRATE** to `target.isPlatformAdmin === true` |
| 7 | `src/users/users.service.ts:1134` | "Cannot self-delete SUPERADMIN" | **MIGRATE** to `user.isPlatformAdmin === true` |
| 8 | `src/auth/login.service.ts:145` | MFA enforcement for ADMIN/SUPERADMIN | **KEEP** on role (tenant-scoped policy) |
| 9 | `src/security/suspicious-login.service.ts:312` | Notification target query | **KEEP** on role (tenant-scoped alert) |
| 10 | `src/permissions/permissions.service.ts:89` | `getPermissionKeysForRole(SUPERADMIN)` → `['*']` | **KEEP** on role (Role-enum machinery) |
| 11 | `src/permissions/permissions.service.ts:107` | `getPermissionsForRole(SUPERADMIN)` → throws | **KEEP** on role (Role-enum machinery) |
| 12 | `src/permissions/permissions.service.ts:130` | `setPermissionsForRole(SUPERADMIN)` → throws | **KEEP** on role (Role-enum machinery) |

**Summary**: **6 sites MIGRATE**, **6 sites KEEP**. Total: 12 production hits across 7 files.

**Test dependents (spec files mocking `role`)**: ~20 spec files reference `role:` in mocks. Only **3 spec files have direct SUPERADMIN bypass tests** that need behavioral updates:

| Spec file | Test cases needing update | Reason |
|-----------|----------------------------|--------|
| `src/auth/tests/roles.guard.spec.ts` | 4 (lines 88, 107, 117, 142) | Each constructs `{role: Role.SUPERADMIN}` and asserts bypass fires + audit log. After migration, must set `isPlatformAdmin: true` for bypass to fire. |
| `src/auth/tests/permissions.guard.spec.ts` | 1 (line 61) | Same pattern. |
| `src/users/tests/users.service.spec.ts` | ~6 (lines 1107, 1121-1124, 1136, 1148, 1160, 1323-1326, 1648) | Each SUPERADMIN target/actor must add `isPlatformAdmin: true` to mock. The "cannot assign SUPERADMIN role" test (line 1148) is the ENUM-pathway test — it KEEPS the existing `role: Role.SUPERADMIN` mock + still passes after migration. |

**Other spec files** (~17) just have `role: Role.USER` etc. in fixtures — they won't break because the new `isPlatformAdmin` field defaults to `undefined` (which `=== true` evaluates to `false`, so non-bypass paths behave identically).

### Breaking changes identified

| Surface | Change | Consequence | Mitigation |
|---------|--------|-------------|------------|
| `User` interface | NEW field `isPlatformAdmin: boolean` | Type-wise required on every `User` construction. `Omit`-derived types (SafeUser) gain the field automatically. | TS compile catches every site that constructs a `User` literal — fix in step 2. Mock User objects in tests that DON'T set `isPlatformAdmin` will get `undefined` at runtime; safe for non-bypass paths, breaks bypass paths (the 3 spec files above need updates). |
| `toSafeUser()` body | NEW assignment line | Returns SafeUser-with-isPlatformAdmin. | One-line addition. |
| `RolesGuard` behavior | Bypass condition switches from `role === SUPERADMIN` to `isPlatformAdmin === true` | The 4 bypass-test cases in `roles.guard.spec.ts` must update mocks. | Step 6 explicit checklist. |
| `PermissionsGuard` behavior | Same as RolesGuard | The 1 bypass test in `permissions.guard.spec.ts` must update. | Step 6 explicit checklist. |
| `UsersService` capability checks (4 sites) | Switch from `target/actingUser.role === SUPERADMIN` to `.isPlatformAdmin === true` | Tests that supply SUPERADMIN targets must add `isPlatformAdmin: true`. | Step 6 explicit checklist for `users.service.spec.ts`. |

### API contract impact

ZERO endpoints added, modified, or removed. `api-spec.yml` requires NO update.

The JWT payload shape is preserved (`role` still on payload). Front-end consumers that read `req.user.role` or `me.role` continue to work. `me.isPlatformAdmin` becomes a NEW optional field readable by the frontend (zero-impact addition).

### Schema migration impact

Single migration with two statements:

```sql
-- AlterTable
ALTER TABLE "users" ADD COLUMN "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false;

-- Data backfill: preserve cross-tenant authority for existing SUPERADMIN users
UPDATE "users" SET "isPlatformAdmin" = true WHERE "role" = 'SUPERADMIN';
```

**Backward compatibility**: NEW non-nullable field WITH default — safe (existing rows get `false`). UPDATE statement runs same-transaction; partial state impossible.

**Forward compatibility**: removing the column requires Phase 1 work that explicitly retires User.role first. Out of scope here.

### Test files requiring updates (mandatory checklist)

Tests with explicit mock fixes:

- `src/auth/tests/roles.guard.spec.ts` — 4 test cases (set `isPlatformAdmin: true` on bypass users)
- `src/auth/tests/permissions.guard.spec.ts` — 1 test case (set `isPlatformAdmin: true` on bypass user)
- `src/users/tests/users.service.spec.ts` — ~6 test cases (set `isPlatformAdmin: true` on SUPERADMIN target/actor mocks)

Tests adding NEW coverage:

- `src/users/tests/users.service.spec.ts` — add **negative paths**: user with `role: Role.SUPERADMIN` BUT `isPlatformAdmin: false` → modification IS allowed (capability gates, not legacy role). Verifies the boundary.
- NEW spec: `src/users/tests/platform-admin.spec.ts` — covers `isPlatformAdmin` default-false on creation; `toSafeUser` propagation; migration backfill invariant ("every pre-migration SUPERADMIN has isPlatformAdmin=true post-migration").

### Blast radius size

**7 production files + 3 spec files + 1 new spec = 11 files touched**. Above the 5-file extra-review threshold — flag for careful `/verify` regression sweep. The capability-vs-role intent split is the highest-attention semantic boundary.

## 3. Overview

Phase 0.3 of the AUTH v2 + Tenancy v1 program. Splits the conflated `Role.SUPERADMIN` enum value into two distinct concepts:

- **Cross-tenant capability** → `User.isPlatformAdmin: boolean` (NEW). The flag for "this user can bypass tenant boundaries". Gates `RolesGuard` + `PermissionsGuard` bypass and 4 `UsersService` protection paths.
- **Tenant-scoped Role enum value** → `User.role: Role.SUPERADMIN` (KEEP). Stays for Role-enum machinery in `PermissionsService` + MFA enforcement policy + tenant-scoped alerting + the `dto.role === SUPERADMIN` rejection path. Transitional; Phase 1 retires it after JWT v2.

Architecture principles applied:

- **Capability vs identity**: a privilege check should encode WHY (capability), not WHO (legacy role string).
- **Additive migration**: every existing SUPERADMIN gets `isPlatformAdmin=true` via same-transaction backfill; zero behavioral regression.
- **No JWT change**: `req.user.isPlatformAdmin` flows through `JwtStrategy.validate → usersService.findById → toSafeUser`. ONE extra boolean column on an already-fetched row.
- **Test the boundary**: negative-path test (`role=SUPERADMIN` but `isPlatformAdmin=false` → NO bypass) guards against the post-Phase-1 world where the legacy role might still exist on some users but capability has been revoked.

## 4. Architecture Context

### Modules involved

- **AuthModule** (existing) — `RolesGuard`, `PermissionsGuard`, `JwtStrategy` live here. No DI changes.
- **UsersModule** (existing) — `UsersService` updated; `User` interface updated; `toSafeUser` updated. No DI changes.
- **AuditModule** (existing) — `SUPERADMIN_BYPASS` audit action consumers unchanged (semantically the SAME action, just gated by capability now).
- **PrismaModule** (existing, @Global) — no module-level changes; schema migration only.

### Components affected

| Layer | File | Disposition |
|-------|------|-------------|
| Schema | `prisma/schema.prisma` | +1 field on User |
| Migration | `prisma/migrations/<timestamp>_user_platform_admin/migration.sql` (NEW) | ADD COLUMN + UPDATE backfill |
| Domain | `src/users/entities/user.entity.ts` | +1 line in interface, +1 line in `toSafeUser` |
| Guard | `src/auth/guards/roles.guard.ts` | bypass condition switch (1 line); request-type union update |
| Guard | `src/auth/guards/permissions.guard.ts` | bypass condition switch (1 line) |
| Service | `src/users/users.service.ts` | 4 site migrations + 1 site preserved |
| Tests | `roles.guard.spec.ts` + `permissions.guard.spec.ts` + `users.service.spec.ts` (MOD) | mock updates + new negative-path tests |
| Tests | `platform-admin.spec.ts` (NEW) | propagation + migration invariant |

## 5. Architecture Context — Patterns

### 5.1 Migration shape

```sql
-- AlterTable
ALTER TABLE "users" ADD COLUMN "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false;

-- Data backfill: preserve cross-tenant authority for existing SUPERADMIN users.
-- SCRUM-489 / AUTH v2 Phase 0.3 — see ai-specs/changes/auth/programs/AUTH-v2.md §2.2.
UPDATE "users" SET "isPlatformAdmin" = true WHERE "role" = 'SUPERADMIN';
```

Both statements in the same migration file. Postgres runs them in a transaction by default. Hand-rolled per the Accepted-Trivial pattern (shadow-DB blocked).

### 5.2 User interface + toSafeUser

```typescript
// src/users/entities/user.entity.ts
export interface User {
  // ... existing 22 fields ...
  isPlatformAdmin: boolean;  // NEW — cross-tenant capability flag [SCRUM-489]
  // ... existing trailing fields ...
}

// toSafeUser body: add one line
const safeUser: SafeUser = {
  // ... existing fields ...
  isPlatformAdmin: user.isPlatformAdmin,  // NEW [SCRUM-489]
  // ...
};
```

The `SafeUser` type alias (`Omit<User, ...sensitive>`) does NOT omit `isPlatformAdmin`, so the type carries through automatically. The function body assignment is explicit (no spread), so the line must be added manually.

### 5.3 RolesGuard bypass condition switch

```typescript
// src/auth/guards/roles.guard.ts (sketch — final code in /develop)
const request = context.switchToHttp().getRequest<{
  user?: { id: string; role: Role; isPlatformAdmin: boolean };  // type widened
  // ... rest unchanged ...
}>();

// Replace:
//   if (user?.role === Role.SUPERADMIN) { ... }
// With:
if (user?.isPlatformAdmin === true) {
  // Same audit log call; metadata shape unchanged.
  if (requiredRoles && requiredRoles.length > 0) {
    this.auditService.log({
      action: AuditAction.SUPERADMIN_BYPASS,  // ENUM VALUE STAYS (D-G)
      userId: user.id,
      // ... unchanged ...
    }).catch(() => {});
  }
  return true;
}
```

Update file-header JSDoc to document the capability-vs-role split.

### 5.4 PermissionsGuard symmetric change

```typescript
// src/auth/guards/permissions.guard.ts line 42:
// if (user.role === Role.SUPERADMIN) → if (user.isPlatformAdmin === true)
```

Request type union widened similarly to include `isPlatformAdmin`.

### 5.5 UsersService capability migrations

```typescript
// Pattern for each of the 4 capability sites (lines 795, 808, 874, 1134):
// Replace:
//   if (target.role === Role.SUPERADMIN)
// With:
if (target.isPlatformAdmin === true) {
  throw new ForbiddenException(ErrorMessages.user.OPERATION_NOT_PERMITTED);
}
```

Site #4 (line 808) is slightly different:
```typescript
// Replace:
//   actingUser.role !== Role.SUPERADMIN
// With:
!actingUser.isPlatformAdmin
```

Site #5 (line 800) is the ENUM-pathway gate — **DO NOT TOUCH**:
```typescript
// KEEP UNCHANGED:
if (dto.role === Role.SUPERADMIN) {
  throw new ForbiddenException(ErrorMessages.user.OPERATION_NOT_PERMITTED);
}
```

Add a JSDoc comment above each site explaining whether it gates capability or enum pathway (so future readers don't conflate them again).

## 6. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to `feature/SCRUM-489-auth-backend`.
- **Branch Naming**: MANDATORY `feature/SCRUM-489-auth-backend` (not `feature/SCRUM-489`).
- **Implementation Steps**:
  1. `git checkout main && git pull origin main` — verify HEAD is `c88fa88` or later (SCRUM-488 merged).
  2. `git checkout -b feature/SCRUM-489-auth-backend`.
  3. `git branch` — confirm.
- **Notes**: AUTH-deep ticket. `workflow-standards.mdc §15` review path is REQUIRED at /commit (multiple `src/auth/**` source files touched). Single-domain — no split-PR.

### Step 1: Add `isPlatformAdmin` to schema + migration

- **Files**: `nexacore-api/prisma/schema.prisma` (MOD), `nexacore-api/prisma/migrations/<timestamp>_user_platform_admin/migration.sql` (NEW).
- **Action**: Schema update + structural-and-data migration in one file.
- **Implementation Steps**:
  1. Edit `schema.prisma`: add `isPlatformAdmin Boolean @default(false)` to User model. Position: right after `role` for proximity (around line 16).
  2. Hand-write migration `prisma/migrations/<UTC timestamp>_user_platform_admin/migration.sql`:
     ```sql
     -- AlterTable
     ALTER TABLE "users" ADD COLUMN "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false;

     -- Data backfill (SCRUM-489 / AUTH v2 Phase 0.3)
     UPDATE "users" SET "isPlatformAdmin" = true WHERE "role" = 'SUPERADMIN';
     ```
  3. Apply: `npx prisma migrate deploy`.
  4. `npx prisma generate`.
  5. **Smoke verify**: pre-migration `SELECT COUNT(*) FROM users WHERE role = 'SUPERADMIN'` count must equal post-migration `SELECT COUNT(*) FROM users WHERE "isPlatformAdmin" = true` count. In dev, this is ≥1 (operator has at least 1 root SUPERADMIN seed).
- **Implementation Notes**: Both statements in the same migration file → atomic per Postgres transaction. If the dev DB is fresh and has no SUPERADMIN users, the UPDATE is a 0-row no-op (safe).

### Step 2: Update User interface + toSafeUser

- **File**: `nexacore-api/src/users/entities/user.entity.ts` (MOD).
- **Action**: Add `isPlatformAdmin: boolean` to the `User` interface; add the explicit pass-through line in `toSafeUser`.
- **Implementation Steps**:
  1. In the `User` interface, add `isPlatformAdmin: boolean;` (recommend: right after `role: Role;` for visual proximity to the field it replaces conceptually).
  2. In `toSafeUser`, add `isPlatformAdmin: user.isPlatformAdmin,` to the SafeUser literal (suggest: right after `role: user.role,`).
- **Implementation Notes**: TypeScript will now flag every place that constructs a `User` literal without `isPlatformAdmin`. Most are test fixtures — fix in Step 6. Production code constructs `User` only through Prisma queries, which will populate the new field from DB automatically (post-migration).

### Step 3: Update RolesGuard

- **File**: `nexacore-api/src/auth/guards/roles.guard.ts` (MOD).
- **Action**: Switch bypass condition; widen request-user type; update JSDoc.
- **Implementation Steps**:
  1. Widen the `getRequest<>` user type union to include `isPlatformAdmin: boolean`.
  2. Replace the bypass condition (line 39): `user?.role === Role.SUPERADMIN` → `user?.isPlatformAdmin === true`.
  3. Audit-log call body UNCHANGED (D-G: `SUPERADMIN_BYPASS` action name stays).
  4. Add JSDoc above the bypass block:
     ```typescript
     // Platform-admin bypasses ALL tenant-scoped role checks.
     // Capability is gated by User.isPlatformAdmin (SCRUM-489 / AUTH v2 Phase 0.3),
     // NOT by the legacy Role.SUPERADMIN enum value (which now exists only for
     // tenant-scoped Role-enum machinery — permissions catalog + MFA policy).
     ```
  5. Confirm `Role` import is still used (line 9 imports Role for the `requiredRoles: Role[]` reflector typing — DO NOT remove).
- **Implementation Notes**: The grep for `Role.SUPERADMIN` in this file should return ZERO matches after the change.

### Step 4: Update PermissionsGuard

- **File**: `nexacore-api/src/auth/guards/permissions.guard.ts` (MOD).
- **Action**: Same bypass-condition switch.
- **Implementation Steps**:
  1. Widen the request-user type union.
  2. Replace `user.role === Role.SUPERADMIN` (line 42) → `user.isPlatformAdmin === true`.
  3. JSDoc comment mirroring RolesGuard.
- **Implementation Notes**: This is a 1-line change.

### Step 5: Migrate UsersService capability-check sites (4 of 5)

- **File**: `nexacore-api/src/users/users.service.ts` (MOD).
- **Action**: Switch 4 capability checks; preserve 1 enum-pathway check.
- **Implementation Steps**:
  1. **Line 795** (`updateUser`, "Cannot modify SUPERADMIN target"): `target.role === Role.SUPERADMIN` → `target.isPlatformAdmin === true`. Add JSDoc comment: `// Capability gate (D-D, SCRUM-489): platform admins are untouchable.`
  2. **Line 800** (`updateUser`, "SUPERADMIN role cannot be assigned"): **DO NOT TOUCH**. Add JSDoc: `// Role-enum-value gate (KEEPS Role.SUPERADMIN — protects the enum value, not capability).`
  3. **Line 808** (`updateUser`, "Only SUPERADMIN can assign ADMIN role"): `actingUser.role !== Role.SUPERADMIN` → `!actingUser.isPlatformAdmin`. Add JSDoc: `// Capability gate: only platform admins can elevate to ADMIN.`
  4. **Line 874** (`deleteUser`): `target.role === Role.SUPERADMIN` → `target.isPlatformAdmin === true`. Add JSDoc.
  5. **Line 1134** (`selfDeleteAccount`): `user.role === Role.SUPERADMIN` → `user.isPlatformAdmin === true`. Add JSDoc.
- **Implementation Notes**: Each change is 1 line. The grep result after this step: 1 `Role.SUPERADMIN` match in this file (line 800, the enum-pathway gate).

### Step 6: Update specs + add new tests

- **Files**: `roles.guard.spec.ts`, `permissions.guard.spec.ts`, `users.service.spec.ts` (MOD); `src/users/tests/platform-admin.spec.ts` (NEW).
- **Action**: Fix bypass-test mocks; add boundary tests; add propagation/invariant tests.
- **Implementation Steps**:
  1. **`roles.guard.spec.ts`** — 4 test cases (lines 88, 107, 117, 142):
     - Change mock user from `{role: Role.SUPERADMIN}` to `{role: Role.SUPERADMIN, isPlatformAdmin: true}` (keep role for safety) OR `{role: Role.USER, isPlatformAdmin: true}` (proves bypass is on the flag, not role).
     - **Recommended**: use the second form to prove the new gate. Add a comment explaining that the test asserts capability-based bypass.
  2. **`permissions.guard.spec.ts`** — 1 test case (line 61). Same change.
  3. **`users.service.spec.ts`** — ~6 test cases (lines 1107, 1121-1124, 1136, 1323-1326, 1648):
     - For SUPERADMIN target/actor mocks, add `isPlatformAdmin: true`.
     - The test at line 1148 ("reject SUPERADMIN role assignment") KEEPS `role: Role.SUPERADMIN` — that's the enum-pathway test (no `isPlatformAdmin` needed).
     - **ADD a new negative-path test**: target with `role: Role.SUPERADMIN` BUT `isPlatformAdmin: false` → modification IS allowed. Asserts the boundary.
  4. **NEW `src/users/tests/platform-admin.spec.ts`** — focused suite:
     - Default-false on construction: a fresh User has `isPlatformAdmin = false`.
     - `toSafeUser` propagation: a User with `isPlatformAdmin = true` produces a SafeUser with `isPlatformAdmin = true`.
     - Migration-invariant smoke (unit-test-friendly): if Role.SUPERADMIN ever existed in a fixture, the migration would set `isPlatformAdmin = true`. This is documented as an integration concern; the unit version asserts the data-shape invariant.
- **Implementation Notes**: ~17 other spec files reference `role:` in mocks but don't break (non-bypass paths unaffected). Avoid touching them unless TS errors force it.

### Step 7: nest build + jest + lint

- **Action**: Final quality gates.
- **Implementation Steps**:
  1. `npm run build` — must exit clean.
  2. `npx jest --maxWorkers=1 --forceExit` — full suite green (baseline + new tests).
  3. `npx eslint 'src/auth/guards/roles.guard.ts' 'src/auth/guards/permissions.guard.ts' 'src/users/users.service.ts' 'src/users/entities/user.entity.ts' 'src/users/tests/platform-admin.spec.ts'` — clean.
  4. `npx prisma migrate status` — confirms the new migration applied.
  5. **Grep gate**: `grep -rn "Role.SUPERADMIN" src/auth/guards/ src/users/users.service.ts | grep -v "// KEEP" | grep -v "spec.ts"` — should return ONLY the line 800 ENUM-pathway gate. Any other production hit means a capability site was missed.

### Step N+1: Update Technical Documentation

- **Action**: DEFERRED-BY-DESIGN to `/update-docs`.
- **Files to update at `/update-docs`**:
  - `ai-specs/specs/integration-state.md`:
    - Guard Dependency Map: note that RolesGuard + PermissionsGuard bypass on `user.isPlatformAdmin === true` (not legacy `role === SUPERADMIN`).
    - Changelog row for 2026-05-19 SCRUM-489.
  - `ai-specs/specs/data-model.md`: User entity gains `isPlatformAdmin: boolean` field; `SUPERADMIN_BYPASS` AuditAction description updated to clarify that the trigger is now `isPlatformAdmin === true` while the action name preserved for log-history compatibility.
  - `ai-specs/changes/auth/programs/AUTH-v2.md` §6: Phase 0.3 marked COMPLETE; **correct the description** (from the misprediction "Tenant API surface" to the actual scope "User.isPlatformAdmin + Role refactor"); surface a placeholder for the HTTP-surface follow-up (Phase 0.4 or 1.x).
  - `ai-specs/specs/api-spec.yml`: **no change** (no endpoints introduced).
- **References**: `ai-specs/specs/documentation-standards.mdc`.

## 7. Implementation Order

1. Step 0 — Create feature branch
2. Step 1 — Schema + migration (add column + backfill UPDATE)
3. Step 2 — User interface + toSafeUser
4. Step 3 — RolesGuard bypass switch
5. Step 4 — PermissionsGuard bypass switch
6. Step 5 — UsersService 4 capability migrations (+ 1 KEEP)
7. Step 6 — Update specs + add platform-admin.spec.ts
8. Step 7 — Build + jest + lint + grep gate

(Step N+1 documentation update runs at `/update-docs`.)

## 8. Testing Checklist

Post-implementation verification:

- [ ] Migration applied: `prisma migrate status` clean.
- [ ] Backfill smoke: pre-migration SUPERADMIN count == post-migration `isPlatformAdmin=true` count.
- [ ] `nest build` exit 0.
- [ ] `npx jest --maxWorkers=1 --forceExit` — full project ≥ 1165 baseline + new tests; 0 failures.
- [ ] ESLint clean on all touched files.
- [ ] Migration directory has both ADD COLUMN and UPDATE statements.
- [ ] **Grep gate**: in `src/auth/guards/` + `src/users/users.service.ts`, only ONE `Role.SUPERADMIN` production reference remains (line 800, enum-pathway gate, with the KEEP JSDoc above it).
- [ ] **Behavioral gate**: a request from a user with `role=USER` but `isPlatformAdmin=true` triggers RolesGuard bypass + audit log; a request from a user with `role=SUPERADMIN` but `isPlatformAdmin=false` does NOT trigger bypass.

### Regression test checklist

- [ ] `src/auth/tests/roles.guard.spec.ts` — 4 mock-update test cases pass + bypass audit log still fires.
- [ ] `src/auth/tests/permissions.guard.spec.ts` — 1 mock-update test case passes.
- [ ] `src/users/tests/users.service.spec.ts` — ~6 mock updates pass + 1 NEW negative-path test passes.
- [ ] `src/users/tests/platform-admin.spec.ts` (NEW) — default-false + toSafeUser propagation tests pass.
- [ ] All ~17 other spec files referencing `role:` continue to pass unchanged.

## 9. Error Response Format

No new error responses introduced. Existing `ForbiddenException(ErrorMessages.user.OPERATION_NOT_PERMITTED)` is reused at the 4 migrated sites — same envelope:

```json
{
  "success": false,
  "error": {
    "message": "Operation not permitted",
    "code": "FORBIDDEN",
    "statusCode": 403
  }
}
```

No `ErrorMessages` namespace changes required (`user.OPERATION_NOT_PERMITTED` already exists).

## 10. Partial Update Support

N/A — no DTOs introduced or modified.

## 11. Dependencies

ZERO new dependencies. Pure TypeScript + Prisma schema additive. Already-installed packages:

- `@prisma/client ^7.8.0` (verified)
- `@nestjs/common` — `ForbiddenException`, `Injectable`
- `class-validator` — N/A (no DTOs)

## 12. Notes

### Business rules

- Phase 0.3 SPLITS the conflated `SUPERADMIN` concept. The Role enum value stays for transitional tenant-scoped policy + Role-enum machinery; the new `isPlatformAdmin` carries cross-tenant capability.
- Removing `User.role` or the `Role` enum is **Phase 1** work (after JWT v2). Do NOT remove either in this ticket.
- `SUPERADMIN_BYPASS` audit action name is preserved for log-history compatibility. The semantic meaning is unchanged (it still indicates a privileged bypass); only the trigger criterion moved from legacy role to capability flag.
- The `Role` import in `roles.guard.ts` is STILL USED (for `requiredRoles: Role[]` reflector typing). Do not remove the import even though `Role.SUPERADMIN` comparison is gone.

### Workflow / security constraints

- **NOT-§15 REQUIRED**: touches multiple `src/auth/**` files + `src/users/**` + `prisma/schema.prisma` — deepest AUTH ticket of the program. Single-domain → no split-PR per §15.3.3. CODEOWNERS auto-requests AUTH reviewers; PR description must cite §15.
- **NEVER `--no-verify`**: Husky pre-commit enforces Prettier — auto-fix at /develop step 7 if it fires.
- **NEVER commit fixes for other tickets**: any pre-existing bugs surfaced must land on a separate branch.

### Language

English only (commit messages, comments, audit metadata, JSDoc).

## 13. Next Steps After Implementation

1. Run `/verify SCRUM-489` IMMEDIATELY after Step 7. Do NOT skip — heavy semantic change deserves verification.
2. After `/verify` PASS / PASS-WITH-DEBT → `/commit SCRUM-489`.
3. CI Layer 4 (Backend Tests) expected PASS — the new tests are heavy coverage (≥10 net new cases on guard + service + helper paths). Coverage-net-positive.
4. After merge → `/update-docs SCRUM-489` for the deferred-by-design documentation updates (Step N+1), including the **AUTH-v2.md §6 correction** noted in /enrich-us.
5. Phase 0 is complete after this ticket. Operator decides whether to create a follow-up ticket for the HTTP surface (TenantsController + InvitationsService + /tenant/switch) — that was previously mis-labeled as Phase 0.3 in §6 but is actually a separate concern that has no ticket yet.

## 14. Implementation Verification

### Code Quality
- [ ] Every new/modified line has a brief comment explaining capability-vs-role intent where ambiguous.
- [ ] Zero `any` types in production code.
- [ ] No new hardcoded error strings outside `ErrorMessages`.
- [ ] No new `process.env` reads outside ConfigService.
- [ ] JSDoc on RolesGuard + PermissionsGuard + UsersService capability sites explains the gate type.

### Functionality
- [ ] Migration is forward-only safe (no breaking change at the column level).
- [ ] Existing SUPERADMIN users continue to bypass (via `isPlatformAdmin=true` post-backfill).
- [ ] Future user with `role=USER` + `isPlatformAdmin=true` can bypass (capability-based gate works).
- [ ] Future user with `role=SUPERADMIN` + `isPlatformAdmin=false` CANNOT bypass (negative-path proven).
- [ ] Audit log written with `SUPERADMIN_BYPASS` action when bypass triggers + roles were required.

### Testing
- [ ] All spec files green.
- [ ] New `platform-admin.spec.ts` green.
- [ ] Coverage net-positive vs main (target +0.5pp; the spec files are dense).

### Regression
- [ ] All 7 production files in blast radius compile + tests pass.
- [ ] All 3 spec files in mock-update list pass.
- [ ] ~17 other spec files referencing `role:` pass unchanged.
- [ ] `nest start` does not crash with DI errors.
- [ ] `prisma migrate status` confirms applied migration.

### Integration
- [ ] No new module imports needed.
- [ ] No new exports.
- [ ] No new guards.
- [ ] No new endpoints.

### Documentation updates
- [ ] Deferred-by-design to `/update-docs` (Step N+1) — checklist applied there.

### NOT-§15 review path
- [ ] PR title includes `[SCRUM-489]`.
- [ ] PR description cites §15 review path + lists AUTH boundary files touched.
- [ ] CODEOWNERS auto-requests AUTH reviewers.

---

## Module-Level Planning

**N/A** — this ticket extends the existing `User` entity, `RolesGuard`, `PermissionsGuard`, and `UsersService`. No new NexaCore module. The `isPlatformAdmin` field is an additive boolean on `User`; the `TenantRole` enum (created in SCRUM-487) is referenced for context but not modified.

## Satellite App Planning

**N/A** — backend NexaCore-internal AUTH refactor. No satellite app involved.
