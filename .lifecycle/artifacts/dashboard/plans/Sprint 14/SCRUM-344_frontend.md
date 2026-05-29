# Frontend Implementation Plan: SCRUM-344 Reconcile ui-design-system.md — Pure adds cluster

**Detected scope**: `frontend` (docs reconciliation of frontend components — read-only on code, write-only on `ai-specs/specs/ui-design-system.md`)

> **B9b of 9 sub-tickets** (split from B9 per user decision into B9a + B9b — B9a closed in SCRUM-343). Sibling of SCRUM-334-343 (B1-B9a) — all completed. **10th application** of carry-forward Accepted-Trivial pattern. **Pure adds cluster** — 4 components, no rewrites, no deletes, no structural decisions. Single big-edit insert pattern (proven across B5/B6/B8/B9a). 4 user-approval gates. Section count grows §1-§51 → §1-§55 (+4).

## 1. Codebase State Verification (2026-05-03)

- **Sprint**: Sprint 14 (id=477)
- **Module**: `dashboard`
- **Anchors**:
  - Code (`em-ecosystem`): `8d2fa80c` (post-SAT01-5 round 2 — unchanged through B1-B9a)
  - Doc (`ai-specs`): `fd0817f` (post-/update-docs of SCRUM-343 / B9a)
- **Common Patterns anchor**: line ~2942 of `ui-design-system.md` (post-B9a — verify exact line at /develop start)
- **Files to be read** (read-only inputs — already captured during /enrich-us, re-confirmed at /develop):
  - `nexacore-dashboard/src/components/ui/DataTable.tsx` (122 lines, **NO spec export — JSX-only**)
  - `nexacore-dashboard/src/components/ui/StickyCard.tsx` (225 lines, **NO spec export — JSX-only**)
  - `nexacore-dashboard/src/components/ui/ImageCropper.tsx` (129 lines, `imageCropperSpecs` line 10)
  - `nexacore-dashboard/src/components/ui/BeforeAfterSlider.tsx` (242 lines, `beforeAfterSliderSpecs` line 27)
  - `ai-specs/specs/ui-design-system.md` — anchor at `## Common Patterns` line ~2942
- **File to be written**: `ai-specs/specs/ui-design-system.md` (1 Edit: single big-edit insert §52-§55 before `## Common Patterns` anchor)

## 2. Overview

This ticket adds 4 components — the **pure-adds cluster** of B9b. Most operationally-simple Part B sub-ticket (no structural decisions, no rewrites, no deletes). After this ticket:

- **§52 DataTable**: NEW (JSX-only, generic typed `<T>`, ColumnDef interface, skeleton loading rows, empty state, optional row click, custom alignment + width per column, header `text-content-tertiary` 3rd opacity step disclosure)
- **§53 StickyCard**: NEW (JSX-only, 2 positions top/bottom, IntersectionObserver-driven floating mode, mobile collapsible strip, composes §42 IconButton — first B9b→B7 cross-ref, ResizeObserver, 2 internal sub-components)
- **§54 ImageCropper**: NEW (sourced from `imageCropperSpecs`, composes §5 Modal + §17 Slider — 2 cross-cluster cross-refs to B4 + B2, `react-easy-crop` external library — 3rd in Part B after framer-motion + cmdk, 300×300 circular crop, JPEG 0.9 output)
- **§55 BeforeAfterSlider**: NEW (sourced from `beforeAfterSliderSpecs`, composes Next.js `<Image>` — first time documented, clip-path-based labels, 4 aspect ratios, objectFit cover/contain, touch-aware drag with `passive:false` + image-drag prevention 3-layer, 300ms transitions on click/release with 0 transition during drag)

Final section count: **§1-§55** (current §1-§51 + 4 new = +4).

Per the design-system source-of-truth rule, /develop pauses for sign-off at each component — **4 gates total**.

## 3. Architecture Context

