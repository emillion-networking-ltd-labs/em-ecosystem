# Frontend Implementation Plan: SCRUM-337 Reconcile ui-design-system.md — Modals + Overlays cluster

**Detected scope**: `frontend` (docs reconciliation of frontend components — read-only on code, write-only on `ai-specs/specs/ui-design-system.md`)

> **B4 of 9 sub-tickets** from SCRUM-329 Part B reconciliation. Sibling of SCRUM-334 (B1), SCRUM-335 (B2), SCRUM-336 (B3) — all completed. 4th application of carry-forward Accepted-Trivial pattern. Most structurally complex Part B sub-ticket so far: 2 in-place rewrites + 2 deletes + renumber pass + 2 new sections.

## 1. Codebase State Verification (2026-05-02)

- **Sprint**: Sprint 14 (id=477)
- **Module**: `dashboard`
- **Anchors**:
  - Code (`em-ecosystem`): `8d2fa80c` (post-SAT01-5 round 2 — unchanged through B1+B2+B3)
  - Doc (`ai-specs`): `736c0df` (post-/update-docs of SCRUM-336)
- **Files to be read** (read-only inputs):
  - `nexacore-dashboard/src/components/ui/ConfirmModal.tsx` (line 8 → `confirmModalSpecs`)
  - `nexacore-dashboard/src/components/ui/IdleWarningModal.tsx` (NO spec export — JSX read mandatory; ~28 lines)
  - `nexacore-dashboard/src/components/ui/Tooltip.tsx` (line 26 → `tooltipSpecs`)
  - `nexacore-dashboard/src/components/ui/CommandPalette.tsx` (line 28 → `commandPaletteSpecs`)
  - `nexacore-dashboard/src/components/ui/SearchTrigger.tsx` (line 6 → `searchTriggerSpecs`)
  - `ai-specs/specs/ui-design-system.md` — current content of §5 (line 323), §9 (line 484), §11 (line 556), §20 (line 858)
- **File to be written**: `ai-specs/specs/ui-design-system.md` (modified in-place)

## 2. Overview

Reconciles 5 Modal-and-Overlay components plus resolves Ambiguity 1 from the SCRUM-329 audit (drops §9 Search Results + §20 Search Field, replaces with new CommandPalette section). After this ticket:

- **§5 Modal**: rewritten as ConfirmModal-focused — title kept as "Modal" per /enrich-us Decision A
- **§9 Search Results**: deleted (Ambiguity 1 resolution — no matching code)
- **§11 Tooltip**: rewritten with token-based values, 5 positions, viewport-edge auto-detect
- **§20 Search Field**: deleted (Ambiguity 1 resolution — was originally §23 in audit, renumbered by B1)
- **NEW §26 IdleWarningModal**: separate section (per /enrich-us Decision B) — JSX-sourced (no spec export — first such case in Part B)
- **NEW §27 CommandPalette**: with SearchTrigger as sub-section — replaces deleted §9/§20 conceptually

Final section count: **§1–§27** (-2 deletes + 2 inserts + renumber to close gaps).

Per the design-system source-of-truth rule, /develop pauses for sign-off at each component — 5 gates total (Tooltip / ConfirmModal / IdleWarningModal / CommandPalette+SearchTrigger / confirm-deletes).

## 3. Architecture Context

```
ui-design-system.md (post-/update-docs of SCRUM-336)
├─ §1-§4 (untouched)
├─ §5 Modal                          ← REWRITE in place (ConfirmModal-focused, title kept)
├─ §6-§8 (untouched)
├─ §9 Search Results                 ← DELETE (Ambiguity 1)
├─ §10 Breadcrumbs (untouched)
├─ §11 Tooltip                       ← REWRITE in place
├─ §12-§19 (untouched, includes B1+B2+B3 work)
├─ §20 Search Field                  ← DELETE (Ambiguity 1)
├─ §21-§27 (untouched)
└─ ## Common Patterns
```

After deletes + renumber + inserts, doc structure is:
```
§1-§4 (untouched)
§5 Modal (rewritten ConfirmModal)
§6-§8 (untouched)
§9 Breadcrumbs (renumbered from §10)
§10 Tooltip (renumbered from §11, rewritten)
§11 Quick Notification (renumbered from §12)
§12 Payment Form (renumbered from §13)
§13 Speedometer (renumbered from §14)
§14 Notification (renumbered from §15)
§15 Button Set (renumbered from §16)
§16 Toggle (renumbered from §17)
§17 Slider (renumbered from §18)
§18 Pagination (renumbered from §19)
§19 Toast Message (renumbered from §21 — skips deleted §20)
§20 Checkboxes (renumbered from §22)
§21 Input (renumbered from §23)
§22 DateInput (renumbered from §24)
§23 MfaDigitInput (renumbered from §25)
§24 FormField (renumbered from §26)
§25 Select (renumbered from §27)
§26 IdleWarningModal (NEW)
§27 CommandPalette (NEW, with SearchTrigger sub-section)
```

