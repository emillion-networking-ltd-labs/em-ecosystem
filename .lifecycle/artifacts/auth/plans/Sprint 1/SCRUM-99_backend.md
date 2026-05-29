# Backend Implementation Plan: SCRUM-99 Rate Limit MFA Endpoints

## Codebase State Snapshot
- **Date**: 2026-03-02
- **Last completed ticket**: SCRUM-98 (per integration-state.md)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/auth/mfa.controller.ts` (140 lines, no @Throttle)
  - `nexacore-api/src/auth/constants/auth.constants.ts` (65 lines, no MFA limits)
  - `nexacore-api/src/auth/auth.controller.ts` (@Throttle pattern confirmed at lines 106, 131, 161, 309, 335, 352, 404, 443)
  - `nexacore-api/src/auth/tests/rate-limiting.spec.ts` (42 lines, no MFA tests)
  - `nexacore-api/src/auth/tests/mfa.controller.spec.ts` (236 lines, no Throttle tests)
  - `ai-specs/ai-specs/specs/integration-state.md` (171 lines)
- **Constructor signatures verified**: MfaController(MfaService, AuthService) — no changes needed
- **Guard dependency chain verified**: CustomThrottlerGuard is registered as APP_GUARD globally via ThrottlerModule in AppModule — no module import changes needed

## Overview

Add endpoint-specific `@Throttle()` decorators to 5 of 6 MFA endpoints to mitigate TOTP brute-force attacks. The global rate limit (100 req/60s) is insufficient for 6-digit code endpoints. Follow the existing `AUTH_RATE_LIMITS` constant pattern used in `auth.controller.ts`.

## Architecture Context

- **Module**: AuthModule (existing — no structural changes)
- **Components affected**: MfaController (decorators), auth.constants.ts (new constant entry)
- **Guard**: CustomThrottlerGuard (already global APP_GUARD — no import changes needed)
- **No new modules, services, or DI changes required**

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to `feature/SCRUM-99-backend`
- **Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-99-backend`
  3. `git branch` to verify

### Step 1: Add MFA Rate Limit Constant

- **File**: `nexacore-api/src/auth/constants/auth.constants.ts`
- **Action**: Add `mfa` entry to `AUTH_RATE_LIMITS`
- **Implementation**:
  1. At line 64, add `mfa` key to the existing `AUTH_RATE_LIMITS` object:
     ```typescript
     export const AUTH_RATE_LIMITS = {
       login: { ttl: 60_000, limit: 10 },
       register: { ttl: 60_000, limit: 5 },
       refresh: { ttl: 60_000, limit: 30 },
       oauth: { ttl: 60_000, limit: 10 },
       mfa: { ttl: 60_000, limit: 5 },
     };
     ```
  2. Update the JSDoc comment above `AUTH_RATE_LIMITS` to include MFA:
     ```
     * MFA: 5/60s — strict; limits TOTP brute-force (6-digit = 1M combinations).
     * Combined with 5-minute mfaToken expiry, attacker gets max 25 guesses per challenge.
     ```
- **Notes**: 5 req/60s × 5 min token expiry = max 25 attempts per MFA challenge. This makes brute-force of 6-digit TOTP (1M combinations) infeasible.

### Step 2: Add @Throttle Decorators to MFA Controller

