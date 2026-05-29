# Frontend Implementation Plan: SCRUM-346 §1 Card reconciliation (B10b — FINAL of SCRUM-329 Part B)

**Detected scope**: `frontend` (docs reconciliation — read-only on code, write-only on `ai-specs/specs/ui-design-system.md`)

> **B10b of 10 sub-tickets** from SCRUM-329 Part B reconciliation — the **FINAL sub-ticket of the entire Part B initiative**. Sibling of SCRUM-334-345 (B1-B10a) — all completed. **12th application of carry-forward Accepted-Trivial pattern (FINAL)** — preserves the clean docs-only adaptation across all 12 sub-tickets. User confirmed **Option A** for Common Patterns "Card-style Container" sub-section: DELETE (canonicalize into §1 Card). Registry fix `Sidebar.tsx → SidebarNav.tsx` deferred to separate ticket (em-ecosystem-code is on feature/SCRUM-342-frontend with uncommitted WIP). 1 user-approval gate. Section count §1-§50 unchanged (in-place rewrite + 1 Common Patterns delete).

## 1. Codebase State Verification (2026-05-03)

- **Sprint**: Sprint 14 (id=477)
- **Module**: `dashboard`
- **Anchors**:
  - Code (`em-ecosystem`): `8d2fa80c` (post-SAT01-5 round 2 — unchanged through B1-B10a)
  - Doc (`ai-specs`): `c74b906` (post-/update-docs of SCRUM-345 / B10a)
- **§1 Card heading**: line 157 (in-place rewrite target)
- **Common Patterns "Card-style Container" sub-section**: line 3340 (delete target — ~10 lines)
- **Files to be read** (read-only inputs):
  - `nexacore-dashboard/src/app/globals.css` lines 200-229 (4 card class definitions)
  - `ai-specs/specs/ui-design-system.md` lines 157-178 (current §1 Card) + lines 3340-3349 (Common Patterns "Card-style Container")
- **File to be written**: `ai-specs/specs/ui-design-system.md` (2 Edits: §1 Card rewrite + Common Patterns Card-style Container delete)

## 2. Overview

**FINAL sub-ticket of SCRUM-329 Part B** — closes the entire reconciliation initiative. After this ticket, the doc fully reflects the 50 components actually implemented in the codebase, with no orphan sections, no broken cross-references, and no Common Patterns sub-sections that drift from canonical CSS class definitions.

After B10b:
- **§1 Card**: REWRITTEN (drops drift — raw hex + pixel dimensions, replaces with 4-class comparison table from globals.css)
- **Common Patterns "Card-style Container"**: DELETED (Option A — canonicalized into §1 Card)

Section count: §1-§50 unchanged (no add/delete of numbered sections — only in-place rewrite + 1 Common Patterns sub-section delete).

