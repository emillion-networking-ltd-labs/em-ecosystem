# Auth Module — Full Audit Completion Report

**Date**: 2026-05-06 22:44 UTC
**Module**: auth
**Auditor**: Claude (automated, multi-agent)
**Framework**: audit-standards.mdc v1.0
**Previous baseline**: audit-2026-03-29T21-35 (205 PASS / 16 WARN / 2 FAIL — 92.8% score, both FAILs LOW severity)

---

## 11.1 Summary Dashboard

| Phase | Checks | PASS | WARN | FAIL | Score |
|-------|--------|------|------|------|-------|
| 1. Build | 8 | 7 | 1 | 0 | 87.5% |
| 2. Tests | 14 | 12 | 2 | 0 | 85.7% |
| 3. Security (3a–3n) | 124 | 122 | 2 | 0 | 98.4% |
| 4. API Contract | 42 | 38 | 4 | 0 | 90.5% |
| 5. Data Model | 14 | 11 | 2 | 1 | 78.6% |
| 6. Integration | 12 | 10 | 2 | 0 | 83.3% |
| 7. Documentation vs Code | 7 | 4 | 3 | 0 | 57.1% |
| 8. Dependencies | 12 | 8 | 2 | 2 | 66.7% |
| 9. Frontend-Backend | 26 | 24 | 2 | 0 | 92.3% |
| 10. Code Quality (10a–10f) | 35 | 21 | 12 | 2 | 60.0% |
| **TOTALS** | **294** | **257** | **32** | **5** | **87.4%** |

**Overall**: AUDIT FAILED — 5 FAIL findings break the 0-FAIL baseline. Of the 5 FAILs, **2 are CRITICAL severity** (CVE-bearing dependencies) requiring immediate action.

---

## 11.2 Traceability Matrix

(Sample — full per-ticket matrix maintained in individual phase reports.)

| Recent Sprint Ticket | Plan | Record | Code Files | Test Files | Sec Check | API Check | Verdict |
|---|---|---|---|---|---|---|---|
| SCRUM-281 (MFA setup onboarding) | ✅ | ✅ | mfa.service.ts, mfa.controller.ts | mfa.service.spec.ts | PASS | PASS | PASS |
| SCRUM-283 (constant-time login) | ✅ | ✅ | login.service.ts | auth-login-security.spec.ts | PASS (EM-04) | PASS | PASS |
| SCRUM-284 (unify login response) | ✅ | ✅ | login.service.ts, mfa.service.ts | auth-login.spec.ts | PASS | PASS | PASS |
| SCRUM-300 (forgot-password universal) | ✅ | ✅ | password-reset.service.ts | auth-password.spec.ts | PASS | PASS | PASS |
| SCRUM-301 (OAuth auto-verify) | ✅ | ✅ | oauth-auth.service.ts | oauth-auth.service.spec.ts | PASS | PASS | PASS |
| SCRUM-326 (silent-refresh fix) | ✅ | ✅ | nexacore-dashboard/src/lib/api.ts | — | PASS | — | PASS |
| SCRUM-271 (legacy) | ✅ | ⚠️ missing | — | — | — | — | WARN (DC-01) |

---

## 11.3 Deviation Summary

From Phase 7 (DC-06 finding): 17 implementation records (Sprints 5–9, mostly Sprints 5–6) use the legacy bare "Accepted" deviation label instead of the post-2026-03-13 sub-categories (Accepted-Trivial / Accepted-Quality / Accepted-Risk). Recent records (Sprint 10+) follow the new categories correctly.

| Sprint | Records w/ Legacy Label | Recommended Action |
|---|---|---|
| Sprint 5 | 5 | Re-classify in batch as part of `/update-docs` housekeeping pass |
| Sprint 6 | 4 | Same |
| Sprint 7 | 3 | Same |
| Sprint 8 | 2 | Same |
| Sprint 9 | 3 | Same |

No Sprint 10+ records use legacy label (process is working).

---

## 11.4 Risk Register — All FAIL Findings

| ID | Phase | Severity | Finding | Recommendation |
|----|-------|----------|---------|---------------|
| **DEP-01** | 8 Dependencies | **CRITICAL** | `npm audit`: 1 critical (handlebars 4.7.8) + 18 high (NestJS family, Prisma, lodash, path-to-regexp, etc.) | Upgrade NestJS to 11.1.19+, Prisma to latest patch, replace handlebars or upgrade @nestjs-modules/mailer |
| **DEP-08** | 8 Dependencies | **CRITICAL** | `npm audit --omit=dev`: 1 critical + 16 high in production dependencies | Same root cause as DEP-01 — fix together |
| **D-02-A** | 5 Data Model | HIGH | `User.deletedAt DateTime?` field present in schema.prisma since migration `20260418165311` (2026-04-18) but NOT documented in data-model.md prose §1 (lines 73-94) or appendix model block (lines 1254-1294) | Add field to data-model.md User entity table + appendix block. Note GDPR Article 17 tombstone use case |
| **DU-04** | 10 Code Quality | MEDIUM | 11 cross-file clones (threshold >3 = FAIL). Top: github↔google strategies (27 lines), login.service↔token.service (26 lines), 4 MFA-controller↔passkey-controller clones | Extract `tokenService.issueAuthSession()` and `respondMfaChallenge()` helpers. Consolidate strategies via shared base |
| **TS-03** | 10 Code Quality | MEDIUM | 29 ESLint error-level violations from `no-unsafe-*` family at Passport/WebAuthn untyped boundaries. Hotspots: oauth-callback.filter.ts (6), mfa-setup.guard.ts (4), oauth-link.guard.ts (4), OAuth strategies (4) | Add typed adapter layer for Passport profiles + @simplewebauthn responses. Add ESLint disable-with-justification on unavoidable adapter lines |

