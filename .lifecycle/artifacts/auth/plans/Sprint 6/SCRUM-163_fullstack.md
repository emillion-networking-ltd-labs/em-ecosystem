# Fullstack Implementation Plan: SCRUM-163 Remove Deprecated User.provider/providerId Fields

## 1. Codebase State Snapshot

- **Date**: 2026-03-09
- **Last completed ticket**: SCRUM-162 (frontend multi-provider redesign)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `prisma/schema.prisma` — User model lines 65-97, Provider enum lines 15-19, OAuthAccount model lines 210-224
  - `src/users/entities/user.entity.ts` — User interface, SafeUser type, toSafeUser()
  - `src/users/users.service.ts` — create(), findOrCreateByOAuth(), linkOAuthProvider(), unlinkOAuth(), selfDeleteAccount()
  - `src/auth/auth.service.ts` — login() line 319 (provider check), verifyEmailChange() line 953 (dual-write), forgotPassword() line 1051 (provider check)
  - `src/users/enums/provider.enum.ts` — Provider enum (LOCAL, GOOGLE, GITHUB)
  - `src/common/interfaces/oauth-profile.interface.ts` — OAuthProfile with Provider
  - `nexacore-dashboard/src/lib/types.ts` — frontend SafeUser with provider/providerId
- **Constructor signatures verified**: UsersService(prisma, auditService, sessionsService, mailService, passwordBreachService, trustedDeviceService, tokenDenyListService) — 7 deps, unchanged
- **Methods verified to exist**: create(), findOrCreateByOAuth(), linkOAuthProvider(), unlinkOAuth(), selfDeleteAccount(), forgotPassword(), verifyEmailChange(), login()
- **Guard dependency chain verified**: No guard changes in this ticket
- **Discrepancies with integration-state.md**: None

## 2. Overview

Remove the deprecated `User.provider` and `User.providerId` fields that were kept for backward compatibility during the dual-write migration (SCRUM-160→162). All OAuth identity data now lives exclusively in the `OAuthAccount` table. This is Phase D (final) of SCRUM-158.

---

## Backend Implementation

## 3. Architecture Context

- **Modules involved**: UsersModule, AuthModule (service logic only — no DI changes)
- **Components affected**: Prisma schema, User entity, UsersService (dual-write removal), AuthService (provider checks), 12+ test files
- **Key constraint**: `Provider` enum and `provider.enum.ts` STAY — used by OAuthAccount model and OAuthProfile interface
- **What gets removed**: ONLY `User.provider` and `User.providerId` at database, entity, and SafeUser levels

## 4. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: `git checkout main && git pull origin main && git checkout -b feature/SCRUM-163-fullstack`

---

### Step 1: Remove provider/providerId from Prisma Schema

- **File**: `prisma/schema.prisma`
- **Action**: Remove 2 lines from User model

**Remove** (lines 73-74):
```prisma
  provider       Provider  @default(LOCAL)
  providerId     String?
```

**Keep**: Provider enum (lines 15-19) — used by OAuthAccount model.

---

### Step 2: Generate Migration

- **Action**: `npx prisma migrate dev --name remove-user-provider-fields`
- **Expected SQL**: `ALTER TABLE "users" DROP COLUMN "provider", DROP COLUMN "providerId"`
- **Note**: Data already migrated to `oauth_accounts` table in SCRUM-160. This is a safe column drop.

---

### Step 3: Remove from User Interface and SafeUser

- **File**: `src/users/entities/user.entity.ts`
- **Changes**:
  1. Remove `import { Provider } from '../enums/provider.enum';` (line 2)
  2. Remove `provider: Provider;` from User interface (line 12)
  3. Remove `providerId: string | null;` from User interface (line 13)
  4. Remove `provider: user.provider,` from toSafeUser() (line 49)
  5. Remove `providerId: user.providerId,` from toSafeUser() (line 50)

**After edit**, SafeUser will automatically exclude provider/providerId since they no longer exist in the base `User` type. The `Omit<>` type doesn't need changes.

---

### Step 4: Remove Dual-Write from UsersService

- **File**: `src/users/users.service.ts`

#### 4a: create() method (lines 71-94)
- Remove `provider?: Provider;` from parameter type (line 74)
- Remove `provider: data.provider || Provider.LOCAL,` from create data (line 81)
- If `Provider` import is no longer used elsewhere in this file, check — it IS still used in `unlinkOAuth()` line 835 for the OAuthAccount query (`provider as Provider`). **KEEP the import**.

#### 4b: findOrCreateByOAuth() — email-match path (lines 188-208)
- Remove `provider: profile.provider,` and `providerId: profile.providerId,` from the User update (lines 193-194)
- Keep the OAuthAccount create (lines 200-207) unchanged

