# Backend Implementation Plan: SCRUM-182 Extract Shared Utilities — RequestMetaHelper, OAuthPkceStrategy

## Codebase State Snapshot

- **Date**: 2026-03-12
- **Last completed ticket**: SCRUM-181 (Decompose AuthService god class)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/auth/auth.controller.ts` — `extractRequestMeta()` at L74–82, 5 DI deps (AuthService, SessionsService, JwtService, PermissionsService, TrustedDeviceService)
  - `src/auth/mfa.controller.ts` — `extractRequestMeta()` at L39–47, 2 DI deps (MfaService, TokenService)
  - `src/auth/passkey.controller.ts` — `extractRequestMeta()` at L43–51, 2 DI deps (PasskeyService, TokenService)
  - `src/users/users.controller.ts` — 7 inline `{ ipAddress: req.ip || null, userAgent: ... }` literals at L51, L65, L81, L95, L122, L177, L197. 1 DI dep (UsersService)
  - `src/auth/strategies/google.strategy.ts` — `authenticate()` at L37–57, `authorizationParams()` at L27–34, inline `requestMeta` at L95–98. 2 DI deps (OAuthAuthService, OAuthStateStore). Base params: `{}`
  - `src/auth/strategies/github.strategy.ts` — `authenticate()` at L37–57, `authorizationParams()` at L27–34, inline `requestMeta` at L104–107. 2 DI deps (OAuthAuthService, OAuthStateStore). Base params: `{ login: '' }`
  - `src/common/utils/` — contains only `validate-production-secrets.ts`
  - `src/auth/utils/` — contains `hash-token.ts`, `parse-duration.ts`

- **Constructor signatures verified**:
  - `AuthController(authService, sessionsService, jwtService, permissionsService, trustedDeviceService)` — 5 deps
  - `MfaController(mfaService, tokenService)` — 2 deps
  - `PasskeyController(passkeyService, tokenService)` — 2 deps
  - `UsersController(usersService)` — 1 dep
  - `GoogleStrategy(oauthAuthService, oauthStateStore)` — 2 deps
  - `GitHubStrategy(oauthAuthService, oauthStateStore)` — 2 deps

- **Methods verified to exist**:
  - `AuthController.extractRequestMeta()` — L74–82 (private)
  - `MfaController.extractRequestMeta()` — L39–47 (private)
  - `PasskeyController.extractRequestMeta()` — L43–51 (private)
  - `GoogleStrategy.authenticate()` — L37–57
  - `GoogleStrategy.authorizationParams()` — L27–34
  - `GitHubStrategy.authenticate()` — L37–57
  - `GitHubStrategy.authorizationParams()` — L27–34

- **Guard dependency chain verified**: N/A (no guard changes)
- **Discrepancies with integration-state.md**: None

## Overview

Extract two duplicated code patterns into shared utilities, resolving Phase 10 DU-04 FAIL:
1. `extractRequestMeta()` — duplicated as private method in 3 controllers + inlined 7× in users.controller.ts + inlined 2× in OAuth strategies
2. OAuth PKCE `authenticate()` + `authorizationParams()` — duplicated identically in 2 strategies

Pure structural refactor — zero behavioral changes (except normalizing users.controller.ts to use `'unknown'` fallback instead of `null` for ipAddress).

## Architecture Context

- **Modules**: No module changes
- **Components affected**: 4 controllers, 2 strategies
- **New files**: 2 utility files + 1 test file
- **No DI, guard, permission, or schema changes**

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to `feature/SCRUM-182-backend`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-182-backend`
  3. `git branch` — verify

### Step 1: Create extractRequestMeta Utility

- **File**: `src/common/utils/request-meta.ts` (new)

- **Action**: Create a standalone pure function and type interface for extracting request metadata.

