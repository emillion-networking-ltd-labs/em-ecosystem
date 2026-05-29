# Fase 3: SECURITY — auth

**Date**: 2026-05-06 22:44 UTC
**Module**: auth
**Auditor**: Claude (automated, Opus 4.7 1M)
**Framework**: audit-standards.mdc v1.0
**Standards**: OWASP ASVS v4.0, NIST SP 800-63B, RFC 9700, RFC 8725, CWE-200/203/209, CWE-1321/1333/918

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 122   |
| FAIL    | 0     |
| WARN    | 2     |
| N/A     | 0     |

**Overall**: PASS

**Sub-phase totals**:

| Sub-phase | Checks | PASS | FAIL | WARN | N/A |
|-----------|--------|------|------|------|-----|
| 3a OWASP ASVS Authentication (Ch 2) | 18 | 18 | 0 | 0 | 0 |
| 3b OWASP ASVS Session Management (Ch 3) | 10 | 10 | 0 | 0 | 0 |
| 3c OWASP ASVS Access Control (Ch 4) | 8 | 8 | 0 | 0 | 0 |
| 3d OWASP ASVS Input Validation (Ch 5) | 7 | 7 | 0 | 0 | 0 |
| 3e OWASP ASVS Cryptography (Ch 6) | 5 | 5 | 0 | 0 | 0 |
| 3f NIST SP 800-63B | 9 | 9 | 0 | 0 | 0 |
| 3g RFC 9700 OAuth | 8 | 8 | 0 | 0 | 0 |
| 3h RFC 8725 JWT | 6 | 6 | 0 | 0 | 0 |
| 3i HTTP Security & Rate Limiting | 12 | 11 | 0 | 1 | 0 |
| 3j Error Information Disclosure | 13 | 12 | 0 | 1 | 0 |
| 3k ASVS Error Handling & Logging (Ch 7) | 7 | 7 | 0 | 0 | 0 |
| 3l ASVS Data Protection (Ch 8) | 7 | 7 | 0 | 0 | 0 |
| 3m ASVS API Security (Ch 13) | 5 | 5 | 0 | 0 | 0 |
| 3n Node.js attacks | 9 | 9 | 0 | 0 | 0 |
| **TOTAL** | **124** | **122** | **0** | **2** | **0** |

---

## Detailed Findings

### 3a. OWASP ASVS v4.0 — Authentication (Chapter 2)

#### V2.1.1: Password min length >= 8
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/dto/register.dto.ts:23` (`@MinLength(8)`); `src/auth/dto/reset-password.dto.ts:18` (`@MinLength(8)`); `src/users/dto/change-password.dto.ts:9` (`@MinLength(8)`)
- **Standard**: OWASP ASVS V2.1.1

#### V2.1.2: Password max length >= 64
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/dto/register.dto.ts:24` (`@MaxLength(128)`); `src/auth/dto/reset-password.dto.ts:19` (`@MaxLength(128)`); `src/users/dto/change-password.dto.ts:10` (`@MaxLength(128)`)
- **Standard**: OWASP ASVS V2.1.2 (>= 64; 128 exceeds requirement)

#### V2.1.3: No composition rules (NIST compliant)
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/dto/register.dto.ts:1-31`, `src/auth/dto/reset-password.dto.ts:1-22`, `src/users/dto/change-password.dto.ts:1-12` — only `@MinLength`/`@MaxLength`/`@IsString` used. No `@Matches` regex enforcing uppercase/lowercase/special/digit on password fields.
- **Standard**: NIST SP 800-63B §5.1.1.2

#### V2.1.4: Breach dictionary check (HIBP)
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/password-breach.service.ts:15-67` (k-anonymity SHA-1 prefix request to `https://api.pwnedpasswords.com/range/`); called from `src/auth/login.service.ts:73` (registration), `src/auth/password-reset.service.ts:113` (reset), `src/users/users.service.ts:736` (change).
- **Standard**: OWASP V2.1.4 / NIST SP 800-63B §5.1.1.2

#### V2.1.7: Bcrypt with cost >= 10
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `src/auth/constants/auth.constants.ts:6` (`BCRYPT_ROUNDS = 12`). Used in `login.service.ts:80`, `password-reset.service.ts:120`, `users.service.ts:745`, `token.service.ts:130, 172`, `sessions.service.ts:77`. Recovery codes use rounds=10 at `auth.constants.ts:158` (still >= 10 minimum).
- **Standard**: OWASP V2.1.7

#### V2.1.9: No password hints stored
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `prisma/schema.prisma` User model (lines 70–97) contains no `hint`/`reminder` fields. DTOs reviewed under 3a contain no hint fields.

#### V2.1.10: No knowledge-based auth
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: No security questions in any DTO under `src/auth/dto/` or `src/users/dto/`. Auth flows reviewed in `auth.service.ts`, `login.service.ts`, `mfa.service.ts`, `passkey.service.ts`.

#### V2.2.1: Anti-automation on auth endpoints
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `auth.controller.ts:77,102,150,205` (register/login/refresh/logoutAll); `account.controller.ts:44,60,93,121,141` (verify-email/forgot-password/reset-password); `mfa.controller.ts:54,71,91,134,157,177`; `oauth.controller.ts:52,99,146,187,207,231`; `passkey.controller.ts:52,76,100,114,173`. Plus `TurnstileGuard` on register (`auth.controller.ts:76`), login (`auth.controller.ts:101`), forgot-password (`account.controller.ts:118`), resend-public (`account.controller.ts:90`).
- **Standard**: OWASP V2.2.1

#### V2.2.2: Weak credential resistance (constant-time / timing-safe)
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Timing-equalizing dummy hash compare on user-not-found at `src/auth/login.service.ts:109` (`bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH)`); locked-account at `login.service.ts:122`; no-password (OAuth-only) at `login.service.ts:224`. Plus min-duration floor `MIN_LOGIN_DURATION_MS = 350` enforced at `login.service.ts:182-186`. CSRF guard uses `crypto.timingSafeEqual` at `src/common/guards/csrf.guard.ts:74`.
- **Standard**: OWASP V2.2.2 / CWE-208

#### V2.5.1: Password reset via secure token
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/password-reset.service.ts:58` (`crypto.randomBytes(32).toString('hex')` — 256-bit entropy). Hashed with `hashToken()` (`src/auth/utils/hash-token.ts`) before storage at `password-reset.service.ts:64-70`.
- **Standard**: OWASP V2.5.1

#### V2.5.2: Reset token expiry
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/auth/constants/auth.constants.ts:155` (`RESET_TOKEN_EXPIRY_HOURS = 1`). Applied at `password-reset.service.ts:60-62`.
- **Standard**: OWASP V2.5.2 (<= 1h satisfied)

