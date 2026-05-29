# Frontend Implementation Plan: SCRUM-335 Reconcile ui-design-system.md — Form controls (other)

**Detected scope**: `frontend` (docs reconciliation of frontend components — read-only on code, write-only on `ai-specs/specs/ui-design-system.md`)

> **B2 of 9 sub-tickets** from SCRUM-329 Part B reconciliation. Sibling of SCRUM-334 (B1, completed). Same lifecycle adaptation as parent (docs-only, no `em-ecosystem-code` branch). Accepted-Trivial deviation declared in SCRUM-329, validated through SCRUM-334 — carries forward without re-justification.

## 1. Codebase State Verification (2026-05-02)

- **Sprint**: Sprint 14 (id=477)
- **Module**: `dashboard`
- **Anchors** (this plan and its /develop assume these specific commit states):
  - Code (`em-ecosystem`): `8d2fa80c2a4443560845f785462f42dde0bb7c5c` (post-SAT01-5 round 2 — unchanged since SCRUM-334)
  - Doc (`ai-specs`): `f875672` (post-/update-docs of SCRUM-334)
- **Files to be read** (read-only inputs):
  - `nexacore-dashboard/src/components/ui/Toggle.tsx` (line 15 → `toggleSpecs`)
  - `nexacore-dashboard/src/components/ui/Slider.tsx` (line 17 → `sliderSpecs`)
  - `nexacore-dashboard/src/components/ui/Select.tsx` (line 23 → `selectSpecs`)
  - `ai-specs/specs/ui-design-system.md` — current content of §7 (line 304), §17 (line 554), §18 (line 574)
- **File to be written** (single deliverable):
  - `ai-specs/specs/ui-design-system.md` — modified in-place

## 2. Overview

This ticket reconciles 3 form-control components and resolves Ambiguity 3 from the SCRUM-329 audit. After this ticket:

- §7 is **renamed** "Dropdown" → "Context Menu" with a Doc-only annotation (preserves the spec for future ContextMenu component implementation)
- §17 Toggle is **augmented** with sm and lg sizes (md was already aligned per audit — verify; full rewrite if drift found)
- §18 Slider is **rewritten** to use token-based values from `sliderSpecs` (current values are pixel/hex from Figma kit)
- New §27 Select section is **added** at end of Components list (resolves the conflation with §7 Dropdown)

Per the design-system source-of-truth rule: every section's edits are presented to the user for approval before being applied. /develop pauses at each component for sign-off — 4 gates total (vs 6 in B1).

## 3. Architecture Context

Doc structure post-B1 (the starting state):

