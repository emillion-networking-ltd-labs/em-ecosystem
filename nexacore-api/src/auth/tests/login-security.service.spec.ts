import { ForbiddenException } from '@nestjs/common';
import { LoginSecurityService } from '../login-security.service';
import { AuditAction } from '../../audit/enums/audit-action.enum';
import { ImpossibleTravelResult } from '../../geolocation/interfaces/geolocation-result.interface';

describe('LoginSecurityService', () => {
  let service: LoginSecurityService;
  let impossibleTravelService: { detectImpossibleTravel: jest.Mock };
  let suspiciousLoginService: {
    analyzeLoginSuccess: jest.Mock;
    analyzeLoginFailure: jest.Mock;
  };
  let mailService: { sendLoginNotificationEmail: jest.Mock };
  let sessionsService: { findPreviousActiveSessions: jest.Mock };
  let auditService: { log: jest.Mock };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    mfaEnabled: false,
  };

  const requestMeta = { ipAddress: '127.0.0.1', userAgent: 'test-agent' };

  const mockTravelResult: ImpossibleTravelResult = {
    isAnomalous: true,
    previousLocation: {
      city: 'Madrid',
      country: 'Spain',
      countryCode: 'ES',
      latitude: 40.4,
      longitude: -3.7,
    },
    currentLocation: {
      city: 'Tokyo',
      country: 'Japan',
      countryCode: 'JP',
      latitude: 35.6,
      longitude: 139.6,
    },
    distanceKm: 10500,
    elapsedHours: 0.5,
    requiredSpeedKmh: 21000,
    strategy: 'block',
    actionTaken: 'blocked',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    impossibleTravelService = {
      detectImpossibleTravel: jest.fn().mockResolvedValue(null),
    };

    suspiciousLoginService = {
      analyzeLoginSuccess: jest.fn().mockResolvedValue(undefined),
      analyzeLoginFailure: jest.fn().mockResolvedValue(undefined),
    };

    mailService = {
      sendLoginNotificationEmail: jest.fn().mockResolvedValue(undefined),
    };

    sessionsService = {
      findPreviousActiveSessions: jest.fn().mockResolvedValue([]),
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    service = new LoginSecurityService(
      impossibleTravelService as any,
      suspiciousLoginService as any,
      mailService as any,
      sessionsService as any,
      auditService as any,
    );
  });

  // ─── checkImpossibleTravel ──────────────────────────────────────

  describe('checkImpossibleTravel', () => {
    it('should call detectImpossibleTravel with correct params and return result', async () => {
      impossibleTravelService.detectImpossibleTravel.mockResolvedValue(
        mockTravelResult,
      );

      const result = await service.checkImpossibleTravel(mockUser, requestMeta);

      expect(result).toEqual(mockTravelResult);
      expect(
        impossibleTravelService.detectImpossibleTravel,
      ).toHaveBeenCalledWith({
        userId: 'user-1',
        ipAddress: '127.0.0.1',
        email: 'test@example.com',
        firstName: 'Test',
        userAgent: 'test-agent',
        mfaEnabled: false,
      });
    });

    it('should return null when detectImpossibleTravel throws', async () => {
      impossibleTravelService.detectImpossibleTravel.mockRejectedValue(
        new Error('Geolocation service down'),
      );

      const result = await service.checkImpossibleTravel(mockUser, requestMeta);

      expect(result).toBeNull();
    });
  });

  // ─── handleTravelBlock ──────────────────────────────────────────

  describe('handleTravelBlock', () => {
    it('should log audit event with travel metadata', () => {
      try {
        service.handleTravelBlock(mockTravelResult, 'user-1', requestMeta);
      } catch {
        // Expected ForbiddenException
      }

      expect(auditService.log).toHaveBeenCalledWith({
        action: AuditAction.LOGIN_BLOCKED_TRAVEL,
        userId: 'user-1',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        metadata: {
          previousLocation: mockTravelResult.previousLocation,
          currentLocation: mockTravelResult.currentLocation,
          distanceKm: 10500,
          elapsedHours: 0.5,
          requiredSpeedKmh: 21000,
        },
      });
    });

    it('should throw ForbiddenException', () => {
      expect(() =>
        service.handleTravelBlock(mockTravelResult, 'user-1', requestMeta),
      ).toThrow(ForbiddenException);
    });
  });

  // ─── checkSuspiciousLoginSuccess ────────────────────────────────

  describe('checkSuspiciousLoginSuccess', () => {
    it('should call analyzeLoginSuccess with correct params', () => {
      service.checkSuspiciousLoginSuccess(mockUser, requestMeta);

      expect(suspiciousLoginService.analyzeLoginSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          email: 'test@example.com',
          firstName: 'Test',
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        }),
      );
    });

    it('should not throw when analyzeLoginSuccess rejects', async () => {
      suspiciousLoginService.analyzeLoginSuccess.mockRejectedValue(
        new Error('Analysis service down'),
      );

      expect(() =>
        service.checkSuspiciousLoginSuccess(mockUser, requestMeta),
      ).not.toThrow();
    });
  });

  // ─── checkSuspiciousLoginFailure ────────────────────────────────

  describe('checkSuspiciousLoginFailure', () => {
    it('should call analyzeLoginFailure with correct params', () => {
      service.checkSuspiciousLoginFailure('user-1', requestMeta);

      expect(suspiciousLoginService.analyzeLoginFailure).toHaveBeenCalledWith({
        userId: 'user-1',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      });
    });

    it('should return early when userId is undefined', () => {
      service.checkSuspiciousLoginFailure(undefined, requestMeta);

      expect(suspiciousLoginService.analyzeLoginFailure).not.toHaveBeenCalled();
    });

    it('should not throw when analyzeLoginFailure rejects', async () => {
      suspiciousLoginService.analyzeLoginFailure.mockRejectedValue(
        new Error('Analysis service down'),
      );

      expect(() =>
        service.checkSuspiciousLoginFailure('user-1', requestMeta),
      ).not.toThrow();
    });
  });

  // ─── notifyIfNewDevice ──────────────────────────────────────────

  describe('notifyIfNewDevice', () => {
    it('should not send email when no previous sessions exist', async () => {
      sessionsService.findPreviousActiveSessions.mockResolvedValue([]);

      await service.notifyIfNewDevice(mockUser, 'session-1', requestMeta);

      expect(mailService.sendLoginNotificationEmail).not.toHaveBeenCalled();
    });

    it('should not send email when IP and userAgent both match', async () => {
      sessionsService.findPreviousActiveSessions.mockResolvedValue([
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
      ]);

      await service.notifyIfNewDevice(mockUser, 'session-1', requestMeta);

      expect(mailService.sendLoginNotificationEmail).not.toHaveBeenCalled();
    });

    it('should send email when IP differs from all previous sessions', async () => {
      sessionsService.findPreviousActiveSessions.mockResolvedValue([
        { ipAddress: '10.0.0.1', userAgent: 'test-agent' },
      ]);

      await service.notifyIfNewDevice(mockUser, 'session-1', requestMeta);

      expect(mailService.sendLoginNotificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        '127.0.0.1',
        'test-agent',
        'Test',
      );
    });

    it('should send email when userAgent differs from all previous sessions', async () => {
      sessionsService.findPreviousActiveSessions.mockResolvedValue([
        { ipAddress: '127.0.0.1', userAgent: 'other-agent' },
      ]);

      await service.notifyIfNewDevice(mockUser, 'session-1', requestMeta);

      expect(mailService.sendLoginNotificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        '127.0.0.1',
        'test-agent',
        'Test',
      );
    });

    it('should not send email when IP known in session 1 and UA known in session 2', async () => {
      sessionsService.findPreviousActiveSessions.mockResolvedValue([
        { ipAddress: '127.0.0.1', userAgent: 'other-agent' },
        { ipAddress: '10.0.0.1', userAgent: 'test-agent' },
      ]);

      await service.notifyIfNewDevice(mockUser, 'session-1', requestMeta);

      expect(mailService.sendLoginNotificationEmail).not.toHaveBeenCalled();
    });

    it('should handle null userAgent by coalescing to null for comparison', async () => {
      sessionsService.findPreviousActiveSessions.mockResolvedValue([
        { ipAddress: '127.0.0.1', userAgent: null },
      ]);

      await service.notifyIfNewDevice(mockUser, 'session-1', {
        ipAddress: '127.0.0.1',
        userAgent: null,
      });

      expect(mailService.sendLoginNotificationEmail).not.toHaveBeenCalled();
    });

    it('should treat undefined userAgent as null for comparison', async () => {
      sessionsService.findPreviousActiveSessions.mockResolvedValue([
        { ipAddress: '127.0.0.1', userAgent: null },
      ]);

      await service.notifyIfNewDevice(mockUser, 'session-1', {
        ipAddress: '127.0.0.1',
        userAgent: undefined,
      });

      expect(mailService.sendLoginNotificationEmail).not.toHaveBeenCalled();
    });

    it('should coalesce undefined userAgent to null when sending notification email', async () => {
      sessionsService.findPreviousActiveSessions.mockResolvedValue([
        { ipAddress: '10.0.0.1', userAgent: 'other-agent' },
      ]);

      await service.notifyIfNewDevice(mockUser, 'session-1', {
        ipAddress: '127.0.0.1',
        userAgent: undefined,
      });

      expect(mailService.sendLoginNotificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        '127.0.0.1',
        null,
        'Test',
      );
    });
  });

  // ─── checkSuspiciousLoginSuccess — edge cases ────────────────────

  describe('checkSuspiciousLoginSuccess — edge cases', () => {
    it('should coalesce null firstName to null', () => {
      const userWithNullName = { ...mockUser, firstName: null };
      service.checkSuspiciousLoginSuccess(userWithNullName, requestMeta);

      expect(suspiciousLoginService.analyzeLoginSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: null,
        }),
      );
    });

    it('should coalesce undefined firstName to null', () => {
      const userNoName = { id: 'user-1', email: 'test@example.com' };
      service.checkSuspiciousLoginSuccess(userNoName, requestMeta);

      expect(suspiciousLoginService.analyzeLoginSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: null,
        }),
      );
    });

    it('should coalesce null userAgent to null in requestMeta', () => {
      service.checkSuspiciousLoginSuccess(mockUser, {
        ipAddress: '127.0.0.1',
        userAgent: null,
      });

      expect(suspiciousLoginService.analyzeLoginSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          userAgent: null,
        }),
      );
    });
  });

  // ─── checkSuspiciousLoginFailure — edge cases ────────────────────

  describe('checkSuspiciousLoginFailure — edge cases', () => {
    it('should coalesce null userAgent to null', () => {
      service.checkSuspiciousLoginFailure('user-1', {
        ipAddress: '127.0.0.1',
        userAgent: null,
      });

      expect(suspiciousLoginService.analyzeLoginFailure).toHaveBeenCalledWith({
        userId: 'user-1',
        ipAddress: '127.0.0.1',
        userAgent: null,
      });
    });
  });
});
