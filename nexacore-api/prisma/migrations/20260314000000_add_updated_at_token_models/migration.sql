-- AlterTable: Add updatedAt to email_verification_tokens with default for existing rows
ALTER TABLE "email_verification_tokens" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable: Add updatedAt to password_reset_tokens with default for existing rows
ALTER TABLE "password_reset_tokens" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
