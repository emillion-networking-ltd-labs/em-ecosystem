-- AlterTable: Add updatedAt to permissions with default for existing rows
ALTER TABLE "permissions" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- AlterTable: Drop defaults from previous migration (now managed by Prisma @updatedAt)
ALTER TABLE "email_verification_tokens" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "password_reset_tokens" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "sessions" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "webauthn_credentials" ALTER COLUMN "updatedAt" DROP DEFAULT;
