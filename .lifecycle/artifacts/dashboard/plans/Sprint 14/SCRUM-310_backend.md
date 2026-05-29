# Backend Implementation Plan: SCRUM-310 Admin Soft Delete Fix

## Codebase State Snapshot

- **Date**: 2026-04-18
- **Last completed ticket**: SCRUM-309 (Sidebar flyout)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/users/users.service.ts` — softDelete (line 769), selfDeleteAccount (line 944), findAll (line 412), findById (line 72), findByEmail (line 65), constructor (line 50)
  - `nexacore-api/src/users/users.controller.ts` — deleteUser (line 274)
  - `nexacore-api/prisma/schema.prisma` — User model (line 67)
  - `nexacore-api/src/users/tests/users.service.spec.ts` — softDelete tests (line 1052), findAll tests (line 553)
  - `nexacore-api/src/users/tests/users.controller.spec.ts` — deleteUser test (line 225)
- **Constructor signature verified**: `UsersService(prisma: PrismaService, auditService: AuditService, sessionsService: SessionsService, mailService: MailService, passwordBreachService: PasswordBreachService, trustedDeviceService: TrustedDeviceService, tokenDenyListService: TokenDenyListService, storage: FileStorageService)` — 8 deps, NO changes needed
- **Methods verified to exist**:
  - `softDelete(targetId, actorId?, ctx?)` at line 769
  - `selfDeleteAccount(userId, dto, ctx?)` at line 944
  - `findAll(query)` at line 412
  - `findById(id)` at line 72
  - `findByEmail(email)` at line 65
- **Discrepancies with integration-state.md**: None

## Regression Impact Analysis

- **Blast radius**: 4 files directly affected
  - `users.service.ts` — softDelete rewrite, findAll filter
  - `users.controller.ts` — response message
  - `prisma/schema.prisma` — new field
  - Test files: `users.service.spec.ts`, `users.controller.spec.ts`
- **Breaking changes**: None — softDelete signature unchanged, findAll signature unchanged, constructor unchanged
- **API contract impact**: DELETE /users/:id behavior changes (anonymization instead of deactivation), response message changes. No request/response schema changes. Frontend: no changes needed — users simply disappear from list
- **Schema migration impact**: New nullable field `deletedAt DateTime?` — backward compatible (nullable, no default needed, existing rows get NULL)
- **Test files requiring updates**:
  - `users.service.spec.ts` — softDelete tests (line 1052-1118): must verify anonymization + deletedAt + $transaction
  - `users.service.spec.ts` — findAll tests (line 553): must verify deletedAt filter
  - `users.controller.spec.ts` — deleteUser test (line 225): must verify new response message
- **Blast radius size**: 4 files — low risk

## Overview

Fix admin DELETE /users/:id to properly anonymize PII (like selfDeleteAccount) instead of only setting isActive=false. Add `deletedAt` timestamp field to distinguish deleted users from locked users. Filter deleted users from admin list query.

## Architecture Context

- **Module**: UsersModule (existing)
- **Modified files**: users.service.ts, users.controller.ts, schema.prisma, tests
- **Pattern reuse**: selfDeleteAccount anonymization logic (line 984-1016) → extract into shared private method
- **No new modules/guards/services** — all changes within existing UsersService

## Implementation Steps

### Step 0: Create Feature Branch

- `git checkout main && git pull origin main`
- `git checkout -b feature/SCRUM-310-backend`

### Step 1: Add deletedAt to Prisma Schema

**File**: `prisma/schema.prisma` (User model, line 67)

Add after `updatedAt`:
```prisma
deletedAt        DateTime?
```

Run migration:
```bash
npx prisma migrate dev --name add-user-deleted-at
```

### Step 2: Extract Anonymization Logic

**File**: `src/users/users.service.ts`

Create private method `anonymizeAndDelete` that contains the shared anonymization logic used by both `softDelete` and `selfDeleteAccount`:

```ts
private async anonymizeAndDelete(
  userId: string,
  ctx?: RequestContext,
): Promise<void> {
  const anonymizedEmail = `deleted-${userId}@anonymized.local`;

  await this.prisma.$transaction([
    this.prisma.user.update({
      where: { id: userId },
      data: {
        email: anonymizedEmail,
        passwordHash: null,
        firstName: null,
        lastName: null,
        avatarUrl: null,
        avatarOriginalUrl: null,
        avatarCropData: Prisma.JsonNull,
        pendingEmail: null,
        emailVerified: false,
        isActive: false,
        deletedAt: new Date(),
        failedAttempts: 0,
        lockedUntil: null,
        lockoutCount: 0,
        mfaEnabled: false,
        mfaSecret: null,
        mfaRecoveryCodes: [],
      },
    }),
    this.prisma.session.deleteMany({ where: { userId } }),
    this.prisma.emailVerificationToken.deleteMany({ where: { userId } }),
    this.prisma.passwordResetToken.deleteMany({ where: { userId } }),
    this.prisma.oAuthAccount.deleteMany({ where: { userId } }),
    this.prisma.trustedDevice.deleteMany({ where: { userId } }),
    this.prisma.webAuthnCredential.deleteMany({ where: { userId } }),
    this.prisma.auditLog.updateMany({
      where: { OR: [{ userId }, { targetUserId: userId }] },
      data: { ipAddress: null, userAgent: null, metadata: Prisma.DbNull },
    }),
  ]);

  // Deny all access tokens (immediate invalidation)
  this.tokenDenyListService
    .denyAllForUser(userId, ACCESS_TOKEN_TTL_SECONDS)
    .catch(() => {});
}
```

**Improvements over selfDeleteAccount**:
- Adds `deletedAt: new Date()` — distinguishes from lock
- Adds `avatarOriginalUrl: null`, `avatarCropData: Prisma.JsonNull` — new fields from SCRUM-306
- Adds `oAuthAccount.deleteMany` — was missing from selfDeleteAccount (gap identified during enrichment)
- Adds `trustedDevice.deleteMany` — clean up device fingerprints
- Adds `webAuthnCredential.deleteMany` — clean up passkeys

### Step 3: Rewrite softDelete

**File**: `src/users/users.service.ts` (line 769)

Replace current implementation with:

```ts
async softDelete(
  targetId: string,
  actorId?: string,
  ctx?: RequestContext,
): Promise<void> {
  const target = await this.findById(targetId);
  if (!target) {
    throw new NotFoundException(ErrorMessages.user.NOT_FOUND);
  }

  if (target.role === Role.SUPERADMIN) {
    throw new ForbiddenException(ErrorMessages.user.OPERATION_NOT_PERMITTED);
  }

  // Send confirmation email BEFORE anonymization (needs real email)
  await this.mailService.sendAccountDeletionConfirmation(
    target.email,
    target.firstName,
  );

  // Anonymize PII + delete related data
  await this.anonymizeAndDelete(targetId, ctx);

  // Audit log AFTER anonymization
  this.auditService
    .log({
      action: AuditAction.USER_DELETED,
      userId: actorId,
      targetUserId: targetId,
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
      metadata: { email: pseudonymizeEmail(target.email) },
    })
    .catch(() => {});
}
```

### Step 4: Refactor selfDeleteAccount to Use Shared Method

**File**: `src/users/users.service.ts` (line 944)

Replace the inline `$transaction` block with a call to `anonymizeAndDelete`. Keep the password check and self-delete-specific logic:

```ts
// ... (password check stays the same) ...