- **Implementation Steps**:
  1. Define `RequestMeta` interface:
     ```typescript
     export interface RequestMeta {
       ipAddress: string;
       userAgent: string | null;
     }
     ```
  2. Export `extractRequestMeta(req)` function:
     ```typescript
     export function extractRequestMeta(req: {
       ip?: string;
       socket?: { remoteAddress?: string };
       headers?: Record<string, string | string[]>;
     }): RequestMeta {
       return {
         ipAddress: req.ip || req.socket?.remoteAddress || 'unknown',
         userAgent: (req.headers?.['user-agent'] as string | undefined) || null,
       };
     }
     ```
  3. The function uses the auth controller's signature (with `socket?.remoteAddress` fallback and `'unknown'` default). This normalizes the divergent `users.controller.ts` pattern.

- **Notes**: Placed in `src/common/utils/` (not `src/auth/utils/`) because it's used by `UsersController` in the `UsersModule` — cross-module utility.

### Step 2: Create extractRequestMeta Unit Tests

- **File**: `src/common/utils/tests/request-meta.spec.ts` (new)

- **Action**: Unit tests for `extractRequestMeta()`.

- **Test cases**:
  1. Returns `req.ip` when available
  2. Falls back to `req.socket.remoteAddress` when `req.ip` is undefined
  3. Returns `'unknown'` when neither `req.ip` nor `req.socket.remoteAddress` available
  4. Returns `user-agent` header value
  5. Returns `null` for `userAgent` when header is missing
  6. Handles `req.headers` being undefined
  7. Returns correct type (`RequestMeta`)

### Step 3: Create PKCE Authenticate Helper

- **File**: `src/auth/strategies/pkce-authenticate.ts` (new)

- **Action**: Extract the shared PKCE `authenticate()` monkey-patch and `authorizationParams()` PKCE extension into reusable functions.

- **Implementation Steps**:
  1. Export `applyPkceAuthenticate` function — takes the strategy instance, the `OAuthStateStore`, the request, options, and calls `super.authenticate`. This function encapsulates the `_oauth2.getOAuthAccessToken` monkey-patch:
     ```typescript
     import { OAuthStateStore } from '../stores/oauth-state.store';

     export async function applyPkceAuthenticate(
       strategy: any,
       oauthStateStore: OAuthStateStore,
       req: any,
       options: any,
       superAuthenticate: Function,
     ): Promise<void> {
       if (req.query?.code && req.query?.state) {
         const codeVerifier = await oauthStateStore.getCodeVerifier(req.query.state);
         if (codeVerifier) {
           const oauth2 = strategy._oauth2;
           const originalFn = oauth2.getOAuthAccessToken;
           oauth2.getOAuthAccessToken = function (
             code: string,
             params: Record<string, string>,
             callback: (...args: any[]) => void,
           ) {
             params.code_verifier = codeVerifier;
             oauth2.getOAuthAccessToken = originalFn;
             return originalFn.call(oauth2, code, params, callback);
           };
         }
       }
       return superAuthenticate.call(strategy, req, options);
     }
     ```
  2. Export `applyPkceAuthorizationParams` function — takes existing `options` and optional `baseParams`, returns params with PKCE fields if `code_challenge` present:
     ```typescript
     export function applyPkceAuthorizationParams(
       options: Record<string, string>,
       baseParams: Record<string, string> = {},
     ): Record<string, string> {
       const params = { ...baseParams };
       if (options.code_challenge) {
         params.code_challenge = options.code_challenge;
         params.code_challenge_method = options.code_challenge_method || 'S256';
       }
       return params;
     }
     ```

- **Notes**: Using helper functions instead of an abstract base class because `PassportStrategy()` already uses a class mixin pattern — TypeScript doesn't support multiple `extends`. The function approach avoids inheritance complexity while still eliminating duplication.

### Step 4: Update AuthController

- **File**: `src/auth/auth.controller.ts`

- **Action**: Remove `private extractRequestMeta()` method, import from `common/utils/request-meta`.

