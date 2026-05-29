# Fullstack Implementation Plan: SCRUM-21 NexaCore Dashboard - Protected Routes, Profile and Admin Dashboard

> **Retroactive Note**: This plan was written retroactively after implementation and has been enriched to follow the 14-section template used by SCRUM-23 through SCRUM-30. All content reflects the actual implemented code (source of truth). See `changes/records/SCRUM-21_fullstack.md` for the implementation record.

## 1. Overview

- **Epic**: SCRUM-17 (EM NexaCore Dashboard Frontend Authentication System)
- **Ticket**: SCRUM-21
- **Type**: Story
- **Scope**: Fullstack (nexacore-dashboard + nexacore-api)
- **Priority**: HIGH -- Story 4 of 4 (final story in the epic)
- **What this delivers**: The authenticated dashboard experience completing the SCRUM-17 epic. This includes route protection guards (ProtectedRoute, AdminRoute), the dashboard layout shell (collapsible Sidebar, sticky NavBar, DashboardLayout), three full pages (Dashboard with charts, Profile with self-service forms, Admin with user management), backend Users controller with 6 endpoints, 4 DTOs, SUPERADMIN role and profile field migration, and OAuth profile data extraction.
- **Branch**: `feature/SCRUM-21-frontend` from `main`
- **Commit**: `c1baa2b`
- **Scope boundaries**:
  - **SCRUM-21 delivers**: ProtectedRoute, AdminRoute, DashboardLayout, Sidebar, NavBar, Dashboard page (with charts via recharts), Profile page (ProfileForm, ChangePasswordForm, AccountInfo, ConnectedAccounts), Admin page (UsersTable, ActionDropdown), Breadcrumbs, Pagination, ConfirmModal, ThemeToggle consumed in NavBar, backend DTOs + controller endpoints + migration, additional frontend types, tailwind config token extensions, globals.css token additions
  - **Previous stories delivered**: Project scaffold and theming (SCRUM-18), AuthContext/ApiClient/useAuth/GuestRoute/RingSpinner (SCRUM-19), OAuthCallbackHandler (SCRUM-20)

---

## 2. Architecture Context

### Application

- **Package**: `@em-ecosystem/nexacore-dashboard` (frontend) + `@em-ecosystem/nexacore-api` (backend)
- **Frontend Framework**: Next.js 14 App Router (`'use client'` on all interactive components)
- **Backend Framework**: NestJS with Prisma ORM
- **Styling**: TailwindCSS v3 with CSS custom properties (light/dark theme via `class` strategy)
- **State Management**: AuthContext (Context + Reducer) with `isInitialized` pattern

### Route Protection Model

```
/login, /register, /forgot-password
  +-- GuestRoute (redirects to /dashboard if authenticated) -- delivered in SCRUM-19

/dashboard
  +-- ProtectedRoute (redirects to /login if not authenticated)

/profile
  +-- ProtectedRoute

/admin
  +-- AdminRoute (ProtectedRoute + ADMIN/SUPERADMIN role check)
```

### Pages

| Route | File | Guard | Description |
|---|---|---|---|
| `/dashboard` | `src/app/dashboard/page.tsx` | ProtectedRoute | Main dashboard with 4 metric cards, 5 charts, right panel |
| `/profile` | `src/app/profile/page.tsx` | ProtectedRoute | User profile with edit form, password change, account info, connected accounts |
| `/admin` | `src/app/admin/page.tsx` | AdminRoute | User management table with CRUD actions, search, pagination |

### Component Tree -- Dashboard Shell

```
DashboardLayout (layout/DashboardLayout.tsx)
+-- Sidebar (layout/Sidebar.tsx)
|   +-- Logo area with collapse toggle (ChevronLeft/ChevronRight)
|   +-- MAIN section: Dashboard (PieChart), Profile (User), Admin (Shield, role-conditional)
|   +-- ACCOUNT section: Documentation (FileText)
|   +-- User card: avatar initial (6x6), display name (firstName+lastName or email prefix), role label
+-- NavBar (layout/NavBar.tsx)
|   +-- Left: PanelLeft toggle, Star (decorative), Breadcrumbs
|   +-- Center (desktop): compact search bar (decorative)
|   +-- Right: ThemeToggle, Bell (decorative), PanelRight toggle, user dropdown
|       +-- User dropdown: Profile link, Admin link (role-conditional), divider, Sign out
+-- main content area (children)
    +-- Optional right panel (280px, desktop only)
```

### Component Tree -- Profile Page

```
ProfilePage
+-- ProfileForm (profile/ProfileForm.tsx)
|   +-- Avatar section: Image or initial letter (16x16), Upload/Remove buttons (decorative, not wired to API)
|   +-- Form: firstName, lastName (editable), email (disabled with Lock icon)
+-- ChangePasswordForm (profile/ChangePasswordForm.tsx)
|   +-- 3 password fields: currentPassword, newPassword, confirmPassword
|   +-- 4-segment strength meter: Weak (red) / Fair (yellow) / Good (green) / Strong (green)
|   +-- Real-time confirm match validation (inline error via Input error prop)
+-- AccountInfo (profile/AccountInfo.tsx)
|   +-- Read-only dl/dt/dd: member since (formatted), role badge, status dot, email verification
|   +-- Status logic: uses lockedUntil for Locked (red dot), isActive for Active (green) / Inactive (gray)
+-- ConnectedAccounts (profile/ConnectedAccounts.tsx)
    +-- Google/GitHub: shows "Connected" + Check icon if user.provider matches, otherwise "Connect" button
    +-- Note: no Disconnect button exists -- connect is one-way in current implementation
```

### Component Tree -- Admin Page

```
AdminPage
+-- Header: "User Management" title + search input (rounded-full, border, Search icon)
+-- UsersTable (admin/UsersTable.tsx)
|   +-- Per-row: avatar initial, name, email, role badge (color-coded), status dot, ActionDropdown
|       +-- ActionDropdown (admin/ActionDropdown.tsx) -- 241px wide dropdown
|           +-- Change Role (ShieldCheck icon)
|           +-- Lock/Unlock Account (Lock/Unlock icon, context-aware label based on lockedUntil)
|           +-- divider
|           +-- Delete User (Trash2 icon, red text)
+-- Pagination (ui/Pagination.tsx) -- renders when totalPages > 1
+-- ConfirmModal (ui/ConfirmModal.tsx) -- 427px wide
    +-- Dynamic content: role selector (<select> with USER/ADMIN/SUPERADMIN) for role changes
```

### State Management -- isInitialized Pattern

The core architectural decision is separating **initialization state** from **action loading state** in AuthContext:

| State | Purpose | Consumed by |
|---|---|---|
| `isInitialized` | Whether the initial session check (`refreshSession` on mount) has completed | Guards (show spinner until initialized) |
| `isLoading` | Whether an auth action (login, register) is in progress | Forms (disable submit button) |

This prevents the bug where guards showed spinners during login form submission, which unmounted the LoginForm and lost password input state.

### SUPERADMIN Role Policy

| Action | ADMIN | SUPERADMIN |
|---|---|---|
| View user list | Yes | Yes |
| Change user role to USER | Yes | Yes |
| Change user role to ADMIN/SUPERADMIN | No | Yes |
| Modify SUPERADMIN accounts | No | No (protected) |
| Delete SUPERADMIN accounts | No | No (protected) |
| Lock/Unlock accounts | Yes | Yes |

> **Known behavior**: The admin role change modal renders a `<select>` with USER/ADMIN/SUPERADMIN options for all admin users, but the backend rejects ADMIN-to-ADMIN and ADMIN-to-SUPERADMIN assignments with `ForbiddenException`. Only SUPERADMIN users can successfully assign ADMIN or SUPERADMIN roles. The frontend does not pre-filter the dropdown options based on the acting user's role.

