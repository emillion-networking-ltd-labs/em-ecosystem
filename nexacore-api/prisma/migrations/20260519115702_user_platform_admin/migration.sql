-- AlterTable
ALTER TABLE "users" ADD COLUMN "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false;

-- Data backfill: preserve cross-tenant authority for existing SUPERADMIN users.
-- SCRUM-489 / AUTH v2 Phase 0.3 — see ai-specs/changes/auth/programs/AUTH-v2.md §2.2.
UPDATE "users" SET "isPlatformAdmin" = true WHERE "role" = 'SUPERADMIN';
