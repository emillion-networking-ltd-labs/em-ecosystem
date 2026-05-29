# Frontend Implementation Plan: SCRUM-314 ActionDropdown Edge Detection

## Overview

Add viewport edge detection to ActionDropdown so the menu opens upward when near the bottom of the viewport. Follow the existing Select component pattern.

## Architecture Context

- **File**: `src/components/admin/ActionDropdown.tsx`
- **Reference pattern**: `src/components/ui/Select.tsx` lines 74-87 (vertical/horizontal edge detection)
- **No new components**

## Implementation Steps

### Step 0: Create Feature Branch
- `git checkout main && git pull origin main`
- `git checkout -b feature/SCRUM-314-frontend`

### Step 1: Add Edge Detection to ActionDropdown

Replace `updatePos` with direction-aware positioning (Select pattern):
- Calculate `spaceBelow = window.innerHeight - rect.bottom`
- If `spaceBelow < menuHeight && rect.top > menuHeight` → open up (bottom positioning)
- Else → open down (top positioning, current behavior)
- Store direction in state for style application

### Step 2: Update Menu Style

Apply position based on direction:
- Down: `{ top: rect.bottom + 4, right }` (current)
- Up: `{ bottom: window.innerHeight - rect.top + 4, right }`

## Testing Checklist
- [ ] Last row in users table: menu opens upward
- [ ] First/middle rows: menu opens downward (unchanged)
- [ ] Build clean