```
ui-design-system.md (post-/update-docs of SCRUM-334)
├─ Global Design Tokens
├─ Theme System
├─ Components
│  ├─ §1 Card
│  ├─ ...
│  ├─ §7 Dropdown                    ← RENAME to "Context Menu" + Doc-only annotation
│  ├─ §8 Analytics Graph
│  ├─ ...
│  ├─ §17 Toggle                     ← AUGMENT with sm/lg sizes (or REWRITE if drift)
│  ├─ §18 Slider                     ← REWRITE using sliderSpecs
│  ├─ ...
│  ├─ §26 FormField (last after B1)
│  └─ §27 Select (NEW)               ← INSERT before `## Common Patterns`
└─ Common Patterns
```

**Final numbered sections after B2**: §1-§27 (was §1-§26 after B1, +1 from new Select). Numbering stays continuous — no deletions, no renumber pass needed.

**Branching exception** (carries forward from SCRUM-329 → SCRUM-334): no `feature/SCRUM-335-frontend` branch in `em-ecosystem-code`. Work directly in `ai-specs/` working tree on `main`. Lifecycle: `/develop` produces edits → `/verify` reviews → `/update-docs` commits to `ai-specs` `main` directly.

## 4. Implementation Steps

### Step 0: No code branch (carry-forward Accepted-Trivial)

Working directly in `ai-specs/` working tree on `main` branch. Same Accepted-Trivial deviation declared in SCRUM-329's plan, validated through SCRUM-334's verify. No re-justification needed — /verify will note "carry-forward Accepted-Trivial from SCRUM-329 / SCRUM-334".

### Step 1: Discovery — read 3 spec exports + 3 existing doc sections

- **Files**: read-only — the 3 .tsx files + the 3 doc sections at lines 304, 554, 574
- **Action**: extract the spec export values AND the current state of §7, §17, §18 into working notes. /develop's drafting steps depend on knowing both (the source-of-truth in code AND what's currently in the doc, to decide augment vs rewrite).
- **Implementation steps**:
  1. Open `Toggle.tsx`, locate `toggleSpecs` at line 15, copy values
  2. Open `Slider.tsx`, locate `sliderSpecs` at line 17, copy values
  3. Open `Select.tsx`, locate `selectSpecs` at line 23, copy values
  4. Read existing §7 (line 304 — to know what content to preserve in the rename)
  5. Read existing §17 Toggle (line 554 — to confirm md is aligned, or detect drift)
  6. Read existing §18 Slider (line 574 — confirms drift severity)
- **Notes**: working notes are scratch — do not become a deliverable. Just /develop's working memory.

### Step 2: Per-component drafting + user approval (4 sub-steps)

Order matters for clarity (per /enrich-us recommendation): structural first → augment → rewrite → new addition.

#### Step 2a: §7 Context Menu rename + Doc-only annotation (FIRST — cheapest)

- **Action**: change §7 heading from "7. Dropdown" → "7. Context Menu" and prepend a Doc-only blockquote callout. Existing 6-item context menu spec content stays unchanged (preserves the future-component baseline).
- **Annotation text** (per /enrich-us decision):

  ```
  > **Doc-only — pending implementation.** This section describes a 6-item right-click context menu pattern (Edit / Duplicate / Archive / etc., plus a Delete item). No corresponding `ContextMenu` component exists in code yet. The spec is preserved as a forward-looking design baseline; when the component is built, this section will be reconciled with `contextMenuSpecs` (or equivalent export) at that time. Originally documented as "Dropdown" — renamed to disambiguate from the form-input `Select` component (now §27).
  ```

- **Present for approval**: show the rename + callout text. Wait for sign-off.
- **Note**: the existing §7 content (6-item list with Edit/Duplicate/Archive/Delete, dimensions in pixels) intentionally stays as-is. It's pending-component spec, not aligned with code.

#### Step 2b: §17 Toggle augmentation

- **Action**: from `toggleSpecs`, augment the existing §17 with sm and lg size rows (md already documented per audit). If existing §17 is found to also have drift in md (e.g., pixel/hex values for the existing md row), do a full rewrite using the same template as B1's §22 Checkboxes — same Accepted-Trivial pattern.
- **Decision branch**:
  - If existing §17 md is token-based and matches `toggleSpecs.md` → augment with sm + lg rows in Properties table (additive)
  - If existing §17 md uses Figma-era pixel/hex values → full rewrite using `toggleSpecs` (same pattern as B1 §22 Checkboxes; document as Accepted-Trivial)
- **Content scope** (from `toggleSpecs`):
  - 3 sizes: sm 32×18, md 40×22 (default), lg 48×26 (or whatever values toggleSpecs exports — read at /develop time)
  - States: on (track filled), off (track empty), disabled (opacity reduced), focus (outline)
  - Token references: `--surface-primary`, `--surface-inverse`, `--content-primary`, `--content-inverse`
- **Present for approval**: show either the augmented Properties table OR the full rewrite, with rationale for which path was chosen.

#### Step 2c: §18 Slider rewrite (full)

- **Action**: full rewrite using `sliderSpecs`. Drift across all visual values (track 167×3 → 8px h-2; thumb 18×18 stroke 3px #000000 → 16×16 border-2). Existing §18 has Figma kit values that don't reflect current code.
- **Content scope** (from `sliderSpecs`):
  - Properties table: track height, thumb size, range vs single-value
  - States: default, hover, focus, disabled
  - Behavior: drag, click-to-jump, keyboard arrow-key step, touch gestures
  - Range slider variant (if exposed): two thumbs, progress fill between them
  - Token references: `--surface-primary`, `--surface-inverse`, `--border-components`, `--content-primary`
- **Present for approval**: full new content. Largest single component edit in B2.

#### Step 2d: §27 Select section addition (new)

- **Action**: from `selectSpecs`, draft a new section titled "Select". Insert at end of Components list (after §26 FormField, before `## Common Patterns` divider at line 907 anchor).
- **Content scope** (from `selectSpecs`):
  - Trigger button: h-10 rounded-md, flex items-center gap-2 (Input-like default style minus the input field), shows current value or placeholder
  - Dropdown popover: rounded-xl p-6, shadow-card, anchored below trigger
  - Items: rounded-md h-10
  - Item variants: default (text-content-primary), selected (bg-surface-inverse text-content-inverse — current-value indicator), danger (text-error — destructive options)
  - Behavior: click trigger to open, click outside or Escape to close, click item to select
  - Accessibility: role="listbox", aria-selected on selected item, keyboard arrow navigation
  - Token references: `--surface-primary`, `--surface-inverse`, `--content-primary`, `--content-inverse`, `--color-error`, `--border-components`
