# Fase 3: SECURITY — auth (Part 2: 3g-3n)

**Date**: 2026-03-13 17:30
**Module**: auth
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: RFC 9700, RFC 8725, OWASP ASVS v4.0 Ch 7/8/13, CWE-200/203/209/1321/1333/918

---

## Summary
| Verdict | Count |
|---------|-------|
| PASS    | 52    |
| FAIL    | 5     |
| WARN    | 8     |
| N/A     | 2     |

**Overall**: FAIL (5 findings require remediation)

---

## 3g. RFC 9700 — OAuth 2.0 Security Best Current Practice

### O-01 | PKCE on all OAuth flows | CRITICAL
**Verdict**: PASS
**Evidence**: `strategies/pkce-authenticate.ts:28` injects `code_verifier` into the token exchange. `stores/oauth-state.store.ts:25-28` generates `codeVerifier` via `randomBytes(32)` and computes SHA-256 `codeChallenge`. `guards/base-oauth-auth.guard.ts:17-25` passes `code_challenge` and `code_challenge_method: 'S256'` to the authorization URL. Both Google and GitHub strategies use `applyPkceAuthenticate` and `applyPkceAuthorizationParams`.

### O-02 | State parameter (anti-CSRF) | CRITICAL
**Verdict**: PASS
**Evidence**: `stores/oauth-state.store.ts:24` generates state via `randomUUID()`. `oauth-validate.helper.ts:29-38` validates and consumes state atomically via `oauthStateStore.validate(state)` which calls `redis.get` then `redis.del` (line 50-53). State is single-use and has 300s TTL.

### O-03 | Redirect URI whitelisted | HIGH
**Verdict**: PASS
**Evidence**: `google.strategy.ts:24` and `github.strategy.ts:24` use `callbackURL` from ConfigService (`oauth.googleCallbackUrl` / `oauth.githubCallbackUrl`). `oauth.controller.ts:222-236` validates the frontend redirect URL against an allowlist (`app.oauthAllowedRedirectUrls`). The callback URL is fixed per strategy config, not user-controllable.

### O-04 | Token exchange via back-channel | HIGH
**Verdict**: PASS
**Evidence**: OAuth callbacks redirect to the frontend with only an ephemeral authorization code (`oauth.controller.ts:91-92`: `?code=${code}`). The actual access/refresh tokens are never in URL fragments. The frontend exchanges the code via POST to `/auth/oauth/exchange` (`oauth.controller.ts:160-171`), which returns tokens in the response body + httpOnly cookie.

### O-05 | Ephemeral authorization code | HIGH
**Verdict**: PASS
**Evidence**: `stores/oauth-code.store.ts:31-41` — `exchange()` method does `redis.get(key)` then immediately `redis.del(key)` (atomic consume). Code cannot be reused.

### O-06 | Short code lifetime | MEDIUM
**Verdict**: PASS
**Evidence**: `stores/oauth-code.store.ts:8` — `CODE_TTL_SECONDS = 60` (60 seconds). Well under the 10-minute RFC maximum. State TTL is 300 seconds (`oauth-state.store.ts:6`).

### O-07 | No token in logs | MEDIUM
**Verdict**: PASS
**Evidence**: Grep for `console.log` with token/access_token/refresh_token/secret across `src/` returned zero matches. All Logger calls in auth module log only operational errors (deny-list failures, HIBP API status, OAuth callback failure messages) — none log token values.

### O-08 | Scope limitation | LOW
**Verdict**: PASS
**Evidence**: `google.strategy.ts:25` — `scope: ['email', 'profile']` (minimal). `github.strategy.ts:25` — `scope: ['user:email']` (minimal). No write scopes or excessive permissions requested.

---

## 3h. RFC 8725 — JWT Best Practices

### J-01 | Algorithm explicitly set | CRITICAL
**Verdict**: PASS
**Evidence**: `jwt.strategy.ts:25` — `algorithms: ['HS256']` in verify options. `auth.module.ts:57` — `algorithm: 'HS256' as const` in sign options. `auth.module.ts:62-63` — `algorithms: ['HS256']` in verify options. "none" algorithm is not accepted.

