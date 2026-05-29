# Frontend Implementation Plan: SCRUM-292 Create Reusable DataTable Component

## Overview

Create a generic, typed DataTable component using column configuration objects. This is a new component in `src/components/ui/` — it does NOT refactor existing tables (UsersTable, AuditLogsTable remain unchanged).

## Architecture Context

- **Existing tables**: UsersTable (5 cols, actions, mutable) and AuditLogsTable (6 cols, read-only) share identical styling patterns but have hardcoded column JSX
- **Pagination**: Parent-controlled via existing `Pagination` component (sibling, not nested)
- **Filters**: External to table (parent state)
- **Design tokens**: `rounded-2xl border-border-default bg-surface-primary shadow-card`, uppercase headers, hover rows

## Implementation Steps

### Step 0: Create Feature Branch

```bash
git checkout main && git pull origin main
git checkout -b feature/SCRUM-292-frontend
```

### Step 1: Create DataTable Component

**File**: `src/components/ui/DataTable.tsx`

**Generic typed component**:
```typescript
interface ColumnDef<T> {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  loadingRows?: number;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}
```

**Features**:
- Loading state: renders skeleton rows (animated pulse placeholder cells)
- Empty state: centered message with configurable text
- Row hover: `hover:bg-surface-subtle transition-colors`
- Header: uppercase, caption font, tertiary color (matching existing tables)
- Responsive: `overflow-x-auto` wrapper for mobile
- Optional `onRowClick` with cursor-pointer when set
- Column width via `style={{ width }}` on th/td
- Column alignment via `text-left/center/right`

### Step 2: Add to Component Registry

**File**: `src/lib/component-registry.ts` (modify)

Add entry:
```typescript
{
  name: "DataTable",
  category: "organism",
  description: "Generic data table with column config, loading and empty states",
  fileName: "DataTable.tsx",
}
```

This changes organism count from 3 to 4.

### Step 3: Add to Design System Showcase

**File**: `src/components/admin/ComponentShowcase.tsx` (modify)

Add a `DataTableShowcase` function in the molecules/organisms section that renders DataTable with sample data showing:
- Normal state (3 sample rows)
- Loading state
- Empty state

### Step 4: Build Verification

```bash
cd nexacore-dashboard && npm run build
```

## Implementation Order

1. Step 0: Create branch
2. Step 1: DataTable component
3. Step 2: Add to registry
4. Step 3: Add to showcase
5. Step 4: Build

## Testing Checklist

- [ ] DataTable renders data rows from column config
- [ ] Loading state shows skeleton rows
- [ ] Empty state shows message when data is empty
- [ ] Row hover effect works
- [ ] onRowClick fires when clicking a row
- [ ] Column alignment works (left/center/right)
- [ ] Responsive horizontal scroll on narrow viewports
- [ ] Component appears in registry (27 total, 4 organisms)
- [ ] Component appears in design system showcase
- [ ] Build passes
- [ ] Existing UsersTable and AuditLogsTable NOT modified

## Notes

- This is a NEW component only — no migration of existing tables
- Pagination is NOT built into DataTable (remains a sibling component per existing pattern)
- Sorting is NOT included (future enhancement)
- Selection/checkboxes NOT included (future enhancement)
- The component follows the same visual pattern as existing tables but is config-driven
