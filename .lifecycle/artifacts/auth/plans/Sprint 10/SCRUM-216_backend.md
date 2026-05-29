# Backend Implementation Plan: SCRUM-216 — Add Tests for 3 Untested Auth Exports

## 1. Codebase State Snapshot

- **Date**: 2026-03-14
- **Last completed ticket**: SCRUM-222 (Add updatedAt to token models)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/auth/utils/hash-token.ts` — Pure function, 5 lines, exports `hashToken(token: string): string`
  - `nexacore-api/src/auth/strategies/pkce-authenticate.ts` — 2 exports: `applyPkceAuthenticate()` (async, monkey-patches OAuth2 client), `applyPkceAuthorizationParams()` (pure, merges PKCE params)
  - `nexacore-api/src/auth/strategies/oauth-validate.helper.ts` — 1 export: `validateOAuthCallback()` (async, orchestrates OAuth state validation + delegation to OAuthAuthService)
  - `nexacore-api/src/auth/stores/oauth-state.store.ts` — OAuthStateStore class (dependency for pkce + oauth-validate), exports `OAuthStateData` interface and `OAuthAction` type
  - `nexacore-api/src/auth/tests/` — 32 existing spec files, convention: `[name].spec.ts`
  - `nexacore-api/src/auth/tests/oauth-code.store.spec.ts` — Example test pattern for store tests (NestJS Test module, Redis mock)
  - `nexacore-api/src/common/utils/request-meta.ts` — `extractRequestMeta()` used by oauth-validate.helper
  - `nexacore-api/src/common/constants/error-messages.ts` — `ErrorMessages.auth.AUTHENTICATION_FAILED` used in oauth-validate
- **Constructor signatures verified**: N/A (test-only, no service changes)
- **Methods verified to exist**: N/A (no method changes)
- **Guard dependency chain verified**: N/A (no guard changes)
- **Discrepancies with integration-state.md**: None

## 2. Overview

Create 3 new unit test files for auth utility/helper exports that currently have zero dedicated test coverage. Test-only ticket — no source code changes. The 3 files are pure utilities or helpers with clear inputs/outputs, making them straightforward to unit test.

## 3. Architecture Context

- **Test convention**: Files in `src/auth/tests/[name].spec.ts`
- **No NestJS module setup needed** for `hash-token` (pure function) or `pkce-authenticate` (standalone functions)
- **oauth-validate.helper** requires mocking `OAuthStateStore` and `OAuthAuthService`
- **No DI, no module imports, no guard changes** — test-only

## 4. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create branch `feature/SCRUM-216-backend` from `main`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-216-backend`

### Step 1: Create hash-token.spec.ts

- **File**: `nexacore-api/src/auth/tests/hash-token.spec.ts`
- **Action**: Test the `hashToken()` pure function
- **Test Cases**:
  1. **Returns SHA-256 hex digest**: Call with known input, verify output matches expected SHA-256 hash
  2. **Deterministic**: Same input always produces same output
  3. **Different inputs produce different hashes**: Two different tokens must not collide
  4. **Handles empty string**: Should not throw, should return valid hex
  5. **Returns 64-character hex string**: SHA-256 always produces 64 hex chars
- **Dependencies**: Only `import { hashToken } from '../utils/hash-token'` and `crypto` for expected hash computation
- **Notes**: Pure function, no mocks needed. Can compute expected values with `crypto.createHash('sha256').update(input).digest('hex')`.

### Step 2: Create pkce-authenticate.spec.ts

- **File**: `nexacore-api/src/auth/tests/pkce-authenticate.spec.ts`
- **Action**: Test both exports from `pkce-authenticate.ts`

#### applyPkceAuthenticate() test cases:
  1. **Injects code_verifier when state has verifier**: Mock `oauthStateStore.getCodeVerifier()` → returns verifier, verify the oauth2 client's `getOAuthAccessToken` is monkey-patched to include `code_verifier` in params
  2. **Restores original oauth2 method after patching**: After the patched fn is called, `oauth2.getOAuthAccessToken` should be restored to the original function
  3. **Calls superAuthenticate with correct args**: Verify `superAuthenticate.call(strategy, req, options)` is called
  4. **Skips patching when no code_verifier**: Mock `getCodeVerifier()` → returns undefined, verify oauth2 method is not replaced
  5. **Skips patching when req has no code or state**: Pass `req.query` without `code` or `state`, verify no patching and superAuthenticate is still called

