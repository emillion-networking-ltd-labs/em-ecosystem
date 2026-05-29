# Backend Implementation Plan: SCRUM-198 Extract Shared OAuth Guard and Strategy Base Classes

## Codebase State Snapshot

- **Date**: 2026-03-13
- **Last completed ticket**: SCRUM-201 (Split auth.service.spec.ts into per-domain test files)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/auth/guards/google-auth.guard.ts` (26 lines)
  - `src/auth/guards/github-auth.guard.ts` (26 lines)
  - `src/auth/guards/oauth-link.guard.ts` (43 lines)
  - `src/auth/guards/oauth-callback.filter.ts` (39 lines)
  - `src/auth/strategies/google.strategy.ts` (117 lines)
  - `src/auth/strategies/github.strategy.ts` (127 lines)
  - `src/auth/strategies/jwt.strategy.ts` (47 lines)
  - `src/auth/strategies/pkce-authenticate.ts` (47 lines)
  - `src/auth/oauth.controller.ts` (237 lines)
  - `src/auth/auth.module.ts` (101 lines)
  - `src/auth/stores/oauth-state.store.ts` (partial — OAuthAction, OAuthStateData types)
  - `src/auth/tests/oauth-guards.spec.ts` (84 lines, 4 tests)
  - `src/auth/tests/google.strategy.spec.ts` (378 lines, 13 tests)
  - `src/auth/tests/github.strategy.spec.ts` (462 lines, 16 tests)
- **Constructor signatures verified**:
  - `GoogleAuthGuard(oauthStateStore: OAuthStateStore)` — extends `AuthGuard('google')`
  - `GitHubAuthGuard(oauthStateStore: OAuthStateStore)` — extends `AuthGuard('github')`
  - `GoogleStrategy(oauthAuthService: OAuthAuthService, oauthStateStore: OAuthStateStore, configService: ConfigService)` — extends `PassportStrategy(Strategy, 'google')`
  - `GitHubStrategy(oauthAuthService: OAuthAuthService, oauthStateStore: OAuthStateStore, configService: ConfigService)` — extends `PassportStrategy(Strategy, 'github')`
- **Methods verified to exist**:
  - `GoogleAuthGuard.getAuthenticateOptions(context: ExecutionContext)` — `google-auth.guard.ts:11`
  - `GitHubAuthGuard.getAuthenticateOptions(context: ExecutionContext)` — `github-auth.guard.ts:11`
  - `GoogleStrategy.authorizationParams(options)` — `google.strategy.ts:31`
  - `GoogleStrategy.authenticate(req, options)` — `google.strategy.ts:35`
  - `GoogleStrategy.validate(req, _accessToken, _refreshToken, profile, done)` — `google.strategy.ts:50`
  - `GitHubStrategy.authorizationParams(options)` — `github.strategy.ts:31`
  - `GitHubStrategy.authenticate(req, options)` — `github.strategy.ts:35`
  - `GitHubStrategy.validate(req, _accessToken, _refreshToken, profile, done)` — `github.strategy.ts:50`
- **Guard dependency chain verified**:
  - `@UseGuards(GoogleAuthGuard)` → `OAuthStateStore` → `REDIS_CLIENT` (via RedisModule @Global)
  - `@UseGuards(GitHubAuthGuard)` → `OAuthStateStore` → `REDIS_CLIENT` (via RedisModule @Global)
  - `@UseGuards(OAuthLinkGuard, GoogleAuthGuard)` → `JwtService` (via JwtModule) + `OAuthStateStore`
  - `@UseGuards(OAuthLinkGuard, GitHubAuthGuard)` → `JwtService` (via JwtModule) + `OAuthStateStore`
- **Discrepancies with integration-state.md**: None found.

## Overview

Audit finding DU-04: GoogleAuthGuard and GitHubAuthGuard are **identical** except for the Passport strategy name. GoogleStrategy and GitHubStrategy share ~80% of their validate logic (state validation, email extraction, action dispatch to link/login). This ticket extracts:

1. **A guard factory function** (`createOAuthAuthGuard`) that eliminates the duplicated `getAuthenticateOptions()` method.
2. **A shared validate helper** (`validateOAuthCallback`) that eliminates duplicated state validation and action dispatch logic from strategies.

Both provider-specific classes remain (required by Passport's mixin pattern), but become thin wrappers over shared logic.

## Architecture Context

- **Module**: AuthModule
- **Components affected**: Guards (2), Strategies (2), Tests (3 files)
- **Files created**:
  - `src/auth/guards/base-oauth-auth.guard.ts` — guard factory function
  - `src/auth/strategies/oauth-validate.helper.ts` — shared validate logic
- **Files modified**:
  - `src/auth/guards/google-auth.guard.ts` — replaced with factory call
  - `src/auth/guards/github-auth.guard.ts` — replaced with factory call
  - `src/auth/strategies/google.strategy.ts` — validate() uses shared helper
  - `src/auth/strategies/github.strategy.ts` — validate() uses shared helper
  - `src/auth/tests/oauth-guards.spec.ts` — add tests for base guard factory
  - `src/auth/tests/google.strategy.spec.ts` — minor: tests still pass (no behavior change)
  - `src/auth/tests/github.strategy.spec.ts` — minor: tests still pass (no behavior change)
- **Files NOT modified** (zero-impact guarantee):
  - `src/auth/oauth.controller.ts` — imports `GoogleAuthGuard`/`GitHubAuthGuard` by name (unchanged exports)
  - `src/auth/auth.module.ts` — registers `GoogleStrategy`/`GitHubStrategy` by class (unchanged exports)
  - `src/auth/strategies/pkce-authenticate.ts` — already extracted, untouched
  - `src/auth/guards/oauth-link.guard.ts` — independent, untouched
  - `src/auth/guards/oauth-callback.filter.ts` — independent, untouched

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to `feature/SCRUM-198-backend`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-198-backend`
  3. `git branch` to verify