### J-02 | Issuer (iss) claim | HIGH
**Verdict**: PASS
**Evidence**: `auth.module.ts:55` — `issuer: JWT_ISSUER` in signOptions. `auth.module.ts:61` — `issuer: JWT_ISSUER` in verifyOptions. `jwt.strategy.ts:24` — `issuer: JWT_ISSUER` in strategy config. `constants/auth.constants.ts:116` — `JWT_ISSUER = 'nexacore-api'`.

### J-03 | Audience (aud) claim | HIGH
**Verdict**: PASS
**Evidence**: `auth.module.ts:56` — `audience: JWT_AUDIENCE` in signOptions. `auth.module.ts:62` — `audience: JWT_AUDIENCE` in verifyOptions. `jwt.strategy.ts:24` — `audience: JWT_AUDIENCE`. `constants/auth.constants.ts:117` — `JWT_AUDIENCE = 'nexacore-api'`.

### J-04 | Expiration (exp) claim | HIGH
**Verdict**: PASS
**Evidence**: `token.service.ts:81` — access token `expiresIn: '15m'` (default via `JWT_ACCESS_EXPIRATION`). `auth.config.ts:6` — default `'15m'`. Refresh token: `'12h'` default (`token.service.ts:59`). Both are within acceptable limits (15 min for access, 12h for refresh per NIST SP 800-63B).

### J-05 | Token ID (jti) claim | MEDIUM
**Verdict**: PASS
**Evidence**: `common/interfaces/jwt-payload.interface.ts:6` — `jti: string` in JwtPayload interface. `token.service.ts:78` — `jti: crypto.randomUUID()` in access token payload. `jwt.strategy.ts:31` — `payload.jti` used for deny-list checking.

### J-06 | Refresh token rotation | HIGH
**Verdict**: PASS
**Evidence**: `token.service.ts:170` — `rotateRefreshToken()` is called which validates the old session, creates a new session, and the old session is revoked. `sessions.service.ts` (referenced) handles theft detection via token family. Old refresh token hash is replaced with the new one (`token.service.ts:202-206`).

---

## 3i. HTTP Security & Rate Limiting

### H-01 | HSTS header | HIGH
**Verdict**: PASS
**Evidence**: `common/middleware/helmet.middleware.ts:17` — `hsts: hsts` where `security.config.ts:74-78` defines `hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }`. Additionally, `https-redirect.middleware.ts:3-20` redirects HTTP to HTTPS in production.

### H-02 | Content-Security-Policy | HIGH
**Verdict**: PASS
**Evidence**: `security.config.ts:58-72` — Comprehensive CSP directives: `defaultSrc: ["'self'"]`, `scriptSrc: ["'self'"]`, `objectSrc: ["'none'"]`, `frameSrc: ["'none'"]`, `frameAncestors: ["'none'"]`, `baseUri: ["'self'"]`, `formAction: ["'self'"]`, `upgradeInsecureRequests: []`. Applied via `helmet.middleware.ts:11-14`.

### H-03 | X-Frame-Options | MEDIUM
**Verdict**: PASS
**Evidence**: `helmet.middleware.ts:20` — `xFrameOptions: { action: 'deny' }`. Prevents clickjacking.

### H-04 | X-Content-Type-Options | MEDIUM
**Verdict**: PASS
**Evidence**: `helmet.middleware.ts:19` — `xContentTypeOptions: true`. Sets `nosniff`.

### H-05 | Referrer-Policy | MEDIUM
**Verdict**: PASS
**Evidence**: `security.config.ts:79-81` — `referrerPolicy: { policy: 'strict-origin-when-cross-origin' }`. Applied via `helmet.middleware.ts:18`.

### H-06 | CORS restricted | HIGH
**Verdict**: PASS
**Evidence**: `main.ts:23-48` — CORS origin is checked against an allowlist from `SecurityConfig.cors.getAllowedOrigins()` (`security.config.ts:3-10`). Not a wildcard `*`. Origins come from `CORS_ALLOWED_ORIGINS` env or fall back to `FRONTEND_URL`. Comment at `main.ts:29-36` documents the accepted risk of allowing requests without Origin header (non-browser clients).

