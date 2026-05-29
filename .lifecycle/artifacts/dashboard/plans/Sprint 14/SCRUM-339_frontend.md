# Frontend Implementation Plan: SCRUM-339 Reconcile ui-design-system.md — Display primitives

**Detected scope**: `frontend` (docs reconciliation of frontend components — read-only on code, write-only on `ai-specs/specs/ui-design-system.md`)

> **B6 of 9 sub-tickets** from SCRUM-329 Part B reconciliation. Sibling of SCRUM-334 (B1), SCRUM-335 (B2), SCRUM-336 (B3), SCRUM-337 (B4), SCRUM-338 (B5) — all completed. **6th application** of carry-forward Accepted-Trivial pattern. Largest cluster by gate count: 9 components, all spec-export-sourced (zero JSX-only sections expected, unlike B5). Single big-edit insert at the end of Components list. Originally 10 components in audit-B7; CopyField was already covered in our B5/SCRUM-338, so this cluster is 9.

## 1. Codebase State Verification (2026-05-02)

- **Sprint**: Sprint 14 (id=477)
- **Module**: `dashboard`
- **Anchors**:
  - Code (`em-ecosystem`): `8d2fa80c` (post-SAT01-5 round 2 — unchanged through B1-B5)
  - Doc (`ai-specs`): `4ed94e9` (post-/update-docs of SCRUM-338)
- **Common Patterns anchor**: line 1720 of `ui-design-system.md` (post-B5)
- **Files to be read** (read-only inputs — all 9 have spec exports, NO JSX-only sections):
  - `nexacore-dashboard/src/components/ui/Avatar.tsx` (80 lines, line 21 → `baseClass`, line 24 → `sizeClasses` — **split exports, no consolidated `avatarSpecs`**)
  - `nexacore-dashboard/src/components/ui/Badge.tsx` (49 lines, line 17 → `baseClass`, line 19 → `variantClasses`, line 30 → `sizeClasses` — **split exports, no consolidated `badgeSpecs`**)
  - `nexacore-dashboard/src/components/ui/IconBadge.tsx` (61 lines, line 12 → `iconBadgeSpecs`)
  - `nexacore-dashboard/src/components/ui/Spinner.tsx` (32 lines, line 6 → `spinnerSpecs` — includes `delayPattern: 300ms` note)
  - `nexacore-dashboard/src/components/ui/InfinitySpinner.tsx` (67 lines, line 23 → `infinitySpinnerSpecs`)
  - `nexacore-dashboard/src/components/ui/RingSpinner.tsx` (106 lines, line 24 → `ringSpinnerSpecs`)
  - `nexacore-dashboard/src/components/ui/Divider.tsx` (54 lines, line 7 → `dividerSpecs`)
  - `nexacore-dashboard/src/components/ui/Accordion.tsx` (133 lines, line 19 → `accordionSpecs`)
  - `nexacore-dashboard/src/components/ui/EmptyState.tsx` (43 lines, line 6 → `emptyStateSpecs`)
  - `ai-specs/specs/ui-design-system.md` — anchor at line 1720 (`## Common Patterns` heading)
- **File to be written**: `ai-specs/specs/ui-design-system.md` (single insert before `## Common Patterns`)

## 2. Overview

This ticket adds 9 Display primitive components — the visual atoms used as building blocks across the dashboard. All 9 are Missing-from-doc per the audit. After this ticket:

- **§33 Avatar**: NEW (3 sizes, name initials fallback, image error fallback to User icon)
- **§34 Badge**: NEW (7 variants, 3 sizes — most variant-rich primitive in the cluster)
- **§35 IconBadge**: NEW (square icon container, 5 variants, 3 sizes)
- **§36 Spinner**: NEW (generic circular border, 3 sizes, **document `delayPattern: 300ms` note** to prevent flash on fast responses)
- **§37 InfinitySpinner**: NEW (figure-8 SVG dashoffset animation, used inside Buttons during loading)
- **§38 RingSpinner**: NEW (sonar/ripple SVG SMIL animation, used for page loading)
- **§39 Divider**: NEW (3 types: line/label/vertical)
- **§40 Accordion**: NEW (2 trigger variants, grid-row CSS expand/collapse animation)
- **§41 EmptyState**: NEW (Inbox icon default, optional action Button)