```
ui-design-system.md (post-fd0817f / B9a)
├─ §1-§51 (untouched)
└─ ## Common Patterns                       ← INSERT 4 new sections BEFORE this anchor
```

After B9b:
```
ui-design-system.md (post-B9b)
├─ §1-§51 (untouched)
├─ §52 DataTable (NEW — JSX-only, generic typed)
├─ §53 StickyCard (NEW — JSX-only, IntersectionObserver pattern)
├─ §54 ImageCropper (NEW — composes §5 + §17, react-easy-crop)
├─ §55 BeforeAfterSlider (NEW — composes Next.js <Image>, clip-path labels)
└─ ## Common Patterns
```

**Branching exception**: 10th application of carry-forward Accepted-Trivial. No `feature/SCRUM-344-frontend` branch in `em-ecosystem-code`. Convention silenced.

## 4. Implementation Steps

### Step 0: No code branch (carry-forward Accepted-Trivial)

Working directly in `ai-specs/` working tree on `main`. No re-justification needed (10th application).

### Step 1: Discovery (already complete from /enrich-us)

All 4 component files already read during /enrich-us. JSX details captured. **Watch list confirmed**:
- DataTable header `text-content-tertiary` (3rd opacity step — same as B8 §19 Toast close-button, possible 11th opacity-pattern occurrence if reclassified)
- StickyCard 2 internal sub-components (StickyCardTop + StickyCardBottom — non-obvious internal architecture)
- StickyCard composes §42 IconButton — first B9b→B7 cross-ref
- ImageCropper `react-easy-crop` external library — 3rd in Part B
- ImageCropper composes §5 Modal + §17 Slider — 2 cross-cluster cross-refs (B4 + B2)
- BeforeAfterSlider clip-path technique — advanced visual pattern with `inset()` calculations
- BeforeAfterSlider Next.js `<Image>` integration — first time documented
- BeforeAfterSlider touch-aware drag + image-drag prevention (3-layer defense)

### Step 2: Per-component drafting + user approval (4 sub-steps)

Order: smallest/simplest first (DataTable), then progressively more complex (StickyCard architecture, ImageCropper composition, BeforeAfterSlider clip-path technique).

#### Step 2a: Draft §52 DataTable (Gate 1)

- **Action**: from JSX directly (no spec export — JSX-only disclosure required), draft a new section.
- **Content scope**:
  - Container: `overflow-x-auto rounded-xl border border-border-strong bg-surface-primary`
  - Generic typed: `<T>` parameter; `data: T[]`; `keyExtractor: (row: T) => string`
  - `ColumnDef<T>` interface: `key`, `label`, `render: (row: T) => React.ReactNode`, optional `width`/`align`/`headerClassName`/`cellClassName`
  - Header row: `bg-surface-secondary border-b border-border-strong`; cell `text-caption font-semibold uppercase tracking-wider text-content-tertiary` with align/width
  - Body row: `border-b border-border-strong last:border-b-0`; optional `hover:bg-surface-subtle`; optional `cursor-pointer` when `onRowClick`
  - Body cell: `px-4 py-3 text-body text-content-primary` with align/width
  - Loading state: 5 skeleton rows by default (`loadingRows` prop), each cell `h-4 rounded bg-surface-subtle animate-pulse`
  - Empty state: full-width centered text "No data found." (`emptyMessage` prop) at `py-12 text-body text-content-secondary`
  - Alignment per column: left (default) / center / right
- **Source citation**: `Source: DataTable.tsx (no spec export — JSX-only)` + `ColumnDef<T>` exported interface.
- **Disclosures**:
  - JSX-only (no spec export)
  - Generic typing `<T>` — same pattern as §43 SegmentedControl
  - Header `text-content-tertiary` — 3rd opacity step (same disclosure category as B8 §19 Toast close-button — possible token verification needed)
  - Skeleton loading rows pattern (animate-pulse)
- **Cross-references**: §41 EmptyState (sister empty-display primitive — different visual context); §42 IconButton (potential row-action composer in consumer code).
- **Present for approval**: Gate 1.

