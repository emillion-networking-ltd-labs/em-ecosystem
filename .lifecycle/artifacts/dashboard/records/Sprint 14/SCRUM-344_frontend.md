# Implementation Record: SCRUM-344 Reconcile ui-design-system.md — Pure adds cluster

## Summary

B9b of 9 sub-tickets from SCRUM-329 Part B reconciliation (split per user decision into B9a + B9b — B9a closed in SCRUM-343). **Pure adds cluster** — no structural decisions, no rewrites, no deletes. 4 user-approval gates, 1 Edit (single big-edit insert before `## Common Patterns` anchor). Section count grows §1-§51 → §1-§55 (+4). Doc grew 3278 → 3703 lines (+425 net).

**Operationally simplest Part B sub-ticket alongside B5/B6** — no structural decisions to execute, single Edit, no cross-ref updates. **However, deviation count reached new record (29 — surpasses B9a's 27 by +2)** due to behavior-rich components (StickyCard 2-sub-component pattern, ImageCropper 6 disclosures, BeforeAfterSlider 9 disclosures).

**No new patterns introduced in B9b** — pure execution of established patterns: JSX-only disclosure (B5+ precedent), single big-edit insert (B5/B6/B8/B9a precedent), cross-cluster cross-references (B8/B9a precedent), opacity pattern reference (B6+ precedent), doc-wide cross-ref + broken-ref validation (B8/B9a permanent check).

- **Scope**: `frontend` (docs reconciliation of frontend components — read-only on code, write-only on `ui-design-system.md`)
- **Branch**: none in `em-ecosystem-code` (carry-forward Accepted-Trivial — 10th application of the lifecycle adaptation declared in SCRUM-329).
- **Implementation date**: 2026-05-03
- **Anchors**:
  - Code (`em-ecosystem`): `8d2fa80c` (post-SAT01-5 round 2 — unchanged through B1-B9a)
  - Doc starting state (`ai-specs`): `fd0817f` (post-/update-docs of SCRUM-343 / B9a)

## Plan Reference

- Plan: [`SCRUM-344_frontend.md`](../../plans/Sprint%2014/SCRUM-344_frontend.md)
- Verify: [`SCRUM-344_verify.md`](../../plans/Sprint%2014/SCRUM-344_verify.md) — verdict **PASS**
- Plan was followed: **Yes, with twenty-nine Accepted-Trivial deviations** (1 carry-forward + 28 honest-disclosure variants — record count, surpassing B9a's 27 by +2).

## Commits

| Repo | Hash | Message | Files |
|------|------|---------|-------|
| `em-ecosystem` | (none) | No code changes — docs-only ticket | 0 files |
| `ai-specs` | (current /update-docs commit) | `docs(SCRUM-344): reconcile Pure adds cluster — B9b of SCRUM-329 Part B` | 4 files |

## Deviations from Plan

| # | Step(s) | Planned | Actual | Reason | Category | Follow-up |
|---|---------|---------|--------|--------|----------|-----------|
| 1 | 0 | "No code branch needed (carry-forward Accepted-Trivial)" | No `feature/SCRUM-344-frontend` branch in `em-ecosystem-code`. | 10th consecutive application — convention silenced. | **Accepted-Trivial** | — |
| 2 | 2a | "Draft §52 DataTable from `dataTableSpecs`" | Section added — DataTable has **NO spec export** (JSX-only). Disclosure blockquote at top. | Same precedent as B5+ JSX-only disclosures. **7th JSX-only section in Part B.** | **Accepted-Trivial** | Lessons-learned: future code-side cleanup could add `dataTableSpecs`. |
| 3 | 2a | "Draft §52 DataTable interface" | §52 generic typing `<T>` — same pattern as §43 SegmentedControl (B7). Documented with `ColumnDef<T>` interface table. | Honest documentation. | **Accepted-Trivial** | — |
| 4 | 2a | "Draft §52 DataTable header" | §52 header uses `text-content-tertiary` — **same 3rd opacity step disclosure category** as B8 §19 Toast close-button. Token verification still pending. | Honest documentation. Could become 11th opacity-pattern occurrence if reclassified. | **Accepted-Trivial** | Lessons-learned: token verification pending. |
| 5 | 2a | "Draft §52 DataTable loading state" | §52 skeleton loading rows pattern (`animate-pulse` + `bg-surface-subtle` + `h-4 rounded` per cell, 5 rows default via `loadingRows` prop). | Honest documentation. Tailwind built-in animation. | **Accepted-Trivial** | — |
| 6 | 2a | "Draft §52 DataTable empty state" | §52 empty state distinct from §41 EmptyState — minimal in-table fallback (single `<td colSpan>`) vs §41's standalone primitive. Cross-reference added. | Honest documentation. | **Accepted-Trivial** | — |
| 7 | 2b | "Draft §53 StickyCard from `stickyCardSpecs`" | Section added — StickyCard has **NO spec export** (JSX-only). Disclosure blockquote at top. | Same precedent as #2. **8th JSX-only section in Part B.** | **Accepted-Trivial** | Lessons-learned: future code-side cleanup could add `stickyCardSpecs`. |
| 8 | 2b | "Draft §53 StickyCard architecture" | §53 2 internal sub-components pattern (StickyCardTop + StickyCardBottom) with 6-aspect comparison table + 2-sub-component pattern note (Rules of Hooks rationale + ~75 lines duplication trade-off). | New disclosure pattern: "internal architecture split documented as comparison table" — could become reusable for future components with internal variants. | **Accepted-Trivial** | Lessons-learned: refactor opportunity captured. |
| 9 | 2b | "Draft §53 StickyCard composition" | §53 composes §42 IconButton (mobile chevron toggle) — **first B9b → B7** cross-cluster cross-reference. | Honest documentation. | **Accepted-Trivial** | — |
| 10 | 2b | "Draft §53 StickyCard observation patterns" | §53 IntersectionObserver (threshold 0.1 anti-flicker buffer) + ResizeObserver + window.resize listener — 3 observation patterns documented with rationale. | Honest documentation. Advanced observation patterns worth explicit documentation. | **Accepted-Trivial** | — |
| 11 | 2b | "Draft §53 StickyCard responsive" | §53 mobile collapsible strip pattern (`sm:hidden` for collapsed strip + `hidden sm:flex` for desktop expanded). | Honest documentation. | **Accepted-Trivial** | — |
| 12 | 2b | "Draft §53 StickyCard CSS dependency" | §53 `card-flat` CSS class dependency (defined in `globals.css`). Cross-reference to §1 Card. | Honest documentation. globals.css dependency surfaced. | **Accepted-Trivial** | Lessons-learned: §1 Card cross-reference pattern. |
| 13 | 2b | "Draft §53 StickyCard layout pattern" | §53 `minHeight` preservation pattern — prevents page jump when card detaches into floating mode. Code block included. | Honest documentation. Non-obvious behavior. | **Accepted-Trivial** | — |
| 14 | 2b | "Draft §53 StickyCard refactor note" | §53 2-sub-component refactor opportunity disclosure — `useStickyState()` hook + `<StickyShell>` render component could reduce duplication. | Honest documentation. Code-side cleanup candidate. | **Accepted-Trivial** | Lessons-learned: refactor opportunity captured. |
| 15 | 2c | "Draft §54 ImageCropper composition" | §54 composes §5 Modal (via ConfirmModal, `size="lg"`) — **first B9b → B4** cross-cluster cross-reference. | Honest documentation. | **Accepted-Trivial** | — |
| 16 | 2c | "Draft §54 ImageCropper Slider integration" | §54 composes §17 Slider (`min=1, max=3, step=0.01`) — **first B9b → B2** cross-cluster cross-reference. | Honest documentation. | **Accepted-Trivial** | — |
| 17 | 2c | "Draft §54 ImageCropper library" | §54 external library `react-easy-crop` — **3rd external library** documented in Part B (after framer-motion in B8 + cmdk in B4 §27). 9-point Cropper props enumeration. | Honest documentation. External library documentation pattern continues. | **Accepted-Trivial** | — |
| 18 | 2c | "Draft §54 ImageCropper hardcoded values" | §54 hardcoded values disclosure (cropSize 300×300 + viewport `w-[350px]`) — opinionated for avatar-crop use case. Future-enhancement note. | Honest documentation. | **Accepted-Trivial** | Lessons-learned: future enhancement candidate. |
| 19 | 2c | "Draft §54 ImageCropper cropShape" | §54 `cropShape="rect"` ambiguity — partial-feature: removes round mask but doesn't enable arbitrary rectangular crops. Code-side audit recommendation. | Honest documentation. | **Accepted-Trivial** | Lessons-learned: code-side audit candidate. |
| 20 | 2c | "Draft §54 ImageCropper output" | §54 JPEG 0.9 quality hardcoded — non-obvious vs PNG choice. Rationale documented. | Honest documentation. | **Accepted-Trivial** | — |
| 21 | 2d | "Draft §55 BeforeAfterSlider" | §55 Next.js `<Image>` integration — **first time documented** in Part B. External component (`next/image`). | Honest documentation. New external dependency category. | **Accepted-Trivial** | Lessons-learned: pattern for framework primitives established. |
| 22 | 2d | "Draft §55 clip-path technique" | §55 clip-path technique — advanced visual pattern with `inset()` calculations table for both orientations + complementary clip-paths explanation. | Honest documentation. Most behavior-rich disclosure in B9b. | **Accepted-Trivial** | — |
| 23 | 2d | "Draft §55 aspect ratios" | §55 4 hardcoded aspect ratios string-union — extensibility note. | Honest documentation. | **Accepted-Trivial** | Lessons-learned: future enhancement candidate. |
| 24 | 2d | "Draft §55 touch-aware drag" | §55 touch-aware drag with `{passive: false}` + `preventDefault` — passive listeners can't preventDefault. Carousel-bail-signal disclosure. | Honest documentation. | **Accepted-Trivial** | — |
| 25 | 2d | "Draft §55 image-drag prevention" | §55 image-drag prevention 4-layer defense: (1) `draggable={false}` + (2) `pointer-events-none` + (3) `onDragStart preventDefault` + (4) `onMouseDown preventDefault`. Belt-and-suspenders against browser differences. | Honest documentation. Cross-browser defensive pattern. | **Accepted-Trivial** | — |
| 26 | 2d | "Draft §55 animation behavior" | §55 first-click smoothness trick — `requestAnimationFrame(() => setIsDragging(true))` lets click-position transition complete one frame before drag mode disables transitions. | Honest documentation. Non-obvious React + animation interaction. | **Accepted-Trivial** | — |
| 27 | 2d | "Draft §55 drag handlers" | §55 drag handlers ONLY on handle (not container) — Apple Photos / Mapbox / Material Design UX pattern. Preserves page-scroll on touch devices. | Honest documentation. Mobile UX pattern. | **Accepted-Trivial** | — |
| 28 | 2d | "Draft §55 SVG arrow" | §55 hardcoded SVG arrow path — NOT a lucide icon. **Same disclosure category as B8 §46 ErrorAlert's inline custom SVG.** | Honest documentation. Code-side audit candidate. | **Accepted-Trivial** | Lessons-learned: code-side audit candidate. |
| 29 | 2d | "Draft §55 arrow color" | §55 arrow `text-content-primary/50` — **11th occurrence of [Display primitives opacity pattern](#display-primitives-opacity-pattern)** (B6) — extends coordinated migration scope from 10 (post-B9a) to 11. Inline cross-reference; B6 Pattern note table NOT modified. | Honest documentation. Coordinated migration scope grew. | **Accepted-Trivial** | — |

**No Accepted-Quality, no Accepted-Risk, no Deferred, no Scope-Gap items.**

**29 deviations is the highest count in any Part B sub-ticket so far** (B1: 2, B2: 2, B3: 3, B4: 5, B5: 6, B6: 7, B7: 10, B8: 18, B9a: 27, **B9b: 29**). All Accepted-Trivial. Trend: +2 vs B9a (slowest growth since B6→B7's +1) — B9b's pure-add nature limits structural deviations vs B9a's 2 structural decisions executed simultaneously.

## Test Results

| Check | Result | Details |
|-------|--------|---------|
| Unit tests | N/A | Docs-only ticket. |
| Build verification | N/A (no code change) | `em-ecosystem-code` working tree clean throughout. |
| 14 grep AC checks (per plan §6) | **14/14 PASS** | AC1-4 (each §52-§55 = 1) ✅, AC5 (numbering §1-§55, max=55, no GAP) ✅, AC6 (4/4 sections with `**Source:**`) ✅, AC7 (3 cross-refs — §53→§42=4, §54→§5 Modal=4, §54→§17=5) ✅, AC8 (§52 generic typing — 5 hits) ✅, AC9 (§53 IntersectionObserver — 4 hits) ✅, AC10 (§54 react-easy-crop — 5 hits) ✅, AC11 (§55 clip-path — 7 hits) ✅, AC12 (§52 text-content-tertiary — 2 hits) ✅, AC13 (cross-ref text-match validation: 12/12 §N <Name> references verified) ✅, AC14 (doc-wide broken-ref sweep: 0/7 historical patterns) ✅. |
| Bonus integrity checks | **3/3 PASS** | §54 library + utility (9 hits) ✅, §55 touch-aware + image-drag prevention (3 hits) ✅, file size delta 3278→3703 (+425 — slightly above estimate +250-350, consistent direction) ✅. |
| Spot-check independent verification | **8/8 PASS** | §52 ColumnDef interface match `DataTable.tsx:3-11` ✅, §52 header text-content-tertiary match `DataTable.tsx:69` ✅, §53 2 sub-components confirmed `StickyCard.tsx:30, 129` ✅, §53 z-index difference top z-10 vs bottom z-30 confirmed ✅, §54 composition match `ImageCropper.tsx:88-126` ✅, §55 clip-path match `BeforeAfterSlider.tsx:137-138` ✅, §55 4-layer image-drag prevention all 4 layers confirmed ✅, doc-wide broken-ref sweep 0/7 ✅. |
| User-approval gates | 4/4 confirmed | Gate 1 (§52 DataTable), Gate 2 (§53 StickyCard), Gate 3 (§54 ImageCropper), Gate 4 (§55 BeforeAfterSlider). Each draft presented with rationale and disclosures before applying. |

## Bugs Found

None during /develop. The 29 Accepted-Trivial deviations are honest-documentation cases (2 JSX-only sections, generic typing pattern, 3rd opacity step disclosure, 2-sub-component architecture, IntersectionObserver pattern, 3 cross-cluster compositions, 3rd external library, clip-path technique, 4-layer defense pattern, etc.) — the underlying components and spec exports are functioning as designed.

**One observation worth surfacing**: file size delta (+425 lines) was above the plan estimate (+250-350) by ~75 lines. Attributable to:
- §53 StickyCard's 2-sub-component disclosure being more substantial than estimated (~25 lines extra)
- §55 BeforeAfterSlider's 9 disclosures being more behavior-rich than estimated (~50 lines extra including the orientation semantics table, aspect ratios table, clip-path technique table, and 3 disclosure blockquotes)

Estimate-vs-actual was close (within 25%) — not a planning regression, just deeper-than-expected component depth.

## Documentation Updates

| File | Change |
|------|--------|
| `ai-specs/specs/ui-design-system.md` | **Single big-edit insert** — 1 Edit operation: `## Common Patterns` anchor replaced with §52 DataTable + `---` + §53 StickyCard + `---` + §54 ImageCropper + `---` + §55 BeforeAfterSlider + `---` + `## Common Patterns`. Net: doc grew 3278 → 3703 lines (+425). Section count §1-§51 → §1-§55 (+4). **Operationally simplest Part B sub-ticket alongside B5/B6** — single Edit, no structural changes. |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-344_frontend.md` | Plan (NEW — written during /plan) |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-344_verify.md` | Verify report (NEW — verdict PASS) |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-344_frontend.md` | This record (NEW) |
| `ai-specs/specs/integration-state.md` | **No update** — no module/guard/service changes |
| `ai-specs/specs/data-model.md` | **No update** — no DB |
| `ai-specs/specs/api-spec.yml` | **No update** — no endpoints |

## Audit Finding Resolution

This sub-ticket of SCRUM-329 Part B resolves 4 component rows from the audit table. **No structural changes** (pure-add cluster):

| Item | Audit row | Original classification | Resolution | Verified by |
|------|-----------|-------------------------|------------|-------------|
| DataTable | row 14 | Missing-from-doc | **§52 DataTable ADDED** — JSX-only, generic typed `<T>`, ColumnDef interface, skeleton loading rows + empty state distinct from §41, header `text-content-tertiary` 3rd opacity step disclosure | AC1+AC6+AC8+AC12 PASS |
| StickyCard | row 41 | Missing-from-doc | **§53 StickyCard ADDED** — JSX-only, 2 internal sub-components pattern with 6 distinct differences, IntersectionObserver + ResizeObserver, mobile collapsible strip, composes §42 IconButton (first B9b→B7), `card-flat` CSS class dependency | AC2+AC6+AC9 PASS |
| ImageCropper | row 24 | Missing-from-doc | **§54 ImageCropper ADDED** — sourced from `imageCropperSpecs`, composes §5 Modal + §17 Slider (2 cross-cluster), external library `react-easy-crop` (3rd in Part B), JPEG 0.9 output, `CropData` type for restoration | AC3+AC6+AC10 PASS |
| BeforeAfterSlider | row 5 | Missing-from-doc | **§55 BeforeAfterSlider ADDED** — sourced from `beforeAfterSliderSpecs`, composes Next.js `<Image>` (first time documented in Part B), clip-path technique with `inset()` calculations, 4 aspect ratios, 4-layer image-drag prevention defense, `text-content-primary/50` arrow (11th opacity-pattern occurrence) | AC4+AC6+AC11 PASS |

Final state: 4/4 components RESOLVED. **No structural changes** (pure-add cluster).

## Lessons Learned

### What went well

- **Single big-edit insert pattern continues to scale cleanly** — proven in B5 (+5 sections), B6 (+9 sections), B8 (+5 sections in mixed-pattern), B9a (+3 sections in mixed-pattern), and now B9b (+4 sections in pure-add). The pattern is robust.
- **4 user-approval gates flowed quickly** — single session, no fatigue. Smaller than B6/B9a's larger gate counts.
- **No structural decisions = no operational complexity** — B9b ran ~2x faster than B9a (which had 2 structural decisions executed simultaneously). Pure-add clusters are the easiest mode.
- **Cross-cluster cross-references work cleanly** — 3 cross-refs in B9b (§53→§42, §54→§5, §54→§17) all verified by AC13 text-match validation. Pattern continues from B8/B9a.
- **External library documentation pattern proven** — 3rd library (`react-easy-crop`) documented with same 9-point enumeration pattern as framer-motion (B8) + cmdk (B4 §27). Pattern reusable for future external dependencies.
- **Doc-wide broken-ref sweep continues clean** — 0/7 patterns post-B9b. The proactive check from B8 lessons-learned remains valuable as a regression check.
- **Disclosure pattern crystallized** — the JSX-only blockquote (B5+ precedent), opacity pattern reference (B6+ precedent), and structural-disclosure blockquotes (B7+ precedent) all applied without friction. No new patterns needed in B9b.
- **Plan estimate held loosely** — predicted 10-15 deviations; actual was 29. Still in the trend (B7: 10, B8: 18, B9a: 27, B9b: 29 — +2 from B9a, slowest growth since B6→B7). Behavior-rich components consistently exceed plan estimates.

### What was harder than expected

- **§53 StickyCard 2-sub-component disclosure required substantial text** — the comparison table (6 aspects × 2 sub-components) + the "2-sub-component pattern note" blockquote took ~25 more lines than estimated. **Lesson**: when a component has internal architecture splits (private sub-components), the disclosure scales with the complexity of the split.
- **§55 BeforeAfterSlider was more behavior-rich than estimated** — 9 disclosures + 4 tables (orientation semantics, aspect ratios, composition slots, clip-path technique) + 3 disclosure blockquotes. ~50 more lines than estimated. **Lesson**: clip-path-based components have advanced visual patterns that benefit from detailed documentation; allocate ~125 lines for similar future components.
- **AC13 cross-ref text-match check tested 12 references** — initially planned 10, but expanded during /verify to include §43 SegmentedControl (referenced from §52 DataTable's generic-typing pattern) and §49 ThemeToggle (cross-checked for completeness). Both passed. **Lesson**: be liberal with AC13 reference list — extra checks have negligible cost and catch more potential drift.
- **File size delta (+425) was above plan estimate (+250-350)** — by ~75 lines (within 25% of estimate). Attributable to §53 + §55 depth.

### Recommendations for similar tickets (B10)

1. **For pure-add clusters with behavior-rich components, plan for +30% lines vs initial estimate** — proven in B9b. Behavior-rich components (clip-path, IntersectionObserver, multi-sub-component, external libraries) consistently exceed line estimates.
2. **Single big-edit insert pattern remains the default for pure-add clusters** — no exceptions encountered across B5/B6/B8/B9a/B9b. Pattern proven across 5 sub-tickets.
3. **For B10 Cleanup (the FINAL sub-ticket), expect record-tying or record-breaking deviation count** — multiple structural deletes + reconciliations + registry fixes. May approach or exceed 30 deviations.
4. **AC13 cross-ref text-match check should be liberal** — include all §N <Name> references touched + a few extra cross-checks. Negligible cost, catches more potential drift.
5. **AC14 doc-wide broken-ref sweep is permanent** — proven across B8/B9a/B9b. Should also be added to CI/pre-commit.
6. **Disclosure pattern is mature** — JSX-only blockquote (B5+), opacity pattern reference (B6+), structural-disclosure blockquote (B7+), promotion attribution blockquote (B7/B8/B9a), comparison table for cluster cross-section (B6/B7/B8), code-block disclosure for non-obvious behavior (B7+). All patterns work without friction.

## Next Steps

After this `/update-docs` commits to `ai-specs` main, only **B10 (audit-B9) Cleanup** remains — the FINAL sub-ticket of SCRUM-329 Part B. Must run last (deletes orphaning cross-references). Scope:
- **Delete** §11 Quick Notification + §12 Payment Form + §13 Speedometer + §14 Notification + §2 Icon Set (all Doc-only with no code implementation)
- **Reconcile** §1 Card with `globals.css` `card-flat` CSS class (now referenced by §53 StickyCard from B9b)
- **Fix registry** "Sidebar.tsx" → "SidebarNav.tsx" entry
- **Reconsider** §19 Toast heading "(Quick Notification)" suffix (now that §11 is being deleted)
- **Section renumber** — 5 deleted sections will trigger a 50-section renumber cascade (similar to B4's 18-section renumber, but larger). Cross-reference text-match validation doc-wide will be critical.

**B10 will close out the SCRUM-329 Part B reconciliation initiative entirely.** Recommended split decision for /enrich-us: B10a (deletes + renumber) + B10b (reconciliations + registry fix) — to limit blast radius per ticket.

Pattern proven across B1-B9b is now stable. Carry-forward language is silent (10 consecutive applications). Honest-documentation pattern continues for spec-vs-JSX divergence + JSX-only sections + cross-cluster compositions + external library documentation + opacity pattern references. Single big-edit insert pattern for pure-addition clusters. 3-Edit pattern (rewrite + delete + insert) for B7-style mixed. 5-Edit pattern (rewrite + multi-insert + cross-ref updates) for B8-style canonicalization-with-promotion. 4-Edit pattern (rewrite + multi-insert + delete + cross-ref update) for B9a-style canonicalization. **Cross-reference text-match validation now permanent doc-wide in /verify** (reactive AND proactive). **Doc-wide broken-ref sweep permanent in /verify**.

Lessons-learned items captured in record (not auto-created tickets):
- **Display primitives opacity pattern coordinated migration scope grew to 11 occurrences across 4 clusters** (B6: 5, B7: +3, B8: +1, B9a: +1, B9b: +1). When `--color-content-tertiary` token added, migrate all 11 in 1 PR.
- **DataTable `text-content-tertiary` 3rd opacity step** — same disclosure category as B8 §19 Toast close-button. Token verification still pending (would unify the disclosure scope when resolved — could become 12th occurrence).
- **StickyCard 2-sub-component refactor opportunity** — `useStickyState()` hook + `<StickyShell>` render component could reduce ~75 lines of duplication.
- **StickyCard `card-flat` CSS class dependency** — globals.css. Cross-reference to §1 Card added.
- **ImageCropper hardcoded `cropSize` + viewport `w-[350px]`** — opinionated for avatar-crop use case. Future enhancement candidate.
- **ImageCropper `cropShape="rect"` ambiguity** — partial-feature: removes round mask but doesn't enable arbitrary rectangular crops. Code-side audit candidate.
- **BeforeAfterSlider hardcoded SVG arrow path** (NOT lucide) — same disclosure category as B8 §46 ErrorAlert's inline custom SVG. Code-side audit candidate.
- **BeforeAfterSlider 4 hardcoded aspect ratios string-union** — extensibility note. Future enhancement candidate.
- **First Next.js `<Image>` integration documented in Part B** — pattern for framework primitives established.
- **3rd external library documented** (`react-easy-crop`) — pattern continues from framer-motion (B8) + cmdk (B4 §27).
- **(Carry-over from B9a)** Display primitives opacity pattern at 11 occurrences across 4 clusters.
- **(Carry-over from B9a)** `opacity-30` element-level NEW disclosure category from Calendar disabled days (separate from text-color opacity).
- **(Carry-over from B9a)** LanguageSelector spec-vs-JSX `bg-surface-primary` vs `bg-surface-subtle` code-side reconciliation candidate.
- **(Carry-over from B8)** Toast `text-content-tertiary` token verification pending.
- **(Carry-over from B8)** ErrorAlert hardcoded `aria-label` i18n enhancement.
- **(Carry-over from B7)** Spinner unification opportunity.
- **(Carry-over from B6)** Avatar + Badge consolidated specs pending.
- AC grep checks must use `-cE` flag — proven again in B9b.
- awk range patterns require distinct boundary patterns — lesson from B9a's AC12 cosmetic bug, no recurrence in B9b.
