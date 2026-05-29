# Implementation Record: SCRUM-337 Reconcile ui-design-system.md — Modals + Overlays cluster

## Summary

B4 of 9 sub-tickets from SCRUM-329 Part B reconciliation — and the most structurally complex sub-ticket so far. Reconciled 5 components plus resolved Ambiguity 1 from the audit (drops §9 Search Results + §20 Search Field, replaces with new §27 CommandPalette canonical section). Delivered: 2 in-place rewrites (§5 Modal as ConfirmModal-focused, §11 Tooltip with Radix-cloneElement pattern), 2 deletes (§9 + §20 — no matching code), 18-section renumber pass, 2 new sections (§26 IdleWarningModal — first JSX-sourced section in Part B; §27 CommandPalette with SearchTrigger sub-section). Section numbering UNCHANGED at §1-§27 (net 0 — the 2 deletes balance the 2 inserts).

- **Scope**: `frontend` (docs reconciliation of frontend components)
- **Branch**: none in `em-ecosystem-code` (carry-forward Accepted-Trivial — 4th application of the lifecycle adaptation declared in SCRUM-329).
- **Implementation date**: 2026-05-02
- **Anchors**:
  - Code (`em-ecosystem`): `8d2fa80c` (post-SAT01-5 round 2 — unchanged through B1+B2+B3+B4)
  - Doc starting state (`ai-specs`): `736c0df` (post-/update-docs of SCRUM-336)

## Plan Reference

- Plan: [`SCRUM-337_frontend.md`](../../plans/Sprint%2014/SCRUM-337_frontend.md)
- Verify: [`SCRUM-337_verify.md`](../../plans/Sprint%2014/SCRUM-337_verify.md) — verdict **PASS**
- Plan was followed: **Yes, with five Accepted-Trivial deviations** (1 carry-forward + 4 honest-disclosure variants, each surfacing a spec-vs-code or behavior nuance).

## Commits

| Repo | Hash | Message | Files |
|---|---|---|---|
| `em-ecosystem` | (none) | No code changes — docs-only ticket | 0 files |
| `ai-specs` | (current /update-docs commit) | `docs(SCRUM-337): reconcile Modals + Overlays cluster — B4 of SCRUM-329 Part B` | 4 files |

## Deviations from Plan

| # | Step | Planned | Actual | Reason | Category | Follow-up |
|---|---|---|---|---|---|---|
| 1 | 0 | (Plan §4 Step 0 — "No code branch needed (carry-forward Accepted-Trivial)") | No `feature/SCRUM-337-frontend` branch in `em-ecosystem-code`. | 4th consecutive application — convention crystallized after SCRUM-334+335+336. | **Accepted-Trivial** | — |
| 2 | 2a | "Draft §11 Tooltip rewrite from `tooltipSpecs`" | Rewrite applied + disclosed: (a) tooltip never renders on touch devices (`pointer: coarse` detection — visible=false stays); (b) Radix-style cloneElement pattern — no wrapper div, child must accept ref + DOM event props. | Both behaviors are non-obvious from the spec export alone. Surfacing them prevents bug reports ("tooltip broken on mobile") and misuse (passing a Fragment as child). User approved at Gate 1 with the disclosures presented. | **Accepted-Trivial** | — |
| 3 | 2b | "Draft §5 Modal rewrite as ConfirmModal from `confirmModalSpecs`" | Rewrite applied + disclosed: `confirmModalSpecs.sizes` lists 3 sizes (sm/md/lg), but JSX has 4 — including `xl: max-w-[720px]`. Documented all 4 with the spec gap noted. | Same honest-documentation pattern as B2 (Slider thumb rgba), B3 (Breadcrumbs link color, Tabs dot indicators). When spec and JSX diverge in a way that's additive (JSX has more), document JSX reality. | **Accepted-Trivial** | — |
| 4 | 2c | "Draft §26 IdleWarningModal addition" | Section added — but **first case in Part B without a spec export**. Content sourced from JSX directly with explicit blockquote disclosure ("This component does NOT export a spec object…"). | Established new precedent: when a component has no spec export, document JSX as source-of-truth + add forward-looking note about adding a spec export in future code-side cleanup. Same disclosure-first pattern. | **Accepted-Trivial** | — |
| 5 | 2d | "Draft §27 CommandPalette + SearchTrigger sub-section" | Section added + disclosed: `searchTriggerSpecs.mobile` documents an `IconButton boxed sm` variant that the current JSX does NOT render. Documented as spec'd-but-unimplemented. | Same precedent as B3 §6 Tabs dot indicators. Spec captures design intent for a future enhancement; JSX reality preserved as canonical. | **Accepted-Trivial** | — |