### Step 1: Create Guard Factory Function

- **File**: `src/auth/guards/base-oauth-auth.guard.ts`
- **Action**: Create a factory function that returns an `@Injectable()` guard class parameterized by strategy name
- **Function Signature**:
  ```typescript
  export function createOAuthAuthGuard(strategyName: string): Type<any>
  ```
- **Implementation Steps**:
  1. Import `ExecutionContext, Injectable, Type` from `@nestjs/common`, `AuthGuard` from `@nestjs/passport`, `OAuthStateStore, OAuthAction` from `../stores/oauth-state.store`
  2. Create `createOAuthAuthGuard(strategyName: string)` function that:
     - Defines an `@Injectable()` class extending `AuthGuard(strategyName)`
     - Constructor injects `OAuthStateStore`
     - Implements `getAuthenticateOptions(context: ExecutionContext)` with the shared logic:
       - Gets request from context
       - If no `code` in query: generates state + PKCE via `oauthStateStore.generate(action, userId)` and returns `{ state, code_challenge, code_challenge_method: 'S256' }`
       - If `code` present: returns `{}`
     - Returns the class
  3. Export the function
- **Implementation Notes**:
  - The `@Injectable()` decorator on the inner class ensures NestJS DI can resolve `OAuthStateStore` when the guard is instantiated
  - `AuthGuard(strategyName)` is evaluated at class-definition time, creating the correct Passport binding
  - The returned class must be a proper NestJS injectable — `Type<any>` return type

### Step 2: Rewrite Google Auth Guard

- **File**: `src/auth/guards/google-auth.guard.ts`
- **Action**: Replace the full class with a one-liner using the factory
- **Implementation Steps**:
  1. Replace entire file contents with:
     ```typescript
     import { createOAuthAuthGuard } from './base-oauth-auth.guard';
     export const GoogleAuthGuard = createOAuthAuthGuard('google');
     ```
  2. The exported name `GoogleAuthGuard` remains identical — zero changes needed in consumers
