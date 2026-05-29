# SCRUM-141: Registration Anti-Enumeration — Fullstack Plan

- **Ticket**: SCRUM-141
- **Scope**: fullstack (backend + frontend)
- **Sprint**: 5 — Security Hardening
- **Priority**: CRITICAL (C-01)
- **Security references**: CWE-200, CWE-203, OWASP ASVS V2.1.1, NIST SP 800-63B §5.1.1.1

---

## BACKEND PLAN (15 sections)

### 1. Codebase State Snapshot

- **Date**: 2026-03-08
- **Last completed ticket**: SCRUM-139 (Passkey Conditional UI — Backlog)
- **Branch**: main (clean)

**Files verified**:

| File | Key observations |
|------|------------------|
| `auth.service.ts:111-124` | Constructor: 12 deps (UsersService, SessionsService, JwtService, OAuthCodeStore, AuditService, PasswordBreachService, PrismaService, MailService, TrustedDeviceService, ImpossibleTravelService, SuspiciousLoginService, TokenDenyListService) |
| `auth.service.ts:89-92` | `RegisterResult = { message: string; user: SafeUser }` — current return type |
| `auth.service.ts:136-177` | `register()`: findByEmail → ConflictException(409) if exists → isBreached check → bcrypt.hash → create → sendVerification → return `{ message, user }` |
| `auth.controller.ts:117-140` | `@Post('register')`, `@HttpCode(HttpStatus.CREATED)` (201), `@ApiResponse({ status: 409, description: 'Email already registered' })` |
| `error-messages.ts:5` | `REGISTRATION_FAILED: 'Unable to complete registration'` — already generic from SCRUM-140 |
| `auth.constants.ts:17-20` | `DUMMY_PASSWORD_HASH` exists — pre-computed bcrypt hash for timing protection |
| `mail.service.ts` | 10 methods, no `sendRegistrationAttemptNotification` yet. Constructor: `MailerService` only |
| `auth.service.spec.ts:271-338` | 7 register tests: success (5), ConflictException (1), BadRequestException/breach (1) |
| `auth.controller.spec.ts:157-186` | 2 register tests: success (1), ConflictException propagation (1) |
| `auth.service.spec.ts:1784-1804` | 1 test: registration succeeds when verification email fails |

### 2. Overview

The registration endpoint (`POST /auth/register`) currently reveals email existence through two vectors:

1. **HTTP status code**: Returns 409 (Conflict) for existing emails vs 201 (Created) for new ones
2. **Timing side-channel**: Existing email path skips `bcrypt.hash()` (~250ms), new email path includes it

**Fix**: Return identical HTTP 200 response with generic message for both paths. Use `DUMMY_PASSWORD_HASH` with `bcrypt.compare()` for timing protection on existing-email path. Send notification email to existing users (security alert). Frontend adapts to new response shape (no `user` object).

### 3. Architecture Context

- **Module**: AuthModule
- **Affected service**: AuthService.register()
- **Affected controller**: AuthController.register()
- **New mail method**: MailService.sendRegistrationAttemptNotification()
- **No new modules/guards/DI changes** — only method signatures and behavior
- **RegisterResult interface**: Changes from `{ message, user }` to `{ message }` only

### 4. Implementation Steps

#### Step 1: Update `RegisterResult` interface

**File**: `nexacore-api/src/auth/auth.service.ts` (line 89-92)

```typescript
// BEFORE
export interface RegisterResult {
  message: string;
  user: SafeUser;
}

// AFTER
export interface RegisterResult {
  message: string;
}
```

#### Step 2: Rewrite `register()` method for anti-enumeration

**File**: `nexacore-api/src/auth/auth.service.ts` (lines 136-177)

