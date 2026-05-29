# SCRUM-146: Forgot-Password Timing Anti-Enumeration — Backend Plan

- **Ticket**: SCRUM-146
- **Scope**: backend
- **Sprint**: 5 — Security Hardening
- **Priority**: CRITICAL (C-06)
- **Security references**: CWE-203, OWASP ASVS V2.1.1, NIST SP 800-63B §5.1.1.1

---

### 1. Codebase State Snapshot

- **Date**: 2026-03-08
- **Last completed ticket**: SCRUM-145 (Login Lockout Anti-Enumeration — Sprint 5)
- **Integration state verified**: Yes
- **Branch**: main (clean)

**Files verified**:

| File | Key observations |
|------|------------------|
| `auth.service.ts:1039-1087` | `forgotPassword()`: 3 paths — (1) user not found → early return (~5ms), (2) OAuth-only → early return (~5ms), (3) existing LOCAL user → updateMany + create + sendPasswordResetEmail (~110-2000ms). Paths 1 & 2 return immediately without any computational work. |
| `auth.service.ts:109-122` | Constructor: 12 deps (usersService, sessionsService, jwtService, oauthCodeStore, auditService, passwordBreachService, prisma, mailService, trustedDeviceService, impossibleTravelService, suspiciousLoginService, tokenDenyListService) |
| `auth.service.ts:1-40` | Imports: bcrypt, crypto, DUMMY_PASSWORD_HASH already imported (line 39). bcrypt.compare already used in register() anti-enumeration (SCRUM-141). |
| `auth.service.ts:136-164` | `register()` anti-enumeration pattern: `await bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH)` for existing-email path. Established pattern to follow. |
| `auth.controller.ts:373-388` | `forgotPassword()`: `@Post('forgot-password')`, `@HttpCode(HttpStatus.OK)`, `@SkipCsrf()`, `@Throttle({ global: { ttl: 900000, limit: 3 } })`. Returns `{ message: 'If an account exists, a reset email has been sent' }`. No changes needed. |
| `auth.constants.ts:17-20` | `DUMMY_PASSWORD_HASH = bcrypt.hashSync('dummy-password-for-timing-protection', BCRYPT_ROUNDS)` — pre-computed, available for use. |
| `error-messages.ts` | No relevant constant for forgot-password generic message — controller hardcodes the string. |
| `auth.service.spec.ts:1230-1279` | 3 forgotPassword tests: "return silently when user not found", "return silently for OAuth-only accounts", "invalidate existing tokens and create new reset token". |
| `auth.service.spec.ts:1770-1781` | Resilience test: "forgotPassword should succeed even when mail/audit fails". |

### 2. Overview

The `POST /auth/forgot-password` endpoint returns an identical HTTP 200 response with the same generic message for all email addresses. However, the response *time* differs: non-existing and OAuth-only emails return in ~5ms, while existing LOCAL accounts take ~110-2000ms (DB writes + email sending). An attacker can use statistical timing analysis to confirm email existence.

**Fix**: Add `bcrypt.compare(dto.email, DUMMY_PASSWORD_HASH)` to both early-return paths (non-existing and OAuth-only). This adds ~250ms of CPU work, making the fast paths (~255ms) harder to distinguish from the slow path (~110-2000ms). Combined with the strict throttle (3 req/15min), timing enumeration becomes impractical.

**Why bcrypt.compare is sufficient** (not fire-and-forget):
1. The throttle limits attacker to 12 samples/hour — insufficient for statistical significance
2. Email sending has inherently high variance (50ms-2000ms network I/O)
3. The 250ms bcrypt noise on fast paths puts them within the variance band of the slow path
4. OWASP ASVS V2.1.1 requires making enumeration *impractical*, not impossible
5. This matches the established anti-enumeration pattern from SCRUM-141 (register)

**Secondary fix**: Remove `logger.log` calls that embed raw email addresses in log output (CWE-532: Insertion of Sensitive Information into Log File). Replace with sanitized messages.

### 3. Architecture Context

- **Module**: AuthModule
- **Affected service**: AuthService.forgotPassword() — two early-return paths gain bcrypt.compare timing protection
- **No new modules/guards/DI changes**
- **No controller changes** — response format already correct
- **No new dependencies** — bcrypt and DUMMY_PASSWORD_HASH already imported

### 4. Implementation Steps

#### Step 1: Add bcrypt.compare timing protection to non-existing email path (line 1043-1048)