## 11.4b WARN Findings (32, abridged — see per-phase reports for full list)

Highlights:
- B-07-WARN: GeoLite2 dev env (carry-forward)
- T-06: Per-folder branch coverage in auth/dto, auth/stores, auth/constants below 85% (carry-forward)
- T-13: jest threshold 80/85/90/90 vs standard 85/90/90/90 (Accepted-Quality, V8 DI artifacts)
- H-12: Lockout intentionally invisible (anti-enumeration trade-off — confirm policy)
- EM-10: MFA error category variance on authenticated endpoints (carry-forward)
- W-A06-1/2/3: 3 undocumented response fields in api-spec (sessions/trusted-devices/mfa-status) — doc-only fix
- DC-01/04/06: Documentation/process gaps in legacy records
- DEP-03/12: prisma CLI in vulnerable range; npm ls peer-dep mismatch (class-validator 0.15.1 vs @nestjs/mapped-types peer ^0.13/0.14)
- FE-14: Lockout UX surface present in types but not rendered
- FE-23: Frontend security headers — only CSP+nonce; missing HSTS, XCTO, Referrer-Policy, Permissions-Policy, X-Frame-Options
- SM-01: 5 production files 304-467 LOC (above 300 threshold, below 500)
- SD-01: AuthService 20 public methods (intentional facade)
- SD-04: 2 documented `forwardRef` usages (Users, Sessions cross-module cycles)
- W-01/W-02: AuthService and TokenService exported but not externally consumed (carry-forward)

---

## 11.5 Metrics

- **Total checks**: 294 (PASS: 257, WARN: 32, FAIL: 5)
- **Pass rate**: 87.4% (vs 92.8% baseline — degradation primarily in Phase 8 Dependencies)
- **Tests**: 607 passing across 43 spec suites (39.4s wall time)
- **Coverage (auth module aggregate)**: stmts 98.24%, branches 85.24%, funcs 96.77%, lines 98.24%
- **Security compliance**:
  - OWASP ASVS v4.0: 100% on chapters 2-6 (3a-3e), 100% on chapter 7 (3k), 100% on chapter 8 (3l), 100% on chapter 13 (3m)
  - NIST SP 800-63B: 9/9 PASS
  - RFC 9700 (OAuth): 8/8 PASS (PKCE, state, redirect whitelist all confirmed)
  - RFC 8725 (JWT): 6/6 PASS (HS256 explicit, jti+iss+aud, ≤15 min TTL)
  - HTTP Security: 11/12 PASS (1 WARN for invisible lockout)
  - Error Disclosure (CWE-200/203/209): 12/13 PASS (1 WARN EM-10)
  - Node.js attacks: 9/9 PASS (no proto pollution, no ReDoS, no SSRF, no secrets in git)

---

## 11.6 Sign-off Checklist

- ❌ Phase 1 Build: PASS (1 WARN GeoLite2 dev env — non-blocking)
- ❌ Phase 2 Tests: all 607 pass, coverage thresholds met (auth aggregate 85.24% branches just clears bar)
- ✅ Phase 3 Security: **0 CRITICAL, 0 HIGH FAIL** — security baseline maintained
- ✅ Phase 4 API Contract: 0 Code-only endpoints, 0 mismatches
- ❌ Phase 5 Data Model: 1 FAIL (D-02-A — `User.deletedAt` undocumented)
- ✅ Phase 6 Integration: docs match code
- ✅ Phase 7 Documentation: 0 FAIL (3 WARN process gaps)
- ❌ Phase 8 Dependencies: **2 CRITICAL FAIL** (handlebars CVE + 18 high vulnerabilities)
- ✅ Phase 9 Frontend-Backend: 0 missing integrations for shipped backend features
- ❌ Phase 10 Code Quality: 2 FAIL (DU-04 cross-file clones, TS-03 ESLint errors)

**Overall sign-off**: ❌ NOT signed-off. 5 FAIL findings — 2 CRITICAL (DEP-01, DEP-08) block release per ISO 27001 CAR model. HIGH and MEDIUM findings should be remediated within current sprint per audit-standards Section 6.3.1 SLA matrix.

---

