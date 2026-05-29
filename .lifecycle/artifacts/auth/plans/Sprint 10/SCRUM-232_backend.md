# Backend Implementation Plan: SCRUM-232 — Extract Impossible Travel Helper (DU-03)

## 1. Codebase State Snapshot

- **Date**: 2026-03-14
- **Last completed ticket**: SCRUM-231 (Fix MFA form a11y gaps)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/auth/oauth-auth.service.ts` — 181 lines, constructor: `UsersService, OAuthCodeStore, TokenService, AuditService, ImpossibleTravelService, SuspiciousLoginService` (6 deps). Lines 134-155: private `checkImpossibleTravel()` (duplicate). Lines 157-180: private `handleTravelBlock()` (duplicate). `this.suspiciousLoginService` never referenced (dead DI, pre-existing).
  - `nexacore-api/src/auth/token.service.ts` — Lines 334-355: public `checkImpossibleTravel()` (canonical). Lines 357-380: public `handleTravelBlock()` (canonical).
  - `nexacore-api/src/auth/login.service.ts` — Lines 305, 377: calls `this.tokenService.checkImpossibleTravel()`. Lines 313, 383: calls `this.tokenService.handleTravelBlock()`.
  - `nexacore-api/src/auth/auth.module.ts` — Line 80: `OAuthAuthService` registered as provider.
  - `nexacore-api/src/auth/tests/auth-test.helpers.ts` — Lines 201, 249: `ImpossibleTravelService` mock provider registered for test module.
- **Constructor signatures verified**:
  - `OAuthAuthService(UsersService, OAuthCodeStore, TokenService, AuditService, ImpossibleTravelService, SuspiciousLoginService)` — 6 deps
  - `TokenService` — already has public `checkImpossibleTravel()` and `handleTravelBlock()`
- **Methods verified to exist**:
  - `TokenService.checkImpossibleTravel()` at token.service.ts:334
  - `TokenService.handleTravelBlock()` at token.service.ts:357
  - `OAuthAuthService.checkImpossibleTravel()` at oauth-auth.service.ts:134 (private, duplicate)
  - `OAuthAuthService.handleTravelBlock()` at oauth-auth.service.ts:157 (private, duplicate)
- **Guard dependency chain verified**: N/A (no guard changes)
- **Discrepancies with integration-state.md**: None relevant to this ticket

## 2. Overview

Two methods (`checkImpossibleTravel` and `handleTravelBlock`) are duplicated verbatim between `token.service.ts` and `oauth-auth.service.ts` (~46 lines). Since `oauth-auth.service.ts` already injects `TokenService`, the fix is to delete the private duplicates and delegate to `this.tokenService`. This also removes the direct `ImpossibleTravelService` dependency from `OAuthAuthService`'s constructor, simplifying DI. Pure refactoring — no behavioral changes. ISO 25010 Maintainability.

## 3. Architecture Context

- **Primary file**: `nexacore-api/src/auth/oauth-auth.service.ts` — remove duplicate methods, delegate to tokenService
- **Canonical source**: `nexacore-api/src/auth/token.service.ts` — already has public versions of both methods
- **No module changes**: `OAuthAuthService` stays in `AuthModule`, no imports/exports affected
- **No test file changes expected**: `ImpossibleTravelService` mock remains in test helper (unused by `OAuthAuthService` but harmless)

## 4. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create branch `feature/SCRUM-232-backend` from `main`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-232-backend`

### Step 1: Replace duplicate method calls with tokenService delegation

- **File**: `nexacore-api/src/auth/oauth-auth.service.ts`
- **Action**: Replace `this.checkImpossibleTravel(...)` with `this.tokenService.checkImpossibleTravel(...)` and `this.handleTravelBlock(...)` with `this.tokenService.handleTravelBlock(...)`
- **Implementation Steps**:
  1. Line 50: Change `await this.checkImpossibleTravel(` to `await this.tokenService.checkImpossibleTravel(`
  2. Line 55: Change `this.handleTravelBlock(` to `this.tokenService.handleTravelBlock(`

