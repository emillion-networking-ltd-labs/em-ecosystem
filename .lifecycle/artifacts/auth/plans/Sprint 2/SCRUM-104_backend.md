# Backend Implementation Plan: SCRUM-104 Email Change Flow with Re-verification

## Codebase State Snapshot

- **Date**: 2026-03-02
- **Last completed ticket**: SCRUM-103 (per integration-state.md)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/users/users.service.ts` — constructor: PrismaService, AuditService, SessionsService, MailService, PasswordBreachService(forwardRef). changePassword() lines 256-312 (bcrypt.compare pattern).
  - `nexacore-api/src/users/users.controller.ts` — constructor: UsersService only. PATCH /me (lines 34-45), PATCH /me/password (lines 47-60). No email endpoints.
  - `nexacore-api/src/users/entities/user.entity.ts` — User interface (20 fields, no pendingEmail). SafeUser = Omit<User, passwordHash|mfaSecret|mfaRecoveryCodes|failedAttempts|lockedUntil|lockoutCount>. toSafeUser() manually constructs safe object.
  - `nexacore-api/src/auth/auth.service.ts` — verifyEmail() lines 642-680 (finds token by hash, validates, transaction: mark used + set emailVerified). createAndSendVerificationEmail() lines 876-896 (crypto.randomBytes, SHA256, create token, send email). hashToken() lines 898-900 (private). Constants HARDCODED in service: VERIFICATION_TOKEN_EXPIRY_HOURS=24, RESEND_COOLDOWN_SECONDS=60.
  - `nexacore-api/src/auth/auth.controller.ts` — constructor: AuthService, SessionsService, JwtService, PermissionsService. GET /verify-email (lines 268-288): public, redirect to frontend with status.
  - `nexacore-api/prisma/schema.prisma` — User model lines 43-71 (no pendingEmail). EmailVerificationToken lines 114-125 (id, tokenHash, userId, expiresAt, usedAt — no type field).
  - `nexacore-api/src/audit/enums/audit-action.enum.ts` — 19 values (through SESSION_LIMIT_EXCEEDED). No email change actions.
  - `nexacore-api/src/mail/mail.service.ts` — 152 lines, 4 methods: sendVerificationEmail, sendPasswordResetEmail, sendPasswordChangeNotification, sendLoginNotificationEmail. Templates: verification.hbs, password-reset.hbs, password-changed.hbs, login-notification.hbs.
  - `nexacore-api/src/users/dto/change-password.dto.ts` — @IsString currentPassword, @IsString @MinLength(8) @MaxLength(128) newPassword.
  - `nexacore-api/src/users/users.module.ts` — imports: AuditModule, SessionsModule, MailModule, AuthModule(forwardRef).
- **Constructor signatures verified**: UsersService(PrismaService, AuditService, SessionsService, MailService, PasswordBreachService), AuthService(UsersService, SessionsService, JwtService, OAuthCodeStore, AuditService, PasswordBreachService, PrismaService, MailService)
- **Guard dependency chain verified**: POST /users/me/email will use JwtAuthGuard only (no RolesGuard/PermissionsGuard) — no new guard dependencies needed. GET /auth/verify-email-change is public — no guards.
- **Test baseline**: 507 total tests (36 suites)

## Overview

Implement a secure email change flow: (1) authenticated user requests change via `POST /users/me/email` with password confirmation, (2) verification token sent to NEW email, security notification sent to OLD email, (3) user verifies via `GET /auth/verify-email-change?token=xxx`, (4) email atomically swapped, all sessions revoked, confirmation sent to OLD email. Both request and completion are audit-logged.

## Architecture Decisions

1. **Request logic in UsersService** (alongside `changePassword()`) — both are self-service profile operations requiring password confirmation
2. **Verification logic in AuthService** (alongside `verifyEmail()`) — token verification is an auth concern
3. **Schema**: Add `pendingEmail String?` to User + `type EmailVerificationTokenType @default(REGISTRATION)` to EmailVerificationToken. Avoids new model; backward-compatible default.
4. **No DI/module changes needed** — UsersService already has PrismaService, AuditService, SessionsService, MailService. AuthService already has PrismaService, MailService, SessionsService, AuditService.
5. **hashToken duplication**: One-liner `crypto.createHash('sha256')...` duplicated in UsersService (already private in AuthService). Not worth a shared utility for 1 line.
6. **Session revocation on email swap**: Yes — forces re-login with new email (same pattern as changePassword).
7. **Cross-flow token guard**: Add `type !== 'REGISTRATION'` check to existing `verifyEmail()` to prevent EMAIL_CHANGE tokens from being used at the registration verification endpoint.

## Implementation Steps

### Step 0: Create Feature Branch

- Branch from `feature/SCRUM-103-backend`
- Name: `feature/SCRUM-104-backend`

### Step 1: Schema Changes + Migration

**File**: `nexacore-api/prisma/schema.prisma`

1a. Add new enum (before User model):
```prisma
enum EmailVerificationTokenType {
  REGISTRATION
  EMAIL_CHANGE
}
```

1b. Add `pendingEmail` to User model (after `emailVerified` line 53):
```prisma
  pendingEmail   String?
