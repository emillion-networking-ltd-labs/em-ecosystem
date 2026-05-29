# Backend Implementation Plan: SCRUM-140 Security: Error Message Information Disclosure Audit & Remediation

## 1. Codebase State Snapshot

- **Date**: 2026-03-08
- **Last completed ticket**: SCRUM-138 (OAuth Manual Verification & Frontend Integration)
- **Integration state verified**: Yes
- **Sprint**: Sprint 5 - Security Hardening (id=136)

### Files verified against live code

| File | Purpose | Verified |
|------|---------|----------|
| `src/auth/auth.service.ts` | Core auth logic — login, register, OAuth, password reset | Yes (constructor lines 110-133) |
| `src/auth/mfa.service.ts` | MFA TOTP setup, verify, disable, backup codes | Yes (constructor lines 30-43) |
| `src/auth/passkey.service.ts` | WebAuthn passkey registration/authentication | Yes (constructor lines 43-52) |
| `src/auth/trusted-device.service.ts` | Device fingerprint trust management | Yes (constructor lines 15-24) |
| `src/auth/strategies/jwt.strategy.ts` | JWT validation and user lookup | Yes (constructor + validate) |
| `src/auth/guards/permissions.guard.ts` | RBAC permission enforcement | Yes (full file) |
| `src/auth/guards/roles.guard.ts` | Role-based access control | Yes |
| `src/common/guards/csrf.guard.ts` | CSRF double-submit cookie validation | Yes (full file) |
| `src/common/filters/http-exception.filter.ts` | Global error response formatter | Yes (full file) |
| `src/sessions/sessions.service.ts` | Session lifecycle, token rotation | Yes (constructor lines 46-50) |
| `src/users/users.service.ts` | User CRUD, profile, password change | Yes (constructor lines 42-53) |
| `src/users/users.controller.ts` | User endpoints | Yes |
| `src/auth/auth.controller.ts` | Auth endpoints | Yes |

### Constructor signatures verified

```
AuthService(usersService, sessionsService, jwtService, oauthCodeStore, auditService, passwordBreachService, prisma, mailService, trustedDeviceService, impossibleTravelService, suspiciousLoginService, tokenDenyListService) — 12 deps
MfaService(usersService, cryptoService, jwtService, auditService, trustedDeviceService) — 5 deps
PasskeyService(prisma, usersService, auditService, redis) — 4 deps
SessionsService(prisma, auditService, geolocationService) — 3 deps
UsersService(prisma, auditService, sessionsService, mailService, passwordBreachService, trustedDeviceService, tokenDenyListService) — 7 deps
TrustedDeviceService(prisma, auditService) — 2 deps
JwtStrategy(usersService, tokenDenyListService) — 2 deps
PermissionsGuard(reflector, permissionsService) — 2 deps
CsrfGuard(reflector) — 1 dep
```

### Methods verified to exist

All methods referenced in this plan have been confirmed to exist via live code reading. Error messages and their exact line numbers are documented in the Findings section below.

### Guard dependency chain verified

No new guards are being created. Existing guard chains remain unchanged.

### Discrepancies with integration-state.md

None. `integration-state.md` is current as of SCRUM-138.

---

## 2. Overview

This ticket implements a comprehensive **error message standardization** across the entire NexaCore API to eliminate information disclosure vulnerabilities. The remediation addresses 17 findings (6 CRITICAL, 8 HIGH, 3 MEDIUM) identified in the security audit.

**Architecture approach**: Create a centralized `ErrorMessages` constants file, update all services/guards/filters to use standardized messages, and update the `HttpExceptionFilter` to strip sensitive internal details from error responses.

**Key principle**: All public-facing error messages must be **generic enough to prevent enumeration, fingerprinting, or internal state disclosure**, while remaining useful for legitimate users. Authenticated endpoints behind JwtAuthGuard can be slightly more specific since the user is already identified.

---

## 3. Architecture Context

### Modules affected
- **AuthModule**: auth.service.ts, mfa.service.ts, passkey.service.ts, trusted-device.service.ts, jwt.strategy.ts, permissions.guard.ts
- **UsersModule**: users.service.ts, users.controller.ts
- **SessionsModule**: sessions.service.ts
- **CommonModule**: csrf.guard.ts, http-exception.filter.ts

### Components affected
- 7 services (AuthService, MfaService, PasskeyService, TrustedDeviceService, SessionsService, UsersService, JwtStrategy)
- 2 guards (PermissionsGuard, CsrfGuard)
- 1 filter (HttpExceptionFilter)
- 1 controller (AuthController)
- 1 new constants file (ErrorMessages)

