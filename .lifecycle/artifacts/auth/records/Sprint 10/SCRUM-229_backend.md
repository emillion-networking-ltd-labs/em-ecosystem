# Implementation Record: SCRUM-229 — Consolidate Error Message Variants (EM-10)

## Summary

Removed redundant `TOKEN_REVOKED` constant (identical value to `AUTHENTICATION_FAILED` after SCRUM-228) and replaced its sole reference in jwt.strategy.ts. Reduces auth error message surface area for anti-fingerprinting. CWE-200.

- **Scope**: backend
- **Branch**: `feature/SCRUM-229-backend`
- **Date**: 2026-03-14

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 10/SCRUM-229_backend.md`
- **Plan followed**: Yes (0 deviations)

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `caabf90` | SCRUM-229: Consolidate redundant TOKEN_REVOKED error constant (EM-10) | 2 files (0 new, 2 modified) |

## Deviations from Plan

Implementation followed the plan exactly.

## Test Results

- Backend: 889 passed / 0 failed (60 suites)
- No test changes needed — assertion already used correct message text from SCRUM-228
- Build: `nest build` compiles clean

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `nexacore-api/src/common/constants/error-messages.ts` | Removed `TOKEN_REVOKED` constant (redundant alias for `AUTHENTICATION_FAILED`) |
| `nexacore-api/src/auth/strategies/jwt.strategy.ts` | Replaced `ErrorMessages.auth.TOKEN_REVOKED` with `ErrorMessages.auth.AUTHENTICATION_FAILED` |
| `ai-specs/ai-specs/specs/integration-state.md` | Changelog entry for SCRUM-229 |

## Lessons Learned

- SCRUM-228 and SCRUM-229 form a natural two-step sequence: first change the value to be generic (SCRUM-228), then consolidate the now-redundant constant (SCRUM-229). This approach minimizes risk per commit while achieving the same end result.
- When audit numbering overlaps between phases (EM-10 in Phase 1 = feature state, EM-10 in Phase 2 = message consistency), the completion report can create false WARN entries. Always verify against the deep analysis, not just the summary.