### Lock/Unlock Semantic Model

The Lock/Unlock action in the admin UI has a semantic gap between display and API behavior:
- **Display logic**: Both `AccountInfo` and `UsersTable` determine "Locked" status by checking `lockedUntil` (`!!user.lockedUntil && new Date(user.lockedUntil) > new Date()`). This field is set by the rate-limiting/brute-force system (future SCRUM-24), not by admin actions.
- **API behavior**: The Lock/Unlock action sends `{ isActive: false }` (lock) or `{ isActive: true }` (unlock) via `PATCH /users/:id`. This toggles the `isActive` boolean field, which is a separate concept from `lockedUntil`.
- **Implication**: An admin "locking" a user sets `isActive: false`, but the status display shows "Inactive" (not "Locked") because `lockedUntil` is not set by this action. The "Locked" display state only appears when `lockedUntil` has been set by a different system (e.g., brute-force protection). This is a known design gap to be addressed in SCRUM-24.

---

## 3. Endpoint Specification

### Self-Service Endpoints (JwtAuthGuard)

#### `PATCH /users/me` -- Update Own Profile

| Attribute | Value |
|---|---|
| Auth | `JwtAuthGuard` |
| Request DTO | `UpdateProfileDto` |
| Request Body | `{ "firstName?": "string (max 100)", "lastName?": "string (max 100)", "avatarUrl?": "string (max 500)" }` |
| Response 200 | `SafeUser` (updated user object without passwordHash/refreshToken) |
| Response 401 | Unauthorized (no valid JWT) |

#### `PATCH /users/me/password` -- Change Own Password

| Attribute | Value |
|---|---|
| Auth | `JwtAuthGuard` |
| HTTP Code | `200` (explicit `@HttpCode`) |
| Request DTO | `ChangePasswordDto` |
| Request Body | `{ "currentPassword": "string", "newPassword": "string (min 8, requires lowercase, uppercase, digit, special char @$!%*?&)" }` |
| Response 200 | `{ "message": "Password changed successfully" }` |
| Response 401 | `UnauthorizedException('Current password is incorrect')` |
| Side Effect | Sets `refreshToken: null` (revokes all sessions) |

### Admin Endpoints (JwtAuthGuard + RolesGuard @Roles(ADMIN))

The `RolesGuard` grants SUPERADMIN access when ADMIN is required (role hierarchy).

#### `GET /users` -- List Users (Paginated)

| Attribute | Value |
|---|---|
| Auth | `JwtAuthGuard` + `RolesGuard` (`@Roles(ADMIN)`) |
| Query DTO | `ListUsersQueryDto` |
| Query Params | `page` (int, min 1, default 1), `limit` (int, min 1, max 100, default 10), `sortBy` (string, default `createdAt`), `sortOrder` (`asc`\|`desc`, default `desc`), `role` (enum Role, optional), `search` (string, optional -- searches email, firstName, lastName) |
| Response 200 | `{ "data": SafeUser[], "meta": { "total": number, "page": number, "limit": number, "totalPages": number } }` |

#### `GET /users/:id` -- Get Single User

| Attribute | Value |
|---|---|
| Auth | `JwtAuthGuard` + `RolesGuard` (`@Roles(ADMIN)`) |
| Response 200 | `SafeUser` (when found) |
| Response 200 | `{ "error": "User not found" }` (when not found) |

> **Known code smell**: `GET /users/:id` returns HTTP 200 with `{ "error": "User not found" }` instead of HTTP 404 with a proper `NotFoundException`. This should be refactored to throw `NotFoundException` in a future cleanup.

> **Orphan endpoint**: `GET /users/:id` exists in the backend controller but has no frontend consumer. No page or component calls this endpoint. It was implemented for completeness and potential future use (e.g., user detail pages).

#### `PATCH /users/:id` -- Admin Update User

| Attribute | Value |
|---|---|
| Auth | `JwtAuthGuard` + `RolesGuard` (`@Roles(ADMIN)`) |
| Request DTO | `AdminUpdateUserDto` |
| Request Body | `{ "role?": "SUPERADMIN" \| "ADMIN" \| "USER", "isActive?": boolean }` |
| Response 200 | `SafeUser` (updated) |
| Response 403 | `ForbiddenException('Cannot modify SUPERADMIN accounts')` |
| Response 403 | `ForbiddenException('Only SUPERADMIN can assign ADMIN or SUPERADMIN roles')` |
| SUPERADMIN Policy | Cannot modify users with role SUPERADMIN; only SUPERADMIN can assign ADMIN/SUPERADMIN roles |

#### `DELETE /users/:id` -- Soft-Delete User

| Attribute | Value |
|---|---|
| Auth | `JwtAuthGuard` + `RolesGuard` (`@Roles(ADMIN)`) |
| HTTP Code | `200` (explicit `@HttpCode`) |
| Response 200 | `{ "message": "User deactivated successfully" }` |
| Behavior | Sets `isActive: false` (soft delete); protects SUPERADMIN accounts |

---

## 4. Database Changes

### Migration: `20260225230005_add_profile_fields_and_superadmin`

- **File**: `nexacore-api/prisma/migrations/20260225230005_add_profile_fields_and_superadmin/migration.sql`

```sql
-- AlterEnum: Add SUPERADMIN to Role
ALTER TYPE "Role" ADD VALUE 'SUPERADMIN';

-- AlterTable: Add profile fields to users
ALTER TABLE "users" ADD COLUMN "avatarUrl" TEXT,
ADD COLUMN "firstName" TEXT,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "lastName" TEXT;
```

### Schema Changes (`nexacore-api/prisma/schema.prisma`)

| Change | Details |
|---|---|
| `Role` enum | Added `SUPERADMIN` value (before `ADMIN`) |
| `User.firstName` | `String?` -- nullable, no default |
| `User.lastName` | `String?` -- nullable, no default |
| `User.avatarUrl` | `String?` -- nullable, no default |
| `User.isActive` | `Boolean @default(true)` -- non-nullable with default |

---

## 5. Files to Create

### Frontend -- Guards

| File | Purpose |
|---|---|
| `nexacore-dashboard/src/components/guards/ProtectedRoute.tsx` | Waits for `isInitialized`, shows `RingSpinner` centered on screen, redirects to `/login` if not authenticated via `router.replace` |
| `nexacore-dashboard/src/components/guards/AdminRoute.tsx` | Wraps `ProtectedRoute` with inner `AdminCheck` component that verifies `user.role === 'ADMIN' \|\| 'SUPERADMIN'`, redirects non-admins to `/dashboard` |

### Frontend -- Layout

| File | Purpose |
|---|---|
| `nexacore-dashboard/src/components/layout/DashboardLayout.tsx` | Authenticated layout: collapsible sidebar (state: `sidebarCollapsed`, `mobileOpen`, `rightPanelOpen`), responsive margins (`lg:ml-[212px]` / `lg:ml-[68px]`), optional right panel (280px) |
| `nexacore-dashboard/src/components/layout/Sidebar.tsx` | Fixed-position sidebar transitioning between 212px (expanded) and 68px (collapsed), MAIN/ACCOUNT sections, sub-components `NavSection` and `NavItem` |
| `nexacore-dashboard/src/components/layout/NavBar.tsx` | Sticky header at 68px height, hamburger (mobile) / sidebar toggle (desktop), Breadcrumbs, decorative search bar, ThemeToggle, Bell, PanelRight toggle, user dropdown with click-outside dismiss |

### Frontend -- Dashboard Page

