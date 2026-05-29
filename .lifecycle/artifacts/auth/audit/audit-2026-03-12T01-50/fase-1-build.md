# Fase 1: BUILD — Global

**Date**: 2026-03-12 01:50
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
- **Evidence**: `nest build` → exit code 0, zero errors
- **Standard**: SOC 2 CC8.3

### B-02: Module bootstrap
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: All 17 modules initialized without DI errors: PrismaModule, MailerModule, CryptoModule, PassportModule, RedisModule, ThrottlerModule, JwtModule, MailerCoreModule, AppModule, MailModule, SessionsModule, GeolocationModule, SecurityModule, AuditModule, PermissionsModule, UsersModule, AuthModule. `Nest application successfully started` logged.
- **Standard**: SOC 2 CC7.1

### B-03: Route count
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: 57 routes mapped at startup. Controllers: AuditLogController (2), AuthController (28), MfaController (6), PasskeyController (7), UsersController (11), PermissionsController (3).
- **Standard**: SOC 2 CC8.1

### B-04: Deprecation warnings
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: 0 deprecation warnings in startup output. One WARN from GeolocationService about missing GeoLite2 database file — this is a feature availability warning, not a deprecation.
- **Standard**: NIST CM-6

### B-05: Build output structure
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `dist/main.js` present (3111 bytes, modified 2026-03-12)
- **Standard**: SOC 2 CC8.2

### B-06: Database connectivity
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: Prisma connected (PermissionsService seeded roles successfully). Redis connected to localhost:6379. No connection errors in startup log.
- **Standard**: SOC 2 CC7.1

### B-07: Environment completeness
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/common/utils/validate-production-secrets.ts` validates: JWT_SECRET (min 32 chars, non-default), MFA_ENCRYPTION_KEY (min 32 chars, non-default), CSRF_SECRET (min 32 chars, non-default), GOOGLE_CALLBACK_URL (HTTPS in prod), GITHUB_CALLBACK_URL (HTTPS in prod), JWT_ACCESS_EXPIRATION (≤15min in prod). Called before app bootstrap.
- **Standard**: NIST CM-6, SOC 2 CC8.2

### B-08: Source map configuration
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: `tsconfig.json:16` — `"sourceMap": true`. Source maps are always generated. No build script or tsconfig.build.json excludes source maps for production builds. Source maps in production could expose code structure.
- **Expected**: sourceMap disabled or excluded for production deployments
- **Actual**: sourceMap always enabled

---

## Recommendations

1. B-08: Add a `tsconfig.prod.json` that extends the base with `"sourceMap": false`, or ensure the deployment pipeline excludes `.js.map` files from the production artifact.
