# Fase 3: SECURITY — Auth Module

**Date**: 2026-03-03 16:35
**Module**: auth
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: OWASP ASVS v4.0 (Ch 2-6), NIST SP 800-63B, RFC 9700, RFC 8725

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 75    |
| FAIL    | 1     |
| WARN    | 6     |
| DEDUP   | 1     |

**Overall**: PASS (with 1 FAIL, 6 WARNs — N-03 reclassified PASS, N-07 deduplicated)

| Sub-phase | Standard | Checks | PASS | FAIL | WARN | Notes |
|-----------|----------|--------|------|------|------|-------|
| 3a | OWASP ASVS Ch 2 — Authentication | 18 | 17 | 0 | 1 | |
| 3b | OWASP ASVS Ch 3 — Session Mgmt | 10 | 7 | 0 | 3 | |
| 3c | OWASP ASVS Ch 4 — Access Control | 8 | 8 | 0 | 0 | |
| 3d | OWASP ASVS Ch 5 — Input Validation | 7 | 7 | 0 | 0 | |
| 3e | OWASP ASVS Ch 6 — Cryptography | 5 | 5 | 0 | 0 | |
| 3f | NIST SP 800-63B | 9 | 8 | 0 | 0 | N-03→PASS, N-07→DEDUP |
| 3g | RFC 9700 — OAuth 2.0 Security | 8 | 7 | 0 | 1 | |
| 3h | RFC 8725 — JWT Best Practices | 6 | 4 | 1 | 1 | |
| 3i | HTTP Security & Rate Limiting | 12 | 11 | 0 | 1 | |
| **TOTAL** | | **83** | **75** | **1** | **6** | +1 DEDUP |

---

## 3a. OWASP ASVS v4.0 — Authentication (Chapter 2)

### V2.1.1: Password min length >= 8
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: `src/auth/dto/register.dto.ts:17` — `@MinLength(8)`, `src/auth/dto/reset-password.dto.ts:18` — `@MinLength(8)`, `src/users/dto/change-password.dto.ts:8` — `@MinLength(8)`
- **Expected**: All password DTOs enforce min 8 chars
- **Actual**: All three DTOs enforce `@MinLength(8)` consistently

### V2.1.2: Password max length >= 64
- **Verdict**: PASS | **Severity**: MEDIUM
- **Evidence**: `src/auth/dto/register.dto.ts:18` — `@MaxLength(128)`, `src/auth/dto/reset-password.dto.ts:19` — `@MaxLength(128)`, `src/users/dto/change-password.dto.ts:9` — `@MaxLength(128)`
- **Expected**: MaxLength >= 64 on all password fields
- **Actual**: All DTOs set `@MaxLength(128)`, exceeding ASVS minimum of 64

### V2.1.3: No composition rules (NIST compliant)
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: All password DTOs — Only `@IsString()`, `@MinLength`, `@MaxLength`. No `@Matches` for uppercase/lowercase/special chars.
- **Actual**: No composition rules in any password DTO. NIST SP 800-63B compliant.

### V2.1.4: Breach dictionary check
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: `src/auth/password-breach.service.ts:15-67` — HIBP k-anonymity API. `src/auth/auth.service.ts:135-139` — called on registration. `src/auth/auth.service.ts:1067-1074` — called on password reset.
- **Actual**: HIBP k-anonymity (5-char SHA-1 prefix), 3s timeout, fail-open. Checked at register and reset-password.

### V2.1.7: Bcrypt cost >= 10
- **Verdict**: PASS | **Severity**: CRITICAL
- **Evidence**: `src/auth/constants/auth.constants.ts:6` — `BCRYPT_ROUNDS = 12`. `src/auth/auth.service.ts:142` — `bcrypt.hash(dto.password, BCRYPT_ROUNDS)`
- **Actual**: Bcrypt with 12 rounds. Exceeds ASVS minimum of 10.

### V2.1.9: No password hints stored
- **Verdict**: PASS | **Severity**: MEDIUM
- **Evidence**: `src/users/entities/user.entity.ts:4-25` — no hint/reminder fields. `prisma/schema.prisma:64-95` — no hint columns.
- **Actual**: No password hint fields anywhere in schema or entities.

### V2.1.10: No knowledge-based auth
- **Verdict**: PASS | **Severity**: LOW
- **Evidence**: Grep for `hint|reminder|security.?question` across src/ — 0 matches.
- **Actual**: No security questions in any authentication flow.

