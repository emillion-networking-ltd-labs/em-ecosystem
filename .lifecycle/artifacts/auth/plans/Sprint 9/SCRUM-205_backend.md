# Backend Implementation Plan: SCRUM-205 Add specs for OAuthLinkGuard and OAuthCallbackFilter

## Codebase State Snapshot

- **Date**: 2026-03-13
- **Last completed ticket**: SCRUM-204 (accessibility: aria-live regions and modal focus traps)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/auth/guards/oauth-link.guard.ts` — OAuthLinkGuard, constructor: `JwtService`, single method `canActivate(context: ExecutionContext): boolean`
  - `src/auth/guards/oauth-callback.filter.ts` — OAuthCallbackFilter, constructor: `ConfigService`, single method `catch(exception: unknown, host: ArgumentsHost)`
  - `src/auth/tests/oauth-guards.spec.ts` — existing spec covers GoogleAuthGuard/GitHubAuthGuard only, NOT OAuthLinkGuard or OAuthCallbackFilter
  - `src/common/constants/error-messages.ts` — `ErrorMessages.auth.AUTHENTICATION_FAILED = 'Authentication failed'`
- **Constructor signatures verified**:
  - `OAuthLinkGuard(jwtService: JwtService)` — 1 dependency
  - `OAuthCallbackFilter(configService: ConfigService)` — 1 dependency
- **Methods verified to exist**:
  - `OAuthLinkGuard.canActivate(context: ExecutionContext): boolean` — lines 18-42
  - `OAuthCallbackFilter.catch(exception: unknown, host: ArgumentsHost)` — lines 22-38
- **Discrepancies with integration-state.md**: None relevant — these are not module-level components

## Overview

Create unit test specs for two auth-critical components that currently have zero test coverage: OAuthLinkGuard (JWT validation for OAuth account linking) and OAuthCallbackFilter (error-to-redirect translation for OAuth callbacks). Tests only — no source file modifications.

## Architecture Context

- **OAuthLinkGuard**: CanActivate guard that extracts JWT from `Authorization: Bearer` header or `?token=` query param, verifies it via JwtService, and sets `req.user = { id: sub }` + `req.oauthAction = 'link'` for downstream OAuth guards
- **OAuthCallbackFilter**: ExceptionFilter that catches all exceptions on OAuth callback routes and redirects to `{frontendUrl}/auth/callback?error={encoded}` instead of returning JSON/HTML errors
- **Test location**: `src/auth/tests/` (follows project convention — centralized test directory per module)
- **Mock pattern**: Direct mock objects (not NestJS Test module) matching existing guard spec patterns (see `oauth-guards.spec.ts`)

## Implementation Steps

### Step 0: Create Feature Branch

- `git checkout main && git pull origin main`
- `git checkout -b feature/SCRUM-205-backend`

### Step 1: Create oauth-link.guard.spec.ts

- **File**: `src/auth/tests/oauth-link.guard.spec.ts`
- **Action**: Create unit test spec for OAuthLinkGuard

**Test scenarios (6 tests)**:

1. **Valid JWT in Authorization header** — mock `jwtService.verify` returns `{ sub: 'user-123' }`, pass `Authorization: Bearer valid-token`, assert: returns `true`, `req.user = { id: 'user-123' }`, `req.oauthAction = 'link'`
2. **Valid JWT in ?token= query param** — no Authorization header, `query.token = 'valid-token'`, assert same as above
3. **Prefers Authorization header over query param** — provide both header and query param with different tokens, assert `jwtService.verify` called with header token
4. **Throws UnauthorizedException when no token** — no header, no query param, assert throws `UnauthorizedException` with `ErrorMessages.auth.AUTHENTICATION_FAILED`
5. **Throws UnauthorizedException on invalid JWT** — mock `jwtService.verify` throws, assert throws `UnauthorizedException`
6. **Throws UnauthorizedException when header is not Bearer** — `Authorization: Basic xyz`, no query param, assert throws `UnauthorizedException`

**Mock setup**:
- `jwtService = { verify: jest.fn() }`
- `createMockContext(headers, query)` helper returning mock ExecutionContext with request object

### Step 2: Create oauth-callback.filter.spec.ts

- **File**: `src/auth/tests/oauth-callback.filter.spec.ts`
- **Action**: Create unit test spec for OAuthCallbackFilter

**Test scenarios (5 tests)**:

1. **Redirects on HttpException** — throw `new HttpException('msg', 400)`, assert `response.redirect` called with `{frontendUrl}/auth/callback?error={encoded}`
2. **Redirects on generic Error** — throw `new Error('something')`, assert same redirect
3. **Redirects on unknown exception** — throw string `'unknown'`, assert same redirect
4. **Logs warning with exception message for HttpException** — spy on Logger.warn, assert logged `OAuth callback failed: {message}`
5. **Logs warning with 'unknown error' for non-Error exception** — spy on Logger.warn, assert logged `OAuth callback failed with unknown error`

**Mock setup**:
- `configService = { get: jest.fn().mockReturnValue('https://frontend.test') }`
- `response = { redirect: jest.fn() }`
- `host = { switchToHttp: () => ({ getResponse: () => response }) }`
- Spy on `Logger.prototype.warn`

### Step 3: Run tests and verify coverage

- Run `npm test -- --testPathPattern="oauth-link.guard|oauth-callback.filter"` to verify all tests pass
- Run full test suite `npm test` to ensure no regressions
- Verify 100% line/branch coverage for both source files

### Step 4: Build verification and documentation

- `nest build` must compile clean
- Run `/update-docs SCRUM-205`

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Create oauth-link.guard.spec.ts (6 tests)
3. Step 2: Create oauth-callback.filter.spec.ts (5 tests)
4. Step 3: Run tests + verify coverage
5. Step 4: Build verification + documentation

## Testing Checklist

- [ ] OAuthLinkGuard: 6 tests pass
- [ ] OAuthCallbackFilter: 5 tests pass
- [ ] Full test suite passes (no regressions)
- [ ] 100% line/branch coverage for both source files
- [ ] nest build compiles clean
- [ ] No source file modifications (tests only)

## Error Response Format

N/A — tests only, no new endpoints.

## Dependencies

- No new dependencies — uses existing Jest, `@nestjs/common`, `@nestjs/jwt`, `@nestjs/config`

## Notes

- OAuthLinkGuard uses `else if` for query param extraction, meaning Authorization header takes precedence — test #3 verifies this
- OAuthCallbackFilter always redirects with the same generic error message (`ErrorMessages.auth.AUTHENTICATION_FAILED`) regardless of exception type — this is intentional to avoid leaking error details to the frontend
- Logger spy: use `jest.spyOn(Logger.prototype, 'warn')` since OAuthCallbackFilter creates its own Logger instance
