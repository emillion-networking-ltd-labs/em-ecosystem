import { Role } from '../../users/enums/role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  jti: string;
  // Session-id binding enables instant per-session revocation via the
  // Redis deny-list (`deny:session:{sessionId}` key) checked by JwtStrategy.
  // Optional during the deploy window — in-flight tokens minted before this
  // change validate without the field; once their 15-min TTL elapses, every
  // new token will carry it. SCRUM-347.
  sessionId?: string;
  iat?: number;
}
