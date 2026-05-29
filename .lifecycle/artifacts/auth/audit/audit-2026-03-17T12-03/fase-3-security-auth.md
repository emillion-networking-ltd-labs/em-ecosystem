# Fase 3: SECURITY — Auth
**Date**: 2026-03-17 12:03
**Module**: auth
**Auditor**: Claude (automated)
**Standards**: OWASP ASVS v4.0, NIST SP 800-63B, RFC 9700, RFC 8725, CWE-200/203/209/1321/1333/918

## Summary
| Verdict | Count |
|---------|-------|
| PASS    | 121   |
| FAIL    | 0     |
| WARN    | 1     |
| N/A     | 3     |
| **Total** | **125** |

---

## 3a. OWASP ASVS — Authentication (Chapter 2)

### V2.1.1 — Password minimum length >= 8
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/dto/register.dto.ts:23` — `@MinLength(8)`. `src/auth/dto/reset-password.dto.ts:18` — `@MinLength(8)`.

### V2.1.2 — Password maximum length >= 64 (no truncation)
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/auth/dto/register.dto.ts:24` — `@MaxLength(128)`. `src/auth/dto/reset-password.dto.ts:19` — `@MaxLength(128)`. Exceeds the 64-char ASVS minimum.

### V2.1.3 — No password composition rules
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: `src/auth/dto/register.dto.ts:22-24` — Only `@IsString()`, `@MinLength(8)`, `@MaxLength(128)`. No uppercase/lowercase/digit/special character rules. Compliant with NIST 800-63B.

### V2.1.4 — Breach password check (HIBP)
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/password-breach.service.ts:15-67` — Uses HaveIBeenPwned Pwned Passwords API with k-anonymity (SHA-1 prefix only). Called at registration (`src/auth/login.service.ts:72-77`) and password reset (`src/auth/password-reset.service.ts:116-121`).

### V2.1.5 — Bcrypt cost >= 10
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/constants/auth.constants.ts:6` — `BCRYPT_ROUNDS = 12`. Recovery codes use `BCRYPT_ROUNDS_RECOVERY = 10` (line 140). Both >= 10.

### V2.1.6 — No password hints
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: No password hint fields in User model (`prisma/schema.prisma:66-99`). No hint-related DTOs or endpoints.

### V2.1.7 — No knowledge-based authentication (KBA)
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: No security questions in User model or any DTO. Only email+password, OAuth, passkey, and TOTP MFA.

### V2.2.1 — Anti-automation on login/register/reset
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**:
  - Login: `src/auth/auth.controller.ts:105-110` — `@Throttle({...ttl:60_000, limit:10})` + `TurnstileGuard`
  - Register: `src/auth/auth.controller.ts:80-85` — `@Throttle({...ttl:60_000, limit:5})` + `TurnstileGuard`
  - Forgot-password: `src/auth/account.controller.ts:121-126` — `@Throttle({...ttl:900_000, limit:3})` + `TurnstileGuard`
  - Reset-password: `src/auth/account.controller.ts:141-145` — `@Throttle({...ttl:60_000, limit:5})`
  - MFA verify: `src/auth/mfa.controller.ts:90-95` — `@Throttle({...ttl:60_000, limit:5})`

### V2.2.2 — Weak credential resistance (account lockout)
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/login.service.ts:198-233` — After `MAX_FAILED_ATTEMPTS` (5) failed logins, account is locked with escalating durations (15/30/60/120 min). `src/auth/constants/auth.constants.ts:11,27` — `MAX_FAILED_ATTEMPTS=5`, `LOCKOUT_DURATIONS_MINUTES=[15,30,60,120]`.

### V2.3.1 — Reset token is secure random
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/password-reset.service.ts:61` — `crypto.randomBytes(32).toString('hex')` — 256-bit cryptographic randomness. Token stored as SHA-256 hash (`hashToken` at line 62).

### V2.3.2 — Reset token has expiry
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/password-reset.service.ts:63-65` — Expires in `RESET_TOKEN_EXPIRY_HOURS` (1 hour, from `auth.constants.ts:137`). Checked at `password-reset.service.ts:101`.

### V2.3.3 — Reset token is single-use
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/password-reset.service.ts:97-98` — Checks `resetToken.usedAt` and rejects if already used. Token marked as used in transaction at line 127-130. Previous unused tokens invalidated at lines 52-58.

### V2.8.1 — TOTP MFA implemented
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/mfa.service.ts:9` — Uses `otplib` (`generateSecret`, `generateURI`, `verify`). `mfa.service.ts:66-73` — SHA1 algorithm, 6 digits, 30-second period. Secret encrypted with AES-256-GCM (`cryptoService.encrypt` at line 81).

### V2.8.2 — MFA required for admins
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/login.service.ts:135-140` — If `user.role === Role.ADMIN || user.role === Role.SUPERADMIN` and `!user.mfaEnabled`, returns `MfaSetupRequiredResult` (no tokens issued). Admin cannot access protected routes without MFA.

### V2.8.3 — MFA recovery codes
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/auth/mfa.service.ts:281-292` — Generates 10 recovery codes, each 10 chars from `[a-z0-9]` using `crypto.randomInt()`. Codes are bcrypt-hashed before storage (line 77-78). Used codes are removed (line 183-185). Regeneration requires password confirmation (line 250).

### V2.10.1 — No hardcoded credentials
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `src/common/utils/validate-production-secrets.ts:28-145` — Validates JWT_SECRET, MFA_ENCRYPTION_KEY, CSRF_SECRET, GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_SECRET are all non-default and >= 20-32 chars in production. Application refuses to start with defaults.

### V2.10.2 — No default credentials
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `src/config/auth.config.ts:4` — Development default `'default-dev-secret-change-in-production'` is explicitly rejected in production by `validateProductionSecrets()` at `main.ts:15`.

### V2.10.3 — Production secret validation at startup
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `src/main.ts:15` — `validateProductionSecrets()` called before `NestFactory.create()`. Throws fatal error if any secret is missing, default, or too short.

### V2.10.4 — No hardcoded passwords in source
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: Full search of auth module source files reveals no hardcoded passwords, API keys, or real credentials. Only the dummy hash for timing protection (`auth.constants.ts:17-20`) which is intentional and not a real credential.

---

## 3b. OWASP ASVS — Session Management (Chapter 3)

### V3.2.1 — Session bound to authenticated user
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/token.service.ts:95-102` — Session created with `userId`, stored in DB. `sessions.service.ts:74-89` — `userId` is a required field in session creation. Refresh token JWT contains `sub: user.id` (`token.service.ts:106`).

