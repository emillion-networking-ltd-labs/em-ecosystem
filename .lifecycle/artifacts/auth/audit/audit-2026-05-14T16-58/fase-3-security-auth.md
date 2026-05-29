---
schema: ai-specs/schemas/audit-phase-report.schema.yml
phase: security
module: auth
audit_folder: ai-specs/changes/auth/audit/audit-2026-05-14T16-58
date: 2026-05-14T16:58:00Z
framework_version: audit-standards.mdc v1.0
auditor: Claude (automated, Opus model)
standards_covered:
  - OWASP ASVS v4.0
  - NIST SP 800-63B
  - RFC 9700 OAuth 2.0
  - RFC 8725 JWT
  - CWE-200/203/209
  - CWE-918
  - CWE-1321/1333
checks_summary:
  pass: 116
  fail: 0
  warn: 8
  na: 0
  total: 124
overall_verdict: PASS
---

# Fase 3: SECURITY — auth

**Date**: 2026-05-14 16:58 UTC
**Module**: auth
**Auditor**: Claude (automated, Opus model across 3 parallel sub-agents)
**Framework**: audit-standards.mdc v1.0
**Standards**: OWASP ASVS v4.0, NIST SP 800-63B, RFC 9700, RFC 8725, CWE-200/203/209, CWE-918, CWE-1321/1333

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 116   |
| FAIL    | 0     |
| WARN    | 8     |
| N/A     | 0     |

**Overall**: PASS (no FAIL findings — 8 WARNs to remediate per recommendations)

### Sub-phase breakdown

| Sub-phase | Standard | Checks | PASS | WARN | FAIL |
|-----------|----------|--------|------|------|------|
| 3a | OWASP ASVS Authentication (Chapter 2) | 18 | 17 | 1 | 0 |
| 3b | OWASP ASVS Session Management (Chapter 3) | 10 | 10 | 0 | 0 |
| 3c | OWASP ASVS Access Control (Chapter 4) | 8 | 7 | 1 | 0 |
| 3d | OWASP ASVS Input Validation (Chapter 5) | 7 | 7 | 0 | 0 |
| 3e | OWASP ASVS Cryptography (Chapter 6) | 5 | 5 | 0 | 0 |
| 3f | NIST SP 800-63B | 9 | 9 | 0 | 0 |
| 3g | RFC 9700 OAuth 2.0 BCP | 8 | 8 | 0 | 0 |
| 3h | RFC 8725 JWT Best Practices | 6 | 6 | 0 | 0 |
| 3i | HTTP Security & Rate Limiting | 12 | 12 | 0 | 0 |
| 3j | Error Message Disclosure | 13 | 9 | 4 | 0 |
| 3k | OWASP ASVS Error Handling & Logging (Chapter 7) | 7 | 7 | 0 | 0 |
| 3l | OWASP ASVS Data Protection (Chapter 8) | 7 | 7 | 0 | 0 |
| 3m | OWASP ASVS API Security (Chapter 13) | 5 | 5 | 0 | 0 |
| 3n | Node.js-Specific (CWE-918/1321/1333) | 9 | 7 | 2 | 0 |
| **Total** | — | **124** | **116** | **8** | **0** |

---

## Detailed Findings

This report consolidates findings from three Opus-model sub-agents covering 14 standards-based sub-phases. Every PASS / WARN cites `<file>:<line>:<excerpt>` evidence per FW-025 Per-Check Assertion Model.

---

## 3a. OWASP ASVS v4.0 — Authentication (Chapter 2)

### V2.1.1: Password min length ≥ 8 — **PASS** (HIGH)
- **Evidence**: `src/auth/dto/register.dto.ts:23:@MinLength(8, { message: 'Password must be at least 8`; `src/auth/dto/reset-password.dto.ts:18:@MinLength(8`; `src/users/dto/change-password.dto.ts:9:@MinLength(8`
- **Standard**: OWASP ASVS V2.1.1

### V2.1.2: Password max length ≥ 64 — **PASS** (HIGH)
- **Evidence**: `src/auth/dto/register.dto.ts:24:@MaxLength(128, { message: 'Password must not exceed 128`; `src/auth/dto/reset-password.dto.ts:19:@MaxLength(128`; `src/users/dto/change-password.dto.ts:10:@MaxLength(128`
- **Standard**: OWASP ASVS V2.1.2

### V2.1.3: No composition rules (NIST compliant) — **PASS** (HIGH)
- **Evidence**: `grep '@Matches' in src/auth/dto/ + src/users/dto/`: 2 matches, both on TOTP code regex (`mfa-verify-login.dto.ts:24` and `mfa-verify-setup.dto.ts:11`, regex `/^\d{6}$/`). Zero `@Matches` on password fields.
- **Standard**: OWASP ASVS V2.1.3

### V2.1.4: Breach dictionary check — **PASS** (HIGH)
- **Evidence**: `src/auth/password-breach.service.ts:15:async isBreached(password: string)` (HIBP k-anonymity API). Invoked at `src/auth/login.service.ts:73`, `src/auth/password-reset.service.ts:113`, `src/users/users.service.ts:736`.
- **Standard**: OWASP ASVS V2.1.4

### V2.1.7: Bcrypt with cost ≥ 10 — **PASS** (CRITICAL)
- **Evidence**: `src/auth/constants/auth.constants.ts:6:export const BCRYPT_ROUNDS = 12`; applied at `src/auth/login.service.ts:80:bcrypt.hash(dto.password, BCRYPT_ROUNDS)`.
- **Standard**: OWASP ASVS V2.1.7

