# Fase 8: DEPENDENCIES — Global

**Date**: 2026-03-15 21:45 UTC
**Module**: global (nexacore-api)
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: SOC 2 CC6.1 (Vulnerability Management), NIST SP 800-53 SI-2

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 8     |
| FAIL    | 0     |
| WARN    | 4     |
| N/A     | 0     |

**Overall**: PASS

---

## Detailed Findings

### DEP-01: npm audit (production)
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `npm audit --omit=dev` → **0 vulnerabilities**. Zero critical, high, moderate, or low vulnerabilities in production dependencies.
- **Standard**: SOC 2 CC6.1

### DEP-02: npm audit (all)
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: `npm audit` → **6 moderate severity vulnerabilities**, all in devDependencies chain: `@angular-devkit/core` → `@angular-devkit/schematics` → `@angular-devkit/schematics-cli` → `@nestjs/cli` → `@nestjs/schematics`. These are CLI/build tools only, not shipped to production.

### DEP-03: Critical/high vulns in prod deps
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `npm audit --omit=dev` returns 0 vulnerabilities. No critical or high severity issues in production dependency tree.

### DEP-04: Outdated packages
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: `npm outdated` shows 6 packages with major version updates available (all devDependencies): `@eslint/js` (9→10), `@types/node` (22→25), `@types/supertest` (6→7), `eslint` (9→10), `eslint-plugin-security` (3→4), `globals` (16→17). All are at their latest minor/patch within current major range. No production packages outdated.

### DEP-05: Node.js version pinned
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `.nvmrc` = `22`. `package.json` engines: `"node": ">=22.0.0"`, `"npm": ">=10.0.0"`. CI workflow (`security.yml:22`): `NODE_VERSION: '22'`. All aligned.

### DEP-06: Lock file exists
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `package-lock.json` present, lockfileVersion 3 (npm 7+ format). No `file:` or `git:` protocol dependencies. All packages resolve from `registry.npmjs.org`.

### DEP-07: npm ci vs npm install
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: All CI workflows use `npm ci`: `security.yml` (lines 66, 131, 229, 299), `weekly-audit.yml` (line 46). SCRUM-235 remediation already applied in code.

### DEP-08: Dev-only security tools
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `eslint-plugin-security` (^3.0.1) in devDependencies. All `@types/*` packages in devDependencies. `prisma` CLI in devDependencies, `@prisma/client` in production. `jest`, `ts-jest`, `supertest`, `@nestjs/testing` all correctly in devDependencies.

### DEP-09: No unused dependencies
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: All 30 production dependencies verified as used via import analysis. `handlebars` is a peer dependency of `@nestjs-modules/mailer` (HandlebarsAdapter). `dotenv` used in `main.ts` line 1 (`import 'dotenv/config'`). No truly unused production dependencies found.

### DEP-10: License compliance
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `weekly-audit.yml:102` enforces license check via `npx license-checker --production --failOn "GPL-2.0;GPL-3.0;AGPL-1.0;AGPL-3.0;SSPL-1.0;EUPL-1.1;EUPL-1.2"`. All production deps use MIT, Apache-2.0, ISC, or BSD-family licenses. Note: `@scarf/scarf` (Apache-2.0, compliant) pulled transitively by `swagger-ui-dist` runs telemetry postinstall script.

### DEP-11: Dependency pinning
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: All direct deps use caret ranges (`^`). `package-lock.json` pins exact resolved versions. `npm ci` in CI ensures reproducible builds. No Dependabot/Renovate configured — updates rely on manual weekly audit workflow. Notable security overrides in `package.json:101-108`: `lodash>=4.17.22`, `glob^10.5.0`, `mjml→empty-npm-package`, `file-type>=21.3.1`.

### DEP-12: Supply chain
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: 7 packages with `hasInstallScript: true`: `@nestjs/core` (opencollective funding), `@prisma/engines` (binary download), `@scarf/scarf` (telemetry — phones home to scarf.sh), `bcrypt` (node-gyp native build), `fsevents` (macOS optional), `prisma` (binary download), `unrs-resolver` (napi binary). `@scarf/scarf` is the only privacy concern — telemetry can be disabled with `SCARF_ANALYTICS=false` in `.npmrc`.

---

## Recommendations

1. **DEP-02 (WARN)**: 6 moderate devDep vulnerabilities in `@angular-devkit` chain via `@nestjs/cli`. Monitor for `@nestjs/cli` update that resolves this. No production impact.
2. **DEP-11 (WARN)**: Consider adding `.github/dependabot.yml` for automated security patch PRs.
3. **DEP-12 (WARN)**: Add `SCARF_ANALYTICS=false` to `.npmrc` to suppress `@scarf/scarf` install telemetry.
4. **DEP-05 (INFO)**: Consider tightening `engines.node` from `>=22.0.0` to `^22.0.0` to restrict to Node 22 LTS major only.