### V2.2.1: Anti-automation on auth endpoints
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: `src/auth/auth.controller.ts:109` — register 5/60s, `src/auth/auth.controller.ts:134` — login 10/60s, `src/auth/auth.controller.ts:363` — forgot-password 3/15min, `src/auth/auth.controller.ts:380` — reset-password 5/60s
- **Actual**: All auth endpoints have per-endpoint `@Throttle` decorators with appropriate limits.

### V2.2.2: Weak credential resistance (timing-safe)
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: `src/auth/auth.service.ts:176-178` — `bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH)` when user not found. `src/auth/constants/auth.constants.ts:17-20` — pre-computed dummy hash.
- **Actual**: Constant-time comparison via dummy bcrypt hash prevents user enumeration by timing.

### V2.5.1: Password reset via secure token
- **Verdict**: PASS | **Severity**: CRITICAL
- **Evidence**: `src/auth/auth.service.ts:1010` — `crypto.randomBytes(32).toString('hex')`. `src/auth/auth.service.ts:1011` — SHA-256 hashed before storage.
- **Actual**: 256-bit CSPRNG token, SHA-256 hashed. Only hash stored; plaintext sent via email.

### V2.5.2: Reset token expiry <= 1 hour
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: `src/auth/auth.service.ts:44` — `RESET_TOKEN_EXPIRY_HOURS = 1`. `src/auth/auth.service.ts:1050-1052` — expiry validated on use.
- **Actual**: 1-hour TTL. Expiry enforced.

### V2.5.3: Reset token single-use
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: `src/auth/auth.service.ts:1046-1048` — rejects already-used tokens via `usedAt` check. `src/auth/auth.service.ts:1079-1082` — marks used in transaction. `src/auth/auth.service.ts:1000-1007` — invalidates all previous tokens on new request.
- **Actual**: Single-use via `usedAt` timestamp. Previous tokens invalidated on new request. Atomic via `$transaction`.

### V2.7.1: MFA TOTP support
- **Verdict**: PASS | **Severity**: CRITICAL
- **Evidence**: `src/auth/mfa.service.ts:57-66` — TOTP setup with otplib. `src/auth/mfa.service.ts:73` — secret encrypted with AES-256-GCM.
- **Actual**: Full TOTP (RFC 6238): SHA-1, 6 digits, 30s period, QR code, AES-256-GCM encrypted secret.

### V2.7.2: MFA required for admins
- **Verdict**: WARN | **Severity**: MEDIUM
- **Evidence**: `src/auth/auth.service.ts:311` — MFA checked via `if (user.mfaEnabled)` (opt-in). No role-based MFA enforcement found.
- **Expected**: Admin/SUPERADMIN accounts required to have MFA
- **Actual**: MFA is optional for all roles including ADMIN and SUPERADMIN.

### V2.8.1: MFA backup codes
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: `src/auth/mfa.service.ts:263-274` — 10 codes, 10 chars, `crypto.randomInt`. `src/auth/mfa.service.ts:69-71` — bcrypt-hashed (cost 10). `src/auth/mfa.service.ts:162-174` — single-use (spliced from array).
- **Actual**: CSPRNG generation, bcrypt-hashed storage, single-use consumption, regeneration requires password.

### V2.10.1: No hardcoded credentials
- **Verdict**: PASS | **Severity**: CRITICAL
- **Evidence**: Grep for hardcoded passwords/secrets in src/ — only test fixtures and dev-only fallbacks with "change-in-production" markers. Blocked in production by `validateProductionSecrets()`.
- **Actual**: No hardcoded production secrets.

### V2.10.2: No default credentials
- **Verdict**: PASS | **Severity**: CRITICAL
- **Evidence**: No seed scripts exist. No default admin users created.
- **Actual**: All accounts go through registration or OAuth flow.

### V2.10.4: Production secret validation
- **Verdict**: PASS | **Severity**: CRITICAL
- **Evidence**: `src/common/utils/validate-production-secrets.ts:9-44` — validates JWT_SECRET, MFA_ENCRYPTION_KEY, CSRF_SECRET at startup. Throws FATAL if default/missing/short.
- **Actual**: Three critical secrets validated. App will not start with insecure config in production.

---

## 3b. OWASP ASVS — Session Management (Chapter 3)

### V3.2.1: Session bound to user
- **Verdict**: PASS | **Severity**: CRITICAL
- **Evidence**: `src/sessions/sessions.service.ts:48-62` — `userId` mandatory. `prisma/schema.prisma:98-100` — FK to User.
- **Actual**: Every session record tied to userId via foreign key.