**No Accepted-Quality, no Accepted-Risk, no Deferred, no Scope-Gap items.**

## Test Results

| Check | Result | Details |
|---|---|---|
| Unit tests | N/A | Docs-only ticket. |
| Build verification | N/A (no code change) | `em-ecosystem-code` working tree clean throughout. |
| 7 grep AC checks (per plan §6) | **7/7 PASS** | AC1 (§5 Modal — 25 matches) ✅, AC2 (§9 Search Results 0) ✅, AC3 (Tooltip tokens — 7 matches) ✅, AC4 (§20 Search Field 0) ✅, AC5 (§26 IdleWarningModal — 1 match after `-cE` flag fix) ✅, AC6 (§27 CommandPalette — 1 match after `-cE` flag fix) ✅, AC7 (numbering continuous §1-§27) ✅. |
| Bonus integrity checks | **3/3 PASS** | §27 SearchTrigger sub-section (7 mentions) ✅, §5 → §26 cross-ref (2) ✅, §26 → §5 cross-ref (7) ✅. |
| Spot-check independent verification | **3/3 PASS** | §26 IdleWarningModal at line 1269 matches JSX:11-28 verbatim; §5 Modal rewrite reflects confirmModalSpecs + JSX (4 sizes, focus trap, autofocus algorithm, scroll lock); §10 Tooltip cross-references valid (no broken refs). |
| User-approval gates | 5/5 confirmed | Gate 1 (§11 Tooltip), Gate 2 (§5 Modal), Gate 3 (§26 IdleWarningModal), Gate 4 (§27 CommandPalette + SearchTrigger), Gate 5 (§9 + §20 deletes confirmation). Each draft presented with rationale and disclosures before applying. |

## Bugs Found

**One discovered during /develop (resolved on the spot)**: AC5 + AC6 grep checks initially returned 0 because the bash `grep -c` command without `-E` flag treats `+` as literal in `[0-9]+`. The sections WERE present in the file — only the grep command was wrong. Re-running with `-cE` produced correct results (1 match each). Documented in /verify report as a lessons-learned for future B-cluster /verify reports: **always use `-E` or POSIX-extended pattern** when matching `[0-9]+`.

No other bugs. The 4 honest-disclosure cases (touch-hidden Tooltip, 4-vs-3 Modal sizes, no IdleWarningModal spec, SearchTrigger mobile variant unimplemented) are spec-vs-code documentation gaps, not bugs — they're surfaced explicitly per the established honest-documentation pattern.

## Documentation Updates

