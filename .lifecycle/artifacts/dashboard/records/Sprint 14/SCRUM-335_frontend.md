# Implementation Record: SCRUM-335 Reconcile ui-design-system.md — Form controls (other)

## Summary

B2 of 9 sub-tickets from SCRUM-329 Part B reconciliation. Reconciled the design system doc with code reality for 3 form-control components (Toggle, Slider, Select) and resolved Ambiguity 3 from the SCRUM-329 audit. The §7 "Dropdown" was renamed "Context Menu" with a Doc-only callout (preserves the existing context-menu spec as a forward-looking baseline for the future ContextMenu component). Toggle was fully rewritten (drift detected during /develop in label color and demo metadata); Slider was fully rewritten (drift across all visual values: track 167×3 → 8px, thumb 18×18 stroke 3px → 16×16 border-2). New §27 Select section added with full ARIA listbox pattern, viewport auto-positioning, and cross-references resolving the Select-vs-ContextMenu disambiguation.

- **Scope**: `frontend` (docs reconciliation of frontend components — read-only on code, write-only on `ai-specs/specs/ui-design-system.md`)
- **Branch**: none in `em-ecosystem-code` (carry-forward Accepted-Trivial from parent SCRUM-329, validated through sibling SCRUM-334). Work executed directly in `ai-specs/` working tree on `main`.
- **Implementation date**: 2026-05-02
- **Anchors** (audit + this ticket reflect these specific commit states):
  - Code (`em-ecosystem`): `8d2fa80c` (post-SAT01-5 round 2 — unchanged since SCRUM-334)
  - Doc starting state (`ai-specs`): `f875672` (post-/update-docs of SCRUM-334)

## Plan Reference

- Plan: [`SCRUM-335_frontend.md`](../../plans/Sprint%2014/SCRUM-335_frontend.md)
- Verify: [`SCRUM-335_verify.md`](../../plans/Sprint%2014/SCRUM-335_verify.md) — verdict **PASS**
- Plan was followed: **Yes, with two Accepted-Trivial deviations** documented (carry-forward + decision-branch triggered).

## Commits

This is unusual — the work produced no commits in `em-ecosystem-code` because it is docs-only:

| Repo | Hash | Message | Files |
|---|---|---|---|
| `em-ecosystem` | (none) | No code changes — docs-only ticket | 0 files |
| `ai-specs` | (current /update-docs commit) | `docs(SCRUM-335): reconcile Form controls (other) cluster — B2 of SCRUM-329 Part B` | 4 files |

## Deviations from Plan

| # | Step | Planned | Actual | Reason | Category | Follow-up |
|---|---|---|---|---|---|---|
| 1 | 0 | (Plan §4 Step 0 — "No code branch needed (carry-forward Accepted-Trivial)") | No `feature/SCRUM-335-frontend` branch in `em-ecosystem-code`. | Same lifecycle adaptation as parent SCRUM-329, validated through SCRUM-334. Pattern is now an established convention for Part B sub-tickets. | **Accepted-Trivial** (carry-forward) | — |
| 2 | 2b | "Augment §17 Toggle with sm + lg size rows IF md is token-aligned, OR full rewrite IF drift" | **Full rewrite** of §17 Toggle. | Reading existing §17 revealed drift: label color hex `#1c1c1c` (not token), pixel `14px/500` (not token), plus demo metadata (Dimensions 168x22, Gap 30px, Layout Horizontal) that are Figma frame artifacts, not component props. Augmenting would have left this drift in place. The plan's decision branch was triggered correctly. User approved at Gate 2 with rationale. Same Accepted-Trivial pattern as SCRUM-334's §22 Checkboxes decision. | **Accepted-Trivial** | — |

**No Accepted-Quality, no Accepted-Risk, no Deferred, no Scope-Gap items.**

## Test Results

