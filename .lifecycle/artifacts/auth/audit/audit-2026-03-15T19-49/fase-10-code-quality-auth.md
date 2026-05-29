# Fase 10: CODE QUALITY — Auth Module

**Date**: 2026-03-15 21:00 UTC
**Module**: auth
**Auditor**: Claude Opus 4.6 (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: ISO 25010 (Maintainability), CWE-1080/1120/1121/1047, SonarQube Quality Gate, CISQ ASCMM-MNT, Clean Code, SOLID

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 17    |
| FAIL    | 2     |
| WARN    | 15    |
| N/A     | 0     |
| INFO    | 3     |

**Overall**: FAIL

---

## 10a. Structural Metrics

### SM-01: File length (production, <=300 PASS, 301-500 WARN, >500 FAIL)
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: 4 files in WARN range: `passkey.service.ts` (441), `token.service.ts` (391), `login.service.ts` (371), `mfa.service.ts` (304). No files exceed 500 lines.

### SM-02: File length (tests, <=900 PASS, 901-1500 WARN, >1500 FAIL)
- **Verdict**: PASS
- **Evidence**: All 39 test files under 900 lines. Largest: `auth-email.spec.ts` (546 lines).

### SM-03: Function/method length (<=50 PASS, 51-75 WARN, >75 FAIL)
- **Verdict**: FAIL
- **Severity**: MEDIUM
- **Evidence**: 3 functions exceed 75 lines: `verifyAuthentication()` in `passkey.service.ts` (~130 lines, L215-345), `refreshTokens()` in `token.service.ts` (~86 lines, L129-215), `verifyEmailChange()` in `email-verification.service.ts` (~89 lines, L81-169). 4 additional functions in WARN range (51-75): `login()` (67), `verifyRegistration()` (66), `trustDevice()` (58), `handleMfaLogin()` (56).
- **Standard**: CWE-1121, ESLint max-lines-per-function(50)

### SM-04: Controller method length (<=30 PASS, 31-50 WARN, >50 FAIL)
- **Verdict**: PASS
- **Evidence**: All controller methods <=30 lines. Longest: `login()` in `auth.controller.ts` (30 lines, L121-150).

### SM-05: Module file concentration (top file <=40% PASS)
- **Verdict**: PASS
- **Evidence**: Top file `passkey.service.ts` = 441/4617 = 9.6% of module. Excellent distribution post-decomposition.

### SM-06: Module total volume (INFO)
- **Verdict**: INFO
- **Evidence**: 60 production files (4,617 lines), 39 test files (9,086 lines), 1 test helper (370 lines). Total: 100 files, ~14,073 lines. Test-to-code ratio: 2.1:1 (healthy).

---

## 10b. Complexity Analysis

### CX-01: Cyclomatic complexity (<=10 PASS, 11-20 WARN, >20 FAIL)
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: 3 functions in 11-20 range: `verifyAuthentication()` CC~14, `login()` CC~12, `parseDeviceName()` CC~12. No function exceeds 20.

### CX-02: Cognitive complexity (<=15 PASS, 16-25 WARN, >25 FAIL)
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: 2 functions in 16-25 range: `verifyAuthentication()` CogC~18, `login()` CogC~16. No function exceeds 25.

### CX-03: Nesting depth (<=3 PASS, 4 WARN, >=5 FAIL)
- **Verdict**: PASS
- **Evidence**: Max nesting depth = 3 across all functions.

### CX-04: Parameter count non-DI (<=3 PASS, 4-5 WARN, >5 FAIL)
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: 4 service methods with 4 parameters: `login()`, `deletePasskey()`, `verifyRegistration()`, `trustDevice()`. None exceed 5.

### CX-05: Fan-out / constructor DI count (<=5 PASS, 6-8 WARN, >8 FAIL)
- **Verdict**: FAIL
- **Severity**: MEDIUM
- **Evidence**: 3 services exceed 8 DI dependencies: `TokenService` (10), `AuthService` (9), `LoginService` (9). `PasswordResetService` (6) and `MfaService` (6) in WARN range.
- **Standard**: CWE-1048, ISO 25010 Module Coupling

---

## 10c. Duplication Detection

### DU-01: Duplicated lines % production (<=3% PASS)
- **Verdict**: PASS
- **Evidence**: Estimated <3% duplication. Well-extracted utilities (hashToken, parseDurationMs, extractRequestMeta).

### DU-02: Duplicated lines % tests (<=10% PASS)
- **Verdict**: PASS
- **Evidence**: Test helpers centralized in `auth-test.helpers.ts` (370 lines). Low duplication.

### DU-03: Largest clone block (<=20 PASS, 21-50 WARN, >50 FAIL)
- **Verdict**: PASS
- **Evidence**: Largest clone ~20 lines (verifyEmail/verifyEmailChange token lookup pattern).

### DU-04: Cross-file clones (0 PASS, 1-3 WARN, >3 FAIL)
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: 3 cross-file clones: (1) `logAuditEvent()` identical in `login.service.ts` and `token.service.ts` (~16 lines each), (2) `setCookie()` identical in `auth.controller.ts` and `oauth.controller.ts` (3 lines), (3) `OAuthProfile` interface duplicated in `strategies/oauth-validate.helper.ts` and `common/interfaces/oauth-profile.interface.ts`.

### DU-05: Utility extraction candidates (INFO)
- **Verdict**: INFO
- **Evidence**: 4 candidates: (1) Extract shared `logAuditEvent()`, (2) Extract shared `setCookie()`, (3) Remove duplicate OAuthProfile interface, (4) Create `AuditService.logAsync()` wrapper for fire-and-forget pattern.

---

## 10d. Module Design & SOLID

### SD-01: God class detection (<=12 public PASS, 13-18 WARN, >18 FAIL)
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: `AuthService` has 16 public methods (facade pattern delegating to sub-services). All other services <=10.

### SD-02: Controller thinness
- **Verdict**: PASS
- **Evidence**: All controller methods are thin delegators. No business logic. Longest method 30 lines including decorators.

### SD-03: Service SRP (1 resp PASS, 2 WARN, >=3 FAIL)
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: `TokenService` has 2+ responsibilities: token management + security detection (impossible travel, suspicious login, new device notifications). Other services maintain single responsibility.

### SD-04: Circular dependency risk
- **Verdict**: PASS
- **Evidence**: Only `forwardRef(() => UsersModule)` — controlled resolution, standard NestJS pattern.

### SD-05: Interface segregation / DTO (<=5 optional PASS)
- **Verdict**: PASS
- **Evidence**: Max 3 optional fields in any DTO (`MfaVerifyLoginDto`).

### SD-06: Abstraction level consistency
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: `TokenService` houses security-domain logic (impossible travel, suspicious login) that belongs in a separate service.

---

## 10e. TypeScript Strictness

### TS-01: TypeScript strict mode
- **Verdict**: PASS
- **Evidence**: `tsconfig.json:21` — `"strict": true` enabled.

### TS-02: No `any` in production code (0 PASS, 1-5 WARN, >5 FAIL)
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: 1 instance: `base-oauth-auth.guard.ts:5` — `Type<any>` return type (legitimate NestJS pattern). 0 `any` in service/controller/strategy code.

### TS-03: ESLint zero errors
- **Verdict**: INFO
- **Evidence**: Cannot execute in audit context. CI pipeline enforces zero-error policy.

### TS-04: No @ts-ignore/@ts-expect-error
- **Verdict**: PASS
- **Evidence**: Zero instances in entire auth module.

### TS-05: No unsafe type assertions
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: 1 unsafe `Function` type in `pkce-authenticate.ts:16`. Remaining assertions are library-boundary casts for WebAuthn and Passport (unavoidable).

### TS-06: Return types explicit on public API
- **Verdict**: PASS
- **Evidence**: All public service methods have explicit return type annotations.

---

## 10f. Code Hygiene

### CH-01: No magic numbers
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: 7 inline magic numbers: `account.controller.ts` (4 inline rate limit values not using `AUTH_RATE_LIMITS`), `session.controller.ts:90` (inline rate limit), `password-breach.service.ts:27` (3000ms timeout), `oauth.controller.ts:251` (30_000 cookie maxAge).

### CH-02: No magic strings (same string >=3 times → WARN)
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: 6 inline error strings not in `ErrorMessages` constants: MFA admin message (`login.service.ts:299`), travel block message (`token.service.ts:355`), passkey limit (`passkey.service.ts:69`), challenge expired (`passkey.service.ts:113,224`), email already verified (`email-verification.service.ts:180`), resend cooldown (`email-verification.service.ts:194`). Note: `'Invalid credentials'` (6x in `login.service.ts`) is deliberately hardcoded for CWE-203 anti-enumeration.

### CH-03: Dead code / unreferenced exports
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: 1 unreferenced export: `PASSKEY_NAME_MAX_LENGTH` in `passkey.constants.ts`. 1 duplicate interface: `OAuthProfile` in `strategies/oauth-validate.helper.ts`.

### CH-04: Commented-out code blocks
- **Verdict**: PASS
- **Evidence**: Zero commented-out code blocks. All comments are explanatory (security rationale, OWASP/CWE references).

### CH-05: No console.log in production
- **Verdict**: PASS
- **Evidence**: Zero `console.log/warn/error/debug/info` calls. All logging uses NestJS `Logger`.

### CH-06: TODO/FIXME/HACK tracking
- **Verdict**: PASS
- **Evidence**: Zero TODO, FIXME, HACK, or XXX markers.

### CH-07: Naming convention consistency
- **Verdict**: PASS
- **Evidence**: kebab-case files, PascalCase classes, camelCase methods, SCREAMING_SNAKE_CASE constants — all consistent.

---

## Recommendations

1. **SM-03 (FAIL)**: Decompose `verifyAuthentication()` in `passkey.service.ts` (~130 lines) — extract sequential guard checks and audit logging into helper methods. Decompose `refreshTokens()` (~86 lines) and `verifyEmailChange()` (~89 lines) similarly.
2. **CX-05 (FAIL)**: Extract impossible travel, suspicious login, and new device notification logic from `TokenService` (10 DI deps) into a dedicated `LoginSecurityService`. This would also reduce `LoginService` (9) and `AuthService` (9) DI counts.
3. **DU-04 (WARN)**: Extract shared `logAuditEvent()` and `setCookie()` helpers. Remove duplicate `OAuthProfile` interface.
4. **CH-01/CH-02 (WARN)**: Extract inline rate limit values and error strings to constants.