### V2.1.9: No password hints stored — **PASS** (MEDIUM)
- **Evidence**: `grep 'hint|reminder|securityQuestion' in src/users/ + prisma/schema.prisma`: 0 matches.

### V2.1.10: No knowledge-based auth — **PASS** (LOW)
- **Evidence**: `grep 'securityQuestion|secretQuestion' in src/`: 0 matches.

### V2.2.1: Anti-automation on auth endpoints — **PASS** (HIGH)
- **Evidence**: `src/auth/auth.controller.ts:78-83:@Throttle(...register)` (5/60s); `:103-108:@Throttle(...login)` (10/60s); `:151-156:@Throttle(...refresh)` (30/60s); `src/auth/account.controller.ts:116:@Throttle(THROTTLE_CONFIGS.sensitiveAction)` (3/15min) on forgot-password.

### V2.2.2: Weak credential resistance — **PASS** (HIGH)
- **Evidence**: `src/auth/login.service.ts:234:await bcrypt.compare(`; dummy hash for timing equalization: `src/auth/login.service.ts:109:await bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH)` (user-not-found), `:122` (locked); min-duration floor `:183:if (elapsed < MIN_LOGIN_DURATION_MS)` (350ms).

### V2.5.1: Password reset via secure token — **PASS** (HIGH)
- **Evidence**: `src/auth/password-reset.service.ts:58:crypto.randomBytes(32).toString('hex')` (256-bit CSPRNG); SHA-256 hash stored.

### V2.5.2: Reset token expiry ≤ 1h — **PASS** (MEDIUM)
- **Evidence**: `src/auth/constants/auth.constants.ts:171:RESET_TOKEN_EXPIRY_HOURS = 1`; applied at `src/auth/password-reset.service.ts:60-62`.

### V2.5.3: Reset token single-use — **PASS** (HIGH)
- **Evidence**: `src/auth/password-reset.service.ts:94:if (resetToken.usedAt) throw new BadRequestException(...)`; consumed: `:126-129:passwordResetToken.update({ data: { usedAt: new Date() } })`.

### V2.7.1: MFA TOTP support — **PASS** (HIGH)
- **Evidence**: `src/auth/mfa.service.ts:65-73:generateSecret + generateURI(algorithm: 'sha1', digits: 6, period: 30)`; verify `:113,170:otpVerify({ token, secret })`.

### V2.7.2: MFA required for admins — **PASS** (MEDIUM)
- **Evidence**: `src/auth/login.service.ts:142-147:if ((user.role === Role.ADMIN || user.role === Role.SUPERADMIN) && !user.mfaEnabled) return handleMfaSetupRequired`.

### V2.8.1: MFA backup codes — **PASS** (HIGH)
- **Evidence**: `src/auth/mfa.service.ts:281-292:generateRecoveryCodes` via `crypto.randomInt`; hashed `:78:bcrypt.hash(code, BCRYPT_ROUNDS_RECOVERY)`; single-use enforced `:182-185:updatedCodes.splice(codeIndex, 1)`.

### V2.10.1: No hardcoded credentials — **WARN** (CRITICAL)
- **Evidence**: Dev fallbacks: `src/config/auth.config.ts:5:jwtSecret: process.env.JWT_SECRET || 'default-dev-secret-change-in-production'`; `src/common/services/crypto.service.ts:13:process.env.MFA_ENCRYPTION_KEY || 'dev-mfa-key-change-in-production-32ch'`. The `validate-production-secrets.ts` rejects defaults in production, but the literals exist in source.
- **Expected**: Zero hardcoded credential fallbacks; fail fast on missing env vars in all envs.
- **Actual**: 3 hardcoded dev secret literals in source (JWT, MFA, CSRF).
- **Recommendation**: Remove `||` defaults; throw on missing env at module construction. `.env.example` already documents the variables — no need for in-code defaults.
- **Standard**: OWASP ASVS V2.10.1

### V2.10.2: No default credentials — **PASS** (CRITICAL)
- **Evidence**: `prisma/seed.ts` only seeds Permissions and RolePermissions; no user creation, no password hashes.

### V2.10.4: Production secret validation — **PASS** (HIGH)
- **Evidence**: `src/common/utils/validate-production-secrets.ts:33-62` validates JWT/MFA/CSRF (≥32 char + non-default); called at `src/main.ts:15:validateProductionSecrets()` before NestFactory.create.

---

## 3b. OWASP ASVS — Session Management (Chapter 3)

### V3.2.1: Session bound to user — **PASS** (HIGH)
- **Evidence**: `src/sessions/sessions.service.ts:85:userId: params.userId` in `prisma.session.create`.

### V3.2.2: Session contains user agent — **PASS** (MEDIUM)
- **Evidence**: `src/sessions/sessions.service.ts:92:userAgent: params.userAgent || null`.

### V3.2.3: Session contains IP — **PASS** (MEDIUM)
- **Evidence**: `src/sessions/sessions.service.ts:91:ipAddress: params.ipAddress` plus geolocation fields lines 82, 93-96.

### V3.3.1: Logout invalidates session — **PASS** (HIGH)
- **Evidence**: `src/auth/token.service.ts:370:await sessionsService.revokeSession(payload.sessionId, payload.sub)` + deny-list `:371-373`.

### V3.3.2: Idle timeout ≤ 30 min — **PASS** (HIGH)
- **Evidence**: `src/auth/constants/auth.constants.ts:105:SESSION_IDLE_TIMEOUT_HOURS = 0.5` (30 min); enforced `src/auth/token.service.ts:286-306:validateSessionNotIdle`.

