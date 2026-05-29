# Backend Implementation Plan: SCRUM-264 Increase Auth Test Coverage

## 1. Header

- **Ticket**: SCRUM-264
- **Title**: Audit WARN: T-03/T-04/T-11 — Increase auth test coverage
- **Scope**: Backend (tests only)
- **Priority**: High
- **Sprint**: 11 — Security II

## 2. Codebase State Snapshot

- **Date**: 2026-03-16
- **Last completed ticket**: SCRUM-263 (magic strings)
- **Integration state verified**: Yes (no module changes needed — tests only)
- **Current auth coverage**: branches 75.85% (581/766), functions 88.31% (204/231)
- **Target**: branches ≥85% (need +70), functions ≥90% (need +3)
- **Files verified**: All 8 target files read via Explore agent, cross-referenced with existing test files

## 3. Regression Impact Analysis

- **Blast radius**: 0 production files modified. Only new/modified `.spec.ts` files.
- **Breaking changes**: None — tests only.
- **Test files to create/modify**:
  - `src/auth/tests/oauth-auth.service.spec.ts` (NEW — dedicated unit tests)
  - `src/auth/tests/auth-token.spec.ts` (MODIFY — add edge case tests)
  - `src/auth/tests/login-security.service.spec.ts` (MODIFY — add early return tests)
  - `src/auth/tests/oauth.controller.spec.ts` (MODIFY — add branch tests)
  - `src/auth/tests/google.strategy.spec.ts` (MODIFY — add profile field tests)
  - `src/auth/tests/mfa.controller.spec.ts` (MODIFY — add fingerprint tests)
- **Blast radius size**: 6 test files, 0 production files. ZERO risk.

## 4. Overview

Write new tests to increase auth module branch coverage from 75.85% to ≥85% and function coverage from 88.31% to ≥90%. Focus on highest-impact files first: oauth-auth.service (11 branches), token.service (12 branches), login-security.service (10 branches). No production code changes.

## 5. Architecture Context

- **Test framework**: Jest + NestJS Testing utilities
- **Test patterns**: Follow existing patterns in `src/auth/tests/` (module setup with mock providers, `createTestingModule`)
- **Mock helpers**: `src/auth/tests/auth-test.helpers.ts` (centralized mock factory)

## 6. Implementation Steps

### Step 0: Create Feature Branch
- **Action**: `git checkout main && git pull origin main && git checkout -b feature/SCRUM-264-backend`

### Step 1: Create oauth-auth.service.spec.ts (NEW — ~13 branches, +3 functions)
- **File**: `nexacore-api/src/auth/tests/oauth-auth.service.spec.ts`
- **Action**: Create dedicated unit tests for OAuthAuthService
- **Test cases**:
  1. `validateOAuthUser — resets lockout when user has failedAttempts > 0` (2 branches)
  2. `validateOAuthUser — handles impossible travel blocked result` (2 branches)
  3. `validateOAuthUser — maps oauthAction to audit action, includes fallback` (2 branches)
  4. `validateOAuthUser — notifyIfNewDevice fire-and-forget error swallowed` (1 branch)
  5. `validateOAuthLink — throws when user not found` (1 branch)
  6. `validateOAuthLink — successful link flow` (2 branches)
  7. `exchangeOAuthCode — throws when payload is null` (1 branch)
  8. `exchangeOAuthCode — successful code exchange` (2 branches)
- **Estimated gain**: ~13 branches, +3 functions (validateOAuthUser, validateOAuthLink, exchangeOAuthCode)

### Step 2: Add token.service edge case tests (~10 branches)
- **File**: `nexacore-api/src/auth/tests/auth-token.spec.ts`
- **Action**: Add edge case tests to existing spec
- **Test cases**:
  1. `buildRefreshCookie — production mode sets secure=true` (1 branch)
  2. `refreshTokens — throws when user not found after JWT verify` (1 branch)
  3. `validateSessionNotIdle — session found, not revoked, is idle → throws` (3 branches)
  4. `validateSessionNotIdle — session found but revoked → no throw` (1 branch)
  5. `generateTokensForMfa — impossible travel blocked path` (2 branches)
  6. `logout — JWT verify fails, catch block swallows error` (1 branch)
  7. `buildClearCookie — maxAge=0 path` (1 branch)
- **Estimated gain**: ~10 branches

### Step 3: Add login-security.service edge case tests (~6 branches)
- **File**: `nexacore-api/src/auth/tests/login-security.service.spec.ts`
- **Action**: Add early return and edge case tests
- **Test cases**:
  1. `notifyIfNewDevice — no previous sessions, returns early` (1 branch)
  2. `notifyIfNewDevice — IP known in session 1, UA known in session 2` (2 branches)
  3. `checkSuspiciousLoginFailure — userId undefined, returns early` (1 branch)
  4. `notifyIfNewDevice — userAgent null coalescing path` (1 branch)
  5. `checkSuspiciousLoginSuccess — error in geolocation swallowed` (1 branch)
