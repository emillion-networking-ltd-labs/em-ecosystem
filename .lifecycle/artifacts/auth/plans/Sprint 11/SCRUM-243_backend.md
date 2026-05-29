# Backend Implementation Plan: SCRUM-243 Audit Fix Batch 1 — Code Fixes

## 1. Header

**Ticket**: SCRUM-243
**Sprint**: Sprint 11 — Security II
**Scope**: Backend
**Audit**: audit-2026-03-15T19-49
**Findings covered**: A-07 (FAIL), B-08, CH-01, CH-02, CH-03, EM-03, EM-08, EM-10, V7.1.2, TS-05, DEP-06, A-03, A-04, A-05 (13 WARN + 1 FAIL)

---

## 2. Codebase State Snapshot

- **Date**: 2026-03-15
- **Last completed ticket**: SCRUM-241 (Test suite decomposition)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/auth/mfa.controller.ts` — POST setup at line 49, no @HttpCode. Other POSTs (verify-setup:66, verify-login:88, recovery-codes:152) all have @HttpCode(HttpStatus.OK)
  - `tsconfig.build.json` — extends tsconfig.json, no sourceMap override
  - `tsconfig.json:15` — sourceMap: true
  - `src/auth/account.controller.ts` — inline @Throttle at lines 43, 54, 124
  - `src/auth/session.controller.ts:90` — inline @Throttle
  - `src/auth/constants/auth.constants.ts` — AUTH_RATE_LIMITS has: login, register, refresh, oauth, mfa. Missing: verify_email, reset_password, trust_device
  - `src/common/constants/error-messages.ts` — 66 lines, no entries for email_already_verified, resend_cooldown, mfa_setup_required, passkey_limit
  - `src/auth/email-verification.service.ts:180` — `'Email already verified'` inline
  - `src/auth/email-verification.service.ts:194` — `'Please wait before requesting another email'` inline
  - `src/auth/login.service.ts:299` — `'MFA setup is required for administrator accounts...'` inline, reveals admin role
  - `src/auth/passkey.service.ts:69` — `Maximum of ${MAX_PASSKEYS_PER_USER} passkeys reached` reveals system capacity
  - `src/auth/passkey.service.ts:113` — `'Registration challenge not found or expired'` inline
  - `src/auth/passkey.service.ts:224` — `'Authentication challenge not found or expired'` (assumed similar)
  - `src/auth/constants/passkey.constants.ts:14` — PASSKEY_NAME_MAX_LENGTH exported, unreferenced
  - `src/auth/strategies/oauth-validate.helper.ts:7-14` — duplicate OAuthProfile interface
  - `src/common/interfaces/oauth-profile.interface.ts:3` — canonical OAuthProfile interface
  - `src/auth/dto/passkey-login-verify.dto.ts` — no @ApiProperty decorators
  - `src/auth/dto/passkey-register-verify.dto.ts` — no @ApiProperty decorators
  - `src/auth/dto/trust-device.dto.ts` — no @ApiProperty decorators
  - `src/mail/mail.service.ts` — 14 log calls with full email addresses (lines 31,33,56,59,86,89,114,117,157,160,190,193,220,223)
  - `src/auth/passkey.service.ts:100,123,210,230` — 4x `as unknown as` assertions
  - `src/auth/strategies/google.strategy.ts:39` — `this as unknown as { _oauth2: ... }`
  - `src/auth/strategies/github.strategy.ts:39` — `this as unknown as { _oauth2: ... }`
- **Constructor signatures verified**: No constructor changes needed in this batch
- **Methods verified to exist**: All referenced methods verified in live code
- **Guard dependency chain verified**: N/A — no guard changes
- **Discrepancies with integration-state.md**: None for this batch

---

## 3. Overview

Batch of 14 audit findings (1 FAIL + 13 WARN) that are all isolated, non-structural code fixes. No architectural changes, no new services, no module modifications. Each fix is independent and can be applied without affecting other fixes.

---

## 4. Architecture Context

- **Modules affected**: auth (controllers, services, DTOs, constants, strategies), mail (service), common (constants, utils)
- **No module registration changes**
- **No new dependencies**
- **Files to modify**: ~20 files
- **New files**: 2 (`src/common/utils/pseudonymize-email.ts`, `.scarf-disable`)

---

## 5. Implementation Steps

### Step 0: Create Feature Branch
- **Branch**: `feature/SCRUM-243-backend`
- **Base**: `main`

### Step 1: A-07 — Add @HttpCode to mfa.controller.ts
- **File**: `src/auth/mfa.controller.ts`
- **Action**: Add `@HttpCode(HttpStatus.OK)` decorator to `setup()` method at line 49
- **Implementation**:
  1. Add `@HttpCode(HttpStatus.OK)` between `@Post('setup')` and `@UseGuards(JwtAuthGuard)` (line 50)
  2. Verify `HttpCode` and `HttpStatus` are already imported (they are, used by other methods)

### Step 2: B-08 — Disable sourceMap in production build
- **File**: `tsconfig.build.json`
- **Action**: Add `compilerOptions.sourceMap: false` override
- **Implementation**:
  1. Add `"compilerOptions": { "sourceMap": false }` to tsconfig.build.json
  2. This overrides the `true` inherited from tsconfig.json for production builds only

### Step 3: CH-01 — Extract inline rate limits to constants
- **File**: `src/auth/constants/auth.constants.ts`
- **Action**: Add 3 new rate limit entries
- **Implementation**:
  1. Add to `AUTH_RATE_LIMITS`:
     ```
     verify_email: { ttl: 60_000, limit: 10 },
     reset_password: { ttl: 60_000, limit: 5 },
     trust_device: { ttl: 60_000, limit: 5 },
     ```
- **File**: `src/auth/account.controller.ts`
- **Action**: Replace 3 inline @Throttle with AUTH_RATE_LIMITS references
  1. Line 43: `@Throttle({ global: { ttl: 60_000, limit: 10 } })` → `@Throttle({ global: { ttl: AUTH_RATE_LIMITS.verify_email.ttl, limit: AUTH_RATE_LIMITS.verify_email.limit } })`
  2. Line 54: Same → `AUTH_RATE_LIMITS.verify_email`
  3. Line 124: `{ ttl: 60_000, limit: 5 }` → `AUTH_RATE_LIMITS.reset_password`
  4. Add import for `AUTH_RATE_LIMITS` from constants
- **File**: `src/auth/session.controller.ts`
- **Action**: Replace inline @Throttle at line 90
  1. `{ ttl: 60_000, limit: 5 }` → `AUTH_RATE_LIMITS.trust_device`
  2. Add import for `AUTH_RATE_LIMITS`

### Step 4: CH-02 + EM-03 + EM-08 + EM-10 — Centralize error messages
- **File**: `src/common/constants/error-messages.ts`
- **Action**: Add new error message entries
- **Implementation**:
  1. Add to `ErrorMessages.auth`:
     ```
     EMAIL_ALREADY_VERIFIED: 'Email already verified',
     RESEND_COOLDOWN: 'Please wait before requesting another email',
     ```
  2. Add to `ErrorMessages.mfa`:
     ```
     SETUP_REQUIRED: 'MFA setup is required. Please enable MFA to continue.',
     ```
     Note: Removes "administrator accounts" text (EM-03 fix)
  3. Add to `ErrorMessages.passkey`:
     ```
     LIMIT_REACHED: 'Maximum number of passkeys reached',
     CHALLENGE_EXPIRED: 'Challenge not found or expired',
     ```
     Note: Hides MAX_PASSKEYS_PER_USER value (EM-08 fix)
- **File**: `src/auth/email-verification.service.ts`
  1. Line 180: Replace `'Email already verified'` → `ErrorMessages.auth.EMAIL_ALREADY_VERIFIED`
  2. Line 194: Replace `'Please wait before requesting another email'` → `ErrorMessages.auth.RESEND_COOLDOWN`
  3. Add import for `ErrorMessages`
- **File**: `src/auth/login.service.ts`
  1. Line 299: Replace `'MFA setup is required for administrator accounts. Please enable MFA to continue.'` → `ErrorMessages.mfa.SETUP_REQUIRED`
  2. Verify ErrorMessages import exists (it should)
- **File**: `src/auth/passkey.service.ts`
  1. Line 69: Replace `` `Maximum of ${MAX_PASSKEYS_PER_USER} passkeys reached` `` → `ErrorMessages.passkey.LIMIT_REACHED`
  2. Line 113: Replace `'Registration challenge not found or expired'` → `ErrorMessages.passkey.CHALLENGE_EXPIRED`
  3. Line ~224: Replace `'Authentication challenge not found or expired'` → `ErrorMessages.passkey.CHALLENGE_EXPIRED`
  4. Add import for `ErrorMessages`

### Step 5: CH-03 — Remove dead code and duplicates
- **File**: `src/auth/constants/passkey.constants.ts`
  1. Remove `PASSKEY_NAME_MAX_LENGTH` export (line 14) — unreferenced. The `@MaxLength(64)` in DTO uses literal (which is fine for decorator parameter).
- **File**: `src/auth/strategies/oauth-validate.helper.ts`
  1. Remove lines 7-14 (local `OAuthProfile` interface definition)
  2. Add import: `import { OAuthProfile } from '../../common/interfaces/oauth-profile.interface';`
  3. Verify `validateOAuthCallback` function signature still references `OAuthProfile` correctly
- **File**: `src/auth/stores/oauth-code.store.ts`
  1. Remove no-op `cleanup()` method (Redis handles TTL-based cleanup)
- **File**: `src/auth/stores/oauth-state.store.ts`
  1. Remove no-op `cleanup()` method

### Step 6: V7.1.2 — Pseudonymize email in logs
- **File (NEW)**: `src/common/utils/pseudonymize-email.ts`
  1. Create utility function:
     ```typescript
     export function pseudonymizeEmail(email: string): string {
       const [local, domain] = email.split('@');
       if (!local || !domain) return '***@***';
       const visible = local.charAt(0);
       return `${visible}***@${domain}`;
     }
     ```
- **File**: `src/mail/mail.service.ts`
  1. Import `pseudonymizeEmail` from `../../common/utils/pseudonymize-email`
  2. Replace all 14 log calls using `${email}` and `${newEmail}` with `${pseudonymizeEmail(email)}` and `${pseudonymizeEmail(newEmail)}`
  3. Lines affected: 31, 33, 56, 59, 86, 89, 114, 117, 157, 160, 190, 193, 220, 223

### Step 7: TS-05 — Wrap type assertions in helper functions
- **File**: `src/auth/passkey.service.ts`
  1. Add private helper at bottom of class (or as standalone util):
     ```typescript
     // At top of file or as module-level function
     function toWebAuthnRecord(options: PublicKeyCredentialCreationOptionsJSON | PublicKeyCredentialRequestOptionsJSON): Record<string, unknown> {
       return options as unknown as Record<string, unknown>;
     }
     ```
  2. Line 100: Replace `options as unknown as Record<string, unknown>` → `toWebAuthnRecord(options)`
  3. Line 210: Same replacement
  4. Lines 123, 230: Keep `as unknown as RegistrationResponseJSON/AuthenticationResponseJSON` — these are input boundary casts where a typed wrapper adds no value (the `credential` param IS typed as `Record<string, unknown>` by design in the DTO)
- **File**: `src/auth/strategies/google.strategy.ts` + `github.strategy.ts`
  1. Add typed interface at module level in each:
     ```typescript
     interface PassportOAuth2Internals {
       _oauth2: { setAuthMethod(method: string): void };
     }
     ```
  2. Line 39: Replace `(this as unknown as { _oauth2: ... })` → `(this as unknown as PassportOAuth2Internals)`

### Step 8: DEP-06 — Create .scarf-disable
- **File (NEW)**: `.scarf-disable` at `em-ecosystem-code/` root
  1. Create empty file (presence disables @scarf/scarf telemetry)

### Step 9: A-03 — Align @ApiTags per controller
- **Files**: 6 controllers
  1. `auth.controller.ts`: `@ApiTags('auth')` → `@ApiTags('Authentication')`
  2. `account.controller.ts`: `@ApiTags('auth')` → `@ApiTags('Email Verification')`
  3. `mfa.controller.ts`: `@ApiTags('auth')` → `@ApiTags('MFA')`
  4. `oauth.controller.ts`: `@ApiTags('auth')` → `@ApiTags('OAuth')`
  5. `passkey.controller.ts`: `@ApiTags('auth')` → `@ApiTags('Passkeys')`
  6. `session.controller.ts`: `@ApiTags('auth')` → `@ApiTags('Sessions')`

### Step 10: A-04/A-05 — Add @ApiProperty decorators to DTOs
- **File**: `src/auth/dto/passkey-login-verify.dto.ts`
  1. Add `import { ApiProperty } from '@nestjs/swagger';`
  2. Add `@ApiProperty({ description: 'WebAuthn credential response object' })` to `credential`
  3. Add `@ApiProperty({ description: 'Challenge ID from login options' })` to `challengeId`
- **File**: `src/auth/dto/passkey-register-verify.dto.ts`
  1. Add `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';`
  2. Add `@ApiProperty({ description: 'WebAuthn credential response object' })` to `credential`
  3. Add `@ApiPropertyOptional({ description: 'Display name for the passkey', maxLength: 64 })` to `name`
