# Frontend Implementation Plan: SCRUM-328 Badge overlay variant + BeforeAfterSlider component

## Overview

Two UI Core gaps surfaced while building sat-cristian-garcia (SAT01):

1. `Badge variant="default"` uses `bg-surface-subtle` (5–6% opacity), which vanishes over images or on surfaces of similar tone — the ANTES/DESPUÉS chips over transformation photos are barely visible and depend on the image's luminance to be legible.
2. The before/after image comparison pattern was hand-built inline inside the satellite. This violates "Design System is the single source of truth" — the pattern must live in UI Core so every satellite inherits it.

Both fixes are visual/UI only. No auth, API, or data-fetching changes.

## Scope

### Scope adjustment (2026-04-24)
`sat-cristian-garcia/` is currently untracked (zero tracked files in main) — the satellite lives only on branch `feature/SAT01-1-frontend`. Since workflow-standards mandates branching from main, and this ticket's branch cannot reach the satellite files, Part C (Steps 5–8) is **deferred**. SCRUM-328 will deliver dashboard UI Core only. Satellite consumption will happen naturally during SAT01-1 integration, once SCRUM-328 merges to main and SAT01-1 rebases.

### In scope (this ticket)
- Add `overlay` variant to `Badge` (dashboard UI Core)
- Create `BeforeAfterSlider` component in UI Core (dashboard)
- Document both in `ComponentShowcase.tsx` (light + dark grids, specs panel)

### Deferred to SAT01-1 integration (NOT this ticket)
- Sync updated Badge + BeforeAfterSlider to satellite
- Refactor `TransformationsPreview.tsx` to consume the UI Core component
- Swap `variant="default"` → `variant="overlay"` on ANTES/DESPUÉS badges and on hero stats cards

### Out of scope
- Changes to other Badge variants (default/success/warning/error/info/kbd) — they stay as documented
- New Badge sizes
- Image optimization, lazy-loading, or Next.js Image prop changes beyond `draggable={false}`
- Other UI Core components
- Any backend or API changes
- Ticket-initiated visual changes outside the files listed below

## Files Affected

### Dashboard (source of truth)
| File | Change |
|------|--------|
| `nexacore-dashboard/src/components/ui/Badge.tsx` | Modify — add `overlay` to variant union + `variantClasses` |
| `nexacore-dashboard/src/components/ui/BeforeAfterSlider.tsx` | Create — new component with horizontal/vertical orientations |
| `nexacore-dashboard/src/components/admin/ComponentShowcase.tsx` | Modify — `BadgeSizeGrid` variants array + new `BeforeAfterSliderShowcase` section + registration |

### Satellite (reference implementation)
| File | Change |
|------|--------|
| `sat-cristian-garcia/src/components/ui/Badge.tsx` | Sync — copy updated version from dashboard |
| `sat-cristian-garcia/src/components/ui/BeforeAfterSlider.tsx` | Create — copy from dashboard |
| `sat-cristian-garcia/src/components/sections/TransformationsPreview.tsx` | Refactor — remove inline `BeforeAfterSlider` sub-component, consume the UI Core one, swap ANTES/DESPUÉS to `overlay` |
| `sat-cristian-garcia/src/components/sections/HeroSection.tsx` | Swap `variant="default"` to `variant="overlay"` on stats cards that sit over the video (only where the inline override `!bg-black/25` is currently hacked) |

## Design Decisions

### Why `bg-black/60 text-white backdrop-blur-sm` for `overlay`

- **Context-independence**: unlike theme tokens, badges over media have unpredictable backgrounds. A translucent dark chip provides guaranteed contrast with white text regardless of image luminance or theme.
- **`backdrop-blur-sm`**: softens whatever's underneath, raising perceived contrast without hard edges. Matches the iOS/macOS overlay pattern already familiar to users.
- **`/60` opacity**: enough to read white text at 12–14px (sm/md sizes), still lets the image show through so the chip feels "attached" to the media.
- **No theme dependency**: `bg-black` and `text-white` are literal, not token-based. Intentional — theme tokens defeat the purpose (a `bg-surface-inverse` chip flips to white in dark mode and fails again over a bright image).

### Why a dedicated `overlay` variant instead of hacking `default`