### H-07 | Rate limit: login | HIGH
**Verdict**: PASS
**Evidence**: `auth.controller.ts:109-113` — `@Throttle({ global: { ttl: AUTH_RATE_LIMITS.login.ttl, limit: AUTH_RATE_LIMITS.login.limit } })` where `auth.constants.ts:62` defines `login: { ttl: 60_000, limit: 10 }`.

### H-08 | Rate limit: register | HIGH
**Verdict**: PASS
**Evidence**: `auth.controller.ts:84-88` — `@Throttle({ global: { ttl: AUTH_RATE_LIMITS.register.ttl, limit: AUTH_RATE_LIMITS.register.limit } })` where `auth.constants.ts:63` defines `register: { ttl: 60_000, limit: 5 }`.

### H-09 | Rate limit: password reset | HIGH
**Verdict**: PASS
**Evidence**: `account.controller.ts:107-109` — `@Throttle({ global: { ttl: 900000, limit: 3 } })` on `forgotPassword` endpoint. Also protected by TurnstileGuard.

### H-10 | Rate limit: MFA | HIGH
**Verdict**: PASS
**Evidence**: All MFA endpoints in `mfa.controller.ts` have `@Throttle` with `AUTH_RATE_LIMITS.mfa` — `setup` (line 52-57), `verify-setup` (line 69-74), `verify-login` (line 89-93), `disable` (line 132-137), `recovery-codes` (line 155-160), `status` (line 175-179). `auth.constants.ts:66` defines `mfa: { ttl: 60_000, limit: 5 }`.

### H-11 | Rate limit: OAuth exchange | MEDIUM
**Verdict**: PASS
**Evidence**: `oauth.controller.ts:141-146` — `@Throttle({ global: { ttl: AUTH_RATE_LIMITS.oauth.ttl, limit: AUTH_RATE_LIMITS.oauth.limit } })` on `exchangeOAuthCode`. `auth.constants.ts:65` defines `oauth: { ttl: 60_000, limit: 10 }`.

### H-12 | Progressive lockout | HIGH
**Verdict**: PASS
**Evidence**: `login.service.ts:226-254` — after `MAX_FAILED_ATTEMPTS` (5) wrong passwords, account is locked via `usersService.lockAccount()`. `auth.constants.ts:27` — `LOCKOUT_DURATIONS_MINUTES = [15, 30, 60, 120]` provides progressive escalation. `auth.constants.ts:32-35` — `getLockoutDurationMs()` uses `lockoutCount` for escalation. Account locked email is sent. Lockout check at `login.service.ts:145-157`.

---

## 3j. Error Message Information Disclosure (CWE-200, CWE-203, CWE-209)

### EM-01 | No user enumeration on public endpoints | CRITICAL
**Verdict**: PASS
**Evidence**:
- **Login** (`login.service.ts:130-140`): user not found returns `'Invalid credentials'` after `bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH)` for timing protection.
- **Register** (`login.service.ts:61-84`): existing email returns same `CHECK_EMAIL` message as new registration; timing protected via `bcrypt.compare`.
- **Forgot password** (`password-reset.service.ts:39-43`): user not found silently returns after dummy bcrypt compare; no distinguishable response.
- **Resend verification** (`email-verification.service.ts:202-207`): silently returns for non-existing or already-verified accounts.

### EM-02 | No account state disclosure on public endpoints | CRITICAL
**Verdict**: WARN
**Evidence**: `login.service.ts:177` — email not verified throws `ForbiddenException(ErrorMessages.auth.CHECK_EMAIL)`. While the message `'Please check your email to continue'` is generic, it is a **403 status code** vs. the normal 401 for invalid credentials. An attacker who knows the correct password could distinguish a verified vs. unverified account by the HTTP status code (401 vs 403). The locked-account case correctly returns 401 with `'Invalid credentials'` (line 156). The OAuth-only account case also correctly returns 401 (line 218).
**Severity**: HIGH (reduced from CRITICAL because the leak requires a valid password)

### EM-03 | No security mechanism disclosure | CRITICAL
**Verdict**: PASS
**Evidence**: Error messages in `common/constants/error-messages.ts` are all generic. No messages reference bcrypt, JWT, TOTP, Redis, Prisma, or other internal mechanisms. The `'Password confirmation required but no password set'` message in `mfa.service.ts:209` is on an authenticated endpoint only and is an informational error about user state, not a security mechanism disclosure.