### V3.2.2: Session contains user agent
- **Verdict**: PASS | **Severity**: LOW
- **Evidence**: `src/sessions/sessions.service.ts:55` — `userAgent` stored. `src/auth/auth.controller.ts:69` — extracted from `req.headers['user-agent']`.
- **Actual**: User agent stored per session.

### V3.2.3: Session contains IP
- **Verdict**: PASS | **Severity**: LOW
- **Evidence**: `src/sessions/sessions.service.ts:54` — `ipAddress` stored. `prisma/schema.prisma:104` — non-nullable.
- **Actual**: IP address mandatory field in every session.

### V3.3.1: Logout invalidates session
- **Verdict**: PASS | **Severity**: CRITICAL
- **Evidence**: `src/auth/auth.service.ts:569-591` — verifies refresh token, calls `revokeSession`. `src/sessions/sessions.service.ts:130-141` — sets `isRevoked: true`. Cookie cleared with `maxAge: 0`.
- **Actual**: Session revoked and cookie cleared on logout.

### V3.3.2: Idle timeout
- **Verdict**: WARN | **Severity**: MEDIUM
- **Evidence**: `src/auth/constants/auth.constants.ts:73-76` — `SESSION_IDLE_TIMEOUT_HOURS = 24` (default). `src/sessions/sessions.service.ts:183-191` — idle check enforced on refresh.
- **Expected**: Idle timeout <= 30 min for ASVS/NIST compliance
- **Actual**: Default 24 hours. Configurable but too permissive for enterprise.

### V3.3.3: Absolute timeout
- **Verdict**: WARN | **Severity**: MEDIUM
- **Evidence**: `src/auth/auth.service.ts:115` — `JWT_REFRESH_EXPIRATION || '7d'`. `src/sessions/sessions.service.ts:85-87` — expiry checked.
- **Expected**: Absolute lifetime <= 12 hours
- **Actual**: Default 7 days. Configurable but exceeds ASVS recommendation.

### V3.3.4: Logout-all invalidates all sessions
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: `src/sessions/sessions.service.ts:143-148` — `updateMany` sets `isRevoked: true` on all active sessions. Also called after password reset and email change.
- **Actual**: Bulk revocation via `revokeAllUserSessions`.

### V3.5.1: Token not in URL
- **Verdict**: WARN | **Severity**: MEDIUM
- **Evidence**: `src/auth/auth.controller.ts:281,303,407` — email verification and reset-token validation use `@Query('token')`.
- **Expected**: No tokens in URL query params
- **Actual**: Access/refresh tokens properly in headers/cookies only. Email verification and reset-token validation use URL query params (common pattern for email links). The `validate-reset-token` GET endpoint is the main concern (token in server logs).

### V3.5.2: Token in secure cookie
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: `src/auth/auth.service.ts:1146-1158` — `httpOnly: true`, `secure: process.env.NODE_ENV === 'production'`, `sameSite: 'strict'`.
- **Actual**: All three cookie security flags properly set.

### V3.7.1: Concurrent session limits
- **Verdict**: PASS | **Severity**: MEDIUM
- **Evidence**: `src/auth/constants/auth.constants.ts:82-85` — `MAX_CONCURRENT_SESSIONS = 5`. `src/sessions/sessions.service.ts:209-242` — oldest sessions evicted, audit-logged.
- **Actual**: Default 5 concurrent sessions. Oldest-eviction policy with audit trail.

---

## 3c. OWASP ASVS — Access Control (Chapter 4)

### V4.1.1: RBAC at controller level
- **Verdict**: PASS | **Severity**: CRITICAL
- **Evidence**: All 6 controllers use proper guard chains. Admin endpoints: `@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)`. Self-service: `@UseGuards(JwtAuthGuard)`. Public: no auth guards.
- **Actual**: Complete guard coverage across all controllers.

### V4.1.2: Least privilege enforced
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: `src/users/users.controller.ts:116` — `@Roles(Role.ADMIN) + @RequirePermissions('users:read')`. All admin endpoints use dual role+permission checks.
- **Actual**: Dual-layer enforcement: role check + granular permissions.

### V4.1.3: CSRF on state-changing routes
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: `src/security/security.module.ts:11-14` — CsrfGuard registered as `APP_GUARD`. `src/common/guards/csrf.guard.ts:13` — safe methods exempted. 5 `@SkipCsrf` uses on public endpoints with alternative protections.
- **Actual**: Global CSRF protection with HMAC-SHA256 and `crypto.timingSafeEqual`.