- **Implementation Steps**:
  1. Add import: `import { extractRequestMeta } from '../common/utils/request-meta';`
  2. Delete the private method at L74–82
  3. Replace all `this.extractRequestMeta(req)` calls with `extractRequestMeta(req)` (7 call sites: L139, L163, L204, L223, L244, L410, L569 — approximate line numbers, may shift after deletion)
  4. No constructor changes

### Step 5: Update MfaController

- **File**: `src/auth/mfa.controller.ts`

- **Action**: Remove `private extractRequestMeta()` method, import from `common/utils/request-meta`.

- **Implementation Steps**:
  1. Add import: `import { extractRequestMeta } from '../common/utils/request-meta';`
  2. Delete the private method at L39–47
  3. Replace all `this.extractRequestMeta(req)` calls with `extractRequestMeta(req)` (3 call sites)
  4. No constructor changes

### Step 6: Update PasskeyController

- **File**: `src/auth/passkey.controller.ts`

- **Action**: Same as Step 5.

- **Implementation Steps**:
  1. Add import: `import { extractRequestMeta } from '../common/utils/request-meta';`
  2. Delete the private method at L43–51
  3. Replace all `this.extractRequestMeta(req)` calls with `extractRequestMeta(req)` (3 call sites)
  4. No constructor changes

### Step 7: Update UsersController

- **File**: `src/users/users.controller.ts`

- **Action**: Replace 7 inline object literals with `extractRequestMeta(req)` calls.

- **Implementation Steps**:
  1. Add import: `import { extractRequestMeta } from '../common/utils/request-meta';`
  2. Replace each inline `{ ipAddress: req.ip || null, userAgent: req.headers?.['user-agent'] || null }` with `extractRequestMeta(req)`
  3. Affected methods (7): `updateProfile` (L50), `changePassword` (L64), `requestEmailChange` (L80), `deleteOwnAccount` (L94), `unlinkOAuth` (L121), `adminUpdateUser` (L176), `deleteUser` (L196)
  4. **Behavioral note**: This changes `ipAddress` from `req.ip || null` to `req.ip || req.socket?.remoteAddress || 'unknown'`. This is a minor normalization — `'unknown'` is strictly better than `null` for audit logging, and matches the auth controllers' existing behavior.

### Step 8: Update GoogleStrategy

- **File**: `src/auth/strategies/google.strategy.ts`

- **Action**: Replace duplicated `authenticate()` and `authorizationParams()` with helper functions. Replace inline `requestMeta` with `extractRequestMeta()`.

- **Implementation Steps**:
  1. Add imports:
     ```typescript
     import { applyPkceAuthenticate, applyPkceAuthorizationParams } from './pkce-authenticate';
     import { extractRequestMeta } from '../../common/utils/request-meta';
     ```
  2. Replace `authorizationParams()` body:
     ```typescript
     authorizationParams(options: Record<string, string>): Record<string, string> {
       return applyPkceAuthorizationParams(options);
     }
     ```
  3. Replace `authenticate()` body:
     ```typescript
     async authenticate(req: any, options?: any): Promise<void> {
       return applyPkceAuthenticate(this, this.oauthStateStore, req, options, super.authenticate);
     }
     ```
  4. Replace inline `requestMeta` at L95–98 with `const requestMeta = extractRequestMeta(req);`

### Step 9: Update GitHubStrategy

- **File**: `src/auth/strategies/github.strategy.ts`

- **Action**: Same as Step 8, but pass `{ login: '' }` as baseParams to `applyPkceAuthorizationParams`.

- **Implementation Steps**:
  1. Add same imports as Step 8
  2. Replace `authorizationParams()` body:
     ```typescript
     authorizationParams(options: Record<string, string>): Record<string, string> {
       return applyPkceAuthorizationParams(options, { login: '' });
     }
     ```
  3. Replace `authenticate()` body (same as Step 8)
  4. Replace inline `requestMeta` with `const requestMeta = extractRequestMeta(req);`

### Step 10: Update Tests

