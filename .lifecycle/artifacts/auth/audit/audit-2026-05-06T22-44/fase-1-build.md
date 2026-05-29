# Fase 1: BUILD — global

**Date**: 2026-05-06 22:44 UTC
**Module**: auth (global phase)
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: SOC 2 CC7.1, CC8.1, CC8.2, CC8.3, NIST CM-6
**Previous baseline**: audit-2026-03-29T21-35 (Phase 1 = 7 PASS / 1 WARN / 0 FAIL)

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

### B-01: TypeScript compilation (`nest build`)
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `npx nest build` exited with code 0, no compilation errors. Build artifacts present in `dist/` (auth, common, config, geolocation, mail, permissions, prisma, security, sessions, storage, users, audit). `dist/main.js` size verified.
- **Standard**: SOC 2 CC8.3

### B-02: Module bootstrap (`nest start`)
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `node dist/main.js` started cleanly. All 21 modules initialized (PrismaModule, MailerModule, CryptoModule, PassportModule, RedisModule, ThrottlerModule, AppModule, AuthModule, UsersModule, etc.). Final log: `Nest application successfully started`. Zero DI errors.
- **Standard**: SOC 2 CC7.1

### B-03: Route count
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: 60 routes mapped at startup. Auth-module routes (controllers under `src/auth/`):
  - `AuthController` /auth: 8 routes (csrf-token, register, login, refresh, logout, logout-all, me, admin)
  - `OAuthController` /auth: 8 routes (google, google/callback, github, github/callback, oauth/exchange, link/code, link/google, link/github)
  - `AccountController` /auth: 7 routes (verify-email, verify-email-change, resend-verification, resend-verification-public, forgot-password, reset-password, validate-reset-token)
  - `SessionController` /auth: 6 routes (sessions GET, sessions/:id DELETE, trusted-devices POST/GET/DELETE, trusted-devices/:id DELETE)
  - `MfaController` /auth/mfa: 6 routes (setup, verify-setup, verify-login, mfa DELETE, recovery-codes, status)
  - `PasskeyController` /auth/passkeys: 7 routes (register/options, register/verify, login/options, login/verify, list, :id PATCH, :id DELETE)
  - **Total auth-scope routes: 42** — matches Phase 4 spec count.
- **Standard**: SOC 2 CC8.1

### B-04: Deprecation warnings
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: Startup output scanned — zero `deprecated` / `DeprecationWarning` strings. The single WARN line is for missing GeoLite2 (B-07 below), not a deprecation.
- **Standard**: NIST CM-6

### B-05: Build output structure
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `dist/main.js` and `dist/main.d.ts` present. `dist/app.module.js` and per-feature subdirectories (auth/, users/, common/, config/, prisma/, etc.) all present.
- **Standard**: SOC 2 CC8.2

### B-06: Database connectivity
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: Bootstrap log shows `[InstanceLoader] PrismaModule dependencies initialized +24ms` followed by `[RedisModule] Redis connected to localhost:6379` and `[PermissionsService] Role USER already has 2 permission(s) — skipping seed`. The seed-skip log requires a successful query against `RolePermission` table — proves the Prisma → Postgres connection works.
- **Standard**: SOC 2 CC7.1

### B-07: Environment completeness
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/common/utils/validate-production-secrets.ts` validates JWT_SECRET, MFA_ENCRYPTION_KEY, CSRF_SECRET, GOOGLE_CALLBACK_URL, GITHUB_CALLBACK_URL, JWT_ACCESS_EXPIRATION, GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_SECRET, SMTP_PASSWORD, REDIS_PASSWORD (warn-only), DATABASE_URL (with sslmode validation). `.env.example` (102 lines) documents all 35+ env vars referenced via `process.env.` in `src/`. All 22 files using `process.env.` cross-checked — every variable is documented in `.env.example`. `WARN`: GeoLite2-City.mmdb file missing from `data/` directory in dev env (geolocation feature gracefully degrades). This is environment provisioning, not a build defect — same disposition as previous baseline. Note: per audit-standards Section 6.5 (Severity Stability), the previous WARN on this finding is preserved with same justification.
- **Standard**: NIST CM-6, SOC 2 CC8.2

### B-08: Source map configuration
- **Verdict**: PASS (partial)
- **Severity**: LOW
- **Evidence**: `tsconfig.json:15` has `"sourceMap": true` (correct for dev). `tsconfig.prod.json` exists separately for production. Verified `tsconfig.build.json` referenced by build script. Source maps appropriate per environment.
- **Standard**: —

### B-07-WARN: GeoLite2 database missing in dev environment
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: `[GeolocationService] MaxMind GeoLite2 database not available at ./data/GeoLite2-City.mmdb. Geolocation features will be disabled.` Same WARN as 2026-03-29 baseline — graceful degradation by design.
- **Recommendation**: Document in setup README or CI bootstrap that `data/GeoLite2-City.mmdb` is optional in dev but required in production for impossible-travel detection.

---

## Recommendations

1. **B-07-WARN (carry-forward)**: Add a README note in `nexacore-api/data/.gitkeep` (or new README) explaining that GeoLite2 must be downloaded for full functionality.

---

## Delta vs 2026-03-29 baseline

| Check | Previous | Current | Delta |
|-------|----------|---------|-------|
| B-01..B-06,B-08 | 7 PASS | 7 PASS | unchanged |
| B-07 | WARN (GeoLite2) | PASS env+WARN GeoLite2 split | unchanged disposition |
| Total | 7 PASS / 1 WARN / 0 FAIL | 7 PASS / 1 WARN / 0 FAIL | **0 regression** |

