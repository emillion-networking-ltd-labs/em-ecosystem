# Backend Implementation Plan: SCRUM-122 Add OAuth URLs + JWT Expiry to Production Validation (O-03/J-04)

## Codebase State Snapshot

- **Date**: 2026-03-04
- **Last completed ticket on branch**: SCRUM-121 (Convert validate-reset-token to POST)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/common/utils/validate-production-secrets.ts` — 44 lines, validates JWT_SECRET/MFA_ENCRYPTION_KEY/CSRF_SECRET (3 blocks, same pattern: not empty, not default, >= 32 chars)
  - `src/tests/validate-production-secrets.spec.ts` — 133 lines, 11 tests (1 non-prod bypass, 3×3 secret checks, 1 valid case, 1 fail-fast order)
  - `src/auth/strategies/google.strategy.ts` — `GOOGLE_CALLBACK_URL` at line 18, default `http://localhost:3000/auth/google/callback`
  - `src/auth/strategies/github.strategy.ts` — `GITHUB_CALLBACK_URL` at line 18, default `http://localhost:3000/auth/github/callback`
  - `src/auth/auth.service.ts` — `parseDurationMs()` at line 49 (private function, regex `^(\d+)(s|m|h|d)$`), `JWT_ACCESS_EXPIRATION` at line 497 (default '15m')
  - `src/auth/auth.module.ts` — `JWT_ACCESS_EXPIRATION || '15m'` at line 38
- **Constructor signatures verified**: N/A — utility function, not a class
- **Methods verified to exist**: `validateProductionSecrets()` at validate-production-secrets.ts:9 — called from main.ts:14
- **Guard dependency chain verified**: N/A — no guard changes
- **Discrepancies with integration-state.md**: None relevant to this ticket

## Overview

Extend `validateProductionSecrets()` with two new validation blocks: (1) OAuth callback URLs must use HTTPS in production (RFC 9700 §2.1), (2) JWT access token expiry must not exceed 15 minutes (RFC 8725 §3.9). Follows existing fail-fast pattern.

## Architecture Context

