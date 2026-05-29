# Implementation Record: SCRUM-230 — Update Mock Requirements Table (I-07)

## Summary

Updated Test Mock Requirements table in integration-state.md to reflect the post-SCRUM-197 controller split. Replaced 1 stale AuthController row (7 combined deps) with 4 accurate rows matching actual constructors. Documentation-only, no code changes. ISO 25010 Maintainability.

- **Scope**: backend (docs-only)
- **Branch**: N/A (no code changes — feature branch deleted without commit)
- **Date**: 2026-03-14

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 10/SCRUM-230_backend.md`
- **Plan followed**: Yes (0 deviations)

## Commits

No commits — documentation-only change in `ai-specs` (not tracked in `em-ecosystem-code` repo).

## Deviations from Plan

Implementation followed the plan exactly.

## Test Results

N/A — no code changes.

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/ai-specs/specs/integration-state.md` | Replaced 1 stale AuthController mock row with 4 post-split controller rows: AuthController (2 deps), OAuthController (3 deps), AccountController (1 dep), SessionController (3 deps). Removed TurnstileService (APP_GUARD, not controller dep). Added OAuthLinkCodeStore. Changelog entry. |

## Lessons Learned

- Documentation drift is inevitable after refactoring tickets (SCRUM-197 split AuthController but didn't update the mock table). Each refactoring ticket should include a documentation update step for integration-state.md.
- TurnstileService was listed as a controller dependency but is actually an APP_GUARD registered via SecurityModule — it's auto-resolved and doesn't need explicit mocking in controller tests.
