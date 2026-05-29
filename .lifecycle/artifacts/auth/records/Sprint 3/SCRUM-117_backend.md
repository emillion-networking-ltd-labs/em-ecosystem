# Implementation Record: SCRUM-117 Add jti Claim to JWT Tokens + Redis Deny-List

## Summary

Added RFC 8725 §3.9 compliant `jti` (JWT ID) claim to all access tokens and implemented a Redis-backed token deny-list for immediate access token revocation on security-sensitive events. Installed ioredis and created `@Global` RedisModule infrastructure, `TokenDenyListService` with fail-open pattern, and integrated deny calls at 4 security event points.

- **Scope**: backend
- **Branch**: `feature/SCRUM-117-backend`
- **Implementation date**: 2026-03-04
- **PR**: #16

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 3/SCRUM-117_backend.md`
- **Plan was followed**: Partially — the plan was written against a stale codebase snapshot (described 11 AuthService deps, 6 UsersService deps, 10 AuthModule providers). The actual `main` branch had a much simpler codebase (2 AuthService deps, 1 UsersService dep, 4 AuthModule providers). The core design (jti + user-level deny-list + fail-open) was followed exactly. See deviations below.

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `835acdb` | feat(SCRUM-117): add jti claim to JWT tokens and Redis deny-list | 16 files (4 new, 12 modified) |

## Deviations from Plan

| Step | Planned | Actual | Reason |
|------|---------|--------|--------|
| Prerequisites | "No new npm packages — uses existing ioredis" | Installed `ioredis` + created `RedisModule` + `redis.constants.ts` | Plan incorrectly stated Redis was already available; `main` had no Redis infrastructure |
| Step 4 (AuthService) | 4 deny points: logout, logoutAll, resetPassword, verifyEmailChange | 1 deny point: logout | `logoutAll()`, `resetPassword()`, `verifyEmailChange()` don't exist on `main` |
| Step 6 (UsersService) | 5 deny points: changePassword, adminUpdateUser, softDelete, selfDeleteAccount, unlinkOAuth | 3 deny points: changePassword, adminUpdateUser, softDelete | `selfDeleteAccount()`, `unlinkOAuth()` don't exist on `main` |
| Step 4 (AuthService deps) | 12th constructor dep (after suspiciousLoginService) | 3rd constructor dep (after jwtService) | `main` has only 2 existing deps |
| Step 6 (UsersService deps) | 7th constructor dep via forwardRef | 2nd constructor dep via forwardRef | `main` has only 1 existing dep (PrismaService) |
| Step 3 (signing locations) | 2 signing locations (generateTokens L673 + refreshTokens L495) | 1 signing location (generateTokens L141) | `main` has single `generateTokens()` called by both register/login and refreshTokens |
| Step 7 (AuthModule) | 11th provider, 4th export | 2nd provider, 2nd export | Simpler module on `main` |

## Test Results

- **Tests**: 106 passed / 0 failed (9 suites)
- **Coverage** (new code):
  - `token-deny-list.service.ts`: 100% stmts, 87.5% branches, 100% funcs, 100% lines
  - `auth.service.ts`: 100% stmts, 92.85% branches, 100% funcs, 100% lines
  - `jwt.strategy.ts`: 100% stmts, 85.71% branches, 100% funcs, 100% lines
- **Global coverage**: Below thresholds (80.09% stmts) — pre-existing gap from untested `users.controller.ts` and DTO files, not related to SCRUM-117
- **Build**: `nest build` — zero TypeScript errors

## Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| Prisma client stale — `prisma generate` fails with config parse error | LOW | Fixed | Temporarily renamed `prisma.config.js` during regeneration; root cause is compiled JS config conflicting with TS config on Prisma v7.4 |

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Added TokenDenyListService to AuthModule exports, AuthService/JwtStrategy/UsersService dep chains, test mock reqs, changelog entry |

## Lessons Learned

- **Plan codebase snapshots must match the actual branch target**: The plan was written from a summary of a previous conversation that described a more complex codebase. The actual `main` branch was much simpler. Always verify against the real checkout, not memory.
- **Redis infrastructure as a prerequisite**: When a feature depends on infrastructure that doesn't exist yet, this should be a separate ticket or documented as a prerequisite in the plan.
- **Fire-and-forget pattern works well**: The `.catch(() => {})` pattern for deny calls kept the implementation simple while maintaining the defense-in-depth goal.
