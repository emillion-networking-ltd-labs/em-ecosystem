# Backend Implementation Plan: SCRUM-184 Fix broken app.e2e-spec.ts

## 1. Header

- **Ticket**: SCRUM-184
- **Sprint**: Sprint 7 - Audit Remediation
- **Parent**: N/A (standalone, exposed by SCRUM-175)

---

## 2. Codebase State Snapshot

- **Date**: 2026-03-12
- **Last completed ticket**: SCRUM-175 (E2E auth tests, commit `5e17e8f`)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `test/app.e2e-spec.ts` — 369 lines, 14 tests, all broken. Uses outdated MockUser (missing `isActive`, `avatarUrl`, `mfaEnabled`, `mfaSecret`, `mfaRecoveryCodes`, `lockoutCount`, `pendingEmail`), outdated API expectations (register returns tokens, refresh via body, 409 for duplicates, 403 for lockout), missing guard bypasses (CSRF, Throttler, Turnstile), missing `cookieParser()`, no `permission`/`rolePermission`/`session`/`emailVerificationToken`/`passwordResetToken`/`oAuthAccount`/`auditLog`/`trustedDevice`/`passkey` mocks
  - `test/auth-e2e/auth-flows.e2e-spec.ts` — 406 lines, 35 tests, all passing. Covers: register (4), login/verification (8), password reset (8), session management (4), account lockout (4), admin RBAC (3), registration edge cases (4)
  - `test/auth-e2e/mfa-flows.e2e-spec.ts` — 245 lines, 14 tests, all passing
  - `test/auth-e2e/oauth-flows.e2e-spec.ts` — 8 tests, all passing
  - `test/auth-e2e/setup.ts` — Comprehensive MockStore with all 10 Prisma models, guard bypasses, cookieParser
  - `test/auth-e2e/helpers.ts` — Reusable request helpers and response types
- **Discrepancies with integration-state.md**: None relevant

---

## 3. Overview

Delete the obsolete `test/app.e2e-spec.ts` file. All 14 test scenarios it contained are already covered (and improved) by the 57 tests in `test/auth-e2e/`. The old file cannot even bootstrap because:

1. Missing `permission.upsert` mock (PermissionsService.onModuleInit fails)
2. Missing 9 Prisma model mocks (session, emailVerificationToken, passwordResetToken, oAuthAccount, auditLog, trustedDevice, passkey, permission, rolePermission)
3. Missing guard bypasses (CsrfGuard, CustomThrottlerGuard, TurnstileGuard as APP_GUARD)
4. Missing `cookieParser()` middleware (refresh tokens are now httpOnly cookies)
5. Outdated MockUser interface (missing 7+ required fields)
6. Outdated API expectations (register returns tokens instead of message, refresh via body instead of cookie, 409 for duplicates instead of anti-enumeration 200, 403 for lockout instead of CWE-203 compliant 401)

Fixing these would mean rewriting the entire file to match what `test/auth-e2e/` already does. Deletion is the correct approach — it eliminates dead code and prevents confusion.

---

## 4. Architecture Context

- **Modules involved**: None (test-only change)
- **Components affected**: `test/app.e2e-spec.ts` (deletion)
- **Files referenced**: `test/auth-e2e/` (existing replacement)

---

## 5. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-184-backend` from `main`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-184-backend`

### Step 1: Delete Obsolete E2E Test File

- **File**: `test/app.e2e-spec.ts`
- **Action**: Delete the file
- **Implementation Steps**:
  1. `git rm nexacore-api/test/app.e2e-spec.ts`
- **Implementation Notes**: All 14 tests are superseded by `test/auth-e2e/` (57 tests). Coverage mapping:

| Old Test | New Test |
|----------|----------|
| Register 201 | Flow 1.1 + 1.2 |
| Register 409 duplicate | Flow 1b.1 (now anti-enum 200) |
| Register 400 invalid email | Flow 1b.2 |
| Register 400 weak password | Flow 1b.3 |
| Login 200 | Flow 1.6 |
| Login 401 wrong password | Flow 5b.1 |
| Login 401 non-existent | Flow 5b.4 |
| Login 403 locked | Flow 5b.3 (now CWE-203 401) |
| Refresh 200 | Flow 1.9 |
| Refresh 401 | Flow 1.10 |
| Me 200 | Flow 1.7 |
| Me 401 | Flow 1.8 |
| Admin 200/403/401 | Admin RBAC (3 tests) |
| Logout 200/401 | Flow 1.11 |

### Step 2: Verify All E2E Tests Pass

- **Action**: Run all E2E tests to confirm no regressions
- **Implementation Steps**:
  1. `npx jest --config test/jest-e2e.json test/auth-e2e/ --no-coverage`
  2. Verify 57 tests pass
  3. `npx jest --no-coverage` — verify 829 unit tests still pass

### Step 3: Update Technical Documentation

- **Action**: Update integration-state.md changelog
- **Implementation Steps**:
  1. Add changelog entry for SCRUM-184

---

## 6. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Delete `test/app.e2e-spec.ts`
3. Step 2: Verify all tests pass
4. Step 3: Update documentation

---

## 7. Testing Checklist

- [ ] `test/app.e2e-spec.ts` deleted
- [ ] All 57 E2E tests in `test/auth-e2e/` pass
- [ ] All 829 unit tests pass
- [ ] No references to deleted file remain

---

## 8. Error Response Format

N/A — no production code changes.

---

## 9. Partial Update Support

N/A

---

## 10. Dependencies

None — no new dependencies.

---

## 11. Notes

- This is a test-only cleanup ticket. Zero production code changes.
- The old file was broken since at least the PermissionsModule introduction (which added `onModuleInit` with `permission.upsert`).
- The `Provider` enum import in the old file (`src/users/enums/provider.enum`) was removed from the codebase during the OAuth refactor (SCRUM-160-163), which would cause a compile error even if the runtime issues were fixed.

---

## 12. Next Steps After Implementation

- Run `/update-docs` to create implementation record
- Commit and create PR

---

## 13. Implementation Verification

- [ ] `test/app.e2e-spec.ts` no longer exists
- [ ] E2E test count: 57 passing (unchanged)
- [ ] Unit test count: 829 passing (unchanged)
- [ ] No broken imports referencing deleted file
- [ ] Documentation updated
