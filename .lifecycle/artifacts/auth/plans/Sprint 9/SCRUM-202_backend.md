# Backend Implementation Plan: SCRUM-202 Remediate transitive npm vulnerabilities

## Codebase State Snapshot

- **Date**: 2026-03-13
- **Last completed ticket**: SCRUM-200 (Update data-model.md with WebAuthnCredential and OAuthAccount)
- **Integration state verified**: Yes (last update: SCRUM-200, 2026-03-13)
- **Files verified against live code**:
  - `nexacore-api/package.json` — overrides section exists (lines 101-105) with hono, @hono/node-server, glob
  - `nexacore-api/src/mail/mail.module.ts` — uses `HandlebarsAdapter`, NOT mjml
  - `npm audit` output — 47 vulnerabilities (16 moderate, 31 high), all transitive
  - `npm audit fix --dry-run` — 0 non-breaking fixes available
- **Constructor signatures verified**: Not applicable (no service/class changes)
- **Methods verified to exist**: Not applicable (no code changes)
- **Guard dependency chain verified**: Not applicable (no guard changes)
- **Discrepancies with integration-state.md**: None

## Overview

Remediate 47 npm vulnerabilities (16 moderate, 31 high) reported by `npm audit` in `nexacore-api`. All vulnerabilities are transitive — no direct dependency is vulnerable. The remediation uses three strategies: npm overrides for transitive deps where patched versions exist, optional dependency exclusion for unused packages (mjml), and documented risk acceptance for dev-only dependencies with no available fix.

## Architecture Context

- **Module**: None (dependency management only)
- **Files modified**: `nexacore-api/package.json`, `nexacore-api/package-lock.json`
- **No code, test, or architecture changes**

## Root Cause Analysis

| # | Chain | Root Vulnerability | Severity | Count | Strategy |
|---|-------|-------------------|----------|-------|----------|
| 1 | `@nestjs-modules/mailer` → `mjml` → `html-minifier` | ReDoS (GHSA-pfq8-rq6v-vf5m) + directory traversal (GHSA-45h5-66jx-r2wf) | HIGH | 31 pkgs | **Exclude mjml** — it's an optionalDependency and project uses HandlebarsAdapter only |
| 2 | `@nestjs/common` → `file-type@21.3.0` | Infinite loop on malformed ASF (GHSA-5v7r-6r5c-r473) | MODERATE | 1 pkg | **Override** to `>=21.3.1` |
| 3 | `@nestjs/cli` → `@angular-devkit/core` → `ajv` | ReDoS with `$data` (GHSA-2g4f-4pwh-qvx6) | MODERATE | 10 pkgs | **Accept risk** — dev-only, not in prod bundle |
| 4 | `prisma` → `@mrleebo/prisma-ast` → `chevrotain` → `lodash` | Prototype pollution (GHSA-xxjr-mmjv-4gpg) | HIGH | 5 pkgs | **Accept risk** — dev-only CLI, not in prod bundle |

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-202-backend` from latest `main`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-202-backend`

### Step 1: Exclude mjml from @nestjs-modules/mailer (resolves 31 HIGH)

- **File**: `nexacore-api/package.json`
- **Action**: Add npm override to replace mjml with an empty/stub package, preventing its installation
- **Implementation Steps**:
  1. Add to the existing `overrides` section:
     ```json
     "mjml": "npm:empty-npm-package@1.0.0"
     ```
     This replaces the mjml transitive dependency with an empty stub, since the project only uses HandlebarsAdapter.
  2. Alternative if empty-npm-package doesn't work: add an override to set mjml to a version that doesn't exist in the dep tree, forcing npm to skip it. Or use `"mjml": "./empty-override"` with a local empty package.
  3. **Simpler approach** (preferred): Since mjml is listed as `optionalDependencies` in @nestjs-modules/mailer, run:
     ```bash
     npm install --omit=optional
     ```
     Then verify mjml is not installed. If npm still installs it due to lockfile, add the override.
- **Implementation Notes**:
  - mjml is an `optionalDependency` of `@nestjs-modules/mailer@2.0.2`
  - The project uses ONLY `HandlebarsAdapter` (verified in `src/mail/mail.module.ts`)
  - mjml, mjml-core, mjml-cli, html-minifier, mjml-migrate, and all 20+ mjml-* component packages will be removed
  - This resolves ALL 31 HIGH vulnerabilities in one step

### Step 2: Override file-type to fix @nestjs/common chain (resolves 1 MODERATE)

- **File**: `nexacore-api/package.json`
- **Action**: Add override for file-type to patched version
- **Implementation Steps**:
  1. Add to the existing `overrides` section:
     ```json
     "file-type": ">=21.3.1"
     ```
  2. Current: `file-type@21.3.0` (via `@nestjs/common@11.1.16`)
  3. Fix: `file-type@21.3.1+` patches the infinite loop on malformed ASF input

### Step 3: Override lodash to fix prisma chain (resolves 5 HIGH)

