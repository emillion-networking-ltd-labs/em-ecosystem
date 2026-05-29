# Implementation Record: SCRUM-177 Document link/google and link/github Endpoints + Guard Chains

## 1. Summary

Documentation-only ticket. Added the two OAuth account linking endpoints (`GET /auth/link/google`, `GET /auth/link/github`) and the `OAuthLinkGuard` to `api-spec.yml` and `integration-state.md`. These were implemented in SCRUM-161 but their documentation was missed.

- **Scope**: backend (documentation-only)
- **Branch**: N/A (no code changes — only ai-specs documentation files modified)
- **Implementation date**: 2026-03-12

## 2. Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 7/SCRUM-177_backend.md`
- **Plan was followed**: Yes

## 3. Commits

No commits — documentation-only ticket with no code changes in em-ecosystem-code repository.

## 4. Deviations from Plan

Implementation followed the plan exactly.

## 5. Test Results

N/A — no code changes, no tests to run.

## 6. Bugs Found

No bugs found during implementation.

## 7. Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Added `OAuthLinkGuard` to Guard Dependency Map (deps: JwtService, AuthModule/JwtModule). Added `GET /link/google` and `GET /link/github` to AuthController Method Guards table. Added changelog entry. |
| `ai-specs/specs/api-spec.yml` | Added `/auth/link/google` and `/auth/link/github` endpoint definitions with BearerAuth security, `?token=` query param, 302/401 responses. |
| `ai-specs/changes/records/Sprint 7/SCRUM-177_backend.md` | Created implementation record |

## 8. Lessons Learned

- OAuth link endpoints were implemented in SCRUM-161 (post-merge fix) but documentation was missed because the fix was reactive rather than plan-driven. Audit findings catch these documentation gaps.
- Documentation-only tickets don't require a code branch or PR when the docs live outside the code repository.
