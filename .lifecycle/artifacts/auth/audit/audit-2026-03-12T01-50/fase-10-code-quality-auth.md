# Fase 10: CODE QUALITY — Auth

**Date**: 2026-03-12 02:50
**Module**: auth
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: ISO 25010 §4.2.8, CISQ ASCMM, CWE-1121

---

## Summary

| Sub-phase | Checks | PASS | FAIL | WARN | N/A |
|-----------|--------|------|------|------|-----|
| 10a. Structural Metrics | 6 | 2 | 2 | 1 | 1 |
| 10b. Complexity | 5 | 1 | 2 | 2 | 0 |
| 10c. Duplication | 5 | 2 | 1 | 2 | 0 |
| 10d. Module Design | 6 | 2 | 1 | 3 | 0 |
| 10e. TypeScript Strictness | 6 | 2 | 1 | 2 | 1 |
| 10f. Code Hygiene | 7 | 4 | 0 | 3 | 0 |
| **TOTAL** | **35** | **13** | **7** | **13** | **2** |

**Overall**: FAIL (7 FAIL, 13 WARN — structural debt concentrated in AuthService)

---

## Detailed Findings

### 10a. Structural Metrics

#### SM-01: File length (production)
- **Verdict**: FAIL
- **Severity**: HIGH
- **Evidence**: `auth.service.ts` = 1,260 LOC (>500 threshold), `auth.controller.ts` = 670 LOC (>500 threshold), `passkey.service.ts` = 435 LOC (WARN zone 301-500).
- **Standard**: ISO 25010 §4.2.8

#### SM-02: File length (tests)
- **Verdict**: FAIL
- **Severity**: MEDIUM
- **Evidence**: `auth.service.spec.ts` = 2,861 LOC (>1500 FAIL threshold), `passkey.service.spec.ts` = 947 LOC (WARN zone).

#### SM-03: Function/method length
- **Verdict**: FAIL
- **Severity**: HIGH
- **Evidence**: `login()` = ~255 lines, `verifyAuthentication()` = ~131 lines, `refreshTokens()` = ~95 lines, `verifyEmailChange()` = ~87 lines. All exceed 75-line threshold.

#### SM-04: Controller method length
- **Verdict**: PASS
- **Evidence**: All controller methods ≤22 lines. Controllers are thin wrappers.

#### SM-05: Module file concentration
- **Verdict**: PASS
- **Evidence**: `auth.service.ts` = 38.6% of module LOC (under 40% threshold).

#### SM-06: Module total volume
- **Verdict**: N/A (informational)
- **Evidence**: ~3,265 production LOC across 24 files, ~7,500 test LOC across 21 spec files. Test/production ratio: 2.3x.

---

### 10b. Complexity Analysis

#### CX-01: Cyclomatic complexity
- **Verdict**: WARN
- **Severity**: MEDIUM
- **Evidence**: `login()` CC ≈ 14 (WARN zone 11-20). 14 distinct decision paths: user-not-found, locked, lock-expired, no-password, wrong-password, lockout-threshold, email-unverified, mfa-enabled, trusted-device, mfa-challenge, admin-no-mfa, impossible-travel-blocked, travel-challenged, success.

#### CX-02: Cognitive complexity
- **Verdict**: WARN
- **Severity**: MEDIUM
- **Evidence**: `login()` CogC ≈ 22 (WARN zone 16-25). Deep if-tree with 4-5 nesting levels and early-returns.

#### CX-03: Nesting depth
- **Verdict**: FAIL
- **Severity**: HIGH
- **Evidence**: `login()` reaches nesting depth 5 (MFA trust check inside mfa-enabled block inside login body). Threshold: ≤3 PASS, ≥5 FAIL.

#### CX-04: Parameter count
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: `login()` has 4 parameters (`dto`, `requestMeta`, `ctx?`, `fingerprint?`). WARN zone 4-5.

