# Implementation Record: SCRUM-309 Sidebar Submenu Flyout + Accordion Parent

## Summary

Sidebar UX improvements: collapsed items with children show flyout popover on hover (createPortal). Expanded parent items use accordion pattern (click toggles children). "User Management" added as explicit first child of Admin.

- **Scope**: frontend
- **Branch**: `feature/SCRUM-309-frontend`
- **PR**: #208
- **Implementation date**: 2026-04-18

## Plan Reference

- Plan: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-309_frontend.md`
- Plan was followed: **Partially** — UX pattern changed from split Link+button to accordion per user feedback during development

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `34f09bf` | SCRUM-309: Sidebar submenu flyout + accordion parent pattern | 3 files (164+, 6-) |
| `c8bd61f` | SCRUM-309: Fix intermittent flyout/tooltip race on collapsed sidebar | 1 file (1+, 1-) |

## Deviations from Plan

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| 1 | Auto-inject Overview in flyout | Children from Sidebar.tsx config (incl. User Management) | User preferred explicit config over auto-injection | Accepted-Trivial | — |
| 1 | Flyout closes immediately on leave | 150ms leave delay for gap bridging | Without delay, flyout was impossible to reach with mouse | Accepted-Trivial | — |
| 2 | Split: Link (label navigates) + button (chevron toggles) | Accordion: click entire row toggles, parent page as child item | User found split pattern confusing — best practice research confirmed accordion is clearer | Accepted-Trivial | — |

### Unplanned additions
- `Sidebar.tsx`: "User Management" as first Admin child with `Users` icon, exact-match active detection for shared-href child
- `SidebarNav.tsx`: Parent row always uses `variantStyles.nav.inactive` to prevent double-highlight when parent and child share same href
- Flyout header uses section label typography (`text-body font-normal text-content-tertiary`) per user request

## Test Results

- **Frontend build**: PASS
- **Frontend TypeScript**: 0 new errors
- **Backend tests**: 1012/1012 pass (pre-push)

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Changelog entry |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-309_verify.md` | Verification report |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-309_frontend.md` | This record |

## Lessons Learned

- Split Link+button pattern for sidebar parents is confusing — accordion (full row toggle) with parent page as explicit child is the established best practice (Notion/VS Code/Linear pattern)
- Flyout hover gap bridging requires leave delay (150ms), not just enter delay — without it the flyout is unreachable
- When parent and child share the same href, parent tab must be forced to inactive style to prevent double-highlight
- `hasChildren` check must use `Array.isArray()` not `.length > 0` — permission loading can temporarily filter children to `[]`, causing flyout/tooltip flicker
