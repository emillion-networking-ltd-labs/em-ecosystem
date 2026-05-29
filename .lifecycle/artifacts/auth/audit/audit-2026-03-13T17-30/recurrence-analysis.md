# Recurrence Analysis — Auth Audit 2026-03-13

**Purpose**: Finding-by-finding comparison against previous audit (2026-03-12) to identify regressions, newly discovered gaps, and reclassified findings. This document MUST be consulted by future audits to avoid re-analyzing from scratch.

---

## Classification Key

| Category | Definition |
|----------|-----------|
| **REGRESSION** | Code that previously worked and broke due to a change |
| **RECURRENT (escalated)** | Found in previous audit at lower severity, escalated |
| **NEWLY DISCOVERED** | Gap that existed but was never caught by previous audit checks |
| **SCOPE CHANGE** | Previously out of scope (N/A), now in scope due to framework evolution |

---

## FAIL Findings — Recurrence Status

| # | ID | Finding | Category | Origin | Previous Audit (2026-03-12) | Evidence |
|---|-----|---------|----------|--------|----------------------------|----------|
| 1 | B-01 | dist/ missing | **STATE** (not code) | N/A | PASS (build ran successfully) | Fresh checkout — no `nest build` executed in this session. Not a code regression. |
| 2 | T-07 | 3 untested files | **NEWLY DISCOVERED** | SCRUM-181, SCRUM-198 | WARN (different files: oauth-link.guard, oauth-callback.filter) | hash-token.ts, pkce-authenticate.ts, oauth-validate.helper.ts were extracted during refactoring without tests. Previous audit flagged different untested files. |
| 3 | EM-02 | 403 vs 401 user enumeration | **NEWLY DISCOVERED** | SCRUM-140 (2026-03-08) | Not flagged | SCRUM-140 deliberately chose ForbiddenException(403) for unverified accounts. Error disclosure checks in previous audit did not catch status code differences. |
| 4 | V8.3.1 | JWT in query param | **RECURRENT (escalated)** | SCRUM-161 (2026-03-09) | WARN (V8.3.1, same finding) | Previous audit accepted as WARN noting "standard practice for OAuth redirects." This audit escalated to FAIL based on deeper log-leakage analysis. |
| 5 | EM-06 | Guard message inconsistency | **NEWLY DISCOVERED** | SCRUM-140 (2026-03-08) | Not flagged | SCRUM-140 centralized error messages but did not unify across similar guards. Previous audit's 13 EM checks did not catch this. |
| 6 | V8.3.4 | Sensitive Prisma fields undocumented | **SCOPE CHANGE** | Initial schema (Sprint 0-3) | No check existed | V8.3.4 is a new check in the 2026-03-13 framework. Fields are properly protected in app layer (toSafeUser()), but schema lacks `@sensitive` annotations. |
| 7 | V8.3.7 | DATABASE_URL no sslmode=require | **SCOPE CHANGE** | Initial project setup | N/A ("infrastructure concern") | Previous audit explicitly marked N/A. This audit treats .env.example as codebase documentation. |
| 8 | D-11 | Token models lack updatedAt | **RECURRENT (reclassified)** | SCRUM-29 (2026-02-27) | WARN → accepted as OK | Previous audit evaluated and accepted: "single-use, usedAt tracks mutation." This audit reversed the decision to FAIL. |
| 9 | I-10 | process.env in token.service | **NEWLY DISCOVERED** | SCRUM-181 (2026-03-03) | Not flagged | SCRUM-181 migrated most services to ConfigService but overlooked token.service.ts. Previous audit had no specific check for ConfigService consistency. |

---

## Summary Statistics

| Category | Count | Finding IDs |
|----------|-------|-------------|
| Regressions (code broke) | **0** | — |
| Recurrent (escalated severity) | **2** | V8.3.1, D-11 |
| Newly discovered (gap/oversight) | **5** | T-07, EM-02, EM-06, I-10, B-01 (state) |
| Scope change (new checks) | **2** | V8.3.4, V8.3.7 |

---

## Root Causes of "New" Findings

1. **Framework evolution**: audit-standards.mdc grew from ~100 to ~258 checks between audits. Checks V8.3.4 and V8.3.7 did not exist in the 2026-03-12 framework.
2. **Incomplete refactoring**: SCRUM-181 (AuthService decomposition) and SCRUM-198 (OAuth guard extraction) created new files without tests and without migrating all patterns (process.env).
3. **Error standardization gap**: SCRUM-140 centralized messages but did not enforce cross-guard consistency or evaluate HTTP status codes as an information disclosure vector.
4. **Severity recalibration**: Deeper analysis (especially for V8.3.1 log-leakage vector) warranted escalation from WARN to FAIL.

---

## Instructions for Future Audits

1. **Load this file first** — before running any phase, check this recurrence analysis to understand the baseline.
2. **Compare finding-by-finding** — for each FAIL/WARN, note whether it's new, recurrent, or reclassified relative to this audit.
3. **Track framework changes** — if new checks were added to audit-standards.mdc since 2026-03-13, document which findings come from new checks vs existing ones.
4. **Verify fixes** — for each finding listed in Sprint 10 remediation (SCRUM-215 through SCRUM-235), confirm the specific fix was applied and the check now passes.
5. **Write a new recurrence-analysis.md** — in the new audit output folder, referencing this one.

---

*Generated: 2026-03-13 | Baseline: audit-2026-03-12T16-22 vs audit-2026-03-13T17-30*