| File | Purpose |
|---|---|
| `nexacore-dashboard/src/app/dashboard/page.tsx` | Dashboard wrapped in ProtectedRoute + DashboardLayout with RightPanel; 4 MetricCards, 5 chart components, all static mock data |
| `nexacore-dashboard/src/components/dashboard/MetricCard.tsx` | KPI card with `purple`/`blue` color variants (`bg-metric-purple`/`bg-metric-blue`), trend badge with TrendingUp/TrendingDown icons |
| `nexacore-dashboard/src/components/dashboard/ChartCard.tsx` | Reusable chart container with title, optional action slot, `rounded-2xl` border |
| `nexacore-dashboard/src/components/dashboard/TotalUsersChart.tsx` | Recharts `LineChart` -- this year vs last year comparison |
| `nexacore-dashboard/src/components/dashboard/TrafficByWebsiteChart.tsx` | Horizontal progress bars for 6 websites (custom, non-Recharts) |
| `nexacore-dashboard/src/components/dashboard/TrafficByDeviceChart.tsx` | Recharts `BarChart` with per-bar colors |
| `nexacore-dashboard/src/components/dashboard/TrafficByLocationChart.tsx` | Recharts donut `PieChart` with legend |
| `nexacore-dashboard/src/components/dashboard/MarketingSeoChart.tsx` | Full-width Recharts `BarChart`, 12 months |
| `nexacore-dashboard/src/components/dashboard/RightPanel.tsx` | 3 sections: Notifications (Bug/MessageSquare/ShoppingCart/Inbox icons), Activities timeline (dashed line, avatar initials), Contacts list -- all static mock data |

### Frontend -- Profile Page

| File | Purpose |
|---|---|
| `nexacore-dashboard/src/app/profile/page.tsx` | Profile wrapped in ProtectedRoute + DashboardLayout (no right panel); 4 stacked card sections in `max-w-2xl` container |
| `nexacore-dashboard/src/components/profile/ProfileForm.tsx` | Avatar (Image or initial), Upload/Remove buttons (decorative). Form: firstName + lastName (editable) + email (disabled with Lock icon). Calls `PATCH /users/me`, then `refreshSession()` |
| `nexacore-dashboard/src/components/profile/ChangePasswordForm.tsx` | 3 fields: currentPassword, newPassword, confirmPassword. 4-segment strength meter (criteria: length>=8, uppercase, digit, special char). Real-time match validation on confirmPassword. Calls `PATCH /users/me/password`. Success clears all fields |
| `nexacore-dashboard/src/components/profile/AccountInfo.tsx` | Read-only `dl/dt/dd` grid: member since (toLocaleDateString en-US), role badge (`bg-surface-subtle`), status dot (Locked=red via `lockedUntil`, Active=green via `isActive`, Inactive=gray), email verification (Check/AlertTriangle icons) |
| `nexacore-dashboard/src/components/profile/ConnectedAccounts.tsx` | Google/GitHub providers with inline SVG icons. Connected state: "Connected" + Check icon. Unconnected state: "Connect" button redirecting to OAuth URL. No Disconnect functionality exists |

### Frontend -- Admin Page

| File | Purpose |
|---|---|
| `nexacore-dashboard/src/app/admin/page.tsx` | Admin wrapped in AdminRoute + DashboardLayout (no right panel). State machine: `modalType` (`'role'` \| `'lock'` \| `'unlock'` \| `'delete'` \| `null`), `selectedUser`, `selectedRole`, `modalLoading`. Fetches users with `useCallback` + `useEffect` |
| `nexacore-dashboard/src/components/admin/UsersTable.tsx` | Table with columns: User (avatar initial + name), Email, Role (badges: SUPERADMIN `#edeefc/#4f507f`, ADMIN `#e6f1fd/info`, USER `surface-subtle/content-secondary`), Status (dot + label), Actions. Status uses same `lockedUntil`/`isActive` logic as AccountInfo |
| `nexacore-dashboard/src/components/admin/ActionDropdown.tsx` | Per-row dropdown (241px wide via `w-[241px]`): Change Role, Lock/Unlock (context-aware via `lockedUntil`), Delete (red, after divider). Click-outside dismiss via `useRef` + `mousedown` listener |

### Frontend -- Reusable UI Components

| File | Purpose |
|---|---|
| `nexacore-dashboard/src/components/ui/Breadcrumbs.tsx` | Home icon link to `/dashboard`, items array with label/href. Last item is plain text, others are links. Separator: `/` at `content-primary/20` |
| `nexacore-dashboard/src/components/ui/Pagination.tsx` | Prev/Next buttons with Chevron icons, numbered page buttons (38x38px via `h-[38px] w-[38px]`). Ellipsis logic for >7 pages (show first, last, and 3 around current). Current page: bold with `border-content-primary`. Disabled state at `opacity-30` |
| `nexacore-dashboard/src/components/ui/ConfirmModal.tsx` | Fixed overlay (`bg-black/40`), centered card (427px via `w-[427px]`). Top section: title + description + optional children. Bottom section: Cancel + Confirm buttons. Escape key dismissal. Variant: `primary` (inverse bg) or `danger` (error bg). Loading state replaces confirm label with "Loading..." |

### Backend -- DTOs

| File | Purpose |
|---|---|
| `nexacore-api/src/users/dto/update-profile.dto.ts` | `UpdateProfileDto`: optional `firstName` (string, max 100), `lastName` (string, max 100), `avatarUrl` (string, max 500). Uses `@IsOptional`, `@IsString`, `@MaxLength` |
| `nexacore-api/src/users/dto/change-password.dto.ts` | `ChangePasswordDto`: required `currentPassword` (string), `newPassword` (string, min 8, requires lowercase, uppercase, digit, special char `@$!%*?&`). Uses `@IsString`, `@MinLength`, `@Matches` |
| `nexacore-api/src/users/dto/admin-update-user.dto.ts` | `AdminUpdateUserDto`: optional `role` (enum Role), `isActive` (boolean). Uses `@IsOptional`, `@IsEnum`, `@IsBoolean` |
| `nexacore-api/src/users/dto/list-users-query.dto.ts` | `ListUsersQueryDto`: `page` (int, min 1, default 1), `limit` (int, min 1, max 100, default 10), `sortBy` (string, default `createdAt`), `sortOrder` (`asc`\|`desc`, default `desc`), `role` (enum Role, optional), `search` (string, optional). Uses `@Type(() => Number)` from `class-transformer` |

### Backend -- Controller

| File | Purpose |
|---|---|
| `nexacore-api/src/users/users.controller.ts` | `@Controller('users')` with 6 endpoints: `PATCH /me`, `PATCH /me/password`, `GET /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`. Uses `JwtAuthGuard`, `RolesGuard`, `@Roles(Role.ADMIN)` |

### Backend -- Migration

| File | Purpose |
|---|---|
| `nexacore-api/prisma/migrations/20260225230005_add_profile_fields_and_superadmin/migration.sql` | SQL migration adding SUPERADMIN enum value and profile fields |

---

## 6. Files to Modify