Final section count: **§1–§41** (current §1-§32 + 9 new = +9).

Per the design-system source-of-truth rule, /develop pauses for sign-off at each component — **9 gates total** (largest count in any Part B sub-ticket).

## 3. Architecture Context

```
ui-design-system.md (post-/update-docs of SCRUM-338)
├─ §1-§32 (untouched)
├─ §32 CountdownTimer (last existing numbered section)
└─ ## Common Patterns (line 1720)        ← INSERT 9 new sections BEFORE this anchor
```

After B6:
```
ui-design-system.md (post-B6)
├─ §1-§32 (untouched)
├─ §33 Avatar (NEW)
├─ §34 Badge (NEW)
├─ §35 IconBadge (NEW)
├─ §36 Spinner (NEW — generic circular)
├─ §37 InfinitySpinner (NEW — figure-8)
├─ §38 RingSpinner (NEW — sonar/ripple)
├─ §39 Divider (NEW)
├─ §40 Accordion (NEW)
├─ §41 EmptyState (NEW)
└─ ## Common Patterns
```

**Branching exception**: 6th application of carry-forward Accepted-Trivial. No `feature/SCRUM-339-frontend` branch in `em-ecosystem-code`. Convention silenced.

**Three-spinner clustering**: §36/§37/§38 are documented consecutively to make the comparative Spinner / InfinitySpinner / RingSpinner trio easy to navigate. Each cites the DaisyUI v5 origin (`loading-*` family) and use case (button loading vs page loading). Cross-references between the three are bidirectional.

## 4. Implementation Steps

### Step 0: No code branch (carry-forward Accepted-Trivial)

Working directly in `ai-specs/` working tree on `main`. No re-justification needed (6th application).

### Step 1: Discovery — read 9 spec exports

- **Files**: read-only — 9 .tsx files (~625 lines total)
- **Action**: extract spec values (variants, sizes, base classes, animation pattern notes) into working notes.
- **Implementation steps**:
  1. Open `Avatar.tsx`, capture `baseClass` (line 21) + `sizeClasses` (line 24) + `iconSizes` (line 30, internal) + `getInitials` algorithm (line 36) + img-error fallback chain
  2. Open `Badge.tsx`, capture `baseClass` (line 17) + `variantClasses` (line 19, 7 variants) + `sizeClasses` (line 30, 3 sizes)
  3. Open `IconBadge.tsx`, capture `iconBadgeSpecs` (line 12) — full spec object
  4. Open `Spinner.tsx`, capture `spinnerSpecs` (line 6) — pay attention to `delayPattern` field (the 300ms note)
  5. Open `InfinitySpinner.tsx`, capture `infinitySpinnerSpecs` (line 23) + scan SVG dashoffset animation logic
  6. Open `RingSpinner.tsx`, capture `ringSpinnerSpecs` (line 24) + scan SMIL animation logic
  7. Open `Divider.tsx`, capture `dividerSpecs` (line 7) — 3 types
  8. Open `Accordion.tsx`, capture `accordionSpecs` (line 19) + scan grid-row CSS animation pattern (200ms transition on `grid-template-rows`)
  9. Open `EmptyState.tsx`, capture `emptyStateSpecs` (line 6) — composition pattern
- **Watch for surprises** (will become deviations if found):
  - Non-token colors (B5 pattern: `text-green-600`)
  - Hardcoded non-theme-aware backgrounds (B5 pattern: `bg-white`)
  - Declared-but-unused props (B5 pattern: `onGenerate`)
  - Spec-vs-JSX divergences (B3/B4 pattern: documented in honest-disclosure blockquote)

### Step 2: Per-component drafting + user approval (9 sub-steps)

Order matters: all 9 are independent (no inter-dependencies), but the trio §36/§37/§38 should be drafted and reviewed together since they form a comparative cluster. Order:

