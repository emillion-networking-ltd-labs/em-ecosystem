-- SCRUM-497 / AUTH v2 + Tenancy v1 Phase 2.2 — AuthIntent state machine
-- See ai-specs/changes/auth/plans/Sprint 15/SCRUM-497_backend.md
--
-- Additive only:
--   1. 5 new AuditAction enum values for AuthIntent lifecycle audit
--   2. NEW enum AuthIntentStatus (8 states)
--   3. NEW table auth_intents
--
-- Hand-written per SCRUM-487/491/493/495 convention (dev DB lacks shadow CREATE).

-- ────────────────────────────────────────────────────────────────────────
-- 1) Extend AuditAction enum (must be in separate statements per Postgres)
-- ────────────────────────────────────────────────────────────────────────
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'AUTH_INTENT_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'AUTH_INTENT_ADVANCED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'AUTH_INTENT_SUCCEEDED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'AUTH_INTENT_FAILED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'AUTH_INTENT_EXPIRED';

-- ────────────────────────────────────────────────────────────────────────
-- 2) Create AuthIntentStatus enum (8 values)
-- ────────────────────────────────────────────────────────────────────────
CREATE TYPE "AuthIntentStatus" AS ENUM (
    'requires_credentials',
    'requires_tenant_pick',
    'requires_mfa',
    'requires_passkey',
    'requires_setup',
    'succeeded',
    'failed',
    'expired'
);

-- ────────────────────────────────────────────────────────────────────────
-- 3) Create auth_intents table
-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE "auth_intents" (
    "id" TEXT NOT NULL,
    "status" "AuthIntentStatus" NOT NULL DEFAULT 'requires_credentials',
    "userId" TEXT,
    "tenantId" TEXT,
    "organizationId" TEXT,
    "context" JSONB NOT NULL DEFAULT '{}',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "fulfilledAt" TIMESTAMP(3),

    CONSTRAINT "auth_intents_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "auth_intents_userId_idx" ON "auth_intents"("userId");
CREATE INDEX "auth_intents_tenantId_idx" ON "auth_intents"("tenantId");
CREATE INDEX "auth_intents_status_expiresAt_idx" ON "auth_intents"("status", "expiresAt");

-- FKs (ON DELETE SET NULL — intent rows persist for audit even if user/tenant/org deleted)
ALTER TABLE "auth_intents"
    ADD CONSTRAINT "auth_intents_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "auth_intents"
    ADD CONSTRAINT "auth_intents_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "auth_intents"
    ADD CONSTRAINT "auth_intents_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
