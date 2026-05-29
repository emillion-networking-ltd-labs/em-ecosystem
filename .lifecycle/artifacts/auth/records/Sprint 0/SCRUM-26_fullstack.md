# Implementation Record: SCRUM-26 Token Lifecycle & Session Management

## Summary

Replaced single-refresh-token-per-user with a Session-based model supporting refresh token rotation, token family theft detection, session management API, httpOnly cookies set directly by the backend, and a frontend ActiveSessions viewer. Eliminated the BFF intermediary routes in favor of direct `credentials: 'include'` calls.

- **Scope**: fullstack
- **Branch**: `feature/SCRUM-23-oauth-security-hardening`
- **Implementation date**: 2026-02-26

## Plan Reference

- **Plan**: `ai-specs/changes/plans/SCRUM-26_fullstack.md`
- **Plan followed**: Partially — 10 deviations, mostly simplifications removing unnecessary abstractions, one endpoint naming difference, and BFF deletion instead of update. All functional requirements met. Plan had stale snapshots (pre-SCRUM-23/24/25) which were correctly handled by merging into existing code.

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `299a98d` | feat(SCRUM-26): token lifecycle & session management — full-stack | 33 files (see below) |

**Files created (7):**
- `nexacore-api/prisma/migrations/20260226220000_add_sessions_remove_user_refresh_token/migration.sql` — Session table, 3 indexes, drop User.refreshToken
- `nexacore-api/src/sessions/sessions.module.ts` — SessionsModule exporting SessionsService
- `nexacore-api/src/sessions/sessions.service.ts` — Full service: createSession, rotateRefreshToken (theft detection), revokeSession, revokeAllUserSessions, revokeAllByFamily, getActiveSessions, updateSessionHash
- `nexacore-api/src/sessions/entities/session.entity.ts` — Session, SessionResponse interfaces, `toSessionResponse()` helper
- `nexacore-api/src/auth/interfaces/refresh-token-payload.interface.ts` — `RefreshTokenPayload { sub, sessionId, family }`
- `nexacore-dashboard/src/components/profile/ActiveSessions.tsx` — Session viewer with per-session revoke, revoke-all, UA parsing, relative timestamps, lucide-react icons, project Button component

**Files modified (21):**
- `nexacore-api/prisma/schema.prisma` — Added Session model with all fields and indexes, removed User.refreshToken, added `sessions Session[]` relation
- `nexacore-api/package.json` / `package-lock.json` — Added `cookie-parser` + `@types/cookie-parser`
- `nexacore-api/src/main.ts` — Added `cookie-parser` middleware, `credentials: true` to CORS
- `nexacore-api/src/auth/auth.service.ts` — Major rewrite: CookieConfig type, session-based generateTokens (two-phase), refreshTokens with rotation, buildRefreshCookie/buildClearCookie. Preserved SCRUM-23 OAuthCodeStore, SCRUM-24 timing attack protection + exponential lockout, SCRUM-25 audit calls.
- `nexacore-api/src/auth/auth.controller.ts` — Cookie-based flow via `@Res({passthrough:true})`, new endpoints (GET /auth/sessions, DELETE /auth/sessions/:id, POST /auth/logout-all), extractRequestMeta/setCookie/getCurrentSessionId helpers. Preserved SCRUM-24 @Throttle decorators, SCRUM-23 ephemeral code exchange.
- `nexacore-api/src/auth/auth.module.ts` — Imported SessionsModule
- `nexacore-api/src/auth/stores/oauth-code.store.ts` — Payload changed from `{ refreshToken }` to `{ cookie: CookieConfig }`
- `nexacore-api/src/auth/strategies/google.strategy.ts` — Expanded req type, extracts requestMeta, passes to validateOAuthUser
- `nexacore-api/src/auth/strategies/github.strategy.ts` — Same changes as Google strategy
- `nexacore-api/src/users/entities/user.entity.ts` — Removed `refreshToken` from User, updated SafeUser Omit
- `nexacore-api/src/users/users.service.ts` — Removed `updateRefreshToken()`, injected SessionsService, `changePassword()` revokes all sessions
- `nexacore-api/src/users/users.module.ts` — Imported SessionsModule
- `nexacore-api/src/auth/tests/auth.service.spec.ts` — Complete rewrite: SessionsService mock, requestMeta params, cookie assertions
- `nexacore-api/src/auth/tests/auth.controller.spec.ts` — Complete rewrite: SessionsService/JwtService/AuditService mocks, response mock, cookie flow tests, session endpoint tests
- `nexacore-api/src/auth/tests/oauth-code.store.spec.ts` — Payload uses cookie instead of refreshToken
- `nexacore-api/src/auth/tests/oauth-exchange.spec.ts` — AuditService mock, cookie flow, response mock
- `nexacore-api/src/auth/tests/google.strategy.spec.ts` — requestMeta in validateOAuthUser assertion
- `nexacore-api/src/auth/tests/github.strategy.spec.ts` — Same changes as Google
- `nexacore-api/src/users/tests/users.service.spec.ts` — Removed refreshToken from mock, added SessionsService mock
- `nexacore-dashboard/src/lib/types.ts` — Removed `refreshToken` from AuthResponse, added `SessionResponse` type
- `nexacore-dashboard/src/lib/api.ts` — Added `credentials: 'include'` on all fetch, silentRefresh calls backend directly, exported API_BASE_URL
- `nexacore-dashboard/src/context/AuthContext.tsx` — Removed all BFF set-tokens calls, refreshSession/logout call backend directly with `credentials: 'include'`
- `nexacore-dashboard/src/app/profile/page.tsx` — Added ActiveSessions component

