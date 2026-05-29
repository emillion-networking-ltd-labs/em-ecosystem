# Backend Implementation Plan: SCRUM-256 Code Hygiene Batch A (CH-01, EM-08, DU-04, TS-05)

## Codebase State Snapshot

- **Date**: 2026-03-16
- **Last completed ticket**: SCRUM-255 (SM-03 — Decompose 3 auth functions >75 lines)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/auth/auth.controller.ts` — AuthController constructor: `AuthService, PermissionsService` (2 deps). Has `private setCookie(res, cookie)` at line 59.
  - `src/auth/oauth.controller.ts` — OAuthController constructor: `AuthService, ConfigService, OAuthLinkCodeStore` (3 deps). Has duplicate `private setCookie(res, cookie)` at line 47. Has `private setOAuthCodeCookie()` at line 245 with `maxAge: 30_000`.
  - `src/auth/account.controller.ts` — No constructor deps read (uses AuthService). Lines 94 and 119 have inline `{ ttl: 900000, limit: 3 }`.
  - `src/auth/mfa.service.ts` — MfaService constructor: `UsersService, CryptoService, JwtService, AuditService, TrustedDeviceService, ConfigService` (6 deps). Lines 209 and 246 use `ErrorMessages.mfa.PASSWORD_REQUIRED_NO_PASSWORD`.
  - `src/auth/constants/auth.constants.ts` — Contains `AUTH_RATE_LIMITS` with 8 entries (login, register, refresh, oauth, mfa, verify_email, reset_password, trust_device). No `sensitive_action` or `user_settings` entry.
  - `src/common/constants/error-messages.ts` — `mfa.PASSWORD_REQUIRED_NO_PASSWORD` = `'Password confirmation required but no password set'` at line 23-24.
  - `src/auth/strategies/pkce-authenticate.ts` — `superAuthenticate: Function` at line 16.
  - `src/users/users.controller.ts` — Lines 84 and 129 have inline `{ ttl: 60_000, limit: 5 }`.
  - `src/common/utils/` — Contains: `pseudonymize-email.ts`, `request-meta.ts`, `validate-production-secrets.ts`. No `cookie.util.ts` exists yet.
- **Constructor signatures verified**:
  - `AuthController(authService: AuthService, permissionsService: PermissionsService)` — no changes planned
  - `OAuthController(authService: AuthService, configService: ConfigService, oauthLinkCodeStore: OAuthLinkCodeStore)` — no constructor changes planned
  - `MfaService(usersService, cryptoService, jwtService, auditService, trustedDeviceService, configService)` — no constructor changes planned
- **Methods verified to exist**:
  - `AuthController.setCookie()` at line 59 — will be removed (extracted to utility)
  - `OAuthController.setCookie()` at line 47 — will be removed (extracted to utility)
  - `OAuthController.setOAuthCodeCookie()` at line 245 — will be modified (use constant for maxAge)
- **Guard dependency chain verified**: No guard changes in this ticket
- **Discrepancies with integration-state.md**: None relevant to this ticket

## Regression Impact Analysis

- **Blast radius**:
  - **Direct dependents** (import modified files): None — no exports/constructors change
  - **Test dependents** (mock modified classes):
    - `auth/tests/auth.controller.spec.ts` — tests AuthController (setCookie is private, tested indirectly)
    - `auth/tests/oauth.controller.spec.ts` — tests OAuthController (setCookie/setOAuthCodeCookie tested indirectly)
    - `auth/tests/oauth-exchange.spec.ts` — tests OAuth exchange flow
    - `auth/tests/mfa.service.spec.ts` — tests MfaService (tests PASSWORD_REQUIRED_NO_PASSWORD message)
    - `auth/tests/mfa.controller.spec.ts` — tests MfaController (may assert on cookie values)
    - `auth/tests/pkce-authenticate.spec.ts` — tests pkce-authenticate (Function type used)
    - `users/tests/users.controller.spec.ts` — tests UsersController (no impact from rate limit constant extraction)
  - **pkce strategy consumers**:
    - `auth/strategies/google.strategy.ts` — calls `applyPkceAuthenticate()` passing `super.authenticate` (Function→typed)
    - `auth/strategies/github.strategy.ts` — calls `applyPkceAuthenticate()` passing `super.authenticate` (Function→typed)
- **Breaking changes identified**:
  - **EM-08**: Error message text change (`PASSWORD_REQUIRED_NO_PASSWORD` value changes). Test file `mfa.service.spec.ts` likely asserts on this message string → must update.
  - **DU-04**: `setCookie` method removed from AuthController and OAuthController → tests that spy on it need updating. However, since it's `private`, tests don't call it directly — they assert on `res.cookie()` calls which won't change.
  - **TS-05**: `Function` → typed callback. Strategy files pass `super.authenticate` which matches `(...args: unknown[]) => void`. No runtime change.
- **API contract impact**: None — no endpoint routes, DTOs, or response schemas change.
- **Schema migration impact**: None — no Prisma changes.
- **Test files requiring updates**:
  - `auth/tests/mfa.service.spec.ts` — update expected error message string for PASSWORD_REQUIRED_NO_PASSWORD
  - `auth/tests/oauth.controller.spec.ts` — update expected `maxAge: 30_000` → use constant (if test hard-codes the value)
  - `auth/tests/pkce-authenticate.spec.ts` — no change needed (tests don't check types at runtime)
- **Blast radius size**: 9 files affected (low risk — all changes are internal refactors with no public API changes)

## Overview

This ticket fixes 4 code hygiene WARNs from the auth audit (2026-03-15). All changes are internal refactors — no public API, constructor, or module boundary changes. The changes improve maintainability by extracting magic numbers to constants, unifying error messages, eliminating code duplication, and fixing an unsafe TypeScript type.

## Architecture Context

- **Modules involved**: AuthModule (controllers, services, strategies, constants), UsersModule (controller), CommonModule (utils, constants)
- **Components affected**: AuthController, OAuthController, AccountController, UsersController, MfaService, error-messages.ts, auth.constants.ts, pkce-authenticate.ts
- **No new modules, guards, or DI changes**

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create feature branch from latest main
- **Branch Naming**: `feature/SCRUM-256-backend`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-256-backend`
  3. `git branch` — verify

