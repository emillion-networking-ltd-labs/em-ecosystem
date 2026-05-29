# Implementation Record: SCRUM-109 Suspicious Login Detection + Alerting

## Summary

Implemented `SuspiciousLoginService` with 4 real-time detection methods (brute-force, credential stuffing, unusual login hours via circular statistics, new country login) integrated at 5 login points in `AuthService`. All detections follow fail-open pattern with fire-and-forget execution. Extended `AuditService` (3 time-window query methods), `MailService` (2 alert methods + 2 HBS templates), added 4 `AuditAction` enum values, 2 Prisma composite indexes, and 6 env-configurable thresholds.

- **Scope**: backend
- **Branch**: `feature/SCRUM-109-backend`
- **Implementation date**: 2026-03-03

## Plan Reference

- **Original plan**: `ai-specs/changes/plans/Sprint 3/SCRUM-109_backend.md`
- **Plan was followed**: Yes — implementation matched all 14 steps including the Step 10 revision (PrismaService for admin emails instead of UsersService)

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `94013b3` | feat(SCRUM-109): add suspicious login detection and alerting | 16 files (see below) |

**Files changed (16 total, 1419 insertions):**

| File | Change |
|------|--------|
| `nexacore-api/.env.example` | +6 suspicious login env vars |
| `nexacore-api/prisma/schema.prisma` | +4 enum values, +2 composite indexes |
| `nexacore-api/src/audit/audit.service.ts` | +3 time-window methods (countRecentActions, countRecentActionsByIp, hasRecentAction) |
| `nexacore-api/src/audit/enums/audit-action.enum.ts` | +4 enum values |
| `nexacore-api/src/audit/tests/audit.service.spec.ts` | +findFirst mock, +4 tests |
| `nexacore-api/src/auth/auth.module.ts` | +SecurityModule import |
| `nexacore-api/src/auth/auth.service.ts` | +SuspiciousLoginService (12th dep), +2 helper methods, +5 integration points |
| `nexacore-api/src/auth/tests/auth.service.spec.ts` | +SuspiciousLoginService provider/mock, +4 tests |
| `nexacore-api/src/mail/mail.service.ts` | +2 methods (sendSecurityAlertToAdmins, sendNewCountryLoginAlert) |
| `nexacore-api/src/mail/templates/new-country-login-alert.hbs` | NEW — user-facing email template |
| `nexacore-api/src/mail/templates/security-alert-admin.hbs` | NEW — admin security alert template |
| `nexacore-api/src/mail/tests/mail.service.spec.ts` | +4 tests |
| `nexacore-api/src/security/constants/suspicious-login.constants.ts` | NEW — 6 env-configurable constants |
| `nexacore-api/src/security/security.module.ts` | +AuditModule, MailModule imports; +SuspiciousLoginService provider/export |
| `nexacore-api/src/security/suspicious-login.service.ts` | NEW — 322-line service, 4 detection + 2 orchestrator methods |
| `nexacore-api/src/security/tests/suspicious-login.service.spec.ts` | NEW — 448-line test file, ~29 tests |

## Deviations from Plan

Implementation followed the plan exactly, including the self-revised approach:

| Step | Planned (initial) | Actual | Reason |
|------|-------------------|--------|--------|
| Step 7 | SecurityModule imports UsersModule | SecurityModule does NOT import UsersModule | Plan Step 10 revised this: admin emails fetched via PrismaService directly, removing UsersService dependency |
| Step 8 | Pass `currentCountry` to `analyzeLoginSuccess()` | `analyzeLoginSuccess()` has no `currentCountry` param | Plan Step 8 final decision: SuspiciousLoginService queries latest session internally |

Both deviations were planned revisions documented within the plan itself (Steps 8 and 10).

## Test Results

- **Overall coverage**: stmts 98.82%, branches 86.64%, funcs 96.8%, lines 98.89%
- **Unit tests**: 665 passed / 0 failed (40 suites)
- **Integration tests**: N/A (unit-test-only scope)
- **New tests added**: ~41 total
  - `suspicious-login.service.spec.ts`: ~29 tests (all 4 detections + orchestrators + admin email query + fail-open)
  - `audit.service.spec.ts`: +4 tests (countRecentActions, countRecentActionsByIp, hasRecentAction x2)
  - `mail.service.spec.ts`: +4 tests (sendSecurityAlertToAdmins x2, sendNewCountryLoginAlert x2)
  - `auth.service.spec.ts`: +4 tests (analyzeLoginFailure, analyzeLoginSuccess, fail-open x2)
- **No regressions**: All pre-existing tests pass

## Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| `prisma.config.ts` compiled to `.js` by `nest build`, breaking `npx prisma generate` | MEDIUM | Fixed | Deleted `prisma.config.js`, `.js.map`, `.d.ts` artifacts; `.gitignore` already excludes them (SCRUM-108) |
| `SuspiciousLoginService` mock missing from `auth.service.spec.ts` main providers | HIGH | Fixed | Added provider block + `module.get()` assignment |
| `findFirst` mock missing from audit test Prisma mock object | LOW | Fixed | Added `findFirst: jest.fn().mockResolvedValue(null)` to mock |

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | SecurityModule row (imports, exports), AuthModule row (+SecurityModule), dependency chains (+SuspiciousLoginService), test mock requirements, changelog entry |
| `ai-specs/specs/data-model.md` | +4 AuditAction enum values (BRUTE_FORCE_DETECTED, CREDENTIAL_STUFFING_DETECTED, UNUSUAL_LOGIN_HOURS, NEW_COUNTRY_LOGIN), +2 composite indexes |
| `nexacore-api/.env.example` | +6 suspicious login detection env vars (BRUTE_FORCE_WINDOW_MINUTES, BRUTE_FORCE_THRESHOLD, CREDENTIAL_STUFFING_THRESHOLD, UNUSUAL_HOURS_SAMPLE_SIZE, UNUSUAL_HOURS_STDDEV_THRESHOLD, UNUSUAL_HOURS_MIN_LOGINS) |

## Lessons Learned

- **What went well**: The plan's detailed codebase state snapshot and constructor signatures made implementation smooth even when resuming from a broken session. The fail-open + fire-and-forget pattern established by SCRUM-108 provided a clean template to follow.
- **What was harder than expected**: Prisma config file compilation artifacts (`.js`/`.d.ts` files from `nest build`) can interfere with `npx prisma generate` — this is a recurring issue that was previously addressed in `.gitignore` but still manifests locally.
- **Recommendations**: For future tickets adding dependencies to AuthService (now at 12 injected services), consider whether the dependency can be kept in a separate module (like SecurityModule) to avoid further bloating AuthService's constructor. The current pattern of importing the module and injecting a single orchestrator service works well.
