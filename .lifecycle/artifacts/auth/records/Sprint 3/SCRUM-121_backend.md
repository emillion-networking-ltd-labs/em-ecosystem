# Implementation Record: SCRUM-121 Convert validate-reset-token to POST (V3.5.1)

## Summary

Converted `GET /auth/validate-reset-token` to `POST` with token in request body to prevent token leakage via URL logs, browser history, and Referer headers per OWASP ASVS V3.5.1.

- **Scope**: backend
- **Branch**: `feature/SCRUM-121-backend`
- **Implementation date**: 2026-03-04

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 3/SCRUM-121_backend.md`
- **Plan was followed**: Yes

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `92432f0` | feat(SCRUM-121): convert validate-reset-token from GET to POST (OWASP ASVS V3.5.1) | `src/auth/dto/validate-reset-token.dto.ts` (NEW), `src/auth/auth.controller.ts`, `src/auth/tests/auth.controller.spec.ts` |

## Deviations from Plan

Implementation followed the plan exactly.

## Test Results

- **Unit tests**: 756 passed / 0 failed (43 suites)
- **Build**: `nest build` — zero errors
- **Test delta**: -1 test (removed "no token provided" test — `@IsNotEmpty()` + global ValidationPipe now handles empty tokens before the controller)

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Updated AuthController Method Guards table (validate-reset-token: removed `@SkipCsrf`), added SCRUM-121 changelog entry |

## Lessons Learned

- **@SkipCsrf removed**: The old plan (from bulk commit) retained @SkipCsrf, but POST endpoints should be CSRF-protected. The CsrfGuard APP_GUARD now applies.
- **ValidationPipe replaces manual guard**: The `if (!token)` manual check was redundant with `@IsNotEmpty()` on the DTO — class-validator handles this at the framework level with a proper 400 response.
- **Rectified**: Individual branch/commit/PR replacing bulk commit `e0f12f7`.
