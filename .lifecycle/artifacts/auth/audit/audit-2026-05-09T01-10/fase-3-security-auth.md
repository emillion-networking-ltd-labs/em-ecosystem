# Fase 3: SECURITY — auth

**Date**: 2026-05-09 01:10 UTC
**Module**: auth
**Auditor**: Claude (automated, code-level)
**Framework**: audit-standards.mdc v1.0
**Standards**: OWASP ASVS v4.0, NIST SP 800-63B, RFC 9700, RFC 8725, CWE family
**Previous baseline**: audit-2026-05-06T22-44 (122 PASS / 2 WARN / 0 FAIL — 98.4%)

---

## Summary (sub-phases 3a–3n combined)

| Verdict | Count |
|---------|-------|
| PASS    | 122   |
| FAIL    | 0     |
| WARN    | 2     |
| N/A     | 0     |

**Overall**: PASS (no FAIL, no CRITICAL findings)

---

## 3a. OWASP ASVS — Authentication (Chapter 2)

| Check | Verdict | Evidence |
|-------|---------|----------|
| V2.1.1 Min length 8 | PASS | `register.dto.ts:21`, `reset-password.dto.ts:14` `@MinLength(8)` |
| V2.1.2 Max length ≥64 | PASS | `register.dto.ts:22` `@MaxLength(128)`, `reset-password.dto.ts:15` `@MaxLength(128)` — exceeds 64 |
| V2.1.3 No composition rules | PASS | DTO grep → no `@Matches` for case/special-char rules |
| V2.1.4 Breach dictionary | PASS | `password-breach.service.ts:16-66` uses HIBP k-anonymity API; called from `login.service.ts:75` (register) and `password-reset.service.ts:111` (reset) |
| V2.1.7 Bcrypt cost ≥10 | PASS | `auth.constants.ts:6` `BCRYPT_ROUNDS = 12` (≥10) |
| V2.1.9 No password hints | PASS | User entity (`schema.prisma:55-100`) has no hint/reminder field |
| V2.1.10 No KBA | PASS | No security questions in any DTO |
| V2.2.1 Anti-automation | PASS | `auth.controller.ts:74,99` `@Throttle` on register/login; `@UseGuards(TurnstileGuard)` on register, login, forgot-password, resend-verification-public |
| V2.2.2 Constant-time | PASS | `login.service.ts:165-188` Layer 2 timing floor (`MIN_LOGIN_DURATION_MS=350`); `auth.constants.ts:14-19` dummy bcrypt hash; `password-reset.service.ts:38-42` (forgot-password timing match) |
| V2.5.1 Crypto reset token | PASS | `password-reset.service.ts:55` `crypto.randomBytes(32).toString('hex')` |
| V2.5.2 Reset TTL ≤1h | PASS | `auth.constants.ts:159` `RESET_TOKEN_EXPIRY_HOURS = 1` |
| V2.5.3 Reset single-use | PASS | `password-reset.service.ts:117-126` marks `usedAt` in tx; line 88-90 rejects already-used |
| V2.7.1 MFA TOTP | PASS | `mfa.service.ts:65-72` `generateSecret + generateURI`; verify at line 116 |
| V2.7.2 MFA req for admins | PASS | `login.service.ts:138-141` ADMIN/SUPERADMIN without MFA → forced setup token path |
| V2.8.1 MFA backup codes | PASS | `mfa.service.ts:79-83` 10 codes hashed with bcrypt rounds 10; line 169-178 mark consumed (single-use) |
| V2.10.1 No hardcoded creds | PASS | All secrets via `ConfigService.get()`; defaults in dev config files prefixed `default-dev-*` and rejected in production by `validate-production-secrets.ts` |
| V2.10.2 No default seed creds | PASS | Seed scripts (not in this scope) reviewed in previous audit; no admin defaults |
| V2.10.4 Production secret validation | PASS | `validate-production-secrets.ts:24-43` rejects defaults & length<32 |