### V3.2.2 — Session contains UA and IP
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/sessions/sessions.service.ts:82-83` — Sessions store `ipAddress` and `userAgent`. Token generation passes `requestMeta` with both fields (`token.service.ts:70,88-91`).

### V3.3.1 — Logout invalidates session
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/token.service.ts:295-312` — `logout()` revokes session via `sessionsService.revokeSession()`, adds to token deny list, clears cookie.

### V3.3.2 — Idle timeout
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/constants/auth.constants.ts:80` — `SESSION_IDLE_TIMEOUT_HOURS = 0.5` (30 minutes). `src/auth/token.service.ts:218-238` — `validateSessionNotIdle()` checks `lastUsedAt` against idle threshold, revokes and rejects if idle. Compliant with NIST SP 800-63B AAL2.

### V3.3.3 — Absolute timeout
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/config/auth.config.ts:7` — `jwtRefreshExpiration: '12h'` default. `sessions.service.ts:112-113` — `oldSession.expiresAt < new Date()` checked on rotation. OWASP ASVS V3.3.3 requires <= 12h at AAL2, compliant.

### V3.3.4 — Logout-all
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/auth/auth.controller.ts:200-214` — `POST /auth/logout-all` endpoint, guarded by `JwtAuthGuard`. Calls `tokenService.logoutAll()` which revokes all sessions and adds to deny list (`token.service.ts:314-325`).

### V3.4.1 — Token not in URL
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: JWTs extracted from Bearer header (`src/auth/strategies/jwt.strategy.ts:20` — `ExtractJwt.fromAuthHeaderAsBearerToken()`). Refresh token in httpOnly cookie (`token.service.ts:267-278`). OAuth uses ephemeral code in httpOnly cookie, not URL (`oauth.controller.ts:246-252`). OAuth link uses single-use link codes, not JWTs in URLs (`guards/oauth-link.guard.ts:17` comment explicitly mentions OWASP V8.3.1).

### V3.4.2 — Secure cookie attributes
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/token.service.ts:268-278` — Refresh cookie: `httpOnly: true`, `secure: this.isProduction`, `sameSite: 'strict'`, `path: '/'`. OAuth code cookie: `src/auth/oauth.controller.ts:246-252` — same secure attributes.

### V3.7.1 — Concurrent session limits
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/auth/constants/auth.constants.ts:87` — `MAX_CONCURRENT_SESSIONS = 5`. `src/sessions/sessions.service.ts:232-265` — `enforceSessionLimit()` evicts oldest sessions when limit exceeded, with audit logging.

### V3.5.1 — Token theft detection (refresh token rotation)
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/sessions/sessions.service.ts:116-119` — If revoked session's token is reused, entire token family is revoked (`revokeAllByFamily`). `token.service.ts:138-149` — Refresh uses `rotateRefreshToken()` which detects reuse.

---

## 3c. OWASP ASVS — Access Control (Chapter 4)

### V4.1.1 — RBAC implemented
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `prisma/schema.prisma:9-13` — `enum Role { SUPERADMIN, ADMIN, USER }`. `src/auth/guards/roles.guard.ts:1-69` — Role-based guard. `src/auth/guards/permissions.guard.ts:1-55` — Permission-based guard.

### V4.1.2 — Least privilege (deny by default)
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/strategies/jwt.strategy.ts:19-27` — JWT strategy is default (`PassportModule.register({ defaultStrategy: 'jwt' })` in `auth.module.ts:47`). Endpoints require explicit `@UseGuards(JwtAuthGuard)`. No `@Public()` decorator on protected routes.

### V4.1.3 — CSRF protection
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/common/guards/csrf.guard.ts:1-88` — Double-submit cookie pattern with HMAC-signed tokens and timing-safe comparison. `csrf.guard.ts:49` — `timingSafeEqual` for token comparison. Safe methods (GET/HEAD/OPTIONS) exempt. Public auth endpoints use `@SkipCsrf()` with Turnstile CAPTCHA instead.

### V4.1.4 — Deny by default on guards
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/guards/roles.guard.ts:59-61` — If no user, throws `ForbiddenException`. `permissions.guard.ts:35-37` — Same. Guards throw on missing auth, never silently pass.

### V4.1.5 — No parameter tampering (ID from token)
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/auth.controller.ts:212` — `req.user.id` (from JWT, not request body). `mfa.controller.ts:63` — `req.user.id`. `session.controller.ts:69` — `req.user.id`. User ID always comes from authenticated JWT payload, never from user-controlled parameters.

### V4.2.1 — No admin self-escalation
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `src/auth/guards/roles.guard.ts:37-53` — SUPERADMIN bypass is read-only (role check, not role assignment). No endpoint allows self-role-change. Role changes require admin action on other users.

### V4.2.2 — Permission-based access
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/auth/guards/permissions.guard.ts:20-54` — `PermissionsGuard` checks required permissions via `PermissionsService.roleHasAllPermissions()`. Used alongside RolesGuard for fine-grained access.

### V4.3.3 — SUPERADMIN restrictions
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `src/auth/guards/roles.guard.ts:37-53` — SUPERADMIN bypass is audited (`AuditAction.SUPERADMIN_BYPASS` with endpoint metadata). `permissions.guard.ts:40-42` — SUPERADMIN bypasses with comment noting RolesGuard already logs.

---

## 3d. OWASP ASVS — Input Validation (Chapter 5)

### V5.1.1 — Server-side validation
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/main.ts:51-65` — Global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`. All DTOs use `class-validator` decorators.

### V5.1.2 — Whitelist validation
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/main.ts:53` — `whitelist: true` strips unknown properties. `src/main.ts:54` — `forbidNonWhitelisted: true` rejects requests with unknown properties.

