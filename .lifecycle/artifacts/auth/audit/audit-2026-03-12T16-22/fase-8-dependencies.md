# Fase 8: DEPENDENCIES — Global

**Date**: 2026-03-12 16:22 UTC
**Module**: global
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: OWASP A06:2021, NIST SP 800-53 SA-11, SOC 2 CC6.8

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 7     |
| FAIL    | 2     |
| WARN    | 2     |
| N/A     | 1     |

**Overall**: FAIL

---

## Detailed Findings

### DEP-01: Known vulnerabilities
- **Verdict**: FAIL
- **Severity**: CRITICAL
- **Evidence**: `npm audit` output: 53 vulnerabilities (13 moderate, 40 high)
- **Expected**: 0 critical, 0 high
- **Actual**: 0 critical, 40 high, 13 moderate. Key high-severity: `@hono/node-server` (auth bypass), `glob` (command injection), `hono` (9 advisories), `html-minifier` (ReDoS), `liquidjs` (path traversal), `multer` (DoS via recursion)
- **Standard**: OWASP A06:2021

### DEP-02: Outdated packages
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: `npm outdated` shows 20 packages with available updates
- **Actual**: Notable: @nestjs/* 11.1.15→11.1.16, @prisma/client 7.4.2→7.5.0, jest 30.2.0→30.3.0, class-validator 0.14.4→0.15.1
- **Standard**: NIST SA-11

### DEP-03: Critical package CVEs
- **Verdict**: WARN
- **Severity**: CRITICAL
- **Evidence**: `npm audit` output filtered for critical packages
- **Actual**: bcrypt — clean. passport — clean. @nestjs/jwt — clean. @prisma/client — clean (but prisma CLI has transitive hono/lodash). ioredis — clean. helmet — clean. `multer` (via @nestjs/platform-express) has HIGH DoS advisory GHSA-5528-5vmv-3xc2
- **Standard**: OWASP A06:2021

### DEP-04: License compliance
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: package.json dependencies reviewed — all MIT/Apache-2.0/ISC/BSD
- **Expected**: 0 copyleft (GPL/AGPL) in production deps
- **Standard**: Legal compliance

### DEP-05: Unused dependencies
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: Spot-checked major deps: all referenced in src/ imports
- **Standard**: Attack surface reduction

### DEP-06: Lock file integrity
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `package-lock.json` exists, lockfileVersion: 3, committed to git
- **Standard**: NIST SA-11

### DEP-07: Lock file installable
- **Verdict**: N/A
- **Severity**: HIGH
- **Evidence**: Skipped — `npm ci` modifies node_modules (destructive in audit context)
- **Standard**: Supply chain security

### DEP-08: Production audit
- **Verdict**: FAIL
- **Severity**: CRITICAL
- **Evidence**: `npm audit --omit=dev`: 47 vulnerabilities (7 moderate, 40 high)
- **Expected**: 0 critical, 0 high in production deps
- **Actual**: 40 high vulnerabilities in production deps — mostly transitive via `@hono/node-server` (prisma), `hono`, `glob` (mailer), `html-minifier` (mjml/mailer), `multer` (@nestjs/platform-express), `liquidjs`, `lodash` (chevrotain/prisma)
- **Standard**: OWASP A06:2021

### DEP-09: Node.js version pinned
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `package.json` engines: `{"node":">=22.0.0","npm":">=10.0.0"}`, `.nvmrc`: `22`
- **Standard**: SOC 2 CC8.2

### DEP-10: No file/git dependencies
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: grep of package.json: "No file/git dependencies found"
- **Standard**: Supply chain security

### DEP-11: Integrity hashes
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: 1,156 `sha512-` integrity hashes in package-lock.json
- **Standard**: NIST SA-11

### DEP-12: Duplicate packages
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: No critical duplicates detected in direct dependencies
- **Standard**: Bundle size / attack surface

---

## Recommendations

1. **DEP-01/DEP-08 (CRITICAL)**: Run `npm audit fix` to address non-breaking fixes (multer, hono, liquidjs, file-type). For breaking changes (prisma, @nestjs-modules/mailer, @nestjs/schematics), evaluate and update in a dedicated ticket. Most high-severity vulnerabilities are in transitive dependencies of `@nestjs-modules/mailer` (mjml/html-minifier) and `prisma` (hono/@hono/node-server).
2. **DEP-03 (WARN)**: Update `@nestjs/platform-express` to get multer fix. Monitor prisma for hono/lodash transitive fix.
3. **DEP-02 (INFO)**: Consider updating @nestjs/* to 11.1.16, @prisma/client to 7.5.0, jest to 30.3.0 in next maintenance window.
