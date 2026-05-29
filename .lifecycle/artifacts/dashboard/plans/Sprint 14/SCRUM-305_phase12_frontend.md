# Frontend Implementation Plan: SCRUM-305 Phase 12 — Layout Polish + Mobile UX

## Overview
Layout audit revealed 6 issues comparing with Linear, Vercel, GitHub, Stripe. Fix inconsistencies and improve mobile experience.

## Steps

### 12.1 Dropdown padding
- **File**: `NavBar.tsx:97`
- **Current**: `p-6` (24px) on 192px dropdown
- **Fix**: `p-2` (8px) — matches Linear/GitHub pattern

### 12.2 Clean stale comments
- **File**: `NavBar.tsx:69`
- **Current**: "Desktop: sidebar toggle + star + breadcrumbs"
- **Fix**: "Desktop: sidebar toggle"

### 12.3 Mobile hamburger size
- **File**: `NavBar.tsx:61`
- **Current**: `size="md"` on mobile, `size="sm"` on desktop
- **Fix**: `size="sm"` for both

### 12.4 Mobile sidebar close button
- **File**: `Sidebar.tsx`
- **Fix**: Add X IconButton in mobile mode header, calls onToggle to close

### 12.5 Dropdown items use components
- **File**: `NavBar.tsx:98-123`
- **Current**: Links with inline classes
- **Fix**: Use Button variant="link" or consistent pattern

### 12.6 Dropdown icons verification
- **File**: `NavBar.tsx`
- **Fix**: Verify all icons 16px, Sign out uses appropriate styling
