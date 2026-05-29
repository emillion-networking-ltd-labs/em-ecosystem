# Backend Implementation Plan: SCRUM-105 Account Self-Deletion + GDPR Compliance

## Codebase State Snapshot

- **Date**: 2026-03-02
- **Last completed ticket**: SCRUM-104 (per integration-state.md)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/users/users.controller.ts` — 142 lines. Constructor: `UsersService` only. Self-service endpoints: PATCH /me, PATCH /me/password, POST /me/email. Admin endpoints: GET /, GET /:id, PATCH /:id, DELETE /:id. New DELETE /me will go between POST /me/email (line 78) and admin section (line 80).
  - `nexacore-api/src/users/users.service.ts` — 561 lines. Constructor: PrismaService, AuditService, SessionsService, MailService, PasswordBreachService(forwardRef). Methods: findByEmail, findById, create, incrementFailedAttempts, resetFailedAttempts, lockAccount, resetLockoutEscalation, findOrCreateByOAuth, findAll, updateProfile, changePassword, adminUpdateUser, softDelete(lines 389-421), updateMfaSetupData, enableMfa, disableMfa, updateRecoveryCodes, requestEmailChange(lines 469-556), hashToken. softDelete() sets isActive=false + revokes sessions + audits USER_DELETED. New selfDeleteAccount() will be a comprehensive GDPR-compliant version.
  - `nexacore-api/src/users/entities/user.entity.ts` — 53 lines. 20 fields on User interface. PII fields: email, passwordHash, firstName, lastName, avatarUrl, providerId, pendingEmail, mfaSecret, mfaRecoveryCodes. SafeUser = Omit<User, 'passwordHash' | 'pendingEmail' | 'mfaSecret' | 'mfaRecoveryCodes' | 'failedAttempts' | 'lockedUntil' | 'lockoutCount'>.
  - `nexacore-api/src/users/users.module.ts` — 15 lines. Imports: AuditModule, SessionsModule, MailModule, AuthModule(forwardRef). Exports: UsersService.
  - `nexacore-api/prisma/schema.prisma` — User model lines 50-79. Session onDelete: Cascade. AuditLog userId/targetUserId onDelete: SetNull. EmailVerificationToken onDelete: Cascade. PasswordResetToken onDelete: Cascade. AuditAction enum has 22 values (through EMAIL_CHANGED).
  - `nexacore-api/src/audit/enums/audit-action.enum.ts` — 22 values. Last: EMAIL_CHANGED.
  - `nexacore-api/src/mail/mail.service.ts` — 240 lines, 7 methods: sendVerificationEmail, sendPasswordResetEmail, sendPasswordChangeNotification, sendLoginNotificationEmail, sendEmailChangeVerificationEmail, sendEmailChangeRequestNotification, sendEmailChangedConfirmation. All follow try/catch + Logger pattern.
  - `nexacore-api/src/sessions/sessions.service.ts` — Constructor: PrismaService, AuditService. revokeAllUserSessions() available.
  - `nexacore-api/src/users/tests/users.service.spec.ts` — 1180 lines. mockUser has all 20 fields including pendingEmail: null. Prisma mock includes user (findUnique, create, update, findMany, count) + emailVerificationToken (create). MailService mock includes 4 methods (sendPasswordChangeNotification, sendEmailChangeVerificationEmail, sendEmailChangeRequestNotification, sendEmailChangedConfirmation).
- **Constructor signatures verified**: UsersService(PrismaService, AuditService, SessionsService, MailService, PasswordBreachService), SessionsService(PrismaService, AuditService)
- **Guard dependency chain verified**: DELETE /users/me will use JwtAuthGuard only (no RolesGuard/PermissionsGuard) — no new guard dependencies needed.
- **Test baseline**: 538 total tests (36 suites)

## Overview

Implement GDPR Article 17 (Right to Erasure) compliant account self-deletion: (1) authenticated user requests deletion via `DELETE /users/me` with password confirmation (local accounts) or without (OAuth-only accounts), (2) confirmation email sent to current address, (3) PII atomically anonymized via tombstone pattern (user record preserved with anonymized data), (4) all sessions, verification tokens, and password reset tokens deleted, (5) audit log metadata/IP/UA scrubbed, (6) audit logged as ACCOUNT_SELF_DELETED.

## Architecture Decisions

1. **Tombstone pattern over hard-delete**: User record is preserved with anonymized data. This maintains referential integrity (audit logs still point to a valid user ID), avoids cascade-delete side effects, and keeps the audit trail intact for compliance.
2. **PII anonymization strategy**: email → `deleted-{userId}@anonymized.local` (unique, valid format for DB constraint), all other PII fields → null/empty. Non-PII flags (isActive, emailVerified, mfaEnabled) reset to safe defaults.
3. **OAuth account support**: GDPR right to erasure applies to ALL users. OAuth-only accounts (no passwordHash) can self-delete without password confirmation — JWT auth is sufficient. Local accounts require password confirmation.
4. **Confirmation email BEFORE anonymization**: The confirmation email is sent before the anonymization transaction, since we need the real email address.
5. **Audit log scrubbing**: In the same transaction, scrub ipAddress, userAgent, and metadata from audit logs referencing this user. The userId/targetUserId remain pointing to the anonymized tombstone — this gives us WHAT happened and WHEN without WHO or FROM WHERE.
6. **Related data cleanup**: Sessions, EmailVerificationTokens, and PasswordResetTokens are hard-deleted (not just revoked) since they contain PII (IP addresses, user agents, token hashes linked to user).
7. **No DI/module changes needed**: UsersService already has PrismaService, AuditService, SessionsService, MailService — all required for this feature.
8. **No grace period**: Immediate anonymization per enriched ticket spec. A 30-day recovery grace period could be a future enhancement.

## Implementation Steps

### Step 0: Create Feature Branch

- Branch from `feature/SCRUM-104-backend`
- Name: `feature/SCRUM-105-backend`

### Step 1: Schema Changes + Migration

**File**: `nexacore-api/prisma/schema.prisma`

1a. Add to Prisma AuditAction enum (after EMAIL_CHANGED):
```prisma
  ACCOUNT_SELF_DELETED