**Branching exception**: 4th application of carry-forward Accepted-Trivial. No `feature/SCRUM-337-frontend` branch in `em-ecosystem-code`. Convention crystallized.

## 4. Implementation Steps

### Step 0: No code branch (carry-forward Accepted-Trivial)

Working directly in `ai-specs/` working tree on `main`. No re-justification needed.

### Step 1: Discovery — read 4 spec exports + IdleWarningModal JSX + 4 existing doc sections

- **Files**: read-only — 5 .tsx files + 4 doc sections
- **Action**: extract spec values + IdleWarningModal full JSX + current doc state into working notes.
- **Implementation steps**:
  1. Open `ConfirmModal.tsx`, locate `confirmModalSpecs` (line 8), copy values
  2. Open `IdleWarningModal.tsx`, **read entire file (~28 lines)** — no spec export, JSX is the source of truth
  3. Open `Tooltip.tsx`, locate `tooltipSpecs` (line 26), copy values
  4. Open `CommandPalette.tsx`, locate `commandPaletteSpecs` (line 28), copy values + scan JSX for keyboard nav details
  5. Open `SearchTrigger.tsx`, locate `searchTriggerSpecs` (line 6), copy values
  6. Read existing §5 (line 323), §9 (line 484), §11 (line 556), §20 (line 858) for context

### Step 2: Per-component drafting + user approval (5 sub-steps)

Order matters per /enrich-us recommendation: smallest first → most-cross-referenced last → confirm-deletes at end.

#### Step 2a: Draft §11 Tooltip rewrite (FIRST — smallest)

- **Action**: from `tooltipSpecs`, draft a full rewrite. Drift items:
  - Doc says body radius 4px (`--radius-xs`); code uses `rounded-lg` (8px)
  - Doc says padding 20/16; code uses `px-4 py-3` (16/12)
  - Doc says title 16px/700; code uses `text-caption font-normal` (≈12px)
  - Doc says arrow 17×17 rectangle radius 2px; code uses 8×8 rotate-45 with border
- **Content scope**: 5 positions (top/bottom/left/right/auto with viewport-edge detection), hover delay 200ms, portal rendering via createPortal
- **Present for approval**: Gate 1.

#### Step 2b: Draft §5 Modal rewrite (ConfirmModal-focused, title kept)

- **Action**: from `confirmModalSpecs`, draft a full rewrite. Title stays "Modal" per /enrich-us Decision A.
- **Content scope**:
  - 4 sizes (sm 390 / md 480 / lg 600 / xl 720 — `max-w-*`)
  - 2 variants (primary / danger) — affects confirm button only
  - Container: rounded-xl (12px), border-border-strong, bg-surface-primary, shadow-card, p-6
  - Behavior: focus trap on open, autofocus rules, Escape closes, Enter submits primary action
  - X close button (top-right, IconButton)
  - Composition: title (optional, text-h2) + description (optional, text-body text-content-secondary) + 1-2 action buttons
  - Cross-reference forward to §26 IdleWarningModal as 'specialized variant' for idle session warning UX
- **Present for approval**: Gate 2.

#### Step 2c: Draft §26 IdleWarningModal addition (JSX-sourced, no spec export)

