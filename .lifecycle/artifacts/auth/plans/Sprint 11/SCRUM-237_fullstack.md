# Fullstack Implementation Plan: SCRUM-237 — Replace OAuth Callback Query Param with httpOnly Cookie

## Codebase State Snapshot

- **Date**: 2026-03-15
- **Last completed ticket**: SCRUM-236 (Batch WARN remediation)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/auth/oauth.controller.ts` (254 lines)
  - `nexacore-api/src/auth/auth.service.ts` (lines 118-134)
  - `nexacore-api/src/auth/oauth-auth.service.ts` (lines 104-124)
  - `nexacore-api/src/auth/dto/oauth-exchange.dto.ts` (13 lines)
  - `nexacore-api/src/auth/tests/oauth.controller.spec.ts` (189 lines)
  - `nexacore-api/src/auth/tests/oauth-exchange.spec.ts` (160 lines)
  - `nexacore-dashboard/src/components/auth/OAuthCallbackHandler.tsx` (50 lines)
  - `nexacore-dashboard/src/context/AuthContext.tsx` (lines 308-322, 125)
  - `nexacore-dashboard/src/lib/api.ts` (line 49 — credentials: 'include')
- **Constructor signatures verified**:
  - `OAuthController(authService: AuthService, configService: ConfigService, oauthLinkCodeStore: OAuthLinkCodeStore)` — 3 deps
- **Methods verified to exist**:
  - `googleAuthCallback` — oauth.controller.ts:80-96
  - `githubAuthCallback` — oauth.controller.ts:125-141
  - `exchangeOAuthCode` — oauth.controller.ts:163-175
  - `getValidatedFrontendUrl` — oauth.controller.ts:239-253
  - `handleOAuthCallback` — AuthContext.tsx:308-322
- **Guard dependency chain verified**: GoogleAuthGuard, GitHubAuthGuard, OAuthLinkGuard — all within AuthModule
- **Discrepancies with integration-state.md**: None

---

## Architecture Context

### Cross-Cutting Concern: API Contract Change

The OAuth exchange endpoint (`POST /auth/oauth/exchange`) changes from **body-based** to **cookie-based** code delivery:

| Aspect | Before | After |
|--------|--------|-------|
| Code delivery (callback→frontend) | URL query param `?code=XXX` | httpOnly cookie `oauth_code` |
| Code submission (frontend→exchange) | POST body `{ "code": "XXX" }` | Cookie sent automatically |
| Frontend reads code? | Yes (`searchParams.get`) | No (httpOnly) |
| OAuthExchangeDto | Required (validates body) | Removed (no body needed) |

**Service layer unchanged**: `generateOAuthCode()` and `exchangeOAuthCode()` in `oauth-auth.service.ts` remain identical — only the transport mechanism changes at the controller level.

---

## Backend Implementation Steps

### Step 0: Create Feature Branch

- **Branch**: `feature/SCRUM-237`
- **From**: `main` (latest)
- **Commands**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-237`

### Step 1: Add `@Res()` to Callback Methods and Set Cookie

- **File**: `nexacore-api/src/auth/oauth.controller.ts`
- **Action**: Modify `googleAuthCallback` (line 80) and `githubAuthCallback` (line 125)
- **Implementation Steps**:
  1. Add `@Res({ passthrough: true }) res: Response` parameter to both methods
  2. After `generateOAuthCode()`, set cookie:
     ```typescript
     res.cookie('oauth_code', code, {
       httpOnly: true,
       secure: this.configService.get<string>('app.nodeEnv') === 'production',
       sameSite: 'strict',
       path: '/',
       maxAge: 30_000, // 30 seconds
     });
     ```
  3. Change return from `{ url: \`\${frontendUrl}/auth/callback?code=\${code}\` }` to `{ url: \`\${frontendUrl}/auth/callback\` }`
  4. Note: `path: '/'` instead of `path: '/auth'` because the frontend exchange POST goes to the API domain root, not `/auth`-scoped. The cookie must be sent with the `POST /auth/oauth/exchange` request.
