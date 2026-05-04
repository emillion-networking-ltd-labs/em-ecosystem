import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { GeolocationService } from '../geolocation/geolocation.service';
import { TokenDenyListService } from '../auth/token-deny-list.service';
import {
  SESSION_IDLE_TIMEOUT_HOURS,
  MAX_CONCURRENT_SESSIONS,
  ACCESS_TOKEN_TTL_SECONDS,
  BCRYPT_ROUNDS,
  hoursToMs,
} from '../auth/constants/auth.constants';
import {
  Session,
  SessionResponse,
  toSessionResponse,
} from './entities/session.entity';
import { ErrorMessages } from '../common/constants/error-messages';

function parseDeviceInfo(userAgent: string | null | undefined): string | null {
  if (!userAgent) return null;

  let browser = 'Unknown Browser';
  if (userAgent.includes('Edg/')) browser = 'Edge';
  else if (userAgent.includes('OPR/') || userAgent.includes('Opera'))
    browser = 'Opera';
  else if (userAgent.includes('Chrome/') && !userAgent.includes('Chromium'))
    browser = 'Chrome';
  else if (userAgent.includes('Firefox/')) browser = 'Firefox';
  else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome'))
    browser = 'Safari';

  let os = 'Unknown OS';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac OS X') || userAgent.includes('Macintosh'))
    os = 'macOS';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad'))
    os = 'iOS';
  else if (userAgent.includes('Linux')) os = 'Linux';

  return `${browser} on ${os}`;
}

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly geolocationService: GeolocationService,
    // forwardRef breaks the AuthModule <-> SessionsModule cycle: AuthModule
    // already imports SessionsModule, so SessionsModule importing AuthModule
    // (to access TokenDenyListService) requires forwardRef on both sides.
    @Inject(forwardRef(() => TokenDenyListService))
    private readonly tokenDenyListService: TokenDenyListService,
  ) {}

  async createSession(params: {
    userId: string;
    refreshToken: string;
    tokenFamily?: string;
    deviceInfo?: string | null;
    ipAddress: string;
    userAgent?: string | null;
    expiresAt: Date;
  }): Promise<Session> {
    const refreshTokenHash = await bcrypt.hash(
      params.refreshToken,
      BCRYPT_ROUNDS,
    );
    const tokenFamily = params.tokenFamily || crypto.randomUUID();
    const geo = this.geolocationService.lookupIp(params.ipAddress);

    return this.prisma.session.create({
      data: {
        userId: params.userId,
        tokenFamily,
        refreshTokenHash,
        deviceInfo:
          params.deviceInfo || parseDeviceInfo(params.userAgent) || null,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent || null,
        locationCity: geo?.city || null,
        locationCountry: geo?.countryCode || null,
        latitude: geo?.latitude || null,
        longitude: geo?.longitude || null,
        expiresAt: params.expiresAt,
      },
    }) as Promise<Session>;
  }

  async findById(id: string): Promise<Session | null> {
    return this.prisma.session.findUnique({
      where: { id },
    }) as Promise<Session | null>;
  }

  async rotateRefreshToken(params: {
    oldSessionId: string;
    oldRefreshToken: string;
    newRefreshToken: string;
    ipAddress: string;
    userAgent?: string | null;
    expiresAt: Date;
  }): Promise<Session> {
    const oldSession = await this.findById(params.oldSessionId);

    if (!oldSession) {
      throw new UnauthorizedException(ErrorMessages.auth.INVALID_REFRESH_TOKEN);
    }

    if (oldSession.expiresAt < new Date()) {
      throw new UnauthorizedException(ErrorMessages.auth.INVALID_REFRESH_TOKEN);
    }

    // THEFT DETECTION: session already revoked means old token is being reused
    if (oldSession.isRevoked) {
      await this.revokeAllByFamily(oldSession.tokenFamily);
      throw new UnauthorizedException(ErrorMessages.auth.INVALID_REFRESH_TOKEN);
    }

    const isValid = await bcrypt.compare(
      params.oldRefreshToken,
      oldSession.refreshTokenHash,
    );
    if (!isValid) {
      throw new UnauthorizedException(ErrorMessages.auth.INVALID_REFRESH_TOKEN);
    }

    // Revoke the old session
    await this.prisma.session.update({
      where: { id: params.oldSessionId },
      data: { isRevoked: true },
    });

    // Create new session in the same token family
    return this.createSession({
      userId: oldSession.userId,
      refreshToken: params.newRefreshToken,
      tokenFamily: oldSession.tokenFamily,
      deviceInfo: oldSession.deviceInfo,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent || oldSession.userAgent,
      expiresAt: params.expiresAt,
    });
  }

  async revokeAllByFamily(tokenFamily: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { tokenFamily, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async revokeSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.findById(sessionId);

    if (!session || session.userId !== userId) {
      throw new NotFoundException(ErrorMessages.session.NOT_FOUND);
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });

    // SCRUM-347: pair the DB revocation with a Redis deny-list entry so any
    // access token bound to this session is rejected by JwtStrategy within
    // ~1 sec instead of waiting up to ACCESS_TOKEN_TTL_SECONDS for the JWT
    // to expire by clock. Without this, the revoked session keeps working
    // until the access token's natural TTL elapses (eventual consistency).
    await this.tokenDenyListService.denyBySessionId(
      sessionId,
      ACCESS_TOKEN_TTL_SECONDS,
    );
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });

    // SCRUM-347: pair with user-level deny so every access token previously
    // bound to ANY of this user's sessions is rejected immediately. Closes
    // the same eventual-consistency gap for callers that revoke all sessions
    // without their own deny-list call (email-verification, password-reset,
    // password-change). The admin lock-user flow and logoutAll already pair
    // this call; the redundancy is idempotent (Redis SET refreshes TTL).
    await this.tokenDenyListService.denyAllForUser(
      userId,
      ACCESS_TOKEN_TTL_SECONDS,
    );
  }

  async getActiveSessions(
    userId: string,
    currentSessionId?: string,
  ): Promise<SessionResponse[]> {
    const idleThreshold = new Date(
      Date.now() - hoursToMs(SESSION_IDLE_TIMEOUT_HOURS),
    );

    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
        lastUsedAt: { gte: idleThreshold },
      },
      orderBy: { lastUsedAt: 'desc' },
    });

    return (sessions as Session[]).map((s) =>
      toSessionResponse(s, currentSessionId),
    );
  }

  async updateSessionHash(
    sessionId: string,
    refreshTokenHash: string,
  ): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { refreshTokenHash },
    });
  }

  isSessionIdle(
    lastUsedAt: Date,
    idleTimeoutHours: number = SESSION_IDLE_TIMEOUT_HOURS,
  ): boolean {
    const idleThreshold = new Date(Date.now() - hoursToMs(idleTimeoutHours));
    return lastUsedAt < idleThreshold;
  }

  async getActiveNonIdleSessions(userId: string): Promise<Session[]> {
    const idleThreshold = new Date(
      Date.now() - hoursToMs(SESSION_IDLE_TIMEOUT_HOURS),
    );

    return this.prisma.session.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
        lastUsedAt: { gte: idleThreshold },
      },
      orderBy: { lastUsedAt: 'asc' },
    }) as Promise<Session[]>;
  }

  async enforceSessionLimit(
    userId: string,
    ctx?: { ipAddress?: string; userAgent?: string | null },
  ): Promise<void> {
    const activeSessions = await this.getActiveNonIdleSessions(userId);
    const sessionsToRevoke =
      activeSessions.length - (MAX_CONCURRENT_SESSIONS - 1);

    if (sessionsToRevoke <= 0) return;

    const sessionsToEvict = activeSessions.slice(0, sessionsToRevoke);

    for (const session of sessionsToEvict) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { isRevoked: true },
      });

      this.auditService
        .log({
          action: AuditAction.SESSION_LIMIT_EXCEEDED,
          userId,
          ipAddress: ctx?.ipAddress ?? null,
          userAgent: ctx?.userAgent ?? null,
          metadata: {
            revokedSessionId: session.id,
            reason: 'concurrent_session_limit',
            activeCount: activeSessions.length,
            limit: MAX_CONCURRENT_SESSIONS,
          },
        })
        .catch(() => {});
    }
  }

  async revokeSessionDirect(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });
  }

  /**
   * SCRUM-347 / Issue 2 fix (ghost sessions): mark as revoked any non-revoked
   * sessions of the user that are already past the idle threshold. Lazy
   * cleanup that backstops the frontend idle handler — covers cases where the
   * user's browser crashed or was closed without dispatching the idle logout
   * (no /auth/logout call ever reached the backend, so sessions sit in DB
   * with `isRevoked: false` until a refresh attempt eventually fails).
   *
   * Called on login (`tokenService.generateTokens`). Idempotent: zero-cost
   * when no idle sessions exist. Bounded: at most MAX_CONCURRENT_SESSIONS
   * per user.
   *
   * Returns the number of sessions revoked (for audit/logging).
   */
  async cleanupIdleSessionsForUser(userId: string): Promise<number> {
    const idleThreshold = new Date(
      Date.now() - hoursToMs(SESSION_IDLE_TIMEOUT_HOURS),
    );

    const result = await this.prisma.session.updateMany({
      where: {
        userId,
        isRevoked: false,
        lastUsedAt: { lt: idleThreshold },
      },
      data: { isRevoked: true },
    });

    return result.count;
  }

  async findPreviousActiveSessions(
    userId: string,
    excludeSessionId: string,
  ): Promise<{ ipAddress: string | null; userAgent: string | null }[]> {
    return this.prisma.session.findMany({
      where: {
        userId,
        id: { not: excludeSessionId },
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      select: { ipAddress: true, userAgent: true },
    });
  }
}
