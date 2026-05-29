# Implementation Record: SCRUM-227 — Hide Feature State in Errors (EM-08)

## Summary

Replaced 2 inline error strings that revealed OAuth-only account state with generic `OPERATION_NOT_AVAILABLE` constant. Updated 2 Swagger `@ApiResponse` descriptions to not disclose MFA enrollment state. CWE-200.

- **Scope**: backend
- **Branch**: `feature/SCRUM-227-backend`
- **Date**: 2026-03-14

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 10/SCRUM-227_backend.md`
- **Plan followed**: Yes (1 trivial deviation)

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `f145df3` | SCRUM-227: Hide feature state in MFA error messages (EM-08) | 2 files (0 new, 2 modified) |

## Deviations from Plan

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| Step 2 | Update Swagger description text only | Also fixed status 409→400 for setup endpoint | Pre-existing doc mismatch: Swagger said 409 but code throws BadRequestException (400) | Accepted-Trivial | — |

## Test Results

- Backend: 889 passed / 0 failed (60 suites)
- No test changes needed — assertions check exception type only
- Build: `nest build` compiles clean

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `nexacore-api/src/auth/mfa.service.ts` | Replaced 2 inline `'Password confirmation required but no password set'` with `ErrorMessages.mfa.OPERATION_NOT_AVAILABLE` |
| `nexacore-api/src/auth/mfa.controller.ts` | Updated 2 Swagger descriptions: "MFA is already enabled"→"Operation not available", "MFA is not enabled"→"Operation not available" |
| `ai-specs/ai-specs/specs/integration-state.md` | Changelog entry for SCRUM-227 |

## Lessons Learned

- The detailed audit check EM-08 actually PASSed in both phases, but the completion report listed it as WARN due to these edge cases. Always verify the actual code rather than relying solely on audit verdicts.
- Swagger `@ApiResponse` descriptions can disclose feature state even when runtime error messages are generic — API documentation should be treated as part of the security surface.