| File | Changes |
|---|---|
| `nexacore-dashboard/src/lib/types.ts` | Added `UserRole` type, extended `SafeUser` with `firstName`, `lastName`, `avatarUrl`, `isActive`, `failedAttempts`, `lockedUntil`. Added `PaginatedResponse<T>`, `UpdateProfileDto`, `ChangePasswordDto`, `AdminUpdateUserDto` types |
| `nexacore-dashboard/tailwind.config.ts` | Extended `colors` with `metric` (`purple`, `blue`) and `notification` (`purple`, `blue`) token mappings. Extended `boxShadow` with `card` and `avatar`. Extended `borderRadius` with `circle: '50%'` |
| `nexacore-dashboard/src/app/globals.css` | Added CSS custom properties: `--metric-purple`, `--metric-blue`, `--notification-purple`, `--notification-blue` for both light and dark modes |
| `nexacore-dashboard/src/context/AuthContext.tsx` | Added `isInitialized: boolean` to `AuthState` (initial: `false`). Set to `true` in `AUTH_SUCCESS`, `AUTH_ERROR`, `LOGOUT` reducer cases. Exposed `refreshSession` in context value |
| `nexacore-dashboard/src/lib/api.ts` | Added `parseErrorResponse()` fallback for non-JSON error responses. Added `try/catch` on `fetch()` calls for network errors |
| `nexacore-dashboard/src/components/auth/OAuthCallbackHandler.tsx` | Added handling for `?error=` URL parameter and error state display before redirect |
| `nexacore-dashboard/src/app/login/page.tsx` | Wrapped in `<GuestRoute>` |
| `nexacore-dashboard/src/app/register/page.tsx` | Wrapped in `<GuestRoute>` |
| `nexacore-dashboard/src/app/layout.tsx` | Added inline theme init script in `<head>` to prevent FOUC |
| `nexacore-dashboard/next.config.mjs` | Added `images.remotePatterns` for `lh3.googleusercontent.com` and `avatars.githubusercontent.com` |
| `nexacore-dashboard/package.json` | Added `recharts: ^3.7.0` dependency |
| `nexacore-api/prisma/schema.prisma` | Added `SUPERADMIN` to Role enum. Added `firstName`, `lastName`, `avatarUrl` (String?), `isActive` (Boolean, default true) to User model |
| `nexacore-api/src/users/enums/role.enum.ts` | Added `SUPERADMIN = 'SUPERADMIN'` |
| `nexacore-api/src/users/entities/user.entity.ts` | Added `firstName?`, `lastName?`, `avatarUrl?`, `isActive` to User and SafeUser types |
| `nexacore-api/src/users/users.module.ts` | Registered `UsersController` |
| `nexacore-api/src/users/users.service.ts` | Added `findAll`, `updateProfile`, `changePassword`, `adminUpdateUser`, `softDelete` methods. Updated `findOrCreateByOAuth` to populate profile fields (conservative sync: only populate empty fields) |
| `nexacore-api/src/common/interfaces/oauth-profile.interface.ts` | Added `firstName?`, `lastName?`, `avatarUrl?` to `OAuthProfile` interface |
| `nexacore-api/src/auth/strategies/google.strategy.ts` | Extracts `name.givenName` (firstName), `name.familyName` (lastName), `photos[0].value` (avatarUrl) |
| `nexacore-api/src/auth/strategies/github.strategy.ts` | Extracts `displayName` split into first/last name, `photos[0].value` (avatarUrl) |
| `nexacore-api/src/auth/guards/roles.guard.ts` | Updated to grant SUPERADMIN access when ADMIN is required (role hierarchy) |

> **Record note**: The implementation record (`changes/records/SCRUM-21_fullstack.md`) lists `src/tailwind.config.ts` as a modified file. The actual file path is `nexacore-dashboard/tailwind.config.ts` (project root, not `src/`). The record should be corrected.

---

## 7. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to feature branch for SCRUM-21
- **Branch Naming**: `feature/SCRUM-21-frontend` from `main`
- **Implementation Steps**:
  1. Ensure on the latest `main` branch
  2. Pull latest changes: `git pull origin main`
  3. Create new branch: `git checkout -b feature/SCRUM-21-frontend`
  4. Verify branch creation: `git branch`
- **Notes**: Since this is a fullstack ticket, the branch contains both frontend and backend changes.

### Step 1: Database Migration -- Add Profile Fields and SUPERADMIN Role

- **File**: `nexacore-api/prisma/schema.prisma`
- **Migration**: `nexacore-api/prisma/migrations/20260225230005_add_profile_fields_and_superadmin/migration.sql`
- **Action**: Extend the User model with profile fields and SUPERADMIN role
- **Implementation Steps**:
  1. Add `SUPERADMIN` to the `Role` enum in `schema.prisma`
  2. Add `firstName` (String?), `lastName` (String?), `avatarUrl` (String?) fields to User model
  3. Add `isActive` (Boolean, default true) field to User model
  4. Run `npx prisma migrate dev --name add_profile_fields_and_superadmin`
  5. Verify migration SQL matches expected output (see section 4)
- **Dependencies**: Prisma CLI

### Step 2: Backend -- Update Entities, Enums, and Interfaces

- **Files**:
  - `nexacore-api/src/users/enums/role.enum.ts` -- Add `SUPERADMIN = 'SUPERADMIN'`
  - `nexacore-api/src/users/entities/user.entity.ts` -- Add `firstName?`, `lastName?`, `avatarUrl?`, `isActive` to User and SafeUser types
  - `nexacore-api/src/common/interfaces/oauth-profile.interface.ts` -- Add `firstName?`, `lastName?`, `avatarUrl?` to OAuthProfile
- **Implementation Steps**:
  1. Add `SUPERADMIN` to Role enum
  2. Extend User and SafeUser entity types with new profile fields
  3. Extend OAuthProfile interface for OAuth data extraction
- **Notes**: SafeUser omits passwordHash and refreshToken; add all new visible fields.

### Step 3: Backend -- Users Controller and DTOs

- **Files**:
  - `nexacore-api/src/users/users.controller.ts` -- NEW
  - `nexacore-api/src/users/dto/update-profile.dto.ts` -- NEW
  - `nexacore-api/src/users/dto/change-password.dto.ts` -- NEW
  - `nexacore-api/src/users/dto/admin-update-user.dto.ts` -- NEW
  - `nexacore-api/src/users/dto/list-users-query.dto.ts` -- NEW
  - `nexacore-api/src/users/users.module.ts` -- MODIFIED (register controller)
- **Action**: Create REST controller with self-service and admin endpoints (see section 3 for full endpoint specification)
- **Implementation Steps**:
  1. Create `UpdateProfileDto` with optional `firstName`, `lastName`, `avatarUrl` with class-validator decorators
  2. Create `ChangePasswordDto` with `currentPassword` + `newPassword` (strength validation via `@Matches` regex)
  3. Create `AdminUpdateUserDto` with optional `role` (enum) and `isActive` (boolean)
  4. Create `ListUsersQueryDto` with `page`, `limit`, `sortBy`, `sortOrder`, `role` filter, `search` with `class-transformer` `@Type(() => Number)` for query param coercion
  5. Create `UsersController` with all six endpoints
  6. Register `UsersController` in `UsersModule`
- **Notes**: SUPERADMIN protection logic: cannot modify SUPERADMIN accounts; only SUPERADMIN can assign ADMIN/SUPERADMIN roles.

### Step 4: Backend -- Users Service Methods

- **File**: `nexacore-api/src/users/users.service.ts` -- MODIFIED
- **Action**: Add service methods for all new endpoints
- **Implementation Steps**:
  1. Add `findAll(query)` -- paginated user list with search (email OR firstName OR lastName), sort, role filter
  2. Add `updateProfile(userId, dto)` -- update own profile fields
  3. Add `changePassword(userId, dto)` -- validate current password, hash new password, revoke sessions (set refreshToken to null)
  4. Add `adminUpdateUser(targetId, dto, actingUser)` -- enforce SUPERADMIN policy
  5. Add `softDelete(targetId)` -- set isActive=false, protect SUPERADMIN
  6. Update `findOrCreateByOAuth` to populate firstName, lastName, avatarUrl from OAuth profile data (conservative sync: only populate empty fields)

### Step 5: Backend -- OAuth Profile Data Extraction