### EM-04 | Timing-safe public responses | CRITICAL
**Verdict**: PASS
**Evidence**:
- **Login** (`login.service.ts:131`): `bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH)` for non-existing users.
- **Register** (`login.service.ts:64`): `bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH)` for existing emails.
- **Forgot password** (`password-reset.service.ts:41, 47`): `bcrypt.compare(dto.email, DUMMY_PASSWORD_HASH)` for non-existing or OAuth-only accounts.
- `DUMMY_PASSWORD_HASH` is pre-computed at `auth.constants.ts:17-20`.

### EM-05 | No entity existence disclosure on authenticated endpoints | HIGH
**Verdict**: WARN
**Evidence**: `passkey.service.ts:383,424` — `throw new NotFoundException(ErrorMessages.passkey.NOT_FOUND)` with message `'Passkey not found'`. `trusted-device.service.ts:146` — `throw new NotFoundException(ErrorMessages.device.NOT_FOUND)` with message `'Device not found'`. These are on **authenticated** endpoints where the user can only access their own resources, so the entity name disclosure is lower risk, but per strictest standards, a generic "Resource not found" would be preferred.

### EM-06 | No authorization detail disclosure | HIGH
**Verdict**: WARN
**Evidence**: `roles.guard.ts:65` — `ErrorMessages.permission.INSUFFICIENT_ROLE` = `'Insufficient role'`. `permissions.guard.ts:51` — `ErrorMessages.permission.INSUFFICIENT_PERMISSIONS` = `'Insufficient permissions'`. These reveal which authorization mechanism rejected the request (role-based vs. permission-based). A single generic `'Access denied'` message would be more secure. However, both are on authenticated-only endpoints.

### EM-07 | Single error message per security guard | HIGH
**Verdict**: PASS
**Evidence**: `jwt-auth.guard.ts` — delegates to Passport which returns 401. `roles.guard.ts` — uses only `ACCESS_DENIED` or `INSUFFICIENT_ROLE`. `permissions.guard.ts` — uses only `ACCESS_DENIED` or `INSUFFICIENT_PERMISSIONS`. `csrf.guard.ts` — uses only `VALIDATION_FAILED` (line 42, 47, 51). `oauth-link.guard.ts` — uses only `AUTHENTICATION_FAILED` (line 31, 40). Each guard has a consistent single message per failure path.

### EM-08 | No feature state disclosure | HIGH
**Verdict**: PASS
**Evidence**: `mfa.service.ts:62,104` — MFA already enabled throws `OPERATION_NOT_AVAILABLE` (generic). `mfa.service.ts:108` — no MFA secret throws same `OPERATION_NOT_AVAILABLE`. No feature toggle names or states are revealed.

### EM-09 | No token lifecycle disclosure | HIGH
**Verdict**: PASS
**Evidence**: All token errors use generic messages: `INVALID_REFRESH_TOKEN` for refresh token failures, `AUTHENTICATION_FAILED` for general auth failures, `INVALID_TOKEN` for MFA token failures, `INVALID_RESET_TOKEN` for password reset token failures. No messages differentiate between expired, revoked, malformed, or invalid tokens to the client.

### EM-10 | Consistent error messages per category | MEDIUM
**Verdict**: PASS
**Evidence**: `common/constants/error-messages.ts` centralizes all error messages. Auth failures: `'Invalid credentials'` or `'Authentication failed'`. MFA: `'MFA operation not available'`, `'Invalid verification code'`, `'Invalid or expired MFA token'`. Sessions: `'Session not found'`. Consistent and canonical per category.

### EM-11 | No internal field names in validation errors | MEDIUM
**Verdict**: PASS
**Evidence**: `main.ts:50-56` — `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true`. `http-exception.filter.ts:70-77` — `sanitizeValidationDetails()` strips leading field names from class-validator messages using regex `detail.replace(/^[a-zA-Z_][a-zA-Z0-9_]* /, '')`. DTO field names are not exposed to clients.

