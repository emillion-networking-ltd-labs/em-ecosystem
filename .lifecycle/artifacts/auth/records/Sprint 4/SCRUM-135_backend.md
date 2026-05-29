# Implementation Record: SCRUM-135 Add GET /users/me/security-activity Endpoint

## Summary

Added a self-service `GET /users/me/security-activity` endpoint to `UsersController` that returns paginated audit logs filtered to the authenticated user's own actions. This was the only missing backend endpoint for Sprint 4 frontend integration (SCRUM-134).

- **Scope**: backend
- **Branch**: `feature/SCRUM-135-backend` (merged to main, deleted)
- **Implementation date**: 2026-03-05

## Plan Reference

- Plan: `ai-specs/changes/plans/Sprint 4/SCRUM-135_backend.md`
- Plan was followed: **Yes**

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `4e34358` | SCRUM-135: Add GET /users/me/security-activity endpoint | `dto/list-security-activity-query.dto.ts` (NEW), `users.controller.ts`, `users.service.ts`, `users.controller.spec.ts`, `users.service.spec.ts` |

## Deviations from Plan

Implementation followed the plan exactly.

## Test Results

- Unit tests: **118 passed / 0 failed** (users module)
- New controller tests: 3 (delegation + default pagination + custom pagination)
- New service tests: 7 (pagination, userId filter, select fields, orderBy DESC, pagination math, empty results, totalPages)
- Pre-existing auth test failures: 2 suites (`auth.service.spec.ts`, `jwt.strategy.spec.ts`) — missing `TokenDenyListService` mock from SCRUM-117. Not caused by this ticket.
- Build: `nest build` clean (0 errors)
- Manual verification: Not yet performed (requires frontend running against backend)

### Ancillary Fix

Fixed pre-existing missing `TokenDenyListService` mock in `users.service.spec.ts` (gap from SCRUM-117 — added 7th dependency to `UsersService` constructor but never updated users service test mocks). Added mock provider: `{ provide: TokenDenyListService, useValue: { denyToken: jest.fn(), denyAllForUser: jest.fn() } }`.

## Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| Missing `TokenDenyListService` mock in `users.service.spec.ts` | MEDIUM | Fixed | Added mock provider (pre-existing from SCRUM-117) |
| CORS `allowedHeaders` missing `X-Device-Fingerprint` | CRITICAL | Fixed (separate commit `7b11fe7`) | Added header to `security.config.ts` — caused "Sign in failed" error from SCRUM-129 |

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/api-spec.yml` | Added `/users/me/security-activity` GET endpoint, `SecurityEvent` schema, `PaginationMeta` schema |
| `ai-specs/specs/integration-state.md` | Added `GET /me/security-activity` to UsersController guard chains, updated changelog |

## Lessons Learned

- **Route ordering matters in NestJS**: `GET me/security-activity` must be declared before `GET :id` to avoid `:id` capturing `me` as a parameter. The plan correctly identified this.
- **Mock propagation is fragile**: SCRUM-117 added `TokenDenyListService` as a 7th dependency to `UsersService` but only fixed `users.controller.spec.ts`, not `users.service.spec.ts`. The same gap exists in `auth.service.spec.ts` and `jwt.strategy.spec.ts`. Workflow standards should enforce checking ALL test files that mock a modified class.
- **CORS header coordination**: SCRUM-129 added `X-Device-Fingerprint` to all frontend requests but never updated backend CORS config. Cross-repo changes (frontend adds header, backend must allow it) need explicit checklists.
