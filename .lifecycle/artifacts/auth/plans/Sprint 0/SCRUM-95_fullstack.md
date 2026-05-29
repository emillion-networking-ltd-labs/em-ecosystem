# Fullstack Implementation Plan: SCRUM-95 — Fix Rate Limiting and Account Lockout System Coherence

## Codebase State Snapshot

- **Date**: 2026-02-28
- **Last completed ticket**: SCRUM-94 frontend (toast notification system — implemented, uncommitted)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/common/guards/custom-throttler.guard.ts` (72 lines) — `handleRequest` with `timeToExpire`, `generateKey`
  - `nexacore-api/src/common/guards/tests/custom-throttler.guard.spec.ts` (199 lines) — 7 tests, mocks use `timeToExpire: 60000`
  - `nexacore-api/src/common/filters/http-exception.filter.ts` (82 lines) — passthrough for retryAfter/lockoutLevel
  - `nexacore-api/src/auth/auth.service.ts` — ForbiddenException payloads with `{ retryAfter, lockoutLevel }`
  - `nexacore-api/src/auth/auth.controller.ts` (469 lines) — `@Throttle` decorators on register, login, refresh, forgot-password, reset-password
  - `nexacore-api/node_modules/@nestjs/throttler/dist/throttler.service.js` — `getExpirationTime` returns SECONDS
  - `nexacore-dashboard/src/context/AuthContext.tsx` (361 lines) — RATE_LIMITED action, login/register have retryAfter detection
  - `nexacore-dashboard/src/components/auth/LoginForm.tsx` (320 lines) — has RateLimitBanner
  - `nexacore-dashboard/src/components/auth/RegisterForm.tsx` (168 lines) — NO RateLimitBanner
  - `nexacore-dashboard/src/components/auth/ForgotPasswordForm.tsx` (99 lines) — NO RateLimitBanner
  - `nexacore-dashboard/src/components/auth/ResetPasswordForm.tsx` (172 lines) — NO RateLimitBanner
  - `nexacore-dashboard/src/components/auth/MfaTotpStep.tsx` (238 lines) — NO RateLimitBanner
- **Constructor signatures verified**: `CustomThrottlerGuard` extends `ThrottlerGuard` (no constructor, uses `this.storageService` from parent)
- **Guard dependency chain verified**: `CustomThrottlerGuard` → `ThrottlerGuard` → `ThrottlerStorageService` (injected by `@nestjs/throttler` module)

## Overview

- **Epic**: N/A — standalone bug fix
- **Ticket**: SCRUM-95
- **Priority**: High
- **What this implements**: Fixes incoherent rate limiting behavior where RateLimitBanner always showed "Try again in 1s" regardless of actual retry time.

### Root Cause Analysis

During SCRUM-94 manual testing, the RateLimitBanner displayed "Too many requests. Try again in 1s" on every login attempt after account lockout expiry. Investigation revealed a chain of 3 issues:

#### Issue 1: Backend seconds/milliseconds confusion (CRITICAL)

`CustomThrottlerGuard.handleRequest()` treats `timeToExpire` as milliseconds and divides by 1000:

```typescript
// BUGGY:
const retryAfterSeconds = Math.ceil(timeToExpire / 1000);
```

But `ThrottlerStorageService.getExpirationTime()` (from `@nestjs/throttler` v6.5.0) already returns **seconds**:

```javascript
// node_modules/@nestjs/throttler/dist/throttler.service.js
getExpirationTime(key) {
  return Math.ceil((expiresAt - Date.now()) / 1000);  // ← already seconds
}
```

So `Math.ceil(60 / 1000) = 1` — the "1s" bug. The `resetTime` calculation has the same error.

Additionally, `timeToBlockExpire` was not destructured from the storage result, so blocked requests used `timeToExpire` instead of `timeToBlockExpire` for the retry header.

#### Issue 2: Tests pass by coincidence

Test mocks use `timeToExpire: 60000` (treating it as ms). `Math.ceil(60000 / 1000) = 60` matches expected assertions. Real storage returns `60` (seconds), code divides by 1000 → `0.06`, ceil → `1`.

#### Issue 3: Frontend state leak + incomplete coverage

- `AUTH_START` and `AUTH_STOP` don't clear `rateLimitInfo`, so stale banners persist.
- Only `LoginForm` shows `RateLimitBanner`. `RegisterForm`, `ForgotPasswordForm`, `ResetPasswordForm`, and `MfaTotpStep` have rate-limited endpoints but no banner UI.
- Only `login()` and `register()` check `errObj?.error?.retryAfter`. The methods `verifyMfaLogin`, `forgotPassword`, `resetPassword`, and `resendVerification` silently ignore rate limit responses.

#### Issue 4: Throttler masks account lockout (same limit = 5)

Both `AUTH_RATE_LIMITS.login.limit` (throttler) and `MAX_FAILED_ATTEMPTS` (lockout) are set to 5. The lockout fires on the 5th wrong password (403, 15min+), but the throttler simultaneously exhausts its budget. After the throttler TTL expires (60s), the user tries again and sees 403 from the lockout — but the experience is confusing because the throttler's 429/60s response appears alongside the lockout's 403/15min response.

**Fix**: Increase the login throttle limit to 10 (double the lockout threshold) so the lockout is ALWAYS the first protection that the user encounters. The throttler becomes a secondary brute-force defense that only triggers after 10+ requests per minute.

### Design Decisions

1. **Fix the backend bug, don't work around it in the frontend** — The `retryAfter` value must be accurate at the source.
2. **Keep single `RATE_LIMITED` action for both 429 and 403** — Same UX (banner + countdown + form disabled). Backend message already differentiates ("Too many requests" vs "Account locked").
3. **Add RateLimitBanner to all rate-limited forms** — All endpoints with `@Throttle` should have corresponding UI feedback.
4. **Use `timeToBlockExpire` for blocked requests** — More accurate than `timeToExpire` for block duration.
5. **Login throttle limit (10) > lockout threshold (5)** — Ensures account lockout always fires first without throttler masking it. Proven via curl testing: 5 attempts → 403 lockout, attempt 6+ → still 403 (not 429).

## Architecture Context

### Modules involved

| Module | Responsibility | Change |
|--------|---------------|--------|
| `common/guards` | Custom throttler guard | **Modified** — fix seconds/ms confusion |
| `common/guards/tests` | Guard unit tests | **Modified** — fix mock values |
| `AuthContext` (dashboard) | Auth state management | **Modified** — state cleanup + retryAfter detection |
| Auth forms (dashboard) | Registration, password reset, MFA | **Modified** — add RateLimitBanner |

### Components affected

| Component | File | Change |
|-----------|------|--------|
| CustomThrottlerGuard | `nexacore-api/src/common/guards/custom-throttler.guard.ts` | Fix `retryAfterSeconds` and `resetTime` |
| CustomThrottlerGuard spec | `nexacore-api/src/common/guards/tests/custom-throttler.guard.spec.ts` | Fix mock values ms→s |
| Auth constants | `nexacore-api/src/auth/constants/auth.constants.ts` | Login throttle limit 5→10 |
| Rate limiting spec | `nexacore-api/src/auth/tests/rate-limiting.spec.ts` | Update login limit assertion 5→10 |
| AuthContext | `nexacore-dashboard/src/context/AuthContext.tsx` | Clear rateLimitInfo in AUTH_START/AUTH_STOP; add retryAfter to 4 methods |
| RegisterForm | `nexacore-dashboard/src/components/auth/RegisterForm.tsx` | Add RateLimitBanner |
| ForgotPasswordForm | `nexacore-dashboard/src/components/auth/ForgotPasswordForm.tsx` | Add RateLimitBanner |
| ResetPasswordForm | `nexacore-dashboard/src/components/auth/ResetPasswordForm.tsx` | Add RateLimitBanner |
| MfaTotpStep | `nexacore-dashboard/src/components/auth/MfaTotpStep.tsx` | Add RateLimitBanner (both TOTP + recovery views) |

### Unchanged files (verified correct)

- `http-exception.filter.ts` — already correctly passes through `retryAfter`/`lockoutLevel`
- `auth.service.ts` — `ForbiddenException` payloads have correct `retryAfter` values
- `RateLimitBanner.tsx` — component works as-is
- `LoginForm.tsx` — already has full RateLimitBanner implementation (reference pattern)
- `lib/types.ts` — `ErrorResponse` already has `retryAfter` field

## Implementation Steps

### Step 0: Create Feature Branch

- **Branch name**: `feature/SCRUM-95-fullstack`
- **Base**: `feature/SCRUM-94-frontend` (or working tree with SCRUM-94 uncommitted changes)

---

### Step 1: Fix CustomThrottlerGuard — seconds/ms confusion

- **File**: `nexacore-api/src/common/guards/custom-throttler.guard.ts`
- **Action**: Fix `retryAfterSeconds` and `resetTime` calculations; destructure `timeToBlockExpire`

**Before** (buggy):
```typescript
const { totalHits, timeToExpire, isBlocked } =
  await this.storageService.increment(key, ttl, limit, blockDuration, throttlerName);
