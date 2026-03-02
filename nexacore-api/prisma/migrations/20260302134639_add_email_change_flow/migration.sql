-- CreateEnum
CREATE TYPE "EmailVerificationTokenType" AS ENUM ('REGISTRATION', 'EMAIL_CHANGE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'EMAIL_CHANGE_REQUESTED';
ALTER TYPE "AuditAction" ADD VALUE 'EMAIL_CHANGED';

-- AlterTable
ALTER TABLE "email_verification_tokens" ADD COLUMN     "type" "EmailVerificationTokenType" NOT NULL DEFAULT 'REGISTRATION';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "pendingEmail" TEXT;
