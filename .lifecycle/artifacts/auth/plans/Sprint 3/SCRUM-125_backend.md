# Backend Implementation Plan: SCRUM-125 Update Outdated npm Packages (DEP-02)

## Codebase State Snapshot

- **Date**: 2026-03-04
- **Last completed ticket on branch**: SCRUM-124 (Documentation alignment)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/package.json` — 25 production deps, 22 devDeps. Key versions: @nestjs/* 11.1.14 (^11.0.1), @prisma/client 7.4.0 (^7.4.0), class-validator 0.14.3 (^0.14.3), pg 8.18.0 (^8.18.0)
  - `npm audit` output — 53 vulnerabilities (39 HIGH, 14 moderate):
    - **multer <=2.0.2** (HIGH): DoS via incomplete cleanup + resource exhaustion. Via @nestjs/platform-express <=11.1.14. Fix: update to @nestjs/platform-express 11.1.15
    - **serialize-javascript <=7.0.2** (HIGH): RCE via RegExp.flags. Via terser-webpack-plugin <=5.3.16. Fix: npm audit fix
    - **minimatch ReDoS** (HIGH): Via multiple paths (jest, glob, editorconfig, typescript-estree). Fix: npm audit fix
    - **14 moderate**: @nestjs-modules/mailer transitive deps (mjml, glob) — accepted risk (static templates only)
  - `npm outdated` — 17 packages with available updates (all within semver range except globals 16→17, eslint 9→10, @types/supertest 6→7, class-validator 0.14→0.15, @types/node 22→25):
    - **Within semver range (safe via npm update)**: @nestjs/* 11.1.14→11.1.15, @prisma/* 7.4.0→7.4.2, pg 8.18.0→8.19.0, class-validator 0.14.3→0.14.4, eslint 9.39.2→9.39.3, @eslint/* patches, typescript-eslint 8.56.0→8.56.1, @types/node 22.19.11→22.19.13, @types/pg 8.16.0→8.18.0
    - **Beyond semver range (NOT updated)**: globals 16→17, eslint 9→10, @types/supertest 6→7, class-validator 0.14→0.15, @types/node 22→25, @eslint/js 9→10
- **Constructor signatures verified**: N/A — no source code modifications
- **Guard dependency chain verified**: N/A — no guard changes
- **Discrepancies with integration-state.md**: None relevant — dependency-only ticket

## Overview

Resolve npm dependency vulnerabilities (DEP-02 audit finding) by running `npm audit fix` + `npm update`. This updates packages within their semver ranges defined in package.json — no breaking changes. Critical fix: @nestjs/platform-express 11.1.14→11.1.15 resolves multer DoS vulnerabilities (HIGH).

## Architecture Context

- **Modules involved**: None — package dependency update only
- **Components affected**: `package.json`, `package-lock.json`
- **No DI, module, guard, controller, schema, or source code changes**

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-125-backend` from SCRUM-124 branch
- **Implementation Steps**:
  1. `git checkout feature/SCRUM-124-backend` (should already be there)
  2. `git checkout -b feature/SCRUM-125-backend`
  3. Verify branch: `git branch --show-current`

### Step 1: Run npm audit fix

- **Action**: Fix auto-fixable vulnerabilities without breaking semver boundaries
- **Implementation Steps**:
  1. `cd nexacore-api && npm audit fix` (NOT --force)
  2. Capture output — note which packages were updated and which vulnerabilities were fixed
  3. Expected fixes: multer (via @nestjs/platform-express upgrade), serialize-javascript (via terser-webpack-plugin upgrade), minimatch patches

### Step 2: Run npm update

- **Action**: Update all packages to latest compatible versions within semver ranges
- **Implementation Steps**:
  1. `npm update`
  2. Capture output — note total packages updated
  3. Expected updates: @nestjs/* 11.1.15, @prisma/* 7.4.2, pg 8.19.0, class-validator 0.14.4, eslint 9.39.3, typescript-eslint 8.56.1, @types/* patches

### Step 3: Build, Test, Verify

- **Implementation Steps**:
  1. `nest build` — zero TypeScript errors
  2. `npx jest --maxWorkers=1 --forceExit` — all 773 tests pass
  3. `npm audit` — verify HIGH count reduced (multer + serialize-javascript + minimatch resolved)
  4. Document remaining vulnerabilities (expected: 14 moderate from @nestjs-modules/mailer transitive deps)

### Step 4: Update Technical Documentation

- **Action**: Update integration-state.md changelog
- **Implementation Steps**:
  1. Add SCRUM-125 changelog entry to `ai-specs/specs/integration-state.md`
  2. No api-spec.yml, data-model.md, or other doc changes (no API or schema changes)

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: npm audit fix
3. Step 2: npm update
4. Step 3: Build, test, verify
5. Step 4: Update integration-state.md changelog

## Testing Checklist

- [ ] `npm audit fix` completes without errors
- [ ] `npm update` completes without errors
- [ ] `nest build` — zero errors
- [ ] All 773 tests pass
- [ ] `npm audit` HIGH count = 0 (was 39)
- [ ] Remaining vulnerabilities are only moderate (mailer transitive deps, accepted risk)
- [ ] integration-state.md changelog entry added

## Error Response Format

No API error responses — dependency update with no runtime behavior modifications.

## Dependencies

- No new npm packages added manually
- All updates within semver ranges defined in existing package.json
- **Prerequisite**: SCRUM-124 (must be on `feature/SCRUM-124-backend` branch)

## Notes

- **No --force flag**: `npm audit fix --force` can break semver boundaries and introduce breaking changes. Only use `npm audit fix` (safe mode).
- **Accepted risk**: 14 moderate vulnerabilities from `@nestjs-modules/mailer` transitive deps (mjml, glob) cannot be fixed without major version upgrade or package replacement. Mitigated by: templates are static HBS files, no user-controlled input reaches mjml.
- **Beyond-range packages not updated**: globals 17, eslint 10, @types/supertest 7, class-validator 0.15, @types/node 25 — these are major version bumps that could introduce breaking changes. Separate ticket if needed.
- **Rectified**: Individual branch/commit/PR replacing bulk commit `e0f12f7`.

## Next Steps After Implementation

1. Commit, push, create PR
2. Run `/update-docs SCRUM-125`
3. Proceed to SCRUM-126 (CORS null-origin accepted risk documentation)

## Implementation Verification

- [ ] **Code Quality**: N/A — no source code changes
- [ ] **Functionality**: N/A — dependency update only
- [ ] **Testing**: All 773 existing tests pass after update
- [ ] **Security**: HIGH vulnerability count reduced to 0
- [ ] **Integration**: No module, guard, or DI changes
- [ ] **Documentation**: integration-state.md updated
