# Implementation Record: SCRUM-210 Add updatedAt to Session/WebAuthn + Permission Seed

## Summary

Added `@updatedAt` to Session and WebAuthnCredential Prisma models and created standalone `prisma/seed.ts` for permission seeding.

- **Scope:** backend
- **Branch:** `feature/SCRUM-210-backend`
- **Date:** 2026-03-13

## Plan Reference

- Plan: `ai-specs/changes/plans/Sprint 9/SCRUM-210_backend.md`
- Plan was followed: **Yes**

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `0d10ed8` | fix(data-model): add updatedAt to Session/WebAuthn + create permission seed (SCRUM-210) | `schema.prisma`, `seed.ts`, `session.entity.ts`, `package.json`, `tsconfig.build.json`, 4 test files, migration SQL |

## Deviations from Plan

| Step | Planned | Actual | Reason | Follow-up |
|------|---------|--------|--------|-----------|
| Step 2 | `prisma migrate dev --create-only` | Manual migration directory + SQL | Prisma rejected migration due to existing rows without default value | Accepted |
| — | — | Added `prisma/seed.ts` to `tsconfig.build.json` exclude list | seed.ts outside `rootDir: ./src` caused TS6059 build error | Accepted |

## Test Results

- Unit tests: 859 passed / 0 failed
- `nest build`: clean
- `prisma generate`: succeeds with updated schema

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/data-model.md` | Added `updatedAt DateTime @updatedAt` to Session and WebAuthnCredential models |
| `ai-specs/specs/integration-state.md` | Added changelog entry for SCRUM-210 |

## Lessons Learned

- Prisma `migrate dev --create-only` fails when adding required columns to tables with existing data — manual migration SQL with `DEFAULT CURRENT_TIMESTAMP` is needed
- Seed files at `prisma/seed.ts` are outside NestJS `rootDir: ./src` and must be excluded from `tsconfig.build.json` to avoid TS6059 errors
- Duplicate permission constants in seed file (vs importing from src/) avoids cross-boundary import issues between Prisma context and NestJS context