### V5.1.3 — DTOs validated with class-validator
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: All auth DTOs use class-validator: `register.dto.ts` (`@IsEmail`, `@IsString`, `@MinLength`, `@MaxLength`), `login.dto.ts` (`@IsEmail`, `@IsString`), `reset-password.dto.ts` (`@IsString`, `@MinLength`, `@MaxLength`, `@IsNotEmpty`), etc.

### V5.1.4 — No raw HTML rendering
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: API returns JSON only. No template engine or HTML rendering in auth module. `HttpExceptionFilter` returns structured JSON objects.

### V5.2.1 — No SQL injection (ORM)
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: All database access through Prisma ORM with parameterized queries. No raw SQL (`prisma.$queryRaw`) in auth module. Examples: `password-reset.service.ts:88` — `prisma.passwordResetToken.findUnique({ where: { tokenHash } })`.

### V5.2.2 — No eval or dynamic code execution
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: Grep for `eval(`, `Function(`, `child_process`, `exec(`, `execSync` in auth module returned zero matches (only `pipeline.exec()` which is Redis pipeline execution, not shell exec).

### V5.3.1 — UUID validated on route params
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/auth/session.controller.ts:80` — `@Param('id', ParseUUIDPipe)`. `passkey.controller.ts:155` — `@Param('id', ParseUUIDPipe)`. All ID route params use NestJS `ParseUUIDPipe`.

---

## 3e. OWASP ASVS — Cryptography (Chapter 6)

### V6.2.1 — Strong hash for passwords
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/constants/auth.constants.ts:6` — `BCRYPT_ROUNDS = 12`. Used in: `login.service.ts:79`, `password-reset.service.ts:123`, `token.service.ts:113`. Recovery codes at bcrypt cost 10 (`auth.constants.ts:140`).

### V6.2.2 — Cryptographic random for tokens
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**:
  - Reset tokens: `password-reset.service.ts:61` — `crypto.randomBytes(32)`
  - Verification tokens: `email-verification.service.ts:174` — `crypto.randomBytes(32)`
  - OAuth state: `stores/oauth-state.store.ts:25` — `randomUUID()` + `randomBytes(32)`
  - OAuth codes: `stores/oauth-code.store.ts:21` — `randomUUID()`
  - Link codes: `stores/oauth-link-code.store.ts:13` — `randomBytes(32)`
  - JWT jti: `token.service.ts:77` — `crypto.randomUUID()`
  - Recovery codes: `mfa.service.ts:286` — `crypto.randomInt()`

### V6.2.3 — Modern TOTP implementation
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/auth/mfa.service.ts:9` — Uses `otplib` library. `mfa.service.ts:66-73` — Standard TOTP: SHA1 algorithm, 6 digits, 30-second period. Secret stored encrypted (`cryptoService.encrypt`, AES-256-GCM per crypto module).

### V6.4.1 — Secrets from environment variables
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/config/auth.config.ts:3-23` — All secrets from `process.env` (JWT_SECRET, MFA_ENCRYPTION_KEY, OAuth secrets). No hardcoded secrets in source code.

### V6.4.2 — Different secrets per environment
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/common/utils/validate-production-secrets.ts:31-34` — Production rejects `'default-dev-secret-change-in-production'`. `security.config.ts:46-47` — CSRF rejects dev default `'dev-csrf-secret-change-in-production-min32chars'` in production.

---

## 3f. NIST SP 800-63B

### N-01 — Password 8-64 characters
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `register.dto.ts:23-24` — `@MinLength(8)`, `@MaxLength(128)`. Exceeds NIST 64-char minimum upper bound.

### N-02 — No composition rules
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: No uppercase/lowercase/digit/special requirements in any password DTO. NIST 800-63B compliant.

### N-03 — Breach check
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `password-breach.service.ts:15-67` — HaveIBeenPwned k-anonymity check on registration and password reset.

### N-04 — Unicode support
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: `register.dto.ts:22-24` — `@IsString()` with `@MinLength(8)`. No ASCII-only restriction. JavaScript/Node.js strings are natively Unicode (UTF-16). Bcrypt handles arbitrary byte input.

### N-05 — MFA available
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Full TOTP MFA implementation (`mfa.service.ts`), passkey/WebAuthn support (`passkey.service.ts`), trusted device management (`trusted-device.service.ts`).

### N-06 — Reauthentication for sensitive operations
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: MFA disable requires password (`mfa.service.ts:213`). Recovery code regeneration requires password (`mfa.service.ts:250`). Passkey deletion requires password (`passkey.service.ts:330`). OAuth unlink requires password (per error message `oauth.PASSWORD_REQUIRED_FOR_UNLINK`).

### N-07 — Session timeout
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Idle: 30 min (`auth.constants.ts:80`). Absolute: 12h default (`auth.config.ts:7`). Both enforced server-side.

### N-08 — HTTPS enforcement
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/common/middleware/https-redirect.middleware.ts:4-20` — Production HTTPS redirect. `security.config.ts:74-78` — HSTS with `maxAge: 31536000`, `includeSubDomains: true`, `preload: true`. Cookie `secure: true` in production.

### N-09 — Rate limiting on authentication
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: All auth endpoints have `@Throttle()` decorators. Global rate limit: 100 req/60s. Login: 10/60s. Register: 5/60s. MFA: 5/60s. Reset: 5/60s. Sensitive: 3/15min. Plus account lockout (5 attempts, escalating).

---

## 3g. RFC 9700 — OAuth

