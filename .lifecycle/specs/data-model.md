# EM NexaCore — Data Model Documentation

This document describes the complete data model for the EM NexaCore platform, including 21 entities (10 implemented, 11 planned), 14 enums (4 implemented, 10 planned), field definitions, relationships, validation rules, business invariants, domain events, and the Prisma schema.

## Table of Contents

- [Model Implementation Status](#model-implementation-status)
- [Model Descriptions](#model-descriptions)
  - [User](#1-user)
  - [Session](#2-session)
  - [AuditLog](#3-auditlog)
  - [EmailVerificationToken](#4-emailverificationtoken)
  - [PasswordResetToken](#5-passwordresettoken)
  - [Permission](#6-permission)
  - [RolePermission](#7-rolepermission)
  - [Project](#8-project)
  - [ProjectMember](#9-projectmember)
  - [Team](#10-team)
  - [TeamMember](#11-teammember)
  - [Notification](#12-notification)
  - [Subscription](#13-subscription)
  - [Invoice](#14-invoice)
  - [Setting](#15-setting)
  - [PlatformModule](#16-platformmodule)
  - [ProjectModule](#17-projectmodule)
  - [App](#18-app)
  - [TrustedDevice](#19-trusteddevice)
  - [WebAuthnCredential](#20-webauthn-credential)
  - [OAuthAccount](#21-oauthaccount)
- [Enums](#enums)
- [Prisma Schema](#prisma-schema)
- [TypeScript Interfaces](#typescript-interfaces)
- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Domain Events](#domain-events)
- [Security Considerations](#security-considerations)

---

## Model Implementation Status

| # | Model | Status | In Prisma Schema |
|---|-------|--------|-----------------|
| 1 | User | Implemented | Yes |
| 2 | Session | Implemented | Yes |
| 3 | AuditLog | Implemented | Yes |
| 4 | EmailVerificationToken | Implemented | Yes |
| 5 | PasswordResetToken | Implemented | Yes |
| 6 | Permission | Implemented | Yes |
| 7 | RolePermission | Implemented | Yes |
| 8 | Project | Planned | No |
| 9 | ProjectMember | Planned | No |
| 10 | Team | Planned | No |
| 11 | TeamMember | Planned | No |
| 12 | Notification | Planned | No |
| 13 | Subscription | Planned | No |
| 14 | Invoice | Planned | No |
| 15 | Setting | Planned | No |
| 16 | PlatformModule | Planned | No |
| 17 | ProjectModule | Planned | No |
| 18 | App | Planned | No |
| 19 | TrustedDevice | Implemented | Yes |
| 20 | WebAuthnCredential | Implemented | Yes |
| 21 | OAuthAccount | Implemented | Yes |
| 22 | Tenant | Implemented | Yes |
| 23 | TenantSettings | Implemented | Yes |
| 24 | TenantMembership | Implemented | Yes |
| 25 | TenantInvitation | Implemented | Yes |

---

## Model Descriptions

### 1. User [IMPLEMENTED]

Represents a user account in the system. Users can authenticate via local email/password or OAuth providers (Google, GitHub). Users participate in projects and teams, receive notifications, and manage personal settings.

**Fields:**
- `id`: Unique identifier (UUID, Primary Key, auto-generated)
- `email`: User's email address (unique, required, max 255 characters)
- `passwordHash`: `[SENSITIVE]` Bcrypt hash of the user's password (optional — null for OAuth-only accounts)
- `firstName`: User's first name (optional, max 100 characters)
- `lastName`: User's last name (optional, max 100 characters)
- `avatarUrl`: Profile avatar URL — cropped image (optional, max 500 characters)
- `avatarOriginalUrl`: Original uncropped image URL for non-destructive re-editing (optional)
- `avatarCropData`: JSON object with crop coordinates — `areaPercent` (percentages for position restoration) + `areaPixels` (natural pixels for canvas extraction). Nullable Json field.
- `role`: User's platform role (Role enum, default: USER). **Kept transitional** for Role-enum machinery (permissions catalog + MFA enforcement policy + tenant-scoped alerting + the `dto.role === SUPERADMIN` rejection pathway). Phase 1 (JWT v2) retires after capability semantics fully migrate to `isPlatformAdmin`.
- `isPlatformAdmin`: Cross-tenant capability flag (boolean, default: false). Carries the "this user can bypass tenant boundaries" semantics. Added by SCRUM-489 (AUTH v2 + Tenancy v1 Phase 0.3) to split the conflated `Role.SUPERADMIN` concept. **Gates** `RolesGuard` + `PermissionsGuard` bypass and 4 `UsersService` protection paths (modify/delete/role-elevation/self-delete). Backfill at migration time: every pre-existing `Role.SUPERADMIN` user gets `isPlatformAdmin = true` (same-transaction with the `ADD COLUMN`). See program doc §2.2 + §8 risk MT-4.
- `emailVerified`: Whether the user's email has been verified (boolean, default: false)
- `pendingEmail`: New email address pending verification during email change flow (optional — null when no change pending)
- `isActive`: Whether the account is active (boolean, default: true — false for soft-deleted accounts)
- `failedAttempts`: Number of consecutive failed login attempts (integer, default: 0)
- `lockedUntil`: Timestamp when account lockout expires (optional — null if not locked)
- `lockoutCount`: Number of times the account has been locked out, used for escalating lockout duration (integer, default: 0)
- `mfaEnabled`: Whether multi-factor authentication is enabled (boolean, default: false)
- `mfaSecret`: `[SENSITIVE]` TOTP secret key for MFA, encrypted (optional — null if MFA not set up)
- `mfaRecoveryCodes`: `[SENSITIVE]` Array of hashed recovery codes for MFA (String[], default: [])
- `createdAt`: Account creation timestamp (auto-generated)
- `updatedAt`: Last update timestamp (auto-updated)
- `deletedAt`: Tombstone for GDPR Article 17 (Right to Erasure). When a user requests account deletion, the row is marked with this timestamp instead of being hard-deleted, enabling a retroactive audit trail and the compliance retention window. `null` for active accounts. (DateTime, optional)

**Validation Rules:**
- Email is required, must be unique, and follow valid email format (RFC 5322)
- Password is required for local registration:
  - Minimum 8 characters
  - At least one lowercase letter
  - At least one uppercase letter
  - At least one number
  - At least one special character (`@$!%*?&`)
- firstName and lastName are optional, max 100 characters each, letters and spaces only
- avatarUrl must be a valid URL if provided
- Role defaults to USER; only SUPERADMIN can assign ADMIN or SUPERADMIN roles
- Account is locked after 5 consecutive failed login attempts with escalating lockout duration (lockoutCount tracks escalation level)

**Business Invariants:**
- A user with `isActive = false` cannot log in or perform any authenticated actions
- OAuth users have `passwordHash = null` and cannot use email/password login unless they set a password separately
- SUPERADMIN role can only be assigned by another SUPERADMIN
- Local accounts can change their email via a verified email change flow (password confirmation required, verification token sent to new address, all sessions revoked on swap). OAuth-only accounts cannot change email.
- Users can self-delete their account (GDPR Article 17 Right to Erasure). The user record is preserved as a tombstone (`deletedAt` field set to the deletion timestamp) with anonymized PII (`deleted-{userId}@anonymized.local`). All sessions, verification tokens, and password reset tokens are hard-deleted. Audit log metadata/IP/UA is scrubbed. SUPERADMIN accounts cannot be self-deleted.

**Responsibilities:**
- Authenticate via local credentials or OAuth providers
- Own and participate in projects
- Receive and manage notifications
- Manage personal settings and profile

**Relations:**
- `sessions`: One-to-many → Session
- `auditLogs`: One-to-many → AuditLog (as acting user)
- `auditLogsTarget`: One-to-many → AuditLog (as target user)
- `emailVerificationTokens`: One-to-many → EmailVerificationToken
- `passwordResetTokens`: One-to-many → PasswordResetToken
- `ownedProjects`: One-to-many → Project (as owner) `[PLANNED]`
- `projectMemberships`: One-to-many → ProjectMember `[PLANNED]`
- `teamMemberships`: One-to-many → TeamMember `[PLANNED]`
- `notifications`: One-to-many → Notification `[PLANNED]`
- `settings`: One-to-many → Setting (scope=USER) `[PLANNED]`
- `trustedDevices`: One-to-many → TrustedDevice
- `webAuthnCredentials`: One-to-many → WebAuthnCredential
- `oauthAccounts`: One-to-many → OAuthAccount

#### Cascade Behavior (audit-2026-05-14 D-09)

Deleting a User row cascades to delete the following dependents (Prisma `onDelete: Cascade`). This satisfies the GDPR/right-to-erasure data-purge path — every personal record tied to the user is removed atomically with the user itself.

| Dependent | Schema line | Rationale |
|-----------|-------------|-----------|
| Session | `schema.prisma:108` | All user sessions are revoked / removed |
| EmailVerificationToken | `schema.prisma:160` | Outstanding verification tokens are invalidated |
| PasswordResetToken | `schema.prisma:175` | Outstanding password-reset tokens are invalidated |
| TrustedDevice | `schema.prisma:188` | Trusted-device fingerprints are removed |
| WebAuthnCredential | `schema.prisma:217` | Registered passkeys are removed |
| OAuthAccount | `schema.prisma:231` | Linked OAuth identities are removed |

AuditLog entries reference the user via `SetNull` (not Cascade) so historical security events are preserved with `userId=null` after deletion — required for SOC 2 audit trail integrity.

---

### 2. Session [IMPLEMENTED]

Represents an authenticated session with a refresh token. Replaces the original RefreshToken model with enhanced security features including token family tracking for theft detection and session metadata.

**Fields:**
- `id`: Unique identifier (UUID, Primary Key, auto-generated)
- `userId`: Reference to the session owner (FK → User, required, cascade delete)
- `tokenFamily`: UUID grouping tokens in a rotation chain (required — used for token theft detection)
- `refreshTokenHash`: `[SENSITIVE]` Bcrypt hash of the current refresh token (required)
- `deviceInfo`: Browser or device identifier from User-Agent header (optional)
- `ipAddress`: Client IP address at session creation (required, max 45 characters — supports IPv6)
- `userAgent`: Full User-Agent string (optional)
- `locationCity`: City name from IP geolocation (optional, set at session creation)
- `locationCountry`: Country code (ISO 3166-1 alpha-2) from IP geolocation (optional, set at session creation)
- `latitude`: Geographic latitude from IP geolocation (optional, Float)
- `longitude`: Geographic longitude from IP geolocation (optional, Float)
- `isRevoked`: Whether the session has been revoked (boolean, default: false)
- `createdAt`: Session creation timestamp (auto-generated)
- `updatedAt`: Record update timestamp (auto-managed by Prisma @updatedAt)
- `lastUsedAt`: Last token refresh timestamp (auto-updated on rotation, default: now())
- `expiresAt`: Session expiration timestamp (required)

**Validation Rules:**
- refreshTokenHash is required and must be a valid bcrypt hash
- expiresAt must be a future timestamp at creation time
- userId must reference an existing, active user
- ipAddress is required (captured at session creation)

**Business Invariants:**
- Token family tracking: all rotated tokens share the same `tokenFamily` UUID
- Token theft detection: if a revoked token is reused, ALL sessions in the same family are revoked immediately
- Token rotation: on refresh, the old hash is replaced with the new one and `lastUsedAt` is updated
- All sessions for a user are revoked on logout-all or password change
- Revoked sessions cannot be used for token refresh

**Responsibilities:**
- Enable stateless JWT authentication with secure token refresh
- Track active sessions across multiple devices with metadata
- Detect and respond to token theft via family-based revocation
- Support selective and bulk session revocation

**Database Indices:**
- `@@index([userId])` — Session lookup by user
- `@@index([tokenFamily])` — Token family lookup for theft detection
- `@@index([userId, isRevoked])` — Active session queries
- `@@index([userId, isRevoked, lastUsedAt])` — Session list sorted by recency

**Relations:**
- `user`: Many-to-one → User

---

### 2b. SessionV2 [IMPLEMENTED — Phase 1.2 internal scaffolding]

**SCRUM-493 / AUTH v2 + Tenancy v1 Phase 1.2.** Strangler-pattern v2 opaque-refresh session. Lives alongside v1 `Session`; zero production consumers until Phase 1.3 wires the first `JwtV2Strategy` + endpoint. v1 sunset at Phase 6 = single `DROP TABLE`.

**Differences from v1 `Session`:**
- Opaque refresh tokens (256-bit CSPRNG → base64url → SHA-256 hex stored as `@unique`) instead of JWT-format refresh tokens with bcrypt hash. Plaintext returned ONCE on mint; never logged.
- `tenantId` field added (NOT NULL) — every v2 session is tenant-bound. Mitigates §8 MT-2 (CRITICAL: server-side session has no tenantId).
- No `tokenFamily` column — v2 uses strict one-time-use rotation enforced atomically in `prisma.$transaction` (revoke OLD + create NEW in same tx). v1's family-based theft detection is unnecessary because opaque tokens carry no exploit value once revoked server-side.
- No geolocation columns (locationCity/Country/lat/lon) — deferred. Phase 2+ may add them additively if needed for forensics.

**Fields:**
- `id`: Unique identifier (UUID, Primary Key, auto-generated)
- `userId`: Reference to the session owner (FK → User, required, cascade delete)
- `tenantId`: Active tenant for this session (required, plain `String` — no FK to Tenant; symmetric with v1's Session/tenantId design where tenant lifecycle is independent of session lifecycle)
- `refreshTokenHash`: `[SENSITIVE]` SHA-256 hex of the opaque refresh token (required, `@unique` — deterministic hashing required by the unique constraint)
- `isRevoked`: Whether the session has been revoked (boolean, default: false)
- `ipAddress`: Client IP address at session creation (optional, max 45 characters)
- `userAgent`: Full User-Agent string (optional)
- `createdAt`: Session creation timestamp (auto-generated)
- `updatedAt`: Record update timestamp (auto-managed by Prisma `@updatedAt`)
- `lastUsedAt`: Last refresh timestamp (auto-updated on rotation, default: now())
- `expiresAt`: Session expiration timestamp (required; same TTL as v1 — `auth.jwtRefreshExpiration`, default 12h)

**Validation Rules:**
- `refreshTokenHash` is a 64-character lowercase hex string (SHA-256 output)
- `expiresAt` must be a future timestamp at creation time
- `userId` must reference an existing, active user
- `tenantId` must be a non-empty string (caller's responsibility to pass a validated tenant id; service does NOT re-validate membership — caller is the v2 login orchestrator from Phase 2)

**Business Invariants:**
- One-time-use rotation: on `validateAndRotate`, the OLD row is marked `isRevoked=true` in the SAME `prisma.$transaction` that creates the NEW row.
- No failure-mode enumeration: `validateAndRotate` failures (not-found / revoked / expired / membership-stale) all throw the same `UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED)`. Reason class lives only in audit metadata.
- Tenant-scoped bulk revoke: `revokeAllForTenant(userId, tenantId)` revokes only sessions matching that pair — mitigates §8 MT-10 (v1's `revokeAllUserSessions` revokes cross-tenant).
- Cross-tenant lookup: token-hash lookup must run in `TenantContext.runWithBypass('session-v2-refresh-lookup')` because tenantId is unknown until the row is found; rotation transaction then runs in `TenantContext.run(session.tenantId, ...)`.
- No deny-list integration: v2 sessions are revoked by row flag, not Redis. Opaque tokens have no `jti` for v1's `TokenDenyListService` to key on.

**Responsibilities:**
- Provide the REFRESH half of the v2 mint surface (companion to `TokenServiceV2` from Phase 1.1 which provides the ACCESS half).
- Tenant-bind every session at the database row level.
- Emit `SESSION_V2_*` audit rows for every state transition (created / rotated / revoked / bulk-revoked / refresh-rejected).

**Database Indices:**
- `@@unique([refreshTokenHash])` — lookup by token hash (the primary access pattern)
- `@@index([userId])` — sessions-for-user queries
- `@@index([userId, tenantId])` — sessions-for-user-in-tenant queries (composite for typical app queries)
- `@@index([userId, tenantId, isRevoked])` — active sessions filter for revocation paths

**Relations:**
- `user`: Many-to-one → User (relation name `SessionV2User`)

**Table name:** `sessions_v2`

---

### 3. AuditLog [IMPLEMENTED]

Records security-relevant events in the system for compliance and forensics. Tracks who did what, to whom, and from where.

**Fields:**
- `id`: Unique identifier (UUID, Primary Key, auto-generated)
- `action`: The audit action performed (AuditAction enum, required)
- `userId`: Reference to the acting user (FK → User, optional — null for system events, onDelete: SetNull)
- `targetUserId`: Reference to the user affected by the action (FK → User, optional, onDelete: SetNull)
- `organizationId`: Reference to the Organization the action targeted (FK → Organization, optional — added by SCRUM-495 / AUTH v2 Phase 2.1 to allow org-scoped audit queries; nullable for backward compatibility with all pre-Phase-2.1 audit rows)
- `ipAddress`: Client IP address (optional)
- `userAgent`: Full User-Agent string (optional)
- `metadata`: Additional context as JSON (optional — e.g., role changes, provider info)
- `createdAt`: Event timestamp (auto-generated)

**Validation Rules:**
- action must be a valid AuditAction enum value
- At least one of userId or targetUserId should be present (except system events)

**Business Invariants:**
- Audit logs are append-only — they cannot be updated or deleted
- Audit logs are retained indefinitely for compliance
- Access restricted to ADMIN role with `audit-logs:read` permission

**Responsibilities:**
- Provide a tamper-evident record of security events
- Support security incident investigation and forensics
- Enable compliance reporting

**Database Indices:**
- `@@index([action])` — Filter by action type
- `@@index([userId])` — Audit trail by user
- `@@index([targetUserId])` — Audit trail by target user
- `@@index([createdAt])` — Chronological queries
- `@@index([action, userId, createdAt])` — Composite: user action timeline
- `@@index([action, ipAddress, createdAt])` — Composite: IP-based action timeline

**Relations:**
- `user`: Many-to-one → User (acting user, optional)
- `targetUser`: Many-to-one → User (affected user, optional)

---

### 4. EmailVerificationToken [IMPLEMENTED]

Represents a one-time token for email address verification. Tokens are hashed before storage for security.

**Fields:**
- `id`: Unique identifier (UUID, Primary Key, auto-generated)
- `tokenHash`: `[SENSITIVE]` SHA-256 hash of the verification token (unique, required)
- `userId`: Reference to the user being verified (FK → User, required, cascade delete)
- `type`: Token purpose discriminator (EmailVerificationTokenType enum, default: REGISTRATION)
- `expiresAt`: Token expiration timestamp (required)
- `usedAt`: Timestamp when the token was used (optional — null if unused)
- `createdAt`: Token creation timestamp (auto-generated)
- `updatedAt`: Last modification timestamp (auto-managed by Prisma)

**Validation Rules:**
- tokenHash must be unique
- expiresAt must be a future timestamp at creation time

**Business Invariants:**
- Token can only be used once (usedAt is set on first use)
- Expired tokens cannot be used
- Previous unused tokens are not automatically invalidated (checked at verification time)
- Token is stored as a hash — the raw token is sent to the user's email and never stored
- REGISTRATION tokens cannot be used at the email change verification endpoint and vice versa (cross-flow guard)

**Responsibilities:**
- Verify user email ownership (REGISTRATION type)
- Verify new email address during email change flow (EMAIL_CHANGE type)
- Prevent unauthorized email verification

**Database Indices:**
- `@@index([userId])` — Token lookup by user

**Relations:**
- `user`: Many-to-one → User

---

### 5. PasswordResetToken [IMPLEMENTED]

Represents a one-time token for password reset. Tokens are hashed before storage for security.

**Fields:**
- `id`: Unique identifier (UUID, Primary Key, auto-generated)
- `tokenHash`: `[SENSITIVE]` SHA-256 hash of the reset token (unique, required)
- `userId`: Reference to the user requesting the reset (FK → User, required, cascade delete)
- `expiresAt`: Token expiration timestamp (required)
- `usedAt`: Timestamp when the token was used (optional — null if unused)
- `createdAt`: Token creation timestamp (auto-generated)
- `updatedAt`: Last modification timestamp (auto-managed by Prisma)

**Validation Rules:**
- tokenHash must be unique
- expiresAt must be a future timestamp at creation time

**Business Invariants:**
- Token can only be used once (usedAt is set on first use)
- Expired tokens cannot be used
- On successful password reset, all user sessions are revoked
- Token is stored as a hash — the raw token is sent to the user's email and never stored

**Responsibilities:**
- Enable secure password reset flow
- Prevent unauthorized password changes

**Database Indices:**
- `@@index([userId])` — Token lookup by user

**Relations:**
- `user`: Many-to-one → User

---

### 6. Permission [IMPLEMENTED]

Represents a granular permission in the RBAC system. Permissions define specific actions on specific resources that can be assigned to roles.

**Fields:**
- `id`: Unique identifier (UUID, Primary Key, auto-generated)
- `key`: Permission identifier (unique, required, max 100 characters, e.g., `projects:create`)
- `description`: Human-readable description (required, max 255 characters)
- `resource`: The resource this permission applies to (required, max 50 characters, e.g., `projects`, `teams`, `billing`)
- `action`: The action allowed on the resource (required, max 50 characters, e.g., `create`, `read`, `update`, `delete`, `manage`)
- `createdAt`: Permission creation timestamp (auto-generated)
- `updatedAt`: Record update timestamp (auto-managed by Prisma @updatedAt)

**Validation Rules:**
- key must follow the pattern `resource:action` (e.g., `projects:create`, `teams:manage`)
- key must be unique across all permissions
- resource and action are required, lowercase, alphanumeric with hyphens

**Business Invariants:**
- Permissions are seeded at application startup and managed by SUPERADMIN only
- Deleting a permission cascades to all RolePermission entries
- The `manage` action implies all other actions (create, read, update, delete) on a resource

**Responsibilities:**
- Define the granular access control vocabulary
- Enable fine-grained RBAC beyond simple role checks

**Database Indices:**
- `@@index([resource])` — Permission lookup by resource type

**Relations:**
- `rolePermissions`: One-to-many → RolePermission

#### Cascade Behavior (audit-2026-05-14 D-09)

Deleting a Permission row cascades to all RolePermission rows referencing it (`schema.prisma:258`). Rationale: removing a permission must atomically un-grant it from every role; orphan `RolePermission` rows pointing at a missing permission would break the `PermissionsGuard` runtime check.

---

### 7. RolePermission [IMPLEMENTED]

Junction table that maps platform roles to permissions. Defines which permissions each role has.

**Fields:**
- `id`: Unique identifier (UUID, Primary Key, auto-generated)
- `role`: The platform role (Role enum, required)
- `permissionId`: Reference to the permission (FK → Permission, required, cascade delete)
- `createdAt`: Assignment timestamp (auto-generated)
- `updatedAt`: Last modification timestamp (auto-updated by Prisma `@updatedAt`)

**Validation Rules:**
- The combination of role + permissionId must be unique

**Business Invariants:**
- SUPERADMIN implicitly has all permissions regardless of RolePermission entries
- Role permissions are managed exclusively by SUPERADMIN
- Removing a permission from a role takes effect immediately for all users with that role

**Responsibilities:**
- Map roles to specific permissions for granular access control
- Enable dynamic permission management without code changes

**Database Indices:**
- `@@index([role])` — Permission lookup by role

**Relations:**
- `permission`: Many-to-one → Permission

---

### 8. Project [PLANNED]

Represents a project in the EM NexaCore platform. Projects are the central organizational unit — they contain teams, apps, modules, settings, and a billing subscription.

**Fields:**
- `id`: Unique identifier (UUID, Primary Key, auto-generated)
- `name`: Project display name (required, min 3, max 100 characters)
- `slug`: URL-friendly unique identifier (unique, required, max 100 characters)
- `description`: Project description (optional, max 500 characters)
- `status`: Project lifecycle status (ProjectStatus enum, default: ACTIVE)
- `ownerId`: Reference to the project creator (FK → User, required)
- `createdAt`: Project creation timestamp (auto-generated)
- `updatedAt`: Last update timestamp (auto-updated)

**Validation Rules:**
- name is required, min 3 characters, max 100 characters
- slug must be lowercase, alphanumeric with hyphens, auto-generated from name if not provided
- slug must be unique across all projects
- description is optional, max 500 characters

**Business Invariants:**
- On creation, the owner is automatically added as a ProjectMember with role OWNER
- On creation, a default FREE Subscription is automatically created
- On creation, all PlatformModules with `isDefault = true` are automatically enabled
- A project must always have exactly one member with role OWNER
- Only the OWNER can archive or delete a project
- Archived projects are read-only — no new members, teams, or apps can be added
- Suspended projects are visible but non-operational (set by SUPERADMIN)

**Domain Events:**
- `project.created` — Emitted when a new project is created
- `project.updated` — Emitted when project details are modified
- `project.archived` — Emitted when a project is archived
- `project.suspended` — Emitted when a SUPERADMIN suspends a project

**Responsibilities:**
- Serve as the primary organizational container for all collaborative work
- Group teams, apps, modules, and settings under a single context
- Control billing scope via its Subscription

**Relations:**
- `owner`: Many-to-one → User
- `members`: One-to-many → ProjectMember
- `teams`: One-to-many → Team
- `apps`: One-to-many → App
- `subscription`: One-to-one → Subscription
- `settings`: One-to-many → Setting (scope=PROJECT)
- `enabledModules`: One-to-many → ProjectModule
- `notifications`: One-to-many → Notification (contextual)

---

### 9. ProjectMember [PLANNED]

Junction table that tracks user membership in projects with role-based access within the project.

**Fields:**
- `id`: Unique identifier (UUID, Primary Key, auto-generated)
- `projectId`: Reference to the project (FK → Project, required, cascade delete)
- `userId`: Reference to the user (FK → User, required, cascade delete)
- `role`: Member's role within the project (MemberRole enum, default: MEMBER)
- `joinedAt`: Membership creation timestamp (auto-generated)

**Validation Rules:**
- The combination of projectId + userId must be unique (a user can only be a member once)
- role must be a valid MemberRole value

**Business Invariants:**
- Every project must have exactly one OWNER at all times
- OWNER role cannot be removed — it must be transferred to another member first
- A user must be a ProjectMember to join any team within that project
- Removing a ProjectMember cascades to remove them from all teams in that project

**Responsibilities:**
- Control project-level access based on member role
- Enable invitation and membership management workflows

**Relations:**
- `project`: Many-to-one → Project
- `user`: Many-to-one → User

---

### 10. Team [PLANNED]

Represents a team within a project. Teams group project members for collaboration and task organization.

**Fields:**
- `id`: Unique identifier (UUID, Primary Key, auto-generated)
- `name`: Team display name (required, min 2, max 100 characters)
- `description`: Team description (optional, max 255 characters)
- `projectId`: Reference to the parent project (FK → Project, required, cascade delete)
- `createdAt`: Team creation timestamp (auto-generated)
- `updatedAt`: Last update timestamp (auto-updated)

**Validation Rules:**
- name is required, min 2 characters, max 100 characters
- name must be unique within a project (enforced by composite unique constraint)
- description is optional, max 255 characters

**Business Invariants:**
- Team name must be unique within its project
- Only project OWNER or ADMIN members can create, update, or delete teams
- Deleting a team removes all TeamMember entries (cascade)
- Teams cannot exist without a parent project

**Domain Events:**
- `team.created` — Emitted when a new team is created
- `team.deleted` — Emitted when a team is deleted

**Responsibilities:**
- Organize project members into working groups
- Provide a scope for team-level collaboration

**Relations:**
- `project`: Many-to-one → Project
- `members`: One-to-many → TeamMember

---

### 11. TeamMember [PLANNED]

Junction table that tracks user membership in teams with role-based access.

**Fields:**
- `id`: Unique identifier (UUID, Primary Key, auto-generated)
- `teamId`: Reference to the team (FK → Team, required, cascade delete)
- `userId`: Reference to the user (FK → User, required, cascade delete)
- `role`: Member's role within the team (MemberRole enum, default: MEMBER)
- `joinedAt`: Membership creation timestamp (auto-generated)

**Validation Rules:**
- The combination of teamId + userId must be unique
- role must be a valid MemberRole value

**Business Invariants:**
- A user must be a ProjectMember of the team's parent project to join the team
- Removing a user from the project automatically removes them from all teams in that project

**Responsibilities:**
- Control team-level access and permissions
- Track team composition

**Relations:**
- `team`: Many-to-one → Team
- `user`: Many-to-one → User

---

### 12. Notification [PLANNED]

Represents a notification sent to a user. Notifications can be system-wide or scoped to a specific project.

**Fields:**
- `id`: Unique identifier (UUID, Primary Key, auto-generated)
- `userId`: Reference to the recipient (FK → User, required, cascade delete)
- `type`: Notification category (NotificationType enum, required)
- `status`: Read/unread state (NotificationStatus enum, default: UNREAD)
- `title`: Notification title (required, max 200 characters)
- `message`: Notification body (required, max 1000 characters)
- `projectId`: Reference to the related project (FK → Project, optional, set null on delete)
- `actionUrl`: Link to the relevant page (optional, max 500 characters)
- `readAt`: Timestamp when the notification was read (optional — null if unread)
- `createdAt`: Notification creation timestamp (auto-generated)

**Validation Rules:**
- title is required, max 200 characters
- message is required, max 1000 characters
- type must be a valid NotificationType
- actionUrl must be a valid relative URL if provided

**Business Invariants:**
- Notifications are immutable after creation — only status and readAt can be updated
- When status changes to READ, readAt is automatically set to the current timestamp
- Archived notifications are excluded from default list queries
- Notifications are soft-associated with projects — deleting a project sets projectId to null

**Domain Events:**
- `notification.created` — Emitted when a new notification is created (can trigger push/email)

**Responsibilities:**
- Inform users about relevant system and project events
- Provide a centralized notification feed

**Relations:**
- `user`: Many-to-one → User (recipient)
- `project`: Many-to-one → Project (optional context)

---

### 13. Subscription [PLANNED]

Represents a billing subscription for a project. Each project has exactly one subscription. Designed for Stripe integration.

**Fields:**
- `id`: Unique identifier (UUID, Primary Key, auto-generated)
- `projectId`: Reference to the project (FK → Project, unique, required, cascade delete)
- `plan`: Current subscription plan (BillingPlan enum, default: FREE)
- `status`: Subscription lifecycle status (BillingStatus enum, default: ACTIVE)
- `stripeCustomerId`: Stripe customer reference (optional, max 255 characters)
- `stripeSubscriptionId`: Stripe subscription reference (optional, max 255 characters)
- `currentPeriodStart`: Start of the current billing period (optional)
- `currentPeriodEnd`: End of the current billing period (optional)
- `canceledAt`: Timestamp when the subscription was canceled (optional)
- `createdAt`: Subscription creation timestamp (auto-generated)
- `updatedAt`: Last update timestamp (auto-updated)

**Validation Rules:**
- projectId must reference an existing project and must be unique (one subscription per project)
- plan must be a valid BillingPlan
- status must be a valid BillingStatus
- Stripe fields are optional and populated via webhook events

**Business Invariants:**
- Every project gets a FREE subscription on creation (automatic)
- FREE plan has no billing period or Stripe references
- Upgrading from FREE creates Stripe customer and subscription
- Canceling sets `canceledAt` and status to CANCELED but access continues until `currentPeriodEnd`
- PAST_DUE status is set by Stripe webhook when payment fails
- Only the project OWNER can manage the subscription

**Domain Events:**
- `subscription.created` — Emitted on project creation (FREE plan)
- `subscription.upgraded` — Emitted when plan changes from lower to higher tier
- `subscription.downgraded` — Emitted when plan changes from higher to lower tier
- `subscription.canceled` — Emitted when subscription is canceled

**Responsibilities:**
- Track the billing plan and payment status for each project
- Integrate with Stripe for payment processing
- Control feature access based on plan tier

**Relations:**
- `project`: One-to-one → Project
- `invoices`: One-to-many → Invoice

---

### 14. Invoice [PLANNED]

Represents a billing invoice for a subscription period. Generated automatically by Stripe or manually for record-keeping.

**Fields:**
- `id`: Unique identifier (UUID, Primary Key, auto-generated)
- `subscriptionId`: Reference to the subscription (FK → Subscription, required, cascade delete)
- `status`: Invoice payment status (InvoiceStatus enum, default: DRAFT)
- `amount`: Invoice amount (Decimal, required, precision 10, scale 2)
- `currency`: Currency code (string, required, default: "USD", max 3 characters)
- `stripeInvoiceId`: Stripe invoice reference (optional, max 255 characters)
- `periodStart`: Start of the invoiced billing period (required)
- `periodEnd`: End of the invoiced billing period (required)
- `paidAt`: Timestamp when payment was received (optional — null if unpaid)
- `createdAt`: Invoice creation timestamp (auto-generated)

**Validation Rules:**
- amount must be a positive decimal value
- currency must be a valid ISO 4217 currency code (3 uppercase letters)
- periodStart must be before periodEnd
- status must be a valid InvoiceStatus

**Business Invariants:**
- Invoices are immutable after status reaches PAID or VOID
- FAILED invoices can be retried (status returns to PENDING)
- Invoice amounts are stored in the smallest currency unit (cents for USD)
- Only project OWNER and ADMIN members can view invoices

**Domain Events:**
- `invoice.paid` — Emitted when payment is successfully processed
- `invoice.failed` — Emitted when payment fails

**Responsibilities:**
- Track payment history for each subscription
- Provide billing audit trail

**Relations:**
- `subscription`: Many-to-one → Subscription

---

### 15. Setting [PLANNED]

Represents a key-value configuration setting. Settings can be scoped to a user, a project, or the system globally.

**Fields:**
- `id`: Unique identifier (UUID, Primary Key, auto-generated)
- `key`: Setting identifier (required, max 100 characters)
- `value`: Setting value stored as JSON string (required, max 5000 characters)
- `scope`: Setting scope level (SettingScope enum, required)
- `userId`: Reference to the user (FK → User, optional, cascade delete — required when scope=USER)
- `projectId`: Reference to the project (FK → Project, optional, cascade delete — required when scope=PROJECT)
- `createdAt`: Setting creation timestamp (auto-generated)
- `updatedAt`: Last update timestamp (auto-updated)

**Validation Rules:**
- key is required, max 100 characters, lowercase alphanumeric with dots and underscores (e.g., `theme.mode`, `notifications.email_enabled`)
- value is required, must be valid JSON when parsed
- When scope=USER, userId must be provided and projectId must be null
- When scope=PROJECT, projectId must be provided and userId must be null
- When scope=SYSTEM, both userId and projectId must be null

**Business Invariants:**
- The combination of (key, scope, userId, projectId) must be unique
- USER settings can only be read/written by the owning user
- PROJECT settings can only be read/written by project OWNER or ADMIN members
- SYSTEM settings can only be read/written by SUPERADMIN
- Settings follow a cascade resolution: SYSTEM → PROJECT → USER (most specific wins)

**Responsibilities:**
- Store user preferences (theme, notification preferences, language)
- Store project configuration (default settings, feature flags)
- Store system-wide configuration

**Relations:**
- `user`: Many-to-one → User (optional)
- `project`: Many-to-one → Project (optional)

---

### 16. PlatformModule [PLANNED]

Represents a feature module available on the EM NexaCore platform. Modules can be enabled or disabled per project to customize the project's capabilities.

**Fields:**
- `id`: Unique identifier (UUID, Primary Key, auto-generated)
- `name`: Module display name (unique, required, max 100 characters)
- `slug`: URL-friendly identifier (unique, required, max 100 characters)
- `description`: Module description (optional, max 500 characters)
- `status`: Module availability status (ModuleStatus enum, default: ACTIVE)
- `isDefault`: Whether the module is enabled by default for new projects (boolean, default: false)
- `createdAt`: Module creation timestamp (auto-generated)
- `updatedAt`: Last update timestamp (auto-updated)

**Validation Rules:**
- name must be unique, max 100 characters
- slug must be unique, lowercase alphanumeric with hyphens
- status must be a valid ModuleStatus

**Business Invariants:**
- DEPRECATED modules cannot be enabled for new projects but remain active for existing ones
- INACTIVE modules are hidden from project module lists
- Only SUPERADMIN can create, update, or change module status
- Default modules are automatically added to new projects on creation

**Responsibilities:**
- Define the feature catalog of the platform
- Control feature availability per plan tier (future: link to BillingPlan)

**Relations:**
- `projectModules`: One-to-many → ProjectModule

---

### 17. ProjectModule [PLANNED]

Junction table that tracks which platform modules are enabled for each project.

**Fields:**
- `id`: Unique identifier (UUID, Primary Key, auto-generated)
- `projectId`: Reference to the project (FK → Project, required, cascade delete)
- `moduleId`: Reference to the platform module (FK → PlatformModule, required, cascade delete)
- `enabledAt`: Timestamp when the module was enabled (auto-generated)
- `enabledById`: Reference to the user who enabled the module (FK → User, required)

**Validation Rules:**
- The combination of projectId + moduleId must be unique (a module can only be enabled once per project)

**Business Invariants:**
- Only project OWNER or ADMIN members can enable/disable modules
- Disabling a module removes the ProjectModule entry (hard delete)
- Default modules are enabled automatically on project creation

**Responsibilities:**
- Control which features are available within each project
- Track who enabled each module for audit purposes

**Relations:**
- `project`: Many-to-one → Project
- `module`: Many-to-one → PlatformModule
- `enabledBy`: Many-to-one → User

---

### 18. App [PLANNED]

Represents an application built within a project. Apps are the end products created by project teams.

**Fields:**
- `id`: Unique identifier (UUID, Primary Key, auto-generated)
- `name`: Application display name (required, min 2, max 100 characters)
- `slug`: URL-friendly identifier within the project (required, max 100 characters)
- `description`: Application description (optional, max 500 characters)
- `status`: Application lifecycle status (AppStatus enum, default: DRAFT)
- `projectId`: Reference to the parent project (FK → Project, required, cascade delete)
- `createdById`: Reference to the creator (FK → User, required)
- `config`: Application configuration stored as JSON string (optional, max 10000 characters)
- `createdAt`: Application creation timestamp (auto-generated)
- `updatedAt`: Last update timestamp (auto-updated)

**Validation Rules:**
- name is required, min 2 characters, max 100 characters
- slug must be unique within the project (enforced by composite unique constraint)
- slug must be lowercase, alphanumeric with hyphens
- config must be valid JSON if provided
- status must be a valid AppStatus

**Business Invariants:**
- App slug must be unique within its project
- Only project OWNER or ADMIN members can create, update, or archive apps
- PUBLISHED apps are visible to all project members
- DRAFT apps are only visible to the creator and OWNER/ADMIN members
- ARCHIVED apps are read-only

**Domain Events:**
- `app.created` — Emitted when a new app is created
- `app.published` — Emitted when an app status changes to PUBLISHED
- `app.archived` — Emitted when an app is archived

**Responsibilities:**
- Represent the deliverables produced within a project
- Store application configuration and metadata

**Relations:**
- `project`: Many-to-one → Project
- `createdBy`: Many-to-one → User

---

### 19. TrustedDevice [IMPLEMENTED]

Represents a device that a user has marked as trusted after MFA verification. Trusted devices can skip MFA on subsequent logins for a configurable period.

**Fields:**
- `id`: Unique identifier (UUID, Primary Key, auto-generated)
- `userId`: Reference to the device owner (FK → User, required, cascade delete)
- `fingerprintHash`: `[SENSITIVE]` HMAC-SHA256 hash of the device fingerprint, salted with userId (required)
- `deviceName`: Human-readable device description derived from User-Agent (required, e.g., "Chrome on Windows")
- `ipAddress`: IP address when the device was last trusted/verified (required)
- `lastVerifiedAt`: Timestamp of last successful trust verification (auto-generated, updated on each check)
- `expiresAt`: Trust expiration timestamp (required, default: now + TRUSTED_DEVICE_TTL_DAYS)
- `isRevoked`: Whether the trust has been manually or cascade revoked (default: false)
- `createdAt`: Record creation timestamp (auto-generated)
- `updatedAt`: Last update timestamp (auto-updated)

**Validation Rules:**
- fingerprintHash must be unique per user (enforced by composite unique constraint on [userId, fingerprintHash])
- expiresAt must be in the future at creation time

**Business Invariants:**
- Maximum 10 active (non-revoked) trusted devices per user; oldest revoked on overflow
- Trust expires after TRUSTED_DEVICE_TTL_DAYS (default 30 days)
- All trusted devices are revoked on password change
- All trusted devices are revoked when MFA is disabled
- Fingerprints are stored as HMAC-SHA256 hashes, never in plaintext

**Domain Events:**
- `DEVICE_TRUSTED` — Audit log when a device is marked as trusted
- `DEVICE_UNTRUSTED` — Audit log when a device trust is revoked (single or all)

**Responsibilities:**
- Allow MFA-verified users to skip MFA on recognized devices
- Provide device management (list, revoke) for account security

**Database Indices:**
- `@@index([userId, isRevoked, expiresAt])` — Active device lookup by user

**Relations:**
- `user`: Many-to-one → User

---

### 20. WebAuthnCredential [IMPLEMENTED]

Represents a WebAuthn/FIDO2 passkey credential registered by a user. Enables passwordless authentication via biometrics, hardware security keys, or platform authenticators.

**Fields:**
- `id`: Unique identifier (UUID, Primary Key, auto-generated)
- `userId`: Reference to the credential owner (FK → User, required, cascade delete)
- `credentialId`: Base64url-encoded credential identifier from the authenticator (unique, required)
- `publicKey`: `[SENSITIVE]` COSE public key as raw bytes (PostgreSQL `bytea`, required)
- `signCount`: Authenticator signature counter for clone detection (default: 0)
- `transports`: Array of supported transports (e.g., "internal", "usb", "ble", "nfc"; default: [])
- `backedUp`: Whether the credential is backed up (multi-device; default: false)
- `deviceType`: Credential device type ("singleDevice" or "multiDevice"; default: "singleDevice")
- `name`: User-assigned display name for the passkey (optional, max 64 characters)
- `lastUsedAt`: Timestamp of last successful authentication with this passkey (optional)
- `createdAt`: Record creation timestamp (auto-generated)
- `updatedAt`: Record update timestamp (auto-managed by Prisma @updatedAt)

**Validation Rules:**
- credentialId must be globally unique (enforced by unique constraint)
- name must not exceed 64 characters
- Maximum 10 passkeys per user (enforced at service level)

**Business Invariants:**
- Challenges are single-use (Redis `getdel` with 5-minute TTL)
- Sign count must strictly increase on each authentication (unless both stored and new are 0)
- Sign count replay (newCounter <= storedCounter when storedCounter > 0) triggers PASSKEY_AUTH_FAILURE audit and rejects authentication
- Password confirmation required for deletion when user has a password set
- Public key stored as `Buffer.from(registrationInfo.credential.publicKey)` (raw bytes)

**Domain Events:**
- `PASSKEY_REGISTERED` — Audit log when a new passkey is registered
- `PASSKEY_DELETED` — Audit log when a passkey is deleted
- `PASSKEY_AUTH_SUCCESS` — Audit log on successful passkey authentication
- `PASSKEY_AUTH_FAILURE` — Audit log on failed passkey authentication (includes failure reason)

**Responsibilities:**
- Enable passwordless login via WebAuthn/FIDO2 protocol
- Store credential public keys for server-side verification
- Track authenticator sign count for credential cloning detection

**Database Indices:**
- `@@index([userId])` — Credential lookup by user

**Relations:**
- `user`: Many-to-one → User

---

### 21. OAuthAccount [IMPLEMENTED]

Represents a linked OAuth provider (Google, GitHub) for a user. Supports multi-provider linking — a user can have multiple OAuthAccounts simultaneously. Introduced by SCRUM-160 (Phase A of SCRUM-158 multi-provider architecture).

**Fields:**
- `id`: Unique identifier (UUID, Primary Key, auto-generated)
- `userId`: Reference to the account owner (FK → User, required, cascade delete)
- `provider`: OAuth provider (Provider enum: GOOGLE, GITHUB; required — LOCAL exists in enum but is never assigned to OAuthAccount, it represents email/password auth)
- `providerId`: Provider-specific user identifier (required)
- `email`: User's email at time of linking (audit trail, required)
- `createdAt`: Record creation timestamp (auto-generated)

**Validation Rules:**
- One OAuth identity maps to exactly one user: `@@unique([provider, providerId])`
- One provider per user (cannot link two Google accounts): `@@unique([userId, provider])`

**Business Invariants:**
- OAuth links are immutable — created or deleted, never modified (no `updatedAt`)
- Email verification required before linking (prevents pre-account takeover)
- Cannot unlink last auth method without having a password set (prevents account lockout)
- When user changes email, all OAuthAccounts are deleted (providerId tied to old identity)

**Domain Events:**
- `OAUTH_LINKED` — Audit log when a provider is linked to an account
- `OAUTH_UNLINKED` — Audit log when a provider is unlinked from an account
- `OAUTH_REGISTER` — Audit log when a new account is created via OAuth
- `OAUTH_AUTO_VERIFIED` — Email auto-verified when OAuth provider confirms email ownership

**Responsibilities:**
- Store OAuth provider credentials for multi-provider authentication
- Enable simultaneous Google + GitHub linking on a single account
- Provide audit trail of provider linking history

**Database Indices:**
- `@@index([userId])` — OAuth account lookup by user

**Relations:**
- `user`: Many-to-one → User

---

### 22. Tenant [IMPLEMENTED]

Top-level organizational unit in the multi-tenant architecture introduced by the AUTH v2 + Tenancy v1 program (SCRUM-487, Phase 0.1). A tenant represents a workspace/organization that owns users, projects, modules, and settings. Every user has at least one tenant membership (a "Personal Workspace" was retro-created for pre-existing users via the bootstrap migration). Future phases will scope sessions, tokens, and resources to tenants.

**Fields:**
- `id`: Unique identifier (UUID, Primary Key, auto-generated)
- `slug`: URL-safe identifier for routing and link generation (String, unique, required; pattern: `^[a-z][a-z0-9-]*$`, max 50 chars)
- `subdomain`: User-facing DNS subdomain — drives the `SubdomainTenantResolverMiddleware` lookup (String, **unique, required**; same pattern as `slug`; max 50 chars). Added by SCRUM-495 (AUTH v2 Phase 2.1); backfilled from `slug` in the same migration that introduced the column.
- `name`: Human-readable display name (String, required, max 100 chars)
- `status`: Lifecycle state (TenantStatus enum, default `active`)
- `createdAt`: Record creation timestamp (auto-generated)
- `updatedAt`: Last modification timestamp (auto-updated)
- `deletedAt`: Soft-delete timestamp (DateTime, nullable)

**Validation Rules:**
- Slug AND subdomain must each match `/^[a-z][a-z0-9-]*$/` (lowercase letter prefix, alphanumeric + dashes)
- Slug must be unique across all tenants
- Subdomain must be unique across all tenants AND must NOT collide with the reserved-subdomain blocklist (admin/api/app/auth/dashboard/mail/support/status/www/static/cdn/health/metrics/platform/internal) — enforced at the application layer by `SubdomainTenantResolverMiddleware`
- Name max length 100; slug + subdomain max length 50 each

**Business Invariants:**
- Tenant deletion is soft (sets `deletedAt`, status flips to `deleted`); hard delete only via privileged ops once verified empty of memberships
- Every tenant has at most one `TenantSettings` row (1:1 enforced by FK uniqueness)
- A tenant in `suspended` status blocks all member operations except read-only audit views

**Domain Events:**
- `tenant.created` — emitted after `TenantsService.create()` commits
- `tenant.updated` — emitted after `TenantsService.update()` commits
- `tenant.suspended` / `tenant.activated` / `tenant.deleted` — emitted on status transitions

**Responsibilities:**
- Anchor all multi-tenant resources (memberships, invitations, future projects/modules)
- Provide stable slug for tenant-scoped routing and link generation
- Track lifecycle for billing/compliance reporting

**Database Indices:**
- `@@index([status])` — list/filter tenants by status

**Relations:**
- `settings`: One-to-one → TenantSettings
- `memberships`: One-to-many → TenantMembership
- `invitations`: One-to-many → TenantInvitation

---

### 23. TenantSettings [IMPLEMENTED]

Per-tenant configuration container. Three JSON blobs cover branding (logos, colors, custom CSS), modules (which PlatformModules are enabled), and authPolicy (tenant-specific overrides to the global auth policy: session TTLs, MFA requirements, password complexity, OAuth allow-list). One row per tenant; created atomically with the Tenant in `TenantsService.create()` via `$transaction`. Introduced by SCRUM-487 (AUTH v2 Phase 0.1).

**Fields:**
- `id`: Unique identifier (UUID, Primary Key, auto-generated)
- `tenantId`: Reference to owning tenant (FK → Tenant, required, unique, cascade delete)
- `branding`: Branding configuration (Json, default `"{}"`)
- `modules`: Module enablement flags (Json, default `"{}"`)
- `authPolicy`: Auth policy overrides (Json, default `"{}"`)
- `createdAt` / `updatedAt`: Standard timestamps

**Validation Rules:**
- `tenantId` must reference an existing Tenant
- One TenantSettings per Tenant (`tenantId @unique`)

**Business Invariants:**
- Always created in the same transaction as its Tenant (no Tenant without Settings)
- JSON shape validation lives in the consuming services, not at the schema level (flexible by design — different modules may inject their own keys)

**Domain Events:**
- `tenant.settings.updated` — emitted when branding/modules/authPolicy change (subdomain-specific events may be added later)

**Responsibilities:**
- Centralize tenant-scoped configuration
- Decouple branding/policy from Tenant identity (so settings can be reset without touching membership history)

**Relations:**
- `tenant`: One-to-one → Tenant (cascade delete)

---

### 24. TenantMembership [IMPLEMENTED]

Join entity binding a User to a Tenant with a role and status. A user may belong to multiple tenants (multi-tenancy at the user level). Roles are tenant-scoped (a user can be OWNER in tenant A and MEMBER in tenant B). The bootstrap migration retro-created an OWNER membership in a "Personal Workspace" tenant for every pre-existing user, so every active user has at least one membership. Introduced by SCRUM-487 (AUTH v2 Phase 0.1).

**Fields:**
- `id`: Unique identifier (UUID, Primary Key, auto-generated)
- `tenantId`: Reference to tenant (FK → Tenant, required, cascade delete)
- `userId`: Reference to user (FK → User, required, cascade delete)
- `role`: Tenant-scoped role (TenantRole enum, default `MEMBER`)
- `status`: Membership lifecycle state (MembershipStatus enum, default `active`)
- `invitedBy`: User id of the inviter when membership came from an invitation (String, nullable)
- `joinedAt`: When membership became active (default now)
- `lastActiveAt`: Last activity timestamp in this tenant (default now)
- `createdAt` / `updatedAt`: Standard timestamps

**Validation Rules:**
- `@@unique([tenantId, userId])` — at most one membership per (user, tenant)
- `role` must be one of: OWNER, ADMIN, MEMBER, VIEWER, CUSTOM
- `status` must be one of: active, invited, suspended

**Business Invariants:**
- A tenant must have at least one OWNER at all times (enforced by service-level checks, not by schema)
- Self-suspension is allowed; suspending the last OWNER is not (service-level guard)
- Deleting a tenant cascades to memberships; deleting a user cascades to their memberships

**Domain Events:**
- `tenant.member.added` — emitted after a new membership is created
- `tenant.member.role-changed` — emitted on role transitions
- `tenant.member.suspended` / `tenant.member.activated` — emitted on status changes
- `tenant.member.removed` — emitted on hard delete

**Responsibilities:**
- Bind users to tenants with role-based authorization
- Track activity per (user, tenant) for "switch tenant" UX
- Anchor future tenant-scoped permission grants

**Database Indices:**
- `@@unique([tenantId, userId])` — uniqueness + composite lookup
- `@@index([userId])` — list a user's memberships
- `@@index([tenantId])` — list a tenant's members
- `@@index([userId, status])` — list active memberships for a user

**Relations:**
- `tenant`: Many-to-one → Tenant (cascade delete)
- `user`: Many-to-one → User (cascade delete)

---

### 25. TenantInvitation [IMPLEMENTED]

Pending invitation to join a tenant with a pre-assigned role. Created by an existing tenant ADMIN/OWNER; accepted by the invitee via a single-use, hashed token. Phase 0.1 ships the model + schema only; the create/accept/expire service flow lands in a follow-up phase. Introduced by SCRUM-487 (AUTH v2 Phase 0.1).

**Fields:**
- `id`: Unique identifier (UUID, Primary Key, auto-generated)
- `tenantId`: Reference to target tenant (FK → Tenant, required, cascade delete)
- `email`: Invitee's email address (String, required)
- `role`: Role to assign on acceptance (TenantRole enum, default `MEMBER`)
- `tokenHash`: `[SENSITIVE]` SHA-256 hash (hex) of the invitation token. **Deterministic hashing is required** because the `@unique` constraint cannot enforce uniqueness over bcrypt-style salted hashes (each call would produce a different hash for the same plaintext). Comment in `schema.prisma` was corrected from "bcrypt hash" to "SHA-256 hash (hex)" by SCRUM-491 (AUTH v2 Phase 0.4) when the HTTP surface that consumes this column landed.
- `invitedBy`: User id of the issuing admin (String, required)
- `expiresAt`: Token expiration timestamp (DateTime, required)
- `acceptedAt`: Acceptance timestamp (DateTime, nullable; set once on first accept)
- `createdAt` / `updatedAt`: Standard timestamps

**Validation Rules:**
- `tokenHash` must be unique (no two live invitations share a token)
- Single-use: `acceptedAt` is set atomically when the invitation is consumed; subsequent uses are rejected at the service layer
- `expiresAt` enforced at the service layer (no DB constraint on time)

**Business Invariants:**
- Plain-text token never persisted; only the hash lives in the DB (`@sensitive` comment marks the field for audit tooling)
- Accepting an invitation creates a TenantMembership and sets `acceptedAt` in the same transaction
- Re-inviting the same email to the same tenant invalidates the prior unaccepted token (service-level enforcement)

**Domain Events:**
- `tenant.invitation.sent` — emitted after creation
- `tenant.invitation.accepted` — emitted on acceptance (paired with `tenant.member.added`)
- `tenant.invitation.expired` / `tenant.invitation.revoked` — emitted on lifecycle endings

**Responsibilities:**
- Bridge external (email) → internal (TenantMembership) onboarding
- Provide cryptographically secure, single-use enrollment tokens
- Enable role pre-assignment before the invitee has an account

**Database Indices:**
- `@@index([tenantId])` — list invitations for a tenant
- `@@index([email])` — find pending invitations for an email (signup-time lookup)

**Relations:**
- `tenant`: Many-to-one → Tenant (cascade delete)

---

### 26. Organization [IMPLEMENTED]

Per-tenant sub-grouping introduced by SCRUM-495 (AUTH v2 Phase 2.1, D-007). Where a `Tenant` is the top-level billing/contract unit, an `Organization` is a working sub-group inside that Tenant (e.g. "Engineering", "Sales"). Every Tenant gets one default Organization auto-created in `TenantsService.create()`'s `$transaction`. Future phases will scope permissions, projects, and modules at the Organization level (refines MT-7 from AUTH-v2.md §2 multi-tenant model).

**Fields:**
- `id`: Unique identifier (UUID, Primary Key, auto-generated)
- `tenantId`: Reference to parent Tenant (FK → Tenant, required, cascade delete)
- `name`: Human-readable display name (String, required, max 100 chars)
- `slug`: URL-safe identifier (String, required, pattern `^[a-z][a-z0-9-]*$`, max 50 chars)
- `description`: Optional free-text description (String, nullable, max 500 chars)
- `isDefault`: Whether this is the tenant's default Organization (Boolean, default `false`)
- `createdAt` / `updatedAt`: Standard timestamps

**Validation Rules:**
- Slug must match `^[a-z][a-z0-9-]*$`
- `(tenantId, slug)` must be unique (composite uniqueness — same slug allowed in different tenants)
- Name max 100; slug max 50; description max 500

**Business Invariants:**
- Every Tenant has at least one Organization (the default one, auto-created in `TenantsService.create()`)
- An Organization cannot be moved between Tenants (no cross-tenant migration)
- Deleting an Organization cascade-deletes its OrganizationMemberships but not the parent Tenant or User rows
- Org belongs to one Tenant; never cross-tenant (per D-007)

**Domain Events:**
- `organization.created` — emitted after `OrganizationsService.create()` commits (`AuditAction.ORGANIZATION_CREATED`)
- `organization.member.added` — `AuditAction.ORGANIZATION_MEMBER_ADDED`
- `organization.member.removed` — `AuditAction.ORGANIZATION_MEMBER_REMOVED`

**Responsibilities:**
- Provide per-tenant sub-grouping for users and (future) resources
- Anchor org-scoped permissions and (future) projects
- Allow per-org RBAC granularity without proliferating Tenants

**Database Indices:**
- `@@unique([tenantId, slug])` — composite uniqueness for slug-within-tenant
- `@@index([tenantId])` — list orgs by tenant (the listForTenant hot path)

**Relations:**
- `tenant`: Many-to-one → Tenant (cascade delete)
- `memberships`: One-to-many → OrganizationMembership

---

### 27. OrganizationMembership [IMPLEMENTED]

Join table between User and Organization with a role. Introduced by SCRUM-495 (AUTH v2 Phase 2.1, D-007). Allows a single User to belong to multiple Organizations within the same Tenant (or across different Tenants, given they're separate TenantMemberships).

**Fields:**
- `id`: Unique identifier (UUID, Primary Key, auto-generated)
- `organizationId`: Reference to Organization (FK → Organization, required, cascade delete)
- `userId`: Reference to User (FK → User, required, cascade delete)
- `role`: Org-scoped role (`OrganizationRole` enum, default `MEMBER`)
- `joinedAt`: Timestamp the user joined the org (auto-set on create)

**Validation Rules:**
- `(organizationId, userId)` must be unique (no duplicate memberships)

**Business Invariants:**
- Removing a User cascade-deletes their OrganizationMemberships
- Removing an Organization cascade-deletes its memberships
- A User can hold different roles in different Organizations within the same Tenant

**Domain Events:**
- `organization.member.added` — `AuditAction.ORGANIZATION_MEMBER_ADDED`
- `organization.member.removed` — `AuditAction.ORGANIZATION_MEMBER_REMOVED`

**Responsibilities:**
- Express user ↔ organization belonging
- Anchor org-scoped role-based permissions

**Database Indices:**
- `@@unique([organizationId, userId])` — prevents duplicate memberships
- `@@index([userId])` — for "what orgs is this user in?" queries

**Relations:**
- `organization`: Many-to-one → Organization (cascade delete)
- `user`: Many-to-one → User (cascade delete)

---

### 28. AuthIntent [IMPLEMENTED]

Server-side state machine driving v2 login orchestration. Introduced by SCRUM-497 (AUTH v2 Phase 2.2, D-004). Replaces the procedural `executeLogin` in v1 `LoginService` (strangler — v1 stays bit-identical in production). v2 endpoints (`POST /auth/v2/intents` + `POST /auth/v2/intents/:id/advance`) live behind feature flag `app.authIntentV2Enabled` (default off in prod, on in CI/test).

**Fields:**
- `id`: Unique identifier (UUID, Primary Key, auto-generated)
- `status`: Current state in the state machine (`AuthIntentStatus` enum, default `requires_credentials`)
- `userId`: Reference to the user (FK → User, optional — null until credentials gate clears; SET NULL on user delete)
- `tenantId`: Reference to the selected tenant (FK → Tenant, optional — null until tenant_pick gate clears OR subdomain auto-resolves; SET NULL on tenant delete)
- `organizationId`: Reference to selected organization (FK → Organization, optional — reserved for Phase 3+ org-aware flows; SET NULL on org delete)
- `context`: Accumulated state across transitions (Json, default `{}`) — currently stores `availableTenantIds` for the `requires_tenant_pick` state and `failReason` on terminal `failed`
- `ipAddress`: Client IP at intent creation (String, nullable) — propagated to audit logs
- `userAgent`: Client User-Agent at intent creation (String, nullable) — propagated to audit logs
- `createdAt`: Intent creation timestamp (auto-generated)
- `updatedAt`: Last state transition timestamp (auto-updated)
- `expiresAt`: TTL — 15 minutes default, configurable via `app.authIntentTtlMs`
- `fulfilledAt`: Terminal-state timestamp (DateTime, nullable) — set when status moves to `succeeded`, `failed`, or `expired`

**Validation Rules:**
- `expiresAt` must be > `createdAt`
- State transitions are deterministic — see `AuthIntentStatus` enum + `AuthIntentService.advance()` dispatcher

**Business Invariants:**
- Intents are append-only state machines — `advance()` transitions write a single new state + audit row inside `prisma.$transaction`; no half-states possible.
- Terminal states (`succeeded`, `failed`, `expired`) are immutable — replay via `advance()` returns 410 Gone (plan decision D4).
- Expired-at-advance lazy flip: if `expiresAt < now()`, advance flips status to `expired` + writes `AUTH_INTENT_EXPIRED` audit before returning 410 (plan decision D3).
- ON DELETE SET NULL on all 3 FKs — intent rows persist for audit trail even after referenced entities are deleted.
- No failure-mode enumeration — 11 distinct failure reasons (user_not_found, account_locked, bad_password, email_not_verified, no_tenant_membership, invalid_state, mfa_state_invalid, mfa_code_wrong, tenant_pick_invalid, state_mismatch, passkey_not_implemented) all converge to `UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED)`. Discrimination ONLY in `AUTH_INTENT_FAILED.metadata.reason`.

**Domain Events:**
- `AUTH_INTENT_CREATED` — emitted on intent creation
- `AUTH_INTENT_ADVANCED` — emitted on every non-terminal transition (`requires_credentials → requires_mfa`, `requires_mfa → requires_tenant_pick`, etc.)
- `AUTH_INTENT_SUCCEEDED` — emitted at terminal happy path (access token minted + refresh cookie set)
- `AUTH_INTENT_FAILED` — emitted at terminal sad path (metadata carries discriminating `reason`)
- `AUTH_INTENT_EXPIRED` — emitted on lazy expiry-flip

**Responsibilities:**
- Encapsulate the multi-step v2 login orchestration (credentials → MFA? → tenant_pick? → succeeded)
- Provide a server-side replay-safe record of every login attempt for audit + forensics
- Anchor future phase flows: Phase 3 (passkey-first) wires `requires_passkey` transition; Phase 4 (AuthChallenge) layers step-up on top of `succeeded`

**Database Indices:**
- `@@index([userId])` — audit queries by user
- `@@index([tenantId])` — audit queries by tenant
- `@@index([status, expiresAt])` — future sweep job (Phase 6 — DEFERRED)

**Relations:**
- `user`: Many-to-one → User (optional, SET NULL on delete)
- `tenant`: Many-to-one → Tenant (optional, SET NULL on delete)
- `organization`: Many-to-one → Organization (optional, SET NULL on delete)

---

## Enums

### Role [IMPLEMENTED]

Defines the available platform-level user roles for role-based access control (RBAC).

| Value | Description |
|-------|-------------|
| `USER` | Standard user access (default role for new registrations) |
| `ADMIN` | Elevated access with user management capabilities |
| `SUPERADMIN` | Full platform access — can manage all resources, users, roles, permissions, and system settings |

### Provider [IMPLEMENTED]

Defines the authentication providers supported by the system.

| Value | Description |
|-------|-------------|
| `LOCAL` | Email/password authentication (default) |
| `GOOGLE` | Google OAuth 2.0 |
| `GITHUB` | GitHub OAuth |

### AuditAction [IMPLEMENTED]

Defines the types of security-relevant events tracked in the audit log.

| Value | Description |
|-------|-------------|
| `LOGIN_SUCCESS` | User successfully authenticated |
| `LOGIN_FAILURE` | Failed authentication attempt |
| `LOGOUT` | User logged out |
| `REGISTER` | New user registration |
| `TOKEN_REFRESH` | Access token refreshed via refresh token |
| `OAUTH_LOGIN` | User authenticated via OAuth provider |
| `ACCOUNT_LOCKED` | Account locked after failed login attempts |
| `ACCOUNT_UNLOCKED` | Account lockout expired or manually unlocked |
| `PASSWORD_CHANGE` | User changed their password |
| `PROFILE_UPDATE` | User updated their profile information |
| `USER_ROLE_CHANGE` | Admin changed a user's role |
| `USER_DEACTIVATED` | User account deactivated (soft delete) |
| `USER_ACTIVATED` | User account reactivated |
| `USER_DELETED` | User account deleted |
| `SUPERADMIN_BYPASS` | Platform admin (`User.isPlatformAdmin === true`) bypassed a RolesGuard or PermissionsGuard check. **Enum value name preserved for log-history compatibility**: the audit action was renamed semantically by SCRUM-489 (AUTH v2 Phase 0.3) — the trigger criterion moved from legacy `Role.SUPERADMIN` to `User.isPlatformAdmin`, but the enum value name stays unchanged to avoid breaking historical log queries. The action still means "a privileged actor bypassed a tenant-scoped guard". |
| `MFA_ENABLED` | User successfully enabled MFA/TOTP |
| `MFA_DISABLED` | User disabled MFA with password confirmation |
| `SESSION_IDLE_REVOKED` | Session revoked due to inactivity timeout |
| `SESSION_LIMIT_EXCEEDED` | Oldest session revoked when concurrent session limit exceeded |
| `EMAIL_CHANGE_REQUESTED` | User requested to change their email address |
| `EMAIL_CHANGED` | User's email address was successfully changed after verification |
| `ACCOUNT_SELF_DELETED` | User self-deleted their account (GDPR erasure, PII anonymized) |
| `DEVICE_TRUSTED` | Device marked as trusted (MFA skip on future logins) |
| `DEVICE_UNTRUSTED` | Device trust revoked (single or all devices) |
| `IMPOSSIBLE_TRAVEL_DETECTED` | Anomalous login from geographically impossible location |
| `LOGIN_BLOCKED_TRAVEL` | Login blocked due to impossible travel detection (block strategy) |
| `BRUTE_FORCE_DETECTED` | Brute-force attack detected (threshold exceeded for user in time window) |
| `CREDENTIAL_STUFFING_DETECTED` | Credential stuffing detected (threshold exceeded for IP in time window) |
| `UNUSUAL_LOGIN_HOURS` | Login at statistically unusual hour for this user (3+ stddev from mean) |
| `NEW_COUNTRY_LOGIN` | First login from a new country not seen in previous sessions |
| `PASSKEY_REGISTERED` | User registered a new WebAuthn/FIDO2 passkey |
| `PASSKEY_DELETED` | User deleted a passkey (with password confirmation if applicable) |
| `PASSKEY_AUTH_SUCCESS` | Successful passkey authentication |
| `PASSKEY_AUTH_FAILURE` | Failed passkey authentication (credential not found, deactivated account, verification failed, sign count replay) |
| `OAUTH_UNLINKED` | User unlinked their OAuth provider (Google/GitHub), account converted to local email/password |
| `OAUTH_LINKED` | User explicitly linked an OAuth provider to their existing account |
| `OAUTH_REGISTER` | New user account created via OAuth (first-time OAuth sign-in with no existing account) |
| `OAUTH_AUTO_VERIFIED` | Email auto-verified when OAuth provider supplies a pre-verified email address (anti pre-hijack) |
| `TENANT_FILTER_BYPASS` | Tenant-filter middleware was bypassed via an explicit `TenantContext.runWithBypass(reason, fn)` scope. Written by the `auditAndRunBypass` helper at the bypass decision site (not the query site). Metadata carries `{reason: string}` identifying the call site. Documented exempt cases (no audit row written): the `'unauthenticated'` bypass set by `TenantContextInterceptor` for requests without `req.user`, and the `'tenant-context-resolution'` bypass used by `TenantsService.findFirstActiveMembership()` to bootstrap context. Added by SCRUM-488 (AUTH v2 Phase 0.2) — see program doc §2.4. |
| `TENANT_INVITATION_CREATED` | A new tenant invitation was created via `POST /tenants/:tenantId/invitations`. Metadata: `{invitationId, tenantId, targetEmail (redacted in prod), role, expiresAt}`. Idempotent re-creation for an existing pending `(tenantId, email)` returns the existing row WITHOUT writing a duplicate audit row. Added by SCRUM-491 (AUTH v2 Phase 0.4). |
| `TENANT_INVITATION_ACCEPTED` | An invitation was successfully accepted via `POST /tenants/invitations/accept`, materializing a `TenantMembership`. Paired with `TENANT_MEMBERSHIP_CREATED`. Metadata: `{invitationId, tenantId, membershipId, role}`. Added by SCRUM-491. |
| `TENANT_INVITATION_REVOKED` | A pending invitation was hard-deleted via `DELETE /tenants/:tenantId/invitations/:id`. The deleted row's evidence lives only in this audit entry — soft-delete with `revokedAt` was considered and rejected in plan §1 Q3. Metadata: `{invitationId, tenantId, targetEmail (redacted in prod)}`. Added by SCRUM-491. |
| `TENANT_INVITATION_EXPIRE_REJECTED` | **Security signal.** An accept attempt was made against an invitation whose `expiresAt < now()`. The invitation row stays untouched (never moves to accepted). Metadata: `{invitationId, tenantId, expiresAt}`; the AuditLog row's `userId` is the attempting user. Indicates a possible stale-token-replay or expired-link-reuse pattern worth correlation analysis. Added by SCRUM-491. |
| `TENANT_INVITATION_EMAIL_MISMATCH_REJECTED` | **Security signal.** An accept attempt was made by an authenticated user whose email does NOT match the invitation's target email (case-insensitive). The invitation stays pending; the request is rejected with 403. Metadata: `{invitationId, tenantId, expectedEmail, actualEmail}` (both redacted in prod). Indicates a possible token-stuffing attempt or a coordination failure between inviter and invitee. Symmetric with EXPIRE_REJECTED. Added by SCRUM-491. |
| `TENANT_MEMBERSHIP_CREATED` | A `TenantMembership` was materialized — either via the acceptInvitation flow (paired with `TENANT_INVITATION_ACCEPTED` + invitationId in metadata) OR via direct admin tooling in future phases. Metadata: `{membershipId, tenantId, role}` + optional `{invitationId}`. Added by SCRUM-491. |
| `ORGANIZATION_CREATED` | An `Organization` was created via `OrganizationsService.create()`. Metadata: `{organizationId, tenantId, slug, name, isDefault}`. Default-org auto-creation by `TenantsService.create()` also writes this row (with `isDefault: true` in metadata). Added by SCRUM-495 (AUTH v2 Phase 2.1). |
| `ORGANIZATION_MEMBER_ADDED` | A user was added to an Organization via `OrganizationsService.addMember()`. Metadata: `{organizationId, role}`. `userId` is the actor (the admin who added); `targetUserId` is the newly-added member. Added by SCRUM-495. |
| `ORGANIZATION_MEMBER_REMOVED` | A user was removed from an Organization via `OrganizationsService.removeMember()`. Metadata: `{organizationId}`. `userId` is the actor; `targetUserId` is the removed member. Idempotent remove (Prisma P2025) does NOT emit this audit row. Added by SCRUM-495. |
| `SUBDOMAIN_RESOLUTION_FAILED` | **Security signal.** A request arrived with a subdomain that did NOT resolve to a valid active Tenant. Metadata: `{subdomain, host, reason: 'not-found' \| 'suspended' \| 'deleted'}`. Emitted from `SubdomainTenantResolverMiddleware`. **Rate-limited** (token bucket: 10 events / 60s per process) to prevent audit-storm DoS via dictionary-attack-against-subdomains. Indicates a possible subdomain probe or stale DNS / typo'd customer URL. Added by SCRUM-495. |
| `AUTH_INTENT_CREATED` | An `AuthIntent` was created via `POST /auth/v2/intents`. Metadata: `{intentId, expiresAt}`. `userId` is null (no user resolved yet at intent creation). IP/UA propagated from the request. Added by SCRUM-497 (AUTH v2 Phase 2.2). |
| `AUTH_INTENT_ADVANCED` | An `AuthIntent` transitioned to a non-terminal state via `POST /auth/v2/intents/:id/advance`. Metadata: `{intentId, fromStatus, toStatus, kind}`. Emitted by the shared `emitAdvancedAudit()` helper from `AuthIntentService` (Rule-of-Three extraction). Captures every step of the multi-stage v2 login orchestration. Added by SCRUM-497. |
| `AUTH_INTENT_SUCCEEDED` | An `AuthIntent` reached the terminal happy path — access token minted + `refresh_token_v2` cookie set. Metadata: `{intentId, tenantId, role}`. `userId` is the authenticated user. Subsequent `advance()` on this id returns 410 Gone. Added by SCRUM-497. |
| `AUTH_INTENT_FAILED` | An `AuthIntent` reached the terminal sad path. Metadata: `{intentId, fromStatus, reason}` — `reason` is one of 11 distinct values (`user_not_found`, `account_locked`, `bad_password`, `email_not_verified`, `no_tenant_membership`, `invalid_state`, `mfa_state_invalid`, `mfa_code_wrong`, `tenant_pick_invalid`, `state_mismatch`, `passkey_not_implemented`). **HTTP response is always 401 `Authentication failed`** (no enumeration to client). Discrimination only in this audit row. Added by SCRUM-497. |
| `AUTH_INTENT_EXPIRED` | An `AuthIntent`'s `expiresAt` passed before reaching a terminal state. Lazy flip during `advance()` writes this audit row + transitions to `expired` status. Metadata: `{intentId, expiredAt}`. Subsequent replay returns 410 Gone. Added by SCRUM-497. |

### EmailVerificationTokenType [IMPLEMENTED]

Discriminates between different purposes of email verification tokens.

| Value | Description |
|-------|-------------|
| `REGISTRATION` | Token for verifying email during initial registration (default) |
| `EMAIL_CHANGE` | Token for verifying new email address during email change flow |

### TenantStatus [IMPLEMENTED]

Lifecycle states of a Tenant. Introduced by SCRUM-487 (AUTH v2 + Tenancy v1, Phase 0.1).

| Value | Description |
|-------|-------------|
| `active` | Default state; tenant is fully operational |
| `trial` | Limited-duration evaluation tenant (future billing integration anchor) |
| `suspended` | Operations frozen (e.g. billing failure, compliance hold); reads still allowed for audit |
| `deleted` | Soft-deleted; paired with `Tenant.deletedAt`. Hard delete via privileged ops only |

### TenantRole [IMPLEMENTED]

Tenant-scoped role for a TenantMembership. Distinct from the platform-level `Role` enum (which governs SUPERADMIN/ADMIN/USER access to the NexaCore platform itself). Introduced by SCRUM-487 (AUTH v2 + Tenancy v1, Phase 0.1).

| Value | Description |
|-------|-------------|
| `OWNER` | Full control over tenant settings, members, and lifecycle; at least one OWNER required per tenant |
| `ADMIN` | Manage members and tenant settings; cannot delete the tenant |
| `MEMBER` | Default role (per Prisma `@default`); access tenant resources |
| `VIEWER` | Read-only access to tenant resources |
| `CUSTOM` | Custom role placeholder for future per-tenant permission grants |

### MembershipStatus [IMPLEMENTED]

Lifecycle state of a TenantMembership. Introduced by SCRUM-487 (AUTH v2 + Tenancy v1, Phase 0.1).

| Value | Description |
|-------|-------------|
| `active` | Default state; member can use the tenant |
| `invited` | Membership pre-created from an invitation acceptance (transitional, may be subsumed by TenantInvitation lifecycle in Phase 0.2+) |
| `suspended` | Member is blocked from tenant operations; an OWNER can reactivate |

### AuthIntentStatus [IMPLEMENTED]

State machine values for the `AuthIntent` orchestration entity. Introduced by SCRUM-497 (AUTH v2 Phase 2.2, D-004). 8 values total: 5 in-progress states + 3 terminal states. Plan decision E added explicit `expired` (separate from `failed`) for clean audit trail.

| Value | Description |
|-------|-------------|
| `requires_credentials` | Initial state. Awaiting email+password (or passkey assertion in Phase 3+). |
| `requires_tenant_pick` | Credentials cleared; user is a member of >1 tenant AND no subdomain auto-resolve. Awaiting tenant selection. |
| `requires_mfa` | Credentials cleared; user has MFA enabled. Awaiting TOTP code or recovery code. |
| `requires_passkey` | **Phase 3 reserves this slot** — transition NOT wired in 2.2. Will be the primary path after Phase 3 (passkey-first reframing) lands. |
| `requires_setup` | **Phase 3+ reserves this slot** — per-tenant `authPolicy.requires_setup` flow (e.g., force MFA setup on first login for admin roles). Transition NOT wired in 2.2. |
| `succeeded` | Terminal happy path. Access token minted + `refresh_token_v2` cookie set. Replay returns 410. |
| `failed` | Terminal sad path. Discriminating reason in `AUTH_INTENT_FAILED.metadata.reason` audit row. Replay returns 410. |
| `expired` | Terminal — `expiresAt` passed before reaching a non-terminal state. Lazy flip during `advance()`. Replay returns 410. |

### OrganizationRole [IMPLEMENTED]

Org-scoped role for an OrganizationMembership. Distinct from `TenantRole` (which scopes a TenantMembership) and from `Role` (which scopes platform-level access). Introduced by SCRUM-495 (AUTH v2 + Tenancy v1, Phase 2.1).

| Value | Description |
|-------|-------------|
| `OWNER` | Full control over org settings + members; can add/remove members |
| `ADMIN` | Manage org members; cannot delete the Organization itself |
| `MEMBER` | Default role (per Prisma `@default`); access org resources |
| `VIEWER` | Read-only access to org resources |

### ProjectStatus [PLANNED]

Defines the lifecycle states of a project.

| Value | Description |
|-------|-------------|
| `ACTIVE` | Project is operational (default) |
| `ARCHIVED` | Project is read-only, preserved for reference |
| `SUSPENDED` | Project is frozen by a SUPERADMIN (non-operational) |

### MemberRole [PLANNED]

Defines roles for project and team membership.

| Value | Description |
|-------|-------------|
| `OWNER` | Full control — can manage all aspects including billing and deletion |
| `ADMIN` | Can manage members, teams, settings, and apps |
| `MEMBER` | Standard access — can view and contribute (default) |
| `VIEWER` | Read-only access to project resources |

### NotificationType [PLANNED]

Categorizes notifications by their source domain.

| Value | Description |
|-------|-------------|
| `SYSTEM` | Platform-wide system notifications (maintenance, updates) |
| `PROJECT` | Project-related notifications (member added, project archived) |
| `TEAM` | Team-related notifications (team created, member joined) |
| `BILLING` | Billing-related notifications (payment due, plan changed) |

### NotificationStatus [PLANNED]

Defines the read state of a notification.

| Value | Description |
|-------|-------------|
| `UNREAD` | Notification has not been read (default) |
| `READ` | Notification has been read by the user |
| `ARCHIVED` | Notification has been archived (hidden from default list) |

### BillingPlan [PLANNED]

Defines the available subscription tiers.

| Value | Description |
|-------|-------------|
| `FREE` | Free tier with basic features (default) |
| `PRO` | Professional tier with expanded features and limits |
| `ENTERPRISE` | Enterprise tier with full features, priority support, and custom limits |

### BillingStatus [PLANNED]

Defines the lifecycle states of a subscription.

| Value | Description |
|-------|-------------|
| `ACTIVE` | Subscription is active and in good standing (default) |
| `PAST_DUE` | Payment has failed — grace period before suspension |
| `CANCELED` | Subscription has been canceled — access continues until period end |
| `TRIALING` | Subscription is in a free trial period |

### InvoiceStatus [PLANNED]

Defines the payment states of an invoice.

| Value | Description |
|-------|-------------|
| `DRAFT` | Invoice is being prepared (default) |
| `PENDING` | Invoice has been issued and is awaiting payment |
| `PAID` | Payment has been successfully received |
| `FAILED` | Payment attempt failed |
| `VOID` | Invoice has been voided (canceled before payment) |

### SettingScope [PLANNED]

Defines the scope level of a setting.

| Value | Description |
|-------|-------------|
| `USER` | User-level setting (requires userId) |
| `PROJECT` | Project-level setting (requires projectId) |
| `SYSTEM` | System-wide setting (no userId or projectId) |

### ModuleStatus [PLANNED]

Defines the availability states of a platform module.

| Value | Description |
|-------|-------------|
| `ACTIVE` | Module is available and can be enabled (default) |
| `INACTIVE` | Module is hidden and cannot be enabled |
| `DEPRECATED` | Module is available for existing projects but cannot be newly enabled |

### AppStatus [PLANNED]

Defines the lifecycle states of an application.

| Value | Description |
|-------|-------------|
| `DRAFT` | Application is in development (default) |
| `PUBLISHED` | Application is live and visible to all project members |
| `ARCHIVED` | Application is archived and read-only |

---

## Prisma Schema

> **Note**: The Prisma schema below contains only the 10 implemented models and 4 implemented enums. Planned models (8-18) and 10 planned enums will be added as they are implemented.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

// ─── Enums ───────────────────────────────────────────────

enum Role {
  SUPERADMIN
  ADMIN
  USER
}

enum Provider {
  LOCAL
  GOOGLE
  GITHUB
}

enum AuditAction {
  LOGIN_SUCCESS
  LOGIN_FAILURE
  LOGOUT
  REGISTER
  TOKEN_REFRESH
  OAUTH_LOGIN
  ACCOUNT_LOCKED
  ACCOUNT_UNLOCKED
  PASSWORD_CHANGE
  PROFILE_UPDATE
  USER_ROLE_CHANGE
  USER_DEACTIVATED
  USER_ACTIVATED
  USER_DELETED
  SUPERADMIN_BYPASS
  MFA_ENABLED
  MFA_DISABLED
  SESSION_IDLE_REVOKED
  SESSION_LIMIT_EXCEEDED
  EMAIL_CHANGE_REQUESTED
  EMAIL_CHANGED
  ACCOUNT_SELF_DELETED
  DEVICE_TRUSTED
  DEVICE_UNTRUSTED
  IMPOSSIBLE_TRAVEL_DETECTED
  LOGIN_BLOCKED_TRAVEL
  BRUTE_FORCE_DETECTED
  CREDENTIAL_STUFFING_DETECTED
  UNUSUAL_LOGIN_HOURS
  NEW_COUNTRY_LOGIN
  PASSKEY_REGISTERED
  PASSKEY_DELETED
  PASSKEY_AUTH_SUCCESS
  PASSKEY_AUTH_FAILURE
  OAUTH_UNLINKED
  OAUTH_LINKED
  OAUTH_REGISTER
  OAUTH_AUTO_VERIFIED
  TENANT_FILTER_BYPASS
  TENANT_INVITATION_ACCEPTED
  TENANT_INVITATION_CREATED
  TENANT_INVITATION_EMAIL_MISMATCH_REJECTED
  TENANT_INVITATION_EXPIRE_REJECTED
  TENANT_INVITATION_REVOKED
  TENANT_MEMBERSHIP_CREATED
}

enum EmailVerificationTokenType {
  REGISTRATION
  EMAIL_CHANGE
}

enum ProjectStatus {
  ACTIVE
  ARCHIVED
  SUSPENDED
}

enum MemberRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}

enum NotificationType {
  SYSTEM
  PROJECT
  TEAM
  BILLING
}

enum NotificationStatus {
  UNREAD
  READ
  ARCHIVED
}

enum BillingPlan {
  FREE
  PRO
  ENTERPRISE
}

enum BillingStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  TRIALING
}

enum InvoiceStatus {
  DRAFT
  PENDING
  PAID
  FAILED
  VOID
}

enum SettingScope {
  USER
  PROJECT
  SYSTEM
}

enum ModuleStatus {
  ACTIVE
  INACTIVE
  DEPRECATED
}

enum AppStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

// ─── User & Auth ─────────────────────────────────────────

model User {
  id               String    @id @default(uuid())
  email            String    @unique
  /// @sensitive — User password bcrypt hash
  passwordHash     String?
  firstName        String?
  lastName         String?
  avatarUrl           String?
  avatarOriginalUrl   String?
  avatarCropData      Json?
  role             Role      @default(USER)
  emailVerified    Boolean   @default(false)
  pendingEmail     String?
  isActive         Boolean   @default(true)
  failedAttempts   Int       @default(0)
  lockedUntil      DateTime?
  lockoutCount     Int       @default(0)
  mfaEnabled       Boolean   @default(false)
  /// @sensitive — TOTP secret, AES-256-GCM encrypted
  mfaSecret        String?
  /// @sensitive — Hashed MFA recovery codes
  mfaRecoveryCodes String[]  @default([])
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  deletedAt        DateTime?

  sessions                 Session[]
  auditLogs                AuditLog[]                @relation("AuditLogUser")
  auditLogsTarget          AuditLog[]                @relation("AuditLogTarget")
  emailVerificationTokens  EmailVerificationToken[]  @relation("UserEmailVerificationTokens")
  passwordResetTokens      PasswordResetToken[]      @relation("UserPasswordResetTokens")
  ownedProjects            Project[]                 @relation("ProjectOwner")
  projectMemberships       ProjectMember[]
  teamMemberships          TeamMember[]
  notifications            Notification[]
  settings                 Setting[]                 @relation("UserSettings")
  enabledModules           ProjectModule[]           @relation("ModuleEnabler")
  createdApps              App[]                     @relation("AppCreator")
  trustedDevices           TrustedDevice[]
  webAuthnCredentials      WebAuthnCredential[]
  oauthAccounts            OAuthAccount[]

  @@map("users")
}

model Session {
  id               String   @id @default(uuid())
  userId           String
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenFamily      String
  refreshTokenHash String
  deviceInfo       String?
  ipAddress        String
  userAgent        String?
  locationCity     String?
  locationCountry  String?
  latitude         Float?
  longitude        Float?
  isRevoked        Boolean  @default(false)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  lastUsedAt       DateTime @default(now())
  expiresAt        DateTime

  @@index([userId])
  @@index([tokenFamily])
  @@index([userId, isRevoked])
  @@index([userId, isRevoked, lastUsedAt])
  @@map("sessions")
}

model AuditLog {
  id            String      @id @default(uuid())
  action        AuditAction
  userId        String?
  targetUserId  String?
  ipAddress     String?
  userAgent     String?
  metadata      Json?
  createdAt     DateTime    @default(now())

  user          User?       @relation("AuditLogUser", fields: [userId], references: [id], onDelete: SetNull)
  targetUser    User?       @relation("AuditLogTarget", fields: [targetUserId], references: [id], onDelete: SetNull)

  @@index([action])
  @@index([userId])
  @@index([targetUserId])
  @@index([createdAt])
  @@index([action, userId, createdAt])
  @@index([action, ipAddress, createdAt])
  @@map("audit_logs")
}

model EmailVerificationToken {
  id        String    @id @default(uuid())
  tokenHash String    @unique
  userId    String
  type      EmailVerificationTokenType @default(REGISTRATION)
  user      User      @relation("UserEmailVerificationTokens", fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([userId])
  @@map("email_verification_tokens")
}

model PasswordResetToken {
  id        String    @id @default(uuid())
  tokenHash String    @unique
  userId    String
  user      User      @relation("UserPasswordResetTokens", fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([userId])
  @@map("password_reset_tokens")
}

model TrustedDevice {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  fingerprintHash String
  deviceName      String
  ipAddress       String
  lastVerifiedAt  DateTime @default(now())
  expiresAt       DateTime
  isRevoked       Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([userId, fingerprintHash])
  @@index([userId, isRevoked, expiresAt])
  @@map("trusted_devices")
}

model WebAuthnCredential {
  id           String    @id @default(uuid())
  userId       String
  credentialId String    @unique
  publicKey    Bytes
  signCount    Int       @default(0)
  transports   String[]  @default([])
  backedUp     Boolean   @default(false)
  deviceType   String    @default("singleDevice")
  name         String?
  lastUsedAt   DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("webauthn_credentials")
}

model OAuthAccount {
  id         String   @id @default(uuid())
  userId     String
  provider   Provider
  providerId String
  email      String
  createdAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerId])
  @@unique([userId, provider])
  @@index([userId])
  @@map("oauth_accounts")
}

// ─── RBAC ────────────────────────────────────────────────

model Permission {
  id          String           @id @default(uuid())
  key         String           @unique
  description String
  resource    String
  action      String
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  rolePermissions RolePermission[]

  @@index([resource])
  @@map("permissions")
}

model RolePermission {
  id           String     @id @default(uuid())
  role         Role
  permissionId String
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@unique([role, permissionId])
  @@index([role])
  @@map("role_permissions")
}

// ─── Projects & Teams ────────────────────────────────────

model Project {
  id          String        @id @default(uuid())
  name        String
  slug        String        @unique
  description String?
  status      ProjectStatus @default(ACTIVE)
  ownerId     String
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  owner          User            @relation("ProjectOwner", fields: [ownerId], references: [id])
  members        ProjectMember[]
  teams          Team[]
  apps           App[]
  subscription   Subscription?
  settings       Setting[]       @relation("ProjectSettings")
  enabledModules ProjectModule[]
  notifications  Notification[]

  @@map("projects")
}

model ProjectMember {
  id        String     @id @default(uuid())
  projectId String
  userId    String
  role      MemberRole @default(MEMBER)
  joinedAt  DateTime   @default(now())

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([projectId, userId])
  @@map("project_members")
}

model Team {
  id          String   @id @default(uuid())
  name        String
  description String?
  projectId   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  project Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  members TeamMember[]

  @@unique([projectId, name])
  @@map("teams")
}

model TeamMember {
  id       String     @id @default(uuid())
  teamId   String
  userId   String
  role     MemberRole @default(MEMBER)
  joinedAt DateTime   @default(now())

  team Team @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([teamId, userId])
  @@map("team_members")
}

// ─── Notifications ───────────────────────────────────────

model Notification {
  id        String             @id @default(uuid())
  userId    String
  type      NotificationType
  status    NotificationStatus @default(UNREAD)
  title     String
  message   String
  projectId String?
  actionUrl String?
  readAt    DateTime?
  createdAt DateTime           @default(now())

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  project Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)

  @@index([userId, status])
  @@index([userId, createdAt])
  @@map("notifications")
}

// ─── Billing ─────────────────────────────────────────────

model Subscription {
  id                   String        @id @default(uuid())
  projectId            String        @unique
  plan                 BillingPlan   @default(FREE)
  status               BillingStatus @default(ACTIVE)
  stripeCustomerId     String?
  stripeSubscriptionId String?
  currentPeriodStart   DateTime?
  currentPeriodEnd     DateTime?
  canceledAt           DateTime?
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt

  project  Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  invoices Invoice[]

  @@map("subscriptions")
}

model Invoice {
  id              String        @id @default(uuid())
  subscriptionId  String
  status          InvoiceStatus @default(DRAFT)
  amount          Decimal       @db.Decimal(10, 2)
  currency        String        @default("USD")
  stripeInvoiceId String?
  periodStart     DateTime
  periodEnd       DateTime
  paidAt          DateTime?
  createdAt       DateTime      @default(now())

  subscription Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  @@index([subscriptionId])
  @@map("invoices")
}

// ─── Settings ────────────────────────────────────────────

model Setting {
  id        String       @id @default(uuid())
  key       String
  value     String
  scope     SettingScope
  userId    String?
  projectId String?
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  user    User?    @relation("UserSettings", fields: [userId], references: [id], onDelete: Cascade)
  project Project? @relation("ProjectSettings", fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([key, scope, userId, projectId])
  @@map("settings")
}

// ─── Modules ─────────────────────────────────────────────

model PlatformModule {
  id          String       @id @default(uuid())
  name        String       @unique
  slug        String       @unique
  description String?
  status      ModuleStatus @default(ACTIVE)
  isDefault   Boolean      @default(false)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  projectModules ProjectModule[]

  @@map("platform_modules")
}

model ProjectModule {
  id          String   @id @default(uuid())
  projectId   String
  moduleId    String
  enabledAt   DateTime @default(now())
  enabledById String

  project   Project        @relation(fields: [projectId], references: [id], onDelete: Cascade)
  module    PlatformModule @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  enabledBy User           @relation("ModuleEnabler", fields: [enabledById], references: [id])

  @@unique([projectId, moduleId])
  @@map("project_modules")
}

// ─── Apps ────────────────────────────────────────────────

model App {
  id          String    @id @default(uuid())
  name        String
  slug        String
  description String?
  status      AppStatus @default(DRAFT)
  projectId   String
  createdById String
  config      String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  createdBy User    @relation("AppCreator", fields: [createdById], references: [id])

  @@unique([projectId, slug])
  @@map("apps")
}
```

## TypeScript Interfaces

```typescript
// ─── User & Auth ─────────────────────────────────────────

// src/users/entities/user.entity.ts
export interface User {
  id: string;
  email: string;
  passwordHash: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: Role;
  emailVerified: boolean;
  pendingEmail: string | null;
  isActive: boolean;
  failedAttempts: number;
  lockedUntil: Date | null;
  lockoutCount: number;
  mfaEnabled: boolean;
  mfaSecret: string | null;
  mfaRecoveryCodes: string[];
  createdAt: Date;
  updatedAt: Date;
}

// SafeUser — excludes sensitive fields from API responses
export type SafeUser = Omit<User, 'passwordHash' | 'pendingEmail' | 'mfaSecret' | 'mfaRecoveryCodes' | 'failedAttempts' | 'lockedUntil' | 'lockoutCount'> & {
  oauthProviders: string[]; // provider names from OAuthAccount relation (e.g. ['GOOGLE', 'GITHUB'])
};

// SafeUserSummary — minimal user info for member lists and references
export type SafeUserSummary = Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'avatarUrl'>;

export function toSafeUser(
  user: User & { oauthAccounts?: { provider: string }[] },
): SafeUser {
  const { passwordHash, mfaSecret, mfaRecoveryCodes, ...rest } = user;
  return {
    ...rest,
    oauthProviders: (user.oauthAccounts ?? []).map((a) => a.provider),
  };
}

// src/sessions/entities/session.entity.ts
export interface Session {
  id: string;
  userId: string;
  tokenFamily: string;
  refreshTokenHash: string;
  deviceInfo: string | null;
  ipAddress: string;
  userAgent: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  latitude: number | null;
  longitude: number | null;
  isRevoked: boolean;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
}

// src/audit/entities/audit-log.entity.ts
export interface AuditLog {
  id: string;
  action: AuditAction;
  userId: string | null;
  targetUserId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

// src/auth/entities/email-verification-token.entity.ts
export interface EmailVerificationToken {
  id: string;
  tokenHash: string;
  userId: string;
  type: EmailVerificationTokenType;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// src/auth/entities/password-reset-token.entity.ts
export interface PasswordResetToken {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── RBAC ────────────────────────────────────────────────

// src/permissions/entities/permission.entity.ts
export interface Permission {
  id: string;
  key: string;
  description: string;
  resource: string;
  action: string;
  createdAt: Date;
}

// src/permissions/entities/role-permission.entity.ts
export interface RolePermission {
  id: string;
  role: Role;
  permissionId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Projects & Teams ────────────────────────────────────

// src/projects/entities/project.entity.ts
export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: ProjectStatus;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectWithMembers = Project & {
  members: (ProjectMember & { user: SafeUserSummary })[];
};

// src/projects/entities/project-member.entity.ts
export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: MemberRole;
  joinedAt: Date;
}

// src/teams/entities/team.entity.ts
export interface Team {
  id: string;
  name: string;
  description: string | null;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

// src/teams/entities/team-member.entity.ts
export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: MemberRole;
  joinedAt: Date;
}

// ─── Notifications ───────────────────────────────────────

// src/notifications/entities/notification.entity.ts
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  message: string;
  projectId: string | null;
  actionUrl: string | null;
  readAt: Date | null;
  createdAt: Date;
}

// ─── Billing ─────────────────────────────────────────────

// src/billing/entities/subscription.entity.ts
export interface Subscription {
  id: string;
  projectId: string;
  plan: BillingPlan;
  status: BillingStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  canceledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// src/billing/entities/invoice.entity.ts
export interface Invoice {
  id: string;
  subscriptionId: string;
  status: InvoiceStatus;
  amount: number;
  currency: string;
  stripeInvoiceId: string | null;
  periodStart: Date;
  periodEnd: Date;
  paidAt: Date | null;
  createdAt: Date;
}

// ─── Settings ────────────────────────────────────────────

// src/settings/entities/setting.entity.ts
export interface Setting {
  id: string;
  key: string;
  value: string;
  scope: SettingScope;
  userId: string | null;
  projectId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Modules ─────────────────────────────────────────────

// src/modules/entities/platform-module.entity.ts
export interface PlatformModule {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: ModuleStatus;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// src/modules/entities/project-module.entity.ts
export interface ProjectModule {
  id: string;
  projectId: string;
  moduleId: string;
  enabledAt: Date;
  enabledById: string;
}

// ─── Apps ────────────────────────────────────────────────

// src/apps/entities/app.entity.ts
export interface App {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: AppStatus;
  projectId: string;
  createdById: string;
  config: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

## Entity Relationship Diagram

```
┌─────────────────────────────┐         ┌──────────────────────────┐
│           User              │         │       Session             │
├─────────────────────────────┤         ├──────────────────────────┤
│ id          String PK       │───1:*──▶│ id           String PK   │
│ email       String UK       │         │ userId       String FK    │
│ passwordHash String?        │         │ tokenFamily  String      │
│ firstName   String?         │         │ refreshTokenHash String  │
│ lastName    String?         │         │ deviceInfo   String?     │
│ avatarUrl   String?         │         │ ipAddress    String      │
│ role        Role            │         │ userAgent    String?     │
│ emailVerified Boolean       │         │ isRevoked    Boolean     │
│ isActive    Boolean         │         │ createdAt    DateTime    │
│ failedAttempts Int          │         │ lastUsedAt   DateTime    │
│ lockedUntil DateTime?       │         │ expiresAt    DateTime    │
│ lockoutCount  Int           │         └──────────────────────────┘
│ mfaEnabled  Boolean         │         ┌──────────────────────────┐
│ mfaSecret   String?         │         │       AuditLog           │
│ mfaRecoveryCodes String[]   │───1:*──▶├──────────────────────────┤
│ createdAt   DateTime        │         │ id          String PK    │
│ updatedAt   DateTime        │         │ action      AuditAction  │
└──┬──────────────────────────┘         │ userId      String? FK   │
   │                                    │ targetUserId String? FK  │
   │                                    │ ipAddress   String?      │
   │ 1:*                                │ userAgent   String?      │
   ├──▶ EmailVerificationToken          │ metadata    Json?        │
   │    (id, tokenHash UK, userId FK,   │ createdAt   DateTime     │
   │     expiresAt, usedAt?, createdAt, └──────────────────────────┘
   │     updatedAt)
   │
   │ 1:*                                ┌──────────────────────┐
   ├──▶ PasswordResetToken              │    Permission        │
   │    (id, tokenHash UK, userId FK,   ├──────────────────────┤
   │     expiresAt, usedAt?, createdAt, │ id        String PK  │
   │     updatedAt)                     │ key       String UK  │
   │                                    │ description String   │
   │                                    │ resource  String     │
   │                                    │ action    String     │
   │                                    │ createdAt DateTime   │
   │                                    └──────────┬───────────┘
   │                                               │
   │   ┌──────────────────────┐                    │
   │   │   RolePermission     │                    │
   │   ├──────────────────────┤                    │
   │   │ id          String PK│                    │
   │   │ role        Role     │◀───────────────────┘
   │   │ permissionId String FK│              *:1
   │   │ createdAt   DateTime │
   │   │ updatedAt   DateTime │
   │   └──────────────────────┘
   │
   │ 1:*                    1:*
   ▼                        ▼
┌──────────────────┐    ┌──────────────────────┐
│  ProjectMember   │    │     Notification      │
├──────────────────┤    ├──────────────────────┤
│ id     String PK │    │ id        String PK  │
│ projectId  FK    │    │ userId    String FK   │
│ userId     FK    │    │ type      NotifType   │
│ role  MemberRole │    │ status    NotifStatus │
│ joinedAt DateTime│    │ title     String      │
└────────┬─────────┘    │ message   String      │
         │              │ projectId String? FK  │
    *:1  │              │ actionUrl String?     │
         ▼              │ readAt    DateTime?   │
┌──────────────────────┐│ createdAt DateTime   │
│       Project        │└──────────────────────┘
├──────────────────────┤
│ id        String PK  │───1:*──▶ Team ──1:*──▶ TeamMember
│ name      String     │
│ slug      String UK  │───1:1──▶ Subscription ──1:*──▶ Invoice
│ description String?  │
│ status  ProjStatus   │───1:*──▶ App
│ ownerId   String FK  │
│ createdAt DateTime   │───1:*──▶ ProjectModule ──*:1──▶ PlatformModule
│ updatedAt DateTime   │
└──────────────────────┘───1:*──▶ Setting (scope=PROJECT)

User ──1:*──▶ Setting (scope=USER)

┌──────────────────┐    ┌──────────────────────┐    ┌──────────────────┐
│       Team       │    │    Subscription       │    │  PlatformModule  │
├──────────────────┤    ├──────────────────────┤    ├──────────────────┤
│ id     String PK │    │ id       String PK   │    │ id     String PK │
│ name   String    │    │ projectId String UK  │    │ name   String UK │
│ description Str? │    │ plan     BillingPlan │    │ slug   String UK │
│ projectId FK     │    │ status   BillStatus  │    │ description Str? │
│ createdAt  DT    │    │ stripeCustId String? │    │ status ModStatus │
│ updatedAt  DT    │    │ stripeSubId  String? │    │ isDefault Bool   │
└────────┬─────────┘    │ periodStart  DT?     │    │ createdAt  DT    │
         │              │ periodEnd    DT?     │    │ updatedAt  DT    │
    1:*  ▼              │ canceledAt   DT?     │    └──────────────────┘
┌──────────────────┐    │ createdAt    DT      │
│   TeamMember     │    │ updatedAt    DT      │    ┌──────────────────┐
├──────────────────┤    └────────┬─────────────┘    │      App         │
│ id     String PK │             │                  ├──────────────────┤
│ teamId   FK      │        1:*  ▼                  │ id     String PK │
│ userId   FK      │    ┌──────────────────────┐    │ name   String    │
│ role  MemberRole │    │      Invoice         │    │ slug   String    │
│ joinedAt DateTime│    ├──────────────────────┤    │ description Str? │
└──────────────────┘    │ id       String PK   │    │ status AppStatus │
                        │ subId    String FK   │    │ projectId  FK    │
┌──────────────────┐    │ status  InvStatus    │    │ createdById FK   │
│  ProjectModule   │    │ amount  Decimal      │    │ config   String? │
├──────────────────┤    │ currency String      │    │ createdAt  DT    │
│ id     String PK │    │ stripeInvId String?  │    │ updatedAt  DT    │
│ projectId  FK    │    │ periodStart DT       │    └──────────────────┘
│ moduleId   FK    │    │ periodEnd   DT       │
│ enabledAt  DT    │    │ paidAt   DT?         │    ┌──────────────────┐
│ enabledById FK   │    │ createdAt DT         │    │     Setting      │
└──────────────────┘    └──────────────────────┘    ├──────────────────┤
                                                    │ id     String PK │
                                                    │ key    String    │
                                                    │ value  String    │
                                                    │ scope  SetScope  │
                                                    │ userId   FK?     │
                                                    │ projectId FK?    │
                                                    │ createdAt  DT    │
                                                    │ updatedAt  DT    │
                                                    └──────────────────┘
```

**Relationship Summary:**

| From | To | Type | Through |
|------|------|------|---------|
| User | Session | 1:* | userId FK |
| User | AuditLog | 1:* | userId FK (as actor) |
| User | AuditLog | 1:* | targetUserId FK (as target) |
| User | EmailVerificationToken | 1:* | userId FK |
| User | PasswordResetToken | 1:* | userId FK |
| User | Project | 1:* | ownerId FK (ownership) |
| User | Project | *:* | ProjectMember (membership) |
| User | Team | *:* | TeamMember (membership) |
| User | Notification | 1:* | userId FK |
| User | Setting | 1:* | userId FK (scope=USER) |
| Role | Permission | *:* | RolePermission |
| Project | Team | 1:* | projectId FK |
| Project | App | 1:* | projectId FK |
| Project | Subscription | 1:1 | projectId FK (unique) |
| Project | Setting | 1:* | projectId FK (scope=PROJECT) |
| Project | PlatformModule | *:* | ProjectModule |
| Project | Notification | 1:* | projectId FK (optional context) |
| Subscription | Invoice | 1:* | subscriptionId FK |
| Team | TeamMember | 1:* | teamId FK |

---

## Domain Events

Domain events are emitted via NestJS EventEmitter (`@nestjs/event-emitter`) to decouple side effects from core business logic.

### Auth Events
| Event | Trigger | Side Effects |
|-------|---------|-------------|
| `user.registered` | New user registration | Send welcome email, create default settings |
| `user.deactivated` | User account deactivated | Revoke all tokens, notify admins |
| `user.locked` | Account locked after failed attempts | Send security alert email |

### Project Events
| Event | Trigger | Side Effects |
|-------|---------|-------------|
| `project.created` | New project created | Create default subscription, enable default modules, notify owner |
| `project.updated` | Project details modified | — |
| `project.archived` | Project archived | Notify all members |
| `project.suspended` | SUPERADMIN suspends project | Notify owner and admins |
| `project.member.added` | New member added to project | Notify the new member |
| `project.member.removed` | Member removed from project | Remove from all teams, notify the removed member |

### Team Events
| Event | Trigger | Side Effects |
|-------|---------|-------------|
| `team.created` | New team created | Notify project admins |
| `team.deleted` | Team deleted | Notify team members |
| `team.member.added` | Member added to team | Notify the new member |
| `team.member.removed` | Member removed from team | Notify the removed member |

### Billing Events
| Event | Trigger | Side Effects |
|-------|---------|-------------|
| `subscription.created` | Project creation (FREE plan) | — |
| `subscription.upgraded` | Plan upgraded | Notify project owner, unlock features |
| `subscription.downgraded` | Plan downgraded | Notify project owner, check feature limits |
| `subscription.canceled` | Subscription canceled | Notify project owner and admins |
| `invoice.paid` | Successful payment | Notify project owner |
| `invoice.failed` | Payment failure | Notify project owner, set subscription PAST_DUE |

### Notification Events
| Event | Trigger | Side Effects |
|-------|---------|-------------|
| `notification.created` | Any event that generates a notification | Push notification (future), email digest (future) |

---

## Redis Key Patterns

These keys live in Redis (not PostgreSQL) and support ephemeral security operations.

### Token Deny-List (SCRUM-117)

| Key Pattern | Type | TTL | Purpose |
|-------------|------|-----|---------|
| `deny:jti:{jti}` | STRING (empty value) | 900s (15 min, matches access token TTL) | Deny a specific JWT by its `jti` claim |
| `deny:user:{userId}` | STRING (empty value) | 900s | Deny ALL tokens for a user (bulk revocation) |

**Deny points** (operations that write deny keys):
- `AuthService.logout()` → `deny:user:{userId}`
- `UsersService.changePassword()` → `deny:user:{userId}`
- `UsersService.adminUpdateUser()` → `deny:user:{userId}` (when deactivating or changing role)
- `UsersService.softDelete()` → `deny:user:{userId}`

**Check point**: `JwtStrategy.validate()` checks both `deny:jti:{jti}` and `deny:user:{userId}` via Redis pipeline before allowing the request.

**Fail-open**: If Redis is unavailable, deny checks return `false` (not denied). This prioritizes availability over security for short-lived 15-minute access tokens.

---

## Security Considerations

- **Password Storage**: Passwords are hashed with bcrypt (12 rounds) before storage. The `passwordHash` field is never exposed in API responses.
- **Session-Based Token Security**: Refresh tokens are stored as bcrypt hashes in the `Session` table with device/IP/user-agent tracking. Token family tracking enables theft detection — if a revoked token is reused, all sessions in the same family are revoked. Token rotation updates the hash in-place.
- **SafeUser Type**: The `SafeUser` type excludes `passwordHash`, `mfaSecret`, and `mfaRecoveryCodes` from all API responses using TypeScript's `Omit` utility type.
- **Account Lockout**: After 5 failed login attempts, the account is locked with escalating duration via `lockedUntil` and `lockoutCount` fields.
- **Audit Logging**: All security-relevant events (login, logout, role changes, account actions) are recorded in the `AuditLog` table with actor, target, IP, and metadata. Logs are append-only.
- **MFA/2FA**: Users can enable TOTP-based multi-factor authentication. TOTP secret and hashed recovery codes are stored on the User model. MFA-related fields are excluded from API responses.
- **Email Verification**: Email verification tokens are stored as SHA-256 hashes. Raw tokens are sent via email and never stored.
- **Password Reset**: Password reset tokens are stored as SHA-256 hashes. On successful reset, all user sessions are revoked.
- **OAuth Accounts**: OAuth users have `passwordHash = null` and cannot use email/password login unless they set a password separately.
- **Project Access Control**: All project operations check ProjectMember role before executing. OWNER has full control, ADMIN can manage members and settings, MEMBER can contribute, VIEWER has read-only access.
- **Team Access Control**: Users must be a ProjectMember of the parent project before joining any team within it. Removing a ProjectMember cascades to remove them from all teams.
- **Billing Data Isolation**: Subscription and invoice data is only accessible to project OWNER and ADMIN members. Stripe webhook endpoints validate Stripe signature headers.
- **Setting Scope Enforcement**: Server-side validation ensures that USER settings require userId, PROJECT settings require projectId, and SYSTEM settings require neither. SYSTEM settings are restricted to SUPERADMIN.
- **SUPERADMIN Access**: SUPERADMIN can access all resources regardless of project membership. This role can only be assigned by another SUPERADMIN. SUPERADMIN operations are logged for audit.
- **Token Deny-List**: Access tokens can be immediately revoked via Redis-backed deny-list (per-token `jti` or per-user bulk). Deny keys auto-expire after 900s (matching access token TTL). Fail-open pattern ensures availability if Redis is down.
- **Soft Delete**: User accounts use `isActive = false` for soft deletion. This preserves data integrity (FK references) while preventing the user from logging in.
