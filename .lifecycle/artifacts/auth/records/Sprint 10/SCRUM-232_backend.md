# Implementation Record: SCRUM-232 — Extract Impossible Travel Helper (DU-03)

## Summary

Removed duplicate `checkImpossibleTravel` and `handleTravelBlock` methods from `oauth-auth.service.ts` (~46 lines), delegating to existing canonical methods in `token.service.ts`. Removed `ImpossibleTravelService` from `OAuthAuthService` constructor (6→5 deps). Pure refactoring — no behavioral changes. ISO 25010 Maintainability.

- **Scope**: backend
- **Branch**: `feature/SCRUM-232-backend`
- **Date**: 2026-03-14

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 10/SCRUM-232_backend.md`
- **Plan followed**: Yes (0 deviations)

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `d7e3881` | SCRUM-232: Remove duplicate impossible travel methods from OAuthAuthService (DU-03) | 1 file (0 new, 1 modified) |

## Deviations from Plan

Implementation followed the plan exactly.

## Test Results

- Backend: 889 passed / 0 failed (60 suites)
- No test changes needed — existing tests pass with delegation to tokenService
- Build: `nest build` compiles clean

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `nexacore-api/src/auth/oauth-auth.service.ts` | Removed 2 duplicate private methods (`checkImpossibleTravel`, `handleTravelBlock`), delegated to `this.tokenService`. Removed `ImpossibleTravelService` from constructor. Removed 3 unused imports (`ForbiddenException`, `ImpossibleTravelService`, `ImpossibleTravelResult`). |
| `ai-specs/ai-specs/specs/integration-state.md` | Changelog entry for SCRUM-232 |

## Lessons Learned

- When extracting services (SCRUM-161 OAuth split), duplicate helper methods can slip through if the new service copies private methods instead of delegating to the existing service that already has them. Code review should flag identical method bodies across services.
- `SuspiciousLoginService` in `OAuthAuthService` constructor is dead DI (never referenced) — pre-existing issue discovered during this refactoring, not in scope for this ticket.
