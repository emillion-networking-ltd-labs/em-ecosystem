# Implementation Record: SCRUM-225 — Hide Admin Role in MFA Message (W-03)

## Summary

Replaced role-revealing MFA setup message with generic wording to prevent information disclosure (CWE-200). Extracted message to `ErrorMessages.mfa.SETUP_REQUIRED` constant.

- **Scope**: backend
- **Branch**: `feature/SCRUM-225-backend`
- **Date**: 2026-03-14

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 10/SCRUM-225_backend.md`
- **Plan followed**: Yes (1 trivial deviation)

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `a438578` | SCRUM-225: Hide admin role in MFA setup message (W-03) | 4 files (0 new, 4 modified) |

## Deviations from Plan

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| Step 3 | Update test in `auth.controller.spec.ts` only | Also updated `auth-login.spec.ts:661` | Plan missed a second test asserting on the old message substring | Accepted-Trivial | — |

## Test Results

- Backend: 889 passed / 0 failed (60 suites)
- Build: `nest build` compiles clean
- No new tests — existing tests updated to match new message

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `nexacore-api/src/common/constants/error-messages.ts` | Added `SETUP_REQUIRED` to `mfa` section |
| `nexacore-api/src/auth/login.service.ts` | Replaced inline message with `ErrorMessages.mfa.SETUP_REQUIRED` |
| `nexacore-api/src/auth/tests/auth.controller.spec.ts` | Updated assertion to match new message |
| `nexacore-api/src/auth/tests/auth-login.spec.ts` | Updated `toContain` assertion to match new message |
| `ai-specs/ai-specs/specs/integration-state.md` | Changelog entry for SCRUM-225 |

## Lessons Learned

- When changing a message string, always grep for ALL occurrences across test files — `toContain` partial matches are easy to miss.
- Audit log metadata (`role: user.role`) should remain for internal security monitoring even when user-facing messages are genericized.
