export interface Session {
  id: string;
  userId: string;
  tokenFamily: string;
  refreshTokenHash: string;
  deviceInfo: string | null;
  ipAddress: string;
  userAgent: string | null;
  isRevoked: boolean;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
}

export interface SessionResponse {
  id: string;
  deviceInfo: string | null;
  ipAddress: string;
  userAgent: string | null;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export function toSessionResponse(
  session: Session,
  currentSessionId?: string,
): SessionResponse {
  return {
    id: session.id,
    deviceInfo: session.deviceInfo,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    createdAt: session.createdAt.toISOString(),
    lastUsedAt: session.lastUsedAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    isCurrent: session.id === currentSessionId,
  };
}