- **File**: `nexacore-api/src/auth/mfa.controller.ts`
- **Action**: Import `Throttle` and add decorator to 5 endpoints
- **Implementation**:
  1. Add import at line 1 block:
     ```typescript
     import { Throttle } from '@nestjs/throttler';
     ```
  2. Add import for `AUTH_RATE_LIMITS`:
     ```typescript
     import { AUTH_RATE_LIMITS } from './constants/auth.constants';
     ```
  3. Add `@Throttle()` to each endpoint (place BEFORE `@ApiOperation`):

     **POST /auth/mfa/setup** (line 47):
     ```typescript
     @Post('setup')
     @UseGuards(JwtAuthGuard)
     @ApiBearerAuth()
     @Throttle({
       global: {
         ttl: AUTH_RATE_LIMITS.mfa.ttl,
         limit: AUTH_RATE_LIMITS.mfa.limit,
       },
     })
     ```

     **POST /auth/mfa/verify-setup** (line 57):
     ```typescript
     @Post('verify-setup')
     @HttpCode(HttpStatus.OK)
     @UseGuards(JwtAuthGuard)
     @ApiBearerAuth()
     @Throttle({
       global: {
         ttl: AUTH_RATE_LIMITS.mfa.ttl,
         limit: AUTH_RATE_LIMITS.mfa.limit,
       },
     })
     ```

     **POST /auth/mfa/verify-login** (line 73) — CRITICAL:
     ```typescript
     @Post('verify-login')
     @HttpCode(HttpStatus.OK)
     @Throttle({
       global: {
         ttl: AUTH_RATE_LIMITS.mfa.ttl,
         limit: AUTH_RATE_LIMITS.mfa.limit,
       },
     })
     ```

     **DELETE /auth/mfa** (line 97):
     ```typescript
     @Delete()
     @HttpCode(HttpStatus.OK)
     @UseGuards(JwtAuthGuard)
     @ApiBearerAuth()
     @Throttle({
       global: {
         ttl: AUTH_RATE_LIMITS.mfa.ttl,
         limit: AUTH_RATE_LIMITS.mfa.limit,
       },
     })
     ```

     **POST /auth/mfa/recovery-codes** (line 114):
     ```typescript
     @Post('recovery-codes')
     @HttpCode(HttpStatus.OK)
     @UseGuards(JwtAuthGuard)
     @ApiBearerAuth()
     @Throttle({
       global: {
         ttl: AUTH_RATE_LIMITS.mfa.ttl,
         limit: AUTH_RATE_LIMITS.mfa.limit,
       },
     })
     ```

  4. **GET /auth/mfa/status** — NO decorator. Inherits global (100/60s). Read-only, JWT-protected.

- **Dependencies**: `@nestjs/throttler` (already installed), `AUTH_RATE_LIMITS` from constants
- **Notes**: Decorator order follows existing auth.controller.ts pattern: HTTP method → HttpCode → UseGuards → ApiBearerAuth → Throttle → ApiOperation → ApiResponse

### Step 3: Add MFA Rate Limit Configuration Tests

- **File**: `nexacore-api/src/auth/tests/rate-limiting.spec.ts`
- **Action**: Add test suite for MFA rate limits
- **Implementation**:
  1. Update import to include `AUTH_RATE_LIMITS` (already imported)
  2. Add new `describe('MFA_RATE_LIMITS')` block after the existing `AUTH_RATE_LIMITS` block:
     ```typescript
     describe('MFA rate limits (AUTH_RATE_LIMITS.mfa)', () => {
       it('should have strict limit for MFA (5 per 60s)', () => {
         expect(AUTH_RATE_LIMITS.mfa.limit).toBe(5);
         expect(AUTH_RATE_LIMITS.mfa.ttl).toBe(60_000);
       });

       it('should have MFA limit at or below global', () => {
         expect(AUTH_RATE_LIMITS.mfa.limit).toBeLessThanOrEqual(GLOBAL_RATE_LIMIT.limit);
       });

       it('should limit brute-force to max 25 attempts per 5-minute MFA token', () => {
         const mfaTokenExpirySeconds = 300; // 5 minutes
         const windowsPerToken = Math.ceil(mfaTokenExpirySeconds / (AUTH_RATE_LIMITS.mfa.ttl / 1000));
         const maxAttempts = windowsPerToken * AUTH_RATE_LIMITS.mfa.limit;
         expect(maxAttempts).toBeLessThanOrEqual(25);
       });
     });
     ```

### Step 4: Add @Throttle Decorator Metadata Tests to MFA Controller Spec

- **File**: `nexacore-api/src/auth/tests/mfa.controller.spec.ts`
- **Action**: Add tests that verify @Throttle metadata is applied to the correct methods
- **Implementation**:
  1. Add import:
     ```typescript
     import { AUTH_RATE_LIMITS } from '../constants/auth.constants';
     ```
  2. Add new `describe('Rate limiting decorators')` block at the end of the main describe:
     ```typescript
     describe('Rate limiting decorators', () => {
       const throttledMethods = ['setup', 'verifySetup', 'verifyLogin', 'disable', 'regenerateCodes'];

       throttledMethods.forEach((method) => {
         it(`should have @Throttle on ${method}`, () => {
           const metadata = Reflect.getMetadata('THROTTLER:LIMIT', controller[method]);
           // Throttle metadata exists (exact structure tested in rate-limiting.spec.ts)
           expect(metadata).toBeDefined();
         });
       });

       it('should NOT have @Throttle on status (inherits global)', () => {
         const metadata = Reflect.getMetadata('THROTTLER:LIMIT', controller['status']);
         expect(metadata).toBeUndefined();
       });
     });
     ```
  3. **Note**: The exact metadata key used by `@nestjs/throttler` is `THROTTLER:LIMIT`. Verify at implementation time by checking `@nestjs/throttler` source or use `Reflect.getMetadataKeys()` to discover the correct key.

