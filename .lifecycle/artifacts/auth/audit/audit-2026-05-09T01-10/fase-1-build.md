# Fase 1: BUILD — global

**Date**: 2026-05-09 01:10 UTC
**Module**: auth (global phase, run once)
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: SOC 2 CC7.1, CC8.2, CC8.3, NIST CM-6
**Previous baseline**: audit-2026-05-06T22-44 (7 PASS / 1 WARN / 0 FAIL — 87.5%)

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 7     |
| FAIL    | 0     |
| WARN    | 1     |
| N/A     | 0     |

**Overall**: PASS (no FAIL)

---

## Detailed Findings

### B-01: TypeScript compilation
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `npx nest build` exit code 0; `dist/` populated with `main.js`, `auth/`, `common/`, etc.
- **Standard**: SOC 2 CC8.3

### B-02: Module bootstrap
- **Verdict**: PASS (inferred)
- **Severity**: CRITICAL
- **Evidence**: Build succeeds with 0 DI errors; auth.module.ts (`em-ecosystem-code/nexacore-api/src/auth/auth.module.ts`) declares all imports/exports cleanly. Tests bootstrap full module graph (43 suites, 607 tests passing) — implies no DI failures.
- **Standard**: SOC 2 CC7.1

### B-03: Route count
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Counted 39 controller routes in `src/auth/**/*.controller.ts`. api-spec.yml lists 39 `/auth/*`, `/mfa/*`, `/passkeys/*` paths. Counts match.
- **Standard**: SOC 2 CC8.1

### B-04: Deprecation warnings
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: tsconfig.json:18 has `"ignoreDeprecations": "6.0"` for TS6→TS6 compatibility lints; build output produced no deprecation warnings.
- **Standard**: NIST CM-6

### B-05: Build output structure
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `nexacore-api/dist/main.js` present, plus full module subtree (auth/, common/, config/, etc.)
- **Standard**: SOC 2 CC8.2

### B-06: Database connectivity
- **Verdict**: WARN
- **Severity**: CRITICAL (severity unchanged from previous)
- **Evidence**: Could not invoke a live `prisma db execute` in audit harness (sandbox without DB). Migrations directory has 22 versioned folders (`prisma/migrations/`) and `prisma/schema.prisma:6` defines a postgresql datasource — tests pass against the test DB during the test run, indicating connectivity in dev. Production DB-availability is verified by deployment smoke tests, not by the audit harness.
- **Standard**: SOC 2 CC7.1
- **Note**: Carry-forward from previous audit; same justification.

### B-07: Environment completeness
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/common/utils/validate-production-secrets.ts:1-150` validates JWT_SECRET, MFA_ENCRYPTION_KEY, CSRF_SECRET, OAuth callback URLs (HTTPS), JWT_ACCESS_EXPIRATION (≤15min), GOOGLE/GITHUB_CLIENT_SECRET, SMTP_PASSWORD, DATABASE_URL (sslmode required). REDIS_PASSWORD warns but does not block. .env.example aligns with documented vars.
- **Standard**: NIST CM-6, SOC 2 CC8.2

### B-08: Source map configuration
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: `tsconfig.json:13` sets `"sourceMap": true`. `tsconfig.prod.json` (separate prod compile target) handles production map exclusion. Tests run with maps enabled.
- **Standard**: —

---

## Recommendations

1. **B-06 WARN** (carry-forward): Add a docker-compose-based DB liveness probe to the audit harness so future audits can issue `SELECT 1` against a real Postgres rather than infer connectivity from migrations + tests.