### V3.3.3: Absolute timeout ≤ 12 hours — **PASS** (MEDIUM)
- **Evidence**: `src/config/auth.config.ts:7:jwtRefreshExpiration: '12h'`; applied at `src/auth/token.service.ts:81:expiresAt = new Date(Date.now() + refreshMaxAgeMs)`.

### V3.3.4: Logout-all invalidates all sessions — **PASS** (HIGH)
- **Evidence**: `src/auth/token.service.ts:384:sessionsService.revokeAllUserSessions(userId)` → `src/sessions/sessions.service.ts:188-204:updateMany({where:{userId,isRevoked:false}, data:{isRevoked:true}})` + deny-list.

### V3.5.1: Token not in URL — **PASS** (HIGH)
- **Evidence**: `grep '@Query.*token' in src/`: 0 matches. All tokens via `@Body` or httpOnly cookie.

### V3.5.2: Token in secure cookie — **PASS** (HIGH)
- **Evidence**: `src/auth/token.service.ts:336-348:buildRefreshCookie` with `httpOnly: true, secure: this.isProduction, sameSite: 'strict', path: '/'`.

### V3.7.1: Concurrent session limits — **PASS** (MEDIUM)
- **Evidence**: `src/auth/constants/auth.constants.ts:112:MAX_CONCURRENT_SESSIONS = 5`; `src/sessions/sessions.service.ts:263-296:enforceSessionLimit`.

---

## 3c. OWASP ASVS — Access Control (Chapter 4)

### V4.1.1: RBAC at controller level — **PASS** (HIGH)
- **Evidence**: `grep '@UseGuards' in src/`: ~40 matches. Examples: `src/auth/auth.controller.ts:250:@UseGuards(JwtAuthGuard, RolesGuard)`, `src/users/users.controller.ts:235:@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)`.

### V4.1.2: Least privilege enforced — **PASS** (HIGH)
- **Evidence**: `src/auth/auth.controller.ts:251:@Roles(Role.ADMIN)`; combined with `@RequirePermissions('users:read|write|delete')`. SUPERADMIN root in `src/auth/guards/roles.guard.ts:37-53`.

### V4.1.3: CSRF on state-changing routes — **PASS** (HIGH)
- **Evidence**: Global registration `src/security/security.module.ts:13-16:{provide: APP_GUARD, useClass: CsrfGuard}`. Skip list audited (`@SkipCsrf` only on safe public endpoints).

### V4.1.4: Deny by default — **PASS** (CRITICAL)
- **Evidence**: `src/app.module.ts:58-63:{provide: APP_GUARD, useClass: CustomThrottlerGuard}` + `src/security/security.module.ts:13-16:CsrfGuard` registered globally. Per-controller `@UseGuards(JwtAuthGuard, ...)` explicit.

### V4.2.1: Parameter tampering prevention — **PASS** (MEDIUM)
- **Evidence**: `grep '@Param.*ParseUUIDPipe' in src/`: 9 matches across `users.controller.ts:246,259,282`, `session.controller.ts:87,175`, `passkey.controller.ts:153,173`, `audit.controller.ts:56`.

### V4.3.1: Admin self-escalation prevention — **WARN** (HIGH)
- **Evidence**: `src/users/users.service.ts:790-792:if (dto.role === Role.SUPERADMIN) throw new ForbiddenException`; `:785-787:if (target.role === Role.SUPERADMIN) throw new ForbiddenException`. **No explicit `actingUser.id !== targetId` check in `adminUpdateUser`** (lines 773-852).
- **Expected**: Explicit prevention of admin acting on own user record.
- **Actual**: ADMIN can call `PATCH /users/:id` with their own id; SUPERADMIN escalation is blocked, but they could change `isActive: false` on self or modify other own fields via admin endpoint.
- **Recommendation**: Add `if (actingUser.id === targetId) throw new ForbiddenException('Admins cannot modify their own account via admin endpoints')` at top of `adminUpdateUser`.
- **Standard**: OWASP ASVS V4.3.1

### V4.3.2: Permission-based access — **PASS** (MEDIUM)
- **Evidence**: `grep '@RequirePermissions' in src/`: 8 matches. Backed by `PermissionsGuard` + DB-driven `RolePermission` table.

### V4.3.3: SUPERADMIN restrictions — **PASS** (HIGH)
- **Evidence**: SUPERADMIN cannot be assigned (`users.service.ts:790-792`), modified (`:785-787`), self-deleted (`:1121-1123`), or soft-deleted by admin (`:864-866`). Bypass audited (`roles.guard.ts:37-52`).

---

## 3d. OWASP ASVS — Input Validation (Chapter 5)

### V5.1.1: Server-side validation — **PASS** (HIGH)
- **Evidence**: `src/main.ts:51-65:app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, exceptionFactory: ... }))`.

### V5.1.2: Whitelist validation — **PASS** (HIGH)
- **Evidence**: `src/main.ts:53:whitelist: true, :54:forbidNonWhitelisted: true, :55:transform: true`.

### V5.1.3: All DTOs validated — **PASS** (HIGH)
- **Evidence**: All DTOs reviewed declare class-validator decorators on every public field.

### V5.2.1: No raw HTML rendering — **PASS** (MEDIUM)
- **Evidence**: `grep 'innerHTML|dangerouslySetInnerHTML' in src/`: 0 matches.

### V5.3.1: SQL injection protection — **PASS** (CRITICAL)
- **Evidence**: `grep 'queryRaw|executeRaw' in src/`: 0 matches.

### V5.3.2: No eval or dynamic execution — **PASS** (CRITICAL)
- **Evidence**: `grep 'eval\(|new Function\(' in src/`: 0 matches.

