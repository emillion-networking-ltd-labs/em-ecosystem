# Backend Implementation Plan: SCRUM-178 Update data-model.md: Mark Planned vs Implemented Models

## 1. Header

- **Ticket**: SCRUM-178
- **Sprint**: Sprint 7 - Audit Remediation
- **Parent**: SCRUM-174 (Auth Module Audit Epic)
- **Audit Finding**: Phase 5 D-01 FAIL (MEDIUM) — Schema has 10 models, spec documents 21. No implemented/planned distinction. Header count incorrect.

---

## 2. Codebase State Snapshot

- **Date**: 2026-03-12
- **Last completed ticket**: SCRUM-177 (documentation-only, OAuthLinkGuard + link endpoints docs)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/prisma/schema.prisma` — 10 models: User, Session, AuditLog, EmailVerificationToken, PasswordResetToken, Permission, RolePermission, TrustedDevice, WebAuthnCredential, OAuthAccount. 4 enums: Role, Provider, AuditAction, EmailVerificationTokenType.
  - `ai-specs/specs/data-model.md` — 21 model sections (### 1 through ### 21). Header says "19 entities, 13 enums" but ToC lists 21 entities. 13 enums documented (4 implemented, 9 planned).
- **Constructor signatures verified**: N/A — documentation-only ticket
- **Methods verified to exist**: N/A
- **Guard dependency chain verified**: N/A
- **Discrepancies with integration-state.md**: None relevant (documentation-only ticket)

---

## 3. Overview

Documentation-only ticket. Update `data-model.md` to clearly distinguish between implemented models (in Prisma schema) and planned models (documented for future implementation). Fix the header entity count and add status indicators throughout.

**No code changes.**

---

## 4. Architecture Context

- **Modules involved**: None (documentation-only)
- **Components affected**:
  - Modified: `ai-specs/specs/data-model.md`
- **Files referenced**: `nexacore-api/prisma/schema.prisma` (for verification only)

---

## 5. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Not required — documentation-only ticket with no code changes in em-ecosystem-code
- **Note**: Changes are in `ai-specs/` which is not a git repository

### Step 1: Fix Header Entity/Enum Count

- **File**: `ai-specs/specs/data-model.md`
- **Action**: Update line 3 header description
- **Implementation Steps**:
  1. Change `"including 19 entities, 13 enums"` to `"including 21 entities (10 implemented, 11 planned), 13 enums (4 implemented, 9 planned)"`

### Step 2: Add Model Status Summary Table

- **File**: `ai-specs/specs/data-model.md`
- **Action**: Insert a status summary table after the Table of Contents (before `## Model Descriptions`)
- **Implementation Steps**:
  1. Add a new section `## Model Implementation Status` before `## Model Descriptions`
  2. Insert table:

     ```markdown
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
     ```

### Step 3: Add Status Badge to Each Model Section Header

- **File**: `ai-specs/specs/data-model.md`
- **Action**: Append `[IMPLEMENTED]` or `[PLANNED]` to each model section heading
- **Implementation Steps**:
  1. Implemented models — append `[IMPLEMENTED]`:
     - `### 1. User` → `### 1. User [IMPLEMENTED]`
     - `### 2. Session` → `### 2. Session [IMPLEMENTED]`
     - `### 3. AuditLog` → `### 3. AuditLog [IMPLEMENTED]`
     - `### 4. EmailVerificationToken` → `### 4. EmailVerificationToken [IMPLEMENTED]`
     - `### 5. PasswordResetToken` → `### 5. PasswordResetToken [IMPLEMENTED]`
     - `### 6. Permission` → `### 6. Permission [IMPLEMENTED]`
     - `### 7. RolePermission` → `### 7. RolePermission [IMPLEMENTED]`
     - `### 19. TrustedDevice` → `### 19. TrustedDevice [IMPLEMENTED]`
     - `### 20. WebAuthnCredential` → `### 20. WebAuthnCredential [IMPLEMENTED]` (note: heading may say "WebAuthn Credential")
     - `### 21. OAuthAccount` → `### 21. OAuthAccount [IMPLEMENTED]`
  2. Planned models — append `[PLANNED]`:
     - `### 8. Project` → `### 8. Project [PLANNED]`
     - `### 9. ProjectMember` → `### 9. ProjectMember [PLANNED]`
     - `### 10. Team` → `### 10. Team [PLANNED]`
     - `### 11. TeamMember` → `### 11. TeamMember [PLANNED]`
     - `### 12. Notification` → `### 12. Notification [PLANNED]`
     - `### 13. Subscription` → `### 13. Subscription [PLANNED]`
     - `### 14. Invoice` → `### 14. Invoice [PLANNED]`
     - `### 15. Setting` → `### 15. Setting [PLANNED]`
     - `### 16. PlatformModule` → `### 16. PlatformModule [PLANNED]`
     - `### 17. ProjectModule` → `### 17. ProjectModule [PLANNED]`
     - `### 18. App` → `### 18. App [PLANNED]`

