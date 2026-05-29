# Implementation Record: SCRUM-5 Authentication System (Email + OAuth + Dashboard Access)

## Summary

- **What**: Complete backend authentication system for EM NexaCore: email/password registration+login, Google+GitHub OAuth, JWT tokens, RBAC, OpenAPI docs, e2e tests, Prisma migration
- **Scope**: `backend`
- **Branch**: `feature/SCRUM-5-backend` (subtasks on `feature/SCRUM-6-backend` through `feature/SCRUM-9-backend`, merged via `8baf4f9`)
- **Dates**: 2026-02-18 to 2026-02-22

## Plan Reference

- **Original plan**: `ai-specs/changes/plans/SCRUM-5_backend.md`
- **Plan was followed**: Partially — Plan was written retroactively (post-implementation) and aligned to actual code. The plan documents the final state accurately. Original development was done subtask-by-subtask without a pre-written plan.

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `9df9b0f` | feat(SCRUM-6): implement User entity, registration, and password hashing | `prisma/schema.prisma`, `src/auth/auth.service.ts`, `src/auth/dto/register.dto.ts`, `src/users/users.service.ts`, `src/users/entities/user.entity.ts`, `src/common/filters/http-exception.filter.ts`, `src/prisma/prisma.service.ts` (33 files, 12,686 insertions) |
| `40ba568` | feat(SCRUM-7): implement email/password login and token management | `src/auth/auth.controller.ts`, `src/auth/auth.service.ts`, `src/auth/dto/login.dto.ts`, `src/auth/strategies/jwt.strategy.ts`, `src/auth/guards/jwt-auth.guard.ts` (13 files, +662/-81) |
| `fedd782` | feat(SCRUM-8): implement OAuth integration for Google and GitHub | `src/auth/strategies/google.strategy.ts`, `src/auth/strategies/github.strategy.ts`, `src/auth/guards/google-auth.guard.ts`, `src/auth/guards/github-auth.guard.ts`, `src/common/interfaces/oauth-profile.interface.ts` (18 files, +770/-7) |
| `606ee36` | feat(SCRUM-9): implement dashboard access control with guards and roles | `src/auth/guards/roles.guard.ts`, `src/common/decorators/roles.decorator.ts`, `src/auth/auth.controller.ts` (6 files, +191) |
| `8baf4f9` | Merge feature/SCRUM-9-backend: complete backend authentication system (SCRUM-6 through SCRUM-9) | Merge commit |
| `0ebb2c5` | feat(SCRUM-5): add OpenAPI/Swagger docs, e2e tests, and Prisma migration | `nexacore-api/src/main.ts`, `nexacore-api/test/app.e2e-spec.ts`, `nexacore-api/prisma/migrations/0001_init/migration.sql` (9 files, +550/-17) |
| `9cf6a3b` | fix(nexacore-api): Prisma 7 adapter pattern, dotenv loading and validation message | `nexacore-api/src/prisma/prisma.service.ts`, `nexacore-api/src/main.ts`, `nexacore-api/package.json` (5 files, +199/-1) |

> Note: `9cf6a3b` was committed as part of SCRUM-19 work but fixes backend issues from SCRUM-5.

## Deviations from Plan

Since the plan was written retroactively and aligned to the final code state, there are no deviations between plan and implementation. However, there are notable engineering decisions made during development:

| Decision | Context | Outcome |
|----------|---------|---------|
| Prisma 7 driver adapter | Prisma 7 removed `url` in datasource and `datasourceUrl` in constructor | Used `PrismaPg` adapter from `@prisma/adapter-pg` instead of URL-based connection |
| `dotenv/config` import in main.ts | NestJS does not auto-load `.env` files | Added explicit import as first line in `main.ts` |
| Hashed refresh token storage | Security best practice | `refreshToken` field in DB stores bcrypt hash, not raw token |
| `GET /users/:id` returns 200 for non-existent users | Controller uses `SafeUser` type but `findById` returns null without throwing | Documented as code smell in plan; deferred to SCRUM-22 security hardening |

## Test Results

- **Unit tests**: All passing (`auth.controller.spec.ts`, `auth.service.spec.ts`, `users.service.spec.ts`, `jwt.strategy.spec.ts`, `google.strategy.spec.ts`, `github.strategy.spec.ts`, `roles.guard.spec.ts`, `http-exception.filter.spec.ts`)
- **E2E tests**: 362+ lines in `test/app.e2e-spec.ts` covering registration, login, token refresh, OAuth flows, role guards
- **Manual verification**: Full auth flow tested (register -> login -> refresh -> logout -> OAuth)
- **Coverage**: No formal coverage metrics captured

## Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| Prisma 7 `datasourceUrl` removed | HIGH | Fixed in `9cf6a3b` | Migrated to `PrismaPg` driver adapter pattern |
| dotenv not loading in NestJS | MEDIUM | Fixed in `9cf6a3b` | Added `import 'dotenv/config'` in main.ts |
| Register DTO validation message too long | LOW | Fixed in `9cf6a3b` | Shortened special character requirement message |
| `GET /users/:id` returns 200 for non-existent users | LOW | Deferred to SCRUM-22 | Documented as code smell |

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/data-model.md` | User entity, Role enum, Provider enum documented |
| `ai-specs/specs/api-spec.yml` | Auth endpoints: register, login, refresh, logout, me, OAuth (Google+GitHub), admin protected |
| `ai-specs/changes/plans/SCRUM-5_backend.md` | Retroactive plan created and aligned to code |

## Lessons Learned

- **What went well**: Subtask-by-subtask approach (SCRUM-6 through SCRUM-9) enabled incremental, testable progress. Each commit was self-contained and buildable.
- **What was harder than expected**: Prisma 7 breaking changes (adapter pattern) required a fix commit after initial implementation. NestJS dotenv loading was non-obvious.
- **Recommendations**: Always test with the exact Prisma version in package.json before committing. Document NestJS bootstrap requirements (env loading, CORS, global pipes/filters) in backend-standards.mdc.
