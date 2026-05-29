# Backend Implementation Plan: SCRUM-226 — Pseudonymize Email in Audit Logs (W-04)

## 1. Codebase State Snapshot

- **Date**: 2026-03-14
- **Last completed ticket**: SCRUM-225 (Hide admin role in MFA message)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/auth/login.service.ts` — lines 79, 113, 136: `metadata: { email: dto.email }` plaintext
  - `nexacore-api/src/users/users.service.ts` — line 596: `metadata: { email: target.email }`, line 730: `metadata: { newEmail: normalizedNewEmail }`
  - `nexacore-api/src/auth/email-verification.service.ts` — line 164: `metadata: { oldEmail, newEmail }`
  - `nexacore-api/src/common/utils/` — existing directory with `tests/` subfolder
  - `nexacore-api/src/users/tests/users.service.spec.ts` — lines 1007, 1222: test assertions on plaintext email in metadata
- **Constructor signatures verified**: N/A (no constructor changes)
- **Methods verified to exist**:
  - `register()` at login.service.ts:49 (lines 79, 113, 136)
  - `login()` at login.service.ts:120 (line 136)
  - `softDelete()` at users.service.ts:561 (line 596)
  - `changeEmail()` at users.service.ts:668 (line 730)
  - `verifyEmailChange()` at email-verification.service.ts:112 (line 164)
- **Guard dependency chain verified**: N/A (no guard changes)
- **Discrepancies with integration-state.md**: None

## 2. Overview

Email addresses are logged as plaintext in audit log metadata across 6 locations. Per GDPR data minimization principle (Art. 5.1.c) and OWASP ASVS V7.1.2, audit logs should pseudonymize PII. The `userId` is already logged and is sufficient for user identification; the email provides supplementary context that can be masked.

## 3. Architecture Context

- **New utility**: `common/utils/pseudonymize-email.ts` — pure function, no DI
- **Services affected**: `login.service.ts`, `users.service.ts`, `email-verification.service.ts`
- **No module changes** — utility is imported directly, not injected

## 4. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create branch `feature/SCRUM-226-backend` from `main`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-226-backend`

### Step 1: Create pseudonymizeEmail Utility

- **File**: `nexacore-api/src/common/utils/pseudonymize-email.ts` (NEW)
- **Action**: Create a pure function that masks email addresses
- **Function Signature**:
  ```typescript
  export function pseudonymizeEmail(email: string): string
  ```
- **Implementation Steps**:
  1. Split email on `@`
  2. If invalid (no `@`), return `'***'`
  3. Local part: keep first character, replace rest with `***`
  4. Domain: keep first character + TLD, replace middle with `***`
  5. Result: `u***@e***.com`
- **Examples**:
  - `user@example.com` → `u***@e***.com`
  - `admin@company.org` → `a***@c***.org`
  - `a@b.co` → `a***@b***.co`
  - `test` → `***` (invalid)

### Step 2: Create Unit Tests for pseudonymizeEmail

- **File**: `nexacore-api/src/common/utils/tests/pseudonymize-email.spec.ts` (NEW)
- **Action**: Test all masking scenarios
- **Test Cases**:
  1. Standard email masks correctly
  2. Short local part (1 char) masks correctly
  3. Short domain masks correctly
  4. Invalid input (no `@`) returns `***`
  5. Empty string returns `***`
  6. Preserves TLD correctly (.com, .org, .co.uk)
  7. Deterministic (same input → same output)

### Step 3: Apply Pseudonymization in login.service.ts

- **File**: `nexacore-api/src/auth/login.service.ts`
- **Action**: Replace plaintext email with `pseudonymizeEmail(dto.email)` at 3 locations
- **Implementation Steps**:
  1. Add import: `import { pseudonymizeEmail } from '../common/utils/pseudonymize-email';`
  2. Line 79: `metadata: { email: pseudonymizeEmail(dto.email), outcome: 'existing_email' }`
  3. Line 113: `metadata: { email: pseudonymizeEmail(dto.email), outcome: 'new_account' }`
  4. Line 136: `metadata: { email: pseudonymizeEmail(dto.email), reason: 'user_not_found' }`

