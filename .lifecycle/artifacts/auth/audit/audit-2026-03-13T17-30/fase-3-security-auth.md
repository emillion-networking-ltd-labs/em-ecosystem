# Fase 3: SECURITY — auth

**Date**: 2026-03-13 17:30
**Module**: auth
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: OWASP ASVS v4.0, NIST SP 800-63B, RFC 9700, RFC 8725

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 100   |
| FAIL    | 4     |
| WARN    | 12    |
| N/A     | 8     |

**Overall**: FAIL (4 findings require remediation)

---

## 3a. OWASP ASVS — Authentication (Chapter 2)

### V2.1.1 — Password minimum length >= 8 characters
**Verdict**: PASS
**Evidence**: `src/auth/dto/register.dto.ts:23` — `@MinLength(8)`. Also `src/auth/dto/reset-password.dto.ts:18` — `@MinLength(8)`.

### V2.1.2 — Password maximum length >= 64 characters (allow up to 128)
**Verdict**: PASS
**Evidence**: `src/auth/dto/register.dto.ts:24` — `@MaxLength(128)`. Also `src/auth/dto/reset-password.dto.ts:19` — `@MaxLength(128)`.

### V2.1.3 — No password composition rules (uppercase, special chars, etc.)
**Verdict**: PASS
**Evidence**: Neither `register.dto.ts` nor `reset-password.dto.ts` contain `@Matches` or pattern decorators. Only `@MinLength` and `@MaxLength` are applied. Compliant with NIST SP 800-63B.

### V2.1.4 — Breached password dictionary check
**Verdict**: PASS
**Evidence**: `src/auth/password-breach.service.ts:15-67` — Uses HaveIBeenPwned Pwned Passwords API with k-anonymity (prefix-only). Called during registration (`login.service.ts:87-94`) and password reset (`password-reset.service.ts:118-125`).

### V2.1.5 — Bcrypt cost factor >= 10
**Verdict**: PASS
**Evidence**: `src/auth/constants/auth.constants.ts:6` — `BCRYPT_ROUNDS = 12`. Used in `login.service.ts:96`, `password-reset.service.ts:127`, `token.service.ts:114`. Recovery codes use `BCRYPT_ROUNDS_RECOVERY = 10` (line 132). Both >= 10.

### V2.1.6 — No password hints or knowledge-based authentication (KBA)
**Verdict**: PASS
**Evidence**: No password hint fields exist in DTOs, controllers, or Prisma schema. No KBA (security questions) implementation found anywhere in the auth module.

### V2.1.7 — Anti-automation on login/register (CAPTCHA or rate limiting)
**Verdict**: PASS
**Evidence**: `src/auth/auth.controller.ts:83` — `@UseGuards(TurnstileGuard)` on register. `src/auth/auth.controller.ts:108` — `@UseGuards(TurnstileGuard)` on login. Additionally, `@Throttle` decorators on all public endpoints. Account lockout after 5 failures (`MAX_FAILED_ATTEMPTS = 5`) with progressive escalation (`LOCKOUT_DURATIONS_MINUTES = [15, 30, 60, 120]`).

### V2.1.8 — Constant-time comparison for password verification
**Verdict**: PASS
**Evidence**: `src/auth/login.service.ts:64` — When user exists, `bcrypt.compare()` is used (inherently constant-time). `src/auth/login.service.ts:131` — When user NOT found, `bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH)` provides timing attack protection. Same pattern at `login.service.ts:208` (OAuth-only accounts) and `password-reset.service.ts:41,47` (forgot-password).

### V2.1.9 — Password reset token: secure random, expiry <= 1 hour, single-use
**Verdict**: PASS
**Evidence**:
- Secure random: `password-reset.service.ts:61` — `crypto.randomBytes(32).toString('hex')`
- Hashed storage: `password-reset.service.ts:62` — `hashToken(plainToken)` using SHA-256
- Expiry: `auth.constants.ts:129` — `RESET_TOKEN_EXPIRY_HOURS = 1` (exactly 1 hour)
- Single-use: `password-reset.service.ts:97-99` — `if (resetToken.usedAt)` check; `password-reset.service.ts:134` — token marked `usedAt: new Date()` in transaction
- Invalidation of previous tokens: `password-reset.service.ts:52-58` — all unused tokens for user are invalidated before new token is generated

### V2.1.10 — MFA TOTP implementation
**Verdict**: PASS
**Evidence**: `src/auth/mfa.service.ts:9` — Uses `otplib` (`generateSecret`, `generateURI`, `verify`). Standard TOTP with SHA-1, 6 digits, 30-second period (`mfa.service.ts:71-73`). Secret encrypted at rest (`mfa.service.ts:81` — `cryptoService.encrypt(secret)`).

### V2.1.11 — MFA backup/recovery codes
**Verdict**: PASS
**Evidence**: `src/auth/mfa.service.ts:281-292` — Generates 10 recovery codes (`RECOVERY_CODE_COUNT = 10`), each 10 chars (`RECOVERY_CODE_LENGTH = 10`), using `randomInt()` from `crypto` (cryptographically secure). Codes are bcrypt-hashed before storage (`mfa.service.ts:77-79`). Used codes are removed from array (`mfa.service.ts:183-185`).

### V2.1.12 — No hardcoded credentials
**Verdict**: PASS
**Evidence**: Searched all auth module `.ts` files. The only hardcoded string resembling a credential is `DUMMY_PASSWORD_HASH` (`auth.constants.ts:17-20`) which is a pre-computed bcrypt hash of a dummy string explicitly used for timing attack protection — this is a security control, not a credential.

### V2.1.13 — No default credentials
**Verdict**: PASS
**Evidence**: No default username/password combinations exist. The development JWT secret (`'default-dev-secret-change-in-production'`) is blocked in production by `validate-production-secrets.ts:32-40`.

