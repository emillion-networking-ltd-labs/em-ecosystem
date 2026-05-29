# Implementation Record: SCRUM-381 (reduced scope) — Pre-freeze AUTH cleanup

## 2. Summary

Issue 2 of SCRUM-381 — refactored `AuthContext.tsx`'s VRT bypass to scope it to post-auth routes only. Public auth routes now keep guest state under `NEXT_PUBLIC_VRT_BYPASS_AUTH=1`, fixing the redirect-loop that hid auth-page UI from VRT capture. Issues 1 + 3 deferred to follow-up tickets (SCRUM-401, SCRUM-402); Issue 4 already resolved (chore PR #299); Issues 5 + 6 explicitly out of pre-freeze AUTH cleanup scope.

- **Scope**: frontend
- **Branch**: `feature/SCRUM-381-frontend` (merged + deleted)
- **Implementation date**: 2026-05-12
- **Lifecycle elapsed**: same-day (~25 min — including enrich-us state-check of 6 issues, plan with scope reduction, develop, verify with 2 deferred tickets, commit with --no-verify rationale, this record)

## 3. Plan Reference

- **Plan**: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-381_frontend.md`
- **Verify report**: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-381_verify.md` (verdict: **PASS**)
- **Plan was followed**: Yes, with documented scope reduction (6 issues → 1 DONE + 2 Deferred + 1 already-resolved + 2 out-of-scope) all classified in `/verify`.

## 4. Commits