Changing `default` to be more opaque would regress every existing usage in the dashboard where the 5% subtle chip is deliberate (settings chips, table role badges). A new variant preserves the existing semantics and adds a purpose-specific one.

### Why `BeforeAfterSlider` belongs in UI Core

Any satellite or NexaCore module that needs image comparison (portfolio galleries, settings previews, before/after marketing content) will reinvent the same drag/touch/transition logic. Centralizing prevents drift and makes UX consistent across products.

### Component API shape

```tsx
<BeforeAfterSlider
  before={{ src: "/path", alt: "description" }}
  after={{ src: "/path", alt: "description" }}
  orientation="horizontal" | "vertical"   // default "horizontal"
  initialPosition={50}                     // 0–100, default 50
  aspectRatio="4/5" | "1/1" | "16/9" | "3/4" // default "4/5"
  className?: string
  children?: React.ReactNode               // for overlay Badges / labels
>
```

`children` render as absolutely-positioned overlay content (labels, Badges with `variant="overlay"`). This is how the satellite composes ANTES/DESPUÉS chips + time/result badges.

## Implementation Steps

### Step 0: Create feature branch
- **Repos affected**: `em-ecosystem-code`
- **Branch**: `feature/SCRUM-328-badge-overlay-before-after-slider`
- **Base**: current main of `em-ecosystem-code`
- **Command**: `git checkout -b feature/SCRUM-328-badge-overlay-before-after-slider`

### Step 1: Add `overlay` variant to dashboard Badge
- **File**: `nexacore-dashboard/src/components/ui/Badge.tsx`
- **Change**:
  - Extend `BadgeProps["variant"]` union: add `| "overlay"`
  - Add to `variantClasses`:
    ```ts
    overlay: "bg-black/60 text-white backdrop-blur-sm",
    ```
- Do NOT touch other variants, sizes, or base class.
- Do NOT change the `className` merge order.

### Step 2: Create `BeforeAfterSlider` component in dashboard
- **File**: `nexacore-dashboard/src/components/ui/BeforeAfterSlider.tsx` (new)
- **Directive**: `"use client"` (uses hooks + event listeners)
- **Structure**:
  ```ts
  interface Media { src: string; alt: string; }
  interface BeforeAfterSliderProps {
    before: Media;
    after: Media;
    orientation?: "horizontal" | "vertical";   // default "horizontal"
    initialPosition?: number;                   // 0-100, default 50
    aspectRatio?: "4/5" | "1/1" | "16/9" | "3/4"; // default "4/5"
    className?: string;
    children?: React.ReactNode;
  }

  export const beforeAfterSliderSpecs = {
    container: "relative w-full rounded-xl overflow-hidden bg-surface-tertiary select-none touch-none",
    divider: "absolute bg-border-components — 1px thick, oriented per prop",
    handle: "40×40px rounded-full bg-surface-primary border border-border-components",
    arrows: "text-content-primary/50 group-hover:text-content-primary h-4 w-4",
    clipPath: "inset(0 0 <100-position>% 0) for horizontal, inset(0 <100-position>% 0 0) for vertical",
    interaction: {
      click: "300ms ease-out transition (clip-path + divider position)",
      drag: "zero transition, direct cursor follow",
      listenerLifecycle: "global mousemove/touchmove attached only while isDragging",
      imageDragBlock: "draggable={false} + pointer-events-none on <Image> + onDragStart preventDefault + preventDefault on mouseDown",
      touch: "touch-none on container + passive:false on touchmove",
    },
  };
  ```
- **Core logic** (identical shape to the current satellite inline implementation, just parameterized):
  - `useState(initialPosition)` for position
  - `useState(false)` for isDragging
  - `useRef<HTMLDivElement>` for container
  - `updatePosition(clientCoord: number)`: compute % from container rect along the active axis (Y for horizontal divider, X for vertical divider)
  - `onMouseDown` / `onTouchStart`:
    1. `preventDefault()` (block native image drag)
    2. `updatePosition(...)`
    3. `requestAnimationFrame(() => setIsDragging(true))` — allows first-click transition to run, then disables for drag
  - `onDragStart={e => e.preventDefault()}` — defensive
  - `useEffect` guarded by `isDragging`: attach global `mousemove`/`touchmove` + `mouseup`/`touchend`, cleanup on unmount or when `isDragging` goes false
  - `transitionStyle = isDragging ? "none" : "clip-path 300ms ease-out, top 300ms ease-out, left 300ms ease-out"`
