import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  Session,
  SessionResponse,
  toSessionResponse,
} from './entities/session.entity';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.session.create({
      data: {
        userId: params.userId,
        tokenFamily,
        refreshTokenHash,
        deviceInfo: params.deviceInfo || null,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent || null,
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
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (oldSession.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // THEFT DETECTION: session already revoked means old token is being reused
    if (oldSession.isRevoked) {
      await this.revokeAllByFamily(oldSession.tokenFamily);
      throw new UnauthorizedException(
        'Token reuse detected. All sessions revoked for security.',
      );
    }

    const isValid = await bcrypt.compare(
      params.oldRefreshToken,
      oldSession.refreshTokenHash,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired refresh token');
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
      throw new NotFoundException('Session not found');
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async getActiveSessions(
    userId: string,
    currentSessionId?: string,
  ): Promise<SessionResponse[]> {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
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
}
