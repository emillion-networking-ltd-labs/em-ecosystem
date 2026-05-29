# Fase 10: CODE QUALITY — Auth

**Date**: 2026-03-12 16:22 UTC
**Module**: auth
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: ISO 25010, CWE-1080/1120/1121/1047, SonarQube, CISQ ASCMM, Clean Code

---

## 10a. Structural Metrics

### SM-01 — File length (production, <=300 PASS, 301-500 WARN, >500 FAIL)

| File | Lines | Verdict | Severity |
|------|-------|---------|----------|
| auth.service.ts | 1284 | **FAIL** | High |
| auth.controller.ts | 670 | **FAIL** | High |
| passkey.service.ts | 434 | **WARN** | Medium |
| mfa.service.ts | 286 | PASS | — |
| trusted-device.service.ts | 218 | PASS | — |
| passkey.controller.ts | 192 | PASS | — |
| mfa.controller.ts | 177 | PASS | — |
| github.strategy.ts | 138 | PASS | — |
| google.strategy.ts | 129 | PASS | — |
| auth.constants.ts | 101 | PASS | — |
| roles.guard.ts | 71 | PASS | — |
| password-breach.service.ts | 68 | PASS | — |
| auth.module.ts | 69 | PASS | — |
| oauth-state.store.ts | 61 | PASS | — |
| permissions.guard.ts | 56 | PASS | — |
| token-deny-list.service.ts | 56 | PASS | — |
| oauth-code.store.ts | 47 | PASS | — |
| oauth-link.guard.ts | 43 | PASS | — |
| jwt.strategy.ts | 42 | PASS | — |
| oauth-callback.filter.ts | 28 | PASS | — |
| google-auth.guard.ts | 26 | PASS | — |
| github-auth.guard.ts | 26 | PASS | — |
| passkey.constants.ts | 17 | PASS | — |
| oauth-account.interface.ts | 6 | PASS | — |
| refresh-token-payload.interface.ts | 5 | PASS | — |
| jwt-auth.guard.ts | 5 | PASS | — |
| DTOs (18 files) | 7-31 each | PASS | — |

**Result**: **2 FAIL** (auth.service.ts, auth.controller.ts), **1 WARN** (passkey.service.ts)

### SM-02 — File length (tests, <=900 PASS, 901-1500 WARN, >1500 FAIL)

| File | Lines | Verdict | Severity |
|------|-------|---------|----------|
| auth.service.spec.ts | 2860 | **FAIL** | High |
| passkey.service.spec.ts | 946 | **WARN** | Medium |
| auth.controller.spec.ts | 795 | PASS | — |
| trusted-device.service.spec.ts | 500 | PASS | — |
| mfa.service.spec.ts | 417 | PASS | — |
| github.strategy.spec.ts | 407 | PASS | — |
| google.strategy.spec.ts | 332 | PASS | — |
| passkey.controller.spec.ts | 318 | PASS | — |
| mfa.controller.spec.ts | 263 | PASS | — |
| oauth-exchange.spec.ts | 186 | PASS | — |
| token-deny-list.service.spec.ts | 165 | PASS | — |
| oauth-code.store.spec.ts | 134 | PASS | — |
| password-breach.service.spec.ts | 131 | PASS | — |
| jwt.strategy.spec.ts | 125 | PASS | — |
| roles.guard.spec.ts | 117 | PASS | — |
| oauth-state.store.spec.ts | 114 | PASS | — |
| permissions.guard.spec.ts | 107 | PASS | — |
| oauth-guards.spec.ts | 84 | PASS | — |
| rate-limiting.spec.ts | 63 | PASS | — |
| brute-force.spec.ts | 59 | PASS | — |
| timing-attack.spec.ts | 18 | PASS | — |

**Result**: **1 FAIL** (auth.service.spec.ts), **1 WARN** (passkey.service.spec.ts)

### SM-03 — Function/method length (<=50 PASS, 51-75 WARN, >75 FAIL)

Measured by counting method body lines (opening brace to closing brace) in production files.

