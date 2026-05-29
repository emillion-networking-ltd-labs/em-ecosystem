# Backend Implementation Plan: SCRUM-199 Extract Repeated Magic Strings to Named Constants

## Codebase State Snapshot

- **Date**: 2026-03-13
- **Last completed ticket**: SCRUM-198 (Extract shared OAuth guard/strategy base classes)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/auth/constants/auth.constants.ts` (96 lines — existing constants file)
  - `src/auth/token.service.ts:58-62` — `'mfa-challenge-token'` HMAC label, `process.env.JWT_SECRET` fallback
  - `src/auth/token.service.ts:251` — `'mfa-challenge'` JWT type
  - `src/auth/token.service.ts:252` — `'5m'` MFA token expiry literal
  - `src/auth/token.service.ts:258,272` — `'refresh_token'` cookie name
  - `src/auth/mfa.service.ts:42` — `'mfa-challenge-token'` HMAC label
  - `src/auth/mfa.service.ts:24` — `MFA_TOKEN_EXPIRY = '5m'` local constant
  - `src/auth/mfa.service.ts:129` — `'mfa-challenge'` JWT type
  - `src/auth/mfa.service.ts:160` — `'mfa-challenge'` JWT type check
  - `src/auth/trusted-device.service.ts:23` — `'device-fingerprint-key'` HMAC label
  - `src/auth/auth.controller.ts:123` — `'x-device-fingerprint'` header read
  - `src/auth/auth.controller.ts:167,189` — `'refresh_token'` cookie read
  - `src/auth/mfa.controller.ts:113` — `'x-device-fingerprint'` header read
  - `src/auth/session.controller.ts:43` — `'refresh_token'` cookie read
  - `src/auth/auth.module.ts:54-55,59-60` — `'nexacore-api'` issuer/audience
  - `src/auth/strategies/jwt.strategy.ts:22-23` — `'nexacore-api'` issuer/audience
  - `src/security/security.config.ts:20` — `'X-Device-Fingerprint'` CORS header
- **Constructor signatures verified**: Not applicable (no constructor changes)
- **Methods verified to exist**: Not applicable (no method changes)
- **Guard dependency chain verified**: Not applicable (no guard changes)
- **Discrepancies with integration-state.md**: None

## Overview

Audit finding CH-02: Multiple magic strings are repeated across auth module source files. This ticket extracts them to named constants in `auth.constants.ts` (or a new `auth.tokens.ts` for token-specific constants). Zero runtime behavior change — only string literals replaced with constant references.

## Architecture Context

- **Module**: AuthModule (constants only)
- **Files modified**: `auth.constants.ts` + 8 source files
- **No new modules, guards, services, or DI changes**

## Magic Strings Inventory

| Magic String | Occurrences (source) | Category |
|---|---|---|
| `'mfa-challenge-token'` | token.service.ts:61, mfa.service.ts:42 | HMAC derivation label |
| `'mfa-challenge'` | token.service.ts:251, mfa.service.ts:129, mfa.service.ts:160 | JWT token type |
| `'device-fingerprint-key'` | trusted-device.service.ts:23 | HMAC derivation label |
| `'x-device-fingerprint'` | auth.controller.ts:123, mfa.controller.ts:113 | HTTP header name |
| `'refresh_token'` | token.service.ts:258,272, auth.controller.ts:167,189, session.controller.ts:43 | Cookie name |
| `'nexacore-api'` | auth.module.ts:54,55,59,60, jwt.strategy.ts:22,23 | JWT issuer/audience |
| `'5m'` | token.service.ts:252 | MFA token expiry (mfa.service already has local `MFA_TOKEN_EXPIRY`) |

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-199-backend` from latest `main`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-199-backend`

### Step 1: Add Constants to auth.constants.ts

- **File**: `src/auth/constants/auth.constants.ts`
- **Action**: Add named constants for all magic strings identified above
- **Implementation Steps**:
  1. Add after the existing `MAX_TRUSTED_DEVICES_PER_USER` constant:
     ```typescript
     /** HMAC derivation label for MFA challenge token secret. */
     export const MFA_CHALLENGE_HMAC_LABEL = 'mfa-challenge-token';

     /** JWT payload type for MFA challenge tokens. */
     export const MFA_CHALLENGE_TOKEN_TYPE = 'mfa-challenge';

     /** MFA challenge token expiry duration. */
     export const MFA_CHALLENGE_EXPIRY = '5m';

     /** HMAC derivation label for device fingerprint secret. */
     export const DEVICE_FINGERPRINT_HMAC_LABEL = 'device-fingerprint-key';

     /** HTTP header name for device fingerprint (lowercase for req.headers lookup). */
     export const DEVICE_FINGERPRINT_HEADER = 'x-device-fingerprint';

     /** Cookie name for refresh tokens. */
     export const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';

     /** JWT issuer and audience identifier. */
     export const JWT_ISSUER = 'nexacore-api';
     export const JWT_AUDIENCE = 'nexacore-api';
     ```
- **Implementation Notes**:
  - Constants are grouped logically: MFA, device fingerprint, cookie, JWT
  - `MFA_CHALLENGE_EXPIRY` replaces both the local `MFA_TOKEN_EXPIRY` in mfa.service.ts and the literal `'5m'` in token.service.ts

### Step 2: Replace Magic Strings in token.service.ts

- **File**: `src/auth/token.service.ts`
- **Action**: Import and use constants
- **Implementation Steps**:
  1. Add import: `import { MFA_CHALLENGE_HMAC_LABEL, MFA_CHALLENGE_TOKEN_TYPE, MFA_CHALLENGE_EXPIRY, REFRESH_TOKEN_COOKIE_NAME } from './constants/auth.constants'`
  2. Line 61: `'mfa-challenge-token'` → `MFA_CHALLENGE_HMAC_LABEL`
  3. Line 251: `'mfa-challenge'` → `MFA_CHALLENGE_TOKEN_TYPE`
  4. Line 252: `'5m'` → `MFA_CHALLENGE_EXPIRY`
  5. Line 258: `'refresh_token'` → `REFRESH_TOKEN_COOKIE_NAME`
  6. Line 272: `'refresh_token'` → `REFRESH_TOKEN_COOKIE_NAME`

### Step 3: Replace Magic Strings in mfa.service.ts

- **File**: `src/auth/mfa.service.ts`
- **Action**: Import and use constants, remove local `MFA_TOKEN_EXPIRY`
- **Implementation Steps**:
  1. Add import: `import { MFA_CHALLENGE_HMAC_LABEL, MFA_CHALLENGE_TOKEN_TYPE, MFA_CHALLENGE_EXPIRY } from './constants/auth.constants'`
  2. Remove local `const MFA_TOKEN_EXPIRY = '5m';` (line 24)
  3. Line 42: `'mfa-challenge-token'` → `MFA_CHALLENGE_HMAC_LABEL`
  4. Line 129: `'mfa-challenge'` → `MFA_CHALLENGE_TOKEN_TYPE`
  5. Line 131: `MFA_TOKEN_EXPIRY` → `MFA_CHALLENGE_EXPIRY`
  6. Line 160: `'mfa-challenge'` → `MFA_CHALLENGE_TOKEN_TYPE`

### Step 4: Replace Magic Strings in trusted-device.service.ts

- **File**: `src/auth/trusted-device.service.ts`
- **Action**: Import and use constant
- **Implementation Steps**:
  1. Add import: `import { DEVICE_FINGERPRINT_HMAC_LABEL } from './constants/auth.constants'`
  2. Line 23: `'device-fingerprint-key'` → `DEVICE_FINGERPRINT_HMAC_LABEL`

### Step 5: Replace Magic Strings in auth.controller.ts

- **File**: `src/auth/auth.controller.ts`
- **Action**: Import and use constants
- **Implementation Steps**:
  1. Add import: `import { DEVICE_FINGERPRINT_HEADER, REFRESH_TOKEN_COOKIE_NAME } from './constants/auth.constants'`
  2. Line 123: `'x-device-fingerprint'` → `DEVICE_FINGERPRINT_HEADER`
  3. Line 167: `'refresh_token'` → `REFRESH_TOKEN_COOKIE_NAME`
  4. Line 189: `'refresh_token'` → `REFRESH_TOKEN_COOKIE_NAME`

### Step 6: Replace Magic Strings in mfa.controller.ts

- **File**: `src/auth/mfa.controller.ts`
- **Action**: Import and use constant
- **Implementation Steps**:
  1. Add import: `import { DEVICE_FINGERPRINT_HEADER } from './constants/auth.constants'`
  2. Line 113: `'x-device-fingerprint'` → `DEVICE_FINGERPRINT_HEADER`

### Step 7: Replace Magic Strings in session.controller.ts

- **File**: `src/auth/session.controller.ts`
- **Action**: Import and use constant
- **Implementation Steps**:
  1. Add import: `import { REFRESH_TOKEN_COOKIE_NAME } from './constants/auth.constants'`
  2. Line 43: `'refresh_token'` → `REFRESH_TOKEN_COOKIE_NAME`

### Step 8: Replace Magic Strings in auth.module.ts

- **File**: `src/auth/auth.module.ts`
- **Action**: Import and use JWT issuer/audience constants
- **Implementation Steps**:
  1. Add import: `import { JWT_ISSUER, JWT_AUDIENCE } from './constants/auth.constants'`
  2. Lines 54-55: `issuer: 'nexacore-api'` → `issuer: JWT_ISSUER`, `audience: 'nexacore-api'` → `audience: JWT_AUDIENCE`
  3. Lines 59-60: same replacement for verifyOptions

### Step 9: Replace Magic Strings in jwt.strategy.ts

- **File**: `src/auth/strategies/jwt.strategy.ts`
- **Action**: Import and use JWT issuer/audience constants
- **Implementation Steps**:
  1. Add import: `import { JWT_ISSUER, JWT_AUDIENCE } from '../constants/auth.constants'`
  2. Lines 22-23: `issuer: 'nexacore-api'` → `issuer: JWT_ISSUER`, `audience: 'nexacore-api'` → `audience: JWT_AUDIENCE`

### Step 10: Run Tests and Build

- **Action**: Verify zero-behavior-change
- **Implementation Steps**:
  1. `cd nexacore-api && npx jest --verbose` — all 849+ tests must pass
  2. `npx nest build` — must compile clean
- **Implementation Notes**: Test files use string literals directly in assertions (e.g., `expect(cookie.name).toBe('refresh_token')`) — these do NOT need to change. Tests verify behavior, not implementation detail. Changing test literals to constants would make tests less readable and couple them to implementation.

### Step 11: Update Technical Documentation

- **Action**: Run `/update-docs SCRUM-199` after implementation

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Add constants to `auth.constants.ts`
3. Steps 2-9: Replace magic strings across 8 files (parallel-safe, no dependencies)
4. Step 10: Run tests and build
5. Step 11: Update documentation

## Testing Checklist

- [ ] All 849+ existing tests pass (zero behavior change)
- [ ] `nest build` compiles clean
- [ ] No remaining magic string literals in source files (grep verification)
- [ ] Test files still use string literals (intentional — tests verify behavior)

## Error Response Format

No new error responses. Pure refactoring.

## Dependencies

No new dependencies.

## Notes

- **Test files are intentionally NOT changed** — test assertions should use string literals to verify behavior, not import implementation constants. This keeps tests independent of implementation.
- **`security.config.ts:20`** uses `'X-Device-Fingerprint'` (PascalCase) for CORS exposed headers. This is a different context (CORS config) and the PascalCase form is correct for HTTP header names in CORS configuration. The lowercase `DEVICE_FINGERPRINT_HEADER` constant is for `req.headers` lookup. Both are valid — only the lowercase form is replaced.
- **`token.service.ts:58`** still uses `process.env.JWT_SECRET` instead of `ConfigService`. This is a pre-existing issue (not in scope for this ticket — SCRUM-199 is about magic strings, not ConfigService migration). The fallback string `'default-dev-secret-change-in-production'` is only used when `process.env.JWT_SECRET` is undefined, which shouldn't happen in production.

## Next Steps After Implementation

1. Run `/update-docs SCRUM-199`
2. Create PR, merge to main
3. Transition SCRUM-199 to Done
4. Proceed with SCRUM-200

## Implementation Verification

- [ ] Code quality: All magic strings replaced with named constants
- [ ] Functionality: Zero behavior change (same string values)
- [ ] Testing: All 849+ tests pass
- [ ] Integration: No DI, module, guard, or API changes
- [ ] Documentation: integration-state.md changelog updated
- [ ] Build: `npx nest build` compiles clean
