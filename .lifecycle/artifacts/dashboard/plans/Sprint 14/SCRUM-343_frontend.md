# Frontend Implementation Plan: SCRUM-343 Reconcile ui-design-system.md — Drift + structural decisions

**Detected scope**: `frontend` (docs reconciliation of frontend components — read-only on code, write-only on `ai-specs/specs/ui-design-system.md`)

> **B9a of 9 sub-tickets** (split from B9 per user decision into B9a + B9b). Sibling of SCRUM-334-341 (B1-B8) — all completed. **9th application** of carry-forward Accepted-Trivial pattern. User confirmed **(A, A)** for both structural decisions: PROMOTE ThemeToggle to dedicated §49 + DELETE Common Patterns "Selector Trigger (Popover Pattern)" sub-section (canonicalize into §50 + §51). 4 user-approval gates. Section count grows §1-§48 → §1-§51 (+3).

## 1. Codebase State Verification (2026-05-03)

- **Sprint**: Sprint 14 (id=477)
- **Module**: `dashboard`
- **Anchors**:
  - Code (`em-ecosystem`): `8d2fa80c` (post-SAT01-5 round 2 — unchanged through B1-B8)
  - Doc (`ai-specs`): `f58f624` (post-/update-docs of SCRUM-341 / B8)
- **Common Patterns anchor**: line 2697 of `ui-design-system.md` (post-B8; will shift after Calendar rewrite + 3 inserts + Selector Trigger delete; verify exact line at /develop start)
- **§4 Calendar heading**: line 299 (in-place rewrite target — content from line 299 to closing `---`)
- **Theme System "Toggle Component" sub-section**: line 126 (cross-ref update target)
- **Common Patterns "Selector Trigger (Popover Pattern)" sub-section**: line 2838+ (~90 lines — delete target)
- **Files to be read** (read-only inputs — already captured during /enrich-us, re-confirmed at /develop):
  - `nexacore-dashboard/src/components/ui/Calendar.tsx` (344 lines, `calendarSpecs` line 50)
  - `nexacore-dashboard/src/components/ui/LanguageSelector.tsx` (212 lines, `languageSelectorSpecs` line 21)
  - `nexacore-dashboard/src/components/ui/EmailSelector.tsx` (93 lines, `emailSelectorSpecs` line 8)
  - `nexacore-dashboard/src/components/ui/ThemeToggle.tsx` (36 lines, **NO spec export — JSX-only**)
  - `ai-specs/specs/ui-design-system.md` — §4 (line 299+), Theme System §126, Common Patterns Selector Trigger (line 2838+), and Common Patterns anchor (line 2697)
- **File to be written**: `ai-specs/specs/ui-design-system.md` (6 Edits: rewrite §4 + insert §49-§51 + delete Common Patterns Selector Trigger + update Theme System Toggle Component cross-ref)

## 2. Overview

This ticket reconciles 4 components — the most structurally-complex Part B sub-ticket (alongside B7) due to **2 confirmed structural decisions executed at once**:

After this ticket:
- **§4 Calendar**: REWRITTEN (token-based, 3 view modes documented, day-cell states with opacity pattern reference, navigation rationale)
- **§49 ThemeToggle**: NEW (PROMOTED from Theme System chapter — Decision 1 Option A)
- **§50 LanguageSelector**: NEW (sourced from `languageSelectorSpecs`, smart popover positioning, composes §33 Avatar + §21 Input)
- **§51 EmailSelector**: NEW (sourced from `emailSelectorSpecs`, composes §33 Avatar + §15 Button)
- **Common Patterns "Selector Trigger (Popover Pattern)"**: DELETED (Decision 2 Option A — ~90 lines)
- **Theme System "Toggle Component" sub-section**: UPDATED to cross-reference §49

Final section count: **§1-§51** (current §1-§48 + 3 new = +3).

Per the design-system source-of-truth rule, /develop pauses for sign-off at each component — **4 gates total**.

## 3. Architecture Context

```
ui-design-system.md (post-f58f624 / B8)
├─ §1-§3 (untouched)
├─ §4 Calendar                                       ← REWRITE in place (preserve heading + position)
├─ §5-§48 (untouched except Theme System Toggle Component cross-ref update)
├─ ## Theme System (line 122)
│   └─ ### Toggle Component (line 126)              ← UPDATE: replace inline content with cross-ref to §49
├─ #### Display primitives opacity pattern (B6)     ← (untouched)
└─ ## Common Patterns                                ← INSERT §49 + §50 + §51 BEFORE this anchor
    ├─ ...
    ├─ ### Selector Trigger (Popover Pattern) (~90 lines, line 2838+)  ← DELETE (Option A canonicalization)
    └─ (Other Common Patterns sub-sections preserved)
```