### Files to create
- `src/common/constants/error-messages.ts`

### Files to modify
- `src/auth/auth.service.ts`
- `src/auth/mfa.service.ts`
- `src/auth/passkey.service.ts`
- `src/auth/trusted-device.service.ts`
- `src/auth/strategies/jwt.strategy.ts`
- `src/auth/guards/permissions.guard.ts`
- `src/common/guards/csrf.guard.ts`
- `src/common/filters/http-exception.filter.ts`
- `src/sessions/sessions.service.ts`
- `src/users/users.service.ts`
- `src/users/users.controller.ts`
- `src/auth/auth.controller.ts`
- ~20 spec files (test message expectations)

---

## 4. Security Findings Reference

### CRITICAL (C-01 to C-06) — Public Endpoint Enumeration

| ID | Finding | File:Line | Current Message | Remediated Message |
|----|---------|-----------|-----------------|-------------------|
| C-01a | Registration reveals email existence | auth.service.ts:142 | `'Email already registered'` | `'Unable to complete registration'` |
| C-01b | Email change reveals email existence | users.service.ts:570 | `'Email already registered'` | `'Unable to complete request'` |
| C-02 | Email verification reveals account type | auth.service.ts:312 | `'Verify your email to sign in. Check your inbox.'` | `'Please check your email to continue'` |
| C-03 | Passkey auth reveals deactivated state | passkey.service.ts:253 | `'Account is deactivated'` | `'Authentication failed'` |
| C-04 | Clone detection reveals mechanism | passkey.service.ts:317 | `'Passkey may have been cloned. Authentication rejected.'` | `'Authentication failed'` |
| C-05a | Lockout leaks `retryAfter` + `lockoutLevel` | auth.service.ts:215-221 | Object with `retryAfter`, `lockoutLevel` | Generic `'Too many attempts. Please try again later.'` + `Retry-After` HTTP header only |
| C-05b | Second lockout same issue | auth.service.ts:273-279 | Same as above | Same as above |
| C-06 | Password reset timing | auth.service.ts (forgot-password) | N/A — timing-based | Ensure constant-time response for both existing/non-existing emails |

### HIGH (H-01 to H-08) — Authenticated Information Disclosure

| ID | Finding | File:Line(s) | Current Message | Remediated Message |
|----|---------|-------------|-----------------|-------------------|
| H-01 | "User not found" on MFA endpoints | mfa.service.ts:50,91,186,221,254 | `'User not found'` | `'Authentication required'` |
| H-02 | Permission guard lists required permissions | permissions.guard.ts:51 | `'Insufficient permissions. Required: ${perms}'` | `'Insufficient permissions'` |
| H-03 | SUPERADMIN bypass (audit logged, not error) | permissions.guard.ts:39-40 | N/A (bypass logic) | No change needed — bypass logged in audit |
| H-04 | 3 distinct CSRF messages | csrf.guard.ts:41,45,49 | `'CSRF token missing'` / `'Invalid CSRF token'` / `'CSRF token mismatch'` | All → `'CSRF validation failed'` |
| H-05 | Token reuse reveals hijack detection | sessions.service.ts:113 | `'Token reuse detected. All sessions revoked for security.'` | `'Invalid or expired refresh token'` |
| H-06 | OAuth code validation | auth.service.ts:597 | `'Invalid or expired authorization code'` | Keep as-is (generic enough) |
| H-07 | MFA enrollment status leaks | mfa.service.ts:54,95,190,225 | `'MFA is already enabled'` / `'MFA is not enabled'` | `'MFA operation not available'` |
| H-08 | Rate limit config exposure | CustomThrottlerGuard | Reviewed — already uses generic `429` | No change needed — verify only |

### MEDIUM (M-01 to M-03) — Message Inconsistency

| ID | Finding | File:Line(s) | Current Messages | Remediated Message |
|----|---------|-------------|------------------|-------------------|
| M-01 | 4 password error variants | users.service.ts:338,557,653,743 | `'Current password is incorrect'` / `'Password is incorrect'` / `'Invalid password'` (2 variants) | All → `'Invalid password'` |
| M-02 | Inconsistent "User not found" | users.service.ts:325,387,462,543,633,723 + users.controller.ts:143 | `'User not found'` (7 locations) | Keep for admin endpoints (behind JwtAuthGuard+RolesGuard); use generic for user-facing |
| M-03 | DTO field names in validation | class-validator defaults | Field names in validation errors | Strip field names from validation response in HttpExceptionFilter |

