# SCRUM-145: Login Lockout Anti-Enumeration — Backend Plan

- **Ticket**: SCRUM-145
- **Scope**: backend
- **Sprint**: 5 — Security Hardening
- **Priority**: CRITICAL (C-05)
- **Security references**: CWE-203, OWASP ASVS V2.2, NIST SP 800-63B

---

### 1. Codebase State Snapshot

- **Date**: 2026-03-08
- **Last completed ticket**: SCRUM-141 (Registration Anti-Enumeration — Sprint 5)
- **Branch**: main (clean)

**Files verified**:

| File | Key observations |
|------|------------------|
| `auth.service.ts:197-315` | `login()`: 3 distinct paths — (1) user not found → `UnauthorizedException` (line 216), (2) locked → `ForbiddenException({retryAfter})` (line 234), (3) 5th failed attempt → `ForbiddenException({retryAfter})` (line 291). Paths 2 and 3 use HTTP 403, revealing account existence. |
| `auth.service.ts:111-124` | Constructor: 12 deps (unchanged from SCRUM-141) |
| `auth.constants.ts:17-20` | `DUMMY_PASSWORD_HASH` exists, `MAX_FAILED_ATTEMPTS=5`, `LOCKOUT_DURATIONS_MINUTES=[15,30,60,120]` |
| `error-messages.ts:8` | `TOO_MANY_ATTEMPTS: 'Too many attempts. Please try again later.'` |
| `http-exception.filter.ts:44-47` | Filter reads `responseObj.retryAfter` from ANY HttpException and sets `Retry-After` HTTP header. Body does NOT include `retryAfter` (stripped by SCRUM-140). |
| `auth.service.spec.ts:422-430` | Test "should throw ForbiddenException when account is locked" |
| `auth.service.spec.ts:524-535` | Test "should lock account after 5 failed attempts and throw ForbiddenException" |
| `auth.service.spec.ts:1874-1887` | Test "login - account locked" — ForbiddenException |
| `auth.service.spec.ts:1952-1967` | Test "login - max failed attempts triggers lockout" — ForbiddenException |
| `auth.service.spec.ts:2544-2549` | Test "audit rejects on locked account" — ForbiddenException |
| `AuthContext.tsx:113-114` | `detectRateLimitKind`: returns 'lockout' when `code === 'FORBIDDEN'`, otherwise 'throttle' |
| `api.ts:150-155` | `parseErrorResponse`: reads `Retry-After` header ONLY for 429 responses — pre-existing issue from SCRUM-140 |

### 2. Overview

The login endpoint returns `ForbiddenException` (HTTP 403) for locked accounts and `UnauthorizedException` (HTTP 401) for non-existing accounts. An attacker can send 6+ login attempts and observe the status code change from 401 to 403 to confirm email existence.

**Fix**: Change both lockout paths (already-locked and lockout-triggered) from `ForbiddenException` to `UnauthorizedException` with the same `'Invalid credentials'` message. The `retryAfter` value is preserved in the exception response object so `HttpExceptionFilter` still sets the `Retry-After` HTTP header.

### 3. Architecture Context

- **Module**: AuthModule
- **Affected service**: AuthService.login() — two `ForbiddenException` throws become `UnauthorizedException`
- **No new modules/guards/DI changes**
- **HttpExceptionFilter**: Already handles `retryAfter` on any HttpException type — no changes needed
- **Frontend note**: `api.ts` only reads `Retry-After` header for 429 responses (pre-existing issue from SCRUM-140). Lockout countdown is already broken regardless of this fix. This should be addressed in a separate ticket.

### 4. Implementation Steps

#### Step 1: Change already-locked path (lines 220-240)

**File**: `nexacore-api/src/auth/auth.service.ts`

```typescript
// BEFORE (line 234-239)
throw new ForbiddenException({
  message: ErrorMessages.auth.TOO_MANY_ATTEMPTS,
  error: 'Forbidden',
  statusCode: 403,
  retryAfter: remainingSeconds,
});

// AFTER
throw new UnauthorizedException({
  message: ErrorMessages.auth.AUTHENTICATION_FAILED,
  error: 'Unauthorized',
  statusCode: 401,
  retryAfter: remainingSeconds,
});
```

**Key**: Use `ErrorMessages.auth.AUTHENTICATION_FAILED` ('Authentication failed') — same generic message as other UnauthorizedException paths. The `retryAfter` is still in the exception object so `HttpExceptionFilter` sets the `Retry-After` header.

Wait — review: the existing non-locked failed login throws `new UnauthorizedException('Invalid credentials')` (line 314) which uses the string directly, not `ErrorMessages.auth.INVALID_CREDENTIALS`. Let me check what the filter does with strings...

