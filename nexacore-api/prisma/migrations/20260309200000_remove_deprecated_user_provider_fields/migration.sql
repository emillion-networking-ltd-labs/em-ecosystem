-- DropIndex (if default value created one)
DROP INDEX IF EXISTS "users_provider_idx";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "provider",
DROP COLUMN "providerId";
