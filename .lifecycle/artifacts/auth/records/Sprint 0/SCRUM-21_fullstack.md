# Implementation Record: SCRUM-21 Protected Routes, Profile Page and Admin Dashboard

## Summary

Full-stack implementation of the authenticated dashboard experience: route protection guards (ProtectedRoute, AdminRoute, GuestRoute), DashboardLayout with collapsible Sidebar (212px/68px) and NavBar (68px), Dashboard page with 4 metric cards and 5 recharts charts, Profile page with 4 sections (ProfileForm, ChangePasswordForm, AccountInfo, ConnectedAccounts), Admin page with user management (table, search, pagination, role/lock/delete actions), SUPERADMIN role support, profile fields (firstName, lastName, avatarUrl), isActive flag, and OAuth profile data extraction. Backend: UsersController with 6 endpoints, Prisma migration for profile fields + SUPERADMIN.

- **Scope**: `fullstack`
- **Branch**: `feature/SCRUM-21-fullstack`
- **Implementation date**: 2026-02-26

## Plan Reference

- **Original plan**: `ai-specs/changes/plans/SCRUM-21_fullstack.md`
- **Plan was followed**: **Partially** — Plan was written retroactively and aligned to actual code. The plan documents the final state accurately.

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `c1baa2b` | feat(SCRUM-21): protected routes, profile page and admin dashboard | Backend: `nexacore-api/prisma/schema.prisma`, `nexacore-api/prisma/migrations/20260225230005_*/migration.sql`, `nexacore-api/src/users/users.controller.ts`, `nexacore-api/src/users/users.service.ts`, `nexacore-api/src/users/dto/*.dto.ts`, `nexacore-api/src/auth/guards/roles.guard.ts`, `nexacore-api/src/auth/strategies/google.strategy.ts`, `nexacore-api/src/auth/strategies/github.strategy.ts`. Frontend: `src/components/guards/*.tsx`, `src/components/layout/DashboardLayout.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/NavBar.tsx`, `src/app/dashboard/page.tsx`, `src/app/profile/page.tsx`, `src/app/admin/page.tsx`, `src/components/dashboard/*.tsx`, `src/components/profile/*.tsx`, `src/components/admin/*.tsx`, `src/context/AuthContext.tsx`, `src/lib/types.ts` (60 files, +4,082/-87) |

## Deviations from Plan

Since the plan was written retroactively and aligned to the final code state, there are no deviations between plan and implementation. Notable design decisions and known issues:

| Item | Description |
|------|-------------|
| `isInitialized` pattern | Added to AuthState to fix GuestRoute unmounting LoginForm during login (`isLoading: true` was incorrectly triggering guard spinners) |
| SUPERADMIN in role dropdown but backend rejects | AdminRoute shows SUPERADMIN option in role change dropdown, but only SUPERADMIN users can assign it — ADMIN gets 403 |
| Lock/Unlock semantic gap | Frontend calls it "Lock/Unlock" but backend uses `isActive` boolean, not `lockedUntil` timestamp |
| ConnectedAccounts no disconnect | Shows connected providers but no disconnect/unlink functionality |
| Dashboard static mock data | All chart data is hardcoded; no API integration |
| `GET /users/:id` returns 200 for non-existent users | Controller doesn't throw 404 for null findById result; documented code smell |
| recharts version | Using `recharts ^3.7.0` (not ^2.x as initially expected) |

## Test Results

- Backend unit tests: All existing tests pass with `+4` lines added to each spec for new fields
- No new frontend tests written (UI-heavy story)
- Manual verification:
  - [x] Guards: unauthenticated → /login redirect, authenticated guest pages → /dashboard redirect, USER on /admin → /dashboard redirect
  - [x] Session persistence: page refresh preserves auth via silent token refresh
  - [x] Dashboard: 4 metric cards, 5 charts render, sidebar collapse/expand, mobile hamburger menu
  - [x] Profile: load user data, save firstName/lastName, change password with strength meter, account info display
  - [x] Admin: paginated user table, search, role change, lock/unlock, soft delete, SUPERADMIN protection
  - [x] `nest build` succeeds, `next build` succeeds (14/14 pages)

## Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| Login password step resets to email step | HIGH | Fixed | Added `isInitialized` to AuthState; guards use `isInitialized` instead of `isLoading` |
| All API endpoints return 500 after schema change | HIGH | Fixed | Ran `prisma migrate dev` to apply new columns |
| ProfileForm called `PATCH /auth/me` | MEDIUM | Fixed | Corrected to `PATCH /users/me` |
| ChangePasswordForm called `POST /auth/change-password` | MEDIUM | Fixed | Corrected to `PATCH /users/me/password` |
| `next/image` unconfigured host for OAuth avatars | LOW | Fixed | Added `images.remotePatterns` for `lh3.googleusercontent.com` and `avatars.githubusercontent.com` |

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/changes/plans/SCRUM-21_fullstack.md` | Retroactive plan created and aligned to code |

## Lessons Learned

- **What went well**: The `isInitialized` pattern cleanly separates "initial session check" from "user action loading", preventing guard-related UI bugs. The DashboardLayout with responsive sidebar/navbar is reusable across all authenticated pages.
- **What was harder than expected**: Largest single commit (60 files, 4K+ lines) covering both backend and frontend. The SUPERADMIN protection logic in UsersController required careful permission checking at multiple levels. Pixel-perfect sidebar measurements (212px/68px) required iterative Figma comparison.
- **Recommendations**: For future fullstack stories of this size, consider splitting into 2-3 smaller commits (backend first, then frontend layout, then page components). Always run `prisma migrate dev` immediately after schema changes to avoid cascading 500 errors.