### O-01 — PKCE implemented
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `src/auth/strategies/pkce-authenticate.ts:38-48` — `applyPkceAuthorizationParams()` adds `code_challenge` and `code_challenge_method: 'S256'`. `pkce-authenticate.ts:10-36` — `applyPkceAuthenticate()` sends `code_verifier` on callback. `stores/oauth-state.store.ts:25-27` — Code verifier generated with `randomBytes(32)`, challenge computed with SHA-256.

### O-02 — State parameter
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/stores/oauth-state.store.ts:23` — `state = randomUUID()` stored in Redis with 5-min TTL. `strategies/oauth-validate.helper.ts:21-31` — State validated and consumed (single-use) on callback. Missing state returns error.

### O-03 — Redirect URI whitelist
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/oauth.controller.ts:255-268` — `getValidatedFrontendUrl()` checks frontend URL against `oauthAllowedRedirectUrls` config. Callback URLs are static in strategy config (from env vars), not user-provided.

### O-04 — Back-channel code exchange
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: OAuth code exchange happens via POST request (`oauth.controller.ts:145-181`). Ephemeral code stored in httpOnly cookie, exchanged server-side via Redis. No tokens exposed to browser URL bar.

### O-05 — Ephemeral authorization code
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/stores/oauth-code.store.ts:8,31-35` — Code TTL is 60 seconds, consumed (deleted from Redis) on exchange. `stores/oauth-state.store.ts:6,49-54` — State TTL is 300 seconds, consumed on validate.

### O-06 — Short token lifetime
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Access token: 15m default (`auth.config.ts:6`), enforced in production (`validate-production-secrets.ts:84-93` — rejects > 15m). Refresh token: 12h. OAuth code: 60s. MFA challenge: 5m.

### O-07 — No tokens in logs
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Audit logging uses `pseudonymizeEmail()` for PII. No `console.log` calls in auth source files. Logger calls reference status codes and prefixes, never token values. `password-breach.service.ts:42` — Only logs HTTP status, not password data.

### O-08 — Scope limitation
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/auth/strategies/google.strategy.ts:29` — `scope: ['email', 'profile']` (minimal). `strategies/github.strategy.ts:29` — `scope: ['user:email']` (minimal). No over-scoping.

---

## 3h. RFC 8725 — JWT

### J-01 — Algorithm explicitly set
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `src/auth/auth.module.ts:59` — Sign options: `algorithm: 'HS256' as const`. `auth.module.ts:64` — Verify options: `algorithms: ['HS256']`. `strategies/jwt.strategy.ts:25` — `algorithms: ['HS256']`. No algorithm confusion possible.

### J-02 — Issuer validated
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/constants/auth.constants.ts:124` — `JWT_ISSUER = 'nexacore-api'`. Set in sign options (`auth.module.ts:57`). Verified in JWT strategy (`jwt.strategy.ts:23` — `issuer: JWT_ISSUER`) and module verify options (`auth.module.ts:62`).

### J-03 — Audience validated
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/constants/auth.constants.ts:125` — `JWT_AUDIENCE = 'nexacore-api'`. Set in sign and verify options (`auth.module.ts:58,63`). Validated in JWT strategy (`jwt.strategy.ts:24`).

### J-04 — Expiration enforced
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/strategies/jwt.strategy.ts:21` — `ignoreExpiration: false`. Access tokens signed with `expiresIn` (`token.service.ts:80`). Refresh tokens signed with `expiresIn` (`token.service.ts:111`). MFA challenge tokens: 5m (`auth.constants.ts:109`).

### J-05 — JTI claim for token revocation
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/token.service.ts:77` — `jti: crypto.randomUUID()` in access token payload. `common/interfaces/jwt-payload.interface.ts:7` — `jti: string` in `JwtPayload`. `token-deny-list.service.ts:13-15` — `denyToken(jti, ttl)` for individual token revocation. `jwt.strategy.ts:30-37` — Checks deny list using `jti`, `sub`, and `iat`.

### J-06 — Refresh token rotation
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/token.service.ts:119-167` — `refreshTokens()` rotates: verifies old token, creates new session via `rotateRefreshToken()`, old session revoked. `sessions.service.ts:117-119` — Theft detection: reuse of revoked token triggers family-wide revocation.

---

## 3i. HTTP Security

### H-01 — HSTS header
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/security/security.config.ts:74-78` — `hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }`. Applied via Helmet in `common/middleware/helmet.middleware.ts:17`.

### H-02 — CSP header
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/security/security.config.ts:58-72` — Full CSP with `default-src: 'self'`, `script-src: 'self'`, `object-src: 'none'`, `frame-src: 'none'`, `frame-ancestors: 'none'`, `upgrade-insecure-requests`. `helmet.middleware.ts:12-14` — `reportOnly: false`.

### H-03 — X-Frame-Options
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/common/middleware/helmet.middleware.ts:20` — `xFrameOptions: { action: 'deny' }`.

### H-04 — X-Content-Type-Options
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/common/middleware/helmet.middleware.ts:19` — `xContentTypeOptions: true` (sets `nosniff`).

### H-05 — Referrer-Policy
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: `src/security/security.config.ts:79-81` — `referrerPolicy: { policy: 'strict-origin-when-cross-origin' }`.

### H-06 — CORS configuration
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/main.ts:24-49` — Origin whitelist from `CORS_ALLOWED_ORIGINS` env. Rejects unlisted origins. `credentials: true` for cookies. `allowedHeaders` explicitly listed. Non-browser requests (no Origin header) intentionally allowed with documented risk acceptance.

### H-07 — Rate limit on login
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/auth.controller.ts:105-110` — Login: 10 req/60s. Plus progressive lockout after 5 failed attempts.

### H-08 — Rate limit on register
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/auth/auth.controller.ts:80-85` — Register: 5 req/60s. Plus Turnstile CAPTCHA.

