# Implementation Record: SCRUM-186 Fix npm Production Vulnerabilities

## 1. Summary
- Remediated 47 npm production vulnerabilities (40 HIGH, 7 moderate) via audit fix, semver-compatible updates, and npm overrides. Reduced to 41 (31 HIGH — all from single html-minifier advisory via mjml, accepted risk).
- **Scope**: backend
- **Branch**: `feature/SCRUM-186-backend`
- **Date**: 2026-03-12

## 2. Plan Reference
- **Plan**: `ai-specs/changes/plans/Sprint 7/SCRUM-186_backend.md`
- **Plan followed**: Partially — added glob override (Step 7 adaptation), target of 0 HIGH not achievable due to html-minifier/mjml with no upstream fix.

## 3. Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `4971f13` | fix(deps): remediate npm production vulnerabilities (SCRUM-186) | `nexacore-api/package.json`, `nexacore-api/package-lock.json` |

## 4. Deviations from Plan

| Step | Planned | Actual | Reason | Follow-up |
|------|---------|--------|--------|-----------|
| Step 6 | Target 0 HIGH in production | 31 HIGH remain (1 advisory: html-minifier) | No upstream fix for html-minifier via mjml → @nestjs-modules/mailer | Accepted |
| Step 7 | Overrides for hono only | Added glob ^10.5.0 override | glob 10.3.12 was in vulnerable range, override to 10.5.0 fixes it | Accepted |

## 5. Test Results
- **846 tests** passed across 46 suites
- Build succeeds (`nest build`)
- Prisma Client v7.5.0 generated successfully
- No tests skipped

## 6. Bugs Found

No bugs found during implementation.

## 7. Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Changelog entry for SCRUM-186 |

## 8. Lessons Learned
- npm overrides are effective for transitive dependency vulnerabilities when the direct parent hasn't updated yet
- html-minifier via mjml is a known ecosystem issue — @nestjs-modules/mailer bundles mjml which has no maintained alternative for html-minifier
- `npm audit fix --force` should never be used — it downgrades major versions (prisma 7→6, @nestjs/cli 11→7)
