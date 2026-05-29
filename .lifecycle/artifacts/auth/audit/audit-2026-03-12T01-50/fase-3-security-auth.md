# Fase 3: SECURITY — Auth

**Date**: 2026-03-12 02:10
**Module**: auth
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: OWASP ASVS v4.0, NIST SP 800-63B, RFC 9700, RFC 8725, CWE-200/203/209/1321/1333/918

---

## Summary

| Sub-phase | Checks | PASS | FAIL | WARN | N/A |
|-----------|--------|------|------|------|-----|
| 3a. Authentication (Ch2) | 18 | 17 | 0 | 1 | 0 |
| 3b. Session Mgmt (Ch3) | 10 | 9 | 0 | 1 | 0 |
| 3c. Access Control (Ch4) | 8 | 8 | 0 | 0 | 0 |
| 3d. Input Validation (Ch5) | 7 | 7 | 0 | 0 | 0 |
| 3e. Cryptography (Ch6) | 5 | 5 | 0 | 0 | 0 |
| 3f. NIST 800-63B | 9 | 9 | 0 | 0 | 0 |
| 3g. RFC 9700 OAuth | 8 | 8 | 0 | 0 | 0 |
| 3h. RFC 8725 JWT | 6 | 6 | 0 | 0 | 0 |
| 3i. HTTP Security | 12 | 12 | 0 | 0 | 0 |
| 3j. Error Disclosure | 13 | 10 | 0 | 3 | 0 |
| 3k. Logging (Ch7) | 7 | 6 | 0 | 1 | 0 |
| 3l. Data Protection (Ch8) | 7 | 4 | 1 | 2 | 0 |
| 3m. API Security (Ch13) | 5 | 5 | 0 | 0 | 0 |
| 3n. Node.js Attacks | 9 | 9 | 0 | 0 | 0 |
| **TOTAL** | **124** | **115** | **1** | **8** | **0** |

**Overall**: FAIL (1 FAIL finding — MEDIUM severity)

---

## Detailed Findings

### 3a. OWASP ASVS — Authentication (Chapter 2)

#### V2.1.1: Password min length >= 8
- **Verdict**: PASS
- **Evidence**: `src/auth/dto/register.dto.ts:23` — `@MinLength(8)`. Also `reset-password.dto.ts:18`, `change-password.dto.ts:9`

#### V2.1.2: Password max length >= 64
- **Verdict**: PASS
- **Evidence**: `src/auth/dto/register.dto.ts:24` — `@MaxLength(128)`. Exceeds 64 minimum.

#### V2.1.3: No composition rules
- **Verdict**: PASS
- **Evidence**: Only `@MinLength`/`@MaxLength`, no `@Matches` for uppercase/lowercase/special chars.

#### V2.1.4: Breach dictionary check
- **Verdict**: PASS
- **Evidence**: `src/auth/password-breach.service.ts:15-67` — HIBP API with k-anonymity. Called on register, reset, change.

#### V2.1.7: Bcrypt with cost >= 10
- **Verdict**: PASS
- **Evidence**: `src/auth/constants/auth.constants.ts:6` — `BCRYPT_ROUNDS = 12`. Recovery codes use cost 10.

#### V2.1.9: No password hints stored
- **Verdict**: PASS
- **Evidence**: User entity has no hint/reminder fields.

#### V2.1.10: No knowledge-based auth
- **Verdict**: PASS
- **Evidence**: No security questions in codebase.

#### V2.2.1: Anti-automation on auth endpoints
- **Verdict**: PASS
- **Evidence**: Register: 5/60s + TurnstileGuard. Login: 10/60s + TurnstileGuard. Global: 100/60s. Account lockout after 5 failures.

#### V2.2.2: Weak credential resistance (timing-safe)
- **Verdict**: PASS
- **Evidence**: `auth.service.ts:205-206` — `bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH)` for non-existent users. CSRF uses `crypto.timingSafeEqual`.

#### V2.5.1: Password reset via secure token
- **Verdict**: PASS
- **Evidence**: `auth.service.ts:1093` — `crypto.randomBytes(32).toString('hex')`. Token stored hashed (SHA-256).

#### V2.5.2: Reset token expiry
- **Verdict**: PASS
- **Evidence**: `auth.service.ts:45` — `RESET_TOKEN_EXPIRY_HOURS = 1`.

#### V2.5.3: Reset token single-use
- **Verdict**: PASS
- **Evidence**: `auth.service.ts:1129-1131` — Checks `usedAt`, marks used in transaction.

#### V2.7.1: MFA TOTP support
- **Verdict**: PASS
- **Evidence**: `mfa.service.ts:57-65` — otplib, SHA1, 6 digits, 30s. Secret encrypted AES-256-GCM.

#### V2.7.2: MFA required for admins
- **Verdict**: PASS
- **Evidence**: `auth.service.ts:393-413` — ADMIN/SUPERADMIN without MFA returns `mfaSetupRequired: true`.

#### V2.8.1: MFA backup codes
- **Verdict**: PASS
- **Evidence**: `mfa.service.ts:263-274` — 10 codes, `crypto.randomInt()`, bcrypt hashed, single-use.

