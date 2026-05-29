# Frontend Implementation Plan: SCRUM-334 Reconcile ui-design-system.md — Form controls (Inputs)

**Detected scope**: `frontend` (docs reconciliation of frontend components — read-only on code, write-only on `ai-specs/specs/ui-design-system.md`)

> **B1 of 9 sub-tickets** from SCRUM-329 Part B reconciliation. Same lifecycle shape as parent (docs-only, no `em-ecosystem-code` branch). Same Accepted-Trivial deviation carries forward — declared once in SCRUM-329 plan/verify, applies to all Part B sub-tickets without re-justification.

## 1. Codebase State Verification (2026-05-02)

- **Sprint**: Sprint 14 (id=477)
- **Module**: `dashboard`
- **Anchors** (this plan and its /develop assume these specific commit states):
  - Code (`em-ecosystem`): `8d2fa80c2a4443560845f785462f42dde0bb7c5c` (audit anchor)
  - Doc (`ai-specs`): `f1b4305` (post-/update-docs of SCRUM-329 — most recent ai-specs main)
- **Files to be read** (read-only inputs):
  - `nexacore-dashboard/src/components/ui/Input.tsx` (line 27 → `inputSpecs`)
  - `nexacore-dashboard/src/components/ui/DateInput.tsx` (line 25 → `dateInputSpecs`)
  - `nexacore-dashboard/src/components/ui/MfaDigitInput.tsx` (line 5 → `mfaDigitInputSpecs`)
  - `nexacore-dashboard/src/components/ui/Checkbox.tsx` (line 29 → `checkboxSpecs`)
  - `nexacore-dashboard/src/components/ui/FormField.tsx` (line 5 → `formFieldSpecs`)
  - `ai-specs/specs/ui-design-system.md` — current content of §16 (line 527), §17 (line 546), §22 (line 653), §25 (line 728), Common Patterns "Input Field" (line 824)
- **File to be written** (single deliverable):
  - `ai-specs/specs/ui-design-system.md` — modified in-place

## 2. Overview

This ticket reconciles the doc with code reality for 5 form-control input components. After this ticket:

- §16 Input Field (Phone), §17 Input Field (Currency), §22 Input Field (Text) are **gone**, replaced by a single unified "Input" section
- §25 Checkboxes is **updated** with indeterminate + 3 sizes + disabled state
- 3 **new sections** exist for DateInput, MfaDigitInput, FormField
- All numbered sections are renumbered to close the gaps left by the deletions (Option A from /enrich-us)
- Common Patterns "Input Field" is updated to reference the new sections instead of duplicating content

Per the design-system source-of-truth rule (feedback memory): every section's edits are presented to the user for approval before being applied to the .md file. /develop pauses at each component for sign-off.

## 3. Architecture Context

This is a docs-only ticket. There is no React component tree, no API integration, no state management, no routing. The "architecture" is just the doc structure:

```
ui-design-system.md
├─ Global Design Tokens (lines 9-122)
├─ Theme System (lines 122-159)
├─ Components
│  ├─ §1 Card (line 161)
│  ├─ §2 Icon Set (line 184)
│  ├─ ...
│  ├─ §16 Input Field (Phone)        ← DELETE
│  ├─ §17 Input Field (Currency)     ← DELETE
│  ├─ §18 Button Set                 ← renumber to §16
│  ├─ §19 Toggle                     ← renumber to §17
│  ├─ §20 Slider                     ← renumber to §18
│  ├─ §21 Pagination                 ← renumber to §19
│  ├─ §22 Input Field (Text)         ← DELETE
│  ├─ §23 Search Field               ← renumber to §20
│  ├─ §24 Toast Message              ← renumber to §21
│  ├─ §25 Checkboxes                 ← renumber to §22 + UPDATE content
│  ├─ §23 Input (NEW unified)        ← INSERT at the end of Components list
│  ├─ §24 DateInput (NEW)            ← INSERT
│  ├─ §25 MfaDigitInput (NEW)        ← INSERT
│  └─ §26 FormField (NEW)            ← INSERT
└─ Common Patterns
   ├─ ...
   ├─ Input Field (line 824)         ← UPDATE to reference new sections
   └─ ...
```

**Final numbered sections**: §1-§26 (was §1-§25 with 3 deletions and 4 additions = net +1).