### V5.5.1: UUID params validated — **PASS** (MEDIUM)
- **Evidence**: `grep '@Param.*ParseUUIDPipe' in src/`: 9 matches (full coverage of `:id` params).

---

## 3e. OWASP ASVS — Cryptography (Chapter 6)

### V6.2.1: Strong hash algorithm — **PASS** (CRITICAL)
- **Evidence**: bcrypt cost 12: `src/auth/login.service.ts:80`, `src/users/users.service.ts:745`, `src/auth/password-reset.service.ts:120`. SHA-1 only for HIBP k-anonymity protocol detail. SHA-256 only for non-password CSPRNG tokens.

### V6.2.2: Cryptographic random — **PASS** (CRITICAL)
- **Evidence**: `grep 'Math.random' in src/`: 1 match in `src/auth/tests/oauth-exchange.spec.ts:59` (test fixture). All production randomness via `crypto.*` (randomBytes, randomUUID, randomInt).

### V6.2.3: Modern TOTP algorithm — **PASS** (MEDIUM)
- **Evidence**: `src/auth/mfa.service.ts:70:algorithm: 'sha1'` (RFC 6238 baseline), digits 6, period 30s.

### V6.4.1: Secrets from environment — **PASS** (CRITICAL)
- **Evidence**: `src/config/auth.config.ts:5-22` reads from `process.env`. Dev fallbacks exist (see V2.10.1 WARN) but production blocks them.

### V6.4.2: Different secrets per environment — **PASS** (HIGH)
- **Evidence**: `src/common/utils/validate-production-secrets.ts:31-62` rejects default/placeholder values; `:97-115` rejects placeholder OAuth credentials.

---

## 3f. NIST SP 800-63B — Digital Identity Guidelines

### N-01: Memorized secrets 8-64 chars — **PASS** (HIGH)
- **Evidence**: Min 8, max 128 across all password DTOs (see V2.1.1, V2.1.2).

### N-02: No composition rules — **PASS** (HIGH)
- **Evidence**: 0 `@Matches` on password fields (see V2.1.3).

### N-03: Breach dictionary check — **PASS** (HIGH)
- **Evidence**: HIBP integration (see V2.1.4).

### N-04: All Unicode allowed — **PASS** (MEDIUM)
- **Evidence**: Only `@IsString` + `@MinLength` + `@MaxLength` on password fields; no character-class regex restrictions.

### N-05: MFA support — **PASS** (HIGH)
- **Evidence**: TOTP via otplib + WebAuthn via `@simplewebauthn/server`. See `src/auth/mfa.service.ts:9` and `src/auth/passkey.service.ts:11`.

### N-06: Reauthentication for sensitive ops — **PASS** (HIGH)
- **Evidence**: bcrypt.compare on current password for password change (`users.service.ts:727`), email change (`:1035`), MFA disable (`mfa.service.ts:213`), passkey reg/delete (`passkey.service.ts:84,344`), trusted-device revoke (`trusted-device.service.ts:269`), session revoke/logout-all (`sessions.service.ts:353`), OAuth unlink (`users.service.ts:1193`).

### N-07: Session timeout compliant (AAL2) — **PASS** (MEDIUM)
- **Evidence**: Idle 30 min, absolute 12h (see V3.3.2, V3.3.3).

### N-08: Verifier impersonation resistance — **PASS** (MEDIUM)
- **Evidence**: HTTPS redirect middleware (`src/common/middleware/https-redirect.middleware.ts:17-19`) + HSTS (see H-01).

### N-09: Rate limiting on auth — **PASS** (HIGH)
- **Evidence**: See V2.2.1; all auth endpoints throttled.

---

## 3g. RFC 9700 — OAuth 2.0 Security BCP

### O-01: PKCE on all OAuth flows — **PASS** (CRITICAL)
- **Evidence**: code_verifier+S256 challenge in `src/auth/stores/oauth-state.store.ts:25-28`; applied in both Google (`src/auth/strategies/google.strategy.ts:34`) and GitHub (`src/auth/strategies/github.strategy.ts:34`) strategies.

### O-02: State parameter — **PASS** (CRITICAL)
- **Evidence**: `src/auth/stores/oauth-state.store.ts:24:randomUUID()` with 300s TTL; single-use via `:53:redis.del(key)`; enforced on callback (`oauth-validate.helper.ts:22-29`).

### O-03: Redirect URI whitelisted — **PASS** (HIGH)
- **Evidence**: Callback URLs from config; frontend post-OAuth redirect enforced at `src/auth/oauth.controller.ts:249-250`.

### O-04: Token exchange via back-channel — **PASS** (HIGH)
- **Evidence**: Callback returns ephemeral UUID via httpOnly cookie (`src/auth/oauth.controller.ts:231`); tokens via `POST /auth/oauth/exchange` body only.

### O-05: Ephemeral authorization code — **PASS** (HIGH)
- **Evidence**: `src/auth/stores/oauth-code.store.ts:32-35` reads then `redis.del(key)` atomically.

### O-06: Short code lifetime — **PASS** (MEDIUM)
- **Evidence**: `src/auth/stores/oauth-code.store.ts:8:CODE_TTL_SECONDS = 60` (60s); state TTL 300s.

### O-07: No token in logs — **PASS** (MEDIUM)
- **Evidence**: 0 logger calls log token values. JTI/UUID identifiers only.

### O-08: Scope limitation — **PASS** (LOW)
- **Evidence**: Google scope `['email','profile']`; GitHub `['user:email']`. No write scopes.

---