#### V2.10.1: No hardcoded credentials
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: `crypto.service.ts:13-14`, `auth.module.ts:38` — Development fallbacks hardcoded. Blocked in production by `validateProductionSecrets()`.
- **Standard**: OWASP ASVS V2.10.1

#### V2.10.2: No default credentials
- **Verdict**: PASS
- **Evidence**: No seed scripts with default admin accounts.

#### V2.10.4: Production secret validation
- **Verdict**: PASS
- **Evidence**: `validate-production-secrets.ts:28-94` — Validates JWT, MFA, CSRF secrets + OAuth HTTPS + JWT expiry.

---

### 3b. OWASP ASVS — Session Management (Chapter 3)

#### V3.2.1–V3.2.3: Session bound to user + userAgent + IP
- **Verdict**: PASS (all 3)
- **Evidence**: `sessions.service.ts:69-83` — userId, ipAddress, userAgent stored.

#### V3.3.1: Logout invalidates session
- **Verdict**: PASS
- **Evidence**: `auth.service.ts:656` — `revokeSession()` + token deny list.

#### V3.3.2: Idle timeout
- **Verdict**: PASS
- **Evidence**: `auth.constants.ts:75-77` — `SESSION_IDLE_TIMEOUT_HOURS = 0.5` (30 min).

#### V3.3.3: Absolute timeout
- **Verdict**: PASS
- **Evidence**: `auth.service.ts:123` — `refreshExpiration = '12h'`.

#### V3.3.4: Logout-all invalidates all sessions
- **Verdict**: PASS
- **Evidence**: `auth.service.ts:678` — `revokeAllUserSessions()` + deny list.

#### V3.5.1: Token not in URL
- **Verdict**: WARN
- **Severity**: MEDIUM
- **Evidence**: Email verification tokens in `?token=` (standard, single-use). OAuth link guard accepts JWT in `?token=` (browser redirect tradeoff). Risk: JWT in server logs/browser history.
- **Standard**: OWASP ASVS V3.5.1

#### V3.5.2: Token in secure cookie
- **Verdict**: PASS
- **Evidence**: `auth.service.ts:1232-1244` — httpOnly, secure (prod), sameSite: strict.

#### V3.7.1: Concurrent session limits
- **Verdict**: PASS
- **Evidence**: `auth.constants.ts:83-86` — `MAX_CONCURRENT_SESSIONS = 5`.

---

### 3c. OWASP ASVS — Access Control (Chapter 4)

All 8 checks PASS:
- V4.1.1: RBAC via `@UseGuards(JwtAuthGuard, RolesGuard)` on admin endpoints
- V4.1.2: `@Roles(Role.ADMIN)` on admin-only endpoints
- V4.1.3: CsrfGuard as APP_GUARD with `@SkipCsrf()` for public endpoints
- V4.1.4: Global CustomThrottlerGuard + CsrfGuard as APP_GUARD
- V4.2.1: ParseUUIDPipe on all `:id` params + ValidationPipe whitelist
- V4.3.1: `users.service.ts:501-515` — prevents admin self-escalation
- V4.3.2: `@RequirePermissions()` + PermissionsGuard on sensitive endpoints
- V4.3.3: SUPERADMIN bypass with audit logging, cannot be modified/deleted

---

### 3d. Input Validation (Chapter 5) — All 7 PASS

- V5.1.1: Global ValidationPipe with transform + whitelist (`main.ts:50-56`)
- V5.1.2: `whitelist: true`, `forbidNonWhitelisted: true`
- V5.1.3: All 18 DTOs have class-validator decorators
- V5.2.1: No innerHTML/dangerouslySetInnerHTML (JSON API)
- V5.3.1: No `$queryRaw`/`$executeRaw` — all Prisma parameterized
- V5.3.2: No eval/Function/setTimeout with strings
- V5.5.1: ParseUUIDPipe on all `:id` params

---

### 3e. Cryptography (Chapter 6) — All 5 PASS

- V6.2.1: bcrypt cost 12 for passwords, cost 10 for recovery codes
- V6.2.2: 0 `Math.random` in production. Uses `crypto.randomBytes`, `crypto.randomUUID`, `crypto.randomInt`
- V6.2.3: TOTP SHA1 per RFC 6238 (universal authenticator compatibility)
- V6.4.1: All secrets from `process.env`
- V6.4.2: `validateProductionSecrets()` rejects defaults in production

---

### 3f. NIST SP 800-63B — All 9 PASS

- N-01 to N-04: Password 8-128 chars, no composition rules, HIBP check, full Unicode
- N-05: TOTP + WebAuthn (two MFA methods)
- N-06: Current password required for all sensitive ops
- N-07: Idle 30min, absolute 12h
- N-08: HTTPS redirect + HSTS + OAuth HTTPS validation
- N-09: @Throttle on all auth endpoints + account lockout

---

### 3g. RFC 9700 OAuth — All 8 PASS

