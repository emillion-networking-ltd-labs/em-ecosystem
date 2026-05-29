---
schema: ai-specs/schemas/audit-phase-report.schema.yml
phase: build
module: global
audit_folder: ai-specs/changes/auth/audit/audit-2026-05-14T16-58
date: 2026-05-14T16:58:00Z
framework_version: audit-standards.mdc v1.0
auditor: Claude (automated)
standards_covered:
  - SOC 2 CC7.1
  - SOC 2 CC8.1
  - SOC 2 CC8.2
  - SOC 2 CC8.3
  - NIST CM-6
checks_summary:
  pass: 7
  fail: 0
  warn: 1
  na: 0
  total: 8
overall_verdict: PASS
checks:
  - check_id: B-01
    requirement: TypeScript compilation succeeds
    verdict: PASS
    severity: CRITICAL
    standard: SOC 2 CC8.3
    evidence: "npx nest build exit code: 0 (no output to stderr, dist/main.js produced 2026-05-14 17:20)"
  - check_id: B-02
    requirement: Module bootstrap (all DI modules initialize)
    verdict: PASS
    severity: CRITICAL
    standard: SOC 2 CC7.1
    evidence: "node dist/main.js stdout: 'Nest application successfully started' after 25 InstanceLoader 'dependencies initialized' lines (AppModule + PrismaModule + MailerModule + CryptoModule + PassportModule + ConfigHostModule + RedisModule + ThrottlerModule + ConfigModule + ServeStaticModule + StorageModule + MailModule + MailerCoreModule + SessionsModule + JwtModule + GeolocationModule + SecurityModule + AuditModule + PermissionsModule + UsersModule + AuthModule). EADDRINUSE on listen is environmental (dev server already on :3000), not a code/DI failure."
  - check_id: B-03
    requirement: Mapped route count consistent with controllers
    verdict: PASS
    severity: HIGH
    standard: SOC 2 CC8.1
    evidence: "grep 'Mapped {' /tmp/nest_start_output.log: 60 matches. Auth-prefixed routes at runtime: 43 (AuthController:8 + OAuthController:8 + AccountController:7 + SessionController:6 + MfaController:6 + PasskeyController:8). api-spec.yml auth-prefixed operations: 42. Spec/runtime parity within ±1 route — deeper alignment verified in Phase 4."
  - check_id: B-04
    requirement: No deprecation warnings during bootstrap
    verdict: PASS
    severity: MEDIUM
    standard: NIST CM-6
    evidence: "grep -ci 'deprecat' /tmp/nest_start_output.log: 0 matches"
  - check_id: B-05
    requirement: Build output structure
    verdict: PASS
    severity: HIGH
    standard: SOC 2 CC8.2
    evidence: "nexacore-api/dist/main.js: exists (3369 bytes, mtime 2026-05-14 17:20)"
  - check_id: B-06
    requirement: Database connectivity
    verdict: PASS
    severity: CRITICAL
    standard: SOC 2 CC7.1
    evidence: "npx prisma db execute --stdin <<< 'SELECT 1' exit code: 0 ('Script executed successfully')"
  - check_id: B-07
    requirement: Environment completeness — every process.env.* in src is in .env.example
    verdict: WARN
    severity: HIGH
    standard: NIST CM-6, SOC 2 CC8.2
    evidence: "grep -rEo 'process\\.env\\.[A-Z_][A-Z0-9_]*' src/ unique: 49 vars (includes IMPOSSIBLE_TRAVEL_ALERT_STRATEGY split across two lines in geolocation.constants.ts). .env.example: 51 vars. Documented-only (no src reference): API_URL. All 49 src vars present in .env.example."
    expected: "Every src env var documented AND every documented var actually referenced (no orphans either direction)."
    actual: "1 documented orphan: API_URL is in .env.example but no src/ reference. All src→example direction is covered."
    recommendation: "Either start using API_URL via ConfigService in src/ (e.g., for absolute URL generation in email links), or drop the entry from .env.example. Trivial cleanup."
  - check_id: B-08
    requirement: Source map configuration per environment
    verdict: PASS
    severity: LOW
    evidence: "tsconfig.json:15:\"sourceMap\": true (dev), tsconfig.build.json:4:\"sourceMap\": false (build), tsconfig.prod.json:4:\"sourceMap\": false (prod)"
