-- SCRUM-487 / AUTH v2 + Tenancy v1 program — Phase 0.1 bootstrap
-- Maps every existing User to a default Tenant as OWNER.
-- Idempotent via LEFT JOIN guards — safe to re-run.
-- See ai-specs/changes/auth/programs/AUTH-v2.md §2 + tenants/plans/Sprint 15/SCRUM-487_backend.md §6 Step 3.

-- Ensure pgcrypto is available for gen_random_uuid() (idempotent).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create a default Tenant for each non-deleted User without an existing membership.
--    Slug: "personal-" + first 8 hex chars of user uuid.
--    Name: "<email-local-part> Workspace" (or "Personal Workspace" if email is missing).
INSERT INTO "tenants" (id, slug, name, status, "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  'personal-' || substring(u.id::text, 1, 8),
  COALESCE(NULLIF(split_part(u.email, '@', 1), ''), 'Personal') || ' Workspace',
  'active',
  NOW(),
  NOW()
FROM "users" u
LEFT JOIN "tenant_memberships" m ON m."userId" = u.id
WHERE m.id IS NULL
  AND u."deletedAt" IS NULL;

-- 2. Create TenantSettings (1:1) for each Tenant without settings.
INSERT INTO "tenant_settings" (id, "tenantId", branding, modules, "authPolicy", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  t.id,
  '{}'::jsonb,
  '{}'::jsonb,
  '{}'::jsonb,
  NOW(),
  NOW()
FROM "tenants" t
LEFT JOIN "tenant_settings" s ON s."tenantId" = t.id
WHERE s.id IS NULL;

-- 3. Create OWNER TenantMembership linking each User to their default Tenant.
--    Pairing resolved by slug pattern 'personal-' + first 8 chars of user id.
INSERT INTO "tenant_memberships" (id, "tenantId", "userId", role, status, "joinedAt", "lastActiveAt", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  t.id,
  u.id,
  'OWNER',
  'active',
  NOW(),
  NOW(),
  NOW(),
  NOW()
FROM "users" u
JOIN "tenants" t ON t.slug = 'personal-' || substring(u.id::text, 1, 8)
LEFT JOIN "tenant_memberships" m ON m."userId" = u.id
WHERE m.id IS NULL
  AND u."deletedAt" IS NULL;
