# Backend Implementation Plan: SCRUM-283 Implement Constant-Time Login Responses

## Codebase State Snapshot

- **Date**: 2026-03-18
- **Last completed ticket**: SCRUM-281 (MFA Setup Onboarding)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/auth/login.service.ts` (full method structure read)
  - `src/auth/auth.controller.ts` (login endpoint verified)
  - `src/auth/constants/auth.constants.ts` (existing constants confirmed)
  - `src/auth/tests/timing-attack.spec.ts` (2-assertion baseline)

- **Constructor signatures verified**:
  - `LoginService(usersService, tokenService, emailVerificationService, passwordBreachService, trustedDeviceService, loginSecurityService)` — 6 dependencies, order unchanged

- **Methods verified to exist**:
  - `LoginService.login()` — lines 99-143, delegates to helpers
  - `LoginService.checkAccountLockout()` — lines 145-155, throws synchronously if locked
  - `LoginService.validateCredentials()` — lines 172-196, runs bcrypt
  - `LoginService.handleMfaLogin()` — lines 235-261
  - `LoginService.handleMfaSetupRequired()` — lines 305-326
  - `LoginService.handleLoginSuccess()` — lines 328+

- **Guard dependency chain verified**: No new guards used in this ticket

- **Discrepancies with integration-state.md**: None detected

---

## Regression Impact Analysis

### Blast Radius: 8 files

| File | Type | Impact |
|------|------|--------|
| `src/auth/constants/auth.constants.ts` | Source | ADD: MIN_LOGIN_DURATION_MS constant (new export) |
| `src/auth/login.service.ts` | Source | MODIFY: login() → executeLogin() (private), add new public login() wrapper, add bcrypt in locked path |
| `src/auth/tests/auth.service.spec.ts` | Test | MODIFY: Mock MIN_LOGIN_DURATION_MS = 0 |
| `src/auth/tests/auth-login.spec.ts` | Test | MODIFY: Mock MIN_LOGIN_DURATION_MS = 0 |
| `src/auth/tests/auth-login-security.spec.ts` | Test | MODIFY: Mock MIN_LOGIN_DURATION_MS = 0 |
| `src/auth/tests/auth-login-device.spec.ts` | Test | MODIFY: Mock MIN_LOGIN_DURATION_MS = 0 |
| `src/auth/tests/brute-force.spec.ts` | Test | MODIFY: Mock MIN_LOGIN_DURATION_MS = 0 |
| `src/auth/tests/timing-attack.spec.ts` | Test | ENHANCE: Add 2 new assertions for MIN_LOGIN_DURATION_MS |

### Breaking Changes Identified

- **Constructor signature change**: ❌ None — LoginService constructor unchanged
- **Method signature change**: ⚠️ YES (minor, internal)
  - Old: `async login(dto, requestMeta, ctx?, fingerprint?)` → public method
  - New: `async login(dto, requestMeta, ctx?, fingerprint?)` → public wrapper; actual impl moved to `private executeLogin()`
  - **Impact**: AuthService facade delegates unchanged; external callers see no change
  - **Regression scope**: 0 breaking changes (signature identical from caller perspective)

- **Module exports**: ❌ None changed
- **API contract**: ❌ None changed (endpoint signature, DTOs, response unchanged)
- **Prisma schema**: ❌ No changes

### Test files requiring updates

All 5 files need mock override for MIN_LOGIN_DURATION_MS = 0 to prevent 350ms delays:
1. ✅ `src/auth/tests/auth.service.spec.ts`
2. ✅ `src/auth/tests/auth-login.spec.ts`
3. ✅ `src/auth/tests/auth-login-security.spec.ts`
4. ✅ `src/auth/tests/auth-login-device.spec.ts`
5. ✅ `src/auth/tests/brute-force.spec.ts`

---

## Overview

SCRUM-283 addresses two timing-attack WARNs from the SCRUM-281 audit:

- **H-12**: Account-locked path returns in <5ms (no bcrypt) vs all other paths ~200ms → attackers can infer account locked state by response latency
- **EM-04**: Post-validation paths diverge: MFA challenge (JWT sign, fast) vs full login (generateTokens + DB, slow) vs MFA setup (JWT sign, fast) → variance reveals which code path executed

**Goal**: Eliminate response-time variance so login latency doesn't leak information about user account state or auth flow path.

---

## Architecture Context

### Modules involved
- **AuthModule**: Contains LoginService, TokenService, all auth controllers
- No new modules created
- No new module imports required

### Components affected
- `LoginService.login()` — main entry point, will be refactored
  - Current: Single method with multiple branches
  - New: Public wrapper with timing floor + private executeLogin() with timing equalization
- `LoginSecurityService` — unchanged, audit logging unaffected
- All other auth services — unchanged

### Files referenced
- `src/auth/login.service.ts` — main implementation
- `src/auth/constants/auth.constants.ts` — timing constant
- `src/auth/tests/*.spec.ts` — 6 test files to update

---

## Implementation Steps

### Step 0: Create Feature Branch

```bash
git checkout main && git pull origin main
git checkout -b feature/SCRUM-283-backend
```

**Status**: ✅ DONE

---

### Step 1: Add MIN_LOGIN_DURATION_MS constant

**File**: `src/auth/constants/auth.constants.ts`

**Action**: Add timing constant after DUMMY_PASSWORD_HASH

**Code**:
```typescript
/**
 * Minimum login response duration in milliseconds.
 * Mitigates timing attacks by ensuring all login paths (success, MFA required, MFA setup, lockout, failures)
 * take at least this long to respond. If execution completes faster, setTimeout pads the response.
 * 350ms is conservative above typical bcrypt 12-round time (~200–300ms).
 * Addresses audit findings H-12 (account lockout timing leak) and EM-04 (login path timing variance).
 */
