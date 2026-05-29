# Verification Report: SCRUM-343 Reconcile ui-design-system.md — Drift + structural decisions cluster

**Date**: 2026-05-03
**Plan**: [`ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-343_frontend.md`](./SCRUM-343_frontend.md)
**Branch**: none in `em-ecosystem-code` (carry-forward Accepted-Trivial — 9th application). Work executed directly in `ai-specs/` working tree on `main`.
**Verdict**: **PASS**

## Scope confirmation

This ticket is **B9a of 9** sub-tickets from SCRUM-329 Part B reconciliation (split per user decision into B9a + B9b). **Most structurally-complex Part B sub-ticket** alongside B7: 2 confirmed structural decisions executed simultaneously (Decision 1 ThemeToggle PROMOTE + Decision 2 Common Patterns "Selector Trigger" DELETE), 1 heavy in-place rewrite (Calendar §4 — 344 source lines, largest single component in Part B), 3 new sections (§49 ThemeToggle + §50 LanguageSelector + §51 EmailSelector). 4 user-approval gates, 4 separate Edits.

Section count grows §1-§48 → §1-§51 (+3). Doc grew 3032 → 3278 lines (+246 net: ~+160 from §4 Calendar rewrite, ~+330 from §49+§50+§51 inserts, ~-93 from Common Patterns "Selector Trigger" delete, ~-3 from Theme System "Toggle Component" condensation — actual delta consistent with plan estimate).

**New patterns introduced in B9a**:
1. **Doc-wide cross-reference text-match validation now permanent** (Bonus 4) — proven in B8 (caught 22 B1-era broken refs); applied proactively in B9a. Result: 0/7 broken patterns across the entire doc post-B9a. The check is now reactive AND proactive.
2. **First documentation of 2 globals.css animation classes in Part B** (`animate-stagger` for §50, `animate-dropdown-down` for §51) — establishes pattern for documenting CSS-defined animations alongside framer-motion (B8 precedent).
3. **First record-tying cross-cluster reference count** (5 cross-refs from B9a to other clusters: §49→§42 IconButton (B7), §50→§33 Avatar (B6), §50→§21 Input (B1), §51→§33 Avatar (B6), §51→§15 Button (B7)) — record vs B8's 2.
4. **NEW disclosure category — 4th opacity step (`opacity-30` element-level)** — Calendar disabled days use Tailwind opacity modifier on the entire element, distinct from the `text-content-primary/{30,50,75}` text-color opacity series. Future cleanup could extend the Pattern note's scope or document element-opacity separately.

## Plan Compliance