```

1b. Run migration:
```bash
cd nexacore-api && npx prisma migrate dev --name add_account_self_deleted_action
```

### Step 2: Update TypeScript AuditAction Enum

**File**: `nexacore-api/src/audit/enums/audit-action.enum.ts`

Add after EMAIL_CHANGED:
```typescript
ACCOUNT_SELF_DELETED = 'ACCOUNT_SELF_DELETED',
```

### Step 3: Create DeleteAccountDto

**New file**: `nexacore-api/src/users/dto/delete-account.dto.ts`

```typescript
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class DeleteAccountDto {
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  password?: string;
}
```

Password is optional because OAuth-only accounts have no password. Validation logic in the service determines whether password is required based on user's provider.

### Step 4: Add MailService Method + Template

**File**: `nexacore-api/src/mail/mail.service.ts`

1 new method (follow existing try/catch + Logger pattern):

- **`sendAccountDeletionConfirmation(email, firstName?)`** — to user's current email BEFORE anonymization. Subject: "Your EM NexaCore account has been deleted". Template: `account-deleted`. Context: name, frontendUrl, deletedAt, currentYear.

**1 new template** in `nexacore-api/src/mail/templates/`:
- `account-deleted.hbs` — Confirmation that account was deleted, PII has been anonymized, sessions revoked. "If you did not request this, contact support immediately."

### Step 5: Implement UsersService.selfDeleteAccount()

**File**: `nexacore-api/src/users/users.service.ts`

**Method signature**:
```typescript
async selfDeleteAccount(userId: string, dto: DeleteAccountDto, ctx?: RequestContext): Promise<{ message: string }>
```

**Logic**:
1. Find user by ID → NotFoundException('User not found')
2. Reject SUPERADMIN → ForbiddenException('Cannot delete SUPERADMIN accounts')
3. Password check (conditional):
   - If user has passwordHash (local account):
     - If dto.password not provided → BadRequestException('Password confirmation required for local accounts')
     - If dto.password provided → bcrypt.compare → UnauthorizedException('Password is incorrect')
   - If user has no passwordHash (OAuth-only) → skip password check
4. Send confirmation email to current address (AWAITED — user needs the record):
   ```typescript
   await this.mailService.sendAccountDeletionConfirmation(user.email, user.firstName);
   ```
5. Generate anonymized email: `deleted-${userId}@anonymized.local`
6. Execute `$transaction` with 5 operations:
   a. **Anonymize user PII**:
   ```typescript
   prisma.user.update({
     where: { id: userId },
     data: {
       email: anonymizedEmail,
       passwordHash: null,
       firstName: null,
       lastName: null,
       avatarUrl: null,
       providerId: null,
       pendingEmail: null,
       emailVerified: false,
       isActive: false,
       failedAttempts: 0,
       lockedUntil: null,
       lockoutCount: 0,
       mfaEnabled: false,
       mfaSecret: null,
       mfaRecoveryCodes: [],
     },
   })
   ```
   b. **Delete all sessions** (contain IP/UA PII):
   ```typescript
   prisma.session.deleteMany({ where: { userId } })
   ```
   c. **Delete all email verification tokens**:
   ```typescript
   prisma.emailVerificationToken.deleteMany({ where: { userId } })
   ```
   d. **Delete all password reset tokens**:
   ```typescript
   prisma.passwordResetToken.deleteMany({ where: { userId } })
   ```
   e. **Scrub audit log PII** (ipAddress, userAgent, metadata):
   ```typescript
   prisma.auditLog.updateMany({
     where: { OR: [{ userId }, { targetUserId: userId }] },
     data: { ipAddress: null, userAgent: null, metadata: null },
   })
   ```
7. Audit log ACCOUNT_SELF_DELETED (fire-and-forget, AFTER transaction — uses userId which still exists as tombstone):
   ```typescript
   this.auditService.log({
     action: AuditAction.ACCOUNT_SELF_DELETED,
     userId,
     ipAddress: ctx?.ipAddress,
     userAgent: ctx?.userAgent,
   }).catch(() => {});
   ```
   Note: This new audit log WILL contain ipAddress/userAgent. This is intentional — it documents the deletion request itself for compliance/security purposes.
8. Return `{ message: 'Account deleted successfully' }`

### Step 6: Add UsersController.deleteOwnAccount()

**File**: `nexacore-api/src/users/users.controller.ts`

Add after requestEmailChange endpoint (line 78) and before admin section (line 80):

```typescript
@Delete('me')
@UseGuards(JwtAuthGuard)
@HttpCode(HttpStatus.OK)
async deleteOwnAccount(
  @Request() req: { user: { id: string }; ip?: string; headers?: Record<string, string> },
  @Body() dto: DeleteAccountDto,
) {
  return this.usersService.selfDeleteAccount(req.user.id, dto, {
    ipAddress: req.ip || null,
    userAgent: req.headers?.['user-agent'] || null,
  });
}
```

**Route ordering**: Must be BEFORE parameterized `:id` routes to prevent `me` matching as a UUID param. Position between POST /me/email and GET / is correct.

**Import**: Add `DeleteAccountDto` to controller imports.

### Step 7: Write Tests

**7a. MailService tests** (~2 new):
1. sendAccountDeletionConfirmation — sends with correct params (email, name, frontendUrl, deletedAt)
2. sendAccountDeletionConfirmation — SMTP error resilience (does not throw)

**7b. UsersService tests** (~12 new):
1. selfDeleteAccount — user not found → NotFoundException
2. selfDeleteAccount — SUPERADMIN account → ForbiddenException
3. selfDeleteAccount — local account, no password provided → BadRequestException
4. selfDeleteAccount — local account, wrong password → UnauthorizedException
5. selfDeleteAccount — local account, success: anonymizes all PII fields
6. selfDeleteAccount — success: deletes all sessions (deleteMany called)
7. selfDeleteAccount — success: deletes all email verification tokens
8. selfDeleteAccount — success: deletes all password reset tokens
9. selfDeleteAccount — success: scrubs audit log PII (ipAddress, userAgent, metadata nulled)
10. selfDeleteAccount — success: sends confirmation email before anonymization
11. selfDeleteAccount — success: logs ACCOUNT_SELF_DELETED audit
12. selfDeleteAccount — OAuth-only account: succeeds without password
13. selfDeleteAccount — audit failure resilience (does not throw)

**7c. UsersController tests** (~2 new):
1. DELETE /me delegates correctly with context
2. DELETE /me returns success message

**7d. Mock propagation**:
- Add `sendAccountDeletionConfirmation: jest.fn()` to MailService mock in users.service.spec.ts
- Add `session: { deleteMany: jest.fn() }` to Prisma mock in users.service.spec.ts
- Add `passwordResetToken: { deleteMany: jest.fn() }` to Prisma mock in users.service.spec.ts
- Add `emailVerificationToken: { ..., deleteMany: jest.fn() }` to Prisma mock in users.service.spec.ts
- Add `auditLog: { updateMany: jest.fn() }` to Prisma mock in users.service.spec.ts
- Add `$transaction: jest.fn()` to Prisma mock in users.service.spec.ts (if not already present)

**Total: ~16 new tests. Expected final: ~554.**

### Step 8: Update integration-state.md

- UsersController Method Guards: Add `DELETE /me | JwtAuthGuard | —`
- Service Dependency Chains: No changes (UsersService already has all required deps)
- Changelog: SCRUM-105 entry

### Step 9: Verify Build + Tests

```bash
npx nest build        # Must compile clean
npx jest --maxWorkers=1 --forceExit  # ~554 tests pass
```

### Step 10: Update Technical Documentation

- **data-model.md**: ACCOUNT_SELF_DELETED AuditAction value, DeleteAccountDto schema, add GDPR tombstone pattern note to User entity business rules
- **api-spec.yml**: DELETE /users/me endpoint, DeleteAccountDto schema, 200/400/401/403/404 responses

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Schema changes + migration
3. Step 2: TypeScript AuditAction enum
4. Step 3: DeleteAccountDto
5. Step 4: MailService method + template
6. Step 5: UsersService.selfDeleteAccount()
7. Step 6: UsersController endpoint
8. Step 7: Tests (~16 new)
9. Step 8: Update integration-state.md
10. Step 9: Verify build + tests
11. Step 10: Update technical documentation

## Testing Checklist

- [ ] DELETE /users/me rejects unauthenticated requests (401)
- [ ] DELETE /users/me rejects SUPERADMIN accounts (403)
- [ ] DELETE /users/me rejects local accounts without password (400)
- [ ] DELETE /users/me rejects local accounts with wrong password (401)
- [ ] DELETE /users/me succeeds for local accounts with correct password
- [ ] DELETE /users/me succeeds for OAuth-only accounts without password
- [ ] PII fields anonymized: email → deleted-{id}@anonymized.local, passwordHash/firstName/lastName/avatarUrl/providerId/pendingEmail/mfaSecret → null, mfaRecoveryCodes → []
- [ ] Non-PII flags reset: isActive=false, emailVerified=false, mfaEnabled=false, failedAttempts=0, lockedUntil=null, lockoutCount=0
- [ ] All sessions hard-deleted (not just revoked)
- [ ] All email verification tokens deleted
- [ ] All password reset tokens deleted
- [ ] Audit log ipAddress/userAgent/metadata scrubbed for user's logs
- [ ] Confirmation email sent to original email before anonymization
- [ ] ACCOUNT_SELF_DELETED audit logged after transaction
- [ ] All operations in single $transaction (atomicity)
- [ ] All existing ~538 tests still pass
- [ ] `nest build` compiles clean

## Error Response Format

| HTTP | Condition | Message |
|------|-----------|---------|
| 400 | Local account, no password | "Password confirmation required for local accounts" |
| 401 | Wrong password | "Password is incorrect" |
| 403 | SUPERADMIN account | "Cannot delete SUPERADMIN accounts" |
| 404 | User not found | "User not found" |

## Dependencies

- **No new npm packages**
- **No DI/module changes** — UsersModule already imports AuditModule, SessionsModule, MailModule
- **Prisma migration**: 1 new AuditAction value (ACCOUNT_SELF_DELETED)
- **1 new .hbs email template** (account-deleted.hbs)

## Notes

- **Tombstone pattern**: User record is NOT hard-deleted. It's preserved with anonymized data to maintain referential integrity with audit logs and avoid cascade-delete complexity.
- **Email uniqueness**: Anonymized email uses `deleted-{userId}@anonymized.local` format. Since userId is unique, this guarantees uniqueness. The `.local` TLD is reserved (RFC 6762) and will never conflict with real emails.
- **OAuth account GDPR compliance**: OAuth-only accounts have no password to confirm. JWT authentication is considered sufficient identity verification for these accounts. Rejecting OAuth accounts from self-deletion would violate GDPR Article 17.
- **Confirmation email timing**: Sent BEFORE the anonymization transaction because we need the real email address. If the transaction fails, the user received a premature confirmation — this is an acceptable trade-off (rare failure + the email says "contact support if unexpected").
- **Audit log post-deletion**: The ACCOUNT_SELF_DELETED audit entry is created AFTER the transaction with the current IP/UA. This is intentional — it documents the deletion event itself for security forensics.
- **Session cleanup**: Sessions are hard-deleted (deleteMany) rather than soft-revoked (setRevoked). GDPR requires erasure of PII, and sessions contain IP addresses and user agents.
- **Future considerations**: 30-day grace period with recovery, scheduled batch cleanup of tombstoned users older than N years, admin notification on user self-deletion.