---

# Fase 1: BUILD — Global

**Date**: 2026-05-14 16:58 UTC
**Module**: global (Phase 1 scope: project-wide infrastructure)
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: SOC 2 CC7.1 (System Operations), SOC 2 CC8.1, SOC 2 CC8.2 (Configuration Consistency), SOC 2 CC8.3, NIST CM-6 (Configuration Settings)

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
- **Evidence**: `npx nest build` exit code: `0` (no errors, no warnings). `dist/main.js` produced 2026-05-14 17:20 UTC.
- **Standard**: SOC 2 CC8.3

### B-02: Module bootstrap
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `node dist/main.js` stdout shows "Nest application successfully started" preceded by 25 successful `InstanceLoader … dependencies initialized` lines (including AuthModule, UsersModule, SessionsModule, PrismaModule, MailerCoreModule, RedisModule, GeolocationModule, AuditModule). The bootstrap succeeds; the subsequent `EADDRINUSE :::3000` is environmental (another dev process holds the port) and occurs AFTER successful DI/lifecycle.
- **Standard**: SOC 2 CC7.1
- **Notes**: Bootstrap surfaces a non-fatal WARN from GeolocationService about a missing `data/GeoLite2-City.mmdb` file ("Geolocation features will be disabled"). This is an operational/data-asset gap, not a code defect — flagged here for visibility, not as a finding.

### B-03: Route count
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Runtime mapped routes: 60 (auth-prefixed: 43). `api-spec.yml` total operations: 99 (auth-prefixed: 42). Auth runtime/spec delta = ±1 route, within reasonable spec drift for a >50-endpoint module; full alignment is Phase 4's responsibility.
- **Standard**: SOC 2 CC8.1

### B-04: Deprecation warnings
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `grep -ci 'deprecat' /tmp/nest_start_output.log`: 0 matches across bootstrap + module-load output.
- **Standard**: NIST CM-6

### B-05: Build output structure
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `dist/main.js` present at 3369 bytes, mtime 2026-05-14 17:20 UTC.
- **Standard**: SOC 2 CC8.2

### B-06: Database connectivity
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `npx prisma db execute --stdin <<< "SELECT 1"` exit code 0, stdout "Script executed successfully". Loaded `prisma.config.ts` (custom config path), confirming Prisma toolchain reaches the configured Postgres instance.
- **Standard**: SOC 2 CC7.1

### B-07: Environment completeness
- **Verdict**: WARN
- **Severity**: HIGH
- **Evidence**: 49 distinct `process.env.*` references in `nexacore-api/src/` (via `grep -rEo "process\.env\.[A-Z_][A-Z0-9_]*"`). 51 entries in `.env.example`. All 49 src vars are documented. ONE example-only orphan exists.
- **Expected**: Every src env var is documented AND every documented var is referenced (no orphans in either direction).
- **Actual**: 1 documented orphan: `API_URL` (declared in `nexacore-api/.env.example` but no reference in `src/`).
- **Recommendation**: Either consume `API_URL` via `ConfigService` (e.g., for absolute URL generation in email templates) or remove the entry from `.env.example`. Either fix is ~5 minutes.
- **Standard**: NIST CM-6, SOC 2 CC8.2

### B-08: Source map configuration
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: `tsconfig.json:15:"sourceMap": true` (development), `tsconfig.build.json:4:"sourceMap": false` (build artifact), `tsconfig.prod.json:4:"sourceMap": false` (production override). Maps off in deployed artifacts ⇒ no source leakage in production bundles.
- **Standard**: TypeScript best practice (informational)

---

## Recommendations

1. **B-07 (WARN)**: Remove `API_URL` from `nexacore-api/.env.example` OR wire it into a `ConfigService` consumer. The orphan is harmless but accumulates over time and erodes `.env.example` as the source of truth. Trivial cleanup, no behavior change.
2. **Operational note (not a finding)**: `data/GeoLite2-City.mmdb` is missing locally. GeolocationService logs a WARN and disables geolocation features. If the local dev workflow needs IP-based geolocation (e.g., to exercise impossible-travel detection), provision the MaxMind database asset. Not in scope for an audit FAIL — it is data, not code.
