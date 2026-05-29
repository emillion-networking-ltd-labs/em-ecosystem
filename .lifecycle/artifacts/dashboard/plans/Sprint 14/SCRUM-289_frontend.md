# Frontend Implementation Plan: SCRUM-289 Build Component Showcase — Molecules and Organisms

## Overview

Complete the Design System showcase with the remaining molecule/organism components. The approach follows the established propagation pattern: component exports specs → showcase imports and renders → usage sites import the component.

**User decisions:**
1. FormField — Build as new molecule
2. SearchBar — Evaluate if Input `filled` variant + Search icon is sufficient
3. MetricCard — Defer (dashboard redesign planned for future tickets)
4. EmptyState — Build as new atom
5. Sidebar — Add to showcase (document existing component)
6. Form patterns — Build as showcase documentation section

## Architecture Context

- **Files to create**: `ui/FormField.tsx`, `ui/EmptyState.tsx`
- **Files to modify**: `admin/ComponentShowcase.tsx`, `lib/component-registry.ts`
- **No new pages or routes**
- **No API changes**

## Implementation Steps

### Step 0: Create Feature Branch

- Branch: `feature/SCRUM-289-frontend`
- Base: `main` (after merging SCRUM-297)

---

### Step 1: Evaluate SearchBar

**Action**: Determine if Input with `filled` variant + Search icon is sufficient or if a dedicated SearchBar component is needed.

**Current state**: Input already supports:
- `leftIcon={<Search size={16} />}` — search icon
- `variant="filled"` — bg-surface-primary, no outline (designed for search bars)
- `rightIcon` — can render a clear (X) button
- sm/md sizes

**Assessment**: Input `filled` + Search icon already covers the SearchBar use case. The LanguageSelector already uses this pattern. A dedicated SearchBar would add debounce + dropdown results, but those are features for when we have actual search (users, projects). For now, document Input `filled` variant as the search pattern in the showcase.

**Implementation**:
1. In the InputShowcase, ensure there's a clear demo of the "search bar" pattern (Input filled + Search icon + X rightIcon)
2. Add a label "search bar pattern" to the existing filled variant demo
3. No new component needed

---

### Step 2: Build FormField Component

**File**: `nexacore-dashboard/src/components/ui/FormField.tsx`

**Purpose**: Wraps ANY form control (Input, Select, Toggle, Checkbox, custom) with consistent label + error layout. This is different from Input (which has label/error built-in) because FormField works with ANY child.

**Component API**:
```tsx
interface FormFieldProps {
  label?: string;
  error?: string;
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}
```

**Rendering**:
```
<div className="flex flex-col gap-2">
  {label && <label className="text-body font-semibold leading-[22px] text-content-primary">}
  {children}
  {error && <InlineError message={error} />}
</div>
```

**Exports**: `formFieldSpecs` object with container, label, error specs.

**Implementation Steps**:
1. Create `FormField.tsx` with the interface above
2. Export `formFieldSpecs` for showcase consumption
3. Label styling matches Input's label: `text-body font-semibold leading-[22px]`
4. Error uses `<InlineError>` component (not inline HTML)
5. `htmlFor` connects label to child input via `id`
6. `required` adds visual indicator (optional asterisk or screen-reader text)

---

### Step 3: Build EmptyState Component

**File**: `nexacore-dashboard/src/components/ui/EmptyState.tsx`

**Purpose**: Reusable empty state for tables, lists, search results, and pages. Currently DataTable has inline `emptyMessage` (just text), and SecurityActivity has a similar pattern. This standardizes the visual.

**Component API**:
```tsx
interface EmptyStateProps {
  icon?: React.ReactNode;        // Lucide icon, default: Inbox
  title: string;                  // "No users found"
  description?: string;           // "Try adjusting your filters"
  action?: React.ReactNode;       // Optional Button
  className?: string;
}
```