**File**: `nexacore-api/src/auth/auth.service.ts`

```typescript
// BEFORE (lines 1042-1048)
// Always return success to prevent email enumeration
if (!user) {
  this.logger.log(
    `Forgot password requested for non-existent email: ${dto.email}`,
  );
  return;
}

// AFTER
if (!user) {
  // CWE-203: timing protection — match CPU cost of existing-email path
  await bcrypt.compare(dto.email, DUMMY_PASSWORD_HASH);
  return;
}
```

**Key changes**:
- Added `await bcrypt.compare(dto.email, DUMMY_PASSWORD_HASH)` — adds ~250ms of CPU work to normalize response timing
- Uses `dto.email` as the first argument (arbitrary string, result is ignored — only CPU time matters)
- Removed `logger.log` that leaked the email address in plaintext (CWE-532)

#### Step 2: Add bcrypt.compare timing protection to OAuth-only path (line 1050-1056)

**File**: `nexacore-api/src/auth/auth.service.ts`

```typescript
// BEFORE (lines 1050-1056)
// OAuth-only accounts cannot reset password
if (!user.passwordHash && user.provider !== 'LOCAL') {
  this.logger.log(
    `Forgot password requested for OAuth account: ${dto.email}`,
  );
  return;
}

// AFTER
if (!user.passwordHash && user.provider !== 'LOCAL') {
  // CWE-203: timing protection — match CPU cost of LOCAL-email path
  await bcrypt.compare(dto.email, DUMMY_PASSWORD_HASH);
  return;
}
```

**Key changes**:
- Same bcrypt.compare timing protection as Step 1
- Removed `logger.log` that leaked the email address (CWE-532)

#### Step 3: Update existing tests

**File**: `nexacore-api/src/auth/tests/auth.service.spec.ts`

**Test 1** (line ~1237): "should return silently when user not found (prevent enumeration)"
- Add assertion: `expect(bcrypt.compare).toHaveBeenCalledWith('nonexistent@example.com', expect.anything())`
- The test already mocks bcrypt via `jest.mock('bcrypt')`. `DUMMY_PASSWORD_HASH` is `undefined` in test env (computed at import time with mocked bcrypt.hashSync), so assert `expect.anything()` for the second argument (same lesson from SCRUM-141).

**Test 2** (line ~1245): "should return silently for OAuth-only accounts"
- Add assertion: `expect(bcrypt.compare).toHaveBeenCalledWith('test@example.com', expect.anything())`

**Test 3** (line ~1259): "should invalidate existing tokens and create new reset token"
- No changes needed — this test covers the existing-email path which doesn't get bcrypt.compare.

**Test 4** (line ~1770): "forgotPassword should succeed even when mail/audit fails"
- No changes needed — this test covers the existing-email path.

#### Step 4: Add new anti-enumeration test

**File**: `nexacore-api/src/auth/tests/auth.service.spec.ts`

Add inside the `forgotPassword` describe block:

```typescript
it('should call bcrypt.compare for timing protection on non-existing email', async () => {
  usersService.findByEmail.mockResolvedValue(null);
  (bcrypt.compare as jest.Mock).mockResolvedValue(false);

  await authService.forgotPassword({ email: 'unknown@example.com' });

  expect(bcrypt.compare).toHaveBeenCalled();
  // Verify bcrypt.compare was called with the submitted email
  expect((bcrypt.compare as jest.Mock).mock.calls[0][0]).toBe('unknown@example.com');
});
```

And a parity test:

```typescript
it('non-existing and OAuth-only paths should both call bcrypt.compare', async () => {
  // Non-existing email
  usersService.findByEmail.mockResolvedValue(null);
  (bcrypt.compare as jest.Mock).mockResolvedValue(false);
  await authService.forgotPassword({ email: 'nobody@example.com' });
  expect(bcrypt.compare).toHaveBeenCalled();

  (bcrypt.compare as jest.Mock).mockClear();

  // OAuth-only account
  usersService.findByEmail.mockResolvedValue({
    ...mockUser,
    passwordHash: null,
    provider: Provider.GOOGLE,
  });
  await authService.forgotPassword({ email: 'oauth@example.com' });
  expect(bcrypt.compare).toHaveBeenCalled();
});
```

### 5. Testing Checklist

#### `auth.service.spec.ts` — Tests to UPDATE:

| # | Test | Change |
|---|------|--------|
| 1 | "should return silently when user not found" (line ~1237) | Add `bcrypt.compare` assertion |
| 2 | "should return silently for OAuth-only accounts" (line ~1245) | Add `bcrypt.compare` assertion |

#### `auth.service.spec.ts` — Tests to ADD:

| # | Test | Purpose |
|---|------|---------|
| 1 | "should call bcrypt.compare for timing protection on non-existing email" | Verifies bcrypt.compare is called with the submitted email |
| 2 | "non-existing and OAuth-only paths should both call bcrypt.compare" | Parity test — both early-return paths get timing protection |

#### Tests UNCHANGED:

| Test | Reason |
|------|--------|
| "should invalidate existing tokens and create new reset token" (line ~1259) | Existing-email path unchanged |
| "forgotPassword should succeed even when mail/audit fails" (line ~1770) | Resilience test unchanged |

### 6. Error Response Format

No change. All paths already return HTTP 200 with `{ message: "If an account exists, a reset email has been sent" }` from the controller.

| Scenario | HTTP Status | Response Body | Timing (before) | Timing (after) |
|----------|-------------|---------------|-----------------|----------------|
| Non-existing email | 200 | `{ message: "If an account exists, a reset email has been sent" }` | ~5ms | ~255ms |
| OAuth-only account | 200 | Same | ~5ms | ~255ms |
| Existing LOCAL account | 200 | Same | ~110-2000ms | ~110-2000ms (unchanged) |

### 7. Dependencies

- `bcrypt.compare` — already imported and used in auth.service.ts
- `DUMMY_PASSWORD_HASH` — already imported from auth.constants.ts
- No new dependencies

### 8. Notes

- **logger.log removal**: The two logger.log calls that embed raw email addresses (lines 1044-1046, 1052-1054) are removed entirely. They represent CWE-532 (sensitive info in logs). No replacement logging is needed — the method returns void and the controller always returns the same message.
- **DUMMY_PASSWORD_HASH in tests**: `jest.mock('bcrypt')` fully mocks bcrypt, so `bcrypt.hashSync()` at import time returns `undefined`, making `DUMMY_PASSWORD_HASH` undefined in tests. Use `expect.anything()` or `mock.calls[0]` access pattern (lesson from SCRUM-141).
- **bcrypt.compare result is ignored**: The return value (`true`/`false`) doesn't matter — only the CPU time (~250ms) matters for timing normalization.
- **Throttle is the primary defense**: 3 req/15min means 12 samples/hour. Combined with email sending variance and bcrypt noise, timing enumeration is impractical.

### 9. Next Steps

After implementation:
1. Run `nest build` — must compile clean
2. Run `jest --maxWorkers=1 --forceExit` — all tests must pass
3. Proceed to `/commit`

### 10. Implementation Verification

- [ ] Non-existing email path: calls `bcrypt.compare` before returning
- [ ] OAuth-only path: calls `bcrypt.compare` before returning
- [ ] Both logger.log calls with raw emails removed
- [ ] Existing LOCAL path unchanged (token creation + email sending preserved)
- [ ] All 4 existing forgotPassword tests pass
- [ ] 2 new anti-enumeration tests added and passing
- [ ] `nest build` compiles clean

### 11. Module-Level Planning

No module changes. No new providers, imports, or exports.

### 12. Satellite App Planning

No satellite app impact.

### 13. Cross-Ticket Dependency Checklist

| Ticket | Relationship | Status |
|--------|-------------|--------|
| SCRUM-140 | Parent — error message standardization | Done |
| SCRUM-141 | C-01 Registration anti-enumeration (same bcrypt.compare pattern) | Done |
| SCRUM-145 | C-05 Login lockout anti-enumeration | Done |
| SCRUM-143 | C-03 Passkey registration anti-enumeration | Independent |
| SCRUM-144 | C-04 Passkey login anti-enumeration | Independent |

### 14. Guard Dependency Chain Verification

No guard changes. `POST /auth/forgot-password` uses `@Throttle` decorator only (no JwtAuthGuard — it's public).

### 15. Implementation Order

1. Step 1: Add bcrypt.compare to non-existing email path + remove logger.log
2. Step 2: Add bcrypt.compare to OAuth-only path + remove logger.log
3. Step 3: Update 2 existing tests with bcrypt.compare assertions
4. Step 4: Add 2 new anti-enumeration tests
5. Run `nest build` + `jest --maxWorkers=1 --forceExit`