1. Avatar (single most-used display primitive)
2. Badge (highest variant count — anchor for the variant-token catalog)
3. IconBadge (Avatar's structural cousin)
4. Spinner (anchor for the spinner trio)
5. InfinitySpinner (Spinner sibling)
6. RingSpinner (Spinner sibling)
7. Divider (small, independent)
8. Accordion (most behavior-rich — animation pattern documentation)
9. EmptyState (composes other primitives — last)

#### Step 2a: Draft §33 Avatar (Gate 1)

- **Action**: from `Avatar.tsx` `baseClass` + `sizeClasses` (split exports), draft a new section.
- **Content scope**: 3 sizes (sm/md/lg = 32/40/64), border `border-border-components`, bg `bg-surface-tertiary`, image rendering with `object-cover`, name-initials fallback (1-2 chars, `getInitials` algorithm), final fallback to `lucide/User` icon (sized to 14/18/28 per size).
- **Source citation** (handles split exports): `Source: Avatar.tsx:21 (baseClass), :24 (sizeClasses)`.
- **Disclosure**: split-export pattern noted in plan — Source line cites both exports separately. Anticipated Accepted-Trivial.
- **Token references**: `--border-components`, `--surface-tertiary`, `--content-secondary`, `--content-primary` (50% opacity for fallback icon).
- **Cross-references**: none.
- **Present for approval**: Gate 1.

#### Step 2b: Draft §34 Badge (Gate 2)

- **Action**: from `Badge.tsx` `baseClass` + `variantClasses` + `sizeClasses` (split exports — 3 of them), draft a new section.
- **Content scope**: 7 variants (default/success/warning/error/info/kbd/overlay) with their token mappings, 3 sizes (sm `text-caption px-2 py-0.5` / md `text-body px-2.5 py-1` / lg `text-h3 px-3 py-1.5`), `rounded-md` (`--radius-md`), `inline-flex items-center font-normal`.
- **Source citation**: `Source: Badge.tsx:17 (baseClass), :19 (variantClasses), :30 (sizeClasses)`.
- **Disclosure**: split-export pattern (3 exports) — same Accepted-Trivial as Avatar, noted for both.
- **Token references**: per variant (`--surface-subtle/--content-secondary` for default, `--success-bg/--success` for success, etc.) — full table.
- **Cross-references**: none.
- **Present for approval**: Gate 2.

#### Step 2c: Draft §35 IconBadge (Gate 3)

- **Action**: from `iconBadgeSpecs`, draft a new section.
- **Content scope**: square icon container (NOT rounded — distinguishes from Avatar), 5 variants (default/success/warning/error/info — no kbd/overlay), 3 sizes (sm 32 / md 40 / lg 56). Composition: takes a `lucide` icon as child or `icon` prop, renders centered.
- **Source citation**: `Source: IconBadge.tsx:12`.
- **Token references**: per variant.
- **Cross-references**: contrast with §33 Avatar (rounded vs square; image-bearing vs icon-only).
- **Present for approval**: Gate 3.

#### Step 2d: Draft §36 Spinner (Gate 4 — anchor for trio)

- **Action**: from `spinnerSpecs`, draft a new section.
- **Content scope**: generic circular border spinner (`border-border-strong border-t-content-primary`), 3 sizes (sm 16 / md 24 / lg 32), `animate-spin` Tailwind utility.
- **Critical**: document the `delayPattern: 300ms` field — explain WHY (prevents flash on fast responses; consumer wraps the spinner in a 300ms `setTimeout` before showing).
- **Source citation**: `Source: Spinner.tsx:6`.
- **Token references**: `--border-strong`, `--content-primary`.
- **Cross-references**: forward to §37 InfinitySpinner + §38 RingSpinner with their distinct use cases.
- **Present for approval**: Gate 4.

#### Step 2e: Draft §37 InfinitySpinner (Gate 5 — Spinner sibling)

- **Action**: from `infinitySpinnerSpecs`, draft a new section.
- **Content scope**: figure-8 SVG with dashoffset animation (DaisyUI v5 `loading-infinity` replication), 3 sizes (sm 16 / md 24 / lg 32). Use case: **inside Buttons during loading** (smaller visual footprint than circular spinner; doesn't block layout).
- **Source citation**: `Source: InfinitySpinner.tsx:23`.
- **Token references**: per spec object.
- **Cross-references**: §36 Spinner (parent of trio) + §38 RingSpinner (sibling).
- **Present for approval**: Gate 5.

#### Step 2f: Draft §38 RingSpinner (Gate 6 — Spinner sibling)

- **Action**: from `ringSpinnerSpecs`, draft a new section.
- **Content scope**: sonar/ripple SVG with SMIL animation (DaisyUI v5 `loading-ring` replication), 3 sizes (sm 16 / md 24 / lg 32). Use case: **page loading** (larger visual presence; centered in empty viewport while page initializes).
- **Source citation**: `Source: RingSpinner.tsx:24`.
- **Token references**: per spec object.
- **Cross-references**: §36 Spinner + §37 InfinitySpinner. Comparative summary table at the end of §38 distinguishing the three.
- **Present for approval**: Gate 6.

#### Step 2g: Draft §39 Divider (Gate 7)

- **Action**: from `dividerSpecs`, draft a new section.
- **Content scope**: 3 types — `line` (default — horizontal `bg-border-strong h-px w-full`), `label` (centered text on horizontal line — `flex items-center` with two `flex-1` lines flanking text), `vertical` (`bg-border-strong w-px h-full`). Uses `bg-border-strong` (which has 8% opacity at the token level).
- **Source citation**: `Source: Divider.tsx:7`.
- **Token references**: `--border-strong`.
- **Cross-references**: distinguish from inline text dividers in §10 Breadcrumbs ("/" or "→") and §8 Analytics Graph ("|") which are NOT this component.
- **Present for approval**: Gate 7.

#### Step 2h: Draft §40 Accordion (Gate 8 — animation-rich)

- **Action**: from `accordionSpecs`, draft a new section.
- **Content scope**: 2 trigger variants (default — flat row with chevron right; section — bordered card with chevron right at corner), divider option between trigger and content, ChevronDown 200ms rotate animation on expand, **grid-row CSS expand/collapse animation pattern** (uses `grid-template-rows: 0fr` ↔ `1fr` transition trick, 200ms ease-in-out — the canonical accessible-height-animation technique).
- **Source citation**: `Source: Accordion.tsx:19`.
- **Token references**: per spec object.
- **Cross-references**: contrast with §6 Tabs (which switches single-active content in place rather than expand/collapse) and §27 CommandPalette (which uses overlay rather than inline expand).
- **Present for approval**: Gate 8.

#### Step 2i: Draft §41 EmptyState (Gate 9 — composes others)

- **Action**: from `emptyStateSpecs`, draft a new section.
- **Content scope**: vertical stack — `lucide/Inbox` icon (48px default, color `text-content-secondary`) + title (`text-h3 font-semibold`) + description (`text-body text-content-secondary`) + optional action Button (defaults to primary md). Padding: `py-12 px-4`. Center-aligned.
- **Source citation**: `Source: EmptyState.tsx:6`.
- **Token references**: per spec object.
- **Cross-references**: composes a Button (refer to §18 Button Set for variants).
- **Present for approval**: Gate 9.

### Step 3: Apply single big-edit insert

- **File**: `ai-specs/specs/ui-design-system.md`
- **Action**: ONE Edit operation. Anchor: `## Common Patterns` line at 1720. Replace with `[9 new sections + 9 closing dividers] + ## Common Patterns`.
- **Rationale**: single edit = atomic, all-or-nothing. Anchor is unique in the doc. Same pattern proven in B5.
- **Implementation steps**:
  1. Construct the combined new_string: §33 Avatar + `---` + §34 Badge + `---` + §35 IconBadge + `---` + §36 Spinner + `---` + §37 InfinitySpinner + `---` + §38 RingSpinner + `---` + §39 Divider + `---` + §40 Accordion + `---` + §41 EmptyState + `---` + (the original `## Common Patterns` heading)
  2. Apply the Edit
  3. Verify each section landed correctly

### Step 4: Build verification (12 grep AC checks)

```bash
cd ai-specs/ai-specs/specs

# AC1-AC9: each new section exists (9 checks)
grep -cE '^### 33\. Avatar' ui-design-system.md         # expected: 1
grep -cE '^### 34\. Badge' ui-design-system.md          # expected: 1
grep -cE '^### 35\. IconBadge' ui-design-system.md      # expected: 1
grep -cE '^### 36\. Spinner' ui-design-system.md        # expected: 1
grep -cE '^### 37\. InfinitySpinner' ui-design-system.md # expected: 1
grep -cE '^### 38\. RingSpinner' ui-design-system.md    # expected: 1
grep -cE '^### 39\. Divider' ui-design-system.md        # expected: 1
grep -cE '^### 40\. Accordion' ui-design-system.md      # expected: 1
grep -cE '^### 41\. EmptyState' ui-design-system.md     # expected: 1

# AC10: section numbering continuous §1-§41
grep -E '^### [0-9]+\.' ui-design-system.md | grep -oE '^### [0-9]+' | grep -oE '[0-9]+' \
  | awk 'BEGIN{prev=0} {if ($1 != prev+1) print "GAP at " $1; prev=$1} END{print "max="prev}'
# expected: no GAP, max=41

# AC11: §36 Spinner documents 300ms delayPattern
awk '/^### 36\. Spinner/,/^---$/' ui-design-system.md | grep -ciE '(300ms|delayPattern)'
# expected: ≥1

# AC12: each new section has a Source: line
for n in 33 34 35 36 37 38 39 40 41; do
  c=$(awk "/^### $n\\. /,/^---$/" ui-design-system.md | grep -c '^Source:')
  echo "§$n Source: $c"
done
# expected: all 9 lines show "1"
```

**Note**: All AC checks use `grep -cE` flag per the lessons-learned from B4 (the bash `+` requires extended regex).

### Step 5: Update Technical Documentation

Covered by Step 3. The deliverable IS the doc update.

## 5. Implementation Order

```
── /develop phase (LOCAL, ai-specs working tree on main) ──
Step 0   No branch (carry-forward — 6th application)
Step 1   Read 9 spec exports (~20-25 min, ~625 lines total)
Step 2a  Draft §33 Avatar → user approval (Gate 1)              ┐
Step 2b  Draft §34 Badge → user approval (Gate 2)               │
Step 2c  Draft §35 IconBadge → user approval (Gate 3)           │
Step 2d  Draft §36 Spinner → user approval (Gate 4)             ├─ ~9 review cycles
Step 2e  Draft §37 InfinitySpinner → user approval (Gate 5)     │  ~2-3h total
Step 2f  Draft §38 RingSpinner → user approval (Gate 6)         │
Step 2g  Draft §39 Divider → user approval (Gate 7)             │
Step 2h  Draft §40 Accordion → user approval (Gate 8)           │
Step 2i  Draft §41 EmptyState → user approval (Gate 9)          ┘
Step 3   Apply single big-edit insert (9 sections + closing dividers)
Step 4   Build verification (12 grep AC checks)
Step 5   (covered by Step 3)
         ── /develop ends ──

── /verify + /update-docs phases — same lifecycle as B1-B5 ──
```

**Estimated effort**: ~2-3h /develop with 9 user-approval gates. Could split into 2 sessions if the user wants a break (e.g., gates 1-5 in session 1, gates 6-9 + apply in session 2). All gates simpler than B5's JSX-only sections (every component has a spec export to drive the draft).

## 6. Testing Checklist

- [ ] §33 Avatar added with split-export Source citation (AC1 passes)
- [ ] §34 Badge added with 3-export Source citation (AC2 passes)
- [ ] §35 IconBadge added (AC3 passes)
- [ ] §36 Spinner added with 300ms delayPattern documented (AC4 + AC11 pass)
- [ ] §37 InfinitySpinner added (AC5 passes)
- [ ] §38 RingSpinner added (AC6 passes)
- [ ] §39 Divider added (AC7 passes)
- [ ] §40 Accordion added with grid-row animation pattern documented (AC8 passes)
- [ ] §41 EmptyState added (AC9 passes)
- [ ] Numbering continuous §1-§41 (AC10 passes — max=41)
- [ ] All 9 sections cite spec export source (AC12 passes — 9/9 lines = 1)
- [ ] Spot-check 2-3 spec values per section against spec exports
- [ ] Spinner trio cross-references (§36 ↔ §37 ↔ §38) all valid
- [ ] §41 EmptyState references §18 Button Set valid
- [ ] No internal cross-reference broken across the doc

## 7. Error Handling Patterns

N/A — markdown doc edit. If JSX read reveals additional behaviors not anticipated (non-token colors, dead props, spec-vs-JSX divergences), document with the standard honest-disclosure pattern (B5 precedent).

## 8. UI/UX Considerations

N/A — docs change.

## 9. Dependencies

- Read access to 9 component .tsx files
- Write access to `ai-specs/specs/ui-design-system.md`
- User availability for 9 approval gates (or 2 sessions of 4-5 + 4-5 if split)

## 10. Notes

- **9 user-approval gates** — largest count in any Part B sub-ticket so far.
- **All 9 have spec exports** — no JSX-only sections expected (different from B5 which had 2 JSX-only).
- **Avatar + Badge use split exports** — Source line cites multiple exports per section. 2 anticipated Accepted-Trivial deviations.
- **Single big-edit insert** — saves ~8 individual edits vs inserting 9 sections separately.
- **Spinner trio (§36/§37/§38)** — comparative cluster; cross-references bidirectional; comparative summary table at the end of §38.
- **Spinner `delayPattern: 300ms`** — must be documented (AC11). Consumer wraps the spinner in a `setTimeout(300ms)` to prevent flash on fast responses. Non-obvious behavior.
- **Accordion grid-row animation pattern** — the canonical accessible-height-animation trick (`grid-template-rows: 0fr ↔ 1fr`). Document explicitly so a future developer doesn't break it during refactor.
- **AC grep checks use `-cE` flag** — lesson from B4.
- **English content only**.

## 11. Next Steps After Implementation

After /update-docs commits SCRUM-339's edits, the next sub-ticket of SCRUM-329 Part B is **B7 — Buttons + interactive** (audit-B3): Button (drift), IconButton (add), SegmentedControl (add). 3 components — smallest cluster. Mix of rewrite (Button drift) + add (IconButton, SegmentedControl). B7 will be opened only after this `/update-docs` lands.

Remaining Part B clusters after B6:
- **B7 (audit-B3)**: Buttons + interactive (3 components — rewrite + add)
- **B8 (audit-B5)**: Feedback / Alerts (6 components — rewrite + add, CountdownTimer already done)
- **B9 (audit-B8b)**: Misc + selectors (5 components — TurnstileWidget already done; LanguageSelector + EmailSelector are drift in Common Patterns "Selector Trigger")
- **B10 (audit-B9)**: Cleanup — must run last (deletes orphaning cross-references).

## 12. Implementation Verification

Final verification checklist:

- [ ] **Code Quality**: N/A
- [ ] **Functionality**: deliverable is `ui-design-system.md` with 9 new sections at end of Components list
- [ ] **Testing**: Step 4's 12 grep AC checks all pass
- [ ] **Integration**: section numbering continuous §1-§41; cross-references valid (Spinner trio, EmptyState → Button)
- [ ] **Documentation**: deliverable IS the doc; written in English; matches established template
- [ ] **No code branch in em-ecosystem-code**: confirm clean

## 13. Module-Level Planning

N/A.

## 14. Satellite App Planning

N/A.

---

**Plan ready. Awaiting user approval to proceed to `/develop SCRUM-339`.**