- **Files**:
  - `nexacore-api/src/auth/strategies/google.strategy.ts` -- MODIFIED
  - `nexacore-api/src/auth/strategies/github.strategy.ts` -- MODIFIED
  - `nexacore-api/src/auth/guards/roles.guard.ts` -- MODIFIED
- **Action**: Extract profile data from OAuth providers and update roles guard
- **Implementation Steps**:
  1. Google strategy: extract `name.givenName` (firstName), `name.familyName` (lastName), `photos[0].value` (avatarUrl)
  2. GitHub strategy: extract `displayName` split into first/last name (`split(' ')[0]` / `split(' ').slice(1).join(' ')`), `photos[0].value` (avatarUrl)
  3. Update RolesGuard to grant SUPERADMIN access when ADMIN is required (role hierarchy)

### Step 6: Frontend -- Update Types and ApiClient

- **Files**:
  - `nexacore-dashboard/src/lib/types.ts` -- MODIFIED
  - `nexacore-dashboard/src/lib/api.ts` -- MODIFIED
- **Implementation Steps**:
  1. Add `UserRole` type: `'SUPERADMIN' | 'ADMIN' | 'USER'`
  2. Extend `SafeUser` with `firstName`, `lastName`, `avatarUrl`, `isActive`, `failedAttempts`, `lockedUntil`, update `role` to `UserRole`
  3. Add `PaginatedResponse<T>` type with `data` and `meta` (total, page, limit, totalPages)
  4. Add `UpdateProfileDto`, `ChangePasswordDto`, `AdminUpdateUserDto` types
  5. Add `parseErrorResponse()` fallback to ApiClient for non-JSON error responses
  6. Add `try/catch` on `fetch()` calls in ApiClient for network errors

### Step 7: Frontend -- AuthContext -- isInitialized Pattern

- **File**: `nexacore-dashboard/src/context/AuthContext.tsx` -- MODIFIED
- **Action**: Add `isInitialized` flag to AuthState for guard components
- **Implementation Steps**:
  1. Add `isInitialized: boolean` to `AuthState` type (initial value: `false`)
  2. Set `isInitialized: true` in `AUTH_SUCCESS`, `AUTH_ERROR`, and `LOGOUT` reducer cases
  3. Expose `refreshSession` method in context value for profile refresh after update
  4. Export `useAuth` hook from the module
- **Note on useAuth import path**: All components import `useAuth` from `@/hooks/useAuth`, which is a re-export barrel file (`src/hooks/useAuth.ts`) that re-exports from `@/context/AuthContext`. This provides cleaner import paths.

### Step 8: Frontend -- Route Guard Components

- **Files**:
  - `src/components/guards/ProtectedRoute.tsx` -- NEW
  - `src/components/guards/AdminRoute.tsx` -- NEW
- **Action**: Create two guard components that consume `useAuth()` from `@/hooks/useAuth` and use `isInitialized`
- **Implementation Steps**:
  1. **ProtectedRoute**: Wait for `isInitialized`, show `RingSpinner` centered on screen (`bg-surface-secondary`) while loading. If initialized and not authenticated, redirect to `/login` via `router.replace`. Return `null` during redirect, render children when authenticated.
  2. **AdminRoute**: Compose `ProtectedRoute` wrapping an inner `AdminCheck` component. AdminCheck verifies `user.role === 'ADMIN' || user.role === 'SUPERADMIN'`. Non-admins redirected to `/dashboard`.
  3. Wrap existing `/login/page.tsx` and `/register/page.tsx` with `<GuestRoute>` (GuestRoute itself was delivered in SCRUM-19).
- **Dependencies**: `useAuth` hook (via `@/hooks/useAuth`), `RingSpinner` component, `next/navigation` router

### Step 9: Frontend -- Dashboard Layout Shell

- **Files**:
  - `src/components/layout/DashboardLayout.tsx` -- NEW
  - `src/components/layout/Sidebar.tsx` -- NEW (moved from SCRUM-18 scope)
  - `src/components/layout/NavBar.tsx` -- NEW (moved from SCRUM-18 scope)
- **Action**: Create the authenticated dashboard layout with collapsible sidebar, sticky navbar, and optional right panel

#### Sidebar.tsx
- **Implementation Steps**:
  1. Accept `collapsed` (boolean) and `onToggle` (function) props
  2. Fixed position, full height, transition width between 212px (`w-[212px]`) and 68px (`w-[68px]`) via `transition-[width] duration-200`
  3. Logo area with "NexaCore" text (`text-body-sm font-semibold`, hidden when collapsed) and ChevronLeft/ChevronRight toggle (6x6 button)
  4. MAIN navigation section: Dashboard (PieChart icon), Profile (User icon), Admin (Shield icon, role-conditional via `isAdmin` check)
  5. ACCOUNT section: Documentation (FileText icon, `active` always `false`)
  6. Active state: `rounded-3xl bg-surface-subtle`; inactive: `rounded-xl` with hover
  7. User card at bottom: avatar initial circle (6x6, `bg-surface-inverse text-content-inverse`), display name (firstName+lastName or email prefix), role label (`text-caption text-content-tertiary`)
  8. Sub-components: `NavSection` (label + children), `NavItem` (Link with icon, active state, collapsed tooltip via `title` attribute)

#### NavBar.tsx
- **Implementation Steps**:
  1. Sticky header, 68px height (`h-[68px]`), border-bottom, `bg-surface-primary`, `px-7`
  2. Left side: PanelLeft hamburger (mobile, `lg:hidden`) / PanelLeft sidebar toggle + Star + Breadcrumbs (desktop, `lg:flex`)
  3. Right side: compact search bar (decorative, desktop only), ThemeToggle (consumed from `@/components/ui/ThemeToggle`), Bell notification (decorative), PanelRight toggle (conditional on `onRightPanelToggle` prop, desktop only), user dropdown
  4. User dropdown: click-outside dismiss (`useRef` + `mousedown` event), avatar initial (7x7), ChevronDown. Dropdown: Profile link, Admin link (role-conditional), divider, Sign out button (calls `logout()`, red text)
  5. Breadcrumb generation from pathname using `routeLabels` map: `/dashboard` -> `Overview`, `/profile` -> `Profile`, `/admin` -> `User Management`

#### DashboardLayout.tsx
- **Implementation Steps**:
  1. Accept `children` (ReactNode) and optional `rightPanel` (ReactNode) props
  2. Manage `sidebarCollapsed`, `mobileOpen`, `rightPanelOpen` state
  3. Desktop: sidebar always visible (`hidden lg:block`) with margin transition on main content
  4. Mobile: sidebar as slide-in drawer (`translate-x-0` / `-translate-x-full`) with `bg-black/40` overlay
  5. Right panel: fixed 280px panel (`w-[280px]`), desktop only (`lg:block`), toggleable
  6. Responsive layout: `lg:ml-[212px]` / `lg:ml-[68px]` based on collapse state; `lg:mr-[280px]` when right panel open

### Step 10: Frontend -- Reusable UI Components

- **Files**:
  - `src/components/ui/Breadcrumbs.tsx` -- NEW
  - `src/components/ui/Pagination.tsx` -- NEW
  - `src/components/ui/ConfirmModal.tsx` -- NEW