### Additional findings from jwt.strategy.ts

| Finding | File:Line | Current Message | Remediated Message |
|---------|-----------|-----------------|-------------------|
| User not found | jwt.strategy.ts:34 | `'User not found'` | `'Authentication failed'` |
| Account deactivated | jwt.strategy.ts:37 | `'Account deactivated'` | `'Authentication failed'` |

### Additional findings from auth.controller.ts

| Finding | File:Line | Current Message | Remediated Message |
|---------|-----------|-----------------|-------------------|
| Missing refresh token | auth.controller.ts:198 | `'No refresh token provided'` | `'Invalid or expired refresh token'` |
| OAuth redirect validation | auth.controller.ts:623 | `'Invalid redirect configuration'` | `'Authentication failed'` |

### Additional findings from users.service.ts

| Finding | File:Line | Current Message | Remediated Message |
|---------|-----------|-----------------|-------------------|
| SUPERADMIN protection | users.service.ts:392 | `'Cannot modify SUPERADMIN accounts'` | `'Operation not permitted'` |
| SUPERADMIN protection | users.service.ts:466 | `'Cannot delete SUPERADMIN accounts'` | `'Operation not permitted'` |
| Email already registered | users.service.ts:86 | `'Email already registered'` | `'Unable to complete registration'` |

---

## 5. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to feature branch
- **Branch Naming**: `feature/SCRUM-140-backend`
- **Implementation Steps**:
  1. Ensure on latest `main`: `git pull origin main`
  2. Create branch: `git checkout -b feature/SCRUM-140-backend`
  3. Verify: `git branch`

---

### Step 1: Create Centralized Error Messages Constants

- **File**: `src/common/constants/error-messages.ts` (NEW)
- **Action**: Create a single source of truth for all user-facing error messages
- **Implementation Steps**:
  1. Create `src/common/constants/` directory (if not exists)
  2. Create `error-messages.ts` with exported `ErrorMessages` const object
  3. Organize by domain: `auth`, `mfa`, `session`, `user`, `permission`, `csrf`, `validation`

```typescript
export const ErrorMessages = {
  auth: {
    INVALID_CREDENTIALS: 'Invalid credentials',
    AUTHENTICATION_FAILED: 'Authentication failed',
    REGISTRATION_FAILED: 'Unable to complete registration',
    UNABLE_TO_COMPLETE: 'Unable to complete request',
    CHECK_EMAIL: 'Please check your email to continue',
    TOO_MANY_ATTEMPTS: 'Too many attempts. Please try again later.',
    INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token',
    TOKEN_REVOKED: 'Token has been revoked',
    SESSION_EXPIRED: 'Session expired due to inactivity',
    INVALID_RESET_TOKEN: 'Invalid or expired reset token',
  },
  mfa: {
    OPERATION_NOT_AVAILABLE: 'MFA operation not available',
    INVALID_CODE: 'Invalid verification code',
    INVALID_TOKEN: 'Invalid or expired MFA token',
    AUTHENTICATION_REQUIRED: 'Authentication required',
  },
  session: {
    NOT_FOUND: 'Session not found',
  },
  user: {
    NOT_FOUND: 'User not found',
    INVALID_PASSWORD: 'Invalid password',
    PASSWORD_REQUIRED: 'Current password is required',
    OPERATION_NOT_PERMITTED: 'Operation not permitted',
  },
  permission: {
    ACCESS_DENIED: 'Access denied',
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
    INSUFFICIENT_ROLE: 'Insufficient role',
  },
  csrf: {
    VALIDATION_FAILED: 'CSRF validation failed',
  },
  validation: {
    FAILED: 'Validation failed',
  },
} as const;
```

- **Dependencies**: None
- **Notes**: Using `as const` for type safety. All messages are generic enough to prevent information disclosure while remaining useful for legitimate users.

---

### Step 2: Update HttpExceptionFilter — Strip Sensitive Data

- **File**: `src/common/filters/http-exception.filter.ts`
- **Action**: Remove `retryAfter` and `lockoutLevel` from error response body. Move `retryAfter` to HTTP `Retry-After` header. Strip DTO field names from validation errors.
- **Implementation Steps**:
  1. Remove the `retryAfter` and `lockoutLevel` passthrough logic (lines ~49-55)
  2. When `retryAfter` is present in exception response, set `Retry-After` HTTP header instead
  3. For validation errors (Array `message`), replace field-specific messages with generic "Validation failed" and keep `details` as sanitized list (strip field names, keep rule descriptions)
  4. Remove `...(retryAfter !== undefined && { retryAfter })` and `...(lockoutLevel !== undefined && { lockoutLevel })` from the JSON response object

