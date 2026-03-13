import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SessionController } from '../session.controller';
import { SessionsService } from '../../sessions/sessions.service';
import { TrustedDeviceService } from '../trusted-device.service';
import { AuditService } from '../../audit/audit.service';
import { TurnstileService } from '../../security/turnstile.service';
import { ErrorMessages } from '../../common/constants/error-messages';

describe('SessionController', () => {
  let controller: SessionController;
  let sessionsService: jest.Mocked<SessionsService>;
  let jwtSvc: jest.Mocked<JwtService>;
  let trustedDeviceService: jest.Mocked<TrustedDeviceService>;

  const mockReq = {
    ip: '127.0.0.1',
    headers: { 'user-agent': 'test-agent' },
    cookies: {},
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionController],
      providers: [
        {
          provide: SessionsService,
          useValue: {
            getActiveSessions: jest.fn(),
            revokeSession: jest.fn(),
          },
        },
        {
          provide: TrustedDeviceService,
          useValue: {
            trustDevice: jest.fn(),
            listTrustedDevices: jest.fn(),
            revokeDevice: jest.fn(),
            revokeAllDevices: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: TurnstileService,
          useValue: {
            verify: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    controller = module.get<SessionController>(SessionController);
    sessionsService = module.get(SessionsService);
    jwtSvc = module.get(JwtService);
    trustedDeviceService = module.get(TrustedDeviceService);
  });

  // ─── Session Endpoints ──────────────────────────────────────

  describe('getSessions', () => {
    it('should return active sessions for the current user', async () => {
      const mockSessions = [
        {
          id: 'sess-1',
          deviceInfo: null,
          ipAddress: '127.0.0.1',
          userAgent: 'test',
          createdAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
          expiresAt: new Date().toISOString(),
          isCurrent: false,
        },
      ];
      const reqWithUser = { ...mockReq, user: { id: 'uuid-123' } };
      sessionsService.getActiveSessions.mockResolvedValue(mockSessions as any);

      const result = await controller.getSessions(reqWithUser);

      expect(sessionsService.getActiveSessions).toHaveBeenCalledWith(
        'uuid-123',
        undefined,
      );
      expect(result).toEqual(mockSessions);
    });

    it('should extract current session ID from cookie', async () => {
      jwtSvc.verify.mockReturnValue({
        sub: 'uuid-123',
        sessionId: 'current-sess',
        family: 'fam-1',
      });
      sessionsService.getActiveSessions.mockResolvedValue([]);
      const reqWithCookieAndUser = {
        ...mockReq,
        cookies: { refresh_token: 'some-jwt' },
        user: { id: 'uuid-123' },
      };

      await controller.getSessions(reqWithCookieAndUser);

      expect(sessionsService.getActiveSessions).toHaveBeenCalledWith(
        'uuid-123',
        'current-sess',
      );
    });
  });

  describe('revokeSession', () => {
    it('should revoke the specified session', async () => {
      const reqWithUser = { ...mockReq, user: { id: 'uuid-123' } };
      sessionsService.revokeSession.mockResolvedValue(undefined);

      const result = await controller.revokeSession('session-id', reqWithUser);

      expect(sessionsService.revokeSession).toHaveBeenCalledWith(
        'session-id',
        'uuid-123',
      );
      expect(result.message).toBe('Session revoked');
    });
  });

  // ─── Trusted Device Endpoints ──────────────────────────────

  describe('trustDevice', () => {
    const mockAuthReq = {
      ...mockReq,
      user: { id: 'uuid-123' },
    };

    it('should trust device and return id, deviceName, expiresAt', async () => {
      const mockDevice = {
        id: 'device-1',
        deviceName: 'Chrome on Windows',
        expiresAt: new Date('2026-04-02'),
      };
      trustedDeviceService.trustDevice.mockResolvedValue(mockDevice as any);

      const result = await controller.trustDevice(
        { fingerprint: 'abcdef1234567890' },
        mockAuthReq,
      );

      expect(result).toEqual({
        id: 'device-1',
        deviceName: 'Chrome on Windows',
        expiresAt: mockDevice.expiresAt,
      });
      expect(trustedDeviceService.trustDevice).toHaveBeenCalledWith(
        'uuid-123',
        'abcdef1234567890',
        '127.0.0.1',
        'test-agent',
      );
    });
  });

  describe('listTrustedDevices', () => {
    const mockAuthReq = {
      ...mockReq,
      user: { id: 'uuid-123' },
    };

    it('should return list of trusted devices', async () => {
      const devices = [{ id: 'device-1', deviceName: 'Chrome on Windows' }];
      trustedDeviceService.listTrustedDevices.mockResolvedValue(devices as any);

      const result = await controller.listTrustedDevices(mockAuthReq);

      expect(result).toEqual(devices);
      expect(trustedDeviceService.listTrustedDevices).toHaveBeenCalledWith(
        'uuid-123',
      );
    });
  });

  describe('revokeAllTrustedDevices', () => {
    const mockAuthReq = {
      ...mockReq,
      user: { id: 'uuid-123' },
    };

    it('should revoke all devices and return count', async () => {
      trustedDeviceService.revokeAllDevices.mockResolvedValue(3);

      const result = await controller.revokeAllTrustedDevices(mockAuthReq);

      expect(result).toEqual({
        message: 'All trusted devices revoked',
        count: 3,
      });
    });
  });

  describe('revokeTrustedDevice', () => {
    const mockAuthReq = {
      ...mockReq,
      user: { id: 'uuid-123' },
    };

    it('should revoke a specific device', async () => {
      trustedDeviceService.revokeDevice.mockResolvedValue(undefined);

      const result = await controller.revokeTrustedDevice(
        'device-uuid',
        mockAuthReq,
      );

      expect(result).toEqual({ message: 'Device trust revoked' });
      expect(trustedDeviceService.revokeDevice).toHaveBeenCalledWith(
        'uuid-123',
        'device-uuid',
      );
    });

    it('should propagate NotFoundException when device not found', async () => {
      trustedDeviceService.revokeDevice.mockRejectedValue(
        new NotFoundException(ErrorMessages.device.NOT_FOUND),
      );

      await expect(
        controller.revokeTrustedDevice('unknown-id', mockAuthReq),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
