# Phase 10 — Code Quality (auth module)

- **Date**: 2026-05-06 22:44 UTC
- **Module**: `auth` (`em-ecosystem-code/nexacore-api/src/auth/`)
- **Standards**: ISO 25010 (Maintainability), CWE-1080 / CWE-1120 / CWE-1121 / CWE-1047, SonarQube Quality Gate, CISQ ASCMM-MNT-19, Clean Code (R.C. Martin), ESLint defaults, SOLID
- **Two-tier verification**: Tier 1 = deterministic CLI (`wc -l`, `jscpd`, `eslint`, `grep`); Tier 2 = heuristic code reading
- **Sub-phases**: 10a Structural · 10b Complexity · 10c Duplication · 10d SOLID · 10e TS Strictness · 10f Hygiene
- **Previous baseline**: 2026-03-17 — Phase 10 PASS-clean with WARN around large `auth.service.ts`. Since then `auth.service.ts` was refactored to a 184-line facade and orchestration logic split into `login.service.ts`, `token.service.ts`, `oauth-auth.service.ts`, `email-verification.service.ts`, `password-reset.service.ts`, `login-security.service.ts`, etc.

---

## 10a. Structural Metrics (ISO 25010 Analysability, CWE-1080)

Tier 1 — `wc -l` on `src/auth/**/*.ts`.

| ID | Check | Verdict | Evidence |
|----|-------|---------|----------|
| SM-01 | File length (production, ≤300 PASS / 301-500 WARN / >500 FAIL) | **WARN** | 5 files in 301-500 band (see below); 0 files >500 |
| SM-02 | File length (tests, ≤900 / 1500) | **PASS** | Largest spec: `trusted-device.service.spec.ts` 695 lines (≤900) |
| SM-03 | Function/method length (≤50 PASS / 75 WARN / >75 FAIL) | **WARN** | 1 function 65 lines (`passkey.service.ts:212 verifyAuthentication`); 1 of 60 lines (`generateRegOptions`); 1 of 52 lines (`email-verification.service.ts:37 verifyEmail`); rest ≤43 |
| SM-04 | Controller method length (≤30 PASS / 50 WARN / >50 FAIL) | **PASS** | All controller handlers ≤15 lines (largest: `oauth.controller.ts:264 getValidatedFrontendUrl` 15 lines) |
| SM-05 | Module file concentration (top file ≤40% of module LOC) | **PASS** | Largest production file `passkey.service.ts` = 467 / ~5 844 LOC ≈ 8.0% |
| SM-06 | Module total volume (INFO) | **INFO** | Production `.ts` (excl. `tests/`): ~5 844 LOC across 64 files. Tests: 11 622 LOC across 43 spec files. Combined: 17 466 LOC. |

### Production files in WARN band (301–500 lines)

| File | LOC | Severity |
|------|-----|----------|
| `passkey.service.ts` | 467 | WARN (close to threshold) |
| `login.service.ts` | 416 | WARN |
| `token.service.ts` | 393 | WARN |
| `trusted-device.service.ts` | 307 | WARN (just over) |
| `mfa.service.ts` | 304 | WARN (just over) |

Note: previous audit (2026-03-17) flagged a single 600+ line `auth.service.ts`. That has been refactored to 184 lines (facade) and concerns split across services — improvement, but several specialised services have grown into the 300-500 WARN band.

### Function-length WARNs

| Function | File:line | Lines | Verdict |
|----------|-----------|-------|---------|
| `verifyAuthentication` | `passkey.service.ts:212` | 65 | WARN (51-75 band) |
| `generateRegOptions` | `passkey.service.ts:66` | 60 | WARN |
| `verifyEmail` | `email-verification.service.ts:37` | 52 | WARN |
| `completeTrustedDeviceLogin` | `login.service.ts:308` | 43 | PASS |
| `handleLoginSuccess` | `login.service.ts:374` | 42 | PASS |

---

## 10b. Complexity Analysis (CWE-1120/1121, SonarQube)

Tier 2 — applied to the **5 largest production functions** identified in SM-03.

| Function | CC (CX-01) | CogC (CX-02) | Nesting (CX-03) | Verdict |
|----------|-----------|--------------|-----------------|---------|
| `passkey.service.ts:212 verifyAuthentication` (65 lines) | ~7 (4 `if`, 1 `try/catch`, 1 nested `if`) | ~9 | 2 | PASS |
| `passkey.service.ts:66 generateRegOptions` (60 lines) | ~6 (3 `if`, 1 map cb, 1 nested) | ~7 | 2 | PASS |
| `email-verification.service.ts:37 verifyEmail` (52 lines) | ~7 (5 `if`, 1 nested `if`, 1 `&&`) | ~10 | 2 | PASS |
| `login.service.ts:308 completeTrustedDeviceLogin` (43 lines) | ~4 (2 `if`, 1 `&&`) | ~5 | 2 | PASS |
| `login.service.ts:374 handleLoginSuccess` (42 lines) | ~6 (3 `if` nested, 1 `&&`) | ~10 | 3 | PASS (=threshold) |

