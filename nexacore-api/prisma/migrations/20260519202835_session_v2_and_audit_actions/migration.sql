-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'SESSION_V2_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'SESSION_V2_REFRESH_REJECTED';
ALTER TYPE "AuditAction" ADD VALUE 'SESSION_V2_REVOKED';
ALTER TYPE "AuditAction" ADD VALUE 'SESSION_V2_ROTATED';
ALTER TYPE "AuditAction" ADD VALUE 'SESSION_V2_TENANT_BULK_REVOKED';

-- CreateTable
CREATE TABLE "sessions_v2" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_v2_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_v2_refreshTokenHash_key" ON "sessions_v2"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "sessions_v2_userId_idx" ON "sessions_v2"("userId");

-- CreateIndex
CREATE INDEX "sessions_v2_userId_tenantId_idx" ON "sessions_v2"("userId", "tenantId");

-- CreateIndex
CREATE INDEX "sessions_v2_userId_tenantId_isRevoked_idx" ON "sessions_v2"("userId", "tenantId", "isRevoked");

-- AddForeignKey
ALTER TABLE "sessions_v2" ADD CONSTRAINT "sessions_v2_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