**Rendering**:
```
<div className="flex flex-col items-center gap-3 py-12">
  <Icon className="text-content-primary/30" />
  <p className="text-body font-semibold text-content-primary">{title}</p>
  {description && <p className="text-caption text-content-primary/50">{description}</p>}
  {action}
</div>
```

**Exports**: `emptyStateSpecs` object.

**Implementation Steps**:
1. Create `EmptyState.tsx` with the interface above
2. Export `emptyStateSpecs`
3. Default icon: `Inbox` from lucide-react (32px)
4. `py-12` matches DataTable's current empty state padding
5. Text styling follows existing patterns (body for title, caption for description)

---

### Step 4: Add Sidebar to Showcase

**Action**: Document the existing Sidebar component in ComponentShowcase.tsx. No new component — just a showcase section.

**Implementation Steps**:
1. Import Sidebar specs (add `sidebarSpecs` export to `Sidebar.tsx` if not present)
2. Create `SidebarShowcase` function in ComponentShowcase.tsx
3. Show two static representations:
   - Collapsed state (68px wide, icons only)
   - Expanded state (212px wide, icons + labels)
4. Show in light and dark mode
5. Document specs: widths, transitions, NavItem styling, user card, section headers
6. Add to `MoleculeShowcase` render list
7. Add to `component-registry.ts`