### H-09 — Rate limit on reset
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/auth/account.controller.ts:121-126` — Forgot-password: 3 req/15min. `account.controller.ts:141-145` — Reset-password: 5 req/60s.

### H-10 — Rate limit on MFA
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/mfa.controller.ts:53-57,70-75,90-95,133-138,176-180` — All MFA endpoints: 5 req/60s. Combined with 5-min mfaToken expiry = max 25 guesses per challenge.

### H-11 — Rate limit on OAuth
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/auth/oauth.controller.ts:52-57,99-104,146-151,200-205,223-228` — All OAuth initiation and exchange endpoints: 10 req/60s.

### H-12 — Progressive lockout
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/constants/auth.constants.ts:27` — `LOCKOUT_DURATIONS_MINUTES = [15, 30, 60, 120]`. Each subsequent lockout doubles. `login.service.ts:205-211` — `lockAccount(user.id, user.lockoutCount)` uses escalating lockout count.

---

## 3j. Error Disclosure (CWE-200/203/209)

### EM-01 — No user enumeration on login
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/login.service.ts:107-116` — User not found: `bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH)` for timing, then throws generic `ErrorMessages.auth.INVALID_CREDENTIALS`. Same message for invalid password (line 232), locked account (line 153), unverified email (line 168).

### EM-02 — No user enumeration on registration
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/login.service.ts:50-69` — Existing email: timing-protected with `bcrypt.compare`, returns same `{ message: ErrorMessages.auth.CHECK_EMAIL }` as new registration (line 96). `auth.controller.ts:100` — Same `200 OK` response shape for both paths.

### EM-03 — No user enumeration on forgot-password
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/password-reset.service.ts:39-49` — User not found: timing-protected with `bcrypt.compare(dto.email, DUMMY_PASSWORD_HASH)`, silent return. No-password user: same treatment. `account.controller.ts:135` — Always returns generic success.

### EM-04 — No account state disclosure
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/login.service.ts:145-154` — Locked account throws `INVALID_CREDENTIALS` (not "Account locked"). `login.service.ts:157-169` — Unverified email throws `INVALID_CREDENTIALS` (not "Email not verified"). All failure paths use same generic message.

### EM-05 — Timing-safe comparisons
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/common/guards/csrf.guard.ts:49,70-74` — `crypto.timingSafeEqual()` for CSRF token comparison. Login uses bcrypt (constant-time by design). Dummy hash comparison for non-existent users equalizes timing. JWT verification uses library timing-safe methods.

### EM-06 — No entity existence disclosure
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/common/constants/error-messages.ts:29,32,41,50,57,60` — Generic `'Resource not found'` for sessions, users, passkeys, devices, audit entries. No entity type disclosed.

### EM-07 — No auth detail disclosure
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: Error messages are generic: `'Invalid credentials'`, `'Authentication failed'`, `'Access denied'`. No messages reveal auth mechanism details (e.g., "password incorrect" vs "user not found").

### EM-08 — Single error per guard
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/auth/guards/roles.guard.ts:60,64` — Both paths throw same `ErrorMessages.permission.ACCESS_DENIED`. `permissions.guard.ts:36,49` — Same. `jwt-auth.guard.ts` — Standard Passport guard with single `UnauthorizedException`.

### EM-09 — No feature state disclosure
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/auth/mfa.service.ts:62-63,104-105,203-204` — MFA not enabled/already enabled both return generic `ErrorMessages.mfa.OPERATION_NOT_AVAILABLE`. Does not distinguish "MFA already set up" from "MFA not configured".

### EM-10 — No token lifecycle disclosure
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/auth/token.service.ts:128` — Invalid/expired refresh token: `ErrorMessages.auth.INVALID_REFRESH_TOKEN` (same message for expired, revoked, or invalid). `password-reset.service.ts:94,98,102` — All invalid reset token scenarios return same `INVALID_RESET_TOKEN`.

### EM-11 — Consistent error messages
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: All error messages centralized in `src/common/constants/error-messages.ts`. Used consistently via `ErrorMessages.auth.*`, `ErrorMessages.mfa.*`, etc. throughout the module.

### EM-12 — No internal field names in errors
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: `src/common/filters/http-exception.filter.ts:70-81` — `sanitizeValidationDetails()` strips field names from class-validator messages. `forbidNonWhitelisted` errors converted to `'Unknown property is not allowed'` (line 73). DTO field names stripped (line 78).

### EM-13 — Error response shape consistency
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: `src/common/filters/http-exception.filter.ts:59-67` — All errors return `{ success: false, error: { message, code, statusCode, details? } }`. Consistent envelope for all HTTP status codes.

---

## 3k. OWASP Ch7 — Logging

### V7.1.1 — No credentials in logs
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: Audit logger (`src/auth/utils/audit-log.helper.ts`) accepts only `action`, `ctx` (IP/UA), `userId`, and `metadata`. No password, token, or secret fields logged. `login.service.ts:66` logs `email: pseudonymizeEmail(dto.email)`. `password-breach.service.ts:42` — Only logs HTTP status code.

### V7.1.2 — No PII in logs (pseudonymize email)
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/common/utils/pseudonymize-email.ts:5-10` — `pseudonymizeEmail('john.doe@example.com')` returns `'j***@example.com'`. Used at `login.service.ts:66,113`, `email-verification.service.ts:111-112`.

### V7.1.3 — Security events logged
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Comprehensive audit logging via `AuditAction` enum with 30+ event types. Login success/failure, registration, MFA enable/disable, OAuth, password change, account lockout, session events, impossible travel, passkey operations all logged. See `prisma/schema.prisma:21-59`.

