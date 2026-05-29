# Implementation Record: SCRUM-106 Redis-backed OAuth Stores

## Summary

Replaced in-memory `Map`-based `OAuthStateStore` and `OAuthCodeStore` with Redis-backed implementations using `ioredis`, enabling multi-instance deployment support. Created a reusable `@Global` `RedisModule` and migrated all consumers from sync to async.

- **Scope**: backend
- **Branch**: `feature/SCRUM-106-backend`
- **Implementation date**: 2026-03-02

## Plan Reference

- **Original plan**: `ai-specs/changes/plans/SCRUM-106_backend.md`
- **Plan was followed**: Yes

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `62f7ab8` | feat(SCRUM-106): replace in-memory OAuth stores with Redis-backed implementation | 22 files: 2 new (`redis.constants.ts`, `redis.module.ts`), 10 source files modified, 8 test files modified, `package.json`, `.env.example` |

## Deviations from Plan

| Step | Planned | Actual | Reason |
|------|---------|--------|--------|
| Step 7 | Modify `auth.module.ts` to remove `OAuthStateStore`/`OAuthCodeStore` from providers | Skipped — stores remain as AuthModule providers | Stores still need to be registered in AuthModule for DI resolution; `REDIS_CLIENT` is injected via `@Global` RedisModule, no module-level change needed |
| Step 15-16 | Update 6 test files | Updated 8 test files | `auth.controller.spec.ts` also needed `mockReturnValue` → `mockResolvedValue` for `generateOAuthCode`/`exchangeOAuthCode`; not listed in original plan |

## Test Results

- **Overall coverage**: stmts 98.41%, branches 86.85%, funcs 93.84%, lines 98.56%
- **Unit tests**: 557 passed / 0 failed (36 suites)
- **Build**: `nest build` passes cleanly
- **Manual verification**: N/A (infrastructure change, no new API surface)

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Added `RedisModule` to Module Registry. Updated `AppModule` imports to include `RedisModule`. Added `OAuthStateStore` and `OAuthCodeStore` to Service Dependency Chains (both depend on `REDIS_CLIENT`). Added `OAuthCodeStore` to `AuthService` dependency chain. Added SCRUM-106 changelog entry. |

No changes needed for:
- `api-spec.yml` — no new/modified endpoints
- `data-model.md` — no schema changes
- `*-standards.mdc` — no convention changes

## Lessons Learned

- **Sync-to-async migration has wide blast radius**: Changing store methods from sync to async required updates in guards, strategies, service, controller, AND 8 test files. The plan correctly anticipated most of these but missed `auth.controller.spec.ts`.
- **`oauth-exchange.spec.ts` needed full rewrite**: The integration test instantiated a real `OAuthCodeStore()` with no constructor args. After Redis migration, it requires a Redis client injection, so the test was rewritten to use an in-memory `Map` mock simulating the store behavior.
- **`@Global` module pattern works well**: Following the existing `CryptoModule`/`PrismaModule` pattern made `REDIS_CLIENT` available everywhere without explicit imports — stores didn't need any module-level changes.
