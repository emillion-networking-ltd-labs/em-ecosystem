-- AlterTable: Add updatedAt to sessions with default for existing rows
ALTER TABLE "sessions" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable: Add updatedAt to webauthn_credentials with default for existing rows
ALTER TABLE "webauthn_credentials" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
