# Backend Implementation Plan: SCRUM-186 Fix 40 HIGH npm Dependency Vulnerabilities

## 1. Codebase State Snapshot

- **Date**: 2026-03-12
- **Last completed ticket**: SCRUM-184 (fix broken app.e2e-spec.ts — already done)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/package.json` — current dependency versions confirmed
  - `nexacore-api/tsconfig.json` — current compiler options
- **Constructor signatures verified**: N/A (no service/class modifications)
- **Methods verified to exist**: N/A (no method modifications)
- **Guard dependency chain verified**: N/A (no guard changes)
- **Discrepancies with integration-state.md**: None relevant to this ticket

## 2. Overview

Remediate 47 production npm vulnerabilities (40 HIGH, 7 moderate) found in audit Phase 8 (DEP-01/DEP-08). All vulnerabilities are in transitive dependencies. The fix uses a two-tier approach: (1) `npm audit fix` for non-breaking patches, (2) `npm update` for semver-compatible updates of direct dependencies.

No code changes required — only `package.json` and `package-lock.json` will be modified.

## 3. Architecture Context

- **Modules involved**: None (dependency-only change)
- **Components affected**: None
- **Files affected**:
  - `nexacore-api/package.json`
  - `nexacore-api/package-lock.json`

## 4. Current Vulnerability State (Before)

| Package | Severity | Advisory | Transitive via |
|---------|----------|----------|---------------|
| hono (9 advisories) | HIGH | Various | prisma CLI |
| @hono/node-server | HIGH | GHSA-wc8c-qw6v-h7f6 (auth bypass) | prisma CLI |
| html-minifier | HIGH | GHSA-pfq8-rq6v-vf5m (ReDoS) | mjml → @nestjs-modules/mailer |
| glob | HIGH | GHSA-5j98-mcp5-4vw2 (cmd injection) | @nestjs-modules/mailer |
| multer | HIGH | GHSA-5528-5vmv-3xc2 (DoS) | @nestjs/platform-express |
| liquidjs | HIGH | GHSA-wmfp-5q7x-987x (path traversal) | mjml → @nestjs-modules/mailer |
| lodash (5 instances) | moderate | Various | chevrotain → prisma |
| ajv (2 instances) | moderate | GHSA-2g4f-4pwh-qvx6 (ReDoS) | @nestjs/schematics (dev) |
| file-type | moderate | GHSA-5v7r-6r5c-r473 (infinite loop) | @nestjs/common |

**Total**: 53 (all deps) / 47 (prod only), 40 HIGH + 13 moderate

## 5. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to `feature/SCRUM-186-backend`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-186-backend`

### Step 1: Capture Baseline Audit

- **Action**: Record current vulnerability state for audit trail
- **Implementation Steps**:
  1. Run `npm audit --omit=dev` and save output
  2. Note: 47 vulnerabilities (40 high, 7 moderate) in production deps

### Step 2: Run npm audit fix (Non-Breaking)

- **File**: `nexacore-api/package-lock.json`
- **Action**: Apply all non-breaking transitive dependency patches
- **Implementation Steps**:
  1. Run `cd nexacore-api && npm audit fix`
  2. Expected changes (from dry-run):
     - `@nestjs/platform-express` 11.1.15 → 11.1.16 (fixes multer 2.1.0 → 2.1.1)
     - `prisma` 7.4.2 → 7.5.0 (fixes hono transitives)
     - `@prisma/client` dependencies updated
     - `liquidjs` 10.24.0 → 10.25.0
  3. Verify no breaking changes in output

### Step 3: Update Direct Dependencies (Semver-Compatible)

- **File**: `nexacore-api/package.json`
- **Action**: Update direct dependencies to latest semver-compatible versions
- **Implementation Steps**:
  1. Run: `npm update @nestjs/common @nestjs/core @nestjs/testing @prisma/client @prisma/adapter-pg prisma`
  2. Expected version bumps:
     - `@nestjs/common` 11.1.15 → 11.1.16
     - `@nestjs/core` 11.1.15 → 11.1.16
     - `@nestjs/testing` 11.1.15 → 11.1.16
     - `@prisma/client` 7.4.2 → 7.5.0
     - `@prisma/adapter-pg` 7.4.2 → 7.5.0
     - `prisma` 7.4.2 → 7.5.0
  3. Also update other outdated non-breaking deps:
     - `npm update @simplewebauthn/server nodemailer pg jest @eslint/eslintrc @eslint/js eslint typescript-eslint @types/node`

