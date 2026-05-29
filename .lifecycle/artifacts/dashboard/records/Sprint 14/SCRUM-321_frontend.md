# Implementation Record: SCRUM-321 ConfirmModal UX Improvements

## Summary

Comprehensive UX overhaul of ConfirmModal component. 11 improvements including accessibility (W3C WAI ARIA APG), mobile responsiveness, smart autofocus, Enter key submit, body scroll lock, ConnectedAccounts migration, and audit of all modal usages.

- **Scope**: frontend
- **Branch**: `feature/SCRUM-321-frontend` (PR #222) + direct commits to main
- **Implementation date**: 2026-04-19 / 2026-04-20

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `b23aa3d` | SCRUM-321: ConfirmModal UX improvements (6 fixes) | 1 file |
| `20f5ba7` | Merge pull request #222 | merge |
| `5470bf1` | SCRUM-321: Restore rounded-t-xl and rounded-b-xl | 1 file |
| `1985224` | SCRUM-321: Remove body scroll lock + conditional button sizes | 1 file |
| `7a8b533` | SCRUM-321: Audit — migrate ConnectedAccounts + add size props | 4 files |
| `3c0ea7a` | SCRUM-321: Validate password field on Disconnect modal | 1 file |
| `8a3d9c2` | SCRUM-321: Validate empty password before min length check | 1 file |
| `ad4f1da` | SCRUM-321: Restore original layout styles in ConnectedAccounts | 1 file |
| `60adb08` | SCRUM-321: Revert buttons to md — consistent across all modals | 1 file |
| `a0c8b83` | SCRUM-321: Lock body scroll with scrollbar compensation | 1 file |

## Changes Made

| # | Fix | Details |
|---|-----|---------|
| 1 | Overlay click | No longer closes modal (Escape + X only) |
| 2 | X close button | Always visible (was hover-only, broken on mobile) |
| 3 | Button sizes | All md (consistent across all modals) |
| 4 | Mobile responsive | p-4 sm:p-6, max-h-[90vh] overflow-y-auto |
| 5 | Smart autofocus | Input > Cancel (danger) > Confirm (W3C WAI ARIA APG) |
| 6 | Enter key | Triggers onConfirm (unless textarea/button) |
| 7 | Body scroll lock | overflow:hidden + paddingRight scrollbar compensation |
| 8 | ConnectedAccounts | Migrated inline custom modal to ConfirmModal (-148 lines) |
| 9 | Size props audit | Added size="md" to PasskeyManager (3), DeleteAccount, admin page |
| 10 | Layout restore | Restored original styles in ConnectedAccounts (h3, grid, rounded-xl) |
| 11 | Password validation | Disconnect modal validates empty + min 8 chars |

## Test Results

- **Frontend build**: PASS
- **Frontend TypeScript**: 0 errors
- **Backend tests**: 1032/1032 pass

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Changelog entry |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-321_frontend.md` | This record |

## Lessons Learned

- Body scroll lock requires scrollbar width compensation to prevent layout shift
- Conditional button sizes (sm/md) create visual inconsistency — better to pick one
- When rewriting a component, always diff against original to avoid unintended style changes
- ConnectedAccounts inline modal was 70+ lines of manual overlay/focus/keyboard — ConfirmModal handles it all