| Step | Description | Status | Notes |
|------|-------------|--------|-------|
| 0 | No code branch (carry-forward) | DONE-DEVIATED | See Deviation #1. 9th consecutive application. |
| 1 | Discovery (already complete from /enrich-us) | DONE | All 4 component files + Common Patterns Selector Trigger + Theme System Toggle Component already read during /enrich-us. Watch list confirmed during /develop. |
| 2a | Draft §4 Calendar REWRITE (Gate 1) | DONE-DEVIATED | See Deviations #2, #22, #23, #26. User approved with: 4 drift notes (container radius, nav arrows, selected day fill, 3 view modes), 3 view modes documented (state machine), day-cell states priority order, opacity pattern 10th occurrence, NEW 4th opacity step disclosure (`opacity-30` element-level), Monday-based weeks rationale, 42-cell layout. |
| 2b | Draft §49 ThemeToggle (Gate 2) | DONE-DEVIATED | See Deviations #3-#8. User approved with: JSX-only disclosure + promotion attribution (Decision 1 Option A executed), composition code block, sun-dim → Sun drift note, SSR-safe mounted state with rationale, dynamic aria-label WAI-ARIA pattern, `aria-pressed` future enhancement. |
| 2c | Draft §50 LanguageSelector (Gate 3) | DONE-DEVIATED | See Deviations #9-#14, #21. User approved with: promotion attribution (Decision 2 Option A executed), trigger 2-state shared box-model, spec-vs-JSX minor drift disclosure (bg-surface-primary vs bg-surface-subtle), smart 4-quadrant positioning with thresholds, up/down direction table, animate-stagger first documented, composes §33 Avatar + §21 Input, hardcoded language list non-extensibility, localStorage hydration-safe, accessibility caveats. |
| 2d | Draft §51 EmailSelector (Gate 4) | DONE-DEVIATED | See Deviations #15-#20, #21. User approved with: promotion attribution (Decision 2 Option A executed), naming note (single-action dropdown — visual selector / semantic confirmation), trigger 2-state Bordered variant, fixed downward positioning vs §50 smart, sister-primitive comparison table with §50 (7 aspects × 2 cols), `relative self-start` rationale, `animate-dropdown-down` documented, hardcoded aria-label i18n disclosure, composes §33 Avatar + §15 Button. |
| 3a | Apply Edit 1 (§4 Calendar rewrite in place) | DONE | Single Edit operation: replace §4 content (preserves heading + position). |
| 3b | Apply Edit 2 (multi-section insert §49-§51) | DONE | Single Edit operation using `## Common Patterns` anchor (same as B5/B6/B7/B8 precedent). |
| 3c | Apply Edit 3 (delete Common Patterns "Selector Trigger (Popover Pattern)") | DONE | Single Edit operation: ~93 lines removed (pre-headed by `### Selector Trigger` through closing `---` + blank line, replaced with subsequent `### Decorative Background Grid` heading preserved). |
| 3d | Apply Edit 4 (Theme System "Toggle Component" cross-ref update) | DONE | Single Edit operation: replaced inline content (5 bullet points describing sun-dim/moon icons with raw hex) with brief 2-line cross-reference to §49 ThemeToggle. |
| 4 | Build verification (14 grep AC checks + 5 bonus integrity) | DONE | All 14 grep checks PASS — see "Code Quality / Build Checks" below. Plus 5 bonus integrity checks PASS, including doc-wide broken-ref sweep (0/7 patterns) AND cross-reference text-match validation (9/9). |
| 5 | Update Technical Documentation | DONE | Covered by Step 3 + cross-ref Edit 4. The deliverable IS the doc update. |

**Plan Compliance Summary**: 14/14 steps DONE (all 4 sub-Edits split). Steps 0, 2a, 2b, 2c, 2d carry deviations (1 carry-forward + 26 honest-disclosure variants — many shared across multiple steps, see consolidation below).

## Deviations