### Step 2: Delete duplicate private methods

- **File**: `nexacore-api/src/auth/oauth-auth.service.ts`
- **Action**: Remove the two private methods (lines 134-180)
- **Implementation Steps**:
  1. Delete `private async checkImpossibleTravel(...)` method (lines 134-155)
  2. Delete `private handleTravelBlock(...)` method (lines 157-180)

### Step 3: Remove unused imports and DI

- **File**: `nexacore-api/src/auth/oauth-auth.service.ts`
- **Action**: Remove imports and constructor params that are no longer needed
- **Implementation Steps**:
  1. Remove `ForbiddenException` from `@nestjs/common` import (line 4) — only used in deleted `handleTravelBlock`
  2. Remove `import { ImpossibleTravelService }` (line 13) — only used in deleted `checkImpossibleTravel`
  3. Remove `import { ImpossibleTravelResult }` (line 14) — only used in deleted method signatures
  4. Remove `private readonly impossibleTravelService: ImpossibleTravelService` from constructor (line 30)
- **Notes**:
  - Keep `AuditService` — used at line 64 in `validateOAuthUser`
  - Keep `AuditAction` — used at lines 59-66 in `validateOAuthUser`
  - Keep `SuspiciousLoginService` in constructor — it's dead DI (pre-existing, not in this ticket's scope), removing it could break test module DI expectations
  - Keep `Logger` — used at line 23

### Step 4: Verify Build and Tests

- **Action**: Run backend build and tests to verify no regression
- **Implementation Steps**:
  1. Run `nest build` in nexacore-api — must compile clean
  2. Run `npm test` in nexacore-api — all tests must pass (889 expected)

### Step 5: Update Technical Documentation

- **Action**: No API, data model, or architecture changes
- **Notes**: Only integration-state.md changelog entry needed (handled by `/update-docs`)

## 5. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Replace method calls with tokenService delegation
3. Step 2: Delete duplicate private methods
4. Step 3: Remove unused imports and DI
5. Step 4: Verify build and tests
6. Step 5: Update documentation

## 6. Testing Checklist

- [ ] `checkImpossibleTravel` no longer exists in oauth-auth.service.ts
- [ ] `handleTravelBlock` no longer exists in oauth-auth.service.ts
- [ ] Both methods still exist in token.service.ts (canonical, unchanged)
- [ ] `ImpossibleTravelService` removed from OAuthAuthService constructor
- [ ] `ForbiddenException` removed from imports
- [ ] `ImpossibleTravelResult` removed from imports
- [ ] `nest build` compiles clean
- [ ] All tests pass (889)

## 7. Error Response Format

N/A — no error handling changes. The `handleTravelBlock` in `token.service.ts` already throws `ForbiddenException` with the same message.

## 8. Dependencies

- No new dependencies

## 9. Notes

- This is a pure refactoring ticket — behavior is identical before and after
- `SuspiciousLoginService` in `OAuthAuthService` constructor is dead DI (never referenced in the file) — this is a pre-existing issue, not in scope for SCRUM-232. Could be a follow-up ticket.
- The inline error string in `handleTravelBlock` ('Login blocked due to suspicious location activity...') is a candidate for SCRUM-234 (CH-02 inline error string extraction), not this ticket
- `token.service.ts` methods are already public — no visibility change needed

## 10. Next Steps After Implementation

- Run `/verify` to confirm plan compliance
- Run `/commit` to create commit
- Run `/update-docs` to create implementation record

## 11. Implementation Verification

- [ ] 2 duplicate methods removed from oauth-auth.service.ts
- [ ] 1 constructor dependency removed (ImpossibleTravelService)
- [ ] 3 imports removed (ForbiddenException, ImpossibleTravelService, ImpossibleTravelResult)
- [ ] Calls delegated to tokenService
- [ ] Build passes
- [ ] All tests pass
- [ ] No behavioral changes
