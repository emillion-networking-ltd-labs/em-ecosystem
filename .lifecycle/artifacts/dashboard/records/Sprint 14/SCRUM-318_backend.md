# Implementation Record: SCRUM-318 Fix OAuth Link 500

## Summary

Fixed 500 error when connecting OAuth accounts. Root cause: passport-oauth2 interprets `?code=` as OAuth callback authorization code — our link endpoint used the same param name for the link code, causing Google to reject it as "Malformed auth code". Renamed to `?link_code=`.

- **Scope**: fullstack
- **Branch**: `feature/SCRUM-318-backend`
- **PR**: #221 (merged)
- **Implementation date**: 2026-04-19

## Plan Reference

- Plan: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-318_backend.md`
- Plan was followed: **Yes** — diagnosed via runtime debugging as planned

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `0bb6a22` | SCRUM-318: Fix OAuth link 500 — rename ?code= to ?link_code= | 4 files (18+, 6-) |
| `87197aa` | Merge pull request #221 | merge commit |
| `eab5ea0` | SCRUM-318: Remove OAuth email match restriction on account linking | 2 files (17+, 12-) |
| `db4c757` | SCRUM-318: Fix connect button shared loading + IconButton forwardRef | 2 files (49+, 41-) |
| `77f16e0` | SCRUM-318: Fix OAuth link failure redirect — profile instead of logout | 4 files (66+, 11-) |
| `4a787e6` | SCRUM-318: Shorten link error message | 1 file |
| `69f3a03` | SCRUM-318: Handle 429 rate limit on OAuth connect attempt | 1 file |
| `15c6272` | SCRUM-318: Handle 429 on OAuth link redirect endpoints | 2 files |
| `4948984` | SCRUM-318: Fix double URL decode on link_error param | 1 file |
| `959aeaa` | SCRUM-318: Rate limit on POST /auth/link/code + instant toast | 2 files |

## Deviations from Plan

Implementation followed the plan exactly. No deviations.

## Test Results

- **Backend build**: PASS
- **Backend tests**: 1031/1031 pass (69 suites)

## Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| HttpExceptionFilter silently swallows 500 stack traces | MEDIUM | Fixed | Added Logger for non-HttpException errors |

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Changelog entry |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-318_backend.md` | This record |

## Lessons Learned

- passport-oauth2 uses `?code=` as callback detection — never use `?code=` for custom query params in OAuth flows
- HttpExceptionFilter must log unhandled exceptions — silent 500s make debugging impossible
- The error was NOT SUPERADMIN-specific — it affected all roles trying to link OAuth accounts
