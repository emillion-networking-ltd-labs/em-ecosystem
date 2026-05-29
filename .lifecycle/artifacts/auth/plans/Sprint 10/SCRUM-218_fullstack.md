# Fullstack Implementation Plan: SCRUM-218 — Remove JWT from query param in OAuth link (V8.3.1)

## 1. Codebase State Snapshot

- **Date**: 2026-03-13
- **Last completed ticket**: SCRUM-217 (user enumeration fix, commit 9f6131b)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/auth/guards/oauth-link.guard.ts` (43 lines) — current guard, accepts JWT via `?token=` and `Authorization: Bearer`
  - `nexacore-api/src/auth/oauth.controller.ts` (237 lines) — OAuthController with 2 DI deps (AuthService, ConfigService)
  - `nexacore-api/src/auth/auth.module.ts` (102 lines) — providers include OAuthLinkGuard, OAuthStateStore, OAuthCodeStore
  - `nexacore-api/src/auth/stores/oauth-state.store.ts` (61 lines) — Redis-backed, uses `@Inject(REDIS_CLIENT)`
  - `nexacore-api/src/auth/stores/oauth-code.store.ts` (47 lines) — Redis-backed, same pattern, 60s TTL
  - `nexacore-api/src/auth/tests/oauth-link.guard.spec.ts` (101 lines) — 6 tests
  - `nexacore-dashboard/src/components/profile/ConnectedAccounts.tsx` (220 lines) — uses `window.location.href` with `?token=`
  - `nexacore-dashboard/src/lib/oauth-api.ts` (13 lines) — unlinkOAuth + getLinkedProviders
- **Constructor signatures verified**:
  - `OAuthLinkGuard(jwtService: JwtService)` — 1 dep
  - `OAuthController(authService: AuthService, configService: ConfigService)` — 2 deps
  - `OAuthStateStore(@Inject(REDIS_CLIENT) redis: Redis)` — 1 dep (Redis pattern)
  - `OAuthCodeStore(@Inject(REDIS_CLIENT) redis: Redis)` — 1 dep (Redis pattern)
- **Methods verified to exist**:
  - `OAuthLinkGuard.canActivate()` — oauth-link.guard.ts:18
  - `OAuthController.googleLinkAuth()` — oauth.controller.ts:194
  - `OAuthController.githubLinkAuth()` — oauth.controller.ts:217
- **Guard dependency chain verified**:
  - `OAuthLinkGuard` → currently depends on `JwtService` (from JwtModule in AuthModule)
  - After change: `OAuthLinkGuard` → depends on `OAuthLinkCodeStore` (new provider in AuthModule)
- **Discrepancies with integration-state.md**: None

## 2. Overview

Replace the JWT access token in the OAuth link URL query parameter (`?token=`) with a short-lived, single-use, Redis-backed linking code (`?code=`). This eliminates token leakage via server logs, proxy logs, browser history, and Referer headers. Follows the existing store pattern (OAuthStateStore, OAuthCodeStore) for consistency.

## 3. Architecture Context

### Cross-cutting: API Contract

- **New endpoint**: `POST /auth/link/code` — protected by JwtAuthGuard, returns `{ code: string }`
- **Modified endpoints**: `GET /auth/link/google` and `GET /auth/link/github` — now accept `?code=` instead of `?token=`
- Frontend calls new endpoint first (with Authorization header), then redirects with the code

### Backend

| Component | File | Action |
|-----------|------|--------|
| OAuthLinkCodeStore | `src/auth/stores/oauth-link-code.store.ts` | CREATE |
| OAuthLinkGuard | `src/auth/guards/oauth-link.guard.ts` | MODIFY |
| OAuthController | `src/auth/oauth.controller.ts` | MODIFY |
| AuthModule | `src/auth/auth.module.ts` | MODIFY |

### Frontend

| Component | File | Action |
|-----------|------|--------|
| oauth-api | `src/lib/oauth-api.ts` | MODIFY |
| ConnectedAccounts | `src/components/profile/ConnectedAccounts.tsx` | MODIFY |

---

## BACKEND

### Step 0: Create Feature Branch

- **Action**: Create and switch to feature branch
- **Branch**: `feature/SCRUM-218-fullstack`
- **Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-218-fullstack`

### Step 1: Create OAuthLinkCodeStore

- **File**: `nexacore-api/src/auth/stores/oauth-link-code.store.ts`
- **Action**: Create Redis-backed store following the OAuthCodeStore pattern
- **Implementation Steps**:
  1. Create `OAuthLinkCodeStore` class with `@Injectable()` decorator
  2. Inject `REDIS_CLIENT` (same pattern as OAuthStateStore and OAuthCodeStore)
  3. `LINK_CODE_TTL_SECONDS = 60` (60 seconds, matching OAuthCodeStore)
  4. Redis key prefix: `oauth:link-code:`
  5. Methods:
     - `generate(userId: string): Promise<string>` — creates `randomBytes(32).toString('hex')` code (64-char hex), stores `{ userId }` in Redis with TTL, returns code
     - `consume(code: string): Promise<string | null>` — atomic get + delete (single-use), returns userId or null if expired/invalid/already used