| Method | File | Lines | Verdict | Severity |
|--------|------|-------|---------|----------|
| `login()` | auth.service.ts | ~252 (L201-457) | **FAIL** | High |
| `verifyEmailChange()` | auth.service.ts | ~88 (L946-1034) | **FAIL** | High |
| `verifyAuthentication()` | passkey.service.ts | ~131 (L208-338) | **FAIL** | High |
| `resetPassword()` | auth.service.ts | ~74 (L1139-1213) | **WARN** | Medium |
| `register()` | auth.service.ts | ~63 (L136-199) | **WARN** | Medium |
| `refreshTokens()` | auth.service.ts | ~101 (L459-560) | **FAIL** | High |
| `validateOAuthUser()` | auth.service.ts | ~52 (L562-613) | **WARN** | Medium |
| `generateTokens()` | auth.service.ts | ~49 (L736-785) | PASS | — |
| `forgotPassword()` | auth.service.ts | ~44 (L1093-1137) | PASS | — |
| `trustDevice()` | trusted-device.service.ts | ~60 (L32-92) | **WARN** | Medium |
| `validate()` (GitHub) | github.strategy.ts | ~62 (L59-137) | **WARN** | Medium |
| `validate()` (Google) | google.strategy.ts | ~54 (L59-128) | **WARN** | Medium |

**Result**: **4 FAIL**, **6 WARN**. The `login()` method at 252 lines is the most critical violation.

### SM-04 — Controller method length (<=30 PASS, 31-50 WARN, >50 FAIL)

All controller methods measured. Only the longest are listed:

| Method | File | Lines | Verdict |
|--------|------|-------|---------|
| `login()` | auth.controller.ts | ~22 (L158-179) | PASS |
| `exchangeOAuthCode()` | auth.controller.ts | ~12 (L542-553) | PASS |
| `trustDevice()` | auth.controller.ts | ~14 (L568-581) | PASS |
| `verifyLogin()` | mfa.controller.ts | ~13 (L98-115) | PASS |
| `loginVerify()` | passkey.controller.ts | ~14 (L121-138) | PASS |

**Result**: **PASS** — All controller methods are thin delegators, <=30 lines.

### SM-05 — Module file concentration (top file <=40% PASS, 41-60% WARN, >60% FAIL)

Total production lines: 3454 (main files) + 801 (guards/stores/strategies/constants) + 254 (DTOs) = **4509 lines**

Top file: `auth.service.ts` = 1284 lines = **28.5%** of module volume.

**Result**: **PASS** (28.5% < 40%)

### SM-06 — Module total volume (INFO)

| Category | Files | Lines |
|----------|-------|-------|
| Services | 6 | 2346 |
| Controllers | 3 | 1039 |
| Guards | 7 | 261 |
| Strategies | 3 | 309 |
| Stores | 2 | 108 |
| Constants | 2 | 118 |
| DTOs | 18 | 254 |
| Interfaces | 2 | 11 |
| Module | 1 | 69 |
| **Production total** | **44** | **4509** |
| Tests | 21 | 8141 |
| **Grand total** | **65** | **12650** |

**Result**: **INFO** — Test-to-production ratio: 1.81:1 (healthy).

---

## 10b. Complexity Analysis

Applied to the **5 largest functions** by line count in production files.

### Function 1: `AuthService.login()` — 252 lines

| Check | Metric | Value | Verdict | Standard |
|-------|--------|-------|---------|----------|
| CX-01 | Cyclomatic complexity | ~22 | **FAIL** | CWE-1121, CISQ |
| CX-02 | Cognitive complexity | ~30 | **FAIL** | SonarQube |
| CX-03 | Max nesting depth | 4 | **WARN** | ISO 25010 |
| CX-04 | Non-DI parameters | 4 (dto, requestMeta, ctx, fingerprint) | **WARN** | Clean Code |
| CX-05 | Fan-out (constructor DI) | 12 | **FAIL** | CWE-1080 |

Decision branches: user-not-found, account-locked, expired-lockout, no-password-hash, invalid-password, lockout-threshold, email-not-verified, failed-attempts-reset, mfa-enabled+trusted-device, mfa-challenge, admin-without-mfa, normal-login, impossible-travel-blocked, impossible-travel-challenged.

### Function 2: `PasskeyService.verifyAuthentication()` — 131 lines

| Check | Metric | Value | Verdict | Standard |
|-------|--------|-------|---------|----------|
| CX-01 | Cyclomatic complexity | ~10 | PASS | CWE-1121 |
| CX-02 | Cognitive complexity | ~14 | PASS | SonarQube |
| CX-03 | Max nesting depth | 2 | PASS | ISO 25010 |
| CX-04 | Non-DI parameters | 3 (challengeId, credential, ctx) | PASS | Clean Code |
| CX-05 | Fan-out (constructor DI) | 4 | PASS | CWE-1080 |

