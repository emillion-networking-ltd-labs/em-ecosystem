import { UnauthorizedException } from '@nestjs/common';
import { OAuthAuthService } from '../oauth-auth.service';
import { AuditAction } from '../../audit/enums/audit-action.enum';
import { Provider } from '../../users/enums/provider.enum';
import { Role } from '../../users/enums/role.enum';
import { User } from '../../users/entities/user.entity';

describe('OAuthAuthService', () => {
  let service: OAuthAuthService;
  let usersService: {
    findOrCreateByOAuth: jest.Mock;
    findById: jest.Mock;
    linkOAuthProvider: jest.Mock;
    resetLockoutEscalation: jest.Mock;
  };
  let oauthCodeStore: { store: jest.Mock; exchange: jest.Mock };
  let tokenService: {
    generateTokens: jest.Mock;
    buildRefreshCookie: jest.Mock;
  };
  let loginSecurityService: {
    checkImpossibleTravel: jest.Mock;
    handleTravelBlock: jest.Mock;
    notifyIfNewDevice: jest.Mock;
    checkSuspiciousLoginSuccess: jest.Mock;
  };
  let auditService: { log: jest.Mock };

  const mockUser: User = {
    id: 'uuid-123',
    email: 'test@example.com',
    passwordHash: null,
    firstName: 'Test',
    lastName: 'User',
    avatarUrl: null,
    role: Role.USER,
    emailVerified: true,
    pendingEmail: null,
    isActive: true,
    failedAttempts: 0,
    lockedUntil: null,
    lockoutCount: 0,
    mfaEnabled: false,
    mfaSecret: null,
    mfaRecoveryCodes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCookie = {
    name: 'refresh_token',
    value: 'signed-jwt',
    options: {
      httpOnly: true,
      secure: false,
      sameSite: 'strict' as const,
      path: '/',
      maxAge: 604800,
    },
  };

  const requestMeta = { ipAddress: '127.0.0.1', userAgent: 'test-agent' };

  const mockProfile = {
    email: 'test@example.com',
    provider: Provider.GOOGLE,
    providerId: 'google-id-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    usersService = {
      findOrCreateByOAuth: jest
        .fn()
        .mockResolvedValue({ user: mockUser, action: 'login' }),
      findById: jest.fn().mockResolvedValue(mockUser),
      linkOAuthProvider: jest.fn().mockResolvedValue(undefined),
      resetLockoutEscalation: jest.fn().mockResolvedValue(undefined),
    };

    oauthCodeStore = {
      store: jest.fn().mockResolvedValue('ephemeral-code'),
      exchange: jest.fn(),
    };

    tokenService = {
      generateTokens: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        sessionId: 'session-1',
      }),
      buildRefreshCookie: jest.fn().mockReturnValue(mockCookie),
    };

    loginSecurityService = {
      checkImpossibleTravel: jest.fn().mockResolvedValue(null),
      handleTravelBlock: jest.fn(),
      notifyIfNewDevice: jest.fn().mockResolvedValue(undefined),
      checkSuspiciousLoginSuccess: jest.fn(),
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    service = new OAuthAuthService(
      usersService as any,
      oauthCodeStore as any,
      tokenService as any,
      loginSecurityService as any,
      auditService as any,
    );
  });

  // ─── validateOAuthUser ──────────────────────────────────────────

  describe('validateOAuthUser', () => {
    it('should return AuthResult with tokens on successful login', async () => {
      const result = await service.validateOAuthUser(mockProfile, requestMeta);

      expect(result.accessToken).toBe('access-token');
      expect(result.user.email).toBe('test@example.com');
      expect(result.cookie).toEqual(mockCookie);
      expect(result.oauthAction).toBe('login');
    });

    it('should reset lockout when user has failedAttempts > 0', async () => {
      usersService.findOrCreateByOAuth.mockResolvedValue({
        user: { ...mockUser, failedAttempts: 3 },
        action: 'login',
      });

      await service.validateOAuthUser(mockProfile, requestMeta);

      expect(usersService.resetLockoutEscalation).toHaveBeenCalledWith(
        'uuid-123',
      );
    });

    it('should reset lockout when user has lockoutCount > 0', async () => {
      usersService.findOrCreateByOAuth.mockResolvedValue({
        user: { ...mockUser, lockoutCount: 2 },
        action: 'login',
      });

      await service.validateOAuthUser(mockProfile, requestMeta);

      expect(usersService.resetLockoutEscalation).toHaveBeenCalledWith(
        'uuid-123',
      );
    });

    it('should NOT reset lockout when failedAttempts=0 and lockoutCount=0', async () => {
      await service.validateOAuthUser(mockProfile, requestMeta);

      expect(usersService.resetLockoutEscalation).not.toHaveBeenCalled();
    });

    it('should handle impossible travel blocked result', async () => {
      const travelResult = {
        isAnomalous: true,
        actionTaken: 'blocked',
        previousLocation: { city: 'Madrid', country: 'Spain' },
        currentLocation: { city: 'Tokyo', country: 'Japan' },
        distanceKm: 10500,
        elapsedHours: 0.5,
        requiredSpeedKmh: 21000,
      };
      loginSecurityService.checkImpossibleTravel.mockResolvedValue(
        travelResult,
      );

      await service.validateOAuthUser(mockProfile, requestMeta);

      expect(loginSecurityService.handleTravelBlock).toHaveBeenCalledWith(
        travelResult,
        'uuid-123',
        requestMeta,
      );
    });

    it('should NOT call handleTravelBlock when travel is not anomalous', async () => {
      loginSecurityService.checkImpossibleTravel.mockResolvedValue({
        isAnomalous: false,
      });

      await service.validateOAuthUser(mockProfile, requestMeta);

      expect(loginSecurityService.handleTravelBlock).not.toHaveBeenCalled();
    });

    it('should NOT call handleTravelBlock when action is not blocked', async () => {
      loginSecurityService.checkImpossibleTravel.mockResolvedValue({
        isAnomalous: true,
        actionTaken: 'challenged',
      });

      await service.validateOAuthUser(mockProfile, requestMeta);

      expect(loginSecurityService.handleTravelBlock).not.toHaveBeenCalled();
    });

    it('should map oauthAction to correct audit action', async () => {
      usersService.findOrCreateByOAuth.mockResolvedValue({
        user: mockUser,
        action: 'created',
      });

      await service.validateOAuthUser(mockProfile, requestMeta);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.OAUTH_REGISTER,
        }),
      );
    });

    it('should map linked action to OAUTH_LINKED audit action', async () => {
      usersService.findOrCreateByOAuth.mockResolvedValue({
        user: mockUser,
        action: 'linked',
      });

      await service.validateOAuthUser(mockProfile, requestMeta);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.OAUTH_LINKED,
        }),
      );
    });

    it('should fallback to OAUTH_LOGIN for unknown action', async () => {
      usersService.findOrCreateByOAuth.mockResolvedValue({
        user: mockUser,
        action: 'unknown_action',
      });

      await service.validateOAuthUser(mockProfile, requestMeta);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.OAUTH_LOGIN,
        }),
      );
    });

    it('should swallow notifyIfNewDevice fire-and-forget error', async () => {
      loginSecurityService.notifyIfNewDevice.mockRejectedValue(
        new Error('Mail service down'),
      );

      const result = await service.validateOAuthUser(mockProfile, requestMeta);

      expect(result.accessToken).toBe('access-token');
    });

    it('should swallow audit log fire-and-forget error', async () => {
      auditService.log.mockRejectedValue(new Error('Audit DB down'));

      const result = await service.validateOAuthUser(mockProfile, requestMeta);

      expect(result.accessToken).toBe('access-token');
    });
  });

  // ─── validateOAuthLink ──────────────────────────────────────────

  describe('validateOAuthLink', () => {
    it('should link provider and return AuthResult', async () => {
      const result = await service.validateOAuthLink(
        'uuid-123',
        mockProfile,
        requestMeta,
      );

      expect(usersService.linkOAuthProvider).toHaveBeenCalledWith(
        'uuid-123',
        mockProfile,
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
      );
      expect(result.accessToken).toBe('access-token');
      expect(result.oauthAction).toBe('linked');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(
        service.validateOAuthLink('nonexistent', mockProfile, requestMeta),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should pass null userAgent when not provided', async () => {
      const metaNoAgent = { ipAddress: '127.0.0.1', userAgent: undefined };

      await service.validateOAuthLink('uuid-123', mockProfile, metaNoAgent);

      expect(usersService.linkOAuthProvider).toHaveBeenCalledWith(
        'uuid-123',
        mockProfile,
        { ipAddress: '127.0.0.1', userAgent: null },
      );
    });
  });

  // ─── generateOAuthCode ──────────────────────────────────────────

  describe('generateOAuthCode', () => {
    it('should store payload and return code', async () => {
      const payload = {
        accessToken: 'at',
        user: mockUser as any,
        cookie: mockCookie,
        oauthAction: 'login' as const,
      };

      const result = await service.generateOAuthCode(payload);

      expect(oauthCodeStore.store).toHaveBeenCalledWith(payload);
      expect(result).toBe('ephemeral-code');
    });
  });

  // ─── exchangeOAuthCode ──────────────────────────────────────────

  describe('exchangeOAuthCode', () => {
    it('should return payload when code is valid', async () => {
      const payload = {
        accessToken: 'at',
        user: mockUser as any,
        cookie: mockCookie,
      };
      oauthCodeStore.exchange.mockResolvedValue(payload);

      const result = await service.exchangeOAuthCode('valid-code');

      expect(result).toEqual(payload);
    });

    it('should throw UnauthorizedException when payload is null', async () => {
      oauthCodeStore.exchange.mockResolvedValue(null);

      await expect(service.exchangeOAuthCode('invalid-code')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ─── mfaEnabled nullish coalescing ──────────────────────────────

  describe('validateOAuthUser — mfaEnabled nullish coalescing', () => {
    it('should coalesce undefined mfaEnabled to false for impossible travel check', async () => {
      const userNoMfa = { ...mockUser, mfaEnabled: undefined as any };
      usersService.findOrCreateByOAuth.mockResolvedValue({
        user: userNoMfa,
        action: 'login',
      });

      const result = await service.validateOAuthUser(mockProfile, requestMeta);

      expect(result.accessToken).toBe('access-token');
      expect(loginSecurityService.checkImpossibleTravel).toHaveBeenCalledWith(
        expect.objectContaining({ mfaEnabled: false }),
        requestMeta,
      );
    });
  });
});