```typescript
async register(
  dto: RegisterDto,
  requestMeta: { ipAddress: string; userAgent?: string | null },
  ctx?: RequestContext,
): Promise<RegisterResult> {
  const existingUser = await this.usersService.findByEmail(dto.email);

  if (existingUser) {
    // Timing protection: consume ~same time as bcrypt.hash
    await bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH);

    // Notify existing user of registration attempt (non-blocking)
    this.mailService
      .sendRegistrationAttemptNotification(
        existingUser.email,
        existingUser.firstName,
      )
      .catch(() => {});

    // Audit log (non-blocking)
    this.auditService
      .log({
        action: AuditAction.REGISTER,
        userId: existingUser.id,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
        metadata: { email: dto.email, outcome: 'existing_email' },
      })
      .catch(() => {});

    return { message: ErrorMessages.auth.CHECK_EMAIL };
  }

  const isBreached = await this.passwordBreachService.isBreached(dto.password);
  if (isBreached) {
    throw new BadRequestException(
      'This password has appeared in a data breach. Please choose a different password.',
    );
  }

  const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

  const user = await this.usersService.create({
    email: dto.email,
    passwordHash,
  });

  // Send verification email (non-blocking)
  this.createAndSendVerificationEmail(user).catch(() => {});

  this.auditService
    .log({
      action: AuditAction.REGISTER,
      userId: user.id,
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
      metadata: { email: dto.email, outcome: 'new_account' },
    })
    .catch(() => {});

  return { message: ErrorMessages.auth.CHECK_EMAIL };
}
```

**Key changes**:
- No `ConflictException` — existing emails get same response
- `bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH)` ensures timing parity with `bcrypt.hash()`
- Returns `{ message: 'Please check your email to continue' }` for both paths (uses `ErrorMessages.auth.CHECK_EMAIL`)
- No `user` in response — prevents any data leakage
- Audit log distinguishes `outcome: 'existing_email'` vs `'new_account'` for internal tracking

#### Step 3: Update controller response

**File**: `nexacore-api/src/auth/auth.controller.ts` (lines 117-140)

```typescript
@Post('register')
@Throttle({
  global: {
    ttl: AUTH_RATE_LIMITS.register.ttl,
    limit: AUTH_RATE_LIMITS.register.limit,
  },
})
@HttpCode(HttpStatus.OK)  // ← Changed from CREATED (201) to OK (200)
@ApiOperation({ summary: 'Register a new user account' })
@ApiResponse({
  status: 200,
  description: 'Registration request processed',
})
@ApiResponse({ status: 400, description: 'Validation error' })
// REMOVED: @ApiResponse({ status: 409, description: 'Email already registered' })
@ApiResponse({ status: 429, description: 'Too many requests' })
async register(
  @Body() registerDto: RegisterDto,
  @Request() req: any,
) {
  const meta = this.extractRequestMeta(req);
  const result = await this.authService.register(registerDto, meta, meta);
  return { message: result.message };  // ← No user in response
}
```

#### Step 4: Add `sendRegistrationAttemptNotification` to MailService

**File**: `nexacore-api/src/mail/mail.service.ts`

Add new method after `sendVerificationEmail` (after line 40):

```typescript
async sendRegistrationAttemptNotification(
  email: string,
  firstName?: string | null,
): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

  try {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Registration attempt on your EM NexaCore account',
      template: 'registration-attempt',
      context: {
        name: firstName || email.split('@')[0],
        frontendUrl,
        attemptedAt: new Date().toISOString(),
        currentYear: new Date().getFullYear(),
      },
    });
    this.logger.log(`Registration attempt notification sent to ${email}`);
  } catch (error) {
    this.logger.error(
      `Failed to send registration attempt notification to ${email}`,
      error,
    );
  }
}
```

**Email template** (`registration-attempt.hbs`): Simple alert informing the user someone tried to create an account with their email. Includes link to login page and password reset if they suspect compromise.

#### Step 5: Create email template

**File**: `nexacore-api/src/mail/templates/registration-attempt.hbs`

Basic Handlebars template matching existing email template style (same layout as `verification.hbs`). Content:
- "Someone tried to create a new EM NexaCore account using your email address."
- "If this was you, you already have an account. You can sign in or reset your password."
- Links to login and password reset pages.

### 5. Testing Checklist

#### `auth.service.spec.ts` — Register tests to UPDATE/ADD:

| # | Test | Action |
|---|------|--------|
| 1 | "should create a new user with hashed password and return message + user" | UPDATE: assert returns `{ message: 'Please check your email to continue' }` with NO `user` property |
| 2 | "should return SafeUser without passwordHash" | REMOVE: no user in response |
| 3 | "should throw ConflictException when email already exists" | REPLACE: assert returns `{ message: 'Please check your email to continue' }` (no exception) |
| 4 | NEW: "should call bcrypt.compare with DUMMY_PASSWORD_HASH when email exists" | Assert timing protection |
| 5 | NEW: "should call sendRegistrationAttemptNotification when email exists" | Assert notification sent |
| 6 | NEW: "should return same response shape for existing and new emails" | Deep equality of response structure |
| 7 | NEW: "should still throw BadRequestException for breached passwords" | Unchanged behavior for new emails |
| 8 | "register should succeed even when audit fails" | UPDATE: remove `user` assertion |
| 9 | "should complete registration even when verification email fails" | UPDATE: remove `user` assertion |

