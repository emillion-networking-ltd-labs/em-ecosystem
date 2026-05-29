# Implementation Record: SCRUM-339 Reconcile ui-design-system.md — Display primitives cluster

## Summary

B6 of 9 sub-tickets from SCRUM-329 Part B reconciliation — and the largest cluster by gate count (9 user-approval gates). Reconciled 9 components (Avatar, Badge, IconBadge, Spinner, InfinitySpinner, RingSpinner, Divider, Accordion, EmptyState) as pure additions: no rewrites, no deletes, no renumbers. Single big-edit insert at the end of the Components list. Section count grows from §1-§32 to §1-§41 (+9). All 9 have spec exports — no JSX-only sections (different from B5 which had 2). Note: CopyField was originally in audit-B7 but already covered in our B5/SCRUM-338, so this cluster is 9 not 10.

**New pattern introduced**: a centralized "Pattern note" sub-section at the end of the cluster (`#display-primitives-opacity-pattern`) with an inline `<a id>` anchor + 5 cross-references back from the affected sections. First time Part B uses a centralized disclosure for a systemic finding (5 occurrences of `text-content-primary/{30,50}` across 4 components) instead of repeating the disclosure per-section.

- **Scope**: `frontend` (docs reconciliation of frontend components)
- **Branch**: none in `em-ecosystem-code` (carry-forward Accepted-Trivial — 6th application of the lifecycle adaptation declared in SCRUM-329).
- **Implementation date**: 2026-05-03
- **Anchors**:
  - Code (`em-ecosystem`): `8d2fa80c` (post-SAT01-5 round 2 — unchanged through B1+B2+B3+B4+B5+B6)
  - Doc starting state (`ai-specs`): `4ed94e9` (post-/update-docs of SCRUM-338)

## Plan Reference

- Plan: [`SCRUM-339_frontend.md`](../../plans/Sprint%2014/SCRUM-339_frontend.md)
- Verify: [`SCRUM-339_verify.md`](../../plans/Sprint%2014/SCRUM-339_verify.md) — verdict **PASS**
- Plan was followed: **Yes, with seven Accepted-Trivial deviations** (1 carry-forward + 6 honest-disclosure variants — highest count in any Part B sub-ticket so far).

## Commits

| Repo | Hash | Message | Files |
|------|------|---------|-------|
| `em-ecosystem` | (none) | No code changes — docs-only ticket | 0 files |
| `ai-specs` | (current /update-docs commit) | `docs(SCRUM-339): reconcile Display primitives cluster — B6 of SCRUM-329 Part B` | 4 files |

## Deviations from Plan