- **Dependencies**: `@nestjs/common` (Injectable, Inject), `crypto` (randomBytes), `ioredis` (Redis), `REDIS_CLIENT`
- **Notes**: Using Redis (not in-memory Map) for consistency with existing stores and to work across multiple server instances. Using `randomBytes(32)` not `randomUUID` for higher entropy.

### Step 2: Refactor OAuthLinkGuard

- **File**: `nexacore-api/src/auth/guards/oauth-link.guard.ts`
- **Action**: Replace JWT verification with link code consumption
- **Implementation Steps**:
  1. Remove `JwtService` import and constructor dep
  2. Remove `JwtPayload` import
  3. Inject `OAuthLinkCodeStore` instead
  4. In `canActivate()`:
     - Read `request.query?.code` (not `token`)
     - If no code, throw `UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED)`
     - Call `await this.oauthLinkCodeStore.consume(code)`
     - If null (invalid/expired/used), throw `UnauthorizedException`
     - Set `request.user = { id: userId }` and `request.oauthAction = 'link'`
     - Return true
  5. Change `canActivate` to `async canActivate` (consume is async)
  6. Update JSDoc to reflect new behavior
- **Notes**: Remove ALL references to JWT/token from this guard. The Authorization header path is also removed — only `?code=` is accepted now.

### Step 3: Add POST /auth/link/code Endpoint

- **File**: `nexacore-api/src/auth/oauth.controller.ts`
- **Action**: Add new endpoint to generate link codes
- **Implementation Steps**:
  1. Add `OAuthLinkCodeStore` as 3rd constructor dep: `private readonly oauthLinkCodeStore: OAuthLinkCodeStore`
  2. Add `JwtAuthGuard` import
  3. Add new method above the link endpoints section:
     ```
     @Post('link/code')
     @UseGuards(JwtAuthGuard)
     @HttpCode(HttpStatus.CREATED)
     @ApiBearerAuth()
     @ApiOperation({ summary: 'Generate short-lived code for OAuth account linking' })
     @ApiResponse({ status: 201, description: 'Link code generated' })
     @ApiResponse({ status: 401, description: 'Unauthorized' })
     async generateLinkCode(@Request() req: { user: { id: string } }) {
       const code = await this.oauthLinkCodeStore.generate(req.user.id);
       return { code };
     }
     ```
  4. Update comments on `googleLinkAuth()` and `githubLinkAuth()` — replace "JWT" references with "link code"
- **Dependencies**: `JwtAuthGuard` from `./guards/jwt-auth.guard`, `OAuthLinkCodeStore` from `./stores/oauth-link-code.store`

### Step 4: Register OAuthLinkCodeStore in AuthModule

- **File**: `nexacore-api/src/auth/auth.module.ts`
- **Action**: Add new store to providers
- **Implementation Steps**:
  1. Add import: `import { OAuthLinkCodeStore } from './stores/oauth-link-code.store';`
  2. Add `OAuthLinkCodeStore` to `providers` array (after `OAuthCodeStore`)
  3. No export needed — only used within AuthModule
- **Notes**: OAuthLinkGuard already gets `OAuthLinkCodeStore` via DI since both are in the same module

### Step 5: Update Tests — oauth-link.guard.spec.ts

- **File**: `nexacore-api/src/auth/tests/oauth-link.guard.spec.ts`
- **Action**: Rewrite tests for link code validation instead of JWT
- **Implementation Steps**:
  1. Replace `JwtService` mock with `OAuthLinkCodeStore` mock (`{ generate: jest.fn(), consume: jest.fn() }`)
  2. Update `createMockContext` — query param is now `code` not `token`
  3. Test cases:
     - Valid code → sets req.user + req.oauthAction, returns true
     - Invalid/expired code (consume returns null) → UnauthorizedException
     - Missing code → UnauthorizedException
     - Verify consume is called with the code value
  4. Remove tests for: Authorization header, Bearer scheme, header priority over query

### Step 6: Create Tests — oauth-link-code.store.spec.ts

- **File**: `nexacore-api/src/auth/tests/oauth-link-code.store.spec.ts`
- **Action**: Create unit tests for the new store
- **Implementation Steps**:
  1. Mock `REDIS_CLIENT` with `{ set: jest.fn(), get: jest.fn(), del: jest.fn() }`
  2. Test cases:
     - `generate()`: returns 64-char hex string, calls `redis.set` with correct key prefix and TTL
     - `consume()`: returns userId when key exists, calls `redis.del` after get (single-use)
     - `consume()`: returns null when key doesn't exist (expired/invalid)
     - `consume()`: returns null when redis.get returns null

---

## FRONTEND

### Step 7: Add generateLinkCode to oauth-api.ts

- **File**: `nexacore-dashboard/src/lib/oauth-api.ts`
- **Action**: Add API method for the new endpoint
- **Implementation Steps**:
  1. Add function:
     ```typescript
     export function generateLinkCode(): Promise<{ code: string }> {
       return apiClient.post<{ code: string }>('/auth/link/code', {});
     }
     ```
  2. This uses apiClient which automatically includes the Authorization header