#### `auth.controller.spec.ts` — Register tests to UPDATE:

| # | Test | Action |
|---|------|--------|
| 1 | "should return message + user without setting cookie" | UPDATE: assert returns `{ message }` only |
| 2 | "should propagate ConflictException from service" | REMOVE: no ConflictException path |
| 3 | NEW: "should return 200 status code" | Verify HttpCode changed |

### 6. Error Response Format

| Scenario | HTTP Status | Response |
|----------|-------------|----------|
| New email (success) | 200 | `{ "message": "Please check your email to continue" }` |
| Existing email | 200 | `{ "message": "Please check your email to continue" }` |
| Breached password | 400 | `{ "statusCode": 400, "message": "This password has appeared..." }` |
| Validation error | 400 | Standard NestJS validation pipe error |
| Rate limited | 429 | Standard throttle response |

### 7. Dependencies

- `DUMMY_PASSWORD_HASH` from `auth.constants.ts` — already exists
- `ErrorMessages.auth.CHECK_EMAIL` from `error-messages.ts` — already exists (`'Please check your email to continue'`)
- `bcrypt.compare` — already imported
- `MailService` — already injected in AuthService constructor
- `registration-attempt.hbs` template — NEW, must be created

### 8. Notes

- **Password breach check**: Only runs for new emails. Existing-email path skips it (we don't validate passwords against a user that's not being created).
- **Timing**: `bcrypt.compare()` against `DUMMY_PASSWORD_HASH` takes approximately the same time as `bcrypt.hash()` with 12 rounds, preventing timing-based enumeration.
- **Email template**: If the Handlebars template file is missing, `MailerService.sendMail()` will throw, which is caught and logged. Registration still succeeds.
- **No ConflictException import cleanup needed** — it's used elsewhere in the file (e.g., OAuth).

### 9. Next Steps

After implementation:
1. Run `nest build` — must compile clean
2. Run `jest --maxWorkers=1 --forceExit` — all tests must pass
3. Update `integration-state.md` changelog
4. Proceed to frontend changes

### 10. Implementation Verification

- [ ] `POST /auth/register` returns 200 for both existing and new emails
- [ ] Response body is `{ message }` only — no `user` object
- [ ] `bcrypt.compare` called with `DUMMY_PASSWORD_HASH` for existing emails
- [ ] `sendRegistrationAttemptNotification` called for existing emails
- [ ] `sendVerificationEmail` called for new emails
- [ ] BadRequestException still thrown for breached passwords
- [ ] Audit log includes `outcome` field distinguishing the two paths
- [ ] All existing tests updated, new tests added
- [ ] `tsc --noEmit` clean
- [ ] `jest` all pass

### 11. Module-Level Planning

No module changes. AuthModule already imports MailService. No new providers, imports, or exports.

### 12. Satellite App Planning

No satellite app impact. The registration endpoint is consumed only by the dashboard frontend.

### 13. Cross-Ticket Dependency Checklist

| Ticket | Relationship | Status |
|--------|-------------|--------|
| SCRUM-140 | Parent — error message standardization | Done — `ErrorMessages.auth.CHECK_EMAIL` already exists |
| SCRUM-142 | C-02 Login anti-enumeration | Independent — separate endpoint |
| SCRUM-145 | C-05 Forgot-password anti-enumeration | Independent — separate endpoint |
| SCRUM-146 | C-06 Resend-verification anti-enumeration | Independent — separate endpoint |

### 14. Guard Dependency Chain Verification

No guards involved. The `POST /auth/register` endpoint is public (`@Public()` decorator or no guard). No changes to guard chains.

### 15. API Spec Changes

**File**: `ai-specs/specs/api-spec.yml`

Update `POST /auth/register`:
- Response status: `201` → `200`
- Remove `409` response
- Response schema: remove `user` property, keep only `message`

---

## FRONTEND PLAN (13 sections)

### 1. Overview

