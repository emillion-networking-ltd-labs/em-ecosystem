# Implementation Plan: SCRUM-161 Backend — Refactor OAuth Services + New Link/Unlink Endpoints

## 1. Ticket Summary

Refactor `findOrCreateByOAuth()` and `unlinkOAuth()` to use the new `OAuthAccount` table (created in SCRUM-160). Add per-provider unlink, linked-providers listing, explicit `linkOAuthProvider()`, and update `toSafeUser()` to return `oauthProviders[]` instead of `provider`/`providerId`.

- **Scope**: backend
- **Type**: Subtask of SCRUM-158 (Phase B)
- **Parent plan**: `ai-specs/ai-specs/changes/plans/Backlog/SCRUM-158_fullstack.md` (Phase B, sections 5.B1–5.B10)
- **Depends on**: SCRUM-160 (Phase A — OAuthAccount schema + data migration) ✅ DONE

## 2. Current State Analysis

### 2.1 OAuth Data Flow (current — single provider on User)

```
OAuth Login → Strategy.validate() → AuthService.validateOAuthUser()
  → UsersService.findOrCreateByOAuth(profile)
    → Scenario 1: user.provider === profile.provider → login
    → Scenario 2: user.provider === LOCAL → overwrite provider/providerId → linked
    → Scenario 3: different OAuth provider → login (no cross-OAuth link)
    → Scenario 4: no user found → create with provider/providerId → created
  → Returns AuthResult { accessToken, user: SafeUser, cookie, oauthAction }
```

### 2.2 Key Methods to Refactor

| Method | File | Lines | Current Behavior |
|--------|------|-------|-----------------|
| `findOrCreateByOAuth()` | users.service.ts | 130–199 | Email-based lookup, writes `provider`/`providerId` on User |
| `unlinkOAuth()` | users.service.ts | 720–770 | Resets User.provider→LOCAL, no provider param |
| `validateOAuthUser()` | auth.service.ts | 552–596 | Delegates to findOrCreateByOAuth, returns AuthResult |
| `verifyEmailChange()` | auth.service.ts | 898–982 | Line 953: `...(isOAuth && { provider: 'LOCAL', providerId: null })` |
| `toSafeUser()` | user.entity.ts | 38–56 | Returns `provider` + `providerId` on SafeUser |

### 2.3 Endpoints to Modify

| Method | Path | Controller | Current |
|--------|------|-----------|---------|
| DELETE | `/users/me/oauth` | UsersController:99–112 | Single unlink (no provider param) |

### 2.4 New Endpoints Needed

| Method | Path | Controller | Purpose |
|--------|------|-----------|---------|
| GET | `/users/me/oauth` | UsersController | List linked OAuth providers |
| DELETE | `/users/me/oauth/:provider` | UsersController | Unlink specific provider |

### 2.5 Dual-Write Strategy

During Phase B, **both** `User.provider`/`providerId` AND `OAuthAccount` table are written to. This preserves backward compatibility for any code still reading the old fields. Phase D (SCRUM-163) removes the old fields.

## 3. Codebase State Snapshot

### 3.1 Module Dependencies

No new modules needed. Changes are in `UsersModule` (service + controller) and `AuthModule` (auth.service).

### 3.2 Guard Dependencies

No guard changes. Existing `JwtAuthGuard` protects new endpoints.

### 3.3 Constructor Signatures

**UsersService** (users.service.ts:43–55):
```typescript
constructor(
  private readonly prisma: PrismaService,
  private readonly auditService: AuditService,
  private readonly sessionsService: SessionsService,
  private readonly mailService: MailService,
  @Inject(forwardRef(() => PasswordBreachService))
  private readonly passwordBreachService: PasswordBreachService,
  @Inject(forwardRef(() => TrustedDeviceService))
  private readonly trustedDeviceService: TrustedDeviceService,
  // ... tokenDenyListService
)
```

**AuthService** (auth.service.ts): 13 constructor params including usersService, jwtService, auditService, sessionsService, etc.

### 3.4 Test Baseline

44 suites, 821 tests — all passing (verified after SCRUM-160).

### 3.5 Test Files with OAuth Mocks

Files containing `mockUser` with `provider`/`providerId` (13 total):