#### CX-05: Fan-out (constructor DI)
- **Verdict**: FAIL
- **Severity**: HIGH
- **Evidence**: `AuthService` injects 12 dependencies: UsersService, SessionsService, JwtService, OAuthCodeStore, AuditService, PasswordBreachService, PrismaService, MailService, TrustedDeviceService, ImpossibleTravelService, SuspiciousLoginService, TokenDenyListService. Threshold: >8 FAIL.

---

### 10c. Duplication Detection

#### DU-01: Duplicated lines % (production)
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: Estimated ~2.5-3.5% duplication. `extractRequestMeta` (8 lines × 3 files) + OAuth `authenticate()` override (20 lines × 2 files) ≈ 50 duplicated lines out of ~3,265 total.

#### DU-02: Duplicated lines % (tests)
- **Verdict**: PASS
- **Evidence**: Below 10% threshold.

#### DU-03: Largest clone block
- **Verdict**: PASS
- **Evidence**: Largest clone = 20-line OAuth `authenticate()` PKCE override (≤20 lines threshold).

#### DU-04: Cross-file clones
- **Verdict**: FAIL
- **Severity**: MEDIUM
- **Evidence**: `extractRequestMeta` identical in 3 controllers (auth, mfa, passkey). OAuth PKCE `authenticate()` override identical in google.strategy.ts and github.strategy.ts.

#### DU-05: Utility extraction candidates
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: 3 extraction candidates: (1) `extractRequestMeta` → `RequestMetaHelper`, (2) OAuth `authenticate()` → `OAuthPkceStrategy` base class, (3) `createHmac('sha256', jwtSecret).update('mfa-challenge-token')` appears in auth.service.ts and mfa.service.ts → `MfaSecretFactory`.

---

### 10d. Module Design & SOLID

#### SD-01: God class detection
- **Verdict**: FAIL
- **Severity**: HIGH
- **Evidence**: `AuthService` has 19 public methods (>18 threshold): register, login, refreshTokens, validateOAuthUser, validateOAuthLink, generateOAuthCode, exchangeOAuthCode, logout, logoutAll, generateTokensForMfa, verifyEmail, verifyEmailChange, resendVerificationEmail, resendVerificationByEmail, forgotPassword, resetPassword, validateResetToken, buildRefreshCookie, buildClearCookie.
- **Standard**: CISQ ASCMM

#### SD-02: Controller thinness
- **Verdict**: PASS
- **Evidence**: All 3 controllers follow thin wrapper pattern: extract metadata → call service → return result.

#### SD-03: Single Responsibility
- **Verdict**: WARN
- **Severity**: MEDIUM
- **Evidence**: `AuthService` covers 6 distinct domains: password auth, OAuth auth, token management, email verification, password reset, cookie management. Should be split into `PasswordAuthService`, `OAuthAuthService`, `EmailVerificationService`, `PasswordResetService`, `TokenService`.

#### SD-04: Circular dependency
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: `auth.module.ts:29` uses `forwardRef(() => UsersModule)` — circular dependency managed via forwardRef. Acceptable in NestJS but architectural smell.

#### SD-05: Interface segregation
- **Verdict**: PASS
- **Evidence**: No DTOs with >5 optional fields. All DTOs focused and minimal.

#### SD-06: Abstraction consistency
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: `AuthService` calls Prisma directly for session/email token operations (`this.prisma.emailVerificationToken`, `this.prisma.passwordResetToken`, `this.prisma.session`) — bypasses SessionsService layer for session idle-revocation.

---

### 10e. TypeScript Strictness

#### TS-01: TypeScript strict mode
- **Verdict**: WARN
- **Severity**: MEDIUM
- **Evidence**: `tsconfig.json` only enables `strictNullChecks: true`. Full `strict: true` not set. Missing: noImplicitAny, strictFunctionTypes, strictBindCallApply, strictPropertyInitialization, noImplicitThis. Project-wide issue.