After B9a:
```
ui-design-system.md (post-B9a)
├─ §1-§3 (untouched)
├─ §4 Calendar (REWRITTEN — token-based, 3 view modes, opacity pattern reference)
├─ §5-§48 (untouched except Theme System Toggle Component cross-ref)
├─ ## Theme System
│   └─ ### Toggle Component → cross-ref to §49 (PROMOTION executed)
├─ #### Display primitives opacity pattern (untouched)
├─ §49 ThemeToggle (NEW — composes §42 IconButton, JSX-only)
├─ §50 LanguageSelector (NEW — composes §33 Avatar + §21 Input, smart popover positioning)
├─ §51 EmailSelector (NEW — composes §33 Avatar + §15 Button, single-action dropdown)
└─ ## Common Patterns
    ├─ ...
    └─ (Selector Trigger sub-section DELETED — canonicalized into §50 + §51)
```

**Branching exception**: 9th application of carry-forward Accepted-Trivial. No `feature/SCRUM-343-frontend` branch in `em-ecosystem-code`. Convention silenced.

## 4. Implementation Steps

### Step 0: No code branch (carry-forward Accepted-Trivial)

Working directly in `ai-specs/` working tree on `main`. No re-justification needed (9th application).

### Step 1: Discovery (already complete from /enrich-us)

All 4 component files + Common Patterns Selector Trigger + Theme System Toggle Component already read during /enrich-us. Full JSX details captured. **Watch list confirmed**:
- Calendar `text-content-primary/50` for other-month days (10th opacity-pattern occurrence)
- Calendar `opacity-30` for disabled days (4th opacity step beyond /30, /50, /75 — possible new disclosure)
- LanguageSelector spec.trigger.open says `bg-surface-primary` but JSX uses `bg-surface-subtle` (minor spec-vs-JSX drift — honest disclosure)
- ThemeToggle SSR-safe `mounted` state (non-obvious — prevents flash on hydration)
- `animate-stagger` and `animate-dropdown-down` classes — globals.css animations not previously documented

### Step 2: Per-component drafting + user approval (4 sub-steps)

Order: Calendar first (canonical anchor — heaviest), then ThemeToggle (composes B7), then selectors (compose B6 + B1 + B7).

#### Step 2a: Draft §4 Calendar REWRITE (Gate 1 — most complex, 344 source lines)

