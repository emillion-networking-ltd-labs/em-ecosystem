# Implementation Record: SCRUM-343 Reconcile ui-design-system.md — Drift + structural decisions cluster

## Summary

B9a of 9 sub-tickets from SCRUM-329 Part B reconciliation (split per user decision into B9a + B9b). **Most structurally-complex Part B sub-ticket alongside B7**: 2 confirmed structural decisions executed simultaneously (Decision 1 ThemeToggle PROMOTE + Decision 2 Common Patterns "Selector Trigger" DELETE), 1 heavy in-place rewrite (Calendar §4 — 344 source lines, largest single component in Part B), 3 new sections (§49 ThemeToggle + §50 LanguageSelector + §51 EmailSelector). 4 user-approval gates, 4 separate Edits. Section count grows §1-§48 → §1-§51 (+3). Doc grew 3032 → 3278 lines (+246 net). **NEW deviation count record: 27** (vs 18 in B8, 10 in B7).

**Note on SCRUM number jump**: SCRUM-342 already existed for an unrelated login-bug ticket (Sprint 12). B9a uses SCRUM-343 (next available).

**New patterns introduced**:
1. **Doc-wide cross-reference text-match validation now permanent** (proven in B8 + applied proactively in B9a — 0/7 broken patterns confirmed post-B9a). The check is reactive AND proactive.
2. **First documentation of 2 globals.css animation classes in Part B** (`animate-stagger` for §50 LanguageSelector + `animate-dropdown-down` for §51 EmailSelector) — establishes pattern for documenting CSS-defined animations alongside framer-motion (B8 precedent).
3. **5 cross-cluster cross-references — record in Part B** (vs B8's 2): §49→§42 IconButton (B7), §50→§33 Avatar (B6), §50→§21 Input (B1), §51→§33 Avatar (B6), §51→§15 Button (B7). Reflects B9a's promotion of components that are heavy composers.
4. **NEW disclosure category — 4th opacity step (`opacity-30` element-level)** — Calendar disabled days use Tailwind opacity modifier on the entire element, distinct from the `text-content-primary/{30,50,75}` text-color opacity series. Future cleanup could extend Pattern note's scope or document element-opacity separately.

- **Scope**: `frontend` (docs reconciliation of frontend components — read-only on code, write-only on `ui-design-system.md`)
- **Branch**: none in `em-ecosystem-code` (carry-forward Accepted-Trivial — 9th application of the lifecycle adaptation declared in SCRUM-329).
- **Implementation date**: 2026-05-03
- **Anchors**:
  - Code (`em-ecosystem`): `8d2fa80c` (post-SAT01-5 round 2 — unchanged through B1-B8)
  - Doc starting state (`ai-specs`): `f58f624` (post-/update-docs of SCRUM-341 / B8)

## Plan Reference

- Plan: [`SCRUM-343_frontend.md`](../../plans/Sprint%2014/SCRUM-343_frontend.md)
- Verify: [`SCRUM-343_verify.md`](../../plans/Sprint%2014/SCRUM-343_verify.md) — verdict **PASS**
- Plan was followed: **Yes, with twenty-seven Accepted-Trivial deviations** (1 carry-forward + 26 honest-disclosure variants — record count, surpassing B8's 18).

## Commits

| Repo | Hash | Message | Files |
|------|------|---------|-------|
| `em-ecosystem` | (none) | No code changes — docs-only ticket | 0 files |
| `ai-specs` | (current /update-docs commit) | `docs(SCRUM-343): reconcile Drift + structural decisions cluster — B9a of SCRUM-329 Part B` | 4 files |

## Deviations from Plan

| # | Step(s) | Planned | Actual | Reason | Category | Follow-up |
|---|---------|---------|--------|--------|----------|-----------|
| 1 | 0 | "No code branch needed (carry-forward Accepted-Trivial)" | No `feature/SCRUM-343-frontend` branch in `em-ecosystem-code`. | 9th consecutive application — convention silenced. | **Accepted-Trivial** | — |
| 2 | 2a | "Draft §4 Calendar rewrite from `calendarSpecs`" | Section rewritten with **4 drift notes** vs prior doc (container `rounded-3xl→rounded-xl`, nav arrows `24x24 rounded-1000px→w-6 h-6 rounded-full`, selected day `5%→100% DARK`, 3 view modes vs only days). | Honest documentation pattern — same as B7 §15 Button rewrite + B8 §19 Toast rewrite. Doc now reflects code reality. | **Accepted-Trivial** | — |
| 3 | 2b | "Draft §49 ThemeToggle from `themeToggleSpecs`" | Section added — ThemeToggle has **NO spec export** (JSX-only). Disclosure blockquote at top. | Same precedent as B5+ JSX-only disclosures (§31 TurnstileWidget, §32 CountdownTimer, §19 Toast, §44 ToastContainer, §46 ErrorAlert, §48 RateLimitBanner). | **Accepted-Trivial** | Lessons-learned: future code-side cleanup could add `themeToggleSpecs`. |
| 4 | 2b | "Draft §49 ThemeToggle composition" | §49 composes §42 IconButton (`variant="boxed"`, `size="sm"`, `tooltip`) — **first B9a→B7 cross-cluster cross-reference**. | Honest documentation. Composition documented in code block. | **Accepted-Trivial** | — |
| 5 | 2b | "Draft §49 ThemeToggle SSR-safe pattern" | §49 SSR-safe `mounted` state — non-obvious behavior. Documented with full rationale (prevents flash on hydration) + placeholder dimensions matching IconButton size="sm" (h-8 w-8). | Honest documentation. Without callout, a developer would "clean up" the pattern thinking it's over-engineering. | **Accepted-Trivial** | — |
| 6 | 2b | "Draft §49 ThemeToggle ARIA" | §49 dynamic aria-label "Switch to {dark|light} mode" — WAI-ARIA pattern (label describes action, not current state). | Honest documentation. Without callout, a developer might "fix" to current-state label like "Theme: light". | **Accepted-Trivial** | — |
| 7 | 2b | "Draft §49 ThemeToggle icons" | §49 drift note: prior Theme System docs said `sun-dim`; current code uses `Sun` (lucide canonical). Rationale documented (refactor consolidated lucide imports). | Honest documentation. | **Accepted-Trivial** | — |
| 8 | 2b + 3d | "Decision 1 Option A: PROMOTE ThemeToggle to dedicated section + update Theme System cross-ref" | **Decision 1 Option A executed**: §49 PROMOTED from Theme System chapter "Toggle Component" subsection (line 126). Theme System cross-ref updated to point to §49. | Same canonicalization precedent as B4 Ambiguity 1, B7 Common Patterns Button cleanup, B8 InlineError promotion. Single design decision spanning 2 sub-steps — counted once. | **Accepted-Trivial** (canonicalization) | — |
| 9 | 2c | "Draft §50 LanguageSelector positioning" | §50 smart 4-quadrant positioning (vertical up/down + horizontal left/right) — viewport-aware via `getBoundingClientRect()` with hardcoded thresholds (popoverHeight 350px, popoverWidth 330px). | Honest documentation. Non-obvious behavior worth documenting. | **Accepted-Trivial** | — |
| 10 | 2c | "Draft §50 LanguageSelector trigger states" | §50 spec-vs-JSX minor drift: `languageSelectorSpecs.trigger.open` says `bg-surface-primary` but JSX uses `bg-surface-subtle`. Doc reflects JSX (code reality). | Honest documentation. Code-side reconciliation candidate. | **Accepted-Trivial** | Lessons-learned: code-side reconciliation pending (either update spec field or update JSX). |
| 11 | 2c | "Draft §50 LanguageSelector composition" | §50 composes §33 Avatar + §21 Input — **2 cross-cluster cross-references** (B6 + B1). | Honest documentation. | **Accepted-Trivial** | — |
| 12 | 2c | "Draft §50 LanguageSelector persistence" | §50 localStorage persistence (`STORAGE_KEY = "nexacore-language"`) with hydration-safe pattern. | Honest documentation. | **Accepted-Trivial** | — |
| 13 | 2c | "Draft §50 LanguageSelector data" | §50 hardcoded language list (`LANGUAGES` const, EN/ES/FR) — non-extensible via props. | Honest documentation + extension point note. | **Accepted-Trivial** | Lessons-learned: future enhancement could accept languages prop. |
| 14 | 2c + 3c | "Decision 2 Option A part 1: PROMOTE LanguageSelector + update Common Patterns cross-ref" | **Decision 2 Option A executed (part 1)**: §50 PROMOTED from Common Patterns "Selector Trigger (Popover Pattern)" Borderless variant. | Counted with #20 (single Decision 2 executed across §50 + §51 + delete). | **Accepted-Trivial** (canonicalization) | — |
| 15 | 2d | "Draft §51 EmailSelector dropdown content" | §51 single-action dropdown naming note — visually a selector trigger but semantically a confirmation + escape (no list of options). | Honest documentation. Non-obvious — without callout, consumers would expect to pass a list. | **Accepted-Trivial** | — |
| 16 | 2d | "Draft §51 EmailSelector composition" | §51 composes §33 Avatar + §15 Button — **2 cross-cluster cross-references** (B6 + B7). | Honest documentation. | **Accepted-Trivial** | — |
| 17 | 2d | "Draft §51 EmailSelector positioning" | §51 fixed downward positioning + left-aligned (NO smart positioning) — distinguished vs §50. Rationale: single auth-flow use case, hardcoded `w-[300px]`. | Honest documentation. | **Accepted-Trivial** | — |
| 18 | 2d | "Draft §51 EmailSelector ARIA" | §51 "Try a different email address" link label hardcoded English — i18n enhancement pending. | Honest documentation. | **Accepted-Trivial** (i18n) | Lessons-learned: i18n enhancement pending. |
| 19 | 2d | "Draft §51 EmailSelector layout" | §51 `relative self-start` container — opt-out of parent flex stretching. Required in auth layouts. | Honest documentation. | **Accepted-Trivial** | — |
| 20 | 2d + 3c | "Decision 2 Option A part 2: PROMOTE EmailSelector + DELETE Common Patterns Selector Trigger" | **Decision 2 Option A executed (part 2)**: §51 PROMOTED from Common Patterns "Selector Trigger (Popover Pattern)" Bordered variant. PLUS Common Patterns sub-section DELETED (~93 lines removed). | Counted with #14 (single Decision 2 executed). | **Accepted-Trivial** (canonicalization) | — |
| 21 | 2c + 2d | "Draft §50 + §51 with animations" | **First documentation of 2 globals.css animation classes in Part B**: `animate-stagger` (§50) and `animate-dropdown-down` (§51). Establishes pattern for documenting CSS-defined animations. | Honest documentation. Single design decision (animation library docs precedent extended) spanning 2 sections — counted once. | **Accepted-Trivial** | Lessons-learned: pattern reusable for future animation-bearing components (B9b may have some). |
| 22 | 2a | "Draft §4 Calendar day-cell states" | Calendar §4 `text-content-primary/50` for other-month days — **10th occurrence of [Display primitives opacity pattern](#display-primitives-opacity-pattern)** across 4 clusters (B6: 5, B7: +3, B8: +1, B9a: +1). Inline cross-reference; B6 Pattern note table NOT modified (cluster-scope semantics preserved per B7/B8 precedent). | Honest documentation. Coordinated migration scope grew. | **Accepted-Trivial** | Lessons-learned: when `--color-content-tertiary` token added, migrate all 10 in 1 PR. |
| 23 | 2a | "Draft §4 Calendar disabled state" | Calendar §4 `opacity-30` for disabled days — **NEW disclosure category**: 4th opacity step beyond `text-content-primary/{30,50,75}` series. Tailwind opacity *modifier on the entire element* (not just text color). Worth surfacing separately. | Honest documentation. | **Accepted-Trivial** | Lessons-learned: future cleanup could extend Pattern note's scope or document element-opacity separately. |
| 24 | 3c + 3d | "Apply Edits 3 + 4 (delete + cross-ref update)" | **2 structural changes executed silently** per user pre-approval: Edit 3 (delete Common Patterns Selector Trigger ~93 lines) + Edit 4 (Theme System Toggle Component cross-ref update ~3 lines condensed). | Counted with #8, #14, #20 (single decisions executed across multiple steps). | **Accepted-Trivial** | — |
| 25 | 2a | "Draft §4 Calendar ARIA" | Calendar §4 navigation arrows hardcoded `aria-label="Previous"` / `aria-label="Next"` — i18n enhancement pending. | Honest documentation. | **Accepted-Trivial** (i18n) | Lessons-learned: i18n enhancement pending. |
| 26 | 2a | "Draft §4 Calendar header behavior" | Calendar §4 documents header click state machine (days↔months↔years). Non-obvious behavior worth documenting. | Honest documentation. | **Accepted-Trivial** | — |
| 27 | 2b + 2c + 2d | "Cross-references documented" | **5 cross-cluster cross-references in B9a — record in Part B** (vs B8's 2): §49→§42 IconButton (B7), §50→§33 Avatar (B6), §50→§21 Input (B1), §51→§33 Avatar (B6), §51→§15 Button (B7). | Honest documentation. Trend reflects B9a's promotion of components that are heavy composers. | **Accepted-Trivial** | — |

**No Accepted-Quality, no Accepted-Risk, no Deferred, no Scope-Gap items.**

**27 deviations is the highest count in any Part B sub-ticket so far** (B1: 2, B2: 2, B3: 3, B4: 5, B5: 6, B6: 7, B7: 10, B8: 18, **B9a: 27**). All Accepted-Trivial. Per-occurrence count would be ~30 — counted by design decision/pattern (Deviations #8, #14+#20, #21 each span 2 sub-steps; #24 spans 2 sub-steps).

## Test Results

| Check | Result | Details |
|-------|--------|---------|
| Unit tests | N/A | Docs-only ticket. |
| Build verification | N/A (no code change) | `em-ecosystem-code` working tree clean throughout. |
| 14 grep AC checks (per plan §6) | **14/14 PASS** | AC1 (no raw hex in §4 — 0 hits) ✅, AC2 (3 view modes — days 19, months 12, years 13) ✅, AC3 (rounded-xl — 2 hits) ✅, AC4 (rounded-full — 3 hits) ✅, AC5-7 (§49-§51 each = 1) ✅, AC8 (numbering §1-§51, max=51, no GAP) ✅, AC9 (4/4 sections with `**Source:**`) ✅, AC10 (5 cross-refs — §49→§42=8, §50→§33=3, §50→§21=4, §51→§33=4, §51→§15=6) ✅, AC11 (Common Patterns Selector Trigger removed — 0 hits) ✅, AC12 (Theme System Toggle Component → §49 = 1 — initially returned 0 due to awk pattern bug `^## ` self-matched the heading; re-verified with proper boundary pattern `/^### Toggle Component/,/^### Token Mapping/`) ✅, AC13 (cross-ref text-match validation: 9/9 §N <Name> references verified) ✅, AC14 (§4 `text-content-primary/50` 10th opacity occurrence — 2 hits) ✅. |
| Bonus integrity checks | **5/5 PASS** | §50 smart positioning (2 hits) ✅, §51 single-action dropdown (4 hits) ✅, §49 SSR-safe mounted (6 hits) ✅, doc-wide broken-ref sweep (0/7 patterns) ✅, file size delta 3032→3278 (+246 lines) ✅. |
| Spot-check independent verification | **10/10 PASS** | §4 in-place rewrite preserves position (line 299) ✅, §4 3 view modes match `Calendar.tsx:77` ✅, §4 selected day match `Calendar.tsx:225-231` ✅, §49 composition matches `ThemeToggle.tsx:24-35` ✅, §50 smart positioning matches `LanguageSelector.tsx:60-67` ✅, §50 spec-vs-JSX drift confirmed (spec line 27 vs JSX line 127) ✅, §51 single-action match `EmailSelector.tsx:64-89` ✅, Common Patterns Selector Trigger removed (0 matches) ✅, Theme System cross-ref correct ✅, doc-wide broken-ref sweep 0/7 ✅. |
| User-approval gates | 4/4 confirmed | Gate 1 (§4 Calendar rewrite), Gate 2 (§49 ThemeToggle), Gate 3 (§50 LanguageSelector), Gate 4 (§51 EmailSelector). Each draft presented with rationale and disclosures before applying. |

## Bugs Found

**One minor bash awk pattern bug discovered + corrected during /verify** (no impact on actual doc state):

1. **AC12 awk pattern self-matched heading**: initial check used `awk '/^## Theme System/,/^## /'` which treated `## Theme System` as both range start AND range end (since it matches `^## `), returning 0 hits for `§49`. Re-verified with `awk '/^### Toggle Component/,/^### Token Mapping/'` which correctly captured the sub-section content — confirmed §49 cross-ref is present. **Lesson**: awk range patterns where start matches end pattern self-terminate; use distinct boundary patterns.

No other bugs. The 27 Accepted-Trivial deviations are honest-documentation cases (3 JSX-only sections, 4 drift notes, 2 structural decisions executed, 5 cross-cluster compositions, 2 globals.css animations documented, NEW opacity step disclosure) — the underlying components and spec exports are functioning as designed.

## Documentation Updates

| File | Change |
|------|--------|
| `ai-specs/specs/ui-design-system.md` | **Mixed edit pattern** — 4 separate Edits: (a) Edit 1 in-place rewrite of §4 Calendar (preserves heading + position, ~22 lines → ~95 lines = +73 lines net for this section); (b) Edit 2 multi-section insert §49-§51 + closing dividers before `## Common Patterns` anchor (~330 lines added); (c) Edit 3 delete Common Patterns "Selector Trigger (Popover Pattern)" sub-section (~93 lines removed); (d) Edit 4 Theme System "Toggle Component" sub-section condensed from 5 inline bullets to 2-line cross-reference (~3 lines net change). Net: doc grew 3032 → 3278 lines (+246). Section count §1-§48 → §1-§51 (+3). **First sub-ticket since B7 with both rewrite + delete + cross-ref update + multi-insert in one ticket**. |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-343_frontend.md` | Plan (NEW — written during /plan) |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-343_verify.md` | Verify report (NEW — verdict PASS) |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-343_frontend.md` | This record (NEW) |
| `ai-specs/specs/integration-state.md` | **No update** — no module/guard/service changes |
| `ai-specs/specs/data-model.md` | **No update** — no DB |
| `ai-specs/specs/api-spec.yml` | **No update** — no endpoints |

## Audit Finding Resolution

This sub-ticket of SCRUM-329 Part B resolves 4 component rows from the audit table + 2 structural changes:

| Item | Audit row | Original classification | Resolution | Verified by |
|------|-----------|-------------------------|------------|-------------|
| Calendar | row 8 | Documented-Drifted | **§4 REWRITTEN in place** — token-based (drops raw hex), 3 view modes (was only days), day-cell states with priority order, opacity pattern 10th occurrence reference, NEW 4th opacity step disclosure (`opacity-30`), Monday-based weeks, 42-cell layout, ARIA contracts | AC1+AC2+AC3+AC4+AC14 PASS |
| ThemeToggle | row 43 | Ambiguous (Theme System chapter) | **§49 PROMOTED** (Decision 1 Option A) — JSX-only, composes §42 IconButton, SSR-safe mounted state, dynamic aria-label WAI-ARIA pattern, sun-dim → Sun drift note. Theme System cross-ref updated. | AC5+AC9+AC12 PASS |
| LanguageSelector | row 28 | Documented-Drifted (Common Patterns Selector Trigger Borderless) | **§50 PROMOTED + DRIFT REWRITE** (Decision 2 Option A part 1) — sourced from `languageSelectorSpecs`, smart 4-quadrant positioning, spec-vs-JSX minor drift disclosure, composes §33 Avatar + §21 Input (2 cross-cluster), localStorage persistence, hardcoded language list. | AC6+AC9 PASS |
| EmailSelector | row 17 | Documented-Drifted (Common Patterns Selector Trigger Bordered) | **§51 PROMOTED + DRIFT REWRITE** (Decision 2 Option A part 2) — sourced from `emailSelectorSpecs`, single-action dropdown naming note, fixed downward positioning, sister comparison with §50, composes §33 Avatar + §15 Button (2 cross-cluster). | AC7+AC9 PASS |

Final state: 4/4 components RESOLVED. Plus **2 structural changes executed simultaneously**: Decision 1 (ThemeToggle PROMOTE + Theme System cross-ref update) + Decision 2 (§50/§51 PROMOTE + Common Patterns Selector Trigger DELETE ~93 lines).

## Lessons Learned

### What went well

- **Pre-/develop /enrich-us discovery + plan paid off — 4 gates flowed quickly.** All 4 component files were read during /enrich-us; no surprises during /develop except the corrected awk pattern bug in AC12 (cosmetic — no impact on doc state).
- **2 structural decisions executed simultaneously without friction.** Decision 1 (ThemeToggle PROMOTE) + Decision 2 (Common Patterns Selector Trigger DELETE) were both confirmed during /enrich-us. Edit 3 (delete) and Edit 4 (cross-ref update) executed silently per user pre-approval. Single big-edit insert pattern (Edit 2) handled the 3 new sections atomically. **Most ambitious cleanup in any single B-sub-ticket.**
- **Cross-cluster cross-references reached record 5 in B9a** (vs B8's 2). §49→§42, §50→§33, §50→§21, §51→§33, §51→§15. All 5 verified by Bonus 13 text-match validation. Pattern proven; future B-clusters expected to have similar density as components compose more widely.
- **Doc-wide broken-ref sweep (proactive — B8 lesson) confirmed clean** — 0/7 historical broken patterns post-B9a. Validates that B8's eb09097 + ea9f833 fixes are still solid AND B9a work introduced 0 new broken refs.
- **NEW disclosure category established for element-level opacity** (`opacity-30` Tailwind modifier vs `text-content-primary/30` text-color). Calendar disabled days are the first documented occurrence. Future cleanup decision: extend Pattern note's scope or document separately.
- **First documentation of 2 globals.css animation classes in Part B** (`animate-stagger` + `animate-dropdown-down`) — pattern reusable for future animation-bearing components.
- **Calendar §4 rewrite (largest single component in Part B at 344 source lines) handled in 1 gate** without splitting. The substantial section content was approved in a single review cycle.
- **Plan estimate held loosely** — predicted 15-20 deviations; actual was 27. Trend continues (B7: 10, B8: 18, B9a: 27 = ~50% growth per sub-ticket). The growth reflects depth of compositions + structural decisions + new disclosure categories — NOT regression in plan fidelity.

### What was harder than expected

- **AC12 awk pattern self-match bug** — initial verification check used `/^## Theme System/,/^## /` which self-matched the heading. Re-verified with `/^### Toggle Component/,/^### Token Mapping/`. Cosmetic bug — no impact on doc state. **Lesson**: awk range patterns where start matches end pattern self-terminate; use distinct boundary patterns.
- **2 structural decisions accumulating into 27 deviations was harder to reason about.** The trend (B1: 2 → B9a: 27 = 13× growth) is now substantial. Per-ticket deviation tracking has become a meta-pattern in itself. **Lesson for B9b + B10**: deviation count growth is a pattern signal, not a regression — embrace and document the growth.
- **`opacity-30` element-level disclosure required explicit categorization** beyond the established `text-content-primary/{30,50,75}` text-color series. Without explicit framing, the disclosure would conflate with the existing opacity pattern. **Lesson**: when a new disclosure variant emerges, distinguish it explicitly to prevent future conflation.
- **5 cross-cluster cross-references stress-tested the AC13 text-match validation** — 9 references touched in B9a (4 within-cluster + 5 cross-cluster). All passed. **Lesson**: AC13 scales linearly with cross-reference count; no perf issues observed.

### Recommendations for similar tickets (B9b + B10)

1. **Cross-reference text-match validation MUST run doc-wide as proactive check** — proven in B8 + B9a. Pattern crystallized.
2. **For B9b (pure adds — DataTable + StickyCard + ImageCropper + BeforeAfterSlider)**: expect lower deviation count (no structural decisions, no rewrites). Single big-edit insert pattern from B5/B6. Estimate ~10-15 deviations.
3. **For B10 (Cleanup — must run last)**: expect record-tying deviation count due to multiple structural deletes. May need to split into B10a + B10b if too complex for single ticket.
4. **awk range patterns require distinct boundary patterns** to avoid self-match. Use `/^### Header/,/^### NextHeader/` not `/^## Section/,/^## /`.
5. **Record promotion attribution explicitly** in promoted sections — Decision X Option Y executed → Section Y created. Same pattern as B4/B7/B8 + B9a.
6. **Document globals.css animation classes** when first encountered in Part B — establishes pattern for future ticker-style components.
7. **NEW disclosure categories should be explicit** — `opacity-30` element-level vs text-color opacity is the most recent example. Without explicit framing, future similar cases conflate.
8. **AC grep checks must use `-cE` flag** — proven again in B9a (lesson from B4).

## Next Steps

After this `/update-docs` commits to `ai-specs` main, the next sub-ticket is **B9b — Pure adds cluster** (4 components: DataTable + StickyCard + ImageCropper + BeforeAfterSlider). Pure-addition cluster, no rewrites, no deletes, no structural decisions. Should follow B5/B6 single-big-edit-insert pattern. Estimated 4 user-approval gates, ~10-15 deviations. After B9b, only **B10 (audit-B9) Cleanup** remains — must run last (deletes orphaning cross-references; remove §11 Quick Notification + §12 Payment Form + §13 Speedometer + §14 Notification + §2 Icon Set; reconcile §1 Card with globals.css; fix registry "Sidebar.tsx" → "SidebarNav.tsx"; reconsider §19 Toast heading "(Quick Notification)" suffix).

Pattern proven across B1-B9a is now stable. Carry-forward language is silent (9 consecutive applications). Honest-documentation pattern continues for spec-vs-JSX divergence + JSX-only sections + cross-cluster compositions + animation library docs + NEW element-level opacity disclosure category + structural decision execution. Single big-edit insert pattern for pure-addition clusters; 3-Edit pattern (rewrite + delete + insert) for B7-style mixed; 4-Edit pattern (rewrite + multi-insert + delete + cross-ref update) for B9a-style canonicalization. Centralized when-to-use comparison table pattern for cluster cross-sections. **Cross-reference text-match validation now permanent doc-wide in /verify** (reactive AND proactive).

Lessons-learned items captured in record (not auto-created tickets):
- **Cross-ref text-match validation runs DOC-WIDE proactively** — proven in B8 + B9a. Pattern crystallized.
- **`opacity-30` element-level NEW disclosure category** — Calendar disabled days. Future cleanup decision pending.
- **Display primitives opacity pattern coordinated migration scope grew to 10 occurrences across 4 clusters** (B6: 5, B7: +3, B8: +1, B9a: +1). Migrate together when `--color-content-tertiary` token added.
- **`animate-stagger` + `animate-dropdown-down` globals.css animation classes documented** in B9a — first in Part B. Pattern reusable for B9b.
- **§50 LanguageSelector spec-vs-JSX `bg-surface-primary` vs `bg-surface-subtle`** — code-side reconciliation candidate.
- **§50 LanguageSelector hardcoded language list** — non-extensibility, future enhancement could accept languages prop.
- **§51 EmailSelector hardcoded `aria-label="Try a different email address"`** — i18n enhancement pending.
- **§4 Calendar navigation arrows hardcoded `aria-label="Previous"` / `aria-label="Next"`** — i18n enhancement pending.
- **§49 ThemeToggle `aria-pressed` toggle semantics enhancement** — could make pressed state visible to screen readers.
- **§49/§50/§51 add `aria-expanded` to triggers** — communicate open/closed state to screen readers.
- **5 cross-cluster cross-references in B9a (record)** — pattern proven; future clusters expected to have similar density as components compose more widely.
- **(Carry-over from B8)** Toast `text-content-tertiary` token verification — possible 10th opacity-pattern occurrence (could be reframed if confirmed).
- **(Carry-over from B8)** Toast keyboard a11y enhancement (focus-visible:ring-1) pending.
- **(Carry-over from B8)** Toast "(Quick Notification)" suffix to be reconsidered in B10.
- **(Carry-over from B8)** ToastContainer `px-[50px]` non-token gap.
- **(Carry-over from B8)** ErrorAlert inline custom SVG code-side audit pending.
- **(Carry-over from B7)** Spinner unification opportunity (IconButton 4th implementation).
- **(Carry-over from B7)** IconButton orphan variants reconciliation (`circle` + `inside input`).
- **(Carry-over from B6)** Avatar + Badge consolidated specs pending.
- **(Carry-over from B6)** SegmentedControl `activeClasses` export pending.
- **(Carry-over from B5)** `text-green-600` migration when `--color-success` token available.
- AC grep checks must use `-cE` flag (or POSIX `[0-9][0-9]*` pattern) — proven again in B9a.
- awk range patterns require distinct boundary patterns to avoid self-match — new lesson from B9a AC12.
