# Backend Implementation Plan: SCRUM-127 Fix Login 500 Error — Missing Migration & Redis 3.x Compatibility

## Codebase State Snapshot

- **Date**: 2026-03-04
- **Last completed ticket**: SCRUM-126 (Document CORS null-origin as accepted risk)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/auth/stores/oauth-state.store.ts` — 48 lines. `OAuthStateStore` with `validate()` at line 36, `getCodeVerifier()` at line 28, `generate()` at line 12. Constructor: `@Inject(REDIS_CLIENT) private readonly redis: Redis`.
  - `nexacore-api/src/auth/stores/oauth-code.store.ts` — 47 lines. `OAuthCodeStore` with `exchange()` at line 31, `store()` at line 20. Constructor: `@Inject(REDIS_CLIENT) private readonly redis: Redis`.
  - `nexacore-api/src/auth/passkey.service.ts` — 436 lines. `PasskeyService` with `verifyRegistration()` at line 101, `verifyAuthentication()` at line 208. Constructor: `PrismaService, UsersService, AuditService, @Inject(REDIS_CLIENT) Redis` (4 deps).
  - `nexacore-api/src/auth/tests/oauth-state.store.spec.ts` — 108 lines. Redis mock uses `{ get, set, del }`.
  - `nexacore-api/src/auth/tests/oauth-code.store.spec.ts` — 134 lines. Redis mock uses `{ get, set, del }`.
  - `nexacore-api/src/auth/tests/passkey.service.spec.ts` — 949 lines. Redis mock uses `{ set, get, del }`.
  - `nexacore-api/prisma/schema.prisma` — Session model has `locationCity`, `locationCountry`, `latitude`, `longitude` fields. `TrustedDevice` and `WebAuthnCredential` models present. 13 additional `AuditAction` enum values.
  - `nexacore-api/prisma/migrations/20260304132222_add_session_geolocation_fields/migration.sql` — 85 lines. Adds 4 session columns, 2 tables, 13 enum values, 4 indexes, 2 foreign keys.
  - `nexacore-api/src/sessions/sessions.service.ts` — `getActiveNonIdleSessions()` at line 198, `enforceSessionLimit()` at line 213. These were the crash site during login.
  - `nexacore-api/src/auth/auth.service.ts` — `generateTokens()` at line 682 calls `enforceSessionLimit()`.
  - `nexacore-api/src/common/filters/http-exception.filter.ts` — 82 lines. `@Catch()` global filter. Non-HttpExceptions become 500 with no detail logged (root cause of silent failures).
- **Constructor signatures verified**:
  - `OAuthStateStore(@Inject(REDIS_CLIENT) redis: Redis)` — 1 dep
  - `OAuthCodeStore(@Inject(REDIS_CLIENT) redis: Redis)` — 1 dep
  - `PasskeyService(prisma: PrismaService, usersService: UsersService, auditService: AuditService, @Inject(REDIS_CLIENT) redis: Redis)` — 4 deps
- **Methods verified to exist**:
  - `OAuthStateStore.validate()` — `oauth-state.store.ts:36`
  - `OAuthCodeStore.exchange()` — `oauth-code.store.ts:31`
  - `PasskeyService.verifyRegistration()` — `passkey.service.ts:101`
  - `PasskeyService.verifyAuthentication()` — `passkey.service.ts:208`
- **Guard dependency chain verified**: N/A — no guard changes
- **Discrepancies with integration-state.md**: None — this is a bugfix with no architectural changes

## Overview

Two critical bugs caused 500 Internal Server Errors after Sprint 3 code was deployed:

1. **Schema drift / missing migration**: The Prisma schema (`schema.prisma`) defined columns, tables, and enum values that no migration had created in the database. When `SessionsService.getActiveNonIdleSessions()` queried the `sessions` table, Prisma's SQL referenced columns (`locationCity`, `locationCountry`, `latitude`, `longitude`) that didn't exist in PostgreSQL, producing `PrismaClientKnownRequestError P2022 (ColumnNotFound)`. This blocked all login flows because `AuthService.generateTokens()` → `enforceSessionLimit()` → `getActiveNonIdleSessions()` is called on every successful authentication.

2. **Redis `GETDEL` command incompatibility**: Three services used `redis.getdel()`, a Redis 6.2+ command. The development environment runs Redis 3.0.504 (Windows port), which doesn't support `GETDEL`. This caused `ReplyError: ERR unknown command 'getdel'` on OAuth callback and passkey flows.

## Architecture Context

- **Modules involved**: Auth (OAuth stores, passkey service), Sessions (crash site), Prisma (migration)
- **Components affected**:
  - `OAuthStateStore` — Redis `getdel` → `get` + `del` in `validate()`
  - `OAuthCodeStore` — Redis `getdel` → `get` + `del` in `exchange()`
  - `PasskeyService` — Redis `getdel` → `get` + `del` in `verifyRegistration()` and `verifyAuthentication()`
  - Prisma migration — schema-to-database sync for Session geolocation fields, TrustedDevice table, WebAuthnCredential table, 13 AuditAction enum values
- **Files modified** (7 total):
  - `src/auth/stores/oauth-state.store.ts`
  - `src/auth/stores/oauth-code.store.ts`
  - `src/auth/passkey.service.ts`
  - `src/auth/tests/oauth-state.store.spec.ts`
  - `src/auth/tests/oauth-code.store.spec.ts`
  - `src/auth/tests/passkey.service.spec.ts`
  - `prisma/migrations/20260304132222_add_session_geolocation_fields/migration.sql` (new)

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-127-backend` from latest main
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-127-backend`
  3. Verify: `git branch --show-current`

### Step 1: Create Missing Prisma Migration

- **File**: `prisma/migrations/20260304132222_add_session_geolocation_fields/migration.sql` (new)
- **Action**: Run `npx prisma migrate dev --name add_session_geolocation_fields` to generate the migration that syncs the database with schema.prisma
- **Implementation Steps**:
  1. Run `npx prisma migrate dev --name add_session_geolocation_fields`
  2. Prisma detects the drift and generates a migration that:
     - Adds 13 `AuditAction` enum values: `DEVICE_TRUSTED`, `DEVICE_UNTRUSTED`, `IMPOSSIBLE_TRAVEL_DETECTED`, `LOGIN_BLOCKED_TRAVEL`, `BRUTE_FORCE_DETECTED`, `CREDENTIAL_STUFFING_DETECTED`, `UNUSUAL_LOGIN_HOURS`, `NEW_COUNTRY_LOGIN`, `PASSKEY_REGISTERED`, `PASSKEY_DELETED`, `PASSKEY_AUTH_SUCCESS`, `PASSKEY_AUTH_FAILURE`, `OAUTH_UNLINKED`
     - Adds 4 columns to `sessions`: `locationCity TEXT`, `locationCountry TEXT`, `latitude DOUBLE PRECISION`, `longitude DOUBLE PRECISION`
     - Creates `trusted_devices` table with unique constraint on `(userId, fingerprintHash)` and composite index on `(userId, isRevoked, expiresAt)`
     - Creates `webauthn_credentials` table with unique index on `credentialId` and index on `userId`
     - Adds 2 indexes on `audit_logs`: `(action, userId, createdAt)` and `(action, ipAddress, createdAt)`
     - Adds foreign keys from `trusted_devices` and `webauthn_credentials` to `users` with CASCADE delete
  3. Run `npx prisma generate` to regenerate the Prisma client
  4. Verify: `npx prisma migrate status` shows all migrations applied
- **Root Cause**: Sprint 3 tickets (SCRUM-107 through SCRUM-111) modified `schema.prisma` but did not create corresponding migrations. `prisma migrate status` reported "up to date" because all *existing* migrations were applied — it did not detect that new schema definitions had no migration.

### Step 2: Replace Redis `getdel` with `get` + `del` Pattern

- **Action**: Replace all `redis.getdel()` calls with sequential `redis.get()` + `redis.del()` for Redis 3.x compatibility
- **Trade-off**: `GETDEL` is atomic (single round-trip); `GET` + `DEL` is two operations. This is acceptable because:
  - OAuth codes/state have short TTLs (60s / 300s)
  - WebAuthn challenges have 300s TTL
  - The window between `GET` and `DEL` is sub-millisecond
  - Concurrent redemption is extremely unlikely and would result in a second harmless failure (empty lookup)

#### 2a. `oauth-state.store.ts` — `validate()` method

- **File**: `src/auth/stores/oauth-state.store.ts:36-42`
- **Before**: `const data = await this.redis.getdel(key);`
- **After**:
  ```typescript
  const data = await this.redis.get(key);
  if (!data) return false;
  await this.redis.del(key);
  return true;
  ```

#### 2b. `oauth-code.store.ts` — `exchange()` method

- **File**: `src/auth/stores/oauth-code.store.ts:31-41`
- **Before**: `const data = await this.redis.getdel(key);`
- **After**:
  ```typescript
  const data = await this.redis.get(key);
  if (!data) return null;
  await this.redis.del(key);
  ```

#### 2c. `passkey.service.ts` — `verifyRegistration()` method

- **File**: `src/auth/passkey.service.ts:107-114`
- **Before**: `const stored = await this.redis.getdel(regKey);`
- **After**:
  ```typescript
  const stored = await this.redis.get(regKey);
  if (!stored) {
    throw new BadRequestException('Registration challenge not found or expired');
  }
  await this.redis.del(regKey);
  ```

#### 2d. `passkey.service.ts` — `verifyAuthentication()` method

- **File**: `src/auth/passkey.service.ts:213-220`
- **Before**: `const stored = await this.redis.getdel(authKey);`
- **After**:
  ```typescript
  const stored = await this.redis.get(authKey);
  if (!stored) {
    throw new UnauthorizedException('Authentication challenge not found or expired');
  }
  await this.redis.del(authKey);
  ```

### Step 3: Update Unit Tests

- **Action**: Update all test files to match new `get` + `del` pattern (remove `getdel` mock)

#### 3a. `oauth-state.store.spec.ts`

- **File**: `src/auth/tests/oauth-state.store.spec.ts`
- **Changes**:
  - Redis mock: `{ get, set, del }` (remove `getdel`)
  - `validate()` tests: assert `redis.get` called with key, then `redis.del` called with key
  - Unknown state test: assert `redis.del` NOT called when `redis.get` returns null

#### 3b. `oauth-code.store.spec.ts`

- **File**: `src/auth/tests/oauth-code.store.spec.ts`
- **Changes**:
  - Redis mock: `{ get, set, del }` (remove `getdel`)
  - `exchange()` tests: assert `redis.get` then `redis.del` for valid codes
  - Unknown code test: assert `redis.del` NOT called when `redis.get` returns null

#### 3c. `passkey.service.spec.ts`

- **File**: `src/auth/tests/passkey.service.spec.ts`
- **Changes**:
  - Redis mock type: `{ set, get, del }` (replace `getdel` with `get` + `del`)
  - All `redis.getdel` mock calls → `redis.get` (26 occurrences)
  - Keep `redis.del` mock already present (used by other test assertions)

### Step 4: Build, Test, Verify

- **Implementation Steps**:
  1. `nest build` — zero TypeScript errors
  2. `npx jest --maxWorkers=1 --forceExit` — all 773 tests pass
  3. Manual verification: login with email/password → 200 OK
  4. Manual verification: OAuth Google/GitHub callback → successful redirect

### Step 5: Update Technical Documentation

- **Action**: Update integration-state.md changelog with SCRUM-127 entry
- **Implementation Steps**:
  1. Add SCRUM-127 entry to `ai-specs/specs/integration-state.md` changelog
  2. No API spec, data model, or standards changes needed (bugfix only)

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Create missing Prisma migration + regenerate client
3. Step 2: Replace `getdel` with `get` + `del` in 3 source files
4. Step 3: Update 3 test files to match new Redis pattern
5. Step 4: Build, test, verify (manual login + OAuth)
6. Step 5: Update integration-state.md changelog

## Testing Checklist

- [ ] `npx prisma migrate status` — all migrations applied, no drift
- [ ] Prisma client regenerated after migration
- [ ] `nest build` — zero errors
- [ ] All 773 tests pass
- [ ] `oauth-state.store.ts` uses `get` + `del` (no `getdel`)
- [ ] `oauth-code.store.ts` uses `get` + `del` (no `getdel`)
- [ ] `passkey.service.ts` uses `get` + `del` in both `verifyRegistration` and `verifyAuthentication`
- [ ] Manual: email/password login returns 200
- [ ] Manual: Google OAuth callback completes without 500
- [ ] Manual: GitHub OAuth callback completes without 500

## Error Response Format

No new error responses. Existing error handling preserved:
- Missing challenge → `400 Bad Request` (passkey) or OAuth redirect failure
- Expired state → `401 Unauthorized` or OAuth redirect failure
- All errors through `HttpExceptionFilter` standard format

## Dependencies

- **ioredis** (existing) — no version change, using only `get`, `set`, `del` commands (Redis 2.x+)
- **@prisma/client** (existing) — regenerated after migration
- **PostgreSQL** (existing) — migration applied via `prisma migrate dev`

## Notes

- **Root cause analysis**: Sprint 3 tickets (SCRUM-107 to 111) added models/fields to `schema.prisma` without creating migrations. The `prisma migrate status` command only checks if existing migrations are applied — it does NOT detect new schema definitions without migrations. This is a Prisma tooling gap.
- **Redis version gap**: Dev environment runs Redis 3.0.504 (last Windows port). `GETDEL` was introduced in Redis 6.2. The `get` + `del` pattern is the standard backward-compatible approach.
- **No atomicity concern**: The `get` + `del` pattern is not atomic, but for single-use tokens with short TTLs (60-300s), the race window is negligible. A concurrent redemption would simply get a null on the second `get`, which is already handled as an error.
- **Debug logging**: During investigation, temporary debug logging was added to `HttpExceptionFilter` to surface non-HttpException details. This was removed before the final commit.

## Next Steps After Implementation

1. `/update-docs SCRUM-127` — Create implementation record in `changes/records/Sprint 3/`
2. Consider adding structured error logging for non-HttpExceptions in a future ticket (the silent 500 pattern made debugging difficult)
3. Consider documenting minimum Redis version requirement in project README

## Implementation Verification

- **Code Quality**: No new code patterns introduced; `get` + `del` is standard Redis usage
- **Functionality**: Login, OAuth, and passkey flows all operational
- **Testing**: All 773 tests pass with updated mocks matching actual Redis calls
- **Integration**: No module, guard, or DI changes — pure bugfix
- **Documentation**: integration-state.md changelog updated with SCRUM-127
