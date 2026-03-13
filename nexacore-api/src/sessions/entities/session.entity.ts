export interface Session {
  id: string;
  userId: string;
  tokenFamily: string;
  refreshTokenHash: string;
  deviceInfo: string | null;
  ipAddress: string;
  userAgent: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  latitude: number | null;
  longitude: number | null;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
}

export interface SessionResponse {
  id: string;
  deviceInfo: string | null;
  ipAddress: string;
  userAgent: string | null;
  locationCity: string | null;
  locationCountry: string | null;
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
    locationCity: session.locationCity,
    locationCountry: session.locationCountry,
    createdAt: session.createdAt.toISOString(),
    lastUsedAt: session.lastUsedAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    isCurrent: session.id === currentSessionId,
  };
}