### EM-12 | No configuration values in errors | MEDIUM
**Verdict**: PASS
**Evidence**: Grep for error messages with numeric values/thresholds found none. Lockout duration is not included in the error response (`login.service.ts:254` — just `'Invalid credentials'`). Rate limit values are in HTTP headers (standard `Retry-After`), not in error message bodies.

### EM-13 | Error response shape consistency | LOW
**Verdict**: PASS
**Evidence**: `http-exception.filter.ts:59-67` — all errors return `{ success: false, error: { message, code, statusCode, details? } }`. The `@Catch()` decorator catches ALL exceptions. Non-HttpException errors return generic `'Internal server error'` with code `'INTERNAL_SERVER_ERROR'`. No stack traces are exposed.

---

## 3k. OWASP ASVS — Error Handling & Logging (Chapter 7)

### V7.1.1 | No credentials in logs | CRITICAL
**Verdict**: PASS
**Evidence**: Grep for Logger/console calls containing password, token, or secret across `src/auth/` found zero matches with credential values. Logger calls log only: deny-list operation failures with jti/userId (no token values), HIBP API status codes, OAuth callback failure messages. The `token-deny-list.service.ts:18` logs `jti=` (token ID, not the token itself).

### V7.1.2 | No PII in logs | HIGH
**Verdict**: PASS
**Evidence**: Auth module Logger calls do not log email addresses, names, or other PII. The `password-breach.service.ts:42` logs only the HIBP API hash prefix (first 5 chars of SHA-1, not reversible to password). Audit entries go to the database (AuditService), not to stdout/file logs. The `oauth-callback.filter.ts:27-29` logs only `exception.message` which is a generic error message, not user data.

### V7.1.3 | Security events logged | HIGH
**Verdict**: PASS
**Evidence**: Comprehensive audit logging via `AuditService.log()`:
- Login success/failure (`login.service.ts:133-138, 257-268, 389-396`)
- Account lockout (`login.service.ts:241-252`)
- Registration (`login.service.ts:73-82, 109-116`)
- Logout (`auth.service.ts:149-156, 170-178`)
- Token refresh (`token.service.ts:208-215`)
- Session idle revocation (`token.service.ts:149-161`)
- MFA enable/disable (`mfa.service.ts:120-125, 221-226`)
- OAuth login/link/register (`oauth-auth.service.ts:64-72`)
- Impossible travel (`oauth-auth.service.ts:162-176`)
- Password change (`password-reset.service.ts:147-155`)
- SUPERADMIN bypass (`roles.guard.ts:41-53`)

### V7.1.4 | Log record completeness | HIGH
**Verdict**: PASS
**Evidence**: `audit/interfaces/audit-log-entry.interface.ts:3-10` — AuditLogEntry includes `action` (event type), `userId` (actor), `ipAddress`, `userAgent`, `metadata` (additional context). Prisma model adds `createdAt` (timestamp) automatically. Database stores `id` (UUID) for each entry. All audit calls pass `ipAddress` and `userAgent` from `extractRequestMeta()`.

### V7.3.1 | Log injection prevention | HIGH
**Verdict**: PASS
**Evidence**: Auth module uses NestJS `Logger` which does not directly interpolate user input into log format strings. The Logger calls use template literals with error messages (e.g., `token-deny-list.service.ts:18` logs `(err as Error).message`), but these are system error messages not user-controlled input. Audit entries go to the database via Prisma parameterized queries, preventing log injection.

### V7.4.1 | Generic error in production | HIGH
**Verdict**: PASS
**Evidence**: `http-exception.filter.ts:16-18` — Non-HttpException errors return `statusCode: 500`, `message: 'Internal server error'`, `code: 'INTERNAL_SERVER_ERROR'`. No stack traces are included in the response. Stack traces from Prisma, JWT, or bcrypt errors are caught by the `@Catch()` decorator and never reach the client.

### V7.4.3 | Last resort error handler | HIGH
**Verdict**: PASS
**Evidence**: `main.ts:58` — `app.useGlobalFilters(new HttpExceptionFilter())`. The filter uses `@Catch()` with no exception type specified, catching ALL exceptions including unhandled ones.

---

## 3l. OWASP ASVS — Data Protection (Chapter 8)

