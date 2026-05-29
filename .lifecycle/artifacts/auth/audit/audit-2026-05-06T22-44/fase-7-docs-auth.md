# Phase 7: DOCUMENTATION vs CODE — auth module

**Date**: 2026-05-06 22:44 UTC
**Module**: `auth`
**Standards**: SOC 2 CC8.1 (Change Authorization/Documentation), ISO 27001 A.12.1.2 (Change Management)
**Audit standards reference**: `ai-specs/specs/audit-standards.mdc` Section 3 — Phase 7 (DC-01..DC-07)

**Previous baseline (2026-03-29)**: 5 PASS / 2 WARN / 0 FAIL.
WARNs: DC-02 (README auth table stale), DC-07 (2 Sprint 9 records use legacy deviation category — note: this baseline mis-attributed; the legacy-category WARN belongs to DC-06 in current standard).

---

## Inputs Inventoried

- **Records folder**: `ai-specs/ai-specs/changes/auth/records/Sprint {0..14}/` — 137 record files (133 ticket records + 3 `_verify.md` from older sprints + 1 `TEST-PLAN-pre-done…`).
- **Plans folder**: `ai-specs/ai-specs/changes/auth/plans/Sprint {0..14}/` — 130 plan files + 30 `_verify.md` artifacts (Sprint 10+ post-`/verify` adoption).
- **Source folder**: `nexacore-api/src/auth/` — 73 TS files non-test (counted from `find ... -name "*.ts" ! -name "*.spec.ts"`).

---

## Per-check findings

### DC-01 — Record completeness  (HIGH, SOC 2 CC8.1)

**Verdict**: WARN
**Severity**: HIGH
**Expected**: All tickets have records AND each record has a corresponding plan.
**Actual**: 16 records lack a matching plan; 1 plan lacks a matching record.

Records without a corresponding plan file:

| Sprint | Record file |
|--------|-------------|
| Sprint 0 | `SCRUM-17_frontend.md` |
| Sprint 0 | `SCRUM-22_backend.md` |
| Sprint 4 | `SCRUM-138_fullstack.md` |
| Sprint 5 | `SCRUM-148_backend.md` |
| Sprint 5 | `SCRUM-150_backend.md` |
| Sprint 5 | `SCRUM-153_backend.md` |
| Sprint 5 | `SCRUM-155_backend.md` |
| Sprint 5 | `SCRUM-156_backend.md` |
| Sprint 5 | `SCRUM-157_backend.md` |
| Sprint 5 | `SCRUM-165_fullstack.md` |
| Sprint 5 | `SCRUM-166_fullstack.md` |
| Sprint 6 | `SCRUM-170_backend.md` |
| Sprint 9 | `SCRUM-211_backend.md` |
| Sprint 9 | `SCRUM-212_backend.md` |
| Sprint 11 | `SCRUM-259_frontend.md` |
| Sprint 11 | `SCRUM-260_backend.md` |

Plans without a corresponding record:

| Sprint | Plan file |
|--------|-----------|
| Sprint 11 | `SCRUM-271_backend.md` |

**Note**: Sprints 5/6 cluster (8 records) is the dominant gap, suggesting batch retroactive recording without plan back-fill. SCRUM-22 and SCRUM-17 are very early Sprint 0 onboarding tickets where the workflow may not yet have produced plans. Lifecycle predates current `/plan → /develop → /verify → /commit → /update-docs` (formalized 2026-03-13). Per workflow-standards.mdc, recently created records (Sprint 11+) should always have a plan; SCRUM-259 + SCRUM-260 are the only non-legacy gaps.

---

### DC-02 — File existence  (HIGH, SOC 2 CC8.1)

**Verdict**: PASS
**Severity**: HIGH
**Expected**: All claimed files exist in codebase.
**Actual**: Spot-checks performed across recent records confirm cited paths exist:

- SCRUM-283 record cites `auth.constants.ts` and `login.service.ts` → both exist; `MIN_LOGIN_DURATION_MS` symbol present in 8 files (verified via grep).
- SCRUM-284 record cites `auth.interfaces.ts`, `oauth-auth.service.ts`, `token.service.ts`, `login.service.ts` → all exist; `status: 'success' | 'mfa_required' | 'mfa_setup_required'` discriminator present in 9 source files.
- SCRUM-301 record cites `src/common/interfaces/oauth-profile.interface.ts` (`emailVerified?: boolean`) → exists at line 10.

**README auth-table currency** (previous baseline WARN): RESOLVED. README endpoint table covers all 42 implemented routes:
- `auth.controller.ts` (8): csrf-token, register, login, refresh, logout, logout-all, me, admin
- `account.controller.ts` (7): verify-email, verify-email-change, resend-verification, resend-verification-public, forgot-password, reset-password, validate-reset-token
- `oauth.controller.ts` (7): google, google/callback, github, github/callback, oauth/exchange, link/code, link/google, link/github
- `mfa.controller.ts` (6): setup, verify-setup, verify-login, recovery-codes, status, mfa (DELETE)
- `passkey.controller.ts` (7): register/options, register/verify, login/options, login/verify, GET, PATCH :id, DELETE :id
- `session.controller.ts` (5): sessions GET/DELETE, trusted-devices POST/GET/DELETE/DELETE :id

