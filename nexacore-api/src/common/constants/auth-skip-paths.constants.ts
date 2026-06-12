/**
 * Auth path skip-list — Phase 8 Cap 5 (§15 hardcoded refusal).
 *
 * Consumer copy of `the auth-skip-paths template`
 * (framework). Single source of truth: framework. Sync via SCRUM tickets.
 */
export const AUTH_SKIP_PATHS: readonly string[] = [
  '/auth/',
  '/oauth/',
  '/sessions/',
  '/mfa/',
  '/passkey/',
] as const;