- **File**: `src/auth/dto/trust-device.dto.ts`
  1. Add `import { ApiProperty } from '@nestjs/swagger';`
  2. Add `@ApiProperty({ description: 'Device fingerprint hash', minLength: 16, maxLength: 512 })` to `fingerprint`

### Step 11: Update tests
- **Action**: Update any test assertions that check for exact error message strings that were changed
- **Files to check**:
  1. Tests referencing `'Email already verified'` → update to `ErrorMessages.auth.EMAIL_ALREADY_VERIFIED`
  2. Tests referencing `'Please wait before requesting another email'` → update to `ErrorMessages.auth.RESEND_COOLDOWN`
  3. Tests referencing `'MFA setup is required for administrator accounts'` → update to `ErrorMessages.mfa.SETUP_REQUIRED`
  4. Tests referencing passkey limit message → update to `ErrorMessages.passkey.LIMIT_REACHED`
  5. Tests referencing challenge expired → update to `ErrorMessages.passkey.CHALLENGE_EXPIRED`
  6. Tests for `oauth-validate.helper.ts` → verify still pass after OAuthProfile import change
  7. Tests for `mail.service.ts` → verify log spy assertions still match pseudonymized format
- **Note**: Run `npm test` to catch all test failures and fix them

### Step 12: Build and full test verification
- **Action**: Run `npm run build && npm test` to verify all changes