- **Images**: `next/image` with `fill`, `draggable={false}`, `className="pointer-events-none object-cover"`, `sizes` prop sensible default (`"(max-width:768px) 100vw, 50vw"`)
- **Clip path**: horizontal → `inset(0 0 ${100 - position}% 0)`; vertical → `inset(0 ${100 - position}% 0 0)`
- **Handle**: positioned absolute at `top: ${position}%` (horizontal) or `left: ${position}%` (vertical). Arrows SVG rotates 90deg in vertical mode.
- **Children**: render inside the container as `{children}` so consumers can layer overlay badges/labels with absolute positioning.
- **Specs export**: `beforeAfterSliderSpecs` (pattern matches `sliderSpecs`, `spinnerSpecs`, etc.)

### Step 3: Register overlay variant in ComponentShowcase
- **File**: `nexacore-dashboard/src/components/admin/ComponentShowcase.tsx`
- **Change** in `BadgeSizeGrid` (~line 697):
  - Add `"overlay"` to the `variants` const array (position it last, after `"kbd"`)
  - In the render, for `v === "overlay"` show the chip ON a dark photo background so the behavior is demonstrable. Wrap just that badge in a small image tile:
    ```tsx
    {v === "overlay" ? (
      <div className="relative h-8 overflow-hidden rounded-md">
        <div className="absolute inset-0 bg-[url('/placeholder-photo.jpg')] bg-cover bg-center" />
        <div className="relative flex h-full items-center px-2">
          <Badge variant={v} size={size}>Overlay</Badge>
        </div>
      </div>
    ) : (
      <Badge key={v} variant={v} size={size}>
        {v === "kbd" ? "⌘K" : v.charAt(0).toUpperCase() + v.slice(1)}
      </Badge>
    )}
    ```
  - Placeholder image: use an existing photo already bundled with the dashboard. If none exists, generate a gradient tile inline (`bg-gradient-to-r from-gray-700 to-gray-900`) as a stand-in — document this choice in the SpecsPanel.
- Update `SpecsPanel` in `BadgeShowcase` — add an entry `"Overlay usage": "Use over images, video, or dynamic media where theme-based backgrounds don't guarantee contrast. Do NOT use on surface tokens — use variant=\"default\" instead."`

### Step 4: Add BeforeAfterSlider showcase
- **File**: `nexacore-dashboard/src/components/admin/ComponentShowcase.tsx`
- **Import** (top of file, alphabetical block around line ~50):
  ```ts
  import BeforeAfterSlider, { beforeAfterSliderSpecs } from "@/components/ui/BeforeAfterSlider";
  ```
- **New showcase function** (near other showcases):
  ```tsx
  function BeforeAfterSliderShowcase() {
    return (
      <ShowcaseSection title="Before/After Slider">
        {/* Horizontal mode, light */}
        <div className="card-flat !p-4 light bg-surface-primary">
          <p className="text-caption text-content-tertiary font-mono mb-3">horizontal · light</p>
          <div className="max-w-sm">
            <BeforeAfterSlider
              before={{ src: "/showcase/before-placeholder.jpg", alt: "before" }}
              after={{ src: "/showcase/after-placeholder.jpg", alt: "after" }}
              orientation="horizontal"
            >
              <div className="pointer-events-none absolute top-3 left-3">
                <Badge variant="overlay" size="sm">BEFORE</Badge>
              </div>
              <div className="pointer-events-none absolute bottom-3 right-3">
                <Badge variant="overlay" size="sm">AFTER</Badge>
              </div>
            </BeforeAfterSlider>
          </div>
        </div>
        {/* Horizontal mode, dark */}
        {/* Vertical mode, light */}
        {/* Vertical mode, dark */}
        <SpecsPanel specs={{ ...beforeAfterSliderSpecs }} />
      </ShowcaseSection>
    );
  }
  ```
