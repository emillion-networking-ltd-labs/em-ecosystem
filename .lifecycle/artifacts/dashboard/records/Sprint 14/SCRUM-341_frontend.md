# Implementation Record: SCRUM-341 Reconcile ui-design-system.md — Feedback / Alerts cluster

## Summary

B8 of 9 sub-tickets from SCRUM-329 Part B reconciliation. **NEW JSX-only record**: 4 of 6 components have NO spec export (Toast, ToastContainer, ErrorAlert, RateLimitBanner) — B5 had 2, B7 had 0. User-confirmed **Option A** for InlineError during /enrich-us: promote to dedicated §47 section + update cross-references in Common Patterns + §24 FormField. 6 user-approval gates, 5 separate Edits (1 rewrite + 1 multi-section insert + 3 cross-ref updates — Edits 3+4 combined since adjacent). Section count grows §1-§43 → §1-§48 (+5). Doc grew 2669 → 3032 lines (+363 net). **NEW deviation count record: 18 Accepted-Trivial** (vs 10 in B7, 7 in B6).

**Pre-B8 housekeeping**: A separate atomic correction commit `ea9f833` (pre-B8) fixed **22 broken cross-references** introduced in B1 (SCRUM-334) and invalidated by B4's (SCRUM-337) 18-section renumber. Same bug class as B6→eb09097 fix but at 11× scale. Discovered during B8's pre-audit. Fixed standalone for clean git blame.

**New patterns introduced in B8**:
1. **Cross-ref text-match validation runs doc-wide** (not just on touched references) — discovered the 22 B1-era broken refs that survived B2-B7 undetected. Now permanent doc-wide check for /verify going forward.
2. **First framer-motion library documentation in Part B** (§19 Toast 4 keyframes + §44 ToastContainer AnimatePresence + key criticality) — reusable disclosure pattern for future animation-bearing components.
3. **First B8→B5 + B8→B7 cross-cluster cross-references documented at depth** (§46→§42 IconButton, §48→§32 CountdownTimer) — establishes that compositions across clusters are normal and worth explicit cross-reference.
4. **Centralized when-to-use comparison table in §45 AlertBox** (5 components × use case) — sister sections cross-reference back instead of duplicating. Smaller scale than B6 Spinner trio table; smaller scale than B7 §43 vs §6 Tabs table. Right-sized for cluster cross-section.

- **Scope**: `frontend` (docs reconciliation of frontend components — read-only on code, write-only on `ui-design-system.md`)
- **Branch**: none in `em-ecosystem-code` (carry-forward Accepted-Trivial — 8th application of the lifecycle adaptation declared in SCRUM-329).
- **Implementation date**: 2026-05-03
- **Anchors**:
  - Code (`em-ecosystem`): `8d2fa80c` (post-SAT01-5 round 2 — unchanged through B1+B2+B3+B4+B5+B6+B7+B8)
  - Doc starting state (`ai-specs`): `ea9f833` (post-pre-B8 atomic fix — 22 B1-era broken refs eliminated)

## Plan Reference

- Plan: [`SCRUM-341_frontend.md`](../../plans/Sprint%2014/SCRUM-341_frontend.md)
- Verify: [`SCRUM-341_verify.md`](../../plans/Sprint%2014/SCRUM-341_verify.md) — verdict **PASS**
- Plan was followed: **Yes, with eighteen Accepted-Trivial deviations** (1 carry-forward + 17 honest-disclosure variants — record count in any Part B sub-ticket).

## Commits

| Repo | Hash | Message | Files |
|------|------|---------|-------|
| `em-ecosystem` | (none) | No code changes — docs-only ticket | 0 files |
| `ai-specs` | `ea9f833` (pre-B8 standalone) | `docs(ui-design-system): fix B1-era cross-reference drift across form-field cluster` | 1 file |
| `ai-specs` | (current /update-docs commit) | `docs(SCRUM-341): reconcile Feedback / Alerts cluster — B8 of SCRUM-329 Part B` | 4 files |