- **Dependencies**: `Response` already imported (line 23)

### Step 2: Modify Exchange Endpoint to Read from Cookie

- **File**: `nexacore-api/src/auth/oauth.controller.ts`
- **Action**: Modify `exchangeOAuthCode` (line 163)
- **Implementation Steps**:
  1. Remove `@Body() dto: OAuthExchangeDto` parameter
  2. Add `@Request() req: { cookies: Record<string, string> }` parameter
  3. Read code: `const code = req.cookies?.['oauth_code']`
  4. If no code, throw `new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED)`
  5. After reading, clear cookie: `res.clearCookie('oauth_code', { path: '/' })`
  6. Pass `code` to `this.authService.exchangeOAuthCode(code)` — same as before
  7. Remove `OAuthExchangeDto` import from controller

### Step 3: Delete OAuthExchangeDto

- **File**: `nexacore-api/src/auth/dto/oauth-exchange.dto.ts`
- **Action**: Delete this file entirely — no longer needed
- **Implementation Steps**:
  1. Verify no other file imports `OAuthExchangeDto` (only oauth.controller.ts does)
  2. Delete the file
  3. Update `api-spec.yml` to reflect that `POST /auth/oauth/exchange` no longer accepts a request body

### Step 4: Update Backend Tests

- **File**: `nexacore-api/src/auth/tests/oauth.controller.spec.ts`
- **Action**: Update callback and exchange tests for cookie-based flow
- **Implementation Steps**:
  1. **Callback tests** (lines 111-149): Assert `result.url` is `http://localhost:3001/auth/callback` (no `?code=`). Assert `mockRes.cookie` was called with `'oauth_code'`, the code value, and correct options.
  2. **Exchange test** (lines 165-177): Change from passing `{ code: 'valid-code' }` as first arg to providing `req.cookies = { oauth_code: 'valid-code' }`. Assert `mockRes.clearCookie` was called.
  3. **Invalid code test** (lines 179-187): Same change — provide via `req.cookies`.
  4. Add `clearCookie: jest.fn()` to `mockRes`.

- **File**: `nexacore-api/src/auth/tests/oauth-exchange.spec.ts`
- **Action**: Update integration-style exchange tests
- **Implementation Steps**:
  1. **Full cycle test** (lines 112-134): After `googleAuthCallback`, instead of parsing URL for code, read from `mockRes.cookie` call args. Pass code via `req.cookies` to `exchangeOAuthCode`.
  2. **Replay test** (lines 136-150): Same pattern — get code from `mockRes.cookie` calls.
  3. **Fabricated code test** (lines 152-159): Provide `req.cookies = { oauth_code: 'fabricated-code-123' }`.
  4. **New test**: Add test for missing cookie — `req.cookies = {}` — expects UnauthorizedException.

---

## Frontend Implementation Steps

### Step 5: Modify OAuthCallbackHandler.tsx

- **File**: `nexacore-dashboard/src/components/auth/OAuthCallbackHandler.tsx`
- **Action**: Remove code reading from URL, simplify to just call exchange
- **Implementation Steps**:
  1. Remove `useSearchParams` import and usage (lines 4, 11)
  2. Remove `searchParams` from useEffect dependencies (line 36)
  3. Remove `const code = searchParams.get('code')` (line 18)
  4. Remove `const urlError = searchParams.get('error')` and its handling block (lines 19-26)
  5. Keep URL error handling — but read it differently. The backend redirect on error still uses `?error=` in URL. So keep `useSearchParams` ONLY for error reading.
  6. **Revised approach**: Keep `useSearchParams` for error param only. Remove code param reading. Change the flow:
     ```typescript
     const urlError = searchParams.get('error');
     if (urlError) {
       // existing error handling
       return;
     }
     // No code check needed — cookie carries it
     handleOAuthCallback().catch(() => { ... });
     ```
  7. Remove the `!code` guard block (lines 28-31) — no longer applicable
  8. Remove `Suspense` wrapper from page.tsx is NOT needed — keep it, `useSearchParams` still used for errors