#### Step 2b: Draft §53 StickyCard (Gate 2)

- **Action**: from JSX directly (no spec export — JSX-only disclosure required), draft a new section.
- **Content scope**:
  - **2 positions** (`position` prop): `top` (renders `StickyCardTop` sub-component) or `bottom` (default — renders `StickyCardBottom` sub-component)
  - Internal architecture: 2 sub-components share interface but differ in: (a) rounded corner direction (top has `rounded-b-xl`, bottom has `rounded-t-xl`); (b) z-index (top has `z-10`, bottom has `z-30`); (c) mobile-expanded position (top renders icon→content, bottom renders content→icon)
  - Default state: renders as `card-flat shadow-none` wrapper around children — invisible to layout
  - **IntersectionObserver-driven floating mode**: when card scrolls outside viewport (threshold 0.1), `isFloating=true` triggers fixed positioning + shadow
  - **ResizeObserver**: tracks card dimensions in real-time so floating clone matches original card width/left
  - Floating styling: `fixed bottom-0|top-0 z-30|z-10 border border-border-strong bg-surface-primary shadow-card`
  - Mobile collapsible strip (responsive): `sm:hidden` shows only chevron toggle when collapsed, expands to show children when toggled. Composes §42 IconButton (variant=`default`, size=`sm`) for the toggle.
  - Desktop (when floating): `hidden sm:flex` — always-expanded card
  - Window resize listener: `window.addEventListener("resize", updateRect)` while floating
- **Source citation**: `Source: StickyCard.tsx (no spec export — JSX-only)` + composes §42 IconButton + uses CSS class `card-flat` (defined in `globals.css`).
- **Disclosures**:
  - JSX-only (no spec export)
  - 2 internal sub-components pattern (StickyCardTop + StickyCardBottom — shared interface but distinct mobile/desktop branches)
  - Composes §42 IconButton for mobile toggle — first B9b→B7 cross-ref
  - IntersectionObserver + ResizeObserver — advanced observation patterns documented
  - Mobile collapsible strip with `sm:hidden` / `hidden sm:flex` responsive pattern
  - `card-flat` CSS class from globals.css (verify class definition)
- **Cross-references**: §42 IconButton (composes for mobile toggle); §1 Card (sibling card primitive — `card-flat` class shared).
- **Present for approval**: Gate 2.

#### Step 2c: Draft §54 ImageCropper (Gate 3)

- **Action**: from `imageCropperSpecs` (line 10) + JSX, draft a new section.
- **Content scope**:
  - Composes §5 Modal (`size="lg"`) — first B9b→B4 cross-ref
  - Composes §17 Slider (zoom control: `min=1`, `max=3`, `step=0.01`, label "Zoom") — first B9b→B2 cross-ref
  - **External library**: `react-easy-crop` (Cropper component) — 3rd external library documented in Part B (after framer-motion in B8 + cmdk in B4)
  - Crop area: `aspect-square w-[350px]` container with `bg-surface-tertiary rounded-lg`; fixed `cropSize={{ width: 300, height: 300 }}` (300×300 circular crop area)
  - Default `cropShape="round"` (matches §33 Avatar shape) but accepts `"rect"` override
  - Default `aspect={1}` (square) — overridable
  - Default `loading={false}` — when true, propagates to ConfirmModal's loading state
  - Output: JPEG 0.9 quality via `getCroppedImg` utility from `@/lib/crop-image` (uses `canvas.toBlob()`)
  - **CropData type** (exported): `{ areaPercent, areaPixels }` — percentage-based for layout-independent restoration, pixel-based for canvas extraction
  - `initialCropData` prop allows restoring a previous crop
  - `onCrop(blob, cropData)` callback: blob is the cropped image, cropData is for persistence