#### 4c: findOrCreateByOAuth() — new-user path (lines 212-231)
- Remove `provider: profile.provider,` and `providerId: profile.providerId,` from User create data (lines 216-217)
- Keep the nested `oauthAccounts: { create: {...} }` (lines 220-226) unchanged

#### 4d: linkOAuthProvider() (lines 248-299)
- Remove the entire `await this.prisma.user.update(...)` block (lines 277-281, the "Dual-write to User.provider/providerId" section)
- Remove the comment "Dual-write to User.provider/providerId for backward compat" (line 277)

#### 4e: unlinkOAuth() (lines 820-891)
- Remove the entire dual-write block (lines 859-878):
  ```
  // Dual-write: check if user has remaining OAuthAccounts
  const remainingAccounts = await this.prisma.oAuthAccount.findFirst(...);
  if (!remainingAccounts) { ... } else { ... }
  ```
- This simplifies unlinkOAuth significantly — after deleting the OAuthAccount, go directly to the audit log

#### 4f: selfDeleteAccount() (line 780)
- Remove `providerId: null,` from the anonymization data in the $transaction

---

### Step 5: Update AuthService Provider Checks

- **File**: `src/auth/auth.service.ts`

#### 5a: login() email verification check (line 319)
- **Current**: `if (user.provider === Provider.LOCAL && !user.emailVerified)`
- **Replace with**: `if (user.passwordHash && !user.emailVerified)`
- **Rationale**: LOCAL users are identified by having a passwordHash. OAuth-only users don't need email verification (OAuth provider verified their email).
- Remove `import { Provider } from '../users/enums/provider.enum';` (line 21) if no other uses remain in auth.service.ts. Check line 953 first.

#### 5b: verifyEmailChange() dual-write (line 953)
- **Current**: `...(hasOAuthAccounts && { provider: 'LOCAL', providerId: null }),`
- **Remove this line entirely**. The OAuthAccount deleteMany (line 961) already handles the OAuth cleanup.

#### 5c: forgotPassword() provider check (line 1051)
- **Current**: `if (!user.passwordHash && user.provider !== 'LOCAL')`
- **Replace with**: `if (!user.passwordHash)`
- **Rationale**: If a user has no passwordHash, they can't reset a password regardless of provider. The `user.provider !== 'LOCAL'` check was redundant — a LOCAL user always has a passwordHash.

#### 5d: After all changes, verify if `Provider` import is still used. If not, remove it.

---

### Step 6: Frontend — Remove provider/providerId from SafeUser

- **File**: `nexacore-dashboard/src/lib/types.ts`
- **Remove** from SafeUser type:
  - `provider: 'LOCAL' | 'GOOGLE' | 'GITHUB';` (line 10)
  - `providerId: string | null;` (line 11)

- **Verify**: Run `npx tsc --noEmit` — should compile clean (no frontend code uses these fields after SCRUM-162).

---

### Step 7: Update Backend Test Mocks

- **Action**: Remove `provider: Provider.LOCAL` (or GOOGLE/GITHUB) and `providerId: null` (or string) from ALL mock User objects across test files.

**Files and approximate changes**:

| Test File | Changes |
|-----------|---------|
| `users/tests/users.service.spec.ts` | Remove provider/providerId from mockUser, all mock objects in findOrCreateByOAuth tests, unlinkOAuth tests. Remove dual-write assertions. ~50 instances |
| `auth/tests/auth.service.spec.ts` | Remove from mockUser + all test scenarios. Update login email-verification test to check passwordHash instead of provider. ~30 instances |
| `users/tests/users.controller.spec.ts` | Remove from mockSafeUser (lines 34-35). ~2 instances |
| `auth/tests/google.strategy.spec.ts` | Remove from mockOAuthResult.user (lines 35-36). Keep OAuthProfile provider/providerId. ~2 instances |
| `auth/tests/github.strategy.spec.ts` | Remove from mockOAuthResult.user (lines 35-36). Keep OAuthProfile provider/providerId. ~2 instances |
| `auth/tests/jwt.strategy.spec.ts` | Remove from mockUser (lines 23-24). ~2 instances |
| `auth/tests/passkey.service.spec.ts` | Remove from mockUser (lines 43-44). ~2 instances |
| `auth/tests/passkey.controller.spec.ts` | Remove from mockSafeUser (lines 40-41). ~2 instances |
| `auth/tests/mfa.service.spec.ts` | Remove from mockUser (lines 34-35). ~2 instances |
| `auth/tests/mfa.controller.spec.ts` | Remove from mockSafeUser (lines 38-39). ~2 instances |
| `auth/tests/oauth-code.store.spec.ts` | Remove from mockPayload.user (lines 21-22). ~2 instances |
| `auth/tests/oauth-exchange.spec.ts` | Remove from mockUser (lines 39-40). ~2 instances |
| `auth/tests/auth.controller.spec.ts` | Remove from mockAuthResult.user (lines 58-59). ~2 instances |