### V4.1.4: Deny by default
- **Verdict**: PASS | **Severity**: CRITICAL
- **Evidence**: `src/app.module.ts:37-39` — `APP_GUARD: CustomThrottlerGuard`. `src/security/security.module.ts:11-14` — `APP_GUARD: CsrfGuard`. JWT default strategy.
- **Actual**: Two APP_GUARDs globally (rate limiting + CSRF). JWT authentication per-route (intentional — public endpoints must be accessible).

### V4.2.1: Parameter tampering prevention
- **Verdict**: PASS | **Severity**: MEDIUM
- **Evidence**: All 8 `:id` params across all controllers use `ParseUUIDPipe`. Zero unvalidated UUID parameters.
- **Actual**: 100% ParseUUIDPipe coverage.

### V4.3.1: Admin self-escalation prevention
- **Verdict**: PASS | **Severity**: CRITICAL
- **Evidence**: `src/users/users.service.ts:336-349` — SUPERADMIN accounts immutable. Only SUPERADMIN can assign ADMIN/SUPERADMIN roles. `src/permissions/permissions.service.ts:136-140` — ADMIN cannot modify ADMIN permissions.
- **Actual**: Three-layer self-escalation prevention.

### V4.3.2: Permission-based access
- **Verdict**: PASS | **Severity**: MEDIUM
- **Evidence**: All admin endpoints use `@RequirePermissions` with granular keys (`users:read`, `users:write`, `users:delete`, `audit-logs:read`, `permissions:read`, `permissions:write`).
- **Actual**: Database-backed permission system with in-memory caching.

### V4.3.3: SUPERADMIN restrictions
- **Verdict**: PASS | **Severity**: CRITICAL
- **Evidence**: `src/auth/guards/roles.guard.ts:38-53` — SUPERADMIN bypass with `SUPERADMIN_BYPASS` audit log. `src/users/users.service.ts:336,406,577` — SUPERADMIN immutable, undeletable, no self-delete.
- **Actual**: Complete SUPERADMIN policy: bypass with audit trail, immutable accounts.

---

## 3d. OWASP ASVS — Input Validation (Chapter 5)

### V5.1.1: Server-side validation
- **Verdict**: PASS | **Severity**: CRITICAL
- **Evidence**: `src/main.ts:45-51` — Global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
- **Actual**: Every request validated server-side before reaching handler.

### V5.1.2: Whitelist validation
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: `src/main.ts:47-48` — `whitelist: true`, `forbidNonWhitelisted: true`.
- **Actual**: Undeclared properties cause 400 Bad Request. Prevents mass assignment.

### V5.1.3: All DTOs validated
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: All 26 DTO files scanned — every DTO has class-validator decorators on all fields.
- **Actual**: 100% DTO validation coverage.

### V5.2.1: No raw HTML rendering
- **Verdict**: PASS | **Severity**: MEDIUM
- **Evidence**: Grep for `innerHTML`, `dangerouslySetInnerHTML` — 0 matches. REST API returns JSON only.
- **Actual**: No HTML rendering.

### V5.3.1: SQL injection protection
- **Verdict**: PASS | **Severity**: CRITICAL
- **Evidence**: Grep for `$queryRaw`, `$executeRaw` — 0 matches. All DB access through Prisma ORM.
- **Actual**: Prisma parameterized queries exclusively. SQL injection impossible.

### V5.3.2: No eval or dynamic execution
- **Verdict**: PASS | **Severity**: CRITICAL
- **Evidence**: Grep for `eval(`, `new Function(` — 0 matches.
- **Actual**: No dynamic code execution.

### V5.5.1: UUID params validated
- **Verdict**: PASS | **Severity**: MEDIUM
- **Evidence**: All 8 `:id` params use `ParseUUIDPipe`. `:role` uses enum validation.
- **Actual**: 100% parameter validation coverage.

---

## 3e. OWASP ASVS — Cryptography (Chapter 6)

### V6.2.1: Strong hash algorithm
- **Verdict**: PASS | **Severity**: CRITICAL
- **Evidence**: `src/auth/constants/auth.constants.ts:6` — `BCRYPT_ROUNDS = 12`. `src/common/services/crypto.service.ts:4` — AES-256-GCM for MFA secrets.
- **Actual**: bcrypt-12 for passwords, AES-256-GCM for encryption. No weak algorithms.

### V6.2.2: Cryptographic random
- **Verdict**: PASS | **Severity**: CRITICAL
- **Evidence**: Grep for `Math.random` in src/ — 1 match in test file only. Production uses `crypto.randomBytes`, `crypto.randomUUID`, `crypto.randomInt`.
- **Actual**: CSPRNG everywhere in production. Zero `Math.random()`.

