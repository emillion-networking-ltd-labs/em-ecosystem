# Frontend Implementation Plan: SCRUM-330 Enhance BeforeAfterSlider — clip labels with respective image

## Overview

Extend `BeforeAfterSlider` (delivered in SCRUM-328) so that before/after labels can be clipped to match their respective image. Currently labels rendered via `children` always show regardless of slider position — users dragging the slider to an extreme position see both labels on whichever image is visible, which is semantically wrong ("ANTES" label showing over the AFTER image). Add two optional label slots (`before.label`, `after.label`) that clip alongside their image. Keep `children` for always-visible content.

Backward compatible: existing consumers using `children` continue to work untouched.

## Scope

### In scope
- Extend `Media` interface with optional `label?: React.ReactNode`
- Inside `BeforeAfterSlider.tsx`: render `before.label` inside the existing BEFORE clip container; add new inverse-clip container for `after.label`
- Update `beforeAfterSliderSpecs` export to document the new label slots
- Update `BeforeAfterSliderCard` in `ComponentShowcase.tsx` to demonstrate the new slots (replace current children-based ANTES/DESPUÉS with label slots)

### Out of scope
- Any Badge changes (variants as SCRUM-328 delivered)
- Breaking changes to `children` API
- New orientations or aspect ratios
- Satellite consumption — `sat-cristian-garcia/` is untracked in main; once SAT01-1 refactors TransformationsPreview to consume UI Core, it adopts the new slots automatically
- Tests / stories / MDX (project convention: specs exports + showcase only)
- Other UI Core components

## Files Affected

| File | Change |
|------|--------|
| `nexacore-dashboard/src/components/ui/BeforeAfterSlider.tsx` | Modify — Media extended with label, new inverse-clip container, specs updated |
| `nexacore-dashboard/src/components/admin/ComponentShowcase.tsx` | Modify — BeforeAfterSliderCard uses label slots instead of children for ANTES/DESPUÉS |

## Clip-path formulas (reference)

| Orientation | BEFORE container (existing) | AFTER label container (new, inverse) |
|-------------|------------------------------|---------------------------------------|
| horizontal  | `inset(0 0 ${100 - position}% 0)` | `inset(${position}% 0 0 0)` |
| vertical    | `inset(0 ${100 - position}% 0 0)` | `inset(0 0 0 ${position}%)` |

Mental model: BEFORE clip shrinks from the opposite edge of the divider; AFTER-label clip is its complement.

## Implementation Steps

### Step 0: Create feature branch from main
```
git checkout main && git pull origin main
git checkout -b feature/SCRUM-330-frontend
```
Starting from main is required (workflow-standards). Currently SAT01-1 work is on a separate branch — do NOT branch from it.

### Step 1: Extend `Media` interface
**File**: `nexacore-dashboard/src/components/ui/BeforeAfterSlider.tsx`

```ts
interface Media {
  src: string;
  alt: string;
  label?: React.ReactNode; // NEW — rendered inside the clip container for this image
}
```

No change to `BeforeAfterSliderProps` — the label travels with each `Media` object.

### Step 2: Render `before.label` inside existing BEFORE container
Inside the existing BEFORE clip div (currently holding just the `<Image src={before.src}>`), add `{before.label}` after the image:

```tsx
<div
  className="pointer-events-none absolute inset-0"
  style={{ clipPath, transition: transitionStyle }}
>
  <Image src={before.src} alt={before.alt} fill draggable={false}
    className="pointer-events-none object-cover"
    sizes="(max-width:768px) 100vw, 50vw" />
  {before.label}
</div>
```

The existing `clipPath` and `transition` on the container already handle the visibility and smooth motion — no additional logic needed.

### Step 3: Add new inverse-clip container for `after.label`
Just after the BEFORE container, before the divider. Only render the container if `after.label` is provided:

```tsx
const afterLabelClipPath =
  orientation === "horizontal"
    ? `inset(${position}% 0 0 0)`
    : `inset(0 0 0 ${position}%)`;

{after.label && (
  <div
    className="pointer-events-none absolute inset-0"
    style={{ clipPath: afterLabelClipPath, transition: transitionStyle }}
  >
    {after.label}
  </div>
)}
```

`pointer-events-none` preserves drag interactions. `transition: transitionStyle` inherits the existing 300ms ease-out on click / none during drag.

### Step 4: Keep `{children}` unchanged
Renders after both label containers, always visible. Consumers composing always-on content (metadata chips, duration badges, result indicators) keep working without migration.

### Step 5: Update `beforeAfterSliderSpecs` export
Document the new slots and the clip behavior:

```ts
export const beforeAfterSliderSpecs = {
  // ...existing keys...
  labels: {
    "before.label":
      "Optional ReactNode rendered inside the BEFORE clip container. Clipped with the before image — visible only where BEFORE is visible.",
    "after.label":
      "Optional ReactNode rendered inside an inverse-clip container. Visible only where the AFTER image is exposed (divider past it).",
    children:
      "Always-visible overlay content (metadata chips, etc.). Renders above both clipped label containers.",
  },
  clipPath: {
    horizontal: {
      before: "inset(0 0 ${100-position}% 0)",
      afterLabel: "inset(${position}% 0 0 0) — inverse",
    },
    vertical: {
      before: "inset(0 ${100-position}% 0 0)",
      afterLabel: "inset(0 0 0 ${position}%) — inverse",
    },
  },
};
```
Update `usage` string to mention the three composition slots (`before.label`, `after.label`, `children`).