### Step 4: Regenerate Prisma Client

- **Action**: Regenerate after prisma version bump
- **Implementation Steps**:
  1. Run `npx prisma generate`
  2. Verify output: "Generated Prisma Client (v7.5.0)"

### Step 5: Run Tests

- **Action**: Verify no regressions from dependency updates
- **Implementation Steps**:
  1. Run `npm test` — expect all 829+ tests to pass
  2. Run `npm run build` — expect clean compilation

### Step 6: Capture Post-Fix Audit

- **Action**: Record vulnerability state after fixes
- **Implementation Steps**:
  1. Run `npm audit --omit=dev`
  2. Document remaining vulnerabilities (Tier 3 residuals)
  3. Expected residuals (no direct fix available):
     - `html-minifier` (HIGH) — via mjml → @nestjs-modules/mailer (no upstream fix)
     - `glob` (HIGH) — via @nestjs-modules/mailer (no upstream fix)
     - `@hono/node-server` (HIGH) — via prisma (if not fixed by 7.5.0)
     - `lodash` (moderate) — via chevrotain → prisma
     - `ajv` (moderate) — via @nestjs/schematics (dev only)
  4. If residuals remain, evaluate `overrides` in package.json for safe transitive overrides

### Step 7: Add npm Overrides (If Needed)

- **File**: `nexacore-api/package.json`
- **Action**: Add overrides for transitive deps where safe
- **Implementation Steps**:
  1. Only if residual HIGH vulns remain after Steps 2-3
  2. Add `"overrides"` section in package.json for specific transitive deps
  3. Example: `"overrides": { "hono": "^4.13.0", "liquidjs": "^10.25.0" }`
  4. Run `npm install` to apply overrides
  5. Re-run tests to verify no breakage
  6. **Do NOT override html-minifier** (mjml core dependency, override could break email rendering)

### Step 8: Update Technical Documentation

- **Action**: Update documentation to reflect dependency changes
- **Implementation Steps**:
  1. No architecture/API changes — no doc updates needed for data-model.md or api-spec.yml
  2. Document accepted residual risks in implementation record

## 6. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Capture baseline audit
3. Step 2: Run npm audit fix
4. Step 3: Update direct dependencies
5. Step 4: Regenerate Prisma Client
6. Step 5: Run tests + build
7. Step 6: Capture post-fix audit
8. Step 7: Add npm overrides (if needed)
9. Step 8: Documentation

## 7. Testing Checklist

- [ ] All unit tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Prisma client generates successfully
- [ ] `npm audit --omit=dev` shows reduced HIGH count
- [ ] No new vulnerabilities introduced

## 8. Error Response Format

N/A — no API changes.

## 9. Partial Update Support

N/A

## 10. Dependencies

- npm (already installed)
- No new packages added — only version bumps of existing dependencies

## 11. Notes

- **DO NOT use `npm audit fix --force`**: It downgrades prisma to 6.x and @nestjs/cli to 7.x — completely unacceptable
- `html-minifier` vulnerability (ReDoS via mjml) has NO upstream fix. @nestjs-modules/mailer depends on mjml which bundles html-minifier. This is accepted risk — the ReDoS only affects server-side email template rendering, not user-facing request processing
- `@hono/node-server` auth bypass is in static file serving middleware — not used by our app (we use NestJS/Express, hono is only a transitive dep of prisma CLI for Prisma Studio)
- All vulnerability impacts are mitigated by the fact that they're in transitive deps not directly invoked by our code

## 12. Next Steps After Implementation

- Re-run audit Phase 8 to verify DEP-01/DEP-08 pass
- Monitor @nestjs-modules/mailer for mjml update that fixes html-minifier
- Consider alternative mailer library if mjml vulns persist long-term

## 13. Implementation Verification

- [ ] `package.json` version bumps are semver-compatible (patch/minor only)
- [ ] `package-lock.json` regenerated cleanly
- [ ] Prisma client v7.5.0 generated
- [ ] 829+ tests pass
- [ ] Build succeeds
- [ ] `npm audit --omit=dev` HIGH count reduced (target: 0 or only accepted residuals)
- [ ] No code changes (only dependency files)
