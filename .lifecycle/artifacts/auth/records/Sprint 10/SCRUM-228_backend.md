# Implementation Record: SCRUM-228 — Unify Token Error Messages (EM-09)

## Summary

Changed `TOKEN_REVOKED` constant value from `'Token has been revoked'` to generic `'Authentication failed'` to prevent token lifecycle state disclosure. Removed unused `SESSION_EXPIRED` constant (dead code). CWE-209.

- **Scope**: backend
- **Branch**: `feature/SCRUM-228-backend`
- **Date**: 2026-03-14

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 10/SCRUM-228_backend.md`
- **Plan followed**: Yes (0 deviations)

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `3309c06` | SCRUM-228: Unify token error messages to prevent lifecycle disclosure (EM-09) | 2 files (0 new, 2 modified) |

## Deviations from Plan

Implementation followed the plan exactly.

## Test Results

- Backend: 889 passed / 0 failed (60 suites)
- No test changes needed beyond updating 1 assertion for new message text
- Build: `nest build` compiles clean

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `nexacore-api/src/common/constants/error-messages.ts` | Changed `TOKEN_REVOKED` value to `'Authentication failed'`, removed `SESSION_EXPIRED` |
| `nexacore-api/src/auth/tests/jwt.strategy.spec.ts` | Updated assertion from `'Token has been revoked'` to `'Authentication failed'` |
| `ai-specs/ai-specs/specs/integration-state.md` | Changelog entry for SCRUM-228 |

## Lessons Learned

- The `TOKEN_REVOKED` key name was preserved intentionally — it documents the internal reason while the user-facing value is now generic. This pattern (semantic key + generic value) is a good practice for security-sensitive error constants.
- `SESSION_EXPIRED` was likely intended for idle session timeout but was never wired up — `INVALID_REFRESH_TOKEN` was used instead. Periodic dead code audits prevent constant accumulation.
