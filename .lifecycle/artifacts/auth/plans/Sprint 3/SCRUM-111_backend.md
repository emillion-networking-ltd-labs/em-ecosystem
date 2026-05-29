# Backend Implementation Plan: SCRUM-111 OAuth Account Unlinking

## Codebase State Snapshot

- **Date**: 2026-03-03
- **Last completed ticket**: SCRUM-110 (Passkeys / WebAuthn Support) — commit `fb46b30` on `feature/SCRUM-110-backend`
- **Integration state verified**: Yes
- **Sprint**: Sprint 3 — Auth Enterprise (id=37)
- **Files verified against live code**:
  - `src/users/users.controller.ts` (158 lines) — 1 constructor dep (UsersService), 4 self-service endpoints (PATCH me, PATCH me/password, POST me/email, DELETE me), 4 admin endpoints
  - `src/users/users.service.ts` (656 lines) — 6 constructor deps (PrismaService, AuditService, SessionsService, MailService, PasswordBreachService via forwardRef, TrustedDeviceService via forwardRef)
  - `src/users/users.module.ts` (15 lines) — Imports: AuditModule, SessionsModule, MailModule, AuthModule (forwardRef). Exports: UsersService
  - `src/users/dto/delete-account.dto.ts` (9 lines) — @IsOptional @IsString @MinLength(8) @MaxLength(128) password?: string
  - `src/audit/enums/audit-action.enum.ts` (37 lines) — 35 values, last: PASSKEY_AUTH_FAILURE
  - `prisma/schema.prisma` — AuditAction enum: 35 values, last: PASSKEY_AUTH_FAILURE. Provider enum: LOCAL, GOOGLE, GITHUB. User model: passwordHash String?, provider Provider @default(LOCAL), providerId String?
  - `src/users/tests/users.service.spec.ts` — Mocks: bcrypt, PrismaService (user.findUnique/create/update/findMany/count, emailVerificationToken, session, passwordResetToken, auditLog, $transaction), AuditService (log), SessionsService (revokeAllUserSessions), MailService (5 methods), PasswordBreachService (isBreached), TrustedDeviceService (revokeAllDevices)
  - `src/users/tests/users.controller.spec.ts` — Mocks: UsersService (all public methods)
- **Constructor signatures verified**:
  - `UsersController(usersService: UsersService)` — 1 param
  - `UsersService(prisma, auditService, sessionsService, mailService, passwordBreachService via forwardRef, trustedDeviceService via forwardRef)` — 6 params
- **Guard dependency chain verified**: New endpoint uses only `JwtAuthGuard` (no deps, extends AuthGuard('jwt')). No RolesGuard or PermissionsGuard needed. No new module imports required.

## Overview

Implement an endpoint to unlink an OAuth provider (Google/GitHub) from a user's account. The endpoint resets the user's `provider` to `LOCAL` and clears `providerId`, effectively converting the account to a local email/password account. Password confirmation is required as a safety gate — users without a password set (OAuth-only) cannot unlink until they set one. All sessions and trusted devices are revoked after unlinking. The feature adds 1 new endpoint to UsersController, 1 new method to UsersService, 1 DTO, 1 AuditAction value, and ~15-20 unit tests.

## Architecture Context

- **Module**: UsersModule (existing — no new imports needed)
- **New components**: UnlinkOAuthDto (1 DTO)
- **Modified components**: UsersService (+unlinkOAuth method), UsersController (+1 endpoint), prisma/schema.prisma (+1 AuditAction), audit-action.enum.ts (+1 value)
- **Key pattern reuse**: Follows `changePassword()` pattern in UsersService — find user, validate password, perform operation, revoke sessions + devices, audit log
- **No schema changes**: Only `provider` and `providerId` fields are updated (existing fields), no new models

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-111-backend` from latest code
- **Steps**:
  1. `git checkout feature/SCRUM-110-backend && git pull`
  2. `git checkout -b feature/SCRUM-111-backend`

### Step 1: Add AuditAction Value

- **Files**: `prisma/schema.prisma`, `src/audit/enums/audit-action.enum.ts`
- **Action**: Add `OAUTH_UNLINKED` to both the Prisma enum and TypeScript enum

#### 1.1: Prisma schema — add after PASSKEY_AUTH_FAILURE

```prisma
OAUTH_UNLINKED
```

#### 1.2: TypeScript enum — add after PASSKEY_AUTH_FAILURE

```typescript
OAUTH_UNLINKED = 'OAUTH_UNLINKED',
```

#### 1.3: Generate Prisma client

```bash
npx prisma generate
```

### Step 2: Create DTO

- **File**: `src/users/dto/unlink-oauth.dto.ts` (NEW)
- **Action**: Create DTO with required password field
- **Pattern**: Follows `DeleteAccountDto` but password is required (not optional)

```typescript
import { IsString, MinLength, MaxLength } from 'class-validator';