| File | OAuth-specific tests |
|------|---------------------|
| `users/tests/users.service.spec.ts` | findOrCreateByOAuth (10+ cases), unlinkOAuth (11+ cases) |
| `auth/tests/auth.service.spec.ts` | validateOAuthUser (6+ cases), verifyEmailChange OAuth unlink |
| `users/tests/users.controller.spec.ts` | DELETE /me/oauth endpoint |
| `auth/tests/auth.controller.spec.ts` | OAuth login propagation |
| `auth/tests/google.strategy.spec.ts` | Google profile parsing, state validation |
| `auth/tests/github.strategy.spec.ts` | GitHub displayName splitting, state validation |
| `auth/tests/jwt.strategy.spec.ts` | Mock user includes provider |
| `auth/tests/passkey.service.spec.ts` | Mock user includes provider |
| `auth/tests/passkey.controller.spec.ts` | Mock user includes provider |
| `auth/tests/mfa.service.spec.ts` | Mock user includes provider |
| `auth/tests/mfa.controller.spec.ts` | Mock user includes provider |
| `auth/tests/oauth-exchange.spec.ts` | Mock user |
| `auth/tests/oauth-code.store.spec.ts` | Mock user |

## 4. Implementation Steps

### Step 1: Create LinkedProvider interface

**New file**: `src/auth/interfaces/oauth-account.interface.ts`

```typescript
export interface LinkedProvider {
  provider: string;
  providerId: string;
  email: string;
  linkedAt: string; // ISO date
}
```

### Step 2: Refactor `findOrCreateByOAuth()` (users.service.ts:130–199)

Replace email-based + User.provider logic with OAuthAccount table:

```
1. Look up OAuthAccount by (provider, providerId)
   → Found: load user, update profile fields if empty → action: 'login'
2. Look up User by email
   → Found + emailVerified: create OAuthAccount row + dual-write User.provider → action: 'linked'
   → Found + !emailVerified: throw ConflictException (unchanged)
   → Found + already has this provider linked (different providerId): impossible due to @@unique([userId, provider])
3. Not found: create User + OAuthAccount in transaction → action: 'created'
```

Key changes from current:
- Line 143–145: `existingUser.provider === profile.provider` → `prisma.oAuthAccount.findUnique({ where: { provider_providerId: { provider, providerId } } })`
- Line 174–183: `User.update({ provider, providerId })` → `prisma.oAuthAccount.create({ userId, provider, providerId, email })` + dual-write User fields
- Line 189–198: `User.create({ provider, providerId })` → `prisma.$transaction` creating both User and OAuthAccount
- Line 167: `existingUser.provider === Provider.LOCAL` → check if user has NO OAuthAccount for this provider (allow linking additional providers)

**IMPORTANT**: The auto-link path (Scenario 2) now supports linking a SECOND provider. If the user already has GOOGLE linked and logs in with GITHUB, a new OAuthAccount row is created (was previously blocked by single-provider model). The `@@unique([userId, provider])` constraint prevents duplicates.

**Dual-write**: When creating/linking OAuthAccounts, ALSO update `User.provider` and `User.providerId` to the MOST RECENTLY linked provider. This keeps backward compat until Phase D.

### Step 3: Add `getLinkedProviders()` (users.service.ts)

```typescript
async getLinkedProviders(userId: string): Promise<LinkedProvider[]> {
  const accounts = await this.prisma.oAuthAccount.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
  return accounts.map(a => ({
    provider: a.provider,
    providerId: a.providerId,
    email: a.email,
    linkedAt: a.createdAt.toISOString(),
  }));
}
```

### Step 4: Add `linkOAuthProvider()` (users.service.ts)

For the explicit linking flow (authenticated user adds a provider):

```typescript
async linkOAuthProvider(
  userId: string,
  profile: OAuthProfile,
  ctx?: RequestContext,
): Promise<LinkedProvider> {
  // 1. Check OAuthAccount doesn't already exist for (provider, providerId)
  const existingAccount = await this.prisma.oAuthAccount.findUnique({
    where: { provider_providerId: { provider: profile.provider, providerId: profile.providerId } },
  });
  if (existingAccount) {
    // CWE-200: Don't reveal if the OAuth identity belongs to another user
    throw new ConflictException('Unable to link this provider');
  }

  // 2. Create OAuthAccount row (@@unique([userId, provider]) prevents duplicates)
  const account = await this.prisma.oAuthAccount.create({
    data: {
      userId,
      provider: profile.provider,
      providerId: profile.providerId,
      email: profile.email,
    },
  });

  // 3. Dual-write to User.provider/providerId
  await this.prisma.user.update({
    where: { id: userId },
    data: { provider: profile.provider, providerId: profile.providerId },
  });

  // 4. Audit
  this.auditService.log({
    action: AuditAction.OAUTH_LINKED,
    userId,
    ipAddress: ctx?.ipAddress,
    userAgent: ctx?.userAgent,
    metadata: { provider: profile.provider },
  }).catch(() => {});

  return {
    provider: account.provider,
    providerId: account.providerId,
    email: account.email,
    linkedAt: account.createdAt.toISOString(),
  };
}
```