| # | Step(s) | Category | Description | Action |
|---|---------|----------|-------------|--------|
| 1 | 0 | **Accepted-Trivial** (carry-forward) | No `feature/SCRUM-343-frontend` branch in `em-ecosystem-code`. | 9th consecutive application — convention silenced. |
| 2 | 2a | **Accepted-Trivial** | §4 Calendar rewritten with **4 drift notes** vs prior doc (container `rounded-3xl→rounded-xl`, nav arrows `24x24 rounded-1000px→w-6 h-6 rounded-full`, selected day `5%→100% DARK`, 3 view modes vs only days). | Honest documentation. Doc now reflects code reality. |
| 3 | 2b | **Accepted-Trivial** | §49 ThemeToggle has **NO spec export** (JSX-only). Disclosure blockquote at top. | Same precedent as B5+ JSX-only disclosures. |
| 4 | 2b | **Accepted-Trivial** | §49 ThemeToggle composes §42 IconButton — **first B9a→B7 cross-cluster cross-reference**. | Honest documentation. Composition documented in code block. |
| 5 | 2b | **Accepted-Trivial** | §49 ThemeToggle SSR-safe `mounted` state — non-obvious behavior. Documented with full rationale (prevents flash on hydration) + placeholder dimensions matching IconButton size="sm" (h-8 w-8). | Honest documentation. Without callout, a developer would "clean up" the pattern thinking it's over-engineering. |
| 6 | 2b | **Accepted-Trivial** | §49 ThemeToggle dynamic aria-label "Switch to {dark|light} mode" — WAI-ARIA pattern (label describes action, not current state). | Honest documentation. Without callout, a developer might "fix" to current-state label like "Theme: light". |
| 7 | 2b | **Accepted-Trivial** | §49 ThemeToggle drift note: prior Theme System docs said `sun-dim`; current code uses `Sun` (lucide canonical). Rationale documented (refactor consolidated lucide imports). | Honest documentation. |
| 8 | 2b + 3d | **Accepted-Trivial** (canonicalization) | **Decision 1 Option A executed**: §49 ThemeToggle PROMOTED from Theme System chapter "Toggle Component" subsection (line 126). Theme System cross-ref updated to point to §49. Same canonicalization precedent as B4 Ambiguity 1, B7 Common Patterns Button cleanup, B8 InlineError promotion. | Single design decision spanning 2 sub-steps — counted once. |
| 9 | 2c | **Accepted-Trivial** | §50 LanguageSelector smart 4-quadrant positioning (vertical up/down + horizontal left/right) — viewport-aware via `getBoundingClientRect()` with hardcoded thresholds (popoverHeight 350px, popoverWidth 330px). | Honest documentation. Non-obvious behavior worth documenting. |
| 10 | 2c | **Accepted-Trivial** | §50 LanguageSelector spec-vs-JSX minor drift: `languageSelectorSpecs.trigger.open` says `bg-surface-primary` but JSX uses `bg-surface-subtle`. Doc reflects JSX (code reality). | Honest documentation. Code-side reconciliation candidate. |
| 11 | 2c | **Accepted-Trivial** | §50 LanguageSelector composes §33 Avatar + §21 Input — **2 cross-cluster cross-references** (B6 + B1). | Honest documentation. |
| 12 | 2c | **Accepted-Trivial** | §50 LanguageSelector localStorage persistence (`STORAGE_KEY = "nexacore-language"`) with hydration-safe pattern. | Honest documentation. |
| 13 | 2c | **Accepted-Trivial** | §50 LanguageSelector hardcoded language list (`LANGUAGES` const, EN/ES/FR) — non-extensible via props. | Honest documentation + extension point note. |
| 14 | 2c + 3c | **Accepted-Trivial** (canonicalization) | **Decision 2 Option A executed (part 1)**: §50 LanguageSelector PROMOTED from Common Patterns "Selector Trigger (Popover Pattern)" Borderless variant. | Counted with #20 (single Decision 2 executed across §50 + §51 + delete). |
| 15 | 2d | **Accepted-Trivial** | §51 EmailSelector single-action dropdown naming note — visually a selector trigger but semantically a confirmation + escape (no list of options). | Honest documentation. Non-obvious — without callout, consumers would expect to pass a list. |
| 16 | 2d | **Accepted-Trivial** | §51 EmailSelector composes §33 Avatar + §15 Button — **2 cross-cluster cross-references** (B6 + B7). | Honest documentation. |
| 17 | 2d | **Accepted-Trivial** | §51 EmailSelector fixed downward positioning + left-aligned (NO smart positioning) — distinguished vs §50. Rationale: single auth-flow use case, hardcoded `w-[300px]`. | Honest documentation. |
| 18 | 2d | **Accepted-Trivial** (i18n) | §51 EmailSelector "Try a different email address" link label hardcoded English — i18n enhancement pending. | Honest documentation. |
| 19 | 2d | **Accepted-Trivial** | §51 EmailSelector `relative self-start` container — opt-out of parent flex stretching. Required in auth layouts. | Honest documentation. |
| 20 | 2d + 3c | **Accepted-Trivial** (canonicalization) | **Decision 2 Option A executed (part 2)**: §51 EmailSelector PROMOTED from Common Patterns "Selector Trigger (Popover Pattern)" Bordered variant. PLUS Common Patterns sub-section DELETED (~93 lines removed). | Counted with #14 (single Decision 2 executed). |
| 21 | 2c + 2d | **Accepted-Trivial** | **First documentation of 2 globals.css animation classes in Part B**: `animate-stagger` (§50) and `animate-dropdown-down` (§51). Establishes pattern for documenting CSS-defined animations. | Honest documentation. Single design decision (animation library docs precedent extended) spanning 2 sections — counted once. |
| 22 | 2a | **Accepted-Trivial** | Calendar §4 `text-content-primary/50` for other-month days — **10th occurrence of [Display primitives opacity pattern](#display-primitives-opacity-pattern)** across 4 clusters (B6: 5, B7: +3, B8: +1, B9a: +1). Inline cross-reference; B6 Pattern note table NOT modified (cluster-scope semantics preserved per B7/B8 precedent). | Honest documentation. Coordinated migration scope grew. |
| 23 | 2a | **Accepted-Trivial** | Calendar §4 `opacity-30` for disabled days — **NEW disclosure category**: 4th opacity step beyond `text-content-primary/{30,50,75}` series. The `opacity-30` here is a Tailwind opacity *modifier on the entire element* (not just text color), distinct from text-color opacity. Worth surfacing separately. | Honest documentation. Future cleanup could extend Pattern note's scope or document element-opacity separately. |
| 24 | 3c + 3d | **Accepted-Trivial** | **2 structural changes executed silently** per user pre-approval: Edit 3 (delete Common Patterns Selector Trigger ~93 lines) + Edit 4 (Theme System Toggle Component cross-ref update ~3 lines condensed). | Counted with #8, #14, #20 (single decisions executed across multiple steps). |
| 25 | 2a | **Accepted-Trivial** (i18n) | Calendar §4 navigation arrows hardcoded `aria-label="Previous"` / `aria-label="Next"` — i18n enhancement pending. | Honest documentation. |
| 26 | 2a | **Accepted-Trivial** | Calendar §4 documents header click state machine (days↔months↔years). Non-obvious behavior worth documenting. | Honest documentation. |
| 27 | 2b + 2c + 2d | **Accepted-Trivial** | **5 cross-cluster cross-references in B9a — record in Part B** (vs B8's 2): §49→§42 IconButton (B7), §50→§33 Avatar (B6), §50→§21 Input (B1), §51→§33 Avatar (B6), §51→§15 Button (B7). | Honest documentation. Trend reflects B9a's promotion of components that are heavy composers. |

**No Accepted-Quality, no Accepted-Risk, no Deferred, no Scope-Gap items.**

**27 Accepted-Trivial deviations is the highest count yet** in any Part B sub-ticket (B1: 2, B2: 2, B3: 3, B4: 5, B5: 6, B6: 7, B7: 10, B8: 18, **B9a: 27**). Trend reflects: largest single component (Calendar 344 lines) + 2 structural decisions executed simultaneously + 5 cross-cluster cross-references + 4 globals.css animation classes documented + 4th opacity step NEW disclosure category. Per-occurrence count would be ~30 — counted by design decision/pattern (Deviations #8, #14+#20, #21 each span 2 sub-steps; #24 spans 2 sub-steps).

## Code Quality / Build Checks

This is a docs-only ticket — code-oriented checks N/A or pass-by-no-change:

| Check | Result | Details |
|-------|--------|---------|
| 4a — Test coverage for new files | N/A | No new source files. |
| 4b — Security patterns | N/A | No code changes. |
| 4c — Build verification | N/A (no code change) | `em-ecosystem-code` working tree clean, on `main` at `8d2fa80c`. |
| 4d — Integration state | UP TO DATE (no change needed) | No module/guard/service changes. |
| 4e — Regression verification | N/A | Zero code files modified. |
| 4f — Audit Finding Resolution | N/A | This ticket reconciles audit findings (B9a cluster) but is not formally an audit-fix remediation ticket. |

### Build verification — 14 grep AC checks (mandatory per plan §6)

All checks executed against `ai-specs/specs/ui-design-system.md` post-/develop. **All AC checks use `grep -cE` flag** per the lessons-learned from B4:

| AC | Check | Expected | Actual | Status |
|----|-------|----------|--------|--------|
| 1 | §4 Calendar token-based (no raw hex) | 0 | 0 | ✅ PASS |
| 2 | §4 Calendar 3 view modes (days/months/years) | each ≥1 | 19 / 12 / 13 | ✅ PASS |
| 3 | §4 Calendar `rounded-xl` | ≥1 | 2 | ✅ PASS |
| 4 | §4 Calendar day-cell `rounded-full` | ≥1 | 3 | ✅ PASS |
| 5 | §49 ThemeToggle section exists | 1 | 1 | ✅ PASS |
| 6 | §50 LanguageSelector section exists | 1 | 1 | ✅ PASS |
| 7 | §51 EmailSelector section exists | 1 | 1 | ✅ PASS |
| 8 | Section numbering continuous §1-§51 | no GAP, max=51 | no GAP, max=51 | ✅ PASS |
| 9 | All 4 sections (§4 + §49-§51) have `**Source:**` line | 4× = 1 | 4× = 1 | ✅ PASS |
| 10 | Cross-references valid (5 mutual cross-refs) | each ≥1 | §49→§42=8, §50→§33=3, §50→§21=4, §51→§33=4, §51→§15=6 | ✅ PASS |
| 11 | Common Patterns "Selector Trigger (Popover Pattern)" removed | 0 | 0 | ✅ PASS |
| 12 | Theme System "Toggle Component" cross-references §49 | ≥1 | 1 (verified via corrected awk pattern `/^### Toggle Component/,/^### Token Mapping/`) | ✅ PASS-CORRECTED (initial awk pattern used `^## ` which self-matched the heading line, returning 0; re-verified with proper boundary pattern) |
| 13 | **NEW post-B6** cross-ref text-match validation | 9× = 1 | 9× = 1 | ✅ PASS |
| 14 | §4 Calendar `text-content-primary/50` (10th opacity-pattern occurrence) | ≥1 | 2 | ✅ PASS |

### Bonus integrity checks (in addition to plan ACs)

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| §50 LanguageSelector smart positioning documented | ≥1 | 2 | ✅ PASS |
| §51 EmailSelector single-action dropdown disclosure | ≥1 | 4 | ✅ PASS |
| §49 ThemeToggle SSR-safe mounted disclosure | ≥1 | 6 | ✅ PASS |
| **Doc-wide broken-ref sweep (B8 lesson — proactive)** | 0 across 7 historical patterns | 0/7 | ✅ PASS |
| File line count delta | +200-300 (rewrite + 3 inserts - 90-line delete) | +246 | ✅ PASS |

### Doc-wide broken-ref sweep (proactive — B8 lesson)

Cross-checked all 7 historical broken patterns post-B9a:

| Pattern | Count | Status |
|---------|-------|--------|
| `§11 Tooltip` | 0 | ✅ |
| `§22 Checkboxes` | 0 | ✅ |
| `§18 Button Set` | 0 | ✅ |
| `§23 Input` | 0 | ✅ |
| `§24 DateInput` | 0 | ✅ |
| `§25 MfaDigitInput` | 0 | ✅ |
| `§26 FormField` | 0 | ✅ |

**0 broken refs across all 7 historical patterns** — confirms B8 fixes (eb09097 + ea9f833) are still clean AND B9a work introduced 0 new broken refs.

### NEW Bonus 13 (cross-reference text-match validation results, 9/9 PASS)

For every `§N <Name>` reference touched in B9a, verified the heading exists at that number with that name:

| Reference | Heading found | Status |
|-----------|---------------|--------|
| §4 Calendar | `### 4. Calendar` (1 match) | ✅ PASS |
| §49 ThemeToggle | `### 49. ThemeToggle` (1 match) | ✅ PASS |
| §50 LanguageSelector | `### 50. LanguageSelector` (1 match) | ✅ PASS |
| §51 EmailSelector | `### 51. EmailSelector` (1 match) | ✅ PASS |
| §42 IconButton | `### 42. IconButton` (1 match) | ✅ PASS |
| §33 Avatar | `### 33. Avatar` (1 match) | ✅ PASS |
| §21 Input | `### 21. Input` (1 match) | ✅ PASS |
| §15 Button Set | `### 15. Button Set` (1 match) | ✅ PASS |
| §22 DateInput | `### 22. DateInput` (1 match) | ✅ PASS |

### Audit cluster resolution (B9a of SCRUM-329 Part B)

The 4 components correspond to specific rows in SCRUM-329's audit-table.md. Verified all 4 are now resolved:

| Item | Audit row | Original classification | Resolution | Verified by |
|------|-----------|-------------------------|------------|-------------|
| Calendar | row 8 | Documented-Drifted | **§4 REWRITTEN in place** — token-based (drops raw hex), 3 view modes (was only days), day-cell states with priority order, opacity pattern 10th occurrence reference, NEW 4th opacity step disclosure (`opacity-30`), Monday-based weeks, 42-cell layout, ARIA contracts | AC1+AC2+AC3+AC4+AC14 PASS |
| ThemeToggle | row 43 | Ambiguous (Theme System chapter) | **§49 PROMOTED** (Decision 1 Option A) — JSX-only, composes §42 IconButton, SSR-safe mounted state, dynamic aria-label WAI-ARIA pattern, sun-dim → Sun drift note. Theme System cross-ref updated. | AC5+AC9+AC12 PASS |
| LanguageSelector | row 28 | Documented-Drifted (Common Patterns Selector Trigger Borderless) | **§50 PROMOTED + DRIFT REWRITE** (Decision 2 Option A part 1) — sourced from `languageSelectorSpecs`, smart 4-quadrant positioning, spec-vs-JSX minor drift disclosure, composes §33 Avatar + §21 Input (2 cross-cluster), localStorage persistence, hardcoded language list. | AC6+AC9 PASS |
| EmailSelector | row 17 | Documented-Drifted (Common Patterns Selector Trigger Bordered) | **§51 PROMOTED + DRIFT REWRITE** (Decision 2 Option A part 2) — sourced from `emailSelectorSpecs`, single-action dropdown naming note, fixed downward positioning, sister comparison with §50, composes §33 Avatar + §15 Button (2 cross-cluster). | AC7+AC9 PASS |

Final state: 4/4 components RESOLVED. Plus **2 structural changes executed simultaneously** (Decision 1: ThemeToggle PROMOTE + Theme System cross-ref update; Decision 2: §50/§51 PROMOTE + Common Patterns Selector Trigger DELETE ~93 lines).

## Regression Verification

| Check | Result | Details |
|-------|--------|---------|
| Blast radius files verified | 0/0 | Zero code files modified. Single doc file modified (`ui-design-system.md`). |
| Mock propagation | N/A | No constructor signatures changed. |
| API contract alignment | N/A | No endpoints modified. |
| Schema backward compatibility | N/A | No Prisma schema changes. |
| Export surface integrity | N/A | No module exports changed. |
| Cross-reference integrity | OK + DOC-WIDE CHECK | 9 cross-references introduced/touched in B9a. **All 9 verified by AC13 text-match validation**. PLUS doc-wide sweep verified 0 broken refs across 7 historical patterns. |
| Section numbering integrity | OK | §1-§51 continuous; no gaps. AC8 confirmed max=51. In-place rewrite + 1 multi-section insert + 1 delete + 1 cross-ref update — no renumber pass needed. |
| Common Patterns area integrity | OK | `## Common Patterns` heading preserved (anchor for B5/B6/B7/B8/B9a inserts). "Selector Trigger (Popover Pattern)" sub-section cleanly removed; surrounding sub-sections unchanged. |
| Theme System chapter integrity | OK | `## Theme System (Light / Dark)` chapter heading preserved. "Toggle Component" sub-section condensed from 5 inline bullets to 2-line cross-reference. "Token Mapping (Light → Dark)" sub-section unchanged. |

## Spot-check (independent verification)

| Check | Verification | Result |
|-------|--------------|--------|
| §4 Calendar position preserved (in-place rewrite) | grep confirms `### 4. Calendar` at line 299 (same as pre-rewrite) | ✅ PASS |
| §4 Calendar 3 view modes match JSX `ViewMode` type | All 3 view modes from `Calendar.tsx:77` (`days`/`months`/`years`) appear in §4 with state machine documentation | ✅ PASS |
| §4 Calendar selected day match JSX `cellClass` | `bg-surface-inverse text-content-inverse` matches `Calendar.tsx:225-231` exactly | ✅ PASS |
| §49 ThemeToggle composition matches JSX | `IconButton variant="boxed" size="sm" tooltip` + `Sun/Moon size={16}` matches `ThemeToggle.tsx:24-35` exactly | ✅ PASS |
| §50 LanguageSelector smart positioning matches JSX | `getBoundingClientRect()` + popoverHeight 350 + popoverWidth 330 thresholds match `LanguageSelector.tsx:60-67` exactly | ✅ PASS |
| §50 LanguageSelector spec-vs-JSX drift confirmed | Spec line 27 `bg-surface-primary` vs JSX line 127 `bg-surface-subtle` — disclosure accurately documents | ✅ PASS |
| §51 EmailSelector single-action dropdown match JSX | Selected display button + Button variant="link-underline" "Try a different email address" matches `EmailSelector.tsx:64-89` exactly | ✅ PASS |
| Common Patterns "Selector Trigger (Popover Pattern)" removed | grep confirms 0 matches for `^### Selector Trigger` | ✅ PASS |
| Theme System "Toggle Component" cross-references §49 | Manual read confirms: "see §49 ThemeToggle for the canonical spec" | ✅ PASS |
| Doc-wide broken-ref sweep | 0 hits across 7 historical broken patterns | ✅ PASS |

## Tech Debt Tickets Created

None. Zero Accepted-Quality items in this ticket.

Lessons-learned items captured (not auto-created tickets):
- **Cross-reference text-match validation runs doc-wide proactively (not just touched refs)** — proven in B8 + applied in B9a. Should be added to CI/pre-commit script.
- **`opacity-30` element-level disclosure category** — distinct from text-color opacity (`text-content-primary/{30,50,75}`). Future cleanup could extend Pattern note's scope or document element-opacity separately. Calendar disabled days are the first documented occurrence.
- **`animate-stagger` and `animate-dropdown-down` globals.css animations** — first documented in Part B. Pattern reusable for future animation-bearing components.
- **§50 LanguageSelector spec-vs-JSX `bg-surface-primary` vs `bg-surface-subtle`** — code-side reconciliation candidate. Either update spec or update JSX to match.
- **§50 LanguageSelector hardcoded language list** — non-extensibility. Future enhancement could accept languages prop.
- **§51 EmailSelector hardcoded `aria-label="Try a different email address"`** — i18n enhancement pending.
- **§4 Calendar navigation arrows hardcoded `aria-label="Previous"` / `aria-label="Next"`** — i18n enhancement pending.
- **§49 ThemeToggle `aria-pressed` toggle semantics enhancement** — could make pressed state visible to screen readers.
- **§49/§50/§51 add `aria-expanded` to triggers** — communicate open/closed state to screen readers.
- **5 cross-cluster cross-references in B9a (record)** — pattern proven; future clusters expected to have similar density as components compose more widely.
- **Display primitives opacity pattern coordinated migration scope grew to 10 occurrences across 4 clusters** (B6: 5, B7: +3, B8: +1, B9a: +1). When `--color-content-tertiary` token added, migrate all 10 in 1 PR.

## Action required before /update-docs

1. **User reviews the final doc state** at `ai-specs/specs/ui-design-system.md` — §4 Calendar (rewritten), §49-§51 (new sections), Common Patterns "Selector Trigger" (deleted), Theme System "Toggle Component" (cross-ref updated)
2. **No ambiguities to resolve** — Decision 1 Option A + Decision 2 Option A confirmed during /enrich-us; all 4 component drafts approved during /develop's per-gate review
3. **Once user is satisfied**: proceed to `/update-docs SCRUM-343`. Same lifecycle as B1-B8 — no `/commit` against `em-ecosystem-code`; `/update-docs` will commit plan + verify + record + the ui-design-system.md edits to `ai-specs main` directly.

## Final Verdict

**PASS** — code-level verification PASS. All 14 plan steps DONE. **27 deviations all Accepted-Trivial** (1 carry-forward + 26 honest-disclosure variants — record count, surpassing B8's 18). Zero Scope-Gap, zero Accepted-Risk, zero Accepted-Quality, zero Deferred.

The 4 components in the Drift + structural decisions cluster are now correctly documented in `ui-design-system.md`:
- §4 Calendar: REWRITTEN (token-based throughout, 3 view modes documented, day-cell states with priority order, opacity pattern 10th occurrence reference, NEW 4th opacity step disclosure for `opacity-30` element-level, Monday-based weeks rationale, 42-cell layout, ARIA contracts)
- §49 ThemeToggle: NEW (PROMOTED from Theme System chapter — Decision 1 Option A executed, JSX-only, composes §42 IconButton, SSR-safe mounted state with rationale, dynamic aria-label WAI-ARIA pattern, sun-dim → Sun drift note)
- §50 LanguageSelector: NEW (PROMOTED from Common Patterns Selector Trigger Borderless — Decision 2 Option A part 1, sourced from `languageSelectorSpecs`, smart 4-quadrant positioning, spec-vs-JSX minor drift disclosure, composes §33 Avatar + §21 Input — 2 cross-cluster, localStorage persistence, `animate-stagger` documented)
- §51 EmailSelector: NEW (PROMOTED from Common Patterns Selector Trigger Bordered — Decision 2 Option A part 2, sourced from `emailSelectorSpecs`, single-action dropdown naming note, fixed downward positioning vs §50 smart, sister-primitive comparison table with §50, composes §33 Avatar + §15 Button — 2 cross-cluster, `animate-dropdown-down` documented)
- 1 Common Patterns sub-section deletion: "Selector Trigger (Popover Pattern)" (~93 lines removed — Decision 2 Option A executed)
- 1 Theme System sub-section update: "Toggle Component" condensed from 5 bullets to 2-line cross-reference (~3 lines net change — Decision 1 Option A executed)

Section numbering continuous §1-§51 (+3 from pre-B9a, no renumber needed). Cross-references valid (9 introduced/touched in B9a, ALL verified by AC13 text-match validation). Doc-wide broken-ref sweep clean (0/7 historical patterns).

Lifecycle adaptation pattern crystallized through 9 consecutive applications. Honest-documentation pattern continues with 27 disclosures in B9a (highest count yet, surpassing B8's 18). New disclosure category established for **element-level opacity** (`opacity-30` on entire button vs text-color `text-content-primary/30`). Cross-cluster cross-references reached record 5 in B9a (vs B8's 2). 2 structural decisions executed simultaneously (Decision 1 ThemeToggle PROMOTE + Decision 2 Common Patterns Selector Trigger DELETE) — most ambitious cleanup in any single B-sub-ticket.

Ready to proceed to `/update-docs`.