### Step 1: Extract Magic Numbers to Constants (CH-01)

- **File**: `src/auth/constants/auth.constants.ts`
- **Action**: Add new rate limit entries and cookie constant
- **Implementation Steps**:
  1. Add `sensitive_action` entry to `AUTH_RATE_LIMITS`:
     ```typescript
     sensitive_action: { ttl: 900_000, limit: 3 }, // 15 min, 3 requests (email resend, password reset)
     ```
  2. Add `user_settings` entry to `AUTH_RATE_LIMITS`:
     ```typescript
     user_settings: { ttl: 60_000, limit: 5 }, // 60s, 5 requests (email change, oauth unlink)
     ```
  3. Add `OAUTH_CODE_COOKIE_MAX_AGE_MS` constant:
     ```typescript
     /** OAuth code cookie max age in milliseconds (30 seconds). */
     export const OAUTH_CODE_COOKIE_MAX_AGE_MS = 30_000;
     ```

### Step 2: Replace Inline Rate Limits in AccountController (CH-01)

- **File**: `src/auth/account.controller.ts`
- **Action**: Replace `{ ttl: 900000, limit: 3 }` with `AUTH_RATE_LIMITS.sensitive_action`
- **Implementation Steps**:
  1. Line 94: Replace `global: { ttl: 900000, limit: 3 }` with `global: { ttl: AUTH_RATE_LIMITS.sensitive_action.ttl, limit: AUTH_RATE_LIMITS.sensitive_action.limit }`
  2. Line 119: Same replacement
  3. Verify `AUTH_RATE_LIMITS` is already imported (line 25 confirms it is)

### Step 3: Replace Inline Rate Limits in UsersController (CH-01)