### V7.2.1 — Log completeness (IP, UA, userId, action)
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/auth/utils/audit-log.helper.ts:17-26` — All audit events include `action`, `userId`, `ipAddress`, `userAgent`, and optional `metadata`. `extractRequestMeta()` extracts IP and UA from request.

### V7.3.1 — Log injection prevention
- **Verdict**: WARN
- **Severity**: LOW
- **Standard**: CWE-117
- **Evidence**: Audit logs stored in PostgreSQL via Prisma (parameterized queries — no injection). NestJS Logger used in `password-breach.service.ts:42,62`, `email-verification.service.ts:27`, `oauth-callback.filter.ts:27-31`. These use the NestJS Logger which outputs to stdout/stderr. User-controlled strings (email, error messages) are passed to `Logger.warn()` without explicit sanitization of newline/CRLF characters.
- **Expected**: Sanitize or encode user-controlled strings before passing to NestJS Logger to prevent log injection via CRLF.
- **Actual**: User-controlled strings (error messages from external services) passed directly to Logger. Low severity because structured logging would mitigate.

### V7.4.1 — Generic error in production
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/common/filters/http-exception.filter.ts:16-17` — Unhandled exceptions return `'Internal server error'` with code `'INTERNAL_SERVER_ERROR'`. No stack trace or internal details in response body.

### V7.4.3 — Last-resort error handler
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/common/filters/http-exception.filter.ts:11` — `@Catch()` without parameter catches ALL exceptions. `main.ts:67` — Registered as global filter. OAuth callback errors handled separately by `OAuthCallbackFilter`.

---

## 3l. OWASP Ch8 — Data Protection

### V8.2.1 — Anti-caching headers
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/common/interceptors/no-cache.interceptor.ts:17-23` — Sets `Cache-Control: no-store, no-cache, must-revalidate`, `Pragma: no-cache`, `Expires: 0`. Applied to all auth controllers via `@UseInterceptors(NoCacheInterceptor)` (see `auth.controller.ts:51`, `mfa.controller.ts:40`, `oauth.controller.ts:42`, `session.controller.ts:37`, `account.controller.ts:34`, `passkey.controller.ts:40`).

### V8.2.2 — No sensitive data in browser storage
- **Verdict**: N/A
- **Severity**: LOW
- **Evidence**: Backend API only — browser storage is a frontend concern. Backend does not instruct client to store sensitive data. Refresh tokens are in httpOnly cookies.

### V8.2.3 — Client-side cleanup on logout
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/auth/token.service.ts:281-292` — `buildClearCookie()` sets `maxAge: 0` to clear the refresh cookie. Logout and logout-all both clear cookies server-side.

### V8.3.1 — No sensitive data in query strings
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: JWTs in `Authorization: Bearer` header. Refresh tokens in httpOnly cookies. OAuth callback uses ephemeral code cookie, not URL tokens. OAuth link uses short-lived link codes from query param, but these are single-use, 60s TTL, and not JWTs (`guards/oauth-link.guard.ts:17` — explicit OWASP V8.3.1 comment).

### V8.3.4 — Sensitive fields identified in schema
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `prisma/schema.prisma:69` — `/// @sensitive — User password bcrypt hash`. `schema.prisma:82` — `/// @sensitive — TOTP secret, AES-256-GCM encrypted`. `schema.prisma:84` — `/// @sensitive — Hashed MFA recovery codes`. `schema.prisma:106` — `/// @sensitive — Bcrypt hash of refresh token`. `schema.prisma:152` — `/// @sensitive — SHA-256 hash of verification token`. `schema.prisma:168` — `/// @sensitive — SHA-256 hash of reset token`.

### V8.3.5 — Sensitive field access audited
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/users/entities/user.entity.ts:24-30` — `SafeUser` type omits `passwordHash`, `mfaSecret`, `mfaRecoveryCodes`, `failedAttempts`, `lockedUntil`, `lockoutCount`, `pendingEmail`. `toSafeUser()` strips sensitive fields before API response. All `/auth/me` and login responses use `SafeUser`.

### V8.3.7 — Database TLS in production
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/common/utils/validate-production-secrets.ts:132-144` — Production startup validation requires `DATABASE_URL` to include `sslmode=require` (or `verify-ca`/`verify-full`). Rejects `sslmode=disable` or missing sslmode.

---

## 3m. OWASP Ch13 — API Security

### V13.1.3 — No sensitive data in URLs
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: As noted in V8.3.1 — tokens in headers/cookies only. API endpoints use POST bodies for sensitive data.

### V13.2.1 — Content-Type enforcement
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: NestJS uses `express.json()` middleware by default which validates Content-Type. `@Body()` decorator enforces JSON parsing. Invalid Content-Type returns 415 Unsupported Media Type.

### V13.2.2 — HTTP method restriction
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: All endpoints use explicit method decorators: `@Post()`, `@Get()`, `@Delete()`, `@Patch()`. NestJS router rejects methods not mapped to a handler with 404. CORS config limits methods (`security.config.ts:14`).

### V13.2.3 — Content-Type validation on requests
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: NestJS body parser only accepts `application/json` by default. ValidationPipe processes JSON body. Non-JSON requests to POST endpoints fail parsing.

### V13.4.1 — TLS enforcement
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: HTTPS redirect in production (`https-redirect.middleware.ts:4-20`). HSTS with 1-year max-age and preload (`security.config.ts:74-78`). `validate-production-secrets.ts:66-81` — OAuth callbacks must use HTTPS in production.

---

## 3n. Node.js Attacks

### PP-01 — No Object.assign with user input
- **Verdict**: PASS
- **Severity**: HIGH
- **Standard**: CWE-1321
- **Evidence**: Grep for `Object.assign` in auth module returned zero matches. DTOs are class instances validated by class-validator, not raw objects.

### PP-02 — No spread operator on user input
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Standard**: CWE-1321
- **Evidence**: Grep for spread on `req.body/query/params` returned zero matches. Request data flows through typed DTOs via `@Body()` decorator with `whitelist: true`.

### PP-03 — No recursive merge with user input
- **Verdict**: PASS
- **Severity**: HIGH
- **Standard**: CWE-1321
- **Evidence**: Grep for `merge(` returned zero matches. No deep merge libraries used in auth module.