### V6.2.3: Modern TOTP algorithm
- **Verdict**: PASS | **Severity**: MEDIUM
- **Evidence**: `src/auth/mfa.service.ts:58-65` — SHA-1 TOTP per RFC 6238, 6 digits, 30s period.
- **Actual**: Standard RFC 6238 TOTP. SHA-1 acceptable in HMAC context per NIST.

### V6.4.1: Secrets from environment
- **Verdict**: PASS | **Severity**: CRITICAL
- **Evidence**: All secrets sourced from `process.env` with dev-only fallbacks containing "change-in-production" markers.
- **Actual**: No hardcoded production secrets.

### V6.4.2: Different secrets per environment
- **Verdict**: PASS | **Severity**: CRITICAL
- **Evidence**: `src/common/utils/validate-production-secrets.ts:9-44` — validates JWT_SECRET, MFA_ENCRYPTION_KEY, CSRF_SECRET at startup. Rejects defaults, enforces >= 32 chars.
- **Actual**: Fatal startup error if production uses dev defaults.

---

## 3f. NIST SP 800-63B — Digital Identity Guidelines

### N-01: Memorized secrets 8-64 chars
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: Min 8, Max 128 across all password DTOs. Exceeds NIST 64-char minimum ceiling.
- **Actual**: 8-128 character range.

### N-02: No composition rules
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: Only `@IsString()` + length constraints. No character class requirements.
- **Actual**: NIST §5.1.1.2 compliant.

### N-03: Breach dictionary check
- **Verdict**: PASS | **Severity**: MEDIUM
- **Evidence**: `src/auth/password-breach.service.ts:15-67` — HIBP implemented. `src/auth/auth.service.ts:135` — called at register. `src/auth/auth.service.ts:1067` — called at reset-password. `src/users/users.service.ts:289-296` — called at changePassword via `@Inject(forwardRef(() => PasswordBreachService))` (line 46).
- **Expected**: Breach check on all password-setting operations including changePassword
- **Actual**: Checked at register, reset-password, AND changePassword. All three password-setting flows covered. Fail-open on API timeout is acceptable per NIST guidance.
- **Reclassified**: WARN → PASS (2026-03-03 post-audit verification — original audit had incomplete evidence for changePassword flow).

### N-04: All Unicode allowed
- **Verdict**: PASS | **Severity**: MEDIUM
- **Evidence**: Only `@IsString()` with length guards. No character class restrictions.
- **Actual**: No characters blocked. Unicode accepted.

### N-05: MFA support
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: `src/auth/mfa.service.ts` — TOTP (otplib). `src/auth/passkey.service.ts` — WebAuthn/FIDO2 (@simplewebauthn/server).
- **Actual**: Both TOTP and WebAuthn/passkeys implemented.

### N-06: Reauthentication for sensitive ops
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: `src/users/dto/change-password.dto.ts:4-5` — `currentPassword` required. `src/users/dto/change-email.dto.ts:7-10` — password required. `src/auth/mfa.service.ts:199,234` — password required for MFA disable/regenerate. `src/auth/passkey.service.ts:402-412` — password for passkey delete.
- **Actual**: Current password required for all sensitive operations.

### N-07: Session timeout compliant
- **Verdict**: DEDUP | **Severity**: —
- **Evidence**: Same finding as V3.3.2 (idle timeout) and V3.3.3 (absolute timeout).
- **Reclassified**: WARN → DEDUP (duplicate of OWASP V3.3.2/V3.3.3 — tracked under those IDs to avoid double-counting).

### N-08: Verifier impersonation resistance
- **Verdict**: PASS | **Severity**: MEDIUM
- **Evidence**: `src/common/middleware/https-redirect.middleware.ts:4-15` — HTTPS redirect in production. `src/security/security.config.ts:67-71` — HSTS with preload. WebAuthn verifies origin/rpId.
- **Actual**: HTTPS + HSTS + JWT iss/aud + WebAuthn origin verification.

### N-09: Rate limiting on auth
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: All auth endpoints throttled with appropriate limits. Progressive lockout (5 attempts → 15/30/60/120 min escalation).
- **Actual**: Per-endpoint throttling + per-account lockout.

---

## 3g. RFC 9700 — OAuth 2.0 Security Best Current Practice

