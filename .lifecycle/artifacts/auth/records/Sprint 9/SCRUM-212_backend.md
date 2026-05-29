# Implementation Record: SCRUM-212 Code Quality — Magic Number Consolidation

## 1. Summary

Consolidated 7 scattered magic number constants from 4 service files into the centralized `auth.constants.ts` module. Added `hoursToMs()` and `daysToMs()` helper functions to replace raw multiplication patterns. Removed duplicate `BCRYPT_ROUNDS` declaration from `sessions.service.ts`.

- **Scope**: backend
- **Branch**: `feature/SCRUM-212-backend`
- **Date**: 2026-03-13
- **PR**: #81 (squash-merged)

## 2. Plan Reference

No formal plan file — scope was determined inline during conversation (code quality audit findings: 12 magic numbers actionable, 5 long methods deferred, 0 naming issues).

## 3. Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `5f30c13` | refactor(auth): consolidate magic numbers into auth.constants.ts (SCRUM-212) | 7 files (see below) |

## 4. Files Changed

| File | Changes |
|------|---------|
| `src/auth/constants/auth.constants.ts` | Added 9 new exports: `ACCESS_TOKEN_TTL_SECONDS`, `VERIFICATION_TOKEN_EXPIRY_HOURS`, `RESEND_COOLDOWN_SECONDS`, `RESET_TOKEN_EXPIRY_HOURS`, `BCRYPT_ROUNDS_RECOVERY`, `RECOVERY_CODE_COUNT`, `RECOVERY_CODE_LENGTH`, `hoursToMs()`, `daysToMs()` |
| `src/auth/email-verification.service.ts` | Removed local constants, imported from auth.constants, replaced `X * 60 * 60 * 1000` with `hoursToMs(X)` |
| `src/auth/password-reset.service.ts` | Removed local `RESET_TOKEN_EXPIRY_HOURS`, imported from auth.constants, replaced raw multiplication with `hoursToMs()` |
| `src/auth/mfa.service.ts` | Removed local `BCRYPT_ROUNDS_RECOVERY`, `RECOVERY_CODE_COUNT`, `RECOVERY_CODE_LENGTH`, imported from auth.constants |
| `src/auth/token-deny-list.service.ts` | Changed from local `ACCESS_TOKEN_TTL_SECONDS = 900` to re-export from auth.constants (preserves existing import paths) |
| `src/auth/trusted-device.service.ts` | Added `daysToMs` import, replaced `TRUSTED_DEVICE_TTL_DAYS * 24 * 60 * 60 * 1000` with `daysToMs()` |
| `src/sessions/sessions.service.ts` | Removed duplicate `BCRYPT_ROUNDS`, added imports from auth.constants, replaced all raw time multiplication with `hoursToMs()` |

## 5. Deviations from Plan

| Deviation | Category | Follow-up |
|-----------|----------|-----------|
| Long methods (5 methods > 40 LOC) deferred | Accepted | Already heavily decomposed in prior sprints; further splitting poses regression risk for minimal gain |
| `token-deny-list.service.ts` uses re-export instead of direct import change | Accepted | Preserves existing import paths in `auth.service.ts` and `token.service.ts` without unnecessary churn |

## 6. Test Results

- **Overall**: 859 passed / 0 failed
- **Coverage**: No regression (pure refactor, no behavioral changes)
- **Build**: `nest build` clean, no warnings

## 7. Bugs Found

No bugs found during implementation.

## 8. Documentation Updates

| File | Changes |
|------|---------|
| `ai-specs/specs/integration-state.md` | Added changelog entry for SCRUM-212 |

## 9. Lessons Learned

- Re-exporting from `token-deny-list.service.ts` avoids cascading import changes while still centralizing the constant's source of truth.
- `hoursToMs`/`daysToMs` helpers improve readability across 6 call sites — a good pattern for future time-based constants.
