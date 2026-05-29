# Frontend Implementation Plan: SCRUM-309 Sidebar Submenu Flyout + Parent Navigable

## Overview

Fix two sidebar UX issues: 1) Collapsed sidebar hides child items — add GitLab-style flyout popover. 2) Expanded parent items (Admin) only toggle — make label navigable while chevron toggles children.

## Architecture Context

- **Modified component**: `src/components/ui/SidebarNav.tsx` — collapsed flyout + expanded parent split
- **Showcase update**: `src/components/admin/ComponentShowcase.tsx` — Sidebar section
- **Pattern reuse**: createPortal (same as Tooltip) for flyout positioning
- **No new components** — flyout is internal to SidebarNav
- **No backend changes**

## Implementation Steps

### Step 0: Create Feature Branch
- `git checkout main && git pull origin main`
- `git checkout -b feature/SCRUM-309-frontend`

### Step 1: Collapsed Flyout — Items with Children

**File**: `src/components/ui/SidebarNav.tsx` (lines 145-161)

**Current**: All collapsed items render as `<Link>` wrapped in `<Tooltip>`. Items with children navigate to parent route — children inaccessible.

**Change**: Items with children show a flyout popover on hover instead of Tooltip.

**Flyout implementation**:
1. New internal component `SidebarFlyout` inside SidebarNav.tsx
2. Uses `createPortal(el, document.body)` — same pattern as Tooltip
3. Position calculated from icon `getBoundingClientRect()` — `left: rect.right + 8px`, `top: rect.top`
4. 200ms hover delay (same as Tooltip `enterTimer` pattern)
5. Close on mouse leave (both icon and flyout — use combined hover area)
6. Content: parent label as header + child items as Links

**Flyout structure**:
```tsx
<div className="fixed z-[9999] rounded-xl border border-border-strong bg-surface-primary shadow-card p-2 min-w-[180px]">
  <p className="px-3 py-1.5 text-caption font-semibold text-content-tertiary">
    {parentLabel}
  </p>
  {children.map(child => (
    <Link className="flex items-center gap-2 px-3 py-2 rounded-lg text-body hover:bg-surface-subtle">
      <child.icon size={16} />
      {child.label}
    </Link>
  ))}
</div>
```

**Items WITHOUT children**: keep current behavior (Tooltip + direct Link)

### Step 2: Expanded Parent — Navigable Label + Chevron Toggle

**File**: `src/components/ui/SidebarNav.tsx` (lines 164-232)

**Current**: Parent item renders as `<button onClick={toggleParent}>` wrapping chevron + icon + label. Clicking anywhere toggles — no navigation.

**Change**: Split into two interactive areas:
- `<Link href={item.href}>` wrapping icon + label — navigates to parent route
- `<button onClick={toggleParent}>` wrapping only the chevron — toggles children

**Structure**:
```tsx
<div className={tabClassName}>
  <Link href={item.href} onClick={(e) => onNavigate?.(item.href, e)}
    className="flex flex-1 items-center gap-2">
    <Icon size={16} />
    <span>{item.label}</span>
  </Link>
  <button onClick={() => toggleParent(item.href)} className="p-1 rounded-md hover:bg-surface-subtle">
    {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
  </button>
</div>
```

### Step 3: Update Specs

**File**: `src/components/ui/SidebarNav.tsx` — update `sidebarNavSpecs`

Add:
```ts
flyout: {
  container: "rounded-xl border-border-strong bg-surface-primary shadow-card p-2 min-w-[180px]",
  position: "createPortal to body, fixed, left: icon.right + 8px, top: icon.top",
  delay: "200ms hover delay (same as Tooltip)",
  header: "text-caption font-semibold text-content-tertiary px-3 py-1.5",
  item: "flex items-center gap-2 px-3 py-2 rounded-lg text-body hover:bg-surface-subtle",
},
```

### Step 4: Update Showcase

**File**: `src/components/admin/ComponentShowcase.tsx` — SidebarShowcase

The collapsed sidebar demo should now show flyout on hover for Admin icon. The expanded demo should allow clicking Admin label to navigate.

### Step 5: Update Documentation

- `ai-specs/specs/integration-state.md` — changelog entry

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Collapsed flyout
3. Step 2: Expanded parent split
4. Step 3: Update specs
5. Step 4: Update showcase
6. Step 5: Update docs

## Testing Checklist

- [ ] Collapsed: hover Admin icon shows flyout with child items
- [ ] Collapsed: flyout has 200ms delay (no accidental triggers)
- [ ] Collapsed: click child item in flyout navigates
- [ ] Collapsed: flyout closes on mouse leave
- [ ] Collapsed: items without children still navigate directly (Dashboard, Profile, Settings)
- [ ] Collapsed: flyout uses portal (not clipped by sidebar overflow)
- [ ] Expanded: click Admin label navigates to /admin
- [ ] Expanded: click chevron toggles children open/close
- [ ] Expanded: children still render as nested list with indent
- [ ] Expanded: active child still auto-opens parent
- [ ] Build: npm run build clean
- [ ] TypeScript: tsc --noEmit 0 errors

## UI/UX Considerations

- Flyout appears to the right of the sidebar (left: sidebar right edge + 8px gap)
- Connected hover area: mouse can move from icon to flyout without closing (bridge the gap)
- Flyout header shows parent label for context
- Touch devices: flyout on click instead of hover
- Sidebar showcase demo should be interactive for both modes

## Dependencies

- No new dependencies — uses createPortal (React), same pattern as Tooltip

## Notes

- The flyout is NOT a new ui/ component — it's internal to SidebarNav because it's tightly coupled to the sidebar layout
- If we need a generic Popover component later, we can extract it
- The expanded parent split must preserve the existing tab styling (active/inactive states)