## 11.7 Security Roadmap (ISO 27001 Cl. 10.1)

| Tier | Effort | Trigger | Items |
|------|--------|---------|-------|
| **Tier 1 — Quick wins (1-2 sprints)** | Low | Next sprint planning | Upgrade NestJS+Prisma+handlebars (DEP-01/DEP-08); add `User.deletedAt` to data-model.md (D-02-A); update api-spec.yml response schemas for sessions/trusted-devices/mfa-status (W-A06); add HSTS+XCTO+Referrer-Policy headers in dashboard middleware (FE-23) |
| **Tier 2 — Strategic (1-3 months)** | Medium | Quality gate hardening | Type Passport/WebAuthn boundaries (resolves TS-03 + reduces TS-02/TS-05); extract `issueAuthSession()`+`respondMfaChallenge()` helpers (DU-04); render lockout UX (FE-14); raise jest branches threshold from 80→85 (T-13) |
| **Tier 3 — Enterprise (3-6 months)** | High | Compliance/scaling | Behavioral E2E test infrastructure (Phase 9b — SCRUM-350); auto-generate data-model.md from schema.prisma (prevents D-02-A class of bug); ESLint rule to enforce typed Passport/WebAuthn adapters; quarterly dependency hygiene cadence baked into ops workflow |

---

## 11.8 Delta vs 2026-03-29 Baseline

| Metric | 2026-03-29 | 2026-05-06 | Delta |
|--------|-----------|------------|-------|
| Total checks | 221 | 294 | +73 (Phase 9 + 10 fully exercised this run; previous was partial — see audit-standards §6.7 phase-invalidation rule) |
| FAIL | 2 (LOW) | 5 (2 CRITICAL, 1 HIGH, 2 MEDIUM) | +3, severity escalated |
| WARN | 16 | 32 | +16 |
| Tests | 1012 (filter pattern) | 607 (filter pattern) | -405 (filter scope difference) |
| Auth stmts coverage | 98.72% | 98.24% | -0.48% (within tolerance) |
| Security FAIL | 0 | 0 | unchanged ✅ |
| Dependency FAIL | 0 | 2 CRITICAL | regression ⚠️ |
| Doc FAIL | 1 LOW | 0 | resolved ✅ |
| API FAIL | 1 LOW | 0 | resolved ✅ |
| Data Model FAIL | 1 LOW | 1 HIGH | severity escalated (different finding — D-02-A vs DM-06) |
| Code Quality FAIL | not run formally | 2 MEDIUM | re-baseline |

### Resolved findings since 2026-03-29
- E-01 (Trusted Devices tag missing in api-spec.yml) — RESOLVED
- DM-06 (`OAUTH_AUTO_VERIFIED` enum missing from data-model.md) — RESOLVED
- DM-W1 (2 schema fields missing `@sensitive`) — RESOLVED (8/8 tagged)
- DM-W2 (migration drift not verifiable) — RESOLVED (`prisma migrate status` clean)
- DC-02 (README auth table stale) — RESOLVED
- V8.2.2 (frontend localStorage WARN) — RESOLVED (clean dashboard sweep)
- DEP-02, DEP-06 (npm outdated, deprecated SimpleWebAuthn types) — RESOLVED

### New / regressed findings
- **DEP-01, DEP-08 (CRITICAL)** — npm audit regressed. Need NestJS/Prisma/handlebars upgrade.
- **D-02-A (HIGH)** — User.deletedAt added 2026-04-18 in code, never propagated to data-model.md.
- **DU-04, TS-03 (MEDIUM)** — Code quality drift: cross-file clones grew, ESLint no-unsafe-* errors appeared at Passport/WebAuthn boundaries.

---

## 11.9 Conclusion

The auth module's **security implementation continues to hold the 0-FAIL baseline** for 124 security checks across OWASP ASVS, NIST 800-63B, RFC 9700, RFC 8725, error-disclosure, logging, data protection, API security, and Node.js attack vectors. SCRUM-281/283/284/300/301/302/299 phase-2 all integrate cleanly with no security regressions.

However, **the 0-FAIL milestone-level baseline is broken** by 5 findings outside the security implementation itself:
- 2 CRITICAL dependency vulnerabilities require immediate upgrade work
- 1 HIGH data-model documentation drift from the GDPR tombstone migration
- 2 MEDIUM code-quality regressions (cross-file clones; Passport/WebAuthn untyped surfaces)

**Recommendation**: Remediate DEP-01/DEP-08 first (CRITICAL, SLA = current sprint). Bundle D-02-A + W-A06 + DC-06 into a single `/update-docs` housekeeping pass. Address DU-04 + TS-03 in next sprint via the proposed adapter-extraction work.

The audit framework (Section 6.7) clarifies that the 2026-03-29 audit was partial (skipped Phase 9 and 10), so the "0-FAIL since 2026-03-17" claim was technically suspect under retroactive application of the phase-invalidation rule. This run is the first **complete 11-phase execution** since 2026-03-17, providing a true cross-phase baseline going forward.