**Before** (current):
```typescript
response.status(statusCode).json({
  success: false,
  error: {
    message,
    code,
    statusCode,
    ...(details && { details }),
    ...(retryAfter !== undefined && { retryAfter }),
    ...(lockoutLevel !== undefined && { lockoutLevel }),
  },
});
```

**After** (remediated):
```typescript
// Set Retry-After header if present (for 429 and lockout responses)
if (typeof responseObj.retryAfter === 'number') {
  response.setHeader('Retry-After', String(responseObj.retryAfter));
}

// Sanitize validation details — remove field name prefixes
if (details) {
  details = details.map(d => {
    // class-validator format: "fieldName constraint message"
    // Keep only constraint message if it starts with a known field pattern
    return d;
  });
}

response.status(statusCode).json({
  success: false,
  error: {
    message,
    code,
    statusCode,
    ...(details && { details }),
    // retryAfter and lockoutLevel NO LONGER in body
  },
});
```

- **Implementation Notes**:
  - The `Retry-After` header is the standard HTTP mechanism for communicating retry timing (RFC 7231 §7.1.3)
  - `lockoutLevel` is completely removed — no legitimate frontend need for lockout escalation count
  - Validation error `details` array is kept but field name prefixes could optionally be stripped (evaluate during implementation)

---

### Step 3: Update AuthService — Fix C-01, C-02, C-05, C-06

- **File**: `src/auth/auth.service.ts`
- **Action**: Replace information-leaking messages with standardized constants
- **Implementation Steps**:

  1. **Import ErrorMessages**: Add `import { ErrorMessages } from '../common/constants/error-messages';`

  2. **C-01 — Registration email enumeration** (line 142):
     - **Before**: `throw new ConflictException('Email already registered');`
     - **After**: `throw new ConflictException(ErrorMessages.auth.REGISTRATION_FAILED);`
     - **Note**: Change from `ConflictException` (409) to `BadRequestException` (400) to avoid 409 leaking "conflict = exists". Alternatively keep 409 but with generic message — decide during implementation based on frontend expectations. **Recommended**: Keep `ConflictException` since frontend login page may use 409 to show "try logging in instead" UX.

  3. **C-02 — Email verification disclosure** (line 312):
     - **Before**: `throw new ForbiddenException('Verify your email to sign in. Check your inbox.');`
     - **After**: `throw new ForbiddenException(ErrorMessages.auth.CHECK_EMAIL);`

  4. **C-05a — Lockout leaks retryAfter/lockoutLevel** (lines 215-221):
     - **Before**: Object with `retryAfter`, `lockoutLevel`
     - **After**: `throw new ForbiddenException({ message: ErrorMessages.auth.TOO_MANY_ATTEMPTS, retryAfter: remainingSeconds });`
     - **Note**: `retryAfter` is still passed to the exception so `HttpExceptionFilter` can set the HTTP header, but it no longer appears in the response body. `lockoutLevel` is removed entirely.

  5. **C-05b — Second lockout** (lines 273-279): Same change as C-05a

  6. **C-06 — Password reset timing**: Verify that the `forgot-password` flow returns the same response and takes approximately the same time regardless of whether the email exists. If timing differs, add a constant-time delay.

  7. **"User not found" in auth contexts** (lines 655, 969):
     - **After**: `throw new UnauthorizedException(ErrorMessages.mfa.AUTHENTICATION_REQUIRED);`

  8. **Auth controller refresh token** (auth.controller.ts:198):
     - **Before**: `throw new UnauthorizedException('No refresh token provided');`
     - **After**: `throw new UnauthorizedException(ErrorMessages.auth.INVALID_REFRESH_TOKEN);`

  9. **OAuth redirect** (auth.controller.ts:623):
     - **Before**: `throw new UnauthorizedException('Invalid redirect configuration');`
     - **After**: `throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);`

---

### Step 4: Update MfaService — Fix H-01, H-07