### Function 3: `AuthService.refreshTokens()` — 101 lines

| Check | Metric | Value | Verdict | Standard |
|-------|--------|-------|---------|----------|
| CX-01 | Cyclomatic complexity | ~7 | PASS | CWE-1121 |
| CX-02 | Cognitive complexity | ~10 | PASS | SonarQube |
| CX-03 | Max nesting depth | 3 | PASS | ISO 25010 |
| CX-04 | Non-DI parameters | 3 (refreshToken, requestMeta, ctx) | PASS | Clean Code |
| CX-05 | Fan-out (constructor DI) | 12 | **FAIL** | CWE-1080 |

### Function 4: `AuthService.verifyEmailChange()` — 88 lines

| Check | Metric | Value | Verdict | Standard |
|-------|--------|-------|---------|----------|
| CX-01 | Cyclomatic complexity | ~10 | PASS | CWE-1121 |
| CX-02 | Cognitive complexity | ~12 | PASS | SonarQube |
| CX-03 | Max nesting depth | 2 | PASS | ISO 25010 |
| CX-04 | Non-DI parameters | 2 (token, ctx) | PASS | Clean Code |
| CX-05 | Fan-out (constructor DI) | 12 | **FAIL** | CWE-1080 |

### Function 5: `AuthService.resetPassword()` — 74 lines

| Check | Metric | Value | Verdict | Standard |
|-------|--------|-------|---------|----------|
| CX-01 | Cyclomatic complexity | ~8 | PASS | CWE-1121 |
| CX-02 | Cognitive complexity | ~10 | PASS | SonarQube |
| CX-03 | Max nesting depth | 2 | PASS | ISO 25010 |
| CX-04 | Non-DI parameters | 2 (dto, ctx) | PASS | Clean Code |
| CX-05 | Fan-out (constructor DI) | 12 | **FAIL** | CWE-1080 |

### CX-05 — Fan-out (constructor DI count) — Module-wide

| Class | DI Count | Verdict |
|-------|----------|---------|
| AuthService | 12 | **FAIL** (>8) |
| AuthController | 5 | PASS |
| MfaService | 5 | PASS |
| PasskeyService | 4 | PASS |
| MfaController | 2 | PASS |
| PasskeyController | 2 | PASS |
| TrustedDeviceService | 2 | PASS |
| TokenDenyListService | 1 | PASS |
| PasswordBreachService | 0 | PASS |

**Summary**: AuthService has 12 DI dependencies, exceeding the 8 threshold. This is the central auth orchestrator — a strong signal it should be decomposed.

---

## 10c. Duplication Detection

> **Note**: `npx jscpd` could not be executed due to shell permission constraints. Duplication analysis was performed manually by code review.

### Manual Cross-File Clone Analysis

**Clone 1**: `extractRequestMeta(req: any)` — identical implementation in 3 controllers
- `auth.controller.ts:74-82`
- `mfa.controller.ts:39-47`
- `passkey.controller.ts:43-51`
- **9 lines x 3 = 27 cloned lines**

**Clone 2**: `GoogleAuthGuard.getAuthenticateOptions()` vs `GitHubAuthGuard.getAuthenticateOptions()` — near-identical
- `google-auth.guard.ts:11-25` (15 lines)
- `github-auth.guard.ts:11-25` (15 lines)
- **Difference**: only the class name and parent strategy string differ. **15 cloned lines**.

**Clone 3**: `GoogleStrategy.authenticate()` vs `GitHubStrategy.authenticate()` — near-identical PKCE injection
- `google.strategy.ts:37-57` (20 lines)
- `github.strategy.ts:37-57` (20 lines)
- **20 cloned lines**, identical logic.

**Clone 4**: `GoogleStrategy.validate()` state validation preamble vs `GitHubStrategy.validate()` — shared state validation + try/catch structure
- `google.strategy.ts:76-128` vs `github.strategy.ts:77-137`
- **~30 lines** of shared structure (state validation, error handling, link vs login dispatch).

**Clone 5**: `buildRefreshCookie()` vs `buildClearCookie()` — structural similarity (minor)
- `auth.service.ts:1257-1283` — shared CookieConfig shape.

### DU-01 — Duplicated lines % (production, <=3% PASS)

Estimated cloned lines: ~92 out of 4509 = **2.04%**

**Result**: **PASS** (2.04% < 3%)