**IMPORTANT**: Do NOT remove `provider`/`providerId` from OAuthProfile mocks (google/github strategy tests) — those are OAuthProfile fields, not User fields.

---

### Step 8: Post-Implementation Integrity Check

1. `nest build` — must compile clean
2. `jest --maxWorkers=1 --forceExit` — all 825+ tests must pass
3. Frontend: `npx tsc --noEmit` — must compile clean
4. Verify zero references to `user.provider` or `user.providerId` in source code (excluding OAuthAccount/OAuthProfile contexts)

---

### Step 9: Update Technical Documentation

- **`ai-specs/specs/data-model.md`**: Remove `provider` and `providerId` from User entity definition
- **`ai-specs/specs/api-spec.yml`**: Remove `provider` and `providerId` from SafeUser schema response
- **`ai-specs/specs/integration-state.md`**: Changelog entry

---

## Frontend Implementation

The frontend change is minimal — only `src/lib/types.ts` needs updating (Step 6 above). No component changes since SCRUM-162 already migrated all frontend code to use `oauthProviders[]`.

---

## 5. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Remove from Prisma schema
3. Step 2: Generate migration
4. Step 3: Remove from User interface + SafeUser + toSafeUser()
5. Step 4: Remove dual-write from UsersService (6 locations)
6. Step 5: Update AuthService provider checks (3 locations)
7. Step 6: Frontend SafeUser cleanup
8. Step 7: Update test mocks (12+ files, 100+ instances)
9. Step 8: Post-implementation integrity check
10. Step 9: Update documentation

## 6. Testing Checklist

### Backend Compilation
- [ ] `nest build` compiles clean
- [ ] No TypeScript errors referencing `provider` or `providerId` on User type

### Backend Tests
- [ ] All 825+ tests pass
- [ ] findOrCreateByOAuth tests: no dual-write assertions
- [ ] unlinkOAuth tests: no User.provider update assertions
- [ ] login tests: email verification uses passwordHash check
- [ ] forgotPassword tests: OAuth-only detection uses !passwordHash

### Frontend
- [ ] `npx tsc --noEmit` compiles clean
- [ ] All 31 tests pass

### Code Audit
- [ ] `grep -r "user\.provider" src/` returns zero matches (excluding OAuthAccount contexts)
- [ ] `grep -r "user\.providerId" src/` returns zero matches
- [ ] Provider enum still exists in `users/enums/provider.enum.ts`
- [ ] OAuthAccount model still uses Provider enum

## 7. Error Response Format

No new error responses. Existing error responses unchanged.

## 8. Dependencies

No new external libraries. Only Prisma migration tooling.

## 9. Notes

- **Provider enum preserved**: The `Provider` enum (LOCAL, GOOGLE, GITHUB) stays in schema.prisma AND `provider.enum.ts` — it's used by `OAuthAccount.provider`, `OAuthProfile.provider`, and the `userId_provider` unique constraint.
- **OAuthProfile.provider/providerId preserved**: The strategies set these in the OAuth profile — they describe the OAuth identity, not a User field.
- **LinkedProvider.provider/providerId preserved**: The API response from `GET /users/me/oauth` uses these — they come from OAuthAccount, not User.
- **Migration safety**: All data was already migrated to `oauth_accounts` in SCRUM-160. The columns being dropped contain redundant data.
- **auth.service.ts line 319 logic change**: `user.provider === Provider.LOCAL` → `user.passwordHash` is semantically equivalent because LOCAL users always have a passwordHash (registration requires password), and OAuth-only users never have one (they authenticate via OAuth).

## 10. Next Steps After Implementation

1. Run `/commit SCRUM-163` to commit, push, create PR, merge
2. Run `/update-docs SCRUM-163` to create implementation record
3. SCRUM-158 (parent) can be marked Done — all 4 phases complete

## 11. Implementation Verification

- [ ] **Code Quality**: No TypeScript errors, clean removal of deprecated fields
- [ ] **Functionality**: All OAuth flows work via OAuthAccount table exclusively
- [ ] **Testing**: All 825+ backend tests + 31 frontend tests pass
- [ ] **Integration**: No dual-write logic remains
- [ ] **Documentation**: data-model.md, api-spec.yml, integration-state.md updated
- [ ] **Security**: No provider/providerId leaks in error messages or audit logs (audit logs can still log OAuthAccount.provider in metadata — that's OAuthAccount, not User)
