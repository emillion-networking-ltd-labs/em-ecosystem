export const APP_NAME = "EM NexaCore";
export const APP_DESCRIPTION = "EM Ecosystem Core Platform";

/**
 * SCRUM-499 / AUTH v2 Phase 2.3: feature flag for the v2 login flow.
 * Mirrors backend's `app.authIntentV2Enabled` (env `AUTH_INTENT_V2_ENABLED`).
 * Default false in production, true in CI/dev. Env var baked at build time
 * (NEXT_PUBLIC_*); no runtime override.
 */
export const AUTH_INTENT_V2_ENABLED =
  process.env.NEXT_PUBLIC_AUTH_INTENT_V2_ENABLED === "true";
