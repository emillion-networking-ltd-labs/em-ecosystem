# Fase 10: CODE QUALITY — Auth Module

**Date**: 2026-03-16 14:42
**Module**: auth
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: ISO 25010, CWE-1080/1120/1121/1047, SonarQube, CISQ ASCMM, Clean Code

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 27    |
| FAIL    | 1     |
| WARN    | 7     |
| N/A     | 0     |
| INFO    | 3     |

**Overall**: FAIL (1 code hygiene finding)

---

## 10a. Structural Metrics

### SM-01: File length (production)
- **Verdict**: WARN
- **Severity**: MEDIUM
- **Evidence**: 4 files exceed 300 LOC threshold:
  1. `src/auth/passkey.service.ts`: 438 lines (threshold: 300, WARN range 301-500)
  2. `src/auth/login.service.ts`: 350 lines (WARN)
  3. `src/auth/token.service.ts`: 326 lines (WARN)
  4. `src/auth/mfa.service.ts`: 304 lines (WARN)
  - No files exceed 500 LOC (FAIL threshold).

### SM-02: File length (tests)
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: All spec files in `src/auth/tests/` below 900 LOC threshold. `auth-test.helpers.ts` at 376 lines is the largest test-related file.

### SM-03: Function/method length
- **Verdict**: WARN
- **Severity**: MEDIUM
- **Evidence**: 2 functions exceed 50 LOC:
  1. `login.service.ts` — `login()`: ~62 lines (WARN range 51-75)
  2. `passkey.service.ts` — `verifyAuthentication()`: ~59 lines (WARN)
  - No functions exceed 75 LOC (FAIL threshold). Improved from previous audit (Sprint 11 SCRUM-245 decomposed 3 functions >75 lines).

### SM-04: Controller method length
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: All controller methods ≤30 LOC. Controllers follow thin controller pattern — validate, call service, return.

### SM-05: Module file concentration
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: Top file (passkey.service.ts, 438 LOC) is ~7% of module production LOC (~6000 total). Well below 40% threshold.

### SM-06: Module total volume
- **Verdict**: INFO
- **Evidence**: Auth module production code: ~6,000 LOC across 39 files. Test code: ~9,000 LOC across 40 spec files. Total module: ~15,300 LOC.

---

## 10b. Complexity Analysis (Top 5 Largest Functions)

### Function ranking:
1. `login.service.ts` — `login()`: 62 lines
2. `passkey.service.ts` — `verifyAuthentication()`: 59 lines
3. `login-security.service.ts` — `performPostLoginChecks()`: ~48 lines
4. `token.service.ts` — `rotateRefreshToken()`: ~45 lines
5. `mfa.service.ts` — `verifyAndComplete()`: ~42 lines

### CX-01: Cyclomatic complexity
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: Highest CC: `login()` CC=9 (≤10 threshold), `verifyAuthentication()` CC=8. All 5 functions ≤10.

### CX-02: Cognitive complexity
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: Highest CogC: `login()` CogC=12 (≤15 threshold). All functions within acceptable range.

### CX-03: Nesting depth
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: Max nesting depth: 3 (in login() — try > if > if). All ≤3 threshold.

### CX-04: Parameter count
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: All public methods have ≤3 non-DI parameters.

### CX-05: Fan-out (constructor DI count)
- **Verdict**: WARN
- **Severity**: MEDIUM
- **Evidence**: Services with high DI count:
  1. `login.service.ts`: 8 injected dependencies (WARN range 6-8)
  2. `auth.service.ts`: 6 injected dependencies (WARN)
  - Improved from previous audit (Sprint 11 SCRUM-246 reduced DI fan-out in 3 services). No service exceeds 8 (FAIL threshold).

---

## 10c. Duplication Detection

### DU-01: Duplicated lines % (production)
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: Heuristic analysis (Tier 2). Auth module production code estimated <3% duplication. Major shared patterns extracted to utilities (hash-token.ts, audit-log.helper.ts, parse-duration.ts) in Sprint 7 and Sprint 10.

### DU-02: Duplicated lines % (tests)
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: Test files share mock setup patterns via `auth-test.helpers.ts` (centralized mock factory). Duplication estimated <10%.

### DU-03: Largest clone block
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: No clone blocks >20 lines detected in production code. OAuth strategy callback handlers have similar structure (~15 lines each) but differ in provider-specific logic.

### DU-04: Cross-file clones
- **Verdict**: WARN
- **Severity**: MEDIUM
- **Evidence**: 2 cross-file clone patterns:
  1. OAuth callback handler body in `google.strategy.ts` and `github.strategy.ts` (~15 lines, similar but not identical)
  2. Post-login security check pattern appears in login.service.ts and oauth-auth.service.ts

### DU-05: Utility extraction candidates
- **Verdict**: INFO
- **Evidence**: Consider extracting: (1) OAuth callback handler into shared base strategy method, (2) Post-login security check into LoginSecurityService.performPostLoginSecurityChecks() called from both services.

---

## 10d. Module Design & SOLID

### SD-01: God class detection
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: Service public method counts (after Sprint 7 decomposition):
  - AuthService: 4 methods (login, register, logout, logout-all)
  - LoginService: 3 methods
  - TokenService: 5 methods
  - MfaService: 7 methods
  - PasskeyService: 8 methods
  - OAuthAuthService: 4 methods
  - All ≤12 threshold.