- **Source citation**: `Source: ImageCropper.tsx:10 (imageCropperSpecs)` + composes §5 Modal + §17 Slider + library `react-easy-crop` + utility `@/lib/crop-image:getCroppedImg`.
- **Disclosures**:
  - Composes §5 Modal (B4) + §17 Slider (B2) — 2 cross-cluster cross-refs
  - External library `react-easy-crop` — 3rd in Part B
  - 300×300 fixed crop area (`cropSize`) — non-obvious hardcoded value
  - JPEG 0.9 quality output — non-obvious format choice (vs PNG)
  - `CropData` type for restoration — exported type for consumer use
- **Cross-references**: §5 Modal (composes — wrapper); §17 Slider (composes — zoom control); §33 Avatar (sister round-shape primitive — same circular crop result).
- **Present for approval**: Gate 3.

#### Step 2d: Draft §55 BeforeAfterSlider (Gate 4 — most complex, clip-path technique)

- **Action**: from `beforeAfterSliderSpecs` (line 27) + JSX, draft a new section.
- **Content scope**:
  - Container: `relative w-full rounded-xl overflow-hidden bg-surface-tertiary select-none touch-none` + aspect ratio class
  - **External**: Next.js `<Image>` (component from `next/image`) — first time documented in Part B
  - **2 orientations** (`orientation` prop): `horizontal` (default — top/bottom split) or `vertical` (left/right split)
  - **4 aspect ratios** (`aspectRatio` prop): `4/5` (default), `1/1`, `16/9`, `3/4` — class mapped via lookup table
  - **2 object-fit modes** (`objectFit` prop): `cover` (default — fills + crops) or `contain` (fits + shows bg-surface-tertiary around)
  - `initialPosition={50}` (default — centered)
  - **3 composition slots**:
    - `before.label`: rendered in BEFORE clip container — visible only where BEFORE is visible (clip-path animates with slider)
    - `after.label`: rendered in inverse-clip container — visible only where AFTER is exposed (clip-path animates with slider)
    - `children`: always-visible overlay (metadata chips, etc.) — never clipped
  - **Clip-path technique**: BEFORE image clipped via `inset(0 0 ${100-position}% 0)` (horizontal) or `inset(0 ${100-position}% 0 0)` (vertical); AFTER label inverse-clipped via `inset(${position}% 0 0 0)` or `inset(0 0 0 ${position}%)` — same percentage values but flipped orientation
  - Divider line: 1px `bg-border-components` — full-width (horizontal) or full-height (vertical) at `top:position%` or `left:position%`
  - Handle: `40×40px rounded-full bg-surface-primary border border-border-components` centered on divider, contains arrow SVG (4×4 vertical arrows for horizontal orientation, rotated 90° for vertical)
  - Arrow color: `text-content-primary/50` (opacity pattern reference) → `group-hover:text-content-primary` (full opacity on container hover)
  - Cursor: `cursor-ns-resize` (horizontal) or `cursor-ew-resize` (vertical)
  - **Touch-aware drag**: handle has `touchAction: none` + `passive:false` on touchmove + `preventDefault` on touchstart/mousedown
  - **Image-drag prevention** (3-layer defense): `draggable={false}` on `<Image>` + `pointer-events-none` on image layers + `preventDefault` on container `onDragStart` + `preventDefault` on handle `onMouseDown`
  - **Animation**: `300ms ease-out` transition on `clip-path + top + left` when NOT dragging; `none` (zero transition) during drag for instant cursor follow
  - **First click smoothness**: `requestAnimationFrame(() => setIsDragging(true))` ensures the click position transition completes before drag mode engages
  - **Listener lifecycle**: `mousemove`/`touchmove`/`mouseup`/`touchend` attached only while `isDragging === true`
