# Implementation Record: SCRUM-219 — Unify Authorization Guard Error Messages (I-10)

## Summary

Unified authorization guard error messages to prevent CWE-200 information leakage. Both `RolesGuard` and `PermissionsGuard` now return identical generic "Access denied" instead of distinct messages ("Insufficient role" / "Insufficient permissions") that revealed internal authorization architecture.

- **Scope**: backend
- **Branch**: `feature/SCRUM-219-backend`
- **Date**: 2026-03-13

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 10/SCRUM-219_backend.md`
- **Plan followed**: Yes (0 deviations)

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `a8aafc8` | SCRUM-219: Unify authorization guard error messages (I-10) | 4 files (0 new, 4 modified) |

## Deviations from Plan

Implementation followed the plan exactly.

## Test Results

- Backend: 870 passed / 0 failed (57 suites)
- No new tests (existing guard tests cover all authorization denial behavior)
- Build: `nest build` compiles clean

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Changelog entry for SCRUM-219 |

## Lessons Learned

- The centralized `ErrorMessages` constants pattern makes security audit remediations trivial — single-point changes.
- Having both guards already use `ACCESS_DENIED` for the "no user" case made the unification natural and consistent.
- Only 1 test out of 870 asserted the specific error message string — the rest test exception types, which is a more resilient testing pattern.
