# Backend Implementation Plan: SCRUM-91 Tests for OAuth Strategies — PKCE and Validate Branches

## Codebase State Snapshot

- **Date**: 2026-02-27
- **Last completed ticket**: SCRUM-90 backend (Jest OOM fix on `feature/SCRUM-90-jest-oom-fix`)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/auth/strategies/github.strategy.ts` (121 lines) — 3 methods: `authorizationParams` (L26-33), `authenticate` (L36-56), `validate` (L58-120)
  - `src/auth/strategies/google.strategy.ts` (112 lines) — 3 methods: `authorizationParams` (L26-33), `authenticate` (L36-56), `validate` (L58-111)
  - `src/auth/tests/github.strategy.spec.ts` (183 lines) — 5 tests, all `validate()` only
  - `src/auth/tests/google.strategy.spec.ts` (193 lines) — 5 tests, all `validate()` only
  - `src/auth/stores/oauth-state.store.ts` (54 lines) — `generate()`, `getCodeVerifier()`, `validate()`, `cleanup()`
- **Constructor signatures verified**:
  - `GitHubStrategy(authService: AuthService, oauthStateStore: OAuthStateStore)`
  - `GoogleStrategy(authService: AuthService, oauthStateStore: OAuthStateStore)`
- **Guard dependency chain verified**: N/A — test-only ticket, no guard changes

## Overview

Both OAuth strategies have identical untested PKCE code paths (lines 26-55) and several uncovered `validate()` branches. The existing spec files only test 5 `validate()` scenarios each (state validation + email absence). This ticket adds tests for `authorizationParams()`, `authenticate()` PKCE monkey-patch, and remaining `validate()` branches.

**Current coverage → Target**:
- `github.strategy.ts`: 56.81% stmts / 48.71% branches / 40% funcs → ≥95% / ≥90% / 100%
- `google.strategy.ts`: 60% stmts / 51.42% branches / 40% funcs → ≥95% / ≥90% / 100%

## Architecture Context

### Modules involved
- None — test-only changes

### Components affected
- 2 spec files (extend only)
- 0 source files, 0 services, 0 controllers, 0 guards, 0 modules

### Files referenced
| File | Change |
|------|--------|
| `src/auth/tests/github.strategy.spec.ts` | Extend — add `authorizationParams()`, `authenticate()`, `validate()` displayName/error tests |
| `src/auth/tests/google.strategy.spec.ts` | Extend — add `authorizationParams()`, `authenticate()`, `validate()` error test |

## Implementation Steps

### Step 0: Create Feature Branch

- **Branch name**: `feature/SCRUM-91-backend`
- **Base**: `feature/SCRUM-90-jest-oom-fix`

---

### Step 1: Update OAuthStateStore mock in both spec files

Both spec files currently mock OAuthStateStore with only `generate` and `validate`. The `authenticate()` tests need `getCodeVerifier`.

- **Action**: Add `getCodeVerifier: jest.fn()` to the `useValue` mock object in `beforeEach` of both files
- **Files**: `github.strategy.spec.ts` L63-66, `google.strategy.spec.ts` L63-66
- **Change**:
  ```typescript
  provide: OAuthStateStore,
  useValue: {
    generate: jest.fn(),
    validate: jest.fn(),
    getCodeVerifier: jest.fn(),  // NEW
  },
  ```

---

### Step 2: Add `authorizationParams()` tests — github.strategy.spec.ts

Add a new `describe('authorizationParams')` block after the existing `describe('validate')`. 3 test cases:

1. **With `code_challenge` → returns params with S256 default**
   - Input: `{ code_challenge: 'abc123' }`
   - Expected: `{ code_challenge: 'abc123', code_challenge_method: 'S256' }`

2. **With `code_challenge` + explicit `code_challenge_method` → uses provided method**
   - Input: `{ code_challenge: 'abc123', code_challenge_method: 'plain' }`
   - Expected: `{ code_challenge: 'abc123', code_challenge_method: 'plain' }`

3. **Without `code_challenge` → returns empty object**
   - Input: `{}`
   - Expected: `{}`

**Approach**: Call `strategy.authorizationParams(options)` directly — no mocking needed.

---

### Step 3: Add `authenticate()` tests — github.strategy.spec.ts

Add a new `describe('authenticate')` block. 4 test cases. Technical approach:

**Mocking `super.authenticate`**: Import `Strategy` from `passport-github2` and spy on its prototype:
```typescript
import { Strategy as PassportGitHubStrategy } from 'passport-github2';
// In each test:
const superAuthSpy = jest.spyOn(PassportGitHubStrategy.prototype, 'authenticate').mockImplementation(() => {});
```

**Mocking `_oauth2`**: Set `(strategy as any)._oauth2 = { getOAuthAccessToken: mockFn }` before calling authenticate.

Test cases:

1. **With code + state + codeVerifier in store → monkey-patches `_oauth2.getOAuthAccessToken`**
   - Setup: `oauthStateStore.getCodeVerifier.mockReturnValue('test-verifier')`, set `_oauth2` with mock `getOAuthAccessToken`
   - Call: `strategy.authenticate({ query: { code: 'auth-code', state: 'test-state' } })`
   - Verify: `_oauth2.getOAuthAccessToken` is now the wrapper (not the original). Call the wrapper with `(code, params, cb)` → `params.code_verifier === 'test-verifier'`, original fn called, original fn restored after call.
   - Also verify: `superAuthSpy` was called.

2. **With code + state + NO codeVerifier → calls super.authenticate without monkey-patch**
   - Setup: `oauthStateStore.getCodeVerifier.mockReturnValue(undefined)`, set `_oauth2`
   - Call: `strategy.authenticate({ query: { code: 'auth-code', state: 'test-state' } })`
   - Verify: `_oauth2.getOAuthAccessToken` is still the original mock. `superAuthSpy` was called.

3. **Without code in query → calls super.authenticate directly**
   - Call: `strategy.authenticate({ query: {} })`
   - Verify: `oauthStateStore.getCodeVerifier` NOT called. `superAuthSpy` was called.

4. **Monkey-patch restores original function after single use**
   - Same setup as test 1, but after calling the patched wrapper once, verify `_oauth2.getOAuthAccessToken` is restored to the original mock function.

---

### Step 4: Add `validate()` branch tests — github.strategy.spec.ts

Add to the existing `describe('validate')` block. 4 test cases:

1. **`displayName` undefined → firstName/lastName both undefined**
   - Profile: `{ emails: [{ value: '...' }], id: '...', displayName: undefined }`
   - Verify: `validateOAuthUser` called with `firstName: undefined, lastName: undefined`

2. **`displayName` single word → firstName only, lastName undefined**
   - Profile: `{ ..., displayName: 'Mononym' }`
   - Verify: `validateOAuthUser` called with `firstName: 'Mononym', lastName: undefined`

3. **`displayName` multi-word → firstName + lastName joined**
   - Profile: `{ ..., displayName: 'John Van Doe' }`
   - Verify: `validateOAuthUser` called with `firstName: 'John', lastName: 'Van Doe'`

4. **`authService.validateOAuthUser` throws → `done(err)` called**
   - Setup: `authService.validateOAuthUser.mockRejectedValue(new Error('OAuth error'))`
   - Verify: `done` called with the error

---

### Step 5: Add `authorizationParams()` tests — google.strategy.spec.ts

Identical 3 test cases as Step 2 (logic is identical between strategies).

---

### Step 6: Add `authenticate()` tests — google.strategy.spec.ts

Same 4 test cases as Step 3, but:
- Import `Strategy as PassportGoogleStrategy` from `passport-google-oauth20`
- Spy on `PassportGoogleStrategy.prototype.authenticate`

---

### Step 7: Add `validate()` branch test — google.strategy.spec.ts

1 test case (Google uses `profile.name?.givenName` / `profile.name?.familyName` — no displayName parsing):

1. **`authService.validateOAuthUser` throws → `done(err, undefined)` called**
   - Setup: `authService.validateOAuthUser.mockRejectedValue(new Error('OAuth error'))`
   - Verify: `done` called with `(error, undefined)`

---

### Step 8: Run tests and verify

- **Command**: `npx jest --passWithNoTests`
- **Expected**: All suites pass including the extended spec files
- **Run focused**: `npx jest github.strategy --verbose` and `npx jest google.strategy --verbose` to verify new tests

---

### Step 9: Run coverage and verify improvement

- **Command**: `npx jest --coverage --collectCoverageFrom='src/auth/strategies/{github,google}.strategy.ts'`
- **Expected**:
  - `github.strategy.ts`: stmts ≥95%, branches ≥90%, functions = 100%
  - `google.strategy.ts`: stmts ≥95%, branches ≥90%, functions = 100%

---

### Step 10: Update Technical Documentation

- Create `ai-specs/ai-specs/changes/records/SCRUM-91_backend.md`
- No `api-spec.yml` changes (no API changes)
- No `integration-state.md` changes (no module/guard changes)

## Implementation Order

1. Step 0: Create branch `feature/SCRUM-91-backend`
2. Step 1: Update OAuthStateStore mock (both files)
3. Steps 2-4: GitHub strategy tests (authorizationParams, authenticate, validate branches)
4. Steps 5-7: Google strategy tests (authorizationParams, authenticate, validate branch)
5. Step 8: Run tests
6. Step 9: Verify coverage
7. Step 10: Documentation

## Testing Checklist

- [ ] All 31 suites pass
- [ ] `authorizationParams()` — 3 tests per strategy (6 total)
- [ ] `authenticate()` — 4 tests per strategy (8 total)
- [ ] `validate()` GitHub displayName — 3 new tests
- [ ] `validate()` error propagation — 1 per strategy (2 total)
- [ ] `github.strategy.ts` functions = 100%
- [ ] `google.strategy.ts` functions = 100%
- [ ] `nest build` succeeds
- [ ] New test count: ~16 new tests across both files

## Dependencies

- None. No new libraries. Only extending existing spec files.

## Notes

- **Zero risk to production code**: No source files are modified.
- **Passport prototype mocking**: `jest.spyOn(Strategy.prototype, 'authenticate')` intercepts `super.authenticate` calls because `GitHubStrategy` → mixin → `Strategy` prototype chain. Must `mockRestore()` after each test to avoid leaks.
- **`_oauth2` internal**: Passport stores the OAuth2 client as `this._oauth2`. Setting it via `(strategy as any)._oauth2` is the standard approach for testing Passport strategies.
- **Import note**: `passport-github2` exports `Strategy` (not `{ Strategy }`), `passport-google-oauth20` exports `{ Strategy }`.

## Implementation Verification

- [ ] `getCodeVerifier` added to OAuthStateStore mock in both spec files
- [ ] `authorizationParams()` tests cover all 3 branches (with challenge, with method override, without challenge)
- [ ] `authenticate()` tests verify PKCE monkey-patch injection and restoration
- [ ] `validate()` GitHub displayName branches all covered (undefined, 1 word, 2+ words)
- [ ] Error propagation tested in both strategies
- [ ] `Strategy.prototype.authenticate` spy restored after each test
- [ ] All 31 suites pass, ~16 new tests
- [ ] Per-file coverage targets met