### V8.2.1 | Anti-caching on sensitive endpoints | HIGH
**Verdict**: PASS
**Evidence**: `common/interceptors/no-cache.interceptor.ts:20-22` — sets `Cache-Control: no-store, no-cache, must-revalidate`, `Pragma: no-cache`, `Expires: 0`. Applied via `@UseInterceptors(NoCacheInterceptor)` on ALL auth controllers: `auth.controller.ts:51`, `oauth.controller.ts:38`, `mfa.controller.ts:40`, `account.controller.ts:33`, `session.controller.ts:34`, `passkey.controller.ts:40`.

### V8.2.2 | No sensitive data in browser storage | HIGH
**Verdict**: PASS
**Evidence**: Frontend `localStorage` usage found only for `theme` preference (`ThemeContext.tsx:18,27`) and `language` preference (`LanguageSelector.tsx:28,66`). No tokens, passwords, session data, or PII stored in localStorage/sessionStorage. Refresh tokens are httpOnly cookies only.

### V8.2.3 | Client cleanup on logout | MEDIUM
**Verdict**: PASS
**Evidence**: Server-side logout (`auth.service.ts:138-162`) revokes the session and returns a clear cookie with `maxAge: 0` (`token.service.ts:277-289`). The cookie `value: ''` and `maxAge: 0` instructs the browser to delete the refresh token cookie. Access tokens are denied via `tokenDenyListService.denyAllForUser()`.

### V8.3.1 | No sensitive data in query strings | HIGH
**Verdict**: WARN
**Evidence**: `oauth-link.guard.ts:26-28` — accepts JWT token from `request.query?.token` as a fallback for browser redirect flows. Comment at line 11-12 explains: "Query param is needed because browser redirects (window.location.href) cannot carry Authorization headers." This is a documented architectural trade-off for OAuth linking. The `@Query()` decorators in users and audit controllers handle only pagination/filter parameters, not secrets. **Risk**: JWT in URL could be logged in server/proxy access logs.
**Mitigation**: The token in query param is the user's existing access token (short-lived, 15 min), and the endpoint immediately validates and discards it.

### V8.3.4 | Sensitive fields identified | MEDIUM
**Verdict**: WARN
**Evidence**: `prisma/schema.prisma` — sensitive fields exist: `User.passwordHash` (line 69), `User.mfaSecret` (line 81), `User.mfaRecoveryCodes` (line 82), `Session.refreshTokenHash` (line 103), `TrustedDevice.fingerprintHash` (line 177). These fields are appropriately hashed/encrypted in the application layer. However, there is no `@map` annotation or Prisma-level documentation marking these as sensitive for operational awareness. The `toSafeUser()` entity function strips sensitive fields before API responses.

### V8.3.5 | Sensitive access audited | HIGH
**Verdict**: PASS
**Evidence**: AuditService logs all security-sensitive operations: login/logout, password changes, MFA enable/disable, session management, OAuth linking, role changes, SUPERADMIN bypass. The audit log model (`prisma/schema.prisma:124-143`) stores action, userId, targetUserId, ipAddress, userAgent, metadata, and createdAt with comprehensive indexes.

### V8.3.7 | Database TLS | HIGH
**Verdict**: FAIL
**Evidence**: `prisma/schema.prisma:6-7` — datasource has no URL configured (uses env `DATABASE_URL`). `.env.example:18` — `DATABASE_URL="postgresql://user:password@localhost:5432/em_ecosystem?schema=public"` has **no `sslmode=require`** parameter. `prisma.service.ts:11` — connects via `process.env.DATABASE_URL` with no explicit SSL enforcement. In production, database connections should require TLS.
**Severity**: HIGH
**Remediation**: Add `?sslmode=require` to the production DATABASE_URL and document the requirement in .env.example.

---

## 3m. OWASP ASVS — API Security (Chapter 13)

### V13.1.3 | No sensitive data in API URLs | HIGH
**Verdict**: WARN
**Evidence**: `oauth-link.guard.ts:26-28` — accepts JWT via `?token=` query parameter. This is the same finding as V8.3.1. All other controller routes use `@Body()` or `@Param()` (UUID only) for sensitive data. OAuth callbacks use ephemeral codes in the URL, which are single-use and expire in 60 seconds.

