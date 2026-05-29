# Implementation Record: SCRUM-314 ActionDropdown Edge Detection

## Summary

ActionDropdown now opens upward when near the viewport bottom instead of getting clipped. Follows the Select component's edge detection pattern.

- **Scope**: frontend
- **Branch**: `feature/SCRUM-314-frontend`
- **PR**: #216 (merged)
- **Implementation date**: 2026-04-19

## Plan Reference

- Plan: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-314_frontend.md`
- Plan was followed: **Yes**

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `17b291a` | SCRUM-314: ActionDropdown edge detection — open up near viewport bottom | 1 file (16+, 11-) |
| `ecb97cf` | Merge pull request #216 | merge commit |
| `d32d7a8` | SCRUM-314: Close ActionDropdown on scroll/resize | 1 file (9+, 1-) |
| `c66ce06` | Merge pull request #217 | merge commit |

## Deviations from Plan

Implementation followed the plan exactly. No deviations.

## Test Results

- **Frontend build**: PASS
- **Frontend TypeScript**: 0 new errors

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Changelog entry |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-314_frontend.md` | This record |

## Lessons Learned

- Position should be calculated at open time (like Select), not reactively in useEffect — avoids unnecessary recalculations and race conditions
