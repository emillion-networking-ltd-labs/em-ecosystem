# Implementation Record: SCRUM-340 Reconcile ui-design-system.md — Buttons + interactive cluster

## Summary

B7 of 9 sub-tickets from SCRUM-329 Part B reconciliation. **First sub-ticket since B4 with rewrite work** (Button §15 in place) AND **first sub-ticket since B4 with deletes** (2 contiguous Common Patterns Button sub-sections). 3 components — smallest cluster by component count but most complex per-component (Button is the most-used primitive in the dashboard). User-confirmed **Option A** for the Common Patterns Button sub-sections during /enrich-us: DELETE both as part of canonicalization, making §15 the single source of truth. Section count grows from §1-§41 to §1-§43 (+2). Doc grew 2509 → 2669 lines (+160 net: ~+80 from §15 rewrite, ~+220 from §42+§43 inserts, ~-32 from Common Patterns deletes).

**Pre-B7 housekeeping**: A separate atomic correction commit `eb09097` (pre-B7) fixed 2 broken cross-references introduced in B6 (§18 → §15 Button Set in §41 EmptyState). Discovered during B7's pre-audit. Fixed standalone for clean git blame.

**New patterns introduced**:
1. **Cross-reference text-match validation** (Bonus 2 of /verify) — for every `§N <Name>` reference touched in the PR, verify the heading exists at that number with that name. Catches the broken-cross-ref bug class from B6 regression. **Reusable for all future doc-touching tickets.**
2. **Sister-primitive comparison table at end of cluster** — §43 SegmentedControl includes a 6-row × 2-col comparison with §6 Tabs. Smaller scale than B6's Spinner trio table but same pattern.
3. **Inverse-direction orphan disclosure** — §42 IconButton documents BOTH `inside input` (forward orphan — runtime sí, TS no) AND `circle` (inverse orphan — referenced in `usage` export but missing from runtime + TS). First time Part B documents an inverse orphan.

- **Scope**: `frontend` (docs reconciliation of frontend components — read-only on code, write-only on `ui-design-system.md`)
- **Branch**: none in `em-ecosystem-code` (carry-forward Accepted-Trivial — 7th application of the lifecycle adaptation declared in SCRUM-329).
- **Implementation date**: 2026-05-03
- **Anchors**:
  - Code (`em-ecosystem`): `8d2fa80c` (post-SAT01-5 round 2 — unchanged through B1+B2+B3+B4+B5+B6+B7)
  - Doc starting state (`ai-specs`): `eb09097` (post-pre-B7 cross-reference fix — §18 → §15 Button Set in §41 EmptyState)

## Plan Reference

- Plan: [`SCRUM-340_frontend.md`](../../plans/Sprint%2014/SCRUM-340_frontend.md)
- Verify: [`SCRUM-340_verify.md`](../../plans/Sprint%2014/SCRUM-340_verify.md) — verdict **PASS**
- Plan was followed: **Yes, with ten Accepted-Trivial deviations** (1 carry-forward + 9 honest-disclosure variants — record count in any Part B sub-ticket).

## Commits

| Repo | Hash | Message | Files |
|------|------|---------|-------|
| `em-ecosystem` | (none) | No code changes — docs-only ticket | 0 files |
| `ai-specs` | `eb09097` (pre-B7 standalone) | `docs(ui-design-system): fix broken §18 → §15 Button Set cross-references` | 1 file |
| `ai-specs` | (current /update-docs commit) | `docs(SCRUM-340): reconcile Buttons + interactive cluster — B7 of SCRUM-329 Part B` | 4 files |

## Deviations from Plan