### Step 5: Refactor `unlinkOAuth()` (users.service.ts:720–770)

Change signature: `unlinkOAuth(userId, provider, dto, ctx?)` — adds `provider: string` param.

New logic:
```
1. Find user (unchanged CWE-200 guard)
2. Find OAuthAccount where (userId, provider)
   → Not found: throw BadRequestException('No OAuth provider linked')
3. Check user has password (prevent lockout — must have alternate auth method)
   → Future: could also check if user has OTHER OAuthAccounts
4. Validate password via bcrypt (unchanged)
5. Delete OAuthAccount row
6. If user has no remaining OAuthAccounts → dual-write User.provider=LOCAL, providerId=null
   Else → dual-write User.provider/providerId to the remaining account
7. Audit OAUTH_UNLINKED with provider metadata
```

### Step 6: Refactor `verifyEmailChange()` (auth.service.ts:944–960)

Replace line 953:
```typescript
// OLD: ...(isOAuth && { provider: 'LOCAL', providerId: null }),
// NEW: Delete all OAuthAccounts for this user (email is changing, all provider links are stale)
```

Change the `$transaction` to include:
```typescript
this.prisma.oAuthAccount.deleteMany({ where: { userId: user.id } }),
```

Also dual-write `User.provider = 'LOCAL', User.providerId = null` in the same transaction (keep current behavior for backward compat).

The `isOAuth` check changes from `user.provider !== 'LOCAL'` to checking if user has any OAuthAccounts:
```typescript
const hasOAuthAccounts = await this.prisma.oAuthAccount.count({ where: { userId: user.id } }) > 0;
```

### Step 7: Update `toSafeUser()` and `SafeUser` type (user.entity.ts)

**SafeUser type** (line 27–32):
- Keep `provider` and `providerId` (backward compat until Phase D)
- Add `oauthProviders: string[]`

```typescript
export type SafeUser = Omit<
  User,
  'passwordHash' | 'pendingEmail' | 'mfaSecret' | 'mfaRecoveryCodes' | 'failedAttempts' | 'lockedUntil' | 'lockoutCount'
> & {
  hasPassword: boolean;
  oauthProviders: string[];
};
```

**toSafeUser()** (line 38–56):
- Accept optional `oauthAccounts` parameter
- Populate `oauthProviders` from the relation

```typescript
export function toSafeUser(
  user: User & { oauthAccounts?: { provider: string }[] },
): SafeUser {
  return {
    // ... existing fields (keep provider, providerId for now) ...
    oauthProviders: (user.oauthAccounts ?? []).map(a => a.provider),
    hasPassword: !!user.passwordHash,
  };
}
```

### Step 8: Update queries to include oauthAccounts

Every `findById()` and `findByEmail()` call that feeds into `toSafeUser()` must include `oauthAccounts: true`:

```typescript
// In findById():
return this.prisma.user.findUnique({
  where: { id },
  include: { oauthAccounts: { select: { provider: true } } },
});

// In findByEmail():
return this.prisma.user.findUnique({
  where: { email },
  include: { oauthAccounts: { select: { provider: true } } },
});
```

**Note**: This changes the return type. The `User` interface stays unchanged (no `oauthAccounts` property), but Prisma returns it as an extended object. `toSafeUser()` uses the optional `oauthAccounts?` parameter.

Calls to update:
- `users.service.ts`: `findById()`, `findByEmail()` — add `include: { oauthAccounts: { select: { provider: true } } }`
- `auth.service.ts`: `validateOAuthUser()` line 592 — `toSafeUser(user)` already receives user from `findOrCreateByOAuth` which now includes oauthAccounts
- `auth.controller.ts`: `getMe()` — calls `findById` → `toSafeUser`
- `users.controller.ts`: `getUser()` line 146 — calls `findById` → `toSafeUser`

### Step 9: Update controller endpoints (users.controller.ts)

**Modify**: `DELETE /me/oauth` → `DELETE /me/oauth/:provider`