#### TS-02: No `any` in production code
- **Verdict**: FAIL
- **Severity**: MEDIUM
- **Evidence**: `auth.service.ts:954` — `verificationToken.user as any` on security-critical email verification path. 22 additional `req: any` occurrences across 3 controllers (NestJS-idiomatic but could use typed interface).

#### TS-03: ESLint zero errors
- **Verdict**: N/A
- **Evidence**: ESLint could not be executed. Not verifiable.

#### TS-04: No @ts-ignore / @ts-expect-error
- **Verdict**: PASS
- **Evidence**: Zero occurrences in all auth files.

#### TS-05: No unsafe type assertions
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: `super.authenticate as Function` in both OAuth strategies (google.strategy.ts, github.strategy.ts). Required for PKCE shim but erases typing.

#### TS-06: Explicit return types on public API
- **Verdict**: PASS
- **Evidence**: All public service and controller methods have explicit return types.

---

### 10f. Code Hygiene

#### CH-01: No magic numbers
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: `900000` (15min in ms) appears inline × 2 in `auth.controller.ts:356,383` without named constant.

#### CH-02: No magic strings
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: `'Invalid credentials'` × 5 (not in ErrorMessages), `'default-dev-secret-change-in-production'` × 5 (across 5 files), `http://localhost:3001` × 4 (fallback URL), `'mfa-challenge-token'` × 2 (HMAC key).

#### CH-03: Dead code
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: 2 no-op `cleanup()` methods in OAuth stores. `TrustedDeviceService.parseDeviceName()` and `hashFingerprint()` are public but only used internally.

#### CH-04: No commented-out code
- **Verdict**: PASS
- **Evidence**: Zero commented-out code blocks. All comments are explanatory (OWASP/CWE/NIST references).

#### CH-05: No console.log in production
- **Verdict**: PASS
- **Evidence**: Zero `console.log/warn/error/debug`. All logging uses NestJS `Logger(ClassName.name)`.

#### CH-06: TODO/FIXME/HACK tracking
- **Verdict**: PASS
- **Evidence**: Zero TODO, FIXME, HACK, or XXX markers in any auth file.

#### CH-07: Naming convention consistency
- **Verdict**: PASS
- **Evidence**: Files: kebab-case. Classes: PascalCase. Methods: camelCase. Constants: UPPER_SNAKE_CASE. All consistent.

---

## Recommendations

### FAIL — Must Fix

1. **SM-01/SD-01/CX-05** (HIGH): Decompose `AuthService` (1,260 LOC, 19 public methods, 12 DI deps) into focused services: `PasswordAuthService`, `OAuthAuthService`, `EmailVerificationService`, `PasswordResetService`, `TokenService`. This resolves SM-01, SD-01, SD-03, CX-05 simultaneously.
2. **SM-03/CX-03** (HIGH): Refactor `login()` (~255 lines, nesting depth 5). Extract `handleLockout()`, `handleMfaChallenge()`, `handlePostLoginChecks()` as private helpers with early returns.
3. **DU-04** (MEDIUM): Extract `extractRequestMeta` to shared `RequestMetaHelper`. Create `OAuthPkceStrategy` abstract base class for Google/GitHub strategies.
4. **TS-02** (MEDIUM): Replace `verificationToken.user as any` with properly typed Prisma include result.

### WARN — Should Fix

5. **SM-02** (MEDIUM): Split `auth.service.spec.ts` (2,861 LOC) into domain-scoped spec files mirroring service decomposition.
6. **TS-01** (MEDIUM): Enable `strict: true` in `tsconfig.json` (project-wide improvement).
7. **CH-02** (LOW): Extract repeated magic strings to constants: `INVALID_CREDENTIALS`, `DEFAULT_DEV_JWT_SECRET`, `MFA_CHALLENGE_HMAC_KEY`, `DEFAULT_FRONTEND_URL`.
8. **CH-01** (LOW): Add `RESEND_COOLDOWN_TTL_MS` and `FORGOT_PASSWORD_TTL_MS` to `auth.constants.ts`.
9. **SD-06** (LOW): Route session/token DB operations through their respective service layers.
