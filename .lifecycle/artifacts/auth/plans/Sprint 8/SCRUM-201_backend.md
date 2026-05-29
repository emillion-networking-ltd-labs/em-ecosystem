# Backend Implementation Plan: SCRUM-201 Split auth.service.spec.ts into Per-Service Test Files

## 1. Codebase State Snapshot

- **Date**: 2026-03-13
- **Last completed ticket**: SCRUM-197 (controller split)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/auth/tests/auth.service.spec.ts` — 2,958 lines, tests AuthService facade
  - `nexacore-api/src/auth/auth.service.ts` — 220 lines, facade delegating to 5 services
  - `nexacore-api/src/auth/login.service.ts` — LoginService (register, login)
  - `nexacore-api/src/auth/token.service.ts` — TokenService (refresh, MFA tokens, cookies)
  - `nexacore-api/src/auth/oauth-auth.service.ts` — OAuthAuthService (validateOAuthUser, code flow)
  - `nexacore-api/src/auth/email-verification.service.ts` — EmailVerificationService
  - `nexacore-api/src/auth/password-reset.service.ts` — PasswordResetService
- **Constructor signatures verified**: N/A (no code changes, test-only refactoring)
- **Methods verified to exist**: N/A
- **Guard dependency chain verified**: N/A
- **Discrepancies with integration-state.md**: None

## 2. Overview

Split `auth.service.spec.ts` (2,958 lines) into domain-focused test files. The tests exercise the AuthService facade — they call `authService.register()`, `authService.login()`, etc. — so we split by method domain, not by underlying service class.

**Strategy**: Extract the shared mock setup (~210 lines of `beforeEach` + mock data) into a reusable helper file. Each domain test file imports the helper and tests only its subset of AuthService methods.

## 3. Architecture Context

### Current Test Structure
- **1 file** (`auth.service.spec.ts`) with 2,958 lines containing all AuthService facade tests
- ~210 lines of shared setup (TestingModule, mocks, mockUser, mockSession)
- ~35 `describe` blocks covering: register, login (7 sub-describes), refreshTokens, OAuth, logout, MFA, email verification, password reset, trusted devices, idle timeout, concurrent sessions, impossible travel, suspicious login detection

### Target Structure

| File | Domain | Describe Blocks | ~Lines |
|------|--------|----------------|--------|
| `auth-test.helpers.ts` | Shared setup | Module factory, mocks, fixtures | ~220 |
| `auth.service.spec.ts` | Core (register, login happy path, logout, cookies, parseDurationMs) | 8 | ~500 |
| `auth-login.spec.ts` | Login edge cases (MFA, lockout, failed attempts, device detection, impossible travel, suspicious login) | 12 | ~950 |
| `auth-token.spec.ts` | Token lifecycle (refresh, MFA tokens, idle timeout, concurrent sessions) | 4 | ~400 |
| `auth-oauth.spec.ts` | OAuth (validateOAuthUser, generateOAuthCode, exchangeOAuthCode) | 4 | ~370 |
| `auth-email.spec.ts` | Email verification (verifyEmail, verifyEmailChange, resendVerification) | 4 | ~400 |
| `auth-password.spec.ts` | Password reset (forgot, reset, validate token) | 3 | ~280 |

## 4. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-201-backend` from latest `main`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-201-backend`

### Step 1: Create Shared Test Helper

- **File**: `nexacore-api/src/auth/tests/auth-test.helpers.ts`
- **Action**: Extract the shared mock setup from `auth.service.spec.ts`
- **Implementation Steps**:
  1. Export a `createAuthTestModule()` async function that builds the TestingModule with all providers (AuthService, TokenService, LoginService, OAuthAuthService, EmailVerificationService, PasswordResetService, and all mocked dependencies)
  2. Export the function's return type containing all mocked services
  3. Export shared fixtures: `mockUser`, `mockSession`, `requestMeta`
  4. Export the `jest.mock('bcrypt')` at module level
  5. The helper must NOT contain any `describe`/`it` blocks — purely setup

### Step 2: Create auth-login.spec.ts

- **File**: `nexacore-api/src/auth/tests/auth-login.spec.ts`
- **Action**: Move login edge case tests from `auth.service.spec.ts`
- **Implementation Steps**:
  1. Import `createAuthTestModule` from helper
  2. Move these describe blocks:
     - `login - MFA challenge` (line 1604)
     - `register - verification email failure` (line 1855)
     - `login - account locked` (line 1954)
     - `login - no password (OAuth account)` (line 1998)
     - `login - email not verified` (line 2015)
     - `login - max failed attempts triggers lockout` (line 2032)
     - `login - lockout anti-enumeration` (line 2053)
     - `login - successful login resets failed attempts` (line 2082)
     - `notifyIfNewDevice (via login)` (line 2105)
     - `impossible travel integration` (line 2365)
     - `suspicious login detection integration` (line 2491)
     - `fire-and-forget resilience` (line 1697) — login/register related tests

### Step 3: Create auth-token.spec.ts

- **File**: `nexacore-api/src/auth/tests/auth-token.spec.ts`
- **Action**: Move token lifecycle tests
- **Implementation Steps**:
  1. Move these describe blocks:
     - `refreshTokens` (line 522)
     - `generateTokensForMfa` (line 808)
     - `buildRefreshCookie` (line 1580)
     - `buildClearCookie` (line 1592)
     - `refreshTokens - idle timeout` (line 2205)
     - `concurrent session limit` (line 2278)

### Step 4: Create auth-oauth.spec.ts

- **File**: `nexacore-api/src/auth/tests/auth-oauth.spec.ts`
- **Action**: Move OAuth tests
- **Implementation Steps**:
  1. Move these describe blocks:
     - `validateOAuthUser` (line 593 and line 1879)
     - `generateOAuthCode` (line 668)
     - `exchangeOAuthCode` (line 709)

### Step 5: Create auth-email.spec.ts

- **File**: `nexacore-api/src/auth/tests/auth-email.spec.ts`
- **Action**: Move email verification tests
- **Implementation Steps**:
  1. Move these describe blocks:
     - `verifyEmail` (line 840)
     - `verifyEmailChange` (line 935)
     - `resendVerificationEmail` (line 1181)
     - `resendVerificationByEmail` (line 1503)

### Step 6: Create auth-password.spec.ts

- **File**: `nexacore-api/src/auth/tests/auth-password.spec.ts`
- **Action**: Move password reset tests
- **Implementation Steps**:
  1. Move these describe blocks:
     - `forgotPassword` (line 1246)
     - `resetPassword` (line 1324)
     - `validateResetToken` (line 1449)

### Step 7: Slim Down auth.service.spec.ts

- **File**: `nexacore-api/src/auth/tests/auth.service.spec.ts`
- **Action**: Keep only core AuthService tests, refactor to use helper
- **Implementation Steps**:
  1. Replace inline mock setup with `createAuthTestModule()` import
  2. Keep these describe blocks:
     - `parseDurationMs` (utility, line 35)
     - `register` — happy path + anti-enumeration (line 269)
     - `login` — happy path + basic error cases (line 363)
     - `logout` (line 762)
     - `logoutAll` (line 791)
  3. Remove all moved describe blocks

### Step 8: Verify All Tests Pass

- **Action**: Run full test suite to confirm no regressions
- **Implementation Steps**:
  1. `npx jest --testPathPatterns="auth" --maxWorkers=1 --forceExit` — verify all auth tests pass
  2. `npx jest --maxWorkers=1 --forceExit` — full suite regression check
  3. `npx nest build` — ensure build still passes

### Step 9: Update Technical Documentation

- **Action**: Update integration-state.md changelog
- **Implementation Steps**:
  1. Add changelog entry for SCRUM-201

## 5. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Create shared test helper
3. Step 2: Create auth-login.spec.ts
4. Step 3: Create auth-token.spec.ts
5. Step 4: Create auth-oauth.spec.ts
6. Step 5: Create auth-email.spec.ts
7. Step 6: Create auth-password.spec.ts
8. Step 7: Slim down auth.service.spec.ts
9. Step 8: Verify all tests pass
10. Step 9: Update technical documentation

## 6. Testing Checklist

- [ ] All 846 backend tests pass (no regressions)
- [ ] Test count is identical before and after split
- [ ] Each new test file runs independently
- [ ] No test has been dropped or duplicated
- [ ] `nest build` succeeds

## 7. Error Response Format

N/A — test-only refactoring, no code changes.

## 8. Dependencies

No new dependencies required.

## 9. Notes

- **Tests exercise the AuthService facade**, not the decomposed services directly. This is intentional — the facade is the public API. Future tickets could add direct service-level tests.
- **`jest.mock('bcrypt')`** must be called at the top of each test file that exercises login/register flows (bcrypt is used by LoginService internally). The helper can re-export this.
- **The shared helper** eliminates ~210 lines of duplicated mock setup per file. Without it, we'd have 6x duplication.
- **parseDurationMs** stays in `auth.service.spec.ts` since it's a small utility test (20 lines) closely related to the auth domain.

## 10. Next Steps After Implementation

- Run `/update-docs SCRUM-201` to create implementation record
- Proceed to SCRUM-198 (OAuth guard/strategy base classes)

## 11. Implementation Verification

- [ ] **Code Quality**: Each test file < 1,000 lines, clear domain focus
- [ ] **Functionality**: All tests pass, identical test count
- [ ] **Testing**: No dropped or duplicated tests
- [ ] **Integration**: Build passes, no circular dependencies
- [ ] **Documentation**: integration-state.md changelog updated
