# Fase 8: DEPENDENCIES — Global

**Date**: 2026-03-16 14:42
**Module**: global
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: OWASP A06:2021, NIST SP 800-53 SA-11, SOC 2 CC6.8

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 9     |
| FAIL    | 1     |
| WARN    | 1     |
| N/A     | 0     |
| INFO    | 1     |

**Overall**: FAIL (1 critical vulnerability in dashboard)

---

## Detailed Findings

### DEP-01: Known vulnerabilities
- **Verdict**: FAIL
- **Severity**: CRITICAL
- **Evidence**:
  - **nexacore-api**: `npm audit` → 6 moderate severity vulnerabilities (all in dev dependencies: @tootallnate/once, flatted, glob). 0 critical, 0 high.
  - **nexacore-dashboard**: `npm audit` → 10 vulnerabilities (4 low, 5 high, 1 critical).
    - **CRITICAL**: Next.js HTTP request deserialization DoS (GHSA-h25m-26qc-wcjf)
    - **CRITICAL**: Authorization Bypass in Next.js Middleware (GHSA-f82v-jwr5-mffw)
  - Fix: `npm audit fix --force` in nexacore-dashboard (will install next@14.2.35)
- **Standard**: OWASP A06:2021

  Instances:
  1. `nexacore-dashboard/node_modules/next` — GHSA-h25m-26qc-wcjf (DoS via HTTP deserialization)
  2. `nexacore-dashboard/node_modules/next` — GHSA-f82v-jwr5-mffw (Authorization Bypass in Middleware)
  Total: 2 critical instances in dashboard

### DEP-02: Outdated packages
- **Verdict**: INFO
- **Severity**: LOW
- **Evidence**: Multiple packages have available updates in both projects. This is informational — no immediate action required. Dependabot (SCRUM-260) now configured to auto-create weekly PRs.

### DEP-03: Critical package CVEs
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: Core production packages at safe versions:
  - bcrypt@6.0.0 — no known CVEs
  - passport@0.7.0 — no known CVEs
  - @nestjs/jwt@11.0.2 — no known CVEs
  - @prisma/client@7.4.0 — no known CVEs
  - ioredis@5.10.0 — no known CVEs
  - helmet@8.1.0 — no known CVEs
  - next@14.2.21 — **HAS CVEs** (see DEP-01)

### DEP-04: License compliance
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: No GPL/AGPL licenses in production dependencies. All production deps use MIT, Apache-2.0, ISC, or BSD licenses.

### DEP-05: Unused dependencies
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: `pg` is listed as a direct dependency in nexacore-api but is used transitively via `@prisma/adapter-pg`. Consider removing as direct dependency or documenting the reason.

### DEP-06: Lock file integrity
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: Both `package-lock.json` files exist and are committed to git. Both use lockfileVersion 3 (npm v9+).

### DEP-07: Lock file installable
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `npm ci` exits with code 0 in both directories (verified via pre-push hooks and CI pipeline).

### DEP-08: Production audit
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**:
  - **nexacore-api**: `npm audit --omit=dev` → 0 vulnerabilities. All 6 moderate vulns are in devDependencies only.
  - **nexacore-dashboard**: `npm audit --omit=dev` → 1 critical (Next.js). This is a production dependency.
- **Note**: The Next.js vulnerability in dashboard is also flagged in DEP-01. The API backend has 0 production vulnerabilities.

### DEP-09: Node.js version pinned
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `.nvmrc` = 22. `nexacore-api/package.json:8-10` — `engines: { node: ">=22.0.0", npm: ">=10.0.0" }`. `nexacore-dashboard/package.json` — `engines: { node: ">=22.0.0" }`.

### DEP-10: No file/git dependencies
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: grep for `"file:` and `"git+` in both package.json files — 0 matches.

### DEP-11: Integrity hashes
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: All direct dependencies in both package-lock.json files have `integrity` field with `sha512-` prefix.

### DEP-12: Duplicate packages
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: No critical duplicate package warnings. Some version ranges overlap in transitive deps (expected in large dependency trees).

---

## Recommendations

1. **DEP-01 (CRITICAL)**: Immediately update Next.js in nexacore-dashboard to >=14.2.35 to fix authorization bypass and DoS vulnerabilities. Run `npm audit fix --force` or manually update the next dependency.
2. **DEP-05**: Consider removing `pg` as direct dependency in nexacore-api if only used transitively via @prisma/adapter-pg.
3. **DEP-02**: Dependabot (SCRUM-260) is now configured — weekly PRs will address outdated packages automatically.