## 3b. OWASP ASVS — Session Management (Chapter 3)

| Check | Verdict | Evidence |
|-------|---------|----------|
| V3.2.1 Session→user | PASS | `token.service.ts:97-104` `sessionsService.createSession({userId,...})` |
| V3.2.2 UA stored | PASS | `token.service.ts:101` userAgent passed |
| V3.2.3 IP stored | PASS | `token.service.ts:100` ipAddress passed |
| V3.3.1 Logout invalidates | PASS | `token.service.ts:354-357` revokes session + denies all user tokens |
| V3.3.2 Idle timeout ≤30min | PASS | `auth.constants.ts:114` `SESSION_IDLE_TIMEOUT_HOURS = 0.5` (=30 min) |
| V3.3.3 Absolute ≤12h | PASS | `.env.example` `JWT_REFRESH_EXPIRATION="12h"` |
| V3.3.4 Logout-all bulk | PASS | `token.service.ts:373-389` `logoutAll` and `logoutAllWithReauth` (SCRUM-347) |
| V3.5.1 No tokens in URL | PASS | All tokens via Authorization header (Bearer) or httpOnly cookie. OAuth link code passed as `?link_code=` (single-use, 60s TTL — not a session token) |
| V3.5.2 Secure cookie flags | PASS | `token.service.ts:325-334` httpOnly:true, secure:isProduction, sameSite:'strict' |
| V3.7.1 Concurrent limits | PASS | `token.service.ts:91-94` `enforceSessionLimit`; `auth.constants.ts:121` `MAX_CONCURRENT_SESSIONS = 5` |

## 3c. OWASP ASVS — Access Control (Chapter 4)

| Check | Verdict | Evidence |
|-------|---------|----------|
| V4.1.1 RBAC | PASS | All protected controller methods use `@UseGuards(JwtAuthGuard)` (or composite) |
| V4.1.2 Least privilege | PASS | `auth.controller.ts:222` admin endpoint uses `@UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)` |
| V4.1.3 CSRF on state-changing | PASS | `security.module.ts:15` registers CsrfGuard as APP_GUARD; opt-out via `@SkipCsrf()` only (account.controller, csrf-token, verify-* endpoints) |
| V4.1.4 Deny by default | PASS | `app.module.ts:60-65` `APP_GUARD` registered as CustomThrottlerGuard; CsrfGuard registered globally in security.module |
| V4.2.1 Param tampering | PASS | `session.controller.ts:80` `ParseUUIDPipe` on `:id`; `passkey.controller.ts` `:id` ditto |
| V4.3.1 Admin self-escalation | PASS | (verified outside auth scope in users module — carry-forward from previous audit) |
| V4.3.2 Permission-based | PASS | `permissions.guard.ts` enforces `@RequirePermissions` decorator |
| V4.3.3 SUPERADMIN restrictions | PASS | `roles.guard.ts:34-50` SUPERADMIN bypasses but logs `SUPERADMIN_BYPASS` audit event |

## 3d. OWASP ASVS — Input Validation (Chapter 5)

| Check | Verdict | Evidence |
|-------|---------|----------|
| V5.1.1 Server-side ValidationPipe | PASS | `main.ts:50-63` global ValidationPipe |
| V5.1.2 Whitelist | PASS | `main.ts:51-52` `whitelist: true, forbidNonWhitelisted: true, transform: true` |
| V5.1.3 All DTOs validated | PASS | All 23 auth DTOs use class-validator decorators (`@IsEmail`, `@IsString`, `@MinLength`, etc.) |
| V5.2.1 No raw HTML | PASS | grep `innerHTML\|dangerouslySet` in `src/auth/` → 0 |
| V5.3.1 SQL injection | PASS | grep `queryRaw\|executeRaw\|queryRawUnsafe` in `src/` → 0 results |
| V5.3.2 No eval | PASS | grep `eval(\|Function(` non-test → 0 |
| V5.5.1 UUID params | PASS | `session.controller.ts:80,159,180`, `passkey.controller.ts:142,163` use `ParseUUIDPipe` |

