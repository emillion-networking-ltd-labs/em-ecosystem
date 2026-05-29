# Phase 4: API Contract Audit — Auth Module

**Date**: 2026-03-16T23:31
**Module**: Auth (`/auth/*`, `/auth/mfa/*`, `/auth/passkeys/*`)
**Auditor**: Claude Opus 4.6
**Standards**: OpenAPI 3.0, REST architectural constraints, SOC 2 CC8.1 (Change Documentation)
**Previous audit**: audit-2026-03-16T22-30 (0 FAIL, 1 WARN)

---

## A-01: Every implemented controller route has a corresponding api-spec.yml path

**Verdict**: PASS

**Evidence**: Compared all 6 auth controllers against api-spec.yml paths.

| Controller | Route | Method | api-spec.yml Path | Match |
|------------|-------|--------|-------------------|-------|
| AuthController | GET /auth/csrf-token | GET | /auth/csrf-token | Yes |
| AuthController | POST /auth/register | POST | /auth/register | Yes |
| AuthController | POST /auth/login | POST | /auth/login | Yes |
| AuthController | POST /auth/refresh | POST | /auth/refresh | Yes |
| AuthController | POST /auth/logout | POST | /auth/logout | Yes |
| AuthController | POST /auth/logout-all | POST | /auth/logout-all | Yes |
| AuthController | GET /auth/me | GET | /auth/me | Yes |
| AuthController | GET /auth/admin | GET | /auth/admin | Yes |
| OAuthController | GET /auth/google | GET | /auth/google | Yes |
| OAuthController | GET /auth/google/callback | GET | /auth/google/callback | Yes |
| OAuthController | GET /auth/github | GET | /auth/github | Yes |
| OAuthController | GET /auth/github/callback | GET | /auth/github/callback | Yes |
| OAuthController | POST /auth/oauth/exchange | POST | /auth/oauth/exchange | Yes |
| OAuthController | POST /auth/link/code | POST | /auth/link/code | Yes |
| OAuthController | GET /auth/link/google | GET | /auth/link/google | Yes |
| OAuthController | GET /auth/link/github | GET | /auth/link/github | Yes |
| AccountController | POST /auth/verify-email | POST | /auth/verify-email | Yes |
| AccountController | POST /auth/verify-email-change | POST | /auth/verify-email-change | Yes |
| AccountController | POST /auth/resend-verification | POST | /auth/resend-verification | Yes |
| AccountController | POST /auth/resend-verification-public | POST | /auth/resend-verification-public | Yes |
| AccountController | POST /auth/forgot-password | POST | /auth/forgot-password | Yes |
| AccountController | POST /auth/reset-password | POST | /auth/reset-password | Yes |
| AccountController | POST /auth/validate-reset-token | POST | /auth/validate-reset-token | Yes |
| SessionController | GET /auth/sessions | GET | /auth/sessions | Yes |
| SessionController | DELETE /auth/sessions/:id | DELETE | /auth/sessions/{id} | Yes |
| SessionController | POST /auth/trusted-devices | POST | /auth/trusted-devices | Yes |
| SessionController | GET /auth/trusted-devices | GET | /auth/trusted-devices | Yes |
| SessionController | DELETE /auth/trusted-devices | DELETE | /auth/trusted-devices | Yes |
| SessionController | DELETE /auth/trusted-devices/:id | DELETE | /auth/trusted-devices/{id} | Yes |
| MfaController | POST /auth/mfa/setup | POST | /auth/mfa/setup | Yes |
| MfaController | POST /auth/mfa/verify-setup | POST | /auth/mfa/verify-setup | Yes |
| MfaController | POST /auth/mfa/verify-login | POST | /auth/mfa/verify-login | Yes |
| MfaController | DELETE /auth/mfa | DELETE | /auth/mfa | Yes |
| MfaController | POST /auth/mfa/recovery-codes | POST | /auth/mfa/recovery-codes | Yes |
| MfaController | GET /auth/mfa/status | GET | /auth/mfa/status | Yes |
| PasskeyController | POST /auth/passkeys/register/options | POST | /auth/passkeys/register/options | Yes |
| PasskeyController | POST /auth/passkeys/register/verify | POST | /auth/passkeys/register/verify | Yes |
| PasskeyController | POST /auth/passkeys/login/options | POST | /auth/passkeys/login/options | Yes |
| PasskeyController | POST /auth/passkeys/login/verify | POST | /auth/passkeys/login/verify | Yes |
| PasskeyController | GET /auth/passkeys | GET | /auth/passkeys | Yes |
| PasskeyController | PATCH /auth/passkeys/:id | PATCH | /auth/passkeys/{id} | Yes |
| PasskeyController | DELETE /auth/passkeys/:id | DELETE | /auth/passkeys/{id} | Yes |

