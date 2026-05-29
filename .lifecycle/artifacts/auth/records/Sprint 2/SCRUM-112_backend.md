# Implementation Record: SCRUM-112 Rate Limiting Gaps

## Summary

Added missing `@Throttle` decorators to 2 auth endpoints found during code audit: `POST /auth/oauth/exchange` (oauth: 10 req/60s) and `GET /auth/mfa/status` (mfa: 5 req/60s). Decorator-only changes with no logic modifications.

- **Scope**: backend
- **Branch**: `feature/SCRUM-112-backend`
- **Date**: 2026-03-02

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 2/SCRUM-112_backend.md`
- **Plan followed**: Yes

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `33da3c4` | fix(SCRUM-112): add missing @Throttle to oauth/exchange and mfa/status | `auth.controller.ts`, `mfa.controller.ts`, `auth.controller.spec.ts`, `mfa.controller.spec.ts` |

## Deviations from Plan

Implementation followed the plan exactly.

## Test Results

- **Tests**: 558 passed / 0 failed (36 suites)
- **Coverage**: stmts 98.41%, branches 86.85%, funcs 93.84%, lines 98.56%
- **New tests**: 1 (throttle metadata on `exchangeOAuthCode`)
- **Modified tests**: `mfa.controller.spec.ts` — `status` added to `throttledMethods` array, standalone "NOT have" test removed

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/api-spec.yml` | Added `429` response to `POST /auth/oauth/exchange` |
| `ai-specs/specs/integration-state.md` | Updated MfaController table: `GET /auth/mfa/status` now shows `@Throttle(mfa)` instead of `— (inherits global)`. Changelog entry added. |

## Lessons Learned

- Straightforward decorator-only ticket. No surprises.
- The `integration-state.md` line 80 discrepancy (claimed `@Throttle` on `oauth/exchange` before it existed) was resolved by adding the actual decorator — no doc correction needed.
- All 6 MFA endpoints are now consistently throttled with `AUTH_RATE_LIMITS.mfa`.