- **Composition note**:
  - Pair with §26 FormField when used in forms
  - Distinguish from §7 Context Menu (with the new disambiguation, this is the form-input dropdown)
- **Present for approval**: full new content.

### Step 3: Apply approved edits to `ui-design-system.md`

- **File**: `ai-specs/specs/ui-design-system.md`
- **Action**: apply the 4 approved drafts in the order they were approved (matches /develop's approval order).
- **Implementation steps**:
  1. Edit §7 heading + prepend callout (line 304 region)
  2. Edit §17 Properties table (or full rewrite if drift) (line 554 region)
  3. Replace §18 content with rewrite (line 574 region)
  4. Insert new §27 Select section before `## Common Patterns` (anchor: line 907 — `## Common Patterns` heading)
- **Notes**:
  - Steps 3.1-3.4 are 4 separate Edit operations. Each old_string is the existing section content; each new_string is the approved draft.
  - For Step 3.4 (insert §27), the anchor is the `---` divider before `## Common Patterns`, OR the §26 FormField content + closing divider.

### Step 4: Build verification (7 grep AC checks)

- **Action**: execute the 7 AC checkpoints from the enriched ticket as automated grep checks.
- **Implementation steps**:
  ```bash
  cd ai-specs/ai-specs/specs

  # AC1: §7 heading reads "Context Menu" (not "Dropdown")
  grep -c '^### 7\. Context Menu' ui-design-system.md   # expected: 1
  grep -c '^### 7\. Dropdown' ui-design-system.md       # expected: 0

  # AC2: §7 has a Doc-only annotation
  awk '/^### 7\./,/^---$/' ui-design-system.md | grep -ciE '(Doc-only|pending implementation)'   # expected: ≥1

  # AC3: §17 Toggle Properties table contains 3 sizes
  awk '/^### 17\. Toggle/,/^---$/' ui-design-system.md | grep -ciE '(sm|md|lg)'   # expected: ≥3

  # AC4: §18 Slider section uses tokens, not hex colors
  awk '/^### 18\. Slider/,/^---$/' ui-design-system.md | grep -ciE '(rounded-full|border-2|border-border-components|surface-)'   # expected: ≥1
  awk '/^### 18\. Slider/,/^---$/' ui-design-system.md | grep -ciE '#[0-9a-f]{6}'   # expected: 0

  # AC5: §27 Select section exists
  grep -c '^### 27\. Select' ui-design-system.md   # expected: 1

  # AC6: Section numbering continuous §1-§27 (no gaps)
  grep -E '^### [0-9]+\.' ui-design-system.md | grep -oE '[0-9]+' | awk 'BEGIN{prev=0} {if ($1 != prev+1) print "GAP at " $1; prev=$1} END{print "max="prev}'
  # expected: no GAP, max=27

  # AC7 (manual spot-check during /verify): every documented value in §17/§18/§27 traces back to a spec export
  ```

### Step 5: Update Technical Documentation

The deliverable IS the documentation update. No `data-model.md`, `api-spec.yml`, or standards files need updates.

## 5. Implementation Order

```
── /develop phase (LOCAL, ai-specs working tree on main, no em-ecosystem-code branch) ──
Step 0   No branch (carry-forward Accepted-Trivial)
Step 1   Read 3 spec exports + 3 existing doc sections (~15 min)
Step 2a  Draft §7 rename + Doc-only callout → user approval        ┐
Step 2b  Draft §17 Toggle augment (or rewrite) → user approval     ├─ ~4 review cycles
Step 2c  Draft §18 Slider rewrite → user approval                  │  with user
Step 2d  Draft §27 Select addition → user approval                 ┘
Step 3   Apply 4 edits to ui-design-system.md (in approval order)
Step 4   Build verification (7 grep AC checks)
Step 5   (covered by Step 3)
         ── /develop ends — user reviews final doc state ──

── /verify phase (review the deliverable + AC grep checks) ──
- Confirm 7 grep AC checks all pass
- Audit cluster resolution table (4 audit-table.md rows resolved: §7 ambiguity, Toggle row 46, Slider row 39, Select row 37)
- User signs off on the final doc state
- Verify report records "carry-forward Accepted-Trivial from SCRUM-329/SCRUM-334" for Step 0

── /update-docs phase (commit deliverable to ai-specs main) ──
- Stage: ai-specs/specs/ui-design-system.md, plan, verify, record
- Commit: docs(SCRUM-335): reconcile Form controls (other) cluster — B2 of SCRUM-329 Part B
- Push to origin/main
```

**Estimated effort**: ~1h /develop with 4 user-approval gates. Faster than B1 because fewer components and §7 rename is structural-only (1 callout). Could split into 1 session.

## 6. Testing Checklist

- [ ] §7 heading reads "Context Menu" (AC1 passes)
- [ ] §7 has the Doc-only annotation with required keywords (AC2 passes)
- [ ] §17 Toggle Properties table contains all 3 sizes (AC3 passes)
- [ ] §18 Slider uses tokens, no hex colors (AC4 passes)
- [ ] §27 Select section exists (AC5 passes)
- [ ] Section numbering continuous §1-§27 (AC6 passes)
- [ ] Spot-check 2-3 random claims in §17/§18/§27 against spec exports (AC7 manual)
- [ ] Visual scan: render the doc, confirm sections look like §22-§26 from B1 (consistent template)
- [ ] No internal cross-reference broken (B1 introduced §23-§26 cross-refs; B2 may add §26 / §27 cross-refs in §27 Select's composition note)

## 7. Error Handling Patterns

N/A — markdown doc edit. If a spec export is missing a documented field (e.g., the spec doesn't include the "selected" item variant for Select), surface as a separate ticket — don't infer.

## 8. UI/UX Considerations

N/A — docs change.

## 9. Dependencies

- Read access to the 3 component .tsx files
- Write access to `ai-specs/specs/ui-design-system.md`
- User availability for ~4 approval gates during /develop
- No npm packages, no test frameworks. Standard editor tooling.

## 10. Notes

- **The user-approval rule is non-negotiable**. /develop MUST pause for sign-off at each component before applying edits.
- **Spec exports are authoritative** for §17/§18/§27. §7 is exempt (Doc-only — no code source).
- **No renumber pass needed** in B2. Only 1 addition (§27) and section numbering remains continuous. This is simpler than B1's renumber-pass.
- **§7 content stays unchanged** apart from the heading rename and prepended callout. Resist the urge to update §7's pixel/hex values — those are the future-component baseline, not drift to fix.
- **English content only**.

## 11. Next Steps After Implementation

After /update-docs commits SCRUM-335's edits, the next sub-ticket of SCRUM-329 Part B is **B3 — Navigation drift** (Tabs, Pagination, Breadcrumbs, SidebarNav). B3 will be opened only after SCRUM-335 closes — single-ticket-at-a-time pacing per user choice.

## 12. Implementation Verification

Final verification checklist before /verify:

- [ ] **Code Quality**: N/A (no code changes)
- [ ] **Functionality**: deliverable is `ui-design-system.md` with §7 renamed, §17 augmented, §18 rewritten, §27 added
- [ ] **Testing**: Step 4's 7 grep AC checks all pass
- [ ] **Integration**: section numbering continuous; no orphan cross-references; the new §27 Select cross-refs §26 FormField (must verify §26 still exists at the right position post-B2)
- [ ] **Documentation**: deliverable IS the doc; written in English; matches existing section convention
- [ ] **No code branch in em-ecosystem-code**: confirm `git status` is clean in the code repo, all changes are in `ai-specs`

## 13. Module-Level Planning

N/A — this ticket doesn't touch a NexaCore module.

## 14. Satellite App Planning

N/A — dashboard UI Core docs reconciliation only.

---

**Plan ready. Awaiting user approval to proceed to `/develop SCRUM-335`.**
