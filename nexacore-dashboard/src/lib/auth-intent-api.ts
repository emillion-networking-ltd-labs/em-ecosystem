/**
 * SCRUM-499 / AUTH v2 Phase 2.3: thin wrapper around `apiClient` for the
 * AuthIntent v2 endpoints shipped in Phase 2.2 (SCRUM-497).
 *
 * Endpoints:
 *   POST /auth/v2/intents              — create a new intent
 *   POST /auth/v2/intents/:id/advance  — apply the next state transition
 *
 * Both go through the existing `apiClient.post` (preserves CSRF, fingerprint,
 * rate-limit error handling). 401 from these endpoints does NOT trigger
 * silentRefresh — they are listed in SKIP_REFRESH_ON_401 (matched via
 * `startsWith` so the `/advance` variant is covered too).
 *
 * Errors are re-thrown for callers (AuthContext.loginV2 etc.) to handle.
 */

import { apiClient } from "./api";
import type { AdvanceAuthIntentInput, AuthIntentResponse } from "./types";

export async function createAuthIntent(): Promise<AuthIntentResponse> {
  return apiClient.post<AuthIntentResponse>("/auth/v2/intents", {});
}

export async function advanceAuthIntent(
  intentId: string,
  input: AdvanceAuthIntentInput,
): Promise<AuthIntentResponse> {
  return apiClient.post<AuthIntentResponse>(
    `/auth/v2/intents/${intentId}/advance`,
    input,
  );
}