- **Implementation Steps**:
  1. **Breadcrumbs**: Home icon (20x20) link to `/dashboard`, then items array with label/href. Last item is plain text (`text-content-primary`), others are links (`text-content-tertiary`). Separator: `/` at `text-content-primary/20`.
  2. **Pagination**: Prev/Next buttons with ChevronLeft/ChevronRight icons (12px, strokeWidth 1.8), numbered page buttons (38x38px via `h-[38px] w-[38px]`, `rounded-sm`, `bg-surface-secondary`). Ellipsis logic via `getPageNumbers()` function for >7 pages (show first, last, and 3 around current). Current page: `font-bold` with `border border-content-primary bg-surface-subtle`. Disabled state at `opacity-30`. Gap between pages: `gap-2`, gap between sections: `gap-[17px]`.
  3. **ConfirmModal**: Fixed overlay (`bg-black/40`, `z-50`), centered card (427px via `w-[427px]`, `rounded-3xl`). Top section: title (`text-heading-md`) + description (`text-body-sm text-content-secondary`) + optional children, with `bg-surface-primary` background. Bottom section: Cancel + Confirm buttons in `bg-surface-secondary`. Escape key dismissal via `keydown` listener. Variant: `primary` (`bg-surface-inverse text-content-inverse`) or `danger` (`bg-error text-white`). Loading state replaces confirm label with "Loading...", disabled state at `opacity-50`.

### Step 11: Frontend -- Dashboard Page with Charts

- **Files**:
  - `src/app/dashboard/page.tsx` -- NEW
  - `src/components/dashboard/MetricCard.tsx` -- NEW
  - `src/components/dashboard/ChartCard.tsx` -- NEW
  - `src/components/dashboard/TotalUsersChart.tsx` -- NEW
  - `src/components/dashboard/TrafficByWebsiteChart.tsx` -- NEW
  - `src/components/dashboard/TrafficByDeviceChart.tsx` -- NEW
  - `src/components/dashboard/TrafficByLocationChart.tsx` -- NEW
  - `src/components/dashboard/MarketingSeoChart.tsx` -- NEW
  - `src/components/dashboard/RightPanel.tsx` -- NEW
