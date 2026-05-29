# Frontend Implementation Plan: SCRUM-262 Update Next.js to Fix Critical CVEs

## 1. Header

- **Ticket**: SCRUM-262
- **Title**: Audit Fix: DEP-01 — Update Next.js to fix critical CVEs
- **Scope**: Frontend (dependency update)
- **Priority**: Highest (CRITICAL)
- **Sprint**: 11 — Security II

## 2. Overview

Update Next.js from 14.2.21 to 14.2.35 in nexacore-dashboard to remediate 2 critical CVEs:
- **GHSA-h25m-26qc-wcjf**: HTTP request deserialization DoS via React Server Components
- **GHSA-f82v-jwr5-mffw**: Authorization Bypass in Next.js Middleware

This is a patch-level update within the 14.2.x line — no breaking changes expected.

## 3. Architecture Context

- **Project**: nexacore-dashboard
- **Files affected**:
  - `nexacore-dashboard/package.json` (line 24: `"next": "14.2.21"`)
  - `nexacore-dashboard/package-lock.json` (auto-regenerated)
- **No code changes required** — this is a version bump only
- **Risk areas**: Next.js middleware (`src/middleware.ts`), app router pages, CSP nonce generation

### Codebase State Snapshot

- **Date**: 2026-03-16
- **Files verified**:
  - `nexacore-dashboard/package.json:24` — `"next": "14.2.21"` (pinned, no caret/tilde)
  - `npm audit --omit=dev` — 1 critical package, 10 CVEs total
  - `npm view next versions` — latest 14.2.x is 14.2.35

### Regression Impact Analysis

- **Blast radius**: 0 source files modified. Only `package.json` and `package-lock.json` change.
- **Breaking changes**: None expected (patch version within same minor). Next.js 14.2.x changelog is security-only patches.
- **API contract impact**: None — no endpoint changes.
- **Test impact**: All existing tests should pass unchanged. If any test depends on Next.js internals, it may need review.
- **Blast radius size**: 2 files (package.json + lock file). LOW risk.

## 4. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create branch `feature/SCRUM-262-frontend`
- **Implementation Steps**:
  1. `cd em-ecosystem-code`
  2. `git checkout main && git pull origin main`
  3. `git checkout -b feature/SCRUM-262-frontend`

### Step 1: Update Next.js Version

- **File**: `nexacore-dashboard/package.json`
- **Action**: Update next dependency from 14.2.21 to 14.2.35
- **Implementation Steps**:
  1. `cd nexacore-dashboard`
  2. `npm install next@14.2.35`
  3. Verify `package.json` line 24 shows `"next": "14.2.35"`
  4. Verify `package-lock.json` updated with new resolved URL and integrity hash

### Step 2: Verify Security Audit

- **Action**: Confirm CVEs are resolved
- **Implementation Steps**:
  1. `npm audit --omit=dev`
  2. Verify 0 critical and 0 high vulnerabilities in production dependencies
  3. Document the audit output for the commit message

### Step 3: Verify Build

- **Action**: Confirm next build succeeds
- **Implementation Steps**:
  1. `npm run build`
  2. Verify exit code 0
  3. Check for any new deprecation warnings in build output

### Step 4: Verify Tests

- **Action**: Confirm all tests pass
- **Implementation Steps**:
  1. `npm test`
  2. Verify all test suites pass with 0 failures

### Step 5: Verify Middleware Functionality

- **Action**: Since GHSA-f82v-jwr5-mffw specifically affects middleware authorization, verify `src/middleware.ts` route guards are not regressed
- **Implementation Steps**:
  1. Review Next.js 14.2.35 release notes for any middleware behavior changes
  2. Confirm middleware.ts exports the `middleware` function and `config.matcher` unchanged
  3. Build confirmation in Step 3 validates middleware compiles correctly

### Step 6: Update Technical Documentation

- **Action**: No documentation changes needed — this is a dependency version bump only
- **Notes**: The audit report already documents the finding (fase-8-dependencies.md). No api-spec.yml or frontend-standards.mdc changes required.

## 5. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Update Next.js version
3. Step 2: Verify security audit
4. Step 3: Verify build
5. Step 4: Verify tests
6. Step 5: Verify middleware functionality

## 6. Testing Checklist

- [ ] `npm audit --omit=dev` shows 0 critical/high vulnerabilities
- [ ] `npm run build` succeeds (exit code 0)
- [ ] `npm test` — all tests pass
- [ ] No new deprecation warnings in build output
- [ ] `src/middleware.ts` unchanged and compiles correctly

## 7. Error Handling Patterns

N/A — no code changes.

## 8. UI/UX Considerations

N/A — no visual changes.

## 9. Dependencies

- `next@14.2.35` (updated from 14.2.21)
- No new dependencies added or removed

## 10. Notes

- This is a **security-critical** patch — OWASP SAMM L3 requires immediate remediation
- The update is within the same minor version (14.2.x) so backward compatibility is guaranteed by semver
- Dependabot (SCRUM-260) and CI npm audit (security.yml) are already configured to prevent future recurrence

## 11. Next Steps After Implementation

1. `/develop SCRUM-262` — execute the plan
2. `/verify SCRUM-262` — validate build + audit
3. `/commit SCRUM-262` — commit and create PR
4. Proceed to SCRUM-263 (CH-02: magic strings)

## 12. Implementation Verification

- [ ] `package.json` shows `"next": "14.2.35"`
- [ ] `package-lock.json` regenerated with correct hashes
- [ ] `npm audit --omit=dev` = 0 critical, 0 high
- [ ] `npm run build` = exit code 0
- [ ] `npm test` = all pass
- [ ] No source code files modified (only package files)
