-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'MFA_ENABLED';
ALTER TYPE "AuditAction" ADD VALUE 'MFA_DISABLED';
ALTER TYPE "AuditAction" ADD VALUE 'SESSION_IDLE_REVOKED';
ALTER TYPE "AuditAction" ADD VALUE 'SESSION_LIMIT_EXCEEDED';

-- CreateIndex
CREATE INDEX "sessions_userId_isRevoked_lastUsedAt_idx" ON "sessions"("userId", "isRevoked", "lastUsedAt");
