/**
 * Pseudonymize an email address for safe logging (GDPR Art. 5).
 * e.g. "john.doe@example.com" → "j***@example.com"
 */
export function pseudonymizeEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***@***';
  const visible = local.charAt(0);
  return `${visible}***@${domain}`;
}