### DU-02 — Duplicated lines % (tests)

Not measured (jscpd not available). Tests excluded from production threshold per spec.

**Result**: **N/A** (tool not available)

### DU-03 — Largest clone block (<=20 PASS, 21-50 WARN, >50 FAIL)

Largest clone: `authenticate()` PKCE injection = 20 lines.

**Result**: **PASS** (20 lines)

### DU-04 — Cross-file clones (0 PASS, 1-3 WARN, >3 FAIL)

4 cross-file clone groups identified.

**Result**: **FAIL** (4 > 3) | Severity: Medium | Standard: CWE-1047, CISQ ASCMM-MNT-19

### DU-05 — Utility extraction candidates

| Recommendation | Clones Eliminated | Priority |
|---------------|-------------------|----------|
| Extract `extractRequestMeta()` to a shared base class or utility | 3 controllers | High |
| Extract `OAuthGuardBase` with shared `getAuthenticateOptions()` | 2 guards | Medium |
| Extract `OAuthStrategyBase` with shared `authenticate()` PKCE logic | 2 strategies | Medium |
| Extract shared `validate()` preamble (state validation) into base strategy | 2 strategies | Low |

---

## 10d. Module Design & SOLID

### SD-01 — God class detection (<=12 public methods PASS, 13-18 WARN, >18 FAIL)

| Class | Public Methods | Verdict |
|-------|---------------|---------|
| AuthService | 16 (register, login, refreshTokens, validateOAuthUser, validateOAuthLink, generateOAuthCode, exchangeOAuthCode, logout, logoutAll, generateTokensForMfa, verifyEmail, verifyEmailChange, resendVerificationEmail, resendVerificationByEmail, forgotPassword, resetPassword, validateResetToken, buildRefreshCookie, buildClearCookie) = **19** | **FAIL** |
| AuthController | 27 endpoints | **FAIL** (but endpoints not methods per se; controller = thin) |
| PasskeyService | 7 | PASS |
| MfaService | 7 | PASS |
| TrustedDeviceService | 7 | PASS |
| MfaController | 6 | PASS |
| PasskeyController | 7 | PASS |

**Result**: **FAIL** — AuthService has 19 public methods (>18 threshold).

### SD-02 — Controller thinness (0 fat methods PASS)

All controller methods delegate to services. No business logic in controllers. No method > 30 lines.

**Result**: **PASS**

### SD-03 — Service Single Responsibility (1 responsibility PASS, 2 WARN, >=3 FAIL)

| Service | Responsibilities | Verdict |
|---------|-----------------|---------|
| AuthService | Credential auth, OAuth orchestration, email verification, password reset, session management, token generation, email-change verification = **7** | **FAIL** |
| MfaService | MFA setup, verification, recovery codes = 1 (MFA management) | PASS |
| PasskeyService | WebAuthn registration, authentication, CRUD = 1 (Passkey management) | PASS |
| TrustedDeviceService | Device trust management = 1 | PASS |
| PasswordBreachService | Breach checking = 1 | PASS |
| TokenDenyListService | Token deny list = 1 | PASS |

**Result**: **FAIL** — AuthService has ~7 distinct responsibilities. It should be decomposed into:
1. `CredentialAuthService` (login, register, lockout)
2. `EmailVerificationService` (verifyEmail, resendVerification, verifyEmailChange)
3. `PasswordResetService` (forgotPassword, resetPassword, validateResetToken)
4. `OAuthAuthService` (validateOAuthUser, validateOAuthLink, generateOAuthCode, exchangeOAuthCode)
5. `TokenService` (generateTokens, buildRefreshCookie, refreshTokens)

### SD-04 — Circular dependency risk (0 circular PASS)

No circular imports detected. AuthService imports UsersService, SessionsService, etc. — all unidirectional.

**Result**: **PASS**

### SD-05 — Interface segregation / DTO field count (<=5 optional fields PASS)

| DTO | Optional Fields | Verdict |
|-----|----------------|---------|
| MfaVerifyLoginDto | 2 (code?, recoveryCode?) | PASS |
| PasskeyLoginOptionsDto | 1 (email?) | PASS |
| PasskeyDeleteDto | 1 (password?) | PASS |
| PasskeyRegisterVerifyDto | 1 (name?) | PASS |
| All others | 0 | PASS |

**Result**: **PASS**

### SD-06 — Abstraction level consistency (Consistent PASS)

