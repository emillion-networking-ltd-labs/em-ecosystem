-- AlterTable: Add updatedAt to role_permissions with default for existing rows
ALTER TABLE "role_permissions" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