## Deviations from Plan

| # | Step(s) | Planned | Actual | Reason | Category | Follow-up |
|---|---------|---------|--------|--------|----------|-----------|
| 1 | 0 | (Plan §4 Step 0 — "No code branch needed (carry-forward Accepted-Trivial)") | No `feature/SCRUM-341-frontend` branch in `em-ecosystem-code`. | 8th consecutive application — convention silenced. | **Accepted-Trivial** | — |
| 2 | 2a | "Draft §19 Toast rewrite from `toastSpecs`" | Section rewritten — Toast has **NO spec export** (JSX-only). Disclosure blockquote at top + Source citation references library `framer-motion`. | Same precedent as B4 §26 IdleWarningModal, B5 §31/§32 (TurnstileWidget/CountdownTimer). | **Accepted-Trivial** | Lessons-learned: future code-side cleanup could add `toastSpecs`. |
| 3 | 2b | "Draft §44 ToastContainer from `toastContainerSpecs`" | Section added — ToastContainer has **NO spec export** (JSX-only). Same pattern as #2. | Same precedent. | **Accepted-Trivial** | Lessons-learned: future cleanup could add `toastContainerSpecs`. |
| 4 | 2d | "Draft §46 ErrorAlert from `errorAlertSpecs`" | Section added — ErrorAlert has **NO spec export** (JSX-only). Same pattern as #2. | Same precedent. | **Accepted-Trivial** | Lessons-learned: future cleanup could add `errorAlertSpecs`. |
| 5 | 2f | "Draft §48 RateLimitBanner from `rateLimitBannerSpecs`" | Section added — RateLimitBanner has **NO spec export** (JSX-only). Same pattern as #2. | **4 of 6 components in B8 are JSX-only — record (B5: 2, B7: 0).** | **Accepted-Trivial** | Lessons-learned: future cleanup could add `rateLimitBannerSpecs`. |
| 6 | 2a | "§19 Toast description text styling" | §19 Toast description uses `text-content-primary/50` — extends the [Display primitives opacity pattern](#display-primitives-opacity-pattern) (B6) to a 9th occurrence across 3 clusters. Inline cross-reference added; B6 Pattern note table NOT modified (cluster-scope semantics preserved per B7 precedent). | Coordinated migration scope grew (B6: 5, B7: +3, B8: +1 = 9 across 3 clusters). | **Accepted-Trivial** | Lessons-learned: when `--color-content-tertiary` token added, migrate all 9 occurrences in 1 PR. |
| 7 | 2a | "§19 Toast close-button color" | §19 Toast close-button uses `text-content-tertiary` — a 3rd opacity step beyond `text-content-primary/50`. Token name flagged for verification (`--color-content-tertiary`?). | Honest documentation. Possible naming gap worth code-side reconciliation. | **Accepted-Trivial** | Lessons-learned: verify token exists or formalize. Could become 10th opacity-pattern occurrence if confirmed. |
| 8 | 2a | "§19 Toast auto-dismiss" | §19 Toast has 5s default duration with `useEffect(setTimeout)` auto-dismiss. Documented with `Infinity` escape hatch for persistent toasts. | Honest documentation. Without callout, consumers might wrap Toast with manual setTimeout, duplicating the auto-dismiss. | **Accepted-Trivial** | — |
| 9 | 2a | "§19 Toast close-button styling" | §19 Toast close-button uses `opacity-0` until `group-hover:opacity-100` reveal. Keyboard users see no visual indication when focused — `:focus-visible` styling NOT implemented. | Honest documentation + a11y caveat + recommendation for future enhancement. | **Accepted-Trivial** (a11y) | Code-side ticket pending: add `focus-visible:ring-1` per §42 IconButton pattern. |
| 10 | 2a | "§19 Toast heading" | §19 Toast heading "(Quick Notification)" suffix is historical — predates §11 Quick Notification Doc-only section (no code). Suffix retained for backward compat; will be reconsidered in B10 Cleanup. | Honest documentation. Forward-reference to B10 work. | **Accepted-Trivial** | B10 cleanup pending. |
| 11 | 2b | "§44 ToastContainer styling" | §44 ToastContainer uses `px-[50px]` — Tailwind arbitrary value, NOT a design token. Could migrate to `--space-12` (48px closest) but `[50px]` reads as intentional safe-area choice. | Honest documentation. Token coverage gap candidate. | **Accepted-Trivial** | Lessons-learned: future audit + possible `--space-safe-area-x` token. |
| 12 | 2b | "§44 ToastContainer z-index" | §44 ToastContainer at `z-50` shares the same layer as §5 Modal. Render-order behavior documented (toasts render above modals when ToastContainer mounted later in DOM). | Honest documentation. | **Accepted-Trivial** | Lessons-learned: future top-layer components must verify z-index coordination. |
| 13 | 2d | "§46 ErrorAlert icon" | §46 ErrorAlert uses **inline custom SVG** for info-circle icon (NOT lucide). Disclosure includes 3 hypotheses (predates lucide / strokeWidth=1.5 refinement / bundle optimization). | Honest documentation. Only B8 component with hand-coded SVG. | **Accepted-Trivial** | Code-side audit pending: convert to lucide OR document rationale. |
| 14 | 2d | "§46 ErrorAlert dismiss" | §46 ErrorAlert dismiss button has `aria-label="Dismiss error"` hardcoded — consumers cannot localize without overriding `aria-label`. | Honest documentation. i18n pain point. | **Accepted-Trivial** (i18n) | Lessons-learned: i18n enhancement pending. |
| 15 | 2e + 3c + 3d | "Option A: PROMOTE InlineError to dedicated §47 + update cross-refs" | §47 InlineError section created. §24 FormField cross-ref updated (Edit 3 — combined with redundant inline-styling bullet removal since adjacent). Common Patterns "Input Field" cross-ref updated (Edit 5). Honest-attribution blockquote in §47 explicitly references B8 / SCRUM-341 / Option A. | Same canonicalization precedent as B4 Ambiguity 1 + B7 Common Patterns Button cleanup. Single design decision (Option A) spanning 3 sub-steps — counted once. | **Accepted-Trivial** (canonicalization) | — |
| 16 | 2f | "§48 RateLimitBanner type" | §48 RateLimitBanner uses `RateLimitKind` type from `@/lib/types` — externally typed. Type union members not verified during /develop (no spec to drive); flagged for /verify (NON-BLOCKING). | Honest documentation. **Verified during /update-docs**: `RateLimitKind = "throttle" \| "lockout"` (line 79 of types.ts). Both members confirmed; doc behavior is accurate (kind=undefined OR kind="throttle" both default to AlertTriangle icon, kind="lockout" → Lock icon). Could be enriched in a future minor edit to name `"throttle"` explicitly in the icon switch table, but functionally correct as-is. | **Accepted-Trivial** | Optional minor enrichment: name `"throttle"` explicitly in §48 icon switch table. |
| 17 | 2f | "§48 RateLimitBanner timer behavior" | §48 RateLimitBanner `onExpired` callback fires both at startup-with-zero AND when countdown reaches zero — consumers should idempotent-handle the callback. Documented explicitly. | Honest documentation. Without callout, double-trigger bugs likely. | **Accepted-Trivial** | — |
| 18 | 2a + 2b | "§19 Toast + §44 ToastContainer animations" | **First framer-motion library documentation in Part B** — §19 Toast (4 keyframes: layout / initial / animate / exit / transition) + §44 ToastContainer (AnimatePresence + key criticality). Reusable disclosure pattern. | New library + animation pattern documentation precedent established. | **Accepted-Trivial** | Lessons-learned: framer-motion disclosure pattern reusable for future animation-bearing components (B9 may have some). |

**No Accepted-Quality, no Accepted-Risk, no Deferred, no Scope-Gap items.**

**18 deviations is the highest count in any Part B sub-ticket so far** (B1: 2, B2: 2, B3: 3, B4: 5, B5: 6, B6: 7, B7: 10, **B8: 18**). All Accepted-Trivial. Per-occurrence count would be ~22 — counted by design decision/pattern (Deviations #15 spans 3 sub-steps; Deviation #18 spans 2 sections).

## Test Results

| Check | Result | Details |
|-------|--------|---------|
| Unit tests | N/A | Docs-only ticket. |
| Build verification | N/A (no code change) | `em-ecosystem-code` working tree clean throughout. |
| 14 grep AC checks (per plan §6) | **14/14 PASS** | AC1 (no raw hex in §19 — 0 hits) ✅, AC2 (framer-motion mentions — 3 hits) ✅, AC3 (max-w-[550px] + rounded-3xl — 1+1) ✅, AC4 (14px icon — 7 hits) ✅, AC5-9 (§44-§48 each = 1) ✅, AC10 (numbering §1-§48, max=48, no GAP) ✅, AC11 (6/6 sections with `**Source:**`) ✅, AC12 (5 mutual cross-refs — §19→§44=4, §44→§19=6, §46→§42=3, §47→§24=5, §48→§32=4) ✅, AC13 (Common Patterns "Input Field" → §47 = 1) ✅, AC14 (NEW post-B6 cross-ref text-match validation: 14/14 §N <Name> references verified) ✅. |
| Bonus integrity checks | **4/4 PASS** | §19 + §44 composed pair documented (5 hits) ✅, §46 vs §45 when-to-use disclosure (7 hits) ✅, §47 InlineError promotion attribution explicit (1) ✅, file size delta 2669→3032 (+363 lines, slightly above estimate) ✅. |
| **Doc-wide broken-ref sweep** | **0/7 patterns** | All 7 historical broken patterns verified absent: `§11 Tooltip`, `§22 Checkboxes`, `§18 Button Set`, `§23 Input`, `§24 DateInput`, `§25 MfaDigitInput`, `§26 FormField`. Confirms pre-B8 fix (`ea9f833`) eliminated B1-era drift AND B8 work introduced 0 new broken refs. |
| Spot-check independent verification | **10/10 PASS** | §19 in-place rewrite preserves position (line 983) ✅, §19 4 variants match `Toast.tsx:18-23` ✅, §44 position values match `ToastContainer.tsx:11` ✅, §45 4 variants match `AlertBox.tsx:7-32` ✅, §46 inline SVG attributes match `ErrorAlert.tsx:24-36` ✅, §47 promotion attribution correct ✅, §48 internal timer code matches `RateLimitBanner.tsx:23-45` ✅, Common Patterns "Input Field" InlineError reference updated ✅, §24 FormField cross-ref updated + redundant bullet removed ✅, doc-wide broken-ref sweep 0/7 ✅. |
| User-approval gates | 6/6 confirmed | Gate 1 (§19 Toast rewrite), Gate 2 (§44 ToastContainer), Gate 3 (§45 AlertBox), Gate 4 (§46 ErrorAlert), Gate 5 (§47 InlineError), Gate 6 (§48 RateLimitBanner). Each draft presented with rationale and disclosures before applying. |

## Bugs Found

**One major + one minor surfaced during pre-B8 audit; both fixed before B8 scope kicked in (or captured for follow-up):**

1. **Major: 22 broken cross-references discovered during pre-B8 audit** — same bug class as B6's `eb09097` fix but at 11× scale. References were written in B1 (SCRUM-334) when the form-field cluster was created with pre-B4 numbering, then invalidated by B4's (SCRUM-337) 18-section renumber that shifted §10-§27 down by 2 (deleted §9 Search Results + §20 Search Field). 22 refs survived B2-B7 undetected because the B7-introduced cross-ref text-match validation only checked references newly touched in each PR. Fixed via standalone atomic commit `ea9f833` BEFORE B8 scope kicked in. **Lesson**: cross-reference text-match validation must run **doc-wide**, not just on touched references — now permanent in /verify from B8 forward.

2. **Minor: `RateLimitKind` type union members not verified during /develop** — flagged as NON-BLOCKING in /verify. Confirmed during /update-docs: `RateLimitKind = "throttle" | "lockout"` (line 79 of `nexacore-dashboard/src/lib/types.ts`). The §48 RateLimitBanner doc behavior is accurate (kind=undefined OR kind="throttle" both default to AlertTriangle icon, kind="lockout" → Lock icon) but could be slightly enriched by naming `"throttle"` explicitly in the icon switch table. **Captured as optional minor enrichment for a future touch-up — non-blocking.**

No other bugs. The 18 Accepted-Trivial deviations are honest-documentation cases (4 JSX-only sections, opacity pattern extensions, animation library docs, cross-cluster compositions, canonicalization deletes/promotion) — the underlying components and spec exports are functioning as designed.

## Documentation Updates

| File | Change |
|------|--------|
| `ai-specs/specs/ui-design-system.md` | **Mixed edit pattern** — 5 separate Edits: (a) Edit 1 in-place rewrite of §19 Toast Message (preserves heading + position); (b) Edit 2 multi-section insert §44-§48 + closing dividers before `## Common Patterns` anchor (~360 lines added); (c) Edit 3+4 combined: §24 FormField InlineError reference updated to §47 + redundant inline-styling bullet removed (3 bullets → 2 — adjacent so combined into 1 Edit); (d) Edit 5 Common Patterns "Input Field" InlineError reference updated to §47. Net: doc grew 2669 → 3032 lines (+363). Section count §1-§43 → §1-§48 (+5). **First sub-ticket since B7 with both rewrite + structural updates** (cross-ref Edits act as structural changes). |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-341_frontend.md` | Plan (NEW — written during /plan) |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-341_verify.md` | Verify report (NEW — verdict PASS) |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-341_frontend.md` | This record (NEW) |
| `ai-specs/specs/integration-state.md` | **No update** — no module/guard/service changes |
| `ai-specs/specs/data-model.md` | **No update** — no DB |
| `ai-specs/specs/api-spec.yml` | **No update** — no endpoints |

## Audit Finding Resolution

This sub-ticket of SCRUM-329 Part B resolves 6 component rows from the audit table + 2 cross-reference updates + 1 redundant block removal:

| Item | Audit row | Original classification | Resolution | Verified by |
|------|-----------|-------------------------|------------|-------------|
| Toast | row 44 | Documented-Drifted | **§19 REWRITTEN in place** — JSX-only, token-based (drops raw hex), 4 variants 14px lucide icons (was 16 + file-exclamation-point), framer-motion 4-keyframe animation, 5s default duration with Infinity escape hatch, ARIA `role="alert" aria-live="assertive"`, opacity pattern 9th occurrence, close-button hover-reveal a11y caveat, "(Quick Notification)" suffix historical note | AC1+AC2+AC3+AC4 PASS |
| ToastContainer | row 45 | Missing-from-doc | **§44 ToastContainer ADDED** — JSX-only, fixed top positioning, pointer-events layering rationale, AnimatePresence + key criticality, z-50 collision note with §5 Modal, `px-[50px]` non-token disclosure, singleton mount pattern | AC5+AC11 PASS |
| AlertBox | row 2 | Missing-from-doc | **§45 AlertBox ADDED** — sourced from `alertBoxSpecs` (only B8 component with consolidated spec), 4 variants aligned with §19 Toast, `inline-flex` not block sizing surprise, comprehensive when-to-use comparison table for entire cluster (5 components × use case) | AC6+AC11 PASS |
| ErrorAlert | row 19 | Missing-from-doc | **§46 ErrorAlert ADDED** — JSX-only, inline custom SVG with 3 hypotheses, composes §42 IconButton (first **B8→B7** cross-cluster cross-ref), `text-body text-error` typography difference vs §45, hardcoded `aria-label` i18n disclosure | AC7+AC11+AC12 PASS |
| InlineError | row 26 | Documented-Aligned | **§47 InlineError PROMOTED** — sourced from `inlineErrorSpecs`, dedicated section + 2 cross-ref updates (§24 FormField line 1236 + Common Patterns line 2379) + 1 redundant block removal (§24 FormField line 1238), promotion attribution blockquote, canonical FormField composition pattern + standalone usage example | AC8+AC11+AC13 PASS |
| RateLimitBanner | row 32 | Missing-from-doc | **§48 RateLimitBanner ADDED** — JSX-only, kind-based icon switch (`RateLimitKind = "throttle" \| "lockout"` confirmed during /update-docs), composes §32 CountdownTimer (first **B8→B5** cross-cluster cross-ref), internal timer behavior with full code, `onExpired` idempotency callout, 3 use case examples | AC9+AC11+AC12 PASS |

Final state: 6/6 components RESOLVED. Plus **2 cross-reference Edits** (Common Patterns "Input Field" + §24 FormField) + **1 redundant block removal** (§24 FormField inline InlineError styling — covered by §47) executed per Option A canonicalization. Plus **22 historical cross-reference fixes** in pre-B8 commit `ea9f833`.

## Lessons Learned

### What went well

- **Pre-B8 doc-wide cross-ref sweep caught 22 B1-era broken refs.** Without the doc-wide sweep, these would have remained undetected through B8, B9, B10 (and beyond). Standalone atomic correction commit `ea9f833` kept the fix separate from B8 scope. **Cross-ref text-match validation as permanent doc-wide /verify check is the most valuable lesson from B8.**
- **5 separate Edits worked cleanly for mixed pattern (rewrite + multi-insert + 3 cross-ref updates).** Edits 3+4 combined since adjacent (~3 saved Edit operations). Each Edit independently verifiable post-application. No risk of partial state leaking between edits.
- **Centralized when-to-use comparison table in §45 AlertBox** is a strong cluster-cohesion pattern. Sister sections (§19, §46, §47, §48) all cross-reference back to §45 for the comparison instead of duplicating. Right-sized for cluster cross-section (5 components × 1 aspect), smaller than B6 Spinner trio table (3 × 9) and B7 §43 vs §6 Tabs table (2 × 6).
- **First framer-motion library documentation in Part B** went smoothly with the 4-keyframe explanation pattern + AnimatePresence + key criticality callout. Reusable for future animation-bearing components.
- **Cross-cluster cross-references documented at depth** (§46→§42 IconButton, §48→§32 CountdownTimer) — establishes the pattern that compositions across clusters are normal and worth explicit cross-reference. Both worked cleanly with the §N <Name> convention + Bonus 14 verification.
- **InlineError promotion (Option A) worked smoothly** — same canonicalization pattern as B4 Ambiguity 1 + B7 Common Patterns Button cleanup. Promotion attribution blockquote in §47 + 2 cross-ref updates + 1 redundant block removal — all clean operations.
- **6 user-approval gates remained the right cadence** despite 4 JSX-only sections requiring deeper JSX read. Total /develop ~2-2.5h matched estimate.
- **Plan estimate held** — predicted 8-12 deviations; actual was 18. **Lesson**: 4 JSX-only sections each generate 1 disclosure for the no-spec-export blockquote, which alone bumps the count by 4. Plus the canonicalization (counted once) + animation library (counted once) + opacity extensions + cross-cluster compositions → easily exceeded plan estimate. **Update plan estimation: assume +0.7 deviations per JSX-only section beyond the carry-forward baseline.**

### What was harder than expected

- **JSX read surfaced 5 deviations not anticipated in /enrich** — `text-content-tertiary` 3rd opacity step (Toast close-button), `px-[50px]` non-token (ToastContainer), z-50 collision with §5 Modal (ToastContainer), inline custom SVG (ErrorAlert), `onExpired` idempotency at startup-with-zero (RateLimitBanner). Plan estimated 8-12 deviations; actual was 18. **Lesson**: behavior-rich clusters (animation, internal timers, multi-state ARIA) consistently exceed plan estimates. Build "+50% deviation budget" for JSX-only-heavy clusters.
- **B1-era regression discovery required pre-B8 audit detour** — added ~15 minutes to start of /develop but prevented B8 from inheriting the broken refs. Same lesson as B7 (which fixed eb09097 pre-B7) but at 11× scale here. **Reinforces**: any cluster following any renumber-bearing cluster (B4-style) needs a doc-wide cross-reference re-validation pass.
- **Decision NOT to modify B6 Pattern note's table** required explicit reasoning AGAIN (3rd time — first in B7, now in B8). Could have added Toast description occurrence to the existing 5-row table to make it 9 rows across 3 clusters. Decided against it: the Pattern note's scope (`Display primitives cluster`) would have been violated. Inline-references from §19 Toast description to the existing note. Same trade-off as B7. **Lesson**: scope creep prevention is a recurring concern — formalize the rule (Pattern notes are scoped to their declaring cluster; new occurrences in other clusters get inline references).
- **Toast `text-content-tertiary` token verification was a real "gotcha"** — the close-button uses a 3rd opacity step beyond `text-content-primary/50`. Could be a new token (`--color-content-tertiary`?) or a naming gap. Worth code-side reconciliation. If confirmed, this becomes the 10th occurrence in the opacity-pattern coordinated migration scope.
- **`RateLimitKind` type verification** required a one-line check during /update-docs — flagged NON-BLOCKING in /verify. **Lesson**: when a JSX uses an externally-defined type, the /verify spot-check should always include reading the type definition.

### Recommendations for similar tickets (B9-B10)

1. **Cross-reference text-match validation MUST run doc-wide** — B8 is the proof. Even after B8 closes, B9 should pre-audit the doc for any new drift. Future-proof: add a script that runs as part of /verify (or as a CI/pre-commit check).
2. **For JSX-only-heavy clusters, plan for +50% deviation budget.** B8 had 4 JSX-only sections + cross-cluster compositions + animation library + canonicalization → 18 deviations. Set realistic expectations.
3. **5 separate Edits for mixed pattern (rewrite + multi-insert + 3 cross-ref updates) worked cleanly.** Combine adjacent Edits where possible (Edits 3+4 in B8). Each Edit independently verifiable.
4. **Centralized when-to-use comparison tables** for cluster cross-sections work at all scales — right-size for the cluster (3×9 in B6, 2×6 in B7, 5×1 in B8). Sister sections cross-reference back.
5. **Cross-cluster cross-references** are normal and worth explicit `§N <Name>` notation. B8 introduced 2 (§46→§42 IconButton from B7, §48→§32 CountdownTimer from B5) — both verified by Bonus 14 text-match validation.
6. **Pattern notes are scoped to their declaring cluster** — formalize this rule. New occurrences in other clusters get inline references back to the original Pattern note, but the table itself is NOT modified.
7. **For externally-typed JSX components** (e.g., RateLimitBanner uses `RateLimitKind` from `@/lib/types`), the /verify spot-check should always include reading the type definition. Skipping this is NON-BLOCKING but leaves a gap.
8. **AC grep checks must use `-cE` flag** — proven again in B8 (lesson from B4).

## Next Steps

After this `/update-docs` commits to `ai-specs` main, the next sub-ticket of SCRUM-329 Part B is **B9 — Misc + selectors** (audit-B8b). Per the audit-table line 234, B9 covers: DataTable (add), StickyCard (add), TurnstileWidget (already done in B5), Calendar (drift), LanguageSelector + EmailSelector (drift in Common Patterns "Selector Trigger"). With ImageCropper + BeforeAfterSlider + ThemeToggle potentially fitting here too — final cluster composition to be decided during B9 /enrich-us. After B9, **B10 (audit-B9) Cleanup** must run last (deletes orphaning cross-references; remove §11 Quick Notification + §12 Payment Form + §13 Speedometer + §14 Notification + §2 Icon Set — all Doc-only with no code; reconcile §1 Card with globals.css; fix registry "Sidebar.tsx" → "SidebarNav.tsx"; **also reconsider §19 Toast heading "(Quick Notification)" suffix** since §11 will be deleted in B10).

Pattern proven across B1-B8 is now stable. Carry-forward language is silent (8 consecutive applications). Honest-documentation pattern continues for spec-vs-JSX divergence + JSX-only sections + cross-cluster compositions + animation library docs. Single big-edit insert pattern for pure-addition clusters; 3-Edit pattern (rewrite + delete + insert) for B7-style mixed; 5-Edit pattern (rewrite + multi-insert + cross-ref updates) for B8-style canonicalization-with-promotion. Centralized when-to-use comparison table pattern for cluster cross-sections. **Cross-reference text-match validation now permanent doc-wide in /verify**.

Lessons-learned items captured in record (not auto-created tickets):
- **Cross-ref text-match validation runs doc-wide** as permanent /verify step. Should also be added to CI/pre-commit script.
- **Toast `text-content-tertiary` token verification** — could become 10th opacity-pattern occurrence.
- **Toast keyboard a11y enhancement** — add `focus-visible:ring-1` per §42 IconButton pattern.
- **Toast "(Quick Notification)" suffix** — to be reconsidered in B10 Cleanup.
- **ToastContainer `px-[50px]` non-token** — token coverage gap.
- **ErrorAlert inline custom SVG** — code-side audit needed.
- **ErrorAlert hardcoded `aria-label`** — i18n enhancement.
- **Toast + ToastContainer + ErrorAlert + RateLimitBanner consolidated specs** — code-side cleanup.
- **§48 RateLimitBanner `"throttle"` explicit naming** — optional minor enrichment.
- **framer-motion library disclosure pattern** — established in B8, reusable for B9.
- **Pattern notes scope formalization** — declare cluster-scoped, inline-reference from other clusters.
- **(Carry-over from B7)** Display primitives opacity pattern coordinated migration scope grew to 9 occurrences across 3 clusters (B6: 5, B7: +3, B8: +1).
- **(Carry-over from B7)** Spinner unification opportunity (IconButton is 4th spinner implementation).
- **(Carry-over from B7)** IconButton orphan variants reconciliation (`circle` + `inside input`).
- **(Carry-over from B6)** Avatar + Badge consolidated specs pending.
- **(Carry-over from B6)** SegmentedControl `activeClasses` export pending.
- **(Carry-over from B6)** §37 InfinitySpinner → §15 Button Set back-reference one-way.
- **(Carry-over from B5)** `text-green-600` migration when `--color-success` token available.
- **(Carry-over from B5)** TurnstileWidget + CountdownTimer specs exports pending.
- **(Carry-over from B5)** QrCodeCard `onGenerate` prop wire-or-remove decision pending.
- **(Carry-over from B4)** IdleWarningModal could benefit from `idleWarningModalSpecs` export.
- **(Carry-over from B4)** SearchTrigger mobile variant decision pending.
- **(Carry-over from B3)** Tabs dot indicators decision pending.
- AC grep checks must use `-cE` flag (or POSIX `[0-9][0-9]*` pattern) — proven again in B8.
