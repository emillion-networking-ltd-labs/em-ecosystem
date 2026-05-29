# Implementation Record: SCRUM-198 Extract Shared OAuth Guard and Strategy Base Classes

## Summary

Extracted shared logic from duplicated OAuth guards and strategies. Created `createOAuthAuthGuard()` factory function (guards → one-liners) and `validateOAuthCallback()` helper (shared state validation + action dispatch).

- **Scope**: backend
- **Branch**: `feature/SCRUM-198-backend`
- **Implementation date**: 2026-03-13

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 8/SCRUM-198_backend.md`
- **Plan was followed**: Yes — minor deviation on `done()` callback signature (see Deviations)

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `6658ca4` | refactor(auth): extract shared OAuth guard factory and strategy validate helper (SCRUM-198) | 2 new files, 4 modified source files, 2 modified test files |

## Deviations from Plan

| Step | Planned | Actual | Reason | Follow-up |
|------|---------|--------|--------|-----------|
| Step 4 | Helper calls `done(err)` with 1 arg on error | Helper calls `done(err, undefined)` with 2 args | Google's `VerifyCallback` type expects 2 args; consistent signature needed for both providers | Accepted |
| Step 5 | Direct pass of `done` to helper | Cast `done as (error: Error \| null, user?: unknown) => void` | TypeScript strict mode: `VerifyCallback` user type (`false \| User \| undefined`) is narrower than `unknown` | Accepted |
| Step 7 | 3 new factory tests only | 3 new factory tests + updated 3 GitHub assertions to match `done(err, undefined)` | Consistent `done()` signature from shared helper | Accepted |

## Test Results

- **Overall**: 849 passed / 0 failed (54 suites)
- **Affected tests**: 36 passed (7 guard + 13 Google strategy + 16 GitHub strategy)
- **New tests**: 3 (factory function tests in `oauth-guards.spec.ts`)
- **Build**: `nest build` compiles clean

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Updated header (last update: SCRUM-198), added changelog entry |

## Lessons Learned

- Factory functions returning `@Injectable()` classes work seamlessly with NestJS DI — no special registration needed
- When unifying callback signatures across providers, always pass the explicit `undefined` second arg to avoid Jest's strict argument count matching
- Passport's `PassportStrategy()` mixin pattern prevents strategy base class extraction, but shared helpers achieve the same DRY benefit
