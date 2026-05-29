# Implementation Record: SCRUM-334 Reconcile ui-design-system.md — Form controls (Inputs)

## Summary

B1 of 9 sub-tickets from SCRUM-329 Part B reconciliation. Reconciled the design system doc with code reality for 5 form-control input components. The doc's pre-existing Figma-era `Input Field (Phone/Currency/Text)` fragmentation was collapsed into a single unified `Input` section sourced from `inputSpecs`. The Checkbox section was fully rewritten (token-based, all 4 states, 3 sizes). Three new sections added for previously undocumented primitives: DateInput, MfaDigitInput, FormField. Common Patterns "Input Field" subsection trimmed of duplicated component spec, retains the Figma outline convention (cross-cutting design-system knowledge).

- **Scope**: `frontend` (docs reconciliation of frontend components — read-only on code, write-only on `ai-specs/specs/ui-design-system.md`)
- **Branch**: none in `em-ecosystem-code` (carry-forward Accepted-Trivial from parent SCRUM-329 — see Deviation #1). Work executed directly in `ai-specs/` working tree on `main`.
- **Implementation date**: 2026-05-02
- **Anchors** (audit + this ticket reflect these specific commit states):
  - Code (`em-ecosystem`): `8d2fa80c` (post-SAT01-5 round 2)
  - Doc starting state (`ai-specs`): `f1b4305` (post-/update-docs of SCRUM-329)

## Plan Reference

- Plan: [`SCRUM-334_frontend.md`](../../plans/Sprint%2014/SCRUM-334_frontend.md)
- Verify: [`SCRUM-334_verify.md`](../../plans/Sprint%2014/SCRUM-334_verify.md) — verdict **PASS**
- Plan was followed: **Yes, with two Accepted-Trivial deviations** documented (carry-forward + scope re-classification at /develop gate).

## Commits

This is unusual — the work produced no commits in `em-ecosystem-code` because it is docs-only:

| Repo | Hash | Message | Files |
|---|---|---|---|
| `em-ecosystem` | (none) | No code changes — docs-only ticket | 0 files |
| `ai-specs` | (current /update-docs commit) | `docs(SCRUM-334): reconcile Form controls (Inputs) cluster` | 4 files |

The `ai-specs` commit at the end of this `/update-docs` step contains the plan, verify report, this record, and the updated `ui-design-system.md`. No `/commit` against `em-ecosystem-code` was needed.

## Deviations from Plan

| # | Step | Planned | Actual | Reason | Category | Follow-up |
|---|---|---|---|---|---|---|
| 1 | 0 | (Plan §4 Step 0 — "No code branch needed (carry-forward deviation from SCRUM-329)") | No `feature/SCRUM-334-frontend` branch created in `em-ecosystem-code`. | Docs-only ticket — sole deliverable lives in `ai-specs/`. Same lifecycle adaptation declared in SCRUM-329's plan, applies to all Part B sub-tickets without re-justification. | **Accepted-Trivial** | — |
| 2 | 2d | "Starting from existing §25 content (lines 728-747), add 3 missing pieces sourced from `checkboxSpecs`" | **Full rewrite** of the Checkbox section using `checkboxSpecs` as source of truth. | The existing §25 had 6 elements drifted from code: `Dimensions 209x60`, `Gap 43px`, `Layout Horizontal` (Figma frame demo metadata, not component props), hex colors `#1c1c1c`/`#ffffff` instead of tokens, `shadow` mentioned but never implemented in JSX, demo labels "Checked"/"Default". Augmenting would have left all that drift in place — exactly what SCRUM-329 Part B is fixing. Full rewrite is consistent with how the other 4 components in this ticket were drafted (token-based, sourced from spec export). User approved the full rewrite at the Step 2d gate. No content regression — same 4 states documented (Checked, Unchecked, Indeterminate, Disabled) plus 3 sizes — strictly more coverage. | **Accepted-Trivial** | — |

**No Accepted-Quality, no Accepted-Risk, no Deferred, no Scope-Gap items.**

## Test Results

| Check | Result | Details |
|---|---|---|
| Unit tests | N/A | Docs-only ticket. |
| Build verification | N/A (no code change) | `em-ecosystem-code` working tree clean throughout, on `main` at `8d2fa80c`. Build status carries from SAT01-5 (PASS, 87.3 kB shared). |
| 5 grep AC checks (per plan §6) | **5/5 PASS** | AC1 (old §16/§17/§22 gone) ✅, AC2 (1 unified Input section) ✅, AC3 (DateInput/MfaDigitInput/FormField present) ✅, AC4 (Checkbox has indeterminate+sizes+disabled) ✅, AC5 (numbering continuous §1-§26, no gaps) ✅. |
| Spot-check independent verification | **3/3 PASS** | §22 Checkboxes content matches `checkboxSpecs` verbatim; §26 FormField cross-references valid; Common Patterns Figma outline note references valid. |
| User-approval gates | 6/6 confirmed | 5 per-component drafts + 1 Common Patterns rewrite. Each component's draft was presented and explicitly approved before edits applied to the .md. |

## Bugs Found

None during implementation. The 5 components in B1 cluster were already correctly classified in SCRUM-329's audit; resolution proceeded as predicted.

The audit-time bug (registry stale entry: `Sidebar.tsx` → should be `SidebarNav.tsx`) was not in B1's scope — it remains tracked under Part B B9 (Cleanup phase) per the audit deliverable's recommendation.

## Documentation Updates

| File | Change |
|---|---|
| `ai-specs/specs/ui-design-system.md` | **Major edit** — 3 deletions, 4 additions, 1 full-rewrite, 5 renumber operations, 1 Common Patterns rewrite. Net change: §1-§25 (with 3 fragmented Input sections) → §1-§26 (with 1 unified Input + 3 new primitives). |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-334_frontend.md` | Plan (NEW — written during /plan, not previously committed) |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-334_verify.md` | Verify report (NEW — verdict PASS) |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-334_frontend.md` | This record (NEW) |
| `ai-specs/specs/integration-state.md` | **No update** — no module/guard/service changes |
| `ai-specs/specs/data-model.md` | **No update** — no DB |
| `ai-specs/specs/api-spec.yml` | **No update** — no endpoints |

## Audit Finding Resolution

This sub-ticket of SCRUM-329 Part B resolves 5 specific rows from SCRUM-329's audit-table.md. Verified all 5 are now resolved:

| Component | Audit row | Original classification | Resolution | Verified by |
|---|---|---|---|---|
| Input | #27 | Documented-Drifted | New §23 Input (unified) replaces §16/§17/§22 | AC1 + AC2 PASS |
| DateInput | #15 | Missing-from-doc | New §24 DateInput | AC3 PASS |
| MfaDigitInput | #29 | Missing-from-doc | New §25 MfaDigitInput | AC3 PASS |
| Checkbox | #9 | Documented-Drifted | New §22 Checkboxes (rewrite) | AC4 PASS — 6 keyword matches |
| FormField | #20 | Missing-from-doc | New §26 FormField | AC3 PASS |

Final state: 5/5 RESOLVED, 0 UNRESOLVED, 0 NEW instances found. Section numbering continuous §1-§26 (verified by AC5).

**Audit cluster trace pattern**: each Part B sub-ticket should produce a similar table mapping its scope to specific audit table rows. This makes the relationship between the audit deliverable (the "what to fix" enumeration) and each sub-ticket (the "actual fix") traceable end-to-end.

## Lessons Learned

### What went well

- **Per-component user-approval gates worked smoothly**. 6 review cycles (5 components + Common Patterns) felt natural, not bureaucratic. Each draft was small enough to review in <2 minutes and the user could redirect early if a draft was off-track. This validates the cadence — it scales to subsequent sub-tickets B2-B9.
- **Spec-export-as-source-of-truth rule held without exception**. Every documented value in the new sections traces back to a `*Specs` / `*Variants` / `*Classes` export in the .tsx file. Spot-check verified §22 Checkboxes content matches `checkboxSpecs` verbatim. No drift introduced.
- **Lifecycle adaptation (no `em-ecosystem-code` branch) carried forward cleanly**. Declared once in SCRUM-329's plan and verify; subsequent sub-tickets just reference the precedent without re-arguing. This is the right pattern for a series of similar docs-only sub-tickets.
- **Combining Steps 9+10 into a single Edit operation** (replace §25 Checkboxes + insert 4 new sections) saved time and reduced the risk of intermediate-state errors. The Edit tool's exact-string-match worked because the §25 content was uniquely identifiable. Worth using this pattern in B2-B9 when a sub-ticket needs to insert multiple sections at the same anchor point.
- **Pre-/develop big-co peer review** (anchors, methodology, recurrence prevention added to SCRUM-329's deliverable) paid off here — this ticket's verify report adopted the same standards (audit cluster resolution table, spec-export verification, spot-checks) without me re-deriving them.

### What was harder than expected

- **Renumber ordering required careful planning**. With deletions of §16/§17/§22 happening in the middle of the §16-§25 range, naive renumber-then-delete would have created collisions (e.g., renumbering §25→§22 while §22 still exists). Order matters: delete-then-renumber, applied separately to each gap. Documented the trace in the verify report so B2-B9 can follow the pattern.
- **Common Patterns "Input Field" subsection required judgment, not mechanics**. The decision tree from /enrich-us said "keep cross-cutting composition guidance, drop component spec, add cross-references" — but applying it required reading carefully and weighing each piece. The Figma outline convention paragraph almost got dropped (it has component-spec phrasing) but the substance is cross-cutting (applies to all input-like primitives). Documented this in the rewrite by explicitly saying "applies to all input-like primitives: §23 Input, §24 DateInput, §25 MfaDigitInput".
- **The pre-existing §25 Checkboxes had MORE drift than the audit identified**. The audit's Drifted row noted "indeterminate/sizes/disabled missing". I found 3 additional drifted items: (1) "Dimensions 209x60"/"Gap 43px"/"Layout Horizontal" were Figma frame demo metadata, not component props; (2) "shadow" was mentioned but never implemented in JSX; (3) demo labels "Checked"/"Default" were Figma artifacts. This pushed the implementation from "augment with 3 pieces" to "full rewrite", documented as Deviation #2. **Lesson for B2-B9**: when audit flags Documented-Drifted, expect MORE drift than listed — read the existing section critically, not just additively.

### Recommendations for similar tickets (B2-B9)

1. **Use the Combine-Replace-and-Insert pattern** when a sub-ticket needs to both rewrite an existing section and append new sections at the same anchor point. One Edit operation is safer than chained operations.
2. **Always include an Audit Cluster Resolution table** in /verify and /update-docs records (like the one above). It makes the trace from audit deliverable → fix verifiable end-to-end.
3. **For Documented-Drifted components, plan for full rewrite** rather than additive augmentation. The audit's Notes column captures the most visible drifts, but Figma-era sections often have additional drifted artifacts (demo metadata, hex colors, mentioned-but-never-implemented features). Save time by drafting from the spec export from the start.
4. **Prefer `Edit` tool with section-content as the unique anchor** rather than line-number-based edits. Line numbers shift between edits; section headings + content are stable identifiers.
5. **6 user-approval gates per ~5-component sub-ticket is the right cadence**. Faster than 1-per-line review, slower than bulk approval. Each gate is small enough to be quick (~2 min) but covers a meaningful unit (1 component).

## Next Steps

After this `/update-docs` commits to `ai-specs` main, the next sub-ticket of SCRUM-329 Part B is **B2 — Form controls (other)** which covers Toggle (drift), Slider (drift), and Select (rename §7 Dropdown → "Context Menu" Doc-only + add new Select section). B2 will be opened as the next available SCRUM ticket after this one closes.

Per user's "Option A — single-ticket-at-a-time pacing" choice during B1 ticket creation: B2 is opened only after this `/update-docs` lands. Validates the full lifecycle (enrich → plan → develop → verify → update-docs) once before bulk-opening B3-B9.