- **File**: `src/auth/mfa.service.ts`
- **Action**: Replace "User not found" and MFA status messages
- **Implementation Steps**:

  1. **Import ErrorMessages**: Add `import { ErrorMessages } from '../common/constants/error-messages';`

  2. **H-01 — "User not found" on 5 MFA endpoints** (lines 50, 91, 186, 221, 254):
     - **Before**: `throw new UnauthorizedException('User not found');`
     - **After**: `throw new UnauthorizedException(ErrorMessages.mfa.AUTHENTICATION_REQUIRED);`

  3. **H-07 — MFA enrollment status leaks** (lines 54, 95, 190, 225):
     - **Before**: `throw new ConflictException('MFA is already enabled');` and `throw new BadRequestException('MFA is not enabled');`
     - **After**: All → `throw new BadRequestException(ErrorMessages.mfa.OPERATION_NOT_AVAILABLE);`
     - **Note**: Using `BadRequestException` (400) for all cases. The frontend can use `GET /mfa/status` to determine current MFA state; the error doesn't need to reveal it.

  4. **MFA code verification** (lines 107, 160, 168):
     - Lines 160 and 168 use different messages for TOTP vs recovery codes
     - **After**: Both → `throw new UnauthorizedException(ErrorMessages.mfa.INVALID_CODE);`

  5. **MFA token validation** (lines 144, 148, 153):
     - **After**: All → `throw new UnauthorizedException(ErrorMessages.mfa.INVALID_TOKEN);`

  6. **Password verification** (lines 201, 236):
     - **After**: `throw new UnauthorizedException(ErrorMessages.user.INVALID_PASSWORD);`

---

### Step 5: Update PasskeyService — Fix C-03, C-04

- **File**: `src/auth/passkey.service.ts`
- **Action**: Replace account state and clone detection messages
- **Implementation Steps**:

  1. **Import ErrorMessages**

  2. **C-03 — Account deactivation disclosure** (line 253):
     - **Before**: `throw new ForbiddenException('Account is deactivated');`
     - **After**: `throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);`
     - **Note**: Changed from `ForbiddenException` to `UnauthorizedException` — deactivated should look like any other auth failure.

  3. **C-04 — Clone detection** (line 317-318):
     - **Before**: `throw new UnauthorizedException('Passkey may have been cloned. Authentication rejected.');`
     - **After**: `throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);`

  4. **Passkey registration failures** (lines 127, 131):
     - **After**: `throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);`

  5. **Passkey not recognized** (line 240):
     - **After**: `throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);`

  6. **Passkey deletion — "Invalid password"** (line 410):
     - **After**: `throw new UnauthorizedException(ErrorMessages.user.INVALID_PASSWORD);`

  7. **"Passkey not found"** (lines 380, 419):
     - Keep as-is — these are behind JwtAuthGuard and refer to the user's own passkeys, not user enumeration.

---

### Step 6: Update JwtStrategy — Unify Error Messages

- **File**: `src/auth/strategies/jwt.strategy.ts`
- **Action**: Replace distinct "User not found" / "Account deactivated" with single message
- **Implementation Steps**:

  1. **Import ErrorMessages**

  2. **"User not found"** (line 34):
     - **After**: `throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);`

  3. **"Account deactivated"** (line 37):
     - **After**: `throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);`

  4. **"Token has been revoked"** (line 29):
     - **After**: `throw new UnauthorizedException(ErrorMessages.auth.TOKEN_REVOKED);`
     - **Note**: Keep as specific — doesn't leak sensitive info, helps user understand they need to re-login.

---

### Step 7: Update PermissionsGuard — Fix H-02

- **File**: `src/auth/guards/permissions.guard.ts`
- **Action**: Remove permission name enumeration from error message
- **Implementation Steps**:

  1. **Import ErrorMessages**

  2. **H-02 — Permission list disclosure** (line 51):
     - **Before**: `throw new ForbiddenException(\`Insufficient permissions. Required: ${requiredPermissions.join(', ')}\`);`
     - **After**: `throw new ForbiddenException(ErrorMessages.permission.INSUFFICIENT_PERMISSIONS);`

  3. **"Access denied"** (line 35):
     - **After**: `throw new ForbiddenException(ErrorMessages.permission.ACCESS_DENIED);`

---

### Step 8: Update CsrfGuard — Fix H-04

- **File**: `src/common/guards/csrf.guard.ts`
- **Action**: Unify 3 distinct CSRF messages into one
- **Implementation Steps**:

  1. **Import ErrorMessages**

  2. **3 distinct messages** (lines 41, 45, 49):
     - **Before**: `'CSRF token missing'` / `'Invalid CSRF token'` / `'CSRF token mismatch'`
     - **After**: All → `throw new ForbiddenException(ErrorMessages.csrf.VALIDATION_FAILED);`