- **Implementation Notes**: `oauth.controller.ts` imports `GoogleAuthGuard` by name, `auth.module.ts` does NOT register guards as providers (they're used via `@UseGuards()` decorator which auto-resolves). However, verify that `GoogleAuthGuard` is not in the module's `providers` array... Actually, checking `auth.module.ts`, guards are NOT explicitly listed as providers (only `OAuthLinkGuard` is). `GoogleAuthGuard` and `GitHubAuthGuard` are used inline via `@UseGuards()` — Passport's `AuthGuard()` handles their resolution. This means the factory approach works seamlessly.

### Step 3: Rewrite GitHub Auth Guard

- **File**: `src/auth/guards/github-auth.guard.ts`
- **Action**: Replace the full class with a one-liner using the factory
- **Implementation Steps**:
  1. Replace entire file contents with:
     ```typescript
     import { createOAuthAuthGuard } from './base-oauth-auth.guard';
     export const GitHubAuthGuard = createOAuthAuthGuard('github');
     ```
  2. Same zero-impact guarantee as Google

### Step 4: Create Shared OAuth Validate Helper

- **File**: `src/auth/strategies/oauth-validate.helper.ts`
- **Action**: Extract the shared validate logic (state validation + action dispatch) into a reusable function
- **Function Signature**:
  ```typescript
  export interface OAuthProfile {
    email: string;
    provider: Provider;
    providerId: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  }

  export async function validateOAuthCallback(
    oauthStateStore: OAuthStateStore,
    oauthAuthService: OAuthAuthService,
    req: { query: { state?: string }; ip?: string; socket?: { remoteAddress?: string }; headers?: Record<string, string | string[]> },
    oauthProfile: OAuthProfile,
    providerName: string,
    done: (error: Error | null, user?: unknown) => void,
  ): Promise<void>
  ```
- **Implementation Steps**:
  1. Import `OAuthStateStore, OAuthStateData` from `../stores/oauth-state.store`, `OAuthAuthService` from `../oauth-auth.service`, `Provider` from `../../users/enums/provider.enum`, `ErrorMessages` from `../../common/constants/error-messages`, `extractRequestMeta` from `../../common/utils/request-meta`
  2. Define `OAuthProfile` interface (email, provider, providerId, firstName?, lastName?, avatarUrl?)
  3. Implement `validateOAuthCallback()`:
     a. Validate state parameter exists → if not, `done(new Error(ErrorMessages.auth.AUTHENTICATION_FAILED))` and return
     b. Validate state via `oauthStateStore.validate(state)` → if null, `done(new Error(ErrorMessages.auth.AUTHENTICATION_FAILED))` and return
     c. Extract `requestMeta` via `extractRequestMeta(req)`
     d. `try/catch` block:
        - If `stateData.action === 'link' && stateData.userId`: call `oauthAuthService.validateOAuthLink(stateData.userId, oauthProfile, requestMeta)` → `done(null, result)`
        - Else: call `oauthAuthService.validateOAuthUser(oauthProfile, requestMeta, requestMeta)` → `done(null, result)`
     e. On catch: `done(err as Error)` (no second arg for compatibility with both callback signatures)
- **Implementation Notes**:
  - The `done` callback type differs slightly between Google (`VerifyCallback` with 2 params) and GitHub (explicit 2-param). The shared helper uses `(error: Error | null, user?: unknown)` which is compatible with both.
  - The Google strategy passes `undefined` as second arg on error (`done(err, undefined)`), while GitHub omits it. Using `done(err as Error)` (omit second arg) works for both — Passport ignores undefined vs missing.

### Step 5: Refactor Google Strategy to Use Shared Helper

- **File**: `src/auth/strategies/google.strategy.ts`
- **Action**: Replace the validate method body with a call to `validateOAuthCallback`, keeping only the Google-specific profile extraction
- **Implementation Steps**:
  1. Add import: `import { validateOAuthCallback } from './oauth-validate.helper'`
  2. Replace the `validate()` method body:
     ```typescript
     async validate(req, _accessToken, _refreshToken, profile, done): Promise<void> {
       const email = profile.emails?.[0]?.value;
       if (!email) {
         done(new Error('No email provided by Google'), undefined);
         return;
       }

       await validateOAuthCallback(
         this.oauthStateStore,
         this.oauthAuthService,
         req,
         {
           email,
           provider: Provider.GOOGLE,
           providerId: profile.id,
           firstName: profile.name?.givenName,
           lastName: profile.name?.familyName,
           avatarUrl: profile.photos?.[0]?.value,
         },
         'Google',
         done,
       );
     }
     ```
  3. Remove unused imports: `OAuthStateData`, `ErrorMessages`, `extractRequestMeta` (now in helper)
  4. Keep imports: `Provider`, `OAuthStateStore` (still needed for constructor)
- **Implementation Notes**:
  - Email extraction stays in the strategy because the profile type is provider-specific (`profile.emails?.[0]?.value`)
  - The "No email provided by Google" error message is provider-specific and stays
  - `authorizationParams()` and `authenticate()` remain unchanged (already use shared `pkce-authenticate.ts` helpers)

### Step 6: Refactor GitHub Strategy to Use Shared Helper

- **File**: `src/auth/strategies/github.strategy.ts`
- **Action**: Same pattern as Google, but with GitHub-specific displayName parsing
- **Implementation Steps**:
  1. Add import: `import { validateOAuthCallback } from './oauth-validate.helper'`
  2. Replace the `validate()` method body:
     ```typescript
     async validate(req, _accessToken, _refreshToken, profile, done): Promise<void> {
       const email = profile.emails?.[0]?.value;
       if (!email) {
         done(new Error('No email provided by GitHub'));
         return;
       }

       let firstName: string | undefined;
       let lastName: string | undefined;
       if (profile.displayName) {
         const parts = profile.displayName.split(' ');
         firstName = parts[0];
         lastName = parts.length > 1 ? parts.slice(1).join(' ') : undefined;
       }

       await validateOAuthCallback(
         this.oauthStateStore,
         this.oauthAuthService,
         req,
         {
           email,
           provider: Provider.GITHUB,
           providerId: profile.id,
           firstName,
           lastName,
           avatarUrl: profile.photos?.[0]?.value,
         },
         'GitHub',
         done,
       );
     }
     ```
  3. Remove unused imports: `OAuthStateData`, `ErrorMessages`, `extractRequestMeta`
- **Implementation Notes**:
  - GitHub displayName parsing stays in the strategy (provider-specific format)
  - The error callback signature differs from Google (`done(err)` vs `done(err, undefined)`) — both work correctly with Passport

### Step 7: Update Guard Tests

- **File**: `src/auth/tests/oauth-guards.spec.ts`
- **Action**: Add tests for the factory function, keep existing per-guard tests
- **Implementation Steps**:
  1. Add import: `import { createOAuthAuthGuard } from '../guards/base-oauth-auth.guard'`
  2. Add a describe block for `createOAuthAuthGuard`:
     - Test that it returns a class (constructor function)
     - Test that two calls with different strategy names return different classes
     - Test that the returned class can be instantiated with an OAuthStateStore mock
  3. Existing GoogleAuthGuard/GitHubAuthGuard tests remain unchanged — they test the same exported classes which now come from the factory. These tests serve as integration tests confirming the factory works correctly for each provider.
- **Implementation Notes**: No existing tests should break because the exported symbols are identical.

### Step 8: Verify Strategy Tests Pass Without Changes

- **Action**: Run the existing google.strategy.spec.ts and github.strategy.spec.ts tests to verify they pass without modification
- **Implementation Steps**:
  1. `cd nexacore-api && npx jest --testPathPattern="auth/tests/(google|github).strategy" --verbose`
  2. Expected: All 29 tests pass (13 Google + 16 GitHub)
  3. If any test fails, investigate and fix without changing test expectations
- **Implementation Notes**:
  - The refactored strategies have identical external behavior — same constructor signature, same validate inputs/outputs
  - Tests exercise `strategy.validate()` directly, so they test the full flow including the shared helper

### Step 9: Run Full Test Suite

- **Action**: Run all backend tests to verify no regressions
- **Implementation Steps**:
  1. `cd nexacore-api && npx jest --verbose 2>&1`
  2. Verify all tests pass (currently 846+)
  3. Verify build: `npx nest build`
- **Implementation Notes**: Zero-impact refactoring — no external interfaces change.

### Step 10: Update Technical Documentation

- **Action**: Run `/update-docs SCRUM-198` after implementation
- **Implementation Steps**:
  1. Update `integration-state.md` changelog
  2. No API surface changes, no data model changes, no new modules
  3. The guard factory and validate helper are internal implementation details

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Create guard factory (`base-oauth-auth.guard.ts`)
3. Step 2: Rewrite Google guard (one-liner)
4. Step 3: Rewrite GitHub guard (one-liner)
5. Step 4: Create validate helper (`oauth-validate.helper.ts`)
6. Step 5: Refactor Google strategy validate
7. Step 6: Refactor GitHub strategy validate
8. Step 7: Update guard tests
9. Step 8: Verify strategy tests
10. Step 9: Full test suite + build
11. Step 10: Update documentation

## Testing Checklist

- [ ] Guard factory creates distinct classes for different strategy names
- [ ] GoogleAuthGuard returns PKCE state on initiation, empty on callback
- [ ] GitHubAuthGuard returns PKCE state on initiation, empty on callback
- [ ] Google validate: successful login with state validation
- [ ] Google validate: error on missing email, invalid state, missing state
- [ ] Google validate: error propagation from validateOAuthUser
- [ ] GitHub validate: successful login with state validation
- [ ] GitHub validate: error on missing email, invalid state, missing state
- [ ] GitHub validate: displayName parsing (absent, single word, multi word)
- [ ] GitHub validate: error propagation from validateOAuthUser
- [ ] Google authorizationParams: PKCE params forwarding
- [ ] GitHub authorizationParams: login param + PKCE params forwarding
- [ ] Google authenticate: PKCE monkey-patch and restore
- [ ] GitHub authenticate: PKCE monkey-patch and restore
- [ ] Link flow: both strategies call validateOAuthLink when action='link'
- [ ] All 846+ existing tests pass
- [ ] Build succeeds

## Error Response Format

No new error responses. All existing error paths preserved.

## Dependencies

No new external dependencies. Uses existing:
- `@nestjs/passport` (AuthGuard, PassportStrategy)
- `passport-google-oauth20`
- `passport-github2`

## Notes

- **NestJS DI compatibility**: The factory-generated guard class must have `@Injectable()` to allow constructor injection of `OAuthStateStore`. Verified that NestJS resolves dependencies for classes created by factory functions as long as they have the decorator.
- **Passport mixin constraint**: `PassportStrategy(Strategy, 'name')` must be called at class definition time — cannot be parameterized at runtime. This is why strategies keep separate classes (with shared helper) rather than using a factory.
- **Zero-impact guarantee**: All exported class names and their constructor signatures remain identical. No consumer (controller, module, test) needs to change their imports.
- **Future provider addition**: Adding a new OAuth provider (e.g., Apple) now requires: (1) create strategy with provider-specific profile parsing + call to `validateOAuthCallback`, (2) `export const AppleAuthGuard = createOAuthAuthGuard('apple')`, (3) add controller routes. No need to copy 40+ lines of state validation/action dispatch.

## Next Steps After Implementation

1. Run `/update-docs SCRUM-198`
2. Create PR, merge to main
3. Transition SCRUM-198 to Done
4. Proceed with SCRUM-199

## Implementation Verification

- [ ] Code quality: No duplication in guard logic, shared validate helper used by both strategies
- [ ] Functionality: All OAuth flows work identically (login, link, callback)
- [ ] Testing: All 846+ tests pass, no new test failures
- [ ] Integration: Guards resolve correctly via `@UseGuards()`, strategies validate correctly via Passport
- [ ] Documentation: integration-state.md updated
- [ ] Build: `npx nest build` succeeds