- **File**: `src/users/users.controller.ts`
- **Action**: Replace `{ ttl: 60_000, limit: 5 }` with `AUTH_RATE_LIMITS.user_settings`
- **Implementation Steps**:
  1. Add import: `import { AUTH_RATE_LIMITS } from '../auth/constants/auth.constants';`
  2. Line 84: Replace `{ ttl: 60_000, limit: 5 }` with `{ ttl: AUTH_RATE_LIMITS.user_settings.ttl, limit: AUTH_RATE_LIMITS.user_settings.limit }`
  3. Line 129: Same replacement

### Step 4: Replace Magic maxAge in OAuthController (CH-01)

- **File**: `src/auth/oauth.controller.ts`
- **Action**: Replace `maxAge: 30_000` with `OAUTH_CODE_COOKIE_MAX_AGE_MS` constant
- **Implementation Steps**:
  1. Add `OAUTH_CODE_COOKIE_MAX_AGE_MS` to the existing import from `./constants/auth.constants`
  2. Line 251: Replace `maxAge: 30_000` with `maxAge: OAUTH_CODE_COOKIE_MAX_AGE_MS`

### Step 5: Unify Error Message (EM-08)

- **File**: `src/common/constants/error-messages.ts`
- **Action**: Change `PASSWORD_REQUIRED_NO_PASSWORD` value to generic message
- **Implementation Steps**:
  1. Rename constant from `PASSWORD_REQUIRED_NO_PASSWORD` to `PASSWORD_REQUIRED` in the `mfa` namespace (to avoid confusion with `user.PASSWORD_REQUIRED` which is a different message for a different context)
  2. Actually, better approach: **keep the constant name** but change its value to hide the OAuth state:
     - Old: `'Password confirmation required but no password set'`
     - New: `'Password confirmation required'`
  3. This makes the error message identical whether the user has a password or not — an attacker cannot distinguish OAuth-only accounts from password accounts via MFA endpoints.

### Step 6: Extract setCookie to Shared Utility (DU-04)

- **File**: `src/common/utils/cookie.util.ts` (NEW file)
- **Action**: Create shared cookie utility function
- **Implementation Steps**:
  1. Create `src/common/utils/cookie.util.ts`:
     ```typescript
     import type { Response } from 'express';
     import type { CookieConfig } from '../../auth/auth.service';

     /**
      * Set a cookie on the response using a CookieConfig object.
      */
     export function setCookieFromConfig(res: Response, cookie: CookieConfig): void {
       res.cookie(cookie.name, cookie.value, cookie.options);
     }
     ```
  2. Update `src/auth/auth.controller.ts`:
     - Remove `private setCookie()` method (lines 59-61)
     - Add import: `import { setCookieFromConfig } from '../common/utils/cookie.util';`
     - Replace all `this.setCookie(res, ...)` calls with `setCookieFromConfig(res, ...)`
     - Occurrences: lines 148, 181, 197, 199, 217
  3. Update `src/auth/oauth.controller.ts`:
     - Remove `private setCookie()` method (lines 47-49)
     - Add import: `import { setCookieFromConfig } from '../common/utils/cookie.util';`
     - Replace `this.setCookie(res, ...)` call at line 174 with `setCookieFromConfig(res, ...)`

### Step 7: Fix Unsafe Function Type (TS-05)

- **File**: `src/auth/strategies/pkce-authenticate.ts`
- **Action**: Replace `Function` with typed callback
- **Implementation Steps**:
  1. Line 16: Replace `superAuthenticate: Function` with:
     ```typescript
     superAuthenticate: (this: unknown, req: unknown, options: unknown) => void
     ```
  2. This matches the actual usage at line 34: `superAuthenticate.call(strategy, req, options)`
  3. Verify `google.strategy.ts` and `github.strategy.ts` pass `super.authenticate` which is compatible

### Step 8: Update Test Files

- **File**: `src/auth/tests/mfa.service.spec.ts`
- **Action**: Update expected error message string
- **Implementation Steps**:
  1. Search for `'Password confirmation required but no password set'` in test file
  2. Replace with `'Password confirmation required'`
  3. Verify test still passes with new message

