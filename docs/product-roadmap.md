# EM NexaCore — Product Roadmap

> **Living document.** Updated when strategic priorities change. Last update: 2026-03-18.

---

## Platform Vision

EM NexaCore is a multi-tenant project management platform with:
- Enterprise-grade authentication (JWT, OAuth, MFA, Passkeys, WebAuthn)
- Role-based access control (USER, ADMIN, SUPERADMIN) with granular permissions
- Project-scoped collaboration (teams, members, roles)
- Modular feature system (enable/disable per project)
- Satellite app ecosystem (independent apps integrating via REST API)
- Billing & subscription management (Stripe)

---

## Current State (as of 2026-03-18)

### What's Built (MVP — Auth + Admin + Dashboard Shell)

| Layer | Status | Details |
|-------|--------|---------|
| **Authentication** | ✅ Complete | JWT, OAuth (Google/GitHub), MFA (TOTP), Passkeys (WebAuthn), trusted devices, session management, token theft detection, impossible travel |
| **User Management** | ✅ Complete | CRUD, profile, password, email change, OAuth linking, account deletion, security activity |
| **RBAC & Permissions** | ✅ Complete | 3 roles (USER/ADMIN/SUPERADMIN), 8 permissions, PermissionsGuard, PermissionsCache |
| **Audit Logging** | ✅ Complete | 28 audit actions, append-only, compliance-ready (SOC 2, ISO 27001) |
| **Security Infrastructure** | ✅ Complete | Brute force protection, CSRF, Turnstile CAPTCHA, rate limiting, CSP, log injection prevention |
| **CI/CD Security** | ✅ Complete | Gitleaks, npm audit, ESLint SAST, OWASP ZAP (DAST), Dependabot, pre-commit/pre-push hooks |
| **Dashboard Shell** | ✅ Complete | Permission-aware navigation, Figma-aligned design, real API widgets, settings page, admin pages |
| **Design System** | ⚠️ Partial | Semantic tokens defined, Figma frames for auth. Dashboard components not yet systematized |

### Implementation Numbers

| Metric | Count |
|--------|-------|
| Entities in Prisma | 10 / 21 planned (48%) |
| API endpoints | 42 / 79 planned (53%) |
| Backend modules | 11 / 18 planned (61%) |
| Frontend pages | 16 / 30+ planned (53%) |
| Permissions seeded | 8 / 23+ planned (35%) |
| Backend tests | 1011 passing |
| Test coverage (auth) | 90%+ functions, 83% branches |

---

## Roadmap Phases

### Phase A: UI Foundation (NEXT — before feature development)

**Goal**: Establish a reusable component library and design system so all future pages (projects, teams, billing, notifications) deploy consistently without design debt.

**Why first**: Building 14+ new pages on ad-hoc components creates inconsistency and rework. A solid UI foundation means each new feature is just assembling existing blocks.

#### A.1: Design System Formalization

| Task | Description | Priority |
|------|-------------|----------|
| Audit existing components | Catalog all UI components in nexacore-dashboard (buttons, inputs, tables, cards, modals, badges, etc.) | HIGH |
| Extract shared component library | Move reusable components to `src/components/ui/` with consistent API | HIGH |
| Figma component library | Create Figma frames for each shared component (variants, states, sizes) | HIGH |
| Document component API | Props, variants, accessibility, usage examples per component | MEDIUM |
| Table component system | Standardize data tables (sorting, filtering, pagination, loading states) — used by users, audit, permissions, and all future lists | HIGH |
| Form component system | Standardize form patterns (validation, error display, loading states) — used by all CRUD operations | HIGH |
| Empty states & error boundaries | Consistent patterns for no-data, loading, and error across all pages | MEDIUM |
| Dashboard widget system | Standardize metric cards, charts, feeds as composable widgets | MEDIUM |

#### A.2: Layout Patterns

| Task | Description | Priority |
|------|-------------|----------|
| List page template | Standard layout for list pages (header + filters + table + pagination) | HIGH |
| Detail page template | Standard layout for detail pages (header + tabs + content sections) | HIGH |
| Settings page template | Standard layout for settings (sidebar nav + form sections) | MEDIUM |
| Modal system | Standardize confirmation, form, and info modals | HIGH |
| Toast/notification system | Standardize success/error/info feedback patterns | MEDIUM |

#### A.3: Data Patterns

| Task | Description | Priority |
|------|-------------|----------|
| Pagination hook | `usePagination()` for all list endpoints | HIGH |
| Search/filter hook | `useFilters()` for server-side filtering | HIGH |
| Optimistic updates | Pattern for CRUD operations with rollback | MEDIUM |
| Real-time updates | WebSocket or polling pattern for notifications | MEDIUM |

