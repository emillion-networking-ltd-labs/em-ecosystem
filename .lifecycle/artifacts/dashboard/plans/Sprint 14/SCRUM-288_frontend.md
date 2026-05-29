# Frontend Implementation Plan: SCRUM-288 Component Showcase — Atoms (+ SCRUM-289 Molecules)

## Overview

Build live rendered previews of all atom and molecule components in the design system viewer. Each component shown with all variants, sizes, and interactive states.

**Note**: This ticket also covers SCRUM-289 (Molecules) since both atom and molecule showcases are implemented in the same component file.

## Implementation Steps

### Step 0: Create Feature Branch

### Step 1: Create ComponentShowcase Component

**File**: `src/components/admin/ComponentShowcase.tsx`

Two exported functions:
- `AtomShowcase` — renders 10 atom components (Button, Input, Badge, Spinner, Avatar, Toggle, Checkbox, Tooltip, Divider, Slider) with all variants and states
- `MoleculeShowcase` — renders 6 molecule components (Tabs, Select, Calendar, Pagination, ErrorAlert, Breadcrumbs) with interactive state

Each component wrapped in `ShowcaseSection` (card with title) and `VariantRow` (label + rendered variants).

Interactive components use `useState` for live state management.

### Step 2: Integrate into Design System Page

**File**: `src/app/admin/design-system/page.tsx` (modify)

Add "Atoms" and "Molecules" tabs. Rename "Components" to "Catalog".

### Step 3: Build Verification

## Testing Checklist

- [ ] Atoms tab renders all 10 components
- [ ] Molecules tab renders all 6 components
- [ ] Interactive components (Toggle, Checkbox, Slider, Calendar, Pagination, Select) respond to user interaction
- [ ] Build passes

## Notes

- Covers both SCRUM-288 and SCRUM-289 scope
- No new dependencies
- No existing files modified except page.tsx (tab additions)
