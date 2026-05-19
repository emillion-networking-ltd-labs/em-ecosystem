-- Partial unique index enforces createInvitation idempotency under concurrency.
-- SCRUM-491 / AUTH v2 + Tenancy v1 — Phase 0.4.
-- See ai-specs/changes/tenants/plans/Sprint 15/SCRUM-491_backend.md §5.3.
--
-- Rationale: TenantInvitation.tokenHash @unique alone cannot prevent two
-- pending invitations for the same (tenantId, email). Partial unique on
-- WHERE acceptedAt IS NULL handles the race window between findFirst and
-- create at the service layer, while allowing historical accepted rows
-- to remain without violating the constraint.
CREATE UNIQUE INDEX "uniq_tenant_invitation_pending"
  ON "tenant_invitations" ("tenantId", LOWER("email"))
  WHERE "acceptedAt" IS NULL;
