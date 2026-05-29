# Fase 1: BUILD — Global

**Date**: 2026-03-15 19:49 UTC
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
- **Evidence**: `nest build` completed with exit code 0, no errors or warnings
- **Standard**: SOC 2 CC8.3

### B-02: Module bootstrap
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: All 16 modules initialized successfully: PrismaModule, MailerModule, CryptoModule, PassportModule, ConfigHostModule, RedisModule, ThrottlerModule, MailerCoreModule, ConfigModule (×2), AppModule, MailModule, SessionsModule, GeolocationModule, SecurityModule, JwtModule, AuditModule, PermissionsModule, UsersModule, AuthModule. No DI errors. `NestApplication successfully started`.
- **Note**: GeolocationService warning about missing MaxMind DB is expected in dev environment (graceful degradation).
- **Standard**: SOC 2 CC7.1

### B-03: Route count
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: 58 mapped routes in startup output. api-spec.yml contains 97 total operations (58 implemented + ~39 planned/future). Implemented routes match startup output.
- **Standard**: SOC 2 CC8.1

### B-04: Deprecation warnings
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: Zero deprecation warnings in startup output. Only non-error log is GeolocationService MaxMind DB warning (graceful degradation, not a deprecation).
- **Standard**: NIST CM-6

### B-05: Build output structure
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `dist/main.js` present at `nexacore-api/dist/main.js`
- **Standard**: SOC 2 CC8.2

### B-06: Database connectivity
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: PrismaModule initialized successfully, RedisModule connected to `localhost:6379`, PermissionsService seeded roles (USER 2 perms, ADMIN 8 perms). Database and Redis connections operational.
- **Standard**: SOC 2 CC7.1

### B-07: Environment completeness
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `.env.example` exists with 40+ documented variables covering: NODE_ENV, PORT, FRONTEND_URL, DATABASE_URL, JWT_SECRET, JWT_ACCESS_EXPIRATION, JWT_REFRESH_EXPIRATION, SESSION_IDLE_TIMEOUT_HOURS, MAX_CONCURRENT_SESSIONS, TRUSTED_DEVICE_TTL_DAYS, MFA_APP_NAME, MFA_ENCRYPTION_KEY, WEBAUTHN_RP_ID/RP_NAME/ORIGIN, GOOGLE/GITHUB_CLIENT_ID/SECRET/CALLBACK_URL, OAUTH_ALLOWED_REDIRECT_URLS, CSRF_SECRET, CORS_ALLOWED_ORIGINS, REDIS_HOST/PORT/PASSWORD/DB/KEY_PREFIX/TLS, SMTP_HOST/PORT/SECURE/USER/PASSWORD/FROM, TURNSTILE_SECRET_KEY, MAXMIND_DB_PATH, GEOLOCATION_CACHE_*, IMPOSSIBLE_TRAVEL_*, BRUTE_FORCE_*, CREDENTIAL_STUFFING_THRESHOLD, UNUSUAL_HOURS_*. `validate-production-secrets.ts` verifies JWT_SECRET, MFA_ENCRYPTION_KEY, CSRF_SECRET, GOOGLE/GITHUB callback URLs and client secrets, SMTP_PASSWORD, REDIS_PASSWORD, DATABASE_URL at startup.
- **Standard**: NIST CM-6, SOC 2 CC8.2

### B-08: Source map configuration
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: `tsconfig.json:16` — `"sourceMap": true`. Source maps are enabled globally. No evidence of production build script stripping source maps from deployment artifacts. Source maps in production can leak internal code structure.
- **Actual**: sourceMap always true, no production-specific override
- **Expected**: sourceMap disabled or stripped for production builds
- **Standard**: —

---

## Recommendations

1. **B-08 (WARN)**: Add a production build step that either sets `sourceMap: false` via `tsconfig.build.json` override or strips `.js.map` files from deployment artifacts. Example: `"build:prod": "nest build && find dist -name '*.map' -delete"`
