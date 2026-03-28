-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'OAUTH_AUTO_VERIFIED';

-- AlterTable
ALTER TABLE "permissions" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "role_permissions" ALTER COLUMN "updatedAt" DROP DEFAULT;