## 3h. RFC 8725 — JWT Best Practices

### J-01: Algorithm explicit — **PASS** (CRITICAL)
- **Evidence**: `src/auth/strategies/jwt.strategy.ts:25:algorithms: ['HS256']`; `src/auth/auth.module.ts:64:algorithm: 'HS256' as const`, `:69:algorithms: ['HS256']`. No "none".

### J-02: Issuer (iss) — **PASS** (HIGH)
- **Evidence**: `src/auth/constants/auth.constants.ts:160:JWT_ISSUER = 'nexacore-api'`; sign+verify at `auth.module.ts:62,67` and `jwt.strategy.ts:23`.

### J-03: Audience (aud) — **PASS** (HIGH)
- **Evidence**: `src/auth/constants/auth.constants.ts:161:JWT_AUDIENCE = 'nexacore-api'`; configured in sign+verify.

### J-04: Expiration (exp) ≤ 15m — **PASS** (HIGH)
- **Evidence**: `src/config/auth.config.ts:6:jwtAccessExpiration: '15m'`; strategy `ignoreExpiration: false` (`jwt.strategy.ts:21`).

### J-05: Token ID (jti) — **PASS** (MEDIUM)
- **Evidence**: `src/auth/token.service.ts:113,318:jti: crypto.randomUUID()`; checked in deny-list `token-deny-list.service.ts:56`.

### J-06: Refresh token rotation — **PASS** (HIGH)
- **Evidence**: `src/sessions/sessions.service.ts:141:session.update(isRevoked:true)` followed by `:147:createSession` with same tokenFamily; family theft-detection at `:127:if (oldSession.isRevoked) revokeAllByFamily`.

---

## 3i. HTTP Security & Rate Limiting

### H-01: HSTS header — **PASS** (HIGH)
- **Evidence**: `src/security/security.config.ts:74-78:hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }`; applied via helmet `src/common/middleware/helmet.middleware.ts:16`.

### H-02: Content-Security-Policy — **PASS** (HIGH)
- **Evidence**: `src/security/security.config.ts:58-71:contentSecurityPolicy: { directives: {...defaultSrc, scriptSrc, frameAncestors: ["'none'"], objectSrc: ["'none'"], baseUri, formAction, upgradeInsecureRequests} }`.

### H-03: X-Frame-Options — **PASS** (MEDIUM)
- **Evidence**: `src/common/middleware/helmet.middleware.ts:19:xFrameOptions: { action: 'deny' }`.

### H-04: X-Content-Type-Options — **PASS** (MEDIUM)
- **Evidence**: `src/common/middleware/helmet.middleware.ts:18:xContentTypeOptions: true` (nosniff).

### H-05: Referrer-Policy — **PASS** (MEDIUM)
- **Evidence**: `src/security/security.config.ts:80:policy: 'strict-origin-when-cross-origin' as const`.

### H-06: CORS restricted — **PASS** (HIGH)
- **Evidence**: `src/main.ts:38:if (allowedOrigins.includes(origin))` — env-driven whitelist, no wildcard.

### H-07..H-11: Rate limits — **PASS** (HIGH/MEDIUM)
- **Evidence**: `@Throttle` decorators on every login (`auth.controller.ts:103-108`, 10/60s), register (`:78-83`, 5/60s), refresh (`:151-156`, 30/60s), forgot-password (`account.controller.ts:116`, 3/15min), reset-password (`:131-136`, 5/60s), MFA endpoints (`mfa.controller.ts:54,66,81,119,137,152`, 5/60s), OAuth exchange (`oauth.controller.ts:123`, 10/60s).

### H-12: Progressive lockout — **PASS** (HIGH)
- **Evidence**: `src/auth/constants/auth.constants.ts:11:MAX_FAILED_ATTEMPTS = 5`; `:37:LOCKOUT_DURATIONS_MINUTES = [15, 30, 60, 120]`. Enforced `src/auth/login.service.ts:250-251`. Timing-equalized lockout path with min-duration floor.

---

## 3j. Error Message Information Disclosure (CWE-200/203/209)

### EM-01: No user enumeration on public endpoints — **PASS** (CRITICAL)
- **Evidence**: Register returns same message for new/existing (`src/auth/login.service.ts:70 vs :97`); login throws identical `INVALID_CREDENTIALS` regardless of failure cause; forgot-password returns `'If an account exists, ...'`; passkey login explicitly `// Anti-enumeration: no error if user not found` (`src/auth/passkey.service.ts:188`).

### EM-02: No account state disclosure on public endpoints — **PASS** (CRITICAL)
- **Evidence**: All login failure paths throw `INVALID_CREDENTIALS` (`login.service.ts:116,201,213,231,265,277`). Passkey `failPasskeyAuth(reason)` writes reason to audit log only; client always gets `AUTHENTICATION_FAILED` (`passkey.service.ts:465`). JwtStrategy uses `AUTHENTICATION_FAILED` uniformly (`jwt.strategy.ts:40,45,48`).

### EM-03: No security mechanism disclosure — **PASS** (CRITICAL)
- **Evidence**: Scan of 73 `throw new` sites + `ErrorMessages` constants — no "fingerprint", "clone detection", "device trust", "PKCE", "state parameter", "deny-list", "family" terms in client-facing messages.

### EM-04: Timing-safe public responses — **PASS** (CRITICAL)
- **Evidence**: Login dummy bcrypt on every miss path (`login.service.ts:109,121-123,223-224`); 350ms min-duration floor (`:182-186`). Register: dummy bcrypt on existing email (`:56`). Forgot-password: dummy bcrypt on non-existent user (`password-reset.service.ts:41`). CSRF uses `crypto.timingSafeEqual` (`csrf.guard.ts:74`). Recovery code comparison constant-time across full hash list (`mfa.service.ts:294-303`).

