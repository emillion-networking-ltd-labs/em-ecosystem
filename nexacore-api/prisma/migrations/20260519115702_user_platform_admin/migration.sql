-- AlterTable
ALTER TABLE "users" ADD COLUMN "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false;

-- Data backfill: preserve cross-tenant authority for existing SUPERADMIN users.
-- SCRUM-489 / AUTH v2 Phase 0.3 — see AUTH-v2 program §2.2.
UPDATE "users" SET "isPlatformAdmin" = true WHERE "role" = 'SUPERADMIN';