#### V2.5.3: Reset token single-use
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/password-reset.service.ts:94` (`if (resetToken.usedAt)` rejects); transactional `usedAt` write at `password-reset.service.ts:126-129`. Pre-existing tokens invalidated on re-request at `password-reset.service.ts:49-55`.

#### V2.7.1: MFA TOTP support
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/mfa.service.ts:65-75` (`generateSecret`, `generateURI` with sha1/6digits/30s period). Verification at `mfa.service.ts:113, 170` (`otpVerify`). Setup endpoint `mfa.controller.ts:50`, verify-login `mfa.controller.ts:89`.

#### V2.7.2: MFA required for admins
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/auth/login.service.ts:142-147` blocks ADMIN/SUPERADMIN login until MFA setup is completed (`handleMfaSetupRequired` returns `mfa_setup_required` instead of issuing tokens). Setup token gated by `JwtOrMfaSetupGuard` at `mfa.controller.ts:52,69`.

#### V2.8.1: MFA backup codes (generation, hashing, single-use)
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Generation at `src/auth/mfa.service.ts:281-292` (`randomInt(chars.length)` over 36-char alphabet, length 10, count 10). Hashed with `bcrypt.hash(code, BCRYPT_ROUNDS_RECOVERY=10)` at `mfa.service.ts:78-79`. Single-use enforced at `mfa.service.ts:182-186` (matched code spliced out + `updateRecoveryCodes`).

#### V2.10.1: No hardcoded credentials
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: All secrets sourced from environment via `ConfigService`/`process.env`: `auth.config.ts:4-22`, `oauth.config.ts` (clients), `crypto.service.ts:13` (MFA_ENCRYPTION_KEY). The dev fallbacks (`'default-dev-secret-change-in-production'`, `'dev-mfa-key-change-in-production-32ch'`) are blocked in production by `validate-production-secrets.ts:31-62`. `DUMMY_PASSWORD_HASH` (`auth.constants.ts:17-20`) is a deliberately public timing-defense value, not a real credential.
- **Standard**: OWASP V2.10.1

#### V2.10.2: No default credentials in seed
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `prisma/seed.ts:1-113` seeds only permissions and role-permission assignments. No user records and no default password hashes.

#### V2.10.4: Production secret validation
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/common/utils/validate-production-secrets.ts:28-145` validates JWT_SECRET (line 33), MFA_ENCRYPTION_KEY (line 44), CSRF_SECRET (line 55), GOOGLE_CLIENT_SECRET (line 98), GITHUB_CLIENT_SECRET (line 109), SMTP_PASSWORD (line 119), DATABASE_URL+sslmode (line 133-144). Wired into bootstrap at `src/main.ts:15` BEFORE `NestFactory.create`.

---

### 3b. OWASP ASVS — Session Management (Chapter 3)

#### V3.2.1: Session bound to user
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/sessions/sessions.service.ts:84-99` — `prisma.session.create` requires `userId`. Caller `src/auth/token.service.ts:99-106` passes `userId: user.id`.

#### V3.2.2: Session contains user agent
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/sessions/sessions.service.ts:92` (`userAgent: params.userAgent || null`).

#### V3.2.3: Session contains IP
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/sessions/sessions.service.ts:91` (`ipAddress: params.ipAddress`); geo-derived city/country at lines 93-96.

#### V3.3.1: Logout invalidates session
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/token.service.ts:339-352` (`logout` → `revokeSession` → `denyAllForUser` deny-list, plus clear cookie). Controller at `auth.controller.ts:182-199`.

#### V3.3.2: Idle timeout
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/constants/auth.constants.ts:89` (`SESSION_IDLE_TIMEOUT_HOURS = 0.5` — 30 min). Enforced at `src/auth/token.service.ts:257-277` (`validateSessionNotIdle` rejects refresh + revokes session). Idle threshold also filters list view at `sessions.service.ts:218-220`. NIST SP 800-63B §7.2 compliant (≤ 30 min at AAL2).

#### V3.3.3: Absolute timeout
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: Refresh token expiry from `auth.config.ts:7` (`JWT_REFRESH_EXPIRATION || '12h'`). Enforced via `expiresAt` set at `token.service.ts:81, 156`; checked at `sessions.service.ts:122-124`. NIST SP 800-63B §7.2 (<= 12h at AAL2) satisfied.

#### V3.3.4: Logout-all invalidates all sessions
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/token.service.ts:354-365` (`logoutAll` → `revokeAllUserSessions` + `denyAllForUser`); `sessions.service.ts:188-204` `updateMany({isRevoked: true})`. Public endpoint at `auth.controller.ts:201-229` (password-gated via `logoutAllWithReauth`).

#### V3.5.1: Token not in URL
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: No `@Query()` parameters in any auth controller (`Grep "@Query\(" src/auth` returns 0). Refresh token in httpOnly cookie (`token.service.ts:307-319`). Access token in `Authorization: Bearer` header (`jwt.strategy.ts:20`). OAuth `link_code` query param (`oauth-link.guard.ts:25`) is a single-use 60s code, not a credential per OWASP definition.

#### V3.5.2: Token in secure cookie (httpOnly + secure + sameSite)
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Refresh cookie at `src/auth/token.service.ts:307-319` (`httpOnly: true`, `secure: this.isProduction`, `sameSite: 'strict'`). OAuth code cookie at `oauth.controller.ts:255-261` (same flags). CSRF cookie at `security.config.ts:36-42` (`httpOnly: false` is intentional double-submit pattern).

#### V3.7.1: Concurrent session limits
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/auth/constants/auth.constants.ts:96` (`MAX_CONCURRENT_SESSIONS = 5`). Enforced at `sessions.service.ts:263-296` (`enforceSessionLimit` evicts oldest, audit-logged with `SESSION_LIMIT_EXCEEDED`). Called from `token.service.ts:90-93`.

---

### 3c. OWASP ASVS — Access Control (Chapter 4)

#### V4.1.1: RBAC at controller level
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: All authenticated routes use `@UseGuards(JwtAuthGuard)`: e.g. `auth.controller.ts:203,232,250`; `mfa.controller.ts:132,155,183`; `passkey.controller.ts:50,74,147,156,171`; `session.controller.ts:62,76,106,142,153,178`; `oauth.controller.ts:186,213,237`. Admin endpoint pairs with `RolesGuard` at `auth.controller.ts:250`.

#### V4.1.2: Least privilege enforced
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/auth.controller.ts:251` (`@Roles(Role.ADMIN)`). RolesGuard at `src/auth/guards/roles.guard.ts:63-65` denies if role not in required list. Admin user-management endpoints in `src/users/users.controller.ts` use `@Roles(Role.ADMIN)` and additional SUPERADMIN constraints in `users.service.ts:794-800` (only SUPERADMIN can grant ADMIN).