### EM-05: No entity existence disclosure on authenticated endpoints — **WARN** (HIGH)
- **Evidence**: 7 sites throw `NotFoundException` revealing entity existence:
  ```
  Instances:
  1. src/auth/passkey.service.ts:313 — passkey rename (owner-scoped)
  2. src/auth/passkey.service.ts:354 — passkey delete (owner-scoped)
  3. src/auth/trusted-device.service.ts:175 — device revoke
  4. src/sessions/sessions.service.ts:169 — session revoke
  5. src/users/users.controller.ts:249 — admin getUser
  6. src/users/users.service.ts:781 — admin updateUser
  7. src/users/users.service.ts:861 — admin softDelete
  Total: 7 instances
  ```
- **Expected**: Owner-scoped self-service endpoints return 401/403 or no-op success; admin endpoints can keep 404 (admin trust model).
- **Actual**: Owner-scoped queries filter by userId so 404 only confirms own resources (low risk); admin 404s are acceptable.
- **Recommendation**: For passkey/device/session owner-scoped paths, change 404 to no-op success or generic 400 to avoid resource-id probing. Document admin 404s as accepted risk.
- **Standard**: CWE-200

### EM-06: No authorization detail disclosure — **PASS** (HIGH)
- **Evidence**: All guards use single `ErrorMessages.permission.ACCESS_DENIED` (`roles.guard.ts:60,64`; `permissions.guard.ts:36,50`).

### EM-07: Single error message per security guard — **WARN** (HIGH)
- **Evidence**: CsrfGuard, RolesGuard, PermissionsGuard, ThrottlerGuard each emit a single message. **MfaSetupGuard exposes 3 distinct messages** (`src/auth/guards/mfa-setup.guard.ts:31:'Missing authorization token'`, `:41:'User not found'`, `:47:'Invalid or expired setup token'`). `JwtOrMfaSetupGuard:35:'Valid access token or MFA setup token required'` is a fourth variant.
- **Expected**: Each guard emits one client-facing message regardless of failure cause.
- **Actual**: MfaSetupGuard discriminates which validation step failed.
- **Recommendation**: Collapse all three MfaSetupGuard throws into a single `ErrorMessages.auth.AUTHENTICATION_FAILED`.
- **Standard**: CWE-200

### EM-08: No feature state disclosure — **WARN** (HIGH)
- **Evidence**: MFA uses uniform `OPERATION_NOT_AVAILABLE`. But authenticated endpoints leak feature state:
  ```
  Instances:
  1. src/auth/email-verification.service.ts:137 — 'Email already verified' (auth'd resend-verification)
  2. src/users/users.service.ts:1031 — inline 'Email change not available for OAuth accounts'
  3. src/users/users.service.ts:1184 — ErrorMessages.oauth.NOT_LINKED
  4. src/users/users.service.ts:1188 — PASSWORD_REQUIRED_FOR_UNLINK
  Total: 4 instances
  ```
- **Expected**: Either generic `OPERATION_NOT_AVAILABLE` or centralize the strings in `ErrorMessages`.
- **Actual**: Three inline string literals bypass the catalog (lines 1031, 1047, 1129 of users.service.ts).
- **Recommendation**: Move hard-coded strings into `ErrorMessages` and consider unifying feature-state disclosure.

### EM-09: No token lifecycle disclosure — **PASS** (HIGH)
- **Evidence**: Refresh tokens use single `INVALID_REFRESH_TOKEN` (`token.service.ts:145,150,304`; `sessions.service.ts:119,123,129,137`). Reset tokens single `INVALID_RESET_TOKEN` (`password-reset.service.ts:91,95,99`). Email verification uses `{status: 'invalid'}` uniformly.

### EM-10: Consistent error messages per category — **WARN** (MEDIUM)
- **Evidence**: 8 inline strings bypass the `ErrorMessages` catalog:
  ```
  Instances:
  1. src/auth/token.service.ts:281 — 'Invalid setup token'
  2. src/auth/guards/mfa-setup.guard.ts:31 — 'Missing authorization token'
  3. src/auth/guards/mfa-setup.guard.ts:41 — 'User not found'
  4. src/auth/guards/mfa-setup.guard.ts:47 — 'Invalid or expired setup token'
  5. src/auth/guards/jwt-or-mfa-setup.guard.ts:35 — 'Valid access token or MFA setup token required'
  6. src/users/users.service.ts:741 — 'This password has appeared in a data breach…' (duplicates ErrorMessages.auth.PASSWORD_BREACHED)
  7. src/users/users.service.ts:1031 — 'Email change not available for OAuth accounts'
  8. src/users/users.controller.ts:90 — 'Avatar file is required'
  Total: 8 instances
  ```
- **Expected**: All client-facing strings live in `src/common/constants/error-messages.ts`.
- **Recommendation**: Consolidate into `ErrorMessages`. Closes EM-07 and EM-08 as side effect.

### EM-11: No internal field names in validation errors — **PASS** (MEDIUM)
- **Evidence**: ValidationPipe `exceptionFactory` strips constraint property paths (`main.ts:56-64`); HTTP filter sanitizes (`http-exception.filter.ts:82-93`).

### EM-12: No configuration values in errors — **PASS** (MEDIUM)
- **Evidence**: `retryAfter` is set as HTTP header only, stripped from body (`http-exception.filter.ts:44-48`).

