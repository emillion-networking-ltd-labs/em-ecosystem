# Fase 8: DEPENDENCIES — Global

**Date**: 2026-03-03 16:50
**Module**: global
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: npm audit, OWASP Dependency-Check

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 3     |
| FAIL    | 1     |
| WARN    | 1     |
| N/A     | 0     |

**Overall**: FAIL (npm audit HIGH vulnerabilities)

---

## Detailed Findings

### DEP-01: Known Vulnerabilities
- **Verdict**: FAIL | **Severity**: HIGH
- **Evidence**: `npm audit` — 53 vulnerabilities: 0 critical, **39 high**, 14 moderate, 0 low
- **Production-affecting**:
  | Package | Severity | Issue | Fix |
  |---------|----------|-------|-----|
  | `@nestjs/platform-express` via multer | HIGH | DoS via incomplete cleanup (GHSA-xf7r-hgr6-v32p) + resource exhaustion (GHSA-v52c-386h-88mc) | `npm audit fix` → multer >=2.1.0 |
  | `@nestjs-modules/mailer` via mjml | HIGH | Directory traversal in mj-include (GHSA-45h5-66jx-r2wf) | Breaking: requires major version change |
  | `@nestjs-modules/mailer` via glob | HIGH | Command injection with shell:true (GHSA-5j98-mcp5-4vw2) | Breaking: requires major version change |
- **Dev-only** (14 moderate): ajv ReDoS, lodash prototype pollution, hono XSS/cache, minimatch ReDoS, serialize-javascript RCE — all in devDependencies chain

### DEP-02: Outdated Packages
- **Verdict**: WARN | **Severity**: MEDIUM
- **Evidence**: 17 packages with available updates:
  | Package | Current | Latest | Priority |
  |---------|---------|--------|----------|
  | @nestjs/platform-express | 11.1.14 | 11.1.15 | **HIGH** (fixes multer vuln) |
  | @nestjs/common | 11.1.14 | 11.1.15 | Medium |
  | @nestjs/core | 11.1.14 | 11.1.15 | Medium |
  | @prisma/client | 7.4.0 | 7.4.2 | Low |
  | class-validator | 0.14.3 | 0.15.1 | Low |
  | pg | 8.18.0 | 8.19.0 | Low |

### DEP-03: Critical Security Package CVEs
- **Verdict**: PASS
- **Evidence**: All 6 critical security packages are clean:
  | Package | Version | Status |
  |---------|---------|--------|
  | bcrypt | ^6.0.0 | CLEAN |
  | passport | ^0.7.0 | CLEAN |
  | @nestjs/jwt | ^11.0.2 | CLEAN |
  | @prisma/client | ^7.4.0 | CLEAN |
  | ioredis | ^5.10.0 | CLEAN |
  | helmet | ^8.1.0 | CLEAN |

### DEP-04: License Compliance
- **Verdict**: PASS
- **Evidence**: All 30 production dependencies use permissive licenses: MIT (26), Apache-2.0 (3), MIT-0 (1). No GPL/AGPL/copyleft in production dependencies.

### DEP-05: Unused Dependencies
- **Verdict**: PASS
- **Evidence**: No phantom dependencies. All 30 production packages serve a runtime purpose — either as direct imports, implicit framework adapters (passport, handlebars), or required peer dependencies (rxjs, pg, nodemailer, reflect-metadata).
- **Reclassified**: WARN → PASS (no unused dependencies found — original WARN was informational, not a finding).

---

## Recommendations

### Immediate (HIGH priority)
1. **Run `npm audit fix`** — resolves multer DoS vulnerabilities by upgrading @nestjs/platform-express to 11.1.15 (non-breaking).
2. **Evaluate `@nestjs-modules/mailer` vulnerability** — MJML directory traversal is only exploitable if user-controlled input reaches mj-include paths. If templates are static (they are), risk is lower. Schedule migration to patched version in next sprint.

### Short-term
3. **Run `npm update`** — patch all production deps to latest wanted versions.
4. **Monitor `serialize-javascript` RCE** in dev chain — affects CI/CD build security.