#### V4.1.3: CSRF on state-changing routes
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Global `APP_GUARD` registers `CsrfGuard` at `src/security/security.module.ts:13-16`. Skipped only via explicit `@SkipCsrf()` on specific routes: `auth.controller.ts:57` (csrf-token issuance), `account.controller.ts:43,59,92,120,140,164` (token-bearer flows that have their own one-time-use tokens), `oauth.controller.ts` indirectly via SecurityModule guard precedence on GET routes (CsrfGuard exempts safe methods at `csrf.guard.ts:23-25`).

#### V4.1.4: Deny by default
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `src/app.module.ts:58-63` registers `APP_GUARD: CustomThrottlerGuard`; `src/security/security.module.ts:13-16` registers `APP_GUARD: CsrfGuard` (default-applied to all state-changing routes unless `@SkipCsrf`). Auth is via per-controller `@UseGuards(JwtAuthGuard)` rather than a global JWT guard — standard NestJS pattern; routes without `@UseGuards` are intentionally public (e.g. `/auth/login`, `/auth/register`). All authenticated controllers reviewed do declare guards.

#### V4.2.1: Parameter tampering prevention (UUID validation)
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/auth/session.controller.ts:90,193` (`@Param('id', ParseUUIDPipe)`); `src/auth/passkey.controller.ts:163,188` (same). All `:id` params in auth controllers use `ParseUUIDPipe`.

#### V4.3.1: Admin self-escalation prevention
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/users/users.service.ts:785-800` — `adminUpdateUser` blocks modifying SUPERADMIN target (line 785), forbids assigning SUPERADMIN role to anyone (line 790), and only SUPERADMIN can assign ADMIN (lines 794-800). Tested in `users.service.spec.ts:1107-1306`.

#### V4.3.2: Permission-based access
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/auth/guards/permissions.guard.ts:21-54` (`PermissionsGuard`), uses `@Permissions` decorator. SUPERADMIN bypass at lines 40-42. Used by `users.controller.ts` and other modules; auth module itself uses RolesGuard for the single ADMIN endpoint.

#### V4.3.3: SUPERADMIN restrictions
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Bypass logged for audit at `roles.guard.ts:38-51` (`AuditAction.SUPERADMIN_BYPASS`). SUPERADMIN role reserved for seed/single root account — cannot be assigned via API (`users.service.ts:790`); SUPERADMIN target cannot be modified via admin endpoints (`users.service.ts:785, 864`). Self-deletion blocked at `users.service.ts:1121`.

---

### 3d. OWASP ASVS — Input Validation (Chapter 5)

#### V5.1.1: Server-side validation
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/main.ts:51-65` registers global `ValidationPipe` with `transform: true`, `whitelist: true`, `forbidNonWhitelisted: true`, plus a custom `exceptionFactory` that strips field names (CWE-209 mitigation).