Per the design-system source-of-truth rule, /develop pauses for sign-off — **1 gate total** (smaller than B5/B6/B7/B8/B9a/B9b's per-component gates because §1 Card is a single section with no dependent components to draft).

## 3. Architecture Context

```
ui-design-system.md (post-c74b906 / B10a — §1-§50)
├─ §1 Card                                       ← REWRITE in place (drift-heavy, 22 lines current)
├─ §2-§50 (untouched)
├─ Display primitives opacity pattern (B6, untouched)
└─ ## Common Patterns
    ├─ ### Card-style Container (line 3340, ~10 lines) ← DELETE (Option A canonicalization)
    ├─ ### Auth Card Container (SCRUM-275)        ← untouched
    └─ (other Common Patterns sub-sections)      ← untouched
```

After B10b:
```
ui-design-system.md (post-B10b — §1-§50, FINAL)
├─ §1 Card (REWRITTEN — 4 CSS classes documented as comparison table)
├─ §2-§50 (untouched)
└─ ## Common Patterns
    ├─ (Card-style Container DELETED — canonicalized into §1)
    ├─ ### Auth Card Container (SCRUM-275, untouched)
    └─ (other Common Patterns sub-sections untouched)
```

**Branching exception**: 12th application (FINAL) of carry-forward Accepted-Trivial. No `feature/SCRUM-346-frontend` branch in `em-ecosystem-code`. Convention silenced.

## 4. Implementation Steps

### Step 0: No code branch (carry-forward Accepted-Trivial — 12th + FINAL)

Working directly in `ai-specs/` working tree on `main`. No re-justification needed (12th + FINAL application).

### Step 1: Discovery (already complete from /enrich-us)

`globals.css` lines 200-229 read. 4 CSS classes catalogued (`.card-container`, `.card`, `.card-flat`, `.card-container-flat`). Differentiating axes identified (radius 12 vs 24, shadow yes vs no). Cross-cluster reference §48 StickyCard (uses `.card-flat`) confirmed.

### Step 2: Draft §1 Card REWRITE + Common Patterns Card-style Container delete (Gate 1)

Single user-approval gate covering both edits:

#### §1 Card draft

```markdown
### 1. Card

CSS-class primitive (NOT a `.tsx` component) — defined in `globals.css` as 4 distinct utility classes that vary on **radius** (12px vs 24px) and **shadow** (with vs without). Used directly in JSX via `className="card-flat"` etc., not via a wrapper React component.

> **Note on the 4-class structure:** unlike most §sections in this doc which document a single React component with a unique spec export, §1 Card documents 4 CSS classes from `globals.css`. The classes share the same base styling (background `--surface-primary`, border `1px solid --border-strong`, padding `24px`) and differ only on the 2 axes below.

**4 CSS classes (comparison):**

| Class | Radius | Box-shadow | Use case |
|-------|--------|------------|----------|
| `.card-container` | `24px` | `0 8px 32px rgba(0,0,0,0.04)` | Large card with elevation (page-level containers, dashboard sections) |
| `.card` | `12px` | `0 8px 32px rgba(0,0,0,0.04)` | Standard card with elevation (most cards in the dashboard) |
| `.card-flat` | `12px` | (none) | In-flow card without elevation — used by §48 StickyCard for the in-flow state (visible weight comes from the sticky-floating mode shadow) |
| `.card-container-flat` | `24px` | (none) | Large flat card without elevation — for nested contexts where a parent already provides elevation |

**Shared base styling (all 4 classes):**
- Background: `var(--surface-primary)` (`#ffffff` light / `#1a1a1a` dark)
- Border: `1px solid var(--border-strong)` (`rgba(0,0,0,0.08)` light / `rgba(255,255,255,0.12)` dark)
- Padding: `24px` all sides

**Variant selection guide:**

| Need | Class |
|------|-------|
| Large container with elevation | `.card-container` |
| Standard card with elevation (default choice) | `.card` |
| In-flow card without elevation (e.g., StickyCard pre-floating state) | `.card-flat` |
| Large nested card without elevation | `.card-container-flat` |

**Token references:**
- `--surface-primary` (background)
- `--border-strong` (border, 8% opacity light / 12% opacity dark)
- Radius: `12px` or `24px` (currently hardcoded — see disclosure below)
- Shadow: `0 8px 32px rgba(0,0,0,0.04)` (currently hardcoded — see disclosure below)
- Padding: `24px` (currently hardcoded — see disclosure below)

> **Note on hardcoded values:** the 4 classes use hardcoded `border-radius`, `box-shadow`, and `padding` values — not yet tokenized as `--radius-md` / `--radius-3xl` / `--shadow-card` / `--space-6`. Future cleanup could migrate to tokens for consistency with the rest of the design system. Currently these values predate the token system.

**Source:**
- Code: `nexacore-dashboard/src/app/globals.css` lines 200-229
- Spec export: **none** (CSS class, not a React component — no spec object applies)
- Cross-reference: §48 StickyCard (canonical consumer of `.card-flat`); deleted Common Patterns "Card-style Container" sub-section (canonicalized into this §1 — see B10b SCRUM-346)

> **Note on deleted Common Patterns "Card-style Container":** prior to B10b, the doc had a parallel description of card styling in Common Patterns "Card-style Container" sub-section (raw hex values, outdated `Used by` list referencing §sections that have since been deleted in B4 + B10a). Deleted as part of B10b (SCRUM-346 / Option A canonicalization). §1 Card is now the single source of truth for card styling. Same canonicalization precedent as B4 Ambiguity 1, B7 Common Patterns Button cleanup, B8 InlineError promotion, B9a Common Patterns Selector Trigger cleanup.

---
```

#### Common Patterns "Card-style Container" delete (Option A)

Replace lines 3340-3349 (the entire sub-section + closing blank line before `### Auth Card Container (SCRUM-275)`) with empty (just preserve `### Auth Card Container (SCRUM-275)` heading boundary).

**Present for approval**: Gate 1.

### Step 3: Apply 2 Edits

- **Edit 1**: Rewrite §1 Card in place (line 157 heading + content + closing `---`)
- **Edit 2**: Delete Common Patterns "Card-style Container" sub-section (line 3340 heading + content + closing blank line, with `### Auth Card Container (SCRUM-275)` boundary preserved)

### Step 4: Build verification (8 grep AC checks)

```bash
cd ai-specs/ai-specs/specs

# AC1: §1 Card token-based (no raw hex)
awk '/^### 1\. Card/,/^---$/' ui-design-system.md | grep -ciE '#1c1c1c|#ffffff|#fbfbfb|#f2f2f2|#000000'
# expected: 0

# AC2: §1 Card documents 4 CSS classes
awk '/^### 1\. Card/,/^---$/' ui-design-system.md | grep -c '\.card-container'   # expected: ≥2 (.card-container + .card-container-flat)
awk '/^### 1\. Card/,/^---$/' ui-design-system.md | grep -c '\.card-flat'        # expected: ≥2 (.card-flat + .card-container-flat)
awk '/^### 1\. Card/,/^---$/' ui-design-system.md | grep -cE '\.card[^a-z-]'    # expected: ≥1 (.card alone)

# AC3: §1 Card cross-references §48 StickyCard
awk '/^### 1\. Card/,/^---$/' ui-design-system.md | grep -c '§48 StickyCard'
# expected: ≥1

# AC4: Common Patterns "Card-style Container" sub-section removed
grep -cE '^### Card-style Container' ui-design-system.md
# expected: 0

# AC5: Section numbering still continuous §1-§50
grep -E '^### [0-9]+\.' ui-design-system.md | grep -oE '^### [0-9]+' | grep -oE '[0-9]+' \
  | awk 'BEGIN{prev=0} {if ($1 != prev+1) print "GAP at " $1; prev=$1} END{print "max="prev}'
# expected: no GAP, max=50

# AC6: §1 Card has **Source:** line
awk '/^### 1\. Card/,/^---$/' ui-design-system.md | grep -cE '^\*\*Source:\*\*'
# expected: 1

# AC7: cross-ref text-match validation (NEW post-B6 — DOC-WIDE)
for spec in "1:Card" "48:StickyCard"; do
  n="${spec%%:*}"; name="${spec#*:}"
  count=$(grep -cE "^### $n\. $name" ui-design-system.md)
  echo "§$n $name: $count"
done
# expected: each = 1

# AC8: Doc-wide broken-ref sweep (17 patterns from B10a — should remain clean)
for pattern in "§11 Tooltip" "§22 Checkboxes" "§18 Button Set" "§23 Input" "§24 DateInput" "§25 MfaDigitInput" "§26 FormField" "§2 Icon Set" "§11 Quick Notification" "§12 Payment Form" "§13 Speedometer" "§14 Notification" "§19 Toast" "§15 Button" "§3 Sidebar" "§7 Context" "§8 Analytics"; do
  c=$(grep -c "$pattern" ui-design-system.md)
  [ "$c" != "0" ] && echo "BROKEN: '$pattern' = $c"
done
echo "(no BROKEN output = all 17 patterns clean)"
```

### Step 5: Update Technical Documentation

Covered by Step 3. The deliverable IS the doc update.

## 5. Implementation Order

```
── /develop phase (LOCAL, ai-specs working tree on main) ──
Step 0   No branch (carry-forward — 12th + FINAL application)
Step 1   Discovery (already complete from /enrich-us)
Step 2   Draft §1 Card + Common Patterns delete → user approval (Gate 1)
Step 3   Apply 2 Edits (§1 rewrite + Common Patterns delete)
Step 4   Build verification (8 grep AC checks)
Step 5   (covered by Step 3)
         ── /develop ends ──

── /verify + /update-docs phases — same lifecycle as B1-B10a ──
```

**Estimated effort**: ~30-45 min /develop. Single section rewrite + 1 Common Patterns sub-section delete. **Smallest scope of any Part B sub-ticket.**

## 6. Testing Checklist

- [ ] §1 Card token-based (AC1 passes — 0 raw hex)
- [ ] §1 Card documents all 4 CSS classes (AC2 passes — class names appear)
- [ ] §1 Card cross-references §48 StickyCard (AC3 passes)
- [ ] Common Patterns "Card-style Container" removed (AC4 passes — 0)
- [ ] Numbering still continuous §1-§50 (AC5 passes — max=50)
- [ ] §1 Card has `**Source:**` line (AC6 passes — 1)
- [ ] Cross-ref text-match validation (AC7 passes — §1 + §48 verified)
- [ ] Doc-wide broken-ref sweep clean across 17 patterns (AC8 passes)
- [ ] Spot-check: globals.css line numbers (200-229) cited correctly
- [ ] No internal cross-reference broken across the doc

## 7. Error Handling Patterns

N/A — markdown doc edit. If globals.css definitions differ from what /enrich-us captured (e.g., another card class added since 2026-05-03), document the additional classes as honest disclosure.

## 8. UI/UX Considerations

N/A — docs change.

## 9. Dependencies

- Read access to `nexacore-dashboard/src/app/globals.css` lines 200-229 (already done in /enrich-us)
- Write access to `ai-specs/specs/ui-design-system.md`
- User availability for 1 approval gate (smallest count of any Part B sub-ticket)

## 10. Notes

- **1 user-approval gate** — smallest count alongside B10a. Single-section rewrite + 1 sub-section delete.
- **§1 Card 4-class comparison table** — first time §section documents 4 CSS classes (instead of 1 React component). New disclosure pattern.
- **Hardcoded values disclosure** — 4 CSS classes use raw `border-radius`, `box-shadow`, `padding` values (not yet tokenized). Honest disclosure.
- **Common Patterns "Card-style Container" delete** — same canonicalization precedent as B4 Ambiguity 1 + B7 Common Patterns Button cleanup + B9a Common Patterns Selector Trigger cleanup.
- **Cross-cluster cross-reference** — §1 Card references §48 StickyCard (canonical consumer of `.card-flat`).
- **AC grep checks use `-cE` flag** — lesson from B4.
- **NEW post-B6 cross-ref text-match validation** + **doc-wide broken-ref sweep (17 patterns from B10a)** — both permanent in /verify.
- **English content only**.
- **12th + FINAL carry-forward application** — closes the docs-only adaptation pattern across all 12 sub-tickets.

## 11. Next Steps After Implementation

After /update-docs commits SCRUM-346's edits, **SCRUM-329 Part B is COMPLETE** — 10 sub-tickets total (B1-B9b + B10a + B10b). The audit reconciliation initiative ends.

**Out of scope for Part B but pending**:
- Registry fix `Sidebar.tsx → SidebarNav.tsx` in `em-ecosystem-code/nexacore-dashboard/src/lib/component-registry.ts` (1-line code change) — to be handled as either tag-along in SCRUM-342 OR a separate small cleanup ticket later. Defer-out-of-scope per user-confirmed Option A.

**Long-term (post-Part B)**: per the audit-table.md "Long-term: prevent recurrence" section (line 257), recommend opening a new ticket to ship a doc-from-code generator that prevents this drift from accumulating again. Suggested scope: read all `*Specs`/`*Variants`/`*Classes` exports from `ui/*.tsx` + parse JSDoc + render markdown sections matching the format established in Part B.

## 12. Implementation Verification

Final verification checklist:

- [ ] **Code Quality**: N/A
- [ ] **Functionality**: deliverable is `ui-design-system.md` with §1 Card rewritten + Common Patterns "Card-style Container" deleted
- [ ] **Testing**: Step 4's 8 grep AC checks all pass
- [ ] **Integration**: section numbering continuous §1-§50; cross-references valid (§1↔§48); doc-wide broken-ref sweep clean (17 patterns)
- [ ] **Documentation**: deliverable IS the doc; written in English; matches established template
- [ ] **No code branch in em-ecosystem-code**: confirm clean (12th + FINAL carry-forward application)

## 13. Module-Level Planning

N/A.

## 14. Satellite App Planning

N/A.

---

**Plan ready. Awaiting user approval to proceed to `/develop SCRUM-346`.**