- **File**: `src/auth/tests/oauth.controller.spec.ts`
- **Action**: Update expected maxAge value to use constant (if hardcoded)
- **Implementation Steps**:
  1. Check if test hard-codes `maxAge: 30_000` — if so, import and use `OAUTH_CODE_COOKIE_MAX_AGE_MS`
  2. This is optional — the value hasn't changed (still 30000), so tests should still pass as-is

### Step 9: Verify Build and Tests

- **Action**: Run post-implementation integrity checks
- **Implementation Steps**:
  1. `cd nexacore-api && npx nest build` — must compile clean
  2. `npx jest --maxWorkers=1 --forceExit` — all tests must pass
  3. Verify grep patterns return 0 instances:
     - `grep -rn "ttl: 900000" --include="*.ts" src/` → 0 matches (excluding spec)
     - `grep -rn "PASSWORD_REQUIRED_NO_PASSWORD" --include="*.ts" src/` → still exists as constant name, but value is generic
     - `grep -rn "private setCookie" --include="*.ts" src/` → 0 matches
     - `grep -rn "superAuthenticate: Function" --include="*.ts" src/` → 0 matches

### Step 10: Update Technical Documentation

- **Action**: No documentation changes needed
- **Notes**: This ticket modifies only internal implementation details. No API endpoints, data models, or module boundaries change. `integration-state.md` does not need updating since no module imports/exports/guards/DI changes occur.

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Add constants to auth.constants.ts
3. Step 2: Replace magic numbers in AccountController
4. Step 3: Replace magic numbers in UsersController
5. Step 4: Replace magic maxAge in OAuthController
6. Step 5: Unify error message in error-messages.ts
7. Step 6: Extract setCookie to shared utility
8. Step 7: Fix Function type in pkce-authenticate.ts
9. Step 8: Update test files
10. Step 9: Build and test verification
11. Step 10: Documentation review (no changes needed)

## Testing Checklist

- [ ] `nest build` compiles clean
- [ ] All existing tests pass (`jest --maxWorkers=1 --forceExit`)
- [ ] `mfa.service.spec.ts` — updated error message assertion passes
- [ ] `auth.controller.spec.ts` — setCookie removal doesn't break tests (uses `res.cookie` mock)
- [ ] `oauth.controller.spec.ts` — maxAge constant change doesn't break tests
- [ ] `pkce-authenticate.spec.ts` — typed callback doesn't break tests
- [ ] Regression: `auth-oauth.spec.ts`, `oauth-exchange.spec.ts`, `mfa.controller.spec.ts` still pass
- [ ] Grep verification: all audit patterns return 0 matches in non-spec production code

## Error Response Format

No changes to error responses. The only error message change is:
- `PASSWORD_REQUIRED_NO_PASSWORD`: `'Password confirmation required but no password set'` → `'Password confirmation required'`
- HTTP status code remains `400 BadRequest`

## Dependencies

- No new external libraries required
- Uses existing `express.Response` type for cookie utility

## Notes

- **No constructor changes** → no mock propagation needed for constructors
- **Error message text change** → test files that assert on the exact string must be updated
- The `setCookieFromConfig` utility function name avoids collision with Express's built-in `res.cookie`
- `AUTH_RATE_LIMITS.sensitive_action` uses 900,000ms (15 min) with 3 requests — intentionally stricter than normal endpoints to protect email resend and password reset from abuse
- `AUTH_RATE_LIMITS.user_settings` uses 60,000ms (60s) with 5 requests — same as existing `register` rate limit

## Next Steps After Implementation

1. Run `/verify SCRUM-256` to validate completeness
2. Run `/commit SCRUM-256` to merge
3. Run `/update-docs SCRUM-256` to record implementation

## Implementation Verification

- [ ] **Code Quality**: All magic numbers extracted to named constants
- [ ] **Code Quality**: No duplicate code (setCookie extracted)
- [ ] **Code Quality**: No unsafe types (Function replaced)
- [ ] **Security**: Error message no longer reveals OAuth account state
- [ ] **Functionality**: All endpoints behave identically (same rate limits, same cookie behavior)
- [ ] **Testing**: All tests pass with updated assertions
- [ ] **Regression**: All files in blast radius verified (imports resolve, tests pass)
- [ ] **Integration**: No module boundary changes, no DI changes