- **Action**: from `IdleWarningModal.tsx` JSX directly (no spec export), draft a new section. **First case in Part B without a spec export — disclose honestly in the section.**
- **Content scope**:
  - Container: w-[340px] (fixed width — does NOT use ConfirmModal's size scale)
  - Modal shell: `flex flex-col items-center gap-4 rounded-xl border border-border-strong bg-surface-secondary p-6 shadow-card`
  - Background overlay: `bg-[var(--overlay)]` (custom CSS var declared in globals.css)
  - Composition: CountdownTimer (variant=warning, size=lg) + body text + Button (fullWidth, autoFocus, "Keep me signed in")
  - Behavior: NO focus trap, NO Escape close, NO outside click — intentional for idle UX (user must actively keep session alive, not dismiss passively)
  - Cross-reference to §5 Modal (the generic confirm modal pattern; §26 is specialized for idle session warning)
  - **Honest disclosure**: "this section sources from JSX directly because IdleWarningModal.tsx exports no spec object. Future code-side cleanup could add `idleWarningModalSpecs` to align with the rest of the catalog."
- **Present for approval**: Gate 3.

#### Step 2d: Draft §27 CommandPalette + SearchTrigger sub-section (largest in B4)

- **Action**: from `commandPaletteSpecs` (line 28) + `searchTriggerSpecs` (line 6), draft a single section with SearchTrigger as a sub-section within. Per Ambiguity 1 resolution, this section replaces the deleted §9/§20 conceptually.
- **Content scope**:
  - Cmd+K dialog (cmdk library)
  - Layout: full-screen overlay, centered modal, search input at top, grouped results below, footer with kbd shortcuts
  - Groups: 'Quick navigation', 'Users' (search), 'Actions' — extensible via items config
  - Behavior: open via Cmd+K (Ctrl+K on non-Mac) global keybind OR via SearchTrigger click; close via Escape or outside click; arrow keys + Enter to navigate + activate
  - **Sub-section: SearchTrigger** — h-8 rounded-md, Search icon + 'Search...' label + kbd Badge. Same shell as Button outline sm. Sourced from `searchTriggerSpecs`.
- **Present for approval**: Gate 4.

#### Step 2e: Confirm §9 Search Results + §20 Search Field deletes

- **Action**: explicit user confirmation that both sections can be deleted. Per Ambiguity 1 resolution at SCRUM-329 enrich-us, this was already accepted. Re-confirm at /develop time as a defensive checkpoint.
- **Content**: show each section's current content (so user sees what's being removed) and the rationale (no matching code, replaced by new CommandPalette section).
- **Present for approval**: Gate 5.

### Step 3: Apply edits to ui-design-system.md (in approval order)

7 Edit operations applied as a sequence:

1. **REWRITE §11 Tooltip** in place — Edit anchor: `### 11. Tooltip` heading + body + closing `---`
2. **REWRITE §5 Modal** in place — Edit anchor: `### 5. Modal` heading + body + closing `---`
3. **DELETE §9 Search Results** — Edit anchor: `### 9. Search Results` heading + body + closing `---` (replace with empty string)
4. **DELETE §20 Search Field** — Edit anchor: `### 20. Search Field` heading + body + closing `---` (replace with empty string)
5. **RENUMBER pass** — apply 18 individual heading edits per the renumber plan in §3 (each is a 1-line edit changing `### N. Name` to `### (N-1 or N-2). Name`):
   - §10 Breadcrumbs → §9
   - §11 Tooltip → §10 (already rewritten in step 1)
   - §12-§19 → §11-§18
   - §21 Toast Message → §19
   - §22-§27 → §20-§25
6. **INSERT §26 IdleWarningModal** — Edit anchor: `## Common Patterns` heading. Old anchor: `---\n\n## Common Patterns`. New: `---\n\n### 26. IdleWarningModal\n\n[content]\n\n---\n\n## Common Patterns`
7. **INSERT §27 CommandPalette** — same anchor as step 6, but applied AFTER step 6 (so the anchor is now the boundary between §26 and `## Common Patterns`).