- **Modules involved**: None — standalone utility function in `src/common/utils/`
- **Components affected**: validate-production-secrets.ts (2 new validation blocks), validate-production-secrets.spec.ts (new tests)
- **No DI, module, guard, controller, or schema changes**

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-122-backend` from SCRUM-121 branch
- **Implementation Steps**:
  1. `git checkout feature/SCRUM-121-backend` (already there)
  2. `git checkout -b feature/SCRUM-122-backend`
  3. Verify branch: `git branch --show-current`

### Step 1: Add OAuth HTTPS Callback Validation

- **File**: `src/common/utils/validate-production-secrets.ts`
- **Action**: Add GOOGLE_CALLBACK_URL and GITHUB_CALLBACK_URL HTTPS checks after CSRF_SECRET block (line 43)
- **Implementation Steps**:
  1. After the CSRF_SECRET validation block, add:
     ```typescript
     // RFC 9700 §2.1: OAuth callback URLs must use HTTPS in production
     if (
       process.env.GOOGLE_CALLBACK_URL &&
       !process.env.GOOGLE_CALLBACK_URL.startsWith('https://')
     ) {
       throw new Error(
         'FATAL: GOOGLE_CALLBACK_URL must use HTTPS in production (RFC 9700)',
       );
     }

     if (
       process.env.GITHUB_CALLBACK_URL &&
       !process.env.GITHUB_CALLBACK_URL.startsWith('https://')
     ) {
       throw new Error(
         'FATAL: GITHUB_CALLBACK_URL must use HTTPS in production (RFC 9700)',
       );
     }
     ```
  2. **Design decision**: Only validate if set (not required to be set). If unset, the strategy falls back to localhost default, which won't work in production anyway but isn't a security risk — it just won't function. The key risk is HTTP URLs being used in production, which leaks tokens.

### Step 2: Add JWT Access Expiry Validation

- **File**: `src/common/utils/validate-production-secrets.ts`
- **Action**: Parse JWT_ACCESS_EXPIRATION and reject if > 15 minutes
- **Implementation Steps**:
  1. Add a local `parseDurationToMs()` helper at the top of the file (before the exported function). Cannot import from auth.service.ts because `parseDurationMs` is a private function there.
     ```typescript
     /** Parse a duration string like '15m' or '1h' into milliseconds. Returns null if invalid. */
     function parseDurationToMs(duration: string): number | null {
       const match = duration.match(/^(\d+)(s|m|h|d)$/);
       if (!match) return null;
       const value = parseInt(match[1], 10);
       switch (match[2]) {
         case 's': return value * 1000;
         case 'm': return value * 60 * 1000;
         case 'h': return value * 60 * 60 * 1000;
         case 'd': return value * 24 * 60 * 60 * 1000;
         default: return null;
       }
     }
     ```
  2. After the OAuth blocks, add:
     ```typescript
     // RFC 8725 §3.9: JWT access token expiry must not exceed 15 minutes
     const MAX_ACCESS_TOKEN_MS = 15 * 60 * 1000; // 15 minutes
     const jwtExpiry = process.env.JWT_ACCESS_EXPIRATION;
     if (jwtExpiry) {
       const expiryMs = parseDurationToMs(jwtExpiry);
       if (expiryMs === null || expiryMs > MAX_ACCESS_TOKEN_MS) {
         throw new Error(
           'FATAL: JWT_ACCESS_EXPIRATION must be <= 15 minutes in production (RFC 8725)',
         );
       }
     }
     ```
  3. **Design decision**: Only validate if set. Default is '15m' (compliant), so unset is safe. Invalid format also throws (returns null from parser).

### Step 3: Add Tests

- **File**: `src/tests/validate-production-secrets.spec.ts`
- **Action**: Add test blocks for OAuth URLs and JWT expiry
- **Implementation Steps**:
  1. Add `GOOGLE_CALLBACK_URL` and `GITHUB_CALLBACK_URL` with HTTPS values to `VALID_SECRETS`:
     ```typescript
     const VALID_SECRETS = {
       JWT_SECRET: 'production-jwt-secret-at-least-32-characters-long',
       MFA_ENCRYPTION_KEY: 'production-mfa-key-at-least-32-characters-long',
       CSRF_SECRET: 'production-csrf-secret-at-least-32-chars-long',
       GOOGLE_CALLBACK_URL: 'https://myapp.com/auth/google/callback',
       GITHUB_CALLBACK_URL: 'https://myapp.com/auth/github/callback',
       JWT_ACCESS_EXPIRATION: '15m',
     };
     ```
  2. Add after CSRF_SECRET describe block (before "Valid case"):
     ```typescript
     // ─── GOOGLE_CALLBACK_URL ───────────────────────────────────────
     describe('GOOGLE_CALLBACK_URL', () => {
       it('should throw when GOOGLE_CALLBACK_URL uses HTTP', () => {
         process.env.GOOGLE_CALLBACK_URL = 'http://myapp.com/auth/google/callback';
         const validate = loadValidator();
         expect(() => validate()).toThrow('FATAL: GOOGLE_CALLBACK_URL');
       });

       it('should not throw when GOOGLE_CALLBACK_URL is not set', () => {
         delete process.env.GOOGLE_CALLBACK_URL;
         const validate = loadValidator();
         expect(() => validate()).not.toThrow();
       });
     });

     // ─── GITHUB_CALLBACK_URL ───────────────────────────────────────
     describe('GITHUB_CALLBACK_URL', () => {
       it('should throw when GITHUB_CALLBACK_URL uses HTTP', () => {
         process.env.GITHUB_CALLBACK_URL = 'http://myapp.com/auth/github/callback';
         const validate = loadValidator();
         expect(() => validate()).toThrow('FATAL: GITHUB_CALLBACK_URL');
       });

       it('should not throw when GITHUB_CALLBACK_URL is not set', () => {
         delete process.env.GITHUB_CALLBACK_URL;
         const validate = loadValidator();
         expect(() => validate()).not.toThrow();
       });
     });

     // ─── JWT_ACCESS_EXPIRATION ─────────────────────────────────────
     describe('JWT_ACCESS_EXPIRATION', () => {
       it('should throw when JWT_ACCESS_EXPIRATION exceeds 15 minutes', () => {
         process.env.JWT_ACCESS_EXPIRATION = '30m';
         const validate = loadValidator();
         expect(() => validate()).toThrow('FATAL: JWT_ACCESS_EXPIRATION');
       });

       it('should throw when JWT_ACCESS_EXPIRATION is 1h', () => {
         process.env.JWT_ACCESS_EXPIRATION = '1h';
         const validate = loadValidator();
         expect(() => validate()).toThrow('FATAL: JWT_ACCESS_EXPIRATION');
       });

       it('should not throw when JWT_ACCESS_EXPIRATION is 15m', () => {
         process.env.JWT_ACCESS_EXPIRATION = '15m';
         const validate = loadValidator();
         expect(() => validate()).not.toThrow();
       });

       it('should not throw when JWT_ACCESS_EXPIRATION is not set', () => {
         delete process.env.JWT_ACCESS_EXPIRATION;
         const validate = loadValidator();
         expect(() => validate()).not.toThrow();
       });

       it('should throw when JWT_ACCESS_EXPIRATION has invalid format', () => {
         process.env.JWT_ACCESS_EXPIRATION = 'invalid';
         const validate = loadValidator();
         expect(() => validate()).toThrow('FATAL: JWT_ACCESS_EXPIRATION');
       });
     });
     ```
  3. Total new tests: 9 (2 Google + 2 GitHub + 5 JWT expiry)

### Step 4: Build, Test, Verify

- **Implementation Steps**:
  1. `nest build` — zero errors
  2. Run full test suite — all tests pass
  3. Verify new validation blocks: `grep -n 'FATAL:' src/common/utils/validate-production-secrets.ts`

### Step 5: Update Technical Documentation

- **Action**: Review documentation impact
- **Implementation Steps**:
  1. `integration-state.md`: Add SCRUM-122 changelog entry
  2. No api-spec.yml, data-model.md, or other doc changes (no API or schema changes)

## Implementation Order

1. Step 0: Create Feature Branch
2. Step 1: Add OAuth HTTPS callback validation
3. Step 2: Add JWT access expiry validation
4. Step 3: Add tests
5. Step 4: Build, test, verify
6. Step 5: Update technical documentation

## Testing Checklist

- [ ] HTTP GOOGLE_CALLBACK_URL → FATAL error
- [ ] HTTPS GOOGLE_CALLBACK_URL → passes
- [ ] Unset GOOGLE_CALLBACK_URL → passes (optional)
- [ ] Same checks for GITHUB_CALLBACK_URL
- [ ] JWT_ACCESS_EXPIRATION '30m' → FATAL error
- [ ] JWT_ACCESS_EXPIRATION '1h' → FATAL error
- [ ] JWT_ACCESS_EXPIRATION '15m' → passes
- [ ] JWT_ACCESS_EXPIRATION unset → passes (default '15m' is compliant)
- [ ] JWT_ACCESS_EXPIRATION 'invalid' → FATAL error
- [ ] `nest build` compiles with zero errors
- [ ] All existing tests still pass

## Error Response Format

No API error responses — these are startup validation errors that prevent the app from starting:
```
FATAL: GOOGLE_CALLBACK_URL must use HTTPS in production (RFC 9700)
FATAL: GITHUB_CALLBACK_URL must use HTTPS in production (RFC 9700)
FATAL: JWT_ACCESS_EXPIRATION must be <= 15 minutes in production (RFC 8725)
```

## Dependencies

- No new npm packages
- **Prerequisite**: SCRUM-121 (must be on `feature/SCRUM-121-backend` branch)

## Notes

- **OAuth URLs optional**: Validation only fires if the env var is set. If unset, the strategy uses localhost defaults which won't work in production but aren't a security risk (no token interception). The dangerous case is an HTTP URL being used in production.
- **JWT expiry optional**: If JWT_ACCESS_EXPIRATION is unset, the default '15m' is used (compliant). Only validates when explicitly set to a non-compliant value.
- **Local parseDurationToMs**: Duplicates the parsing logic from auth.service.ts's `parseDurationMs()` because that function is private (not exported). The duplication is acceptable — it's a simple regex parser (~10 lines), and coupling the startup validator to auth.service would create an unnecessary import dependency.

## Next Steps After Implementation

1. Commit, push, create PR
2. Run `/update-docs SCRUM-122`
3. Proceed to SCRUM-123

## Implementation Verification

- [ ] **Code Quality**: 1 local helper + 3 validation blocks added, 9 new tests
- [ ] **Functionality**: Startup rejects insecure OAuth URLs and excessive JWT expiry in production
- [ ] **Testing**: All new validations covered with positive and negative cases
- [ ] **Security**: RFC 9700 (O-03) + RFC 8725 (J-04) compliance verified
- [ ] **Integration**: No module, guard, or DI changes
- [ ] **Documentation**: integration-state.md updated