**Note**: Cannot render the actual `<Sidebar>` component inline (it's position:fixed). Use static visual representations with the same classes.

---

### Step 5: Add Form Patterns to Showcase

**Action**: Create a documentation section showing common form patterns used across the project.

**Implementation Steps**:
1. Create `FormPatternsShowcase` function in ComponentShowcase.tsx
2. Show 3 patterns:

**Pattern A — Auth Form (2-column)**:
- Title group (330px) + Form area (348px)
- Fields with gap-2, buttons with gap-2
- InlineError below fields
- Example: simplified login form mockup

**Pattern B — Profile Form (single-column)**:
- Stacked fields with gap-4
- Save button full-width at bottom
- Loading state on button
- Example: simplified profile edit mockup

**Pattern C — Modal Form**:
- ConfirmModal with children containing form fields
- Buttons right-aligned (Cancel + Confirm)
- Example: simplified delete confirmation with password input

3. Each pattern shows:
   - The layout structure (flex directions, gaps, widths)
   - Field spacing (gap-2 vs gap-4)
   - Button placement (full-width, side-by-side, right-aligned)
   - Error display (InlineError position)
   - Loading state (button loading prop)

4. SpecsPanel documents:
   - Auth layout: `flex gap-6 md:flex-row`, title group 330px, form area 348px
   - Profile layout: `flex flex-col gap-4`, full-width fields
   - Modal layout: `w-[427px] rounded-3xl`, right-aligned buttons
   - Field spacing: `gap-2` (compact/auth) vs `gap-4` (spacious/profile)
   - Button spacing: `gap-2` for button groups

5. Add to `MoleculeShowcase` render list

---

### Step 6: Update Component Registry

**File**: `nexacore-dashboard/src/lib/component-registry.ts`

**Changes**:
1. Add `FormField` as atom:
   ```
   { name: "FormField", category: "atom", description: "Label + any control + error — consistent form field wrapper", files: ["FormField.tsx"] }
   ```
2. Add `EmptyState` as atom:
   ```
   { name: "EmptyState", category: "atom", description: "Icon + title + description + action — tables, lists, search results", files: ["EmptyState.tsx"] }
   ```
3. Add `Sidebar` as molecule:
   ```
   { name: "Sidebar", category: "molecule", description: "Collapsible navigation — 68px collapsed, 212px expanded, mobile slide-in", files: ["Sidebar.tsx"] }
   ```
4. Add `Form Patterns` entry or integrate into existing documentation

---

### Step 7: Add Showcase Sections to ComponentShowcase

**Implementation Steps**:
1. Import new components and specs:
   - `FormField, { formFieldSpecs }`
   - `EmptyState, { emptyStateSpecs }`
2. Create showcase functions:
   - `FormFieldShowcase()` — light/dark, with Input child, with Select child, with error state
   - `EmptyStateShowcase()` — light/dark, default (Inbox icon), custom icon, with action button
   - `SidebarShowcase()` — collapsed/expanded visual representation
   - `FormPatternsShowcase()` — 3 form layout patterns
3. Add to `AtomShowcase`:
   - `<FormFieldShowcase />`
   - `<EmptyStateShowcase />`
4. Add to `MoleculeShowcase`:
   - `<SidebarShowcase />`
   - `<FormPatternsShowcase />`
5. Update `componentToSection` mapping in `page.tsx` for catalog navigation

---

### Step 8: Document SearchBar Decision

**Action**: Add a note in the Input showcase SpecsPanel documenting that Input `filled` variant IS the SearchBar pattern:

```
"Search Bar": "Input variant=filled + leftIcon={Search} + rightIcon={X clear} — no dedicated component needed"
```

This prevents future developers from creating a redundant SearchBar component.

---

### Step 9: Update Technical Documentation

1. Update `component-registry.ts` (done in Step 6)
2. No API changes
3. No data model changes
4. No standards file changes needed

---

### Step 10: MetricCard Decision Documentation

**Action**: Add a comment in ComponentShowcase.tsx or the Jira ticket noting:
- MetricCard deferred intentionally — dashboard redesign planned for future sprint
- Current dashboard metrics are inline — will be componentized when dashboard pages are rebuilt
- No showcase section created yet

---

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Evaluate SearchBar (document Input filled as search pattern)
3. Step 2: Build FormField component
4. Step 3: Build EmptyState component
5. Step 4: Add Sidebar to showcase
6. Step 5: Add Form Patterns to showcase
7. Step 6: Update component registry
8. Step 7: Add all showcase sections to ComponentShowcase
9. Step 8: Document SearchBar decision
10. Step 9: Update documentation
11. Step 10: Document MetricCard deferral

## Testing Checklist

- [ ] FormField renders label + any child + error correctly
- [ ] FormField `htmlFor` connects label to input
- [ ] EmptyState renders icon + title + description + action
- [ ] EmptyState works without optional props (description, action)
- [ ] Sidebar showcase shows collapsed and expanded states
- [ ] Form Patterns showcase shows auth, profile, and modal patterns
- [ ] All showcase sections render in light and dark mode
- [ ] ComponentShowcase.tsx imports from components (no local duplicates)
- [ ] SpecsPanel uses imported specs objects
- [ ] Component registry updated with new entries
- [ ] `componentToSection` mapping works for catalog navigation
- [ ] TypeScript: 0 errors
- [ ] Next.js build: compiles successfully
- [ ] Prettier: all files pass

## UI/UX Considerations

- FormField label matches Input label styling exactly (`text-body font-semibold leading-[22px]`)
- EmptyState uses `py-12` to match DataTable's current empty state
- Sidebar showcase uses static representations (not live Sidebar) since it's position:fixed
- Form Patterns show real component combinations, not mockup images

## Dependencies

- No new npm packages
- Uses existing components: Input, InlineError, Button, Select, ConfirmModal

## Notes

- **MetricCard**: Intentionally deferred per user decision. Dashboard will be redesigned in a future sprint with proper planning.
- **SearchBar**: Input `filled` variant already covers this. Documented as a pattern, not a separate component.
- **Modal**: ConfirmModal exists. Form modal and info modal variants are not in scope — ConfirmModal with `children` prop already supports form content.
- **Propagation pattern**: All new components must export specs and be imported by ComponentShowcase (never local duplicates).

## Deferred Items

| Item | Reason | Future Ticket |
|------|--------|---------------|
| MetricCard | Dashboard redesign planned for future sprint | TBD |
| SearchBar (with debounce + dropdown) | No search features exist yet, Input filled covers static use | TBD when search is needed |
| Form modal / Info modal variants | ConfirmModal with children handles these cases | TBD if distinct variants needed |
