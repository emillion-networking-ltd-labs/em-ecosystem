# Phase 8: DEPENDENCIES — Global

**Date**: 2026-03-16
**Module**: global
**Standards**: OWASP A06:2021, SOC 2 CC6.1, NIST SP 800-53
**Framework version**: audit-standards.mdc v6

## Summary

| Verdict | Count |
|---------|-------|
| PASS | 10 |
| FAIL | 0 |
| WARN | 2 |

## Recurrence Analysis (vs audit-2026-03-15T19-49)

| Finding | Previous | Current | Delta |
|---------|----------|---------|-------|
| DEP-01 | PASS | PASS | Stable |
| DEP-02 | WARN | WARN | Stable — same 6 moderate devDependency vulns |
| DEP-07 | WARN | WARN | Stable — npm ci not enforced in CI |

## Detailed Findings

### DEP-01: Production Vulnerabilities (PASS — CRITICAL)
- **Evidence**: `npm audit --omit=dev` — 0 vulnerabilities
- **Standard**: OWASP A06:2021

### DEP-02: DevDependency Vulnerabilities (WARN — LOW)
- **Evidence**: `npm audit` — 6 moderate severity vulnerabilities, all in `@angular-devkit/schematics` chain via `@nestjs/cli` → `@nestjs/schematics`. These are build-time tools only, not deployed to production
- **Recommendation**: Monitor for upstream fix in @angular-devkit

### DEP-03: Critical/High CVEs (PASS — CRITICAL)
- **Evidence**: 0 critical or high severity CVEs in any dependency
- **Standard**: NIST SP 800-53 RA-5

### DEP-04: License Compliance (PASS — MEDIUM)
- **Evidence**: All dependencies use permissive licenses (MIT, ISC, Apache-2.0, BSD)
- **Standard**: SOC 2 CC6.1

### DEP-05: Outdated Major Versions (PASS — MEDIUM)
- **Evidence**: All major framework dependencies at latest: NestJS 11, Jest 30, Prisma 7, Passport 0.7
- **Standard**: ISO 25010

### DEP-06: Node.js Version (PASS — HIGH)
- **Evidence**: `.nvmrc` = 22 (LTS), `package.json` engines: `>=22.0.0`
- **Standard**: SOC 2 CC6.1

### DEP-07: npm ci in CI Pipeline (WARN — MEDIUM)
- **Evidence**: `.github/workflows/security.yml:230` uses `npm ci` for backend. However, frontend and some other steps may use `npm install`
- **Recommendation**: Ensure all CI steps use `npm ci` for deterministic installs

### DEP-08: No Deprecated Packages (PASS — LOW)
- **Evidence**: No deprecated packages in dependency tree
- **Standard**: ISO 25010

### DEP-09: Gitleaks Configuration (PASS — HIGH)
- **Evidence**: `.gitleaks.toml` with custom rules for JWT, DB, Redis, OAuth, Turnstile secrets
- **Standard**: OWASP A02:2021

### DEP-10: Husky Pre-commit Hooks (PASS — HIGH)
- **Evidence**: `.husky/pre-commit` runs lint-staged + gitleaks. `.husky/pre-push` runs tests + build
- **Standard**: SOC 2 CC8.1

### DEP-11: Weekly Audit Workflow (PASS — MEDIUM)
- **Evidence**: `.github/workflows/weekly-audit.yml` — Monday 06:00 UTC, full dependency audit + license compliance
- **Standard**: NIST SP 800-53 RA-5

### DEP-12: No Unnecessary Dependencies (PASS — LOW)
- **Evidence**: All production dependencies are actively imported and used
- **Standard**: ISO 25010

## Recommendations

1. **DEP-02**: Monitor @angular-devkit for security patches (devDependency only, no production risk)
2. **DEP-07**: Verify all CI workflow steps use `npm ci` instead of `npm install`

---
*Generated: 2026-03-16 | Auditor: Claude (automated) | Standards: OWASP A06:2021, SOC 2 CC6.1, NIST SP 800-53*