Controllers operate at HTTP layer (decorators, DTOs, response shaping). Services operate at business logic layer. Guards operate at auth/authz layer. Strategies operate at OAuth protocol layer. Stores operate at data-access layer.

Minor concern: `AuthService` directly uses `PrismaService` for email verification/password reset token operations instead of going through a dedicated repository or service. This mixes orchestration with data access.

**Result**: **WARN** — AuthService mixes orchestration with direct Prisma data access for tokens.

---

## 10e. TypeScript Strictness

### TS-01 — TypeScript strict mode (strict:true PASS)

`tsconfig.json` has `strictNullChecks: true` but does **NOT** have `strict: true`. Missing strict sub-flags: `noImplicitAny`, `strictBindCallApply`, `strictFunctionTypes`, `strictPropertyInitialization`, `noImplicitThis`, `alwaysStrict`, `useUnknownInCatchVariables`.

**Result**: **FAIL** | Severity: High | Standard: CWE-1120, ISO 25010

### TS-02 — No `any` in production code (0 PASS, 1-5 WARN, >5 FAIL)

Production file `any` occurrences (excluding comments, tests, and string literals):

| File | Count | Locations |
|------|-------|-----------|
| auth.controller.ts | 15 | `req: any` in 13 endpoints, `extractRequestMeta(req: any)`, `getCurrentSessionId(req: any)` |
| mfa.controller.ts | 3 | `extractRequestMeta(req: any)`, 2x `@Request() req: any` |
| passkey.controller.ts | 3 | `extractRequestMeta(req: any)`, 2x `@Request() req: any` |
| github.strategy.ts | 4 | `authenticate(req: any, options?: any)`, `(this as any)._oauth2`, `callback: (...args: any[])` |
| google.strategy.ts | 4 | `authenticate(req: any, options?: any)`, `(this as any)._oauth2`, `callback: (...args: any[])` |

**Total production `any`**: **29**

**Result**: **FAIL** (29 > 5) | Severity: High | Standard: CWE-1120

### TS-03 — ESLint zero errors (0 errors PASS)

ESLint could not be executed in this session. Based on CI configuration (`.github/workflows/security.yml`), ESLint runs with `eslint-plugin-security` and the project maintains zero-error policy.

**Result**: **N/A** (not executed; see CI pipeline)

### TS-04 — No @ts-ignore/@ts-expect-error (0 PASS)

Grep found **0** instances in the entire auth module.

**Result**: **PASS**

### TS-05 — No unsafe type assertions (0 PASS)

Type assertions found in production code:

| File | Assertion | Safe? |
|------|-----------|-------|
| auth.service.ts:383,434,527,537,748,778 | `as StringValue` | Safe (required by ms library typing) |
| auth.controller.ts:169,174 | `as MfaChallengeResult`, `as MfaSetupRequiredResult` | Safe (type narrowing after `in` check) |
| github.strategy.ts:43 | `(this as any)._oauth2` | **Unsafe** — accessing private Passport internals |
| google.strategy.ts:43 | `(this as any)._oauth2` | **Unsafe** — accessing private Passport internals |
| github.strategy.ts:56 | `(super.authenticate as Function)` | **Unsafe** — casting method reference |
| google.strategy.ts:56 | `(super.authenticate as Function)` | **Unsafe** — casting method reference |
| token-deny-list.service.ts:17,26,52 | `(err as Error).message` | Safe (standard pattern) |
| oauth-link.guard.ts:27 | `request.query.token as string` | Acceptable (Express typed) |

**Unsafe assertions**: 4 (strategies accessing Passport internals for PKCE).

**Result**: **WARN** (4 unsafe assertions, but required for PKCE integration with Passport) | Severity: Low

### TS-06 — Return types explicit (All explicit PASS)

Spot-checked all service methods and controller methods:

- AuthService: All public methods have explicit return types. PASS.
- MfaService: All public methods have explicit return types. PASS.
- PasskeyService: All public methods have explicit return types. PASS.
- TrustedDeviceService: `trustDevice()` — **no explicit return type**. `listTrustedDevices()` — **no explicit return type**.
- Controllers: Several methods lack explicit return types (NestJS convention, inferred from decorators). Acceptable.

**Result**: **WARN** — 2 service methods in TrustedDeviceService lack explicit return types.

---

## 10f. Code Hygiene

### CH-01 — No magic numbers (0 repeated PASS, 1-3 WARN, >3 FAIL)

