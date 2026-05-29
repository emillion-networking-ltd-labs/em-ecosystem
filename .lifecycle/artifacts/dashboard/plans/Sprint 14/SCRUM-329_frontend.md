# Frontend Implementation Plan: SCRUM-329 Audit + reconcile ui-design-system.md with actual UI Core components — Part A only

**Detected scope**: `frontend` (docs-only audit; reads from `nexacore-dashboard/src/components/ui/` and writes to `ai-specs/changes/dashboard/audit/`)

> **This plan covers Part A (audit) only.** Part B (reconciliation — the actual edits to `ui-design-system.md`) is deliberately out of scope for this iteration. After Part A delivers the tracking table, the user reviews it and we open SCRUM-329-B1 through B8 (or fewer/different sub-tickets, depending on what the table shows) to do the edits in reviewable batches. The split is the explicit recommendation in the ticket itself ("Recommend `/plan` to split into sub-phases if the full reconciliation proves too large for one ticket").

## 1. Codebase State Verification (2026-05-02)

- **Sprint**: Sprint 14 (id=477)
- **Module**: `dashboard`
- **Source files verified** (read from live code today):
  - `nexacore-dashboard/src/components/ui/*.tsx` — **48** `.tsx` files (verified via `ls`)
  - `nexacore-dashboard/src/lib/component-registry.ts` — **30** registry entries; some entries aggregate multiple files (e.g. "Feedback / Alerts" → 6 files, "Modal" → 2 files)
  - `ai-specs/specs/ui-design-system.md` — **25** numbered component sections (`### 1.` through `### 25.`) under `## Components`, plus 13 `## Common Patterns` sub-sections
- **Verified component file list** (alphabetical): Accordion, AlertBox, Avatar, Badge, BeforeAfterSlider, Breadcrumbs, Button, Calendar, Checkbox, CommandPalette, ConfirmModal, CopyField, CountdownTimer, DataTable, DateInput, Divider, EmailSelector, EmptyState, ErrorAlert, FormField, IconBadge, IconButton, IdleWarningModal, ImageCropper, InfinitySpinner, InlineError, Input, LanguageSelector, MfaDigitInput, Pagination, QrCodeCard, RateLimitBanner, RecoveryCodesGrid, RingSpinner, SearchTrigger, SegmentedControl, Select, SidebarNav, Slider, Spinner, StickyCard, Tabs, ThemeToggle, Toast, ToastContainer, Toggle, Tooltip, TurnstileWidget.

## 2. Overview

Read-only audit of the UI Core inventory across three sources of truth (code / registry / doc) and produce a single tracking table that classifies every component into one of 5 categories: `Documented-Aligned`, `Documented-Drifted`, `Missing-from-doc`, `Doc-only`, `Ambiguous`. The table is the deliverable. **No code changes**, no doc edits in this ticket — the table feeds Part B sub-tickets.

The work is mechanical (cross-reference 3 lists, classify) but requires **reading the spec exports** (e.g. `sliderSpecs`, `buttonVariants`, `badgeVariants`) for any "Documented-Aligned" or "Documented-Drifted" claim — never inferred from JSX class strings. This rule comes from the ticket's own AC bullet "Each documented component section uses values consistent with the component's actual exports".

## 3. Architecture Context

Three sources, asymmetric coverage:

```
┌─ Code (authoritative) ─────────────┐    ┌─ Registry (catalog) ──┐    ┌─ Doc (.md) ─────────────┐
│ 48 .tsx files in src/components/ui │    │ 30 entries; some       │    │ 25 numbered sections    │
│                                    │    │ aggregate multiple     │    │ 13 "Common Patterns"    │
│ Each may export specs object       │←──→│ files (e.g. Modal=2,   │←──→│ subsections             │
│ (sliderSpecs, buttonVariants…)     │    │ Feedback/Alerts=6)     │    │                         │
└────────────────────────────────────┘    └────────────────────────┘    └─────────────────────────┘
```

Iteration direction: **iterate over code (48 files), look up each in registry + doc**. The opposite direction would miss code-only components.

**Branching exception**: this ticket produces a deliverable in `ai-specs/` only — no code changes in `em-ecosystem-code`. The lifecycle deviates from the standard:

- **Standard**: `/develop` creates feature branch in `em-ecosystem-code` → edits → `/commit` pushes to `em-ecosystem-code`.
- **Here**: `/develop` works directly in `ai-specs/` working tree → `/verify` reviews the table → `/update-docs` commits the deliverable to `ai-specs/` main (matching the existing direct-to-main convention for ai-specs).
- **Why**: there's nothing to put in `em-ecosystem-code`. Forcing an empty feature branch there is ceremony without value. This deviation is documented in the verify report as a deliberate process choice.

