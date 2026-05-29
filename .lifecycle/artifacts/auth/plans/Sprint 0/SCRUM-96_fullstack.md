# Fullstack Implementation Plan: SCRUM-96 — Auth UX Polish: Password Recovery Flow, Figma Alignment + Resend Verification

## Codebase State Snapshot

- **Date**: 2026-03-01
- **Last completed ticket**: SCRUM-95 fullstack (rate limiting coherence fix — implemented, uncommitted)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/auth/auth.service.ts` — `resetPassword()` at line ~680, `resendVerificationEmail(userId)` at line ~600, `hashToken()` helper, `createAndSendVerificationEmail()` helper
  - `nexacore-api/src/auth/auth.controller.ts` (469 lines) — 36 routes, `@Throttle` on forgot-password/reset-password, `@SkipCsrf()` on public endpoints
  - `nexacore-api/src/auth/dto/` — existing: `forgot-password.dto.ts`, `reset-password.dto.ts` (pattern reference)
  - `nexacore-api/prisma/schema.prisma` — `PasswordResetToken` model with `tokenHash`, `usedAt`, `expiresAt`, `user` relation; `EmailVerificationToken` model with `userId`, `createdAt`
  - `nexacore-dashboard/src/context/AuthContext.tsx` (361 lines) — `AuthContextType`, `login()` catch block, `apiClient` instance
  - `nexacore-dashboard/src/components/auth/ForgotPasswordForm.tsx` (99 lines) — no toast import, redirect to `/check-email`
  - `nexacore-dashboard/src/app/check-email/page.tsx` — two side-by-side buttons layout
  - `nexacore-dashboard/src/components/auth/ResetPasswordForm.tsx` (172 lines) — has `success` state and success render block, no token validation on mount
  - `nexacore-dashboard/src/components/auth/LoginForm.tsx` (320 lines) — `PasswordStep`, `lockoutCache` module-level Map, toast via `useToast`
- **Constructor signatures verified**: `AuthService` constructor (6 injections: prisma, usersService, jwtService, configService, mailerService, auditService)
- **Guard dependency chain verified**: Public endpoints use `@SkipCsrf()` + `@Throttle()` — no guard constructor dependencies for new endpoints (both are public/unauthenticated)

## Overview

- **Epic**: N/A — standalone UX polish ticket
- **Ticket**: SCRUM-96
- **Priority**: Medium
- **What this implements**: Fixes 8 UX issues identified during manual QA of auth flows (post SCRUM-94/95): missing toasts, Figma layout misalignment, validation gaps, expired token UX, same-password acceptance, unnecessary success screen, and dead-end for unverified users.

### Issue Inventory

| # | Issue | Severity | Scope |
|---|-------|----------|-------|
| 1 | No toast on forgot-password submit | LOW | Frontend |
| 2 | Check-email page layout doesn't match Figma (two side-by-side buttons) | LOW | Frontend |
| 3 | Reset-password page layout doesn't match Figma (two side-by-side buttons) + subtitle mismatch | LOW | Frontend |
| 4 | Empty confirm-password accepted (only checks mismatch, not empty) | MEDIUM | Frontend |
| 5 | Expired/invalid token shows reset form instead of redirect | HIGH | Fullstack |
| 6 | Same password as current accepted on reset | MEDIUM | Backend |
| 7 | Unnecessary success screen after reset (should toast + redirect) | LOW | Frontend |
| 8 | Unverified users on login have no way to resend verification email | HIGH | Fullstack |

### Design Decisions

1. **Token validation endpoint is read-only** — `GET /auth/validate-reset-token` checks validity without consuming the token (no `usedAt` update). Returns `{ valid: boolean }`.
2. **Anti-enumeration on resend-verification** — `POST /auth/resend-verification-public` always returns generic success message. No exceptions for not-found, already-verified, or cooldown scenarios.
3. **Same-password check uses bcrypt.compare** — Compares new plaintext password against existing hash. Guards `if (passwordHash)` for OAuth-only users.
4. **Module-level cooldown cache for resend** — Persists across SPA navigation within the same session. 60s client-side + 3/15min server-side throttle.
5. **Login error inline for unverified users** — Dispatches `AUTH_ERROR` instead of toast, so the resend link appears alongside the error message.
6. **Figma layout pattern** — Single full-width primary button + right-aligned text link (replaces two side-by-side buttons).

## Architecture Context

### Modules involved

| Module | Responsibility | Change |
|--------|---------------|--------|
| `auth` (API) | Authentication service + controller | **Modified** — 3 new service methods, 2 new controller endpoints |
| `auth/dto` (API) | Data transfer objects | **New file** — `resend-verification-public.dto.ts` |
| `AuthContext` (dashboard) | Auth state management | **Modified** — 2 new methods, login error handling change |
| Auth forms (dashboard) | Login, ForgotPassword, CheckEmail, ResetPassword | **Modified** — toast, layout, validation, token check, resend link |

### Components affected

| Component | File | Change |
|-----------|------|--------|
| ResendVerificationPublicDto | `nexacore-api/src/auth/dto/resend-verification-public.dto.ts` | **NEW** — DTO with `@IsEmail()` |
| AuthService | `nexacore-api/src/auth/auth.service.ts` | Add `validateResetToken()`, same-password check in `resetPassword()`, `resendVerificationByEmail()` |
| AuthController | `nexacore-api/src/auth/auth.controller.ts` | Add `GET /auth/validate-reset-token`, `POST /auth/resend-verification-public` |
| AuthContext | `nexacore-dashboard/src/context/AuthContext.tsx` | Add `validateResetToken`, `resendVerificationPublic` callbacks; modify `login` catch |
| ForgotPasswordForm | `nexacore-dashboard/src/components/auth/ForgotPasswordForm.tsx` | Add success toast before redirect |
| CheckEmailPage | `nexacore-dashboard/src/app/check-email/page.tsx` | Figma layout: text link + single button |
| ResetPasswordForm | `nexacore-dashboard/src/components/auth/ResetPasswordForm.tsx` | Token validation, confirm validation, Figma layout, remove success screen, toast+redirect |
| LoginForm | `nexacore-dashboard/src/components/auth/LoginForm.tsx` | Resend verification link with 60s cooldown |

### Unchanged files (verified correct)

- `nexacore-api/prisma/schema.prisma` — `PasswordResetToken` and `EmailVerificationToken` models already support required queries
- `nexacore-api/src/auth/auth.module.ts` — no new module imports needed (all deps already present)
- `nexacore-dashboard/src/components/ui/Toast.tsx` — toast system works as-is

## Implementation Steps

### Step 0: Create Feature Branch

- **Branch name**: `feature/SCRUM-96-fullstack`
- **Base**: Latest working tree (with SCRUM-94/95 uncommitted changes)
- **Implementation Steps**:
  1. Ensure on latest working tree
  2. Create branch: `git checkout -b feature/SCRUM-96-fullstack`
  3. Verify: `git branch`

---

## Phase 1: Backend (Items 5, 6, 8)

### Step 1: Create DTO — `resend-verification-public.dto.ts` [Item 8]

- **File**: `nexacore-api/src/auth/dto/resend-verification-public.dto.ts` (NEW)
- **Action**: Create DTO with single `email` field
- **Implementation Steps**:
  1. Create file with `@IsEmail()` + `@ApiProperty()` decorators
  2. Follow same pattern as `ForgotPasswordDto`
- **Dependencies**: `class-validator`, `@nestjs/swagger`

```typescript
import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendVerificationPublicDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}
```

---

### Step 2: Add `validateResetToken()` to AuthService [Item 5]

- **File**: `nexacore-api/src/auth/auth.service.ts`
- **Action**: Insert new method after `resetPassword()` (~line 721)
- **Function Signature**: `async validateResetToken(token: string): Promise<{ valid: boolean }>`
- **Implementation Steps**:
  1. Hash the token using `this.hashToken(token)`
  2. Query `prisma.passwordResetToken.findUnique({ where: { tokenHash } })`
  3. Return `{ valid: false }` if: not found, `usedAt` is set, or `expiresAt < new Date()`
  4. Return `{ valid: true }` otherwise
- **Implementation Notes**:
  - Read-only: does NOT consume token (no `usedAt` update)
  - No `include: { user: true }` needed (just checking token validity)
  - Returns object, no exceptions for invalid tokens

```typescript
async validateResetToken(token: string): Promise<{ valid: boolean }> {
  const tokenHash = this.hashToken(token);
  const resetToken = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return { valid: false };
  }
  return { valid: true };
}
```

---

### Step 3: Add same-password check to `resetPassword()` [Item 6]

- **File**: `nexacore-api/src/auth/auth.service.ts`
- **Action**: Insert after expiry/used check (~line 694), before `bcrypt.hash`
- **Implementation Steps**:
  1. Check if `resetToken.user.passwordHash` exists (guard for OAuth-only users)
  2. Compare `dto.newPassword` against existing hash via `bcrypt.compare()`
  3. If same, throw `BadRequestException('New password must be different from current password')`
- **Implementation Notes**:
  - `resetToken.user` already loaded via `include: { user: true }` in existing query
  - OWASP recommendation: prevent password reuse on reset

```typescript
if (resetToken.user.passwordHash) {
  const isSamePassword = await bcrypt.compare(dto.newPassword, resetToken.user.passwordHash);
  if (isSamePassword) {
    throw new BadRequestException('New password must be different from current password');
  }
}
```

---

### Step 4: Add `resendVerificationByEmail()` to AuthService [Item 8]

- **File**: `nexacore-api/src/auth/auth.service.ts`
- **Action**: Insert after `resendVerificationEmail(userId)` (~line 618)
- **Function Signature**: `async resendVerificationByEmail(email: string): Promise<void>`
- **Implementation Steps**:
  1. Find user by email via `this.usersService.findByEmail(email)`
  2. If not found → return silently (anti-enumeration)
  3. If already verified → return silently (anti-enumeration)
  4. Check last `EmailVerificationToken` for cooldown (< `RESEND_COOLDOWN_SECONDS`)
  5. If cooldown active → return silently
  6. Call `this.createAndSendVerificationEmail(user)`
- **Implementation Notes**:
  - Key difference vs `resendVerificationEmail(userId)`: takes email, returns silently for all non-happy paths
  - No exceptions thrown for not-found/verified/cooldown (anti-enumeration)

```typescript
async resendVerificationByEmail(email: string): Promise<void> {
  const user = await this.usersService.findByEmail(email);
  if (!user) return;
  if (user.emailVerified) return;

  const lastToken = await this.prisma.emailVerificationToken.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  if (lastToken) {
    const elapsed = (Date.now() - lastToken.createdAt.getTime()) / 1000;
    if (elapsed < RESEND_COOLDOWN_SECONDS) return;
  }

  await this.createAndSendVerificationEmail(user);
}
```

---

### Step 5: Add controller endpoints [Items 5 + 8]

- **File**: `nexacore-api/src/auth/auth.controller.ts`
- **Action**: Add 2 new endpoints
- **Dependencies**: Import `ResendVerificationPublicDto`, `Query` decorator

**Endpoint 1: GET /auth/validate-reset-token** (after `resetPassword`, ~line 340):

```typescript
@Get('validate-reset-token')
@SkipCsrf()
@ApiOperation({ summary: 'Validate a password reset token without consuming it' })
@ApiQuery({ name: 'token', required: true })
@ApiResponse({ status: 200, description: 'Token validity status' })
async validateResetToken(@Query('token') token: string) {
  if (!token) return { valid: false };
  return this.authService.validateResetToken(token);
}
```

- Uses GET (same pattern as existing `GET /auth/verify-email?token=xxx`)
- `@SkipCsrf()` — public endpoint, no auth required

**Endpoint 2: POST /auth/resend-verification-public** (after `resendVerification`, ~line 302):

```typescript
@Post('resend-verification-public')
@HttpCode(HttpStatus.OK)
@SkipCsrf()
@Throttle({ global: { ttl: 900000, limit: 3 } })
@ApiOperation({ summary: 'Resend email verification (public, no auth required)' })
@ApiResponse({ status: 200, description: 'Generic success message' })
@ApiResponse({ status: 429, description: 'Too many requests' })
async resendVerificationPublic(@Body() dto: ResendVerificationPublicDto) {
  await this.authService.resendVerificationByEmail(dto.email);
  return { message: 'If an account exists and needs verification, we have sent an email' };
}
```

- `@SkipCsrf()` — public endpoint (same as forgot-password)
- `@Throttle` 3/15min — identical to forgot-password
- Generic message always (anti-enumeration)

---

### Step 6: Backend Tests

- **File**: `nexacore-api/src/auth/tests/auth.service.spec.ts` — ~10 new tests

| Method | Test | Expected |
|--------|------|----------|
| `validateResetToken` | Token not found | `{ valid: false }` |
| `validateResetToken` | Token used (`usedAt` set) | `{ valid: false }` |
| `validateResetToken` | Token expired | `{ valid: false }` |
| `validateResetToken` | Token valid | `{ valid: true }` |
| `resetPassword` | Same password as current | `BadRequestException` |
| `resendVerificationByEmail` | User not found | Resolves silently |
| `resendVerificationByEmail` | Already verified | Resolves silently |
| `resendVerificationByEmail` | Cooldown active | Resolves silently |
| `resendVerificationByEmail` | Success (no prior token) | Calls `createAndSendVerificationEmail` |
| `resendVerificationByEmail` | Success (cooldown expired) | Calls `createAndSendVerificationEmail` |

- **File**: `nexacore-api/src/auth/tests/auth.controller.spec.ts` — ~3 new tests

| Endpoint | Test |
|----------|------|
| `validateResetToken` | Delegates to service, returns `{ valid }` |
| `validateResetToken` | No token param → `{ valid: false }` |
| `resendVerificationPublic` | Delegates to service, returns generic message |

---

## Phase 2: Frontend (Items 1, 2, 3, 4, 5, 7, 8)

### Step 7: AuthContext — new methods + login error flow [Items 5, 7, 8]

- **File**: `nexacore-dashboard/src/context/AuthContext.tsx`
- **Action**: Add 2 new methods to type + callbacks + provider value; modify login catch
- **Implementation Steps**:
  1. Add `validateResetToken: (token: string) => Promise<boolean>` to `AuthContextType`
  2. Add `resendVerificationPublic: (email: string) => Promise<boolean>` to `AuthContextType`
  3. Implement `validateResetToken` callback (no `AUTH_START/STOP` — silent background check):
     ```typescript
     const validateResetToken = useCallback(async (token: string): Promise<boolean> => {
       try {
         const data = await apiClient.get<{ valid: boolean }>(`/auth/validate-reset-token?token=${encodeURIComponent(token)}`);
         return data.valid;
       } catch { return false; }
     }, []);
     ```
  4. Implement `resendVerificationPublic` callback (no `AUTH_START/STOP` — link action):
     ```typescript
     const resendVerificationPublic = useCallback(async (email: string): Promise<boolean> => {
       try {
         await apiClient.post<MessageResponse>('/auth/resend-verification-public', { email });
         return true;
       } catch { return false; }
     }, []);
     ```
  5. Modify `login()` catch block: When error contains "verify your email", dispatch `AUTH_ERROR` (inline error) instead of toast. All other errors keep the toast pattern.
  6. Add both callbacks to Provider value

---

### Step 8: ForgotPasswordForm — success toast [Item 1]

- **File**: `nexacore-dashboard/src/components/auth/ForgotPasswordForm.tsx`
- **Action**: Add success toast before redirect
- **Implementation Steps**:
  1. Import `useToast` from `@/components/ui/Toast`
  2. Add `const { addToast } = useToast()`
  3. Before `router.push('/check-email')`, add:
     ```typescript
     addToast({ variant: 'success', title: 'Recovery email sent', description: 'Check your inbox for the password reset link.' });
     ```

---

### Step 9: Check-email page — Figma layout [Item 2]

- **File**: `nexacore-dashboard/src/app/check-email/page.tsx`
- **Action**: Replace side-by-side buttons with Figma-aligned layout
- **Implementation Steps**:
  1. Replace two side-by-side buttons with:
     - **"Back to Sign In"**: right-aligned text link (styled like "Forgot password?" link)
     - **"Try Again"**: single full-width primary button

---

### Step 10: ResetPasswordForm — Figma layout + subtitle + validation [Items 3, 4, 5, 7]

- **File**: `nexacore-dashboard/src/components/auth/ResetPasswordForm.tsx`
- **Action**: Complete rewrite of UX flow
- **Implementation Steps**:
  1. **Subtitle** [Item 3]: Change to "Enter your new password. It must be at least 8 characters and different from your current one."
  2. **Confirm password validation** [Item 4]: Add `if (!confirmPassword) { setLocalError('Confirm your password.'); return; }` between `!password` and `password !== confirmPassword` checks
  3. **Token validation on mount** [Item 5]:
     - Get `validateResetToken` from `useAuth()`, `addToast` from `useToast()`
     - Add `useEffect` on mount: no token → toast warning + `router.replace('/forgot-password')`; call `validateResetToken(token)` → if `!valid` → toast warning + `router.replace('/forgot-password')`
     - Cleanup: `cancelled` flag prevents post-unmount state updates
  4. **Remove success screen** [Item 7]: Remove `success` state and `if (success)` render block. On reset success: `addToast({ variant: 'success', ... })` + `router.replace('/login')`
  5. **Figma layout** [Item 3]: Replace side-by-side buttons with:
     - "Back to Sign In" as right-aligned text link INSIDE the `min-h` container
     - "Reset Password" as single full-width primary button BELOW the container

---

### Step 11: LoginForm — resend verification link [Item 8]

- **File**: `nexacore-dashboard/src/components/auth/LoginForm.tsx`
- **Action**: Add resend verification email capability to PasswordStep
- **Implementation Steps**:
  1. **Module-level cache** (after `lockoutCache`):
     ```typescript
     const resendCooldownCache = new Map<string, number>(); // email -> timestamp
     ```
  2. **PasswordStep additions**:
     - New prop: `onResendVerification: (email: string) => Promise<boolean>`
     - State: `resendCooldown` (number, seconds remaining)
     - `useEffect` on mount: restore cooldown from module-level cache
     - `useEffect` countdown: decrement every second, cleanup on 0
     - Detect: `isVerificationError = error?.toLowerCase().includes('verify your email')`
     - Handler: `handleResendVerification` — set cache, set cooldown 60s, call prop, show success toast
  3. **JSX** — after error text, conditional resend link:
     ```tsx
     {isVerificationError && (
       <button type="button" onClick={handleResendVerification} disabled={resendCooldown > 0}
         className="text-sm font-medium leading-[21px] text-content-primary/75 underline ...">
         {resendCooldown > 0 ? `Resend verification email (${resendCooldown}s)` : 'Resend verification email'}
       </button>
     )}
     ```
  4. **LoginForm parent**: destructure `resendVerificationPublic` from `useAuth()`, pass to PasswordStep

---

## Phase 3: Documentation

### Step 12: Update Technical Documentation

- **File**: `ai-specs/ai-specs/specs/api-spec.yml`
  - Add `GET /auth/validate-reset-token` spec (query param `token`, response `{ valid: boolean }`)
  - Add `POST /auth/resend-verification-public` spec (body `{ email }`, response `{ message }`, 429 rate limit)
  - Update `POST /auth/reset-password` description to mention same-password rejection (OWASP)

- **File**: `ai-specs/ai-specs/specs/integration-state.md`
  - Update "Last update" to SCRUM-96 (2026-03-01)
  - Add 2 rows to AuthController Method Guards table
  - Auth module route count: 36 → 38
  - Add SCRUM-96 changelog entry

---

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Create `ResendVerificationPublicDto` (backend)
3. Step 2: Add `validateResetToken()` to AuthService (backend)
4. Step 3: Add same-password check to `resetPassword()` (backend)
5. Step 4: Add `resendVerificationByEmail()` to AuthService (backend)
6. Step 5: Add 2 controller endpoints (backend)
7. Step 6: Write backend tests (~13 tests)
8. Step 7: AuthContext — new methods + login error flow (frontend)
9. Step 8: ForgotPasswordForm — success toast (frontend)
10. Step 9: Check-email page — Figma layout (frontend)
11. Step 10: ResetPasswordForm — full UX rework (frontend)
12. Step 11: LoginForm — resend verification link (frontend)
13. Step 12: Update technical documentation

## Testing Checklist

### Backend
- [ ] `nest build` compiles clean
- [ ] All backend tests pass (441+ tests)
- [ ] Coverage thresholds met (Stmts ≥95%, Lines ≥95%)
- [ ] `validateResetToken` returns `{ valid: false }` for expired/used/missing tokens
- [ ] `validateResetToken` returns `{ valid: true }` for valid tokens
- [ ] `validateResetToken` does NOT consume the token
- [ ] `resetPassword` rejects same password with `BadRequestException`
- [ ] `resetPassword` still works for different password
- [ ] `resendVerificationByEmail` returns silently for non-existent email
- [ ] `resendVerificationByEmail` returns silently for verified user
- [ ] `resendVerificationByEmail` returns silently during cooldown
- [ ] `resendVerificationByEmail` sends email for valid unverified user

### Frontend
- [ ] `npm run build` (dashboard) compiles clean
- [ ] ForgotPasswordForm shows success toast on submit
- [ ] Check-email page matches Figma layout (link + single button)
- [ ] ResetPasswordForm matches Figma layout (link + single button)
- [ ] ResetPasswordForm shows updated subtitle
- [ ] Empty confirm-password shows "Confirm your password." error
- [ ] Expired/invalid token redirects to `/forgot-password` with warning toast
- [ ] Successful reset shows success toast and redirects to `/login` (no success screen)
- [ ] Same password shows "New password must be different" error
- [ ] Login with unverified user shows inline error + "Resend verification email" link
- [ ] Resend link triggers 60s countdown
- [ ] Countdown persists across SPA navigation (module-level cache)

## Error Response Format

### GET /auth/validate-reset-token — 200 OK

```json
{ "valid": true }
```
```json
{ "valid": false }
```

### POST /auth/resend-verification-public — 200 OK (always)

```json
{ "message": "If an account exists and needs verification, we have sent an email" }
```

### POST /auth/reset-password — 400 Bad Request (same password)

```json
{
  "success": false,
  "error": {
    "message": "New password must be different from current password",
    "statusCode": 400
  }
}
```

## Dependencies

- No new libraries required
- All backend dependencies already present in auth module
- Toast system (`useToast`) already available from SCRUM-94

## Notes

- **Prerequisite**: SCRUM-94 (toast system) and SCRUM-95 (rate limiting fix) must be implemented first
- **Anti-enumeration is critical**: Both `validateResetToken` (returns object, no exceptions) and `resendVerificationByEmail` (silent for all non-happy paths) follow security best practices
- **OAuth-only guard**: Same-password check guards `if (passwordHash)` to handle OAuth-only users who may not have a password hash
- **Module-level cache for resend cooldown**: Prevents UI reset on SPA navigation. 60s client-side + 3/15min server-side throttle provides defense-in-depth
- **Figma alignment**: All button layouts changed from two side-by-side buttons to single full-width primary button + right-aligned text link

## Next Steps After Implementation

- Create implementation record via `/update-docs SCRUM-96`
- Commit and push to `feature/SCRUM-96-fullstack`
- Create PR with ticket ID for Jira linkage

## Implementation Verification

- [ ] `ResendVerificationPublicDto` created with `@IsEmail()` validation
- [ ] `validateResetToken()` is read-only (no `usedAt` update)
- [ ] `resetPassword()` rejects same password (bcrypt.compare)
- [ ] `resendVerificationByEmail()` is fully anti-enumeration (no exceptions)
- [ ] Both new endpoints have `@SkipCsrf()` (public, no auth)
- [ ] `resend-verification-public` has `@Throttle` 3/15min
- [ ] AuthContext exposes `validateResetToken` and `resendVerificationPublic`
- [ ] Login catch dispatches `AUTH_ERROR` for "verify your email"
- [ ] ForgotPasswordForm shows success toast
- [ ] Check-email page: text link + single button
- [ ] ResetPasswordForm: token validation on mount, confirm validation, Figma layout, toast+redirect
- [ ] LoginForm: resend link with 60s countdown + module-level cache
- [ ] All 13 backend tests pass
- [ ] Backend build clean (441+ tests)
- [ ] Frontend build clean
- [ ] `api-spec.yml` updated with 2 new endpoints (38 total)
- [ ] `integration-state.md` updated with 2 new routes

## Files Summary

| # | File | Action | Items |
|---|------|--------|-------|
| 1 | `nexacore-api/src/auth/dto/resend-verification-public.dto.ts` | CREATE | 8 |
| 2 | `nexacore-api/src/auth/auth.service.ts` | MODIFY | 5, 6, 8 |
| 3 | `nexacore-api/src/auth/auth.controller.ts` | MODIFY | 5, 8 |
| 4 | `nexacore-api/src/auth/tests/auth.service.spec.ts` | MODIFY | 5, 6, 8 |
| 5 | `nexacore-api/src/auth/tests/auth.controller.spec.ts` | MODIFY | 5, 8 |
| 6 | `nexacore-dashboard/src/context/AuthContext.tsx` | MODIFY | 5, 7, 8 |
| 7 | `nexacore-dashboard/src/components/auth/ForgotPasswordForm.tsx` | MODIFY | 1 |
| 8 | `nexacore-dashboard/src/app/check-email/page.tsx` | MODIFY | 2 |
| 9 | `nexacore-dashboard/src/components/auth/ResetPasswordForm.tsx` | MODIFY | 3, 4, 5, 7 |
| 10 | `nexacore-dashboard/src/components/auth/LoginForm.tsx` | MODIFY | 8 |
| 11 | `ai-specs/ai-specs/specs/api-spec.yml` | MODIFY | 5, 8 |
| 12 | `ai-specs/ai-specs/specs/integration-state.md` | MODIFY | 5, 8 |

**New files**: 1 | **Modified**: 11 | **New tests**: ~13
