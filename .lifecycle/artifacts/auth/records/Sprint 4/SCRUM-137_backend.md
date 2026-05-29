# Implementation Record: SCRUM-137 Coordinated Merge — Sprint 2-3 Feature Branches into Main

## Summary

- **What was implemented**: Fixed 2 failing test suites (147 tests) caused by missing `TokenDenyListService` mock providers in `jwt.strategy.spec.ts` and `auth.service.spec.ts`. Added 1 new test for the deny-list path in `JwtStrategy.validate()`.
- **Scope**: backend
- **Branch**: `feature/SCRUM-137-backend`
- **Implementation date**: 2026-03-05

## Plan Reference

- **Original plan**: `ai-specs/changes/plans/Sprint 4/SCRUM-137_backend.md`
- **Plan was followed**: Yes

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `97b0a25` | fix(SCRUM-137): add missing TokenDenyListService mock to auth test specs | `src/auth/tests/jwt.strategy.spec.ts`, `src/auth/tests/auth.service.spec.ts` |

## Deviations from Plan

Implementation followed the plan exactly.

Note: The plan itself documented a scope reduction from the original Jira ticket. The ticket described a complex multi-branch merge coordination, but upon codebase verification all Sprint 2-3 branches were already merged to main. The only remaining work was fixing the 2 test suites that failed due to SCRUM-117's `TokenDenyListService` dependency not being propagated to test mocks.

## Test Results

- **Overall**: 44 suites, 810 tests, 0 failures
- **jwt.strategy.spec.ts**: 4 tests passed (3 existing + 1 new deny-list test)
- **auth.service.spec.ts**: 144 tests passed (all existing)
- **Build**: `nest build` — 0 TypeScript errors

## Bugs Found

No bugs found during implementation. The test failures were a pre-existing mock propagation gap from SCRUM-117.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Updated header to SCRUM-137, added changelog entry |

No other documentation updates needed — test-only changes with no impact on API, data model, architecture, or module structure.

## Lessons Learned

- **Mock propagation**: When adding a new constructor dependency to a class, ALL test modules for that class (and any test modules that create it) must be updated with mock providers. This is exactly what `workflow-standards.mdc` warns about and was the root cause of the 147 test failures.
- **Dual test module builders**: `auth.service.spec.ts` has two separate `Test.createTestingModule()` calls — the `createServiceWithExpiry` helper and the main `beforeEach`. Both needed the `TokenDenyListService` mock. Missing either would leave tests broken.
- **Scope verification**: Always verify the actual codebase state before planning. The original ticket described complex merge coordination, but `git branch -r --no-merged main` revealed 0 unmerged branches — saving significant effort.
