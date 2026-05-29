# Backend Implementation Plan: SCRUM-254 — Update Guard Chain Table in integration-state.md

## 1. Header

- **Ticket**: SCRUM-254
- **Type**: Documentation fix (no code changes)
- **Severity**: HIGH
- **Sprint**: 11 (Security II)
- **Parent**: SCRUM-253

## 2. Codebase State Snapshot

- **Date**: 2026-03-16
- **Last completed ticket**: SCRUM-252 (Jest coverage V8)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/auth/auth.controller.ts` — AuthController: DI(AuthService, PermissionsService), methods: csrf-token, register, login, refresh, logout, logout-all, me, admin
  - `nexacore-api/src/auth/account.controller.ts` — AccountController: DI(AuthService), methods: verify-email(POST, @SkipCsrf, @Throttle), verify-email-change(POST, @SkipCsrf, @Throttle), resend-verification(POST, JwtAuthGuard), resend-verification-public(POST, TurnstileGuard, @SkipCsrf, @Throttle), forgot-password(POST, TurnstileGuard, @SkipCsrf, @Throttle), reset-password(POST, @SkipCsrf, @Throttle), validate-reset-token(POST, @SkipCsrf)
  - `nexacore-api/src/auth/oauth.controller.ts` — OAuthController: DI(AuthService, ConfigService, OAuthLinkCodeStore), methods: google(GET, GoogleAuthGuard, @Throttle), google/callback(GET, GoogleAuthGuard, @SkipThrottle, @UseFilters), github(GET, GitHubAuthGuard, @Throttle), github/callback(GET, GitHubAuthGuard, @SkipThrottle, @UseFilters), oauth/exchange(POST, @Throttle), link/code(POST, JwtAuthGuard), link/google(GET, OAuthLinkGuard+GoogleAuthGuard, @Throttle, @ApiBearerAuth), link/github(GET, OAuthLinkGuard+GitHubAuthGuard, @Throttle, @ApiBearerAuth)
  - `nexacore-api/src/auth/session.controller.ts` — SessionController: DI(SessionsService, TrustedDeviceService, JwtService), methods: sessions(GET, JwtAuthGuard), sessions/:id(DELETE, JwtAuthGuard), trusted-devices(POST, JwtAuthGuard, @Throttle), trusted-devices(GET, JwtAuthGuard), trusted-devices(DELETE, JwtAuthGuard), trusted-devices/:id(DELETE, JwtAuthGuard)
  - `nexacore-api/src/auth/mfa.controller.ts` — MfaController (already correct in docs)
  - `nexacore-api/src/auth/passkey.controller.ts` — PasskeyController (already correct in docs)
- **Constructor signatures verified**:
  - `AuthController(authService: AuthService, permissionsService: PermissionsService)` — 2 DI deps
  - `AccountController(authService: AuthService)` — 1 DI dep
  - `OAuthController(authService: AuthService, configService: ConfigService, oauthLinkCodeStore: OAuthLinkCodeStore)` — 3 DI deps
  - `SessionController(sessionsService: SessionsService, trustedDeviceService: TrustedDeviceService, jwtService: JwtService)` — 3 DI deps
- **Discrepancies with integration-state.md**:
  1. Lines 72-73: `verify-email` and `verify-email-change` listed as GET — actually POST with @SkipCsrf, @Throttle
  2. Line 77: `validate-reset-token` missing @SkipCsrf — actually has @SkipCsrf
  3. `POST /auth/link/code` (oauth.controller.ts:185) absent from guard table entirely
  4. Controller overview table (line 52) lumps AuthController with DI deps that actually belong to other controllers (SessionsService, JwtService, TrustedDeviceService, ConfigService)
  5. All Account, OAuth, and Session routes listed under "AuthController Method Guards" heading instead of separate per-controller sections

## 3. Overview

Documentation-only fix to correct guard chain table drift in `integration-state.md`. No code changes required. The drift occurred because routes were moved from AuthController to dedicated AccountController, OAuthController, and SessionController but the integration-state.md was not updated to reflect the new controller structure.

## 4. Architecture Context

- **File affected**: `ai-specs/ai-specs/specs/integration-state.md`
- **Sections affected**: Controller Guard Chains (lines 48-117)
- **No source code changes**

## 5. Implementation Steps

### Step 0: Create Feature Branch

- **Branch**: `docs/SCRUM-254-guard-chain-table`
- **Base**: `main`

### Step 1: Update Controller Overview Table

- **File**: `ai-specs/ai-specs/specs/integration-state.md`
- **Action**: Replace the controller overview table (lines 50-57) to include all 6 auth controllers with correct DI:
  - **AuthController** — DI: AuthService, PermissionsService
  - **AccountController** (NEW) — DI: AuthService
  - **OAuthController** (NEW) — DI: AuthService, ConfigService, OAuthLinkCodeStore
  - **SessionController** (NEW) — DI: SessionsService, TrustedDeviceService, JwtService
  - **MfaController** — unchanged
  - **PasskeyController** — unchanged
  - **UsersController**, **AuditLogController**, **PermissionsController** — unchanged

### Step 2: Split "AuthController Method Guards" into Per-Controller Sections

- **Action**: Replace the single "AuthController Method Guards" section (lines 59-90) with 4 separate sections:

#### 2a. AuthController Method Guards (core auth only)
| Method | Guards | Decorators |
|--------|--------|------------|
| GET /csrf-token | — | @SkipCsrf |
| POST /register | TurnstileGuard | @Throttle |
| POST /login | TurnstileGuard | @Throttle |
| POST /refresh | — | @Throttle |
| POST /logout | — | — |
| POST /logout-all | JwtAuthGuard | — |
| GET /me | JwtAuthGuard | — |
| GET /admin | JwtAuthGuard, RolesGuard | @Roles(ADMIN) |

#### 2b. AccountController Method Guards (NEW)
| Method | Guards | Decorators |
|--------|--------|------------|
| POST /verify-email | — | @SkipCsrf, @Throttle |
| POST /verify-email-change | — | @SkipCsrf, @Throttle |
| POST /resend-verification | JwtAuthGuard | — |
| POST /resend-verification-public | TurnstileGuard | @SkipCsrf, @Throttle |
| POST /forgot-password | TurnstileGuard | @SkipCsrf, @Throttle |
| POST /reset-password | — | @SkipCsrf, @Throttle |
| POST /validate-reset-token | — | @SkipCsrf |

#### 2c. OAuthController Method Guards (NEW)
| Method | Guards | Decorators |
|--------|--------|------------|
| GET /google | GoogleAuthGuard | @Throttle |
| GET /google/callback | GoogleAuthGuard | @SkipThrottle, @UseFilters(OAuthCallbackFilter) |
| GET /github | GitHubAuthGuard | @Throttle |
| GET /github/callback | GitHubAuthGuard | @SkipThrottle, @UseFilters(OAuthCallbackFilter) |
| POST /oauth/exchange | — | @Throttle |
| POST /link/code | JwtAuthGuard | @ApiBearerAuth |
| GET /link/google | OAuthLinkGuard, GoogleAuthGuard | @Throttle(oauth), @ApiBearerAuth |
| GET /link/github | OAuthLinkGuard, GitHubAuthGuard | @Throttle(oauth), @ApiBearerAuth |

#### 2d. SessionController Method Guards (NEW)
| Method | Guards | Decorators |
|--------|--------|------------|
| GET /sessions | JwtAuthGuard | — |
| DELETE /sessions/:id | JwtAuthGuard | — |
| POST /trusted-devices | JwtAuthGuard | @Throttle(5/60s) |
| GET /trusted-devices | JwtAuthGuard | — |
| DELETE /trusted-devices | JwtAuthGuard | — |
| DELETE /trusted-devices/:id | JwtAuthGuard | — |

### Step 3: Add Changelog Entry

- **Action**: Add a new row to the changelog table at the bottom of integration-state.md documenting this fix:
  - Date: 2026-03-16
  - Ticket: SCRUM-254
  - Description: Fixed guard chain table drift: corrected HTTP methods (verify-email/verify-email-change GET→POST), added missing @SkipCsrf on validate-reset-token, added missing POST /auth/link/code endpoint, split monolithic AuthController table into 4 per-controller sections (Auth, Account, OAuth, Session) matching actual codebase structure.

## 6. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Update controller overview table
3. Step 2: Split method guard tables into per-controller sections
4. Step 3: Add changelog entry

## 7. Testing Checklist

- [ ] All 4 drift issues addressed
- [ ] HTTP methods match actual code decorators
- [ ] All decorators (@SkipCsrf, @Throttle, @ApiBearerAuth) match actual code
- [ ] POST /auth/link/code present in table
- [ ] Controller DI deps in overview table match constructors
- [ ] No routes lost or duplicated in the split
- [ ] Existing MFA and Passkey sections unchanged
- [ ] Changelog entry added

## 8. Error Response Format

N/A — documentation-only change.

## 9. Dependencies

None — no npm packages or external tools required.

## 10. Notes

- This is a **docs-only** ticket. No source code changes, no tests to run.
- The drift occurred because AccountController, OAuthController, and SessionController were extracted from AuthController in previous sprints but integration-state.md was not updated to reflect the new structure.
- The `link/code` endpoint was added by SCRUM-218 (OAuth account linking).
- verify-email/verify-email-change were changed from GET to POST in SCRUM-208 (to avoid tokens in URL per OWASP ASVS V3.5.1).

## 11. Next Steps After Implementation

- `/verify` to confirm all 4 drift issues resolved
- `/commit` to commit and push
- Re-audit Phase 6 (Integration) should show I-06 as PASS

## 12. Implementation Verification

- [ ] Controller overview table has all 6 auth controllers with correct DI
- [ ] 4 separate method guard sections (Auth, Account, OAuth, Session)
- [ ] All HTTP methods match live code
- [ ] All decorators match live code
- [ ] POST /auth/link/code present with JwtAuthGuard
- [ ] Changelog entry documents the fix

---
*Plan created: 2026-03-16 | Ticket: SCRUM-254 | Scope: backend (docs-only)*
