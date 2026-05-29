# Implementation Record: SCRUM-289 Build Component Showcase — Molecules and Organisms

## Summary
Completed the Design System showcase with new components (FormField, EmptyState), consolidated duplicate showcase sections, and documented existing components (Sidebar, icon sizes).

- **Scope**: frontend
- **Branch**: `feature/SCRUM-289-frontend`
- **Implementation date**: 2026-03-27

## Plan Reference
- Plan: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-289_frontend.md`
- Plan followed: **Yes** (10/10 steps complete, with user-directed modifications)

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `83fb121` | SCRUM-289: Build showcase molecules — FormField, EmptyState, Sidebar, icon sizes | 9 files (2 new, 7 modified) |

## Deviations from Plan

| Item | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| FormField category | Plan said "molecule" | Implemented as atom | Wrapper, not complex composition — user agreed | Accepted-Trivial | — |
| IconButton standalone section | Keep in plan | Removed, moved into Button section (DataTable) | Duplicate — user directed | Accepted-Trivial | — |
| SegmentedControl standalone | Keep in plan | Removed, moved into Tabs section | Duplicate, functionally similar to tabs — user directed | Accepted-Trivial | — |
| SegmentedControl variants | Not in plan | Added primary/secondary/outline matching Button | User request for consistency | Accepted-Trivial | — |
| SegmentedControl sizes | Not in plan | Added sm/md/lg matching Button dimensions | User request | Accepted-Trivial | — |
| SegmentedControl default size | md | sm | User request | Accepted-Trivial | — |
| SegmentedControl dark mode fix | Not in plan | Added border-transparent + transition-all | Flash on variant switch in dark mode | Accepted-Trivial | — |
| EmailSelector standalone | Keep in plan | Removed (already in Select/Dropdown) | Duplicate — user directed | Accepted-Trivial | — |
| IconButton danger style | Not in plan | Changed to text-error hover:bg-error-bg | Consistency with Button danger — user request | Accepted-Trivial | — |
| Slider track | Not in plan | border 1px→2px, height 5px→8px | User request | Accepted-Trivial | — |
| Icon Sizes in TokenInspector | Not in plan | Added 16px/48px documentation | User request for design token documentation | Accepted-Trivial | — |
| Form Patterns section | Build showcase section | Removed entirely | User decided it's documentation not a component — removed | Accepted-Trivial | — |
| FormField Select demo | Show Select child | Changed to EmailSelector child | User: Select not styled for FormField, EmailSelector already exists | Accepted-Trivial | — |

## Test Results
- TypeScript: 0 errors
- Next.js build: Compiled successfully, 20/20 static pages
- Prettier: All files pass
- Registry integrity: 23 components, all aligned with catalog mapping and showcase sections

## Bugs Found
No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-289_frontend.md` | This record |

No changes to integration-state.md, api-spec.yml, or data-model.md (frontend-only).

## New Components Created

| Component | File | Description |
|-----------|------|-------------|
| FormField | `ui/FormField.tsx` | Label + any control + error wrapper with formFieldSpecs |
| EmptyState | `ui/EmptyState.tsx` | 48px icon + title + description + optional action with emptyStateSpecs |

## Showcase Changes

| Change | Before | After |
|--------|--------|-------|
| IconButton | Standalone section in Atoms | Inside Button section as DataTable (Normal/Hover × Default/Danger/Boxed) |
| SegmentedControl | Standalone section in Atoms | Inside Tabs section with 3 variants × 3 sizes |
| EmailSelector | Standalone section in Atoms | Only in Select/Dropdown section |
| Sidebar | Not documented | New section in Molecules (collapsed/expanded mockup) |
| Icon Sizes | Not documented | New section in TokenInspector (16px inline, 48px page-level) |
| Form Patterns | Planned | Removed by user decision |
| Total components | 25 | 23 (consolidated duplicates) |

## Lessons Learned
- Consolidating related components under one showcase section (IconButton→Button, SegmentedControl→Tabs) reduces duplication and makes the catalog cleaner.
- SegmentedControl and Tabs are functionally similar — documenting them together avoids confusion.
- Design tokens like icon sizes (16px/48px) belong in TokenInspector, not in component showcases.
