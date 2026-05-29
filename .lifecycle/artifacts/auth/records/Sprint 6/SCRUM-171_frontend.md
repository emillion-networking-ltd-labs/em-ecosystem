# Implementation Record: SCRUM-171 GitHub OAuth Session Tooltip on ConnectedAccounts

## 1. Summary

Added a reusable Tooltip component and an informative tooltip next to the GitHub "Connect" button in ConnectedAccounts, explaining that the user's active GitHub session will be used and they must log out of github.com first to link a different account.

- **Scope**: frontend
- **Branch**: `feature/SCRUM-171-frontend`
- **Implementation date**: 2026-03-11

## 2. Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 6/SCRUM-171_frontend.md`
- **Plan was followed**: Yes

## 3. Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `e4f2000` | feat(SCRUM-171): add GitHub OAuth session tooltip on ConnectedAccounts | `src/components/ui/Tooltip.tsx`, `src/components/profile/ConnectedAccounts.tsx` |

## 4. Deviations from Plan

| Step | Planned | Actual | Reason | Follow-up |
|------|---------|--------|--------|-----------|
| Step 1 | text-heading-sm font-bold for tooltip text | text-caption font-medium | Better fit for informational tooltip (not a title) | Accepted |
| Step 1 | Full arrow with design system specs (17x17 rotated) | Simplified 8x8 rotated div | Simpler implementation, visually equivalent | Accepted |

## 5. Test Results

- **Unit tests**: N/A (no logic to test — purely presentational)
- **Build**: `next build` passes clean (0 TypeScript errors)
- **Manual verification**: Tooltip appears on hover/focus for GitHub Connect, not for Google Connect

## 6. Bugs Found

No bugs found during implementation.

## 7. Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Changelog entry for SCRUM-171 |

## 8. Lessons Learned

- The design system Section 11 tooltip spec is for a "title tooltip" — informational tooltips benefit from lighter text weight (font-medium vs font-bold) for readability.
- No existing Tooltip component in the codebase meant creating one from scratch, but the component is now reusable for future use across the dashboard.