### Step 4: Apply Pseudonymization in users.service.ts

- **File**: `nexacore-api/src/users/users.service.ts`
- **Action**: Replace plaintext email with pseudonymized version at 2 locations
- **Implementation Steps**:
  1. Add import: `import { pseudonymizeEmail } from '../common/utils/pseudonymize-email';`
  2. Line 596: `metadata: { email: pseudonymizeEmail(target.email) }`
  3. Line 730: `metadata: { newEmail: pseudonymizeEmail(normalizedNewEmail) }`

### Step 5: Apply Pseudonymization in email-verification.service.ts

- **File**: `nexacore-api/src/auth/email-verification.service.ts`
- **Action**: Replace plaintext emails at 1 location
- **Implementation Steps**:
  1. Add import: `import { pseudonymizeEmail } from '../common/utils/pseudonymize-email';`
  2. Line 164: `metadata: { oldEmail: pseudonymizeEmail(oldEmail), newEmail: pseudonymizeEmail(newEmail) }`

### Step 6: Update Test Assertions

- **File**: `nexacore-api/src/users/tests/users.service.spec.ts`
- **Action**: Update 2 test assertions to expect masked emails
- **Implementation Steps**:
  1. Line 1007: `metadata: { email: 't***@e***.com' }` (was `'test@example.com'`)
  2. Line 1222: `metadata: { newEmail: 'n***@e***.com' }` (was `'new@example.com'`)

### Step 7: Verify Tests & Build

- **Action**: Run all tests and verify build
- **Implementation Steps**:
  1. Run `npx jest --no-coverage` — all tests must pass
  2. Run `npx nest build` — must compile clean

### Step 8: Update Technical Documentation

- **Action**: No documentation changes needed beyond integration-state changelog
- **Notes**: No data model, API contract, or architecture changes. Internal audit log metadata format only.

## 5. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Create pseudonymizeEmail utility
3. Step 2: Create unit tests for utility
4. Step 3: Apply in login.service.ts (3 locations)
5. Step 4: Apply in users.service.ts (2 locations)
6. Step 5: Apply in email-verification.service.ts (1 location)
7. Step 6: Update test assertions (2 locations)
8. Step 7: Verify tests & build
9. Step 8: Update documentation

## 6. Testing Checklist

- [ ] `pseudonymizeEmail` utility tests pass (7+ test cases)
- [ ] No plaintext email in any audit `metadata` object
- [ ] `users.service.spec.ts` assertions updated for masked emails
- [ ] All tests pass (889+ existing + new utility tests)
- [ ] `nest build` compiles clean

## 7. Error Response Format

N/A — no API response changes. Only internal audit log metadata affected.

## 8. Dependencies

- No new dependencies — pure string manipulation

## 9. Notes

- The `email` field in audit logs changes from `user@example.com` to `u***@e***.com`
- The `userId` is always logged alongside email metadata, so user identification is not affected
- This is GDPR data minimization (Art. 5.1.c) — audit logs should not store more PII than needed
- Mail service logging (`logger.log`) is NOT affected — those are operational logs with different retention rules
- OWASP ASVS V7.1.2: "Verify that all logged events contain necessary information to identify which accounts were associated with each event"  — `userId` satisfies this requirement

## 10. Next Steps After Implementation

- Run `/verify` to confirm plan compliance
- Run `/commit` to create commit
- Run `/update-docs` to create implementation record

## 11. Implementation Verification

- [ ] `pseudonymizeEmail` utility created and tested
- [ ] All 6 audit metadata locations pseudonymized
- [ ] Test assertions updated
- [ ] No plaintext email in audit metadata
- [ ] Build compiles clean