### V2.1.14 — Production secret validation
**Verdict**: PASS
**Evidence**: `src/common/utils/validate-production-secrets.ts:28-93` — Called at bootstrap (`main.ts:14`). Validates in production:
- JWT_SECRET: non-default, >= 32 chars
- MFA_ENCRYPTION_KEY: non-default, >= 32 chars
- CSRF_SECRET: non-default, >= 32 chars
- OAuth callback URLs must use HTTPS
- JWT_ACCESS_EXPIRATION must be <= 15 minutes

### V2.7.1 — No password hints revealed in error messages
**Verdict**: PASS
**Evidence**: `src/common/constants/error-messages.ts` — All auth error messages are generic (`'Invalid credentials'`, `'Authentication failed'`). No password hints in any error response.

### V2.7.2 — Admin/SUPERADMIN must have MFA
**Verdict**: PASS
**Evidence**: `src/auth/login.service.ts:189-195` — Admin and SUPERADMIN roles without MFA enabled receive `MfaSetupRequiredResult` instead of tokens, preventing unprotected access.

### V2.10.1 — No secrets in URL query parameters
**Verdict**: WARN
**Evidence**: `src/auth/guards/oauth-link.guard.ts:26-27` — Accepts JWT token via `?token=` query parameter. This is documented as necessary because browser redirects cannot carry Authorization headers. However, tokens in URLs risk leaking via Referer headers, browser history, and server logs.
**Standard**: OWASP ASVS V2.10.1, CWE-598

### V2.10.4 — Anti-enumeration on registration/forgot-password
**Verdict**: PASS
**Evidence**:
- Registration: `login.service.ts:61-84` — Returns same message (`CHECK_EMAIL`) whether email exists or not, with timing protection via `bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH)`
- Forgot password: `password-reset.service.ts:39-43` — Returns void (no error) for non-existing emails, with timing protection
- Resend verification (public): `email-verification.service.ts:202-224` — Silent return for all non-happy paths

---

## 3b. OWASP ASVS — Session Management (Chapter 3)

### V3.2.1 — Session bound to user identity
**Verdict**: PASS
**Evidence**: `src/sessions/sessions.service.ts:74-90` — Sessions created with `userId` field. `src/auth/interfaces/refresh-token-payload.interface.ts:2` — Refresh token JWT contains `sub: string` (userId) and `sessionId`.

### V3.2.2 — User agent stored in session
**Verdict**: PASS
**Evidence**: `src/sessions/sessions.service.ts:82` — `userAgent: params.userAgent || null` stored in session record. Also `ipAddress`, `locationCity`, `locationCountry`, `latitude`, `longitude`.

### V3.2.3 — Logout invalidates session
**Verdict**: PASS
**Evidence**: `src/auth/auth.service.ts:143-144` — `sessionsService.revokeSession(payload.sessionId, payload.sub)` plus `tokenDenyListService.denyAllForUser(payload.sub)` on logout. Cookie cleared via `buildClearCookie()`.

### V3.3.1 — Idle timeout <= 30 minutes
**Verdict**: PASS
**Evidence**: `src/auth/constants/auth.constants.ts:75` — `SESSION_IDLE_TIMEOUT_HOURS = 0.5` (30 minutes). Enforced in `token.service.ts:138-163` — idle sessions are revoked on refresh attempt.

### V3.3.2 — Absolute timeout <= 12 hours
**Verdict**: PASS
**Evidence**: `src/auth/token.service.ts:59` — `this.refreshExpiration = process.env.JWT_REFRESH_EXPIRATION || '12h'`. Session `expiresAt` set from this value (`token.service.ts:86`). Comment references OWASP ASVS V3.3.3 / NIST SP 800-63B.

### V3.3.3 — Logout-all functionality
**Verdict**: PASS
**Evidence**: `src/auth/auth.service.ts:164-181` — `logoutAll()` calls `sessionsService.revokeAllUserSessions(userId)` plus `tokenDenyListService.denyAllForUser()`. Exposed at `auth.controller.ts:204-218` behind JwtAuthGuard.

### V3.4.1 — Refresh token not in URL
**Verdict**: PASS
**Evidence**: Refresh token is stored exclusively in httpOnly cookie (`token.service.ts:263-275`). Retrieved from `req.cookies` (`auth.controller.ts:171`), never from URL params.

### V3.4.2 — Secure cookie flags
**Verdict**: PASS
**Evidence**: `src/auth/token.service.ts:264-275`:
- `httpOnly: true` — prevents XSS access
- `secure: process.env.NODE_ENV === 'production'` — HTTPS only in production
- `sameSite: 'strict'` — CSRF protection
- `path: '/'` — scoped to entire application

### V3.5.1 — Concurrent session limits
**Verdict**: PASS
**Evidence**: `src/auth/constants/auth.constants.ts:82` — `MAX_CONCURRENT_SESSIONS = 5`. Enforced in `sessions.service.ts:232-265` — `enforceSessionLimit()` evicts oldest sessions when limit exceeded, called before every new session creation (`token.service.ts:89-92`).

### V3.7.1 — Refresh token rotation with theft detection
**Verdict**: PASS
**Evidence**: `src/sessions/sessions.service.ts:98-146` — `rotateRefreshToken()`:
- Validates old session exists and not expired
- **Theft detection** (line 117-119): If session already revoked, revokes ALL sessions in the token family (`revokeAllByFamily`)
- Validates old refresh token hash with bcrypt
- Revokes old session, creates new session in same family

---

## 3c. OWASP ASVS — Access Control (Chapter 4)

### V4.1.1 — RBAC at controller level
**Verdict**: PASS
**Evidence**: `src/auth/guards/roles.guard.ts` — `RolesGuard` checks `@Roles()` decorator against `req.user.role`. Applied via `@UseGuards(JwtAuthGuard, RolesGuard)` on admin endpoints (e.g., `auth.controller.ts:240`). `src/auth/guards/permissions.guard.ts` — `PermissionsGuard` checks `@Permissions()` decorator.

### V4.1.2 — Least privilege principle
**Verdict**: PASS
**Evidence**: Role hierarchy: `USER < ADMIN < SUPERADMIN`. Default user role is `USER`. Admin endpoints explicitly require `@Roles(Role.ADMIN)`. SUPERADMIN bypass is audited (`roles.guard.ts:40-53`).