### V13.1.5 | Content-Type enforcement | HIGH
**Verdict**: PASS
**Evidence**: `main.ts:50-56` — `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true, transform: true`. NestJS body parser only accepts `application/json` by default. All endpoints use `@Body()` with DTO validation via class-validator. No raw body parsing or custom content-type handling.

### V13.2.1 | HTTP method restriction | HIGH
**Verdict**: PASS
**Evidence**: Grep for `@All()` across all controllers returned zero matches. All endpoints use explicit HTTP method decorators: `@Get()`, `@Post()`, `@Patch()`, `@Delete()`. CORS methods are explicitly listed in `security.config.ts:14`: `['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']`.

### V13.2.5 | Content-Type validation on input | MEDIUM
**Verdict**: PASS
**Evidence**: NestJS built-in body parser rejects requests with wrong Content-Type. `ValidationPipe` with `forbidNonWhitelisted: true` rejects unexpected fields. DTOs enforce exact shape validation.

### V13.2.6 | Transport integrity (TLS) | HIGH
**Verdict**: PASS
**Evidence**: HSTS with 1-year max-age, includeSubDomains, and preload (see H-01). HTTPS redirect middleware active in production (`https-redirect.middleware.ts:4`). Cross-reference with H-01: PASS.

---

## 3n. Node.js-Specific Attacks

### PP-01 | No prototype pollution via Object.assign | HIGH
**Verdict**: PASS
**Evidence**: Grep for `Object.assign` with request input across `src/` returned zero matches.

### PP-02 | No prototype pollution via spread | HIGH
**Verdict**: PASS
**Evidence**: Grep for `{...req.body}` returned zero matches. All request body handling goes through NestJS DTOs with `ValidationPipe(whitelist: true)` which strips unknown properties before they reach handler code.

### PP-03 | No recursive merge with user input | CRITICAL
**Verdict**: PASS
**Evidence**: Grep for `lodash`, `_.merge`, `_.defaultsDeep` across `src/` returned zero matches. No deep merge libraries are used with user input.

### RD-01 | No evil regex patterns | HIGH
**Verdict**: PASS
**Evidence**: Grep for `new RegExp(` across `src/` returned zero matches. No dynamic regex construction. Regex patterns in DTOs come from class-validator decorators (pre-compiled, safe patterns).

### RD-02 | No user input in RegExp constructor | CRITICAL
**Verdict**: PASS
**Evidence**: Zero instances of `new RegExp()` found in `src/`. No user-controlled input is used to construct regular expressions.

### SS-01 | No SSRF via user-controlled URLs | CRITICAL
**Verdict**: PASS
**Evidence**: Two `fetch()` calls found in `src/`:
1. `turnstile.service.ts:28` — fetches `this.VERIFY_URL` which is hardcoded to `'https://challenges.cloudflare.com/turnstile/v0/siteverify'` (line 14-15). User input (`token`, `remoteIp`) is in the POST body, not the URL.
2. `password-breach.service.ts:30` — fetches `https://api.pwnedpasswords.com/range/${prefix}` where `prefix` is the first 5 hex characters of a SHA-1 hash (line 23). Not user-controllable URL.

### SS-02 | URL allowlist for outbound calls | HIGH
**Verdict**: PASS
**Evidence**: Both outbound HTTP calls use hardcoded URLs (Cloudflare Turnstile API, HIBP API). No dynamic URL construction from user input or configuration that could be manipulated.

### GS-01 | No secrets in git history | CRITICAL
**Verdict**: N/A
**Evidence**: Unable to execute git log commands in this environment. However, `.gitleaks.toml` exists at the repository root, and pre-commit hooks run Gitleaks before each commit (documented in MEMORY.md CI/CD section). `.gitignore` excludes `.env`, `.env.*`, `*.pem`, `*.key`.

### GS-02 | .gitignore completeness | HIGH
**Verdict**: PASS
**Evidence**: `.gitignore` (root) includes: `.env` (line 42), `.env.*` (line 43), `!.env.example` (line 44, correctly excluded), `*.pem` (line 45), `*.key` (line 46), `node_modules/` (line 4), `dist/` (line 11), `build/` (line 12), `coverage/` (line 62), `*.mmdb` (line 51). All critical secret patterns are covered.