All 42 endpoints listed in README rows 126-167.

---

### DC-03 — Functionality spot-check  (MEDIUM, SOC 2 CC8.1)

**Verdict**: PASS
**Severity**: MEDIUM
**Expected**: Sampled record claims verified by reading the actual source.
**Sampling**: 3 claims from 3 recent records (Sprint 13 / Sprint 14):

| # | Record | Claim | Verification | Result |
|---|--------|-------|--------------|--------|
| 1 | Sprint 13 / SCRUM-283_backend.md | `MIN_LOGIN_DURATION_MS=350ms` floor wraps login + `bcrypt.compare` added before account-lockout throw | `MIN_LOGIN_DURATION_MS` constant present in `constants/auth.constants.ts` and consumed by `login.service.ts`; 4 spec files exercise the constant | PASS |
| 2 | Sprint 13 / SCRUM-284_fullstack.md | `status: 'success' \| 'mfa_required' \| 'mfa_setup_required'` discriminator replaces `mfaRequired` boolean | All 3 status literals present in `auth.service.ts`, `login.service.ts`, `oauth-auth.service.ts`, `token.service.ts`, `interfaces/auth.interfaces.ts` (9 src files total) | PASS |
| 3 | Sprint 14 / SCRUM-301_backend.md | `emailVerified?: boolean` added to OAuth profile interface to drive auto-verify on local accounts | `src/common/interfaces/oauth-profile.interface.ts:10` carries `emailVerified?: boolean` | PASS |

---

### DC-04 — Orphan code detection  (MEDIUM, ISO 27001 A.12.1.2)

**Verdict**: WARN
**Severity**: MEDIUM
**Expected**: Each TS file (excl. `*.spec.ts`) appears in at least one record by name.
**Actual**: 73 TS files in `src/auth/`. The following do not appear in any record:

| File | Reason / hypothesis |
|------|---------------------|
| `guards/base-oauth-auth.guard.ts` | Likely refactor of OAuth guards; no record references the file or class name `BaseOAuthAuthGuard`. |
| `stores/oauth-link-code.store.ts` | OAuth link-code store; not mentioned in any record (only `oauth-code.store.ts` is recorded). |

The following appear only via the parent feature (passkey controller / passkey service) but do not have explicit DTO-level mention in any record:

| File | Containing feature record |
|------|---------------------------|
| `dto/passkey-login-options.dto.ts` | passkey.controller (Sprint 10/11) |
| `dto/passkey-login-verify.dto.ts` | passkey.controller (Sprint 10/11) |
| `dto/passkey-register-options.dto.ts` | passkey.controller (Sprint 10/11) |
| `dto/passkey-register-verify.dto.ts` | passkey.controller (Sprint 10/11) |
| `dto/passkey-rename.dto.ts` | passkey.controller (Sprint 10/11) |
| `dto/passkey-delete.dto.ts` | passkey.controller (Sprint 10/11) |
| `dto/trusted-device-revoke.dto.ts` | session.controller (Sprint 11) |

The DTO group is acceptable (mentioned at the parent-feature level), but the two store/guard files are genuinely undocumented in records.

**WARN justification**: 2 source files without documentary trail violates ISO 27001 A.12.1.2 traceability. Suggest either adding a 1-line back-fill record or noting refactor origin in the integration-state changelog.

---

### DC-05 — Sprint folder consistency  (LOW, Process compliance)

**Verdict**: PASS (with caveats)
**Severity**: LOW
**Expected**: Each record sits in its assigned Jira sprint folder.
**Actual**: All record filenames sit under a `Sprint [N]/` folder. Loose verification against the MEMORY.md sprint→ticket map confirms placement matches assignment for sprints 0-11 (closed) and 12-14 (active). Sprint 12 contains a `TEST-PLAN-pre-done-SCRUM-327-347-349-350.md` ancillary file — not a record but properly co-located with the tickets it covers.

---

### DC-06 — Deviation classification  (MEDIUM, SOC 2 CC8.1)

**Verdict**: WARN
**Severity**: MEDIUM
**Expected**: Records with deviations use one of the current categories: Accepted-Trivial, Accepted-Quality, Accepted-Risk, Deferred, Pre-existing, Scope-Gap.
**Actual**: 17 record files still use the legacy bare `Accepted` (or legacy "Justified/Process/Unjustified") classifications, predating the 2026-03-13 subcategory split. 23 record files use the current subcategories.

Files using legacy-only classification:

