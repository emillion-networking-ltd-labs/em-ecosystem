# Phase 10: CODE QUALITY — Auth Module

**Date**: 2026-03-16
**Module**: auth
**Standards**: CWE-1121, ISO 25010 Maintainability, ESLint, CWE-1048
**Framework version**: audit-standards.mdc v6

## Summary

| Verdict | Count |
|---------|-------|
| PASS | 19 |
| FAIL | 1 |
| WARN | 14 |
| INFO | 3 |

**Overall**: FAIL (1 finding)

## Recurrence Analysis (vs audit-2026-03-15T19-49)

| Finding | Previous | Current | Delta |
|---------|----------|---------|-------|
| SM-03 | FAIL | FAIL | Stable — same 3 functions >75 lines |
| CX-05 | FAIL | WARN | **Improved** — LoginSecurityService extraction reduced max DI from 10→8 |
| SD-03 | WARN | PASS | **Improved** — TokenService SRP restored |
| SD-06 | WARN | PASS | **Improved** — abstraction level consistent |
| CH-03 | WARN | PASS | **Improved** — dead exports cleaned |
| DU-04 | WARN | WARN | Improved — reduced from 3→2 cross-file clones |

**Delta summary**: 4 improvements, 0 regressions. 1 previous FAIL resolved (CX-05→WARN). 1 FAIL persists (SM-03).

---

## 10a: Structural Metrics

### SM-01: File Length (Production) — WARN (LOW)
- **Evidence**: 4 files in WARN range (301-500 lines): `passkey.service.ts` (419), `login.service.ts` (351), `token.service.ts` (313), `mfa.service.ts` (304). None exceed 500
- **Standard**: CWE-1121

### SM-02: File Length (Tests) — PASS
- **Evidence**: All test files under 900 lines (threshold x3)

### SM-03: Function/Method Length — FAIL (MEDIUM)
- **Evidence**: 3 functions exceed 75 lines:
  - `verifyAuthentication()` in `passkey.service.ts` (lines 218-314, ~96 lines)
  - `refreshTokens()` in `token.service.ts` (lines 119-202, ~83 lines)
  - `verifyEmailChange()` in `email-verification.service.ts` (lines 81-169, ~88 lines)
- 4 functions in WARN range (51-75): `login()` (~66), `verifyRegistration()` (~58), `trustDevice()` (~58), `validateCredentials()` (~55)
- **Standard**: CWE-1121, ESLint max-lines-per-function(50)
- **Recommendation**: Extract sequential guard checks into helper methods

### SM-04: Controller Method Length — PASS
- **Evidence**: All controller methods ≤30 lines

### SM-05: Module File Concentration — PASS
- **Evidence**: Top file `passkey.service.ts` = 419/~4600 = ~9.1%

### SM-06: Module Total Volume — INFO
- **Evidence**: Production: ~60 files, ~4,600 lines. Tests: ~39 files, ~9,000 lines. Test-to-code ratio: ~2:1

---

## 10b: Complexity Analysis

### CX-01: Cyclomatic Complexity — WARN (LOW)
- **Evidence**: 3 functions in 11-20 range: `verifyAuthentication()` CC~14, `login()` CC~12, `parseDeviceName()` CC~12. None exceed 20

### CX-02: Cognitive Complexity — WARN (LOW)
- **Evidence**: 2 functions in 16-25 range: `verifyAuthentication()` CogC~18, `login()` CogC~16. None exceed 25

### CX-03: Nesting Depth — PASS
- **Evidence**: Max nesting depth = 3

### CX-04: Parameter Count (non-DI) — WARN (LOW)
- **Evidence**: 4 service methods with 4 parameters. None exceed 5

### CX-05: Fan-Out / Constructor DI Count — WARN (MEDIUM)
- **Evidence**: Improved from FAIL. After LoginSecurityService extraction:
  - `LoginService`: 8 DI deps (was 9)
  - `TokenService`: 7 DI deps (was 10)
  - `PasswordResetService`: 6 DI deps
  - `MfaService`: 6 DI deps
  - `AuthService`: 5 DI deps (was 9, now pure facade)
  - `LoginSecurityService`: 5 DI deps (new)
  - No service exceeds 8 (FAIL threshold)
- **Standard**: CWE-1048, ISO 25010 Module Coupling

---

## 10c: Duplication Detection

### DU-01: Duplicated Lines % (Production) — PASS
- **Evidence**: Estimated <3%. Well-extracted utilities

