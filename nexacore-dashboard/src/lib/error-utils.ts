type ApiErrorShape = {
  error?: {
    message?: string;
    details?: string[];
    statusCode?: number;
    code?: string;
    retryAfter?: number;
  };
};

/** Ensure string ends with a period. */
export function ensurePeriod(s: string): string {
  return s.endsWith('.') ? s : `${s}.`;
}

/**
 * Extract user-facing error message from API error.
 * Prefers validation details[0], falls back to error.message.
 */
export function extractErrorMessage(err: unknown): string {
  const errObj = err as ApiErrorShape;
  const details = errObj?.error?.details;
  if (Array.isArray(details) && details.length > 0) return ensurePeriod(details[0]);
  return ensurePeriod(errObj?.error?.message ?? 'An unexpected error occurred.');
}

/**
 * Extract error message with statusCode-specific overrides.
 * Used by profile components (ConnectedAccounts, DeleteAccount, etc.)
 */
export function extractMessageByStatus(
  err: unknown,
  overrides: Partial<Record<number, string>>,
  fallback: string,
): string {
  const errObj = err as ApiErrorShape;
  const status = errObj?.error?.statusCode;
  if (status && overrides[status]) return overrides[status]!;
  return ensurePeriod(errObj?.error?.message ?? fallback);
}