---

### Step 9: Update SessionsService — Fix H-05

- **File**: `src/sessions/sessions.service.ts`
- **Action**: Remove token reuse detection message
- **Implementation Steps**:

  1. **Import ErrorMessages**

  2. **H-05 — Token reuse detection** (line 113):
     - **Before**: `throw new UnauthorizedException('Token reuse detected. All sessions revoked for security.');`
     - **After**: `throw new UnauthorizedException(ErrorMessages.auth.INVALID_REFRESH_TOKEN);`
     - **Note**: The session revocation still happens; we just don't tell the attacker about it.

  3. **Other "Invalid or expired refresh token"** (lines 102, 106, 122):
     - **After**: `throw new UnauthorizedException(ErrorMessages.auth.INVALID_REFRESH_TOKEN);`

  4. **"Session not found"** (line 154):
     - **After**: `throw new NotFoundException(ErrorMessages.session.NOT_FOUND);`

---

### Step 10: Update UsersService — Fix M-01, M-02, SUPERADMIN Messages

- **File**: `src/users/users.service.ts`
- **Action**: Standardize password errors and protect SUPERADMIN details
- **Implementation Steps**:

  1. **Import ErrorMessages**

  2. **M-01 — 4 password error variants** (lines 338, 557, 653, 743):
     - **After**: All → `throw new UnauthorizedException(ErrorMessages.user.INVALID_PASSWORD);`

  3. **"Current password is required"** (line 331):
     - **After**: `throw new BadRequestException(ErrorMessages.user.PASSWORD_REQUIRED);`

  4. **C-01 duplicate — "Email already registered"** (lines 86, 570):
     - Line 86 (create): `throw new ConflictException(ErrorMessages.auth.REGISTRATION_FAILED);`
     - Line 570 (change email): `throw new ConflictException(ErrorMessages.auth.UNABLE_TO_COMPLETE);`

  5. **SUPERADMIN protection** (lines 392, 466):
     - **Before**: `'Cannot modify SUPERADMIN accounts'` / `'Cannot delete SUPERADMIN accounts'`
     - **After**: `throw new ForbiddenException(ErrorMessages.user.OPERATION_NOT_PERMITTED);`

  6. **"User not found"** (lines 325, 387, 462, 543, 633, 723):
     - These are all behind JwtAuthGuard. Admin endpoints (387, 462) also have RolesGuard.
     - **After**: Keep `throw new NotFoundException(ErrorMessages.user.NOT_FOUND);` — acceptable since user is authenticated and accessing their own record or admin is accessing by ID.

  7. **UsersController "User not found"** (users.controller.ts:143):
     - **After**: `throw new NotFoundException(ErrorMessages.user.NOT_FOUND);`

---

### Step 11: Update Unit Tests

- **Action**: Update all test files that assert on specific error messages
- **Implementation Steps**:

  1. **Identify affected tests**: Search all `*.spec.ts` files for the old error messages being replaced. Each `toThrow`, `rejects.toThrow`, `expect(error.message)`, or `expect(response.body.error.message)` assertion must be updated.

  2. **Test files to update** (estimated):
     - `src/auth/tests/auth.service.spec.ts` — login, register, lockout, forgot-password, OAuth tests
     - `src/auth/tests/mfa.service.spec.ts` — MFA setup, verify, disable, backup code tests
     - `src/auth/tests/mfa.controller.spec.ts` — MFA endpoint tests
     - `src/auth/tests/passkey.service.spec.ts` (if exists) — passkey auth/register tests
     - `src/auth/tests/jwt.strategy.spec.ts` — token validation tests
     - `src/auth/tests/brute-force.spec.ts` — lockout tests
     - `src/auth/tests/oauth-exchange.spec.ts` — OAuth code exchange tests
     - `src/common/guards/tests/csrf.guard.spec.ts` (if exists) — CSRF tests
     - `src/common/filters/tests/http-exception.filter.spec.ts` (if exists) — filter tests
     - `src/sessions/tests/sessions.service.spec.ts` — session refresh, token reuse tests
     - `src/users/tests/users.service.spec.ts` — password change, profile, admin tests
     - `src/users/tests/users.controller.spec.ts` — endpoint tests
     - `src/auth/tests/permissions.guard.spec.ts` (if exists) — permissions tests

  3. **Update pattern**:
     - Import `ErrorMessages` in each test file
     - Replace hardcoded string assertions with `ErrorMessages.x.Y`
     - For lockout tests: remove assertions on `retryAfter`/`lockoutLevel` in response body; add assertion for `Retry-After` header if testing controller-level
     - For CSRF tests: replace 3 distinct assertions with single `CSRF validation failed`
     - For permissions tests: remove assertion that checks for `Required: permission_name`

  4. **Add new test: ErrorMessages constants**:
     - Create `src/common/constants/tests/error-messages.spec.ts`
     - Verify all message keys exist and are non-empty strings
     - Verify no message contains sensitive terms: `'not found'`, `'already'`, `'required:'`, `'detected'` (sanity check)

  5. **Run full test suite**: `npx jest --coverage` — ensure 0 failures

