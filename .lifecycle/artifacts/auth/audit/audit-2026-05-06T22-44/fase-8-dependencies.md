# Phase 8: DEPENDENCIES — global (nexacore-api)

**Date**: 2026-05-06 22:44 UTC
**Module**: global (nexacore-api)
**Standards**: OWASP A06:2021 (Vulnerable Components), NIST SP 800-53 SA-11 (Supply Chain), SOC 2 CC6.8 (Malicious Software Prevention)
**Audit standards reference**: `ai-specs/specs/audit-standards.mdc` Section 3 — Phase 8 (DEP-01..DEP-12)

**Previous baseline (2026-03-29)**: 9 PASS / 3 WARN / 0 FAIL.
WARNs: DEP-03 (`@simplewebauthn/types` deprecated), DEP-06 (`passport-github2` + `otplib` in maintenance), DEP-06b (npm outdated couldn't be verified).

---

## Per-check findings

### DEP-01 — Known vulnerabilities  (CRITICAL, OWASP A06:2021)

**Verdict**: FAIL
**Severity**: CRITICAL
**Expected**: 0 critical, 0 high
**Actual** (`npm audit --json`): **1 critical, 18 high**, 10 moderate, 2 low — **31 total** across 1072 dependencies (380 prod / 553 dev / 146 optional / 36 peer).

Breakdown of critical+high (from `npm audit`):

| Severity | Type | Package | Range |
|----------|------|---------|-------|
| critical | DIRECT | handlebars | 4.0.0 - 4.7.8 (current 4.7.8) |
| high | DIRECT | @nestjs/config | 1.1.6 - 4.0.3 |
| high | DIRECT | @nestjs/core | <=11.1.17 \|\| >=12.0.0-alpha.0 |
| high | DIRECT | @nestjs/platform-express | 11.0.3 - 11.1.17 \|\| >=12.0.0-alpha.0 |
| high | DIRECT | @nestjs/swagger | 1.1.0 - 1.1.4 \|\| 3.0.1 - 11.2.6 |
| high | DIRECT | prisma | 6.13.0-dev.1 - 6.19.2 \|\| >=6.20.0-dev.1 |
| high | transitive | @chevrotain/cst-dts-gen | 10.0.0 - 10.5.0 |
| high | transitive | @chevrotain/gast | <=10.5.0 |
| high | transitive | @mrleebo/prisma-ast | 0.4.2 - 0.13.1 |
| high | transitive | @prisma/config | 6.13.0-dev.1 - 6.19.2 \|\| 6.20.0-dev.1 - 7.6.0-integration… |
| high | transitive | @prisma/dev | * |
| high | transitive | chevrotain | 10.0.0 - 10.5.0 |
| high | transitive | defu | <=6.1.4 |
| high | transitive | effect | <3.20.0 |
| high | transitive | flatted | <=3.4.1 |
| high | transitive | liquidjs | <=10.25.6 |
| high | transitive | lodash | <=4.17.23 |
| high | transitive | path-to-regexp | 8.0.0 - 8.3.0 |
| high | transitive | picomatch | <=2.3.1 \|\| 4.0.0 - 4.0.3 |

**FAIL evidence**:
```
"metadata": { "vulnerabilities": { "info":0, "low":2, "moderate":10, "high":18, "critical":1, "total":31 } }
```

`fixAvailable: true` is reported for **most** entries (handlebars: fixAvailable=true; prisma: fixAvailable=6.19.3 isSemVerMajor=true). Several @nestjs/* fixes require coordinated minor bumps (current 11.1.17 → wanted 11.1.19).

This is a **regression vs the 2026-03-29 baseline** which reported 0 critical / 0 high.

---

### DEP-02 — Outdated packages  (LOW, NIST SA-11)

**Verdict**: PASS (informational)
**Severity**: LOW
**Expected**: List packages with available updates (informational only).
**Actual** (`npm outdated --json`): roughly 30+ packages have updates. Highlights:

| Package | Current | Wanted | Latest | Notes |
|---------|---------|--------|--------|-------|
| @nestjs/common | 11.1.17 | 11.1.19 | 11.1.19 | patch |
| @nestjs/core | 11.1.17 | 11.1.19 | 11.1.19 | patch |
| @nestjs/platform-express | 11.1.17 | 11.1.19 | 11.1.19 | patch |
| @nestjs/swagger | 11.2.6 | 11.4.2 | 11.4.2 | minor |
| @nestjs/config | 4.0.3 | 4.0.4 | 4.0.4 | patch |
| @nestjs-modules/mailer | 2.0.2 | 2.3.4 | 2.3.4 | minor |
| @prisma/client | 7.5.0 | 7.8.0 | 7.8.0 | minor |
| @prisma/adapter-pg | 7.5.0 | 7.8.0 | 7.8.0 | minor |
| @types/node | 22.19.15 | 22.19.17 | 25.6.0 | major bump avoided (Node 22 LTS) |
| @types/nodemailer | 7.0.11 | 7.0.11 | 8.0.0 | major bump deferred |
| @eslint/js | 9.39.4 | 9.39.4 | 10.0.1 | major bump deferred |
| @nestjs/schematics | 11.0.9 | 11.1.0 | 11.1.0 | minor |
| @nestjs/cli | 11.0.16 | 11.0.21 | 11.0.21 | patch |
| @nestjs/testing | 11.1.17 | 11.1.19 | 11.1.19 | patch |

Patch/minor updates of NestJS family resolve several DEP-01 findings. Resolves baseline DEP-06b (outdated verification was previously blocked).

---

### DEP-03 — Critical package CVEs  (CRITICAL, OWASP A06:2021)

**Verdict**: WARN
**Severity**: CRITICAL
**Expected**: 0 known CVEs in bcrypt, passport, @nestjs/jwt, @prisma/client, ioredis, helmet.
**Actual**: Direct critical-package versions installed:

| Package | Installed | Status |
|---------|-----------|--------|
| bcrypt | 6.0.0 | clean |
| @nestjs/jwt | 11.0.2 | clean |
| @nestjs/passport | 11.0.5 | clean |
| @prisma/client | 7.5.0 | clean (but `prisma` CLI 7.5.0 dev-dep is in vulnerable range — DEP-01) |
| helmet | 8.1.0 | clean |
| ioredis | 5.10.0 | clean |
| passport | 0.7.0 | clean |

The DEP-03 list itself is clean. Adjacent direct deps flagged by DEP-01 (handlebars, @nestjs/config, @nestjs/core, @nestjs/platform-express, @nestjs/swagger, prisma) raise concern but are out of the explicit DEP-03 scope.

**WARN justification**: Critical DEP-03 packages clean, but Prisma CLI 7.5.0 (dev tooling tightly tied to `@prisma/client` runtime) sits in the vulnerable range called out in DEP-01. Recommend bumping `prisma` to 6.19.3+ (the DEP-01 fixAvailable target) ahead of DEP-03 review.

---

### DEP-04 — License compliance  (MEDIUM, Legal)

**Verdict**: PASS
**Severity**: MEDIUM
**Expected**: 0 GPL / AGPL in production deps.
**Actual**: programmatic scan of `package-lock.json` license fields returned 0 matches for GPL or AGPL substrings.

```
node -e "for [k,v] of lock.packages: if /gpl|agpl/i match v.license: print" → no output
```

---

### DEP-05 — Unused dependencies  (LOW, Attack surface)

**Verdict**: PASS (sample-based)
**Severity**: LOW
**Expected**: 0 phantom dependencies.
**Actual**: spot-checks for `@nestjs-modules/mailer`, `maxmind`, `qrcode`, `otplib` confirmed used in `src/`:

- `@nestjs-modules/mailer` → `src/mail/mail.module.ts`, `src/mail/mail.service.ts`
- `maxmind` (via geolocation) → `src/geolocation/geolocation.service.ts`
- `qrcode`/`otplib` → `src/auth/mfa.service.ts`

Full exhaustive cross-reference not performed; sample suggests no phantoms. Continue to monitor with a `depcheck` invocation in a future audit cycle.

---

### DEP-06 — Lock file integrity  (CRITICAL, NIST SA-11)

**Verdict**: PASS
**Severity**: CRITICAL
**Expected**: `package-lock.json` present + committed + lockfileVersion >= 2.
**Actual**: `package-lock.json` exists at `nexacore-api/package-lock.json`. Header confirms `"lockfileVersion": 3`. File tracked in git (no `.gitignore` exclusion). Resolves baseline DEP-06 mis-attribution; previous note about `passport-github2` / `otplib` maintenance status is properly a DEP-03 sub-concern, not DEP-06.

---

### DEP-07 — Lock file installable  (HIGH, Supply chain)

**Verdict**: PASS
**Severity**: HIGH
**Expected**: `npm ci --dry-run` exit 0.
**Actual**: `npm ci --dry-run` completes with `up to date in 2s` and `182 packages are looking for funding`. Exit 0. Two non-fatal warnings observed (informational, not blocking):

- Conflicting peer dep: `class-validator@0.14.4` requested by `@nestjs/swagger`'s nested `@nestjs/mapped-types@2.1.0`, while project pins `class-validator@0.15.1`. Resolves at runtime via dedupe.
- `@prisma/studio-core@0.21.1` engines warning: requires Node ^20.19 || ^22.12 || ^24.0 but environment runs Node v25.0.0. Build runtime Node is 22 (per `.nvmrc`); local environment-only mismatch.

---

### DEP-08 — Production audit  (CRITICAL, OWASP A06:2021)

**Verdict**: FAIL
**Severity**: CRITICAL
**Expected**: 0 critical / 0 high in production-only deps.
**Actual** (`npm audit --omit=dev --json`): **1 critical, 16 high**, 4 moderate, 2 low — **23 total**.

Production-only critical+high:

| Severity | Type | Package |
|----------|------|---------|
| critical | DIRECT | handlebars |
| high | DIRECT | @nestjs/config |
| high | DIRECT | @nestjs/core |
| high | DIRECT | @nestjs/platform-express |
| high | DIRECT | @nestjs/swagger |
| high | DIRECT | prisma (also pulled into prod via prisma CLI in scripts) |
| high | transitive | @chevrotain/cst-dts-gen, @chevrotain/gast, @mrleebo/prisma-ast, @prisma/config, @prisma/dev, chevrotain, defu, effect, liquidjs, lodash, path-to-regexp |

Same root drivers as DEP-01; absence of dev-only packages drops `flatted` and `picomatch` from the prod count (28 → 16 high). This is a **regression vs the 2026-03-29 baseline** which reported 0 prod critical / 0 prod high.

---

### DEP-09 — Node.js version pinned  (MEDIUM, SOC 2 CC8.2)

**Verdict**: PASS
**Severity**: MEDIUM
**Expected**: `engines.node` constraint + `.nvmrc` file present.
**Actual**:
- `nexacore-api/package.json` → `"engines": { "node": ">=22.0.0", "npm": ">=10.0.0" }`
- repo root `.nvmrc` → `22`

Constraint and pin agree.

---

### DEP-10 — No file/git dependencies  (MEDIUM, Supply chain)

**Verdict**: PASS
**Severity**: MEDIUM
**Expected**: 0 occurrences of `"file:` or `"git+` in `dependencies` / `devDependencies`.
**Actual**: grep on `nexacore-api/package.json` → no matches. (Note: `"mjml": "npm:empty-npm-package@1.0.0"` exists under `overrides`, which is a deliberate empty-shim alias, not a file/git dep — this is the documented mjml exclusion from SCRUM-202.)

---

### DEP-11 — Integrity hashes  (HIGH, NIST SA-11)

**Verdict**: PASS
**Severity**: HIGH
**Expected**: All direct deps carry `integrity` with `sha512-` prefix.
**Actual**: `package-lock.json` grep shows 1072 `"integrity":` entries, all 1072 prefixed `sha512-`. Sampled 6 critical direct deps (DEP-03 set) — all have valid `sha512-` hashes:

| Package | Version | sha512-prefix |
|---------|---------|---------------|
| bcrypt | 6.0.0 | yes |
| helmet | 8.1.0 | yes |
| ioredis | 5.10.0 | yes |
| @nestjs/jwt | 11.0.2 | yes |
| @prisma/client | 7.5.0 | yes |
| passport | 0.7.0 | yes |

---

### DEP-12 — Duplicate packages  (LOW, Bundle size / attack surface)

**Verdict**: WARN
**Severity**: LOW
**Expected**: 0 critical duplicates / `npm ls --all` clean.
**Actual**: `npm ls --all` exits with `npm error code ELSPROBLEMS`:

```
npm error invalid: class-validator@0.15.1 …
| | +-- class-validator@0.15.1 deduped invalid:
        "^0.13.0 || ^0.14.0" from
        node_modules/@nestjs/swagger/node_modules/@nestjs/mapped-types
```

Single invalid-peer warning — `class-validator@0.15.1` does not satisfy `@nestjs/mapped-types@2.1.0`'s peer range (`^0.13.0 || ^0.14.0`). Functionality works in practice (decorator API stable), but the npm-reported error blocks a clean `npm ls`. No widespread duplicate-version sprawl observed in tail of `npm ls --all`.

**WARN justification**: Single peer-conflict surfacing as ELSPROBLEMS; resolution is upstream (await `@nestjs/mapped-types` to widen its range or maintain an `overrides` block). Not a duplicate-of-same-package issue.

---

## Summary

| Check | Verdict | Severity |
|-------|---------|----------|
| DEP-01 Known vulnerabilities | FAIL | CRITICAL |
| DEP-02 Outdated packages | PASS | LOW |
| DEP-03 Critical package CVEs | WARN | CRITICAL |
| DEP-04 License compliance | PASS | MEDIUM |
| DEP-05 Unused dependencies | PASS | LOW |
| DEP-06 Lock file integrity | PASS | CRITICAL |
| DEP-07 Lock file installable | PASS | HIGH |
| DEP-08 Production audit | FAIL | CRITICAL |
| DEP-09 Node.js version pinned | PASS | MEDIUM |
| DEP-10 No file/git deps | PASS | MEDIUM |
| DEP-11 Integrity hashes | PASS | HIGH |
| DEP-12 Duplicate packages | WARN | LOW |

**Counts**: 8 PASS / 2 WARN / 2 FAIL.

---

## Recurrence Analysis vs 2026-03-29 baseline

| Check | Previous | Current | Delta |
|-------|----------|---------|-------|
| DEP-01 | PASS (0 critical, 0 high) | FAIL (1 critical, 18 high) | REGRESSION — 19 new critical+high vulns surfaced |
| DEP-02 | WARN (couldn't verify) | PASS (informational list) | RESOLVED |
| DEP-03 | WARN (`@simplewebauthn/types` deprecated) | WARN (Prisma CLI in DEP-01 vuln range) | DIFFERENT WARN — DEP-03 set itself clean |
| DEP-06 | WARN (`passport-github2`/`otplib` maint) | PASS | RESOLVED (mis-attribution corrected; lockfile is healthy) |
| DEP-07 | not tracked | PASS | NEW PASS |
| DEP-08 | PASS (0 prod critical, 0 prod high) | FAIL (1 prod critical, 16 prod high) | REGRESSION — same root cause as DEP-01 |
| DEP-12 | not flagged | WARN (class-validator peer conflict) | NEW WARN |
| DEP-04, 05, 09, 10, 11 | PASS | PASS | No change |

Net direction: 2 critical FAILs introduced via dependency drift since 2026-03-29 (DEP-01, DEP-08). The 2026-03-17 0-FAIL baseline is broken at the dependencies layer.

---

## Root cause of regression

A new wave of advisories landed in early 2026-Q2:
- **handlebars 4.7.8** — newly-published advisory (covers all 4.x ≤ 4.7.8). `fixAvailable: true` (likely 4.7.9+ or major).
- **NestJS 11.1.17** family — multiple advisories pre-11.1.19 patches; resolution is `npm update @nestjs/{common,core,platform-express,swagger,config,testing}`.
- **Prisma 7.5.0** CLI/runtime split — fix path is `prisma@6.19.3` per `fixAvailable` (note: that is a **major** downgrade off 7.x → semver-major bump in the inverse direction; deserves a dedicated risk analysis ticket).
- Transitive vulns (path-to-regexp, lodash, picomatch, chevrotain, liquidjs) clear once parents bump.

---

## Recommendations

1. **DEP-01 / DEP-08 (CRITICAL — blockers)**: open immediate Jira ticket "Restore 0-CRIT/0-HIGH dependency baseline". Sub-tasks:
   1. Bump NestJS family 11.1.17 → 11.1.19 (or latest patch) — clears 4 direct highs.
   2. Bump `@nestjs/swagger` 11.2.6 → 11.4.2 — clears 1 direct high.
   3. Bump `@nestjs/config` 4.0.3 → 4.0.4 — clears 1 direct high.
   4. Investigate Prisma CLI/client. If `fixAvailable.version=6.19.3` is correct, plan migration; otherwise wait for upstream 7.x patch and apply `overrides` for `@prisma/config` / `@prisma/dev`.
   5. Investigate handlebars 4.7.8 critical — check whether template engine is still required (mailer templates in `src/mail/`); if yes, migrate to a maintained engine (e.g., eta) per `overrides` shim approach.
   6. Re-run `npm audit` and confirm DEP-01/DEP-08 PASS.
2. **DEP-03 (CRITICAL)**: bundle prisma fix with the DEP-01 plan above. DEP-03's listed packages remain clean.
3. **DEP-12 (LOW)**: monitor `@nestjs/mapped-types`'s peer range; if a fix is unavailable in 1 sprint, add `class-validator: 0.15.1` to `overrides` to suppress the ELSPROBLEMS error explicitly.
4. **Process**: enable Dependabot for `@nestjs/*`, `prisma`, `handlebars`, `@prisma/*` to surface advisories early; schedule weekly-audit.yml workflow alert on new criticals.
5. **Risk acceptance**: Per audit-standards Section 6.4, accepting any of the above critical/high findings requires formal risk-analysis.md + user approval. Do not merge a 0-FAIL audit closure until DEP-01/DEP-08 are remediated or formally accepted.

---

**End Phase 8 — global dependencies (nexacore-api).**