| # | Step(s) | Planned | Actual | Reason | Category | Follow-up |
|---|---------|---------|--------|--------|----------|-----------|
| 1 | 0 | (Plan §4 Step 0 — "No code branch needed (carry-forward Accepted-Trivial)") | No `feature/SCRUM-339-frontend` branch in `em-ecosystem-code`. | 6th consecutive application — convention silenced (no longer needs explanation in plans/records). | **Accepted-Trivial** | — |
| 2 | 2a | "Draft §33 Avatar from `avatarSpecs`" | Section added — but Avatar uses **split exports** (`baseClass` line 21 + `sizeClasses` line 24) rather than a consolidated `avatarSpecs` object. Source citation lists both. | Honest documentation pattern. The split-export disclosure is necessary so future readers don't search for a non-existent `avatarSpecs`. | **Accepted-Trivial** | Lessons-learned: future code-side cleanup could consolidate. |
| 3 | 2b | "Draft §34 Badge from `badgeSpecs`" | Section added — but Badge uses **3 split exports** (`baseClass` + `variantClasses` + `sizeClasses`). Source citation lists all three. | Same pattern as #2 but with 3 exports. Most variant-rich primitive in the cluster (7 variants × 3 sizes). | **Accepted-Trivial** | Lessons-learned: future cleanup could consolidate. |
| 4 | 2c | "Draft §35 IconBadge from `iconBadgeSpecs`" | Section added + disclosed: `iconBadgeSpecs.sizes` hints at icon sizes (16/24/32 per `sm/md/lg`), but the JSX renders `{children}` verbatim — **icon sizing is consumer-responsibility**. Disclosed with concrete usage example (`<IconBadge size="md"><Settings size={24} /></IconBadge>`). | The spec hint could mislead a developer expecting auto-sizing. Without disclosure, consumers might use `size="lg"` with a `<Settings size={16}/>` resulting in disproportionate visuals. | **Accepted-Trivial** | Lessons-learned: enhancement could auto-size via `React.cloneElement`. |
| 5 | 2e + 2f | "Draft §37 InfinitySpinner from `infinitySpinnerSpecs` + §38 RingSpinner from `ringSpinnerSpecs`" | Both sections added + disclosed: each component exposes **3 sizes** (sm/md/lg → 16/24/32) — a deliberate subset of DaisyUI v5's full 5-size scale (xs/sm/md/lg/xl → 16/20/24/28/32). The components' JSDoc references the full DaisyUI scale, which could mislead a reader. Same disclosure in both sections. | Single design decision spanning 2 sections — DaisyUI's `sm` (20) and `lg` (28) are not exposed; we map our `sm`→`xs`, our `md`→`md`, our `lg`→`xl`. Readers seeing JSDoc would expect 5 sizes. | **Accepted-Trivial** | Lessons-learned: could expose all 5 if a use case for 20px/28px appears. |
| 6 | 2h | "Draft §40 Accordion from `accordionSpecs`" | Section added + disclosed: `accordionSpecs.container.divider` describes `divide-y` as conditional, but the JSX **always** applies it regardless of `borderless` prop. The `borderless` flag only removes outer border + rounded corners — items remain divided. | Spec wording could mislead. The behavior (always-divided items) is intentional — only the spec field is inexact. | **Accepted-Trivial** | Lessons-learned: spec field could be removed or made non-conditional. |
| 7 | 2a + 2g + 2h + 2i | "Draft §33/§39/§40/§41 from spec exports" | All 4 sections added — but **5 occurrences across 4 components** apply Tailwind opacity modifiers (`text-content-primary/{30,50}`) instead of dedicated semantic tokens. **NEW pattern**: consolidated into a single `display-primitives-opacity-pattern` sub-section at end of cluster + 5 cross-references from affected sections. Forward-looking note recommends coordinated migration (1 PR, not per-component) when `--color-content-tertiary` / `--color-content-quaternary` tokens become available. | Per-section disclosure (5 separate blockquotes) would have been verbose and hard to maintain. The centralized pattern preserves the disclosure but in a single place. **First time Part B uses this technique.** | **Accepted-Trivial** | Lessons-learned: pattern is reusable for future systemic findings (B7-B9). |

**No Accepted-Quality, no Accepted-Risk, no Deferred, no Scope-Gap items.**