| ID | Check | Verdict | Evidence |
|----|-------|---------|----------|
| CX-01 | Cyclomatic complexity (≤10 / 20) | **PASS** | Max CC ≈ 7 — all five well under threshold |
| CX-02 | Cognitive complexity (≤15 / 25) | **PASS** | Max CogC ≈ 10 |
| CX-03 | Nesting depth (≤3 / ≥5) | **PASS** | Max depth 3 (`handleLoginSuccess`) |
| CX-04 | Parameter count non-DI (≤3 / 5) | **PASS** | Public service methods stay ≤4 params; non-DI handler params ≤3 in controllers (DTO + Req + Res). |
| CX-05 | Constructor DI count (≤5 / 8) | **WARN** | 4 services in 6-8 band: `token.service.ts` 7 DI, `login.service.ts` 6, `mfa.service.ts` 6, `password-reset.service.ts` 6. Others ≤5 = PASS. |

`token.service.ts` at 7 DI deps is the ceiling of the WARN band; consider extracting cookie-config or signer concerns if it grows.

---

## 10c. Duplication Detection (SonarQube QG, CISQ ASCMM-MNT-19)

Tier 1 — `npx jscpd src/auth/ --min-lines 5 --min-tokens 50 --reporters json --ignore "**/*.spec.ts"`.

| ID | Check | Verdict | Evidence |
|----|-------|---------|----------|
| DU-01 | Production duplication % (≤3 / 5) | **WARN** | jscpd: **4.23%** lines, 3.96% tokens (260 dup lines / 6 153 total, 19 clones) — within 3.1-5% WARN band |
| DU-02 | Test duplication % | **INFO** | not measured this run (specs ignored); previous baseline reported 8% |
| DU-03 | Largest clone block (≤20 / ≤50) | **WARN** | 27-line clone: `strategies/github.strategy.ts ↔ strategies/google.strategy.ts` (OAuth strategy boilerplate). Second-largest 26 lines: `login.service.ts ↔ token.service.ts` (token-issuance flow) |
| DU-04 | Cross-file clones (0 / 1-3 / >3) | **FAIL** | **11 cross-file clones** out of 19 total |
| DU-05 | Utility extraction candidates (Tier 2) | **WARN** | See below |

### Notable clones (extraction candidates)

1. `github.strategy.ts ↔ google.strategy.ts` (27 lines, OAuth strategy class shape) — already factored partially via `base-oauth-auth.guard.ts` and `oauth-validate.helper.ts`; remaining drift is constructor + `validate()` skeleton. Could move to a shared `BaseOAuthStrategy` (Tier 2).
2. `login.service.ts:323-348 ↔ token.service.ts:198-223` (26 lines, token+cookie issuance) — strong candidate for a `tokenService.issueAuthSession()` helper to centralise.
3. `mfa.controller.ts:50 / :67 / :130 / :153 ↔ passkey.controller.ts:169` (4× ~10-line clones, MFA challenge response shaping) — extract a `respondMfaChallenge(res, payload)` helper or move to a service.
4. `auth.controller.ts:201-211 ↔ session.controller.ts:151-161` (10 lines, session-revoke flow) — minor.
5. `account.controller.ts:117-127 ↔ account.controller.ts:89-100` (10 lines, internal duplicate within the same controller — within-file extraction).

---

## 10d. Module Design & SOLID (ISO 25010 Modularity)

| ID | Check | Verdict | Evidence |
|----|-------|---------|----------|
| SD-01 | God class (≤12 public methods) | **WARN** | `auth.service.ts` exposes 20 public methods, BUT all are 1-line delegations to 5 collaborator services (facade pattern, intentional). `token.service.ts` 11 (PASS, ≤12). `trusted-device.service.ts` 10. Treat `AuthService` as facade — recommend explicit JSDoc tag and consider downsizing the API surface. |
| SD-02 | Controller thinness (no business logic) | **PASS** | All controller methods sampled (auth, mfa, passkey, session, account, oauth) read as input-validate → service-call → response. Largest is `oauth.controller.ts:264 getValidatedFrontendUrl` (15 lines, URL allow-list parsing — borderline but justifiable). |
| SD-03 | Service Single Responsibility | **PASS** | Module follows split-by-responsibility model: login, token, oauth-auth, email-verification, password-reset, login-security, mfa, passkey, trusted-device, password-breach, token-deny-list. Each service owns one domain concern. `auth.service.ts` (facade) re-exports — does not violate SRP because it holds zero domain logic. |
| SD-04 | Circular dependency (forwardRef) | **WARN** | 1 `forwardRef` in `auth.module.ts` for `UsersModule` and `SessionsModule` (cross-module, with explanatory comment). 1 in `trusted-device.service.ts` (cross-module via UsersService, comment present). No intra-module circular deps. WARN reflects existence of `forwardRef`s but they are documented. |
| SD-05 | DTO interface segregation (>10 optional fields = FAIL) | **PASS** | All DTOs ≤21 lines; max optional field count observed: `trust-device.dto.ts` (~3 optional). No fat DTOs. |
| SD-06 | Abstraction-level consistency (5 largest functions) | **PASS** | All five sampled functions stay at single abstraction level: orchestration calls + early returns. No mix of low-level string/byte manipulation with orchestration. |