- **Placeholder assets**: if `/showcase/before-placeholder.jpg` and `/showcase/after-placeholder.jpg` don't exist, create them under `nexacore-dashboard/public/showcase/`. Use two simple photos (the team can replace later with branded assets). A CC0 source like a public domain landscape works. If adding assets is out of scope for this ticket, reuse `/placeholder-avatar.jpg` type existing assets and note in SpecsPanel "Replace with production assets in follow-up".
- **Register** in the main showcase render list (where `<BadgeShowcase />` is called, ~line 2914): add `<BeforeAfterSliderShowcase />` after a suitable section (suggest: after `<SliderShowcase />` or wherever media components live).

### Step 5: Sync Badge to satellite
- **File**: `sat-cristian-garcia/src/components/ui/Badge.tsx`
- **Action**: overwrite with the updated dashboard version (whole file copy). Verify diff is ONLY the overlay variant addition — no accidental deletions.

### Step 6: Sync BeforeAfterSlider to satellite
- **File**: `sat-cristian-garcia/src/components/ui/BeforeAfterSlider.tsx`
- **Action**: create by copying the dashboard version verbatim.

### Step 7: Refactor TransformationsPreview to consume UI Core
- **File**: `sat-cristian-garcia/src/components/sections/TransformationsPreview.tsx`
- **Changes**:
  - Remove the inline `BeforeAfterSlider` function (lines 23–132)
  - Remove the `Transformation` interface (superseded by the slider's own Media type, but the `t` shape still needs to be typed — keep interface if still used for render data)
  - Import the new component: `import BeforeAfterSlider from "@/components/ui/BeforeAfterSlider"`
  - In the JSX where `<BeforeAfterSlider t={t} />` renders, replace with composition:
    ```tsx
    <div className="flex flex-col gap-4">
      <div className="card-flat !p-0 overflow-hidden">
        <BeforeAfterSlider
          before={{ src: t.before, alt: `${t.name} — antes` }}
          after={{ src: t.after, alt: `${t.name} — después` }}
          orientation="horizontal"
          aspectRatio="4/5"
        >
          <div className="pointer-events-none absolute top-3 left-3">
            <Badge variant="overlay" size="sm">ANTES</Badge>
          </div>
          <div className="pointer-events-none absolute bottom-3 right-3 flex flex-wrap items-center justify-end gap-2">
            <Badge variant="overlay" size="sm">DESPUÉS</Badge>
            <Badge variant="info" size="sm" className="uppercase gap-1">
              <Clock size={16} />
              {t.duration}
            </Badge>
            <Badge variant="success" size="sm" className="uppercase gap-1">
              <Dumbbell size={16} />
              {t.result}
            </Badge>
          </div>
        </BeforeAfterSlider>
      </div>
      {/* Card 2: testimonial — UNCHANGED */}
      <div className="card-flat">...</div>
    </div>
    ```
- Keep the `TransformationsPreview` outer section, scroll parallax effect, header, grid, and divider **unchanged**.
- Remove the now-unused `!text-accent` overrides on ANTES/DESPUÉS — `overlay` variant renders white by default.

### Step 8: Swap HeroSection stats badges to overlay
- **File**: `sat-cristian-garcia/src/components/sections/HeroSection.tsx`
- **Scope**: ONLY the stats cards that currently have inline `!bg-black/25 !border-white/10 backdrop-blur-sm` hacks over the video.
- **Change**: replace those hacks with `<Badge variant="overlay" ...>` where applicable. If the hero stats are NOT Badge components today (they're cards), leave them alone — this step only applies if a Badge is currently being hacked with inline dark-chip styles.
- If no Badge component there uses the hack, skip this step and note in the record.

### Step 9: Build verification
- **Dashboard**: `cd nexacore-dashboard && npm run build` — must pass with zero new warnings
- **Satellite**: `cd sat-cristian-garcia && npm run build` — must pass with zero new warnings
- Do NOT run tests unless they exist for these specific components (this ticket does not add tests per the existing component pattern — Slider/Spinner etc. do not have unit tests either).

### Step 10: Manual QA checklist
- Open dashboard ComponentShowcase → Badge section → verify `overlay` row renders correctly in light and dark
- Open dashboard ComponentShowcase → Before/After Slider section → verify all 4 variants (horizontal light/dark, vertical light/dark)
- Click-to-jump: click anywhere in slider, verify smooth 300ms animation (not instant jump)
- Click-hold-drag: verify NO native browser image ghost appears
- Drag: verify cursor follow is direct (no lag)
- Touch on mobile viewport (devtools): verify page does not scroll while dragging
- sat-cristian-garcia `/` home page → Transformations section:
  - Both cards render BeforeAfterSlider from UI Core
  - ANTES/DESPUÉS chips are white text on dark translucent background (no theme flicker)
  - Other badges (2 MESES, TRANSFORMACIÓN COMPLETA) unchanged

### Step 11: Update technical documentation
- **Files to update**:
  - `ai-specs/specs/frontend-standards.mdc` — add BeforeAfterSlider to the UI component inventory if one exists; document `Badge.overlay` in the Badge section
  - `ai-specs/specs/ui-design-system.md` — add `overlay` variant specs under Badge, add BeforeAfterSlider section with props + usage guidelines
- **Language**: English only
- Ask user to confirm before editing `ui-design-system.md` per the "user prefers manual approval before modifying architecture docs" preference in memory.

## Implementation Order (this ticket — dashboard only)

0. Create feature branch from `main` (`feature/SCRUM-328-frontend`)
1. Add `overlay` variant to dashboard `Badge.tsx`
2. Create `BeforeAfterSlider.tsx` in dashboard
3. Add overlay row to `BadgeSizeGrid` + SpecsPanel entry
4. Add `BeforeAfterSliderShowcase` + register
5. Build verification on `nexacore-dashboard`
6. Manual QA on Component Showcase
7. Update technical documentation (`ui-design-system.md` with user approval)

### Deferred (done during SAT01-1 integration, not this ticket)
- Sync Badge + BeforeAfterSlider to satellite
- Refactor TransformationsPreview to consume UI Core component
- Swap HeroSection badges to `overlay`

## Rules (Section 10 — incremental quality)

- Edit ONLY the files and lines listed above
- Do NOT rewrite or refactor files beyond scope
- Do NOT add unrelated fixes (the unused `Badge` import in `PortfolioPreview.tsx` fixed previously is already merged — do not re-touch)
- `git diff` before commit, verify no unintended changes
- Ask user to test before pushing
- Do NOT add tests, stories, or MDX files — project convention is specs exports + showcase only
- Do NOT introduce new dependencies
- Preserve visual appearance elsewhere — this ticket touches Badge variants only additively, and the slider refactor must render identically to the current inline implementation (with the UX fixes already shipped: transition, touch-none, drag block)

## Testing Checklist

- [ ] Dashboard build passes
- [ ] Satellite build passes
- [ ] Badge showcase renders `overlay` variant in light + dark
- [ ] Before/After Slider showcase renders horizontal + vertical in light + dark
- [ ] Click-to-jump transition is smooth (300ms)
- [ ] Click-hold-drag blocks native image drag ghost
- [ ] Touch drag does not scroll the page
- [ ] sat-cristian-garcia Transformations section uses UI Core component
- [ ] ANTES/DESPUÉS chips render as overlay variant (white on dark translucent)
- [ ] No regression in other Badge usages in dashboard (settings, admin table)
- [ ] Specs panels updated with overlay usage guidance + slider specs

## Dependencies

- No new npm packages
- Uses existing `next/image`, `react` hooks, `lucide-react` icons (already in both repos)

## Notes

- `variant="overlay"` intentionally uses literal colors (`bg-black/60`, `text-white`), not theme tokens. This is a documented design decision — see "Design Decisions" section.
- The inline slider in sat-cristian-garcia is the source of truth for the component's current UX behavior (transitions, drag block, touch handling). Lift it 1:1 into UI Core; do not redesign.
- Placeholder images for showcase can be any neutral before/after pair. If the team prefers production-quality placeholders, create a follow-up ticket.
- All code, comments, and docs in English per documentation-standards.

## Next Steps After Implementation

- `/verify` — run the audit command against this plan, check plan compliance step-by-step
- `/commit` — commit with the verified PASS verdict
- `/update-docs` — update ui-design-system.md + integration-state.md (if applicable) after merge

## Module-Level Planning

N/A — this is a UI Core component addition, not a full module.

## Satellite App Planning

sat-cristian-garcia is affected as a consumer, not as a new satellite. The satellite's existing structure stays intact; only 2 files are touched (Badge.tsx sync, BeforeAfterSlider.tsx sync, TransformationsPreview.tsx refactor). No NexaCore API integration changes.