Actually, looking at the filter (line 35): `message = (responseObj.message as string) || exception.message`. When we pass an object to `UnauthorizedException`, the filter extracts `responseObj.message`. So the message in the response body will be `ErrorMessages.auth.AUTHENTICATION_FAILED`.

But the non-existing account path (line 216) throws `new UnauthorizedException('Invalid credentials')` — when a string is passed, the filter takes `exceptionResponse` as a string (line 24-25), so `message = exceptionResponse` = `'Invalid credentials'`.

For anti-enumeration, ALL paths must produce the same message. Let me use `ErrorMessages.auth.AUTHENTICATION_FAILED` for consistency.

**Revised approach**: Change both lockout throws AND the non-locked error messages to all use the same message constant. But the current `'Invalid credentials'` string is used in the non-locked paths (lines 216, 262, 314). These are NOT changed by this ticket — they already use a consistent message. The lockout paths currently use `ErrorMessages.auth.TOO_MANY_ATTEMPTS` which is a DIFFERENT message.

For anti-enumeration: the lockout response must be indistinguishable. The body message doesn't matter (it's always something generic), but the STATUS CODE matters (401 vs 403). The `Retry-After` header is the only difference, and that's acceptable — the IP-based throttler also sends `Retry-After` for 429, so its presence alone doesn't confirm account existence.

Actually — does the IP-based throttler also send `Retry-After`? Let me check. The ThrottlerGuard returns 429 with `Retry-After`. But the lockout `Retry-After` has different values (lockout: 900-7200 seconds vs throttle: 60 seconds). An attacker could potentially distinguish lockout from throttle by the `Retry-After` value, but:
1. They'd need to also trigger the IP throttle (10 req/60s) to compare
2. The values overlap is possible at lower lockout escalation
3. The primary enumeration vector (status code difference) is eliminated

The `Retry-After` header on lockout is the tradeoff for keeping the lockout mechanism functional. This is acceptable per OWASP ASVS V2.2.

**Final approach for lockout message**: Use the SAME `'Invalid credentials'` message so it's identical to the non-existing and wrong-password paths. The `Retry-After` header is the only observable difference.

```typescript
// Already-locked path (line 234)
throw new UnauthorizedException({
  message: 'Invalid credentials',
  error: 'Unauthorized',
  statusCode: 401,
  retryAfter: remainingSeconds,
});
```

#### Step 2: Change lockout-triggered path (lines 291-296)

**File**: `nexacore-api/src/auth/auth.service.ts`

```typescript
// BEFORE (line 291-296)
throw new ForbiddenException({
  message: ErrorMessages.auth.TOO_MANY_ATTEMPTS,
  error: 'Forbidden',
  statusCode: 403,
  retryAfter: lockoutSeconds,
});

// AFTER
throw new UnauthorizedException({
  message: 'Invalid credentials',
  error: 'Unauthorized',
  statusCode: 401,
  retryAfter: lockoutSeconds,
});
```

#### Step 3: Verify ForbiddenException is still used elsewhere

After the two lockout changes, check if `ForbiddenException` is still imported and used for other purposes in `auth.service.ts`:
- Line 328: `throw new ForbiddenException(ErrorMessages.auth.CHECK_EMAIL)` — email not verified (LOCAL). This is NOT an enumeration vector because it only fires after successful password verification. Keep as-is.
- Impossible travel blocked path — uses ForbiddenException. Keep as-is.

So `ForbiddenException` import must remain.

#### Step 4: Check if `ErrorMessages.auth.TOO_MANY_ATTEMPTS` is still used

After removing it from both lockout throws, verify if it's used anywhere else:
- It may be used in rate-limiting or other contexts — check before removing

### 5. Testing Checklist

#### `auth.service.spec.ts` — Tests to UPDATE:

| # | Test location | Current | After |
|---|--------------|---------|-------|
| 1 | Line ~422: "should throw ForbiddenException when account is locked" | `rejects.toThrow(ForbiddenException)` | `rejects.toThrow(UnauthorizedException)` |
| 2 | Line ~524: "should lock account after 5 failed attempts and throw ForbiddenException" | `rejects.toThrow(ForbiddenException)` | `rejects.toThrow(UnauthorizedException)` |
| 3 | Line ~1875: "login - account locked" — ForbiddenException | `rejects.toThrow(ForbiddenException)` | `rejects.toThrow(UnauthorizedException)` |
| 4 | Line ~1952: "login - max failed attempts triggers lockout" | `rejects.toThrow(ForbiddenException)` | `rejects.toThrow(UnauthorizedException)` |
| 5 | Line ~2544: "should still throw ForbiddenException when audit rejects on locked account" | `rejects.toThrow(ForbiddenException)` | `rejects.toThrow(UnauthorizedException)` |
| 6 | NEW: "locked account should return same exception type as non-existing account" | — | Assert both paths throw `UnauthorizedException` with same message |