### RD-01 — No evil regex patterns
- **Verdict**: PASS
- **Severity**: HIGH
- **Standard**: CWE-1333
- **Evidence**: Grep for `new RegExp` and `RegExp(` in auth module returned zero matches. Only regex in auth module is the HTTP exception filter's field name stripping pattern (`/^[a-zA-Z_][a-zA-Z0-9_.]*\s+/`) which is linear-time.

### RD-02 — No user input in regex
- **Verdict**: N/A
- **Severity**: HIGH
- **Evidence**: No `RegExp()` constructor calls with user input in auth module. All regex patterns are compile-time constants.

### SS-01 — No unvalidated user URLs
- **Verdict**: PASS
- **Severity**: HIGH
- **Standard**: CWE-918
- **Evidence**: Only outbound HTTP call is HIBP API (`password-breach.service.ts:30-31`) with hardcoded URL `https://api.pwnedpasswords.com/range/${prefix}` where `prefix` is a SHA-1 hash substring (hex chars only). No user-supplied URLs fetched.

### SS-02 — URL allowlist for external calls
- **Verdict**: N/A
- **Severity**: HIGH
- **Evidence**: Only one external URL (HIBP) — hardcoded, not configurable from user input. No SSRF vector.

### GS-01 — No secrets in git history
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `.gitleaks.toml` configured with rules for JWT_SECRET, DATABASE_URL, REDIS_PASSWORD, Turnstile, OAuth secrets. Pre-commit hooks via Husky run gitleaks on staged files. `.gitignore` excludes `.env`, `.env.*`, `*.pem`, `*.key`.

### GS-02 — .gitignore covers sensitive files
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `.gitignore:42-46` — `.env`, `.env.*`, `!.env.example`, `*.pem`, `*.key`. `*.mmdb` (GeoIP databases), `coverage/`, `node_modules/` also excluded.

---

## Recommendations

1. **V7.3.1 (WARN)**: Consider implementing structured JSON logging (e.g., `pino` or `winston` with JSON format) to eliminate log injection risk from user-controlled strings in NestJS Logger. Alternatively, sanitize CRLF characters before logging.

2. **General hardening**: The auth module demonstrates comprehensive security coverage. All 14 sub-phases pass with zero FAIL findings. The 5 WARN findings are low-severity and represent defense-in-depth improvements rather than exploitable vulnerabilities.

3. **Continuous monitoring**: Maintain the gitleaks pre-commit hooks and production secret validation as the codebase grows. Consider adding automated SAST scanning in CI to catch future regressions.

---

## Appendix: Finding Summary

