import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { SessionsService } from '../sessions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/enums/audit-action.enum';
import { GeolocationService } from '../../geolocation/geolocation.service';
import { TokenDenyListService } from '../../auth/token-deny-list.service';
import { Session } from '../entities/session.entity';

jest.mock('bcrypt');
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: jest.fn(),
}));

describe('SessionsService', () => {
  let sessionsService: SessionsService;
  let auditService: { log: jest.Mock };
  let geolocationService: { lookupIp: jest.Mock };
  let tokenDenyListService: {
    denyBySessionId: jest.Mock;
    denyAllForUser: jest.Mock;
  };
  let prisma: {
    session: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      findMany: jest.Mock;
    };
  };

  const now = new Date('2026-02-27T12:00:00Z');
  const futureDate = new Date('2026-03-06T12:00:00Z');
  const pastDate = new Date('2026-02-20T12:00:00Z');

  const mockSession: Session = {
    id: 'session-1',
    userId: 'user-1',
    tokenFamily: 'family-1',
    refreshTokenHash: 'hashed-token',
    deviceInfo: 'Chrome on Windows',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    isRevoked: false,
    locationCity: null,
    locationCountry: null,
    latitude: null,
    longitude: null,
    createdAt: now,
    updatedAt: now,
    lastUsedAt: now,
    expiresAt: futureDate,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers({ now });

    prisma = {
      session: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findMany: jest.fn(),
      },
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    geolocationService = {
      lookupIp: jest.fn().mockReturnValue(null),
    };

    tokenDenyListService = {
      denyBySessionId: jest.fn().mockResolvedValue(undefined),
      denyAllForUser: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: AuditService,
          useValue: auditService,
        },
        {
          provide: GeolocationService,
          useValue: geolocationService,
        },
        {
          provide: TokenDenyListService,
          useValue: tokenDenyListService,
        },
      ],
    }).compile();

    sessionsService = module.get<SessionsService>(SessionsService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ─── createSession ──────────────────────────────────────────────

  describe('createSession', () => {
    const createParams = {
      userId: 'user-1',
      refreshToken: 'raw-refresh-token',
      deviceInfo: 'Chrome on Windows',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      expiresAt: futureDate,
    };

    it('should hash the refresh token with bcrypt', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-token');
      (crypto.randomUUID as jest.Mock).mockReturnValue('generated-family');
      prisma.session.create.mockResolvedValue(mockSession);

      await sessionsService.createSession(createParams);

      expect(bcrypt.hash).toHaveBeenCalledWith('raw-refresh-token', 12);
    });

    it('should generate a tokenFamily when not provided', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-token');
      (crypto.randomUUID as jest.Mock).mockReturnValue('generated-family');
      prisma.session.create.mockResolvedValue(mockSession);

      await sessionsService.createSession(createParams);

      expect(prisma.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tokenFamily: 'generated-family',
        }),
      });
    });

    it('should use provided tokenFamily when given', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-token');
      prisma.session.create.mockResolvedValue(mockSession);

      await sessionsService.createSession({
        ...createParams,
        tokenFamily: 'explicit-family',
      });

      expect(prisma.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tokenFamily: 'explicit-family',
        }),
      });
    });

    it('should create session with all fields in Prisma', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-token');
      (crypto.randomUUID as jest.Mock).mockReturnValue('gen-family');
      prisma.session.create.mockResolvedValue(mockSession);

      const result = await sessionsService.createSession(createParams);

      expect(prisma.session.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          tokenFamily: 'gen-family',
          refreshTokenHash: 'hashed-token',
          deviceInfo: 'Chrome on Windows',
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          locationCity: null,
          locationCountry: null,
          latitude: null,
          longitude: null,
          expiresAt: futureDate,
        },
      });
      expect(result).toEqual(mockSession);
    });

    it('should default deviceInfo and userAgent to null when not provided', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-token');
      (crypto.randomUUID as jest.Mock).mockReturnValue('gen-family');
      prisma.session.create.mockResolvedValue(mockSession);

      await sessionsService.createSession({
        userId: 'user-1',
        refreshToken: 'raw-token',
        ipAddress: '127.0.0.1',
        expiresAt: futureDate,
      });

      expect(prisma.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deviceInfo: null,
          userAgent: null,
        }),
      });
    });

    it('should include geolocation data when lookupIp returns a result', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-token');
      (crypto.randomUUID as jest.Mock).mockReturnValue('gen-family');
      prisma.session.create.mockResolvedValue(mockSession);
      geolocationService.lookupIp.mockReturnValue({
        city: 'Madrid',
        country: 'Spain',
        countryCode: 'ES',
        latitude: 40.4168,
        longitude: -3.7038,
      });

      await sessionsService.createSession({
        userId: 'user-1',
        refreshToken: 'raw-token',
        ipAddress: '203.0.113.1',
        expiresAt: futureDate,
      });

      expect(prisma.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          locationCity: 'Madrid',
          locationCountry: 'ES',
          latitude: 40.4168,
          longitude: -3.7038,
        }),
      });
    });

    it('should store null geo fields when lookupIp returns null (private IP)', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-token');
      (crypto.randomUUID as jest.Mock).mockReturnValue('gen-family');
      prisma.session.create.mockResolvedValue(mockSession);
      geolocationService.lookupIp.mockReturnValue(null);

      await sessionsService.createSession({
        userId: 'user-1',
        refreshToken: 'raw-token',
        ipAddress: '192.168.1.1',
        expiresAt: futureDate,
      });

      expect(prisma.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          locationCity: null,
          locationCountry: null,
          latitude: null,
          longitude: null,
        }),
      });
    });
  });

  // ─── findById ───────────────────────────────────────────────────

  describe('findById', () => {
    it('should return session when found', async () => {
      prisma.session.findUnique.mockResolvedValue(mockSession);

      const result = await sessionsService.findById('session-1');

      expect(result).toEqual(mockSession);
      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { id: 'session-1' },
      });
    });

    it('should return null when session not found', async () => {
      prisma.session.findUnique.mockResolvedValue(null);

      const result = await sessionsService.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ─── rotateRefreshToken ─────────────────────────────────────────

  describe('rotateRefreshToken', () => {
    const rotateParams = {
      oldSessionId: 'session-1',
      oldRefreshToken: 'old-raw-token',
      newRefreshToken: 'new-raw-token',
      ipAddress: '192.168.1.1',
      userAgent: 'New-Agent',
      expiresAt: futureDate,
    };

    it('should throw UnauthorizedException when session not found', async () => {
      prisma.session.findUnique.mockResolvedValue(null);

      await expect(
        sessionsService.rotateRefreshToken(rotateParams),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        sessionsService.rotateRefreshToken(rotateParams),
      ).rejects.toThrow('Invalid or expired refresh token');
    });

    it('should throw UnauthorizedException when session is expired', async () => {
      prisma.session.findUnique.mockResolvedValue({
        ...mockSession,
        expiresAt: pastDate,
      });

      await expect(
        sessionsService.rotateRefreshToken(rotateParams),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should detect token theft when session is already revoked', async () => {
      const revokedSession = { ...mockSession, isRevoked: true };
      prisma.session.findUnique.mockResolvedValue(revokedSession);
      prisma.session.updateMany.mockResolvedValue({ count: 3 });

      await expect(
        sessionsService.rotateRefreshToken(rotateParams),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        sessionsService.rotateRefreshToken({
          ...rotateParams,
          oldSessionId: 'session-1',
        }),
      ).rejects.toThrow('Invalid or expired refresh token');

      // Verify all sessions in the family were revoked
      expect(prisma.session.updateMany).toHaveBeenCalledWith({
        where: { tokenFamily: 'family-1', isRevoked: false },
        data: { isRevoked: true },
      });
    });

    it('should throw UnauthorizedException when refresh token hash does not match', async () => {
      prisma.session.findUnique.mockResolvedValue(mockSession);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        sessionsService.rotateRefreshToken(rotateParams),
      ).rejects.toThrow(UnauthorizedException);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'old-raw-token',
        'hashed-token',
      );
    });

    it('should revoke old session and create new one on valid rotation', async () => {
      prisma.session.findUnique.mockResolvedValue(mockSession);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-token');
      prisma.session.update.mockResolvedValue({
        ...mockSession,
        isRevoked: true,
      });

      const newSession = {
        ...mockSession,
        id: 'session-2',
        refreshTokenHash: 'new-hashed-token',
      };
      prisma.session.create.mockResolvedValue(newSession);

      const result = await sessionsService.rotateRefreshToken(rotateParams);

      // Old session revoked
      expect(prisma.session.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: { isRevoked: true },
      });

      // New session created in same family
      expect(prisma.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          tokenFamily: 'family-1',
          ipAddress: '192.168.1.1',
          userAgent: 'New-Agent',
          expiresAt: futureDate,
        }),
      });

      expect(result).toEqual(newSession);
    });

    it('should preserve old userAgent when new one is not provided', async () => {
      prisma.session.findUnique.mockResolvedValue(mockSession);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-token');
      prisma.session.update.mockResolvedValue({
        ...mockSession,
        isRevoked: true,
      });
      prisma.session.create.mockResolvedValue({
        ...mockSession,
        id: 'session-2',
      });

      await sessionsService.rotateRefreshToken({
        ...rotateParams,
        userAgent: undefined,
      });

      expect(prisma.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userAgent: 'Mozilla/5.0', // from old session
        }),
      });
    });
  });

  // ─── revokeAllByFamily ──────────────────────────────────────────

  describe('revokeAllByFamily', () => {
    it('should revoke all non-revoked sessions in the family', async () => {
      prisma.session.updateMany.mockResolvedValue({ count: 3 });

      await sessionsService.revokeAllByFamily('family-1');

      expect(prisma.session.updateMany).toHaveBeenCalledWith({
        where: { tokenFamily: 'family-1', isRevoked: false },
        data: { isRevoked: true },
      });
    });
  });

  // ─── revokeSession ─────────────────────────────────────────────

  describe('revokeSession', () => {
    it('should revoke session when it belongs to the user', async () => {
      prisma.session.findUnique.mockResolvedValue(mockSession);
      prisma.session.update.mockResolvedValue({
        ...mockSession,
        isRevoked: true,
      });

      await sessionsService.revokeSession('session-1', 'user-1');

      expect(prisma.session.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: { isRevoked: true },
      });
    });

    it('should throw NotFoundException when session does not exist', async () => {
      prisma.session.findUnique.mockResolvedValue(null);

      await expect(
        sessionsService.revokeSession('nonexistent', 'user-1'),
      ).rejects.toThrow(NotFoundException);

      await expect(
        sessionsService.revokeSession('nonexistent', 'user-1'),
      ).rejects.toThrow('Resource not found');
    });

    it('should throw NotFoundException when session belongs to another user', async () => {
      prisma.session.findUnique.mockResolvedValue(mockSession);

      await expect(
        sessionsService.revokeSession('session-1', 'other-user'),
      ).rejects.toThrow(NotFoundException);
    });

    // SCRUM-347: pair DB revoke with Redis deny-list (instant invalidation)
    it('should call tokenDenyListService.denyBySessionId after revoking', async () => {
      prisma.session.findUnique.mockResolvedValue(mockSession);
      prisma.session.update.mockResolvedValue({
        ...mockSession,
        isRevoked: true,
      });

      await sessionsService.revokeSession('session-1', 'user-1');

      expect(tokenDenyListService.denyBySessionId).toHaveBeenCalledWith(
        'session-1',
        900, // ACCESS_TOKEN_TTL_SECONDS
      );
    });

    it('should NOT call denyBySessionId when session belongs to another user (NotFoundException short-circuits)', async () => {
      prisma.session.findUnique.mockResolvedValue(mockSession);

      await expect(
        sessionsService.revokeSession('session-1', 'other-user'),
      ).rejects.toThrow(NotFoundException);

      expect(tokenDenyListService.denyBySessionId).not.toHaveBeenCalled();
    });
  });

  // ─── revokeAllUserSessions ──────────────────────────────────────

  describe('revokeAllUserSessions', () => {
    it('should revoke all non-revoked sessions for a user', async () => {
      prisma.session.updateMany.mockResolvedValue({ count: 5 });

      await sessionsService.revokeAllUserSessions('user-1');

      expect(prisma.session.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRevoked: false },
        data: { isRevoked: true },
      });
    });

    // SCRUM-347: pair DB-mass-revoke with Redis user-level deny-list
    it('should call tokenDenyListService.denyAllForUser after revoking', async () => {
      prisma.session.updateMany.mockResolvedValue({ count: 3 });

      await sessionsService.revokeAllUserSessions('user-1');

      expect(tokenDenyListService.denyAllForUser).toHaveBeenCalledWith(
        'user-1',
        900, // ACCESS_TOKEN_TTL_SECONDS
      );
    });
  });

  // ─── getActiveSessions ─────────────────────────────────────────

  describe('getActiveSessions', () => {
    it('should return active sessions mapped to SessionResponse', async () => {
      const sessions = [
        mockSession,
        { ...mockSession, id: 'session-2', ipAddress: '10.0.0.1' },
      ];
      prisma.session.findMany.mockResolvedValue(sessions);

      const result = await sessionsService.getActiveSessions('user-1');

      expect(prisma.session.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          isRevoked: false,
          expiresAt: { gt: expect.any(Date) },
          lastUsedAt: { gte: expect.any(Date) },
        },
        orderBy: { lastUsedAt: 'desc' },
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'session-1',
        deviceInfo: 'Chrome on Windows',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        locationCity: null,
        locationCountry: null,
        createdAt: now.toISOString(),
        lastUsedAt: now.toISOString(),
        expiresAt: futureDate.toISOString(),
        isCurrent: false,
      });
    });

    it('should mark the current session with isCurrent=true', async () => {
      prisma.session.findMany.mockResolvedValue([mockSession]);

      const result = await sessionsService.getActiveSessions(
        'user-1',
        'session-1',
      );

      expect(result[0].isCurrent).toBe(true);
    });

    it('should return empty array when no active sessions', async () => {
      prisma.session.findMany.mockResolvedValue([]);

      const result = await sessionsService.getActiveSessions('user-1');

      expect(result).toEqual([]);
    });
  });

  // ─── updateSessionHash ─────────────────────────────────────────

  describe('updateSessionHash', () => {
    it('should update the refresh token hash', async () => {
      prisma.session.update.mockResolvedValue({
        ...mockSession,
        refreshTokenHash: 'new-hash',
      });

      await sessionsService.updateSessionHash('session-1', 'new-hash');

      expect(prisma.session.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: { refreshTokenHash: 'new-hash' },
      });
    });
  });

  // ─── isSessionIdle ────────────────────────────────────────────

  describe('isSessionIdle', () => {
    it('should return true when lastUsedAt is older than threshold', () => {
      // Default idle timeout is 0.5h (30 min) — 1 hour ago should be idle
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      expect(sessionsService.isSessionIdle(oneHourAgo)).toBe(true);
    });

    it('should return false when lastUsedAt is within threshold', () => {
      // Default idle timeout is 0.5h (30 min) — 10 minutes ago should NOT be idle
      const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000);
      expect(sessionsService.isSessionIdle(tenMinsAgo)).toBe(false);
    });

    it('should respect custom idle timeout parameter', () => {
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);

      expect(sessionsService.isSessionIdle(twoHoursAgo, 1)).toBe(true);
      expect(sessionsService.isSessionIdle(thirtyMinsAgo, 1)).toBe(false);
    });
  });

  // ─── getActiveNonIdleSessions ─────────────────────────────────

  describe('getActiveNonIdleSessions', () => {
    it('should query with correct where clause and orderBy', async () => {
      prisma.session.findMany.mockResolvedValue([mockSession]);

      await sessionsService.getActiveNonIdleSessions('user-1');

      expect(prisma.session.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          isRevoked: false,
          expiresAt: { gt: expect.any(Date) },
          lastUsedAt: { gte: expect.any(Date) },
        },
        orderBy: { lastUsedAt: 'asc' },
      });
    });

    it('should return sessions as Session[]', async () => {
      const sessions = [mockSession, { ...mockSession, id: 'session-2' }];
      prisma.session.findMany.mockResolvedValue(sessions);

      const result = await sessionsService.getActiveNonIdleSessions('user-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockSession);
    });

    it('should return empty array when no qualifying sessions', async () => {
      prisma.session.findMany.mockResolvedValue([]);

      const result = await sessionsService.getActiveNonIdleSessions('user-1');

      expect(result).toEqual([]);
    });
  });

  // ─── enforceSessionLimit ──────────────────────────────────────

  describe('enforceSessionLimit', () => {
    const makeSessions = (count: number): Session[] =>
      Array.from({ length: count }, (_, i) => ({
        ...mockSession,
        id: `session-${i + 1}`,
        lastUsedAt: new Date(now.getTime() - (count - i) * 60_000),
      }));

    it('should do nothing when active sessions are below limit', async () => {
      prisma.session.findMany.mockResolvedValue(makeSessions(3));

      await sessionsService.enforceSessionLimit('user-1');

      expect(prisma.session.update).not.toHaveBeenCalled();
    });

    it('should revoke oldest session when at limit', async () => {
      const sessions = makeSessions(5);
      prisma.session.findMany.mockResolvedValue(sessions);
      prisma.session.update.mockResolvedValue({
        ...sessions[0],
        isRevoked: true,
      });

      await sessionsService.enforceSessionLimit('user-1');

      expect(prisma.session.update).toHaveBeenCalledTimes(1);
      expect(prisma.session.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: { isRevoked: true },
      });
    });

    it('should revoke multiple sessions when over limit', async () => {
      const sessions = makeSessions(6);
      prisma.session.findMany.mockResolvedValue(sessions);
      prisma.session.update.mockResolvedValue({});

      await sessionsService.enforceSessionLimit('user-1');

      expect(prisma.session.update).toHaveBeenCalledTimes(2);
      expect(prisma.session.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: { isRevoked: true },
      });
      expect(prisma.session.update).toHaveBeenCalledWith({
        where: { id: 'session-2' },
        data: { isRevoked: true },
      });
    });

    it('should log SESSION_LIMIT_EXCEEDED audit event per eviction', async () => {
      const sessions = makeSessions(5);
      prisma.session.findMany.mockResolvedValue(sessions);
      prisma.session.update.mockResolvedValue({});

      await sessionsService.enforceSessionLimit('user-1', {
        ipAddress: '10.0.0.1',
        userAgent: 'Test-Agent',
      });

      expect(auditService.log).toHaveBeenCalledWith({
        action: AuditAction.SESSION_LIMIT_EXCEEDED,
        userId: 'user-1',
        ipAddress: '10.0.0.1',
        userAgent: 'Test-Agent',
        metadata: {
          revokedSessionId: 'session-1',
          reason: 'concurrent_session_limit',
          activeCount: 5,
          limit: 5,
        },
      });
    });

    it('should not fail when audit logging fails', async () => {
      const sessions = makeSessions(5);
      prisma.session.findMany.mockResolvedValue(sessions);
      prisma.session.update.mockResolvedValue({});
      auditService.log.mockRejectedValue(new Error('Audit failed'));

      await expect(
        sessionsService.enforceSessionLimit('user-1'),
      ).resolves.toBeUndefined();

      expect(prisma.session.update).toHaveBeenCalledTimes(1);
    });
  });

  // ─── revokeSessionDirect ────────────────────────────────────────

  describe('revokeSessionDirect', () => {
    it('should call prisma.session.update with isRevoked: true', async () => {
      prisma.session.update.mockResolvedValue({
        ...mockSession,
        isRevoked: true,
      });

      await sessionsService.revokeSessionDirect('session-1');

      expect(prisma.session.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: { isRevoked: true },
      });
    });

    it('should resolve without error', async () => {
      prisma.session.update.mockResolvedValue({
        ...mockSession,
        isRevoked: true,
      });

      await expect(
        sessionsService.revokeSessionDirect('session-1'),
      ).resolves.toBeUndefined();
    });
  });

  // ─── findPreviousActiveSessions ─────────────────────────────────

  describe('findPreviousActiveSessions', () => {
    it('should query with correct where clause and select', async () => {
      prisma.session.findMany.mockResolvedValue([]);

      await sessionsService.findPreviousActiveSessions('user-1', 'session-1');

      expect(prisma.session.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          id: { not: 'session-1' },
          isRevoked: false,
          expiresAt: { gt: expect.any(Date) },
        },
        select: { ipAddress: true, userAgent: true },
      });
    });

    it('should return matching sessions', async () => {
      const previousSessions = [
        { ipAddress: '10.0.0.1', userAgent: 'Firefox' },
        { ipAddress: '192.168.1.1', userAgent: 'Chrome' },
      ];
      prisma.session.findMany.mockResolvedValue(previousSessions);

      const result = await sessionsService.findPreviousActiveSessions(
        'user-1',
        'session-1',
      );

      expect(result).toEqual(previousSessions);
    });

    it('should return empty array when no matching sessions', async () => {
      prisma.session.findMany.mockResolvedValue([]);

      const result = await sessionsService.findPreviousActiveSessions(
        'user-1',
        'session-1',
      );

      expect(result).toEqual([]);
    });
  });
});