- **Source citation**: `Source: BeforeAfterSlider.tsx:27 (beforeAfterSliderSpecs)` + composes Next.js `<Image>` + 1 internal SVG arrow.
- **Disclosures**:
  - Composes Next.js `<Image>` — external, first time documented in Part B
  - **Clip-path technique** — advanced visual pattern with detailed `inset()` calculations
  - 4 aspect ratios via string union prop (non-standard prop type)
  - 2 object-fit modes (cover vs contain) with rationale
  - 3 composition slots (before.label clipped + after.label inverse-clipped + children always-visible)
  - Touch-aware drag with `passive:false` + `preventDefault`
  - Image-drag prevention (3-layer defense pattern)
  - Animation behavior: 300ms transition on click/release vs 0 transition during drag (`requestAnimationFrame` first-click smoothness)
  - `text-content-primary/50` arrow opacity (extends opacity pattern — could be 12th occurrence if counted)
- **Cross-references**: External Next.js `<Image>` (no §); §17 Slider (sister value-control primitive — different use case: position vs value).
- **Present for approval**: Gate 4.

### Step 3: Apply edit (single big-edit insert)

- **Edit 1**: Single big-edit insert §52-§55 before `## Common Patterns`
  - `old_string`: `## Common Patterns` (anchor — same as B5/B6/B8/B9a)
  - `new_string`: §52 DataTable + `---` + §53 StickyCard + `---` + §54 ImageCropper + `---` + §55 BeforeAfterSlider + `---` + `## Common Patterns`

### Step 4: Build verification (14 grep AC checks + 4-5 bonus integrity)

```bash
cd ai-specs/ai-specs/specs

# AC1-AC4: each new section exists
grep -cE '^### 52\. DataTable' ui-design-system.md          # expected: 1
grep -cE '^### 53\. StickyCard' ui-design-system.md         # expected: 1
grep -cE '^### 54\. ImageCropper' ui-design-system.md       # expected: 1
grep -cE '^### 55\. BeforeAfterSlider' ui-design-system.md  # expected: 1

# AC5: section numbering continuous §1-§55
grep -E '^### [0-9]+\.' ui-design-system.md | grep -oE '^### [0-9]+' | grep -oE '[0-9]+' \
  | awk 'BEGIN{prev=0} {if ($1 != prev+1) print "GAP at " $1; prev=$1} END{print "max="prev}'
# expected: no GAP, max=55

# AC6: each new section has **Source:** line
for n in 52 53 54 55; do
  c=$(awk "/^### $n\. /,/^---$/" ui-design-system.md | grep -cE '^\*\*Source:\*\*')
  echo "§$n Source: $c"
done
# expected: each = 1

# AC7: cross-references valid
echo "§53 → §42 (IconButton): $(awk '/^### 53\. StickyCard/,/^---$/' ui-design-system.md | grep -c '§42')"
echo "§54 → §5 (Modal): $(awk '/^### 54\. ImageCropper/,/^---$/' ui-design-system.md | grep -c '§5 Modal')"
echo "§54 → §17 (Slider): $(awk '/^### 54\. ImageCropper/,/^---$/' ui-design-system.md | grep -c '§17')"
# expected: each ≥1

# AC8: §52 documents generic typing <T>
awk '/^### 52\. DataTable/,/^---$/' ui-design-system.md | grep -ciE '(generic|<T>|T extends)'
# expected: ≥1

# AC9: §53 documents IntersectionObserver
awk '/^### 53\. StickyCard/,/^---$/' ui-design-system.md | grep -c 'IntersectionObserver'
# expected: ≥1

# AC10: §54 documents react-easy-crop
awk '/^### 54\. ImageCropper/,/^---$/' ui-design-system.md | grep -c 'react-easy-crop'
# expected: ≥1

# AC11: §55 documents clip-path technique
awk '/^### 55\. BeforeAfterSlider/,/^---$/' ui-design-system.md | grep -ciE '(clip-path|clipPath)'
# expected: ≥1

# AC12: §52 documents text-content-tertiary 3rd opacity step
awk '/^### 52\. DataTable/,/^---$/' ui-design-system.md | grep -c 'text-content-tertiary'
# expected: ≥1

# AC13 (NEW post-B6, DOC-WIDE per B8 lesson): cross-ref text-match validation
for spec in "52:DataTable" "53:StickyCard" "54:ImageCropper" "55:BeforeAfterSlider" "42:IconButton" "5:Modal" "17:Slider" "33:Avatar" "1:Card" "41:EmptyState"; do
  n="${spec%%:*}"; name="${spec#*:}"
  count=$(grep -cE "^### $n\. $name" ui-design-system.md || echo 0)
  echo "§$n $name: $count"
done
# expected: each = 1

# AC14: doc-wide broken-ref sweep (proactive — B8 lesson)
for pattern in "§11 Tooltip" "§22 Checkboxes" "§18 Button Set" "§23 Input" "§24 DateInput" "§25 MfaDigitInput" "§26 FormField"; do
  c=$(grep -c "$pattern" ui-design-system.md)
  [ "$c" != "0" ] && echo "BROKEN: '$pattern' = $c"
done
echo "(no output above = all clean)"

# Bonus 1: §54 documents external library + utility
awk '/^### 54\. ImageCropper/,/^---$/' ui-design-system.md | grep -ciE '(react-easy-crop|getCroppedImg)'
# expected: ≥2 (both library + utility)

# Bonus 2: §55 documents touch-aware drag + image-drag prevention
awk '/^### 55\. BeforeAfterSlider/,/^---$/' ui-design-system.md | grep -ciE '(touch-aware|image-drag prevention|draggable=false)'
# expected: ≥1

# Bonus 3: file size delta
wc -l ui-design-system.md
# expected: +250-350 lines (4 new sections of substantial detail)
```