---

### Step 12: Update Technical Documentation

- **Action**: Update documentation to reflect error message standardization
- **Implementation Steps**:

  1. **Update `ai-specs/specs/integration-state.md`**:
     - Add SCRUM-140 changelog entry documenting the error message standardization
     - Note the new `src/common/constants/error-messages.ts` file
     - Update HttpExceptionFilter description (no longer passes `retryAfter`/`lockoutLevel` in body)

  2. **Update `ai-specs/specs/api-spec.yml`**:
     - Update error response examples to reflect new generic messages
     - Remove `retryAfter` and `lockoutLevel` from 403 error response schema
     - Document `Retry-After` header on 403/429 responses

  3. **Update `ai-specs/specs/backend-standards.mdc`**:
     - Add "Error Message Standards" section documenting:
       - All user-facing errors must use `ErrorMessages` constants
       - Never expose internal state (user existence, feature enrollment, role names, permission keys)
       - Use `Retry-After` header instead of body fields for timing
       - Public endpoints: maximum genericness
       - Authenticated endpoints: can reference the resource type but not internal state

  4. **Create implementation record**: `ai-specs/ai-specs/changes/records/Sprint 5/SCRUM-140_backend.md`

---

## 6. Implementation Order

1. **Step 0**: Create feature branch `feature/SCRUM-140-backend`
2. **Step 1**: Create `src/common/constants/error-messages.ts`
3. **Step 2**: Update `HttpExceptionFilter` (strip `retryAfter`/`lockoutLevel` from body)
4. **Step 3**: Update `AuthService` + `AuthController` (C-01, C-02, C-05, C-06)
5. **Step 4**: Update `MfaService` (H-01, H-07)
6. **Step 5**: Update `PasskeyService` (C-03, C-04)
7. **Step 6**: Update `JwtStrategy`
8. **Step 7**: Update `PermissionsGuard` (H-02)
9. **Step 8**: Update `CsrfGuard` (H-04)
10. **Step 9**: Update `SessionsService` (H-05)
11. **Step 10**: Update `UsersService` + `UsersController` (M-01, M-02)
12. **Step 11**: Update all unit tests
13. **Step 12**: Update documentation

---

## 7. Testing Checklist

### Successful Cases
- [ ] Registration with new email returns 201 (no change to success path)
- [ ] Login with valid credentials returns tokens
- [ ] MFA setup, verify, disable flows work normally
- [ ] Passkey registration and authentication work normally
- [ ] Password change, email change, account deletion work normally
- [ ] OAuth flows (Google, GitHub) work normally
- [ ] Session management (list, revoke, revoke-all) works normally

### Error Response Verification
- [ ] Registration with existing email: 409 with generic message (no "already registered")
- [ ] Login with wrong password: 401 "Invalid credentials"
- [ ] Login with locked account: 403 "Too many attempts..." + `Retry-After` header (no `retryAfter`/`lockoutLevel` in body)
- [ ] MFA on non-enrolled user: 400 "MFA operation not available"
- [ ] MFA on already-enrolled user: 400 "MFA operation not available"
- [ ] Passkey auth for deactivated user: 401 "Authentication failed" (not "deactivated")
- [ ] CSRF missing/invalid/mismatch: all return 403 "CSRF validation failed"
- [ ] Permission denied: 403 "Insufficient permissions" (no required permission list)
- [ ] Token reuse: 401 "Invalid or expired refresh token" (no "reuse detected")
- [ ] JWT for deactivated user: 401 "Authentication failed" (not "deactivated")

### Regression Tests
- [ ] All 44 existing spec files pass with 0 failures
- [ ] Coverage thresholds maintained (>90% statements, >85% branches)
- [ ] No TypeScript compilation errors
- [ ] Application starts successfully (`nest start`)