**Files deleted (3):**
- `nexacore-dashboard/src/app/api/auth/set-tokens/route.ts` — BFF no longer needed
- `nexacore-dashboard/src/app/api/auth/refresh/route.ts` — BFF no longer needed
- `nexacore-dashboard/src/app/api/auth/logout/route.ts` — BFF no longer needed

## Deviations from Plan

| # | Planned | Actual | Reason |
|---|---------|--------|--------|
| 1 | Create `@Cookies()` decorator (Step 6) | Access `req.cookies['refresh_token']` directly | Custom decorator adds abstraction for a single usage. Direct access is simpler and equally readable. |
| 2 | Create `jwt-refresh.strategy.ts` + `jwt-refresh-auth.guard.ts` (Files to Create table) | Controller verifies refresh JWT directly via `jwtService.verify()` | A separate Passport strategy/guard is over-engineered for cookie-based refresh where the controller already has the token. The guard pattern doesn't add value when there's no standardized extraction mechanism (cookie vs header vs body varies per endpoint). |
| 3 | `DELETE /auth/sessions` for revoke-all (Step 8, line 1356) | `POST /auth/logout-all` | POST is more semantically appropriate for a mutation that affects all sessions. DELETE on a collection is less intuitive. Frontend ActiveSessions component matches this endpoint. |
| 4 | `GET /auth/sessions` returns `{ sessions: [...] }` wrapper (Step 8, line 1322) | Returns array directly `SessionResponse[]` | Consistent with other endpoints that return flat arrays. Frontend `apiClient.get<SessionResponse[]>` matches. No pagination needed for user's own sessions (typically <10). |
| 5 | Logout endpoint uses `@UseGuards(JwtAuthGuard)` (Step 8, line 1255) | No auth guard on logout — reads token from cookie only | Improvement: allows logout even when access token is expired. User should always be able to end their session regardless of AT validity. |
| 6 | Update BFF routes (Steps 17-19): proxy cookies in refresh, forward cookie in logout, deprecate set-tokens | Deleted all 3 BFF routes entirely | With `credentials: 'include'` on direct backend calls, the BFF intermediary is completely unnecessary. Deleted code is better than deprecated code — no maintenance burden, no confusion. |
| 7 | OAuth callbacks set cookie + redirect with `accessToken` in URL (Step 8, plan line 1391-1433) | Preserve SCRUM-23's ephemeral code flow: redirect with `code` param → exchange via POST /auth/oauth/exchange (sets cookie) | Plan snapshot was pre-SCRUM-23. The ephemeral code approach is more secure (no tokens in URL). Correctly merged SCRUM-26 cookie support into existing SCRUM-23 flow. |
| 8 | `ParseUUIDPipe` on session ID param (Step 8, line 1333) | No UUID validation on param | Minor — backend returns 404 for non-existent sessions regardless. Could be added later for stricter input validation. |
| 9 | `cleanupExpiredSessions()` method in SessionsService (Step 3, line 676-687) | Not implemented | Housekeeping/cron method for production. Not required for core functionality. Can be added in a future ops ticket. |
| 10 | 3 dedicated test files: `token-rotation.spec.ts`, `theft-detection.spec.ts`, `session-management.spec.ts` | Not created as separate files | Existing test suites (auth.service.spec.ts, auth.controller.spec.ts) were comprehensively updated to cover all rotation, theft detection, and session management scenarios. 141 tests pass. Dedicated files would have been duplicative. |