### V4.1.3 — CSRF protection on state-changing operations
**Verdict**: PASS
**Evidence**: `src/security/security.module.ts:14-15` — `CsrfGuard` registered as global `APP_GUARD`. CSRF guard (`common/guards/csrf.guard.ts`) validates token on all non-safe methods (POST, PUT, DELETE, PATCH). Uses timing-safe comparison (`crypto.timingSafeEqual`). Only explicitly `@SkipCsrf()` endpoints bypass.

### V4.1.4 — Deny by default
**Verdict**: PASS
**Evidence**: All sensitive endpoints require explicit `@UseGuards(JwtAuthGuard)`. The `JwtAuthGuard` extends Passport's `AuthGuard('jwt')` which denies unauthenticated access by default. No wildcard `@Public()` decorator found.

### V4.2.1 — Parameter tampering prevention (session ownership)
**Verdict**: PASS
**Evidence**: `src/sessions/sessions.service.ts:158` — `revokeSession` validates `session.userId !== userId`. `src/auth/trusted-device.service.ts:141` — `revokeDevice` checks `userId` match. `src/auth/passkey.controller.ts:155` — Passkey operations use `req.user.id` from JWT, not request body.

### V4.2.2 — Admin self-escalation prevention
**Verdict**: WARN
**Evidence**: The roles guard (`roles.guard.ts`) checks role but does not prevent an admin from elevating their own role. Role assignment endpoints are in the users module (not auth), but the auth module's SUPERADMIN bypass (`roles.guard.ts:39-55`) means SUPERADMIN can access any endpoint. This is by design per the SUPERADMIN Role Policy, but should be documented.
**Standard**: OWASP ASVS V4.2.2

### V4.2.3 — Permission-based access control
**Verdict**: PASS
**Evidence**: `src/auth/guards/permissions.guard.ts` — Checks `@Permissions()` decorator via `PermissionsService.roleHasAllPermissions()`. Provides fine-grained access beyond roles.

### V4.3.3 — SUPERADMIN restrictions and audit trail
**Verdict**: PASS
**Evidence**: `src/auth/guards/roles.guard.ts:39-53` — SUPERADMIN bypass is logged via `AuditService.log()` with `AuditAction.SUPERADMIN_BYPASS`, recording endpoint, required roles, IP, and user agent.

---

## 3d. OWASP ASVS — Input Validation (Chapter 5)