**Branching exception** (carries forward from SCRUM-329): no `feature/SCRUM-334-frontend` branch in `em-ecosystem-code`. Work directly in `ai-specs/` working tree on `main`. Lifecycle: `/develop` produces edits → `/verify` reviews → `/update-docs` commits to `ai-specs` `main` directly. No `/commit` against `em-ecosystem-code` because there is nothing to commit there. This deviation was Accepted-Trivial in SCRUM-329 verify and applies to all Part B sub-tickets.

## 4. Implementation Steps

### Step 0: No code branch (same deviation as SCRUM-329)

Working directly in `ai-specs/` working tree on `main` branch. The Accepted-Trivial deviation was already documented in SCRUM-329's plan and verify report — no re-justification needed. /verify for this ticket will note "carries forward Accepted-Trivial from parent SCRUM-329" without re-arguing.

### Step 1: Discovery — read all 5 spec exports + capture documented values

- **Files**: read-only — the 5 .tsx files listed in §1
- **Action**: extract the spec export values into a working notes document so each subsequent step has the source-of-truth values without re-reading.
- **Implementation steps**:
  1. Open `Input.tsx`, locate `inputSpecs` at line 27, copy the full object literal
  2. Repeat for DateInput, MfaDigitInput, Checkbox, FormField
  3. Working notes (kept in scratch — does not become a deliverable; just /develop's working memory): one section per spec export with its exact values
- **Notes**: this is a one-shot read pass. If specs change between this step and Step 4 (extremely unlikely in a single /develop session), re-read.

### Step 2: Per-component drafting + user approval (5 sub-steps)

For each component, /develop drafts the proposed section content based on the spec export, presents to the user for approval, and waits for sign-off. Order is intentional — Input first (it's the foundation that DateInput and FormField reference).

#### Step 2a: Draft new unified Input section

- **Action**: from `inputSpecs`, draft a new section titled "Input" matching the §25 Checkboxes template (heading + 1-line desc + Properties table + bold-headed state bullets + `---` divider).
- **Content scope**:
  - Properties table: `size: 'sm' | 'md'`, default `md`; `variant: 'default' | 'filled'`, default `default`
  - Behavior bullets:
    - Sizes: sm = h-10 (40px), md = h-12 (48px)
    - Variant default: white bg + border-default + ring on focus
    - Variant filled: surface-tertiary bg, no border, used in search bars and inline dropdowns
    - leftIcon, rightIcon — slot for lucide icons inside the input (16px)
    - Password toggle: when `type=password`, Eye/EyeOff icon appears as rightIcon, toggles visibility
    - Loading: when `loading=true`, Spinner replaces rightIcon
    - Error state: `error` prop adds bg-error-bg + ring-error-border/40
  - Token references: `--surface-primary`, `--content-primary`, `--border-default`, `--border-error-border`, `--color-error`
- **Present for approval**: show the user the drafted markdown section. Wait for "approved" or feedback.
- **Note on placement**: the new section will eventually live as §23 (per the renumber plan in §3). At drafting time, write with that number — Step 4 will apply.

#### Step 2b: Draft DateInput section

- **Action**: from `dateInputSpecs`, draft a new section titled "DateInput".
- **Content scope**:
  - Properties table: `size: 'sm' | 'md'` (h-10 / h-12), `error?: boolean`
  - Behavior: wraps Input + adds Calendar popover on click; date format in display matches locale; empty state shows placeholder; error state inherits Input error styling
  - Composition note: uses the new Input section's primitives + Calendar (§4)
- **Present for approval**.
- **Placement**: §24 after renumber.

#### Step 2c: Draft MfaDigitInput section

- **Action**: from `mfaDigitInputSpecs`, draft a new section titled "MfaDigitInput".
- **Content scope**:
  - Properties table: `cells?: number` (default 6), `error?: boolean`, `onComplete: (value: string) => void`
  - Behavior:
    - Auto-advance: focus moves to next cell on each keypress
    - Backspace-to-previous: empty cell + backspace moves focus back
    - Paste-to-distribute: pasting an N-digit string fills N cells starting from focus
    - Numeric input only: `inputMode="numeric"` + filtering
    - Error state: cells with error styling (bg-error-bg + ring-error-border)
    - Calls `onComplete` when all cells are filled
  - Token references: same as Input + ring/error tokens
  - Composition note: key MFA flow primitive — explain that this is what users see during /verify-mfa flows
- **Present for approval**.
- **Placement**: §25 after renumber.

#### Step 2d: Update Checkbox section (drift fix)

- **Action**: starting from existing §25 content (lines 728-747), add 3 missing pieces sourced from `checkboxSpecs`.
- **Content additions**:
  - **Indeterminate state** (new bullet group):
    - 20×20 (md size), fill `#1c1c1c`, shadow, radius 5px (same shell as checked)
    - Icon: `Minus` from lucide, 12px stroke 2px `#ffffff` (horizontal line instead of check)
    - With label: same horizontal layout as checked
  - **Size scale** (new Properties row):
    - sm: 16×16, radius 4px (`--radius-xs`)
    - md: 20×20, radius 5px (`--radius-sm`) — current default
    - lg: 24×24, radius 6px (`--radius-md`)
  - **Disabled state** (new bullet group):
    - opacity-50, cursor-not-allowed, no hover ring
    - Combined: disabled+checked still shows the check mark (just visually muted)
- **Preserve**: existing Checked and Unchecked state descriptions stay (just augmented). Token references should be added if missing.
- **Present for approval**: show the diff against existing §25, not the full rewrite.
- **Placement**: §22 after renumber (was §25; renumbered down due to §16/§17/§22 deletions — note: source §22 deletion shifts §23, §24, §25 each down by 1, then §16/§17 deletion shifts §18-§25 each down by 2 more — net §25 → §22).

#### Step 2e: Draft FormField section

- **Action**: from `formFieldSpecs`, draft a new section titled "FormField".
- **Content scope**:
  - Properties table: `label?: string`, `htmlFor?: string`, `error?: string | undefined`, `required?: boolean`, `children: ReactNode` (the control)
  - Behavior:
    - Composition wrapper: stacks label (top) + control (middle) + InlineError (bottom, conditional)
    - Spacing: gap-1.5 between label and control, gap-1 between control and error
    - When `required`, adds `*` indicator after label text in `--color-error`
    - When `error` is set, applies error styling cascade to control via context (or className passthrough — verify in spec)
  - Composition note: this is the canonical wrapper for ALL input-like primitives in forms. When in doubt, wrap with FormField.
  - Token references: `--content-primary` (label), `--color-error` (required + error)
- **Present for approval**.
- **Placement**: §26 after renumber.

### Step 3: Apply the renumber pass (after all 5 components approved in Step 2)

- **File**: `ai-specs/specs/ui-design-system.md`
- **Action**: execute the section renumber documented in §3 of this plan.
- **Implementation steps**:
  1. **Delete** §16 Input Field (Phone) — lines 527-545 (verify exact end during edit)
  2. **Delete** §17 Input Field (Currency) — lines 546-565
  3. **Delete** §22 Input Field (Text) — lines 653-667 (verify exact end)
  4. **Renumber** remaining sections: §18 → §16, §19 → §17, §20 → §18, §21 → §19, §23 → §20, §24 → §21, §25 → §22 (the existing Checkboxes section)
  5. Verify: `grep '^### \d+\.' ui-design-system.md` should show §1 through §22 sequentially with no gaps
- **Notes**:
  - This step does NOT yet add the new sections — those land in Step 4. Step 3 just does the deletions and renumbers.
  - Decision rule: if any internal cross-reference (text like "see §17" within the doc) exists, fix it. Pre-/develop grep for `§\d+` confirmed there are 0 such cross-references; if any are found during /develop, fix them.

### Step 4: Insert the 4 new/updated sections at the end of Components list

- **File**: `ai-specs/specs/ui-design-system.md`
- **Action**: append the new sections after the renumbered §22 Checkboxes (which is BEFORE the `## Common Patterns` divider).
- **Implementation steps**:
  1. Insert new §23 Input (drafted in Step 2a, approved)
  2. Insert new §24 DateInput (drafted in Step 2b, approved)
  3. Insert new §25 MfaDigitInput (drafted in Step 2c, approved)
  4. Insert new §26 FormField (drafted in Step 2e, approved)
  5. Verify the §22 Checkboxes update from Step 2d is applied at its renumbered location
  6. Each new section ends with `---` divider; the last section before `## Common Patterns` should still have the divider
- **Notes**: the order matches the dependency order — Input is foundational (DateInput and FormField reference it).

### Step 5: Update Common Patterns "Input Field" subsection

- **File**: `ai-specs/specs/ui-design-system.md` (around line 824 — verify with grep at /develop time)
- **Action**: rewrite the subsection to reference the new component sections instead of duplicating their content.
- **Content rule** (from /enrich-us decision tree):
  - **Keep**: cross-cutting form composition guidance (label-input-error stack, spacing rules, error-message style cross-reference)
  - **Reference**: link to new §23 Input section for component-level details ("for prop and variant details, see §23 Input"), link to new §26 FormField as the canonical wrapper
  - **Remove**: pixel-specific or variant-specific values that now live in component sections (no duplication)
- **Implementation steps**:
  1. Read the current Common Patterns "Input Field" subsection
  2. Identify which content is composition guidance (KEEP) vs component spec (REMOVE — now lives in §23/§26)
  3. Rewrite as a leaner subsection focused on composition, with cross-references
  4. Present diff to user for approval before applying
- **Notes**: this step is the easiest to under- or over-do. The principle is: Common Patterns answers "how do I build a form?", component sections answer "what is this primitive?".

### Step 6: Build verification (grep-based AC checks)

- **Action**: execute the AC checkpoints from the enriched ticket description as automated grep checks.
- **Implementation steps**:
  ```bash
  cd ai-specs/ai-specs/specs
  # AC1: §16, §17, §22 (old) are gone
  grep -E '^### (16\. Input Field \(Phone\)|17\. Input Field \(Currency\)|22\. Input Field \(Text\))' ui-design-system.md
  # Expected: 0 matches

  # AC2: New unified Input section exists
  grep -cE '^### \d+\. Input$' ui-design-system.md
  # Expected: 1

  # AC3: New sections for DateInput, MfaDigitInput, FormField exist
  grep -E '^### \d+\. (DateInput|MfaDigitInput|FormField)$' ui-design-system.md
  # Expected: 3 matches

  # AC4: Checkbox section includes "indeterminate", "sizes", "disabled" keywords
  awk '/^### \d+\. Checkboxes/,/^---$/' ui-design-system.md | grep -ciE '(indeterminate|sm.*md.*lg|disabled)'
  # Expected: ≥3

  # AC5: Section numbering is continuous (no gaps)
  grep -E '^### \d+\.' ui-design-system.md | grep -oE '\d+' | awk 'BEGIN{prev=0} {if ($1 != prev+1) print "GAP at " $1; prev=$1} END{print "max="prev}'
  # Expected: no "GAP" lines, max=26 (or similar after renumber)
  ```
- **Notes**: these checks are mechanical and can be re-run by /verify.

### Step 7: Update Technical Documentation

This step is the same as the standard "update technical documentation" step. The deliverable IS the documentation update for this ticket — `ui-design-system.md` is being modified directly. No `data-model.md`, `api-spec.yml`, or standards files need updates.

## 5. Implementation Order

```
── /develop phase (LOCAL, ai-specs working tree on main, no em-ecosystem-code branch) ──
Step 0   No branch (carry-forward Accepted-Trivial from SCRUM-329)
Step 1   Read 5 spec exports + capture working notes (~20 min)
Step 2a  Draft Input → user approval                                      ┐
Step 2b  Draft DateInput → user approval                                  │
Step 2c  Draft MfaDigitInput → user approval                              ├─ ~5-7 review cycles
Step 2d  Draft Checkbox update → user approval                            │  with user
Step 2e  Draft FormField → user approval                                  ┘
Step 3   Apply renumber pass (§16/§17/§22 deletions + shift)
Step 4   Insert 4 new/updated sections at end of Components list
Step 5   Update Common Patterns "Input Field" → user approval (final review)
Step 6   Build verification (5 grep AC checks)
         ── /develop ends — user reviews final doc state ──

── /verify phase (review the deliverable + AC grep checks) ──
- Confirm 6 grep AC checks all pass
- User signs off on the final doc state
- Verify report records "carry-forward Accepted-Trivial from SCRUM-329" for Step 0

── /update-docs phase (commit deliverable to ai-specs main) ──
- Stage: ai-specs/specs/ui-design-system.md, ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-334_frontend.md, ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-334_verify.md, ai-specs/changes/dashboard/records/Sprint 14/SCRUM-334_frontend.md
- Commit: docs(SCRUM-334): reconcile Form controls (Inputs) cluster
- Push to origin/main
```

**Estimated effort**: ~1.5h with user available for approval gates. Could split into 2 sessions (Steps 1-2 in session 1, Steps 3-7 in session 2) if user is busy.

## 6. Testing Checklist

- [ ] All 5 components have a corresponding section in the doc (4 new + 1 updated)
- [ ] §16, §17, §22 (old Input Field variants) are gone
- [ ] Section numbering is continuous (Step 6 grep returns "no gaps, max=26")
- [ ] Every documented value traces back to a spec export (spot-check 3 random claims by reading the cited spec export — same /verify rule as SCRUM-329)
- [ ] Common Patterns "Input Field" no longer duplicates component-level details; references new sections
- [ ] Doc passes `markdownlint` (if applicable; otherwise: visual scan for malformed tables, missing dividers, broken markdown)
- [ ] Spot-check: render the doc in a markdown viewer; visual layout matches the rest of the doc (no orphan sections, no broken tables)

## 7. Error Handling Patterns

N/A — the deliverable is a markdown doc edit. No runtime errors.

If a spec export is missing a documented field (e.g., the spec doesn't include the password toggle behavior), surface it as a separate ticket rather than inferring. The audit table's row notes for these components are conservative; if a feature exists in code but not in spec, document it but flag for spec-export augmentation in a follow-up.

## 8. UI/UX Considerations

N/A — docs change. The visual quality of the doc itself matters (consistent table format, consistent section structure, no orphan content), but there's no user-facing UI in this ticket.

## 9. Dependencies

- Read access to the 5 component .tsx files
- Write access to `ai-specs/specs/ui-design-system.md`
- User availability for ~5-7 approval gates during /develop
- No npm packages, no test frameworks. Standard editor tooling.

## 10. Notes

- **The user-approval rule is non-negotiable**. Per the feedback memory rule "Design System is the single source of truth → edits to ui-design-system.md require explicit user approval", /develop MUST pause for sign-off at each component before applying. Bulk-applying without per-section approval breaks the rule.
- **Spec exports are authoritative**. If a behavior is in JSX but not in the spec export, it's not documented in this ticket — flag for follow-up to extend the spec export.
- **Renumber is a one-shot**. Once Step 3 runs, the section numbers in Steps 4 and 5 must use the new numbering. Do not interleave the renumber with the inserts.
- **Common Patterns reconciliation is the trickiest step** (Step 5). Easy to under-edit (leave duplicated content) or over-edit (delete useful composition guidance). The decision rule from /enrich-us is the guide.
- **English content only**.

## 11. Next Steps After Implementation

After /update-docs commits SCRUM-334's edits, the next sub-ticket of SCRUM-329 Part B is **B2 — Form controls (other)** which covers Toggle (drift), Slider (drift), and Select (rename §7 Dropdown → "Context Menu" Doc-only + add new Select section). B2 will be opened as SCRUM-335 only after SCRUM-334 closes — single-ticket-at-a-time pacing per the user's "validate the workflow before bulk-creating" choice.

## 12. Implementation Verification

Final verification checklist before /verify:

- [ ] **Code Quality**: N/A (no code changes)
- [ ] **Functionality**: deliverable is `ui-design-system.md` with all 5 components properly documented
- [ ] **Testing**: Step 6 grep checks all pass
- [ ] **Integration**: section numbering is continuous; no orphan cross-references
- [ ] **Documentation**: deliverable IS the doc; written in English; matches existing section convention (verified visually)
- [ ] **No code branch in em-ecosystem-code**: confirm `git status` is clean in the code repo, all changes are in `ai-specs`

## 13. Module-Level Planning

N/A — this ticket doesn't touch a NexaCore module.

## 14. Satellite App Planning

N/A — this is dashboard UI Core docs reconciliation. Affects future satellites indirectly (when they consume the design system) but doesn't touch any satellite code.

---

**Plan ready. Awaiting user approval to proceed to `/develop SCRUM-334`.**