### Step 13: Update Technical Documentation
- **Files to update**:
  1. `api-spec.yml`: Update tag definitions to match new @ApiTags values. Add POST /auth/mfa/setup response code 200 (was implicitly 201)
  2. No data-model changes. No integration-state changes for this batch.

---

## 6. Implementation Order

1. Step 0: Create feature branch
2. Step 1: A-07 — @HttpCode fix (1 line)
3. Step 2: B-08 — sourceMap fix (3 lines)
4. Step 3: CH-01 — Rate limit constants (4 files)
5. Step 4: CH-02/EM-03/EM-08/EM-10 — Error message centralization (4 files)
6. Step 5: CH-03 — Dead code removal (4 files)
7. Step 6: V7.1.2 — Email pseudonymization (2 files, 1 new)
8. Step 7: TS-05 — Type assertion wrappers (3 files)
9. Step 8: DEP-06 — .scarf-disable (1 new file)
10. Step 9: A-03 — @ApiTags alignment (6 files)
11. Step 10: A-04/A-05 — @ApiProperty decorators (3 files)
12. Step 11: Update tests
13. Step 12: Build + test verification
14. Step 13: Documentation updates

---

## 7. Testing Checklist

- [ ] All 490 existing tests pass
- [ ] `nest build` succeeds with exit code 0
- [ ] No inline error strings remain in modified services
- [ ] No full email addresses in mail.service.ts log calls
- [ ] All @Throttle decorators use AUTH_RATE_LIMITS constants
- [ ] Swagger UI shows semantic tag groups (not all 'auth')
- [ ] 3 DTOs show property schemas in Swagger
- [ ] .scarf-disable file exists at repo root

