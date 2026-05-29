# Implementation Record: SCRUM-114 Endpoint Correctness

## Summary

Fixed 2 endpoint correctness issues: (1) `GET /users/:id` now throws `NotFoundException` (404) instead of returning HTTP 200 with `{ error: 'User not found' }`; (2) `GET /audit-logs/:id` now uses `ParseUUIDPipe` to validate UUID format before reaching Prisma.

- **Scope**: backend
- **Branch**: `feature/SCRUM-114-backend`
- **Date**: 2026-03-03

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 2/SCRUM-114_backend.md`
- **Plan followed**: Yes

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `4193bd5` | fix(SCRUM-114): fix endpoint correctness for users/:id and audit-logs/:id | `users.controller.ts`, `audit.controller.ts`, `users.controller.spec.ts` |

## Deviations from Plan

Implementation followed the plan exactly.

## Test Results

- **Tests**: 558 passed / 0 failed (36 suites)
- **Coverage**: stmts 98.41%, branches 86.85%, funcs 93.84%, lines 98.56%
- **Modified tests**: `users.controller.spec.ts` — "user not found" test now expects `NotFoundException` instead of error object

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/api-spec.yml` | Added `400: Invalid UUID format` response to `GET /audit-logs/{id}` |
| `ai-specs/specs/integration-state.md` | Changelog entry added for SCRUM-114 |

No changes to `data-model.md` (no schema changes).

## Lessons Learned

- The `GET /users/:id` endpoint had the 404 documented in api-spec.yml but the code was returning 200 — documentation was ahead of the implementation.
- `ParseUUIDPipe` was already used on all other UUID param endpoints (users/:id, sessions/:id); audit-logs/:id was the only one missing it.
- Both fixes make the codebase fully consistent: all `:id` params use `ParseUUIDPipe`, all "not found" cases throw `NotFoundException`.