| File | Change |
|---|---|
| `ai-specs/specs/ui-design-system.md` | **Major edit** — most structurally complex change in any Part B sub-ticket: 2 in-place rewrites + 2 deletes + 18-section renumber + 2 new sections (1 with sub-section). Net section count UNCHANGED at §1-§27 (the 2 deletes balance the 2 inserts). |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-337_frontend.md` | Plan (NEW — written during /plan) |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-337_verify.md` | Verify report (NEW — verdict PASS) |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-337_frontend.md` | This record (NEW) |
| `ai-specs/specs/integration-state.md` | **No update** — no module/guard/service changes |
| `ai-specs/specs/data-model.md` | **No update** — no DB |
| `ai-specs/specs/api-spec.yml` | **No update** — no endpoints |

## Audit Finding Resolution

This sub-ticket of SCRUM-329 Part B resolves 5 component rows + 2 deletes (Ambiguity 1 resolution):

| Item | Audit row / Source | Original classification | Resolution | Verified by |
|---|---|---|---|---|
| ConfirmModal | row 11 | Documented-Drifted | New §5 Modal (full rewrite, all 4 sizes, primary/danger, focus trap, autofocus, scroll lock with scrollbar compensation) | AC1 PASS |
| IdleWarningModal | row 23 | Missing-from-doc | New §26 IdleWarningModal (JSX-sourced, no spec export) | AC5 PASS |
| Tooltip | row 47 | Documented-Drifted | New §10 Tooltip (rewritten — Radix cloneElement, 5 positions auto-detect, touch-hidden, createPortal) | AC3 PASS |
| CommandPalette | row 10 | Missing-from-doc | New §27 CommandPalette (cmdk library, 3 groups, viewport-edge auto-positioning) | AC6 PASS |
| SearchTrigger | row 35 (was Ambiguous → Missing-from-doc) | Missing-from-doc | New SearchTrigger sub-section under §27 | Bonus check (7 mentions) |
| §9 Search Results delete | Ambiguity 1 | Should be deleted | Deleted | AC2 PASS (0 matches) |
| §20 Search Field delete | Ambiguity 1 | Should be deleted | Deleted | AC4 PASS (0 matches) |

Final state: 7/7 RESOLVED, 0 UNRESOLVED, 0 NEW instances found. Section numbering continuous §1-§27 (verified by AC7).

## Lessons Learned

### What went well

- **Honest-documentation pattern scaled to 4 disclosures in a single sub-ticket**. Established in B2 (Slider thumb rgba — 1 case), grew in B3 (Breadcrumbs link color + Tabs dot indicators — 2 cases), and now B4 has 4 cases (touch-hidden Tooltip, 4-vs-3 Modal sizes, no IdleWarningModal spec, SearchTrigger mobile variant). The pattern is consistent: surface non-obvious behavior or spec-vs-code divergence with explicit disclosure + forward-looking note. **Project signature crystallized.**
- **Combined edits saved time without sacrificing clarity**. Edit 3 (delete §9 + renumber §10→§9) and Edit 13 (delete §20 + renumber §21→§19) each combined two operations into one Edit by including the next section's heading in the old_string. Edits 20-21 (insert §26 + §27) combined into one big edit replacing the `## Common Patterns` anchor. Saved ~3 individual edits without losing precision.
- **Renumber pass of 18 sections completed without errors**. Each renumber was a 1-line `### N. Name` → `### M. Name` edit using string match (not line numbers). Order didn't matter — Edit tool's string-match means each edit is independent. The pattern is now reliable for future sub-tickets that need renumber passes (B9 Cleanup may need this).
- **First JSX-sourced section without spec export handled gracefully**. IdleWarningModal section disclosed the no-spec status in a blockquote at the top, then sourced content from JSX with full transparency. The reader sees immediately "this is JSX-sourced, future cleanup possible". No pretending the section is spec-driven when it isn't.
- **Cross-reference bidirectionality proven**. §5 → §26 (forward — "for idle session warnings, see §26") and §26 → §5 (backward — "for general-purpose dialogs use §5 instead"). Both verified valid by /verify. Pattern useful for clusters with primary + specialized variants.
- **5 user-approval gates was the right cadence for B4**. Despite being the most complex sub-ticket, the gate cadence felt natural — one gate per component + one defensive gate for deletes. Total /develop ~2.5h matched the estimate.

### What was harder than expected