```typescript
@Delete('me/oauth/:provider')
@UseGuards(JwtAuthGuard)
@Throttle({ global: { ttl: 60_000, limit: 5 } })
@HttpCode(HttpStatus.OK)
async unlinkOAuth(
  @Param('provider') provider: string,
  @Request() req: { user: { id: string }; ip?: string; headers?: Record<string, string> },
  @Body() dto: UnlinkOAuthDto,
) {
  return this.usersService.unlinkOAuth(req.user.id, provider.toUpperCase(), dto, {
    ipAddress: req.ip || null,
    userAgent: req.headers?.['user-agent'] || null,
  });
}
```

**Add**: `GET /me/oauth`

```typescript
@Get('me/oauth')
@UseGuards(JwtAuthGuard)
async getLinkedProviders(@Request() req: { user: { id: string } }) {
  return this.usersService.getLinkedProviders(req.user.id);
}
```

**Provider validation**: Add a `ParseProviderPipe` or inline validation in `unlinkOAuth` to ensure provider is `GOOGLE` or `GITHUB` (reject invalid values with `BadRequestException`).

### Step 10: Update `validateOAuthUser()` (auth.service.ts:552–596)

Minimal changes — `findOrCreateByOAuth` now handles OAuthAccount internally. The only change is ensuring the returned user includes `oauthAccounts` for `toSafeUser()`:

```typescript
// Line 557: findOrCreateByOAuth already returns user with oauthAccounts included
const { user, action } = await this.usersService.findOrCreateByOAuth(profile);
// Line 592: toSafeUser(user) — user now has oauthAccounts populated
```

### Step 11: Update UnlinkOAuthDto (unlink-oauth.dto.ts)

No structural change — still requires `password`. The `provider` param is now a URL segment, not in the DTO body.

### Step 12: Update tests

#### 12a. users.service.spec.ts — findOrCreateByOAuth

Rewrite all 4 scenarios to use OAuthAccount table:

| Test | Old Mock | New Mock |
|------|----------|----------|
| Existing OAuth user (same provider+id) | `findUnique({ email })` returns user with matching provider | `oAuthAccount.findUnique({ provider_providerId })` returns account + user |
| Auto-link (LOCAL user, verified) | `findUnique({ email })` returns LOCAL user | `oAuthAccount.findUnique()` returns null, `user.findUnique({ email })` returns user, `oAuthAccount.create()` |
| Different OAuth provider | `findUnique({ email })` returns user with different provider | `oAuthAccount.findUnique()` returns null, `user.findUnique({ email })` returns user with existing account → creates new OAuthAccount |
| New user (no email match) | `findUnique({ email })` returns null | Both lookups return null, `$transaction` creates User + OAuthAccount |

Add new test: **Link second provider** — user has GOOGLE OAuthAccount, logs in with GITHUB → creates GITHUB OAuthAccount.

#### 12b. users.service.spec.ts — unlinkOAuth

Update to accept `provider` param:

| Test | Changes |
|------|---------|
| Success (Google) | Add `'GOOGLE'` param, mock `oAuthAccount.findUnique()`, mock `oAuthAccount.delete()` |
| Success (GitHub) | Same pattern with `'GITHUB'` |
| Already LOCAL → No provider linked | Mock `oAuthAccount.findUnique()` returns null |
| OAuth-only (no password) | Unchanged logic |
| Wrong password | Unchanged logic |
| Audit metadata | Assert `previousProvider` in metadata |
| Dual-write cleanup | Assert `user.update({ provider: 'LOCAL' })` when last OAuthAccount removed |

Add new tests:
- **getLinkedProviders**: returns empty array, returns single, returns multiple
- **linkOAuthProvider**: success, conflict (identity belongs to another user), already linked

#### 12c. auth.service.spec.ts — verifyEmailChange

Update the OAuth unlink assertion:
- Old: assert `user.update({ provider: 'LOCAL', providerId: null })`
- New: assert `oAuthAccount.deleteMany({ userId })` in transaction + dual-write

#### 12d. users.controller.spec.ts

- Update `DELETE /me/oauth` → `DELETE /me/oauth/google` with provider param
- Add `GET /me/oauth` test — calls getLinkedProviders

#### 12e. Mock user updates (all 13 test files)

Add `oauthAccounts: []` to all `mockUser` objects. The `provider` and `providerId` fields remain (backward compat). `SafeUser` mocks add `oauthProviders: []`.

| File | Mock object | Add |
|------|-------------|-----|
| All 13 spec files | `mockUser` / `mockSafeUser` | `oauthProviders: []` on SafeUser instances |

## 5. Files to Create

| File | Purpose |
|------|---------|
| `src/auth/interfaces/oauth-account.interface.ts` | `LinkedProvider` interface |

