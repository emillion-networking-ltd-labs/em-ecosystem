# Implementation Record: SCRUM-349 Auth UX consistency + cross-tab session sync

## Summary

Closed 2 of 3 deferred follow-ups from SCRUM-342 (sub-task 3 — audit-standards.mdc Section 6.7 — was already shipped via SCRUM-347 commit `5ec1199`). Severity LOW.

- **Scope**: frontend
- **Branch**: `feature/SCRUM-349-frontend` (merged + deleted after PR #235)
- **Implementation date**: 2026-05-04

## Plan Reference

- Plan: [`ai-specs/changes/auth/plans/Sprint 12/SCRUM-349_frontend.md`](../../plans/Sprint%2012/SCRUM-349_frontend.md)
- Verify: [`ai-specs/changes/auth/plans/Sprint 12/SCRUM-349_verify.md`](../../plans/Sprint%2012/SCRUM-349_verify.md) — Verdict **PASS**
- Plan was followed: **Yes** — 5/6 steps DONE in branch + 1 DEFERRED (Documentation step → this run).

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `f552c7c` | SCRUM-349: Auth UX consistency + cross-tab session sync | 5 files (2 components, 1 context, 1 hook NEW, 1 test NEW); 259 insertions, 4 deletions |

PR #235 merged into `main` at 2026-05-04 ~01:10 UTC. Built on top of SCRUM-347 (`ff36b4a`).

## Deviations from Plan

(Imported from `/verify` PASS report.)

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| Sub-task 3 | Add audit-standards.mdc Section 6.7 in this branch | NOT in this branch — already in main via SCRUM-347 commit `5ec1199` | Pre-existing carry-over from SCRUM-347 audit-gate work | Pre-existing | — (already in main) |
| Step 4 — AUTH_SUCCESS broadcast | Wire into the 5 login dispatch sites | NOT wired (only LOGOUT broadcasts) | Listener is no-op for AUTH_SUCCESS by plan; speculative emission adds clutter without behavior change | Accepted-Trivial | — (reserved for future "freshen user info" use case) |
| Step 6 — Documentation | Update frontend-standards.mdc + integration-state.md Changelog | Deferred to /update-docs | Per plan + standard convention | Deferred | This run (record + Changelog updates) |

**0 Risk, 0 Scope-Gap.**

## Test Results

- 5 new in `useCrossTabAuth.test.ts` (broadcast LOGOUT, broadcast AUTH_SUCCESS, malformed-ignored, cleanup-on-unmount, no-op fallback). All pass.
- 23/23 SCRUM-349-relevant specs pass (TrustedDevices + PasskeyManager + new hook).
- Full frontend suite: 13 pre-existing failures (unchanged baseline). 0 new regressions.
- 0 TS errors on changed files. 0 lint regressions.

## Bugs Found

None.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Added Changelog row for SCRUM-349. |
| `ai-specs/changes/auth/records/Sprint 12/SCRUM-349_frontend.md` | This record. |
| `ai-specs/specs/audit-standards.mdc` | Already updated in SCRUM-347's `/update-docs` (Section 6.7). No changes here. |
| `ai-specs/specs/frontend-standards.mdc` | No changes — sub-task 1 reinforces the existing toast-only convention from SCRUM-342; no NEW rule introduced. |

## Audit Finding Verification

Not an audit-fix ticket. SCRUM-349 is a deferred follow-up of SCRUM-342, not an audit framework finding.

## Lessons Learned

- **Sub-task interleave with parent ticket**: sub-task 3 was logically part of SCRUM-349 but the parent ticket (SCRUM-347) needed it earlier as part of its audit gate. Shipping it via SCRUM-347's `/update-docs` was the right call — avoids artificial dependency chains. Documenting it as Pre-existing carry-over keeps SCRUM-349's record honest.
- **`useRef` for `onEvent` stability**: passing `onEvent` directly into the BroadcastChannel mount-effect would re-create the channel on every callback identity change. Using a ref to keep the latest callback while keeping the effect mount-only is the cleaner pattern.
- **Effect-based observation for hook-internal state**: `usePasskey().rateLimitInfo` is a hook-internal state not surfaced via callback return. Components observing it must use `useEffect` + `useRef` for transition detection rather than checking the return value of `registerPasskey`. Reusable pattern documented inline.
- **BroadcastChannel scope education**: documenting "incognito = separate profile" in the JSDoc upfront avoids confusion in code review. Same with "97% browser support" — sets the right expectations vs `localStorage` event fallback debates.
- **Test BroadcastChannel via in-process polyfill**: jsdom doesn't ship BroadcastChannel; a tiny mock pub/sub registry mirrors the same-process semantics (does NOT deliver to originating channel). Reusable for future hooks that need the same primitive.
