# Backend Implementation Plan: SCRUM-255 — Decompose 3 Functions >75 Lines

## 1. Header

- **Ticket**: SCRUM-255
- **Type**: Refactoring (no behavioral changes)
- **Severity**: MEDIUM
- **Sprint**: 11 (Security II)
- **Parent**: SCRUM-253

## 2. Codebase State Snapshot

- **Date**: 2026-03-16
- **Last completed ticket**: SCRUM-254 (guard chain table docs)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/auth/passkey.service.ts` — `verifyAuthentication()` at lines 218-314 (97 lines). Already has `failPasskeyAuth()` private helper at line 406.
  - `nexacore-api/src/auth/token.service.ts` — `refreshTokens()` at lines 119-202 (84 lines). Uses `createAuditLogger` factory (line 65). Has `buildRefreshCookie()` private helper.
  - `nexacore-api/src/auth/email-verification.service.ts` — `verifyEmailChange()` at lines 81-169 (89 lines). Has no private helpers yet.
- **Constructor signatures verified**:
  - `PasskeyService(redis, prisma, configService, auditService)` — 4 DI deps
  - `TokenService(jwtService, prisma, usersService, sessionsService, configService, auditService, loginSecurityService)` — 7 DI deps
  - `EmailVerificationService(prisma, usersService, mailService, auditService, sessionsService)` — 5 DI deps
- **Discrepancies with integration-state.md**: None (just updated by SCRUM-254)

## 3. Overview

Pure refactoring to decompose 3 functions exceeding the 75-line CWE-1121 threshold. Each function will have sequential blocks extracted into private helper methods within the same class. No behavioral changes, no new DI deps, no module/guard/API changes. All 919 existing tests must continue to pass unchanged.

## 4. Architecture Context

- **Files affected**: 3 service files (no new files)
- **Pattern**: Extract private helper methods within same class
- **No module, guard, DI, API, or schema changes**

## 5. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: `git checkout main && git pull origin main && git checkout -b feature/SCRUM-255-backend`

### Step 1: Decompose `verifyAuthentication()` in passkey.service.ts

- **File**: `nexacore-api/src/auth/passkey.service.ts`
- **Current**: 97 lines (218-314)
- **Target**: ≤55 lines in main method
- **Action**: Extract 2 private helpers:

#### 1a. `private async retrieveAndDeleteChallenge(challengeId: string)`
- **Lines to extract**: 223-231 (Redis get, expiry check, delete, JSON parse, cast)
- **Returns**: `{ expectedOptions, authResponse }` or throws UnauthorizedException
- **Signature**:
  ```typescript
  private async retrieveAndDeleteChallenge(
    challengeId: string,
    credential: Record<string, unknown>,
  ): Promise<{ expectedOptions: PublicKeyCredentialRequestOptionsJSON; authResponse: AuthenticationResponseJSON }>
  ```

#### 1b. `private async verifyAndUpdateCredential(storedCredential, verification)`
- **Lines to extract**: 281-311 (sign count replay check, DB update, audit log)
- **Returns**: void (or calls failPasskeyAuth on replay)
- **Signature**:
  ```typescript
  private async verifySignCountAndUpdate(
    storedCredential: WebAuthnCredentialWithUser,
    newSignCount: number,
    ctx?: { ipAddress: string; userAgent: string | null },
  ): Promise<void>
  ```

**Resulting main method structure** (~45 lines):
```
1. retrieveAndDeleteChallenge()          // extracted
2. DB lookup credential                  // 4 lines
3. Validate credential exists            // 3 lines
4. Validate user active                  // 6 lines
5. verifyAuthenticationResponse()        // ~20 lines (try/catch + verified check)
6. verifySignCountAndUpdate()            // extracted
7. return userId                         // 1 line
```

### Step 2: Decompose `refreshTokens()` in token.service.ts

- **File**: `nexacore-api/src/auth/token.service.ts`
- **Current**: 84 lines (119-202)
- **Target**: ≤55 lines in main method
- **Action**: Extract 2 private helpers:

#### 2a. `private async validateAndResolveSession(payload, ctx)`
- **Lines to extract**: 136-152 (session lookup, idle check, revocation + audit)
- **Returns**: void (throws on idle timeout)
- **Signature**:
  ```typescript
  private async validateSessionNotIdle(
    payload: RefreshTokenPayload,
    ctx?: RequestContext,
  ): Promise<void>
  ```

#### 2b. `private signTokenPair(user, newSessionId, family)`
- **Lines to extract**: 168-187 (sign access token + sign refresh token)
- **Returns**: `{ accessToken, refreshToken }`
- **Signature**:
  ```typescript
  private signTokenPair(
    user: { id: string; email: string; role: string },
    newSessionId: string,
    family: string,
  ): { accessToken: string; refreshToken: string }
  ```

**Resulting main method structure** (~50 lines):
```
1. JWT verify                            // 6 lines
2. User lookup                           // 4 lines
3. validateSessionNotIdle()              // extracted
4. Prepare rotation params               // 3 lines
5. rotateRefreshToken()                  // 8 lines (already delegated)
6. signTokenPair()                       // extracted
7. Hash + store                          // 5 lines
8. Audit + return                        // 6 lines
```

### Step 3: Decompose `verifyEmailChange()` in email-verification.service.ts

- **File**: `nexacore-api/src/auth/email-verification.service.ts`
- **Current**: 89 lines (81-169)
- **Target**: ≤55 lines in main method
- **Action**: Extract 2 private helpers:

#### 3a. `private async validateEmailChangeToken(token)`
- **Lines to extract**: 85-121 (hash, DB lookup, type guard, used check, expiry check, pendingEmail check, race condition check)
- **Returns**: `{ verificationToken, user, newEmail, oldEmail }` or `{ status: 'invalid' }`
- **Signature**:
  ```typescript
  private async validateEmailChangeToken(
    token: string,
  ): Promise<
    | { valid: true; verificationToken: EmailVerificationToken & { user: User }; oldEmail: string; newEmail: string }
    | { valid: false }
  >
  ```

#### 3b. `private async executeEmailSwapTransaction(userId, newEmail, tokenId, hasOAuth)`
- **Lines to extract**: 131-147 (Prisma $transaction with user update, token mark used, conditional OAuth delete)
- **Returns**: void
- **Signature**:
  ```typescript
  private async executeEmailSwap(
    userId: string,
    newEmail: string,
    tokenId: string,
  ): Promise<void>
  ```

**Resulting main method structure** (~35 lines):
```
1. validateEmailChangeToken()            // extracted
2. Check valid, return invalid if not    // 3 lines
3. Check OAuth accounts                  // 3 lines
4. executeEmailSwap()                    // extracted
5. Revoke sessions                       // 1 line
6. Send confirmation email               // 3 lines
7. Audit log                             // 8 lines
8. Return success                        // 1 line
```

### Step 4: Run Tests

- **Action**: `cd nexacore-api && npx jest --maxWorkers=1 --forceExit`
- **Expected**: 919 tests, 65 suites, all passing
- **No test file changes needed** — helpers are private, public API unchanged

### Step 5: Build Verification

- **Action**: `cd nexacore-api && npx nest build`
- **Expected**: Clean compilation, no type errors

## 6. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Decompose `verifyAuthentication()` in passkey.service.ts
3. Step 2: Decompose `refreshTokens()` in token.service.ts
4. Step 3: Decompose `verifyEmailChange()` in email-verification.service.ts
5. Step 4: Run tests (all 919 must pass)
6. Step 5: Build verification

## 7. Testing Checklist

- [ ] All 919 existing tests pass (no test changes needed)
- [ ] 65 test suites pass
- [ ] `nest build` compiles clean
- [ ] No behavioral changes (same inputs → same outputs)
- [ ] All 3 target functions ≤75 lines
- [ ] No new `any` types introduced
- [ ] No new files created (helpers are private methods in same class)

## 8. Error Response Format

N/A — no API changes. All error responses remain identical.

## 9. Dependencies

None — no new packages required.

## 10. Notes

- **Pure refactoring**: Extract-method pattern only. No logic changes, no new behavior.
- **Private helpers**: All extracted methods are `private` within the same class. No visibility changes to public API.
- **No test changes**: Since public method signatures don't change, all existing tests remain valid.
- **Previous SM-03 (SCRUM-245)**: Fixed different functions (login/handleSuccess/handleFailed). This ticket addresses the 3 newly-identified long functions.
- **Threshold**: CWE-1121 / ESLint max-lines-per-function is 50 lines (FAIL at 75). Target each function at ≤55 lines for comfortable margin.

## 11. Next Steps After Implementation

- `/verify SCRUM-255` to confirm all functions ≤75 lines and tests pass
- `/commit SCRUM-255` to commit, push, and merge
- Re-audit Phase 10 (Code Quality) should show SM-03 as PASS

## 12. Implementation Verification

- [ ] `verifyAuthentication()` ≤75 lines (target ~45)
- [ ] `refreshTokens()` ≤75 lines (target ~50)
- [ ] `verifyEmailChange()` ≤75 lines (target ~35)
- [ ] All helper methods are private
- [ ] 919 tests pass, 65 suites
- [ ] `nest build` clean
- [ ] No module/guard/DI/schema changes

---
*Plan created: 2026-03-16 | Ticket: SCRUM-255 | Scope: backend (refactoring)*