### O-01: PKCE on all OAuth flows
- **Verdict**: PASS | **Severity**: CRITICAL
- **Evidence**: `src/auth/guards/google-auth.guard.ts:15-20` — S256 code_challenge. `src/auth/guards/github-auth.guard.ts:15-20` — same. `src/auth/stores/oauth-state.store.ts:14-17` — `randomBytes(32)` code_verifier.
- **Actual**: PKCE S256 implemented for both Google and GitHub. Code verifier stored in Redis, injected at token exchange.
- **Note**: GitHub does not officially validate PKCE server-side, but the intent is correct.

### O-02: State parameter (anti-CSRF)
- **Verdict**: PASS | **Severity**: CRITICAL
- **Evidence**: `src/auth/stores/oauth-state.store.ts:12-25` — UUID state, Redis TTL 300s. `src/auth/stores/oauth-state.store.ts:36-40` — atomic `GETDEL` consumption.
- **Actual**: Per-request state, Redis-backed, single-use via atomic GETDEL.

### O-03: Redirect URI whitelisted
- **Verdict**: WARN | **Severity**: LOW
- **Evidence**: `src/auth/strategies/google.strategy.ts:17-19` — `GOOGLE_CALLBACK_URL || 'http://localhost:3000/...'`. `src/auth/auth.controller.ts:602-615` — frontend redirect validated against `OAUTH_ALLOWED_REDIRECT_URLS`.
- **Expected**: No insecure fallback defaults in production
- **Actual**: Post-exchange redirect properly validated. Callback URLs rely on provider-side registration. Default fallback to localhost if env vars unset — no startup validation enforcing this.

### O-04: Token exchange via back-channel
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: `src/auth/auth.controller.ts:457-468` — returns ephemeral internal code (UUID) in redirect, not OAuth token. `src/auth/auth.controller.ts:509-535` — POST exchange returns JWT in body, refresh in httpOnly cookie.
- **Actual**: OAuth tokens never reach browser URL. Secure code-exchange pattern.

### O-05: Ephemeral authorization code
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: `src/auth/stores/oauth-code.store.ts:31-39` — Redis `GETDEL` for atomic single-use.
- **Actual**: Exactly-once consumption. No replay window.

### O-06: Short code lifetime
- **Verdict**: PASS | **Severity**: MEDIUM
- **Evidence**: `src/auth/stores/oauth-code.store.ts:8` — `CODE_TTL_SECONDS = 60`. `src/auth/stores/oauth-state.store.ts:6` — `STATE_TTL_SECONDS = 300`.
- **Actual**: 60s code TTL. Well within 10-minute maximum.

### O-07: No token in logs
- **Verdict**: PASS | **Severity**: MEDIUM
- **Evidence**: Grep for `console.log.*token|logger.*token` — 0 matches.
- **Actual**: No token values in any log statement.

### O-08: Scope limitation
- **Verdict**: PASS | **Severity**: LOW
- **Evidence**: `src/auth/strategies/google.strategy.ts:20` — `['email', 'profile']`. `src/auth/strategies/github.strategy.ts:20` — `['user:email']`.
- **Actual**: Minimal scopes only.

---

## 3h. RFC 8725 — JWT Best Practices

### J-01: Algorithm explicitly set
- **Verdict**: PASS | **Severity**: CRITICAL
- **Evidence**: `src/auth/strategies/jwt.strategy.ts:18` — `algorithms: ['HS256']`. `src/auth/auth.module.ts:41,46` — `algorithm: 'HS256'` in sign/verify. No "none" in any algorithms array.
- **Actual**: HS256 explicitly configured. "none" algorithm impossible.

### J-02: Issuer (iss) claim
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: `src/auth/auth.module.ts:39` — `issuer: 'nexacore-api'` in signOptions. `src/auth/auth.module.ts:44` — validated in verifyOptions. `src/auth/strategies/jwt.strategy.ts:16` — validated in passport-jwt.
- **Actual**: Issuer set and validated at both layers.

### J-03: Audience (aud) claim
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: `src/auth/auth.module.ts:40` — `audience: 'nexacore-api'` in signOptions. `src/auth/auth.module.ts:45` — validated in verifyOptions. `src/auth/strategies/jwt.strategy.ts:17` — validated in passport-jwt.
- **Actual**: Audience set and validated at both layers.

### J-04: Expiration (exp) claim
- **Verdict**: WARN | **Severity**: LOW
- **Evidence**: `src/auth/auth.module.ts:38` — `expiresIn: '15m'` default. `src/auth/strategies/jwt.strategy.ts:13` — `ignoreExpiration: false`.
- **Expected**: Access token <= 15 min
- **Actual**: Default 15 minutes (meets boundary). `ignoreExpiration: false` enforced. No startup validation if overridden to longer value.

