# Implementation Record: SCRUM-111 OAuth Account Unlinking

## Summary

Implemented a `DELETE /users/me/oauth` endpoint that allows users to unlink their OAuth provider (Google/GitHub), converting the account to local email/password authentication. Includes password confirmation gate, session + trusted device revocation, and audit logging.

- **Scope**: backend
- **Branch**: `feature/SCRUM-111-backend`
- **Implementation date**: 2026-03-03

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 3/SCRUM-111_backend.md`
- **Plan was followed**: Yes

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `9ec8283` | feat(SCRUM-111): add OAuth account unlinking endpoint | `prisma/schema.prisma`, `src/audit/enums/audit-action.enum.ts`, `src/users/dto/unlink-oauth.dto.ts`, `src/users/users.service.ts`, `src/users/users.controller.ts`, `src/users/tests/users.service.spec.ts`, `src/users/tests/users.controller.spec.ts` |

## Deviations from Plan

Implementation followed the plan exactly.

## Test Results

- **Overall coverage**: stmts 97.91%, branches 85.53%, funcs 91.45%, lines 98.25% (all thresholds met)
- **Unit tests**: 741 passed / 0 failed (42 suites)
- **New tests**: 15 (12 service + 3 controller)
- **Manual verification**:
  - `nest build` — zero errors
  - `nest start` — 53 routes registered, no DI errors
  - `DELETE /users/me/oauth` route confirmed registered

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Added `DELETE /me/oauth \| JwtAuthGuard \| @Throttle(5/60s)` to UsersController guard table; changelog entry for SCRUM-111; updated "Last update" header |
| `ai-specs/specs/data-model.md` | Added `OAUTH_UNLINKED` to AuditAction table; added missing PASSKEY_* values to Prisma enum section |
| `ai-specs/specs/api-spec.yml` | Added `DELETE /users/me/oauth` endpoint definition + `UnlinkOAuthDto` schema (total: 53 operations) |

## Lessons Learned

- **What went well**: Clean implementation following the established `changePassword()` pattern — password verification + session/device revocation + audit. Zero friction with existing infrastructure.
- **Route ordering**: Confirmed the plan's note about literal paths needing to precede parameterized paths in NestJS controllers. `DELETE me/oauth` placed before `DELETE :id` as planned.
- **Data-model sync**: Discovered during doc updates that `data-model.md` Prisma enum section was missing PASSKEY_* values from SCRUM-110 — corrected alongside SCRUM-111 updates.