## 3e. OWASP ASVS — Cryptography (Chapter 6)

| Check | Verdict | Evidence |
|-------|---------|----------|
| V6.2.1 Strong hash | PASS | bcrypt only (`grep` confirms no MD5/SHA1 password hashing); SHA-1 only used for HIBP API per spec, SHA-256 for token hashing |
| V6.2.2 Crypto random | PASS | grep `Math.random` in `src/auth/` non-test → 0. `crypto.randomBytes`, `crypto.randomUUID`, `randomInt` used everywhere (see `password-reset.service.ts:55`, `mfa.service.ts:280`, `oauth-state.store.ts:25-27`) |
| V6.2.3 TOTP algo | PASS | `mfa.service.ts:67-72` SHA-1 TOTP per RFC 6238 |
| V6.4.1 Secrets from env | PASS | All keys/secrets via `ConfigService.get()` or `process.env` only in `validate-production-secrets.ts` and config files |
| V6.4.2 Diff secrets per env | PASS | `validate-production-secrets.ts:24-77` rejects default values in production |

## 3f. NIST SP 800-63B

| Check | Verdict | Evidence |
|-------|---------|----------|
| N-01 Memorized 8-64 | PASS | DTO `@MinLength(8) @MaxLength(128)` |
| N-02 No composition | PASS | No `@Matches` rules |
| N-03 Breach check | PASS | HIBP integration |
| N-04 All Unicode | PASS | No char-type restrictions |
| N-05 MFA support | PASS | TOTP + WebAuthn (passkey.service) |
| N-06 Reauth for sensitive | PASS | password-required on MFA disable, passkey delete, logout-all, trust-device, revoke-session, change email/password (users module) |
| N-07 Session timeout | PASS | idle 0.5h ≤ 30min, absolute 12h ≤ 12h |
| N-08 Verifier impersonation | PASS | `validate-production-secrets.ts:55-66` HTTPS callback enforcement; helmet HSTS |
| N-09 Rate limiting | PASS | `auth.controller.ts`, `mfa.controller.ts`, `passkey.controller.ts` `@Throttle` decorators |

## 3g. RFC 9700 — OAuth 2.0 BCP

| Check | Verdict | Evidence |
|-------|---------|----------|
| O-01 PKCE | PASS | `pkce-authenticate.ts:1-50` injects code_verifier from oauth-state.store; `oauth-state.store.ts:25-29` generates code_verifier + S256 code_challenge |
| O-02 State param | PASS | `oauth-state.store.ts:23` `randomUUID()` state with 5-min TTL; consumed atomically (`validate()` line 38-43) |
| O-03 Redirect URI whitelist | PASS | `oauth.controller.ts:228-244` `getValidatedFrontendUrl()` validates against `OAUTH_ALLOWED_REDIRECT_URLS` allowlist |
| O-04 Token via back-channel | PASS | OAuth tokens NEVER in URL fragments; ephemeral oauth_code in httpOnly cookie, exchanged via POST `/auth/oauth/exchange` |
| O-05 Ephemeral auth code | PASS | `oauth-code.store.ts:31-39` consumed on exchange (`del`) |
| O-06 Code lifetime ≤10min | PASS | `oauth-code.store.ts:7` 60s TTL; `oauth-link-code.store.ts:6` 60s TTL |
| O-07 No tokens in logs | PASS | grep `console.log.*token\|access_token\|refresh_token` non-test → 0 |
| O-08 Scope limitation | PASS | `google.strategy.ts:32` `scope: ['email','profile']` (minimal); `github.strategy.ts:33` `scope: ['user:email']` (minimal) |

## 3h. RFC 8725 — JWT BCP

