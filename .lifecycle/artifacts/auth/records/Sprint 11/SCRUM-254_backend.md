# Implementation Record: SCRUM-254 — Update Guard Chain Table in integration-state.md

## Summary

Fixed 4 guard chain table drift issues in `integration-state.md`: corrected HTTP methods, added missing decorators, added missing endpoint, and split monolithic table into per-controller sections matching actual codebase structure.

- **Scope**: backend (docs-only)
- **Branch**: docs/SCRUM-254-guard-chain-table (deleted — no code changes)
- **Implementation date**: 2026-03-16

## Plan Reference

- **Plan**: ai-specs/changes/plans/Sprint 11/SCRUM-254_backend.md
- **Plan was followed**: Yes

## Commits

No commits — docs-only change to `ai-specs/specs/integration-state.md` (not version-controlled in em-ecosystem-code).

## Deviations from Plan

Implementation followed the plan exactly. No deviations.

## Test Results

N/A — documentation-only change. No source code modified.

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | (1) Updated controller overview table: added AccountController, OAuthController, SessionController with correct DI deps; corrected AuthController DI from 6→2 deps. (2) Split "AuthController Method Guards" into 4 sections: AuthController (8 routes), AccountController (7 routes), OAuthController (8 routes), SessionController (6 routes). (3) Fixed verify-email/verify-email-change GET→POST with @SkipCsrf, @Throttle. (4) Added missing @SkipCsrf on validate-reset-token. (5) Added missing POST /auth/link/code with JwtAuthGuard. (6) Added changelog entry. |

## Lessons Learned

- Guard chain documentation drift accumulates when controllers are split into separate files (AccountController, OAuthController, SessionController were extracted from AuthController across multiple sprints) but integration-state.md is not updated to reflect the new structure.
- The audit framework (Phase 6 Integration) effectively catches this type of documentation drift.

---
*Record created: 2026-03-16 | Ticket: SCRUM-254*