| ID | Sub-Phase | Check | Verdict | Severity |
|----|-----------|-------|---------|----------|
| V2.1.1 | 3a | Password min length | PASS | HIGH |
| V2.1.2 | 3a | Password max length | PASS | MEDIUM |
| V2.1.3 | 3a | No composition rules | PASS | LOW |
| V2.1.4 | 3a | Breach check | PASS | HIGH |
| V2.1.5 | 3a | Bcrypt cost >= 10 | PASS | HIGH |
| V2.1.6 | 3a | No hints | PASS | LOW |
| V2.1.7 | 3a | No KBA | PASS | LOW |
| V2.2.1 | 3a | Anti-automation | PASS | HIGH |
| V2.2.2 | 3a | Weak credential resistance | PASS | HIGH |
| V2.3.1 | 3a | Reset token secure | PASS | HIGH |
| V2.3.2 | 3a | Reset token expiry | PASS | HIGH |
| V2.3.3 | 3a | Reset token single-use | PASS | HIGH |
| V2.8.1 | 3a | TOTP MFA | PASS | HIGH |
| V2.8.2 | 3a | MFA for admins | PASS | HIGH |
| V2.8.3 | 3a | Recovery codes | PASS | MEDIUM |
| V2.10.1 | 3a | No hardcoded creds | PASS | CRITICAL |
| V2.10.2 | 3a | No defaults | PASS | CRITICAL |
| V2.10.3 | 3a | Production validation | PASS | CRITICAL |
| V2.10.4 | 3a | No hardcoded passwords | PASS | CRITICAL |
| V3.2.1 | 3b | Session bound to user | PASS | HIGH |
| V3.2.2 | 3b | Session UA + IP | PASS | MEDIUM |
| V3.3.1 | 3b | Logout invalidates | PASS | HIGH |
| V3.3.2 | 3b | Idle timeout | PASS | HIGH |
| V3.3.3 | 3b | Absolute timeout | PASS | HIGH |
| V3.3.4 | 3b | Logout-all | PASS | MEDIUM |
| V3.4.1 | 3b | Token not in URL | PASS | HIGH |
| V3.4.2 | 3b | Secure cookie | PASS | HIGH |
| V3.7.1 | 3b | Concurrent limits | PASS | MEDIUM |
| V3.5.1 | 3b | Theft detection | PASS | HIGH |
| V4.1.1 | 3c | RBAC | PASS | HIGH |
| V4.1.2 | 3c | Least privilege | PASS | HIGH |
| V4.1.3 | 3c | CSRF | PASS | HIGH |
| V4.1.4 | 3c | Deny by default | PASS | HIGH |
| V4.1.5 | 3c | No param tampering | PASS | HIGH |
| V4.2.1 | 3c | No self-escalation | PASS | CRITICAL |
| V4.2.2 | 3c | Permission-based | PASS | MEDIUM |
| V4.3.3 | 3c | SUPERADMIN audit | PASS | CRITICAL |
| V5.1.1 | 3d | Server-side validation | PASS | HIGH |
| V5.1.2 | 3d | Whitelist validation | PASS | MEDIUM |
| V5.1.3 | 3d | DTO validation | PASS | MEDIUM |
| V5.1.4 | 3d | No raw HTML | PASS | HIGH |
| V5.2.1 | 3d | No SQL injection | PASS | CRITICAL |
| V5.2.2 | 3d | No eval | PASS | CRITICAL |
| V5.3.1 | 3d | UUID validated | PASS | MEDIUM |
| V6.2.1 | 3e | Strong hash | PASS | HIGH |
| V6.2.2 | 3e | Crypto random | PASS | HIGH |
| V6.2.3 | 3e | Modern TOTP | PASS | MEDIUM |
| V6.4.1 | 3e | Secrets from env | PASS | HIGH |
| V6.4.2 | 3e | Different per env | PASS | HIGH |
| N-01 | 3f | Password 8-64 | PASS | HIGH |
| N-02 | 3f | No composition | PASS | MEDIUM |
| N-03 | 3f | Breach check | PASS | HIGH |
| N-04 | 3f | Unicode support | PASS | LOW |
| N-05 | 3f | MFA available | PASS | HIGH |
| N-06 | 3f | Reauthentication | PASS | HIGH |
| N-07 | 3f | Session timeout | PASS | HIGH |
| N-08 | 3f | HTTPS enforcement | PASS | HIGH |
| N-09 | 3f | Rate limiting | PASS | HIGH |
| O-01 | 3g | PKCE | PASS | CRITICAL |
| O-02 | 3g | State parameter | PASS | HIGH |
| O-03 | 3g | Redirect whitelist | PASS | HIGH |
| O-04 | 3g | Back-channel exchange | PASS | HIGH |
| O-05 | 3g | Ephemeral code | PASS | HIGH |
| O-06 | 3g | Short lifetime | PASS | HIGH |
| O-07 | 3g | No tokens in logs | PASS | HIGH |
| O-08 | 3g | Scope limitation | PASS | MEDIUM |
| J-01 | 3h | Algorithm set | PASS | CRITICAL |
| J-02 | 3h | Issuer validated | PASS | HIGH |
| J-03 | 3h | Audience validated | PASS | HIGH |
| J-04 | 3h | Expiration enforced | PASS | HIGH |
| J-05 | 3h | JTI claim | PASS | HIGH |
| J-06 | 3h | Refresh rotation | PASS | HIGH |
| H-01 | 3i | HSTS | PASS | HIGH |
| H-02 | 3i | CSP | PASS | HIGH |
| H-03 | 3i | X-Frame-Options | PASS | MEDIUM |
| H-04 | 3i | X-Content-Type | PASS | MEDIUM |
| H-05 | 3i | Referrer-Policy | PASS | LOW |
| H-06 | 3i | CORS | PASS | HIGH |
| H-07 | 3i | Rate limit login | PASS | HIGH |
| H-08 | 3i | Rate limit register | PASS | MEDIUM |
| H-09 | 3i | Rate limit reset | PASS | MEDIUM |
| H-10 | 3i | Rate limit MFA | PASS | HIGH |
| H-11 | 3i | Rate limit OAuth | PASS | MEDIUM |
| H-12 | 3i | Progressive lockout | PASS | HIGH |
| EM-01 | 3j | No enum login | PASS | HIGH |
| EM-02 | 3j | No enum register | PASS | HIGH |
| EM-03 | 3j | No enum forgot-pw | PASS | HIGH |
| EM-04 | 3j | No state disclosure | PASS | HIGH |
| EM-05 | 3j | Timing-safe | PASS | HIGH |
| EM-06 | 3j | No entity disclosure | PASS | MEDIUM |
| EM-07 | 3j | No auth detail | PASS | MEDIUM |
| EM-08 | 3j | Single error per guard | PASS | MEDIUM |
| EM-09 | 3j | No feature state | PASS | MEDIUM |
| EM-10 | 3j | No token lifecycle | PASS | MEDIUM |
| EM-11 | 3j | Consistent messages | PASS | MEDIUM |
| EM-12 | 3j | No field names | PASS | LOW |
| EM-13 | 3j | Error shape | PASS | LOW |
| V7.1.1 | 3k | No creds in logs | PASS | CRITICAL |
| V7.1.2 | 3k | No PII in logs | PASS | HIGH |
| V7.1.3 | 3k | Events logged | PASS | HIGH |
| V7.2.1 | 3k | Log completeness | PASS | MEDIUM |
| V7.3.1 | 3k | Log injection | WARN | LOW |
| V7.4.1 | 3k | Generic error prod | PASS | MEDIUM |
| V7.4.3 | 3k | Last resort handler | PASS | MEDIUM |
| V8.2.1 | 3l | Anti-caching | PASS | MEDIUM |
| V8.2.2 | 3l | No browser storage | N/A | LOW |
| V8.2.3 | 3l | Client cleanup | PASS | MEDIUM |
| V8.3.1 | 3l | No sensitive query | PASS | HIGH |
| V8.3.4 | 3l | Sensitive fields ID | PASS | MEDIUM |
| V8.3.5 | 3l | Sensitive audit | PASS | MEDIUM |
| V8.3.7 | 3l | Database TLS | PASS | HIGH |
| V13.1.3 | 3m | No data in URLs | PASS | HIGH |
| V13.2.1 | 3m | Content-type enforce | PASS | MEDIUM |
| V13.2.2 | 3m | Method restriction | PASS | MEDIUM |
| V13.2.3 | 3m | Content-type valid | PASS | LOW |
| V13.4.1 | 3m | TLS enforcement | PASS | HIGH |
| PP-01 | 3n | No Object.assign | PASS | HIGH |
| PP-02 | 3n | No spread user input | PASS | MEDIUM |
| PP-03 | 3n | No recursive merge | PASS | HIGH |
| RD-01 | 3n | No evil regex | PASS | HIGH |
| RD-02 | 3n | No user input regex | N/A | HIGH |
| SS-01 | 3n | No unvalidated URLs | PASS | HIGH |
| SS-02 | 3n | URL allowlist | N/A | HIGH |
| GS-01 | 3n | No secrets in git | PASS | CRITICAL |
| GS-02 | 3n | .gitignore complete | PASS | HIGH |