### DU-02: Duplicated Lines % (Tests) — PASS
- **Evidence**: Test helpers centralized in `auth-test.helpers.ts`

### DU-03: Largest Clone Block — PASS
- **Evidence**: Largest clone ~20 lines (token lookup pattern in email-verification.service.ts)

### DU-04: Cross-File Clones — WARN (LOW)
- **Evidence**: 2 cross-file clones (down from 3):
  1. `setCookie()` identical in `auth.controller.ts:59` and `oauth.controller.ts:47`
  2. `createAuditLogger` initialization pattern (4 call sites — correct factoring)
- Previous clone #3 (duplicate `OAuthProfile`) cleaned up

### DU-05: Utility Extraction Candidates — INFO
- **Evidence**: 1 candidate: extract shared `setCookie()` helper

---

## 10d: Module Design & SOLID

### SD-01: God Class Detection — WARN (LOW)
- **Evidence**: `AuthService` has 16 public methods (facade pattern). All other services ≤10

### SD-02: Controller Thinness — PASS
- **Evidence**: All controller methods are thin delegators

### SD-03: Service SRP — PASS (improved from WARN)
- **Evidence**: TokenService now single responsibility. Security logic extracted to LoginSecurityService

### SD-04: Circular Dependency Risk — PASS
- **Evidence**: Only `forwardRef(() => UsersModule)` — controlled, standard NestJS pattern

### SD-05: Interface Segregation / DTO — PASS
- **Evidence**: Max 3 optional fields in any DTO

### SD-06: Abstraction Level Consistency — PASS (improved from WARN)
- **Evidence**: All services operate at consistent abstraction levels

---

## 10e: TypeScript Strictness

### TS-01: strict: true — PASS
- **Evidence**: `tsconfig.json:21` — `"strict": true`

### TS-02: No `any` in Production — WARN (LOW)
- **Evidence**: 1 instance: `base-oauth-auth.guard.ts:5` — `Type<any>` (NestJS framework pattern). Accepted risk (RA-03)

### TS-03: ESLint Zero Errors — INFO
- **Evidence**: CI pipeline enforces zero-error policy

### TS-04: No @ts-ignore — PASS
- **Evidence**: Zero instances in auth module

### TS-05: No Unsafe Type Assertions — WARN (LOW)
- **Evidence**: 1 `Function` type in `pkce-authenticate.ts:16`. Remaining are library-boundary casts (unavoidable)

### TS-06: Return Types Explicit — PASS
- **Evidence**: All public service methods have explicit return types

---

## 10f: Code Hygiene

### CH-01: No Magic Numbers — WARN (LOW)
- **Evidence**: 2 inline values in `account.controller.ts` (lines 94, 119): `{ ttl: 900000, limit: 3 }`. 1 in `oauth.controller.ts:251` (`30_000`)

### CH-02: No Magic Strings — WARN (LOW)
- **Evidence**: Improved — many strings moved to ErrorMessages. Remaining: inline travel block message in `login-security.service.ts:61`. `'Invalid credentials'` (6x) deliberately hardcoded for CWE-203

### CH-03: Dead Code / Unreferenced Exports — PASS (improved from WARN)
- **Evidence**: Previous dead exports cleaned up. All current exports referenced

### CH-04: Commented-Out Code — PASS
- **Evidence**: Zero commented-out code blocks

### CH-05: No console.log — PASS
- **Evidence**: Zero console.log calls. All logging via NestJS Logger

### CH-06: TODO/FIXME/HACK — PASS
- **Evidence**: Zero markers

### CH-07: Naming Convention — PASS
- **Evidence**: Consistent kebab-case files, PascalCase classes, camelCase methods, SCREAMING_SNAKE_CASE constants

---

## Recommendations

1. **SM-03 (FAIL)**: Decompose 3 functions >75 lines: `verifyAuthentication()`, `refreshTokens()`, `verifyEmailChange()`. Extract sequential guard checks into helper methods
2. **CX-05 (WARN)**: Consider further decomposition of `LoginService` (8 DI deps)
3. **DU-04 (WARN)**: Extract shared `setCookie()` helper from 2 controllers
4. **CH-01/CH-02 (WARN)**: Extract inline rate limit values and remaining error string to constants

---
*Generated: 2026-03-16 | Auditor: Claude (automated) | Standards: CWE-1121, ISO 25010, CWE-1048, ESLint*
