# Backend Implementation Plan: SCRUM-124 Update api-spec, integration-state, and dev setup docs (A-05/INT-01/02/04/B-04)

## Codebase State Snapshot

- **Date**: 2026-03-04
- **Last completed ticket on branch**: SCRUM-123 (Auth test coverage 90%+ functions)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `ai-specs/specs/api-spec.yml` — line 124: /auth/login description says "Sessions idle for more than 24 hours" (stale — should be "30 minutes" per SCRUM-120 idle timeout change)
  - `ai-specs/specs/api-spec.yml` — lines 153-162: 403 response already has 3 variants with discriminating descriptions (A-05 already fixed by SCRUM-119 /update-docs)
  - `ai-specs/specs/integration-state.md` — Module Registry includes PrismaService (INT-01 already fixed), CryptoService NOT listed for AuthService (INT-02 correct — CryptoService is NOT an AuthService dep), permissions have behavioral descriptions (INT-04 already fixed)
  - `ai-specs/specs/development_guide.md` — lines 14-21: MaxMind GeoLite2 setup documented (B-04 already fixed)
  - `nexacore-api/src/auth/auth.service.ts` — constructor at line 108: 11 deps (UsersService, SessionsService, JwtService, OAuthCodeStore, AuditService, PasswordBreachService, PrismaService, MailService, TrustedDeviceService, ImpossibleTravelService, SuspiciousLoginService). Note: TokenDenyListService from SCRUM-117 is on `main` branch, not in this feature branch chain.
- **Constructor signatures verified**: N/A — docs-only changes in ai-specs, no code modifications
- **Guard dependency chain verified**: N/A — no guard changes
- **Discrepancies with integration-state.md**: TokenDenyListService listed as AuthService dep in integration-state.md (from SCRUM-117 on `main`), but not present in this branch chain. Expected — SCRUM-117 was implemented independently on `main`.

## Overview

Close 5 audit WARN findings (A-05, INT-01, INT-02, INT-04, B-04) by updating documentation to match current codebase state. During live-code verification, **4 of 5 findings were already resolved** by individual `/update-docs` steps during SCRUM-119–123 rectification. The only remaining gap is a stale idle timeout value in api-spec.yml.

## Architecture Context

- **Modules involved**: None — documentation files only (ai-specs repo)
- **Components affected**: api-spec.yml (1 line fix)
- **No DI, module, guard, controller, or schema changes**

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-124-backend` from SCRUM-123 branch
- **Implementation Steps**:
  1. `git checkout feature/SCRUM-123-backend` (should already be there)
  2. `git checkout -b feature/SCRUM-124-backend`
  3. Verify branch: `git branch --show-current`

### Step 1: Fix Stale Idle Timeout in api-spec.yml

- **File**: `ai-specs/specs/api-spec.yml`
- **Action**: Update /auth/login endpoint description to reflect 30-minute idle timeout (changed in SCRUM-120)
- **Implementation Steps**:
  1. Read line 124 of `ai-specs/specs/api-spec.yml`
  2. Change "Sessions idle for more than 24 hours" to "Sessions idle for more than 30 minutes"
  3. This is the ONLY remaining documentation gap from the 5 audit findings

### Step 2: Build, Test, Verify

- **Implementation Steps**:
  1. `nest build` — zero errors (no code changes, but verify compilation still clean)
  2. `jest --maxWorkers=1 --forceExit` — all 773 tests pass (no test changes)
  3. Verify api-spec.yml change is correct

### Step 3: Update Technical Documentation

- **Action**: Update integration-state.md changelog
- **Implementation Steps**:
  1. Add SCRUM-124 changelog entry to `ai-specs/specs/integration-state.md`
  2. No other documentation changes needed (A-05, INT-01, INT-02, INT-04, B-04 all resolved)

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Fix stale idle timeout in api-spec.yml
3. Step 2: Build, test, verify
4. Step 3: Update integration-state.md changelog

## Testing Checklist

- [ ] api-spec.yml line 124 says "30 minutes" (not "24 hours")
- [ ] `nest build` compiles with zero errors
- [ ] All 773 existing tests still pass
- [ ] integration-state.md changelog entry added

## Error Response Format

No API error responses — documentation-only changes with no runtime behavior modifications.

## Dependencies

- No new npm packages
- **Prerequisite**: SCRUM-123 (must be on `feature/SCRUM-123-backend` branch)

## Notes

- **Docs-only ticket**: No source code modifications in em-ecosystem-code. Only ai-specs doc updates.
- **4 of 5 findings pre-resolved**: A-05 (403 variants), INT-01 (PrismaService), INT-02 (CryptoService), INT-04 (permissions descriptions), and B-04 (MaxMind setup) were all already fixed during individual `/update-docs` steps in SCRUM-119–123 rectification.
- **Single remaining gap**: api-spec.yml line 124 idle timeout value stale from SCRUM-120 change.
- **TokenDenyListService note**: integration-state.md references this as an AuthService dep (from SCRUM-117 on `main`). This is correct for `main` branch but not present in this feature branch chain. No action needed — will reconcile when branches merge.
- **Rectified**: Individual branch/commit/PR replacing bulk commit `e0f12f7`.

## Next Steps After Implementation

1. Commit, push, create PR
2. Run `/update-docs SCRUM-124`
3. Proceed to SCRUM-125 (npm audit fix + update)

## Implementation Verification

- [ ] **Code Quality**: N/A — no code changes
- [ ] **Functionality**: N/A — docs only
- [ ] **Testing**: All existing tests pass (no changes)
- [ ] **Security**: A-05 audit finding fully resolved
- [ ] **Integration**: INT-01/02/04 already resolved, integration-state.md updated
- [ ] **Documentation**: api-spec.yml idle timeout corrected, changelog updated