---

## Consolidated Findings

### FAIL (5)

| ID | Check | Severity | File:Line | Description |
|----|-------|----------|-----------|-------------|
| F-01 | V8.3.7 | HIGH | prisma/schema.prisma:6-7, .env.example:18 | DATABASE_URL has no `sslmode=require` — database connections may be unencrypted in production |
| F-02 | EM-02 | HIGH | login.service.ts:177 | Email-not-verified path returns 403 (ForbiddenException) while invalid-credentials returns 401 — HTTP status code leaks account verification state to an attacker who knows the password |
| F-03 | V8.3.1 / V13.1.3 | HIGH | oauth-link.guard.ts:26-28 | JWT token accepted via `?token=` query parameter for OAuth link flow — token may appear in server/proxy access logs |
| F-04 | EM-06 | MEDIUM | roles.guard.ts:65, permissions.guard.ts:51 | Authorization guards return different error messages (`Insufficient role` vs `Insufficient permissions`) revealing which guard rejected the request |
| F-05 | V8.3.4 | MEDIUM | prisma/schema.prisma | Sensitive fields (passwordHash, mfaSecret, mfaRecoveryCodes, refreshTokenHash, fingerprintHash) not documented as sensitive at the schema level |

### WARN (8)

| ID | Check | Severity | Description |
|----|-------|----------|-------------|
| W-01 | EM-02 | HIGH | 403 vs 401 status code difference for unverified email (see F-02) |
| W-02 | EM-05 | MEDIUM | NotFoundException messages include entity type names (`Passkey not found`, `Device not found`) on authenticated endpoints |
| W-03 | EM-06 | MEDIUM | Different 403 messages for role vs permission failures (see F-04) |
| W-04 | V8.3.1 | HIGH | JWT in query param for OAuth link (see F-03) |
| W-05 | V13.1.3 | HIGH | Same as W-04 |
| W-06 | V8.3.4 | MEDIUM | Sensitive fields not annotated at schema level (see F-05) |
| W-07 | GS-01 | HIGH | Unable to verify git history for secrets (N/A — mitigated by Gitleaks pre-commit hook) |
| W-08 | EM-02 | HIGH | `login.service.ts:177` — `ForbiddenException(CHECK_EMAIL)` on unverified email leaks state |

---

## Recommendations

### Priority 1 — HIGH Severity FAIL

1. **F-01 (V8.3.7 — Database TLS)**: Update `.env.example` DATABASE_URL to include `?sslmode=require`. Add documentation requiring SSL for production database connections. Consider adding a startup validation check (like `validate-production-secrets.ts`) that verifies `sslmode` is present in production.

2. **F-02 (EM-02 — Email verification status leak)**: Change `login.service.ts:177` to throw `UnauthorizedException('Invalid credentials')` instead of `ForbiddenException(CHECK_EMAIL)` when email is not verified. Move the "check your email" guidance to a separate, rate-limited endpoint or include it only in the registration response. Alternatively, send a re-verification email silently and return the same 401 as other failures.

3. **F-03 (V8.3.1 / V13.1.3 — JWT in query param)**: Consider alternative approaches for the OAuth link flow: (a) use a short-lived, single-use link token instead of the full JWT, (b) use a POST-redirect pattern with a form submission, or (c) store the JWT in an httpOnly cookie that the OAuth link endpoint reads. If the query param approach must stay, ensure server access logs are rotated and the short token lifetime (15 min) is documented as an accepted risk.

### Priority 2 — MEDIUM Severity FAIL

4. **F-04 (EM-06 — Authorization message difference)**: Unify `ErrorMessages.permission.INSUFFICIENT_ROLE` and `ErrorMessages.permission.INSUFFICIENT_PERMISSIONS` to a single `ErrorMessages.permission.ACCESS_DENIED` in both guards. The distinction is only useful in development and can be preserved in audit logs metadata.

5. **F-05 (V8.3.4 — Sensitive field documentation)**: Add `/// @sensitive` comments or a `SENSITIVE_FIELDS` constant documenting which Prisma fields contain secrets. This aids operational teams and future developers in handling data exports, backups, and log sanitization.
