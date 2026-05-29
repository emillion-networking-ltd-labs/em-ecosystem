# Implementation Record: SCRUM-125 Update Outdated npm Packages (DEP-02)

## Summary

Ran `npm audit fix` + `npm update` to resolve dependency vulnerabilities flagged by DEP-02 audit finding. Fixed 6 HIGH vulnerabilities (multer DoS, serialize-javascript RCE, minimatch ReDoS). Updated 54 packages within semver ranges. Remaining 47 vulnerabilities all require `--force` (breaking changes) — accepted risk.

- **Scope**: backend
- **Branch**: `feature/SCRUM-125-backend`
- **Implementation date**: 2026-03-04
- **PR**: #24

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 3/SCRUM-125_backend.md`
- **Plan was followed**: Yes — all steps executed as planned. No deviations.

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `feebcad` | chore(SCRUM-125): update npm dependencies and fix security vulnerabilities (DEP-02) | `nexacore-api/package-lock.json` (653 insertions, 790 deletions) |

## Deviations from Plan

Implementation followed the plan exactly.

## Test Results

- **Tests**: 773 passed / 0 failed (43 suites) — zero regressions after update
- **Build**: `nest build` — zero TypeScript errors
- **No new tests**: Dependency update only, no code changes

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Updated header (SCRUM-124 → SCRUM-125), added SCRUM-125 changelog entry |

## Vulnerability Resolution Detail

| Vulnerability | Severity | Status | Resolution |
|--------------|----------|--------|------------|
| multer DoS (incomplete cleanup + resource exhaustion) | HIGH | Fixed | @nestjs/platform-express 11.1.14→11.1.15 |
| serialize-javascript RCE (RegExp.flags) | HIGH | Fixed | terser-webpack-plugin upgrade |
| minimatch ReDoS (nested extglobs) | HIGH | Fixed | Patched versions via npm audit fix |
| glob command injection (via @nestjs-modules/mailer) | HIGH | Accepted risk | Requires --force; static templates only, no user input |
| html-minifier ReDoS (via mjml/mailer) | HIGH | Accepted risk | Requires --force; static templates only |
| hono XSS + cache deception (via prisma internals) | moderate | Accepted risk | Requires prisma major downgrade |
| lodash prototype pollution (via prisma/chevrotain) | moderate | Accepted risk | Requires prisma major downgrade |
| ajv ReDoS (via @nestjs/cli) | moderate | Accepted risk | devDep only, not in production bundle |

### Key package updates (via npm update)

| Package | From | To |
|---------|------|----|
| @nestjs/common, core, platform-express, testing | 11.1.14 | 11.1.15 |
| @prisma/client, prisma | 7.4.0 | 7.4.2 |
| @prisma/adapter-pg | 7.4.1 | 7.4.2 |
| pg | 8.18.0 | 8.19.0 |
| class-validator | 0.14.3 | 0.14.4 |
| eslint | 9.39.2 | 9.39.3 |
| typescript-eslint | 8.56.0 | 8.56.1 |
| @types/pg | 8.16.0 | 8.18.0 |
| @types/node | 22.19.11 | 22.19.13 |
| @eslint/eslintrc | 3.3.3 | 3.3.4 |
| @eslint/js | 9.39.2 | 9.39.3 |

## Lessons Learned

- **npm audit fix without --force is safe**: Resolved 6 HIGH vulnerabilities with zero test regressions. The --force flag should only be used in a dedicated major-upgrade ticket with thorough regression testing.
- **Transitive dep debt**: 47 remaining vulnerabilities are all in transitive dependencies of 3 packages (@nestjs-modules/mailer, prisma, @nestjs/cli). Consider evaluating alternatives for mailer (mjml dependency tree is the largest source).
- **Rectified**: Individual branch/commit/PR replacing bulk commit `e0f12f7`.