**Note**: All AC checks use `grep -cE` flag per the lessons-learned from B4. AC13 + AC14 are the **permanent post-B6/B8 doc-wide cross-reference text-match validation** + broken-ref sweep checks.

### Step 5: Update Technical Documentation

Covered by Step 3. The deliverable IS the doc update.

## 5. Implementation Order

```
── /develop phase (LOCAL, ai-specs working tree on main) ──
Step 0   No branch (carry-forward — 10th application)
Step 1   Discovery (already complete from /enrich-us)
Step 2a  Draft §52 DataTable → user approval (Gate 1)              ┐
Step 2b  Draft §53 StickyCard → user approval (Gate 2)             ├─ ~4 review cycles
Step 2c  Draft §54 ImageCropper → user approval (Gate 3)           │  ~1.5-2h total
Step 2d  Draft §55 BeforeAfterSlider → user approval (Gate 4)      ┘
Step 3   Apply Edit 1 (single big-edit insert §52-§55)
Step 4   Build verification (14 grep AC checks + 4-5 bonus integrity)
Step 5   (covered by Step 3)
         ── /develop ends ──

── /verify + /update-docs phases — same lifecycle as B1-B9a ──
```

**Estimated effort**: ~1.5-2h /develop with 4 user-approval gates. Smaller than B6/B8/B9a — pure adds with no structural decisions or rewrites. BeforeAfterSlider §55 is the most behavior-rich gate (clip-path technique + touch handling + animation).

## 6. Testing Checklist

- [ ] §52 DataTable added (AC1 passes)
- [ ] §53 StickyCard added (AC2 passes)
- [ ] §54 ImageCropper added (AC3 passes)
- [ ] §55 BeforeAfterSlider added (AC4 passes)
- [ ] Numbering continuous §1-§55 (AC5 passes — max=55)
- [ ] All 4 sections cite spec/JSX source (AC6 passes — 4/4 = 1)
- [ ] Cross-references valid (AC7 passes — 3 cross-refs)
- [ ] §52 DataTable documents generic typing (AC8 passes)
- [ ] §53 StickyCard documents IntersectionObserver (AC9 passes)
- [ ] §54 ImageCropper documents react-easy-crop (AC10 passes)
- [ ] §55 BeforeAfterSlider documents clip-path (AC11 passes)
- [ ] §52 documents text-content-tertiary 3rd opacity step (AC12 passes)
- [ ] Cross-ref text-match validation doc-wide (AC13 passes — all 10 §N <Name> verified)
- [ ] Doc-wide broken-ref sweep clean (AC14 passes — 0/7 historical patterns)
- [ ] §54 documents external library + utility (Bonus 1)
- [ ] §55 documents touch-aware drag + image-drag prevention (Bonus 2)
- [ ] File size delta consistent with 4 substantial inserts (Bonus 3)
- [ ] Spot-check 2-3 spec values per section against spec exports
- [ ] No internal cross-reference broken across the doc

