# Implementation Record: SCRUM-113 Redis Store Atomicity

## Summary

Replaced non-atomic GET + DEL Redis pattern with single GETDEL command in both OAuth stores to eliminate TOCTOU race conditions.

- **Scope**: backend
- **Branch**: `feature/SCRUM-113-backend`
- **Date**: 2026-03-03

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 2/SCRUM-113_backend.md`
- **Plan followed**: Yes

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `b960397` | fix(SCRUM-113): replace non-atomic GET+DEL with GETDEL in OAuth Redis stores | `oauth-state.store.ts`, `oauth-code.store.ts`, `oauth-state.store.spec.ts`, `oauth-code.store.spec.ts` |

## Deviations from Plan

Implementation followed the plan exactly.

## Test Results

- **Tests**: 558 passed / 0 failed (36 suites)
- **Coverage**: stmts 98.41%, branches 86.85%, funcs 93.84%, lines 98.56%
- **Modified tests**: validate() and exchange() tests updated to mock `redis.getdel()` and verify atomicity (get/del NOT called)

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Changelog entry added for SCRUM-113 |

No changes to `api-spec.yml` or `data-model.md` (internal implementation change only).

## Lessons Learned

- ioredis `getdel()` works seamlessly as a drop-in replacement for get()+del() — no type issues or API differences.
- The OAuthCodeStore.exchange() had a subtle inefficiency: it called `redis.del()` unconditionally even when `data` was null. GETDEL eliminates this wasteful call naturally.