## 6. Files to Modify

### Source Files (6)

| File | Changes |
|------|---------|
| `src/users/users.service.ts` | Refactor `findOrCreateByOAuth` (OAuthAccount lookup + dual-write), refactor `unlinkOAuth` (per-provider + OAuthAccount delete), add `getLinkedProviders()`, add `linkOAuthProvider()`, update `findById`/`findByEmail` includes |
| `src/users/users.controller.ts` | `DELETE /me/oauth/:provider` (add provider param), `GET /me/oauth` (new endpoint) |
| `src/users/entities/user.entity.ts` | Add `oauthProviders: string[]` to SafeUser, update `toSafeUser()` to accept oauthAccounts |
| `src/auth/auth.service.ts` | Refactor `verifyEmailChange()` OAuth cleanup (deleteMany OAuthAccounts) |
| `src/users/dto/unlink-oauth.dto.ts` | No structural change (provider moved to URL param) |
| `src/common/constants/error-messages.ts` | Add `oauth` section: `PROVIDER_LINK_FAILED`, `NO_PROVIDER_LINKED`, `PROVIDER_NOT_LINKED` |

### Test Files (13)

| File | Changes |
|------|---------|
| `src/users/tests/users.service.spec.ts` | Rewrite findOrCreateByOAuth tests (OAuthAccount mocks), rewrite unlinkOAuth tests (per-provider), add getLinkedProviders + linkOAuthProvider tests |
| `src/auth/tests/auth.service.spec.ts` | Update validateOAuthUser mocks, update verifyEmailChange OAuth unlink test |
| `src/users/tests/users.controller.spec.ts` | Update DELETE /me/oauth → /me/oauth/:provider, add GET /me/oauth test |
| `src/auth/tests/auth.controller.spec.ts` | Update mockSafeUser with oauthProviders |
| `src/auth/tests/google.strategy.spec.ts` | Update mockUser with oauthAccounts |
| `src/auth/tests/github.strategy.spec.ts` | Update mockUser with oauthAccounts |
| `src/auth/tests/jwt.strategy.spec.ts` | Update mockUser with oauthAccounts |
| `src/auth/tests/passkey.service.spec.ts` | Update mockUser with oauthAccounts |
| `src/auth/tests/passkey.controller.spec.ts` | Update mockUser with oauthAccounts |
| `src/auth/tests/mfa.service.spec.ts` | Update mockUser with oauthAccounts |
| `src/auth/tests/mfa.controller.spec.ts` | Update mockUser with oauthAccounts |
| `src/auth/tests/oauth-exchange.spec.ts` | Update mockUser/mockSafeUser with oauthProviders |
| `src/auth/tests/oauth-code.store.spec.ts` | Update mockUser with oauthAccounts |

## 7. Files NOT to Modify

| File | Reason |
|------|--------|
| `prisma/schema.prisma` | Already done in SCRUM-160 |
| Any migration file | No schema changes in this phase |
| `src/auth/auth.controller.ts` | Link initiation routes deferred to SCRUM-162 (frontend drives link UX). Current OAuth login routes unchanged. |
| `src/auth/strategies/google.strategy.ts` | Strategy doesn't need changes — link flow uses same strategies via existing routes |
| `src/auth/strategies/github.strategy.ts` | Same as above |
| `src/auth/guards/*` | No guard changes |
| `src/auth/passkey.service.ts` | Independent of OAuth |
| `src/auth/mfa.service.ts` | Independent of OAuth |
| Frontend files | Phase C (SCRUM-162) |

## 8. Security Considerations

| Risk | Mitigation |
|------|-----------|
| Pre-account takeover via OAuth linking | Only auto-link to accounts with `emailVerified: true` (unchanged from current) |
| Account lockout via unlinking last auth method | Check: user must have `passwordHash` before unlinking any OAuthAccount |
| OAuth identity theft | `@@unique([provider, providerId])` + generic error on conflict (CWE-200) |
| Anti-enumeration on link failure | `ConflictException('Unable to link this provider')` — same message whether identity belongs to self or another user |
| Provider param injection | Validate provider is `GOOGLE` or `GITHUB` (reject others with BadRequestException) |
| Audit trail completeness | `OAUTH_LINKED` + `OAUTH_UNLINKED` with provider metadata |
| Dual-write consistency | All OAuthAccount writes paired with User.provider/providerId writes in same service method |

## 9. API Contract Changes

### Modified Endpoint