### J-05: Token ID (jti) claim
- **Verdict**: FAIL | **Severity**: MEDIUM
- **Evidence**: `src/common/interfaces/jwt-payload.interface.ts:3-7` — `JwtPayload` has `sub`, `email`, `role` only. No `jti`. `src/auth/interfaces/refresh-token-payload.interface.ts:1-5` — has `sub`, `sessionId`, `family`. No `jti`. `src/auth/auth.service.ts:644-646` — access token signed without `jti`.
- **Expected**: Unique `jti` claim in every JWT for per-token revocation
- **Actual**: No `jti` in access or refresh tokens. Refresh token uses `sessionId` as functional equivalent for session-level tracking but this is not a per-token identifier. Access tokens have no revocation capability within their 15-minute lifetime.

### J-06: Refresh token rotation
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: `src/sessions/sessions.service.ts:79-120` — `rotateRefreshToken()`: old token revoked, new session in same family, theft detection via reuse = family-wide revocation. bcrypt-hashed storage.
- **Actual**: Full rotation with theft detection, family-based revocation, bcrypt-hashed storage.

---

## 3i. HTTP Security & Rate Limiting

### H-01: HSTS header
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: `src/security/security.config.ts:67-71` — `maxAge: 31536000, includeSubDomains: true, preload: true`. `src/common/middleware/helmet.middleware.ts:17` — applied via helmet.
- **Actual**: 1-year HSTS with subdomains and preload.

### H-02: Content-Security-Policy
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: `src/security/security.config.ts:51-66` — Full CSP: `defaultSrc: ["'self'"]`, `scriptSrc: ["'self'"]`, `objectSrc: ["'none'"]`, `frameSrc: ["'none'"]`. Enforcement mode (`reportOnly: false`).
- **Actual**: Restrictive CSP enforced.

### H-03: X-Frame-Options
- **Verdict**: PASS | **Severity**: MEDIUM
- **Evidence**: `src/common/middleware/helmet.middleware.ts:20` — `xFrameOptions: { action: 'deny' }`. CSP `frameAncestors: ["'none'"]` as redundant backup.
- **Actual**: DENY with CSP redundancy.

### H-04: X-Content-Type-Options
- **Verdict**: PASS | **Severity**: MEDIUM
- **Evidence**: `src/common/middleware/helmet.middleware.ts:19` — `xContentTypeOptions: true` → `nosniff`.
- **Actual**: nosniff enabled.

### H-05: Referrer-Policy
- **Verdict**: PASS | **Severity**: MEDIUM
- **Evidence**: `src/security/security.config.ts:72-74` — `strict-origin-when-cross-origin`.
- **Actual**: Restrictive referrer policy.

### H-06: CORS restricted
- **Verdict**: WARN | **Severity**: LOW
- **Evidence**: `src/main.ts:25-38` — origin callback validates against `allowedOrigins`. No wildcard. `src/main.ts:29-31` — null-origin passthrough for non-browser clients.
- **Expected**: Strict origin whitelist
- **Actual**: Whitelist enforced for browser requests. Null-origin allowed (standard for server-to-server). Acceptable risk for API backend.

### H-07: Rate limit: login
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: `src/auth/auth.controller.ts:134-139` — `@Throttle` 10 req/60s.
- **Actual**: Login throttled at 10/60s.

### H-08: Rate limit: register
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: `src/auth/auth.controller.ts:109-114` — `@Throttle` 5 req/60s.
- **Actual**: Register throttled at 5/60s.

### H-09: Rate limit: password reset
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: `src/auth/auth.controller.ts:363-365` — forgot-password 3/15min. `src/auth/auth.controller.ts:380` — reset-password 5/60s.
- **Actual**: Dual throttle on both endpoints.

### H-10: Rate limit: MFA
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: `src/auth/mfa.controller.ts:52-57` — all MFA endpoints at 5/60s. Inline comment: "5 guesses/60s × 5-min mfaToken = max 25 guesses vs 1M TOTP combinations".
- **Actual**: All 6 MFA endpoints throttled.

### H-11: Rate limit: OAuth exchange
- **Verdict**: PASS | **Severity**: MEDIUM
- **Evidence**: `src/auth/auth.controller.ts:510-514` — 10/60s. OAuth callbacks use `@SkipThrottle()` (provider-driven).
- **Actual**: Exchange throttled. Callbacks exempted (correct).

