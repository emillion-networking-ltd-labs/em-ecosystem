# Backend Implementation Plan: SCRUM-225 — Hide Admin Role in MFA Message (W-03)

## 1. Codebase State Snapshot

- **Date**: 2026-03-14
- **Last completed ticket**: SCRUM-224 (Fix Jest coverage tooling)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/auth/login.service.ts` — line 365: inline string `'MFA setup is required for administrator accounts. Please enable MFA to continue.'`; line 358: audit metadata includes `role: user.role` (internal, acceptable)
  - `nexacore-api/src/common/constants/error-messages.ts` — `mfa` section (lines 14-19): 4 constants, no MFA_SETUP_REQUIRED
  - `nexacore-api/src/auth/tests/auth.controller.spec.ts` — line 207: test asserts on the inline admin message string
- **Constructor signatures verified**: N/A (no constructor changes)
- **Methods verified to exist**: `handleMfaSetupRequired(user: User, ctx?: RequestContext)` at login.service.ts:348
- **Guard dependency chain verified**: N/A (no guard changes)
- **Discrepancies with integration-state.md**: None

## 2. Overview

The `handleMfaSetupRequired()` method returns a message that explicitly mentions "administrator accounts", confirming the user's admin role. This is information disclosure per CWE-200. The fix replaces the message with generic wording and extracts it to the `ErrorMessages` constants file.

## 3. Architecture Context

- **Service**: `login.service.ts` — `handleMfaSetupRequired()` method (line 348)
- **Constants**: `error-messages.ts` — centralized error message constants
- **Test**: `auth.controller.spec.ts` — assertion on the message string (line 207)

## 4. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create branch `feature/SCRUM-225-backend` from `main`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-225-backend`

### Step 1: Add MFA_SETUP_REQUIRED Constant

- **File**: `nexacore-api/src/common/constants/error-messages.ts`
- **Action**: Add `SETUP_REQUIRED` to the `mfa` section
- **Implementation Steps**:
  1. In the `mfa` object (line 14), add after the last entry:
     ```typescript
     SETUP_REQUIRED: 'Additional security setup required. Please enable MFA to continue.',
     ```
- **Notes**: Generic wording — no mention of admin, administrator, or role

### Step 2: Replace Inline Message in login.service.ts

- **File**: `nexacore-api/src/auth/login.service.ts`
- **Action**: Replace the inline string at line 364-365 with the `ErrorMessages.mfa.SETUP_REQUIRED` constant
- **Implementation Steps**:
  1. Add import (if not already present): `import { ErrorMessages } from '../../common/constants/error-messages';`
  2. Replace lines 364-365:
     ```typescript
     // Before:
     message: 'MFA setup is required for administrator accounts. Please enable MFA to continue.',
     // After:
     message: ErrorMessages.mfa.SETUP_REQUIRED,
     ```
- **Notes**: The audit metadata at line 358 (`role: user.role`) is internal logging and should NOT be changed — it's useful for security monitoring

### Step 3: Update Test Assertion

- **File**: `nexacore-api/src/auth/tests/auth.controller.spec.ts`
- **Action**: Update the assertion at line 207 to use the new generic message
- **Implementation Steps**:
  1. Replace line 206-207:
     ```typescript
     // Before:
     message: 'MFA setup is required for administrator accounts. Please enable MFA to continue.',
     // After:
     message: 'Additional security setup required. Please enable MFA to continue.',
     ```
- **Notes**: Use the literal string in the test (not the constant import) to catch accidental constant changes

### Step 4: Verify Tests Pass

- **Action**: Run all tests and confirm no failures
- **Implementation Steps**:
  1. Run `npx jest --no-coverage` — all 889 tests must pass
  2. Run `npx nest build` — must compile clean

### Step 5: Update Technical Documentation

- **Action**: No documentation changes needed beyond integration-state changelog
- **Notes**: No data model, API contract, or architecture changes. The response shape is unchanged.

## 5. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Add constant to error-messages.ts
3. Step 2: Replace inline message in login.service.ts
4. Step 3: Update test assertion in auth.controller.spec.ts
5. Step 4: Verify tests pass
6. Step 5: Update documentation (integration-state changelog)

## 6. Testing Checklist

- [ ] MFA setup response message does not mention "admin", "administrator", or "role"
- [ ] Message is `'Additional security setup required. Please enable MFA to continue.'`
- [ ] `ErrorMessages.mfa.SETUP_REQUIRED` constant exists
- [ ] `login.service.ts` uses the constant
- [ ] `auth.controller.spec.ts` assertion updated
- [ ] All 889 tests pass
- [ ] `nest build` compiles clean

## 7. Error Response Format

No change to response format. The `MfaSetupRequiredResult` shape remains:
```json
{
  "mfaSetupRequired": true,
  "message": "Additional security setup required. Please enable MFA to continue."
}
```

## 8. Dependencies

- No new dependencies

## 9. Notes

- The audit log metadata (`role: user.role`) at line 358 is internal and should remain — it's valuable for security monitoring
- CWE-200: Exposure of Sensitive Information to an Unauthorized Actor
- This is a LOW severity finding — the user already knows they're an admin, but the message shouldn't confirm it in API responses (defense in depth)

## 10. Next Steps After Implementation

- Run `/verify` to confirm plan compliance
- Run `/commit` to create commit
- Run `/update-docs` to create implementation record

## 11. Implementation Verification

- [ ] No reference to "administrator" or "admin" in MFA setup response
- [ ] Constant extracted to error-messages.ts
- [ ] Test updated and passing
- [ ] Build compiles clean
- [ ] Audit log metadata unchanged (still logs role internally)