| Magic Number | Occurrences | File(s) | Status |
|-------------|-------------|---------|--------|
| `24` (hours) | 1 | auth.service.ts:47 (`VERIFICATION_TOKEN_EXPIRY_HOURS`) | Named constant - OK |
| `1` (hours) | 1 | auth.service.ts:48 (`RESET_TOKEN_EXPIRY_HOURS`) | Named constant - OK |
| `60` (seconds) | 1 | auth.service.ts:49 (`RESEND_COOLDOWN_SECONDS`) | Named constant - OK |
| `3000` (ms timeout) | 1 | password-breach.service.ts:27 | **Unnamed** |
| `10` (recovery codes count) | 1 | mfa.service.ts:21 (`RECOVERY_CODE_COUNT`) | Named constant - OK |
| `60_000` | 2 | auth.controller.ts:399,561 (inline rate limit TTL) | **Unnamed** (others use `AUTH_RATE_LIMITS`) |

**Unnamed magic numbers**: 3

**Result**: **WARN** (3 unnamed magic numbers) | Severity: Low | Standard: Clean Code

### CH-02 — No magic strings (0 PASS, 1-3 WARN, >3 FAIL)

| Magic String | Occurrences | File(s) |
|-------------|-------------|---------|
| `'Invalid credentials'` | 5 | auth.service.ts:220,237,260,299,317 |
| `'default-dev-secret-change-in-production'` | 3 | auth.service.ts:129, mfa.service.ts:39, trusted-device.service.ts:20 |
| `'http://localhost:3001'` | 3 | auth.controller.ts:301,323, oauth-callback.filter.ts:15 |
| `'http://localhost:3000/auth/...'` | 2 | google.strategy.ts:20, github.strategy.ts:20 |
| `'mfa-challenge-token'` | 2 | auth.service.ts:132, mfa.service.ts:41 |
| `'device-fingerprint-key'` | 1 | trusted-device.service.ts:22 |
| `'mfa-challenge'` | 3 | auth.service.ts:382,433, mfa.service.ts:147 |

Analysis: `'Invalid credentials'` is used via inline string in auth.service.ts rather than `ErrorMessages.auth.*` constant. The JWT secret fallback `'default-dev-secret-change-in-production'` appears in 3 files. Frontend URL fallback `'http://localhost:3001'` appears in 3 files. The HMAC derivation key `'mfa-challenge-token'` is duplicated across 2 files.

**Result**: **FAIL** (>3 repeated magic strings) | Severity: Medium | Standard: CWE-1047, Clean Code

### CH-03 — Dead code: unreferenced exports (0 PASS, 1-2 WARN, >2 FAIL)

| Export | File | Referenced? |
|--------|------|------------|
| `OAuthTokenPayload` interface | oauth-code.store.ts:10 | Not imported outside this file (CookieConfig + SafeUser used directly) |
| `cleanup()` | oauth-code.store.ts:44, oauth-state.store.ts:58 | No-op methods, never called |

**Result**: **WARN** (2 potentially dead exports) | Severity: Low

### CH-04 — Commented-out code blocks (0 PASS, 1 WARN, >1 FAIL)

Grep found **0** commented-out code blocks. All comments are documentation/rationale comments.

**Result**: **PASS**

### CH-05 — No console.log in production (0 PASS)

Grep found **0** `console.log/warn/error/debug/info` calls. All logging uses NestJS `Logger`.

**Result**: **PASS**

### CH-06 — TODO/FIXME/HACK tracking (Report as INFO, >5 WARN)

Grep found **0** TODO/FIXME/HACK/XXX markers in the auth module.

**Result**: **PASS** (0 markers)

### CH-07 — Naming convention consistency (Consistent PASS)

- Files: kebab-case with `.service.ts`, `.controller.ts`, `.guard.ts`, `.strategy.ts`, `.store.ts`, `.dto.ts`, `.interface.ts` suffixes — **consistent**.
- Classes: PascalCase — **consistent**.
- Methods: camelCase — **consistent**.
- Constants: UPPER_SNAKE_CASE — **consistent**.
- Interfaces: PascalCase with `I` prefix NOT used (NestJS convention) — **consistent**.
- DTOs: PascalCase with `Dto` suffix — **consistent**.

**Result**: **PASS**

---

## Summary

### Results by Sub-Phase

