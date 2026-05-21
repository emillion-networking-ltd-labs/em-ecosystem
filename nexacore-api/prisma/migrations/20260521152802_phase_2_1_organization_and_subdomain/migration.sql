-- CreateEnum
CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');

-- AlterEnum (additive — SCRUM-495 / Phase 2.1)
ALTER TYPE "AuditAction" ADD VALUE 'ORGANIZATION_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'ORGANIZATION_MEMBER_ADDED';
ALTER TYPE "AuditAction" ADD VALUE 'ORGANIZATION_MEMBER_REMOVED';
ALTER TYPE "AuditAction" ADD VALUE 'SUBDOMAIN_RESOLUTION_FAILED';

-- AlterTable tenants — add subdomain (backfilled from slug)
ALTER TABLE "tenants" ADD COLUMN "subdomain" TEXT;
UPDATE "tenants" SET "subdomain" = "slug";
ALTER TABLE "tenants" ALTER COLUMN "subdomain" SET NOT NULL;
CREATE UNIQUE INDEX "tenants_subdomain_key" ON "tenants"("subdomain");

-- AlterTable audit_logs — add organizationId (nullable)
ALTER TABLE "audit_logs" ADD COLUMN "organizationId" TEXT;

-- CreateTable organizations
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable organization_memberships
CREATE TABLE "organization_memberships" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrganizationRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex organizations
CREATE UNIQUE INDEX "organizations_tenantId_slug_key" ON "organizations"("tenantId", "slug");
CREATE INDEX "organizations_tenantId_idx" ON "organizations"("tenantId");

-- CreateIndex organization_memberships
CREATE UNIQUE INDEX "organization_memberships_organizationId_userId_key" ON "organization_memberships"("organizationId", "userId");
CREATE INDEX "organization_memberships_userId_idx" ON "organization_memberships"("userId");
CREATE INDEX "organization_memberships_organizationId_idx" ON "organization_memberships"("organizationId");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Default-organization bootstrap (idempotent)
-- Every existing tenant gets a "Default" org so Phase 2.2 can assume one exists.
INSERT INTO "organizations" ("id", "tenantId", "name", "slug", "isDefault", "createdAt", "updatedAt")
SELECT gen_random_uuid(), t.id, 'Default', 'default', true, NOW(), NOW()
FROM "tenants" t
WHERE NOT EXISTS (
  SELECT 1 FROM "organizations" o
  WHERE o."tenantId" = t.id AND o."isDefault" = true
);