- **Action**: from `calendarSpecs` (line 50) + JSX, draft a complete REWRITE of §4. Preserve `### 4. Calendar` heading; replace ALL content between heading and closing `---`.
- **Content scope** (token-based — drops all raw hex):
  - Container: `w-[300px] bg-surface-primary border border-border-components rounded-xl p-6 flex flex-col gap-5 shadow-card`
  - 3 view modes: `days` (default — grid-cols-7), `months` (grid-cols-3), `years` (grid-cols-3, 12-year window)
  - Header: clickable to switch view modes (days→months→years), shows current label per mode
  - Navigation arrows: `w-6 h-6 rounded-full bg-surface-subtle hover:bg-surface-subtle` with ChevronLeft/Right 16px text-content-primary
  - Day cells: `min-w-9 h-9 px-2 mx-auto flex items-center justify-center text-body font-normal rounded-full transition-colors`
  - Day states (with token references):
    - **Selected**: `bg-surface-inverse text-content-inverse font-normal` (filled DARK)
    - **Today**: `bg-surface-subtle text-content-primary font-normal`
    - **Default (current month)**: `text-content-primary hover:bg-surface-subtle`
    - **Other month**: `text-content-primary/50` — extends [Display primitives opacity pattern](#display-primitives-opacity-pattern) (10th occurrence across 4 clusters)
    - **Disabled**: `opacity-30 cursor-not-allowed` — 4th opacity step disclosure
  - Weekday header: `text-caption font-normal text-content-primary text-center` (Monday-based: MON/TUE/WED/THU/FRI/SAT/SUN)
  - Week starts Monday (Sunday=0 converted to Monday-based via `(day - 1 + 7) % 7`)
  - 42-cell layout (6 weeks × 7 days, fills with prev/next month days)
  - Months view: 3-cols grid with month abbreviations (Jan-Dec)
  - Years view: 3-cols grid with 12-year window
  - Aria: `role="grid"` (days view), `role="columnheader"` (weekdays), `aria-label` (each day with localized date), `aria-selected` (matching value)
- **Source citation**: `Source: Calendar.tsx:50 (calendarSpecs)` + cross-ref §22 DateInput (consumer — wraps Calendar in popover).
- **Disclosures**:
  - Drift note vs prior doc (radius-3xl→rounded-xl, 24x24 nav→w-6 h-6, etc.)
  - 3 view modes documented (was only days)
  - Opacity pattern extension (10th occurrence)
  - 4th opacity step (`opacity-30` for disabled — possible new disclosure category)
- **Cross-references**: §22 DateInput (consumer); B6 [Display primitives opacity pattern](#display-primitives-opacity-pattern) reference.
- **Present for approval**: Gate 1.

#### Step 2b: Draft §49 ThemeToggle (Gate 2 — promoted from Theme System chapter)

- **Action**: from JSX directly (no spec export — JSX-only disclosure required), draft a new section. Promotion attribution blockquote at top (Decision 1 Option A executed).
- **Content scope**:
  - Composes §42 IconButton (variant=`boxed`, size=`sm`, tooltip=true) — first B9a→B7 cross-ref
  - Sun (lucide, 16px) for `theme === "light"` (next click = dark)
  - Moon (lucide, 16px) for `theme === "dark"` (next click = light)
  - **Drift note**: prior doc said `sun-dim` (16x16); JSX uses `Sun` lucide (NOT sun-dim). Doc now reflects code reality.
  - SSR-safe `mounted` state — prevents flash-of-wrong-theme on hydration. Renders `<div className="h-8 w-8" />` placeholder until mounted.
  - Dynamic aria-label: `Switch to {dark|light} mode` based on current theme — accessible
  - Calls `toggleTheme` from `useTheme` hook
  - Used in: AuthLayout header (per §42 IconButton's `usage` export)
- **Source citation**: `Source: ThemeToggle.tsx (no spec export — JSX-only)` + composes §42 IconButton + hook `useTheme` from `@/hooks/useTheme`.
- **Disclosures**:
  - JSX-only (no spec export)
  - Promotion from Theme System chapter (Option A canonicalization, B4/B7/B8 precedent)
  - SSR-safe mounted state (non-obvious behavior)
  - sun-dim → Sun icon name fix (drift correction)
- **Cross-references**: §42 IconButton (composes — wrapper); Theme System chapter (legacy location, now cross-references back to §49).
- **Present for approval**: Gate 2.

#### Step 2c: Draft §50 LanguageSelector (Gate 3 — composes B6 + B1)

- **Action**: from `languageSelectorSpecs` (line 21) + JSX, draft a new section.
- **Content scope**:
  - Trigger: 2 states (closed/open) sharing same box model `flex h-10 items-center gap-2 px-4 text-body font-normal rounded-md transition-colors` to prevent layout shift
  - Closed: `border-transparent bg-transparent text-content-primary/75 hover:text-content-primary` — opacity pattern reference (Borderless variant)
  - Open: `border border-border-components bg-surface-subtle text-content-primary` — note: spec.trigger.open says `bg-surface-primary` but JSX uses `bg-surface-subtle` — minor spec-vs-JSX drift, honest disclosure
  - ChevronDown 16px, `rotate-180` on open (200ms transition)
  - Smart popover positioning (4 quadrants):
    - Vertical: `up` (footer context — top > popoverHeight) or `down` (header context)
    - Horizontal: `right` (left + popoverWidth > viewportWidth) or `left`
    - Computed at trigger click via `getBoundingClientRect()`
  - Popover container: `absolute z-50 w-fit min-w-[200px]`
  - Search bar: composes §21 Input (variant="filled") with leftIcon Search 16px, optional rightIcon X 12px (clears search)
  - Results card: `max-h-[240px] overflow-y-auto rounded-xl border border-border-components bg-surface-primary p-4 shadow-card`
  - Option button: `flex h-10 items-center gap-2 rounded-md px-2 text-body font-normal transition-colors`
  - Selected: `bg-surface-subtle text-content-primary`; Default: `bg-transparent text-content-primary hover:bg-surface-subtle`
  - Composes §33 Avatar (size=sm, name=lang.code) — first B9a→B6 cross-ref
  - Composes §21 Input (variant=filled) — first B9a→B1 cross-ref (post-pre-B8 fix corrected to §21)
  - LocalStorage persistence: `STORAGE_KEY = "nexacore-language"` — restores on mount
  - 3 hardcoded languages: EN/ES/FR (English UK / Español España / Français France)
  - `animate-stagger` class — globals.css animation (also new to documentation)
  - Click-outside dismissal via `mousedown` listener
  - Search input auto-focus on popover open
- **Source citation**: `Source: LanguageSelector.tsx:21 (languageSelectorSpecs)` + composes §33 Avatar + §21 Input + animation class `animate-stagger`.
- **Disclosures**:
  - Promotion from Common Patterns Selector Trigger Borderless (Option A canonicalization)
  - Smart popover positioning (4-quadrant viewport-aware)
  - Spec-vs-JSX minor drift (bg-surface-primary vs bg-surface-subtle)
  - LocalStorage persistence (consumer-managed key)
  - 3 hardcoded languages (extension point)
  - `animate-stagger` class — first documentation in Part B
- **Cross-references**: §33 Avatar (composes), §21 Input (composes), §51 EmailSelector (sister selector primitive).
- **Present for approval**: Gate 3.

#### Step 2d: Draft §51 EmailSelector (Gate 4 — composes B6 + B7)

- **Action**: from `emailSelectorSpecs` (line 8) + JSX, draft a new section.
- **Content scope**:
  - Trigger: `flex h-10 items-center justify-center gap-2 rounded-md px-6 py-2.5 text-body font-normal whitespace-nowrap border border-border-components transition-colors`
  - Closed: `bg-transparent text-content-primary hover:bg-surface-subtle`
  - Open: `bg-surface-subtle text-content-primary`
  - ChevronDown 16px rotate-180 on open
  - Dropdown: `absolute left-0 top-full z-50 mt-1 w-[300px] animate-dropdown-down` — fixed downward positioning (NOT smart 4-quadrant like §50 LanguageSelector — single use case is auth flows where header position is known)
  - Dropdown container: `rounded-xl border border-border-components bg-surface-primary p-4 shadow-card`
  - Selected display: `flex h-10 w-full items-center gap-2 rounded-md bg-surface-subtle px-2 text-body font-normal text-content-primary`
  - Avatar: §33 Avatar (size=sm, name=emailInitial) — initial extracted as `(email[0] || "?").toUpperCase()`
  - Action button: §15 Button (variant=`link-underline`, size=md, fullWidth=false) labeled "Try a different email address"
  - Single-action dropdown — non-typical "selector" (just shows current + escape link)
  - Click-outside dismissal via `mousedown` listener
  - `animate-dropdown-down` class — globals.css animation (verify class exists)
- **Source citation**: `Source: EmailSelector.tsx:8 (emailSelectorSpecs)` + composes §33 Avatar + §15 Button + animation class `animate-dropdown-down`.
- **Disclosures**:
  - Promotion from Common Patterns Selector Trigger Bordered (Option A canonicalization)
  - Single-action dropdown (non-typical "selector" — just shows current + escape link)
  - Composes §15 Button variant=link-underline (B7 cross-cluster)
  - `animate-dropdown-down` class — animation
- **Cross-references**: §33 Avatar (composes), §15 Button (composes), §50 LanguageSelector (sister selector primitive).
- **Present for approval**: Gate 4.

### Step 3: Apply edits (6 Edits — staged for safety)

Mixed pattern: 1 rewrite + 1 multi-section insert + 1 delete + 1 cross-ref update.

- **Edit 1**: Rewrite §4 Calendar in place
  - `old_string`: full current §4 content (line 299 heading through closing `---`)
  - `new_string`: rewritten content (token-based, 3 view modes, opacity pattern reference)
- **Edit 2**: Single big-edit insert §49-§51 before `## Common Patterns`
  - `old_string`: `## Common Patterns` (anchor — same as B5/B6/B7/B8)
  - `new_string`: §49 ThemeToggle + `---` + §50 LanguageSelector + `---` + §51 EmailSelector + `---` + `## Common Patterns`
- **Edit 3**: Delete Common Patterns "Selector Trigger (Popover Pattern)" sub-section
  - `old_string`: from `### Selector Trigger (Popover Pattern)` (line 2838) through the last line of the sub-section + closing blank line
  - `new_string`: empty (or just preserves the surrounding context heading if needed)
  - Verify exact boundaries during Step 1 re-read
- **Edit 4**: Update Theme System "Toggle Component" sub-section to cross-reference §49
  - `old_string`: `### Toggle Component` heading + the inline content describing sun-dim/moon icons
  - `new_string`: `### Toggle Component` heading + brief 1-2 line cross-reference to §49 ThemeToggle (canonical spec)

### Step 4: Build verification (14 grep AC checks + 4-5 bonus integrity)

```bash
cd ai-specs/ai-specs/specs

# AC1: §4 Calendar token-based (no raw hex)
awk '/^### 4\. Calendar/,/^---$/' ui-design-system.md | grep -ciE '#1c1c1c|#ffffff|#fbfbfb|#f2f2f2'
# expected: 0

# AC2: §4 Calendar documents 3 view modes
for mode in days months years; do
  c=$(awk '/^### 4\. Calendar/,/^---$/' ui-design-system.md | grep -c "$mode")
  echo "§4 mode $mode: $c"
done
# expected: each ≥1

# AC3: §4 Calendar documents rounded-xl (NOT rounded-3xl)
awk '/^### 4\. Calendar/,/^---$/' ui-design-system.md | grep -c 'rounded-xl'
# expected: ≥1

# AC4: §4 Calendar documents day-cell rounded-full
awk '/^### 4\. Calendar/,/^---$/' ui-design-system.md | grep -c 'rounded-full'
# expected: ≥1

# AC5-AC7: each new section exists
grep -cE '^### 49\. ThemeToggle' ui-design-system.md      # expected: 1
grep -cE '^### 50\. LanguageSelector' ui-design-system.md # expected: 1
grep -cE '^### 51\. EmailSelector' ui-design-system.md    # expected: 1

# AC8: section numbering continuous §1-§51
grep -E '^### [0-9]+\.' ui-design-system.md | grep -oE '^### [0-9]+' | grep -oE '[0-9]+' \
  | awk 'BEGIN{prev=0} {if ($1 != prev+1) print "GAP at " $1; prev=$1} END{print "max="prev}'
# expected: no GAP, max=51

# AC9: each new section has **Source:** line
for n in 4 49 50 51; do
  c=$(awk "/^### $n\. /,/^---$/" ui-design-system.md | grep -cE '^\*\*Source:\*\*')
  echo "§$n Source: $c"
done
# expected: each = 1

# AC10: cross-references valid
echo "§49 → §42 (IconButton): $(awk '/^### 49\. ThemeToggle/,/^---$/' ui-design-system.md | grep -c '§42')"
echo "§50 → §33 (Avatar): $(awk '/^### 50\. LanguageSelector/,/^---$/' ui-design-system.md | grep -c '§33')"
echo "§50 → §21 (Input): $(awk '/^### 50\. LanguageSelector/,/^---$/' ui-design-system.md | grep -c '§21')"
echo "§51 → §33 (Avatar): $(awk '/^### 51\. EmailSelector/,/^---$/' ui-design-system.md | grep -c '§33')"
echo "§51 → §15 (Button): $(awk '/^### 51\. EmailSelector/,/^---$/' ui-design-system.md | grep -c '§15')"
# expected: each ≥1

# AC11: Common Patterns "Selector Trigger (Popover Pattern)" REMOVED (Decision 2 Option A)
grep -cE '^### Selector Trigger' ui-design-system.md
# expected: 0

# AC12: Theme System "Toggle Component" sub-section now cross-references §49 (Decision 1 Option A)
awk '/^## Theme System/,/^## /' ui-design-system.md | grep -c '§49 ThemeToggle'
# expected: ≥1

# AC13 (NEW post-B6 — DOC-WIDE per B8 lesson): cross-ref text-match validation
for spec in "4:Calendar" "49:ThemeToggle" "50:LanguageSelector" "51:EmailSelector" "42:IconButton" "33:Avatar" "21:Input" "15:Button Set" "22:DateInput"; do
  n="${spec%%:*}"; name="${spec#*:}"
  count=$(grep -cE "^### $n\. $name" ui-design-system.md || echo 0)
  echo "§$n $name: $count"
done
# expected: each = 1

# AC14: §4 Calendar documents text-content-primary/50 for other-month days (10th opacity-pattern occurrence)
awk '/^### 4\. Calendar/,/^---$/' ui-design-system.md | grep -c 'text-content-primary/50'
# expected: ≥1

# Bonus 1: §50 LanguageSelector smart positioning documented
awk '/^### 50\. LanguageSelector/,/^---$/' ui-design-system.md | grep -ciE '(smart positioning|4 quadrants|getBoundingClientRect|popoverPos)'
# expected: ≥1

# Bonus 2: §51 EmailSelector single-action dropdown disclosure
awk '/^### 51\. EmailSelector/,/^---$/' ui-design-system.md | grep -ciE '(single-action|escape link|non-typical)'
# expected: ≥1

# Bonus 3: ThemeToggle SSR-safe mounted state disclosure
awk '/^### 49\. ThemeToggle/,/^---$/' ui-design-system.md | grep -ciE '(SSR-safe|mounted|hydration)'
# expected: ≥1

# Bonus 4: Doc-wide broken-ref sweep (B8 lesson — permanent)
for pattern in "§11 Tooltip" "§22 Checkboxes" "§18 Button Set" "§23 Input" "§24 DateInput" "§25 MfaDigitInput" "§26 FormField"; do
  c=$(grep -c "$pattern" ui-design-system.md || echo 0)
  [ "$c" != "0" ] && echo "BROKEN: '$pattern' = $c"
done
echo "(no output = all clean)"

# Bonus 5: file size delta
wc -l ui-design-system.md
# expected: ~+200-300 (rewrite + 3 inserts - delete ~90 lines)
```

**Note**: All AC checks use `grep -cE` flag per the lessons-learned from B4. AC13 is the **permanent post-B6 cross-reference text-match validation** check, expanded **doc-wide** per the B8 lessons-learned.

### Step 5: Update Technical Documentation

Covered by Steps 3 + cross-ref Edit 4. The deliverable IS the doc update.

## 5. Implementation Order

```
── /develop phase (LOCAL, ai-specs working tree on main) ──
Step 0   No branch (carry-forward — 9th application)
Step 1   Discovery (already complete from /enrich-us)
Step 2a  Draft §4 Calendar REWRITE → user approval (Gate 1)            ┐
Step 2b  Draft §49 ThemeToggle → user approval (Gate 2)                ├─ ~4 review cycles
Step 2c  Draft §50 LanguageSelector → user approval (Gate 3)           │  ~2-2.5h total
Step 2d  Draft §51 EmailSelector → user approval (Gate 4)              ┘
Step 3   Apply 6 Edits (rewrite + multi-insert + delete + cross-ref update)
Step 4   Build verification (14 grep AC checks + 5 bonus integrity)
Step 5   (covered by Step 3)
         ── /develop ends ──

── /verify + /update-docs phases — same lifecycle as B1-B8 ──
```

**Estimated effort**: ~2-2.5h /develop with 4 user-approval gates. Smaller cluster than B6/B8 (4 vs 6/9 components) but each gate's content is substantial — Calendar §4 rewrite is the largest single section in B9a (344 source lines), and 2 structural decisions executed silently (per user pre-approval) add ~30 mins of Edit complexity.

## 6. Testing Checklist

- [ ] §4 Calendar rewritten with token-based content (AC1 passes — 0 raw hex)
- [ ] §4 Calendar documents 3 view modes (AC2 passes — days/months/years all ≥1)
- [ ] §4 Calendar documents rounded-xl + rounded-full (AC3 + AC4 pass)
- [ ] §49 ThemeToggle added (AC5 passes)
- [ ] §50 LanguageSelector added (AC6 passes)
- [ ] §51 EmailSelector added (AC7 passes)
- [ ] Numbering continuous §1-§51 (AC8 passes — max=51)
- [ ] All 4 sections cite spec/JSX source (AC9 passes — 4/4 = 1)
- [ ] Cross-references valid (AC10 passes — 5 cross-refs)
- [ ] Common Patterns "Selector Trigger (Popover Pattern)" removed (AC11 passes — 0 matches)
- [ ] Theme System "Toggle Component" cross-references §49 (AC12 passes)
- [ ] Cross-reference text-match validation doc-wide (AC13 passes — all 9 §N <Name> verified, no broken)
- [ ] §4 Calendar uses opacity pattern (AC14 passes — 10th occurrence)
- [ ] §50 smart positioning documented (Bonus 1)
- [ ] §51 single-action dropdown disclosure (Bonus 2)
- [ ] ThemeToggle SSR-safe mounted state disclosure (Bonus 3)
- [ ] Doc-wide broken-ref sweep clean (Bonus 4 — proactive check per B8)
- [ ] File size delta consistent with rewrite + 3 inserts - 90-line delete (Bonus 5)
- [ ] Spot-check 2-3 spec values per section against spec exports
- [ ] No internal cross-reference broken across the doc

## 7. Error Handling Patterns

N/A — markdown doc edit. If JSX read reveals additional behaviors not anticipated, document with the standard honest-disclosure pattern (B5/B6/B7/B8 precedent).

## 8. UI/UX Considerations

N/A — docs change.

## 9. Dependencies

- Read access to 4 component .tsx files (already done in /enrich-us)
- Write access to `ai-specs/specs/ui-design-system.md`
- User availability for 4 approval gates (single session feasible)

## 10. Notes

- **4 user-approval gates** — smaller count than B6/B8 (9/6) but each gate's content is substantial.
- **2 structural decisions executed at once** (Decision 1 ThemeToggle PROMOTE + Decision 2 Common Patterns Selector Trigger DELETE) — most ambitious B-cluster cleanup yet.
- **Calendar §4 is the largest single component in Part B** (344 source lines) — substantial section rewrite.
- **First B9a→B6 cross-references** (§50/§51 → §33 Avatar) and **B9a→B1 cross-references** (§50 → §21 Input). Cross-cluster compositions continue to grow — B8 had 2 (§46→§42, §48→§32), B9a will have 5 (§49→§42, §50→§33, §50→§21, §51→§33, §51→§15).
- **Calendar extends opacity pattern to 10th occurrence across 4 clusters** (B6: 5, B7: +3, B8: +1, B9a: +1). Inline cross-reference to existing Pattern note (do NOT modify the Pattern note table — same B7/B8 decision).
- **`opacity-30` for Calendar disabled days** — possible 4th opacity step beyond /30, /50, /75, /100. May warrant a new disclosure category (or reframe the opacity pattern as multi-step).
- **`animate-stagger` and `animate-dropdown-down` classes** — globals.css animations not previously documented. Worth a brief mention in §50/§51 sources.
- **AC grep checks use `-cE` flag** — lesson from B4.
- **Doc-wide cross-reference text-match validation now permanent** (AC13 + Bonus 4) — both a positive validation and a negative sweep for historical broken patterns. Per B8 lessons-learned.
- **English content only**.

## 11. Next Steps After Implementation

After /update-docs commits SCRUM-343's edits, the next sub-ticket is **B9b — Pure adds cluster (DataTable, StickyCard, ImageCropper, BeforeAfterSlider)**. 4 components, all pure-add (no rewrites, no deletes, no structural decisions). Should follow B5/B6 single-big-edit-insert pattern. After B9b, only **B10 (audit-B9) Cleanup** remains — must run last (deletes orphaning cross-references).

Remaining Part B clusters after B9a:
- **B9b** — Pure adds (DataTable + StickyCard + ImageCropper + BeforeAfterSlider, 4 components)
- **B10 (audit-B9)** — Cleanup — must run last (delete §11 Quick Notification + §12 Payment Form + §13 Speedometer + §14 Notification + §2 Icon Set; reconcile §1 Card with globals.css; fix registry "Sidebar.tsx" → "SidebarNav.tsx"; reconsider §19 Toast heading "(Quick Notification)" suffix)

## 12. Implementation Verification

Final verification checklist:

- [ ] **Code Quality**: N/A
- [ ] **Functionality**: deliverable is `ui-design-system.md` with §4 Calendar rewritten + §49-§51 new + Common Patterns Selector Trigger deleted + Theme System Toggle Component cross-ref updated
- [ ] **Testing**: Step 4's 14 grep AC checks all pass + 5 bonus integrity
- [ ] **Integration**: section numbering continuous §1-§51; cross-references valid (5 cross-refs documented in AC10); doc-wide broken-ref sweep clean
- [ ] **Documentation**: deliverable IS the doc; written in English; matches established template
- [ ] **No code branch in em-ecosystem-code**: confirm clean

## 13. Module-Level Planning

N/A.

## 14. Satellite App Planning

N/A.

---

**Plan ready. Awaiting user approval to proceed to `/develop SCRUM-343`.**