**Notes**:
- Steps 1-4 are independent (string match, no line-shift dependencies)
- Step 5 (renumber pass) requires running 18 individual `### N. Name` → `### M. Name` edits. Each is a unique string match — no ambiguity.
- Step 6 + 7 must be sequential (the second insert's anchor depends on the first having landed)
- Total Edit operations: ~25-26 (4 rewrites + 18 renumbers + 2 inserts + 2 deletes)

### Step 4: Build verification (7 grep AC checks)

```bash
cd ai-specs/ai-specs/specs

# AC1: §5 Modal rewritten with ConfirmModal values
awk '/^### 5\. Modal/,/^---$/' ui-design-system.md | grep -ciE '(rounded-xl|sm|md|lg|xl|primary|danger|focus trap|autofocus)'   # expected: ≥4

# AC2: §9 Search Results deleted
grep -c '^### \d+\. Search Results' ui-design-system.md   # expected: 0

# AC3: Tooltip section uses tokens
awk '/Tooltip/,/^---$/' ui-design-system.md | grep -ciE '(rounded-lg|surface-inverse|createPortal|viewport-edge|5 positions)'   # expected: ≥3

# AC4: §20 Search Field deleted
grep -c '^### \d+\. Search Field' ui-design-system.md   # expected: 0

# AC5: New IdleWarningModal section exists
grep -c '^### \d+\. IdleWarningModal' ui-design-system.md   # expected: 1

# AC6: New CommandPalette section exists
grep -c '^### \d+\. CommandPalette' ui-design-system.md   # expected: 1

# AC7: Section numbering continuous §1-§27
grep -E '^### [0-9]+\.' ui-design-system.md | grep -oE '[0-9]+' | awk 'BEGIN{prev=0} {if ($1 != prev+1) print "GAP at " $1; prev=$1} END{print "max="prev}'
# expected: no GAP, max=27
```

### Step 5: Update Technical Documentation

The deliverable IS the documentation update. No `data-model.md`, `api-spec.yml`, or standards files need updates.

## 5. Implementation Order

```
── /develop phase (LOCAL, ai-specs working tree on main, no em-ecosystem-code branch) ──
Step 0   No branch (carry-forward Accepted-Trivial)
Step 1   Read 4 spec exports + IdleWarningModal JSX + 4 doc sections (~20 min)
Step 2a  Draft §11 Tooltip → user approval (Gate 1)             ┐
Step 2b  Draft §5 Modal (ConfirmModal-focused) → user approval (Gate 2)  ├─ ~5 review cycles
Step 2c  Draft §26 IdleWarningModal → user approval (Gate 3)    │  ~2h total /develop
Step 2d  Draft §27 CommandPalette + SearchTrigger → user approval (Gate 4)  │
Step 2e  Confirm §9 + §20 deletes → user approval (Gate 5)      ┘
Step 3   Apply ~25 Edit operations (rewrites + deletes + renumber + inserts)
Step 4   Build verification (7 grep AC checks)
Step 5   (covered by Step 3)
         ── /develop ends ──

── /verify + /update-docs phases — same lifecycle as B1-B3 ──
```

**Estimated effort**: ~2.5h /develop with 5 user-approval gates (most complex sub-ticket so far). Could split into 2 sessions (gates 1-2 in session 1, gates 3-5 + apply in session 2) if user busy.

## 6. Testing Checklist

- [ ] §5 Modal rewritten (AC1 passes)
- [ ] §9 Search Results gone (AC2 passes)
- [ ] §11→§10 Tooltip rewritten (AC3 passes)
- [ ] §20 Search Field gone (AC4 passes)
- [ ] §26 IdleWarningModal added (AC5 passes)
- [ ] §27 CommandPalette added (AC6 passes)
- [ ] Numbering continuous §1-§27 (AC7 passes)
- [ ] Spot-check 2-3 spec values per new/rewritten section against spec exports
- [ ] IdleWarningModal section explicitly discloses "no spec export" status
- [ ] §5 Modal cross-references §26 IdleWarningModal (specialized variant)
- [ ] §27 CommandPalette has SearchTrigger sub-section
- [ ] No internal cross-reference broken — grep for `§\d+` in all modified sections, verify each target exists at the cited number

## 7. Error Handling Patterns

N/A — markdown doc edit. If spec export drifts from JSX (likely for IdleWarningModal — but it has no spec at all), document JSX as source of truth and disclose the gap.

## 8. UI/UX Considerations

N/A — docs change.

## 9. Dependencies

- Read access to 5 component .tsx files
- Write access to `ai-specs/specs/ui-design-system.md`
- User availability for ~5 approval gates (largest sub-ticket so far)

## 10. Notes

- **5 user-approval gates** — largest in Part B. Plan for ~2.5h with user available.
- **§5 title kept as "Modal"** per /enrich-us Decision A.
- **IdleWarningModal SEPARATE section (§26)** per /enrich-us Decision B.
- **IdleWarningModal has NO spec export** — JSX is source of truth. Disclose pattern per honest-documentation precedent (B2 Slider thumb rgba, B3 Breadcrumbs link color, B3 Tabs dot indicators).
- **Renumber pass requires 18 individual edits** — each a 1-line heading change. Can be batched in /develop but logically distinct.
- **English content only**.

## 11. Next Steps After Implementation

After /update-docs commits SCRUM-337's edits, the next sub-ticket is **B5 — Auth-specific atoms**: QrCodeCard, RecoveryCodesGrid, CopyField, TurnstileWidget, CountdownTimer (all Missing-from-doc, all add). 5 components, no rewrites, no deletes. Simpler than B4. B5 will be opened only after this `/update-docs` lands.

## 12. Implementation Verification

Final verification checklist:

- [ ] **Code Quality**: N/A
- [ ] **Functionality**: deliverable is `ui-design-system.md` with 2 rewrites + 2 deletes + 18 renumbers + 2 new sections
- [ ] **Testing**: Step 4's 7 grep AC checks all pass
- [ ] **Integration**: section numbering continuous; cross-references valid (§5 → §26; §27 → SearchTrigger sub-section internal)
- [ ] **Documentation**: deliverable IS the doc; written in English; matches existing template (B1-B3 established)
- [ ] **No code branch in em-ecosystem-code**: confirm `git status` is clean in the code repo

## 13. Module-Level Planning

N/A.

## 14. Satellite App Planning

N/A.

---

**Plan ready. Awaiting user approval to proceed to `/develop SCRUM-337`.**