| Check | Verdict | Evidence |
|-------|---------|----------|
| J-01 Algo explicit | PASS | `jwt.strategy.ts:24` `algorithms: ['HS256']`; `auth.module.ts:60` `algorithm: 'HS256' as const`; verifyOptions also pin HS256 |
| J-02 Issuer claim | PASS | `auth.module.ts:55,63` `issuer: JWT_ISSUER` set + verified |
| J-03 Audience claim | PASS | `auth.module.ts:56,64` `audience: JWT_AUDIENCE` set + verified |
| J-04 Expiration ≤15min | PASS | `auth.config.ts:6` `JWT_ACCESS_EXPIRATION || '15m'`; `validate-production-secrets.ts:69-78` enforces ≤15min in prod |
| J-05 jti claim | PASS | `token.service.ts:108,308` `jti: crypto.randomUUID()` |
| J-06 Refresh rotation | PASS | `token.service.ts:135-159` `refreshTokens` calls `rotateRefreshToken` (sessions service detects token-family theft) |

## 3i. HTTP Security & Rate Limiting

| Check | Verdict | Evidence |
|-------|---------|----------|
| H-01 HSTS | PASS | `security.config.ts:62-66` `hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }`; helmet middleware applies |
| H-02 CSP | PASS | `security.config.ts:53-71` strict CSP defaultSrc 'self', no unsafe-inline/eval |
| H-03 X-Frame-Options | PASS | `helmet.middleware.ts:21` `xFrameOptions: { action: 'deny' }` |
| H-04 X-Content-Type | PASS | `helmet.middleware.ts:20` `xContentTypeOptions: true` |
| H-05 Referrer-Policy | PASS | `security.config.ts:67-69` `strict-origin-when-cross-origin` |
| H-06 CORS restricted | WARN | `main.ts:23-37` allowlist via `SecurityConfig.cors.getAllowedOrigins()` BUT requests without Origin header are intentionally allowed (line 28-31) — labeled `ACCEPTED RISK [H-06]` in code. Carry-forward Accepted-Risk. |
| H-07 RL: login | PASS | `auth.controller.ts:99-106` `@Throttle({global:{ttl:60000,limit:10}})` |
| H-08 RL: register | PASS | `auth.controller.ts:74-80` `@Throttle({global:{ttl:60000,limit:5}})` |
| H-09 RL: pwd reset | PASS | `account.controller.ts:111` `@Throttle(THROTTLE_CONFIGS.sensitiveAction)` (15min,3) |
| H-10 RL: MFA | PASS | `mfa.controller.ts:53,67,82,107,127,147` `@Throttle(THROTTLE_CONFIGS.mfa)` (5/60s) |
| H-11 RL: OAuth exchange | PASS | `oauth.controller.ts:114` `@Throttle(THROTTLE_CONFIGS.oauth)` (10/60s) |
| H-12 Progressive lockout | PASS | `login.service.ts:218-238` after MAX_FAILED_ATTEMPTS=5 lock account; `auth.constants.ts:33` `LOCKOUT_DURATIONS_MINUTES = [15, 30, 60, 120]` escalating |

## 3j. Error Message Information Disclosure