### Step 4: Add Status Column to Enums Section

- **File**: `ai-specs/specs/data-model.md`
- **Action**: Add `[IMPLEMENTED]` or `[PLANNED]` badge to each enum heading
- **Implementation Steps**:
  1. Implemented enums — append `[IMPLEMENTED]`:
     - `### Role` → `### Role [IMPLEMENTED]`
     - `### Provider` → `### Provider [IMPLEMENTED]`
     - `### AuditAction` → `### AuditAction [IMPLEMENTED]`
     - `### EmailVerificationTokenType` → `### EmailVerificationTokenType [IMPLEMENTED]`
  2. Planned enums — append `[PLANNED]`:
     - `### ProjectStatus` → `### ProjectStatus [PLANNED]`
     - `### MemberRole` → `### MemberRole [PLANNED]`
     - `### NotificationType` → `### NotificationType [PLANNED]`
     - `### NotificationStatus` → `### NotificationStatus [PLANNED]`
     - `### BillingPlan` → `### BillingPlan [PLANNED]`
     - `### BillingStatus` → `### BillingStatus [PLANNED]`
     - `### InvoiceStatus` → `### InvoiceStatus [PLANNED]`
     - `### SettingScope` → `### SettingScope [PLANNED]`
     - `### ModuleStatus` → `### ModuleStatus [PLANNED]`
     - `### AppStatus` → `### AppStatus [PLANNED]`

### Step 5: Update Prisma Schema Section Note

- **File**: `ai-specs/specs/data-model.md`
- **Action**: Add a note at the top of the Prisma Schema section
- **Implementation Steps**:
  1. Locate `## Prisma Schema` section
  2. Add note after heading: `> **Note**: The Prisma schema below contains only the 10 implemented models and 4 implemented enums. Planned models (8-18) will be added as they are implemented.`

### Step 6: Update Table of Contents

- **File**: `ai-specs/specs/data-model.md`
- **Action**: Add the new `Model Implementation Status` section to the ToC
- **Implementation Steps**:
  1. Add `- [Model Implementation Status](#model-implementation-status)` before `- [Model Descriptions](#model-descriptions)` in the ToC

### Step 7: Update integration-state.md Changelog

- **File**: `ai-specs/specs/integration-state.md`
- **Action**: Add changelog entry
- **Implementation Steps**:
  1. Add row at top of changelog:
     ```
     | 2026-03-12 | SCRUM-178 | Documentation-only: Updated data-model.md — fixed header count (21 entities, 13 enums with implemented/planned breakdown), added Model Implementation Status summary table, added [IMPLEMENTED]/[PLANNED] badges to all 21 model and 13 enum section headings, added note to Prisma Schema section. No code changes. |
     ```

---

## 6. Implementation Order

1. Step 1: Fix header entity/enum count
2. Step 2: Add Model Status Summary table
3. Step 3: Add status badges to model headings
4. Step 4: Add status badges to enum headings
5. Step 5: Update Prisma Schema section note
6. Step 6: Update Table of Contents
7. Step 7: Update integration-state.md changelog

---

## 7. Testing Checklist

- [ ] Header states "21 entities (10 implemented, 11 planned), 13 enums (4 implemented, 9 planned)"
- [ ] Model Implementation Status table has 21 rows with correct status for each
- [ ] All 10 implemented model headings have `[IMPLEMENTED]` badge
- [ ] All 11 planned model headings have `[PLANNED]` badge
- [ ] All 4 implemented enum headings have `[IMPLEMENTED]` badge
- [ ] All 9 planned enum headings have `[PLANNED]` badge
- [ ] Prisma Schema section has note about containing only implemented models
- [ ] ToC includes Model Implementation Status link
- [ ] No model content was removed or modified (only headings and header changed)
- [ ] No code files modified (documentation only)

---

## 8. Error Response Format

N/A — documentation-only ticket.

---

## 9. Partial Update Support

N/A

---

## 10. Dependencies

No new dependencies. Documentation-only.

---

## 11. Notes

- The 10 implemented models map exactly to `nexacore-api/prisma/schema.prisma`
- The 11 planned models (Project through App) are documented for future sprints and represent the full NexaCore platform vision
- Models #19-21 (TrustedDevice, WebAuthnCredential, OAuthAccount) were added after the initial 18, which is why the header previously said "19 entities" — it was never updated after #20 and #21 were added
- No model content is removed — planned models remain as implementation reference

---

## 12. Next Steps After Implementation

- Run `/update-docs` to create implementation record
- No commit/PR needed (documentation-only, ai-specs is not a git repo)

---

## 13. Implementation Verification

- [ ] Header count matches ToC (21 entities, 13 enums)
- [ ] Every model section has correct status badge
- [ ] Every enum section has correct status badge
- [ ] Summary table present with all 21 models
- [ ] Prisma Schema section has note
- [ ] Zero code files modified
- [ ] Changelog updated in integration-state.md