---

## 8. Error Response Format

No new error responses. Existing error messages are only being centralized/genericized. HTTP status codes unchanged except POST /auth/mfa/setup: 201 → 200.

---

## 9. Partial Update Support

N/A — all changes are atomic and independent.

---

## 10. Dependencies

No new external dependencies. Uses existing:
- `@nestjs/swagger` (ApiProperty, ApiPropertyOptional)
- `@nestjs/common` (HttpCode, HttpStatus)

---

## 11. Notes

- **Security**: EM-03 fix removes admin role disclosure (CWE-203). EM-08 fix hides system capacity. V7.1.2 fix pseudonymizes PII in logs (GDPR Art. 5).
- **No breaking changes**: All error messages use identical HTTP status codes. Only message text changes.
- **Test impact**: Tests checking exact error message strings will need updates. Use `ErrorMessages.*` references instead of literals.
- **Swagger UI**: Tag change from 'auth' to semantic groups will reorganize the Swagger UI but doesn't affect API behavior.

---

## 12. Next Steps After Implementation

- Run `/develop`, `/verify`, `/commit`, `/update-docs` lifecycle
- Proceed to SCRUM-244 (documentation batch)

---

## 13. Implementation Verification

- [ ] Code quality: No magic numbers, no inline strings, no dead code
- [ ] Functionality: POST /auth/mfa/setup returns 200, all existing behavior preserved
- [ ] Testing: 490+ tests pass, no regressions
- [ ] Integration: No module changes, no DI changes
- [ ] Documentation: api-spec.yml tags updated
