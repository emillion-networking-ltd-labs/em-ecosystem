# Backend Implementation Plan: SCRUM-219 — Unify Authorization Guard Error Messages (I-10)

## Codebase State Snapshot

- **Date**: 2026-03-13
- **Last completed ticket**: SCRUM-223 (Migrate token.service.ts to ConfigService)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/auth/guards/roles.guard.ts` — 71 lines, 2 constructor deps (Reflector, AuditService), throws `INSUFFICIENT_ROLE` at line 66, `ACCESS_DENIED` at line 62
  - `nexacore-api/src/auth/guards/permissions.guard.ts` — 56 lines, 2 constructor deps (Reflector, PermissionsService), throws `INSUFFICIENT_PERMISSIONS` at line 51, `ACCESS_DENIED` at line 36
  - `nexacore-api/src/common/constants/error-messages.ts` — 62 lines, `permission` section has 4 keys: `ACCESS_DENIED`, `INSUFFICIENT_PERMISSIONS`, `INSUFFICIENT_ROLE`, `INVALID_ROLE_OPERATION`
  - `nexacore-api/src/auth/tests/roles.guard.spec.ts` — 117 lines, tests `ForbiddenException` type at line 74-76 (no message assertion)
  - `nexacore-api/src/auth/tests/permissions.guard.spec.ts` — 111 lines, asserts `'Insufficient permissions'` string at line 90
  - `nexacore-api/src/permissions/permissions.service.ts` — line 138: uses `ErrorMessages.user.OPERATION_NOT_PERMITTED` (NOT `INSUFFICIENT_PERMISSIONS`)
- **Constructor signatures verified**:
  - `RolesGuard(reflector: Reflector, auditService: AuditService)` — 2 deps
  - `PermissionsGuard(reflector: Reflector, permissionsService: PermissionsService)` — 2 deps
- **Methods verified to exist**: N/A (no method-level changes, only message constants)
- **Guard dependency chain verified**: No guard changes — only error message strings change
- **Discrepancies with integration-state.md**: None

## Overview

Unify authorization guard error messages to prevent information leakage (CWE-200). Currently `roles.guard.ts` returns "Insufficient role" and `permissions.guard.ts` returns "Insufficient permissions", allowing attackers to distinguish between role-based and permission-based authorization. Both will use the existing generic `ACCESS_DENIED` ("Access denied") message.

**Standard**: OWASP ASVS V14.3.3, CWE-200

## Architecture Context

- **Module**: AuthModule (roles.guard), PermissionsModule (permissions.guard) — no module changes
- **Files affected**: 3 source + 2 test files
  - `nexacore-api/src/auth/guards/roles.guard.ts` — change error message constant
  - `nexacore-api/src/auth/guards/permissions.guard.ts` — change error message constant
  - `nexacore-api/src/common/constants/error-messages.ts` — remove 2 unused constants
  - `nexacore-api/src/auth/tests/roles.guard.spec.ts` — no changes needed (already asserts ForbiddenException type only)
  - `nexacore-api/src/auth/tests/permissions.guard.spec.ts` — update string assertion at line 90

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to `feature/SCRUM-219-backend`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-219-backend`
  3. Verify: `git branch`

### Step 1: Unify RolesGuard Error Message

- **File**: `nexacore-api/src/auth/guards/roles.guard.ts`
- **Action**: Replace `INSUFFICIENT_ROLE` with `ACCESS_DENIED` at line 66
- **Implementation Steps**:
  1. Line 66 — Replace:
     ```typescript
     // Before:
     throw new ForbiddenException(ErrorMessages.permission.INSUFFICIENT_ROLE);
     // After:
     throw new ForbiddenException(ErrorMessages.permission.ACCESS_DENIED);
     ```
  - **Notes**: Line 62 already uses `ACCESS_DENIED` for the "no user" case — this makes both denial paths consistent.

### Step 2: Unify PermissionsGuard Error Message

- **File**: `nexacore-api/src/auth/guards/permissions.guard.ts`
- **Action**: Replace `INSUFFICIENT_PERMISSIONS` with `ACCESS_DENIED` at line 51
- **Implementation Steps**:
  1. Line 51 — Replace:
     ```typescript
     // Before:
     throw new ForbiddenException(ErrorMessages.permission.INSUFFICIENT_PERMISSIONS);
     // After:
     throw new ForbiddenException(ErrorMessages.permission.ACCESS_DENIED);
     ```
  - **Notes**: Line 36 already uses `ACCESS_DENIED` for the "no user" case — this makes both denial paths consistent.

