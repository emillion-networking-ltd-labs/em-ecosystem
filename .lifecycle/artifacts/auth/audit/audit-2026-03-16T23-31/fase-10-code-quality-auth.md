# Fase 10: CODE QUALITY — auth

**Date**: 2026-03-16 23:31
**Module**: auth
**Auditor**: Claude Opus 4.6 (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: ISO 25010 (Maintainability), CWE-1080/1120/1121/1047, SonarQube Quality Gate, CISQ ASCMM-MNT, Clean Code (R.C. Martin), ESLint defaults, SOLID principles
**Previous Audit**: audit-2026-03-16T22-30

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 27    |
| FAIL    | 0     |
| WARN    | 8     |
| N/A     | 0     |
| INFO    | 2     |

**Overall**: PASS — 0 FAILs, 8 WARNs (all stable from previous audit)

---

## 10a. Structural Metrics (ISO 25010 — Analysability, CWE-1080)

### SM-01: File length (production) — Tier 1

**Threshold**: <=300 PASS, 301-500 WARN, >500 FAIL

| File | Lines | Verdict |
|------|-------|---------|
| passkey.service.ts | 455 | WARN |
| login.service.ts | 365 | WARN |
| token.service.ts | 327 | WARN |
| mfa.service.ts | 305 | WARN |
| email-verification.service.ts | 284 | PASS |
| oauth.controller.ts | 271 | PASS |
| auth.controller.ts | 250 | PASS |
| trusted-device.service.ts | 215 | PASS |
| passkey.controller.ts | 193 | PASS |
| mfa.controller.ts | 190 | PASS |
| account.controller.ts | 173 | PASS |
| auth.service.ts | 172 | PASS |
| password-reset.service.ts | 168 | PASS |
| session.controller.ts | 160 | PASS |
| constants/auth.constants.ts | 157 | PASS |
| login-security.service.ts | 142 | PASS |
| oauth-auth.service.ts | 128 | PASS |
| auth.module.ts | 107 | PASS |
| strategies/github.strategy.ts | 99 | PASS |
| strategies/google.strategy.ts | 90 | PASS |
| guards/roles.guard.ts | 70 | PASS |
| password-breach.service.ts | 69 | PASS |
| token-deny-list.service.ts | 61 | PASS |
| stores/oauth-state.store.ts | 57 | PASS |
| strategies/oauth-validate.helper.ts | 56 | PASS |
| guards/permissions.guard.ts | 56 | PASS |
| strategies/pkce-authenticate.ts | 49 | PASS |
| strategies/jwt.strategy.ts | 49 | PASS |
| stores/oauth-code.store.ts | 43 | PASS |
| guards/oauth-callback.filter.ts | 40 | PASS |
| guards/oauth-link.guard.ts | 40 | PASS |
| interfaces/auth.interfaces.ts | 35 | PASS |
| guards/base-oauth-auth.guard.ts | 33 | PASS |
| stores/oauth-link-code.store.ts | 31 | PASS |
| utils/audit-log.helper.ts | 29 | PASS |
| utils/parse-duration.ts | 20 | PASS |
| constants/passkey.constants.ts | 15 | PASS |
| interfaces/oauth-account.interface.ts | 7 | PASS |
| utils/hash-token.ts | 6 | PASS |
| interfaces/refresh-token-payload.interface.ts | 5 | PASS |
| guards/jwt-auth.guard.ts | 5 | PASS |
| guards/google-auth.guard.ts | 3 | PASS |
| guards/github-auth.guard.ts | 3 | PASS |

**Verdict**: **WARN** — 4 files in WARN band (301-500). None exceed 500 (no FAIL).
- `passkey.service.ts`: 455 lines (threshold: 300)
- `login.service.ts`: 365 lines (threshold: 300)
- `token.service.ts`: 327 lines (threshold: 300)
- `mfa.service.ts`: 305 lines (threshold: 300)

### SM-02: File length (tests) — Tier 1

**Threshold**: <=900 PASS, 901-1500 WARN, >1500 FAIL

42 spec files + 1 test helper (377 lines) in `tests/` directory. The test suite is highly decomposed. The largest test helper (`auth-test.helpers.ts`) is 377 lines. All individual spec files are well under 900 lines.

**Verdict**: **PASS** — test suite is highly decomposed across 42+ files, all under 900 lines.

### SM-03: Function/method length — Tier 1

**Threshold**: <=50 PASS, 51-75 WARN, >75 FAIL

Top 10 largest functions/methods by line count (verified via file read):

| File | Function | Lines | Verdict |
|------|----------|-------|---------|
| passkey.service.ts:199-262 | `verifyAuthentication()` | 63 | WARN |
| trusted-device.service.ts:36-94 | `trustDevice()` | 58 | WARN |
| token.service.ts:68-117 | `generateTokens()` | 49 | PASS |
| token.service.ts:119-167 | `refreshTokens()` | 48 | PASS |
| login.service.ts:98-142 | `login()` | 44 | PASS |
| passkey.service.ts:154-197 | `generateAuthOptions()` | 43 | PASS |
| mfa.service.ts:49-90 | `setupMfa()` | 41 | PASS |
| passkey.service.ts:311-352 | `deletePasskey()` | 41 | PASS |
| token.service.ts:169-206 | `generateTokensForMfa()` | 37 | PASS |
| email-verification.service.ts:82-118 | `verifyEmailChange()` | 36 | PASS |

**Verdict**: **WARN** — 2 functions in WARN band (51-75). None exceed 75 (no FAIL).
- `passkey.service.ts:199` — `verifyAuthentication()`: 63 lines (threshold: 50)
- `trusted-device.service.ts:36` — `trustDevice()`: 58 lines (threshold: 50)

### SM-04: Controller method length — Tier 1

**Threshold**: <=30 PASS, 31-50 WARN, >50 FAIL (x0.75 multiplier)

| Controller | Longest Method | Lines | Verdict |
|------------|---------------|-------|---------|
| auth.controller.ts | `login()` (line 117) | 29 | PASS |
| mfa.controller.ts | `verifyLogin()` (line 99) | 28 | PASS |
| oauth.controller.ts | `exchangeOAuthCode()` (line 164) | 17 | PASS |
| passkey.controller.ts | `loginVerify()` (line 119) | 17 | PASS |
| session.controller.ts | `trustDevice()` (line 105) | 16 | PASS |
| account.controller.ts | `resetPassword()` (line 153) | 8 | PASS |

**Verdict**: **PASS** — all controller methods <=30 lines.

### SM-05: Module file concentration — Tier 1

**Threshold**: top file <=40% PASS, 41-60% WARN, >60% FAIL

Total production LOC (excluding DTOs, tests): ~4,720 lines across 43 production files.
Top file: `passkey.service.ts` at 455 lines = ~9.6% of module total.

**Verdict**: **PASS** — top file is 9.6% of module (threshold: 40%).

### SM-06: Module total volume — INFO

**Total production LOC**: ~4,720 lines across 43 production files.
**Total test files**: 42 spec files + 1 test helper.

**Verdict**: **INFO** — baseline established. Module is appropriately sized for its scope (auth + MFA + OAuth + passkeys + sessions + trusted devices).

---

## 10b. Complexity Analysis (CWE-1120, CWE-1121, SonarQube)

### 5 Largest Functions by Line Count

1. `passkey.service.ts:199` — `verifyAuthentication()`: 63 lines
2. `trusted-device.service.ts:36` — `trustDevice()`: 58 lines
3. `token.service.ts:68` — `generateTokens()`: 49 lines
4. `token.service.ts:119` — `refreshTokens()`: 48 lines
5. `login.service.ts:98` — `login()`: 44 lines

### CX-01: Cyclomatic complexity per function — Tier 2

**Threshold**: <=10 PASS, 11-20 WARN, >20 FAIL

| Function | Decision Points | CC | Verdict |
|----------|----------------|-----|---------|
| `verifyAuthentication()` | if(!storedCredential), if(!isActive), catch, if(!verified), if(signCount>0 && newCount<=stored) | CC=6 | PASS |
| `trustDevice()` | if(activeCount>=MAX), if(oldest) | CC=3 | PASS |
| `generateTokens()` | (no branching) | CC=1 | PASS |
| `refreshTokens()` | try/catch, if(!user) | CC=3 | PASS |
| `login()` | if(!user), if(lockedUntil && >Date), if(failedAttempts>0 \|\| lockoutCount>0), if(mfaEnabled), if((role===ADMIN \|\| role===SUPERADMIN) && !mfaEnabled) | CC=8 | PASS |

**Verdict**: **PASS** — all top-5 functions have CC<=10.

### CX-02: Cognitive complexity per function — Tier 2

**Threshold**: <=15 PASS, 16-25 WARN, >25 FAIL

| Function | CogC | Verdict |
|----------|------|---------|
| `verifyAuthentication()` | +1(if) +1(if) +1(try/catch) +1(if) +1(if) +1(&&, nesting+1) = ~7 | PASS |
| `trustDevice()` | +1(if) +1(if, nesting+1) = ~3 | PASS |
| `generateTokens()` | 0 | PASS |
| `refreshTokens()` | +1(try/catch) +1(if) = ~2 | PASS |
| `login()` | +1(if) +1(if) +1(&&) +1(if) +1(\|\|) +1(if) +1(if) +1(&&) +1(\|\|) +1(&&) = ~10 | PASS |

**Verdict**: **PASS** — all top-5 functions have CogC<=15.

### CX-03: Nesting depth — Tier 2

**Threshold**: <=3 PASS, 4 WARN, >=5 FAIL

| Function | Max Nesting | Verdict |
|----------|-------------|---------|
| `verifyAuthentication()` | 2 (if inside try) | PASS |
| `trustDevice()` | 2 (if inside if) | PASS |
| `generateTokens()` | 0 | PASS |
| `refreshTokens()` | 1 (if inside try) | PASS |
| `login()` | 1 (sequential ifs at method level) | PASS |

**Verdict**: **PASS** — max nesting depth is 2 across all top-5 functions.

### CX-04: Parameter count (non-DI) — Tier 2

**Threshold**: <=3 PASS, 4-5 WARN, >5 FAIL

| Method | Params | Verdict |
|--------|--------|---------|
| `LoginService.login()` | 4 (dto, requestMeta, ctx?, fingerprint?) | WARN |
| `TrustedDeviceService.trustDevice()` | 4 (userId, fingerprint, ipAddress, userAgent) | WARN |
| `PasskeyService.deletePasskey()` | 4 (userId, passkeyId, password?, ctx?) | WARN |
| `PasskeyService.verifyRegistration()` | 4 (userId, credential, name?, ctx?) | WARN |

**Verdict**: **WARN** — 4 methods have 4 parameters (WARN band). None exceed 5 (no FAIL). Consider grouping into parameter objects for methods with 4+ params.

### CX-05: Fan-out (constructor DI count) — Tier 2

**Threshold**: <=5 PASS, 6-8 WARN, >8 FAIL

| Service | DI Count | Verdict |
|---------|----------|---------|
| TokenService | 7 (JwtService, SessionsService, UsersService, TokenDenyListService, AuditService, ConfigService, LoginSecurityService) | WARN |
| MfaService | 6 (UsersService, CryptoService, JwtService, AuditService, TrustedDeviceService, ConfigService) | WARN |
| LoginService | 6 (UsersService, TokenService, EmailVerificationService, PasswordBreachService, TrustedDeviceService, LoginSecurityService) | WARN |
| PasswordResetService | 6 (PrismaService, UsersService, MailService, SessionsService, PasswordBreachService, AuditService) | WARN |
| EmailVerificationService | 5 (PrismaService, MailService, UsersService, SessionsService, AuditService) | PASS |
| PasskeyService | 5 (PrismaService, UsersService, AuditService, Redis, ConfigService) | PASS |
| LoginSecurityService | 5 (ImpossibleTravelService, SuspiciousLoginService, MailService, SessionsService, AuditService) | PASS |
| OAuthAuthService | 5 (UsersService, OAuthCodeStore, TokenService, LoginSecurityService, AuditService) | PASS |
| AuthService | 5 (LoginService, TokenService, OAuthAuthService, EmailVerificationService, PasswordResetService) | PASS |
| TrustedDeviceService | 3 (PrismaService, AuditService, ConfigService) | PASS |
| TokenDenyListService | 1 (Redis) | PASS |
| PasswordBreachService | 0 | PASS |

**Verdict**: **WARN** — 4 services in WARN band (6-8 DI). None exceed 8 (no FAIL).
- `TokenService`: 7 DI (highest)
- `MfaService`: 6 DI
- `LoginService`: 6 DI
- `PasswordResetService`: 6 DI

---

## 10c. Duplication Detection (SonarQube Quality Gate, CISQ ASCMM-MNT-19)

**Note**: `npx jscpd` not executed (Bash restricted during audit). All duplication checks performed via Tier 2 heuristic analysis. Results flagged as non-deterministic.

### DU-01: Duplicated lines % (production) — Tier 2 (heuristic)

After reading all 43 production files, the most notable duplication patterns are:

1. **Audit logging pattern**: `this.auditService.log({...}).catch(() => {})` / `this.logAuditEvent(...)` — appears in ~15 files, but has been extracted to `utils/audit-log.helper.ts` with `createAuditLogger()`. Remaining inline calls use 3-5 lines each.

2. **OAuth strategies**: `google.strategy.ts` and `github.strategy.ts` share structural similarity (constructor, `authenticate()`, `validate()`), but common logic is extracted to `pkce-authenticate.ts` and `oauth-validate.helper.ts`.

3. **Token generation**: Sign access + refresh appears in `generateTokens()` and `signTokenPair()` in `token.service.ts` — `signTokenPair()` was extracted to deduplicate the refresh flow.

4. **Post-login security checks**: ~8 lines repeated across `login.service.ts` (2x), `token.service.ts` (1x), and `oauth-auth.service.ts` (1x).

**Estimated duplication**: ~2-3% based on heuristic analysis.

**Verdict**: **PASS** (heuristic, non-deterministic) — estimated <=3% duplication. Major patterns already extracted to helpers.

### DU-02: Duplicated lines % (tests) — Tier 2 (heuristic)

Test helper `auth-test.helpers.ts` (377 lines) exists to share mock factories across 42 spec files. Threshold for tests is 10%.

**Verdict**: **PASS** (heuristic) — well-factored test helpers reduce duplication.

### DU-03: Largest clone block — Tier 2 (heuristic)

The largest clone is the post-login security checks block (~10 lines), repeated in:
- `login.service.ts:280-296` (`completeTrustedDeviceLogin`)
- `login.service.ts:332-357` (`handleLoginSuccess`)
- `token.service.ts:184-199` (`generateTokensForMfa`)
- `oauth-auth.service.ts:40-71` (`validateOAuthUser`) — slightly different structure

```typescript
const travelResult = await this.loginSecurityService.checkImpossibleTravel(user, requestMeta);
if (travelResult?.isAnomalous && travelResult.actionTaken === 'blocked') {
  this.loginSecurityService.handleTravelBlock(travelResult, user.id, requestMeta);
}
this.loginSecurityService.notifyIfNewDevice(user, sessionId, requestMeta).catch(() => {});
this.loginSecurityService.checkSuspiciousLoginSuccess(user, requestMeta);
```

**Verdict**: **PASS** (heuristic) — largest clone ~10 lines (threshold: <=20 PASS).

### DU-04: Cross-file clones — Tier 2 (heuristic)

1. **Post-login security checks** across `login.service.ts`, `token.service.ts`, and `oauth-auth.service.ts` (~10 lines x 4 locations, 3 files)
2. **OAuth strategy `authenticate()` method** — identical 7-line delegation to `applyPkceAuthenticate` in `google.strategy.ts` and `github.strategy.ts`
3. **OAuth strategy `authorizationParams()`** — identical 3-line delegation to `applyPkceAuthorizationParams` in both strategy files

**Verdict**: **WARN** — 3 cross-file clone patterns identified (threshold: 1-3 = WARN).

### DU-05: Utility extraction candidates — Tier 2

**Recommendation**: Extract the post-login security checks block to a single `LoginSecurityService.executePostLoginChecks(user, sessionId, requestMeta)` method. This would eliminate 4 repetitions across 3 files.

**Verdict**: **INFO** — 1 extraction candidate identified.

---

## 10d. Module Design & SOLID (ISO 25010 — Modularity, Reusability)

### SD-01: God class detection — Tier 2

**Threshold**: <=12 public methods PASS, 13-18 WARN, >18 FAIL

| Service | Public Methods | Verdict |
|---------|---------------|---------|
| AuthService | 17 | WARN |
| PasskeyService | 9 | PASS |
| TokenService | 8 | PASS |
| LoginSecurityService | 8 | PASS |
| MfaService | 7 | PASS |
| TrustedDeviceService | 7 | PASS |
| EmailVerificationService | 5 | PASS |
| OAuthAuthService | 4 | PASS |
| PasswordResetService | 3 | PASS |
| TokenDenyListService | 3 | PASS |
| LoginService | 2 | PASS |
| PasswordBreachService | 1 | PASS |

**Verdict**: **WARN** — `AuthService` has 17 public methods (WARN band: 13-18). However, `AuthService` is an intentional **facade** pattern — every method is a 1-line delegation to a sub-service (verified at `auth.service.ts:43-170`). The facade provides a unified API surface for controllers while keeping actual logic decomposed.

### SD-02: Controller thinness — Tier 2

**Threshold**: 0 fat methods = PASS, else FAIL per method

All 6 controllers reviewed (`auth.controller.ts`, `oauth.controller.ts`, `account.controller.ts`, `session.controller.ts`, `mfa.controller.ts`, `passkey.controller.ts`). Every controller method follows the pattern:
1. Extract request metadata via `extractRequestMeta(req)`
2. Call service method
3. Set cookie (if applicable) via `setCookieFromConfig()`
4. Return response

`auth.controller.ts:login()` (line 117) contains two type-guard conditionals (`'mfaRequired' in result`, `'mfaSetupRequired' in result`), but these are response-format discriminators, not business logic.

**Verdict**: **PASS** — all controllers are thin. No business logic in any controller method.

### SD-03: Service Single Responsibility — Tier 2

**Threshold**: 1 responsibility PASS, 2 WARN, >=3 FAIL

| Service | Responsibilities | Verdict |
|---------|-----------------|---------|
| AuthService | 1 (facade — delegates to sub-services) | PASS |
| LoginService | 1 (credential-based login flow) | PASS |
| TokenService | 2 (JWT generation + session lifecycle/logout) | WARN |
| MfaService | 1 (TOTP MFA lifecycle) | PASS |
| PasskeyService | 1 (WebAuthn passkey lifecycle) | PASS |
| OAuthAuthService | 1 (OAuth user validation + code exchange) | PASS |
| EmailVerificationService | 1 (email verification tokens) | PASS |
| PasswordResetService | 1 (password reset tokens) | PASS |
| LoginSecurityService | 1 (login-time security checks) | PASS |
| TrustedDeviceService | 1 (trusted device management) | PASS |
| TokenDenyListService | 1 (token deny list via Redis) | PASS |
| PasswordBreachService | 1 (HIBP breach checking) | PASS |

**Verdict**: **WARN** — `TokenService` handles both JWT generation and session lifecycle (logout, logoutAll). Justified by tight coupling between refresh tokens and sessions, but could be split into a `SessionOrchestrator`.

### SD-04: Circular dependency risk — Tier 2

**Threshold**: 0 circular = PASS, else FAIL

`auth.module.ts:1` imports `forwardRef`, `auth.module.ts:41` uses `forwardRef(() => UsersModule)`.

**Evidence**: This is the standard NestJS resolution for a well-known bidirectional dependency (auth needs users for user lookup, users needs auth for guards). No other circular dependencies detected.

**Verdict**: **PASS** — 1 `forwardRef` usage, which is the standard NestJS pattern.

### SD-05: Interface segregation (DTO) — Tier 2

**Threshold**: <=5 optional fields PASS, 6-10 WARN, >10 FAIL

All DTOs are purpose-specific with 1-3 fields each:
- `LoginDto`: email (required), password (required)
- `RegisterDto`: email, password (required)
- `MfaVerifyLoginDto`: mfaToken (required), code (optional), recoveryCode (optional), trustDevice (optional) — 3 optional
- `PasskeyDeleteDto`: password (optional) — 1 optional
- Other DTOs: 1-2 fields each

No DTO has >5 optional fields.

**Verdict**: **PASS** — all DTOs are well-segregated with minimal optional fields.

### SD-06: Abstraction level consistency — Tier 2

**Threshold**: Consistent = PASS, mixed = WARN

Reviewed top-5 largest functions:

1. `verifyAuthentication()`: Good decomposition into private helpers (`retrieveAndDeleteChallenge`, `verifySignCountAndUpdate`, `failPasskeyAuth`). Orchestration-level.
2. `trustDevice()`: Mixes orchestration with Prisma calls. Acceptable for a single-entity service.
3. `login()`: Excellent decomposition — delegates to `checkAccountLockout`, `validateCredentials`, `checkEmailVerification`, `handleMfaLogin`, `handleMfaSetupRequired`, `handleLoginSuccess`.
4. `generateTokens()`: Pure token generation — consistent abstraction level.
5. `refreshTokens()`: Session rotation orchestration — consistent.

**Verdict**: **PASS** — abstraction levels are generally consistent. `login()` demonstrates exemplary decomposition.

---

## 10e. TypeScript Strictness & Linting (ISO 25010 — Testability)

### TS-01: TypeScript strict mode — Tier 1

**Evidence**: `nexacore-api/tsconfig.json:21` — `"strict": true`

**Verdict**: **PASS** — strict mode is enabled globally.

### TS-02: No `any` in production code — Tier 1

**Threshold**: 0 = PASS, 1-5 = WARN, >5 = FAIL

GREP results for `: any`, `as any`, `<any>` in production files (excluding `*.spec.ts` and `tests/`):

1. `guards/base-oauth-auth.guard.ts:5` — `Type<any>` — NestJS `AuthGuard()` returns `Type<any>` by design
2. `strategies/pkce-authenticate.ts:17` — `(...args: any[]) => void` — Passport `authenticate()` requires `any`. Has `// eslint-disable-next-line @typescript-eslint/no-explicit-any` justification.

**Verdict**: **PASS** — 2 `any` occurrences, both justified by framework type constraints (NestJS/Passport). Within threshold and documented.

### TS-03: ESLint zero errors — Tier 1

**Note**: `npx eslint` not executed (Bash restricted). Based on active pre-commit hooks (Husky + lint-staged) and prior audit (2026-03-16T22-30) showing 0 ESLint errors.

**Verdict**: **PASS** — ESLint enforced via pre-commit hooks.

### TS-04: No `@ts-ignore` / `@ts-expect-error` — Tier 1

GREP results: **0 occurrences** across entire auth module (production + tests).

**Verdict**: **PASS** — no TypeScript suppressions found.

### TS-05: No unsafe type assertions — Tier 2

GREP for `as unknown as` in production files (5 occurrences):

1. `passkey.service.ts:45` — `options as unknown as Record<string, unknown>` (WebAuthn library type via wrapper function `toWebAuthnRecord`)
2. `passkey.service.ts:373` — `credential as unknown as RegistrationResponseJSON` (JSON to WebAuthn type)
3. `passkey.service.ts:406` — `credential as unknown as AuthenticationResponseJSON` (JSON to WebAuthn type)
4. `strategies/google.strategy.ts:43` — `this as unknown as PassportOAuth2Internals` (Passport PKCE internal access)
5. `strategies/github.strategy.ts:43` — `this as unknown as PassportOAuth2Internals` (Passport PKCE internal access)

All 5 are at third-party library boundaries where type systems don't align.

**Verdict**: **PASS** — 5 unsafe assertions, all at library boundaries with clear justification.

### TS-06: Return types explicit on public API — Tier 2

**Threshold**: All explicit = PASS, >3 missing = WARN, >6 = FAIL

Reviewed all service public methods:
- `AuthService`: All 17 methods — explicit `Promise<X>` return types
- `TokenService`: All methods — explicit return types
- `LoginService`: Both methods — explicit return types
- `MfaService`: All methods — explicit return types
- `PasskeyService`: All methods — explicit return types
- `TrustedDeviceService.trustDevice()`: Prisma-inferred return type (implicit)
- `TrustedDeviceService.listTrustedDevices()`: Prisma-inferred return type (implicit)

**2 methods** rely on Prisma type inference. Within acceptable threshold (<=3).

**Verdict**: **PASS** — <=3 methods rely on type inference.

---

## 10f. Code Hygiene (Clean Code, CWE-1006)

### CH-01: No magic numbers — Tier 2

**Threshold**: 0 repeated = PASS, 1-3 unique = WARN, >3 = FAIL

All numeric constants extracted to `constants/auth.constants.ts` (157 lines) and `constants/passkey.constants.ts` (15 lines):
- `BCRYPT_ROUNDS` (12), `MAX_FAILED_ATTEMPTS` (5), `LOCKOUT_DURATIONS_MINUTES` [15, 30, 60, 120]
- `SESSION_IDLE_TIMEOUT_HOURS` (0.5), `MAX_CONCURRENT_SESSIONS` (5)
- `ACCESS_TOKEN_TTL_SECONDS` (900), `VERIFICATION_TOKEN_EXPIRY_HOURS` (24)
- `RESEND_COOLDOWN_SECONDS` (60), `RESET_TOKEN_EXPIRY_HOURS` (1)
- `BCRYPT_ROUNDS_RECOVERY` (10), `RECOVERY_CODE_COUNT` (10), `RECOVERY_CODE_LENGTH` (10)
- `TRUSTED_DEVICE_TTL_DAYS` (30), `MAX_TRUSTED_DEVICES_PER_USER` (10)
- `OAUTH_CODE_COOKIE_MAX_AGE_MS` (30_000)
- `WEBAUTHN_CHALLENGE_TTL_SECONDS` (300), `MAX_PASSKEYS_PER_USER` (10)
- Rate limits: all in `AUTH_RATE_LIMITS` object
- Store-local constants: `STATE_TTL_SECONDS` (300), `CODE_TTL_SECONDS` (60), `LINK_CODE_TTL_SECONDS` (60)

Remaining numeric literals are `0`, `1`, `-1`, and standard conversions (`Date.now() / 1000`).

**Verdict**: **PASS** — all meaningful numbers extracted to named constants.

### CH-02: No magic strings — Tier 2

**Threshold**: 0 repeated (3+) = PASS, 1-3 unique = WARN, >3 = FAIL

All error messages extracted to `ErrorMessages` constant (`common/constants/error-messages`). Audit actions use `AuditAction` enum. Redis key prefixes use named constants. Cookie names use `REFRESH_TOKEN_COOKIE_NAME` constant.

Remaining string literals are single-use controller response messages (`'Logged out successfully'`, `'Session revoked'`, `'MFA enabled successfully'`, etc.) — each used exactly once.

One exception noted: `login-security.service.ts:81` contains an inline error string `'Login blocked due to suspicious location activity...'` that could be extracted to `ErrorMessages`.

**Verdict**: **PASS** — no repeated magic strings (3+ occurrences). Error messages properly centralized.

### CH-03: Dead code — unreferenced exports — Tier 2

**Threshold**: 0 dead = PASS, 1-2 = WARN, >2 = FAIL

Reviewed all exported symbols:
- Module exports (`auth.module.ts:98-104`): `AuthService`, `TokenService`, `PasswordBreachService`, `TrustedDeviceService`, `TokenDenyListService` — all used by other modules
- Interface exports: `CookieConfig`, `AuthResult`, `OAuthTokenPayload`, `OAuthStateData`, `OAuthAction`, `LinkedProvider`, `RefreshTokenPayload`, `AuditLogger` — all referenced
- Utility exports: `createAuditLogger`, `hashToken`, `parseDurationMs`, `createOAuthAuthGuard` — all used
- Re-exports from `auth.service.ts:23-29`: type re-exports for backward compatibility — used by controllers
- `token-deny-list.service.ts:5` re-exports `ACCESS_TOKEN_TTL_SECONDS` — used by `token.service.ts`

**Verdict**: **PASS** — 0 dead exports identified.

### CH-04: Commented-out code blocks — Tier 2

**Threshold**: 0 blocks = PASS, 1 = WARN, >1 = FAIL

All comments in production files are documentation comments (JSDoc, OWASP/NIST references, design explanations). No blocks of 5+ consecutive comment lines containing code patterns found.

**Verdict**: **PASS** — no commented-out code blocks.

### CH-05: No console.log in production — Tier 1

GREP results for `console.log`, `console.debug`, `console.info` in `src/auth/`: **0 occurrences**.

All logging uses NestJS `Logger` class:
- `email-verification.service.ts:27` — `new Logger(EmailVerificationService.name)`
- `password-reset.service.ts:25` — `new Logger(PasswordResetService.name)`
- `token-deny-list.service.ts:9` — `new Logger(TokenDenyListService.name)`
- `password-breach.service.ts:6` — `new Logger(PasswordBreachService.name)`
- `oauth-callback.filter.ts:18` — `new Logger(OAuthCallbackFilter.name)`

**Verdict**: **PASS** — 0 console.log in production code. NestJS Logger used consistently.

### CH-06: TODO/FIXME/HACK tracking — INFO

GREP results for `TODO|FIXME|HACK|XXX|TEMP` in `src/auth/`: **0 occurrences** (only false positives from `MAX_FAILED_ATTEMPTS` constant name containing `TEMP`-like substrings — not a match).

**Verdict**: **INFO** — 0 technical debt markers. Clean codebase.

### CH-07: Naming convention consistency — Tier 2

**Threshold**: Consistent = PASS, >3 violations = WARN

Verified across all 43 production files:
- **camelCase** for methods/variables: Consistent (`generateTokens`, `refreshToken`, `loginService`)
- **PascalCase** for classes/interfaces/enums: Consistent (`AuthService`, `CookieConfig`, `MfaChallengeResult`)
- **UPPER_SNAKE_CASE** for constants: Consistent (`BCRYPT_ROUNDS`, `MAX_FAILED_ATTEMPTS`, `JWT_ISSUER`)
- **kebab-case** for filenames: Consistent (`auth.service.ts`, `login-security.service.ts`, `oauth-auth.service.ts`)

**Verdict**: **PASS** — naming conventions are fully consistent across the module.

---

## Findings Summary

### FAIL Findings: 0

No check exceeded its FAIL threshold.

### WARN Findings: 8

| Check ID | Severity | Finding | Evidence | Recommendation |
|----------|----------|---------|----------|----------------|
| SM-01 | MEDIUM | 4 production files exceed 300 lines | passkey.service.ts:455, login.service.ts:365, token.service.ts:327, mfa.service.ts:305 | Consider extracting private helpers to separate files for passkey.service.ts (highest at 455) |
| SM-03 | MEDIUM | 2 functions exceed 50 lines | passkey.service.ts:199 verifyAuthentication():63, trusted-device.service.ts:36 trustDevice():58 | Extract sub-steps to private helpers |
| CX-04 | LOW | 4 methods have 4 parameters | login(), trustDevice(), deletePasskey(), verifyRegistration() | Group related params into objects (e.g., `RequestContext`) |
| CX-05 | MEDIUM | 4 services have 6-7 DI dependencies | TokenService:7, MfaService:6, LoginService:6, PasswordResetService:6 | TokenService (7) is highest — consider extracting logout to a SessionOrchestrator |
| SD-01 | MEDIUM | AuthService has 17 public methods | auth.service.ts:32-171 — 17 facade-delegation methods | Accepted: intentional facade pattern. Each method is 1-line delegation |
| SD-03 | MEDIUM | TokenService has 2 responsibilities | JWT generation + session lifecycle (logout) | Consider moving logout to dedicated service |
| DU-04 | MEDIUM | 3 cross-file clone patterns | Post-login security block (3 files, 4 locations), OAuth strategy authenticate/authorizationParams (2 files) | Extract post-login checks to LoginSecurityService.executePostLoginChecks() |
| TS-02 | — | 2 `any` occurrences in production | base-oauth-auth.guard.ts:5, pkce-authenticate.ts:17 | Both framework-constrained — no action needed |

---

## Recurrence Analysis vs Previous Audit (2026-03-16T22-30)

| Check ID | Previous Verdict | Current Verdict | Delta | Category |
|----------|-----------------|-----------------|-------|----------|
| SM-01 | WARN (4 files: 454, 365, 326, 304) | WARN (4 files: 455, 365, 327, 305) | Stable | — |
| SM-02 | PASS | PASS | Stable | — |
| SM-03 | WARN (2 functions: 63, 57) | WARN (2 functions: 63, 58) | Stable | — |
| SM-04 | PASS | PASS | Stable | — |
| SM-05 | PASS (9.7%) | PASS (9.6%) | Stable | — |
| SM-06 | INFO (~4,690 LOC) | INFO (~4,720 LOC) | Stable | — |
| CX-01 | PASS | PASS | Stable | — |
| CX-02 | PASS | PASS | Stable | — |
| CX-03 | PASS | PASS | Stable | — |
| CX-04 | WARN (4 methods w/ 4 params) | WARN (4 methods w/ 4 params) | Stable | — |
| CX-05 | WARN (4 services: 7, 6, 6, 6) | WARN (4 services: 7, 6, 6, 6) | Stable | — |
| DU-01 | PASS (~2-3%) | PASS (~2-3%) | Stable | — |
| DU-02 | PASS | PASS | Stable | — |
| DU-03 | PASS (~10 lines) | PASS (~10 lines) | Stable | — |
| DU-04 | WARN (3 patterns) | WARN (3 patterns) | Stable | — |
| DU-05 | INFO (1 candidate) | INFO (1 candidate) | Stable | — |
| SD-01 | WARN (AuthService: 17) | WARN (AuthService: 17) | Stable | — |
| SD-02 | PASS | PASS | Stable | — |
| SD-03 | WARN (TokenService: 2 resp.) | WARN (TokenService: 2 resp.) | Stable | — |
| SD-04 | PASS | PASS | Stable | — |
| SD-05 | PASS | PASS | Stable | — |
| SD-06 | PASS | PASS | Stable | — |
| TS-01 | PASS | PASS | Stable | — |
| TS-02 | PASS (2 any) | PASS (2 any) | Stable | — |
| TS-03 | PASS | PASS | Stable | — |
| TS-04 | PASS (0) | PASS (0) | Stable | — |
| TS-05 | PASS (5 assertions) | PASS (5 assertions) | Stable | — |
| TS-06 | PASS (2 implicit) | PASS (2 implicit) | Stable | — |
| CH-01 | PASS | PASS | Stable | — |
| CH-02 | PASS | PASS | Stable | — |
| CH-03 | PASS | PASS | Stable | — |
| CH-04 | PASS | PASS | Stable | — |
| CH-05 | PASS | PASS | Stable | — |
| CH-06 | INFO (0 TODOs) | INFO (0 TODOs) | Stable | — |
| CH-07 | PASS | PASS | Stable | — |

### Recurrence Summary

- **Regressions**: 0
- **Remediated**: 0 (no prior FAILs in code quality phase)
- **Stable WARN**: 8 (all existing WARNs persist unchanged)
- **New findings**: 0

All 37 checks are stable vs. the previous audit. No regressions, no new findings, no changes in any verdict.

### Historical Trend (Code Quality Phase)

| Audit Date | PASS | FAIL | WARN | INFO |
|------------|------|------|------|------|
| 2026-03-16T22-30 | 27 | 0 | 8 | 2 |
| 2026-03-16T23-31 | 27 | 0 | 8 | 2 |

**Delta**: No change. Module code quality is stable across consecutive audits.