- **The grep `-E` flag bug in AC5/AC6**. Initially the AC checks for §26 + §27 returned 0 — but the sections WERE present. The issue was bash `grep -c '^### [0-9]+\. Name'` without `-E` treats `+` as literal. Spent ~5 minutes confused before realizing. Fixed with `-cE`. Documented in verify report as a lessons-learned. **Recommendation**: future B-cluster /verify scripts must use `grep -cE` (or POSIX `[0-9][0-9]*` if avoiding extended regex).
- **The §11 → §10 renumber for Tooltip happened AFTER the rewrite**. Edit 1 rewrote §11 Tooltip in place (preserving the §11 heading). Edit 4 then renumbered §11 → §10 separately. Worked correctly, but was a 2-step dance. **Lesson**: when both rewriting AND renumbering a section, do the rewrite first, then renumber the heading separately. Reverse order would have made the rewrite's old_string match fail (because by then the heading would already be §10).
- **IdleWarningModal had no spec export — JSX read was deeper than expected**. The section needed to capture not just the visible structure (CountdownTimer + text + Button) but also the absence-of-behavior (no focus trap, no Escape, no outside-click). Documenting "what's NOT there" is harder than "what is there" because there's no spec checklist to follow. The security-rationale section (W3C WAI-cited) compensated by explaining WHY the absence is intentional, not a gap.
- **5 deviations is a lot for a single ticket**. Even though all are Accepted-Trivial honest-disclosures, having 5 of them suggests the audit table's classifications are slightly under-counting the documentation gaps. **Lesson for B5-B9**: audit row notes capture the most prominent drift, but deeper JSX read often reveals more nuances (touch behavior, edge cases, spec-vs-code minor gaps). Plan for ≥1 disclosure per component as the new baseline.

### Recommendations for similar tickets (B5-B9)

1. **Always use `grep -cE` for AC checks** with `[0-9]+` patterns. Or use `[0-9][0-9]*` for POSIX. The bash `grep` flag bug cost ~5 minutes here.
2. **Combine delete + renumber edits when adjacent**. If deleting §N and the next section is §N+1, the old_string can include §N+1's heading and the new_string can use the renumbered heading. Saves an edit.
3. **For multi-mode or multi-state components without spec export**, consider drafting a `${componentName}Specs` and proposing it to the team as a code-cleanup PR. Documenting JSX-only is fine for one component but compounds debt.
4. **Plan for ≥1 honest-disclosure per component**. The "audit row notes" capture prominent drift; deeper JSX read often reveals more. Build the disclosure capacity into the gate review (don't skip "does the spec match what JSX does?" as a pre-Gate question).
5. **Cross-reference bidirectionality is worth the small cost**. When section A references section B (forward), section B should reference back to A as appropriate. Lets the reader navigate either direction. Verified valid by /verify cross-ref integrity check.
6. **18-section renumber is mechanical but tractable**. Each is a 1-line edit. If a future sub-ticket has even more renumbers (e.g., B9 Cleanup if multiple Doc-only sections are removed), the pattern holds — just batch them.

## Next Steps

After this `/update-docs` commits to `ai-specs` main, the next sub-ticket of SCRUM-329 Part B is **B5 — Auth-specific atoms**: QrCodeCard, RecoveryCodesGrid, CopyField, TurnstileWidget, CountdownTimer (all Missing-from-doc, all add). 5 components, no rewrites, no deletes — simpler structurally than B4. B5 will be opened only after this `/update-docs` lands.

Pattern proven across B1+B2+B3+B4 is now stable. B5-B9 should follow without surprises. Carry-forward language is silent (4 consecutive applications). Honest-documentation pattern continues for any spec-vs-JSX divergence found.

Lessons-learned items captured in record (not auto-created tickets):
- IdleWarningModal could benefit from a `idleWarningModalSpecs` export
- SearchTrigger mobile variant decision pending (implement or remove from spec)
- Tabs dot indicators (carried over from B3) — same decision pending
- AC grep checks must use `-cE` flag (or POSIX `[0-9][0-9]*` pattern)
