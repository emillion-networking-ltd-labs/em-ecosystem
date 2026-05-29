# Implementation Record: SCRUM-346 §1 Card reconciliation (B10b — FINAL of SCRUM-329 Part B)

## Summary

**THE FINAL sub-ticket of SCRUM-329 Part B reconciliation initiative.** B10b of 10 sub-tickets total (B1, B2, B3, B4, B5, B6, B7, B8, B9a, B9b, B10a, B10b). Pure docs-only §1 Card reconciliation with Common Patterns "Card-style Container" deletion (Option A canonicalization confirmed during /enrich-us). 1 user-approval gate, 2 Edits.

**Smallest scope of any Part B sub-ticket** — single section rewrite + 1 Common Patterns sub-section delete. Section count §1-§50 unchanged (no add/delete of numbered sections).

**12th + FINAL application of carry-forward Accepted-Trivial pattern** — preserves the clean docs-only adaptation across all 12 Part B sub-tickets.

**Registry fix `Sidebar.tsx → SidebarNav.tsx` DEFERRED** to separate ticket per Option A (em-ecosystem-code on `feature/SCRUM-342-frontend` with uncommitted WIP — would risk conflicts).

- **Scope**: `frontend` (docs reconciliation — read-only on code, write-only on `ui-design-system.md`)
- **Branch**: none in `em-ecosystem-code` (carry-forward Accepted-Trivial — 12th + FINAL application)
- **Implementation date**: 2026-05-03
- **Anchors**:
  - Code (`em-ecosystem`): `8d2fa80c` (post-SAT01-5 round 2 — unchanged through B1-B10a)
  - Doc starting state (`ai-specs`): `c74b906` (post-/update-docs of SCRUM-345 / B10a)

## Plan Reference

- Plan: [`SCRUM-346_frontend.md`](../../plans/Sprint%2014/SCRUM-346_frontend.md)
- Verify: [`SCRUM-346_verify.md`](../../plans/Sprint%2014/SCRUM-346_verify.md) — verdict **PASS**
- Plan was followed: **Yes, with 5 Accepted-Trivial deviations** (1 carry-forward FINAL + 4 design-decision/scope variants).

## Commits

| Repo | Hash | Message | Files |
|------|------|---------|-------|
| `em-ecosystem` | (none) | No code changes — docs-only ticket | 0 files |
| `ai-specs` | (current /update-docs commit) | `docs(SCRUM-346): §1 Card reconciliation — B10b FINAL of SCRUM-329 Part B` | 4 files |

## Deviations from Plan