| Check | Result | Details |
|---|---|---|
| Unit tests | N/A | Docs-only ticket. |
| Build verification | N/A (no code change) | `em-ecosystem-code` working tree clean throughout, on `main` at `8d2fa80c`. Build status carries from SAT01-5. |
| 7 grep AC checks (per plan §6) | **7/7 PASS** | AC1 (§7 renamed) ✅, AC2 (Doc-only annotation present) ✅, AC3 (3 sizes in §17) ✅, AC4a (§18 Slider uses tokens) ✅, AC4b (0 hex in §18) ✅, AC5 (§27 Select exists) ✅, AC6 (numbering continuous §1-§27) ✅. |
| Spot-check independent verification | **3/3 PASS** | §17 Toggle content matches `toggleSpecs` verbatim (7 spec values verified); §18 Slider track + thumb match `sliderSpecs` and JSX (including honest documentation of non-token `rgba(0,0,0,0.08)`); §27 Select cross-references all valid (§7, §23, §24, §26). |
| User-approval gates | 4/4 confirmed | Gate 1 (§7 rename + callout), Gate 2 (§17 Toggle full rewrite — including the rewrite-vs-augment decision rationale), Gate 3 (§18 Slider rewrite), Gate 4 (§27 Select addition). Each draft presented and explicitly approved before edits applied to the .md. |

## Bugs Found

None during implementation.

The pre-existing drift in §17 Toggle (label hex, pixel font size, demo metadata) was anticipated as a possibility in the plan's Step 2b decision branch — discovering it triggered the planned full-rewrite path, not a new bug.

The Slider's thumb non-token border (`rgba(0,0,0,0.08)` instead of a design token) was identified during /develop and **honestly documented** in §18 with a forward plan ("if a token equivalent like `border-border-default` becomes available with the right opacity, this can be migrated"). Not classified as a bug for this ticket — it's a tracked code-level minor inconsistency; not in B2's scope to fix the JSX itself.

## Documentation Updates

| File | Change |
|---|---|
| `ai-specs/specs/ui-design-system.md` | **Major edit** — 1 rename + callout (§7), 2 full rewrites (§17 Toggle, §18 Slider), 1 new section addition (§27 Select). Net change: §1-§26 (post-B1) → §1-§27 (post-B2), +1 from new Select section. No deletions in B2 (unlike B1 which deleted 3 sections). |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-335_frontend.md` | Plan (NEW — written during /plan) |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-335_verify.md` | Verify report (NEW — verdict PASS) |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-335_frontend.md` | This record (NEW) |
| `ai-specs/specs/integration-state.md` | **No update** — no module/guard/service changes |
| `ai-specs/specs/data-model.md` | **No update** — no DB |
| `ai-specs/specs/api-spec.yml` | **No update** — no endpoints |

## Audit Finding Resolution

This sub-ticket of SCRUM-329 Part B resolves 3 specific rows from SCRUM-329's audit-table.md PLUS 1 ambiguity from the deliverable's Ambiguities subsection. Verified all 4 are now resolved:

| Component / Decision | Audit row / Source | Original classification | Resolution | Verified by |
|---|---|---|---|---|
| Toggle | row 46 | Documented-Aligned (md only — also drift discovered in /develop) | New §17 Toggle (full rewrite, all 3 sizes) | AC3 PASS; spot-check `toggleSpecs` |
| Slider | row 39 | Documented-Drifted | New §18 Slider (full rewrite, sourced from `sliderSpecs`) | AC4a + AC4b PASS; spot-check `sliderSpecs` |
| Select | row 37 | Documented-Drifted | New §27 Select section (sourced from `selectSpecs`) | AC5 PASS |
| Ambiguity 3 (Select / §7 Dropdown) | Audit Ambiguities subsection | Required user disambiguation before Part B | §7 renamed "Context Menu" + Doc-only callout; Select added as new §27 | AC1 + AC2 PASS |

Final state: 4/4 RESOLVED, 0 UNRESOLVED, 0 NEW instances found. Section numbering continuous §1-§27 (verified by AC6).

## Lessons Learned

### What went well

- **Decision-branch in plan worked exactly as designed**. The plan's Step 2b explicitly anticipated the augment-or-rewrite question for Toggle, with criteria for when each path applies. Reading existing §17 surfaced drift; the rewrite path was triggered correctly; the user's Gate 2 approval was framed around the drift detection rather than a surprise scope change. This is the difference between a Scope-Gap (plan didn't anticipate) and an Accepted-Trivial (plan offered the path and decision criteria).
- **4 user-approval gates was the right cadence for B2**. Faster than B1's 6 gates (5 components + Common Patterns) but still meaningful — each gate covered a distinct piece of work. Total /develop time was ~1h vs B1's ~1.5h, validating the per-ticket effort scales with component count.
- **Spec-export-as-source-of-truth held without exception**. Every documented value in §17/§18/§27 traces back to a `toggleSpecs` / `sliderSpecs` / `selectSpecs` export. Spot-check confirmed §17 content matches `toggleSpecs` verbatim with 7 value comparisons. The pattern is now established as repeatable.
- **Honest documentation of non-token values**. The §18 Slider thumb's inline rgba (`rgba(0,0,0,0.08)`) was transparently documented rather than hidden or pretended-tokenized. This is the kind of integrity that mature design systems (Adobe Spectrum, Material 3) document explicitly — not all code is perfect, the doc reflects reality.
- **§7 Doc-only callout as a future-component baseline**. Rather than deleting the existing §7 (which would lose ~30 lines of useful context-menu spec), the rename + callout preserves the spec for when the ContextMenu component is built. The callout makes the pending-component status visible without burying it.
- **Cross-reference integrity verified post-edit**. The new §27 introduced 4 cross-references (§7, §23, §24, §26). All verified as existing at the cited section numbers. The /verify cross-reference integrity check is now a routine part of B-cluster /verify reports.

### What was harder than expected

- **§17 Toggle drift was MORE than the audit listed**. The audit row 46 said "Documented-Aligned (md only, missing sm/lg)". Reading the existing §17 found additional drift: label color hex `#1c1c1c`, pixel font `14px/500`, and Figma frame demo metadata (Dimensions/Gap/Layout). Lesson reinforces SCRUM-334's recommendation: **for any audit-flagged section, expect MORE drift than listed** — read existing content critically, not just additively. The plan's decision branch handled this gracefully but the lesson is now confirmed across two consecutive sub-tickets.
- **The Slider's non-token rgba is a real design-system inconsistency** that's outside B2's scope to fix. Documenting it honestly was the right call but it does signal a tracking item: the JSX value should eventually become a token. Not creating a ticket for this in B2 (would be premature — needs a token decision before the JSX change), but flagging in this record so it's not invisible. **Recommendation**: when the design tokens get a "subtle border" entry (e.g., `--border-subtle: rgba(0, 0, 0, 0.08)`), open a code-fix ticket for Slider thumb to migrate. Until then, document and live with it.