const resetTime = Math.ceil((Date.now() + timeToExpire) / 1000);
if (isBlocked || totalHits > limit) {
  const retryAfterSeconds = Math.ceil(timeToExpire / 1000);
```

**After** (correct):
```typescript
// Note: storageService.increment returns timeToExpire and timeToBlockExpire
// already in SECONDS (via getExpirationTime which divides by 1000).
const { totalHits, timeToExpire, isBlocked, timeToBlockExpire } =
  await this.storageService.increment(key, ttl, limit, blockDuration, throttlerName);
const resetTime = Math.ceil(Date.now() / 1000) + timeToExpire;
if (isBlocked || totalHits > limit) {
  const retryAfterSeconds = isBlocked
    ? Math.max(timeToBlockExpire, 1)
    : Math.max(timeToExpire, 1);
```

**Changes**:
1. Destructure `timeToBlockExpire` from storage result
2. Add comment documenting that values are already in seconds
3. `resetTime`: `Math.ceil(Date.now() / 1000) + timeToExpire` (was `Math.ceil((Date.now() + timeToExpire) / 1000)`)
4. `retryAfterSeconds`: use value directly, no `/1000`; use `timeToBlockExpire` when `isBlocked`; `Math.max(..., 1)` to avoid 0-second values

---

### Step 2: Fix CustomThrottlerGuard tests

- **File**: `nexacore-api/src/common/guards/tests/custom-throttler.guard.spec.ts`
- **Action**: Fix mock values to match real storage output (seconds, not milliseconds)

**4 mock values to fix**:

| Test | Field | Before | After |
|------|-------|--------|-------|
| "successful request" | `timeToExpire` | `60000` | `60` |
| "limit exceeded" | `timeToExpire` | `60000` | `60` |
| "blocked" | `timeToExpire` | `30000` | `30` |
| "blocked" | `timeToBlockExpire` | `30000` | `45` |
| "default throttler name" | `timeToExpire` | `60000` | `60` |

**Enhanced blocked test**: Add assertions for `retryAfter` in the error body and `Retry-After` header using `timeToBlockExpire` value (45, not 30):

```typescript
const body = (error as HttpException).getResponse() as any;
expect(body.error.retryAfter).toBe(45);
// ...
expect(mockResponse.setHeader).toHaveBeenCalledWith('Retry-After', 45);
```

---

### Step 2b: Increase login throttle limit to avoid masking lockout

- **File**: `nexacore-api/src/auth/constants/auth.constants.ts`
- **Action**: Change `AUTH_RATE_LIMITS.login.limit` from `5` to `10`

**Before**:
```typescript
export const AUTH_RATE_LIMITS = {
  login: { ttl: 60_000, limit: 5 },
```

**After**:
```typescript
export const AUTH_RATE_LIMITS = {
  login: { ttl: 60_000, limit: 10 },
```

- **File**: `nexacore-api/src/auth/tests/rate-limiting.spec.ts`
- **Action**: Update assertion from `toBe(5)` to `toBe(10)`, update test description

**Rationale**: With `MAX_FAILED_ATTEMPTS = 5` and throttler `limit = 5`, the lockout (403, 15min+) fires on the 5th wrong attempt at the same time the throttler exhausts its budget. The throttler then masks the lockout's longer block with its 60-second TTL. Setting throttler limit to 10 ensures the lockout always fires first (at attempt 5) and the throttler only kicks in as a secondary defense (at attempt 11).

**Verified via curl**: After this change, attempts 1-4 return 401, attempt 5 returns 403 (lockout, 15min), attempt 6 returns 403 (lockout still active, NOT 429). Progressive escalation confirmed: lockoutCount 0→1 (15min), 1→2 (30min), etc.

---

### Step 3: Fix AuthContext state management

- **File**: `nexacore-dashboard/src/context/AuthContext.tsx`
- **Action**: Clear `rateLimitInfo` in `AUTH_START` and `AUTH_STOP` reducer cases

**Before**:
```typescript
case 'AUTH_START':
  return { ...state, isLoading: true, error: null };
case 'AUTH_STOP':
  return { ...state, isLoading: false, isInitialized: true, mfaRequired: false, mfaToken: null };
```

**After**:
```typescript
case 'AUTH_START':
  return { ...state, isLoading: true, error: null, rateLimitInfo: DEFAULT_RATE_LIMIT };
case 'AUTH_STOP':
  return { ...state, isLoading: false, isInitialized: true, mfaRequired: false, mfaToken: null, rateLimitInfo: DEFAULT_RATE_LIMIT };
```

**Rationale**: Prevents stale rate limit banners when starting a new auth attempt (`AUTH_START`) or when transitioning to a non-rate-limit error (`AUTH_STOP`).

---

### Step 4: Add retryAfter detection to remaining auth methods

- **File**: `nexacore-dashboard/src/context/AuthContext.tsx`
- **Action**: Add `errObj?.error?.retryAfter` check to 4 methods that were missing it

**Methods to update** (same pattern as existing `login`/`register`):

1. `verifyMfaLogin()` — endpoint uses global throttle (100/60s)
2. `forgotPassword()` — endpoint has `@Throttle({ global: { ttl: 900000, limit: 3 } })`
3. `resetPassword()` — endpoint has `@Throttle({ default: { ttl: 60_000, limit: 5 } })`
4. `resendVerification()` — endpoint uses global throttle (100/60s)

**Pattern for each catch block**:
```typescript
catch (err: unknown) {
  const errObj = err as ApiError;
  if (errObj?.error?.retryAfter) {
    dispatch({
      type: 'RATE_LIMITED',
      payload: {
        retryAfter: errObj.error.retryAfter,
        message: errObj.error.message ?? 'Too many requests. Please try again later.',
      },
    });
  } else {
    addToast({ variant: 'error', title: extractErrorMessage(err, '...original fallback...') });
    dispatch({ type: 'AUTH_STOP' });
  }
  return false; // for methods that return boolean
}
```

---

### Step 5: Add RateLimitBanner to RegisterForm

- **File**: `nexacore-dashboard/src/components/auth/RegisterForm.tsx`
- **Changes**:
  1. Import `RateLimitBanner` from `@/components/ui/RateLimitBanner`
  2. Destructure `rateLimitInfo` from `useAuth()`
  3. Add `const isDisabled = isLoading || rateLimitInfo.isRateLimited`
  4. Add `const showRateLimit = rateLimitInfo.isRateLimited`
  5. Update `showError` and `showPasswordCheck` to respect `showRateLimit`
  6. In System Message slot: when `showRateLimit`, render `RateLimitBanner` instead of error/password check
  7. Disable submit button with `isDisabled` instead of `isLoading`
  8. Pass `onExpired={clearError}` to banner

---

### Step 6: Add RateLimitBanner to ForgotPasswordForm

- **File**: `nexacore-dashboard/src/components/auth/ForgotPasswordForm.tsx`
- **Changes**: Same pattern as Step 5
  1. Import `RateLimitBanner`
  2. Destructure `rateLimitInfo`
  3. Add `isDisabled`, `showRateLimit`, update `showError`
  4. Show `RateLimitBanner` in System Message slot when rate limited
  5. Disable submit button with `isDisabled`

---

### Step 7: Add RateLimitBanner to ResetPasswordForm

- **File**: `nexacore-dashboard/src/components/auth/ResetPasswordForm.tsx`
- **Changes**: Same pattern as Step 5 (includes password check logic like RegisterForm)

---

### Step 8: Add RateLimitBanner to MfaTotpStep

- **File**: `nexacore-dashboard/src/components/auth/MfaTotpStep.tsx`
- **Changes**: Same pattern, applied to **both** views (TOTP code input + recovery code input)
  1. Import `RateLimitBanner`
  2. Destructure `rateLimitInfo` from `useAuth()`
  3. Add `showRateLimit`, `showError`, `isDisabled` at component level
  4. In TOTP view: replace error div with conditional RateLimitBanner/error
  5. In Recovery view: replace error div with conditional RateLimitBanner/error
  6. Update both submit buttons to use `isDisabled`

---

### Step 9: Build and test

- **Backend**: `cd nexacore-api && npx nest build` — compiles clean
- **Backend tests**: `cd nexacore-api && npx jest --coverage` — all tests pass, thresholds met
- **Frontend**: `cd nexacore-dashboard && npm run build` — compiles clean
- **Manual tests**:
  1. Login with wrong password 6+ times rapidly → banner shows accurate countdown (e.g. "Try again in 60s"), NOT "1s"
  2. Login with wrong password 5 times → account lockout → banner shows lockout message with accurate countdown
  3. Wait for lockout to expire → login with wrong password → toast "Invalid credentials" (no stale banner)
  4. On RegisterForm, trigger rate limit → RateLimitBanner appears
  5. On ForgotPasswordForm, trigger rate limit → RateLimitBanner appears
  6. While banner is showing, navigate away and back → no stale banner (`AUTH_START` clears it)

---

### Step 10: Update Technical Documentation

- Create implementation record at `ai-specs/ai-specs/changes/records/SCRUM-95_fullstack.md`

## Implementation Order

1. Step 0: Create branch
2. Step 1: Fix CustomThrottlerGuard (backend)
3. Step 2: Fix CustomThrottlerGuard tests (backend)
4. Step 2b: Increase login throttle limit 5→10 + update test
5. Step 3: Fix AuthContext state management (frontend)
6. Step 4: Add retryAfter detection to remaining methods (frontend)
7. Step 5: Add RateLimitBanner to RegisterForm
8. Step 6: Add RateLimitBanner to ForgotPasswordForm
9. Step 7: Add RateLimitBanner to ResetPasswordForm
10. Step 8: Add RateLimitBanner to MfaTotpStep
11. Step 9: Build and test
12. Step 10: Documentation

## Testing Checklist

- [ ] `nest build` compiles clean
- [ ] All backend tests pass (428+ tests)
- [ ] Coverage thresholds met (Stmts ≥95%, Lines ≥95%)
- [ ] `custom-throttler.guard.ts` coverage 100%
- [ ] `npm run build` (dashboard) compiles clean
- [ ] Rate limit banner shows accurate countdown (not "1s")
- [ ] Blocked requests use `timeToBlockExpire` for retry header
- [ ] `AUTH_START` clears stale rate limit banners
- [ ] `AUTH_STOP` clears stale rate limit banners
- [ ] All 4 forms show RateLimitBanner when rate limited
- [ ] All 4 forms disable submit when rate limited
- [ ] Banner countdown triggers `onExpired`/`clearError` at zero

## Error Response Format

### ThrottlerGuard 429 response (after fix)

```json
{
  "success": false,
  "error": {
    "message": "Too many requests. Please try again later.",
    "code": "RATE_LIMIT_EXCEEDED",
    "statusCode": 429,
    "retryAfter": 60
  }
}
```

### HTTP headers (after fix)

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1740760000
Retry-After: 60
```

**Key difference**: `retryAfter` and `Retry-After` now contain actual seconds (e.g. `60`), not `1`.

## Dependencies

- No new libraries required
- `@nestjs/throttler` v6.5.0 — existing dependency, behavior verified via source inspection

## Notes

- **Prerequisite**: SCRUM-94 (toast system) must be implemented first. SCRUM-95 builds on top of it.
- **Zero new files**: All changes modify existing files.
- **Backend fix is the critical path**: Without fixing the seconds/ms confusion, all downstream UI work shows incorrect values.
- **Test mock propagation**: Mocks changed from `60000` (ms) to `60` (s) to match real `ThrottlerStorageService` output.
- **`Math.max(..., 1)` guard**: Prevents edge case where `timeToExpire` = 0 (request arrives exactly at expiry) from showing "Try again in 0s".

### Design Decision: OAuth-only Accounts Do NOT Lock (OWASP/NIST Compliant)

**Decision**: OAuth-only accounts (Google/GitHub, no password) are intentionally excluded from account lockout. They always return `401 Invalid credentials` without incrementing `failedAttempts`.

**Rationale** (per OWASP ASVS 2.7, NIST 800-63B Rev 4):

1. **No password to brute-force**: OAuth-only accounts have `passwordHash: null`. There is no secret to guess, so progressive lockout provides zero security benefit.
2. **DoS vector prevention**: Locking OAuth accounts allows an attacker to deny access to any known email by sending 5 bad requests. The legitimate user cannot unblock themselves because they don't use password login.
3. **Enumeration prevention**: If OAuth accounts return 403 (locked) while non-existent accounts return 401, the attacker can differentiate them. By always returning 401, OAuth-only accounts are indistinguishable from non-existent accounts.
4. **IP throttler is sufficient**: The per-IP rate limit (10 req/60s) provides adequate brute-force protection for all request types, including probing of OAuth accounts.
5. **Industry alignment**: Google, GitHub, and Microsoft do NOT lock accounts that lack password credentials. They rely on IP-rate-limiting + CAPTCHA instead.

**Verification** (curl test, 2026-02-28):
- `emillion.gonzalez@gmail.com` (GOOGLE, no password): 8 attempts → all `401 Invalid credentials`, DB shows `failedAttempts: 0`
- `emillion.spain@gmail.com` (GOOGLE, has password): 5 attempts → 4x `401` then `403 Account locked 15min`, DB shows `failedAttempts: 5, lockoutCount: 1`

**Response map**:

| Account type | Attempt 1-4 | Attempt 5 | Attempt 6-10 | Attempt 11+ |
|---|---|---|---|---|
| Password account | 401 | 403 locked 15min | 403 locked | 429 throttle 60s |
| OAuth-only (no password) | 401 | 401 | 401 | 429 throttle 60s |
| Non-existent email | 401 | 401 | 401 | 429 throttle 60s |

## Implementation Verification

- [ ] `retryAfterSeconds` no longer divides by 1000
- [ ] `timeToBlockExpire` destructured and used for blocked requests
- [ ] `resetTime` calculation uses addition, not division
- [ ] All 4 test mocks use seconds (not milliseconds)
- [ ] Blocked test asserts `retryAfter` = `timeToBlockExpire` value
- [ ] Login throttle limit increased to 10 (> MAX_FAILED_ATTEMPTS = 5)
- [ ] Rate limiting test updated for new login limit
- [ ] `AUTH_START` clears `rateLimitInfo`
- [ ] `AUTH_STOP` clears `rateLimitInfo`
- [ ] 4 auth methods now detect `retryAfter` in errors
- [ ] RateLimitBanner integrated in RegisterForm, ForgotPasswordForm, ResetPasswordForm, MfaTotpStep
- [ ] All forms disable submit during rate limit
- [ ] Backend builds and tests pass (428 tests)
- [ ] Frontend builds clean
- [ ] Lockout fires at attempt 5 (403), throttler doesn't mask it at attempt 6
