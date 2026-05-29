# Implementation Record: SCRUM-316 Fix 401 Race Condition in ApiClient

## Summary

Fixed race condition where concurrent API requests receiving 401 caused generic errors ("Load users failed") instead of clean SessionExpiredError. Root cause: `&& this.accessToken` guard prevented subsequent requests from entering refresh path after first request cleared the token.

- **Scope**: frontend
- **Branch**: `feature/SCRUM-316-frontend`
- **PR**: #211 (merged)
- **Implementation date**: 2026-04-18

## Plan Reference

- Plan: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-316_frontend.md`
- Plan was followed: **Yes**

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `cb5446a` | SCRUM-316: Fix 401 race condition in ApiClient | 2 files (21+, 5-) |
| `4565782` | Merge pull request #211 | merge commit |

## Deviations from Plan

Implementation followed the plan exactly. No deviations.

## Test Results

- **Frontend build**: PASS
- **Frontend TypeScript**: 0 new errors

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Changelog entry |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-316_verify.md` | Verification report |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-316_frontend.md` | This record |

## Lessons Learned

- Concurrent 401 handling requires all requests to either await the shared refreshPromise or throw SessionExpiredError — never fall through to generic error handling
- `onAuthFailure` (logout trigger) must be guarded to prevent multiple calls during concurrent request failures
- The reactive refresh pattern (on 401) is correct per RFC 9700/OWASP — the bug was implementation-level, not architectural