### Step 6: Update `BeforeAfterSliderCard` in showcase
**File**: `nexacore-dashboard/src/components/admin/ComponentShowcase.tsx`

Replace current children-based BEFORE/AFTER badges with the new label slots. Consumers position their label content with absolute classes INSIDE the label node (since the wrapper already spans `absolute inset-0`):

```tsx
<BeforeAfterSlider
  before={{
    src: "/em-wordmark-black.png",
    alt: "EMILLION logotype — black on white",
    label: (
      <div className="absolute top-3 left-3">
        <Badge variant="overlay" size="sm">BEFORE</Badge>
      </div>
    ),
  }}
  after={{
    src: "/em-wordmark-white.png",
    alt: "EMILLION logotype — white on black",
    label: (
      <div className="absolute bottom-3 right-3">
        <Badge variant="overlay" size="sm">AFTER</Badge>
      </div>
    ),
  }}
  orientation={orientation}
  aspectRatio="16/9"
/>
```

Remove the old `<div className="pointer-events-none absolute top-3 left-3">…</div>` wrappers that were passing the badges as children.

### Step 7: Update SpecsPanel entry in `BeforeAfterSliderShowcase`
Reflect the new `labels` + `clipPath` spec keys. Minor edit — follows the pattern of existing SpecsPanel usages.

### Step 8: Build verification
```
cd nexacore-dashboard && npm run build
```
Expect `✓ Compiled successfully`. Pre-existing `Tooltip.tsx:16` lint error may still block full build exit — not caused by this ticket (tracked separately).

### Step 9: Manual QA
For each of the 4 showcase demos (horizontal/vertical × light/dark):
- position = 0: BEFORE label hidden, AFTER label visible
- position = 100: BEFORE label visible, AFTER label hidden
- Intermediate: each label visible only on its respective image portion
- Click-to-jump: labels and divider animate in 300ms in sync
- Drag: labels follow with no transition delay
- Touch-drag on mobile viewport: works, no page scroll
- Inspect DOM: when `after.label` undefined on any demo, the AFTER container should not exist (skip this check — showcase provides both labels)

## Implementation Order

0. Create feature branch from main (`feature/SCRUM-330-frontend`)
1. Extend `Media` interface
2. Render `before.label` inside existing BEFORE container
3. Add inverse-clip container for `after.label`
4. Confirm `children` still works (no change needed)
5. Update `beforeAfterSliderSpecs` export
6. Update `BeforeAfterSliderCard` to use label slots
7. Update SpecsPanel entry in `BeforeAfterSliderShowcase`
8. Build verification
9. Manual QA

## Rules (Section 10 — incremental quality)

- Edit ONLY the two files listed; do not touch Badge, showcase sections for other components, or catalog registrations
- Backward compatibility: `children` must still render and still be always-visible
- Do not change the existing clip-path formulas for BEFORE (already proven correct in SCRUM-328)
- Do not add tests / stories / MDX — project convention is specs + showcase
- Do not introduce new dependencies
- `git diff` before commit; verify only the two files changed; verify no whitespace-only diffs elsewhere
- Ask user to manually QA in the showcase before pushing

## Testing Checklist

- [ ] Dashboard build: `✓ Compiled successfully`
- [ ] Showcase: Before/After Slider section renders 4 demos
- [ ] In each demo: BEFORE label clipped to BEFORE image, AFTER label clipped to AFTER image
- [ ] Drag at extremes hides the off-image label entirely
- [ ] Transitions match SCRUM-328 behavior (300ms click, none drag)
- [ ] `children` prop unchanged: verified by reading the code — no removed/renamed prop
- [ ] No regression in other showcase sections

## Dependencies

None. No new npm packages.

## Notes

- SCRUM-328 component already has `pointer-events-none` on image layers and `touch-none` on container — both propagate naturally to label containers since they are siblings inside the same `select-none touch-none` parent.
- Accessibility: clipped-out labels remain in DOM and remain announced by screen readers. Intentional — the semantic meaning (BEFORE/AFTER) is still valid for the image region regardless of visual occlusion. No aria-hidden toggling.
- `before.label` and `after.label` are composable with `children` — labels clip, children always show. A consumer could pass all three (labels + metadata chips), which is the expected usage for TransformationsPreview.

## Next Steps After Implementation

- `/verify SCRUM-330`: validate plan compliance against live code, check backward compatibility, build verdict
- `/commit SCRUM-330`: single commit, PR, merge to main, branch cleanup
- `/update-docs SCRUM-330`: create record, propose ui-design-system.md update if user approves (otherwise fold into SCRUM-329 backlog)

After merge: SAT01-1 can adopt the label slots in its next TransformationsPreview iteration (independently — SCRUM-330 does not force satellite to change).