await this.mailService.sendAccountDeletionConfirmation(user.email, user.firstName);
await this.anonymizeAndDelete(userId, ctx);

this.auditService
  .log({
    action: AuditAction.ACCOUNT_SELF_DELETED,
    userId,
    ipAddress: ctx?.ipAddress,
    userAgent: ctx?.userAgent,
  })
  .catch(() => {});

return { message: 'Account deleted successfully' };
```

### Step 5: Add deletedAt Filter to findAll

**File**: `src/users/users.service.ts` (line 420)

Add `deletedAt: null` to the where clause:

```ts
const where: Record<string, unknown> = { deletedAt: null };
```

This ensures deleted (anonymized) users are excluded from the admin user list.

**Note**: Do NOT add `deletedAt` filter to `findById`/`findByEmail`. Auth is already blocked by `isActive: false` + session revocation + token deny list. Modifying these methods would have massive blast radius (37 files) with no practical benefit.

### Step 6: Update Controller Response Message

**File**: `src/users/users.controller.ts` (line 293)

```ts
return { message: 'User deleted successfully' };
```

### Step 7: Update Tests

**File**: `src/users/tests/users.service.spec.ts`

**softDelete tests** (line 1052-1118):
- Update "should set isActive=false" test → verify `$transaction` called with anonymization data + `deletedAt`
- Add test: "should send deletion confirmation email before anonymization"
- Add test: "should delete OAuth accounts, trusted devices, WebAuthn credentials"
- Add test: "should scrub audit log PII"
- Keep existing: NotFoundException, ForbiddenException (SUPERADMIN), session revocation tests

**findAll tests** (line 553):
- Update existing tests → verify `where` includes `deletedAt: null`
- Add test: "should exclude deleted users from list"

**File**: `src/users/tests/users.controller.spec.ts`

- Update deleteUser test (line 225) → expect `'User deleted successfully'`

### Step 8: Update Documentation

- `ai-specs/specs/data-model.md` — add `deletedAt DateTime?` to User entity
- `ai-specs/specs/api-spec.yml` — update DELETE /users/:id description (anonymization behavior)
- `ai-specs/specs/integration-state.md` — changelog entry

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Prisma schema + migration
3. Step 2: Extract `anonymizeAndDelete` private method
4. Step 3: Rewrite `softDelete`
5. Step 4: Refactor `selfDeleteAccount`
6. Step 5: Add `deletedAt` filter to `findAll`
7. Step 6: Update controller response
8. Step 7: Update tests
9. Step 8: Update documentation

## Testing Checklist

- [ ] softDelete: anonymizes email to `deleted-{uuid}@anonymized.local`
- [ ] softDelete: nulls all PII (password, name, avatar, MFA, pending email)
- [ ] softDelete: sets `deletedAt` to current timestamp
- [ ] softDelete: sets `isActive: false`
- [ ] softDelete: deletes sessions, tokens, OAuth, devices, passkeys in $transaction
- [ ] softDelete: scrubs audit log PII (IP, UA, metadata)
- [ ] softDelete: sends confirmation email before anonymization
- [ ] softDelete: denies all access tokens
- [ ] softDelete: SUPERADMIN cannot be deleted (403)
- [ ] softDelete: non-existent user returns 404
- [ ] selfDeleteAccount: still works correctly using shared method
- [ ] findAll: excludes users with deletedAt != null
- [ ] Deleted user cannot log in (isActive + token deny)
- [ ] Build: `nest build` clean
- [ ] Tests: all pass including updated specs
- [ ] Migration: `npx prisma migrate dev` succeeds

## Error Response Format

No changes — existing error responses (404, 403) remain the same.

## Dependencies

- No new dependencies — uses existing Prisma, bcrypt, mail service

## Notes

- `findById`/`findByEmail` are NOT modified — auth blocking relies on `isActive: false` + token deny list + session revocation. Modifying these would affect 37+ files with no practical benefit.
- The `anonymizeAndDelete` method also fixes gaps in `selfDeleteAccount`: adds OAuthAccount, TrustedDevice, WebAuthnCredential cleanup, and avatarOriginalUrl/avatarCropData nulling.
- The `deletedAt` field enables future features: admin "recently deleted" view, undo delete within grace period, GDPR compliance reporting.

## Next Steps After Implementation

1. Run `/verify SCRUM-310` to validate plan compliance
2. Run `/commit` to create PR
3. Run `/update-docs` to create implementation record