---

### Phase B: Projects & Collaboration (Core Platform)

**Goal**: Implement the project entity and member system — the foundation that unlocks teams, billing, modules, and apps.

**Depends on**: Phase A (UI components ready)

#### B.1: Projects Module

| Entity | Endpoints | Frontend Pages |
|--------|-----------|----------------|
| **Project** | `POST /projects`, `GET /projects`, `GET /projects/{id}`, `PATCH /projects/{id}`, `DELETE /projects/{id}` | `/projects` (list), `/projects/{id}` (detail), create modal |
| **ProjectMember** | `GET /projects/{id}/members`, `POST /projects/{id}/members`, `PATCH /projects/{id}/members/{userId}`, `DELETE /projects/{id}/members/{userId}` | Members tab on project detail |

**New permissions**: `projects:create`, `projects:read`, `projects:write`, `projects:delete`
**New enum**: `ProjectStatus` (ACTIVE, ARCHIVED, SUSPENDED)
**New enum**: `ProjectMemberRole` (OWNER, ADMIN, MEMBER, VIEWER)

#### B.2: Teams Module

| Entity | Endpoints | Frontend Pages |
|--------|-----------|----------------|
| **Team** | `POST /projects/{id}/teams`, `GET /projects/{id}/teams`, `PATCH /projects/{id}/teams/{teamId}`, `DELETE /projects/{id}/teams/{teamId}` | Teams tab on project detail |
| **TeamMember** | CRUD under `/projects/{id}/teams/{teamId}/members` | Team detail page |

**New permissions**: `teams:create`, `teams:write`, `teams:delete`
**New enum**: `TeamMemberRole` (OWNER, ADMIN, MEMBER, VIEWER)

---

### Phase C: Platform Services

**Goal**: Add core platform services that enhance the user experience.

**Depends on**: Phase B (projects exist)

#### C.1: Settings Module (Backend)

| Entity | Endpoints | Notes |
|--------|-----------|-------|
| **Setting** | `GET/PUT /settings/me`, `GET/PUT /settings/me/{key}`, `GET/PUT /projects/{id}/settings`, `GET/PUT /projects/{id}/settings/{key}` | Replaces localStorage from SCRUM-279 |

**Scopes**: USER (personal prefs), PROJECT (project config), SYSTEM (global admin config)

#### C.2: Notifications Module

| Entity | Endpoints | Notes |
|--------|-----------|-------|
| **Notification** | `GET /notifications`, `POST /notifications/{id}/read`, `POST /notifications/read-all`, `POST /notifications/{id}/archive`, `DELETE /notifications/{id}` | Real-time via WebSocket or SSE |

**New enums**: `NotificationType`, `NotificationStatus`
**Frontend**: Notification bell in NavBar, `/notifications` page, toast integration

#### C.3: Module Registry

| Entity | Endpoints | Notes |
|--------|-----------|-------|
| **PlatformModule** | `GET /modules` | Admin-managed feature catalog |
| **ProjectModule** | `GET/POST/DELETE /projects/{id}/modules` | Per-project feature toggles |

**New enum**: `ModuleStatus` (ACTIVE, INACTIVE, DEPRECATED)

---

### Phase D: Monetization

**Goal**: Enable billing and subscription management.

**Depends on**: Phase B (projects exist)

#### D.1: Billing Module

| Entity | Endpoints | Notes |
|--------|-----------|-------|
| **Subscription** | `GET /projects/{id}/billing/subscription`, `POST /projects/{id}/billing/subscribe`, `POST /projects/{id}/billing/cancel` | Stripe integration |
| **Invoice** | `GET /projects/{id}/billing/invoices`, `GET /projects/{id}/billing/invoices/{id}` | Invoice history + PDF |
| **Webhook** | `POST /billing/webhook` | Stripe webhook handler |

**New enums**: `BillingPlan`, `SubscriptionStatus`, `InvoiceStatus`
**Frontend**: Billing tab on project detail, admin billing dashboard

---

### Phase E: Satellite Apps

**Goal**: Build independent applications that integrate with NexaCore via REST API.

**Depends on**: Phases B-D (core platform stable)

| App | Purpose | Integration |
|-----|---------|-------------|
| **App Registry** | Register satellite apps per project | `POST/GET /projects/{id}/apps` |
| **Analytics Service** | Usage tracking, dashboards | Reads from NexaCore API |
| **CRM Interno** | Customer relationship management | Uses NexaCore auth + projects |
| **Mobile App** | Mobile frontend | Consumes NexaCore API |