#### applyPkceAuthorizationParams() test cases:
  1. **Merges code_challenge and method**: Pass `options.code_challenge`, verify output contains both `code_challenge` and `code_challenge_method: 'S256'`
  2. **Uses custom code_challenge_method if provided**: Pass both `code_challenge` and `code_challenge_method: 'plain'`
  3. **Returns base params when no code_challenge**: Pass empty options, verify only baseParams returned
  4. **Preserves existing base params**: Pass baseParams with extra keys, verify they survive

- **Dependencies**: Import both functions from `../strategies/pkce-authenticate`. Mock `OAuthStateStore` (only `getCodeVerifier` method needed).

### Step 3: Create oauth-validate.helper.spec.ts

- **File**: `nexacore-api/src/auth/tests/oauth-validate.helper.spec.ts`
- **Action**: Test `validateOAuthCallback()` function

#### Test cases:
  1. **Calls done with error when state is missing**: Pass `req.query.state = undefined`, verify `done(error, undefined)` with AUTHENTICATION_FAILED
  2. **Calls done with error when state is invalid**: Mock `oauthStateStore.validate()` → null, verify `done(error, undefined)`
  3. **Login flow**: Mock valid state with `action: 'login'`, verify `oauthAuthService.validateOAuthUser()` is called with correct args, `done(null, result)` called
  4. **Link flow**: Mock valid state with `action: 'link', userId: 'uuid'`, verify `oauthAuthService.validateOAuthLink()` is called with userId and profile, `done(null, result)` called
  5. **Error propagation**: Mock `validateOAuthUser()` throwing, verify `done(err, undefined)` is called

- **Dependencies**:
  - Mock `OAuthStateStore` (`validate` method)
  - Mock `OAuthAuthService` (`validateOAuthUser`, `validateOAuthLink`)
  - Import `ErrorMessages` for assertion on error messages
  - Import `Provider` enum for creating mock OAuthProfile

### Step 4: Verify Build and Tests

- **Action**: Confirm all tests pass
- **Implementation Steps**:
  1. Run `npx jest --forceExit` — all tests (870 existing + ~15 new) must pass
  2. Run `npx nest build` — must compile clean
- **Notes**: No source code changes, so build should be unaffected. New tests are purely additive.

### Step 5: Update Technical Documentation

- **Action**: No documentation updates needed for test-only changes
- **Notes**: Test files don't require updates to data-model.md, api-spec.yml, or standards files. Integration-state.md changelog will be updated in `/update-docs`.

## 5. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Create hash-token.spec.ts
3. Step 2: Create pkce-authenticate.spec.ts
4. Step 3: Create oauth-validate.helper.spec.ts
5. Step 4: Verify build and tests
6. Step 5: Update technical documentation (changelog only)

## 6. Testing Checklist

- [ ] hash-token.spec.ts: ~5 test cases pass
- [ ] pkce-authenticate.spec.ts: ~9 test cases pass (5 for applyPkceAuthenticate, 4 for applyPkceAuthorizationParams)
- [ ] oauth-validate.helper.spec.ts: ~5 test cases pass
- [ ] All 870 existing tests still pass
- [ ] `npx nest build` compiles clean
- [ ] No source code changes (test-only)

## 7. Error Response Format

N/A — test-only ticket.

## 8. Dependencies

- No new dependencies required
- Uses existing jest, @nestjs/testing (already installed)

## 9. Notes

- `hash-token.ts` is a pure function — simplest to test, no mocks needed
- `pkce-authenticate.ts` tests need careful mock setup for the monkey-patching behavior — create a fake oauth2 client object with a jest.fn() for `getOAuthAccessToken`
- `oauth-validate.helper.ts` tests need mocks for OAuthStateStore and OAuthAuthService — these are plain objects with jest.fn() (no NestJS DI needed since the function takes them as parameters)
- All 3 files take their dependencies as function parameters (not constructor injection), so no NestJS Test module setup is needed

## 10. Next Steps After Implementation

- Run `/verify` to confirm plan compliance
- Run `/commit` to create commit and push
- Run `/update-docs` to update integration-state.md

## 11. Implementation Verification

- [ ] 3 new spec files exist in `src/auth/tests/`
- [ ] All new tests pass
- [ ] All existing 870 tests pass
- [ ] `nest build` compiles clean
- [ ] No source code changes (diff should only show new test files)