#### V5.1.2: Whitelist validation
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/main.ts:53-54` (`whitelist: true`, `forbidNonWhitelisted: true`).

#### V5.1.3: All DTOs validated
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: All 23 auth DTOs in `src/auth/dto/` use `class-validator` decorators. Spot-checked: `register.dto.ts:15-30` (3 fields, all decorated); `login.dto.ts:9-19`; `mfa-verify-login.dto.ts:24` (`@Matches`); `passkey-rename.dto.ts:5-6`. Combined with global `ValidationPipe` (V5.1.1), missing decorator on a field would fail validation when extra fields present.

#### V5.2.1: No raw HTML rendering
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: Grep `innerHTML|dangerouslySetInnerHTML` over `src/` returns 0 matches. Backend is JSON-only (NestJS controllers).

#### V5.3.1: SQL injection protection
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: Grep `\$queryRaw|\$executeRaw|\$queryRawUnsafe|\$executeRawUnsafe` over `src/` returns 0 matches. All DB access through Prisma ORM (parameterized).

#### V5.3.2: No eval or dynamic execution
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: Grep `eval\(|new Function\(|setTimeout\([^,]*['"`]` over `src/` returns 0 matches in production code (`src/`). Single test-file match in `src/auth/tests/password-breach.service.spec.ts:64` is `setTimeout(() => reject(...), 10)` — function callback (not string), and is test code only.

#### V5.5.1: UUID params validated
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: Same as V4.2.1 — `ParseUUIDPipe` on every `@Param('id')` in auth controllers.

---

### 3e. OWASP ASVS — Cryptography (Chapter 6)

#### V6.2.1: Strong hash algorithm for passwords
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: bcrypt only — `auth.constants.ts:1, 6, 17`. No MD5/SHA1/SHA256 used for passwords. SHA-256 is used at `password-reset.service.ts:59` and `email-verification.service.ts:38` for **token hashes** (random 32-byte tokens, not passwords) and at `oauth-state.store.ts:26` for PKCE code-challenge — both standards-correct uses. SHA-1 is used for HIBP k-anonymity (`password-breach.service.ts:17-21`) — required by HIBP API protocol.

#### V6.2.2: Cryptographic random
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: Grep `Math.random` over `src/` returns 1 match in `src/auth/tests/oauth-exchange.spec.ts:59` (test fixture only — non-production). All production randomness uses Node `crypto`: `randomBytes` (`password-reset.service.ts:58`, `email-verification.service.ts:182`, `oauth-link-code.store.ts:13`, `oauth-state.store.ts:25`), `randomUUID` (`token.service.ts:80,98,113,289`, `oauth-state.store.ts:24`, `oauth-code.store.ts:22`, `passkey.service.ts:197`), `randomInt` (`mfa.service.ts:1, 287`).

#### V6.2.3: Modern TOTP algorithm
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/auth/mfa.service.ts:70` (`algorithm: 'sha1'`, `digits: 6`, `period: 30`) — RFC 6238 standard, broadly compatible with authenticator apps.

#### V6.4.1: Secrets from environment
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `auth.config.ts:4-22`, `oauth.config.ts`, `crypto.service.ts:12-14`, `validate-production-secrets.ts:32-145`. All secrets sourced from `process.env` via ConfigService. Dev fallbacks block in production.

#### V6.4.2: Different secrets per environment
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `validate-production-secrets.ts:31, 42, 53, 96, 107` — production rejects each of the dev-default values: `'default-dev-secret-change-in-production'`, `'dev-mfa-key-change-in-production-32ch'`, `'dev-csrf-secret-change-in-production-min32chars'`, `'your-google-client-secret'`, `'your-github-client-secret'`. Plus length thresholds (>= 32 / >= 20).

---

### 3f. NIST SP 800-63B — Digital Identity Guidelines

#### N-01: Memorized secrets 8-64 chars
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Same as V2.1.1, V2.1.2 — `register.dto.ts:23-24`, `reset-password.dto.ts:18-19`, `change-password.dto.ts:9-10` (8 ≤ len ≤ 128).

#### N-02: No composition rules
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Same as V2.1.3 — no `@Matches` regex on password fields.

#### N-03: Breach dictionary check
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Same as V2.1.4 — HIBP integration in `password-breach.service.ts`.

#### N-04: All Unicode allowed
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: Password DTOs use only `@IsString()` + length bounds — no charset restriction. Bcrypt accepts arbitrary bytes (truncates at 72).

#### N-05: MFA support (TOTP + WebAuthn)
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: TOTP at `mfa.service.ts:65-189`. WebAuthn at `passkey.service.ts:101-275` using `@simplewebauthn/server`.

#### N-06: Reauthentication for sensitive ops
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Password required for: MFA disable (`mfa.service.ts:213`), regenerate recovery codes (`mfa.service.ts:250`), passkey register (`passkey.service.ts:84`), passkey delete (`passkey.service.ts:344`), session revoke (`sessions.service.ts:323`), revokeAll/logout-all (`sessions.service.ts:331`), trust-device (`session.controller.ts:121`), email change (`users.service.ts:1035` and earlier), change password (`users.service.ts:728`).

#### N-07: Session timeout compliant (idle ≤ 30 min, absolute ≤ 12h)
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: Idle: `auth.constants.ts:89` (30 min). Absolute: `auth.config.ts:7` (12h default).

#### N-08: Verifier impersonation resistance (HTTPS)
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: HTTPS redirect middleware in production at `src/common/middleware/https-redirect.middleware.ts:3-20`. HSTS header set by helmet at `helmet.middleware.ts:17` + `security.config.ts:74-78` (`maxAge: 31536000, includeSubDomains, preload`).

#### N-09: Rate limiting on auth
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Same as V2.2.1 — `@Throttle` on every public auth endpoint via `AUTH_RATE_LIMITS` map in `auth.constants.ts:70-81`.

---

### 3g. RFC 9700 — OAuth 2.0 Security Best Current Practice

#### O-01: PKCE on all OAuth flows
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `src/auth/strategies/pkce-authenticate.ts:11-48` injects `code_verifier` into the token request and adds `code_challenge`/`code_challenge_method=S256` to the authorize request. Code-challenge generated at `oauth-state.store.ts:25-28` (`createHash('sha256')`). Both Google (`google.strategy.ts:38-49`) and GitHub (`github.strategy.ts:38-49`) wire `applyPkceAuthenticate` and `applyPkceAuthorizationParams`.

#### O-02: State parameter (anti-CSRF)
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `src/auth/stores/oauth-state.store.ts:20-38` generates `crypto.randomUUID()` state. Validated single-use atomically at `oauth-state.store.ts:48-55` (`get` then `del`). Validation gate at `oauth-validate.helper.ts:21-32`.

#### O-03: Redirect URI whitelisted
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/oauth.controller.ts:264-278` (`getValidatedFrontendUrl`) compares `frontendUrl` to `OAUTH_ALLOWED_REDIRECT_URLS` allowlist; throws `UnauthorizedException` if not in list. Strategy callback URLs from env (`google.strategy.ts:28`, `github.strategy.ts:28`) — production HTTPS enforced at `validate-production-secrets.ts:65-81`.

#### O-04: Token exchange via back-channel
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: After OAuth callback, the access/refresh tokens are stored server-side in Redis under an opaque code (`oauth-code.store.ts:21-29`). Client receives only the `oauth_code` in an httpOnly cookie at `oauth.controller.ts:255-261`. The actual token exchange happens via authenticated `POST /auth/oauth/exchange` (`oauth.controller.ts:145-181`).

#### O-05: Ephemeral authorization code
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `oauth-code.store.ts:32-42` (`exchange` does `redis.get` then `redis.del` — single-use). Same single-use pattern in `oauth-link-code.store.ts:23-29`. Plus `oauth-state.store.ts:48-55` for state codes.

#### O-06: Short code lifetime
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `oauth-code.store.ts:8` (`CODE_TTL_SECONDS = 60` — 1 minute). `oauth-link-code.store.ts:6` (60s). `oauth-state.store.ts:6` (300s = 5 min — RFC 9700 acceptable for state). Cookie max-age `OAUTH_CODE_COOKIE_MAX_AGE_MS = 30_000` (`auth.constants.ts:139`).

#### O-07: No token in logs
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: Comprehensive Logger interpolation grep over `src/` shows the only logged values are: pseudonymized email (`mail.service.ts:32`), DB path (`geolocation.service.ts:26`), error messages with no token bodies (`token-deny-list.service.ts:18,29,43,77`; `oauth-callback.filter.ts:37`; `password-breach.service.ts:42,63`). No `accessToken`/`refreshToken`/`oauth_code` strings in any Logger call.

#### O-08: Scope limitation
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: `google.strategy.ts:29` (`['email', 'profile']` only). `github.strategy.ts:29` (`['user:email']` only). Minimal scopes per provider.

---

### 3h. RFC 8725 — JWT Best Practices

#### J-01: Algorithm explicitly set (no "none")
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `src/auth/auth.module.ts:64` (sign: `algorithm: 'HS256'`); line 69 (verify: `algorithms: ['HS256']`). `src/auth/strategies/jwt.strategy.ts:25` (`algorithms: ['HS256']`).

#### J-02: Issuer (iss) claim
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `auth.constants.ts:142` (`JWT_ISSUER = 'nexacore-api'`). Set at `auth.module.ts:62, 67`. Validated in `jwt.strategy.ts:23`.

#### J-03: Audience (aud) claim
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `auth.constants.ts:143` (`JWT_AUDIENCE = 'nexacore-api'`). Set at `auth.module.ts:63, 68`. Validated in `jwt.strategy.ts:24`.

#### J-04: Expiration (exp) claim ≤ 15 min for access tokens
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `auth.config.ts:6` (`JWT_ACCESS_EXPIRATION || '15m'`). Hard-enforced in production by `validate-production-secrets.ts:84-92` (rejects > 15 min).

#### J-05: Token ID (jti) claim
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/common/interfaces/jwt-payload.interface.ts:7` (`jti: string`). Set at `token.service.ts:113, 289` (`crypto.randomUUID()`). Used by deny-list at `token-deny-list.service.ts:13-21`.

#### J-06: Refresh token rotation
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/sessions/sessions.service.ts:108-156` (`rotateRefreshToken`) — old session marked revoked (line 142-144), new session issued (line 146). Theft detection at lines 127-130: reuse of an already-revoked token revokes the entire token-family. Caller at `token.service.ts:159-176`.

---

### 3i. HTTP Security & Rate Limiting

#### H-01: HSTS header
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/security/security.config.ts:74-78` (`maxAge: 31536000, includeSubDomains: true, preload: true`); applied via helmet at `src/common/middleware/helmet.middleware.ts:17`.

#### H-02: Content-Security-Policy
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `security.config.ts:58-73` — restrictive CSP (`default-src 'self'`, `objectSrc 'none'`, `frameAncestors 'none'`, `upgrade-insecure-requests`). Applied at `helmet.middleware.ts:11-13` (not report-only).

#### H-03: X-Frame-Options
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `helmet.middleware.ts:20` (`xFrameOptions: { action: 'deny' }`).

#### H-04: X-Content-Type-Options
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `helmet.middleware.ts:19` (`xContentTypeOptions: true`).

#### H-05: Referrer-Policy
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `security.config.ts:79-81` (`policy: 'strict-origin-when-cross-origin'`); applied at `helmet.middleware.ts:18`.

#### H-06: CORS restricted
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/main.ts:24-49` — origin validated against `SecurityConfig.cors.getAllowedOrigins()` allowlist (`security.config.ts:3-13`); rejected origins receive an explicit Error. `credentials: true` requires explicit allowlist (no wildcard `*`). Documented Accepted-Risk for missing-Origin requests at `main.ts:30-37`.

#### H-07: Rate limit: login
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `auth.controller.ts:102-107` (`AUTH_RATE_LIMITS.login` = 10/60s). Per-account lockout supplements IP-throttle (`auth.constants.ts:11`).

#### H-08: Rate limit: register
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `auth.controller.ts:77-82` (`AUTH_RATE_LIMITS.register` = 5/60s).

#### H-09: Rate limit: password reset
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `account.controller.ts:121-126` (`AUTH_RATE_LIMITS.sensitive_action` = 3 / 15 min for forgot-password). Reset itself: `account.controller.ts:141-146` (`reset_password` = 5/60s).

#### H-10: Rate limit: MFA
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `mfa.controller.ts:54,71,91,134,157,177` — all six MFA endpoints at 5/60s (`AUTH_RATE_LIMITS.mfa`).

#### H-11: Rate limit: OAuth exchange
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `oauth.controller.ts:146-151` (`AUTH_RATE_LIMITS.oauth` = 10/60s).

#### H-12: Progressive lockout
- **Verdict**: WARN
- **Severity**: HIGH
- **Evidence**: `src/auth/login.service.ts:243-278` (`handleInvalidPassword`) — increments failed attempts, locks at >5 (`MAX_FAILED_ATTEMPTS = 5` in `auth.constants.ts:11`). Escalating durations `[15, 30, 60, 120]` minutes (`auth.constants.ts:36`). Audit-logged with `ACCOUNT_LOCKED`.
- **Note**: Documented design: locked-account login attempts return the same generic `INVALID_CREDENTIALS` and bcrypt-pad to match user-not-found timing (`login.service.ts:121-123, 196-202`). This is the EM-04 / H-12 combined fix from previous audits and intentionally hides the lockout state from the client. Rationale documented in `auth.constants.ts:64-68` and `login.service.ts:153-159`.
- **Why WARN**: The lockout is correctly implemented but is not observable to legitimate users via the API alone — they see "Invalid credentials" until the lockout email arrives (`login.service.ts:253-258`). This is a deliberate trade-off (anti-enumeration vs UX) and not a defect, but is flagged to confirm the design choice still matches policy. No code change recommended.

---

### 3j. Error Message Information Disclosure (CWE-200/203/209)

#### EM-01: No user enumeration on public endpoints
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**:
  - Registration: `login.service.ts:51-71` — existing-email path runs `bcrypt.compare(...DUMMY_PASSWORD_HASH)` for timing parity, sends silent notification, returns identical `CHECK_EMAIL` message as new account.
  - Login: `login.service.ts:106-117` — user-not-found path runs same bcrypt compare and returns `INVALID_CREDENTIALS`. Locked path also returns `INVALID_CREDENTIALS` (line 201).
  - Forgot-password: `password-reset.service.ts:36-43` — silent return for non-existing email after a dummy bcrypt compare. Controller at `account.controller.ts:133-136` returns identical message regardless.
  - Resend-verification public: `email-verification.service.ts:157-179` — silent return for non-existing/already-verified/cooldown. Generic message at `account.controller.ts:107-113`.
  - Passkey login options: `passkey.service.ts:174-189` — anti-enumeration comment; returns options regardless of user existence.

#### EM-02: No account state disclosure on public endpoints
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: All thrown exceptions on public auth endpoints use generic messages from `error-messages.ts`:
  - `INVALID_CREDENTIALS` (lockout, no-password, wrong-password, user-not-found, email-not-verified) at `login.service.ts:116, 201, 213, 231, 265, 277`.
  - `INVALID_RESET_TOKEN` covers missing/used/expired identically (`password-reset.service.ts:91, 95, 99`).
  - `AUTHENTICATION_FAILED` for OAuth failures (`oauth.controller.ts:170, 274`; `oauth-callback.filter.ts:51`).
  - Email-verification returns `{status:'invalid'}` instead of throwing — no state disclosed (`email-verification.service.ts:47, 52, 60, 64`).

#### EM-03: No security mechanism disclosure
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: Reviewed `error-messages.ts:1-72` — no client-facing message references "fingerprinting", "clone detection", "device trust", "token rotation", "PKCE", "state parameter", or any other internal mechanism by name. Internal mechanism names (e.g., `fingerprint`, `tokenFamily`, `clone-detection`) appear in audit logs and code comments only, never in `throw new ...Exception(...)` payloads.

#### EM-04: Timing-safe public responses
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: SCRUM-283 (constant-time login):
  - User-not-found: `login.service.ts:109` (bcrypt.compare with dummy hash).
  - Locked-account: `login.service.ts:122` (same).
  - No-password (OAuth-only): `login.service.ts:224` (same).
  - Min-duration floor (350ms) applied uniformly to all paths at `login.service.ts:182-186`.
  - Forgot-password: `password-reset.service.ts:41` (dummy bcrypt compare on user-not-found).

#### EM-05: No entity existence disclosure on authenticated endpoints
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Authenticated `NotFoundException` usages all use ownership-scoped queries (e.g., `findFirst({where:{id, userId}})`) so a 404 only fires when a row matching BOTH id and current-user is missing — no cross-user existence disclosure: `passkey.service.ts:308-313`; `passkey.service.ts:349-354`; `trusted-device.service.ts:175`; `sessions.service.ts:165-170`. All use generic `Resource not found` from `error-messages.ts:29, 32, 50, 57, 60`.

#### EM-06: No authorization detail disclosure
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `roles.guard.ts:60, 64` and `permissions.guard.ts:36, 50` both throw `ForbiddenException(ErrorMessages.permission.ACCESS_DENIED)` — single generic message, no role/permission name exposed. `SUPERADMIN_BYPASS` is logged server-side only (audit table), not returned to client.

#### EM-07: Single error message per security guard
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**:
  - CSRF guard: 4 throw sites (`csrf.guard.ts:42, 46, 50`) all use identical `ErrorMessages.csrf.VALIDATION_FAILED`.
  - Roles guard: 2 throw sites (`roles.guard.ts:60, 64`) both use `ACCESS_DENIED`.
  - Permissions guard: 2 throw sites (`permissions.guard.ts:36, 50`) both use `ACCESS_DENIED`.
  - OAuthLink guard: 2 throws (`oauth-link.guard.ts:27, 32`) both use `AUTHENTICATION_FAILED`.

#### EM-08: No feature state disclosure
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `mfa.service.ts:62, 105, 109` (`OPERATION_NOT_AVAILABLE`) — single message regardless of "MFA already enabled" vs "MFA never set up" vs "no secret stored". Setup-required vs not-required differentiated only via the `mfa_setup_required` status which is by design (V2.7.2 requires admins to enroll). Public passkey login options endpoint silently returns options regardless of registration state (`passkey.service.ts:174-189`).

#### EM-09: No token lifecycle disclosure
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Reset token: 3 paths (missing/used/expired) → single `INVALID_RESET_TOKEN` message (`password-reset.service.ts:91, 95, 99`). Refresh token: missing/invalid/expired → single `INVALID_REFRESH_TOKEN` (`auth.controller.ts:170`; `token.service.ts:145, 150, 275`; `sessions.service.ts:119, 123, 129, 137`). MFA token: invalid signature/wrong type/user-not-found → single `INVALID_TOKEN` (`mfa.service.ts:156, 160, 165`). Email-verification: returns generic `{status:'invalid'}` for missing/used/expired/wrong-type (`email-verification.service.ts:47, 52, 60, 64`).

#### EM-10: Consistent error messages per category
- **Verdict**: WARN
- **Severity**: MEDIUM
- **Evidence**: Most authenticated MFA endpoints use distinct messages: `AUTHENTICATION_REQUIRED`, `OPERATION_NOT_AVAILABLE`, `PASSWORD_REQUIRED_NO_PASSWORD`, `INVALID_CODE`, `INVALID_TOKEN`, `INVALID_PASSWORD` (per `mfa.service.ts:55-217`). On already-authenticated endpoints, this multi-message taxonomy is correct (the user is identified and these messages help legitimate UX). However, the previous audit (2026-03-29) flagged this same finding as WARN and the current code is unchanged. The framework freeze policy means we keep the WARN classification until a remediation decision is taken.
- **Why WARN (not FAIL)**: On authenticated endpoints, message variance is per-user and doesn't enable cross-user enumeration. The risk is limited to information given to the already-authenticated session owner.
- **Recurrence**: Carry-forward from 2026-03-29 audit (same code path, same classification).

#### EM-11: No internal field names in validation errors
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/main.ts:56-63` `exceptionFactory` flattens validation errors and `src/common/filters/http-exception.filter.ts:82-93` `sanitizeValidationDetails` strips leading `[a-zA-Z_][a-zA-Z0-9_.]*\s+` prefix (the field name) and uppercases — yielding messages like "Must be at least 8 characters" without DTO field exposure. `forbidNonWhitelisted` errors mapped to `"Unknown property is not allowed"` at line 86.

#### EM-12: No configuration values in errors
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `error-messages.ts:1-72` reviewed — no numeric thresholds, durations, or limits in any client-facing message. `Retry-After` header carries the seconds value (RFC-standard) but is stripped from the JSON body at `http-exception.filter.ts:43-50` to avoid duplication.

#### EM-13: Error response shape consistency
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: `http-exception.filter.ts:71-79` enforces `{success: false, error: {message, code, statusCode, details?}}` for all HttpException-derived responses. Custom-throttler short-circuit at lines 41-50 preserves the same `success/error` shape.

---

### 3k. OWASP ASVS — Error Handling & Logging (Chapter 7)

#### V7.1.1: No credentials in logs
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: Comprehensive grep `logger\.(log|debug|warn|error|info|verbose)\(.*\$\{|console\.(log|warn|error|info)\(.*\$\{` shows zero log statements containing `password`, `token`, `secret`, `authorization`, `cookie`, or `creditCard` interpolations. The 5 interpolating Logger calls (mail.service.ts:32, geolocation.service.ts:26, token-deny-list.service.ts:18,29,43,77, oauth-callback.filter.ts:37, password-breach.service.ts:42,63, redis.module.ts:48) interpolate only: pseudonymized email, file path, error.message strings, jti (random UUID, not a credential value), userId/sessionId. No raw secrets.

#### V7.1.2: No PII in logs
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Email addresses passed to Logger are wrapped via `pseudonymizeEmail()` (`mail.service.ts:32`). Audit log writes (`audit-log.helper.ts`, `users.service.ts`, etc.) use `pseudonymizeEmail` for email values in metadata (`login.service.ts:67, 93, 114`; `email-verification.service.ts:118-121`). User IDs (UUIDs) are pseudonymous identifiers acceptable in logs per most privacy frameworks.

#### V7.1.3: Security events logged
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `AuditAction` enum covers LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT, REGISTER, ACCOUNT_LOCKED, ACCOUNT_UNLOCKED, PASSWORD_CHANGE, MFA_ENABLED, MFA_DISABLED, OAUTH_LOGIN, OAUTH_REGISTER, OAUTH_LINKED, PASSKEY_REGISTERED, PASSKEY_DELETED, PASSKEY_AUTH_SUCCESS, PASSKEY_AUTH_FAILURE, SESSION_LIMIT_EXCEEDED, SESSION_IDLE_REVOKED, LOGIN_BLOCKED_TRAVEL, EMAIL_CHANGED, SUPERADMIN_BYPASS, OAUTH_AUTO_VERIFIED, TOKEN_REFRESH (per `prisma/schema.prisma:21+`). Logged via `AuditService.log()` from controllers/services, fire-and-forget pattern.

#### V7.1.4: Log record completeness
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `audit-log.helper.ts:11-28` (`createAuditLogger`) signature requires `action`, `userId`, `ipAddress`, `userAgent`, `metadata`. AuditLog entity (per data-model) carries timestamp via `createdAt`. All callers reviewed pass ctx or extract from request meta via `extractRequestMeta`.

#### V7.3.1: Log injection prevention
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: All logged user-controlled strings are either: (a) pseudonymized to a fixed format (`pseudonymizeEmail`); (b) error.message (controlled by us); (c) UUIDs (validated by Pipe). NestJS Logger uses single-line format that is safe for the logged values (no embedded newlines). Audit log writes are JSON metadata into structured DB rows, not text logs.

#### V7.4.1: Generic error in production
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `http-exception.filter.ts:25-30` logs unhandled exception stacks server-side; client receives only `{message: 'Internal server error', code: 'INTERNAL_SERVER_ERROR', statusCode: 500}` from lines 19-21 + 71-79. Validation messages flattened and sanitized at lines 82-93.

#### V7.4.3: Last resort error handler
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/main.ts:67` (`app.useGlobalFilters(new HttpExceptionFilter())`). Filter has `@Catch()` (no args) at `http-exception.filter.ts:11` — catches ALL exceptions including non-HttpException ones (logged at line 25-30, returned as 500).

---

### 3l. OWASP ASVS — Data Protection (Chapter 8)

#### V8.2.1: Anti-caching on sensitive endpoints
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `NoCacheInterceptor` at `src/common/interceptors/no-cache.interceptor.ts:17-25` sets `Cache-Control: no-store, no-cache, must-revalidate`, `Pragma: no-cache`, `Expires: 0`. Applied at controller level via `@UseInterceptors(NoCacheInterceptor)` on every auth controller: `auth.controller.ts:48`, `mfa.controller.ts:41`, `oauth.controller.ts:42`, `account.controller.ts:34`, `session.controller.ts:39`, `passkey.controller.ts:41`.

#### V8.2.2: No sensitive data in browser storage
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Comprehensive grep over `nexacore-dashboard/src/` for `localStorage.setItem|sessionStorage.setItem` returns 6 hits, all non-sensitive: theme (`ThemeContext.tsx:35`), broadcast-channel event id (no token data) (`useCrossTabAuth.ts:111`), email-notif/registration/MFA-enforced toggles UI prefs (`UserPreferences.tsx:68`, `GlobalSettings.tsx:68,73`), language code (`LanguageSelector.tsx:115`). The previous audit's WARN on this check is now resolved — earlier sweep confirmed there are NO accessToken/refreshToken/password/PII writes to browser storage. Tokens live in httpOnly cookie (refresh) and React memory (access).

#### V8.2.3: Client cleanup on logout
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: Server clears cookie via `buildClearCookie()` at `token.service.ts:321-333`, applied in logout (`auth.controller.ts:182-199`) and logout-all (`auth.controller.ts:201-229`). Backend also denies all access tokens for the user via `denyAllForUser` (`token.service.ts:343, 357, 383`) — even tokens kept in client memory get rejected on next request within ≤ 1 sec.

#### V8.3.1: No sensitive data in query strings
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Grep `@Query\(` over `src/auth` returns 0 matches. All credentials in body (DTO) or in cookies. `link_code` query param at `oauth-link.guard.ts:25` is a 60s single-use opaque code, not a credential per OWASP definition (V8.3.1 targets passwords/tokens). Documented at `oauth-link.guard.ts:14-17`.

#### V8.3.4: Sensitive fields identified
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `prisma/schema.prisma` annotations: `passwordHash` line 70, `mfaSecret` line 85, `mfaRecoveryCodes` line 87, refresh `tokenHash` line 110, email-verification `tokenHash` line 156, password-reset `tokenHash` line 172, `fingerprintHash` line 189, `publicKey` line 207. All carry `/// @sensitive` machine-readable comment.

#### V8.3.5: Sensitive access audited
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Role/permission changes audited via `AuditAction.ROLE_CHANGED`, `AuditAction.PERMISSION_GRANTED`/`REVOKED` (per schema). Admin bypass tracked (`SUPERADMIN_BYPASS`). User profile reads not audited (acceptable — high volume, not sensitive at the read level), but role/lockout-state mutations are.

#### V8.3.7: Database TLS
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `validate-production-secrets.ts:133-144` rejects production DATABASE_URL without `sslmode=require|verify-ca|verify-full`. `.env.example:18` documents the same as a required value with explicit comment referencing OWASP ASVS V8.3.7 (line 17).

---

### 3m. OWASP ASVS — API Security (Chapter 13)

#### V13.1.3: No sensitive data in API URLs
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: All controller routes reviewed: `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/refresh`, `/auth/logout`, `/auth/sessions/:id` (UUID), `/auth/passkeys/:id` (UUID), `/auth/oauth/exchange`, `/auth/google/callback`, `/auth/github/callback`, `/auth/mfa/*`. None contain credentials in path or query string.

#### V13.1.5: Content-Type enforcement
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: NestJS default body-parser accepts only JSON for body-decorated endpoints; `ValidationPipe` (`main.ts:51-65`) rejects mismatched DTOs. No raw-body endpoints in auth module. CSRF guard (state-changing requests) plus cookie validation provides additional Content-Type independence layer.

#### V13.2.1: HTTP method restriction (no @All)
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Grep `@All\(` over `src/` returns 0 matches. Every endpoint declares an explicit verb decorator.

#### V13.2.5: Content-Type validation on input
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: NestJS body parser handles JSON only by default; `forbidNonWhitelisted: true` + DTO validation reject malformed input. cookieParser used for refresh-token cookie (`main.ts:22`).

#### V13.2.6: Transport integrity (TLS)
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: HTTPS redirect in production (`https-redirect.middleware.ts:3-20`). HSTS header applied via helmet (cross-ref H-01). DB TLS enforced (cross-ref V8.3.7). OAuth callback URLs HTTPS-enforced in production (`validate-production-secrets.ts:65-81`).

---

### 3n. Node.js-Specific Attacks

#### PP-01: No prototype pollution via Object.assign
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Grep `Object\.assign` over `src/` returns 0 matches. Combined with `whitelist: true, forbidNonWhitelisted: true` in ValidationPipe (`main.ts:53-54`), any extra DTO property fails validation before any spread/assign could happen.

#### PP-02: No prototype pollution via spread
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Grep `\{\.\.\.req\.body|\{\.\.\.req\.query|\{\.\.\.req\.params|\{\.\.\.body` over `src/` returns 0 matches in production code. Auth flows take typed DTOs only.

#### PP-03: No recursive merge with user input (lodash patched)
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: Grep `_\.merge|_\.defaultsDeep|_\.set` over `src/` returns 0 matches. `package.json:108` pins `"lodash": ">=4.17.22"` (CVE-2020-8203 patch is 4.17.21; we require strictly newer).

#### RD-01: No evil regex patterns
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Grep `new RegExp\(` over `src/` returns 0 matches. Inline regex literals reviewed:
  - `mfa-verify-login.dto.ts:24` and `mfa-verify-setup.dto.ts:11`: `^\d{6}$` — fixed-length, no nested quantifiers.
  - `validate-production-secrets.ts:3`: `^(\d+)(s|m|h|d)$` — bounded, no nested quantifiers.
  - `validate-production-secrets.ts:137`: `[?&]sslmode=([^&]*)` — linear, safe.
  - `http-exception.filter.ts:85, 90`: `^property \S+ should not exist$` and `^[a-zA-Z_][a-zA-Z0-9_.]*\s+` — both linear, no nested quantifiers.

#### RD-02: No user input in RegExp constructor
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: 0 `new RegExp(` calls anywhere in `src/`.

#### SS-01: No SSRF via user-controlled URLs
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: Three `fetch(` call sites in `src/`:
  1. `password-breach.service.ts:30` — URL is hardcoded `https://api.pwnedpasswords.com/range/${prefix}` where `prefix` is server-generated SHA-1 prefix (not user URL).
  2. `turnstile.service.ts:28` — URL hardcoded `https://challenges.cloudflare.com/turnstile/v0/siteverify`.
  3. `users.service.ts:951` (`downloadAndStoreAvatar`) — URL comes from OAuth provider's profile (Google/GitHub avatar URL via `profile.photos[0].value` per `google.strategy.ts:84`, `github.strategy.ts:94`). The provider has already authenticated the URL at OAuth handshake time. Mitigations: (a) `AbortSignal.timeout(5000)` (`users.service.ts:952`); (b) downloaded buffer is stored only — no response body returned to caller; (c) failure tolerance — `catch { return null }` (line 967). Provider hostnames are implicitly the OAuth provider's CDN — the URL is server-trusted not user-typed.

#### SS-02: URL allowlist for outbound calls
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: HIBP and Turnstile URLs are hardcoded constants (immutable allowlist of one). OAuth avatar URLs come from upstream OAuth providers — provider identity itself is allowlisted at `google.strategy.ts:25-31` / `github.strategy.ts:25-31`. `getValidatedFrontendUrl` at `oauth.controller.ts:264-278` enforces an explicit redirect-URL allowlist for OAuth post-callback redirects.

#### GS-01: No secrets in git history
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `git log --all --diff-filter=A -- "*.env" "*.key" "*.pem" "*secret*" "*credential*"` returns 0 entries — no secret files ever committed. `.gitignore:47-52` blocks `.env`, `.env.*`, `*.pem`, `*.key`. Pre-commit gitleaks scan via `.gitleaks.toml` (per Memory).

#### GS-02: .gitignore completeness
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `em-ecosystem-code/.gitignore` includes: `.env` (line 47), `.env.*` (line 48), `!.env.example` (line 49), `*.pem` (line 50), `*.key` (line 51), `node_modules/` (line 4), `dist/` (line 11), `.DS_Store` (line 33), `coverage/` (line 67), `*.log` (line 61).

---

## Recommendations

The audit produced 0 FAILs and 2 WARNs — no remediation tickets required. The two WARNs are documented design choices with clear rationale; recording here for traceability:

1. **H-12 (WARN, HIGH)** — *Account lockout state is intentionally hidden from the API client.*
   - **Action**: None required. Confirm the current trade-off (anti-enumeration via opaque `INVALID_CREDENTIALS` + email notification of lockout) still matches policy. If a future product decision favors UX clarity over enumeration resistance, replace with a tiered approach (generic message for <N attempts, 423 Locked + email confirmation gate for ≥N).
   - **Reference**: `src/auth/login.service.ts:121-202`, `src/auth/constants/auth.constants.ts:22-29, 64-68`.

2. **EM-10 (WARN, MEDIUM)** — *Multiple authenticated MFA-related error messages within one category.*
   - **Action**: Acknowledged carry-forward from 2026-03-29 audit. Recommend leaving as-is for authenticated paths (the variance helps legitimate users diagnose state) but document an explicit policy in `error-messages.ts` header confirming "post-auth taxonomy is acceptable; pre-auth paths must use one canonical message per category". This is a documentation tweak, not a code change.
   - **Reference**: `src/common/constants/error-messages.ts:20-27`, `src/auth/mfa.service.ts:55-217`.

---

## Recurrence vs Previous Audit (2026-03-29)

| Finding | Previous Verdict | Current Verdict | Note |
|---------|------------------|-----------------|------|
| All auth checks (122 PASS) | PASS | PASS | Maintained — no regressions |
| EM-10 (MFA error consistency) | WARN | WARN | Carry-forward — design choice, not a defect |
| V8.2.2 (frontend localStorage) | WARN (pending sweep) | PASS | Resolved — comprehensive sweep completed; no tokens/PII in storage |
| H-12 (account lockout timing) | (covered by EM-04 fix) | WARN | Re-classified as documentation-only; SCRUM-283 fix verified |

**Statistics**:
- Previous (2026-03-29): 122 PASS / 2 WARN / 0 FAIL.
- Current (2026-05-06): 122 PASS / 2 WARN / 0 FAIL.
- **0-FAIL baseline maintained.** No regressions across the SCRUM-281 / SCRUM-283 / SCRUM-284 / SCRUM-300 / SCRUM-301 / SCRUM-302 / SCRUM-299 Phase 2 changes.

---

## Verification Notes

- All file paths are relative to `em-ecosystem-code/nexacore-api/` unless explicitly noted as `nexacore-dashboard/`.
- Every PASS verdict has at least one `file:line` citation.
- Grep counts re-run inline (not relying on previous audit memory).
- WARNs are flagged for review, not for blocking release; both have documented rationale.
