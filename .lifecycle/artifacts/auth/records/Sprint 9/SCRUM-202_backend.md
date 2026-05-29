# Implementation Record: SCRUM-202 Remediate transitive npm vulnerabilities

## Summary

Added npm overrides to eliminate 41 of 47 transitive vulnerabilities in nexacore-api. Production dependencies now have 0 vulnerabilities. Remaining 6 moderate are dev-only (ajv via @nestjs/cli), accepted risk.

- **Scope**: backend
- **Branch**: `feature/SCRUM-202-backend`
- **Date**: 2026-03-13

## Plan Reference

- Plan: `ai-specs/changes/plans/Sprint 9/SCRUM-202_backend.md`
- Plan was followed: **Partially** — lodash override worked directly (no need for accept-risk fallback), and mjml stub used `empty-npm-package` instead of local stub

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `756cf54` | fix(deps): remediate 41 transitive npm vulnerabilities (SCRUM-202) | `nexacore-api/package.json`, `nexacore-api/package-lock.json` |

## Deviations from Plan

| Step | Planned | Actual | Reason | Follow-up |
|------|---------|--------|--------|-----------|
| Step 1 | Multiple approaches for mjml exclusion | Used `npm:empty-npm-package@1.0.0` override directly | Simplest approach worked on first try | Accepted |
| Step 3 | Override or accept-risk for lodash | Override `>=4.17.22` resolved it (4.17.23 exists outside vuln range) | lodash 4.17.23 already available, only chevrotain pinned to 4.17.21 | Accepted |

## Test Results

- Unit tests: 849 passed / 0 failed (54 suites)
- `nest build`: clean compilation (after `prisma generate`)
- `npm audit --omit=dev`: 0 vulnerabilities
- `npm audit`: 6 moderate (all dev-only, ajv via @nestjs/cli)

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Updated header to SCRUM-202, added changelog entry |

## Lessons Learned

- npm `overrides` is powerful for transitive vulnerability remediation without touching direct dependencies
- `optionalDependencies` (like mjml in @nestjs-modules/mailer) can be safely stubbed when the optional feature isn't used
- Always run `prisma generate` after `rm -rf node_modules && npm install` — Prisma client needs regeneration
- The `empty-npm-package` npm package (v1.0.0) is a clean stub for replacing unwanted transitive deps
