# Recurrence Analysis — Auth Module Audit 2026-03-15

**Current audit**: `audit-2026-03-15T19-49`
**Previous audit**: `audit-2026-03-13T17-30`
**Delta period**: 2 days (March 13–15, 2026)

---

## Previous Audit FAIL Findings — Remediation Status

| # | Check ID | Previous Finding | Previous Severity | Current Status | Classification |
|---|----------|-----------------|-------------------|----------------|---------------|
| 1 | B-01 | `nest build` not verified | CRITICAL | **RESOLVED** — Now PASS. Build verified with exit code 0 | Remediated (SCRUM-215) |
| 2 | T-07 | 3 untested exports (hash-token, pkce-authenticate, oauth-validate.helper) | MEDIUM | **RESOLVED** — Now PASS. All public APIs have specs | Remediated (SCRUM-216) |
| 3 | EM-02 | Login status code leaks verification state (403 vs 401) | HIGH | **RESOLVED** — Now PASS. All login failures return 401 "Invalid credentials" | Remediated (SCRUM-217) |
| 4 | V8.3.1 | JWT in query param for OAuth link | HIGH | **RESOLVED** — Now PASS. OAuth link flow uses short-lived linking code | Remediated (SCRUM-218) |
| 5 | EM-06 | Guard error messages reveal which guard rejected | MEDIUM | **RESOLVED** — Now PASS. Both guards use "Access denied" | Remediated (SCRUM-219) |
| 6 | V8.3.4 | Sensitive Prisma fields undocumented | MEDIUM | **RESOLVED** — Now PASS. `/// @sensitive` comments added | Remediated (SCRUM-220) |
| 7 | V8.3.7 | DATABASE_URL lacks sslmode=require | HIGH | **RESOLVED** — Now PASS. `sslmode=require` in .env.example, validated at startup | Remediated (SCRUM-221) |
| 8 | D-11 | Token models lack updatedAt | MEDIUM | **RESOLVED** — Now PASS. Migrations added for all mutable models | Remediated (SCRUM-222) |
| 9 | I-10 | token.service.ts uses process.env directly | HIGH | **RESOLVED** — Now PASS. All ConfigService | Remediated (SCRUM-223) |

**Result**: 9/9 previous FAIL findings remediated. Zero regressions.

---

## Previous Audit WARN Findings — Status

| Check ID | Previous Finding | Current Status | Classification |
|----------|-----------------|----------------|---------------|
| T-02–T-06 | Coverage tooling broken (Jest 30) | **RECURRENT** — Still FAIL (T-02/T-03). Same root cause: Istanbul/Jest 30 incompatibility | RECURRENT |
| V2.10.1 | Dev fallback secrets | **RESOLVED** — Not flagged in current audit (mitigated by production validation) | Remediated |
| W-03 | MFA message reveals admin role | **RECURRENT** — Still WARN (EM-03). Same message exists | RECURRENT |
| W-04 | Email PII in audit logs | **RECURRENT** — Still WARN (V7.1.2). Email logged in mail.service.ts | RECURRENT |
| EM-08 | Feature state disclosure | **RECURRENT** — Still WARN. Passkey limit, OAuth-only state | RECURRENT |
| EM-09 | Token lifecycle messages vary | **IMPROVED** — Now partially consolidated but still WARN (EM-10) | RECURRENT (improved) |
| EM-10 | Error message variants | **RECURRENT** — Still WARN. Inline strings not fully centralized | RECURRENT |
| D-07/D-08 | Migration integrity | **RESOLVED** — 18 migrations verified, schema validation PASS | Remediated |
| I-07 | Stale integration-state.md mock table | **NEW FINDING** — I-06 found stale OAuthAuthService dependency in integration-state.md | SCOPE CHANGE |
| DEP-07 | npm ci not verified | **RESOLVED** — Now PASS. All workflows use npm ci | Remediated |
| FE-25 | Frontend password validation mismatch | **RESOLVED** — Now PASS. lib/validation.ts matches backend DTOs | Remediated |
| FE-26 | A11y gaps in MFA forms | **RECURRENT** — Still WARN. 4 minor gaps remain | RECURRENT |
| SM-01/SM-03 | Long files/functions | **IMPROVED** — No files >500 (was 2 FAIL). 3 functions still >75 lines | RECURRENT (improved) |
| DU-01/DU-03 | Code duplication | **IMPROVED** — DU-01 now PASS (<3%). DU-04 WARN (3 cross-file clones) | RECURRENT (improved) |
| CH-02 | Magic strings | **IMPROVED** — Many consolidated to constants. 6 inline strings remain | RECURRENT (improved) |

---

## New Findings in Current Audit (not in previous)

| Check ID | Phase | Severity | Classification | Details |
|----------|-------|----------|---------------|---------|
| A-07 | 4 | MEDIUM | NEWLY DISCOVERED | `POST /auth/mfa/setup` missing `@HttpCode(HttpStatus.OK)` — returns 201 instead of spec-documented 200 |
| I-06 | 6 | HIGH | NEWLY DISCOVERED | Stale `integration-state.md` entry (OAuthAuthService lists ImpossibleTravelService not in constructor) + implicit GeolocationModule dependency via @Global() |
| CX-05 | 10 | MEDIUM | NEWLY DISCOVERED | 3 services exceed 8 DI dependencies (TokenService:10, AuthService:9, LoginService:9) — post-decomposition assessment |

---

## Statistics Comparison

| Metric | Previous (2026-03-13) | Current (2026-03-15) | Delta |
|--------|----------------------|---------------------|-------|
| Total checks | ~258 | ~258 | — |
| PASS | ~273 | 236 | Normalized counting |
| FAIL | 9 | 7 | **-2 (improvement)** |
| WARN | ~33 | 37 | +4 (more thorough sub-checks) |
| Tests passing | 463 (31 suites) | 490 (39 suites) | **+27 tests, +8 suites** |
| Coverage | Not measurable | Not measurable | No change |
| Security FAIL | 5 | 0 | **-5 (all remediated)** |
| Code quality FAIL | 0 (WARN only) | 2 | +2 (SM-03, CX-05 now measured more strictly) |

---

## Key Observations

1. **All 9 previous FAIL findings remediated** — Sprint 10 (SCRUM-215 through SCRUM-235) successfully addressed every corrective action from the March 13 audit.

2. **Zero security FAILs** — The most critical improvement. All 5 security FAIL findings (EM-02, V8.3.1, EM-06, V8.3.4, V8.3.7) are now PASS.

3. **6 recurrent WARNs** — T-02 (coverage tooling), W-03 (admin disclosure), W-04 (PII in logs), EM-08/10 (error messages), FE-26 (a11y) persist from previous audit. These are tracked in Sprint 10 tickets (SCRUM-224-235).

4. **3 newly discovered findings** — A-07 (HTTP status code mismatch), I-06 (stale integration docs), CX-05 (high DI fan-out) are new observations from more thorough Phase 4/6/10 analysis.

5. **Test suite growth** — 27 additional tests and 8 new test suites added since previous audit, reflecting the remediation work in Sprint 10.