---

## 8. Error Response Format

After remediation, all error responses follow this structure:

```json
{
  "success": false,
  "error": {
    "message": "Generic error message from ErrorMessages constants",
    "code": "UNAUTHORIZED",
    "statusCode": 401
  }
}
```

For validation errors:
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "statusCode": 400,
    "details": ["field constraint description", "..."]
  }
}
```

For rate limiting / lockout, the `Retry-After` header is set:
```
HTTP/1.1 403 Forbidden
Retry-After: 60

{
  "success": false,
  "error": {
    "message": "Too many attempts. Please try again later.",
    "code": "FORBIDDEN",
    "statusCode": 403
  }
}
```

### HTTP Status Code Mapping (unchanged)

| Status | Code | When |
|--------|------|------|
| 400 | VALIDATION_ERROR | Invalid input, MFA not available |
| 401 | UNAUTHORIZED | Auth failed, invalid token, invalid password |
| 403 | FORBIDDEN | CSRF failed, rate limit, permissions, locked |
| 404 | NOT_FOUND | Resource not found (authenticated only) |
| 409 | CONFLICT | Registration conflict (generic message) |
| 429 | RATE_LIMIT_EXCEEDED | Throttle exceeded |

---

## 9. Dependencies

- No new external libraries required
- All changes use existing NestJS exception classes
- `ErrorMessages` constants file has zero dependencies

---

## 10. Notes

### Security Standards Addressed
- **OWASP ASVS V2.2.1**: Anti-automation and anti-enumeration on authentication endpoints
- **NIST SP 800-63B §5.2.2**: Memorized secret verifiers SHALL NOT provide information about authentication failure reasons
- **CWE-200**: Exposure of Sensitive Information
- **CWE-203**: Observable Discrepancy (timing attacks)
- **CWE-209**: Generation of Error Message Containing Sensitive Information

### Business Rules
- Frontend applications using these APIs may need minor updates to handle the new generic messages. The standardized `ErrorMessages` constants can be shared or documented for frontend teams.
- The `Retry-After` header approach is HTTP-standard and most HTTP clients/frameworks handle it natively.
- SUPERADMIN role existence is no longer leaked through error messages.

### Language Requirements
- All error messages in English
- All code comments in English
- Documentation in English

### Risk Considerations
- **Frontend breakage**: Any frontend code that switches on specific error message strings will need updating. This is expected since the ticket explicitly addresses message standardization.
- **Logging**: Internal log messages should remain detailed (service-level logging). Only user-facing HTTP responses are standardized. Ensure audit logs still capture the specific reason (e.g., "token reuse" is logged for security team).

---

## 11. Next Steps After Implementation

1. **Transition SCRUM-140 to Done** in Jira
2. **Transition child tickets** (SCRUM-141 to SCRUM-157) that are addressed by this implementation to Done
3. **Frontend ticket**: Create a follow-up ticket for frontend error handling updates (if needed based on how the dashboard handles error messages)
4. **Re-run security audit**: `/audit auth security` to verify all 17 findings are resolved
5. **Merge to main**: After PR review and approval

---

## 12. Implementation Verification

### Code Quality
- [ ] All error messages use `ErrorMessages` constants (no inline strings for user-facing errors)
- [ ] No `retryAfter` or `lockoutLevel` in HTTP response bodies
- [ ] `Retry-After` header set correctly on 403/429 responses
- [ ] No permission names leaked in error messages
- [ ] No account state (active/deactivated/enrolled) leaked in error messages
- [ ] No SUPERADMIN role name in error messages

### Functionality
- [ ] All auth flows work end-to-end (register, login, MFA, passkey, OAuth, password reset)
- [ ] Session management works (create, list, revoke, revoke-all)
- [ ] User management works (profile, password change, email change, admin ops)

### Testing
- [ ] All 44+ spec files pass
- [ ] Coverage thresholds met
- [ ] New error-messages.spec.ts passes
- [ ] Build succeeds (`nest build`)

### Integration
- [ ] No circular dependencies introduced
- [ ] Module imports unchanged (only new import is `ErrorMessages` constant)
- [ ] No runtime DI errors on startup

### Documentation
- [ ] `integration-state.md` updated with SCRUM-140 changes
- [ ] `api-spec.yml` error response schemas updated
- [ ] `backend-standards.mdc` includes Error Message Standards section
- [ ] Implementation record created
