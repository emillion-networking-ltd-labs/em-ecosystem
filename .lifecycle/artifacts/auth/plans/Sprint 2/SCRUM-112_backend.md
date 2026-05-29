# Backend Implementation Plan: SCRUM-112 Rate Limiting Gaps

## 1. Codebase State Snapshot

- **Date**: 2026-03-02
- **Last completed ticket**: SCRUM-106 (Redis-backed OAuth stores)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/auth/auth.controller.ts` — line 505: `@Post('oauth/exchange')` has NO `@Throttle`
  - `src/auth/mfa.controller.ts` — line 163: `@Get('status')` has NO `@Throttle`
  - `src/auth/constants/auth.constants.ts` — `AUTH_RATE_LIMITS.oauth = { ttl: 60_000, limit: 10 }`, `AUTH_RATE_LIMITS.mfa = { ttl: 60_000, limit: 5 }`
  - `src/auth/tests/mfa.controller.spec.ts` — line 262: existing test asserts `status` does NOT have `@Throttle` (must be changed)
  - `src/auth/tests/auth.controller.spec.ts` — no throttle metadata tests exist for `exchangeOAuthCode`
  - `ai-specs/specs/integration-state.md` — line 80: claims `POST /oauth/exchange` has `@Throttle` (incorrect, will become correct after fix)
  - `ai-specs/specs/api-spec.yml` — lines 283-316: `/auth/oauth/exchange` has no 429 response
- **Constructor signatures verified**: N/A (decorator-only changes, no DI modifications)
- **Guard dependency chain verified**: N/A (no new guards)

## 2. Overview

Add missing `@Throttle` decorators to 2 auth endpoints found during the 2026-03-02 code audit. Both are decorator-only changes with no logic modifications. This closes the last rate-limiting consistency gaps in the auth module.

## 3. Architecture Context

- **Module**: AuthModule (auth.controller.ts), AuthModule (mfa.controller.ts)
- **Components affected**: 2 controllers (decorator additions), 2 test files, 1 spec doc, 1 integration doc
- **No new providers, imports, exports, or DI changes**

## 4. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-112-backend` from latest `main`
- **Branch Naming**: `feature/SCRUM-112-backend`

### Step 1: Add @Throttle to POST /auth/oauth/exchange

- **File**: `src/auth/auth.controller.ts`
- **Action**: Add `@Throttle` decorator with `AUTH_RATE_LIMITS.oauth` before `@Post('oauth/exchange')` at line 505
- **Implementation Steps**:
  1. Add the following decorator before `@Post('oauth/exchange')`:
     ```typescript
     @Throttle({
       global: {
         ttl: AUTH_RATE_LIMITS.oauth.ttl,
         limit: AUTH_RATE_LIMITS.oauth.limit,
       },
     })
     ```
  2. `AUTH_RATE_LIMITS` is already imported (line 31). `Throttle` is already imported (line 25). No new imports needed.
- **Dependencies**: None (all imports already exist)
- **Implementation Notes**: This matches the pattern used on `GET /auth/google` (line ~459) and `GET /auth/github` (line ~478) which also use `AUTH_RATE_LIMITS.oauth`.

### Step 2: Add @Throttle to GET /auth/mfa/status

- **File**: `src/auth/mfa.controller.ts`
- **Action**: Add `@Throttle` decorator with `AUTH_RATE_LIMITS.mfa` before `@Get('status')` at line 163
- **Implementation Steps**:
  1. Add the following decorator before `@Get('status')`:
     ```typescript
     @Throttle({
       global: {
         ttl: AUTH_RATE_LIMITS.mfa.ttl,
         limit: AUTH_RATE_LIMITS.mfa.limit,
       },
     })
     ```
  2. `AUTH_RATE_LIMITS` is already imported (line 23). `Throttle` is already imported (line 19). No new imports needed.
- **Dependencies**: None
- **Implementation Notes**: This makes all 6 MFA endpoints consistently throttled with `AUTH_RATE_LIMITS.mfa` (5 req/60s).

### Step 3: Update mfa.controller.spec.ts

- **File**: `src/auth/tests/mfa.controller.spec.ts`
- **Action**: Change the existing test at line 262 that asserts `status` does NOT have `@Throttle` to instead assert it DOES have `@Throttle`
- **Implementation Steps**:
  1. Add `'status'` to the `throttledMethods` array at line 239 (currently: `['setup', 'verifySetup', 'verifyLogin', 'disable', 'regenerateCodes']`)
  2. Delete the standalone test at lines 262-268 (`it('should NOT have @Throttle on status (inherits global)')`)
- **Implementation Notes**: After this change, the loop at line 247 will test all 6 methods including `status`.

### Step 4: Add throttle metadata test for exchangeOAuthCode in auth.controller.spec.ts

