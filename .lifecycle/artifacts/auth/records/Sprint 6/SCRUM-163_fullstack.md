# Implementation Record: SCRUM-163 — Remove Deprecated User.provider/providerId Fields

## 1. Summary

Removed the deprecated `User.provider` and `User.providerId` fields that were kept for backward compatibility during the dual-write migration (SCRUM-160→162). All OAuth identity data now lives exclusively in the `OAuthAccount` table. Phase D (final) of SCRUM-158.

- **Scope**: fullstack
- **Branch**: `feature/SCRUM-163-fullstack`
- **Implementation date**: 2026-03-09
- **PR**: #46

## 2. Plan Reference

- **Plan**: `ai-specs/ai-specs/changes/plans/Sprint 6/SCRUM-163_fullstack.md`
- **Plan was followed**: Yes (with 1 deviation)

## 3. Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `cbb42e9` | feat(SCRUM-163): remove deprecated User.provider/providerId fields | `prisma/schema.prisma`, `src/users/users.service.ts`, `src/auth/auth.service.ts`, `src/users/entities/user.entity.ts`, `src/lib/types.ts` + 13 more |

## 4. Deviations from Plan

| Step | Planned | Actual | Reason | Follow-up |
|------|---------|--------|--------|-----------|
| Step 7 | Update test: "should allow login for OAuth-only user with unverified email" to use passwordHash check | Removed the test entirely | The test was asserting that an OAuth-only user (no passwordHash) could log in via password endpoint with unverified email. This scenario is impossible — users without passwordHash are rejected by the `!user.passwordHash` guard before reaching the email verification check. The old test only passed because `provider: Provider.GOOGLE` bypassed the `provider === Provider.LOCAL` check, masking the fact that the flow would fail earlier. | Accepted |
| Step 2 | Generate Prisma migration | Skipped — no database access from dev environment | Migration SQL (`ALTER TABLE "users" DROP COLUMN "provider", DROP COLUMN "providerId"`) will be generated when deploying to an environment with a database. **DEPLOY NOTE**: Run `npx prisma migrate dev` on first deployment to generate and apply this migration automatically. | Accepted |

## 5. Files Changed

### Modified Source Files (5)

| File | Changes |
|------|---------|
| `nexacore-api/prisma/schema.prisma` | Removed `provider Provider @default(LOCAL)` and `providerId String?` from User model. Provider enum kept for OAuthAccount. |
| `nexacore-api/src/users/entities/user.entity.ts` | Removed `Provider` import, `provider`/`providerId` from User interface, removed from toSafeUser() mapping |
| `nexacore-api/src/users/users.service.ts` | Removed dual-write from 6 locations: `create()` (provider param), `findOrCreateByOAuth()` (2 paths), `linkOAuthProvider()`, `unlinkOAuth()`, `selfDeleteAccount()`. Provider import kept for `unlinkOAuth` cast. |
| `nexacore-api/src/auth/auth.service.ts` | `login()`: email check changed from `user.provider === Provider.LOCAL` to `user.passwordHash`. `verifyEmailChange()`: removed `provider: 'LOCAL', providerId: null` dual-write. `forgotPassword()`: simplified to `!user.passwordHash`. Removed unused `Provider` import. |
| `nexacore-dashboard/src/lib/types.ts` | Removed `provider` and `providerId` from SafeUser type |

### Modified Test Files (13)

| File | Changes |
|------|---------|
| `auth/tests/users.service.spec.ts` | Removed provider/providerId from mockUser and all OAuth test mocks. Removed dual-write assertions from unlinkOAuth tests. Removed "update user to remaining provider" test. ~50 instances. |
| `auth/tests/auth.service.spec.ts` | Removed provider/providerId from mockUser and all test scenarios. Removed impossible OAuth-only login test. Updated test descriptions. ~30 instances. |
| `auth/tests/auth.controller.spec.ts` | Removed from mockAuthResult.user, removed Provider import |
| `auth/tests/google.strategy.spec.ts` | Removed from mockOAuthResult.user (kept OAuthProfile provider) |
| `auth/tests/github.strategy.spec.ts` | Removed from mockOAuthResult.user (kept OAuthProfile provider) |
| `auth/tests/jwt.strategy.spec.ts` | Removed from mockUser, removed Provider import |
| `auth/tests/mfa.service.spec.ts` | Removed from mockUser, removed Provider import |
| `auth/tests/mfa.controller.spec.ts` | Removed from mockSafeUser, removed Provider import |
| `auth/tests/passkey.service.spec.ts` | Removed from mockUser + OAuth override, removed Provider import |
| `auth/tests/passkey.controller.spec.ts` | Removed from mockSafeUser, removed Provider import |
| `auth/tests/oauth-exchange.spec.ts` | Removed from mockUser, removed Provider import |
| `auth/tests/oauth-code.store.spec.ts` | Removed from mockPayload.user, removed Provider import |
| `users/tests/users.controller.spec.ts` | Removed from mockSafeUser, removed Provider import |

## 6. Test Results

- **Backend**: 44 suites, 822 tests — all pass (net: -1 test removed — impossible scenario)
- **Frontend**: 7 suites, 31 tests — all pass
- **TypeScript**: `nest build` + `tsc --noEmit` both compile clean
- **Code audit**: `grep -r "user\.provider" src/` returns zero matches (excluding OAuthAccount/OAuthProfile contexts)

## 7. Bugs Found

No bugs found during implementation.

## 8. Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/data-model.md` | Removed `provider` and `providerId` from User entity fields, validation rules, Prisma schema, TypeScript interface, and ERD |
| `ai-specs/specs/api-spec.yml` | Removed `provider` and `providerId` from SafeUser schema |
| `ai-specs/specs/integration-state.md` | Changelog entry added |

## 9. Lessons Learned

- The `user.provider === Provider.LOCAL` email verification check masked an unreachable code path for OAuth-only users trying password login — the `!user.passwordHash` guard catches them first. The `passwordHash`-based check is both simpler and more correct.
- Removing dual-write simplified `unlinkOAuth` significantly — eliminated the 20-line block that checked remaining accounts and updated User.provider/providerId.
- Provider enum preservation is important to document clearly — it's easy to assume "remove provider" means "remove Provider enum" when the enum is still needed for OAuthAccount.
