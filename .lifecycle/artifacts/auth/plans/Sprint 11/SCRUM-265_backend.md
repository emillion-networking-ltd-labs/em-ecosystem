# Backend Implementation Plan: SCRUM-265 Fix Timing Oracle and Log Injection Prevention

## 1. Header

- **Ticket**: SCRUM-265
- **Title**: Audit WARN: EM-04/V7.3.1 — Fix timing oracle and log injection prevention
- **Scope**: Backend
- **Priority**: Medium
- **Sprint**: 11 — Security II

## 2. Codebase State Snapshot

- **Date**: 2026-03-16
- **Last completed ticket**: SCRUM-264 (auth test coverage)
- **Integration state verified**: Yes (no module changes needed)
- **Files verified against live code**:
  - `common/utils/request-meta.ts` — READ: 15 lines, `extractRequestMeta()` function
  - `common/utils/tests/request-meta.spec.ts` — READ: 83 lines, 7 existing tests
  - `auth/login.service.ts` — GREP: DUMMY_PASSWORD_HASH at L63, L118, L184 (all 3 user-not-found paths covered)
  - `auth/password-reset.service.ts` — GREP: DUMMY_PASSWORD_HASH at L41, L47
  - `auth/constants/auth.constants.ts` — GREP: DUMMY_PASSWORD_HASH defined at L17
- **Constructor signatures verified**: N/A — no classes modified
- **Methods verified to exist**: `extractRequestMeta()` at `common/utils/request-meta.ts:6`
- **Guard dependency chain verified**: N/A — no guards modified
- **Discrepancies with integration-state.md**: None

## 3. Regression Impact Analysis

- **Blast radius**: `extractRequestMeta` is imported by 7 files:
  - `auth/auth.controller.ts`
  - `auth/account.controller.ts`
  - `auth/mfa.controller.ts`
  - `auth/session.controller.ts`
  - `auth/passkey.controller.ts`
  - `auth/strategies/oauth-validate.helper.ts`
  - `users/users.controller.ts`
- **Breaking changes**: None. The function signature is unchanged. The return type is unchanged (`RequestMeta`). The only change is that `userAgent` values now have `\r` and `\n` stripped — this is a transparent security improvement that does not alter the API contract.
- **API contract impact**: None — no endpoint signatures or response schemas change.
- **Schema migration impact**: None — no Prisma changes.
- **Test files requiring updates**: Only `common/utils/tests/request-meta.spec.ts` (add newline sanitization test). No other test files need changes since the function signature is unchanged.
- **Blast radius size**: 1 file modified + 1 test file updated. Low risk.

## 4. Overview

Two audit WARNs:
1. **EM-04 (Timing Oracle)**: Already fully fixed — dummy bcrypt.compare exists on all user-not-found paths. No code changes needed. Verify only.
2. **V7.3.1 (Log Injection)**: User-Agent header extracted without newline sanitization in `request-meta.ts`. Single-line fix at the extraction point covers the entire system (7 consumers).

## 5. Architecture Context

- **File modified**: `nexacore-api/src/common/utils/request-meta.ts` (shared utility)
- **Test file modified**: `nexacore-api/src/common/utils/tests/request-meta.spec.ts`
- **Consumers**: All auth controllers + users controller + OAuth helper (7 files, 0 changes needed in them)

## 6. Implementation Steps

### Step 0: Create Feature Branch
- **Action**: `git checkout main && git pull origin main && git checkout -b feature/SCRUM-265-backend`

### Step 1: Verify EM-04 Timing Oracle (NO CODE CHANGE)
- **Action**: Confirm dummy bcrypt.compare calls exist at all user-not-found paths
- **Verification**:
  1. Grep for `DUMMY_PASSWORD_HASH` in `src/auth/` — expect hits at login.service.ts:63, :118, :184 and password-reset.service.ts:41, :47
  2. Document as "already fixed" — no code change needed

### Step 2: Fix V7.3.1 Log Injection in request-meta.ts
- **File**: `nexacore-api/src/common/utils/request-meta.ts`
- **Action**: Add `.replace(/[\r\n]/g, '')` to userAgent extraction
- **Current code** (line 13):
  ```typescript
  userAgent: (req.headers?.['user-agent'] as string | undefined) || null,
  ```
- **New code**:
  ```typescript
  userAgent: (req.headers?.['user-agent'] as string | undefined)?.replace(/[\r\n]/g, '') || null,
  ```
- **Implementation Notes**: The `?.` optional chaining ensures we only call `.replace()` when the header exists (not on `undefined`). The regex strips both `\r` and `\n` characters, preventing CRLF injection into logs and audit records. Fix at extraction point means all 7 consumers are automatically protected.

### Step 3: Add Unit Test for Newline Sanitization
- **File**: `nexacore-api/src/common/utils/tests/request-meta.spec.ts`
- **Action**: Add 1-2 tests verifying newline stripping
- **Test cases**:
  1. `should strip newline characters from user-agent header` — input `'Mozilla/5.0\nINJECTED\r\nLINE'`, expect `'Mozilla/5.0INJECTEDLINE'`
  2. `should strip carriage return from user-agent header` — input `'Agent\rEvil'`, expect `'AgentEvil'`

### Step 4: Run Tests and Build
- **Action**: Run full test suite and build
- **Implementation Steps**:
  1. `npx jest --testPathPatterns=common/utils --forceExit` — verify new tests pass
  2. `npx jest --forceExit` — verify no regressions (997+ tests)
  3. `npx nest build` — verify clean build

## 7. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Verify EM-04 (no code change)
3. Step 2: Fix V7.3.1 in request-meta.ts (1 line)
4. Step 3: Add unit tests (2 test cases)
5. Step 4: Run tests and build

## 8. Testing Checklist

- [ ] New sanitization tests pass
- [ ] All existing request-meta tests still pass (7 tests)
- [ ] Full test suite passes (997+ tests)
- [ ] `nest build` succeeds
- [ ] No production file changes besides request-meta.ts

## 9. Error Response Format

N/A — no endpoint changes.

## 10. Partial Update Support

N/A

## 11. Dependencies

No new dependencies.

## 12. Notes

- EM-04 is already fully remediated — this ticket only needs to verify and document that fact.
- The V7.3.1 fix is intentionally at the extraction point (not at each consumer) to provide defense-in-depth with a single change.
- The regex `[\r\n]` strips both CR and LF individually, handling `\r\n`, `\n`, and `\r` injection patterns.
- OWASP Log Injection reference: CWE-117 (Improper Output Neutralization for Logs).

## 13. Next Steps After Implementation

1. `/verify SCRUM-265` — validate both findings addressed
2. `/commit SCRUM-265` — commit and create PR
3. Proceed to SCRUM-266 (code complexity)

## 14. Implementation Verification

- [ ] EM-04: Dummy bcrypt.compare confirmed at login.service.ts:63, :118, :184
- [ ] V7.3.1: `request-meta.ts` strips `\r` and `\n` from userAgent
- [ ] Unit tests cover newline sanitization
- [ ] All tests pass (997+)
- [ ] `nest build` clean
- [ ] Only 1 production file modified (request-meta.ts)