```

1c. Add `type` to EmailVerificationToken model (after `userId` line 117):
```prisma
  type      EmailVerificationTokenType @default(REGISTRATION)
```

1d. Add to Prisma AuditAction enum:
```prisma
  EMAIL_CHANGE_REQUESTED
  EMAIL_CHANGED
```

1e. Run migration:
```bash
cd nexacore-api && npx prisma migrate dev --name add_email_change_flow
```

### Step 2: Update TypeScript Enums + User Entity

**File**: `nexacore-api/src/audit/enums/audit-action.enum.ts`
- Add after SESSION_LIMIT_EXCEEDED:
```typescript
EMAIL_CHANGE_REQUESTED = 'EMAIL_CHANGE_REQUESTED',
EMAIL_CHANGED = 'EMAIL_CHANGED',
```

**File**: `nexacore-api/src/users/entities/user.entity.ts`
- Add `pendingEmail: string | null;` to User interface (after emailVerified)
- Add `'pendingEmail'` to SafeUser Omit list (sensitive — hides pending email from API responses)
- Note: toSafeUser() manually constructs object, so it already excludes pendingEmail implicitly

### Step 3: Create ChangeEmailDto

**New file**: `nexacore-api/src/users/dto/change-email.dto.ts`
```typescript
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class ChangeEmailDto {
  @IsEmail({}, { message: 'Must be a valid email address' })
  newEmail: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  password: string;
}
```

### Step 4: Add MailService Methods + Templates

**File**: `nexacore-api/src/mail/mail.service.ts`

3 new methods (follow existing try/catch + Logger pattern):

- **`sendEmailChangeVerificationEmail(newEmail, token, firstName?)`** — to NEW email. Subject: "Verify your new EM NexaCore email address". Template: `email-change-verification`. URL: `/auth/verify-email-change?token=xxx`.
- **`sendEmailChangeRequestNotification(oldEmail, newEmail, firstName?)`** — to OLD email. Subject: "Email change requested for your EM NexaCore account". Template: `email-change-notification`.
- **`sendEmailChangedConfirmation(oldEmail, newEmail, firstName?)`** — to OLD email after swap. Subject: "Your EM NexaCore email address was changed". Template: `email-changed-confirmation`.

**3 new templates** in `nexacore-api/src/mail/templates/`:
- `email-change-verification.hbs` — CTA "Verify New Email", 24h expiry notice
- `email-change-notification.hbs` — security warning, "If you did not request this..."
- `email-changed-confirmation.hbs` — confirmation, session revocation notice, "If you did not make this change..."

### Step 5: Implement UsersService.requestEmailChange()

**File**: `nexacore-api/src/users/users.service.ts`

Add `import * as crypto from 'crypto'` and private `hashToken()` helper.
Add constant `const EMAIL_CHANGE_TOKEN_EXPIRY_HOURS = 24;` at module level.

**Method signature**:
```typescript
async requestEmailChange(userId: string, dto: ChangeEmailDto, ctx?: RequestContext): Promise<{ message: string }>
```

**Logic**:
1. Find user by ID → NotFoundException
2. Reject OAuth-only (no passwordHash) → BadRequestException
3. Verify password (bcrypt.compare) → UnauthorizedException
4. Check newEmail ≠ current email (case-insensitive) → BadRequestException
5. Check newEmail not already registered → ConflictException
6. Update user.pendingEmail = normalizedNewEmail
7. Create EmailVerificationToken (type: EMAIL_CHANGE, SHA256 hash, 24h expiry)
8. Send verification email to NEW address (await)
9. Send notification to OLD address (fire-and-forget)
10. Log EMAIL_CHANGE_REQUESTED audit (fire-and-forget)
11. Return `{ message: 'Verification email sent to new address' }`

### Step 6: Add UsersController.requestEmailChange()

**File**: `nexacore-api/src/users/users.controller.ts`

Add after changePassword endpoint (before admin routes):
```typescript
@Post('me/email')
@UseGuards(JwtAuthGuard)
@Throttle({ global: { ttl: 60_000, limit: 5 } })
@HttpCode(HttpStatus.OK)
async requestEmailChange(@Request() req, @Body() dto: ChangeEmailDto) {
  return this.usersService.requestEmailChange(req.user.id, dto, {
    ipAddress: req.ip || null,
    userAgent: req.headers?.['user-agent'] || null,
  });
}
```

**Route ordering**: Must be before parameterized `:id` routes to prevent `me` matching as UUID.

### Step 7: Implement AuthService.verifyEmailChange()

**File**: `nexacore-api/src/auth/auth.service.ts`

Add after `verifyEmail()` (after line 680):

**Logic**:
1. Hash token, findUnique EmailVerificationToken (include user)
2. Reject if: not found, type ≠ EMAIL_CHANGE, already used, expired
3. Reject if user.pendingEmail is null (request cancelled)
4. Race condition guard: check pendingEmail not taken by someone else
5. Transaction: update user (email=pendingEmail, pendingEmail=null, emailVerified=true) + mark token used
6. Revoke all sessions via sessionsService.revokeAllUserSessions()
7. Send confirmation to OLD email (fire-and-forget)
8. Log EMAIL_CHANGED audit with { oldEmail, newEmail } (fire-and-forget)
9. Return `{ status: 'success' }`

**Also**: Add type guard to existing `verifyEmail()` after the null check:
```typescript
if (verificationToken.type !== 'REGISTRATION') {
  return { status: 'invalid' };
}
```

### Step 8: Add AuthController.verifyEmailChange()

**File**: `nexacore-api/src/auth/auth.controller.ts`

Add after verifyEmail endpoint (after line 288):
```typescript
@Get('verify-email-change')
async verifyEmailChange(@Query('token') token: string, @Res() res: Response) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
  if (!token) return res.redirect(`${frontendUrl}/verify-email-change?status=invalid`);
  const result = await this.authService.verifyEmailChange(token);
  return res.redirect(`${frontendUrl}/verify-email-change?status=${result.status}`);
}
```

### Step 9: Write Tests

**9a. MailService tests** (~7 new): 3 methods × (correct params + SMTP error resilience) + null firstName fallback for verification email.

**9b. UsersService tests** (~9 new): requestEmailChange — user not found, OAuth-only, wrong password, same email, email taken, success (pendingEmail + token + emails), audit log, audit failure resilience, email normalization.

**9c. AuthService tests** (~11 new): verifyEmailChange — token not found, wrong type, used, expired, no pendingEmail, email taken (race), success (transaction + session revocation + notification + audit). Also: verifyEmail rejects EMAIL_CHANGE type token (1 new test in existing describe).

**9d. UsersController tests** (~2 new): POST /me/email delegates correctly with context.

**9e. AuthController tests** (~2 new): GET /verify-email-change — no token redirect, success redirect.

**9f. Mock propagation**: Add `pendingEmail: null` to mockUser in users.service.spec.ts and auth.service.spec.ts. Add new MailService mock methods. Add `emailVerificationToken: { create: jest.fn() }` to Prisma mock in users.service.spec.ts.

**Total: ~31 new tests. Expected final: ~538.**

### Step 10: Update integration-state.md

- UsersController Method Guards: Add `POST /me/email | JwtAuthGuard | @Throttle`
- AuthController Method Guards: Add `GET /verify-email-change | — | —`
- Changelog: SCRUM-104 entry

### Step 11: Verify Build + Tests

```bash
npx nest build        # Must compile clean
npx jest --maxWorkers=1 --forceExit  # ~538 tests pass
```

### Step 12: Update Technical Documentation

- **data-model.md**: pendingEmail on User, EmailVerificationTokenType enum, type on EmailVerificationToken, AuditAction additions
- **api-spec.yml**: POST /users/me/email + GET /auth/verify-email-change endpoints + ChangeEmailDto schema

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Schema changes + migration
3. Step 2: TypeScript enums + user entity
4. Step 3: ChangeEmailDto
5. Step 4: MailService methods + templates
6. Step 5: UsersService.requestEmailChange()
7. Step 6: UsersController endpoint
8. Step 7: AuthService.verifyEmailChange() + type guard on verifyEmail()
9. Step 8: AuthController endpoint
10. Step 9: Tests (~31 new)
11. Step 10: Update integration-state.md
12. Step 11: Verify build + tests
13. Step 12: Update technical documentation

## Testing Checklist

- [ ] POST /users/me/email rejects OAuth-only accounts (400)
- [ ] POST /users/me/email rejects wrong password (401)
- [ ] POST /users/me/email rejects same email (400)
- [ ] POST /users/me/email rejects taken email (409)
- [ ] POST /users/me/email stores pendingEmail + creates EMAIL_CHANGE token
- [ ] POST /users/me/email sends verification to new + notification to old
- [ ] POST /users/me/email logs EMAIL_CHANGE_REQUESTED audit
- [ ] GET /auth/verify-email-change rejects REGISTRATION tokens
- [ ] GET /auth/verify-email-change rejects used/expired tokens
- [ ] GET /auth/verify-email-change rejects when no pendingEmail
- [ ] GET /auth/verify-email-change atomically swaps email + clears pendingEmail
- [ ] GET /auth/verify-email-change revokes all sessions
- [ ] GET /auth/verify-email-change sends confirmation to old email
- [ ] GET /auth/verify-email-change logs EMAIL_CHANGED audit
- [ ] Existing verifyEmail rejects EMAIL_CHANGE tokens
- [ ] All 3 new email templates render correctly
- [ ] All existing ~507 tests still pass
- [ ] `nest build` compiles clean

## Error Response Format

| HTTP | Condition | Message |
|------|-----------|---------|
| 400 | Same email | "New email must be different from current email" |
| 400 | OAuth-only | "Email change not available for OAuth accounts" |
| 401 | Wrong password | "Password is incorrect" |
| 409 | Email taken | "Email already registered" |
| 429 | Rate limited | Throttler response |

## Dependencies

- **No new npm packages**
- **No DI/module changes** — UsersModule already imports AuditModule, SessionsModule, MailModule
- **Prisma migration**: pendingEmail field, EmailVerificationTokenType enum, token type column, 2 AuditAction values
- **3 new .hbs email templates**

## Notes

- **Email normalization**: Always lowercase newEmail before storing/comparing
- **Idempotency**: Re-requesting overwrites pendingEmail; old tokens fail gracefully (pendingEmail mismatch or latest one wins)
- **Race condition**: Check email availability again during verification (between request and verify, someone else could register the same email). DB unique constraint is final safety net.
- **Session revocation on swap**: Forces re-login with new credentials — same security pattern as changePassword
- **Fire-and-forget**: Notification to old email + audit logging. Verification email to new address is AWAITED (user needs the link).
- **Cross-flow protection**: verifyEmail() rejects EMAIL_CHANGE tokens; verifyEmailChange() rejects REGISTRATION tokens.