### Recommendations for similar tickets (B3-B9)

1. **Always include a decision-branch in the plan** for ambiguous augment-vs-rewrite cases. SCRUM-334's Checkbox and SCRUM-335's Toggle both used this pattern successfully — the user pre-approves both paths and the criteria for which applies, then /develop selects based on what's found in the existing doc. Faster than asking mid-/develop.
2. **For new component sections, write composition notes referencing related sections**. §27 Select's "Pair with §26 FormField" + "Distinguish from §7 Context Menu" notes are exactly the kind of guidance that makes a design system useful for consumers, not just exhaustive. B3 (Navigation cluster — Tabs / Pagination / Breadcrumbs / SidebarNav) should similarly cross-reference each other where related.
3. **For renamed sections, prepend a callout — don't bury the rationale in body text**. The §7 Doc-only callout uses a blockquote at the top. A reader landing on §7 from a TOC sees the status immediately. Same pattern useful for any future "renamed" / "deprecated" / "pending" sections.
4. **Document non-token values honestly when the code uses them**. Don't pretend the code is fully tokenized when it isn't. The Slider thumb rgba documentation precedent should apply across B3-B9 if any other component has a similar inline value.
5. **Cross-reference integrity check during /verify** — grep verify that every internal `§N` reference points to an existing section. As B-cluster grows, the number of cross-references compounds; a one-line grep check catches breakage before /commit.

## Next Steps

After this `/update-docs` commits to `ai-specs` main, the next sub-ticket of SCRUM-329 Part B is **B3 — Navigation cluster** (Tabs drift, Pagination drift, Breadcrumbs drift, SidebarNav drift). 4 components, all currently classified Documented-Drifted in the audit table. B3 will be opened only after this `/update-docs` lands — single-ticket-at-a-time pacing per user choice.

Pattern proven in B1 + B2 is now stable: the same lifecycle adaptation, the same per-component approval cadence, the same source-of-truth rule. B3-B9 should follow without surprises.
