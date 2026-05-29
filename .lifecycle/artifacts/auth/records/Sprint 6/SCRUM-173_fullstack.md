# Implementation Record: SCRUM-173 Differentiate OAuth Audit Actions (login/register/link)

## 1. Summary

Replaced hardcoded `OAUTH_LOGIN` audit logging in `validateOAuthUser()` with action-based mapping that differentiates between login, account linking, and account creation. Added `OAUTH_REGISTER` enum value across Prisma schema, TypeScript enum, and all frontend display components. Also backfilled missing `OAUTH_LINKED` and `OAUTH_UNLINKED` entries in frontend admin components.

- **Scope**: fullstack
- **Branch**: `feature/SCRUM-173-fullstack`
- **Implementation date**: 2026-03-11

## 2. Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 6/SCRUM-173_fullstack.md`
- **Plan was followed**: Partially — Prisma schema/migration was not in the original plan (plan stated "No Prisma schema changes"), but was required for the new enum value.

## 3. Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `92154cf` | feat(SCRUM-173): differentiate OAuth audit actions for login, link, and register | `src/audit/enums/audit-action.enum.ts`, `src/auth/auth.service.ts`, `src/auth/tests/auth.service.spec.ts`, `src/components/profile/SecurityActivity.tsx`, `src/components/admin/AuditLogFilters.tsx` + 2 more |
| `15de3c5` | fix(SCRUM-173): add OAUTH_REGISTER to Prisma AuditAction enum | `prisma/schema.prisma`, `prisma/migrations/.../migration.sql` |

## 4. Deviations from Plan

| Step | Planned | Actual | Reason | Follow-up |
|------|---------|--------|--------|-----------|
| Step 1 | Add OAUTH_REGISTER to TypeScript enum only | Also added to Prisma schema + migration | Plan stated "No Prisma schema changes" but the Prisma-generated enum must match the TypeScript enum for type safety | Accepted |
| Step 3 | 3 separate test cases | 1 parameterized `it.each` with 3 cases | Cleaner pattern, same coverage | Accepted |
| Step 5 | Labels "OAuth Account Linked" / "OAuth Account Created" | Labels "OAuth Linked" / "OAuth Register" | Shorter labels consistent with existing style (e.g., "OAuth Login", "OAuth Unlinked") | Accepted |
| Frontend | Update types.ts not mentioned in plan | Added OAUTH_LINKED, OAUTH_REGISTER, OAUTH_UNLINKED to AuditAction type | Required for TypeScript type safety in AuditLogFilters.tsx | Accepted |

## 5. Test Results

- **Backend**: 152/152 passed (auth.service.spec.ts)
- **Frontend**: `next build` compiled successfully, types valid
- **Manual verification**: OAuth register flow tested — correct `OAUTH_REGISTER` audit log written after Prisma migration applied

## 6. Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| Prisma enum missing OAUTH_REGISTER causing runtime error on OAuth account creation | HIGH | Fixed | Added to schema.prisma + migration, applied via `prisma migrate deploy` |

## 7. Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/data-model.md` | Added `OAUTH_REGISTER` to AuditAction enum table, Prisma schema block, and OAuthAccount domain events |
| `ai-specs/specs/integration-state.md` | Updated last-update header to SCRUM-173, added changelog entry |

## 8. Lessons Learned

- When adding new values to a TypeScript enum that mirrors a Prisma enum, **always** update the Prisma schema and create a migration. The plan's "No Prisma schema changes" assumption was incorrect.
- `it.each` parameterized tests are cleaner than duplicating test boilerplate for variations of the same scenario.
- Frontend `AuditAction` type union must be kept in sync with backend enum — missing values cause TypeScript errors in filter/table components.