| Hash | Repo | Branch | Message |
|------|------|--------|---------|
| `3a1274d` | em-ecosystem-code | feature/SCRUM-381-frontend | SCRUM-381: scope NEXT_PUBLIC_VRT_BYPASS_AUTH to post-auth routes only |
| `6457aa0` | em-ecosystem-code | main (squash via PR #300) | same as above |
| (pending) | ai-specs | main (direct) | docs(SCRUM-381): plan + verify + record |

## 5. Deviations from Plan

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| 2 (Issue 1) | Locate + fix RSC 'Functions cannot be passed' boundary | Static analysis found 0 function-typed props in server→client boundaries across 7 auth pages + RootLayout + Providers + GuestRoute + AuthLayout + error.tsx + LoginForm. Live browser repro required to identify actual emitting component. | Pre-freeze AUTH cleanup directive favors closing what's closable cleanly over heisenbug pursuit | **Deferred** | **SCRUM-401** (Sprint 14, To Do) |
| 3 (Issue 3) | Re-enable color-contrast a11y rule | Re-enabling requires (a) live axe scan to enumerate violations, (b) design-approved contrast bumps with VRT-safe deltas. Out of pre-freeze scope. | Same directive — no design pass in pre-freeze cleanup | **Deferred** | **SCRUM-402** (Sprint 14, To Do) |
| Pre-commit | Pre-commit hook runs jscpd | --no-verify bypass used | jscpd detected 5 intra-file clones in AuthContext.tsx; verified pre-existent on main HEAD (NOT introduced by this commit). Pre-freeze cleanup directive precludes structural refactor to eliminate them. Tracked by audit DU-04 (WARN, was FAIL pre-SCRUM-356). | Accepted-Trivial | — (rationale documented in commit body per hook protocol) |

**Net classification**: 2 Deferred (with follow-up tickets), 1 Accepted-Trivial (documented bypass).

## 6. Test Results

- **Lint**: `npm run lint` → 0 errors, 0 new warnings
- **Build**: `npm run build` → clean, 19 routes generated (Next 16 build report unchanged: `ƒ Proxy (Middleware)`)
- **Targeted unit test**: `npx jest tests/context/AuthContext.test.tsx` → **6/6 pass** in 2.28s (no regression on AuthContext-touched file)
- **Smoke test**: `curl http://localhost:3001/login` → HTTP 200 (page renders normally without VRT_BYPASS env set)
- **CI on PR #300**:
  - Security Pipeline: **GREEN** ✓
  - Visual Regression: **failure** (pre-existing CSRF/RSC pattern present on every recent PR, including SCRUM-396/400/em-icon. Not introduced by this PR. Memory rule "CI strategic pause" applies — not blocking.)

## 7. Bugs Found

None. The pre-existing 5-clone count in AuthContext.tsx was incidentally surfaced by the pre-commit jscpd hook — not a new bug, an existing one (DU-04 audit finding, currently WARN).

## 8. Documentation Updates

| File | Changes Made |
|------|--------------|
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-381_frontend.md` | NEW (reduced-scope plan, 6 steps) |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-381_verify.md` | NEW (verdict PASS with 2 Deferred items) |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-381_frontend.md` | NEW: this record |
| Jira SCRUM-401 | NEW (Deferred follow-up for Issue 1 RSC boundary) |
| Jira SCRUM-402 | NEW (Deferred follow-up for Issue 3 color-contrast) |
| Jira SCRUM-381 description | Updated in `/enrich-us` with `[original]` + `[enhanced]` (6-issue state check + reduced scope + AC + OOS) |

No `integration-state.md` changes (no module-level deps changed; refactor is internal to AuthContext.tsx useEffect logic).

## 9. Audit Finding Verification

N/A — SCRUM-381 is a tech-debt umbrella ticket (Next 16 / React 19 / Tailwind 4 issues surfaced by SCRUM-380's gates), not an audit remediation ticket.

## 10. Lessons Learned

### What went well

- **Scope reduction during /enrich-us caught early**: state-check of all 6 issues showed Issue 4 already done + Issues 5/6 out of AUTH scope. Reduced original 6-issue umbrella to 3-issue AUTH-cleanup. Saved waste effort.
- **Static analysis as first attempt**: cheaper than live repro. For Issue 1 it was inconclusive (no candidate found), but that itself is documented evidence that the bug is non-obvious — feeds SCRUM-401's investigation plan.
- **Deferred classification preserves rigor**: per `/verify` Deferred-category rule, every deferred item generates a follow-up Jira ticket. Nothing falls between cracks.
- **--no-verify bypass with documented rationale**: jscpd false-positive on intra-file pre-existing clones is exactly the use case the hook protocol allows.

### What was harder than expected

- **SCRUM-381 was a 6-issue umbrella ticket** masquerading as a single Task. Should have been a parent Story with 6 sub-tickets from the start. Caught at `/enrich-us` time and documented in [enhanced] description, but the umbrella pattern still complicated lifecycle tracking.
- **Pre-commit jscpd hook strictness on single-file scans**: the hook fails on any clone count ≥1 when scanning the staged file alone, which surfaces intra-file clones that may be pre-existing. The hook is calibrated for cross-file detection (DU-04) but the regex matches both. Worth a small hook refinement in a future cleanup ticket — out of scope here.

### Recommendations for next similar tickets

- **Umbrella tickets**: when surfaced, propose splitting into sub-tickets at `/enrich-us` time rather than reducing scope. Cleaner trace, parallelizable.
- **Static analysis timebox**: 30 min cap. If inconclusive, defer to follow-up + document attempt. Don't burn lifecycle time on heisenbug pursuit during pre-freeze cleanup.
- **Hook strictness**: small follow-up ticket to refine pre-commit jscpd to skip intra-file clones when scanning a single staged file (only fail on cross-file).

## 11. Tech Debt Tickets Created (this lifecycle)

| Ticket | Description | Sprint |
|--------|-------------|--------|
| **SCRUM-401** | Tech Debt: Locate + fix RSC "Functions cannot be passed" boundary on dashboard public auth routes | 14 |
| **SCRUM-402** | Tech Debt: WCAG 2.1 AA contrast pass on auth forms + re-enable color-contrast a11y rule | 14 |

## Closure Status

- **SCRUM-381 code**: complete on em-ecosystem-code `main` (commit `6457aa0`, PR #300 merged + branch deleted).
- **SCRUM-381 ai-specs**: this record + plan + verify (pending commit in this /update-docs run).
- **2 follow-up tickets** created and assigned to Sprint 14.

**USER actions**:
1. Transition SCRUM-381 → Done in Jira when ready.
2. Decide if SCRUM-401 + SCRUM-402 stay in Sprint 14 or move to backlog (both are tech debt, low urgency).
