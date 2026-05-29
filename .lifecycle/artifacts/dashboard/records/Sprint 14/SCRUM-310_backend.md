# Implementation Record: SCRUM-310 Admin Soft Delete Fix

## Summary

Admin DELETE /users/:id rewritten to anonymize PII (GDPR-compliant) instead of only setting isActive=false. Shared anonymizeAndDelete method extracted for both admin and self-delete. deletedAt field added to User model. User stats MetricCards added to Admin page.

- **Scope**: fullstack (backend + frontend)
- **Branch**: `feature/SCRUM-310-backend`
- **PR**: #210
- **Implementation date**: 2026-04-18

## Plan Reference

- Plan: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-310_backend.md`
- Plan was followed: **Yes** with beneficial additions

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `4aeff9d` | SCRUM-310: Admin soft delete with PII anonymization + user stats | 8 files (218+, 73-) |

## Deviations from Plan

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| — | Backend only | Added frontend MetricCards | User requested admin stats during development | Accepted-Trivial | — |
| — | Not planned | Added isActive filter to ListUsersQueryDto | Needed for Active Users counter (was broken pre-existing) | Accepted-Trivial | — |
| — | Not planned | ActionDropdown edge detection bug found | Created SCRUM-314 for separate fix | Deferred | SCRUM-314 |
| — | Not planned | SUPERADMIN enforcement gap found | Created SCRUM-315 for separate fix | Deferred | SCRUM-315 |

### Unplanned additions
- `ListUsersQueryDto`: `isActive` boolean filter with `@Transform` for query string conversion
- `admin/page.tsx`: 4 MetricCards (Total/Active/Locked/Admins) in collapsible Accordion, fetchStats on user actions
- `anonymizeAndDelete` also cleans OAuthAccount, TrustedDevice, WebAuthnCredential (gaps in selfDeleteAccount fixed)

## Test Results

- **Backend build**: PASS (nest build clean)
- **Backend tests**: 1014/1014 pass (68/68 suites)
- **Frontend build**: PASS (npm run build compiled successfully)

## Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| Active Users counter broken (isActive not supported in DTO) | LOW | Fixed | Added isActive filter to ListUsersQueryDto + findAll |
| ActionDropdown clipped at viewport bottom | LOW | Deferred | Created SCRUM-314 |
| SUPERADMIN role assignable but irreversible | MEDIUM | Deferred | Created SCRUM-315 |

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/data-model.md` | Added `deletedAt DateTime?` to User entity |
| `ai-specs/specs/integration-state.md` | Changelog entry |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-310_backend.md` | This record |

## Lessons Learned

- selfDeleteAccount had gaps: missing OAuthAccount, TrustedDevice, WebAuthnCredential cleanup and avatarOriginalUrl/avatarCropData nulling — extracting shared method fixed both paths
- isActive filter was never wired up in the DTO — the "Active Users" counter on overview was always showing same as total
- Admin stats are a natural fit for the User Management page, not just the overview
- SUPERADMIN role management needs guardrails — allowing promotion without demotion is a security gap