---

## 10e. TypeScript Strictness & Linting

| ID | Check | Verdict | Evidence |
|----|-------|---------|----------|
| TS-01 | tsconfig strict mode | **PASS** | `tsconfig.json` line 19: `"strict": true` |
| TS-02 | No `: any` / `as any` / `<any>` in production | **WARN** | 3 production occurrences: `passkey.service.ts:43, 386, 419` (`as unknown as <SimpleWebAuthn types>`), `base-oauth-auth.guard.ts:5` (`Type<any>` factory return), `pkce-authenticate.ts:17` (`(...args: any[])` Passport callback signature). All are interop with untyped third-party APIs (SimpleWebAuthn, Passport). 5 occurrences total, 1-5 band → WARN |
| TS-03 | ESLint errors = 0 | **FAIL** | **29 errors in production code** (127 across module incl. tests). Top rules: `no-unsafe-assignment` 11, `no-unsafe-member-access` 11, `no-unsafe-call` 1, `no-unsafe-return` 1, `no-misused-promises` 2, `unbound-method` 2, `no-unused-vars` 1. Files: oauth-callback.filter.ts (6), guards/mfa-setup.guard.ts (4), guards/oauth-link.guard.ts (4), strategies/github.strategy.ts (2), strategies/google.strategy.ts (2), and 11 more files with 1-2 errors each. |
| TS-04 | No `@ts-ignore` / `@ts-expect-error` | **PASS** | 0 occurrences in production OR tests |
| TS-05 | Unsafe assertions (`as unknown as`, `as any`, `<any>`) | **WARN** | 7 in production (3 in `passkey.service.ts`, 1 each in `base-oauth-auth.guard.ts`, `pkce-authenticate.ts`, `google.strategy.ts:43`, `github.strategy.ts:43`). All bridge external library types — minimal but worth tracking. |
| TS-06 | Explicit return types on public methods (sample 5 services) | **PASS** | Sampled `auth.service.ts`, `login.service.ts`, `token.service.ts`, `passkey.service.ts`, `mfa.service.ts` — every public method has explicit `Promise<…>` or value return type annotation. |

---

## 10f. Code Hygiene (Clean Code, CWE-1006)

| ID | Check | Verdict | Evidence |
|----|-------|---------|----------|
| CH-01 | No magic numbers | **PASS** | Numeric constants extracted to `constants/auth.constants.ts` (174 lines) and `constants/passkey.constants.ts`. Spot-checked services — TTLs, retry counts, lockout windows all named. |
| CH-02 | No magic strings | **PASS** | Error messages centralised in `ErrorMessages` constant. Audit actions use `AuditAction` enum. Cookie names / Redis key prefixes constants. |
| CH-03 | Dead code (unreferenced exports) | **PASS** | Tier-2 sample: re-exported types in `auth.service.ts` (CookieConfig, AuthResult, …) all referenced by controllers. No orphan exports observed. |
| CH-04 | Commented-out code blocks (≥5 consecutive) | **PASS** | grep finds only single-line explanatory comments ("// SCRUM-XXX:", "// Cross-flow guard"); no commented-out code blocks |
| CH-05 | No `console.log` / `console.debug` / `console.info` in production | **PASS** | grep `console\.(log\|debug\|info)` — 0 matches in `src/auth/**/*.ts` excluding spec files |
| CH-06 | TODO/FIXME/HACK count (INFO) | **PASS** | grep `TODO\|FIXME\|HACK\|XXX` — 0 matches (entire module clean) |
| CH-07 | Naming conventions (5 file sample) | **PASS** | Sampled `login.service.ts`, `passkey.service.ts`, `auth.controller.ts`, `oauth-callback.filter.ts`, `auth.module.ts`. camelCase methods/vars, PascalCase classes/interfaces/enums, UPPER_SNAKE_CASE constants, kebab-case filenames — consistent. |

---

## Summary

