# SCRUM-295 — Align NavBar to Design System Showcase

## Scope: FRONTEND

## Objective
Update NavBar component to use only auth-verified design tokens and reusable UI components documented in the Design System showcase.

## Pre-Implementation Integrity Check
- NavBar is used in DashboardLayout — affects all authenticated pages
- No API changes, no backend impact
- Blast radius: visual only, all pages with NavBar

## Steps

### Step 1: Replace manual Avatar with component
- Current: `<div className="h-7 w-7 rounded-circle bg-surface-inverse ...">` (manual)
- Target: `<Avatar size="sm" name={user.firstName} />` (component)

### Step 2: Standardize icon sizes to 16px
- Current: mixed 20px (PanelLeft mobile, Bell, PanelRight), 16px (desktop icons), 14px (ChevronDown)
- Target: all 16px (auth standard)
- Exception: mobile hamburger stays 20px for touch target

### Step 3: Align icon button colors to auth pattern
- Current: `text-content-secondary` (some), `text-content-primary` (others)
- Target: `text-content-primary/50 hover:text-content-primary` (auth Icon Button default)

### Step 4: Fix ChevronDown token
- Current: `text-content-tertiary`
- Target: `text-content-primary/50`

### Step 5: Use Divider component in dropdown
- Current: `<div className="my-2 h-px bg-border-strong" />`
- Target: `<Divider className="my-2" />`

### Step 6: Align search bar tokens
- Current: `bg-black/[0.04]` hardcoded, `border-black/10`
- Target: `bg-surface-subtle`, `border-border-strong`

### Step 7: Dropdown trigger alignment
- Current: `rounded-lg`
- Target: `rounded-3xl` (match Select showcase pattern)

### Step 8: Add dropdown animation
- Already has `animate-dropdown-down` ✅

## Files to Modify
1. `nexacore-dashboard/src/components/layout/NavBar.tsx` — main changes

## Acceptance Criteria
- All NavBar tokens match auth-verified showcase tokens
- Uses Avatar, Divider components instead of manual HTML
- Icon sizes standardized to 16px
- No visual regression on desktop or mobile
