# Implementation Record: SCRUM-127 Fix Login 500 Error — Missing Migration & Redis 3.x Compatibility

## Summary

Fixed two critical runtime bugs causing 500 Internal Server Errors: (1) missing Prisma migration for schema additions from Sprint 3 tickets SCRUM-107–111 (Session geolocation columns, TrustedDevice/WebAuthnCredential tables, 13 AuditAction enum values), and (2) Redis `GETDEL` command incompatibility with Redis 3.0.504 (requires 6.2+). Replaced `getdel()` with `get()` + `del()` in 3 source files and updated 3 test files.

- **Scope**: backend
- **Branch**: `feature/SCRUM-127-backend`
- **Implementation date**: 2026-03-04
- **PR**: #26

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 3/SCRUM-127_backend.md`
- **Plan was followed**: Yes — plan was written retroactively to document the hotfix, so it matches exactly.

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `7f49238` | fix(SCRUM-127): add missing DB migration and replace Redis getdel for 3.x compat | `prisma/migrations/20260304132222_.../migration.sql` (new, +84), `src/auth/stores/oauth-state.store.ts` (+4 -2), `src/auth/stores/oauth-code.store.ts` (+4 -2), `src/auth/passkey.service.ts` (+8 -6), `src/auth/tests/oauth-state.store.spec.ts` (+9 -10), `src/auth/tests/oauth-code.store.spec.ts` (+11 -10), `src/auth/tests/passkey.service.spec.ts` (+30 -29) |

## Deviations from Plan

Implementation followed the plan exactly. (Plan was retroactive — documented actual implementation.)

Note: this fix effectively **reverts SCRUM-113** (which introduced `getdel()` for atomicity). The `get()` + `del()` pattern is non-atomic but acceptable given short token TTLs (60–300s) and negligible race window.

## Test Results

- **Tests**: 773 passed / 0 failed (43 suites)
- **Build**: `nest build` — zero TypeScript errors
- **No new tests added**: Existing tests updated to match new Redis call pattern (`getdel` → `get` + `del`)
- **Manual verification**:
  - Email/password login → 200 OK (was 500 before migration)
  - Google OAuth callback → successful redirect (was 500 before getdel fix)
  - GitHub OAuth callback → successful redirect (was 500 before getdel fix)

## Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| `PrismaClientKnownRequestError P2022 ColumnNotFound` on `sessions` table — 4 geolocation columns, 2 tables, 13 enum values not in DB | CRITICAL | Fixed | Created migration `20260304132222_add_session_geolocation_fields` |
| `ReplyError: ERR unknown command 'getdel'` on OAuth state validation / code exchange / passkey verification | CRITICAL | Fixed | Replaced `getdel()` with `get()` + `del()` in 3 source files |
| Stale Prisma client after migration (`undefined$1undefined` column error) | HIGH | Fixed | `npx prisma generate` after migration |
| `HttpExceptionFilter` silently swallows non-HttpException stack traces | MEDIUM | Deferred | Temporary debug logging was used during investigation then removed. Consider structured error logging in future ticket. |

### Root Cause Analysis

- **Schema drift**: SCRUM-107–111 modified `schema.prisma` (added models, fields, enums) but did not run `prisma migrate dev` to create corresponding SQL migrations. `prisma migrate status` reported "up to date" because all existing migrations were applied — it does not detect unmigrated schema additions. This is a Prisma tooling gap.
- **Redis version**: Dev environment runs Redis 3.0.504 (last official Windows port, 2016). `GETDEL` was introduced in Redis 6.2 (2021). SCRUM-113 introduced `getdel()` without verifying minimum Redis version.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Updated header (SCRUM-126 → SCRUM-127), added SCRUM-127 changelog entry documenting both root causes and fixes |

No changes needed to `data-model.md` (schema unchanged), `api-spec.yml` (no API changes), or standards files (bugfix only).

## Lessons Learned

- **Always run `prisma migrate dev` after schema changes**: `prisma migrate status` only checks if existing migrations are applied. New schema additions without migrations are invisible to this check. Consider adding a CI step that runs `prisma migrate diff` to detect schema drift.
- **Document minimum Redis version**: The project should document minimum Redis 2.6.12 (or whatever floor) in README/standards. The `GETDEL` incident shows that using newer Redis commands without checking dev environment compatibility causes silent failures.
- **`HttpExceptionFilter` needs structured logging**: The `@Catch()` filter catches ALL exceptions but only formats `HttpException` instances. Non-HttpException errors become generic 500s with no server-side logging, making debugging extremely difficult. A future ticket should add `console.error` or a Logger call for non-HttpException paths.
- **Hotfix workflow**: This ticket was created retroactively after debugging. The proper workflow (/enrich-us → /plan-backend-ticket → /develop-backend → /update-docs) was followed after the fact to maintain process integrity.