## 4. Implementation Steps

### Step 0: No code branch needed (deliberate deviation)

Working directly in `ai-specs/` working tree on `main` branch. The `ai-specs/` repo follows direct-to-main convention for docs (per `/update-docs` Part 6). No `feature/SCRUM-329-frontend` branch created in `em-ecosystem-code`.

If future readers want a record of this, the `/verify` report will note: "Lifecycle deviation: docs-only ticket, no em-ecosystem-code branch. Audit deliverable committed to ai-specs main during /update-docs."

### Step 1: Inventory the 48 code files

- **File**: read-only — list `nexacore-dashboard/src/components/ui/*.tsx`
- **Action**: build the base of the audit table — one row per `.tsx` file, alphabetical.
- **Implementation Steps**:
  1. `ls nexacore-dashboard/src/components/ui/*.tsx | sed 's/.tsx$//'` → 48 component names
  2. For each, capture: file path (relative), file size in lines (informational), and whether the file exports a "specs object" (grep for `export const \w+Specs` or `export const \w+Variants`)
- **Output**: 48-row table skeleton with columns: `#`, `Component`, `Code file`, `Has spec export?`, `Spec export name`

### Step 2: Cross-reference with `component-registry.ts`

- **File**: read-only — `nexacore-dashboard/src/lib/component-registry.ts`
- **Action**: for each row, find the registry entry whose `files` array contains this component's file.
- **Implementation Steps**:
  1. Parse the `componentRegistry` array (it's a TypeScript const, not JSON — extract the `name` and `files` fields per entry). Manual reading is fine; the file is ~250 lines.
  2. Build a reverse index: `file -> registry entry name`.
  3. Add column to the table: `Registry entry`. Fill in or leave blank if no registry entry covers this file.
  4. Flag any files NOT covered by any registry entry (these are components that exist in code but aren't catalogued — separate problem from the doc audit).
- **Notes**:
  - Some registry entries cover multiple files (Modal=ConfirmModal+IdleWarningModal, Feedback/Alerts=6 files). Each file gets the same registry entry name in its row.
  - Some registry entries reference files OUTSIDE `src/components/ui/` (e.g. Charts → `TotalUsersChart.tsx` lives elsewhere; Motion Patterns → `framer-motion`, `globals.css`). These are not in our 48-file scope — note them in a footer "Out-of-ui-folder registry entries" but don't include them as audit rows.

### Step 3: Cross-reference with `ui-design-system.md`

- **File**: read-only — `ai-specs/specs/ui-design-system.md`
- **Action**: for each row, find the doc section that documents this component (or determine no section exists).
- **Implementation Steps**:
  1. Enumerate the 25 numbered sections (already extracted in /enrich-us output) and the 13 Common Patterns sub-sections.
  2. For each row, attempt to map: explicit name match (e.g. row "Tooltip" → §11 Tooltip), conceptual match (e.g. row "ConfirmModal" → §5 Modal), or no match.
  3. Add column: `Doc section #`. Fill in section number, "Patterns" if it's only in Common Patterns, or `(none)` if no match.
  4. Flag ambiguous mappings explicitly: e.g. `SearchTrigger.tsx` could map to §9 Search Results or §23 Search Field — both are doc-only-conceptual without explicit code reference. Mark `Ambiguous` and surface for user disambiguation in Step 6.
- **Notes**:
  - The doc has sections like "Input Field (Phone)" §16, "Input Field (Currency)" §17, "Input Field (Text)" §22 — these are likely all variants of one `Input.tsx` component in code. Document as: code "Input" maps to multiple doc sections (drifted — code consolidates what doc fragments).

### Step 4: Read spec exports for "Aligned vs Drifted" classification

- **File**: read-only — for each component with a doc section AND a spec export, open the `.tsx` file and read the spec object.
- **Action**: compare exported spec values against documented values to determine `Documented-Aligned` vs `Documented-Drifted`.
- **Implementation Steps**:
  1. From Step 1 we know which components export specs (e.g. `sliderSpecs`, `buttonVariants`, `badgeVariants`, `iconButtonVariants`, `tooltipSpecs`, etc.).
  2. For each such component with a doc section: read its specs export and the doc section side-by-side.
  3. Compare key fields:
     - Variants/types listed (e.g. doc says 4 button variants, code exports 6 → `Drifted`)
     - Pixel values vs token references (e.g. doc says `width: 200px`, code says `var(--button-width)` → `Drifted`)
     - Behavior bullets (e.g. doc mentions "click animates 300ms", code's `transition: 300ms` → `Aligned` for that bullet)
  4. Classify the row: `Documented-Aligned` (all values match) or `Documented-Drifted` (≥1 mismatch). For Drifted, note in the `Notes` column WHAT is drifted (e.g. "doc lists 4 variants, code has 6: link, link-underline added").
- **Notes**:
  - For components WITHOUT a spec export (e.g. simple atoms with no exported config object), classification falls back to "doc says X, JSX renders Y" comparison. Document this in Notes column.
  - Don't over-engineer: this is a spot-check, not a formal verification. The goal is to flag drift, not produce diffs. If something LOOKS drifted, mark Drifted with a brief note. /develop on Part B sub-tickets will go deep.

### Step 5: Identify Doc-only candidates

- **File**: read-only — `ui-design-system.md` sections list
- **Action**: identify doc sections that have no corresponding component in the 48-file code list.
- **Implementation Steps**:
  1. List the 25 numbered sections.
  2. For each, check: was it referenced as the "Doc section #" of any row in the audit table? If no → `Doc-only` candidate.
  3. Likely candidates (from /enrich-us preliminary classification): §8 Analytics Graph, §13 Payment Form, §14 Speedometer.
  4. For each Doc-only candidate, capture: section number, section title, brief excerpt from the doc explaining what the section is about.
  5. Add a separate "Doc-only candidates for user review" subsection in the deliverable.
- **Notes**:
  - Do NOT remove Doc-only sections in this ticket. The action is to surface them for user decision in Part B's "Phase B8 — Cleanup" sub-ticket.

### Step 6: Surface ambiguities for user disambiguation

- **Action**: produce a short list of ambiguous mappings that need user confirmation before Part B can proceed.
- **Implementation Steps**:
  1. From Step 3, list all rows classified `Ambiguous` (likely candidates: SearchTrigger ↔ §9 Search Results vs §23 Search Field, Select ↔ §7 Dropdown, ThemeToggle ↔ Theme System section vs no own section).
  2. For each, present 2-3 possible interpretations with rationale, ready for the user to pick one.
  3. Add to the deliverable as "Ambiguities requiring user decision".
- **Output**: a small table with columns `Component | Possible mappings | Rationale | Recommended interpretation`.

### Step 7: Write the deliverable

- **File**: NEW — `ai-specs/changes/dashboard/audit/ui-design-system-2026-05-02/audit-table.md`
- **Action**: produce a single self-contained markdown file with the audit table + supporting subsections.
- **Implementation Steps**:
  1. Create folder: `ai-specs/changes/dashboard/audit/ui-design-system-2026-05-02/` (timestamp matches the audit pattern from `/audit` command — see audit-standards.mdc Section 4 in memory: "ai-specs/ai-specs/changes/[module]/audit/audit-YYYY-MM-DDTHH-MM/").
  2. Folder name format: `ui-design-system-2026-05-02` (date only — no HH-MM since this is a doc audit, not a code/security audit; one per day is sufficient).
  3. Write `audit-table.md` with sections:
     - Summary (3 numbers: code/registry/doc counts; total rows; classification distribution)
     - The 48-row audit table
     - Doc-only candidates (Step 5 output)
     - Ambiguities requiring user decision (Step 6 output)
     - Out-of-ui-folder registry entries (footnote from Step 2)
     - Recommendations for Part B sub-ticket split (re-iterate the 8 phases proposed in /enrich-us, refined based on what the audit shows)

### Step 8: Update Technical Documentation

This step is the same as the standard "update technical documentation" step but for an audit deliverable. Per `documentation-standards.mdc`:
- All content in English
- Markdown formatting consistent with existing audit reports under `ai-specs/changes/auth/audit/`
- Every claim traces back to a file actually read (filenames in the table, line numbers if relevant)

The deliverable IS the documentation update for this ticket — there's no `data-model.md` or `api-spec.yml` to touch.

## 5. Implementation Order

```
── /develop phase (LOCAL, ai-specs working tree only) ──
Step 0   No branch created (deliberate; flagged in /verify)
Step 1   Inventory the 48 code files → table skeleton
Step 2   Cross-reference with component-registry.ts → fill Registry column
Step 3   Cross-reference with ui-design-system.md → fill Doc section column + flag Ambiguous
Step 4   Read spec exports + classify Aligned vs Drifted
Step 5   Identify Doc-only candidates
Step 6   Surface ambiguities for user disambiguation
Step 7   Write audit-table.md to ai-specs/changes/dashboard/audit/ui-design-system-2026-05-02/
Step 8   (covered by Step 7)
         ── /develop ends — user reviews the table ──

── /verify phase (review the deliverable) ──
- Sanity check: 48 rows present, every row has a classification, every Drifted/Doc-only/Ambiguous has a Notes explanation
- User signs off on the table OR requests revisions

── /update-docs phase (commit deliverable to ai-specs main) ──
- Follow the standard /update-docs Part 6 pattern: explicit `git add`, commit to main, push.
- Stage: ai-specs/changes/dashboard/audit/ui-design-system-2026-05-02/audit-table.md, ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-329_frontend.md, ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-329_verify.md, ai-specs/changes/dashboard/records/Sprint 14/SCRUM-329_frontend.md
```

## 6. Testing Checklist

- [ ] All 48 components listed (verified count matches `ls nexacore-dashboard/src/components/ui/*.tsx | wc -l`)
- [ ] Every row has a classification (no blank cells in the Classification column)
- [ ] Every `Documented-Drifted` row has a Notes entry explaining WHAT is drifted
- [ ] Every `Documented-Aligned` row references the spec export used to verify alignment
- [ ] Every `Ambiguous` row appears in the "Ambiguities" subsection with possible interpretations
- [ ] Every `Doc-only` candidate appears in the dedicated subsection with the doc excerpt
- [ ] Spot-check 5-10 rows by hand (open the file + the doc section, confirm the classification)
- [ ] No claim references a file that wasn't actually read (audit-standards.mdc 6.1 freeze rule)

## 7. Error Handling Patterns

N/A — the deliverable is a markdown table. No runtime errors to handle. If a component file is missing or unreadable, the audit row simply notes "file not found" and skips classification.

## 8. UI/UX Considerations

N/A — this ticket produces a markdown audit. No user-facing UI.

## 9. Dependencies

- Read access to `nexacore-dashboard/src/components/ui/` and `nexacore-dashboard/src/lib/component-registry.ts`
- Read access to `ai-specs/specs/ui-design-system.md`
- No npm packages, no test frameworks. The Glob/Grep/Read tools are sufficient.

## 10. Notes

- **The audit table IS the contract** for Part B sub-tickets. Once user signs off, every row's classification drives a specific action in B1-B8.
- **Don't over-engineer Step 4**. Aligned vs Drifted is binary; nuanced "partially aligned" doesn't help — mark as Drifted with a Notes column entry.
- **Read spec exports, not JSX**. This is the AC's authoritative source. JSX class strings are derivative.
- **English content only** per documentation-standards.mdc.
- **User approval rule for the doc itself doesn't apply yet** — that rule kicks in for Part B (when we edit `ui-design-system.md`). Part A is read-only audit.

## 11. Next Steps After Implementation

After the audit deliverable is committed, the user reviews it. Outcomes:

1. **Most likely**: open Part B sub-tickets matching the 8 phases proposed in /enrich-us (B1 Form controls, B2 Feedback, B3 Navigation, B4 Modals, B5 Auth-specific, B6 Display primitives, B7 Data+interactive, B8 Cleanup). Refined groupings based on what the table actually shows.
2. **Alternative**: if the audit reveals fewer drift cases than expected, collapse to fewer sub-tickets (e.g. 3 instead of 8). The split is governance, not architecture — it's adjusted to keep PRs reviewable.
3. **Edge case**: if the audit reveals so many issues that Part B is months of work, escalate to the user — perhaps split across multiple sprints or deprioritize.

The pattern rule from SAT01-5's Deviation #1 (`useStaggerOnView` vs `useFadeInOnView`) also belongs in `ui-design-system.md` Common Patterns section eventually — but that's separate from this audit (it's an addition, not a reconciliation). Track via SAT01-2.

## 12. Implementation Verification

Final verification checklist before /verify:

- [ ] **Code Quality**: N/A (no code)
- [ ] **Functionality**: deliverable exists at `ai-specs/changes/dashboard/audit/ui-design-system-2026-05-02/audit-table.md`
- [ ] **Testing**: all checklist items in §6 pass
- [ ] **Integration**: deliverable references the correct source files (no broken paths)
- [ ] **Documentation**: deliverable is in English, matches existing audit report style under `ai-specs/changes/auth/audit/` (informally — there's no formal template for doc audits yet)
- [ ] **No code branch in em-ecosystem-code**: confirm `git status` is clean in the code repo, all changes are in ai-specs

## 13. Module-Level Planning

N/A — this ticket doesn't touch a NexaCore module.

## 14. Satellite App Planning

N/A — this ticket is dashboard UI Core docs reconciliation. Affects future satellites indirectly (via SCRUM-331 dependency) but doesn't touch any satellite code.

---

**Plan ready. Awaiting user approval to proceed to `/develop` SCRUM-329 (Part A only).**