Adapt the dashboard to handle the new registration response shape. The backend no longer returns a `user` object on registration — only `{ message }`. The frontend must:
- Remove the `SafeUser` type expectation from `register()`
- Always redirect to check-email page on success (no change in UX)
- Remove any error handling for 409 Conflict (will never occur)

### 2. Component Tree

```
RegisterForm.tsx
  └── useAuth() → register()
        └── AuthContext.tsx → apiClient.post('/auth/register')
```

No new components. No visual changes.

### 3. Files to Modify

| File | Changes |
|------|---------|
| `nexacore-dashboard/src/context/AuthContext.tsx` | Change `register()` response type from `{ message: string; user: SafeUser }` to `{ message: string }` |
| `nexacore-dashboard/src/components/auth/RegisterForm.tsx` | No changes needed — already only checks `success` boolean |

### 4. Implementation Steps

#### Step 1: Update AuthContext.register()

**File**: `nexacore-dashboard/src/context/AuthContext.tsx` (lines 205-222)

```typescript
// BEFORE
const register = useCallback(async (email: string, password: string): Promise<boolean> => {
  dispatch({ type: 'AUTH_START' });
  try {
    await apiClient.post<{ message: string; user: SafeUser }>('/auth/register', { email, password });
    dispatch({ type: 'AUTH_STOP' });
    return true;
  } catch (err: unknown) {
    // ...error handling...
  }
}, [addToast]);

// AFTER
const register = useCallback(async (email: string, password: string): Promise<boolean> => {
  dispatch({ type: 'AUTH_START' });
  try {
    await apiClient.post<{ message: string }>('/auth/register', { email, password });
    dispatch({ type: 'AUTH_STOP' });
    return true;
  } catch (err: unknown) {
    // ...error handling unchanged...
  }
}, [addToast]);
```

Only change: generic type parameter from `{ message: string; user: SafeUser }` to `{ message: string }`.

#### Step 2: Verify RegisterForm.tsx

**File**: `nexacore-dashboard/src/components/auth/RegisterForm.tsx` (lines 56-61)

Current code:
```typescript
const success = await register(formData.email, formData.password);
if (success) {
  addToast({ variant: 'success', title: 'Account created', description: 'Check your inbox to verify your email.' });
  router.push('/activation/check-email');
}
```

**No changes needed** — the form only uses the boolean return value, not the response data.

### 5. Testing Checklist

No frontend test changes needed:
- RegisterForm tests (if they exist) mock `useAuth` and don't depend on response shape
- AuthContext tests (if they exist) would need the type update but no behavioral change

### 6. Error Handling

| Scenario | Before | After |
|----------|--------|-------|
| New email | 201 → success | 200 → success |
| Existing email | 409 → error toast "Unable to complete registration" | 200 → success (redirect to check-email) |
| Breached password | 400 → error toast | 400 → error toast (unchanged) |
| Rate limited | 429 → rate limit banner | 429 → rate limit banner (unchanged) |

**Key UX change**: Users who register with an existing email will see "Check your inbox to verify your email" and be redirected to the check-email page — identical to the new-email experience. The existing user will receive a security notification email instead.

### 7. Route Changes

None.

### 8. State Management Changes

None. `AuthContext` state transitions remain identical (`AUTH_START` → `AUTH_STOP`).

### 9. API Integration

| Endpoint | Before | After |
|----------|--------|-------|
| `POST /auth/register` | Expects 201 + `{ message, user }` | Expects 200 + `{ message }` |

`apiClient` handles non-2xx as errors, so the change from 201 to 200 is transparent. The only code change is the TypeScript generic type parameter.

### 10. Figma / Design Changes

None. No visual changes to the registration form or flow.

### 11. Dependencies

- `SafeUser` import in AuthContext can be removed from the `register` function's generic type, but it may still be used elsewhere in the file — do not remove the import.

### 12. Accessibility

No changes.

### 13. Performance

No impact. One fewer object in the response payload (marginal).

---

## Cross-Cutting Concerns

### Feature Branch

`feature/SCRUM-141-fullstack`

### Implementation Order

1. Backend changes first (Steps 1-5)
2. Backend tests updated and passing
3. Frontend changes (Steps 1-2)
4. Full build verification (`nest build` + `npm run build`)
5. Single commit, single PR

### Rollback Strategy

Revert the single commit. No database migrations, no schema changes.