export const MIN_LOGIN_DURATION_MS = 350;
```

**Status**: ✅ DONE

---

### Step 2: Modify LoginService

**File**: `src/auth/login.service.ts`

#### Step 2a: Import MIN_LOGIN_DURATION_MS

Add to imports from `./constants/auth.constants`:
```typescript
import { ..., MIN_LOGIN_DURATION_MS, ... } from './constants/auth.constants';
```

**Status**: ✅ DONE

#### Step 2b: Rename login() to private executeLogin()

Change method signature from:
```typescript
async login(
  dto: LoginDto,
  requestMeta: { ipAddress: string; userAgent?: string | null },
  ctx?: RequestContext,
  fingerprint?: string,
): Promise<AuthResult | MfaChallengeResult | MfaSetupRequiredResult> {
```

To:
```typescript
private async executeLogin(
  dto: LoginDto,
  requestMeta: { ipAddress: string; userAgent?: string | null },
  ctx?: RequestContext,
  fingerprint?: string,
): Promise<AuthResult | MfaChallengeResult | MfaSetupRequiredResult> {
```

**Status**: ✅ DONE

#### Step 2c: Add Layer 1 fix (H-12) — bcrypt before lockout

In `executeLogin()`, before `this.checkAccountLockout(user, ctx)` (around line 118), insert:

```typescript
// Layer 1 timing defense (H-12): Equalize response time for locked-account path
// by running bcrypt before checkAccountLockout throws, matching user-not-found path timing.
if (user.lockedUntil && user.lockedUntil > new Date()) {
  await bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH);
}
```

**Status**: ✅ DONE

#### Step 2d: Add new public login() wrapper with Layer 2 floor (EM-04)

After `executeLogin()` method (after line 150), add:

```typescript
/**
 * Public login method with timing attack mitigation.
 * Wraps executeLogin() with a min-duration floor to ensure all code paths
 * (success, MFA required, MFA setup, failures, lockout) take ≥ MIN_LOGIN_DURATION_MS.
 *
 * This addresses:
 * - H-12 (account lockout timing leak): Ensures locked path doesn't return early
 * - EM-04 (login path timing variance): Equalizes post-validation path execution times
 */
async login(
  dto: LoginDto,
  requestMeta: { ipAddress: string; userAgent?: string | null },
  ctx?: RequestContext,
  fingerprint?: string,
): Promise<AuthResult | MfaChallengeResult | MfaSetupRequiredResult> {
  const start = Date.now();
  let result: AuthResult | MfaChallengeResult | MfaSetupRequiredResult | undefined;
  let error: unknown;

  try {
    result = await this.executeLogin(dto, requestMeta, ctx, fingerprint);
  } catch (err) {
    error = err;
  }

  // Layer 2 timing defense (EM-04): Apply min-duration floor to all paths
  const elapsed = Date.now() - start;
  if (elapsed < MIN_LOGIN_DURATION_MS) {
    await new Promise<void>((resolve) =>
      setTimeout(resolve, MIN_LOGIN_DURATION_MS - elapsed),
    );
  }

  if (error !== undefined) throw error as Error;
  return result!;
}
```

**Status**: ✅ DONE

---

### Step 3: Update test files to mock MIN_LOGIN_DURATION_MS = 0

**Files**: 5 spec files
**Action**: Add at the very top (before any imports):

```typescript
jest.mock('../constants/auth.constants', () => ({
  ...jest.requireActual('../constants/auth.constants'),
  MIN_LOGIN_DURATION_MS: 0,
}));
```

**Files to update**:
1. ✅ `src/auth/tests/auth.service.spec.ts`
2. ✅ `src/auth/tests/auth-login.spec.ts`
3. ✅ `src/auth/tests/auth-login-security.spec.ts`
4. ✅ `src/auth/tests/auth-login-device.spec.ts`
5. ✅ `src/auth/tests/brute-force.spec.ts`

**Status**: ✅ DONE

---

### Step 4: Enhance timing-attack.spec.ts

**File**: `src/auth/tests/timing-attack.spec.ts`

**Action**: Import MIN_LOGIN_DURATION_MS and add test suite

```typescript
describe('MIN_LOGIN_DURATION_MS', () => {
  it('should be defined and positive', () => {
    expect(MIN_LOGIN_DURATION_MS).toBeDefined();
    expect(typeof MIN_LOGIN_DURATION_MS).toBe('number');
    expect(MIN_LOGIN_DURATION_MS).toBeGreaterThan(0);
  });

  it('should be above typical bcrypt 12-round time (>= 200ms)', () => {
    // MIN_LOGIN_DURATION_MS should be at least 200ms to account for
    // bcrypt 12-round execution time on standard hardware (~200-300ms)
    expect(MIN_LOGIN_DURATION_MS).toBeGreaterThanOrEqual(200);
  });
});
```

**Status**: ✅ DONE

---

### Step 5: Run tests + build

```bash
cd nexacore-api
npx jest --maxWorkers=1 --forceExit --testPathPatterns="timing|auth.service|auth-login|auth-login-security|auth-login-device|brute-force"
npx nest build
```

**Status**: ✅ DONE
- All 589 auth module tests pass
- Build succeeds with 0 errors

---

## Implementation Order

1. ✅ Step 0: Create branch
2. ✅ Step 1: Add constant
3. ✅ Step 2: Modify LoginService (4 sub-steps)
4. ✅ Step 3: Update 5 spec files
5. ✅ Step 4: Enhance timing-attack.spec.ts
6. ✅ Step 5: Run tests + build

---

## Testing Checklist

- ✅ MIN_LOGIN_DURATION_MS = 350 exported from constants
- ✅ login() wraps executeLogin() with try/catch + setTimeout floor
- ✅ Account-locked path has bcrypt.compare(DUMMY_HASH) before throw
- ✅ 5 affected spec files have mock override for MIN_LOGIN_DURATION_MS = 0
- ✅ timing-attack.spec.ts has 2 new assertions for constant
- ✅ All 589 auth module tests pass (0 failures)
- ✅ nest build compiles clean

---

## Error Response Format

No API changes — response format unchanged. LoginService.login() signature identical from caller perspective.

---

## Dependencies

- **Runtime**: None new (setTimeout is native Node.js)
- **Test**: No new test dependencies

---

## Notes

- **No API contract change**: login() signature unchanged from AuthService caller perspective
- **No breaking changes**: LoginService constructor unchanged, module exports unchanged
- **350ms floor rationale**: Conservative above typical bcrypt 12-round time (~200–300ms). If hardware faster/slower, adjust constant without logic changes
- **Layer 1 + Layer 2 defense in depth**:
  - Layer 1 (bcrypt in locked path) handles the critical gap (H-12)
  - Layer 2 (min-duration floor) handles remaining path variance (EM-04)

---

## Next Steps After Implementation

1. Run `/verify SCRUM-283` to validate plan compliance
2. Run `/commit SCRUM-283 auth` to create PR
3. Run `/update-docs` to update integration-state.md

---

## Implementation Verification

**Final status**:
- ✅ Code Quality: Consistent with existing patterns, follows security practices
- ✅ Functionality: Both timing attack vectors addressed (H-12, EM-04)
- ✅ Testing: All 589 auth tests pass, no regressions
- ✅ Regression: All 5 blast-radius test files updated and passing
- ✅ Integration: No module imports changed, no circular dependencies introduced
- ✅ Documentation: Constant and public login() method documented with audit references

**Build Status**: ✅ CLEAN

---

**Plan Document**: SCRUM-283_backend.md
**Date Created**: 2026-03-18
**Sprint**: 13 (Dashboard Shell)