| Check | Verdict | Evidence |
|-------|---------|----------|
| EM-01 No user enum | PASS | Login: `INVALID_CREDENTIALS` for any failure (login.service.ts:106,196,234,251); Forgot-password: `password-reset.service.ts:38-44` returns silently for non-existent emails after timing-equal bcrypt compare; Resend-verification-public: silent return |
| EM-02 No account state | PASS | All public endpoints map state errors to `INVALID_CREDENTIALS` or generic `AUTHENTICATION_FAILED` (e.g., login.service.ts:184 locked → INVALID_CREDENTIALS) |
| EM-03 No mechanism names | PASS | grep `pkce\|fingerprint\|deny-list\|state parameter` in error strings → 0 (only in code comments / audit metadata) |
| EM-04 Timing-safe public responses | PASS | `login.service.ts:160-185` `MIN_LOGIN_DURATION_MS=350` floor for ALL paths; `password-reset.service.ts:38-42` bcrypt-equalize forgot-password |
| EM-05 No entity disclosure on auth'd | PASS | passkey.service.ts:223-229 returns `AUTHENTICATION_FAILED` not 404 for credential mismatches; `failPasskeyAuth` standardizes |
| EM-06 No authz detail | PASS | `roles.guard.ts:62`, `permissions.guard.ts:51` use `ACCESS_DENIED` only; no role/permission name leak |
| EM-07 Single guard message | PASS | csrf.guard, oauth-link.guard, mfa-setup.guard each throw single canonical error |
| EM-08 No feature state | PASS | MFA-enabled vs disabled returns identical error message paths during login (`INVALID_CREDENTIALS`); passkey login is anti-enumeration (passkey.service.ts:185 silent for missing user) |
| EM-09 No token lifecycle | PASS | `INVALID_REFRESH_TOKEN`, `INVALID_OR_EXPIRED_MFA_TOKEN`, `INVALID_RESET_TOKEN` — single message each token type, no separate "expired" vs "missing" |
| EM-10 Consistent per category | WARN | MFA-related authenticated endpoints use 4 distinct messages (`OPERATION_NOT_AVAILABLE`, `INVALID_CODE`, `INVALID_TOKEN`, `PASSWORD_REQUIRED_NO_PASSWORD`) which can fingerprint enrollment state for an authenticated session. Carry-forward Accepted-Risk; outside public attack surface. |
| EM-11 No internal field names | PASS | `http-exception.filter.ts:78-90` `sanitizeValidationDetails` strips DTO field names from validation errors |
| EM-12 No config in errors | PASS | `http-exception.filter.ts:55-57` `Retry-After` HTTP header used (not body) |
| EM-13 Error shape consistency | PASS | `http-exception.filter.ts:64-72` standard `{success:false, error:{message, code, statusCode, details?}}` |

## 3k. OWASP ASVS — Logging (Chapter 7)

| Check | Verdict | Evidence |
|-------|---------|----------|
| V7.1.1 No creds in logs | PASS | grep `Logger.*password\|Logger.*token\|Logger.*secret` in src/auth → 0 leaks (HIBP service mentions API status only, line 41) |
| V7.1.2 No PII in logs | PASS | `pseudonymize-email.ts` used in audit metadata (login.service.ts:64,82,107) |
| V7.1.3 Security events logged | PASS | AuditService called for LOGIN_SUCCESS/FAILURE, MFA_ENABLED/DISABLED, ACCOUNT_LOCKED, PASSWORD_CHANGE, OAUTH_LOGIN, PASSKEY_*, DEVICE_TRUSTED/UNTRUSTED, IMPOSSIBLE_TRAVEL_DETECTED, etc. (40 enum values in schema.prisma) |
| V7.1.4 Log completeness | PASS | `audit-log.helper.ts:11-20` standard signature: action, ctx (ip+ua), userId, metadata |
| V7.3.1 Log injection prevention | PASS | NestJS Logger uses string interpolation but no user-controlled input directly logged in raw form (only pseudonymized email + audit metadata which is JSON-serialized) |
| V7.4.1 Generic error in prod | PASS | `http-exception.filter.ts:25-27` only logs stack traces server-side; client gets generic message |
| V7.4.3 Last resort handler | PASS | `main.ts:65` `app.useGlobalFilters(new HttpExceptionFilter())` catches all |

## 3l. OWASP ASVS — Data Protection (Chapter 8)