### Step 8: Update ConnectedAccounts.tsx

- **File**: `nexacore-dashboard/src/components/profile/ConnectedAccounts.tsx`
- **Action**: Use link code instead of JWT in redirect URL
- **Implementation Steps**:
  1. Add import: `import { generateLinkCode } from '@/lib/oauth-api';`
  2. Remove `accessToken` from `useAuth()` destructuring (no longer needed for linking)
  3. Make `handleConnect` async:
     ```typescript
     const handleConnect = async (providerId: string) => {
       try {
         const { code } = await generateLinkCode();
         const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
         window.location.href = `${apiUrl}/auth/link/${providerId.toLowerCase()}?code=${encodeURIComponent(code)}`;
       } catch {
         addToast({ variant: 'error', title: 'Connection failed', description: 'Could not initiate account linking. Please try again.' });
       }
     };
     ```
  4. Add loading state for the connect button to prevent double-clicks during the async call
- **Notes**: `accessToken` may still be needed by other parts of the component or parent — only remove from destructuring if truly unused after this change. Check carefully.

### Step 9: Update Technical Documentation

- **Action**: Update api-spec.yml and integration-state.md
- **Implementation Steps**:
  1. **api-spec.yml**:
     - Add `POST /auth/link/code` endpoint (201 response with `{ code: string }`, 401 unauthorized)
     - Update `GET /auth/link/google` and `GET /auth/link/github` — query param from `token` (JWT) to `code` (link code)
  2. **integration-state.md**:
     - Update Guard Dependency Map: `OAuthLinkGuard` → deps change from `JwtService` to `OAuthLinkCodeStore`
     - Add `OAuthLinkCodeStore` to AuthModule providers list
     - Add changelog entry

---

## 4. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Create OAuthLinkCodeStore (new Redis store)
3. Step 2: Refactor OAuthLinkGuard (JWT → link code)
4. Step 3: Add POST /auth/link/code endpoint
5. Step 4: Register in AuthModule
6. Step 5: Update guard tests
7. Step 6: Create store tests
8. Step 7: Add generateLinkCode to frontend API
9. Step 8: Update ConnectedAccounts
10. Step 9: Update documentation

## 5. Testing Checklist

- [ ] OAuthLinkCodeStore: generate returns 64-char hex, consume returns userId, consume is single-use, expired codes return null
- [ ] OAuthLinkGuard: valid code accepted, invalid/missing code rejected with UnauthorizedException
- [ ] POST /auth/link/code: requires JwtAuthGuard, returns 201 with code
- [ ] OAuth link flow: Google and GitHub linking still works end-to-end
- [ ] No JWT appears in any URL at any point in the flow
- [ ] All existing tests pass (`npm test`)
- [ ] Frontend: ConnectedAccounts connect button triggers async flow, handles errors

## 6. Error Response Format

| Scenario | Status | Body |
|----------|--------|------|
| No auth on POST /auth/link/code | 401 | `{ statusCode: 401, message: "Unauthorized" }` |
| Invalid/expired link code on GET /auth/link/{provider} | 401 | `{ statusCode: 401, message: "Authentication failed" }` |
| Rate limited | 429 | `{ statusCode: 429, message: "ThrottlerException: Too Many Requests" }` |

## 7. Dependencies

- No new external dependencies
- Uses existing: `ioredis` (Redis client), `crypto` (Node.js built-in)

## 8. Notes

- **Why Redis, not in-memory Map**: OAuthStateStore and OAuthCodeStore both use Redis. Using the same pattern ensures consistency and works in multi-instance deployments.
- **Why 60s TTL**: Matches OAuthCodeStore. The code is generated immediately before redirect — 60s is more than enough for the round-trip.
- **Why randomBytes(32) not randomUUID**: Higher entropy (256 bits vs 122 bits). UUIDs are predictable in structure.
- **`accessToken` in ConnectedAccounts**: After removing the `?token=` usage, verify if `accessToken` is still used elsewhere in the component. If not, remove from destructuring.
- **No breaking change to callback flow**: The OAuth callback (`/google/callback`, `/github/callback`) is unchanged — it still uses OAuthCodeStore for the authorization code exchange.

## 9. Security References

- OWASP ASVS V8.3.1 — session tokens not in URL parameters
- RFC 6750 §2.3 — bearer tokens in URI "SHOULD NOT be used"
- CWE-598 — Use of GET Request Method With Sensitive Query Strings

## 10. Implementation Verification

- [ ] No JWT/access token appears in any URL (grep codebase for `?token=` in auth link context)
- [ ] Link code is cryptographically random (randomBytes, not Math.random or randomUUID)
- [ ] Link code is single-use (Redis delete after consumption)
- [ ] Link code expires in 60 seconds (Redis TTL)
- [ ] Guard Dependency Map updated in integration-state.md
- [ ] api-spec.yml has new POST /auth/link/code endpoint
- [ ] All tests pass
- [ ] Prettier formatting passes