- **Files**:
  - `src/auth/tests/google.strategy.spec.ts`
  - `src/auth/tests/github.strategy.spec.ts`
  - `src/auth/tests/auth.controller.spec.ts` (if any extractRequestMeta-specific tests)
  - `src/auth/tests/mfa.controller.spec.ts` (if any)
  - `src/auth/tests/passkey.controller.spec.ts` (if any)

- **Action**: Verify existing tests still pass. The PKCE `authenticate` and `authorizationParams` tests in the strategy specs should still work identically since behavior is preserved.

- **Implementation Steps**:
  1. Run `npm test` — all 829+ tests should pass without changes
  2. If any tests spy on private `extractRequestMeta` calls, update to verify the function is called (unlikely since it's a private method)
  3. The `authenticate` tests spy on `PassportGoogleStrategy.prototype.authenticate` and `PassportGitHubStrategy.prototype.authenticate` — these spies will still work because `applyPkceAuthenticate` calls `superAuthenticate.call(strategy, req, options)` which hits the same prototype method

### Step 11: Update Technical Documentation

- **Action**: Run `/update-docs SCRUM-182`
- **Implementation Steps**:
  1. **integration-state.md**: No changes (no module, guard, DI, permission, or schema changes — utility extraction only)
  2. **Changelog**: Add entry documenting the utility extraction
  3. **No api-spec.yml changes** (API surface unchanged)
  4. **No data-model.md changes** (no schema changes)

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Create `extractRequestMeta` utility
3. Step 2: Create `extractRequestMeta` unit tests
4. Step 3: Create PKCE authenticate helper
5. Step 4: Update AuthController
6. Step 5: Update MfaController
7. Step 6: Update PasskeyController
8. Step 7: Update UsersController
9. Step 8: Update GoogleStrategy
10. Step 9: Update GitHubStrategy
11. Step 10: Run tests — verify all pass
12. Step 11: Update documentation

## Testing Checklist

- [ ] New `request-meta.spec.ts` tests pass (7 test cases)
- [ ] All existing google.strategy.spec.ts tests pass (PKCE + authorizationParams)
- [ ] All existing github.strategy.spec.ts tests pass
- [ ] All auth.controller.spec.ts tests pass
- [ ] All mfa.controller.spec.ts tests pass
- [ ] All passkey.controller.spec.ts tests pass
- [ ] All users.controller.spec.ts tests pass
- [ ] Full `npm test` passes (829+ tests)
- [ ] `nest build` compiles clean
- [ ] Zero occurrences of `private extractRequestMeta` in any file
- [ ] Zero inline `{ ipAddress: req.ip` literals in any controller

## Error Response Format

No changes — all error responses preserved exactly as-is.

## Dependencies

- No new npm dependencies
- No new external tools

## Notes

- **CRITICAL**: This is a pure structural refactor. Zero behavioral changes except the ipAddress normalization in `users.controller.ts` (null → 'unknown').
- **Function approach over base class**: TypeScript doesn't support multiple inheritance, and `PassportStrategy()` already uses a mixin. Using helper functions avoids the double-extends problem entirely.
- **`common/utils/` placement**: `extractRequestMeta` goes in `common/` because it's used by both AuthModule and UsersModule controllers. PKCE helper goes in `auth/strategies/` because it's specific to OAuth strategies.
- **No DI or module changes**: Both helpers are pure functions — no `@Injectable()`, no provider registration, no module wiring.

## Next Steps After Implementation

- Verify DU-04 audit check passes (zero duplication of extractRequestMeta and PKCE authenticate patterns)
- Continue to next Sprint 7 audit ticket

## Implementation Verification

- [ ] Code Quality: Zero code duplication for extractRequestMeta and PKCE patterns
- [ ] Functionality: All HTTP endpoints return identical responses
- [ ] Testing: 829+ tests pass, 7 new utility tests
- [ ] Integration: No module, guard, DI, or schema changes
- [ ] Documentation: integration-state.md changelog updated