| Check | Verdict | Evidence |
|-------|---------|----------|
| V8.2.1 Anti-caching | PASS | `no-cache.interceptor.ts:18-21` sets Cache-Control no-store, Pragma, Expires; applied to all auth controllers via `@UseInterceptors(NoCacheInterceptor)` |
| V8.2.2 No sensitive data in browser storage | PASS | (frontend scope) refresh token in httpOnly cookie; access token kept in memory (verified in Phase 9) |
| V8.2.3 Cleanup on logout | PASS | (frontend scope — verified in Phase 9 carry-forward) |
| V8.3.1 No sensitive in query strings | PASS | grep `@Query()` in auth controllers → only used for OAuth callback `state`/`code`/`link_code` which are ephemeral session-bound IDs, not credentials |
| V8.3.4 Sensitive fields identified | PASS | `schema.prisma` `/// @sensitive` comments on passwordHash, mfaSecret, mfaRecoveryCodes, refreshTokenHash, tokenHash (verification + reset), fingerprintHash, publicKey |
| V8.3.5 Sensitive access audited | PASS | role changes, profile updates, account events all generate audit logs |
| V8.3.7 DB TLS | PASS | `validate-production-secrets.ts:138-149` enforces `sslmode=require\|verify-ca\|verify-full` in production |

## 3m. OWASP ASVS — API Security (Chapter 13)

| Check | Verdict | Evidence |
|-------|---------|----------|
| V13.1.3 No sensitive in URLs | PASS | All credentials in body or headers; OAuth state/code in cookies |
| V13.1.5 Content-Type | PASS | NestJS body parser enforces JSON by default; multer for avatar uploads only |
| V13.2.1 Method restriction | PASS | grep `@All(` in src → 0 |
| V13.2.5 Content-Type validation | PASS | (NestJS default — `@Body()` requires JSON) |
| V13.2.6 TLS integrity | PASS | HSTS via helmet (H-01); HTTPS callback enforced for OAuth |

## 3n. Node.js-Specific Attacks

| Check | Verdict | Evidence |
|-------|---------|----------|
| PP-01 No proto pollution Object.assign | PASS | grep `Object.assign` in src/auth → 0 |
| PP-02 No proto pollution spread | PASS | DTOs validated by ValidationPipe whitelist before any spread; service-level objects come from validated DTOs only |
| PP-03 No recursive merge | PASS | grep `_.merge\|_.defaultsDeep\|_.set` → 0 (lodash not directly imported in auth) |
| RD-01 No evil regex | PASS | grep `new RegExp(` non-test → 0; literal regexes in `validate-production-secrets.ts:62`, `parse-duration.ts:3` are linear (`^(\d+)(s\|m\|h\|d)$`) — no nested quantifiers |
| RD-02 No user input regex | PASS | RegExp constructor never called with user input |
| SS-01 No SSRF | PASS | grep `fetch(\|axios\|http.get(` in src/auth → only `password-breach.service.ts:30` `fetch('https://api.pwnedpasswords.com/range/${prefix}')` — prefix is a 5-char SHA-1 hex, fully derived from validated user password (not URL-controllable) |
| SS-02 URL allowlist | PASS | HIBP URL hardcoded; OAuth provider URLs come from passport-* strategy configs (env-controlled) |
| GS-01 No secrets in git | PASS | `.gitignore:43-48` excludes `.env`, `.env.*`, `*.key`, `*.pem`; gitleaks workflow active in CI |
| GS-02 .gitignore complete | PASS | `.gitignore` includes node_modules, dist, .env*, *.key, *.pem, .DS_Store, coverage, .mmdb, attachments, tmp-*.py |

---

## Recommendations

1. **H-06 WARN** (Accepted-Risk, carry-forward): Document the ACCEPTED RISK comment block more visibly in the security policy. Consider adding strict-Origin-fallback for known non-browser caller patterns (server-to-server allowlist) to reduce surface.
2. **EM-10 WARN** (Accepted-Risk, carry-forward): Authenticated MFA endpoints' message variance is minor; review at next quarterly threat-model refresh.

**FAIL count: 0 — Phase 3 baseline maintained at 0-FAIL since 2026-03-17.**
