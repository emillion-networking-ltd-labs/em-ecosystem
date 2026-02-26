import { AuditAction } from '../enums/audit-action.enum';

export interface AuditLogEntry {
  action: AuditAction;
  userId?: string | null;
  targetUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface RequestContext {
  ipAddress: string | null;
  userAgent: string | null;
}
