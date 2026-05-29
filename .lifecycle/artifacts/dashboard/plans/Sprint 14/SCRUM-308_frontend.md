# Frontend Implementation Plan: SCRUM-308 Command Palette (Cmd+K) with cmdk

## Overview

Command Palette for quick navigation, user search, and actions. Uses `cmdk` library (Linear/Vercel pattern). Global `Cmd+K / Ctrl+K` shortcut from any dashboard page. NavBar trigger pill. Permission-gated user search.

## Architecture Context

- **New dependency**: `cmdk` (~3KB, React headless command menu)
- **New component**: `src/components/ui/CommandPalette.tsx`
- **Modified**: `DashboardLayout.tsx` (global keydown + render), `NavBar.tsx` (trigger pill)
- **Showcase**: `ComponentShowcase.tsx` + `component-registry.ts` + `design-system/page.tsx`
- **No backend changes**

## Implementation Steps

### Step 0: Create Feature Branch
- `git checkout main && git pull origin main`
- `git checkout -b feature/SCRUM-308-frontend`

### Step 1: Install cmdk
- `cd nexacore-dashboard && npm install cmdk`
- Justification: headless command menu with built-in fuzzy search, keyboard nav, grouping — used by Linear, Vercel, Raycast

### Step 2: Create CommandPalette Component
- **File**: `src/components/ui/CommandPalette.tsx`

**Props**:
```ts
interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}
```

**Structure** (using cmdk components):
```tsx
<Command.Dialog open={open} onOpenChange={onClose}>
  {/* Overlay */}
  <div className="fixed inset-0 bg-[var(--overlay)]" />
  
  {/* Dialog */}
  <div className="fixed inset-0 flex items-start justify-center pt-[20vh]">
    <div className="w-full max-w-[550px] rounded-xl border border-border-strong bg-surface-primary shadow-card">
      
      {/* Search input */}
      <Command.Input placeholder="Type a command or search..." />
      
      {/* Results */}
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>
        
        {/* Pages group */}
        <Command.Group heading="Pages">
          <Command.Item> Dashboard </Command.Item>
          <Command.Item> Profile </Command.Item>
          ...
        </Command.Group>
        
        {/* Users group (admin only) */}
        <Command.Group heading="Users">
          {/* Async search results */}
        </Command.Group>
        
        {/* Actions group */}
        <Command.Group heading="Actions">
          <Command.Item> Sign out </Command.Item>
          <Command.Item> Toggle dark mode </Command.Item>
        </Command.Group>
      </Command.List>
    </div>
  </div>
</Command.Dialog>
```

**Design System Compliance**:
- Overlay: `bg-[var(--overlay)]` (same token as sidebar/notification panel)
- Dialog: `rounded-xl border-border-strong bg-surface-primary shadow-card max-w-[550px]`
- Input: `text-body placeholder:text-content-tertiary` — border-b separator, px-4 py-3
- Group heading: `text-caption font-semibold uppercase tracking-wider text-content-tertiary px-4 py-2`
- Item: `text-body text-content-primary px-4 py-2.5 rounded-lg` — hover/active `bg-surface-subtle`
- Item icon: 16px from lucide-react, `text-content-secondary`
- Shortcut badge: `text-caption font-mono bg-surface-tertiary rounded-md px-1.5 py-0.5`
- Empty state: `text-body text-content-tertiary text-center py-6`

**Page items** (static):
```ts
const pages = [
  { label: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "User Management", href: "/admin", icon: Users, permission: "users:read" },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: FileText, permission: "audit-logs:read" },
  { label: "Permissions", href: "/admin/permissions", icon: Shield, permission: "permissions:read" },
  { label: "Design System", href: "/admin/design-system", icon: Palette, permission: "users:read" },
];
```

**Action items** (static):
```ts
const actions = [
  { label: "Sign out", icon: LogOut, action: () => logout() },
  { label: "Toggle dark mode", icon: Moon, action: () => toggleTheme() },
];
```

**User search** (async, admin only):
- Debounced 300ms search input
- Calls `apiClient.get<PaginatedResponse<SafeUser>>("/users?search=...")` 
- Shows results as `Command.Item` with Avatar + name + email
- Click navigates to user profile (future) or copies email
- Permission-gated: only shown when `hasPermission("users:read")`