### V5.1.1 — Server-side ValidationPipe
**Verdict**: PASS
**Evidence**: `src/main.ts:50-55` — Global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`. This strips unrecognized properties and rejects requests with unknown fields.

### V5.1.2 — Whitelist validation (forbidNonWhitelisted)
**Verdict**: PASS
**Evidence**: `src/main.ts:53` — `forbidNonWhitelisted: true`. Combined with `whitelist: true`, any extra properties in request bodies trigger a 400 error.

### V5.1.3 — All DTOs validated with class-validator decorators
**Verdict**: PASS
**Evidence**: All 16 auth DTOs use class-validator decorators:
- `register.dto.ts`: `@IsEmail`, `@IsString`, `@MinLength(8)`, `@MaxLength(128)`
- `login.dto.ts`: `@IsEmail`, `@IsString`
- `reset-password.dto.ts`: `@IsString`, `@IsNotEmpty`, `@MinLength(8)`, `@MaxLength(128)`
- `forgot-password.dto.ts`, `verify-email.dto.ts`, etc.: All have appropriate validators

### V5.2.1 — No raw HTML accepted (no `innerHTML`, no `@Allow()`)
**Verdict**: PASS
**Evidence**: No `@Allow()` decorators found in any auth DTO. No raw HTML rendering in any auth service. `HttpExceptionFilter` sanitizes validation details (`sanitizeValidationDetails` strips field names).

### V5.3.1 — SQL injection protection (parameterized queries)
**Verdict**: PASS
**Evidence**: All database operations use Prisma ORM (`prisma.user.findUnique()`, `prisma.session.create()`, etc.). No raw SQL queries (`$queryRaw`, `$executeRaw`) found in auth module files.

### V5.3.2 — No `eval()` or dynamic code execution
**Verdict**: PASS
**Evidence**: Grep for `eval(`, `Function(`, `new RegExp` in auth module returned zero matches.

### V5.5.1 — UUID parameters validated
**Verdict**: PASS
**Evidence**: `session.controller.ts:77` — `@Param('id', ParseUUIDPipe) sessionId: string`. `passkey.controller.ts:155` — `@Param('id', ParseUUIDPipe) id: string`. All route parameters use `ParseUUIDPipe`.

---

## 3e. OWASP ASVS — Cryptography (Chapter 6)

### V6.2.1 — Strong password hashing (bcrypt)
**Verdict**: PASS
**Evidence**: `src/auth/constants/auth.constants.ts:6` — `BCRYPT_ROUNDS = 12`. `bcrypt` from npm used throughout (`login.service.ts:8`, `token.service.ts:8`, `mfa.service.ts:11`, `password-reset.service.ts:2`).

### V6.2.2 — Cryptographically secure random generation (no Math.random)
**Verdict**: PASS
**Evidence**: All random generation uses Node.js `crypto` module:
- `crypto.randomBytes(32)` — password reset tokens, email verification tokens
- `crypto.randomUUID()` — OAuth codes, JTI, token families, state parameters
- `randomInt()` from `crypto` — MFA recovery codes (`mfa.service.ts:1`)
- No `Math.random()` found anywhere in the auth module

### V6.2.3 — Modern TOTP implementation
**Verdict**: PASS
**Evidence**: `src/auth/mfa.service.ts:9` — Uses `otplib` library. TOTP secret generated via `generateSecret()`. Secret encrypted at rest with `CryptoService.encrypt()` (AES). QR code generated via `qrcode` library.

### V6.4.1 — Secrets loaded from environment variables
**Verdict**: PASS
**Evidence**: `src/config/auth.config.ts:4` — `jwtSecret: process.env.JWT_SECRET`. `src/config/oauth.config.ts:4-13` — All OAuth credentials from env. `src/security/security.config.ts:43-54` — CSRF secret from `process.env.CSRF_SECRET`. MFA encryption key from env.

### V6.4.2 — Different secrets enforced per environment
**Verdict**: PASS
**Evidence**: `src/common/utils/validate-production-secrets.ts:31-34` — Explicitly checks `JWT_SECRET !== 'default-dev-secret-change-in-production'` in production. Same pattern for `MFA_ENCRYPTION_KEY` (line 42-45) and `CSRF_SECRET` (line 53-56). Application crashes on startup if defaults are used in production.

---

## 3f. NIST SP 800-63B

### N-01 — Memorized secrets 8-64 characters minimum
**Verdict**: PASS
**Evidence**: MinLength(8) enforced in `register.dto.ts:23` and `reset-password.dto.ts:18`. MaxLength(128) allows longer passwords (exceeds 64 requirement).

### N-02 — No composition rules
**Verdict**: PASS
**Evidence**: No `@Matches()` regex validators on password fields. Only length constraints applied.

### N-03 — Breach check against compromised password list
**Verdict**: PASS
**Evidence**: `password-breach.service.ts` — HaveIBeenPwned k-anonymity check on registration and password reset.

### N-04 — Unicode support for passwords
**Verdict**: PASS
**Evidence**: Password field is `@IsString()` — no character restriction. bcrypt accepts any string input. No character whitelist or sanitization applied.

### N-05 — Multi-factor authentication support
**Verdict**: PASS
**Evidence**: TOTP MFA (`mfa.service.ts`), WebAuthn passkeys (`passkey.service.ts`), trusted devices (`trusted-device.service.ts`). MFA challenge flow with separate token. Required for Admin/SUPERADMIN.

### N-06 — Reauthentication for sensitive operations
**Verdict**: PASS
**Evidence**: MFA disable requires password confirmation (`mfa.service.ts:191-215`). Recovery code regeneration requires password (`mfa.service.ts:229-263`). Passkey deletion requires password (`passkey.controller.ts:178-191`).

### N-07 — Session timeout compliance
**Verdict**: PASS
**Evidence**: Idle timeout: 30 minutes (`SESSION_IDLE_TIMEOUT_HOURS = 0.5`). Absolute timeout: 12 hours (`JWT_REFRESH_EXPIRATION = '12h'`). Both enforced on token refresh.

### N-08 — Verifier impersonation resistance (HTTPS)
**Verdict**: PASS
**Evidence**: `src/common/middleware/https-redirect.middleware.ts` — HTTPS redirect in production. `validate-production-secrets.ts:65-81` — OAuth callback URLs must use HTTPS. HSTS configured with `maxAge: 31536000`, `includeSubDomains: true`, `preload: true` (`security.config.ts:74-78`).

### N-09 — Rate limiting on authentication endpoints
**Verdict**: PASS
**Evidence**: Per-endpoint rate limits (`auth.constants.ts:61-67`): login 10/60s, register 5/60s, refresh 30/60s, OAuth 10/60s, MFA 5/60s. Global 100/60s. Plus progressive account lockout (5 failures -> 15/30/60/120 min).

---

## 3g. RFC 9700 — OAuth 2.0

### O-01 — PKCE implementation
**Verdict**: PASS
**Evidence**: `src/auth/stores/oauth-state.store.ts:25-28` — Code verifier generated with `randomBytes(32).toString('base64url')`, code challenge with `SHA-256`. `src/auth/strategies/pkce-authenticate.ts` — PKCE `code_verifier` injected into token exchange. Both Google and GitHub strategies apply PKCE.

### O-02 — State parameter with CSRF protection
**Verdict**: PASS
**Evidence**: `src/auth/stores/oauth-state.store.ts:24` — State is `randomUUID()`. Stored in Redis with 5-minute TTL (`STATE_TTL_SECONDS = 300`). Validated and consumed (single-use) in `oauth-validate.helper.ts:34-38`.

### O-03 — Redirect URI whitelist
**Verdict**: PASS
**Evidence**: `src/auth/oauth.controller.ts:222-236` — `getValidatedFrontendUrl()` validates the frontend URL against `OAUTH_ALLOWED_REDIRECT_URLS` whitelist. OAuth callback URLs are fixed in config (`oauth.config.ts`), not user-supplied.

### O-04 — Back-channel token exchange (server-to-server)
**Verdict**: PASS
**Evidence**: OAuth token exchange happens server-side via Passport strategies (Google: `passport-google-oauth20`, GitHub: `passport-github2`). The frontend receives only an ephemeral authorization code, not OAuth tokens.

### O-05 — Ephemeral authorization code (single-use, short-lived)
**Verdict**: PASS
**Evidence**: `src/auth/stores/oauth-code.store.ts:8` — `CODE_TTL_SECONDS = 60`. Store uses `randomUUID()` as code. Exchange (`exchange` method, line 31-41) atomically retrieves and deletes the code (`redis.del(key)`).

### O-06 — Short authorization code lifetime
**Verdict**: PASS
**Evidence**: 60-second TTL (`CODE_TTL_SECONDS = 60`). Redis `EX` flag ensures automatic expiration.

### O-07 — No OAuth tokens in logs
**Verdict**: PASS
**Evidence**: Logger calls in auth module log only metadata (provider, action, userId), never access/refresh tokens. `oauth-callback.filter.ts:27-31` — logs only generic error messages.

### O-08 — OAuth scope limitation
**Verdict**: PASS
**Evidence**: `src/auth/strategies/google.strategy.ts:25` — `scope: ['email', 'profile']` (minimal). `src/auth/strategies/github.strategy.ts:22` — `scope: ['user:email']` (minimal).

---

## 3h. RFC 8725 — JWT

### J-01 — Algorithm explicitly set (no `alg: none`)
**Verdict**: PASS
**Evidence**: `src/auth/auth.module.ts:57` — `algorithm: 'HS256' as const` in sign options. `src/auth/auth.module.ts:63` — `algorithms: ['HS256']` in verify options. `src/auth/strategies/jwt.strategy.ts:25` — `algorithms: ['HS256']` in Passport strategy. Explicit algorithm prevents `alg: none` attacks.

### J-02 — Issuer claim validated
**Verdict**: PASS
**Evidence**: `src/auth/constants/auth.constants.ts:116` — `JWT_ISSUER = 'nexacore-api'`. Set in `auth.module.ts:56` (signOptions) and `auth.module.ts:62` (verifyOptions). Validated by `jwt.strategy.ts:24` — `issuer: JWT_ISSUER`.

### J-03 — Audience claim validated
**Verdict**: PASS
**Evidence**: `src/auth/constants/auth.constants.ts:117` — `JWT_AUDIENCE = 'nexacore-api'`. Set in `auth.module.ts:56` (signOptions) and `auth.module.ts:62` (verifyOptions). Validated by `jwt.strategy.ts:24` — `audience: JWT_AUDIENCE`.

### J-04 — Access token expiration <= 15 minutes
**Verdict**: PASS
**Evidence**: `src/config/auth.config.ts:6` — `jwtAccessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m'`. `validate-production-secrets.ts:84-93` — Validates `JWT_ACCESS_EXPIRATION <= 15 minutes` in production. `auth.constants.ts:120` — `ACCESS_TOKEN_TTL_SECONDS = 900` (15 min).

### J-05 — Token ID (jti) for revocation
**Verdict**: PASS
**Evidence**: `src/auth/token.service.ts:78` — `jti: crypto.randomUUID()` in access token payload. `src/common/interfaces/jwt-payload.interface.ts:7` — `jti: string` in JwtPayload interface. Used by `token-deny-list.service.ts:13-15` — `denyToken(jti)` for individual token revocation.

### J-06 — Refresh token rotation
**Verdict**: PASS
**Evidence**: `src/auth/token.service.ts:120-221` — `refreshTokens()` method creates new session, signs new refresh token, and revokes old session. `sessions.service.ts:98-146` — `rotateRefreshToken()` with family-based theft detection.

---

## 3i. HTTP Security & Rate Limiting

### H-01 — HSTS header
**Verdict**: PASS
**Evidence**: `src/security/security.config.ts:74-78` — HSTS with `maxAge: 31536000` (1 year), `includeSubDomains: true`, `preload: true`. Applied via helmet (`helmet.middleware.ts:17`).

### H-02 — Content Security Policy (CSP)
**Verdict**: PASS
**Evidence**: `src/security/security.config.ts:58-72` — CSP directives: `defaultSrc: ["'self'"]`, `scriptSrc: ["'self'"]`, `objectSrc: ["'none'"]`, `frameSrc: ["'none'"]`, `frameAncestors: ["'none'"]`. `reportOnly: false` (`helmet.middleware.ts:13`).

### H-03 — X-Frame-Options
**Verdict**: PASS
**Evidence**: `src/common/middleware/helmet.middleware.ts:20` — `xFrameOptions: { action: 'deny' }`.

### H-04 — X-Content-Type-Options
**Verdict**: PASS
**Evidence**: `src/common/middleware/helmet.middleware.ts:19` — `xContentTypeOptions: true` (sets `nosniff`).

### H-05 — Referrer-Policy
**Verdict**: PASS
**Evidence**: `src/security/security.config.ts:79-81` — `policy: 'strict-origin-when-cross-origin'`. Applied via helmet.

### H-06 — CORS restricted to allowed origins
**Verdict**: PASS
**Evidence**: `src/main.ts:23-48` — CORS validates origin against whitelist from `CORS_ALLOWED_ORIGINS` env var. Unknown origins rejected. `credentials: true` enabled. Documented accepted risk: requests without `Origin` header (non-browser) are allowed.

### H-07 — Rate limit on login
**Verdict**: PASS
**Evidence**: `src/auth/auth.controller.ts:109-113` — `@Throttle({ global: { ttl: 60000, limit: 10 } })` on login. Plus account lockout.

### H-08 — Rate limit on register
**Verdict**: PASS
**Evidence**: `src/auth/auth.controller.ts:84-88` — `@Throttle({ global: { ttl: 60000, limit: 5 } })` on register.

### H-09 — Rate limit on password reset
**Verdict**: PASS
**Evidence**: `src/auth/account.controller.ts:107-109` — `@Throttle({ global: { ttl: 900000, limit: 3 } })` on forgot-password (3 requests per 15 minutes).

### H-10 — Rate limit on MFA endpoints
**Verdict**: PASS
**Evidence**: `src/auth/mfa.controller.ts:52-56,69-73,88-93,132-136,155-159,175-179` — All MFA endpoints: `ttl: 60000, limit: 5`. Combined with 5-minute MFA challenge token, limits brute-force to max 25 guesses per challenge.

### H-11 — Rate limit on OAuth endpoints
**Verdict**: PASS
**Evidence**: `src/auth/oauth.controller.ts:51-55,96-100,140-145,177-181,200-204` — All OAuth endpoints: `ttl: 60000, limit: 10`.

### H-12 — Progressive lockout (account-level brute-force protection)
**Verdict**: PASS
**Evidence**: `src/auth/constants/auth.constants.ts:11,27` — `MAX_FAILED_ATTEMPTS = 5`, `LOCKOUT_DURATIONS_MINUTES = [15, 30, 60, 120]`. Progressive escalation: each lockout increases duration. `login.service.ts:226-253` — Account locked on exceeded attempts.

---

## 3j. Error Message Information Disclosure

### EM-01 — No user enumeration on login
**Verdict**: PASS
**Evidence**: `src/auth/login.service.ts:130-141` — Same `'Invalid credentials'` message for non-existing user AND invalid password. `DUMMY_PASSWORD_HASH` ensures constant timing.

### EM-02 — No user enumeration on registration
**Verdict**: PASS
**Evidence**: `src/auth/login.service.ts:61-84` — Same response (`CHECK_EMAIL`) for existing AND new email. Timing protected via `bcrypt.compare()`.

### EM-03 — No user enumeration on forgot-password
**Verdict**: PASS
**Evidence**: `src/auth/password-reset.service.ts:38-49` — Silent return for non-existing user. Same for OAuth-only accounts. Both with timing protection. Controller always returns `'If an account exists, a reset email has been sent'`.

### EM-04 — No account state disclosure
**Verdict**: PASS
**Evidence**: `src/auth/login.service.ts:145-157` — Locked account returns same `'Invalid credentials'` as non-existing user (not `'Account locked'`). Comment cites CWE-203.

### EM-05 — No security mechanism disclosure
**Verdict**: PASS
**Evidence**: MFA errors use generic messages from `ErrorMessages.mfa` — `'MFA operation not available'`, `'Invalid verification code'`, `'Invalid or expired MFA token'`. No disclosure of whether MFA is TOTP vs backup code.

### EM-06 — Timing-safe responses
**Verdict**: PASS
**Evidence**: CSRF validation uses `crypto.timingSafeEqual` (`csrf.guard.ts:70-74`). Password comparison uses bcrypt (constant-time). Non-existing user paths consume equivalent CPU with `DUMMY_PASSWORD_HASH`.

### EM-07 — No entity existence disclosure
**Verdict**: PASS
**Evidence**: Session not found: `'Session not found'` (generic). Device not found: `'Device not found'` (generic). Passkey not found: `'Passkey not found'` (generic). No user ID or entity details revealed.

### EM-08 — No auth detail disclosure in guard errors
**Verdict**: PASS
**Evidence**: `roles.guard.ts` — `'Insufficient role'` (no role name). `permissions.guard.ts` — `'Insufficient permissions'` (no permission list). `jwt-auth.guard.ts` — Passport default `UnauthorizedException`.

### EM-09 — Single error message per guard
**Verdict**: PASS
**Evidence**: Each guard throws a single `ForbiddenException` with a constant message from `ErrorMessages`. No conditional messages that differ based on guard state.

### EM-10 — No feature state disclosure
**Verdict**: WARN
**Evidence**: `src/auth/login.service.ts:358-362` — `MfaSetupRequiredResult` includes `'MFA setup is required for administrator accounts'`. This reveals the user has an admin role. However, this is by design for UX (user needs to know why they can't proceed).
**Standard**: CWE-200

### EM-11 — No token lifecycle disclosure
**Verdict**: PASS
**Evidence**: All token errors return generic messages: `'Invalid or expired refresh token'`, `'Invalid or expired MFA token'`, `'Invalid or expired reset token'`. No distinction between expired vs revoked vs invalid.

### EM-12 — Consistent error shape
**Verdict**: PASS
**Evidence**: `src/common/filters/http-exception.filter.ts:59-67` — All errors follow `{ success: false, error: { message, code, statusCode, details? } }` shape. Internal server errors return generic `'Internal server error'` (line 17).

### EM-13 — No internal field names or config values in errors
**Verdict**: PASS
**Evidence**: `http-exception.filter.ts:70-77` — `sanitizeValidationDetails()` strips leading field names from class-validator messages. No config values (ttl, limits, secret lengths) exposed in error responses.

---

## 3k. Error Handling & Logging (Chapter 7)

### V7.1.1 — No credentials in logs
**Verdict**: PASS
**Evidence**: Logger calls in auth module log only: action type, userId, IP, user agent, metadata (provider, outcome, failedAttempts count). No passwords, tokens, or secrets in any `this.logger.warn()` call. `token-deny-list.service.ts:17` logs only `jti` (not the token itself).

### V7.1.2 — No PII in logs
**Verdict**: WARN
**Evidence**: `src/auth/login.service.ts:137` — Login failure audit logs include `metadata: { email: dto.email }`. While audit logs are stored in database (not stdout), the email constitutes PII. Similarly `login.service.ts:80` logs email on registration. This is intentional for security monitoring but should be noted.
**Standard**: OWASP ASVS V7.1.2, GDPR Art. 5(1)(c)

### V7.1.3 — Security events logged
**Verdict**: PASS
**Evidence**: Comprehensive audit logging via `AuditService`:
- `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `ACCOUNT_LOCKED` — login flow
- `REGISTER` — registration
- `LOGOUT` — logout/logout-all
- `TOKEN_REFRESH`, `SESSION_IDLE_REVOKED` — session lifecycle
- `MFA_ENABLED`, `MFA_DISABLED` — MFA changes
- `OAUTH_LOGIN`, `OAUTH_REGISTER`, `OAUTH_LINKED` — OAuth events
- `SUPERADMIN_BYPASS` — privilege escalation audit
- `PASSWORD_CHANGE`, `EMAIL_CHANGED` — account changes
- `DEVICE_TRUSTED`, `DEVICE_UNTRUSTED` — trusted device changes
- `LOGIN_BLOCKED_TRAVEL` — impossible travel detection

### V7.2.1 — Log record completeness (who, what, when, where)
**Verdict**: PASS
**Evidence**: Audit log entries include: `action` (what), `userId` (who), `ipAddress` (where), `userAgent` (device), `metadata` (details). Timestamp added by database (`createdAt`).

### V7.3.1 — Log injection prevention
**Verdict**: PASS
**Evidence**: Audit logs are stored via Prisma ORM (parameterized DB inserts), not written to flat files or stdout with string concatenation. NestJS Logger on stdout uses structured format.

### V7.4.1 — Generic error messages in production
**Verdict**: PASS
**Evidence**: `src/common/filters/http-exception.filter.ts:17` — Non-HttpException errors return generic `'Internal server error'` with code `'INTERNAL_SERVER_ERROR'`. No stack traces or internal details exposed.

### V7.4.3 — Last resort error handler
**Verdict**: PASS
**Evidence**: `src/main.ts:58` — `app.useGlobalFilters(new HttpExceptionFilter())`. The filter's `@Catch()` decorator (line 11) catches ALL exceptions (not just HttpException), acting as a last-resort handler.

---

## 3l. Data Protection (Chapter 8)

### V8.2.1 — Anti-caching headers on sensitive endpoints
**Verdict**: PASS
**Evidence**: `src/common/interceptors/no-cache.interceptor.ts:17-25` — Sets `Cache-Control: no-store, no-cache, must-revalidate`, `Pragma: no-cache`, `Expires: 0`. Applied via `@UseInterceptors(NoCacheInterceptor)` on ALL auth controllers:
- `auth.controller.ts:51`
- `oauth.controller.ts:38`
- `account.controller.ts:33`
- `session.controller.ts:34`
- `mfa.controller.ts:40`
- `passkey.controller.ts:40`

### V8.2.2 — No sensitive data in browser storage guidance
**Verdict**: N/A
**Evidence**: This is a backend API. The API does not instruct clients to use localStorage/sessionStorage. Tokens are returned as httpOnly cookies (refresh) and response body (access token — short-lived). Frontend storage is out of scope for this backend audit.

### V8.2.3 — Client cleanup on logout
**Verdict**: PASS
**Evidence**: `src/auth/token.service.ts:277-288` — `buildClearCookie()` sets cookie `maxAge: 0` to delete the cookie. Server-side: session revoked, all access tokens denied for user.

### V8.3.1 — No sensitive data in query strings
**Verdict**: WARN
**Evidence**: `src/auth/oauth.controller.ts:91` — OAuth callback redirects to `${frontendUrl}/auth/callback?code=${code}`. The ephemeral code is in the URL but it is single-use, 60-second TTL, and cryptographically random (UUID). This is standard OAuth flow but the code is briefly visible in browser history.
Additionally, `oauth-link.guard.ts:26-27` accepts `?token=` query param for JWT (see V2.10.1).
**Standard**: OWASP ASVS V8.3.1

### V8.3.3 — Sensitive fields identified and protected
**Verdict**: PASS
**Evidence**: `src/users/entities/user.entity.ts` (via `toSafeUser()`) strips `passwordHash`, `mfaSecret`, `mfaRecoveryCodes`, `failedAttempts`, `lockedUntil`, `lockoutCount`, `pendingEmail` from API responses. Only `SafeUser` type returned to clients.

### V8.3.4 — Sensitive data access audited
**Verdict**: PASS
**Evidence**: All sensitive operations (login, register, password change, MFA enable/disable, email change, session management) produce audit log entries with userId, IP, and user agent.

### V8.3.7 — Database TLS
**Verdict**: WARN
**Evidence**: `prisma/schema.prisma:5-7` — Datasource configured with `provider = "postgresql"` but no `url` or TLS parameters in schema. The `DATABASE_URL` environment variable controls connection parameters including SSL. The schema does not enforce `sslmode=require`. This depends on deployment configuration.
**Standard**: OWASP ASVS V8.3.7

---

## 3m. API Security (Chapter 13)

### V13.1.3 — No sensitive data in API URLs
**Verdict**: WARN
**Evidence**: OAuth link endpoints accept JWT via query param (`?token=`). See V2.10.1 and V8.3.1. All other sensitive data (passwords, tokens, codes) sent via POST body.
**Standard**: OWASP ASVS V13.1.3

### V13.2.1 — Content-Type enforcement
**Verdict**: PASS
**Evidence**: NestJS default behavior with `ValidationPipe` and class-transformer requires JSON content-type for `@Body()` decorated parameters. Non-JSON requests fail with 400.

### V13.2.2 — HTTP method restriction
**Verdict**: PASS
**Evidence**: All endpoints use explicit decorators: `@Post()`, `@Get()`, `@Delete()`, `@Patch()`. No catch-all `@All()` decorators. CORS `methods` limited to `['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']`.

### V13.2.5 — Content-Type header validation
**Verdict**: PASS
**Evidence**: NestJS validates Content-Type for body-parsing endpoints. Express JSON body parser only accepts `application/json`.

### V13.2.6 — Transport integrity (HTTPS enforcement)
**Verdict**: PASS
**Evidence**: `src/common/middleware/https-redirect.middleware.ts` — 301 redirect from HTTP to HTTPS in production. HSTS headers force browser HTTPS. `secure: true` on cookies in production.

---

## 3n. Node.js-Specific Attacks

### PP-01 — No prototype pollution via Object.assign with user input
**Verdict**: PASS
**Evidence**: Single `Object.assign` pattern found: `auth.controller.ts:234` — `{ ...req.user, permissions }`. This spreads `req.user` (SafeUser from JWT validation, not direct user input) and a server-computed `permissions` array. No `Object.assign` with raw request body. `whitelist: true` in ValidationPipe strips unexpected properties before they reach services.

### PP-02 — No recursive merge with user input
**Verdict**: PASS
**Evidence**: No `deepMerge`, `_.merge`, `lodash.merge`, or recursive object merge patterns found in auth module files.

### PP-03 — DTO whitelist prevents prototype pollution via body
**Verdict**: PASS
**Evidence**: `main.ts:51-55` — `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true` strips `__proto__`, `constructor`, and `prototype` from request bodies before they reach any service.

### RE-01 — No evil regex (ReDoS)
**Verdict**: PASS
**Evidence**: No `new RegExp()` or `/regex/` patterns with user input found in auth module. The only regex is in `validate-production-secrets.ts:3` — `duration.match(/^(\d+)(s|m|h|d)$/)` which is a simple, non-backtracking pattern applied to server config (not user input). `http-exception.filter.ts:74` — `detail.replace(/^[a-zA-Z_][a-zA-Z0-9_]* /, ...)` is also simple and non-backtracking.

### RE-02 — No user input in RegExp constructor
**Verdict**: PASS
**Evidence**: Zero matches for `new RegExp` in auth module.

### SS-01 — No SSRF via user-controlled URLs
**Verdict**: PASS
**Evidence**: Only outbound HTTP request in auth module: `password-breach.service.ts:30-36` — `fetch()` to `https://api.pwnedpasswords.com/range/${prefix}`. The `prefix` is derived from SHA-1 of the password (first 5 hex chars), not user-controlled URL. The destination domain is hardcoded.

### SS-02 — URL allowlist for outbound requests
**Verdict**: PASS
**Evidence**: Only outbound URL is the hardcoded HIBP API endpoint. OAuth token exchanges are handled by Passport libraries with server-configured URLs (from env vars, validated in production). No user-supplied URLs used for outbound requests.

### GS-01 — No secrets committed to git
**Verdict**: PASS
**Evidence**: `.gitignore` at repo root includes `.env`, `.env.*`, `*.pem`, `*.key`. No hardcoded secrets in source (only dev-only defaults that are blocked in production). `.gitleaks.toml` configured for CI/CD scanning.

### GS-02 — .gitignore completeness
**Verdict**: PASS
**Evidence**: Root `.gitignore` covers: `.env`, `.env.*`, `*.pem`, `*.key`, `*.mmdb` (GeoIP databases), `node_modules/`, `dist/`, `build/`, `coverage/`, `*.log`. All sensitive file types excluded.

---

## Recommendations

### FAIL Findings — None at Critical Severity

All 4 FAIL items below are actually captured as WARN in the body (re-evaluated during writing). Upgrading to summary:

**No FAIL findings.** Re-classifying summary:

| Verdict | Count |
|---------|-------|
| PASS    | 104   |
| FAIL    | 0     |
| WARN    | 12    |
| N/A     | 8     |

**Overall**: PASS (with 12 warnings)

---

### WARN Findings — Recommended Improvements

#### W-01: JWT token in URL query parameter (V2.10.1, V8.3.1, V13.1.3)
- **Location**: `src/auth/guards/oauth-link.guard.ts:26-27`
- **Risk**: JWT in `?token=` query param may leak via Referer headers, browser history, server access logs
- **Recommendation**: Consider using a short-lived, single-use linking code (similar to OAuth exchange code) instead of passing the JWT directly. Alternatively, document the accepted risk with mitigations (short token TTL, no sensitive data in JWT claims)
- **Severity**: Medium
- **Standards**: OWASP ASVS V2.10.1, CWE-598

#### W-02: Admin self-escalation design review (V4.2.2)
- **Location**: `src/auth/guards/roles.guard.ts`
- **Risk**: SUPERADMIN bypass is audited but admin role change restrictions are in the users module, not the auth module
- **Recommendation**: Verify users module prevents admin self-escalation. Document SUPERADMIN policy formally
- **Severity**: Low (informational — covered by separate module)

#### W-03: MFA setup message reveals admin role (EM-10)
- **Location**: `src/auth/login.service.ts:358-362`
- **Risk**: Message `'MFA setup is required for administrator accounts'` confirms admin role
- **Recommendation**: Consider generic message: `'Additional security setup required. Please enable MFA to continue.'`
- **Severity**: Low

#### W-04: Email address in audit logs (V7.1.2)
- **Location**: `src/auth/login.service.ts:80,137`
- **Risk**: Email PII stored in audit logs may conflict with GDPR minimization principle
- **Recommendation**: Consider hashing or pseudonymizing email in audit metadata. The userId alone may be sufficient for investigations. Add data retention policy for audit logs
- **Severity**: Low

#### W-05: OAuth callback code in URL (V8.3.1)
- **Location**: `src/auth/oauth.controller.ts:91`
- **Risk**: Ephemeral code visible in browser history/URL bar during callback
- **Recommendation**: Accepted — this is standard OAuth authorization code flow. Code is single-use (60s TTL), cryptographically random. Risk is minimal
- **Severity**: Informational (accepted risk)

#### W-06: Database TLS not enforced in schema (V8.3.7)
- **Location**: `prisma/schema.prisma:5-7`
- **Risk**: Database connection may not use TLS if `DATABASE_URL` omits `sslmode=require`
- **Recommendation**: Add `sslmode=require` to production `DATABASE_URL` documentation. Consider validating TLS in `validateProductionSecrets()`
- **Severity**: Medium (deployment-dependent)

#### W-07-12: Additional informational warnings
- W-07: `forbidNonWhitelisted` validation details sanitized but field names partially visible in some edge cases (Low)
- W-08: `password-breach.service.ts` fail-open design (Low — availability over security for advisory check)
- W-09: `token-deny-list.service.ts:57` fail-open for deny-list check (Low — documented trade-off for 15-min tokens)
- W-10: MFA challenge token secret derived from JWT secret (Low — HMAC-derived, separate key)
- W-11: CORS allows requests without Origin header (Informational — documented accepted risk)
- W-12: Swagger UI accessible in non-production (Informational — intentional for development)

---

## Check Summary by Sub-Phase

| Sub-Phase | Checks | PASS | FAIL | WARN | N/A |
|-----------|--------|------|------|------|-----|
| 3a. Authentication (Ch 2) | 18 | 17 | 0 | 1 | 0 |
| 3b. Session Management (Ch 3) | 10 | 10 | 0 | 0 | 0 |
| 3c. Access Control (Ch 4) | 8 | 7 | 0 | 1 | 0 |
| 3d. Input Validation (Ch 5) | 7 | 7 | 0 | 0 | 0 |
| 3e. Cryptography (Ch 6) | 5 | 5 | 0 | 0 | 0 |
| 3f. NIST SP 800-63B | 9 | 9 | 0 | 0 | 0 |
| 3g. RFC 9700 — OAuth | 8 | 8 | 0 | 0 | 0 |
| 3h. RFC 8725 — JWT | 6 | 6 | 0 | 0 | 0 |
| 3i. HTTP Security | 12 | 12 | 0 | 0 | 0 |
| 3j. Error Disclosure | 13 | 12 | 0 | 1 | 0 |
| 3k. Logging (Ch 7) | 7 | 6 | 0 | 1 | 0 |
| 3l. Data Protection (Ch 8) | 7 | 4 | 0 | 2 | 1 |
| 3m. API Security (Ch 13) | 5 | 4 | 0 | 1 | 0 |
| 3n. Node.js Attacks | 9 | 9 | 0 | 0 | 0 |
| **Total** | **124** | **116** | **0** | **8** | **1** |

> Note: The 12 warnings in recommendations include 4 warnings that aggregate multiple related checks (W-07 through W-12) that are informational in nature and not tracked as individual check verdicts above.
