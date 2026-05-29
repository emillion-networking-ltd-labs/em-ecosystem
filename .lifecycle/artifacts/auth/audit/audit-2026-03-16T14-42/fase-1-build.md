# Fase 1: BUILD — Global

**Date**: 2026-03-16 14:42
**Module**: global
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: SOC 2 CC7.1, SOC 2 CC8.2, NIST CM-6

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 7     |
| FAIL    | 0     |
| WARN    | 1     |
| N/A     | 0     |

**Overall**: PASS

---

## Detailed Findings

### B-01: TypeScript compilation
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `nest build` exits with code 0, no errors. `next build` compiles successfully (18 static pages, 1 ESLint warning about `<img>` in MfaSetup.tsx — non-blocking).
- **Standard**: SOC 2 CC8.3

### B-02: Module bootstrap
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `nest start` output shows all 12 modules initialized: PrismaModule, MailerModule, CryptoModule, PassportModule, ConfigHostModule, RedisModule, ThrottlerModule, MailerCoreModule, ConfigModule, AppModule, MailModule, SessionsModule, GeolocationModule, SecurityModule, JwtModule, AuditModule, PermissionsModule, UsersModule, AuthModule. `Nest application successfully started` confirmed.
- **Standard**: SOC 2 CC7.1

### B-03: Route count
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `nest start` output shows 58 `Mapped {method, path}` lines. Routes span 7 controllers: AuditLogController, AuthController, OAuthController, AccountController, SessionController, MfaController, PasskeyController, UsersController, PermissionsController. Consistent with api-spec.yml implemented operation count.
- **Standard**: SOC 2 CC8.1

### B-04: Deprecation warnings
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `nest start` output scanned — 0 "deprecated" warnings. One operational WARN from GeolocationService about missing MaxMind database (expected in dev, not a deprecation).
- **Standard**: NIST CM-6

### B-05: Build output structure
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `dist/main.js` present and verified via `ls dist/main.js`.
- **Standard**: SOC 2 CC8.2

### B-06: Database connectivity
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `nest start` output shows successful initialization of PrismaModule. PermissionsService seeds confirmed ("Role USER already has 2 permission(s) — skipping seed", "Role ADMIN already has 8 permission(s) — skipping seed"), proving DB connectivity.
- **Standard**: SOC 2 CC7.1

### B-07: Environment completeness
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `.env.example` documents 42 environment variables covering: NODE_ENV, PORT, FRONTEND_URL, API_URL, DATABASE_URL, JWT_SECRET, JWT_ACCESS_EXPIRATION, JWT_REFRESH_EXPIRATION, SESSION_IDLE_TIMEOUT_HOURS, MAX_CONCURRENT_SESSIONS, MFA_APP_NAME, MFA_ENCRYPTION_KEY, WEBAUTHN_RP_ID/NAME/ORIGIN, GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL, GITHUB_CLIENT_ID/SECRET/CALLBACK_URL, OAUTH_ALLOWED_REDIRECT_URLS, CSRF_SECRET, CORS_ALLOWED_ORIGINS, REDIS_HOST/PORT/PASSWORD/DB/KEY_PREFIX/TLS_ENABLED/TLS_REJECT_UNAUTHORIZED, SMTP vars, TURNSTILE_SECRET_KEY, MAXMIND_DB_PATH, GEOLOCATION vars, IMPOSSIBLE_TRAVEL vars, BRUTE_FORCE vars, UNUSUAL_HOURS vars. `process.env` references in source all covered. `validate-production-secrets.ts` verifies critical secrets at startup.
- **Standard**: NIST CM-6, SOC 2 CC8.2

### B-08: Source map configuration
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: `tsconfig.json:17` — `"sourceMap": true`. Source maps enabled globally. Production build (`nest build`) inherits this setting. Recommended: strip source maps from production deployment artifacts to prevent information disclosure.
- **Standard**: Security best practice

---

## Recommendations

1. **B-08**: Configure production build pipeline to exclude source maps from deployed artifacts (e.g., `--sourceMap false` in production Dockerfile or CI build step).