| # | Step(s) | Planned | Actual | Reason | Category | Follow-up |
|---|---------|---------|--------|--------|----------|-----------|
| 1 | 0 | "No code branch needed (carry-forward Accepted-Trivial)" | No `feature/SCRUM-346-frontend` branch in `em-ecosystem-code`. **12th + FINAL consecutive application**. | Convention established and silenced 8 sub-tickets ago (B5+). FINAL application closes the docs-only adaptation pattern. | **Accepted-Trivial** (carry-forward FINAL) | — |
| 2 | 2+3 | "Draft §1 Card rewrite (drift heavy → 4-class comparison table)" | §1 Card mini-rewrite executed: drops raw hex (#ffffff/#1c1c1c/#000000 5%) + pixel dims (241×112) + radius 16px → token-based 4-CSS-class comparison table sourced from `globals.css` lines 200-229. | Same canonicalization pattern as B7 §15 Button rewrite + B9a §4 Calendar rewrite. Drift comprehensively replaced; doc reflects code reality. | **Accepted-Trivial** | — |
| 3 | 2+3 | "Common Patterns 'Card-style Container' DELETE (Option A canonicalization)" | Sub-section deleted (~10 lines removed). §1 Card becomes single source of truth for card styling. | Same canonicalization precedent as B4 Ambiguity 1 (§9/§20 deletes), B7 Common Patterns Button cleanup, B8 InlineError promotion, B9a Common Patterns Selector Trigger cleanup. Closes Part B with maximum canonicalization. | **Accepted-Trivial** (canonicalization) | — |
| 4 | 2 | "Draft §1 Card with 4-CSS-class structure" | **First documentation of 4-CSS-class single-section pattern** in Part B — §1 Card documents 4 distinct CSS utility classes (`.card-container`, `.card`, `.card-flat`, `.card-container-flat`) as comparison table, instead of typical 1-React-component-per-section. Includes variant selection guide + hardcoded-values disclosure (radius/shadow/padding not yet tokenized). | Honest documentation. NEW pattern reusable for future CSS-class primitives if surfaced (e.g., utility classes in `globals.css` that don't map to React components). | **Accepted-Trivial** (NEW disclosure category) | Lessons-learned: pattern reusable. |
| 5 | n/a | "Registry fix Sidebar.tsx → SidebarNav.tsx (originally B10b scope)" | DEFERRED to separate ticket. Reason: em-ecosystem-code on `feature/SCRUM-342-frontend` with uncommitted WIP — creating B10b code branch would risk conflicts/mixing concerns. | Honest scope decision. Registry fix is a 1-line code change, not urgent. Tracked as carry-over for post-Part B work. | **Accepted-Trivial** (scope deferred) | Tag-along candidate for SCRUM-342 OR separate small ticket. |

**No Accepted-Quality, no Accepted-Risk, no Deferred (formal category), no Scope-Gap items.**

**Only 5 deviations** — significantly lower than recent records (B9b: 29, B9a: 27, B8: 18). Smallest scope (single-section rewrite + 1 Common Patterns delete) plus the cleanup-ticket nature reduces per-section deviation explosion.

## Test Results

| Check | Result | Details |
|-------|--------|---------|
| Unit tests | N/A | Docs-only ticket. |
| Build verification | N/A (no code change) | `em-ecosystem-code` working tree on `feature/SCRUM-342-frontend` (unrelated WIP — see Deviation #5). |
| 8 grep AC checks (per plan §6) | **8/8 PASS** | AC1 (no raw hex in §1 — 0) ✅, AC2 (4 CSS classes documented — `.card-container` 4 + `.card-flat` 3 + `.card` total 9 occurrences) ✅, AC3 (§48 StickyCard cross-ref — 2) ✅, AC4 (Common Patterns "Card-style Container" removed — 0) ✅, AC5 (numbering §1-§50, max=50, no GAP) ✅, AC6 (§1 Card with `**Source:**` — 1) ✅, AC7 (cross-ref text-match validation: §1 + §48 each = 1) ✅, AC8 (doc-wide broken-ref sweep 17 patterns — 0/17 clean) ✅. |
| Spot-check independent verification | **8/8 PASS** | §1 Card position preserved (line 157) ✅, 4 CSS classes match `globals.css:200-229` ✅, §48 StickyCard cross-ref correct ✅, Common Patterns "Card-style Container" deleted (0 matches) ✅, "Auth Card Container (SCRUM-275)" boundary preserved ✅, `**Source:**` cites globals.css line 200-229 ✅, 12th + FINAL carry-forward application explicit ✅, doc-wide broken-ref sweep 0/17 ✅. |
| User-approval gates | 1/1 confirmed | Gate 1 (§1 Card draft + Common Patterns delete plan presented; user approved). |

## Bugs Found

None during /develop. The 5 Accepted-Trivial deviations are honest-documentation cases (carry-forward + 2 Edits as planned + NEW 4-CSS-class disclosure pattern + registry fix scope deferral) — no bugs in the doc state or process.

## Documentation Updates

| File | Change |
|------|--------|
| `ai-specs/specs/ui-design-system.md` | **2 Edits**: (a) §1 Card rewrite in place (lines 157-178 → ~50 lines new content) — drift heavy replaced with 4-CSS-class comparison table + variant selection guide + hardcoded-values disclosure + cross-reference to §48 StickyCard; (b) Common Patterns "Card-style Container" sub-section deleted (~10 lines removed). Net: small delta, mostly section content replaced + small Common Patterns reduction. Section count §1-§50 unchanged (no add/delete of numbered sections). |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-346_frontend.md` | Plan (NEW — written during /plan) |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-346_verify.md` | Verify report (NEW — verdict PASS) |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-346_frontend.md` | This record (NEW) |
| `ai-specs/specs/integration-state.md` | **No update** — no module/guard/service changes |
| `ai-specs/specs/data-model.md` | **No update** — no DB |
| `ai-specs/specs/api-spec.yml` | **No update** — no endpoints |

## Audit Finding Resolution

This sub-ticket resolves the **§1 Card audit row** + **Out-of-ui-folder registry footnote** (partial — registry fix deferred):

| Item | Audit context | Original status | Resolution | Verified by |
|------|----------------|------------------|------------|-------------|
| §1 Card | Row 213 ("Card | globals.css | Card is a CSS class, not a .tsx. Doc text mostly aligns... Recommend Part B verify the globals.css definitions match §1's pixel values.") | Drift heavy (raw hex + pixel dims + 1-class doc but 4-class reality) | **§1 Card REWRITTEN** — 4 CSS classes documented as comparison table from globals.css lines 200-229; tokens for shared base; hardcoded-values honestly disclosed; cross-cluster reference to §48 StickyCard | AC1+AC2+AC3+AC6+AC7 PASS |
| Common Patterns "Card-style Container" | Drifted parallel description (raw hex + outdated `Used by` list referencing deleted §sections) | Stale | **DELETED** (Option A canonicalization) | AC4 PASS |
| Registry "Sidebar.tsx" → "SidebarNav.tsx" | Out-of-ui-folder footnote (audit-table line 213) | Stale entry | **DEFERRED** to separate ticket per Option A (em-ecosystem-code on SCRUM-342-frontend WIP) | Documented in Deviation #5 |

Final state for Part B: **all numbered §sections backed by code reality** (50 sections — every one corresponds to a real file in `nexacore-dashboard/src/components/ui/` or `globals.css` for §1 Card).

## SCRUM-329 Part B — INITIATIVE CLOSURE

**This /update-docs commit closes the entire Part B reconciliation initiative.**

### Summary of all 10 sub-tickets

| Sub-ticket | Cluster | Components | Deviations | Commit |
|------------|---------|-----------|------------|--------|
| B1 (SCRUM-334) | Form controls (Inputs) | 5 (Input, DateInput, MfaDigitInput, Checkbox, FormField) | 2 | `f875672` |
| B2 (SCRUM-335) | Form controls (other) | 3 (Toggle, Slider, Select) + Ambiguity 3 | 2 | `4164342` |
| B3 (SCRUM-336) | Navigation | 4 (Tabs, Pagination, Breadcrumbs, SidebarNav) | 3 | `736c0df` |
| B4 (SCRUM-337) | Modals + Overlays | 5 (ConfirmModal, Tooltip, IdleWarningModal, CommandPalette, SearchTrigger) + 2 deletes (§9, §20) + 18-section renumber | 5 | `b5f89dd` |
| B5 (SCRUM-338) | Auth-specific atoms | 5 (CopyField, QrCodeCard, RecoveryCodesGrid, TurnstileWidget, CountdownTimer) | 6 | `4ed94e9` |
| B6 (SCRUM-339) | Display primitives | 9 (Avatar, Badge, IconBadge, Spinner, InfinitySpinner, RingSpinner, Divider, Accordion, EmptyState) | 7 | `7074875` |
| B7 (SCRUM-340) | Buttons + interactive | 3 (Button rewrite + IconButton + SegmentedControl) + 2 Common Patterns Button deletes | 10 | `c816d31` |
| B8 (SCRUM-341) | Feedback / Alerts | 6 (Toast rewrite + ToastContainer + AlertBox + ErrorAlert + InlineError promote + RateLimitBanner) | 18 | `f58f624` |
| B9a (SCRUM-343) | Drift + structural decisions | 4 (Calendar rewrite + ThemeToggle promote + LanguageSelector + EmailSelector) + Common Patterns Selector Trigger delete + Theme System Toggle Component condense | 27 | `fd0817f` |
| B9b (SCRUM-344) | Pure adds | 4 (DataTable + StickyCard + ImageCropper + BeforeAfterSlider) | 29 | `0e50606` |
| **B10a (SCRUM-345)** | **Cleanup deletes + renumber** | **5 deletes (§2, §11, §12, §13, §14) + 49-section renumber + ~287 cross-refs** | 2 | `c74b906` |
| **B10b (SCRUM-346)** | **§1 Card reconciliation (FINAL)** | **§1 Card rewrite + Common Patterns Card-style Container delete** | 5 | (this commit) |
| Pre-B7 hotfix | (housekeeping) | 2 broken cross-refs (§18 Button Set) | — | `eb09097` |
| Pre-B8 hotfix | (housekeeping) | 22 broken cross-refs (B1-era drift) | — | `ea9f833` |

**Totals**:
- 12 sub-tickets + 2 housekeeping commits
- ~50+ components reconciled (some rewrites, some adds, some structural)
- ~116 deviations (all Accepted-Trivial — 0 blockers)
- 0 Accepted-Risk, 0 Accepted-Quality, 0 Deferred (formal), 0 Scope-Gap across the entire initiative
- Doc evolved §1-§27 (pre-Part B) → §1-§55 (post-B9b) → §1-§50 (post-B10a/b FINAL)
- 1 atomic correction commit + 1 systemic fix-up commit (housekeeping for cross-ref drift)
- 1 Python script (B10a renumber, one-shot tooling at `integrations/jira-mcp-server/scripts/`)

### Patterns established / lessons crystallized

1. **Lifecycle adaptation: docs-only with no em-ecosystem-code branch** — 12 consecutive applications. Pattern: when `/develop` only touches `ai-specs`, no `feature/*` branch in code repo + `/update-docs` commits to `ai-specs main` directly.
2. **Honest-disclosure pattern**: any spec-vs-code drift, JSX-only sections (no spec export), abbreviated forms, hardcoded values, cross-cluster compositions, etc. — surface explicitly with blockquote disclosures.
3. **Single big-edit insert** for pure-add clusters (B5/B6/B8/B9b).
4. **3-Edit pattern** (rewrite + delete + insert) for B7-style mixed clusters.
5. **5-Edit pattern** (rewrite + multi-insert + cross-ref updates) for B8-style canonicalization-with-promotion.
6. **4-Edit pattern** (rewrite + multi-insert + delete + cross-ref update) for B9a-style structural decisions.
7. **Script-based bulk operations** (B10a) — 49-section renumber + ~287 cross-ref updates in single execution.
8. **Sister-primitive comparison tables** for cluster cross-sections (B6 Spinner trio, B7 §43 vs §6, B8 §45 alert family, B9a §50 vs §51).
9. **Centralized Pattern note** for systemic findings (B6 Display primitives opacity pattern — 11 occurrences across 4 clusters).
10. **Cross-cluster cross-references** documented at depth (B8/B9a/B9b — record 5 in B9a).
11. **Cross-reference text-match validation** as permanent /verify check (B7 lessons-learned, ran doc-wide from B8+).
12. **Doc-wide broken-ref sweep** as permanent /verify check (B8 lessons-learned, extended to 17 patterns by B10a).
13. **Canonicalization pattern**: when Common Patterns sub-section drifts vs canonical numbered §section, prefer DELETE (B4 Ambiguity 1 → B7 Button → B8 InlineError → B9a Selector Trigger → B10b Card-style Container).
14. **Promotion pattern**: when component is "documented but inline elsewhere", PROMOTE to dedicated §section (B8 InlineError, B9a ThemeToggle / LanguageSelector / EmailSelector).
15. **Abbreviated-form refs handling** — multi-word section names often have abbreviated cross-refs; future renumber scripts must handle BOTH full + abbreviated forms (B10a lesson).

### Carry-forward items beyond Part B

1. **Registry fix** `Sidebar.tsx → SidebarNav.tsx` in `em-ecosystem-code/nexacore-dashboard/src/lib/component-registry.ts` (1-line code change) — tag-along candidate for SCRUM-342 OR separate small cleanup ticket.
2. **Display primitives opacity pattern coordinated migration** — when `--color-content-tertiary` (50%) and `--color-content-quaternary` (30%) tokens are added to globals.css, migrate all 11 occurrences across 4 clusters in 1 PR (B6:5 + B7:3 + B8:1 + B9a:1 + B9b:1).
3. **DataTable / Toast `text-content-tertiary` 3rd opacity step** — token verification pending (could be 12th opacity-pattern occurrence if formalized).
4. **Card 4 CSS classes hardcoded values** — `border-radius`, `box-shadow`, `padding` not yet tokenized as `--radius-*`, `--shadow-*`, `--space-*`. Future cleanup ticket can migrate.
5. **All component-level lessons** from per-sub-ticket records (StickyCard 2-sub-component refactor, ImageCropper hardcoded crop-size, BeforeAfterSlider hardcoded SVG arrow, IconButton orphan variants, etc.) — captured in respective record files for future reference.
6. **Long-term: doc-from-code generator** — per audit-table.md "Long-term: prevent recurrence" recommendation. Suggested ticket scope: read all `*Specs`/`*Variants`/`*Classes` exports + parse JSDoc + render markdown sections matching the Part B format. Prevents drift accumulation; would make Part B a one-time cleanup vs recurring tax.

## Lessons Learned (B10b specific + Part B retrospective)

### What went well in B10b

- **Smallest-scope Part B sub-ticket landed cleanly**. Single section rewrite + 1 Common Patterns delete = 1 user-approval gate, 2 Edits, 8 AC checks. ~30 minutes /develop.
- **NEW 4-CSS-class single-section pattern established**. §1 Card is the first §section that documents multiple CSS utility classes (instead of 1 React component). Pattern reusable for future CSS-class primitives if surfaced.
- **Pre-audit caught the em-ecosystem-code WIP issue early**. Discovery during /enrich-us pre-audit that em-ecosystem-code is on `feature/SCRUM-342-frontend` with uncommitted WIP allowed clean Option A decision (defer registry fix) — avoided risky stash/branch operations.
- **Common Patterns canonicalization pattern crystallized**. B4/B7/B8/B9a/B10b all execute the same pattern (DELETE Common Patterns sub-section that drifts from canonical §section). Reusable.
- **Doc-wide broken-ref sweep continues clean** (0/17 patterns post-B10b). The B8/B9a permanent check remains valuable as both reactive and proactive.

### Part B retrospective

- **Lifecycle adaptation worked perfectly across 12 sub-tickets**: no `em-ecosystem-code` branch needed; `/develop` modified `ai-specs/` only; `/update-docs` committed to `ai-specs main` directly. Zero exceptions across 12 consecutive applications.
- **Honest-disclosure pattern scaled to 116+ deviations**: all Accepted-Trivial. Zero blockers. Zero scope-gaps. The honest-disclosure approach made deviations documentation-as-feature rather than friction.
- **Trend: deviation count grew with cluster behavior-richness, dropped with cleanup tickets** (B7: 10, B8: 18, B9a: 27, B9b: 29, B10a: 2, B10b: 5). Behavior-rich clusters generate per-disclosure deviations; cleanup tickets consolidate operations into single design decisions.
- **Cross-reference text-match validation + doc-wide broken-ref sweep** (B7 + B8 lessons) caught critical regressions: 2 broken refs (B6 → eb09097), 22 broken refs (B1-era → ea9f833), 26 abbreviated stale refs (B10a fix-up). Without these checks, the doc would have accumulated silent drift.
- **Script-based approach for bulk operations** (B10a) — 49-section renumber + ~287 cross-refs updated in single execution. Pattern reusable.
- **Per-sub-ticket discovery during /enrich-us** consistently caught issues before /develop: B7 found 2 broken §18 refs (eb09097), B8 found 22 broken refs (ea9f833), B10b found em-ecosystem-code WIP conflict. Pattern: pre-audit during /enrich-us is essential for clean execution.

### Recommendations for post-Part B work

1. **Open a follow-up ticket for the registry fix** (`Sidebar.tsx → SidebarNav.tsx`) once SCRUM-342 ships OR as standalone cleanup.
2. **Open a doc-from-code generator ticket** per audit-table.md long-term recommendation. Without it, drift will accumulate again over 6-12 months.
3. **Consider migrating Card 4 classes hardcoded values to tokens** as a small cleanup ticket — not urgent but quality improvement.
4. **Document the "Part B lessons" set as a workflow-standards.mdc addendum** — the 15 patterns established here are reusable for future docs/code reconciliation work.
5. **Doc-only adaptation pattern is now validated** — workflow-standards.mdc could formally codify it as an option for tickets where /develop only touches `ai-specs/`.

## Next Steps

**Part B is COMPLETE.** No next sub-ticket. The /update-docs commit for SCRUM-346 closes the entire reconciliation initiative.

**Out-of-scope follow-ups** (carry-overs):
- Registry fix `Sidebar.tsx → SidebarNav.tsx` — tag-along in SCRUM-342 OR separate cleanup ticket
- Doc-from-code generator — long-term recommendation per audit-table.md
- Card 4 classes tokenization (radius/shadow/padding) — small future cleanup
- Token verification for `text-content-tertiary` (3rd opacity step) — would unify opacity-pattern scope to 12 occurrences

**Final doc state**: §1-§50 (50 numbered sections, all backed by code in `nexacore-dashboard/src/components/ui/` or `globals.css`). No orphan sections. No broken cross-references. No Common Patterns drift duplicates. Doc-wide broken-ref sweep clean across 17 patterns.

The SCRUM-329 Part B reconciliation initiative achieved its goal: bring `ui-design-system.md` into faithful alignment with the actual code reality.