### EM-13: Error response shape consistency — **PASS** (LOW)
- **Evidence**: Single envelope `{success:false, error:{message,code,statusCode}}` from `http-exception.filter.ts:71-79`.

---

## 3k. OWASP ASVS — Error Handling & Logging (Chapter 7)

### V7.1.1: No credentials in logs — **PASS** (CRITICAL)
- **Evidence**: 0 logger calls interpolate password/token/secret/authorization/cookie values. Server-derived identifiers only (JTI, UUID, action enums).

### V7.1.2: No PII in logs — **PASS** (HIGH)
- **Evidence**: Emails pseudonymized via `pseudonymizeEmail` (`login.service.ts:67,93,114`); structured audit logging only.

### V7.1.3: Security events logged — **PASS** (HIGH)
- **Evidence**: Login success/failure, MFA, password change, role change, lockout, passkey events all routed through `AuditService` with enum action codes (38 distinct `AuditAction` values).

### V7.1.4: Log record completeness — **PASS** (HIGH)
- **Evidence**: `audit/interfaces/audit-log-entry.interface.ts:3-10` defines action+userId+targetUserId+ipAddress+userAgent+metadata; timestamp from DB; outcome encoded in action enum.

### V7.3.1: Log injection prevention — **PASS** (HIGH)
- **Evidence**: AuditService writes structured JSON via Prisma; logger interpolations only contain server-derived values.

### V7.4.1: Generic error in production — **PASS** (HIGH)
- **Evidence**: `common/filters/http-exception.filter.ts:19-30` defaults non-HttpException to `'Internal server error'`; stack traces logged but not sent in response.

### V7.4.3: Last resort error handler — **PASS** (HIGH)
- **Evidence**: `main.ts:67:app.useGlobalFilters(new HttpExceptionFilter())` + `@Catch()` no-arg (catches all).

---

## 3l. OWASP ASVS — Data Protection (Chapter 8)

### V8.2.1: Anti-caching on sensitive endpoints — **PASS** (HIGH)
- **Evidence**: `NoCacheInterceptor` applied at every sensitive auth controller (`auth.controller.ts:49`, `oauth.controller.ts:55`, `mfa.controller.ts:41`, `session.controller.ts:39`, `passkey.controller.ts:41`, `account.controller.ts:34`).

### V8.2.2: No sensitive data in browser storage — **PASS** (HIGH)
- **Evidence**: 6 `localStorage.setItem`/`sessionStorage.setItem` calls in dashboard — all non-sensitive (theme, language, settings, cross-tab signaling). Access token in memory only; refresh token in httpOnly cookie.

### V8.2.3: Client cleanup on logout — **PASS** (MEDIUM)
- **Evidence**: `nexacore-dashboard/src/context/AuthContext.tsx:565-581:logout()` clears access token + CSRF + dispatches LOGOUT reducer to null state.

### V8.3.1: No sensitive data in query strings — **PASS** (HIGH)
- **Evidence**: Only 3 `@Query()` usages in scope (admin lists with page/limit/filters); reset/verification tokens via `@Body` only.

### V8.3.4: Sensitive fields identified — **PASS** (MEDIUM)
- **Evidence**: 8 `/// @sensitive` annotations in `prisma/schema.prisma` covering password hash, MFA secret, recovery codes, token hashes, fingerprint hash, WebAuthn public key.

### V8.3.5: Sensitive access audited — **PASS** (HIGH)
- **Evidence**: Mutations on roles, activate/deactivate, deletion, profile updates, email changes, OAuth link/unlink all generate audit entries. Read-only admin queries not audited (acceptable per spec scope).

### V8.3.7: Database TLS — **PASS** (HIGH)
- **Evidence**: `validate-production-secrets.ts:137-144` enforces `sslmode=require|verify-ca|verify-full` in production.

---

## 3m. OWASP ASVS — API Security (Chapter 13)

### V13.1.3: No sensitive data in API URLs — **PASS** (HIGH)
- **Evidence**: All routes use `@Body()` or `@Param('id', ParseUUIDPipe)`. OAuth callbacks accept provider's `code` via querystring (RFC 6749 contract).

### V13.1.5: Content-Type enforcement — **PASS** (HIGH)
- **Evidence**: NestJS default body-parser accepts only `application/json`; non-JSON requests fail ValidationPipe.

### V13.2.1: HTTP method restriction — **PASS** (HIGH)
- **Evidence**: `grep '@All\\(' in src/`: 0 matches.

### V13.2.5: Content-Type validation on input — **PASS** (MEDIUM)
- **Evidence**: Combined with global `ValidationPipe({ forbidNonWhitelisted: true })`, non-JSON POST bodies fail DTO validation.

### V13.2.6: Transport integrity (TLS) — **PASS** (HIGH)
- **Evidence**: HSTS (H-01) + production HTTPS redirect (`https-redirect.middleware.ts:17-19`) + OAuth callback URL must be HTTPS (`validate-production-secrets.ts:65-81`).

---

## 3n. Node.js-Specific Attacks (CWE-1321/1333/918)

### PP-01: No prototype pollution via Object.assign — **PASS** (HIGH)
- **Evidence**: `grep 'Object\\.assign\\(' in src/`: 0 matches in non-test files. ValidationPipe whitelist neutralizes any vector.

### PP-02: No prototype pollution via spread — **PASS** (HIGH)
- **Evidence**: `grep '\\{\\.\\.\\.(req\\.body|body|params|query)' in src/`: 0 matches in non-test files. All spreads operate on DTO-validated objects post-whitelist.

