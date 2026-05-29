# Fase 7: DOCUMENTATION vs CODE — auth

**Date**: 2026-05-09 01:10 UTC
**Module**: auth
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: SOC 2 CC8.1, ISO 27001 A.12.1.2
**Previous baseline**: audit-2026-05-06T22-44 (4 PASS / 3 WARN / 0 FAIL — 57.1%)

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 4     |
| FAIL    | 0     |
| WARN    | 3     |
| N/A     | 0     |

**Overall**: PASS

---

## Detailed Findings

### DC-01: Record completeness
- **Verdict**: WARN (carry-forward)
- **Severity**: HIGH
- **Evidence**: Records present for Sprints 0–14 (15 sprint folders). Recent sprints have 3+ records each (Sprint 13: SCRUM-281, 283, 284; Sprint 14 includes SCRUM-300, 301, 302, 304). Some legacy tickets in Sprints 5–9 lack a 1:1 record file (e.g., SCRUM-271 referenced in previous audit). Carry-forward.

### DC-02: File existence
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Spot-checked records SCRUM-281 (mfa setup onboarding), SCRUM-283 (constant-time login), SCRUM-284 (unify login response shapes), SCRUM-300 (forgot-password universal), SCRUM-301 (OAuth auto-verify) — all referenced code paths (login.service.ts, mfa.service.ts, oauth-auth.service.ts, password-reset.service.ts) exist in current `src/auth/`.

### DC-03: Functionality spot-check
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: 3 random claims verified:
  - **SCRUM-281 claim**: "MFA setup token issued during login when ADMIN/SUPERADMIN doesn't have MFA enabled" → verified at `login.service.ts:138-141` (`handleMfaSetupRequired`)
  - **SCRUM-283 claim**: "Layer 2 timing floor MIN_LOGIN_DURATION_MS=350" → verified at `auth.constants.ts:25` and `login.service.ts:160-184`
  - **SCRUM-284 claim**: "Trusted-device login uses `tokenService.issueAuthSession(user, requestMeta, tokens)` after audit log" → verified at `login.service.ts:286-302` and `token.service.ts:200-242`

### DC-04: Orphan code detection
- **Verdict**: WARN (minor)
- **Severity**: MEDIUM
- **Evidence**: Files with light record coverage:
  - `src/auth/utils/audit-log.helper.ts` — created during SCRUM-356 refactor; cross-referenced in SCRUM-356 record under audit folder, not in records/ folder
  - `src/auth/strategies/pkce-authenticate.ts` — extracted helper, mentioned in implementation history, no standalone record
- These are extraction artifacts (refactoring), not new features. Carry-forward.

### DC-05: Sprint folder consistency
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: Files correctly placed under sprint number folders (e.g., SCRUM-281/283/284 in Sprint 13 = id=444; SCRUM-300/301/302/304 in Sprint 14).

### DC-06: Deviation classification
- **Verdict**: WARN (carry-forward, Accepted-Quality)
- **Severity**: MEDIUM
- **Evidence**: Older Sprint 5–9 records use legacy "Accepted" label instead of post-2026-03-13 sub-categories (Accepted-Trivial / Accepted-Quality / Accepted-Risk). Sprint 10+ records follow new convention. Per previous audit, batch re-classification queued as housekeeping.

### DC-07: Plan-record alignment
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: Spot-checked plans/records pairs in Sprint 13/14 — scope tags (_backend / _frontend / _fullstack) align between plan and record files.

---

## Recommendations

1. **DC-01 WARN** (carry-forward): Add missing records for legacy Sprints 5–9 tickets, or document them as "Pre-record-template" exempt.
2. **DC-04 WARN**: Update extraction-artifact files in record cross-reference index.
3. **DC-06 WARN** (carry-forward): Run a batch script to re-label Sprint 5–9 records with the post-2026-03-13 deviation sub-categories.