- **Action**: Build the dashboard page with static mock data
- **Implementation Steps**:
  1. Wrap page in `<ProtectedRoute>` and `<DashboardLayout>` with RightPanel
  2. Page header: "Overview" title + "Today" dropdown (decorative)
  3. 4 MetricCards in responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`): Views (7,265, +11.01%, purple), Visits (3,671, -0.03%, blue), New Users (156, +15.03%, purple), Active Users (2,318, +6.08%, blue) -- all static hardcoded values
  4. ChartCard: reusable wrapper with title, optional action slot, `rounded-2xl` border
  5. Charts row 1 (`lg:grid-cols-[1fr_202px]`): TotalUsersChart (Recharts LineChart) + TrafficByWebsiteChart (horizontal progress bars)
  6. Charts row 2 (`lg:grid-cols-2`): TrafficByDeviceChart (Recharts BarChart) + TrafficByLocationChart (Recharts donut PieChart)
  7. Full width: MarketingSeoChart (Recharts BarChart, 12 months)
  8. RightPanel (280px): Notifications (4 items with Bug/MessageSquare/ShoppingCart/Inbox icons, purple/blue variants), Activities timeline (5 items with dashed line, avatar initials), Contacts list (6 items) -- all static mock data
- **Important**: All dashboard data is entirely static mock data. No API calls are made from the dashboard page. API integration is a future ticket.
- **Dependencies**: `recharts` ^3.7.0 (added to `package.json`)

### Step 12: Frontend -- Profile Page

- **Files**:
  - `src/app/profile/page.tsx` -- NEW
  - `src/components/profile/ProfileForm.tsx` -- NEW
  - `src/components/profile/ChangePasswordForm.tsx` -- NEW
  - `src/components/profile/AccountInfo.tsx` -- NEW
  - `src/components/profile/ConnectedAccounts.tsx` -- NEW
- **Action**: Build the profile page with 4 card sections
- **Implementation Steps**:
  1. Wrap page in `<ProtectedRoute>` and `<DashboardLayout>` (no right panel)
  2. `ProfileForm`: Avatar display (next/Image or initial letter, 16x16). Upload/Remove buttons (decorative, not wired to API). Form with firstName + lastName (editable via `Input`) + email (disabled with Lock icon at `bottom-4 right-4`). Save button calls `PATCH /users/me` via `apiClient.patch<SafeUser>`, then `refreshSession()` to update AuthContext. Error/success messages inline.
  3. `ChangePasswordForm`: 3 password fields (currentPassword, newPassword, confirmPassword) using `Input` component. Password strength meter: 4 segments (`flex-1 h-1 rounded-full`), scoring: +1 for length>=8, +1 for uppercase, +1 for digit, +1 for special char. Colors: 1=red (Weak), 2=yellow (Fair), 3-4=green (Good/Strong). Labels array: `['', 'Weak', 'Fair', 'Good', 'Strong']`. Real-time confirm match validation via `Input` `error` prop. Submit calls `PATCH /users/me/password`. Success clears all 3 fields.
  4. `AccountInfo`: Read-only `dl/dt/dd` display (grid `grid-cols-[140px_1fr]`) -- member since (formatted via `toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })`), role badge (`rounded-md bg-surface-subtle px-2 py-0.5`), status dot (3-state: `lockedUntil` active = red/Locked, `isActive` true = green/Active, `isActive` false = gray/Inactive), email verification (Check + green "Verified" or AlertTriangle + yellow "Not verified").
  5. `ConnectedAccounts`: Google and GitHub providers with inline SVG icons. Shows "Connected" + Check icon (green) if `user.provider === provider.id`, otherwise "Connect" button (border, `rounded-md`) that redirects to `NEXT_PUBLIC_API_URL/auth/{provider.toLowerCase()}`. No Disconnect button exists in current implementation.

### Step 13: Frontend -- Admin Page

- **Files**:
  - `src/app/admin/page.tsx` -- NEW
  - `src/components/admin/UsersTable.tsx` -- NEW
  - `src/components/admin/ActionDropdown.tsx` -- NEW
- **Action**: Build the admin user management page
- **Implementation Steps**:
  1. Wrap page in `<AdminRoute>` and `<DashboardLayout>` (no right panel)
  2. Page header: "User Management" title + search input (`rounded-full border`, Search icon, `w-64`)
  3. Fetch users with `apiClient.get<PaginatedResponse<SafeUser>>('/users?page=N&limit=10&search=...')` using `useCallback` + `useEffect`. Search triggers re-fetch via dependency array.
  4. `UsersTable`: Scrollable table (`overflow-x-auto`) with columns: User (avatar initial 8x8 + name), Email, Role (colored badges: SUPERADMIN `bg-[#edeefc] text-[#4f507f]`, ADMIN `bg-[#e6f1fd] text-info`, USER `bg-surface-subtle text-content-secondary`), Status (dot + label, same 3-state logic as AccountInfo), Actions (ActionDropdown)
  5. `ActionDropdown`: Click-outside dropdown (241px wide, `w-[241px]`, `rounded-3xl`) triggered by MoreHorizontal icon button (8x8). Menu items: Change Role (ShieldCheck icon), Lock/Unlock Account (Lock/Unlock icon, context-aware label based on `lockedUntil`), divider, Delete User (Trash2 icon, `text-error`)
  6. Admin actions summary:
     - **Change Role**: Opens ConfirmModal with `<select>` offering USER/ADMIN/SUPERADMIN options. Sends `{ role: selectedRole }` via `PATCH /users/:id`. Backend enforces SUPERADMIN policy (only SUPERADMIN can assign ADMIN/SUPERADMIN).
     - **Lock/Unlock**: Opens ConfirmModal. Lock sends `{ isActive: false }`, Unlock sends `{ isActive: true }` via `PATCH /users/:id`.
     - **Delete**: Opens ConfirmModal (danger variant). Sends `DELETE /users/:id` (backend soft-deletes by setting `isActive: false`).
  7. Modal state machine: `modalType` (`'role'` | `'lock'` | `'unlock'` | `'delete'` | null) + `selectedUser` + `selectedRole`. ConfirmModal renders with `modalConfig` object mapping each type to title/description/confirmLabel/variant.
  8. Pagination component renders when `totalPages > 1`
  9. Loading state: centered "Loading users..." text. Empty state: centered "No users found." in bordered container.

### Step 14: Frontend -- Configuration Updates

- **Files**:
  - `nexacore-dashboard/src/app/globals.css` -- MODIFIED
  - `nexacore-dashboard/tailwind.config.ts` -- MODIFIED (project root, not `src/`)
  - `nexacore-dashboard/next.config.mjs` -- MODIFIED
  - `nexacore-dashboard/package.json` -- MODIFIED
  - `nexacore-dashboard/src/app/layout.tsx` -- MODIFIED
- **Implementation Steps**:
  1. `globals.css`: Add design tokens `--metric-purple` (`#edeefc` light / `#2a2a3d` dark), `--metric-blue` (`#e6f1fd` light / `#1e2d3d` dark), `--notification-purple`, `--notification-blue` (same values as metric)
  2. `tailwind.config.ts`: Extend `colors` with `metric` and `notification` token mappings. Add `boxShadow.card` (`6px 6px 50px rgba(0,0,0,0.05)`), `boxShadow.avatar`. Add `borderRadius.circle` (`50%`).
  3. `next.config.mjs`: Add `images.remotePatterns` for `lh3.googleusercontent.com` and `avatars.githubusercontent.com` (OAuth avatar URLs)
  4. `package.json`: Add `recharts: ^3.7.0` dependency
  5. `layout.tsx`: Add inline theme init script in `<head>` to prevent flash of unstyled content (FOUC)

### Step 15: Frontend -- OAuthCallbackHandler Fix

- **File**: `nexacore-dashboard/src/components/auth/OAuthCallbackHandler.tsx` -- MODIFIED
- **Action**: Add handling for `?error=` URL parameter and error state display before redirect

### Step 16: Update Technical Documentation

- **Action**: Review and update technical documentation according to changes made
- **Implementation Steps**:
  1. **Review Changes**: Analyze all code changes across frontend and backend
  2. **Identify Documentation Files**:
     - API endpoint changes: Update `ai-specs/specs/api-spec.yml` with new `/users` endpoints
     - Data model changes: Update `ai-specs/specs/data-model.md` with SUPERADMIN role and profile fields
     - Backend standards: Update `ai-specs/specs/backend-standards.mdc` with SUPERADMIN Role Policy section
     - Frontend standards: Update `ai-specs/specs/frontend-standards.mdc` with new component patterns (guards, dashboard layout)
  3. **Update Documentation**: Write all documentation in English per `documentation-standards.mdc`
  4. **Verify Documentation**: Confirm all changes are accurately reflected
  5. **Create Implementation Record**: Write `changes/records/SCRUM-21_fullstack.md`
- **Notes**: This step is MANDATORY before considering the implementation complete.

### Implementation Order

1. Step 0 -- Create feature branch
2. Step 1 -- Database migration (SUPERADMIN role, profile fields)
3. Step 2 -- Backend entities, enums, interfaces update
4. Step 3 -- Backend Users controller and DTOs
5. Step 4 -- Backend Users service methods
6. Step 5 -- Backend OAuth profile extraction and roles guard update
7. Step 6 -- Frontend types and ApiClient updates
8. Step 7 -- Frontend AuthContext isInitialized pattern
9. Step 8 -- Frontend route guard components + wrap existing auth pages
10. Step 9 -- Frontend dashboard layout shell (DashboardLayout, Sidebar, NavBar)
11. Step 10 -- Frontend reusable UI components (Breadcrumbs, Pagination, ConfirmModal)
12. Step 11 -- Frontend dashboard page with charts
13. Step 12 -- Frontend profile page
14. Step 13 -- Frontend admin page
15. Step 14 -- Frontend configuration updates (globals.css, tailwind, next.config, package.json)
16. Step 15 -- Frontend OAuthCallbackHandler fix
17. Step 16 -- Update technical documentation

---

## 8. Testing Checklist

### Route Guards
- [x] Unauthenticated user visiting /dashboard redirects to /login
- [x] Unauthenticated user visiting /admin redirects to /login
- [x] Authenticated USER visiting /admin redirects to /dashboard
- [x] Authenticated ADMIN visiting /admin shows admin page
- [x] Authenticated user visiting /login redirects to /dashboard
- [x] Page refresh preserves session (silent token refresh)

### Dashboard
- [x] Metric cards render with correct static values and trend badges
- [x] All 5 charts render without errors (LineChart, BarChart, PieChart, horizontal bars, full-width BarChart)
- [x] Right panel shows notifications, activities, contacts (all static mock data)
- [x] Sidebar collapses/expands on desktop (212px <-> 68px transition)
- [x] Mobile hamburger opens sidebar drawer with black/40 overlay
- [x] Admin link visible only for ADMIN/SUPERADMIN users in sidebar and navbar dropdown

### Profile
- [x] ProfileForm loads current user data (firstName, lastName, email)
- [x] ProfileForm saves firstName/lastName successfully via PATCH /users/me
- [x] ChangePasswordForm validates password strength (4-segment meter: Weak/Fair/Good/Strong)
- [x] ChangePasswordForm validates password match in real-time (inline error on confirmPassword Input)
- [x] AccountInfo displays correct role badge, status dot (3-state: Locked/Active/Inactive), member since date
- [x] ConnectedAccounts shows correct provider status (connected with Check icon / connect button, no disconnect)

### Admin
- [x] User table loads with pagination (10 per page)
- [x] Search filters users by email/name
- [x] Change Role action opens modal with USER/ADMIN/SUPERADMIN selector
- [x] Lock/Unlock account action toggles isActive (not lockedUntil) via PATCH /users/:id
- [x] Delete user action works (soft delete via DELETE /users/:id)
- [x] SUPERADMIN accounts cannot be modified or deleted (backend enforcement)

### Backend
- [x] PATCH /users/me updates profile fields
- [x] PATCH /users/me/password validates current password, hashes new, revokes sessions (sets refreshToken: null)
- [x] GET /users returns paginated results with search and role filter
- [x] PATCH /users/:id enforces SUPERADMIN policy
- [x] DELETE /users/:id soft-deletes (sets isActive=false, protects SUPERADMIN)
- [x] OAuth profile data extraction populates firstName, lastName, avatarUrl (conservative sync)

### Build
- [x] `nest build` succeeds (nexacore-api)
- [x] `next build` succeeds (nexacore-dashboard, 14/14 pages)
- [x] No TypeScript errors
- [x] All pages render correctly in both light and dark themes

---

## 9. Error Handling

### Frontend

| Component | Pattern |
|---|---|
| **ProfileForm** | `try/catch` on API call; extracts `error?.error?.message` from response; displays inline error (`text-caption text-error`). Success state shows green "Profile updated successfully." |
| **ChangePasswordForm** | Client-side validation (password match) before API call; server-side validation errors displayed inline. Success clears all 3 fields and shows green "Password changed successfully." |
| **Admin actions** | `try/catch` in `handleConfirm`; `modalLoading` state prevents double-click. On error, loading resets but modal stays open for retry. On success, `fetchUsers(meta.page)` reloads and modal closes |
| **API errors** | `apiClient` has `parseErrorResponse()` fallback for non-JSON responses. Network errors produce structured error object with `NETWORK_ERROR` code |
| **Guard loading** | `RingSpinner` centered on full-screen (`min-h-screen bg-surface-secondary`) while `isInitialized === false`. No flash of protected content |

### Backend

| Scenario | Exception |
|---|---|
| Targeting SUPERADMIN user | `ForbiddenException('Cannot modify SUPERADMIN accounts')` |
| Non-SUPERADMIN assigning ADMIN/SUPERADMIN role | `ForbiddenException('Only SUPERADMIN can assign ADMIN or SUPERADMIN roles')` |
| Incorrect current password | `UnauthorizedException('Current password is incorrect')` |
| Invalid user ID (GET /users/:id) | Returns `{ error: 'User not found' }` with HTTP 200 (known code smell -- should be `NotFoundException`) |
| Invalid user ID (PATCH/DELETE) | Standard NestJS `NotFoundException` |

---

## 10. Non-Functional Requirements

### Performance

| Requirement | Implementation |
|---|---|
| Sidebar collapse transition | CSS `transition-[width] duration-200` -- no JS animation, GPU-accelerated |
| Chart rendering | Recharts with static data -- no API latency. Lazy loaded per page (Next.js code splitting) |
| Admin pagination | Server-side pagination (10 per page) -- client never holds full user list |
| Guard initialization | Single session check on mount (`refreshSession`); subsequent navigations instant via `isInitialized: true` |

### Security

| Requirement | Implementation |
|---|---|
| SUPERADMIN accounts immutable | Backend enforces: cannot modify or delete SUPERADMIN users regardless of acting user's role |
| Role hierarchy in guard | `RolesGuard` grants SUPERADMIN access when ADMIN is required |
| Password change revokes sessions | `changePassword` sets `refreshToken: null`, forcing re-authentication on all devices |
| No token exposure in frontend | Guards and pages consume `useAuth()` -- no direct token manipulation in page components |
| Backend DTO validation | All DTOs use `class-validator` decorators; invalid payloads rejected before reaching service layer |

### Responsive Design

| Breakpoint | Behavior |
|---|---|
| `< lg` (mobile) | Sidebar hidden, appears as slide-in drawer with overlay. Right panel hidden. NavBar shows hamburger menu |
| `>= lg` (desktop) | Sidebar always visible (collapsible 212px/68px). Right panel visible when enabled. NavBar shows full controls |
| Dashboard metric cards | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` |
| Profile page | `max-w-2xl` container with `space-y-6` stacked cards |

---

## 11. Dependencies

### Frontend

| Package | Version | Status | Purpose |
|---|---|---|---|
| `recharts` | `^3.7.0` | NEW (added in this story) | Chart visualizations: LineChart, BarChart, PieChart |
| `lucide-react` | (existing) | Used | Icons: PieChart, User, Shield, ChevronLeft, ChevronRight, FileText, PanelLeft, Star, Search, Bell, PanelRight, LogOut, ChevronDown, Lock, TrendingUp, TrendingDown, MoreHorizontal, ShieldCheck, Unlock, Trash2, Check, AlertTriangle, Home, Bug, MessageSquare, ShoppingCart, Inbox |
| `next` | 14 | Existing | App Router, Image, Link, navigation |
| `react` / `react-dom` | 18 | Existing | Core framework |
| `tailwindcss` | v3 | Existing | Styling with CSS custom properties |

### Backend

No new backend dependencies added in this story. Existing dependencies used:
- `@nestjs/common`, `@nestjs/core` -- NestJS framework
- `@prisma/client` -- database ORM
- `bcrypt` -- password hashing
- `class-validator`, `class-transformer` -- DTO validation
- `passport`, `passport-google-oauth20`, `passport-github2` -- OAuth strategies

### Internal Dependencies (Previous Stories)

| Story | What it delivered (consumed by SCRUM-21) |
|---|---|
| SCRUM-18 | Project scaffold, theming, UI components (Input, Button, RingSpinner, ThemeToggle, etc.) |
| SCRUM-19 | AuthContext, ApiClient, `useAuth` hook, GuestRoute, InfinitySpinner, `hooks/useAuth.ts` barrel |
| SCRUM-20 | OAuth flow, OAuthCallbackHandler |

---

## 12. Documentation Updates

| Document | Changes |
|---|---|
| `ai-specs/specs/api-spec.yml` | Added 6 new `/users` endpoints with request/response schemas |
| `ai-specs/specs/data-model.md` | Added SUPERADMIN to Role enum, added firstName/lastName/avatarUrl/isActive fields to User model |
| `ai-specs/specs/backend-standards.mdc` | Added SUPERADMIN Role Policy section documenting the role hierarchy and permission matrix |
| `ai-specs/specs/frontend-standards.mdc` | Added guard component patterns, dashboard layout structure, `isInitialized` pattern documentation |
| `changes/records/SCRUM-21_fullstack.md` | Implementation record with full change log and bugs found/fixed |

---

## 13. Definition of Done

### Code Quality
- [x] TypeScript strict -- no `any`, all props typed
- [x] `'use client'` only on interactive components
- [x] No unused imports
- [x] Inline Tailwind classes follow design system tokens
- [x] Backend DTOs use class-validator decorators

### Functionality
- [x] Route guards redirect correctly based on auth state and role
- [x] Dashboard renders with all 4 metric cards and 5 charts (static mock data)
- [x] Profile page allows editing firstName/lastName and changing password
- [x] Admin page lists users with search, pagination, and CRUD actions (Change Role, Lock/Unlock, Delete)
- [x] SUPERADMIN policy enforced at both frontend (UI conditional rendering) and backend (controller/service level)
- [x] Logout clears session completely (token, cookie, context)

### Integration
- [x] Frontend guards consume AuthContext `isInitialized` pattern
- [x] Profile form calls `PATCH /users/me` and refreshes session via `refreshSession()`
- [x] Admin page calls paginated `GET /users` and action endpoints (`PATCH /users/:id`, `DELETE /users/:id`)
- [x] OAuth profile data populates user fields on first login (conservative sync)
- [x] Design tokens consistent between light and dark mode

### Documentation
- [x] Implementation record created: `changes/records/SCRUM-21_fullstack.md`
- [x] Backend standards updated with SUPERADMIN Role Policy
- [x] Retroactive plan created and enriched (this document)

---

## 14. Known Behaviors and Limitations

| Item | Type | Details |
|---|---|---|
| Dashboard data is entirely static mock | By design | All metric values, chart data, right panel content (notifications, activities, contacts) are hardcoded. API integration is a future ticket |
| Avatar upload/remove buttons are decorative | Limitation | Present in ProfileForm UI but not wired to any file upload API |
| Search bar in NavBar is decorative | Limitation | Styled but has no search functionality |
| Notification bell is decorative | Limitation | No click handler; notification system is a future feature |
| Documentation link (`/docs`) leads to 404 | Limitation | Route does not exist yet |
| ConnectedAccounts shows Connect but no Disconnect | Limitation | Users can connect an OAuth provider but cannot disconnect it from the profile page |
| `GET /users/:id` returns 200 with error object instead of 404 | Code smell | Should throw `NotFoundException`; to be refactored |
| `GET /users/:id` has no frontend consumer | Orphan | Implemented for completeness but no page calls it |
| SUPERADMIN visible in admin role dropdown but backend rejects for non-SUPERADMIN | By design | Frontend does not pre-filter `<select>` options based on acting user role; backend enforces the policy |
| Lock/Unlock sends `isActive` toggle but display uses `lockedUntil` | Semantic gap | Admin "Lock" sets `isActive: false` (shows as "Inactive"), but "Locked" status requires `lockedUntil` set by brute-force system (SCRUM-24) |
| `tailwind.config.ts` path in record | Record error | Record lists `src/tailwind.config.ts`; actual path is project root `nexacore-dashboard/tailwind.config.ts` |