### Step 3: Remove Unused Constants from ErrorMessages

- **File**: `nexacore-api/src/common/constants/error-messages.ts`
- **Action**: Remove `INSUFFICIENT_PERMISSIONS` and `INSUFFICIENT_ROLE` from the `permission` section
- **Implementation Steps**:
  1. Delete line 31: `INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',`
  2. Delete line 32: `INSUFFICIENT_ROLE: 'Insufficient role',`
  3. Resulting `permission` section should have 2 keys: `ACCESS_DENIED`, `INVALID_ROLE_OPERATION`
- **Pre-check**: Grep already confirmed these constants are only used in the 2 guard files being modified in Steps 1-2. No other consumers.

### Step 4: Update Test Assertion

- **File**: `nexacore-api/src/auth/tests/permissions.guard.spec.ts`
- **Action**: Update string assertion at line 89-91
- **Implementation Steps**:
  1. Line 90 — Replace:
     ```typescript
     // Before:
     'Insufficient permissions',
     // After:
     'Access denied',
     ```
- **Notes**: `roles.guard.spec.ts` only asserts `ForbiddenException` type (lines 74-76), not the message string — no changes needed there.

### Step 5: Verify No Remaining References

- **Action**: Grep for removed constants — must return zero results
- **Implementation Steps**:
  1. Run: `grep -rn 'INSUFFICIENT_PERMISSIONS\|INSUFFICIENT_ROLE\|Insufficient role\|Insufficient permissions' nexacore-api/src/`
  2. Expected: no results

### Step 6: Run Tests and Verify

- **Action**: Run the full backend test suite
- **Implementation Steps**:
  1. Run targeted tests: `npx jest --testPathPatterns "roles.guard|permissions.guard"`
  2. Run full suite: `npx jest --maxWorkers=1 --forceExit` (expect 870+ passed, 0 failed)
  3. Run build: `npx nest build` (must compile clean)

### Step 7: Update Technical Documentation

- **Action**: No API or data model changes. Integration-state.md changelog entry only.
- **Implementation Steps**:
  1. No `api-spec.yml` changes (no endpoints modified)
  2. No `data-model.md` changes (no schema changes)
  3. `integration-state.md`: Add changelog entry noting unified error messages

## Implementation Order

1. Step 0: Create feature branch `feature/SCRUM-219-backend`
2. Step 1: Unify RolesGuard error message
3. Step 2: Unify PermissionsGuard error message
4. Step 3: Remove unused constants from error-messages.ts
5. Step 4: Update test assertion in permissions.guard.spec.ts
6. Step 5: Verify no remaining references
7. Step 6: Run tests and build
8. Step 7: Documentation (changelog only)

## Testing Checklist

- [ ] `roles.guard.ts` throws `ACCESS_DENIED` for both "no user" and "wrong role" cases
- [ ] `permissions.guard.ts` throws `ACCESS_DENIED` for both "no user" and "wrong permissions" cases
- [ ] `INSUFFICIENT_PERMISSIONS` and `INSUFFICIENT_ROLE` removed from `error-messages.ts`
- [ ] Zero grep results for removed constants across entire `src/`
- [ ] `permissions.guard.spec.ts` asserts `'Access denied'` message
- [ ] All existing 870+ tests still pass
- [ ] `nest build` compiles clean

## Error Response Format

N/A — no endpoint or error handling structure changes. Both guards continue to return HTTP 403 ForbiddenException; only the message string changes.

## Dependencies

- None — no new packages or modules required

## Notes

- Both guards already use `ACCESS_DENIED` for the "no user on request" case — this change makes ALL denial paths consistent
- The `INVALID_ROLE_OPERATION` constant in the `permission` section is retained (used by `permissions.service.ts` for a different purpose)
- SUPERADMIN bypass logic in both guards is unaffected (returns `true` before reaching any throw)
- This is a security hardening change — no functional behavior changes from the user's perspective (still HTTP 403)

## Next Steps After Implementation

1. Run `/verify SCRUM-219` to validate implementation
2. Run `/commit SCRUM-219` to commit changes
3. Run `/update-docs SCRUM-219` to create implementation record

## Implementation Verification

- [ ] Both guards return identical "Access denied" for all denial cases
- [ ] No information leakage — attacker cannot distinguish role vs permission denial
- [ ] Unused constants removed (no dead code)
- [ ] Full test suite passes with 0 failures
- [ ] Build compiles clean
- [ ] No module import changes needed