export class UnlinkOAuthDto {
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  password: string;
}
```

- **Notes**: Password is required (not @IsOptional) because unlinking always requires password confirmation. OAuth-only users (no password) cannot reach this point — the service validates `passwordHash != null` before checking the password.

### Step 3: Add unlinkOAuth Method to UsersService

- **File**: `src/users/users.service.ts`
- **Action**: Add `unlinkOAuth(userId, dto, ctx?)` method
- **Location**: After `selfDeleteAccount()` method (line ~651), before `private hashToken()`
- **No new imports needed**: All dependencies (bcrypt, PrismaService, AuditService, SessionsService, TrustedDeviceService, Provider, AuditAction, BadRequestException, UnauthorizedException) are already imported

#### Method signature:

```typescript
async unlinkOAuth(
  userId: string,
  dto: UnlinkOAuthDto,
  ctx?: RequestContext,
): Promise<{ message: string }>
```

#### Implementation steps:

1. `findById(userId)` — throw `NotFoundException` if not found
2. Check `user.provider === Provider.LOCAL` — throw `BadRequestException('No OAuth provider linked to this account')` if already local
3. Check `!user.passwordHash` — throw `BadRequestException('You must set a password before unlinking your OAuth provider')` if no password set
4. `bcrypt.compare(dto.password, user.passwordHash)` — throw `UnauthorizedException('Invalid password')` if false
5. Store `previousProvider = user.provider`, `previousProviderId = user.providerId` for audit
6. `prisma.user.update({ where: { id: userId }, data: { provider: Provider.LOCAL, providerId: null } })`
7. `await sessionsService.revokeAllUserSessions(userId)` — force re-authentication
8. `await trustedDeviceService.revokeAllDevices(userId)` — clear device trust
9. Fire-and-forget audit: `auditService.log({ action: AuditAction.OAUTH_UNLINKED, userId, ipAddress: ctx?.ipAddress, userAgent: ctx?.userAgent, metadata: { previousProvider, previousProviderId } }).catch(() => {})`
10. Return `{ message: 'OAuth provider unlinked successfully' }`

- **Notes**: Follows the exact same pattern as `changePassword()` for password verification + session/device revocation + audit logging. The order check (provider != LOCAL) before passwordHash check is intentional — a LOCAL user will never have this confusion.

### Step 4: Add Endpoint to UsersController

- **File**: `src/users/users.controller.ts`
- **Action**: Add `DELETE /users/me/oauth` endpoint
- **Location**: After `deleteOwnAccount()` (line ~94), before the admin endpoints section
- **New import**: `UnlinkOAuthDto` from `./dto/unlink-oauth.dto`
- **Guards**: `JwtAuthGuard` only (matches other self-service endpoints)
- **Rate limit**: `@Throttle({ global: { ttl: 60_000, limit: 5 } })` — same as mfa profile (sensitive account operation with password verification)

```typescript
@Delete('me/oauth')
@UseGuards(JwtAuthGuard)
@Throttle({ global: { ttl: 60_000, limit: 5 } })
@HttpCode(HttpStatus.OK)
async unlinkOAuth(
  @Request()
  req: { user: { id: string }; ip?: string; headers?: Record<string, string> },
  @Body() dto: UnlinkOAuthDto,
) {
  return this.usersService.unlinkOAuth(req.user.id, dto, {
    ipAddress: req.ip || null,
    userAgent: req.headers?.['user-agent'] || null,
  });
}
```

- **IMPORTANT**: This endpoint MUST be placed BEFORE the `@Delete(':id')` admin endpoint to avoid route collision. NestJS matches routes in declaration order — `me/oauth` is a literal path segment that must be matched before `:id` (which would capture "me" as a UUID param and fail at ParseUUIDPipe).

### Step 5: Build Verification

1. `npx prisma generate`
2. `npx nest build` — zero errors
3. Verify no TypeScript errors, no circular dependency issues

### Step 6: Unit Tests — UsersService.unlinkOAuth (~12 tests)

- **File**: `src/users/tests/users.service.spec.ts` (MODIFY — add new describe block)
- **Location**: Add `describe('unlinkOAuth', ...)` block after the existing `describe('selfDeleteAccount', ...)` block
- **Mock setup**: Reuses existing mock infrastructure (prisma, auditService, sessionsService, trustedDeviceService, bcrypt)

| # | Test | Key Assertion |
|---|------|---------------|
| 1 | Successfully unlinks Google provider | Updates provider to LOCAL, providerId to null, returns success message |
| 2 | Successfully unlinks GitHub provider | Same as above but with GITHUB provider |
| 3 | Revokes all sessions after unlink | `sessionsService.revokeAllUserSessions` called with userId |
| 4 | Revokes all trusted devices after unlink | `trustedDeviceService.revokeAllDevices` called with userId |
| 5 | Audits OAUTH_UNLINKED with previous provider metadata | `auditService.log` called with OAUTH_UNLINKED, metadata includes previousProvider and previousProviderId |
| 6 | Throws NotFoundException if user not found | findById returns null → NotFoundException |
| 7 | Throws BadRequestException if already LOCAL | user.provider === LOCAL → BadRequestException('No OAuth provider linked') |
| 8 | Throws BadRequestException if no password set | user.passwordHash === null → BadRequestException('must set a password') |
| 9 | Throws UnauthorizedException if wrong password | bcrypt.compare returns false → UnauthorizedException('Invalid password') |
| 10 | Audit failure does not break unlink operation | auditService.log rejects → operation still succeeds |
| 11 | Passes ipAddress and userAgent to audit from ctx | ctx values propagated to auditService.log |
| 12 | Works without ctx parameter (undefined) | ctx undefined → ipAddress/userAgent are undefined in audit |

### Step 7: Unit Tests — UsersController.unlinkOAuth (~3 tests)

- **File**: `src/users/tests/users.controller.spec.ts` (MODIFY — add new describe block)
- **Location**: Add `describe('unlinkOAuth', ...)` block after the existing `describe('deleteOwnAccount', ...)` block

| # | Test | Key Assertion |
|---|------|---------------|
| 1 | Delegates to usersService.unlinkOAuth with correct params | Service called with userId, dto, RequestContext |
| 2 | Returns service result directly | Controller returns `{ message: ... }` from service |
| 3 | Extracts RequestContext from request | ipAddress and userAgent extracted from req |

### Step 8: Full Test Suite + Coverage

1. `npx jest --coverage` — all tests pass, all thresholds met
2. Verify no regressions in existing tests
3. Expected: ~741 total tests (726 existing + ~15 new)
4. Coverage thresholds: stmts ≥90%, branches ≥85%, funcs ≥90%, lines ≥90%

### Step 9: Runtime Verification

1. `npx nest start` — verify 53 routes (52 existing + 1 new), no DI errors
2. New route confirmed: `DELETE /users/me/oauth`

### Step 10: Update Technical Documentation

| File | Changes |
|------|---------|
| `ai-specs/specs/integration-state.md` | UsersController Method Guards: +DELETE /me/oauth row; changelog entry for SCRUM-111 |
| `ai-specs/specs/data-model.md` | AuditAction enum: +OAUTH_UNLINKED value and description |
| `ai-specs/specs/api-spec.yml` | +1 endpoint definition: DELETE /users/me/oauth with request/response schemas |

## Implementation Order

1. Step 0: Feature branch
2. Step 1: AuditAction enum value + prisma generate
3. Step 2: UnlinkOAuthDto
4. Step 3: UsersService.unlinkOAuth()
5. Step 4: UsersController endpoint
6. Step 5: Build verification
7. Step 6: Service unit tests
8. Step 7: Controller unit tests
9. Step 8: Full test suite + coverage
10. Step 9: Runtime verification
11. Step 10: Update documentation

## Testing Checklist

- [ ] `nest build` compiles with zero errors
- [ ] All existing tests pass (no regressions)
- [ ] UsersService.unlinkOAuth: ~12 new tests passing
- [ ] UsersController.unlinkOAuth: ~3 new tests passing
- [ ] Total new tests: ~15
- [ ] Coverage thresholds met (stmts ≥90%, branches ≥85%, funcs ≥90%, lines ≥90%)
- [ ] `nest start` loads without DI errors, 53 routes registered
- [ ] DELETE /users/me/oauth: unlinks Google provider
- [ ] DELETE /users/me/oauth: unlinks GitHub provider
- [ ] Already LOCAL: returns 400
- [ ] No password set: returns 400
- [ ] Wrong password: returns 401
- [ ] Sessions revoked after unlink
- [ ] Trusted devices revoked after unlink
- [ ] OAUTH_UNLINKED audit logged with previous provider metadata
- [ ] Rate limited (5 req/60s)

## Error Response Format

| Status | Condition | Message |
|--------|-----------|---------|
| 200 | Successfully unlinked | `{ "message": "OAuth provider unlinked successfully" }` |
| 400 | Already LOCAL provider | `{ "message": "No OAuth provider linked to this account" }` |
| 400 | No password set (OAuth-only) | `{ "message": "You must set a password before unlinking your OAuth provider" }` |
| 400 | DTO validation fail | Standard ValidationPipe errors |
| 401 | Invalid/missing JWT | Standard 401 |
| 401 | Wrong password | `{ "message": "Invalid password" }` |
| 429 | Rate limit exceeded | Standard 429 |

## Dependencies

- No new npm dependencies
- Uses existing: bcrypt, PrismaService, AuditService, SessionsService, TrustedDeviceService

## Notes

- **No new module imports**: UsersModule already imports AuditModule, SessionsModule, and MailModule. All dependencies (PrismaService @Global, AuditService, SessionsService, TrustedDeviceService via forwardRef) are already available.
- **Route ordering**: `DELETE /users/me/oauth` MUST be declared before `DELETE /users/:id` in the controller to avoid route collision.
- **Re-linking**: After unlinking, users can re-link by going through the standard OAuth login flow (`findOrCreateByOAuth` already handles LOCAL → OAuth upgrade at lines 159-169 of users.service.ts).
- **Password gate**: The password check is the critical safety mechanism. OAuth-only users (no passwordHash) cannot unlink — they must first set a password via a separate flow.
- **No migration**: Only enum value addition — uses `npx prisma generate` only (no `migrate dev`). Migration handled at deploy time.
- **Pattern consistency**: Follows the exact same pattern as `changePassword()` — find user, validate, perform, revoke sessions + devices, audit.

## Implementation Verification

- [ ] Code Quality: NestJS patterns, proper DI, no circular deps
- [ ] Functionality: Unlink endpoint converts OAuth account to LOCAL
- [ ] Security: Password confirmation, session revocation, device trust revocation, rate limiting, audit trail
- [ ] Testing: ~15 new tests, all thresholds met
- [ ] Integration: Route registered correctly, no DI errors
- [ ] Documentation: integration-state.md, data-model.md, api-spec.yml updated

## Files Summary

### New (1 file)
- `src/users/dto/unlink-oauth.dto.ts`

### Modified (5 files)
- `prisma/schema.prisma` — +1 AuditAction value (OAUTH_UNLINKED)
- `src/audit/enums/audit-action.enum.ts` — +1 value
- `src/users/users.service.ts` — +unlinkOAuth() method
- `src/users/users.controller.ts` — +DELETE /users/me/oauth endpoint
- `src/users/tests/users.service.spec.ts` — +~12 tests
- `src/users/tests/users.controller.spec.ts` — +~3 tests