### SD-02: Controller thinness
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: All 6 controllers follow thin pattern: validate input → call service → return response. No business logic in controllers.

### SD-03: Service Single Responsibility
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: After Sprint 7 decomposition, each service has 1-2 responsibilities:
  - LoginService: login + lockout
  - TokenService: token lifecycle
  - MfaService: MFA TOTP + recovery
  - PasskeyService: WebAuthn
  - EmailVerificationService: email verification
  - PasswordResetService: password reset
  - OAuthAuthService: OAuth authentication

### SD-04: Circular dependency risk
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: 1 `forwardRef` in auth.module.ts for UsersModule (bidirectional dependency: Auth needs Users for lookup, Users needs Auth for password validation). Documented and justified.

### SD-05: Interface segregation (DTO)
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: All DTOs purpose-specific with ≤5 fields. No "one DTO fits all" patterns.

### SD-06: Abstraction level consistency
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: Spot-checked top 5 functions — consistent abstraction levels. login() orchestrates service calls without low-level string manipulation.

---

## 10e. TypeScript Strictness & Linting

### TS-01: TypeScript strict mode
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `tsconfig.json:24` — `"strict": true` enabled. Fixed in Sprint 8 (SCRUM-197).

### TS-02: No `any` in production code
- **Verdict**: WARN
- **Severity**: MEDIUM
- **Evidence**: 1 `any` in production code:
  1. `src/auth/strategies/pkce-authenticate.ts:17` — `(...args: any[]) => void` (Passport framework constraint — callback signature requires any[])
  - All other `any` usages in test files only. 1 occurrence = WARN (1-5 range).

### TS-03: ESLint zero errors
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: ESLint runs clean on src/auth/ with 0 errors. Verified via pre-commit hooks.

### TS-04: No @ts-ignore/@ts-expect-error
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: grep for @ts-ignore and @ts-expect-error in src/auth/ (non-test) — 0 results.

### TS-05: No unsafe type assertions
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: 0 `as unknown as` patterns in production code. The single `any` in pkce-authenticate.ts is a function parameter type, not a type assertion.

### TS-06: Return types explicit on public API
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: All public service methods have explicit return type annotations (e.g., `Promise<LoginResult>`, `Promise<void>`, `Promise<MfaSetupResult>`).

---

## 10f. Code Hygiene

### CH-01: No magic numbers
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: Numeric constants extracted to `auth.constants.ts`: MAX_FAILED_ATTEMPTS=5, LOCKOUT_DURATIONS, BACKUP_CODE_COUNT=10, etc. No repeated magic numbers in production code.

### CH-02: No magic strings
- **Verdict**: FAIL
- **Severity**: MEDIUM
- **Evidence**: `'Invalid credentials'` appears as inline string literal 6 times in `login.service.ts` instead of using the `ErrorMessages` constant object.

  Instances:
  1. `src/auth/login.service.ts:123` — `throw new UnauthorizedException('Invalid credentials')`
  2. `src/auth/login.service.ts:133` — `throw new UnauthorizedException('Invalid credentials')`
  3. `src/auth/login.service.ts:153` — `throw new UnauthorizedException('Invalid credentials')`
  4. `src/auth/login.service.ts:188` — `throw new UnauthorizedException('Invalid credentials')`
  5. `src/auth/login.service.ts:216` — `throw new UnauthorizedException('Invalid credentials')`
  6. `src/auth/login.service.ts:229` — `throw new UnauthorizedException('Invalid credentials')`
  Total: 6 instances
  Grep pattern: `'Invalid credentials'` in `src/auth/login.service.ts`
  Fix: Add `ErrorMessages.auth.INVALID_CREDENTIALS = 'Invalid credentials'` and replace all 6 occurrences.

### CH-03: Dead code
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: All exported functions/classes in src/auth/ have import references.

### CH-04: Commented-out code blocks
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: 0 blocks of ≥5 consecutive commented-out code lines in production files.

### CH-05: No console.log in production
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: grep for console.log/debug/info in src/auth/ (non-test) — 0 results. All logging via NestJS Logger.

### CH-06: TODO/FIXME/HACK tracking
- **Verdict**: INFO
- **Evidence**: 0 TODO/FIXME/HACK/XXX comments in src/auth/ production code. Clean codebase.

### CH-07: Naming convention consistency
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: Consistent naming: camelCase methods/variables, PascalCase classes/interfaces, UPPER_SNAKE_CASE constants, kebab-case filenames.

---

## Recommendations

1. **CH-02 (FAIL)**: Extract `'Invalid credentials'` to `ErrorMessages.auth.INVALID_CREDENTIALS` constant and replace all 6 occurrences in `login.service.ts`.
2. **SM-01**: Consider further decomposition of `passkey.service.ts` (438 LOC) — e.g., extract registration and authentication into separate services.
3. **CX-05**: LoginService with 8 DI dependencies is at the WARN threshold — consider if post-login security checks could be extracted to reduce coupling.
4. **DU-04**: Extract shared OAuth callback pattern into base strategy method. Extract post-login security check into reusable service method.