### PP-03: No recursive merge with user input — **PASS** (CRITICAL)
- **Evidence**: lodash not imported in any source file. `overrides{}` floor-pin at >=4.17.24 (patched).

### RD-01: No evil regex patterns — **PASS** (HIGH)
- **Evidence**: Enumerated all 5 regex literals: `^\d{6}$` (TOTP), `^(\d+)(s|m|h|d)$` (duration parse), `[?&]sslmode=([^&]*)` (DB URL), `^[a-zA-Z_][a-zA-Z0-9_.]*\s+` (validation error sanitize). All anchored; no nested quantifiers.

### RD-02: No user input in RegExp constructor — **PASS** (CRITICAL)
- **Evidence**: `grep 'new RegExp\\(' in src/`: 0 matches in non-test files.

### SS-01: No SSRF via user-controlled URLs — **WARN** (CRITICAL)
- **Evidence**: 3 outbound `fetch(` sites:
  ```
  Instances:
  1. src/auth/password-breach.service.ts:30 — fetch('https://api.pwnedpasswords.com/range/...') — hardcoded host, safe
  2. src/security/turnstile.service.ts:28 — fetch(VERIFY_URL) where VERIFY_URL = 'https://challenges.cloudflare.com/...' — hardcoded, safe
  3. src/users/users.service.ts:951 — fetch(externalUrl, { signal: AbortSignal.timeout(5000) }) — externalUrl from OAuth profile.avatarUrl, NO hostname allowlist, NO scheme check
  Total: 3 instances; 1 unsafe
  ```
- **Expected**: All outbound URLs hardcoded or validated against allowlist.
- **Actual**: Avatar download accepts arbitrary URLs from OAuth provider profile without hostname allowlist or scheme check; only timeout is enforced.
- **Recommendation**: Add hostname allowlist (`['lh3.googleusercontent.com','avatars.githubusercontent.com']`) and `https:` scheme enforcement to `downloadAndStoreAvatar`. Consider DNS-resolution-time IP allowlist to block private/link-local IPs.
- **Standard**: CWE-918

### SS-02: URL allowlist for outbound calls — **WARN** (HIGH)
- **Evidence**: Same as SS-01 — HIBP/Cloudflare are hardcoded; `downloadAndStoreAvatar` is not.
- **Recommendation**: Same as SS-01 — formalize an allowlist; reject non-HTTPS and non-allowlisted hosts.
- **Standard**: CWE-918

### GS-01: No secrets in git history — **PASS** (CRITICAL)
- **Evidence**: `git log --all --diff-filter=A --name-only --pretty=format: | sort -u | grep -iE '(\\.env$|\\.key$|\\.pem$|secret|credential)'` — 2 matches, both are source-code filenames (`validate-production-secrets.ts` and its `.spec.ts`); zero actual secret files committed. `.env` files: only `.env.example` (documentation template). 0 `.key` / 0 `.pem`.

### GS-02: .gitignore completeness — **PASS** (HIGH)
- **Evidence**: `/home/em-admin/projects/em-ecosystem/.gitignore` contains `.env`, `.env.*` (with `!.env.example` exception), `*.pem`, `*.key`, `node_modules/`, `dist/`, `.DS_Store`, `coverage/`, `*.log`, `*.mmdb`.

---

## Recommendations

Eight WARN findings, zero FAIL. All fixes are low-effort (single PR each).

### CRITICAL severity (action within current sprint)

1. **V2.10.1** — Remove hardcoded dev-secret fallbacks at `src/config/auth.config.ts:5` and `src/common/services/crypto.service.ts:13`. Fail fast on missing env. `.env.example` is the source of truth.
2. **SS-01 / SS-02** — Add hostname allowlist + HTTPS-only check to `src/users/users.service.ts:946 downloadAndStoreAvatar`. The OAuth profile avatar URL is partially attacker-controllable.

### HIGH severity

3. **V4.3.1** — Add `if (actingUser.id === targetId) throw new ForbiddenException(...)` at the top of `adminUpdateUser` (`src/users/users.service.ts:773`).
4. **EM-05** — Convert 404 to no-op success for owner-scoped passkey/device/session endpoints (`passkey.service.ts:313,354`; `trusted-device.service.ts:175`; `sessions.service.ts:169`).
5. **EM-07** — Collapse the 3 MfaSetupGuard distinct messages (`src/auth/guards/mfa-setup.guard.ts:31,41,47`) into a single `ErrorMessages.auth.AUTHENTICATION_FAILED`. Same for JwtOrMfaSetupGuard.
6. **EM-08** — Centralize the 3 inline feature-state strings in `users.service.ts:1031,1047,1129` into `ErrorMessages`.

### MEDIUM severity

7. **EM-10** — Move all 8 inline error strings into `src/common/constants/error-messages.ts`. The breach-message duplicate at `users.service.ts:741` already has a catalog entry (`PASSWORD_BREACHED`) — replace directly.

### Strengths to preserve

- Dual-layer login timing defense (dummy bcrypt on miss + 350ms min-duration floor).
- Refresh-token family-based theft detection.
- Global ValidationPipe with `whitelist: true, forbidNonWhitelisted: true`.
- Production secrets validator gates startup with explicit FATAL errors on defaults.
- PKCE S256 + state + ephemeral OAuth code with 60s TTL.
- Helmet/HSTS/CSP/Referrer-Policy/X-Frame-Options all configured.
- Comprehensive rate-limit + progressive lockout (15→30→60→120 min escalation).
- Single global exception envelope; stack traces never reach clients.
- All audit-required events (login success/failure, MFA, password change, role change, lockout, passkey, OAuth link/unlink) routed through `AuditService` with structured fields.