| Before | After |
|--------|-------|
| `DELETE /users/me/oauth` body: `{ password }` | `DELETE /users/me/oauth/:provider` body: `{ password }` |

### New Endpoints

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| GET | `/users/me/oauth` | JwtAuthGuard | — | `LinkedProvider[]` |
| DELETE | `/users/me/oauth/:provider` | JwtAuthGuard, @Throttle(5/60s) | `{ password: string }` | `{ message: string }` |

### SafeUser Response Changes

```typescript
// Added field (alongside existing provider/providerId):
oauthProviders: string[]  // e.g., ['GOOGLE'] or ['GOOGLE', 'GITHUB'] or []
```

**Breaking change**: None. `oauthProviders` is additive. Old `provider`/`providerId` fields preserved.
**Endpoint path change**: `DELETE /me/oauth` → `DELETE /me/oauth/:provider` is breaking for frontend — coordinated with SCRUM-162.

## 10. Rollback Plan

Revert all source changes. Old `provider`/`providerId` fields on User are still populated (dual-write). OAuthAccount table remains from SCRUM-160 but is unused if code is reverted.

## 11. Estimated Risk

**Medium** — core OAuth logic refactored, 13 test files touched. Mitigated by:
- Dual-write ensures no data loss during transition
- Additive SafeUser changes (no field removal)
- All test files systematically updated
- Phase D handles field removal after stabilization

## 12. Verification Checklist

- [ ] `findOrCreateByOAuth()` creates OAuthAccount rows for new OAuth logins
- [ ] `findOrCreateByOAuth()` links second provider (user has GOOGLE, logs in with GITHUB → both linked)
- [ ] `unlinkOAuth()` accepts provider param and deletes specific OAuthAccount
- [ ] `unlinkOAuth()` dual-writes User.provider when last OAuthAccount removed
- [ ] `getLinkedProviders()` returns all OAuthAccounts for user
- [ ] `linkOAuthProvider()` creates OAuthAccount with anti-enumeration error
- [ ] `verifyEmailChange()` deletes all OAuthAccounts when email changes
- [ ] `toSafeUser()` returns `oauthProviders[]` from OAuthAccount relation
- [ ] `GET /users/me/oauth` returns linked providers
- [ ] `DELETE /users/me/oauth/:provider` unlinks specific provider
- [ ] Provider param validated (only GOOGLE/GITHUB accepted)
- [ ] All 13 test files updated with OAuthAccount mocks
- [ ] `npm run build` compiles clean
- [ ] All tests pass (821+ expected)
- [ ] No `User.provider` reads in new code (always via OAuthAccount, except dual-write)

## 13. Dependencies

- **Depends on**: SCRUM-160 (OAuthAccount schema) ✅ Done
- **Blocks**: SCRUM-162 (Frontend needs new endpoints + SafeUser.oauthProviders)
- **Blocks**: SCRUM-163 (Cleanup needs all services refactored first)

## 14. Implementation Order

Recommended implementation sequence within this ticket:

1. Create `LinkedProvider` interface (Step 1)
2. Update `user.entity.ts` — SafeUser + toSafeUser (Step 7)
3. Update error-messages.ts — add oauth section
4. Update `findById`/`findByEmail` includes (Step 8)
5. Refactor `findOrCreateByOAuth` (Step 2) — largest change
6. Add `getLinkedProviders` (Step 3)
7. Add `linkOAuthProvider` (Step 4)
8. Refactor `unlinkOAuth` (Step 5)
9. Refactor `verifyEmailChange` (Step 6)
10. Update controllers (Step 9)
11. Update all test files (Step 12)
12. Build + test verification

## 15. Test Strategy

| Category | Count | Approach |
|----------|-------|---------|
| findOrCreateByOAuth | ~12 tests | Rewrite: 5 scenarios (login, link-local, link-second-provider, created, unverified-conflict) |
| unlinkOAuth | ~12 tests | Rewrite: per-provider param, OAuthAccount delete, dual-write, audit, error paths |
| getLinkedProviders | ~3 tests | New: empty, single, multiple |
| linkOAuthProvider | ~4 tests | New: success, conflict-other-user, already-linked, audit |
| verifyEmailChange | ~2 tests | Update: assert deleteMany OAuthAccounts |
| Controller endpoints | ~4 tests | Update: DELETE /me/oauth/:provider, new GET /me/oauth |
| Mock user updates | ~10 files | Add oauthAccounts/oauthProviders to existing mocks |
| **Net new tests** | **~10–15** | getLinkedProviders + linkOAuthProvider + link-second-provider |
