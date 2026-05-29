# SCRUM-305 Phase 10 — Plan: Sidebar as Design System component

## Scope
Frontend

## Problem
Sidebar has inline NavItem/NavSection with hardcoded styles (bg-black/[0.04],
rounded-xl). Not propagable from showcase. Showcase uses static maquette
divs instead of the real component.

## Solution
Create SidebarNav as a reusable ui/ component with exported specs.
The layout Sidebar imports from SidebarNav. Showcase renders real component.

## New components

### ui/SidebarNav.tsx
Props:
- `sections`: array of { label, items: { href, label, icon, active? }[] }
- `collapsed`: boolean
- `variant`: "default" (future: other styles)
- `onNavigate?`: callback
- `footer?`: ReactNode (user card area)

Exported specs:
- navItemSpecs: active, inactive, sizes, radius
- navSectionSpecs: label styles

### Sub-components (internal, exported for showcase)
- SidebarNavItem: single nav link
- SidebarNavSection: group with label

## Steps

### Step 1 — Create ui/SidebarNav.tsx
- SidebarNavItem with exported specs (uses tokens: bg-surface-subtle, rounded-md, text-content-primary/75)
- SidebarNavSection with label
- SidebarNav wraps sections + collapsed logic

### Step 2 — Migrate layout/Sidebar.tsx
- Remove inline NavItem/NavSection
- Import SidebarNav, pass sections built from mainItems/adminItems/accountItems

### Step 3 — Update showcase
- Replace static maquette with real SidebarNav component (collapsed + expanded)
- Import specs for SpecsPanel

### Step 4 — Registry update
- Update Sidebar entry with SidebarNav.tsx

### Step 5 — Build verification