### Step 5: Add 429 Responses to api-spec.yml

- **File**: `ai-specs/ai-specs/specs/api-spec.yml`
- **Action**: Add 429 response to each throttled MFA endpoint
- **Implementation**: For each of the 5 throttled endpoints, add after existing responses:
  ```yaml
  '429':
    description: Rate limit exceeded (5 requests per 60 seconds)
    content:
      application/json:
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: false
            error:
              type: object
              properties:
                message:
                  type: string
                  example: Rate limit exceeded
                code:
                  type: string
                  example: RATE_LIMIT_EXCEEDED
                statusCode:
                  type: integer
                  example: 429
                retryAfter:
                  type: integer
                  description: Seconds until the rate limit resets
  ```
- **Endpoints to update**: `/auth/mfa/setup`, `/auth/mfa/verify-setup`, `/auth/mfa/verify-login`, `/auth/mfa` (DELETE), `/auth/mfa/recovery-codes`

### Step 6: Update integration-state.md

- **File**: `ai-specs/ai-specs/specs/integration-state.md`
- **Action**: Update MfaController entry in the Controller Guard Chains table
- **Implementation**:
  1. Update MfaController row to note `@Throttle` decorators on 5 methods
  2. Update the "Last completed ticket" in header to SCRUM-99

### Step 7: Verify Implementation

- **Action**: Build, test, and start the application
- **Steps**:
  1. `cd nexacore-api && npx nest build` — must compile clean
  2. `npx jest --maxWorkers=1 --forceExit` — all tests must pass
  3. `npx nest start` — must start without DI errors, verify 36 routes still load

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Add MFA rate limit constant
3. Step 2: Add @Throttle decorators to MFA controller
4. Step 3: Add MFA rate limit configuration tests
5. Step 4: Add @Throttle metadata tests to MFA controller spec
6. Step 5: Update api-spec.yml with 429 responses
7. Step 6: Update integration-state.md
8. Step 7: Verify (build, test, start)

## Testing Checklist

- [ ] `AUTH_RATE_LIMITS.mfa` exists with `{ ttl: 60_000, limit: 5 }`
- [ ] `@Throttle` applied to: setup, verify-setup, verify-login, disable, recovery-codes
- [ ] `@Throttle` NOT applied to: status
- [ ] Import of `Throttle` and `AUTH_RATE_LIMITS` in mfa.controller.ts
- [ ] All existing 427+ tests still pass
- [ ] New rate-limiting.spec.ts tests pass (MFA config validation)
- [ ] New mfa.controller.spec.ts tests pass (decorator metadata)
- [ ] `nest build` compiles clean
- [ ] `nest start` loads all 36 routes

## Error Response Format

Rate limit exceeded response (handled by existing CustomThrottlerGuard):
```json
{
  "success": false,
  "error": {
    "message": "Rate limit exceeded",
    "code": "RATE_LIMIT_EXCEEDED",
    "statusCode": 429,
    "retryAfter": 45
  }
}
```
Headers: `X-RateLimit-Limit: 5`, `X-RateLimit-Remaining: 0`, `X-RateLimit-Reset: <epoch>`, `Retry-After: <seconds>`

## Dependencies

- `@nestjs/throttler` — already installed and configured globally
- No new packages needed

## Notes

- **No DI changes**: CustomThrottlerGuard is already a global APP_GUARD. Adding `@Throttle()` decorators only overrides the per-route limit from 100 to 5. No module imports needed.
- **No constructor changes**: MfaController constructor stays (MfaService, AuthService). No test mock propagation needed.
- **verify-login is CRITICAL**: This is the only MFA endpoint without JWT auth — solely relies on a 5-minute mfaToken. Rate limiting is the primary defense here.
- **Decorator placement**: Follow existing pattern in auth.controller.ts — `@Throttle()` placed BEFORE `@ApiOperation()`.

## Implementation Verification

- [ ] **Code Quality**: @Throttle follows exact same pattern as auth.controller.ts
- [ ] **Functionality**: 6th request within 60s to any throttled MFA endpoint returns 429
- [ ] **Testing**: All existing + new tests pass, coverage thresholds maintained
- [ ] **Integration**: `nest build` + `nest start` clean, 36 routes load
- [ ] **Documentation**: api-spec.yml and integration-state.md updated
