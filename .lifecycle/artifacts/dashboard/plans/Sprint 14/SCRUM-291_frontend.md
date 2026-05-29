# Frontend Implementation Plan: SCRUM-291 Build Layout Templates Showcase

## Overview

Add a Templates section to the design system viewer showing miniature previews of 3 reusable page layout patterns that guide future page implementation.

## Implementation Steps

### Step 0: Create Feature Branch

### Step 1: Create LayoutTemplates Component

**File**: `src/components/admin/LayoutTemplates.tsx`

3 template previews in TemplateCard wrappers:
- **ListPageTemplate**: Header + search/filters + data table mock + pagination
- **DetailPageTemplate**: Back link + header with avatar + tabs + stat cards
- **SettingsPageTemplate**: Section cards with toggle controls + admin-only section + save button

Each template rendered at 0.85 scale inside a bordered container.

### Step 2: Integrate into Design System Page

Add "Templates" tab to viewTabs. Render `<LayoutTemplates />` when active.

### Step 3: Build Verification

## Notes

- Templates are visual guides — not functional page components
- Uses existing UI components (Badge, Button, Tabs) for realistic previews
- Responsive 2-column grid layout