**Exported specs**:
```ts
export const commandPaletteSpecs = {
  dialog: { ... },
  input: { ... },
  item: { ... },
  group: { ... },
  shortcut: { ... },
};
```

### Step 3: Add Global Keyboard Shortcut
- **File**: `src/components/layout/DashboardLayout.tsx`

**Changes**:
1. Add state: `const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)`
2. Add `useEffect` with keydown listener:
   ```ts
   useEffect(() => {
     const handler = (e: KeyboardEvent) => {
       if ((e.metaKey || e.ctrlKey) && e.key === "k") {
         e.preventDefault();
         setCommandPaletteOpen((prev) => !prev);
       }
     };
     document.addEventListener("keydown", handler);
     return () => document.removeEventListener("keydown", handler);
   }, []);
   ```
3. Render `<CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />` at the end of the JSX
4. Pass `onCommandPaletteOpen` to NavBar for the trigger

### Step 4: Add Trigger in NavBar
- **File**: `src/components/layout/NavBar.tsx`

**Changes**:
1. Add prop: `onCommandPaletteOpen?: () => void`
2. Insert trigger pill between ThemeToggle and Bell:
   ```tsx
   {onCommandPaletteOpen && (
     <button
       onClick={onCommandPaletteOpen}
       className="hidden items-center gap-2 rounded-lg border border-border-components bg-surface-primary px-3 py-1.5 text-caption text-content-tertiary transition-colors hover:bg-surface-subtle hover:text-content-primary lg:flex"
     >
       <Search size={14} />
       <span>Search...</span>
       <kbd className="rounded-md bg-surface-tertiary px-1.5 py-0.5 font-mono text-caption">
         {isMac ? "⌘K" : "Ctrl+K"}
       </kbd>
     </button>
   )}
   ```
3. On mobile: search IconButton instead of pill (`lg:hidden`)

### Step 5: Document in ComponentShowcase
- **File**: `src/components/admin/ComponentShowcase.tsx`
- Add `CommandPaletteShowcase` section with:
  - Button to open the palette (interactive demo)
  - SpecsPanel with exported specs
- **File**: `src/lib/component-registry.ts` — add "Command Palette" entry
- **File**: `src/app/admin/design-system/page.tsx` — add componentToSection mapping

### Step 6: Update Technical Documentation
- `ai-specs/specs/integration-state.md` — changelog entry

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Install cmdk
3. Step 2: Create CommandPalette component
4. Step 3: Global keyboard shortcut in DashboardLayout
5. Step 4: NavBar trigger pill
6. Step 5: Showcase documentation
7. Step 6: Update docs

## Testing Checklist

- [ ] Cmd+K (Mac) / Ctrl+K (Windows) opens palette from any page
- [ ] Escape closes palette
- [ ] Overlay click closes palette
- [ ] Typing filters results (fuzzy search)
- [ ] Arrow keys navigate items
- [ ] Enter selects item (navigates or executes action)
- [ ] Pages navigate correctly via router.push
- [ ] Admin-only pages hidden for non-admin users
- [ ] User search works (admin only, debounced)
- [ ] Actions work: sign out, toggle theme
- [ ] NavBar trigger pill shows "Search... ⌘K"
- [ ] Mobile: search icon button instead of pill
- [ ] Build: npm run build clean
- [ ] TypeScript: tsc --noEmit 0 errors

## UI/UX Considerations

- Dialog positioned at 20vh from top (Vercel/Linear pattern — not centered, above fold)
- Max-width 550px (same as Toast, consistent)
- Results scroll if too many (max-h with overflow-y-auto)
- Focus trap inside dialog (cmdk handles this)
- Recent searches: not in scope (future enhancement)

## Dependencies

- `cmdk` (new) — ~3KB, headless React command menu

## Notes

- cmdk handles keyboard navigation, focus management, and fuzzy search internally
- No custom fuzzy search implementation needed
- User search is the only async operation — pages and actions are static
- Permission gating uses existing `usePermissions()` hook
- isMac detection: `typeof navigator !== "undefined" && navigator.platform.includes("Mac")`