**New entity**: `App` (with `AppStatus` enum)
**Architecture**: Each satellite is an independent NestJS + Next.js app with own database, shared JWT secret or `/auth/me` validation.

#### Satellite App Naming Convention

| Component | Convention | Example |
|-----------|-----------|---------|
| **Jira project key** | `SAT{NN}` (sequential) | `SAT01`, `SAT02`, `SAT03` |
| **Jira project name** | `Satellite {NN} — {Client/App Name}` | `Satellite 01 — Cristian García` |
| **Code folder** | `satellites/sat-{client-kebab}/` (under `em-ecosystem-code/`) | `satellites/sat-cristian-garcia/` |
| **Ticket prefix** | `SAT{NN}-{N}` (auto by Jira) | `SAT01-1`, `SAT01-2` |
| **Sprint naming** | `SAT{NN} Sprint {N} - {Goal}` | `SAT01 Sprint 1 - Landing Page` |
| **framework changes** | `changes/sat-{client}/` | `changes/sat-cristian-garcia/` |

**Rules:**
- Each satellite client gets its own Jira project — never mix with `SCRUM` (core).
- Satellite tickets follow the same lifecycle: `/enrich-us` → `/plan` → `/develop` → `/verify` → `/commit` → `/update-docs`.
- Satellite apps share the same development standards (`workflow-standards.mdc`, `frontend-standards.mdc`).
- When a satellite needs NexaCore integration, it follows the Satellite App architecture in `backend-standards.mdc`.

#### Standard Sprint Convention (every satellite)

Every satellite project SHOULD follow this minimum sprint structure before
inviting the client to review or going live with the custom domain. Pattern
established in SAT01 (2026-04-30 → 2026-05-01) and intended as the baseline for
SAT02 onwards.

| Sprint | Name | Scope | Mandatory? |
|---|---|---|---|
| **S1** | `SAT{NN} S1 - Setup & Landing` | Scaffold Next.js, copy theming + UI Core, build all marketing pages, IntroLoader splash, ship to Vercel default URL. **No** security headers, **no** SEO files, **no** observability. | **Yes** — every satellite. |
| **S2** | `SAT{NN} S2 - Prod Hardening` | 6 security headers, robots.ts, sitemap.ts, per-page metadata, env-driven `metadataBase`, Vercel Speed Insights + Analytics. CSP deferred. | **Yes** — before any external review. |
| **S3** | `SAT{NN} S3 - Launch` | Custom domain, redirect www→apex, verify SSL, env var swap to custom domain. Optional CSP implementation. | When client confirms domain. |
| **S4+** | Per-client backlog | Backend integrations (contact form mailer, etc.), CMS wiring, A/B tests, additional content drops. | As needed. |

