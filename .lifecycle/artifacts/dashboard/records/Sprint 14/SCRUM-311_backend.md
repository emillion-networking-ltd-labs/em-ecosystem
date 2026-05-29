# Implementation Record: SCRUM-311 Download OAuth Avatar Locally

## Summary

OAuth avatar URLs (Google/GitHub) now downloaded server-side and stored locally via FileStorageService instead of saving external URLs. Prevents CSP blocking, expired URLs, and external dependency.

- **Scope**: backend
- **Branch**: `feature/SCRUM-311-backend`
- **PR**: #212 (merged)
- **Implementation date**: 2026-04-18

## Plan Reference

- Plan: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-311_backend.md`
- Plan was followed: **Yes**

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `7ebdacc` | SCRUM-311: Download and store OAuth avatar locally | 2 files (176+, 9-) |
| `48bfc61` | Merge pull request #212 | merge commit |

## Deviations from Plan

Implementation followed the plan exactly. No deviations.

## Test Results

- **Backend build**: PASS (nest build clean)
- **Backend tests**: 1016/1016 pass (68/68 suites, +2 new tests)

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Changelog entry |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-311_verify.md` | Verification report |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-311_backend.md` | This record |

## Lessons Learned

- OAuth avatar download must be fire-and-forget (try/catch with null return) — login flow cannot depend on external image availability
- AbortSignal.timeout(5000) is clean Node 18+ API for request timeouts
- Key format separation (`{userId}-oauth.{ext}` vs `{userId}-{ts}-cropped.{ext}`) prevents OAuth/manual avatar collisions