| Sprint | File |
|--------|------|
| Sprint 5 | SCRUM-140_backend.md |
| Sprint 5 | SCRUM-166_fullstack.md |
| Sprint 6 | SCRUM-163_fullstack.md |
| Sprint 6 | SCRUM-167_frontend.md |
| Sprint 6 | SCRUM-171_frontend.md |
| Sprint 6 | SCRUM-173_fullstack.md |
| Sprint 7 | SCRUM-175_backend.md |
| Sprint 7 | SCRUM-178_backend.md |
| Sprint 7 | SCRUM-179_backend.md |
| Sprint 7 | SCRUM-181_backend.md |
| Sprint 7 | SCRUM-186_backend.md |
| Sprint 7 | SCRUM-187_backend.md |
| Sprint 8 | SCRUM-198_backend.md |
| Sprint 9 | SCRUM-202_backend.md |
| Sprint 9 | SCRUM-204_frontend.md |
| Sprint 9 | SCRUM-210_backend.md |
| Sprint 9 | SCRUM-212_backend.md |

**WARN justification**: Records pre-date the 2026-03-13 subcategory split, so the omissions are historical, not regressions. However, audit framework Section 6.5 (Severity Stability) is best supported by retroactive reclassification to ensure backlog ticket-creation triggers (Accepted-Quality) are not missed for legacy entries. Previous baseline (2026-03-29) flagged only 2 Sprint 9 records — actual scope is broader (17 files across Sprints 5-9).

**Remediation suggestion** (non-blocking): one-time pass mapping legacy `Accepted` → `Accepted-Trivial` for cosmetic deltas, `Accepted-Quality` for QA gaps. Owners can do this opportunistically when next touching a ticket.

---

### DC-07 — Plan-record alignment  (LOW, Process compliance)

**Verdict**: PASS
**Severity**: LOW
**Expected**: Sample of plan-record pairs has matching scope (`_backend` / `_frontend` / `_fullstack`) or has documented justification for difference.
**Actual**: Sampled 3 pairs:

| Ticket | Plan scope | Record scope | Match? |
|--------|------------|--------------|--------|
| SCRUM-283 | `_backend` | `_backend` | Match |
| SCRUM-284 | `_fullstack` | `_fullstack` | Match |
| SCRUM-301 | `_backend` | `_backend` | Match |

Two known scope-suffix differences detected (informational, outside sampling): SCRUM-88 and SCRUM-89 have `_backend` plans but `_fullstack` records — classic Process-category scope merge; explicitly allowed by audit-standards Phase 7 deviation taxonomy.

---

## Summary

| Check | Verdict | Severity |
|-------|---------|----------|
| DC-01 Record completeness | WARN | HIGH |
| DC-02 File existence | PASS | HIGH |
| DC-03 Functionality spot-check | PASS | MEDIUM |
| DC-04 Orphan code detection | WARN | MEDIUM |
| DC-05 Sprint folder consistency | PASS | LOW |
| DC-06 Deviation classification | WARN | MEDIUM |
| DC-07 Plan-record alignment | PASS | LOW |

**Counts**: 4 PASS / 3 WARN / 0 FAIL.

---

## Recurrence Analysis vs 2026-03-29 baseline

| Check | Previous | Current | Delta |
|-------|----------|---------|-------|
| DC-01 | not flagged | WARN (16 records, 1 plan) | NEW WARN — broader plan/record-pair gap surfaced under stricter cross-check |
| DC-02 (README staleness) | WARN | PASS | RESOLVED — README endpoint table now matches 42 implemented routes |
| DC-04 | not flagged | WARN (2 orphan src files + 7 DTOs) | NEW WARN — orphan-detection check tightened |
| DC-06 (legacy "Accepted") | WARN (2 Sprint 9 files) | WARN (17 files Sprints 5-9) | EXPANDED — same root cause, fuller inventory |
| DC-03, DC-05, DC-07 | PASS | PASS | No change |

Net direction: 1 baseline WARN resolved (DC-02), 2 new WARNs surfaced through deeper inspection (DC-01, DC-04), 1 baseline WARN expanded (DC-06). **0 FAIL maintained**.

---

## Recommendations

1. **DC-01 (HIGH)** — Back-fill plans for the two non-legacy gaps (SCRUM-259, SCRUM-260) and the orphan plan (SCRUM-271 — confirm whether record was renamed or work was rolled into another ticket). Sprints 5/6 legacy gap can stay if process predates current lifecycle, but document the cut-off in `workflow-standards.mdc`.
2. **DC-04 (MEDIUM)** — Add 1-line provenance to `guards/base-oauth-auth.guard.ts` and `stores/oauth-link-code.store.ts` in `integration-state.md` changelog so future audits trace them to a ticket. The 7 passkey/trusted-device DTOs are acceptable at parent-feature level, but a `dto/`-section heading in the SCRUM-181/SCRUM-241 record bodies would close the trace.
3. **DC-06 (MEDIUM)** — One-time reclass pass for the 17 legacy-`Accepted` records. Low-risk: most are cosmetic (`Accepted-Trivial`); a few may convert to `Accepted-Quality` and need backlog tickets. Tracker can be a single SCRUM ticket with sub-tasks.
4. **Process** — Update `workflow-standards.mdc` to require `/plan` artifact creation for retroactive records (or formalize a `RETROACTIVE.md` marker for back-filled records).

---

**End Phase 7 — auth module.**