**7 deviations is the highest count in any Part B sub-ticket so far** (B1: 2, B2: 2, B3: 3, B4: 5, B5: 6, **B6: 7**). All Accepted-Trivial. Per-section deviation count would be 11 (Deviation #5 spans 2 sections, Deviation #7 spans 4) — counted by design decision, not occurrence.

## Test Results

| Check | Result | Details |
|-------|--------|---------|
| Unit tests | N/A | Docs-only ticket. |
| Build verification | N/A (no code change) | `em-ecosystem-code` working tree clean throughout. |
| 12 grep AC checks (per plan §6) | **12/12 PASS** | AC1-9 (each of §33-§41 = 1 match each) ✅, AC10 (numbering continuous §1-§41, max=41, no GAP) ✅, AC11 (§36 Spinner contains `300ms`/`delayPattern` — 4 hits) ✅, AC12 (each new section has `**Source:**` line — 9/9 = 1) ✅. **All checks ran with `grep -cE`** per the B4 lessons-learned. |
| Bonus integrity checks | **10/10 PASS** | Pattern note anchor declared 1× ✅; Pattern note references = 5 ✅; §35→§33 (2) ✅; §35→§34 (3) ✅; §36→§37 (3) ✅; §36→§38 (3) ✅; §41→§18 (2) ✅; spec-export convention preserved (31 total in doc) ✅; Spinner trio comparison table present ✅; doc grew 1720→2509 lines (+789) ✅. |
| Spot-check independent verification | **6/6 PASS** | 9 new sections at expected positions (consecutive, no gaps); §36 delayPattern matches JSX `setTimeout(...,300)`; §37 animation cites `globals.css:370-381` (verified by direct grep on globals.css); §40 borderless inconsistency disclosure accurate; Pattern note anchor + 5 cross-refs valid; Spinner trio comparison table 9 rows × 4 cols complete. |
| User-approval gates | 9/9 confirmed | Gate 1 (§33 Avatar), Gate 2 (§34 Badge), Gate 3 (§35 IconBadge), Gate 4 (§36 Spinner), Gate 5 (§37 InfinitySpinner), Gate 6 (§38 RingSpinner), Gate 7 (§39 Divider), Gate 8 (§40 Accordion), Gate 9 (§41 EmptyState + Pattern note). Each draft presented with rationale and disclosures before applying. |

## Bugs Found

**One spec format misalignment self-corrected during /develop**: my initial drafts used `**Source**:` (colon outside the bold) but the established convention from B1-B5 is `**Source:**` (colon inside the bold) on its own line followed by a bullet list of `- Code:`, `- Spec export:`, `- Cross-reference:`. Caught during a pre-Edit grep of the existing doc. All 9 sections refactored to match the established convention before applying the single big-edit insert. Zero impact on the final output.

No other bugs. The 7 Accepted-Trivial deviations are honest-documentation cases, not defects — the underlying components and spec exports are functioning as designed.

## Documentation Updates

| File | Change |
|------|--------|
| `ai-specs/specs/ui-design-system.md` | **Pure additions** — single big-edit insert before the `## Common Patterns` anchor. 9 new sections (§33-§41) + new Pattern note sub-section added at the end of the Components list. Section count grows §1-§32 → §1-§41 (+9). Doc grew 1720 → 2509 lines (+789). Zero rewrites, zero deletes, zero renumbers. |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-339_frontend.md` | Plan (NEW — written during /plan) |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-339_verify.md` | Verify report (NEW — verdict PASS) |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-339_frontend.md` | This record (NEW) |
| `ai-specs/specs/integration-state.md` | **No update** — no module/guard/service changes |
| `ai-specs/specs/data-model.md` | **No update** — no DB |
| `ai-specs/specs/api-spec.yml` | **No update** — no endpoints |

## Audit Finding Resolution

This sub-ticket of SCRUM-329 Part B resolves 9 component rows from the audit table:

| Item | Audit row | Original classification | Resolution | Verified by |
|------|-----------|-------------------------|------------|-------------|
| Avatar | row 3 | Missing-from-doc | New §33 Avatar (split exports — `baseClass` + `sizeClasses`; 3-tier fallback chain documented) | AC1 PASS |
| Badge | row 4 | Missing-from-doc | New §34 Badge (3 split exports; 7×3 variants × sizes — most variant-rich) | AC2 PASS |
| IconBadge | row 21 | Missing-from-doc | New §35 IconBadge (sourced from `iconBadgeSpecs`; consumer-responsibility icon sizing disclosure) | AC3 PASS |
| Spinner | row 40 | Missing-from-doc | New §36 Spinner (Spinner trio anchor; 300ms delayPattern documented with full code example + rationale) | AC4 + AC11 PASS |
| InfinitySpinner | row 25 | Missing-from-doc | New §37 InfinitySpinner (DaisyUI v5 loading-infinity; CSS @keyframes traceable to globals.css:370-381; 3-of-5 size disclosure) | AC5 PASS |
| RingSpinner | row 34 | Missing-from-doc | New §38 RingSpinner (DaisyUI v5 loading-ring SMIL; closes Spinner trio with 9-row comparison table + trio-wide a11y note) | AC6 PASS |
| Divider | row 16 | Missing-from-doc | New §39 Divider (4 rendering modes documented vs spec's 3 types; distinguishing note vs §10/§8 inline text dividers) | AC7 PASS |
| Accordion | row 1 | Missing-from-doc | New §40 Accordion (Radix UI grid-row trick documented; `borderless` spec inconsistency disclosure; SingleAccordion sister export mentioned) | AC8 PASS |
| EmptyState | row 18 | Missing-from-doc | New §41 EmptyState (composes §18 Button Set; opacity pattern centralization) | AC9 PASS |

Final state: 9/9 RESOLVED, 0 UNRESOLVED, 0 NEW instances found. Section numbering continuous §1-§41 (verified by AC10).

## Lessons Learned

### What went well

- **Centralized Pattern note for systemic findings is a meaningful pattern upgrade**. Before B6, every disclosure was per-section (B5 had 5 separate blockquotes for 5 components). When a pattern affects 4+ components (5 occurrences here), the per-section approach becomes verbose and hard to maintain. The new `<a id>` anchor + cross-reference network preserves all the information in a single explained spot, and surfaces the systemic nature of the finding (which a per-section disclosure obscures). **Will reuse for B7-B9 when systemic findings appear.**
- **Single big-edit insert pattern scaled cleanly to 9 sections + 1 sub-section**. The B5 pattern (anchor on `## Common Patterns`) worked exactly the same with 9 sections as it did with 5. Atomic, no risk of partial state. Doc grew +789 lines in one operation. Pattern is now proven across 5 of 6 sub-tickets that introduced new sections.
- **Spinner trio comparison table** at the end of §38 is a strong navigation aid. Without it, a developer choosing between §36 / §37 / §38 would have to scan all 3 sections sequentially. The table answers "which one do I use?" in one place. **Pattern reusable**: when 3+ components form a comparative cluster (Toast variants? Banner types? Selector triggers?), close the cluster with a comparison table.
- **Source citation refactor caught a convention drift before applying**. My initial drafts used `**Source**:` instead of `**Source:**`. Caught with a pre-Edit grep of the existing doc. **Lesson**: always sample the existing convention before drafting — not just for content, but for formatting.
- **9 user-approval gates remained the right cadence**. Each gate ~5-10 minutes; total /develop ~2.5h matched the high estimate. No fatigue observed. Could have split into 2 sessions if user wanted but the continuous flow worked.
- **JSX-only verification expectation matched reality**: plan said "no JSX-only sections expected" — confirmed during /develop (all 9 have spec exports). The B5 disclosure pattern (no-spec blockquote at top) was not needed once.

### What was harder than expected

- **Spec-vs-JSX divergences accumulated more than expected**. Plan anticipated 3-5 deviations; ended up with 7 (highest count yet). Each is small, but the cumulative pattern suggests the audit table's "Missing-from-doc" classification under-counts the documentation surface — even when a doc section is missing, the spec export and JSX often disagree on details. **Lesson for B7-B9**: assume ≥0.7 deviations per component (B6: 9 components → ~6 deviations actual).
- **Avatar + Badge split-export pattern** was a surprise. The audit table did not call this out. Discovered during the spec-export inventory grep at the start of /develop. **Lesson for B7-B9**: always run `grep -nE '^export const \w+(Specs|Variants|Sizes|Classes)\s' ui/COMPONENT.tsx` for each component — confirms whether spec export is consolidated or split before drafting.
- **DaisyUI 3-of-5 size scale** required extra context (full DaisyUI scale + our subset + the JSDoc reference). Without disclosure, a developer reading the JSDoc would expect 5 sizes available. **Lesson**: when a component's TS interface narrows the spec/JSDoc, document the narrowing explicitly.
- **Pattern note anchor mechanics** required careful attention. The `<a id>` inline HTML works in GitHub-flavored markdown but the markdown link syntax `[text](#hash)` requires the anchor to be exactly the same. Verified with bonus integrity check (5 references resolve to 1 declaration).

### Recommendations for similar tickets (B7-B9)

1. **Use the centralized Pattern note pattern for systemic findings** affecting 4+ components. Per-section disclosures are fine for 1-3 components; consolidate when more.
2. **Sample existing conventions before drafting** — `**Source:**` vs `**Source**:`, `- Spec export:` vs `Spec export:`, table column headers, etc. Pre-Edit grep saves the post-Edit refactor.
3. **Run the spec-export inventory grep first** (`grep -nE '^export const \w+(Specs|Variants|Sizes|Classes)\s' ui/COMPONENT.tsx`) for every component — surfaces split-export disclosures before drafting.
4. **Plan for ≥0.7 deviations per component**. The audit table's classification is conservative; deeper JSX read reveals more disclosure surface.
5. **Comparison tables for 3+ component clusters** — use them to close the cluster (e.g., end of last section). The B6 Spinner trio table is the model.
6. **Coordinated migration recommendations** continue to compound across sub-tickets. B5 has `--color-success` (CopyField + RecoveryCodesGrid); B6 adds `--color-content-tertiary/quaternary` (5 occurrences across Avatar + Divider + Accordion + EmptyState). Track these for an eventual single "design system token coverage gap fix" PR.
7. **AC grep checks must use `-cE` flag** (lesson from B4) — proven again in B6.

## Next Steps

After this `/update-docs` commits to `ai-specs` main, the next sub-ticket of SCRUM-329 Part B is **B7 — Buttons + interactive** (audit-B3): Button (drift), IconButton (add), SegmentedControl (add). 3 components — smallest cluster but mixes rewrite (Button drift) with adds. First sub-ticket with significant rewrite work since B4 (Modals + Overlays).

Pattern proven across B1-B6 is now stable. Carry-forward language is silent (6 consecutive applications). Honest-documentation pattern continues for spec-vs-JSX divergence. Single big-edit insert pattern available for pure-addition clusters. Centralized Pattern note pattern available for systemic findings. Comparison table pattern available for 3+ component clusters.

Lessons-learned items captured in record (not auto-created tickets):
- **Display primitives opacity pattern coordinated migration**: 5 occurrences across 4 components (Avatar User-icon, Divider label, Accordion ChevronDown, EmptyState icon, EmptyState description). Migrate together with `--color-content-tertiary` (50%) + `--color-content-quaternary` (30%) when those tokens are added.
- **Avatar + Badge consolidated specs** could be added (`avatarSpecs`, `badgeSpecs`) to align with the rest of the catalog.
- **IconBadge auto-sizing children** via `React.cloneElement` — would enforce the icon sizes the spec describes.
- **InfinitySpinner + RingSpinner full DaisyUI scale** — could expose all 5 DaisyUI sizes if a use case for the missing 20px and 28px appears.
- **Accordion `accordionSpecs.container.divider` field** — could be removed or made non-conditional since the JSX always applies dividers regardless of `borderless`.
- (Carry-over from B5) `text-green-600` migration when `--color-success` token available — both §28 CopyField + §30 RecoveryCodesGrid in one PR.
- (Carry-over from B5) TurnstileWidget + CountdownTimer specs exports pending.
- (Carry-over from B5) QrCodeCard `onGenerate` prop wire-or-remove decision pending.
- (Carry-over from B4) IdleWarningModal could benefit from `idleWarningModalSpecs` export.
- (Carry-over from B4) SearchTrigger mobile variant decision pending.
- (Carry-over from B3) Tabs dot indicators decision pending.
- AC grep checks must use `-cE` flag (or POSIX `[0-9][0-9]*` pattern) — proven again in B6.