- **File**: `nexacore-api/package.json`
- **Action**: Add override for lodash to patched version
- **Implementation Steps**:
  1. Check if lodash has a patched version: `npm view lodash version` (latest is 4.17.21, vulnerability is in all versions up to latest — GHSA-xxjr-mmjv-4gpg affects `_.unset` and `_.omit`)
  2. If NO patched version exists: document as accepted risk (dev-only dependency)
  3. If patched version exists: add override `"lodash": ">=4.17.22"` (or whatever the fix version is)
- **Implementation Notes**: lodash prototype pollution in `_.unset`/`_.omit` — this is only reachable through prisma CLI, which is a devDependency. Even if override is not possible, the risk is minimal.

### Step 4: Regenerate package-lock.json

- **File**: `nexacore-api/package-lock.json`
- **Action**: Clean install to apply overrides
- **Implementation Steps**:
  1. `cd nexacore-api`
  2. `rm -rf node_modules package-lock.json`
  3. `npm install`
  4. Verify overrides applied: `npm ls mjml 2>/dev/null` (should show empty or not found)
  5. Verify file-type updated: `npm ls file-type` (should show >=21.3.1)

### Step 5: Verify vulnerability count

- **Action**: Run npm audit and document results
- **Implementation Steps**:
  1. `npm audit` — record new vulnerability count
  2. Expected results:
     - 31 HIGH from mjml chain → **resolved** (excluded)
     - 1 MODERATE from file-type → **resolved** (overridden)
     - 5 HIGH from lodash/prisma → **resolved or accepted risk** (dev-only)
     - 10 MODERATE from ajv/@nestjs/cli → **accepted risk** (dev-only)
  3. Target: 0 HIGH in production dependencies, ≤15 moderate (dev-only)

### Step 6: Post-Implementation Integrity Check

- **Action**: Verify application still works correctly
- **Implementation Steps**:
  1. `nest build` — must compile clean
  2. `npx jest --maxWorkers=1 --forceExit` — all 446+ tests must pass
  3. Verify mail module works: check that HandlebarsAdapter import resolves correctly
  4. `npm audit --omit=dev` — production-only audit should show 0 vulnerabilities

### Step 7: Document Accepted Risks in PR

- **Action**: Create PR description documenting any remaining vulnerabilities
- **Implementation Steps**:
  1. For each remaining vulnerability, document:
     - Package name and version
     - CVE/GHSA identifier
     - Why it's accepted (dev-only, not exploitable in our context, etc.)
     - When to revisit (upstream fix ETA if known)

### Step 8: Update Technical Documentation

- **Action**: Run `/update-docs SCRUM-202` after implementation
- **Implementation Steps**:
  1. Update `integration-state.md` header with SCRUM-202
  2. Add changelog entry documenting the dependency remediation
  3. No other documentation changes needed (no API, data model, or architecture changes)

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Exclude mjml via overrides (31 HIGH)
3. Step 2: Override file-type (1 MODERATE)
4. Step 3: Override or accept-risk lodash (5 HIGH)
5. Step 4: Regenerate package-lock.json
6. Step 5: Verify vulnerability count
7. Step 6: Post-implementation integrity check (build + tests + mail)
8. Step 7: Document accepted risks in PR
9. Step 8: Update documentation

## Testing Checklist

- [ ] `nest build` compiles clean
- [ ] All 446+ tests pass (`jest --maxWorkers=1 --forceExit`)
- [ ] Mail module loads correctly (HandlebarsAdapter resolves)
- [ ] `npm audit --omit=dev` shows 0 HIGH/CRITICAL vulnerabilities
- [ ] `npm audit` total HIGH count reduced from 31 to ≤5 (dev-only accepted risk)
- [ ] No new vulnerabilities introduced by overrides
- [ ] Application starts without errors

## Error Response Format

No new error responses. Dependency management only.

## Dependencies

No new dependencies. Overrides modify transitive dependency resolution.

## Notes

- **Zero code changes** — only `package.json` overrides and `package-lock.json` regeneration
- **mjml exclusion is safe** because the project uses HandlebarsAdapter exclusively (verified in `src/mail/mail.module.ts`)
- **Dev-only accepted risks** (ajv, lodash) don't affect production deployments — these packages are only used during development (CLI tooling)
- **SOC 2 CC7.1 compliance**: All vulnerabilities either remediated or documented with risk acceptance justification
- **OWASP A06:2021**: Vulnerable and Outdated Components — addressed by removing unused vulnerable deps and overriding fixable ones
- If `npm:empty-npm-package` approach fails for mjml, alternatives: (a) local empty package stub, (b) `npm install --no-optional` in CI, (c) npm override to `"0.0.0"` which makes it unresolvable

## Next Steps After Implementation

1. Run `/update-docs SCRUM-202`
2. Create PR, merge to main
3. Transition SCRUM-202 to Done
4. Proceed with SCRUM-203 (next Sprint 9 ticket)

## Implementation Verification

- [ ] Production dependencies: 0 HIGH/CRITICAL vulnerabilities
- [ ] Build: compiles clean
- [ ] Tests: all pass
- [ ] Mail: HandlebarsAdapter works without mjml
- [ ] Documentation: integration-state.md updated
- [ ] PR: accepted risks documented