- O-01: Full PKCE S256 (randomBytes(32), SHA-256 challenge)
- O-02: State as randomUUID, Redis 5min TTL, consumed atomically
- O-03: Callback URLs from env, frontend URL validated against allowlist
- O-04: Back-channel exchange via POST, tokens in body/cookie
- O-05: Code consumed on exchange (Redis get+delete)
- O-06: Code TTL = 60s
- O-07: No tokens in logs
- O-08: Minimal scopes (email+profile / user:email)

---

### 3h. RFC 8725 JWT — All 6 PASS

- J-01: `algorithms: ['HS256']` explicit, no "none"
- J-02: `issuer: 'nexacore-api'`
- J-03: `audience: 'nexacore-api'`
- J-04: `expiresIn: '15m'`, enforced in production
- J-05: `jti: crypto.randomUUID()` on every token
- J-06: Refresh rotation with family-based theft detection

---

### 3i. HTTP Security — All 12 PASS

- H-01: HSTS 1yr + includeSubDomains + preload
- H-02: CSP strict (self, no object/frame, upgrade-insecure)
- H-03: X-Frame-Options DENY
- H-04: X-Content-Type-Options nosniff
- H-05: Referrer-Policy strict-origin-when-cross-origin
- H-06: CORS origin from allowlist (not wildcard)
- H-07 to H-11: Rate limits on all auth endpoints
- H-12: Progressive lockout (15/30/60/120 min escalation)

---

### 3j. Error Message Information Disclosure

#### EM-01, EM-02, EM-04, EM-05, EM-08, EM-09, EM-10, EM-11, EM-13: PASS

#### EM-03: No security mechanism disclosure
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: `mfa.service.ts:99-101` — `'MFA setup not initiated. Call POST /auth/mfa/setup first'` reveals API flow. Authenticated-only.

#### EM-06: No authorization detail disclosure
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: `roles.guard.ts:66` — `'Insufficient role'`, `permissions.guard.ts:51` — `'Insufficient permissions'`. Could be unified to `'Access denied'`.

#### EM-12: No configuration values in errors
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: `passkey.service.ts:67` — `MAX_PASSKEYS_PER_USER` value exposed. Authenticated-only.

---

### 3k. Logging (Chapter 7)

#### V7.1.1, V7.1.3, V7.1.4, V7.3.1, V7.4.1, V7.4.3: PASS

#### V7.1.2: No PII in logs
- **Verdict**: WARN
- **Severity**: MEDIUM
- **Evidence**: `mail.service.ts:32` and 12+ other lines log email addresses in plaintext. GDPR/SOC 2 concern.

---

### 3l. Data Protection (Chapter 8)

#### V8.2.1: Anti-caching on sensitive endpoints
- **Verdict**: FAIL
- **Severity**: MEDIUM
- **Evidence**: No `Cache-Control: no-store` header on any auth endpoint. Token responses and user profiles may be cached by proxies.
- **Expected**: `Cache-Control: no-store` on login, refresh, me, MFA endpoints
- **Actual**: No cache control headers set
- **Standard**: OWASP ASVS V8.2.1

#### V8.2.2, V8.2.3, V8.3.4, V8.3.5: PASS

#### V8.3.1: No sensitive data in query strings
- **Verdict**: WARN
- **Severity**: MEDIUM
- **Evidence**: OAuth link flow passes JWT in `?token=` query param. Browser redirect limitation tradeoff.

#### V8.3.7: Database TLS
- **Verdict**: WARN
- **Severity**: MEDIUM
- **Evidence**: No `sslmode=require` validation in startup. Depends entirely on DATABASE_URL env var.

---

### 3m. API Security (Chapter 13) — All 5 PASS

### 3n. Node.js Attacks — All 9 PASS

- PP-01 to PP-03: No prototype pollution vectors
- RD-01, RD-02: No evil regex or user input in RegExp
- SS-01, SS-02: Outbound URLs hardcoded (Turnstile, HIBP)
- GS-01, GS-02: No secrets in git, .gitignore comprehensive

---

## Recommendations

### FAIL

1. **V8.2.1** (MEDIUM): Add `Cache-Control: no-store, no-cache, must-revalidate` header to all auth endpoints. Options: (a) NestJS interceptor on auth controllers, (b) helmet middleware addition, (c) `@Header('Cache-Control', 'no-store')` on sensitive endpoints.

### WARN

2. **V2.10.1** (LOW): Remove development fallback secrets from source. Require `.env` even in development.
3. **V3.5.1** (MEDIUM): Replace JWT in OAuth link query param with a short-lived single-use intermediary token.
4. **EM-03** (LOW): Change `'MFA setup not initiated. Call POST /auth/mfa/setup first'` to generic `'Invalid MFA state'`.
5. **EM-06** (LOW): Unify guard messages to `'Access denied'`.
6. **EM-12** (LOW): Change passkey limit error to `'Maximum passkeys reached'` (hide numeric value).
7. **V7.1.2** (MEDIUM): Mask or hash email addresses in mail.service.ts log statements.
8. **V8.3.1** (MEDIUM): Replace JWT query param in OAuth link with ephemeral intermediary token.
9. **V8.3.7** (MEDIUM): Add `DATABASE_URL` SSL validation to `validateProductionSecrets()`.
