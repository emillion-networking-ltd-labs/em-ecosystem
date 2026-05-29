# Implementation Record: SAT01-5 Pre-launch UI/UX Corrections (Iterative QA)

## Summary

Iterative QA polish pass on the cristian-garcia satellite ahead of production launch. Started from a 3-issue plan (parallax mobile fix, scroll restoration, splash gate + section-level IO) and grew to 24 issues across 2 commit rounds via the LIVING PLAN pattern — issues discovered during real-device testing on the deployed Vercel preview were appended to the same ticket and applied in batches.

- **Scope**: `frontend`
- **Branches**: `feature/SAT01-5-frontend` (round 1, deleted post-merge), `feature/SAT01-5-frontend-2` (round 2, deleted post-merge)
- **Implementation date**: 2026-05-01
- **Commits**: `2062073` (R1 work), `40a8bb0` (R1 merge — PR [#229](https://github.com/emillionnetworking-ltd-labs/em-ecosystem/pull/229)), `849a266` (R2 work), `8d2fa80` (R2 merge — PR [#230](https://github.com/emillionnetworking-ltd-labs/em-ecosystem/pull/230))
- **Production verified at**: https://sat-cristian-garcia.vercel.app

## Plan Reference

- Plan: [`SAT01-5_frontend.md`](../../plans/SAT01%20S2/SAT01-5_frontend.md) (LIVING PLAN — explicit Step 4 was added during the loop for rootMargin/threshold tuning; Issues #5–#24 were captured as Jira comments rather than appended plan steps to keep the document readable)
- Verify: [`SAT01-5_verify.md`](../../plans/SAT01%20S2/SAT01-5_verify.md) — verdict **PASS** for both rounds
- Plan was followed: **Yes, with one Accepted-Quality deviation** documented and corrected progressively within the same ticket.

## Commits

| Hash | Message | Files |
|---|---|---|
| `2062073` | SAT01-5: pre-launch UI/UX corrections (iterative QA pass) | 17 changed (16 satellite + 1 dashboard parity port), +386 / -149 |
| `40a8bb0` | Merge pull request #229 (round 1) | merge commit on `main` |
| `849a266` | SAT01-5 round 2: handle-only drag + sobre-mi image priority | 3 changed (2 satellite + 1 dashboard parity port; all 3 also in R1), +49 / -35 |
| `8d2fa80` | Merge pull request #230 (round 2) | merge commit on `main` |

## Deviations from Plan

| # | Step | Planned | Actual | Reason | Category | Follow-up |
|---|---|---|---|---|---|---|
| 1 | Step 3 (#3) → Issues #5, #22 | Refactor multiple sections from per-item `useFadeInOnView` to section-level `useStaggerOnView` | Refactor was applied, then **partially reverted** in 4 places: `/sobre-mi` timeline (Issue #5), `/contacto` cards, `PricingSection`, `/portfolio` Palmarés (Issue #22 audit) | Real-device testing revealed `useStaggerOnView` is wrong for layouts where children stack vertically on mobile and total height > 1 viewport (parent IO fires when first item is visible, animating items 2-N invisibly behind the fold). Pattern rule established mid-ticket: stagger only when ALL children fit in 1 mobile viewport simultaneously. | **Accepted-Quality** | **SAT01-2** (existing STYLE_GUIDE.md tech debt — extend scope to document `useStaggerOnView` vs `useFadeInOnView` pattern rule) |

**No Accepted-Risk items** (the original Issue #15 BeforeAfterSlider divergence was eliminated within this ticket by porting the same fix to `nexacore-dashboard`'s UI Core copy in commit `2062073`; round 2's Issue #23 maintained that parity). **No Deferred / Pre-existing / Scope-Gap items.**

## Test Results

| Check | Result | Details |
|---|---|---|
| Unit tests | N/A | Marketing satellite, no test framework (consistent with plan) |
| Build | **PASS** (both rounds) | `next build` clean from fresh `.next/`, 15 ○ Static routes, 87.3 kB First Load JS shared (matches SAT01-4 baseline — zero bundle regression across 24 issues) |
| Dashboard typecheck regression | **PASS** | `npx tsc --noEmit` from `nexacore-dashboard/` returns same 6 pre-existing errors before and after both BeforeAfterSlider modifications (Issues #15 + #23). All 6 errors are in `ComponentShowcase.tsx` and `error-boundaries.test.tsx`, unrelated to this ticket. |
| Pre-commit hooks | **PASS** (after Prettier --write fix) | Husky + Prettier flagged the dashboard BeforeAfterSlider file in both rounds; auto-fixed with `npx prettier --write` and re-staged. No content changes — formatting only. |
| Production deploys | **READY** (both rounds) | Vercel auto-deployed `40a8bb0` (R1) and `8d2fa80` (R2). Both production-target deployments READY in ~25s each. |
| Real-device runtime AC | **PASS** | User confirmed verification on real iOS device after each round. Round 1 covered Issues #1–#22; round 2 covered Issues #23–#24. |

## Bugs Found

The plan was a QA-discovery ticket — bugs WERE the deliverable. 24 distinct issues found and resolved. Notable categorisations:

| Bug | Severity | Resolution |
|---|---|---|
| Issue #3 misapplication of `useStaggerOnView` to vertical-stack-on-mobile layouts | MEDIUM | Pattern rule established + 4 sites converted back to per-item IO (Issues #5, #22). Documented under SAT01-2. |
| Issue #15 BeforeAfterSlider `onTouchStart` missing `preventDefault` — paritary defect with `onMouseDown` | LOW | Fixed in BOTH satellite and dashboard copies (parity preserved end-of-ticket) |
| Issue #18 sticky `:hover` on touch — site-wide | MEDIUM | One-line Tailwind config flip (`hoverOnlyWhenSupported: true`) — fixed every `hover:*` modifier across the entire satellite simultaneously |
| Issue #21 iOS Safari edge-swipe-back hijacking Lightbox horizontal drag | LOW | `touch-none` on image container |
| Issue #23 BeforeAfterSlider full-area drag hijacked vertical scroll on mobile | MEDIUM | Refactored to handle-only drag (Apple Photos / Mapbox pattern) — fixed in both satellite and dashboard copies |
| Issue #24 `/sobre-mi` portrait fade-in race with `next/image` lazy-load on cold first load | LOW | `priority` on `<Image>` for eager preload |

Full list of 24 issues + per-issue rationale lives in SAT01-5 Jira comments (10632–10687). No bugs were left unresolved at end-of-ticket.

## Documentation Updates

| File | Change |
|---|---|
| `ai-specs/changes/sat-cristian-garcia/plans/SAT01 S2/SAT01-5_frontend.md` | Plan (already authored at `/plan` time — frozen, not modified during /develop per spec) |
| `ai-specs/changes/sat-cristian-garcia/plans/SAT01 S2/SAT01-5_verify.md` | Verify report (NEW round 1 + round 2 section appended round 2; verdict PASS for both rounds) |
| `ai-specs/changes/sat-cristian-garcia/records/SAT01 S2/SAT01-5_frontend.md` | This record (NEW) |
| `ai-specs/specs/integration-state.md` | **No update needed** — satellite has no backend coupling; this doc is backend-only |
| `ai-specs/specs/data-model.md` | **No update needed** — no DB |
| `ai-specs/specs/api-spec.yml` | **No update needed** — no endpoints consumed |

## Lessons Learned

### What went well

- **LIVING PLAN scaled to 24 issues without scope drift**: starting from 3 planned issues, the ticket absorbed 21 more discovered during real-device testing without losing coherence. Each issue got its own Jira comment with diagnosis + fix + rationale (avg ~150 words), so the ticket reads as a clean changelog of decisions even though the plan document itself stayed at 3 + 1 explicit appended step. This is the right mode for QA polish — over-formalising would have slowed iteration.
- **Cross-package divergence prevention worked**: Issues #15 and #23 both touched `BeforeAfterSlider.tsx` which lives in both `nexacore-dashboard/` and the satellite. Applying the same fix to both copies in the same commit kept parity and eliminated the "Accepted-Risk LOW divergence" deviation that round 1's verify initially documented. Cheap insurance for ~5 extra lines of work.
- **Tailwind future flag `hoverOnlyWhenSupported` was a single-line site-wide fix**: Issue #18 affected dozens of hover states across the satellite. Touching individual components would have been days of work; the config flag fixed everything in <30 seconds. Tailwind v4 makes this default — getting in front of it via the future flag was the right call.
- **`/verify` PASS preserved across both rounds with zero regressions**: the verify report grew a "Round 2" section instead of being rewritten, and the original Accepted-Quality deviation was the only one across 24 issues. Bundle stayed flat at 87.3 kB shared.
- **Vercel preview deploys per-PR were essential**: testing round 1 issues against the live Vercel preview (not just localhost) is what surfaced Issues #11, #12, #15, #18, #21 — each only reproducing on real iOS. Local `npm run dev` would have shipped these undetected.

### What was harder than expected

- **Issue #3 was over-applied before its limits were understood**: the section-level `useStaggerOnView` pattern was defensible in theory (one IO per group, deterministic CSS-driven stagger) but failed silently on mobile vertical stacks. It took 3 separate corrections (#5 → #22 audit → final pattern rule) before the boundary became clear. **Going forward** every new use of `useStaggerOnView` must answer: "do all children fit in a single mobile viewport simultaneously?" If not, per-item IO with `delay: index * N` is correct. SAT01-2 will codify this in STYLE_GUIDE.
- **Pre-commit hook formatting trips on dashboard files**: in both round 1 and round 2, Husky + Prettier flagged `nexacore-dashboard/src/components/ui/BeforeAfterSlider.tsx` even though the changes were trivial (1-line in R1, ~10-line refactor in R2). Workaround: `npx prettier --write <file>` + re-stage + re-commit. **Recommendation**: dashboard should run `prettier --write` in CI/pre-commit to keep formatting always-correct, OR developers should run `npx prettier --write` proactively before committing. Did NOT use `--amend` (per workflow rule: failed pre-commit means no commit happened, so the next commit is a NEW commit not an amend).
- **iOS edge-swipe-back gesture is invisible until tested on real iPhone**: Issue #21 was impossible to reproduce in DevTools mobile emulation. Required real-device testing.

### Recommendations for similar tickets (SAT02+, future polish passes)

1. **Default to per-item `useFadeInOnView` for any vertical stack with > 2 children**: easier to reason about, harder to misapply, only marginally more code than section-level stagger.
2. **Always test horizontal swipes on real iOS** before shipping: edge-swipe-back is the #1 cause of "drag isn't working" complaints. Best practice: `touch-action: none` on any element receiving horizontal pointer drags.
3. **Handle-only drag on touch is the universal pattern**: Apple Photos, Mapbox, Material Design. Full-area drag on a container that contains scrollable image content WILL hijack vertical scroll. Issue #23 is a generalisation of Issue #21.
4. **`priority` on every above-the-fold image**: prevents next/image lazy-load races with on-mount animations and improves LCP. Cost is `<link rel="preload">` in the head, no other tradeoffs.
5. **For LIVING PLAN tickets, run `/verify` once per commit-round, not once per ticket**: round 2's verify section was appended cleanly. Without the round-2 check, regressions introduced by late issues would not have been caught.