**Why split S1 and S2?** Mixing setup and hardening into a single sprint hides
the verify gate. S1's verify confirms "the satellite renders correctly"; S2's
verify confirms "the satellite is production-grade". Two distinct concerns,
two distinct gates. Saving the work into two sprints also makes the planned
effort visible to stakeholders ("S1 is the bulk of the dev work, S2 is a tight
1.5h pass") and unblocks parallel content work in S2 if needed.

**Templates** ready for clone-and-customise:
- [`templates/satellite-S1-setup-plan.md`](templates/satellite-S1-setup-plan.md)
- [`templates/satellite-S2-hardening-plan.md`](templates/satellite-S2-hardening-plan.md)

**Operational runbook** (Vercel API setup, GitHub App install, custom domain):
[`satellite-deployment-runbook.md`](satellite-deployment-runbook.md)

#### Active Satellites

| Key | Client | Status | Repo/Folder |
|-----|--------|--------|-------------|
| `SAT01` | Cristian García (Personal Trainer) | **Frontend shipped 2026-04-30** (SAT01-1, PR #227, commit `e45c113`) | `em-ecosystem-code/satellites/sat-cristian-garcia/` |

#### Satellite UI Distribution

For UI Core component distribution to satellites, the chosen architecture is the
**shadcn/ui CLI pattern** (per **SCRUM-331**): a CLI (`em-ui`) copies component
source files from `nexacore-dashboard`'s UI Core into each satellite's
`src/components/ui/` folder, tracking origin commit SHA per component and
supporting diff/sync/eject workflows. Components live IN the satellite, owned by
the satellite — no runtime dependency on `em-ecosystem-code`, which preserves
delivery independence to clients.

Alternatives considered and rejected: npm package (runtime coupling), git
submodule (brittle), Turborepo workspaces (couples satellite to monorepo, breaks
deliverability). See **SCRUM-331** for full architecture rationale.

For SAT01 (current state), components were copy-pasted manually since the CLI
ships in a future sprint. The retrofit `em-ui.config.json` manifest will
formalize this when SCRUM-331 lands.

---

## Dependency Graph

```
Phase A: UI Foundation
  ↓
Phase B: Projects & Collaboration
  ├── Phase C: Platform Services (Settings, Notifications, Modules)
  └── Phase D: Monetization (Billing, Subscriptions)
        ↓
      Phase E: Satellite Apps
```

---

## Admin Capabilities Roadmap

### Currently Available (SUPERADMIN)

| Capability | Page | API |
|-----------|------|-----|
| View/edit/deactivate users | `/admin` | `GET/PATCH /users`, `GET/PATCH /users/{id}` |
| Assign roles | `/admin` | `PATCH /users/{id}` |
| View audit logs | `/admin/audit-logs` | `GET /audit-logs` |
| Manage permissions | `/admin/permissions` | `GET /permissions`, `GET /permissions/roles/{role}` |
| View system settings | `/settings` | Local only (Phase C replaces) |
| Dashboard analytics | `/dashboard` | `GET /users`, `GET /audit-logs` |

### Planned Admin Capabilities

| Capability | Phase | Depends On |
|-----------|-------|------------|
| Manage projects (create, archive, suspend) | B | Project entity |
| View all project members across platform | B | ProjectMember entity |
| System-wide settings (registration, MFA enforcement) | C | Settings module |
| Send system notifications | C | Notifications module |
| Manage platform modules | C | Module registry |
| View revenue dashboard | D | Billing module |
| Manage subscriptions (override, cancel) | D | Billing module |
| Register/manage satellite apps | E | App registry |
| Session management UI (view/revoke user sessions) | A | API exists, needs frontend |
| Security activity UI (per-user timeline) | A | API exists, needs frontend |

---

## APIs with Backend Ready but No Frontend

These endpoints are implemented and tested but have no UI page yet:

| Endpoint | What it does | UI needed |
|----------|-------------|-----------|
| `GET /auth/sessions` | List user's active sessions | Session management page in profile/settings |
| `DELETE /auth/sessions/{id}` | Revoke a specific session | Button in session list |
| `GET /auth/trusted-devices` | List trusted MFA devices | Device management page in profile/settings |
| `DELETE /auth/trusted-devices/{id}` | Remove trusted device | Button in device list |
| `DELETE /auth/trusted-devices` | Remove all trusted devices | "Revoke all" button |
| `GET /users/me/security-activity` | User's security event timeline | Security activity page in profile |
| `DELETE /users/me` | Delete own account | Account deletion flow in settings |
| `DELETE /users/me/oauth/{provider}` | Unlink OAuth provider | Already in ConnectedAccounts component |

---

## Technical Debt & Enhancements

| Item | Origin | Priority | Notes |
|------|--------|----------|-------|
| SCRUM-279 localStorage → backend Settings module | Sprint 13 | Phase C | Non-theme preferences need persistence |
| Frontend test coverage expansion | Ongoing | Phase A | Dashboard components need tests |
| Session/device management UI | API complete | Phase A | Quick win — backend ready |
| Security activity timeline UI | API complete | Phase A | Quick win — backend ready |
| Advanced audit log filtering by module | Enhancement | Phase C | Compliance reporting |
| Rate limit tuning per environment | Enhancement | Backlog | Production may need different limits |

---

## Sprint Planning Reference

| Sprint | Phase | Focus |
|--------|-------|-------|
| **Sprint 14** (next) | A | UI Foundation — component library, layout templates, data patterns |
| **Sprint 15** | A/B | UI completion + Projects module (backend) |
| **Sprint 16** | B | Projects frontend + ProjectMembers |
| **Sprint 17** | B | Teams module (backend + frontend) |
| **Sprint 18** | C | Settings module + Notifications |
| **Sprint 19** | D | Billing + Stripe integration |
| **Sprint 20** | E | App registry + first satellite |

*Sprint estimates are indicative. Actual scope determined via JIT planning per workflow-standards.mdc.*

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-18 | Phase A (UI Foundation) before Phase B (Projects) | Building 14+ pages on ad-hoc components creates design debt. Systematize first, then build fast. |
| 2026-03-18 | Projects entity is the critical path blocker | Teams, billing, modules, apps, and most admin features depend on projects existing. |
| 2026-03-18 | Satellite apps deferred to Phase E | Core platform must stabilize before extending with independent apps. |

---

**Document location**: `docs/product-roadmap.md`
**Maintained by**: Development team
**Review cadence**: At sprint boundaries or when strategic priorities change