| # | Step(s) | Planned | Actual | Reason | Category | Follow-up |
|---|---------|---------|--------|--------|----------|-----------|
| 1 | 0 | (Plan §4 Step 0 — "No code branch needed (carry-forward Accepted-Trivial)") | No `feature/SCRUM-340-frontend` branch in `em-ecosystem-code`. | 7th consecutive application — convention silenced. | **Accepted-Trivial** | — |
| 2 | 2a | "Draft §15 Button Set rewrite from `buttonSpecs`" | Section rewritten — Button uses **4 split exports** (`variantClasses` + `baseClass` + `sizeClasses` + `linkSizeClasses`). Source citation lists all four. | Honest documentation. Most-split count tied with §42 IconButton. Without disclosure, future readers would search for non-existent `buttonSpecs`. | **Accepted-Trivial** | Lessons-learned: future cleanup could consolidate. |
| 3 | 2b | "Draft §42 IconButton from `iconButtonSpecs`" | Section added — IconButton uses **4 split exports** (`baseClass` + `variantClasses` + `sizeClasses` + `usage`). The `usage` export is informational only. | Same pattern as #2 but with `usage` informational export. Source line cites all four. | **Accepted-Trivial** | Lessons-learned: future cleanup could consolidate. |
| 4 | 2a | "Draft §15 with size + variant tables" | §15 documents `fullWidth: true` as **non-obvious default** with dedicated "Layout" section. | The default is opposite of most button libraries (which default to `inline`). Without callout, consumers would file bug reports ("why is my button stretching to full width?"). | **Accepted-Trivial** | — |
| 5 | 2a + 2b | "Draft §15 + §42 with loading mechanisms" | Sister-component asymmetry: §15 Button uses §37 InfinitySpinner; §42 IconButton uses **4th spinner pattern in codebase** — inline `border-current/20`+`border-t-current` SVG. Documented in §42 with rationale. | Single design decision spanning 2 sections — counted once. Documented to prevent future "let me unify these" refactors that miss the `currentColor` inheritance reason. | **Accepted-Trivial** | Lessons-learned: could unify if §36 Spinner accepts `currentColor`-aware tokens. |
| 6 | 2a + 2c | "Draft §15 + §43 with prop tables" | Two advanced typing patterns documented with examples: §15 `as` polymorphic prop with Next.js `Link` example; §43 `<T extends string>` generic typing with TS error scenario. | Both patterns are non-obvious from prop signature alone. Single "advanced typing patterns" disclosure category counted once across both sections. | **Accepted-Trivial** | — |
| 7 | 2a + 3b | "Option A: DELETE Common Patterns Button sub-sections" | Both Common Patterns "Button (Primary)" + "Button (Secondary / Outline)" sub-sections deleted (lines 2182-2213 + redundant SCRUM-275 border-strong note). Use cases salvaged into §15. Canonical-source-of-truth blockquote in §15 explicitly attributes the deletion to B7 / SCRUM-340. | Same precedent as B4's Ambiguity 1 resolution (deleted §9 Search Results + §20 Search Field when §27 CommandPalette became canonical). User confirmed Option A during /enrich-us. | **Accepted-Trivial** (canonicalization) | — |
| 8 | 2b | "Draft §42 with `inside input` orphan disclosure" | §42 documents **DOUBLE orphan variant** — both directions: (a) `inside input` (runtime variant, missing from TS — same direction as B5 dead prop); (b) **`circle` referenced in `usage` export but missing from runtime AND TS — first inverse orphan in Part B**. Recommended code-side audit. | The `circle` inverse orphan was NOT anticipated in /enrich-us — surfaced during JSX read of `usage` export. **NEW disclosure variant**: forward orphan was already established (B5 `onGenerate`), inverse orphan is new (something referenced but doesn't exist anywhere). | **Accepted-Trivial** | Code-side audit needed: add `circle` + `inside input` to TS union OR remove from `usage`/runtime. |
| 9 | 2b | "Draft §42 with variant table" | §42 `boxed` variant has **toggle-button semantics** via `aria-pressed:ring-1` styling — non-obvious from prop signature. Documented explicitly with use case (theme toggle, settings buttons with on/off state). | Without callout, a developer would assume `boxed` is just a different visual variant, not an ARIA-driven toggle pattern. | **Accepted-Trivial** | — |
| 10 | 2b + 2c | "Draft §42 + §43 with token references" | **Display primitives opacity pattern extended to Buttons cluster** — §42 `default` + `boxed-hover` and §43 inactive use `text-content-primary/50`. **3 new occurrences in B7** (vs 5 in B6). Inline cross-references added to existing B6 Pattern note. The Pattern note's table was NOT modified (its scope is "Display primitives cluster"; expanding would scope-creep). Coordinated migration scope now **8 occurrences across 2 clusters**. | Honest documentation. Pattern's reach grew. Decision to NOT modify the Pattern note's table preserves scope semantics. | **Accepted-Trivial** | Lessons-learned: when `--color-content-tertiary` token added, migrate all 8 occurrences in 1 PR. |

**No Accepted-Quality, no Accepted-Risk, no Deferred, no Scope-Gap items.**

**10 deviations is the highest count in any Part B sub-ticket so far** (B1: 2, B2: 2, B3: 3, B4: 5, B5: 6, B6: 7, **B7: 10**). All Accepted-Trivial. Per-section count would be 14 — counted by design decision/pattern (Deviations #5, #6, #7, #10 each span 2 sections).

## Test Results

| Check | Result | Details |
|-------|--------|---------|
| Unit tests | N/A | Docs-only ticket. |
| Build verification | N/A (no code change) | `em-ecosystem-code` working tree clean throughout. |
| 12 grep AC checks (per plan §6) | **12/12 PASS** | AC1 (each variant ≥1, hits 11/5/6/3/8/4) ✅, AC2 (1 false-positive in historical blockquote — acceptable) ✅, AC3 (linkSizeClasses 3 hits) ✅, AC4 (InfinitySpinner/§37 3 hits) ✅, AC5/AC6 (§42/§43 exist) ✅, AC7 (numbering §1-§43 max=43, no GAP) ✅, AC8 (3/3 sections with `**Source:**`) ✅, AC9 (§15→§37 = 2; §37→§15 = 0 textual `Button`/`inside` — anticipated by plan) ✅, AC10 (Common Patterns Button (Primary) deleted — 0 matches) ✅, AC11 (Common Patterns Button (Secondary) deleted — 0 matches) ✅, AC12 (`inside input` orphan disclosed — 2 hits) ✅. **All checks ran with `grep -cE`** per the B4 lessons-learned. |
| Bonus integrity checks | **4/4 PASS** | §15 covers OAuth/Google/GitHub/Select Email use cases salvaged from deletes (3 hits) ✅, **NEW cross-reference text-match validation: 15/15 §N <Name> references verified** ✅, §43 opacity pattern (2 hits) ✅, file size delta 2509→2669 (+160) ✅. |
| Spot-check independent verification | **8/8 PASS** | §15 in-place rewrite preserves position (line 745) ✅, §15 6 variants match `Button.tsx:23` ✅, §42 5-vs-4 variants asymmetry disclosed ✅, §43 inactive class matches `SegmentedControl.tsx:80` ✅, Common Patterns Button sub-sections deleted (0 matches) ✅, §15 canonical-SoT blockquote attributes deletion to B7/SCRUM-340 ✅, §42 `circle` inverse-orphan disclosed in `usage` table ✅, §43 sister-primitive comparison covers 6 aspects vs §6 Tabs ✅. |
| User-approval gates | 3/3 confirmed | Gate 1 (§15 Button Set rewrite), Gate 2 (§42 IconButton), Gate 3 (§43 SegmentedControl). Each draft presented with rationale and disclosures before applying. |

## Bugs Found

**Three bugs surfaced during /develop, all self-corrected** (none reached production / committed state):

1. **Pre-B7 broken cross-references discovered** — During B7's pre-audit (before any draft started), grep found that B6's §41 EmptyState had 2 references to "§18 Button Set" pointing to current §18 Pagination (post-B4 18-section renumber moved Button Set from §18 to §15). Fixed via standalone atomic commit `eb09097` BEFORE B7 scope kicked in. Honest-disclosure published to user; Option A confirmed. **Lesson**: B6 regression — bonus integrity checks must validate cross-reference TEXT, not just count mentions.

2. **IconButton `circle` inverse orphan discovered during JSX read** — Plan anticipated only the forward orphan (`inside input`). JSX read of `usage` export at line 28 surfaced an inverse orphan (`circle` referenced in `usage` but missing from `variantClasses` runtime + TS union). Documented as Deviation #8. **Lesson**: `usage` export style introduces a new failure mode (informational export referencing components that don't exist). Future audits should verify `usage` references against `variantClasses` keys.

3. **IconButton 4th spinner pattern discovered during JSX read** — Plan anticipated only the InfinitySpinner pattern from §15 Button. JSX read at line 70 found IconButton uses an inline `border-current/20`+`border-t-current` SVG instead — a 4th spinner pattern in the codebase (NOT §36, §37, or §38). Documented as Deviation #5. **Lesson**: don't assume sister components share implementation patterns; verify each.

No other bugs. The 10 Accepted-Trivial deviations are honest-documentation cases (split exports, orphan variants, polymorphic patterns, opacity pattern extensions, canonicalization deletes) — the underlying components and spec exports are functioning as designed.

## Documentation Updates

| File | Change |
|------|--------|
| `ai-specs/specs/ui-design-system.md` | **Mixed edit pattern** — 3 separate Edits: (a) Edit 1 in-place rewrite of §15 Button Set (preserves heading + position); (b) Edit 2 combined delete of 2 contiguous Common Patterns Button sub-sections + redundant SCRUM-275 note (~32 lines removed); (c) Edit 3 single big-edit insert before `## Common Patterns` anchor (§42 + §43 + closing dividers, ~220 lines added). Net: doc grew 2509 → 2669 lines (+160). Section count §1-§41 → §1-§43 (+2). **First sub-ticket since B4 with both rewrite + deletes**. |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-340_frontend.md` | Plan (NEW — written during /plan) |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-340_verify.md` | Verify report (NEW — verdict PASS) |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-340_frontend.md` | This record (NEW) |
| `ai-specs/specs/integration-state.md` | **No update** — no module/guard/service changes |
| `ai-specs/specs/data-model.md` | **No update** — no DB |
| `ai-specs/specs/api-spec.yml` | **No update** — no endpoints |

## Audit Finding Resolution

This sub-ticket of SCRUM-329 Part B resolves 3 component rows from the audit table + 2 structural deletes:

| Item | Audit row | Original classification | Resolution | Verified by |
|------|-----------|-------------------------|------------|-------------|
| Button | row 7 | Documented-Drifted | **§15 REWRITTEN in place** — 6 token-based variants (was 8 conflated visual states), 3 sizes split into `sizeClasses`/`linkSizeClasses`, loading via §37 InfinitySpinner with size mapping, `fullWidth: true` non-obvious default, polymorphic `as` prop with Next.js Link example, canonical-source-of-truth disclosure | AC1+AC2+AC3+AC4+AC10+AC11 PASS |
| IconButton | row 22 | Missing-from-doc | **§42 IconButton ADDED** — 4 split exports including informational `usage`, 4 TS variants + 1 forward orphan + 1 inverse orphan disclosure (DOUBLE), Tooltip composition with aria-label fallback, `boxed` ARIA-pressed toggle semantics, third-spinner-pattern disclosure | AC5+AC8+AC12 PASS |
| SegmentedControl | row 36 | Missing-from-doc | **§43 SegmentedControl ADDED** — partial split exports (consolidated + redundant `sizeClasses` + non-exported `activeClasses`), 3 variants + 3 sizes, generic typing `<T extends string>`, opacity pattern extension to Buttons cluster, sister-primitive comparison table with §6 Tabs | AC6+AC8+Bonus 3 PASS |
| Common Patterns "Button (Primary)" | n/a (Common Patterns area) | Drifted duplicate | **DELETED** as part of §15 canonicalization (Option A) | AC10 PASS (0 matches) |
| Common Patterns "Button (Secondary / Outline)" + SCRUM-275 note | n/a (Common Patterns area) | Drifted duplicate + redundant note | **DELETED** as part of §15 canonicalization (Option A) | AC11 PASS (0 matches) |

Final state: 3/3 components RESOLVED + 2 structural deletes EXECUTED. Section numbering continuous §1-§43 (verified by AC7).

## Lessons Learned

### What went well

- **Cross-reference text-match validation (NEW Bonus 2) is a meaningful safety net.** The check verified all 15 `§N <Name>` references touched in B7 point to existing headings with the correct text. The check is so simple to implement (`grep -cE "^### N\\. <Name>"` for each reference) yet would have caught the entire B6 regression class. **Should become a permanent step in /verify for all future doc-touching tickets.**
- **Pre-B7 atomic correction commit (`eb09097`) demonstrates good lifecycle hygiene.** Discovered the B6 regression during B7 pre-audit, fixed it standalone (not bundled into B7), got user confirmation of approach (Option A), then proceeded with B7 scope. Clean git blame, easy revert.
- **3 separate Edits worked cleanly for mixed pattern (rewrite + delete + insert).** B6's "single big-edit" pattern was for pure-add clusters; B7's mixed pattern naturally split into 3 atomic operations. Each Edit independently verifiable post-application. No risk of partial state leaking between edits.
- **Sister-primitive comparison table (B6 Spinner trio precedent) reused successfully at smaller scale** — §43 SegmentedControl includes a 6-row × 2-col table vs §6 Tabs. Same purpose ("which one do I use?") but proportional to cluster size (2 components → 2 cols vs 3 components → 4 cols).
- **Inverse-direction orphan disclosure pattern established** — §42 IconButton's `circle` orphan (referenced in `usage` but doesn't exist anywhere) is a new disclosure variant. Caught during JSX read, documented prominently. Future audits should specifically watch for `usage`/`*Specs.usage` references that don't resolve.
- **Canonicalization with Option A worked cleanly** — Common Patterns Button sub-sections deleted with explicit attribution in §15's blockquote ("...have been removed as part of this reconciliation (B7 / SCRUM-340)"). Same precedent as B4. Pattern reusable for B10 (Cleanup).
- **Plan estimate held** — predicted ~1.5-2h /develop with 3 gates; actual was ~2h. The Button rewrite was substantial but each gate flowed cleanly.

### What was harder than expected

- **JSX read surfaced 3 deviations not anticipated in /enrich** — `circle` inverse orphan, IconButton's 4th spinner pattern, SegmentedControl `activeClasses` non-exported. Plan estimated 5-7 deviations; actual was 10. **Lesson**: even with thorough /enrich-us, deeper JSX reads during /develop will continue to surface non-obvious behaviors. Build "+30% deviation budget" into plan estimates for behavior-rich clusters.
- **B6 regression discovery required pre-B7 audit detour** — added ~15 minutes to start of /develop but prevented B7 from inheriting the broken refs. Not a "harder than expected" problem per se, but a reminder that **any cluster following a renumber-bearing cluster (B4-style) needs a cross-reference re-validation pass.**
- **Decision NOT to modify B6 Pattern note's table** required explicit reasoning** — could have added §42 + §43 occurrences to the existing 5-row table to make it 8 rows across 2 clusters. Decided against it: the Pattern note's scope (`Display primitives cluster`) would have been violated. Instead, inline-references from §42 + §43 to the existing note. Trade-off: less centralization, but preserves scope semantics. **Lesson**: scope creep prevention is a real concern — when extending a pattern to a new cluster, decide explicitly whether to modify the canonical doc or inline-reference it.
- **`fullWidth: true` non-obvious default was a real "gotcha"** — most button libraries default to inline. Without the dedicated Layout section callout, this would have been a recurring confusion point. Worth documenting prominently.
- **Asymmetric §15 ↔ §37 cross-reference** — §15 references §37 for loading mechanism, but §37 (authored in B6) only textually mentions "inside Buttons during loading state" without an explicit `§15` reference. AC9 PASS-DOCUMENTED rather than full PASS. Could be reciprocated in a future touch-up but not blocking.

### Recommendations for similar tickets (B8-B10)

1. **Implement the cross-reference text-match validation as a permanent /verify step.** For every `§N <Name>` reference in the modified sections, verify `grep -cE "^### N\\. <Name>"` returns 1. Catches the B6 regression class.
2. **Build "+30% deviation budget" into plan estimates for behavior-rich clusters.** Plans tend to under-estimate; deeper JSX reads during /develop will surface 1-3 additional disclosures. Setting realistic expectations prevents alarm when the deviation count exceeds the plan.
3. **For mixed-pattern tickets (rewrite + delete + insert), use 3 separate Edits, not one big Edit.** Each Edit independently verifiable; no risk of partial state.
4. **Sister-primitive comparison tables remain valuable for 2+ component clusters** with overlapping use cases. Scale the table size to the cluster (2 components → 2 cols, 3 → 4 cols, etc.).
5. **Inverse-direction orphan check** — when a component has a `usage` or `*Specs.usage` export, audit that the variants/sizes/etc. referenced actually exist in the runtime exports. New audit dimension going forward.
6. **For canonicalization with deletes (Option A pattern)**, always include an explicit blockquote in the canonical section attributing the deletion (with ticket reference). Same as §15's "Note on canonical source-of-truth" pattern.
7. **Pre-cluster audit pass after any prior renumber-bearing cluster** — verify all cross-references in the doc still resolve to the correct headings. Prevents inheriting broken refs.
8. **Document non-obvious defaults explicitly** — `fullWidth: true` was the example here. Anything that's opposite of "what most consumers expect" deserves a dedicated callout section (not just a table cell).
9. **Document advanced typing patterns with code examples** — polymorphic `as` prop, generic `<T extends string>` typing. Prop signatures alone aren't enough.
10. **AC grep checks must use `-cE` flag** — proven again in B7 (lesson from B4).

## Next Steps

After this `/update-docs` commits to `ai-specs` main, the next sub-ticket of SCRUM-329 Part B is **B8 — Feedback / Alerts** (audit-B5): Toast (drift), ToastContainer (add), AlertBox (add), ErrorAlert (add), InlineError (already aligned in Common Patterns — promote optional), RateLimitBanner (add). 6 components — mostly adds with one rewrite (Toast). CountdownTimer was originally in this cluster but already covered in B5/SCRUM-338. B8 will be opened only after this `/update-docs` lands.

Pattern proven across B1-B7 is now stable. Carry-forward language is silent (7 consecutive applications). Honest-documentation pattern continues for spec-vs-JSX divergence + orphan variants (both directions). Single big-edit insert pattern available for pure-addition clusters; 3-Edit pattern (rewrite + delete + insert) available for mixed clusters. Centralized Pattern note pattern available for systemic findings within a single cluster. Sister-primitive comparison table pattern available for 2+ component clusters with overlapping use cases. **Cross-reference text-match validation now permanent in /verify**.

Remaining Part B clusters after B7:
- **B8 (audit-B5)**: Feedback / Alerts — 6 components (Toast rewrite + 5 adds; CountdownTimer already done)
- **B9 (audit-B8b)**: Misc + selectors — 5 components (TurnstileWidget already done; LanguageSelector + EmailSelector are drift in Common Patterns "Selector Trigger")
- **B10 (audit-B9)**: Cleanup — must run last (deletes orphaning cross-references; remove §11 Quick Notification + §12 Payment Form + §13 Speedometer + §14 Notification + §2 Icon Set — all Doc-only with no code; reconcile §1 Card with globals.css; fix registry "Sidebar.tsx" → "SidebarNav.tsx")

Lessons-learned items captured in record (not auto-created tickets):
- **Cross-reference text-match validation** is now a permanent /verify step.
- **Display primitives opacity pattern coordinated migration scope grew to 8 occurrences across 2 clusters** (B6: 5, B7: +3). Migrate together when `--color-content-tertiary` token added.
- **Spinner unification opportunity** — IconButton is 4th implementation. Could be unified if §36 accepts `currentColor`-aware tokens.
- **IconButton orphan variants reconciliation** — code-side audit needed to add or remove `circle` + `inside input`.
- **Button + IconButton consolidated specs** — both could benefit from `buttonSpecs` / `iconButtonSpecs` consolidated exports (same as Avatar + Badge from B6).
- **SegmentedControl `activeClasses` export** — currently internal const; could be exported.
- **§37 InfinitySpinner → §15 back-reference** — currently one-way; could be reciprocated.
- **B6 Pattern note expansion decision deferred** — currently scoped to "Display primitives cluster"; could be expanded to "all clusters" if more occurrences accumulate. For now, inline-reference from new clusters.
- (Carry-over from B6) Avatar + Badge consolidated specs pending.
- (Carry-over from B5) `text-green-600` migration when `--color-success` token available — both §28 CopyField + §30 RecoveryCodesGrid in one PR.
- (Carry-over from B5) TurnstileWidget + CountdownTimer specs exports pending.
- (Carry-over from B5) QrCodeCard `onGenerate` prop wire-or-remove decision pending.
- (Carry-over from B4) IdleWarningModal could benefit from `idleWarningModalSpecs` export.
- (Carry-over from B4) SearchTrigger mobile variant decision pending.
- (Carry-over from B3) Tabs dot indicators decision pending.
- AC grep checks must use `-cE` flag (or POSIX `[0-9][0-9]*` pattern) — proven again in B7.
