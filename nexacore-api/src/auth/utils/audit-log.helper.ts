import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/enums/audit-action.enum';

export type AuditLogger = (
  action: AuditAction,
  ctx?: { ipAddress?: string | null; userAgent?: string | null },
  userId?: string,
  metadata?: Record<string, unknown>,
) => void;

export function createAuditLogger(auditService: AuditService): AuditLogger {
  return (
    action: AuditAction,
    ctx?: { ipAddress?: string | null; userAgent?: string | null },
    userId?: string,
    metadata?: Record<string, unknown>,
  ): void => {
    auditService
      .log({
        action,
        userId,
        ipAddress: ctx?.ipAddress ?? null,
        userAgent: ctx?.userAgent ?? null,
        ...(metadata && { metadata }),
      })
      .catch(() => {});
  };
}