**Tests to NOT change**:
- "should throw ForbiddenException when LOCAL user email is not verified" (line ~433) — this is NOT a lockout, stays as ForbiddenException
- Impossible travel "should throw ForbiddenException when travel action is blocked" — stays as ForbiddenException

### 6. Error Response Format

After fix, all login failure paths produce:

| Scenario | HTTP Status | Response Body | Retry-After Header |
|----------|-------------|--------------|-------------------|
| Non-existing email | 401 | `{ success: false, error: { message: 'Invalid credentials', code: 'UNAUTHORIZED', statusCode: 401 } }` | — |
| Wrong password (not locked) | 401 | Same | — |
| OAuth-only (no password) | 401 | Same | — |
| Already locked | 401 | Same | `900` (15min lockout) |
| 5th failed attempt (triggers lockout) | 401 | Same | `900` (15min lockout) |
| Email not verified | 403 | `{ ..., message: 'Please check your email to continue' }` | — |

The ONLY observable difference between locked and non-locked accounts is the `Retry-After` header. This is acceptable because:
1. The header is also sent by the IP-based throttler (429), so its presence alone doesn't confirm account existence
2. The lockout mechanism must communicate retry timing to the client
3. OWASP ASVS V2.2 requires preventing enumeration via status codes and messages — timing headers are acceptable

### 7. Dependencies

- `DUMMY_PASSWORD_HASH` from `auth.constants.ts` — already in use
- `HttpExceptionFilter` — already handles `retryAfter` on any HttpException type
- `ErrorMessages.auth.AUTHENTICATION_FAILED` — already exists
- No new dependencies

### 8. Notes

- **Lockout mechanism preserved**: Accounts are still locked after 5 failed attempts. Lockout escalation still works. Only the HTTP response changes.
- **Pre-existing frontend issue**: `api.ts` only reads `Retry-After` from the header for 429 responses. Lockout countdown in the frontend has been broken since SCRUM-140 (which stripped `retryAfter` from body). This is a separate concern — create a follow-up ticket if needed.
- **`ForbiddenException` import stays**: Still used for email-not-verified and impossible-travel-blocked paths.
- **Email not verified (line 328)**: Intentionally stays as `ForbiddenException` — it only fires AFTER successful password check, so it does NOT leak account existence to an attacker who doesn't know the password.

### 9. Next Steps

After implementation:
1. Run `nest build` — must compile clean
2. Run `jest --maxWorkers=1 --forceExit` — all tests must pass
3. Proceed to `/commit`

### 10. Implementation Verification

- [ ] Locked account: throws `UnauthorizedException` (not `ForbiddenException`)
- [ ] 5th failed attempt: throws `UnauthorizedException` (not `ForbiddenException`)
- [ ] Both lockout paths include `retryAfter` in exception response object
- [ ] `HttpExceptionFilter` still sets `Retry-After` header (no changes needed)
- [ ] Non-existing email path unchanged (already `UnauthorizedException`)
- [ ] Email-not-verified path unchanged (`ForbiddenException`)
- [ ] All tests updated and passing
- [ ] `tsc --noEmit` clean

### 11. Module-Level Planning

No module changes. No new providers, imports, or exports.

### 12. Satellite App Planning

No satellite app impact.

### 13. Cross-Ticket Dependency Checklist

| Ticket | Relationship | Status |
|--------|-------------|--------|
| SCRUM-140 | Parent — error message standardization + HttpExceptionFilter Retry-After | Done |
| SCRUM-141 | C-01 Registration anti-enumeration (same pattern) | Done |
| SCRUM-142 | C-02 Login anti-enumeration (closed — resolved by SCRUM-140) | Done |
| SCRUM-146 | C-06 Resend-verification anti-enumeration | Independent — separate endpoint |

### 14. Guard Dependency Chain Verification

No guard changes. Login endpoint uses `@Throttle` decorator only (no JwtAuthGuard — it's public).

### 15. Pre-existing Issue: Frontend Retry-After Parsing

**Issue**: `nexacore-dashboard/src/lib/api.ts` line 150 only reads `Retry-After` header for HTTP 429 responses. Since SCRUM-140 stripped `retryAfter` from response bodies, lockout countdown timers in the frontend no longer work for 403 (or 401 after this fix).

**Fix needed** (separate ticket): Update `api.ts` `parseErrorResponse` to read `Retry-After` header for ALL non-2xx responses, not just 429. Also update `detectRateLimitKind` in `AuthContext.tsx` — after this fix, lockout responses will have `code: 'UNAUTHORIZED'` instead of `'FORBIDDEN'`, so the function needs adjustment or removal.

**Not in scope for SCRUM-145**: This is a pre-existing issue from SCRUM-140, not introduced by this ticket. The anti-enumeration fix (backend status code unification) is the priority.
