# Implementation Record: SCRUM-161 Backend — Refactor OAuth Services + New Link/Unlink Endpoints

## 1. Summary

Refactored `findOrCreateByOAuth`, `unlinkOAuth`, and `verifyEmailChange` to use the `OAuthAccount` table (created in SCRUM-160). Added per-provider unlink endpoint, linked-providers listing endpoint, explicit `linkOAuthProvider` method, and updated `toSafeUser()` to return `oauthProviders[]`. Dual-write to `User.provider`/`providerId` maintained for backward compatibility until Phase D (SCRUM-163).

- **Scope**: backend
- **Branch**: `feature/SCRUM-161-backend`
- **Implementation date**: 2026-03-09
- **PR**: #44

## 2. Plan Reference

- **Plan**: `ai-specs/ai-specs/changes/plans/Sprint 6/SCRUM-161_backend.md`
- **Plan was followed**: Yes

## 3. Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `a6957bd` | feat(SCRUM-161): refactor OAuth services to use OAuthAccount table | `src/users/users.service.ts`, `src/users/users.controller.ts`, `src/users/entities/user.entity.ts`, `src/auth/auth.service.ts`, `src/common/constants/error-messages.ts` + 12 more |

## 4. Deviations from Plan

| Step | Planned | Actual | Reason | Follow-up |
|------|---------|--------|--------|-----------|
| Step 1 | `OAUTH_LINKED` already in TS enum | Had to add `OAUTH_LINKED` to `audit-action.enum.ts` | SCRUM-160 added it to Prisma schema enum but not the TypeScript enum | Accepted — fixed during implementation |

## 5. Files Changed

### New Files (1)

| File | Purpose |
|------|---------|
| `src/auth/interfaces/oauth-account.interface.ts` | `LinkedProvider` interface |

### Modified Source Files (6)

| File | Changes |
|------|---------|
| `src/users/users.service.ts` | Refactored `findOrCreateByOAuth` (OAuthAccount lookup + dual-write), `unlinkOAuth` (per-provider + OAuthAccount delete), added `getLinkedProviders()`, `linkOAuthProvider()`, updated `findById`/`findByEmail` includes |
| `src/users/users.controller.ts` | `GET /me/oauth` (new), `DELETE /me/oauth/:provider` (replaces `/me/oauth`), provider validation, added `BadRequestException` import |
| `src/users/entities/user.entity.ts` | `SafeUser` adds `oauthProviders: string[]`, `toSafeUser()` accepts optional `oauthAccounts` and maps to `oauthProviders` |
| `src/auth/auth.service.ts` | `verifyEmailChange()` — replaced `isOAuth` check with `oAuthAccount.count()`, added `oAuthAccount.deleteMany()` to transaction |
| `src/common/constants/error-messages.ts` | Added `oauth` section: `LINK_FAILED`, `NOT_LINKED`, `PASSWORD_REQUIRED_FOR_UNLINK`, `INVALID_PROVIDER` |
| `src/audit/enums/audit-action.enum.ts` | Added `OAUTH_LINKED` to TypeScript enum (was missing after SCRUM-160 schema change) |

### Modified Test Files (10)

| File | Changes |
|------|---------|
| `src/users/tests/users.service.spec.ts` | Rewrote `findOrCreateByOAuth` tests (OAuthAccount mocks), rewrote `unlinkOAuth` tests (per-provider), updated `findById`/`findByEmail` assertions, added `oAuthAccount` to Prisma mock |
| `src/auth/tests/auth.service.spec.ts` | Added `oAuthAccount` to Prisma mock, added 2 new `verifyEmailChange` OAuth tests |
| `src/users/tests/users.controller.spec.ts` | Added `getLinkedProviders` test, updated `unlinkOAuth` tests for provider param |
| `src/auth/tests/auth.controller.spec.ts` | Added `hasPassword`, `oauthProviders` to `mockAuthResult.user` |
| `src/auth/tests/google.strategy.spec.ts` | Added `hasPassword`, `oauthProviders` to `mockOAuthResult.user` |
| `src/auth/tests/github.strategy.spec.ts` | Added `hasPassword`, `oauthProviders` to `mockOAuthResult.user` |
| `src/auth/tests/mfa.controller.spec.ts` | Added `hasPassword`, `oauthProviders` to `mockSafeUser` |
| `src/auth/tests/passkey.controller.spec.ts` | Added `hasPassword`, `oauthProviders` to `mockSafeUser` |
| `src/auth/tests/oauth-exchange.spec.ts` | Added `hasPassword`, `oauthProviders` to `mockUser` |
| `src/auth/tests/oauth-code.store.spec.ts` | Added `hasPassword`, `oauthProviders` to `mockPayload.user` |

## 6. Test Results

- **Backend**: 44 suites, 825 tests — all pass
- **TypeScript**: `nest build` compiles clean
- **Net test change**: +4 (821 → 825)
  - +2 `verifyEmailChange` OAuth tests (auth.service.spec)
  - +1 `getLinkedProviders` controller test (users.controller.spec)
  - +1 `unlinkOAuth` remaining-provider test (users.service.spec)

## 7. Bugs Found

No bugs found during implementation.

## 8. Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Changelog entry, UsersController guard chains updated (see Part 2) |
| `ai-specs/specs/data-model.md` | SafeUser type updated (see Part 3) |
| `ai-specs/specs/api-spec.yml` | Endpoints updated (see Part 3) |

## 9. Lessons Learned

- The `OAUTH_LINKED` TypeScript enum was missing after SCRUM-160 because that ticket only modified the Prisma schema enum (auto-generated) but not the hand-written TypeScript enum. Future schema changes should always check both.
- Dual-write pattern (OAuthAccount + User.provider) adds complexity but is essential for zero-downtime migration. The `unlinkOAuth` method has to check remaining accounts to update the User field correctly.
- Prisma's `$transaction` with array syntax returns `undefined` for each operation in mock environments — assertions need to check array length rather than `objectContaining({})`.
