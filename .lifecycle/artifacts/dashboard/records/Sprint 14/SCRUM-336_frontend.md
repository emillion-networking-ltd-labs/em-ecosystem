# Implementation Record: SCRUM-336 Reconcile ui-design-system.md — Navigation cluster

## Summary

B3 of 9 sub-tickets from SCRUM-329 Part B reconciliation. Reconciled the design system doc with code reality for 4 Navigation-cluster components, all classified Documented-Drifted in the audit. All 4 received full rewrites: §10 Breadcrumbs (named lucide icons + ResizeObserver auto-collapse + spec-vs-JSX color disclosure), §6 Tabs (3 variants + sizes for subtle + ARIA tablist + dot indicators noted as spec'd-but-unimplemented), §19 Pagination (visual direction reversed: 32×32 dark active state, ChevronLeft/Right icons, getPageNumbers algorithm), §3 Sidebar Items (largest section — collapsed/expanded modes, accordion children, flyout popovers via createPortal, embedded Tabs + IconButton + Tooltip integration). Section numbering UNCHANGED at §1-§27 (B3 had no additions/deletions).

- **Scope**: `frontend` (docs reconciliation of frontend components)
- **Branch**: none in `em-ecosystem-code` (carry-forward Accepted-Trivial from parent SCRUM-329, validated through SCRUM-334 + SCRUM-335). 3rd consecutive application of the Part B sub-ticket pattern.
- **Implementation date**: 2026-05-02
- **Anchors**:
  - Code (`em-ecosystem`): `8d2fa80c` (post-SAT01-5 round 2 — unchanged through B1 + B2 + B3)
  - Doc starting state (`ai-specs`): `4164342` (post-/update-docs of SCRUM-335)

## Plan Reference

- Plan: [`SCRUM-336_frontend.md`](../../plans/Sprint%2014/SCRUM-336_frontend.md)
- Verify: [`SCRUM-336_verify.md`](../../plans/Sprint%2014/SCRUM-336_verify.md) — verdict **PASS**
- Plan was followed: **Yes, with three Accepted-Trivial deviations** documented (carry-forward + 2 spec-vs-JSX honest disclosures).

## Commits

This is a docs-only ticket — no commits in `em-ecosystem-code`:

| Repo | Hash | Message | Files |
|---|---|---|---|
| `em-ecosystem` | (none) | No code changes — docs-only ticket | 0 files |
| `ai-specs` | (current /update-docs commit) | `docs(SCRUM-336): reconcile Navigation cluster — B3 of SCRUM-329 Part B` | 4 files |

## Deviations from Plan

| # | Step | Planned | Actual | Reason | Category | Follow-up |
|---|---|---|---|---|---|---|
| 1 | 0 | (Plan §4 Step 0 — "No code branch needed (carry-forward Accepted-Trivial)") | No `feature/SCRUM-336-frontend` branch in `em-ecosystem-code`. | Same lifecycle adaptation as parent SCRUM-329, validated through 2 prior sub-tickets. Pattern is now an established convention. | **Accepted-Trivial** (carry-forward) | — |
| 2 | 2a | "Draft §10 Breadcrumbs full rewrite from `breadcrumbsSpecs`" | Rewrite applied, but with explicit spec-vs-JSX disclosure: spec export documents `text-content-primary/75` for inactive links, but JSX (line 58) renders `text-content-tertiary`. The new §10 documents the JSX value (rendered reality) and notes the spec gap. | Honest documentation pattern established in B2 (Slider thumb rgba). When spec and JSX diverge, document both with disclosure rather than picking one and hiding the other. User approved at Gate 1 with the disclosure presented. | **Accepted-Trivial** | — |
| 3 | 2b | "Draft §6 Tabs full rewrite from `tabsSpecs` + `variantStyles` + `sizeClasses`" | Rewrite applied, but with explicit disclosure that `tabsSpecs.overflow.indicators` documents dot indicator behavior (h-9px buttons, sm:hidden visibility) that is NOT currently rendered by `Tabs.tsx`. The new §6 documents the spec as a forward-looking baseline for the dot-indicator feature with status "NOT currently rendered". | Same honest-documentation pattern as Deviation #2. The spec captures design intent for a future enhancement; preserving it in the doc gives whoever implements the feature a starting point. User approved at Gate 2 with the disclosure presented. | **Accepted-Trivial** | — |

**No Accepted-Quality, no Accepted-Risk, no Deferred, no Scope-Gap items.**

## Test Results

| Check | Result | Details |
|---|---|---|
| Unit tests | N/A | Docs-only ticket. |
| Build verification | N/A (no code change) | `em-ecosystem-code` working tree clean throughout, on `main` at `8d2fa80c`. |
| 6 grep AC checks (per plan §6) | **6/6 PASS** | AC1 (§6 has 3 variants — 18 keyword matches) ✅, AC2 (§10 cites Birdhouse + ChevronRight + ResizeObserver — 6 matches) ✅, AC3a (§19 uses tokens — 5 matches) ✅, AC3b (§19 has 0 hex/38×38 — 0) ✅, AC4 (§3 has collapsed/expanded/flyout/createPortal — 18 matches) ✅, AC5 (numbering continuous §1-§27) ✅. |
| Spot-check independent verification | **3/3 PASS** | §19 Pagination at line 804 matches `paginationSpecs` verbatim; §3 Sidebar Items rendered correctly with sub-headings + spec values; cross-references in §3 (§6 Tabs, §11 Tooltip, IconButton) all resolve correctly. |
| User-approval gates | 4/4 confirmed | Gate 1 (§10 Breadcrumbs — including spec-vs-JSX disclosure), Gate 2 (§6 Tabs — including dot indicators disclosure), Gate 3 (§19 Pagination — visual reversal explicit), Gate 4 (§3 Sidebar Items — sub-headings + embedded primitives). Each draft presented with rationale before applying. |

## Bugs Found

None during implementation. The 2 spec-vs-JSX gaps (Breadcrumbs link color, Tabs dot indicators) were anticipated as a possibility based on B2's Slider thumb rgba precedent — the honest-documentation pattern handles them gracefully without surprises.

The IconButton component reference in §3 SidebarNav highlighted that IconButton currently has no own doc section (will be addressed in B7 Display primitives per the audit's recommended Part B split). The new §3 references it honestly as "currently undocumented in own section — see Common Patterns" with a forward-looking implication for B7.

## Documentation Updates

| File | Change |
|---|---|
| `ai-specs/specs/ui-design-system.md` | **Major edit** — 4 in-place rewrites (§3, §6, §10, §19). No additions, no deletions. Section count UNCHANGED at §1-§27. |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-336_frontend.md` | Plan (NEW — written during /plan) |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-336_verify.md` | Verify report (NEW — verdict PASS) |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-336_frontend.md` | This record (NEW) |
| `ai-specs/specs/integration-state.md` | **No update** — no module/guard/service changes |
| `ai-specs/specs/data-model.md` | **No update** — no DB |
| `ai-specs/specs/api-spec.yml` | **No update** — no endpoints |

## Audit Finding Resolution

This sub-ticket of SCRUM-329 Part B resolves 4 specific rows from SCRUM-329's audit-table.md:

| Component | Audit row | Original classification | Resolution | Verified by |
|---|---|---|---|---|
| Tabs | row 42 | Documented-Drifted | New §6 Tabs (full rewrite, 3 variants + sizes + overflow + indicators noted as spec'd-but-unimplemented) | AC1 PASS |
| Breadcrumbs | row 6 | Documented-Drifted | New §10 Breadcrumbs (full rewrite, named lucide icons, ResizeObserver, spec-vs-JSX disclosure) | AC2 PASS |
| Pagination | row 30 | Documented-Drifted (worst drift) | New §19 Pagination (full rewrite, visual reversal, getPageNumbers algorithm) | AC3a + AC3b PASS |
| SidebarNav | row 38 | Documented-Drifted (most sophisticated) | New §3 Sidebar Items (full rewrite, multi-mode, embedded primitives, accessibility) | AC4 PASS |

Final state: 4/4 RESOLVED, 0 UNRESOLVED, 0 NEW instances found. Section numbering continuous §1-§27 (verified by AC5).

## Lessons Learned

### What went well

- **Decision-branch pattern continues to work**. SCRUM-334's Checkbox decision and SCRUM-335's Toggle decision both used the augment-or-rewrite branch successfully. SCRUM-336 didn't need a decision branch (all 4 components were obvious full rewrites — heavy Drifted classification), but the decision-branch pattern is now reliable for future sub-tickets where the call is less clear.
- **Honest documentation of spec-vs-JSX gaps continues to work**. 3 honest-disclosure cases now established across B2 + B3 (Slider thumb rgba, Breadcrumbs link color, Tabs dot indicators). Each follows the same template: document what the JSX renders (the user-visible reality) AND note the spec gap, with a forward-looking reconciliation plan. This is becoming a project signature — when the code and spec diverge, we surface both.
- **Sub-headings pattern for complex sections** (used in §3 Sidebar Items: Expanded mode / Collapsed mode / Embedded primitives / Accessibility) breaks the "single-table + bullets" mold for the first time in the doc. Justified by genuine complexity. Other complex components in B6+ (e.g., Avatar with image upload integration, ImageCropper with crop math, DataTable with column config) may benefit from the same approach.
- **Cross-reference integrity check during /verify is now routine**. New §3 introduced 3 cross-references (§6, §11, IconButton). All verified as valid. As the doc grows, this check compounds in importance — every new cross-reference compounds the verification surface.
- **Lifecycle pattern (no em-ecosystem-code branch) is now silent**. No re-justification needed in the verify report — just "carry-forward from SCRUM-329 / SCRUM-334 / SCRUM-335". The convention has crystallized through repetition.

### What was harder than expected

- **§3 Sidebar Items required deeper JSX read than spec export captured**. `sidebarNavSpecs` outlines the structure but doesn't capture the touch-device detection, the 200ms enter / 150ms leave hover delays, the createPortal rationale (escapes overflow:hidden), or the active-state asymmetry between expanded and collapsed modes (parent never active in expanded, ALWAYS active when child active in collapsed). All these required reading the JSX carefully. Lesson: **for components with multi-mode behavior, spec exports are insufficient — JSX read is mandatory**.
- **Tabs dot indicators in spec but not JSX is a real product gap**. The spec captures intent (responsive scroll indicators on mobile) that the code doesn't deliver. Documenting it as spec'd-but-unimplemented preserves the design baseline, but ideally there's a follow-up ticket to either implement or remove from the spec. **Recommendation**: open a backlog ticket "Implement Tabs dot indicators per `tabsSpecs.overflow.indicators` OR remove from spec". Captured here as a lessons-learned line, not auto-created (premature without product sign-off on which direction).
- **Breadcrumbs spec-vs-JSX disagreement is small but recurring**. Inactive link color is `text-content-primary/75` per spec, `text-content-tertiary` per JSX. Both are valid "less prominent text" tokens, but they're different. Either the JSX should be updated to match the spec, or the spec should be updated to reflect the JSX. Doesn't matter which — but they should agree. **Recommendation**: when the team next touches Breadcrumbs.tsx, reconcile this. Not creating a ticket — too small for standalone work.

### Recommendations for similar tickets (B4-B9)

1. **Sub-headings for genuinely complex components**. §3 Sidebar Items established the pattern. Use sparingly — only when "single-table + bullets" feels cramped. Most components don't need it.
2. **JSX read MANDATORY for multi-mode / multi-behavior components**. The spec export is the starting point, but JSX captures behavior nuances (timing, touch detection, edge cases) that a serializable spec object can't.
3. **Cross-reference inventory at end of /develop**. Before /verify, list every new cross-reference introduced and grep-verify each one. As the doc grows, this is the cheap insurance against silent breakage.
4. **Honest disclosure beats false alignment**. When spec and JSX diverge, document both. The doc reflects reality; the spec captures design intent. They can disagree; that's information, not a bug.
5. **Carry-forward language is now silent**. By B3, the lifecycle adaptation deviation is mentioned in 1 line ("carry-forward from SCRUM-329 / SCRUM-334 / SCRUM-335"). Future sub-tickets B4-B9 should keep it equally minimal — no need to re-explain.

## Next Steps

After this `/update-docs` commits to `ai-specs` main, the next sub-ticket of SCRUM-329 Part B is **B4 — Modals + Overlays cluster**: ConfirmModal (drift — radius, sizes, danger variant, X close), IdleWarningModal (Missing-from-doc), Tooltip (drift — radius, padding, arrow), CommandPalette (Missing-from-doc — replace §9/§23 with new Search section per Ambiguity 1 resolution), SearchTrigger (sub-item under CommandPalette). 5 components, mix of rewrites + new sections + 1 structural rename (similar shape to B2). B4 will be opened only after this `/update-docs` lands.

Pattern proven across B1 + B2 + B3 is now stable. B4-B9 should follow without surprises. Follow-up backlog items captured in lessons-learned (Tabs dot indicators decision, Breadcrumbs link color reconciliation) — not auto-created tickets.