## Subtask Mapping

| Key | Plan Description | Implemented? |
|-----|-----------------|-------------|
| SCRUM-50 | Refresh token rotation with old-token invalidation | YES — `rotateRefreshToken()` revokes old session, creates new in same family |
| SCRUM-51 | Token family tracking and theft detection | YES — revoked session reuse triggers `revokeAllByFamily()` |
| SCRUM-52 | Session model: store active sessions in database | YES — Prisma model, migration, entity, service, module |
| SCRUM-53 | GET /auth/sessions — list active sessions | YES — returns `SessionResponse[]` with `isCurrent` flag |
| SCRUM-54 | Revocation endpoints | YES — DELETE /auth/sessions/:id + POST /auth/logout-all |
| SCRUM-55 | Refresh token in httpOnly cookie | YES — cookie-parser, CORS credentials, `@Res({passthrough:true})` |
| SCRUM-56 | Frontend session viewer | YES — ActiveSessions component on profile page |

## Test Results

- **Unit tests**: 141 passed / 0 failed (16 suites)
- **Backend build**: `nest build` succeeded with no TypeScript errors
- **Frontend build**: `next build` compiled + type-checked OK (10 routes, 12 static pages)

## Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| TS1272: `import { Response } from 'express'` in auth.controller.ts fails with `isolatedModules + emitDecoratorMetadata` | MEDIUM | Fixed | Changed to `import type { Response } from 'express'` — type-only import required when used in decorator position |
| TS2345: Controller re-mapping `toSessionResponse()` on already-mapped data | LOW | Fixed | `getActiveSessions()` already returns `SessionResponse[]`, removed redundant mapping in controller |
| TS2345: AuthResult not assignable to `Record<string, unknown>` in github strategy done callback | LOW | Fixed | Changed done parameter type to `(error: Error | null, user?: unknown) => void` |
| TS2349: `import * as cookieParser from 'cookie-parser'` — namespace import not callable | MEDIUM | Fixed | Changed to `import cookieParser from 'cookie-parser'` (default import) |
| RolesGuard AuditService dependency missing in test modules | MEDIUM | Fixed | Added AuditService mock provider to auth.controller.spec.ts and oauth-exchange.spec.ts (cascading from SCRUM-25) |
| SCRUM-24 rate limit keys shared across all endpoints | HIGH | Fixed | `CustomThrottlerGuard.generateKey()` produced `throttlerName-ip-ip` (no route info), so all endpoints shared one counter per IP. After 3 register attempts, login/OAuth/refresh were all blocked. Fix: added class + handler names to key. See commit `c121bcd`, documented in SCRUM-24 record addendum. |

## Documentation Updates

Deferred — same as SCRUM-23, SCRUM-24, and SCRUM-25. API spec, data model, and standards docs will be updated in batch after the SCRUM-22 epic completes.

## Lessons Learned

- **BFF elimination is cleaner than BFF update**: When the backend can set cookies directly (same-site or CORS with `credentials:true`), the BFF proxy pattern adds complexity without value. Deleting the intermediary is better than maintaining a deprecated proxy layer.
- **Plan snapshots go stale across chained tickets**: SCRUM-26's plan had pre-SCRUM-23/24/25 snapshots in code blocks. The correct approach is to MERGE new functionality into existing code, never replace. This was noted in the plan's own "Critical: Stale Snapshots" section and was handled correctly.
- **Two-phase token generation is necessary**: The session ID must be in the JWT, but the JWT must be created after the session record exists. The temp-hash → sign → update-hash pattern solves the chicken-and-egg problem cleanly.
- **`import type` for express.Response**: When TypeScript's `isolatedModules` + `emitDecoratorMetadata` are both enabled, decorated parameter types must use `import type` syntax. This is not documented in NestJS guides but is a common gotcha.
- **Optional auth on logout is better UX**: Requiring a valid access token to logout creates a dead-end when the AT expires. Reading the refresh token from the cookie (without AT validation) ensures users can always end their session.
