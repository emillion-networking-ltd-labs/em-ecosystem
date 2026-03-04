-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'DEVICE_TRUSTED';
ALTER TYPE "AuditAction" ADD VALUE 'DEVICE_UNTRUSTED';
ALTER TYPE "AuditAction" ADD VALUE 'IMPOSSIBLE_TRAVEL_DETECTED';
ALTER TYPE "AuditAction" ADD VALUE 'LOGIN_BLOCKED_TRAVEL';
ALTER TYPE "AuditAction" ADD VALUE 'BRUTE_FORCE_DETECTED';
ALTER TYPE "AuditAction" ADD VALUE 'CREDENTIAL_STUFFING_DETECTED';
ALTER TYPE "AuditAction" ADD VALUE 'UNUSUAL_LOGIN_HOURS';
ALTER TYPE "AuditAction" ADD VALUE 'NEW_COUNTRY_LOGIN';
ALTER TYPE "AuditAction" ADD VALUE 'PASSKEY_REGISTERED';
ALTER TYPE "AuditAction" ADD VALUE 'PASSKEY_DELETED';
ALTER TYPE "AuditAction" ADD VALUE 'PASSKEY_AUTH_SUCCESS';
ALTER TYPE "AuditAction" ADD VALUE 'PASSKEY_AUTH_FAILURE';
ALTER TYPE "AuditAction" ADD VALUE 'OAUTH_UNLINKED';

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "locationCity" TEXT,
ADD COLUMN     "locationCountry" TEXT,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "trusted_devices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fingerprintHash" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "lastVerifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trusted_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webauthn_credentials" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" BYTEA NOT NULL,
    "signCount" INTEGER NOT NULL DEFAULT 0,
    "transports" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "backedUp" BOOLEAN NOT NULL DEFAULT false,
    "deviceType" TEXT NOT NULL DEFAULT 'singleDevice',
    "name" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webauthn_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trusted_devices_userId_isRevoked_expiresAt_idx" ON "trusted_devices"("userId", "isRevoked", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "trusted_devices_userId_fingerprintHash_key" ON "trusted_devices"("userId", "fingerprintHash");

-- CreateIndex
CREATE UNIQUE INDEX "webauthn_credentials_credentialId_key" ON "webauthn_credentials"("credentialId");

-- CreateIndex
CREATE INDEX "webauthn_credentials_userId_idx" ON "webauthn_credentials"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_userId_createdAt_idx" ON "audit_logs"("action", "userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_ipAddress_createdAt_idx" ON "audit_logs"("action", "ipAddress", "createdAt");

-- AddForeignKey
ALTER TABLE "trusted_devices" ADD CONSTRAINT "trusted_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webauthn_credentials" ADD CONSTRAINT "webauthn_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
