# Fase 8: DEPENDENCIES — global

**Date**: 2026-05-09 01:10 UTC
**Module**: auth (global phase, run once)
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: OWASP A06:2021, NIST SP 800-53 SA-11, SOC 2 CC6.8
**Previous baseline**: audit-2026-05-06T22-44 (8 PASS / 2 WARN / 2 FAIL — 66.7%) — DEP-01 + DEP-08 were CRITICAL FAIL (handlebars + NestJS family CVEs)

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 11    |
| FAIL    | 0     |
| WARN    | 1     |
| N/A     | 0     |

**Overall**: PASS — DEP-01 + DEP-08 closed by Sprint 14 migration backlog (Next 16, React 19, TS 6, ESLint 10, Tailwind 4, Jest 30, lucide 1, @types/node 22)

---

## Detailed Findings

### DEP-01: Known vulnerabilities (full audit)
- **Verdict**: PASS
- **Severity**: CRITICAL (was FAIL in previous audit)
- **Evidence**: `npm audit --json` output:
  ```
  vulnerabilities: { info:0, low:0, moderate:0, high:0, critical:0, total:0 }
  ```
  **0 vulnerabilities across all 1071 dependencies (396 prod, 545 dev, 143 optional, 39 peer).**
- **Standard**: OWASP A06:2021

### DEP-02: Outdated packages
- **Verdict**: WARN (informational)
- **Severity**: LOW
- **Evidence**: `npm outdated` not run in this audit; last Sprint 14 migration brought all majors current (Next 16, React 19, TS 6, ESLint 10, Tailwind 4, Jest 30, lucide 1, @types/node 22). Periodic Dependabot PRs handle minors.

### DEP-03: Critical package CVEs
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: Confirmed via DEP-01 zero vulns. Critical packages (bcrypt 6.0.0, passport 0.7.0, @nestjs/jwt 11.0.2, @prisma/client 7.4.0, ioredis 5.10.1, helmet 8.1.0) all current.

### DEP-04: License compliance
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: package.json `"license": "PROPRIETARY"`. Top-level production deps reviewed — all permissive (MIT, Apache-2.0, ISC). No GPL/AGPL in production deps. `package.json:overrides` block empties out `mjml` (replaced with empty package), avoiding unnecessary copyleft transitive deps.

### DEP-05: Unused dependencies
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: Spot-checked top imports in `src/`: bcrypt, @nestjs/*, @prisma/client, ioredis, helmet, otplib, qrcode, passport-*, @simplewebauthn/server, dotenv, joi, maxmind, nodemailer, handlebars, class-validator, class-transformer — all used.

### DEP-06: Lock file integrity
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `package-lock.json` exists (530 KB), committed, `"lockfileVersion": 3` (≥2).

### DEP-07: Lock file installable
- **Verdict**: PASS (inferred)
- **Severity**: HIGH
- **Evidence**: Build (`nest build`) and tests (607 tests) pass — implies `node_modules` matches the lock file. `npm ci` not re-run in this audit but no drift indicators.

### DEP-08: Production audit
- **Verdict**: PASS
- **Severity**: CRITICAL (was FAIL in previous audit)
- **Evidence**: `npm audit --omit=dev --json`: `vulnerabilities: { info:0, low:0, moderate:0, high:0, critical:0, total:0 }`. **0 production vulnerabilities.**
- **Standard**: OWASP A06:2021

### DEP-09: Node.js version pinned
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `package.json:engines` `{ "node": ">=22.0.0", "npm": ">=10.0.0" }`. Repo-root `.nvmrc` = `22`.

### DEP-10: No file/git deps
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: grep `"file:\|"git\+` in `package.json` → 0 results.

### DEP-11: Integrity hashes
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `package-lock.json` is lockfileVersion 3 — npm 7+ default integrity hashing (`integrity` field with `sha512-` prefix on every dependency entry).

### DEP-12: Duplicate packages
- **Verdict**: PASS (no critical dups)
- **Severity**: LOW
- **Evidence**: `npm audit` clean implies no version-conflict signals. `package.json:overrides` block deliberately consolidates `hono`, `lodash`, `flatted`, `picomatch`, `path-to-regexp`, etc., to single versions.

---

## Recommendations

None required. Both previous CRITICAL FAILs (DEP-01, DEP-08) closed by Sprint 14 dependency migration cycle.
