# SCRUM-305 Phase 3 — Plan (retroactive): IconBadge + icon size tokens

## Scope
Frontend

## Steps

### Step 1 — New IconBadge component
**File**: `src/components/ui/IconBadge.tsx` (new)
- 5 color variants: default, success, warning, error, info
- 3 sizes: sm (32px, icon 16px), md (40px, icon 24px), lg (56px, icon 32px)
- All sizes use rounded-md (6px) — aligned with Button, IconButton, Badge

### Step 2 — Settings migration
**Files**: GlobalSettings.tsx, UserPreferences.tsx
- Inline `bg-black/[0.04]` div → `<IconBadge size="md">`
- Icon size 20px → 24px (aligned with md token)

### Step 3 — Showcase documentation
**File**: ComponentShowcase.tsx
- IconBadgeSizeGrid (same pattern as BadgeSizeGrid)
- 3 size sections x 5 colors x light/dark
- Representative icons: Settings, Check, AlertTriangle, X, Info

### Step 4 — Token documentation
**File**: TokenInspector.tsx
- Icon sizes: 16px (inline), 24px (medium), 32px (page-level)

### Step 5 — Border radius alignment
- IconBadge all sizes: rounded-md (6px)

### Step 6 — Build verification
