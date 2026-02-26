export interface RefreshTokenPayload {
  sub: string; // userId
  sessionId: string; // session record ID
  family: string; // token family UUID for theft detection
}