**Total**: 43 routes, 43 matches, 0 missing from api-spec.yml.

---

## A-02: Every api-spec.yml path under /auth/* has a corresponding controller route

**Verdict**: PASS

**Evidence**: All api-spec.yml paths under /auth/* are accounted for in the controllers listed above. No orphan spec paths exist. Cross-checked the full paths section of api-spec.yml (lines 82-1300) against the 6 controllers.

---

## A-03: HTTP methods match between spec and implementation

**Verdict**: PASS

**Evidence**: All HTTP methods match. Notable checks:
- `/auth/verify-email`: spec says POST (line 639), controller uses `@Post('verify-email')` (account.controller.ts:41) -- MATCH
- `/auth/verify-email-change`: spec says POST (line 667), controller uses `@Post('verify-email-change')` (account.controller.ts:57) -- MATCH
- `/auth/mfa` DELETE: spec says DELETE (line 956), controller uses `@Delete()` (mfa.controller.ts:129) -- MATCH
- `/auth/passkeys/{id}` PATCH + DELETE: spec says PATCH (line 1221) + DELETE (line 1261), controller uses `@Patch(':id')` (passkey.controller.ts:147) + `@Delete(':id')` (passkey.controller.ts:161) -- MATCH

---

## A-04: Request/response schemas match DTOs and controller signatures

**Verdict**: PASS

**Evidence**: Spot-checked critical endpoints:
- **POST /auth/register**: spec requires `RegisterDto` (email, password, firstName?, lastName?) -- controller takes `@Body() registerDto: RegisterDto` (auth.controller.ts:95) -- MATCH
- **POST /auth/login**: spec requires `LoginDto` (email, password) -- controller takes `@Body() loginDto: LoginDto` (auth.controller.ts:118) -- MATCH
- **POST /auth/mfa/verify-login**: spec requires mfaToken + optional code/recoveryCode/trustDevice -- controller takes `@Body() dto: MfaVerifyLoginDto` (mfa.controller.ts:100) -- MATCH
- **POST /auth/passkeys/login/verify**: spec requires credential + challengeId -- controller takes `@Body() dto: PasskeyLoginVerifyDto` (passkey.controller.ts:120) -- MATCH
- **POST /auth/oauth/exchange**: spec says code is read from cookie -- controller reads `req.cookies?.['oauth_code']` (oauth.controller.ts:168) -- MATCH (no request body)

---

## A-05: Authentication/authorization requirements documented correctly

**Verdict**: PASS

**Evidence**: Verified security annotations against api-spec.yml:
- **GET /auth/me**: spec says `security: [bearerAuth: []]` (line 230), controller has `@UseGuards(JwtAuthGuard)` (auth.controller.ts:218) -- MATCH
- **GET /auth/admin**: spec says bearer + ADMIN role (line 248), controller has `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(Role.ADMIN)` (auth.controller.ts:236-237) -- MATCH
- **POST /auth/mfa/verify-login**: spec says no JWT (line 911 description), controller has NO JwtAuthGuard (mfa.controller.ts:88) -- MATCH
- **POST /auth/passkeys/login/options**: spec says public (line 1116), controller has no guard (passkey.controller.ts:90) -- MATCH
- **POST /auth/link/code**: spec says `BearerAuth` (line 318), controller has `@UseGuards(JwtAuthGuard)` (oauth.controller.ts:186) -- MATCH

---

## A-06: SafeUser schema includes `permissions` field

**Verdict**: PASS

**Evidence**: api-spec.yml line 3225-3229:
```yaml
        permissions:
          type: array
          items:
            type: string
          description: Permission keys for the user's role (e.g. ['users:read', 'users:manage']). Only included in GET /auth/me response.
```

The `permissions` field is documented in the SafeUser schema. The controller implementation at auth.controller.ts:227-230 fetches permissions via `permissionsService.getPermissionKeysForRole()` and spreads them into the response. Documentation and implementation are aligned.

---

## A-07: HTTP status codes match between spec and implementation

**Verdict**: PASS

**Evidence**: Spot-checked status codes:
- **POST /auth/register**: spec says 200 (line 98), controller has `@HttpCode(HttpStatus.OK)` (auth.controller.ts:86) -- MATCH
- **POST /auth/mfa/setup**: spec says 200 (line 848), controller has `@HttpCode(HttpStatus.OK)` (mfa.controller.ts:50) -- MATCH (fixed by SCRUM-243)
- **POST /auth/link/code**: spec says 201 (line 321), controller has `@HttpCode(HttpStatus.CREATED)` (oauth.controller.ts:187) -- MATCH
- **POST /auth/passkeys/register/verify**: spec says 201 (line 1094), controller has `@HttpCode(HttpStatus.CREATED)` (passkey.controller.ts:65) -- MATCH
- **POST /auth/oauth/exchange**: spec says 200 (line 397), controller has `@HttpCode(HttpStatus.OK)` (oauth.controller.ts:152) -- MATCH

---

## A-08: Rate limiting annotations match spec descriptions

**Verdict**: PASS

**Evidence**: All rate-limited endpoints use `AUTH_RATE_LIMITS` constants. Spot-checked:
- **POST /auth/register**: spec says "5 per 60s" (line 116), controller uses `AUTH_RATE_LIMITS.register` (auth.controller.ts:82-83) -- MATCH
- **POST /auth/login**: spec says "10 per 60s" (line 177), controller uses `AUTH_RATE_LIMITS.login` (auth.controller.ts:107-108) -- MATCH
- **POST /auth/refresh**: spec says "30 per 60s" (line 205), controller uses `AUTH_RATE_LIMITS.refresh` (auth.controller.ts:151-152) -- MATCH
- **MFA endpoints**: spec says "5 per 60s", controllers use `AUTH_RATE_LIMITS.mfa` -- MATCH
- **Passkey login endpoints**: controller uses `AUTH_RATE_LIMITS.login` -- MATCH with spec "10 per 60s"

---

## Summary

| Check | Description | Verdict |
|-------|-------------|---------|
| A-01 | Every controller route has spec path | PASS |
| A-02 | Every spec path has controller route | PASS |
| A-03 | HTTP methods match | PASS |
| A-04 | Request/response schemas match | PASS |
| A-05 | Auth requirements documented | PASS |
| A-06 | SafeUser includes permissions | PASS |
| A-07 | Status codes match | PASS |
| A-08 | Rate limiting matches | PASS |

**Overall Phase 4 Verdict**: **PASS** — 8 PASS, 0 WARN, 0 FAIL.
**FAIL count**: 0
**WARN count**: 0

---

## Recurrence Analysis (vs audit-2026-03-16T22-30)

| Previous Finding | Previous Verdict | Current Status |
|-----------------|-----------------|----------------|
| A-06: `GET /auth/me` returns undocumented `permissions` field not in `SafeUser` schema | WARN (HIGH) | **REMEDIATED** — `api-spec.yml` lines 3225-3229 now include `permissions` array in `SafeUser` schema |

**Net change**: Previous 0 FAIL + 1 WARN -> Current 0 FAIL + 0 WARN. All findings resolved.