- **File**: `src/auth/tests/auth.controller.spec.ts`
- **Action**: Add a new test verifying `@Throttle` metadata exists on `exchangeOAuthCode`
- **Implementation Steps**:
  1. Add a new `describe` block or test within the existing `exchangeOAuthCode` describe block (around line 396):
     ```typescript
     it('should have @Throttle decorator', () => {
       const limitMeta = Reflect.getMetadata(
         'THROTTLER:LIMITglobal',
         controller.exchangeOAuthCode,
       );
       const ttlMeta = Reflect.getMetadata(
         'THROTTLER:TTLglobal',
         controller.exchangeOAuthCode,
       );
       expect(limitMeta).toBeDefined();
       expect(ttlMeta).toBeDefined();
     });
     ```
- **Dependencies**: `Reflect` (globally available in NestJS test environment)

### Step 5: Update api-spec.yml

- **File**: `ai-specs/specs/api-spec.yml`
- **Action**: Add 429 response to `POST /auth/oauth/exchange` (after line 316)
- **Implementation Steps**:
  1. Add after the `'401'` response block:
     ```yaml
     '429':
       description: Too many exchange attempts — rate limited (10 req/60s per IP)
     ```
- **Implementation Notes**: Matches the pattern used on other throttled endpoints.

### Step 6: Verify integration-state.md

- **File**: `ai-specs/specs/integration-state.md`
- **Action**: Verify line 80 already says `@Throttle` for `POST /oauth/exchange` (it does — the doc was ahead of the code). No change needed.
- **Also verify**: MfaController table — `GET /auth/mfa/status` currently shows no `@Throttle`. Update to add `@Throttle(mfa)`.
- **Implementation Steps**:
  1. In the MfaController Method Guards table, update the row for `GET /auth/mfa/status`:
     - Change `— (inherits global)` decorators to `@Throttle(mfa)`

### Step 7: Build, Test, and Verify

- **Action**: Run post-implementation integrity checks
- **Implementation Steps**:
  1. `npx nest build` — must compile clean
  2. `npx jest --maxWorkers=1 --forceExit` — all tests must pass (expect 557+)
  3. `npx jest --coverage` — verify thresholds met

### Step 8: Update Technical Documentation

- **Action**: Review and confirm all documentation is updated
- **Implementation Steps**:
  1. `api-spec.yml` — 429 on oauth/exchange (Step 5)
  2. `integration-state.md` — MfaController table updated (Step 6)
  3. No `data-model.md` changes (no schema changes)
  4. No `backend-standards.mdc` changes

## 5. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Add `@Throttle` to `POST /auth/oauth/exchange`
3. Step 2: Add `@Throttle` to `GET /auth/mfa/status`
4. Step 3: Update `mfa.controller.spec.ts` (flip test assertion)
5. Step 4: Add throttle test in `auth.controller.spec.ts`
6. Step 5: Update `api-spec.yml`
7. Step 6: Verify/update `integration-state.md`
8. Step 7: Build + test + coverage
9. Step 8: Documentation review

## 6. Testing Checklist

- [ ] `mfa.controller.spec.ts`: `status` method now in `throttledMethods` array, standalone "NOT have" test removed
- [ ] `auth.controller.spec.ts`: new test verifies `@Throttle` metadata on `exchangeOAuthCode`
- [ ] All 557+ existing tests still pass
- [ ] `nest build` compiles clean
- [ ] Coverage thresholds met

## 7. Error Response Format

No new error responses. The `@Throttle` decorator produces the standard 429 response via `CustomThrottlerGuard`:

```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests",
  "error": "Too Many Requests",
  "retryAfter": 45
}
```

## 8. Partial Update Support

N/A — decorator-only changes.

## 9. Dependencies

None. All required packages (`@nestjs/throttler`) and imports (`Throttle`, `AUTH_RATE_LIMITS`) already exist.

## 10. Notes

- `AUTH_RATE_LIMITS.oauth` = `{ ttl: 60_000, limit: 10 }` — 10 requests per 60 seconds per IP
- `AUTH_RATE_LIMITS.mfa` = `{ ttl: 60_000, limit: 5 }` — 5 requests per 60 seconds per IP
- The `integration-state.md` line 80 discrepancy (claims `@Throttle` exists when it didn't) will be resolved by adding the actual decorator — no doc fix needed for that line
- The `mfa.controller.spec.ts` has an existing test that explicitly asserts `status` does NOT have `@Throttle` — this must be updated, not just a new test added

## 11. Next Steps After Implementation

- Proceed to SCRUM-113 (Redis Store Atomicity)

## 12. Implementation Verification

- [ ] `POST /auth/oauth/exchange` responds with 429 after 10 requests in 60s
- [ ] `GET /auth/mfa/status` responds with 429 after 5 requests in 60s
- [ ] All decorator metadata tests pass
- [ ] `integration-state.md` MfaController table accurate
- [ ] `api-spec.yml` has 429 on `/auth/oauth/exchange`
- [ ] Build clean, all tests pass, coverage thresholds met

## 13. Module-Level Planning

N/A — no module-level changes.

## 14. Satellite App Planning

N/A — NexaCore internal changes only.