| Sub-phase | PASS | WARN | FAIL | Notes |
|-----------|------|------|------|-------|
| 10a Structural Metrics | 3 | 3 | 0 | 5 production files in 301-500 WARN band (passkey, login, token, trusted-device, mfa); 3 functions >50 lines |
| 10b Complexity | 4 | 1 | 0 | All 5 sampled functions PASS CC/CogC/nesting; constructor DI WARN (4 services in 6-8 band, max 7) |
| 10c Duplication | 0 | 4 | 1 | jscpd 4.23% (WARN), 27-line max clone (WARN), **11 cross-file clones (FAIL)** |
| 10d SOLID | 4 | 2 | 0 | AuthService 20 public methods (intentional facade); 1 documented `forwardRef` for cross-module cycles |
| 10e TS Strictness | 3 | 2 | 1 | strict:true ✓; **29 ESLint production errors (FAIL)**; 5 production `any`/unsafe-cast (WARN) |
| 10f Hygiene | 7 | 0 | 0 | Clean: 0 console, 0 TODO, 0 magic numbers/strings, 0 dead code |
| **Total** | **21** | **12** | **2** | |

### FAILs (2)

1. **DU-04 — Cross-file clones**: 11 cross-file clones (>3 threshold). Top extractions:
   - `github.strategy.ts ↔ google.strategy.ts` — OAuth strategy boilerplate (27 lines).
   - `login.service.ts ↔ token.service.ts` — token+cookie issuance (26 lines) → extract `tokenService.issueAuthSession()`.
   - 4 controller-level MFA challenge response duplicates → extract `respondMfaChallenge()` helper.
2. **TS-03 — ESLint zero errors**: 29 production errors (no-unsafe-* family from `@typescript-eslint`). Concentrated in OAuth glue (`oauth-callback.filter.ts` 6, `mfa-setup.guard.ts` 4, `oauth-link.guard.ts` 4, OAuth strategies 4) and reflect Passport / SimpleWebAuthn untyped surfaces. Remediation = type the third-party boundaries (Passport request augmentation, OAuth profile interface) rather than blanket disable.

### WARNs (12)

- SM-01 file length: 5 production files 304-467 lines (passkey/login/token/trusted-device/mfa.service)
- SM-03 function length: `verifyAuthentication` 65, `generateRegOptions` 60, `verifyEmail` 52
- CX-05 constructor DI: token.service 7 deps; login/mfa/password-reset 6 each
- DU-01 duplication: 4.23%
- DU-03 largest clone block: 27 lines
- DU-05 utility extraction: 5 candidate clusters (see 10c)
- SD-01 god-class: AuthService 20 methods (facade — accept-with-doc)
- SD-04 forwardRef: 2 documented cross-module forwardRefs (Users / Sessions / TrustedDevice)
- TS-02 `any` in production: 5 occurrences (third-party interop)
- TS-05 unsafe casts: 7 occurrences (third-party interop)

### Recommendations

1. **TS-03 (highest priority)** — type the Passport/WebAuthn integration boundaries to drop the 29 `no-unsafe-*` errors. Add a typed `RequestWithUser` augmentation and a typed `OAuthProfile`. This also resolves several WARN entries (TS-02, TS-05).
2. **DU-04** — Extract `tokenService.issueAuthSession(user, requestMeta)` to absorb the 26-line login↔token clone, and a `respondMfaChallenge(res, payload)` controller helper to absorb 4 MFA controller clones. These two extractions alone retire the bulk of cross-file duplication.
3. **SM-01 / SM-03** — Keep an eye on `passkey.service.ts` (467) and `login.service.ts` (416). `verifyAuthentication` (65 lines) is a candidate for extracting `verifyOrFail()` and `loadCredentialOrFail()` private helpers.
4. **CX-05** — `token.service.ts` at 7 DI deps is at the ceiling. If you add another collaborator, split cookie/CSRF concerns into a `CookieService`.
5. **SD-01** — Consider tagging `AuthService` JSDoc with `@facade` and trimming any methods now only used internally to the auth module (verify usage from outside the module first).

### Delta vs 2026-03-17 baseline

- **Improved**: monolithic `auth.service.ts` (was the standing WARN) refactored to 184-line facade. SRP and SD-03 now PASS module-wide.
- **New WARN**: 5 specialised services entered the 301-500 WARN band as logic was split out — expected side effect.
- **New FAIL**: ESLint 29 production errors (TS-03) — likely surfaced by stricter `@typescript-eslint` ruleset added since the previous audit, or by code added in SCRUM-281/283/284 + passkey/MFA expansion. Recurrence-analysis: this is a **regression vs the prior 0-FAIL baseline (2026-03-17)** and must be remediated before claiming a 0-FAIL audit.
- **DU-04** cross-file clones FAIL is also new — driven by passkey/MFA controller surface growth.

Phase 10 verdict: **2 FAIL / 12 WARN** — module is structurally sound (clean SOLID, strict TS, zero hygiene defects, low complexity) but has accumulated typed-interop debt (TS-03) and controller/strategy duplication (DU-04) since the last clean baseline.