## 7. Error Handling Patterns

N/A — markdown doc edit. If JSX read reveals additional behaviors not anticipated, document with the standard honest-disclosure pattern (B5/B6/B7/B8/B9a precedent).

## 8. UI/UX Considerations

N/A — docs change.

## 9. Dependencies

- Read access to 4 component .tsx files (already done in /enrich-us)
- Write access to `ai-specs/specs/ui-design-system.md`
- User availability for 4 approval gates (single session feasible — smaller than B9a)

## 10. Notes

- **4 user-approval gates** — same count as B6/B7/B9a. Single session feasible.
- **Pure adds cluster** — no structural decisions, no rewrites, no deletes. Most operationally-simple Part B sub-ticket.
- **Single big-edit insert** — same anchor pattern as B5/B6/B8/B9a. 1 Edit total.
- **2 JSX-only + 2 spec exports** — same proportion as B5 (2 JSX-only + 3 spec) but inverted to even split.
- **3rd external library documented** in Part B (`react-easy-crop`) after framer-motion (B8) + cmdk (B4 §27 CommandPalette).
- **First Next.js `<Image>` integration** documented in Part B (BeforeAfterSlider §55).
- **Clip-path technique in BeforeAfterSlider §55** — most advanced visual pattern in B9b. Detailed `inset()` calculations for both orientations + 3 composition slots.
- **DataTable header `text-content-tertiary`** — 3rd opacity step (same disclosure category as B8 §19 Toast close-button). Token verification still pending.
- **AC grep checks use `-cE` flag** — lesson from B4.
- **Cross-ref text-match validation runs DOC-WIDE** (AC13) — permanent from B8 lesson.
- **Doc-wide broken-ref sweep proactive** (AC14) — permanent from B8 lesson.
- **English content only**.

## 11. Next Steps After Implementation

After /update-docs commits SCRUM-344's edits, only **B10 (audit-B9) Cleanup** remains — the FINAL sub-ticket of SCRUM-329 Part B. Must run last (deletes orphaning cross-references). Scope: remove §11 Quick Notification + §12 Payment Form + §13 Speedometer + §14 Notification + §2 Icon Set (all Doc-only with no code); reconcile §1 Card with `globals.css` `card-flat` class (now referenced by §53 StickyCard); fix registry "Sidebar.tsx" → "SidebarNav.tsx"; reconsider §19 Toast heading "(Quick Notification)" suffix.

**B10 will close out the SCRUM-329 Part B reconciliation initiative entirely.**

## 12. Implementation Verification

Final verification checklist:

- [ ] **Code Quality**: N/A
- [ ] **Functionality**: deliverable is `ui-design-system.md` with §52-§55 new sections
- [ ] **Testing**: Step 4's 14 grep AC checks all pass + 3 bonus integrity
- [ ] **Integration**: section numbering continuous §1-§55; cross-references valid (3 cross-refs documented in AC7); doc-wide broken-ref sweep clean
- [ ] **Documentation**: deliverable IS the doc; written in English; matches established template
- [ ] **No code branch in em-ecosystem-code**: confirm clean

## 13. Module-Level Planning

N/A.

## 14. Satellite App Planning

N/A.

---

**Plan ready. Awaiting user approval to proceed to `/develop SCRUM-344`.**
