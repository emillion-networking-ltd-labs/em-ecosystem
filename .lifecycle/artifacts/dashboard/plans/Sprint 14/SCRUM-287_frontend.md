# Frontend Implementation Plan: SCRUM-287 Build Token Inspector

## Overview

Add a Token Inspector section to `/admin/design-system` that visually displays all design tokens (colors, typography, spacing, radii, shadows) with rendered swatches. Integrates as a new tab alongside the existing component catalog.

## Implementation Steps

### Step 0: Create Feature Branch

```bash
git checkout main && git pull origin main
git checkout -b feature/SCRUM-287-frontend
```

### Step 1: Create TokenInspector Component

**File**: `src/components/admin/TokenInspector.tsx`

Sections:
1. **Colors** — Grouped swatches (Surface, Content, Border, Semantic, Interactive, Metric)
2. **Typography** — Rendered sample text at each of 8 scale steps
3. **Spacing** — Horizontal bars proportional to value with pixel labels
4. **Border Radii** — Rounded boxes at each of 9 radius values
5. **Shadows** — Sample cards with each shadow applied

Token data hardcoded from globals.css + tailwind.config.ts (pure data, no runtime CSS reads needed since we know all values).

### Step 2: Integrate into Design System Page

**File**: `src/app/admin/design-system/page.tsx` (modify)

Add a view toggle: "Components" | "Tokens" using existing Tabs component. Default to "Components" (existing grid). "Tokens" tab renders `<TokenInspector />`.

### Step 3: Build Verification

```bash
cd nexacore-dashboard && npm run build
```

## Implementation Order

1. Step 0: Create branch
2. Step 1: TokenInspector component
3. Step 2: Integrate into page with tab toggle
4. Step 3: Build

## Testing Checklist

- [ ] Tokens tab shows on /admin/design-system
- [ ] All 5 token categories rendered with visual swatches
- [ ] Typography shows rendered sample text
- [ ] Spacing shows proportional bars
- [ ] Border radii shows rounded boxes
- [ ] Shadows shows sample cards
- [ ] Build passes

## Notes

- Token data is hardcoded (not read from CSS at runtime) for simplicity and SSR compatibility
- Light mode values shown; dark mode section can be added in future iteration
- No new dependencies