- **Estimated gain**: ~6 branches

### Step 4: Add oauth.controller branch tests (~7 branches)
- **File**: `nexacore-api/src/auth/tests/oauth.controller.spec.ts`
- **Action**: Add conditional response format and production cookie tests
- **Test cases**:
  1. `exchangeOAuthCode — oauthAction='created' included in response` (2 branches)
  2. `exchangeOAuthCode — oauthAction='login' omitted from response` (1 branch)
  3. `getValidatedFrontendUrl — URL not in allowed list throws` (1 branch)
  4. `googleAuthCallback — production mode sets secure cookie` (1 branch)
  5. `getValidatedFrontendUrl — parses comma-separated allowed URLs` (1 branch)
  6. `exchangeOAuthCode — oauthAction='linked' included in response` (1 branch)
- **Estimated gain**: ~7 branches

### Step 5: Add google.strategy profile field tests (~5 branches)
- **File**: `nexacore-api/src/auth/tests/google.strategy.spec.ts`
- **Action**: Add optional chaining branch coverage
- **Test cases**:
  1. `validate — extracts firstName/lastName from profile.name` (2 branches)
  2. `validate — extracts avatarUrl from profile.photos array` (1 branch)
  3. `validate — handles missing profile.name gracefully` (1 branch)
  4. `validate — handles missing profile.photos gracefully` (1 branch)
- **Estimated gain**: ~5 branches

### Step 6: Add mfa.controller fingerprint tests (~3 branches)
- **File**: `nexacore-api/src/auth/tests/mfa.controller.spec.ts`
- **Action**: Add array/string fingerprint handling tests
- **Test cases**:
  1. `verifyLogin — fingerprint header as array extracts first element` (1 branch)
  2. `verifyLogin — trustDevice=true but no fingerprint header` (1 branch)
  3. `verifyLogin — trustDevice error swallowed silently` (1 branch)
- **Estimated gain**: ~3 branches

### Step 7: Run Coverage and Verify Thresholds
- **Action**: Run full auth test suite with coverage
- **Implementation Steps**:
  1. `npx jest --testPathPatterns=src/auth --coverage --forceExit`
  2. Analyze coverage-summary.json for auth files
  3. Verify branches ≥85% and functions ≥90%
  4. If still below threshold, identify remaining gaps and add targeted tests

## 7. Implementation Order

1. Step 0: Create feature branch
2. Step 1: oauth-auth.service.spec.ts (NEW — highest impact: +13 br, +3 fn)
3. Step 2: token.service edge cases (+10 br)
4. Step 3: login-security.service edge cases (+6 br)
5. Step 4: oauth.controller branch tests (+7 br)
6. Step 5: google.strategy profile tests (+5 br)
7. Step 6: mfa.controller fingerprint tests (+3 br)
8. Step 7: Run coverage, verify thresholds, iterate if needed

**Estimated total gain**: ~44 branches from Steps 1-6 (out of 70 needed). Remaining ~26 branches come from DTO decorator branches (22 DTOs × 1 branch each = 22) which may be partially covered by controller integration tests, plus minor gains from the verify-iterate loop in Step 7.

## 8. Testing Checklist

- [ ] All new tests pass individually
- [ ] Full auth suite (501+ tests) passes with 0 failures
- [ ] `nest build` succeeds
- [ ] Auth branch coverage ≥85%
- [ ] Auth function coverage ≥90%
- [ ] No production files modified

## 9. Error Response Format

N/A — tests only.

## 10. Partial Update Support

N/A

## 11. Dependencies

No new dependencies. Uses existing Jest + NestJS Testing + mock infrastructure.

## 12. Notes

- DTO decorator branches (22 files × 0% = 22 branches) are class-validator generated. They contribute to the denominator but are not meaningfully testable in unit tests. If we can't reach 85% because of DTO branches, document this in the audit report as a known limitation.
- Priority is on service/controller branches which represent real business logic.
- All tests should follow existing patterns in `auth-test.helpers.ts`.

## 13. Next Steps After Implementation

1. `/verify SCRUM-264` — validate coverage thresholds met
2. `/commit SCRUM-264` — commit and create PR
3. Proceed to SCRUM-265 (timing oracle + log injection)

## 14. Implementation Verification

- [ ] oauth-auth.service.spec.ts created with 8+ test cases
- [ ] auth-token.spec.ts updated with 7+ new test cases
- [ ] login-security.service.spec.ts updated with 5+ new test cases
- [ ] oauth.controller.spec.ts updated with 6+ new test cases
- [ ] google.strategy.spec.ts updated with 4+ new test cases
- [ ] mfa.controller.spec.ts updated with 3+ new test cases
- [ ] Auth branches ≥85%
- [ ] Auth functions ≥90%
- [ ] All tests pass (501+ existing + new)
- [ ] No production files modified