### H-12: Progressive lockout
- **Verdict**: PASS | **Severity**: HIGH
- **Evidence**: `src/auth/constants/auth.constants.ts:11,27-35` — 5 attempts → lockout escalation: 15→30→60→120 min. `src/auth/auth.service.ts:191-212,241-270` — pre-check, escalation, audit logging.
- **Actual**: Full progressive lockout with `ACCOUNT_LOCKED` audit events.

---

## Risk Register — FAIL & WARN Findings

| # | Check ID | Severity | Verdict | Finding | Standard |
|---|----------|----------|---------|---------|----------|
| 1 | J-05 | MEDIUM | FAIL | No `jti` claim in JWT tokens — no per-token revocation capability | RFC 8725 §3.9 |
| 2 | V2.7.2 | MEDIUM | WARN | MFA not required for admin/SUPERADMIN roles | OWASP ASVS V2.7.2 |
| 3 | V3.3.2 | MEDIUM | WARN | Idle timeout default 24h (should be <= 30min for AAL2) | OWASP ASVS V3.3.2 |
| 4 | V3.3.3 | MEDIUM | WARN | Absolute timeout default 7d (should be <= 12h for AAL2) | OWASP ASVS V3.3.3 |
| 5 | V3.5.1 | MEDIUM | WARN | Reset token validation via GET query parameter | OWASP ASVS V3.5.1 |
| ~~6~~ | ~~N-03~~ | ~~MEDIUM~~ | ~~WARN~~ → **PASS** | ~~Breach check missing on changePassword~~ — **RECLASSIFIED**: `users.service.ts:289` confirms PasswordBreachService IS called | NIST SP 800-63B §5.1.1.2 |
| 7 | N-07 | MEDIUM | DEDUP | Session timeouts — duplicate of V3.3.2/V3.3.3 (same finding, same fix) | NIST SP 800-63B §7.2 |
| 8 | O-03 | LOW | WARN | OAuth callback URL has localhost fallback, no production startup validation | RFC 9700 §2.1 |
| 9 | J-04 | LOW | WARN | Access token 15min meets boundary; no validation if overridden longer | RFC 8725 §3.9 |
| 10 | H-06 | LOW | WARN | CORS null-origin passthrough for non-browser clients | OWASP CORS Cheat Sheet |

---

## Recommendations

### FAIL Findings (fix required)

1. **J-05**: Add `jti: crypto.randomUUID()` to JWT payload interface and sign options. Optionally maintain a short-lived Redis deny-list for pre-expiry access token revocation on logout/password-change events.

### WARN Findings (recommended improvements)

2. **V2.7.2**: Add a guard or middleware that blocks admin/SUPERADMIN access if `user.mfaEnabled === false`, or enforce MFA enrollment before granting elevated-role sessions.
3. **V3.3.2 / N-07**: Reduce `SESSION_IDLE_TIMEOUT_HOURS` default from 24 to 0.5 (30 min). Add production validation like existing secret checks.
4. **V3.3.3 / N-07**: Reduce `JWT_REFRESH_EXPIRATION` default from 7d to 12h. Add production validation.
5. **V3.5.1**: Consider converting `validate-reset-token` from GET to POST (token in body instead of URL). Email verification GETs are acceptable.
6. **N-03**: Inject `PasswordBreachService` into `changePassword` flow in `users.service.ts`. Consider configurable fail-closed behavior when HIBP is unreachable.
7. **O-03**: Add `GOOGLE_CALLBACK_URL` and `GITHUB_CALLBACK_URL` to `validateProductionSecrets()`.
8. **J-04**: Add `JWT_ACCESS_EXPIRATION` validation in `validateProductionSecrets()` — reject values > 15m in production.
9. **H-06**: Document null-origin passthrough as accepted architectural risk.

### Security Strengths Identified

- **Triple-layer access control**: JwtAuth + Roles + Permissions on admin endpoints
- **SUPERADMIN immutability**: Cannot be modified, deleted, or have permissions altered
- **Zero raw SQL**: Prisma ORM exclusively
- **Cryptographic hygiene**: bcrypt-12, AES-256-GCM, CSPRNG everywhere, zero Math.random()
- **Production enforcement**: Fatal startup validation for 3 critical secrets
- **Progressive lockout**: 5 attempts → 15/30/60/120 min escalation with audit trail
- **OAuth security**: PKCE + state + ephemeral codes + back-channel exchange
- **Full CSRF protection**: Global APP_GUARD with HMAC-SHA256 + timing-safe comparison