### Step 6: Modify AuthContext.tsx handleOAuthCallback

- **File**: `nexacore-dashboard/src/context/AuthContext.tsx`
- **Action**: Remove code parameter from handleOAuthCallback
- **Implementation Steps**:
  1. Change type signature (line 125): `handleOAuthCallback: () => Promise<void>`
  2. Change implementation (line 308): `const handleOAuthCallback = useCallback(async () => {`
  3. Change API call (lines 312-316): Send empty body or no body:
     ```typescript
     const data = await apiClient.post<AuthResponse>("/auth/oauth/exchange");
     ```
  4. `credentials: 'include'` is already set globally in `api.ts:49` — the `oauth_code` cookie will be sent automatically
  5. Remove `code` from `useCallback` dependencies if present

---

## Implementation Order

1. Step 0: Create feature branch `feature/SCRUM-237`
2. Step 1: Modify callback methods to set cookie (backend)
3. Step 2: Modify exchange endpoint to read from cookie (backend)
4. Step 3: Delete OAuthExchangeDto (backend)
5. Step 4: Update backend tests
6. Step 5: Modify OAuthCallbackHandler.tsx (frontend)
7. Step 6: Modify AuthContext.tsx (frontend)
8. Step 7: Run all tests, verify build
9. Step 8: Update technical documentation

## Testing Checklist

### Backend
- [ ] Callback tests assert cookie set, no `?code=` in URL
- [ ] Exchange test reads code from cookie, clears after use
- [ ] Missing cookie returns 401
- [ ] Replay attack (used code) returns 401
- [ ] Fabricated code returns 401
- [ ] All 889+ existing tests pass

### Frontend
- [ ] OAuthCallbackHandler calls exchange without code in body
- [ ] Error param from URL still works
- [ ] Build succeeds with no TypeScript errors

## Error Response Format

| Scenario | HTTP Status | Response |
|----------|-------------|----------|
| Missing oauth_code cookie | 401 | `{ "message": "Authentication failed", "statusCode": 401 }` |
| Expired/consumed code | 401 | `{ "message": "Authentication failed", "statusCode": 401 }` |
| Rate limited | 429 | `{ "message": "ThrottlerException: Too Many Requests", "statusCode": 429 }` |

## Dependencies

- No new dependencies required
- `cookie-parser` already configured in main.ts (used for refresh tokens)
- `@Res({ passthrough: true })` already used in other controller methods

## Notes

- **Service layer untouched**: `generateOAuthCode()` and `exchangeOAuthCode()` in oauth-auth.service.ts remain identical
- **OAuth link flow**: The link flow (link/google, link/github) uses the same callbacks — the cookie approach applies to linking too
- **Cookie domain**: Uses default (current domain) — correct for same-origin API
- **Secure flag**: Must be `true` in production, `false` in development (same pattern as refresh_token cookie)
- **SameSite=strict**: Prevents CSRF — the cookie is only sent on same-site requests
- **30s TTL**: Matches the existing OAuthCodeStore TTL for the ephemeral code

## Next Steps After Implementation

1. Run `/verify SCRUM-237` quality gate
2. Run `/commit SCRUM-237`
3. Run `/update-docs SCRUM-237`

## Implementation Verification

- [ ] No `?code=` appears in any redirect URL
- [ ] Cookie `oauth_code` is httpOnly, secure (in prod), sameSite=strict
- [ ] Cookie cleared after exchange
- [ ] All tests pass (889+)
- [ ] Build succeeds
- [ ] No TypeScript errors
- [ ] api-spec.yml updated (exchange endpoint body removed)