| Sub-Phase | Checks | PASS | WARN | FAIL | N/A |
|-----------|--------|------|------|------|-----|
| 10a Structural Metrics | 6 | 3 | 1 | 2 | 0 |
| 10b Complexity Analysis | 5 functions x 5 checks = 25 | 16 | 3 | 6 | 0 |
| 10c Duplication Detection | 5 | 2 | 0 | 1 | 2 |
| 10d Module Design & SOLID | 6 | 3 | 1 | 2 | 0 |
| 10e TypeScript Strictness | 6 | 2 | 2 | 2 | 0 |
| 10f Code Hygiene | 7 | 5 | 2 | 1 | 0 |
| **Total** | **55** | **31** | **9** | **14** | **2** |

### FAIL Findings Summary

| ID | Finding | Severity | Standard | Recommended Action |
|----|---------|----------|----------|--------------------|
| SM-01a | `auth.service.ts` = 1284 lines (>500) | High | ISO 25010, CISQ ASCMM-MNT-2 | Decompose into 4-5 focused services |
| SM-01b | `auth.controller.ts` = 670 lines (>500) | High | ISO 25010, CISQ ASCMM-MNT-2 | Split into sub-controllers matching service decomposition |
| SM-02 | `auth.service.spec.ts` = 2860 lines (>1500) | High | ISO 25010 | Split when service is decomposed |
| SM-03 | 4 methods >75 lines (login=252, verifyAuthentication=131, refreshTokens=101, verifyEmailChange=88) | High | CWE-1121, CISQ | Extract sub-methods; login() needs decomposition |
| CX-01 | `login()` cyclomatic complexity ~22 (>20) | High | CWE-1121, CISQ | Decompose into validateCredentials(), handleMfa(), handleAdminMfaEnforcement() |
| CX-02 | `login()` cognitive complexity ~30 (>25) | High | SonarQube | Same as CX-01 |
| CX-05 | AuthService fan-out = 12 DI deps (>8) | High | CWE-1080 | Reduce by decomposing service |
| DU-04 | 4 cross-file clone groups | Medium | CWE-1047 | Extract utilities per DU-05 recommendations |
| SD-01 | AuthService = 19 public methods (>18) | Medium | CWE-1080, Clean Code | Decompose per SD-03 plan |
| SD-03 | AuthService = 7 responsibilities (>=3) | High | SRP, SOC 2, Clean Code | Decompose into focused services |
| TS-01 | `strict: true` not enabled in tsconfig.json | High | CWE-1120, ISO 25010 | Enable `strict: true` |
| TS-02 | 29 `any` types in production code (>5) | High | CWE-1120 | Define proper request interfaces |
| CH-02 | >3 repeated magic strings | Medium | CWE-1047, Clean Code | Extract to constants file |
| SM-03+ | `validate()` strategies 54-62 lines each (WARN tier) | Medium | CWE-1121 | Extract shared preamble |

### WARN Findings Summary

| ID | Finding | Severity |
|----|---------|----------|
| SM-01 | passkey.service.ts = 434 lines (301-500 range) | Medium |
| SM-02 | passkey.service.spec.ts = 946 lines (901-1500 range) | Medium |
| SM-03 | 6 methods in 51-75 line range | Medium |
| CX-03 | login() nesting depth = 4 | Low |
| CX-04 | login() parameter count = 4 | Low |
| SD-06 | AuthService mixes orchestration with direct Prisma access | Medium |
| TS-05 | 4 unsafe type assertions (required for PKCE) | Low |
| TS-06 | 2 service methods missing explicit return types | Low |
| CH-01 | 3 unnamed magic numbers | Low |
| CH-03 | 2 potentially dead exports | Low |

### Top 3 Remediation Priorities

1. **Decompose AuthService** (addresses SM-01a, SM-03, CX-01, CX-02, CX-05, SD-01, SD-03) — This single refactoring resolves 7 FAIL findings. Split into `CredentialAuthService`, `EmailVerificationService`, `PasswordResetService`, `OAuthAuthService`, and `TokenService`.

2. **Enable TypeScript strict mode** (addresses TS-01) — Add `strict: true` to `tsconfig.json`. This will likely surface additional type issues but is essential for CWE-1120 compliance.

3. **Eliminate `any` types** (addresses TS-02) — Define a proper `AuthenticatedRequest` interface and use it across all controllers instead of `req: any`. For OAuth strategies, the `(this as any)._oauth2` pattern is a Passport limitation but should be documented.
