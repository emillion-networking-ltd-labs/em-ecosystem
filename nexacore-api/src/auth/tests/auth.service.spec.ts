import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { SessionsService } from '../../sessions/sessions.service';
import { Role } from '../../users/enums/role.enum';
import { Provider } from '../../users/enums/provider.enum';
import { User } from '../../users/entities/user.entity';
import { OAuthProfile } from '../../common/interfaces/oauth-profile.interface';
import { OAuthCodeStore } from '../stores/oauth-code.store';
import { PasswordBreachService } from '../password-breach.service';
import { TrustedDeviceService } from '../trusted-device.service';
import { ImpossibleTravelService } from '../../geolocation/impossible-travel.service';
import { SuspiciousLoginService } from '../../security/suspicious-login.service';
import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';

jest.mock('bcrypt');

describe('parseDurationMs (via AuthService constructor)', () => {
  const createServiceWithExpiry = async (expiry: string) => {
    process.env.JWT_REFRESH_EXPIRATION = expiry;
    const mod = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: { findByEmail: jest.fn() } },
        { provide: SessionsService, useValue: {} },
        { provide: JwtService, useValue: { sign: jest.fn(), verify: jest.fn() } },
        { provide: OAuthCodeStore, useValue: {} },
        { provide: AuditService, useValue: { log: jest.fn().mockResolvedValue(undefined) } },
        { provide: PasswordBreachService, useValue: { isBreached: jest.fn().mockResolvedValue(false) } },
        { provide: PrismaService, useValue: {} },
        { provide: MailService, useValue: {} },
        { provide: TrustedDeviceService, useValue: { isTrustedDevice: jest.fn().mockResolvedValue(false) } },
        { provide: ImpossibleTravelService, useValue: { detectImpossibleTravel: jest.fn().mockResolvedValue(null) } },
        { provide: SuspiciousLoginService, useValue: { analyzeLoginFailure: jest.fn().mockResolvedValue(undefined), analyzeLoginSuccess: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();
    return mod.get<AuthService>(AuthService);
  };

  afterEach(() => {
    delete process.env.JWT_REFRESH_EXPIRATION;
  });

  it('should parse seconds (30s)', async () => {
    const svc = await createServiceWithExpiry('30s');
    expect((svc as any).refreshMaxAgeMs).toBe(30 * 1000);
  });

  it('should parse minutes (15m)', async () => {
    const svc = await createServiceWithExpiry('15m');
    expect((svc as any).refreshMaxAgeMs).toBe(15 * 60 * 1000);
  });

  it('should parse hours (2h)', async () => {
    const svc = await createServiceWithExpiry('2h');
    expect((svc as any).refreshMaxAgeMs).toBe(2 * 60 * 60 * 1000);
  });

  it('should parse days (7d)', async () => {
    const svc = await createServiceWithExpiry('7d');
    expect((svc as any).refreshMaxAgeMs).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('should fallback to 7 days for invalid format', async () => {
    const svc = await createServiceWithExpiry('invalid');
    expect((svc as any).refreshMaxAgeMs).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let sessionsService: jest.Mocked<SessionsService>;
  let jwtService: jest.Mocked<JwtService>;
  let oauthCodeStore: jest.Mocked<OAuthCodeStore>;
  let passwordBreachService: jest.Mocked<PasswordBreachService>;
  let trustedDeviceService: jest.Mocked<TrustedDeviceService>;
  let impossibleTravelService: jest.Mocked<ImpossibleTravelService>;
  let suspiciousLoginService: jest.Mocked<SuspiciousLoginService>;

  const mockUser: User = {
    id: 'uuid-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    firstName: null,
    lastName: null,
    avatarUrl: null,
    role: Role.USER,
    provider: Provider.LOCAL,
    providerId: null,
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

  const requestMeta = { ipAddress: '127.0.0.1', userAgent: 'test-agent' };

  const mockSession = {
    id: 'session-uuid',
    userId: 'uuid-123',
    tokenFamily: 'family-uuid',
    refreshTokenHash: 'hashed',
    deviceInfo: null,
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    isRevoked: false,
    createdAt: new Date(),
    lastUsedAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            incrementFailedAttempts: jest.fn(),
            resetFailedAttempts: jest.fn(),
            resetLockoutEscalation: jest.fn(),
            lockAccount: jest.fn(),
            findOrCreateByOAuth: jest.fn(),
          },
        },
        {
          provide: SessionsService,
          useValue: {
            createSession: jest.fn().mockResolvedValue(mockSession),
            findById: jest.fn(),
            rotateRefreshToken: jest.fn().mockResolvedValue(mockSession),
            revokeSession: jest.fn(),
            revokeAllUserSessions: jest.fn(),
            getActiveSessions: jest.fn(),
            updateSessionHash: jest.fn(),
            isSessionIdle: jest.fn().mockReturnValue(false),
            getActiveNonIdleSessions: jest.fn().mockResolvedValue([]),
            enforceSessionLimit: jest.fn().mockResolvedValue(undefined),
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
          provide: OAuthCodeStore,
          useValue: {
            store: jest.fn(),
            exchange: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: PasswordBreachService,
          useValue: {
            isBreached: jest.fn().mockResolvedValue(false),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            emailVerificationToken: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            passwordResetToken: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
            user: {
              update: jest.fn(),
            },
            session: {
              findMany: jest.fn().mockResolvedValue([]),
              update: jest.fn().mockResolvedValue(undefined),
            },
            $transaction: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
            sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
            sendLoginNotificationEmail: jest.fn().mockResolvedValue(undefined),
            sendEmailChangeVerificationEmail: jest.fn().mockResolvedValue(undefined),
            sendEmailChangeRequestNotification: jest.fn().mockResolvedValue(undefined),
            sendEmailChangedConfirmation: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: TrustedDeviceService,
          useValue: {
            isTrustedDevice: jest.fn().mockResolvedValue(false),
            revokeAllDevices: jest.fn().mockResolvedValue(0),
          },
        },
        {
          provide: ImpossibleTravelService,
          useValue: {
            detectImpossibleTravel: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: SuspiciousLoginService,
          useValue: {
            analyzeLoginFailure: jest.fn().mockResolvedValue(undefined),
            analyzeLoginSuccess: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    sessionsService = module.get(SessionsService);
    jwtService = module.get(JwtService);
    oauthCodeStore = module.get(OAuthCodeStore);
    passwordBreachService = module.get(PasswordBreachService);
    trustedDeviceService = module.get(TrustedDeviceService);
    impossibleTravelService = module.get(ImpossibleTravelService);
    suspiciousLoginService = module.get(SuspiciousLoginService);
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'StrongPass1!',
    };

    describe('successful registration', () => {
      beforeEach(() => {
        usersService.findByEmail.mockResolvedValue(null);
        usersService.create.mockResolvedValue(mockUser);
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-value');
      });

      it('should create a new user with hashed password and return message + user', async () => {
        const result = await authService.register(registerDto, requestMeta);

        expect(result.message).toBe('Verification email sent');
        expect(result.user).toBeDefined();
        expect(result).not.toHaveProperty('accessToken');
        expect(result).not.toHaveProperty('cookie');
      });

      it('should hash the password with bcrypt using 12 rounds', async () => {
        await authService.register(registerDto, requestMeta);

        expect(bcrypt.hash).toHaveBeenCalledWith('StrongPass1!', 12);
      });

      it('should return SafeUser without passwordHash', async () => {
        const result = await authService.register(registerDto, requestMeta);

        expect(result.user).not.toHaveProperty('passwordHash');
        expect(result.user.email).toBe('test@example.com');
      });

      it('should NOT create a session on register', async () => {
        await authService.register(registerDto, requestMeta);

        expect(sessionsService.createSession).not.toHaveBeenCalled();
      });

      it('should NOT call generateTokens on register', async () => {
        await authService.register(registerDto, requestMeta);

        expect(jwtService.sign).not.toHaveBeenCalled();
      });
    });

    describe('error cases', () => {
      it('should throw ConflictException when email already exists', async () => {
        usersService.findByEmail.mockResolvedValue(mockUser);

        await expect(
          authService.register(registerDto, requestMeta),
        ).rejects.toThrow(ConflictException);
      });

      it('should throw BadRequestException when password is breached', async () => {
        usersService.findByEmail.mockResolvedValue(null);
        passwordBreachService.isBreached.mockResolvedValue(true);

        await expect(
          authService.register(registerDto, requestMeta),
        ).rejects.toThrow(BadRequestException);

        expect(usersService.create).not.toHaveBeenCalled();
      });
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'StrongPass1!' };

    describe('successful login', () => {
      beforeEach(() => {
        usersService.findByEmail.mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
        jwtService.sign
          .mockReturnValueOnce('access-token')
          .mockReturnValueOnce('refresh-token');
        sessionsService.createSession.mockResolvedValue(mockSession);
        sessionsService.updateSessionHash.mockResolvedValue(undefined);
      });

      it('should return accessToken, cookie, and SafeUser on valid credentials', async () => {
        const result = await authService.login(loginDto, requestMeta);

        expect(result.accessToken).toBe('access-token');
        expect(result.cookie).toBeDefined();
        expect(result.cookie.name).toBe('refresh_token');
        expect(result.user.email).toBe('test@example.com');
        expect(result.user).not.toHaveProperty('passwordHash');
      });

      it('should reset failed attempts on successful login when count > 0', async () => {
        usersService.findByEmail.mockResolvedValue({
          ...mockUser,
          failedAttempts: 3,
        });

        await authService.login(loginDto, requestMeta);

        expect(usersService.resetLockoutEscalation).toHaveBeenCalledWith(
          'uuid-123',
        );
      });

      it('should not reset failed attempts when count is 0', async () => {
        await authService.login(loginDto, requestMeta);

        expect(usersService.resetLockoutEscalation).not.toHaveBeenCalled();
      });
    });

    describe('error cases', () => {
      it('should throw UnauthorizedException when user not found (with timing protection)', async () => {
        usersService.findByEmail.mockResolvedValue(null);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        await expect(
          authService.login(loginDto, requestMeta),
        ).rejects.toThrow(UnauthorizedException);
        expect(bcrypt.compare).toHaveBeenCalled();
      });

      it('should throw ForbiddenException when account is locked', async () => {
        usersService.findByEmail.mockResolvedValue({
          ...mockUser,
          lockedUntil: new Date(Date.now() + 60000),
        });

        await expect(
          authService.login(loginDto, requestMeta),
        ).rejects.toThrow(ForbiddenException);
      });

      it('should throw ForbiddenException when LOCAL user email is not verified', async () => {
        usersService.findByEmail.mockResolvedValue({
          ...mockUser,
          emailVerified: false,
          provider: Provider.LOCAL,
        });
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        await expect(
          authService.login(loginDto, requestMeta),
        ).rejects.toThrow(ForbiddenException);
      });

      it('should allow login for OAuth user with unverified email', async () => {
        usersService.findByEmail.mockResolvedValue({
          ...mockUser,
          emailVerified: false,
          provider: Provider.GOOGLE,
        });
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        jwtService.sign.mockReturnValue('token');
        sessionsService.createSession.mockResolvedValue(mockSession);
        sessionsService.updateSessionHash.mockResolvedValue(undefined);

        const result = await authService.login(loginDto, requestMeta);
        expect(result).toHaveProperty('accessToken');
      });

      it('should reset lockout when lock has expired', async () => {
        usersService.findByEmail.mockResolvedValue({
          ...mockUser,
          lockedUntil: new Date(Date.now() - 1000),
        });
        usersService.resetFailedAttempts.mockResolvedValue(undefined);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
        jwtService.sign.mockReturnValue('token');
        sessionsService.createSession.mockResolvedValue(mockSession);
        sessionsService.updateSessionHash.mockResolvedValue(undefined);

        await authService.login(loginDto, requestMeta);

        expect(usersService.resetFailedAttempts).toHaveBeenCalledWith(
          'uuid-123',
        );
      });

      it('should throw UnauthorizedException when user has no passwordHash (OAuth-only) without incrementing failedAttempts', async () => {
        usersService.findByEmail.mockResolvedValue({
          ...mockUser,
          passwordHash: null,
        });
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        await expect(
          authService.login(loginDto, requestMeta),
        ).rejects.toThrow(UnauthorizedException);
        expect(bcrypt.compare).toHaveBeenCalled();
        expect(usersService.incrementFailedAttempts).not.toHaveBeenCalled();
      });

      it('should throw UnauthorizedException on wrong password', async () => {
        usersService.findByEmail.mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);
        usersService.incrementFailedAttempts.mockResolvedValue({
          ...mockUser,
          failedAttempts: 1,
        });

        await expect(
          authService.login(loginDto, requestMeta),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('should increment failed attempts on wrong password', async () => {
        usersService.findByEmail.mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);
        usersService.incrementFailedAttempts.mockResolvedValue({
          ...mockUser,
          failedAttempts: 1,
        });

        await expect(
          authService.login(loginDto, requestMeta),
        ).rejects.toThrow();

        expect(usersService.incrementFailedAttempts).toHaveBeenCalledWith(
          'uuid-123',
        );
      });

      it('should lock account after 5 failed attempts and throw ForbiddenException', async () => {
        usersService.findByEmail.mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);
        usersService.incrementFailedAttempts.mockResolvedValue({
          ...mockUser,
          failedAttempts: 5,
        });
        usersService.lockAccount.mockResolvedValue(undefined);

        await expect(
          authService.login(loginDto, requestMeta),
        ).rejects.toThrow(ForbiddenException);
        expect(usersService.lockAccount).toHaveBeenCalledWith('uuid-123', 0);
      });
    });
  });

  describe('refreshTokens', () => {
    it('should return new accessToken and cookie on valid refresh token', async () => {
      jwtService.verify.mockReturnValue({
        sub: 'uuid-123',
        sessionId: 'session-uuid',
        family: 'family-uuid',
      });
      usersService.findById.mockResolvedValue(mockUser);
      sessionsService.rotateRefreshToken.mockResolvedValue(mockSession);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed');
      sessionsService.updateSessionHash.mockResolvedValue(undefined);
      jwtService.sign
        .mockReturnValueOnce('new-access')
        .mockReturnValueOnce('new-refresh');

      const result = await authService.refreshTokens(
        'valid-refresh-token',
        requestMeta,
      );

      expect(result.accessToken).toBe('new-access');
      expect(result.cookie).toBeDefined();
      expect(result.cookie.name).toBe('refresh_token');
    });

    it('should throw UnauthorizedException when token verification fails', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await expect(
        authService.refreshTokens('invalid-token', requestMeta),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      jwtService.verify.mockReturnValue({
        sub: 'uuid-123',
        sessionId: 'session-uuid',
        family: 'family-uuid',
      });
      usersService.findById.mockResolvedValue(null);

      await expect(
        authService.refreshTokens('valid-token', requestMeta),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should call rotateRefreshToken on SessionsService', async () => {
      jwtService.verify.mockReturnValue({
        sub: 'uuid-123',
        sessionId: 'session-uuid',
        family: 'family-uuid',
      });
      usersService.findById.mockResolvedValue(mockUser);
      sessionsService.rotateRefreshToken.mockResolvedValue(mockSession);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      sessionsService.updateSessionHash.mockResolvedValue(undefined);
      jwtService.sign.mockReturnValue('token');

      await authService.refreshTokens('valid-token', requestMeta);

      expect(sessionsService.rotateRefreshToken).toHaveBeenCalledWith(
        expect.objectContaining({
          oldSessionId: 'session-uuid',
          oldRefreshToken: 'valid-token',
        }),
      );
    });
  });

  describe('validateOAuthUser', () => {
    const oauthProfile: OAuthProfile = {
      email: 'oauth@example.com',
      provider: Provider.GOOGLE,
      providerId: 'google-id-123',
    };

    const mockOAuthUser: User = {
      id: 'uuid-oauth',
      email: 'oauth@example.com',
      passwordHash: null,
      firstName: null,
      lastName: null,
      avatarUrl: null,
      role: Role.USER,
      provider: Provider.GOOGLE,
      providerId: 'google-id-123',
      emailVerified: true,
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

    it('should find or create user and return accessToken, cookie, and SafeUser', async () => {
      usersService.findOrCreateByOAuth.mockResolvedValue(mockOAuthUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      jwtService.sign
        .mockReturnValueOnce('oauth-access-token')
        .mockReturnValueOnce('oauth-refresh-token');
      sessionsService.createSession.mockResolvedValue(mockSession);
      sessionsService.updateSessionHash.mockResolvedValue(undefined);

      const result = await authService.validateOAuthUser(
        oauthProfile,
        requestMeta,
      );

      expect(usersService.findOrCreateByOAuth).toHaveBeenCalledWith(
        oauthProfile,
      );
      expect(result.accessToken).toBe('oauth-access-token');
      expect(result.cookie).toBeDefined();
      expect(result.cookie.name).toBe('refresh_token');
      expect(result.user.email).toBe('oauth@example.com');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should create a session via SessionsService', async () => {
      usersService.findOrCreateByOAuth.mockResolvedValue(mockOAuthUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      jwtService.sign.mockReturnValue('token');
      sessionsService.createSession.mockResolvedValue(mockSession);
      sessionsService.updateSessionHash.mockResolvedValue(undefined);

      await authService.validateOAuthUser(oauthProfile, requestMeta);

      expect(sessionsService.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'uuid-oauth',
          ipAddress: '127.0.0.1',
        }),
      );
    });
  });

  describe('generateOAuthCode', () => {
    it('should delegate to OAuthCodeStore.store and return the ephemeral code', async () => {
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
      const payload = {
        accessToken: 'at',
        user: {
          id: 'uuid-123',
          email: 'test@example.com',
          firstName: null,
          lastName: null,
          avatarUrl: null,
          role: Role.USER,
          provider: Provider.GOOGLE,
          providerId: 'google-id',
          emailVerified: true,
          isActive: true,
          failedAttempts: 0,
          lockedUntil: null,
          lockoutCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        cookie: mockCookie,
      };
      oauthCodeStore.store.mockResolvedValue('ephemeral-uuid');

      const code = await authService.generateOAuthCode(payload);

      expect(oauthCodeStore.store).toHaveBeenCalledWith(payload);
      expect(code).toBe('ephemeral-uuid');
    });
  });

  describe('exchangeOAuthCode', () => {
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

    const mockPayload = {
      accessToken: 'at',
      user: {
        id: 'uuid-123',
        email: 'test@example.com',
        firstName: null,
        lastName: null,
        avatarUrl: null,
        role: Role.USER,
        provider: Provider.GOOGLE,
        providerId: 'google-id',
        emailVerified: true,
        isActive: true,
        failedAttempts: 0,
        lockedUntil: null,
        lockoutCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      cookie: mockCookie,
    };

    it('should return accessToken, user, and cookie for a valid code', async () => {
      oauthCodeStore.exchange.mockResolvedValue(mockPayload);

      const result = await authService.exchangeOAuthCode('valid-code');

      expect(oauthCodeStore.exchange).toHaveBeenCalledWith('valid-code');
      expect(result.accessToken).toBe('at');
      expect(result.cookie).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException for invalid or expired code', async () => {
      oauthCodeStore.exchange.mockResolvedValue(null);

      await expect(authService.exchangeOAuthCode('invalid-code')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should revoke session and return clear cookie', async () => {
      jwtService.verify.mockReturnValue({
        sub: 'uuid-123',
        sessionId: 'session-uuid',
        family: 'family-uuid',
      });
      sessionsService.revokeSession.mockResolvedValue(undefined);

      const result = await authService.logout('valid-refresh-token');

      expect(result.name).toBe('refresh_token');
      expect(result.value).toBe('');
      expect(result.options.maxAge).toBe(0);
    });

    it('should return clear cookie even when token is invalid', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      const result = await authService.logout('invalid-token');

      expect(result.name).toBe('refresh_token');
      expect(result.value).toBe('');
      expect(result.options.maxAge).toBe(0);
    });
  });

  describe('logoutAll', () => {
    it('should revoke all sessions and return clear cookie', async () => {
      sessionsService.revokeAllUserSessions.mockResolvedValue(undefined);

      const result = await authService.logoutAll('uuid-123');

      expect(sessionsService.revokeAllUserSessions).toHaveBeenCalledWith(
        'uuid-123',
      );
      expect(result.name).toBe('refresh_token');
      expect(result.value).toBe('');
      expect(result.options.maxAge).toBe(0);
    });
  });

  // ─── generateTokensForMfa ────────────────────────────────────

  describe('generateTokensForMfa', () => {
    it('should return AuthResult with tokens for existing user', async () => {
      usersService.findById.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      jwtService.sign
        .mockReturnValueOnce('mfa-access-token')
        .mockReturnValueOnce('mfa-refresh-token');
      sessionsService.createSession.mockResolvedValue(mockSession);
      sessionsService.updateSessionHash.mockResolvedValue(undefined);

      const result = await authService.generateTokensForMfa(
        'uuid-123',
        requestMeta,
      );

      expect(result.accessToken).toBe('mfa-access-token');
      expect(result.cookie.name).toBe('refresh_token');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(
        authService.generateTokensForMfa('nonexistent', requestMeta),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── verifyEmail ──────────────────────────────────────────────

  describe('verifyEmail', () => {
    let prismaService: any;

    beforeEach(() => {
      prismaService = (authService as any).prisma;
    });

    it('should return invalid when token not found', async () => {
      prismaService.emailVerificationToken.findUnique.mockResolvedValue(null);

      const result = await authService.verifyEmail('invalid-token');

      expect(result).toEqual({ status: 'invalid' });
    });

    it('should return success when token already used but user is verified', async () => {
      prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'REGISTRATION',
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        user: { ...mockUser, emailVerified: true },
      });

      const result = await authService.verifyEmail('used-token');

      expect(result).toEqual({ status: 'success' });
    });

    it('should return invalid when token already used and user not verified', async () => {
      prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'REGISTRATION',
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        user: { ...mockUser, emailVerified: false },
      });

      const result = await authService.verifyEmail('used-token');

      expect(result).toEqual({ status: 'invalid' });
    });

    it('should return invalid when token is expired', async () => {
      prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'REGISTRATION',
        usedAt: null,
        expiresAt: new Date(Date.now() - 1000),
        user: mockUser,
      });

      const result = await authService.verifyEmail('expired-token');

      expect(result).toEqual({ status: 'invalid' });
    });

    it('should mark token as used and verify user on valid token', async () => {
      prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'REGISTRATION',
        usedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: mockUser,
      });
      prismaService.$transaction.mockResolvedValue(undefined);

      const result = await authService.verifyEmail('valid-token');

      expect(result).toEqual({ status: 'success' });
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should return invalid when token type is EMAIL_CHANGE', async () => {
      prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'EMAIL_CHANGE',
        usedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: mockUser,
      });

      const result = await authService.verifyEmail('email-change-token');

      expect(result).toEqual({ status: 'invalid' });
      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });
  });

  // ─── verifyEmailChange ─────────────────────────────────────────

  describe('verifyEmailChange', () => {
    let prismaService: any;
    let mailService: any;
    let auditService: any;

    beforeEach(() => {
      prismaService = (authService as any).prisma;
      mailService = (authService as any).mailService;
      auditService = (authService as any).auditService;
    });

    it('should return invalid when token not found', async () => {
      prismaService.emailVerificationToken.findUnique.mockResolvedValue(null);

      const result = await authService.verifyEmailChange('invalid-token');

      expect(result).toEqual({ status: 'invalid' });
    });

    it('should return invalid when token type is REGISTRATION', async () => {
      prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'REGISTRATION',
        usedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: mockUser,
      });

      const result = await authService.verifyEmailChange('registration-token');

      expect(result).toEqual({ status: 'invalid' });
    });

    it('should return invalid when token already used', async () => {
      prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'EMAIL_CHANGE',
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        user: { ...mockUser, pendingEmail: 'new@example.com' },
      });

      const result = await authService.verifyEmailChange('used-token');

      expect(result).toEqual({ status: 'invalid' });
    });

    it('should return invalid when token expired', async () => {
      prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'EMAIL_CHANGE',
        usedAt: null,
        expiresAt: new Date(Date.now() - 1000),
        user: { ...mockUser, pendingEmail: 'new@example.com' },
      });

      const result = await authService.verifyEmailChange('expired-token');

      expect(result).toEqual({ status: 'invalid' });
    });

    it('should return invalid when user has no pendingEmail', async () => {
      prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'EMAIL_CHANGE',
        usedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: { ...mockUser, pendingEmail: null },
      });

      const result = await authService.verifyEmailChange('valid-token');

      expect(result).toEqual({ status: 'invalid' });
    });

    it('should return invalid when pending email is already taken', async () => {
      prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'EMAIL_CHANGE',
        usedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: { ...mockUser, pendingEmail: 'new@example.com' },
      });
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        id: 'other-user-id',
        email: 'new@example.com',
      } as User);

      const result = await authService.verifyEmailChange('valid-token');

      expect(result).toEqual({ status: 'invalid' });
    });

    it('should atomically swap email and mark token used on success', async () => {
      const userWithPending = { ...mockUser, pendingEmail: 'new@example.com' };
      prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'EMAIL_CHANGE',
        usedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: userWithPending,
      });
      usersService.findByEmail.mockResolvedValue(null);
      prismaService.$transaction.mockResolvedValue(undefined);
      sessionsService.revokeAllUserSessions.mockResolvedValue(undefined);

      const result = await authService.verifyEmailChange('valid-token');

      expect(result).toEqual({ status: 'success' });
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should revoke all sessions on successful email change', async () => {
      const userWithPending = { ...mockUser, pendingEmail: 'new@example.com' };
      prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'EMAIL_CHANGE',
        usedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: userWithPending,
      });
      usersService.findByEmail.mockResolvedValue(null);
      prismaService.$transaction.mockResolvedValue(undefined);
      sessionsService.revokeAllUserSessions.mockResolvedValue(undefined);

      await authService.verifyEmailChange('valid-token');

      expect(sessionsService.revokeAllUserSessions).toHaveBeenCalledWith('uuid-123');
    });

    it('should send confirmation to old email on success', async () => {
      const userWithPending = { ...mockUser, pendingEmail: 'new@example.com' };
      prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'EMAIL_CHANGE',
        usedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: userWithPending,
      });
      usersService.findByEmail.mockResolvedValue(null);
      prismaService.$transaction.mockResolvedValue(undefined);
      sessionsService.revokeAllUserSessions.mockResolvedValue(undefined);

      await authService.verifyEmailChange('valid-token');

      expect(mailService.sendEmailChangedConfirmation).toHaveBeenCalledWith(
        mockUser.email,
        'new@example.com',
        mockUser.firstName,
      );
    });

    it('should fire EMAIL_CHANGED audit log on success', async () => {
      const userWithPending = { ...mockUser, pendingEmail: 'new@example.com' };
      prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'EMAIL_CHANGE',
        usedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: userWithPending,
      });
      usersService.findByEmail.mockResolvedValue(null);
      prismaService.$transaction.mockResolvedValue(undefined);
      sessionsService.revokeAllUserSessions.mockResolvedValue(undefined);

      await authService.verifyEmailChange('valid-token');

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'EMAIL_CHANGED',
          userId: 'uuid-123',
        }),
      );
    });
  });

  // ─── resendVerificationEmail ──────────────────────────────────

  describe('resendVerificationEmail', () => {
    let prismaService: any;

    beforeEach(() => {
      prismaService = (authService as any).prisma;
    });

    it('should throw UnauthorizedException when user not found', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(
        authService.resendVerificationEmail('nonexistent'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException when email already verified', async () => {
      usersService.findById.mockResolvedValue({
        ...mockUser,
        emailVerified: true,
      });

      await expect(
        authService.resendVerificationEmail('uuid-123'),
      ).rejects.toThrow('Email already verified');
    });

    it('should throw BadRequestException when cooldown not expired', async () => {
      usersService.findById.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      });
      prismaService.emailVerificationToken.findFirst.mockResolvedValue({
        createdAt: new Date(), // just created
      });

      await expect(
        authService.resendVerificationEmail('uuid-123'),
      ).rejects.toThrow('Please wait before requesting another email');
    });

    it('should send verification email when cooldown expired', async () => {
      usersService.findById.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      });
      prismaService.emailVerificationToken.findFirst.mockResolvedValue({
        createdAt: new Date(Date.now() - 120000), // 2 minutes ago
      });
      prismaService.emailVerificationToken.create.mockResolvedValue({});

      await authService.resendVerificationEmail('uuid-123');

      const mailService = (authService as any).mailService;
      expect(mailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should send verification email when no previous token exists', async () => {
      usersService.findById.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      });
      prismaService.emailVerificationToken.findFirst.mockResolvedValue(null);
      prismaService.emailVerificationToken.create.mockResolvedValue({});

      await authService.resendVerificationEmail('uuid-123');

      const mailService = (authService as any).mailService;
      expect(mailService.sendVerificationEmail).toHaveBeenCalled();
    });
  });

  // ─── forgotPassword ───────────────────────────────────────────

  describe('forgotPassword', () => {
    let prismaService: any;

    beforeEach(() => {
      prismaService = (authService as any).prisma;
    });

    it('should return silently when user not found (prevent enumeration)', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.forgotPassword({ email: 'nonexistent@example.com' }),
      ).resolves.toBeUndefined();
    });

    it('should return silently for OAuth-only accounts', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        passwordHash: null,
        provider: Provider.GOOGLE,
      });

      await expect(
        authService.forgotPassword({ email: 'test@example.com' }),
      ).resolves.toBeUndefined();

      expect(prismaService.passwordResetToken.create).not.toHaveBeenCalled();
    });

    it('should invalidate existing tokens and create new reset token', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      prismaService.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
      prismaService.passwordResetToken.create.mockResolvedValue({});

      await authService.forgotPassword({ email: 'test@example.com' });

      expect(prismaService.passwordResetToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'uuid-123', usedAt: null },
        data: { usedAt: expect.any(Date) },
      });
      expect(prismaService.passwordResetToken.create).toHaveBeenCalled();

      const mailService = (authService as any).mailService;
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
        null,
      );
    });
  });

  // ─── resetPassword ────────────────────────────────────────────

  describe('resetPassword', () => {
    let prismaService: any;

    beforeEach(() => {
      prismaService = (authService as any).prisma;
    });

    it('should throw BadRequestException when token not found', async () => {
      prismaService.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(
        authService.resetPassword({ token: 'invalid', newPassword: 'NewPass1!' }),
      ).rejects.toThrow('Invalid or expired reset token');
    });

    it('should throw BadRequestException when token already used', async () => {
      prismaService.passwordResetToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
        user: mockUser,
      });

      await expect(
        authService.resetPassword({ token: 'used', newPassword: 'NewPass1!' }),
      ).rejects.toThrow('Invalid or expired reset token');
    });

    it('should throw BadRequestException when token expired', async () => {
      prismaService.passwordResetToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        usedAt: null,
        expiresAt: new Date(Date.now() - 1000),
        user: mockUser,
      });

      await expect(
        authService.resetPassword({ token: 'expired', newPassword: 'NewPass1!' }),
      ).rejects.toThrow('Invalid or expired reset token');
    });

    it('should throw BadRequestException when new password matches current password', async () => {
      prismaService.passwordResetToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        usedAt: null,
        expiresAt: new Date(Date.now() + 3600000),
        user: mockUser,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        authService.resetPassword({ token: 'valid', newPassword: 'SamePass1!' }),
      ).rejects.toThrow('New password must be different from current password');

      expect(bcrypt.compare).toHaveBeenCalledWith('SamePass1!', mockUser.passwordHash);
      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when new password is breached', async () => {
      prismaService.passwordResetToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        usedAt: null,
        expiresAt: new Date(Date.now() + 3600000),
        user: mockUser,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // not same password
      passwordBreachService.isBreached.mockResolvedValue(true);

      await expect(
        authService.resetPassword({ token: 'valid', newPassword: 'BreachedPass1!' }),
      ).rejects.toThrow('This password has appeared in a data breach');

      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should hash new password, mark token used, and revoke all sessions', async () => {
      prismaService.passwordResetToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        usedAt: null,
        expiresAt: new Date(Date.now() + 3600000),
        user: mockUser,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      prismaService.$transaction.mockResolvedValue(undefined);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      sessionsService.revokeAllUserSessions.mockResolvedValue(undefined);

      await authService.resetPassword({ token: 'valid', newPassword: 'NewPass1!' });

      expect(bcrypt.compare).toHaveBeenCalledWith('NewPass1!', mockUser.passwordHash);
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPass1!', 12);
      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(sessionsService.revokeAllUserSessions).toHaveBeenCalledWith('uuid-123');
    });
  });

  // ─── validateResetToken ─────────────────────────────────────────

  describe('validateResetToken', () => {
    let prismaService: any;

    beforeEach(() => {
      prismaService = (authService as any).prisma;
    });

    it('should return { valid: false } when token not found', async () => {
      prismaService.passwordResetToken.findUnique.mockResolvedValue(null);

      const result = await authService.validateResetToken('invalid-token');

      expect(result).toEqual({ valid: false });
    });

    it('should return { valid: false } when token already used', async () => {
      prismaService.passwordResetToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
      });

      const result = await authService.validateResetToken('used-token');

      expect(result).toEqual({ valid: false });
    });

    it('should return { valid: false } when token expired', async () => {
      prismaService.passwordResetToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        usedAt: null,
        expiresAt: new Date(Date.now() - 1000),
      });

      const result = await authService.validateResetToken('expired-token');

      expect(result).toEqual({ valid: false });
    });

    it('should return { valid: true } for a valid unused non-expired token', async () => {
      prismaService.passwordResetToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        usedAt: null,
        expiresAt: new Date(Date.now() + 3600000),
      });

      const result = await authService.validateResetToken('valid-token');

      expect(result).toEqual({ valid: true });
    });
  });

  // ─── resendVerificationByEmail ──────────────────────────────────

  describe('resendVerificationByEmail', () => {
    let prismaService: any;

    beforeEach(() => {
      prismaService = (authService as any).prisma;
    });

    it('should return silently when user not found (anti-enumeration)', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.resendVerificationByEmail('nonexistent@example.com'),
      ).resolves.toBeUndefined();

      expect(prismaService.emailVerificationToken.create).not.toHaveBeenCalled();
    });

    it('should return silently when email already verified', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        emailVerified: true,
      });

      await expect(
        authService.resendVerificationByEmail('test@example.com'),
      ).resolves.toBeUndefined();

      expect(prismaService.emailVerificationToken.create).not.toHaveBeenCalled();
    });

    it('should return silently when cooldown not expired', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      });
      prismaService.emailVerificationToken.findFirst.mockResolvedValue({
        createdAt: new Date(),
      });

      await expect(
        authService.resendVerificationByEmail('test@example.com'),
      ).resolves.toBeUndefined();

      expect(prismaService.emailVerificationToken.create).not.toHaveBeenCalled();
    });

    it('should send verification email when cooldown expired', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      });
      prismaService.emailVerificationToken.findFirst.mockResolvedValue({
        createdAt: new Date(Date.now() - 120000),
      });
      prismaService.emailVerificationToken.create.mockResolvedValue({});

      await authService.resendVerificationByEmail('test@example.com');

      const mailService = (authService as any).mailService;
      expect(mailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should send verification email when no previous token exists', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      });
      prismaService.emailVerificationToken.findFirst.mockResolvedValue(null);
      prismaService.emailVerificationToken.create.mockResolvedValue({});

      await authService.resendVerificationByEmail('test@example.com');

      const mailService = (authService as any).mailService;
      expect(mailService.sendVerificationEmail).toHaveBeenCalled();
    });
  });

  // ─── buildRefreshCookie / buildClearCookie ────────────────────

  describe('buildRefreshCookie', () => {
    it('should return cookie config with refresh_token name', () => {
      const cookie = authService.buildRefreshCookie('my-token');

      expect(cookie.name).toBe('refresh_token');
      expect(cookie.value).toBe('my-token');
      expect(cookie.options.httpOnly).toBe(true);
      expect(cookie.options.sameSite).toBe('strict');
      expect(cookie.options.path).toBe('/');
    });
  });

  describe('buildClearCookie', () => {
    it('should return cookie config with empty value and maxAge=0', () => {
      const cookie = authService.buildClearCookie();

      expect(cookie.name).toBe('refresh_token');
      expect(cookie.value).toBe('');
      expect(cookie.options.maxAge).toBe(0);
    });
  });

  // ─── login with MFA challenge ─────────────────────────────────

  describe('login - MFA challenge', () => {
    it('should return mfaRequired when user has MFA enabled', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        mfaEnabled: true,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('mfa-challenge-token');

      const result = await authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
      );

      expect(result).toEqual({
        mfaRequired: true,
        mfaToken: 'mfa-challenge-token',
      });
    });

    it('should skip MFA when trusted device fingerprint matches', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        mfaEnabled: true,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      trustedDeviceService.isTrustedDevice.mockResolvedValue(true);
      jwtService.sign.mockReturnValueOnce('at').mockReturnValueOnce('rt');
      sessionsService.createSession.mockResolvedValue(mockSession);
      sessionsService.updateSessionHash.mockResolvedValue(undefined);

      const result = await authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
        requestMeta,
        'trusted-fingerprint',
      );

      expect(result).toHaveProperty('accessToken');
      expect(result).not.toHaveProperty('mfaRequired');
      expect(trustedDeviceService.isTrustedDevice).toHaveBeenCalledWith(
        'uuid-123',
        'trusted-fingerprint',
      );
    });

    it('should proceed with MFA challenge when fingerprint does not match', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        mfaEnabled: true,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      trustedDeviceService.isTrustedDevice.mockResolvedValue(false);
      jwtService.sign.mockReturnValue('mfa-challenge-token');

      const result = await authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
        requestMeta,
        'unknown-fingerprint',
      );

      expect(result).toEqual({
        mfaRequired: true,
        mfaToken: 'mfa-challenge-token',
      });
    });

    it('should proceed with MFA challenge when no fingerprint provided', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        mfaEnabled: true,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('mfa-challenge-token');

      const result = await authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
      );

      expect(result).toEqual({
        mfaRequired: true,
        mfaToken: 'mfa-challenge-token',
      });
      expect(trustedDeviceService.isTrustedDevice).not.toHaveBeenCalled();
    });
  });

  // ─── Fire-and-forget resilience ────────────────────────────────
  // These tests exercise .catch(() => {}) callbacks by making
  // auditService.log reject. Service methods should still succeed.

  describe('fire-and-forget resilience', () => {
    let auditSvc: jest.Mocked<AuditService>;

    beforeEach(() => {
      auditSvc = (authService as any).auditService;
      auditSvc.log.mockRejectedValue(new Error('audit write failed'));
    });

    it('register should succeed even when audit fails', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      const result = await authService.register(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
      );

      expect(result.message).toBe('Verification email sent');
      expect(result.user).toBeDefined();
    });

    it('login success should succeed even when audit fails', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValueOnce('at').mockReturnValueOnce('rt');
      sessionsService.createSession.mockResolvedValue(mockSession);
      sessionsService.updateSessionHash.mockResolvedValue(undefined);

      const result = await authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
      );

      expect(result).toHaveProperty('accessToken');
    });

    it('login user-not-found should throw even when audit fails', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login(
          { email: 'x@x.com', password: 'pass' },
          requestMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('login invalid-password should throw even when audit fails', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      usersService.incrementFailedAttempts.mockResolvedValue({
        ...mockUser,
        failedAttempts: 1,
      });

      await expect(
        authService.login(
          { email: 'test@example.com', password: 'wrong' },
          requestMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('login MFA challenge should return even when audit fails', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        mfaEnabled: true,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('mfa-token');

      const result = await authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
      );

      expect(result).toHaveProperty('mfaRequired', true);
    });

    it('logout should return clear cookie even when audit fails', async () => {
      jwtService.verify.mockReturnValue({
        sub: 'uuid-123',
        sessionId: 'sess-1',
        family: 'fam-1',
      });
      sessionsService.revokeSession.mockResolvedValue(undefined);

      const result = await authService.logout('valid-refresh');

      expect(result.value).toBe('');
      expect(result.options.maxAge).toBe(0);
    });

    it('logoutAll should return clear cookie even when audit fails', async () => {
      sessionsService.revokeAllUserSessions.mockResolvedValue(undefined);

      const result = await authService.logoutAll('uuid-123');

      expect(result.value).toBe('');
    });

    it('refreshTokens should succeed even when audit fails', async () => {
      jwtService.verify.mockReturnValue({
        sub: 'uuid-123',
        sessionId: 'sess-1',
        family: 'fam-1',
      });
      usersService.findById.mockResolvedValue(mockUser);
      sessionsService.rotateRefreshToken.mockResolvedValue(mockSession);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      jwtService.sign.mockReturnValueOnce('new-at').mockReturnValueOnce('new-rt');
      sessionsService.updateSessionHash.mockResolvedValue(undefined);

      const result = await authService.refreshTokens(
        'old-refresh',
        requestMeta,
      );

      expect(result.accessToken).toBe('new-at');
    });

    it('forgotPassword should succeed even when mail/audit fails', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      const prismaService = (authService as any).prisma;
      prismaService.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
      prismaService.passwordResetToken.create.mockResolvedValue({});
      const mailSvc = (authService as any).mailService;
      mailSvc.sendPasswordResetEmail.mockResolvedValue(undefined);

      await authService.forgotPassword({ email: 'test@example.com' });

      expect(mailSvc.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('resetPassword should succeed even when audit fails', async () => {
      const prismaService = (authService as any).prisma;
      prismaService.passwordResetToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        usedAt: null,
        expiresAt: new Date(Date.now() + 3600000),
        user: mockUser,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      prismaService.$transaction.mockResolvedValue(undefined);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      sessionsService.revokeAllUserSessions.mockResolvedValue(undefined);

      await authService.resetPassword({
        token: 'valid',
        newPassword: 'NewPass1!',
      });

      expect(sessionsService.revokeAllUserSessions).toHaveBeenCalled();
    });
  });

  // ─── createAndSendVerificationEmail resilience ────────────────

  describe('register - verification email failure', () => {
    it('should complete registration even when verification email fails', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      // Make the verification email path fail
      const prismaService = (authService as any).prisma;
      prismaService.emailVerificationToken.create.mockRejectedValue(
        new Error('DB error'),
      );

      const result = await authService.register(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
      );

      expect(result.message).toBe('Verification email sent');
      expect(result.user).toBeDefined();
    });
  });

  // ─── validateOAuthUser ─────────────────────────────────────────

  describe('validateOAuthUser', () => {
    it('should return AuthResult for an OAuth user', async () => {
      const oauthProfile: OAuthProfile = {
        provider: Provider.GOOGLE,
        providerId: 'google-123',
        email: 'oauth@example.com',
        firstName: 'OAuth',
        lastName: 'User',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      const oauthUser = {
        ...mockUser,
        id: 'oauth-uuid',
        email: 'oauth@example.com',
        provider: Provider.GOOGLE,
        providerId: 'google-123',
      };

      usersService.findOrCreateByOAuth.mockResolvedValue(oauthUser);
      jwtService.sign.mockReturnValueOnce('oauth-at').mockReturnValueOnce('oauth-rt');
      sessionsService.createSession.mockResolvedValue({
        ...mockSession,
        userId: 'oauth-uuid',
      });
      sessionsService.updateSessionHash.mockResolvedValue(undefined);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      const result = await authService.validateOAuthUser(
        oauthProfile,
        requestMeta,
      );

      expect(result.accessToken).toBe('oauth-at');
      expect(result.user.email).toBe('oauth@example.com');
      expect(result.cookie.name).toBe('refresh_token');
    });
  });

  // ─── login edge cases ──────────────────────────────────────────

  describe('login - account locked', () => {
    it('should throw ForbiddenException when account is locked', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        lockedUntil: new Date(Date.now() + 300000), // locked for 5 more minutes
        lockoutCount: 1,
      });

      await expect(
        authService.login(
          { email: 'test@example.com', password: 'pass' },
          requestMeta,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reset failed attempts when lock has expired', async () => {
      const expiredLockUser = {
        ...mockUser,
        lockedUntil: new Date(Date.now() - 1000), // lock expired
        lockoutCount: 1,
        failedAttempts: 5,
      };
      usersService.findByEmail.mockResolvedValue(expiredLockUser);
      usersService.resetFailedAttempts.mockResolvedValue(undefined);
      usersService.resetLockoutEscalation.mockResolvedValue(undefined);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValueOnce('at').mockReturnValueOnce('rt');
      sessionsService.createSession.mockResolvedValue(mockSession);
      sessionsService.updateSessionHash.mockResolvedValue(undefined);

      const result = await authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
      );

      expect(usersService.resetFailedAttempts).toHaveBeenCalledWith('uuid-123');
      expect(usersService.resetLockoutEscalation).toHaveBeenCalledWith('uuid-123');
      expect(result).toHaveProperty('accessToken');
    });
  });

  describe('login - no password (OAuth account)', () => {
    it('should throw UnauthorizedException for OAuth-only account', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        passwordHash: null,
        provider: Provider.GOOGLE,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login(
          { email: 'test@example.com', password: 'pass' },
          requestMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login - email not verified', () => {
    it('should throw ForbiddenException for unverified LOCAL account', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
        provider: Provider.LOCAL,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        authService.login(
          { email: 'test@example.com', password: 'StrongPass1!' },
          requestMeta,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('login - max failed attempts triggers lockout', () => {
    it('should lock account after max failed attempts', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      usersService.incrementFailedAttempts.mockResolvedValue({
        ...mockUser,
        failedAttempts: 5, // MAX_FAILED_ATTEMPTS
      });
      usersService.lockAccount.mockResolvedValue(undefined);

      await expect(
        authService.login(
          { email: 'test@example.com', password: 'wrong' },
          requestMeta,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(usersService.lockAccount).toHaveBeenCalledWith('uuid-123', 0);
    });
  });

  describe('login - successful login resets failed attempts', () => {
    it('should reset failed attempts on successful login', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        failedAttempts: 3,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      usersService.resetLockoutEscalation.mockResolvedValue(undefined);
      jwtService.sign.mockReturnValueOnce('at').mockReturnValueOnce('rt');
      sessionsService.createSession.mockResolvedValue(mockSession);
      sessionsService.updateSessionHash.mockResolvedValue(undefined);

      await authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
      );

      expect(usersService.resetLockoutEscalation).toHaveBeenCalledWith('uuid-123');
    });
  });

  describe('notifyIfNewDevice (via login)', () => {
    let prismaService: any;
    let mailService: any;

    beforeEach(() => {
      prismaService = (authService as any).prisma;
      mailService = (authService as any).mailService;

      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      sessionsService.createSession.mockResolvedValue(mockSession);
      sessionsService.updateSessionHash.mockResolvedValue(undefined);
    });

    it('should send login notification when IP is new', async () => {
      prismaService.session.findMany.mockResolvedValue([
        { ipAddress: '10.0.0.99', userAgent: 'test-agent' },
      ]);

      await authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
      );

      await new Promise((r) => setTimeout(r, 50));

      expect(mailService.sendLoginNotificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        '127.0.0.1',
        'test-agent',
        null,
      );
    });

    it('should send login notification when userAgent is new', async () => {
      prismaService.session.findMany.mockResolvedValue([
        { ipAddress: '127.0.0.1', userAgent: 'different-agent' },
      ]);

      await authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
      );

      await new Promise((r) => setTimeout(r, 50));

      expect(mailService.sendLoginNotificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        '127.0.0.1',
        'test-agent',
        null,
      );
    });

    it('should NOT send notification on first-ever login (no previous sessions)', async () => {
      prismaService.session.findMany.mockResolvedValue([]);

      await authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
      );

      await new Promise((r) => setTimeout(r, 50));

      expect(mailService.sendLoginNotificationEmail).not.toHaveBeenCalled();
    });

    it('should NOT send notification when IP and UA are both known', async () => {
      prismaService.session.findMany.mockResolvedValue([
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
      ]);

      await authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
      );

      await new Promise((r) => setTimeout(r, 50));

      expect(mailService.sendLoginNotificationEmail).not.toHaveBeenCalled();
    });

    it('should not fail login when notification email fails', async () => {
      prismaService.session.findMany.mockResolvedValue([
        { ipAddress: '10.0.0.99', userAgent: 'other-agent' },
      ]);
      mailService.sendLoginNotificationEmail.mockRejectedValueOnce(
        new Error('SMTP error'),
      );

      const result = await authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
      );

      expect(result.accessToken).toBe('access-token');
      expect(result.user.email).toBe('test@example.com');
    });
  });

  // ─── refreshTokens — idle timeout ──────────────────────────────

  describe('refreshTokens - idle timeout', () => {
    let prismaService: any;
    let auditServiceMock: any;

    beforeEach(() => {
      prismaService = (authService as any).prisma;
      auditServiceMock = (authService as any).auditService;

      jwtService.verify.mockReturnValue({
        sub: 'uuid-123',
        sessionId: 'session-uuid',
        family: 'family-uuid',
      });
      usersService.findById.mockResolvedValue(mockUser);
      sessionsService.rotateRefreshToken.mockResolvedValue(mockSession);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      sessionsService.updateSessionHash.mockResolvedValue(undefined);
      jwtService.sign.mockReturnValue('token');
    });

    it('should throw UnauthorizedException when session is idle', async () => {
      sessionsService.findById.mockResolvedValue(mockSession);
      sessionsService.isSessionIdle.mockReturnValue(true);

      await expect(
        authService.refreshTokens('valid-token', requestMeta),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        authService.refreshTokens('valid-token', requestMeta),
      ).rejects.toThrow('Session expired due to inactivity');
    });

    it('should NOT call rotateRefreshToken when session is idle', async () => {
      sessionsService.findById.mockResolvedValue(mockSession);
      sessionsService.isSessionIdle.mockReturnValue(true);

      await authService
        .refreshTokens('valid-token', requestMeta)
        .catch(() => {});

      expect(sessionsService.rotateRefreshToken).not.toHaveBeenCalled();
    });

    it('should revoke idle session and log SESSION_IDLE_REVOKED audit', async () => {
      sessionsService.findById.mockResolvedValue(mockSession);
      sessionsService.isSessionIdle.mockReturnValue(true);

      await authService
        .refreshTokens('valid-token', requestMeta)
        .catch(() => {});

      await new Promise((r) => setTimeout(r, 50));

      expect(prismaService.session.update).toHaveBeenCalledWith({
        where: { id: 'session-uuid' },
        data: { isRevoked: true },
      });

      expect(auditServiceMock.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SESSION_IDLE_REVOKED',
          userId: 'uuid-123',
        }),
      );
    });

    it('should proceed normally when session is not idle', async () => {
      sessionsService.findById.mockResolvedValue(mockSession);
      sessionsService.isSessionIdle.mockReturnValue(false);

      await authService.refreshTokens('valid-token', requestMeta);

      expect(sessionsService.rotateRefreshToken).toHaveBeenCalled();
    });
  });

  // ─── concurrent session limit ──────────────────────────────────

  describe('concurrent session limit', () => {
    beforeEach(() => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      sessionsService.createSession.mockResolvedValue(mockSession);
      sessionsService.updateSessionHash.mockResolvedValue(undefined);
    });

    it('should call enforceSessionLimit before session creation on login', async () => {
      await authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
      );

      expect(sessionsService.enforceSessionLimit).toHaveBeenCalledWith(
        'uuid-123',
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
      );
    });

    it('should call enforceSessionLimit on OAuth login', async () => {
      usersService.findOrCreateByOAuth.mockResolvedValue(mockUser);

      await authService.validateOAuthUser(
        {
          email: 'test@example.com',
          provider: 'GOOGLE' as any,
          providerId: 'google-id',
        },
        requestMeta,
      );

      expect(sessionsService.enforceSessionLimit).toHaveBeenCalledWith(
        'uuid-123',
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
      );
    });

    it('should call enforceSessionLimit on MFA login', async () => {
      usersService.findById.mockResolvedValue(mockUser);

      await authService.generateTokensForMfa('uuid-123', requestMeta);

      expect(sessionsService.enforceSessionLimit).toHaveBeenCalledWith(
        'uuid-123',
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
      );
    });

    it('should propagate enforceSessionLimit errors', async () => {
      sessionsService.enforceSessionLimit.mockRejectedValueOnce(
        new Error('DB connection failed'),
      );

      await expect(
        authService.login(
          { email: 'test@example.com', password: 'StrongPass1!' },
          requestMeta,
        ),
      ).rejects.toThrow('DB connection failed');
    });

    it('should pass ipAddress and userAgent to enforceSessionLimit', async () => {
      const customMeta = { ipAddress: '192.168.1.100', userAgent: 'Custom-Agent/1.0' };

      await authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        customMeta,
      );

      expect(sessionsService.enforceSessionLimit).toHaveBeenCalledWith(
        'uuid-123',
        { ipAddress: '192.168.1.100', userAgent: 'Custom-Agent/1.0' },
      );
    });
  });

  describe('impossible travel integration', () => {
    const loginDto = { email: 'test@example.com', password: 'StrongPass1!' };

    beforeEach(() => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      sessionsService.createSession.mockResolvedValue(mockSession);
      sessionsService.updateSessionHash.mockResolvedValue(undefined);
    });

    it('should allow login when impossible travel returns null', async () => {
      impossibleTravelService.detectImpossibleTravel.mockResolvedValue(null);

      const result = await authService.login(loginDto, requestMeta);

      expect(result.accessToken).toBe('access-token');
    });

    it('should allow login when travel is not anomalous', async () => {
      impossibleTravelService.detectImpossibleTravel.mockResolvedValue({
        isAnomalous: false,
        previousLocation: null,
        currentLocation: { city: 'Madrid', country: 'Spain', countryCode: 'ES', latitude: 40.4168, longitude: -3.7038 },
        distanceKm: 5762,
        elapsedHours: 10,
        requiredSpeedKmh: 576,
        strategy: 'alert_only',
        actionTaken: 'allowed',
      });

      const result = await authService.login(loginDto, requestMeta);

      expect(result.accessToken).toBe('access-token');
    });

    it('should throw ForbiddenException when travel action is blocked', async () => {
      impossibleTravelService.detectImpossibleTravel.mockResolvedValue({
        isAnomalous: true,
        previousLocation: { city: 'Madrid', country: 'Spain', countryCode: 'ES', latitude: 40.4168, longitude: -3.7038 },
        currentLocation: { city: 'New York', country: 'United States', countryCode: 'US', latitude: 40.7128, longitude: -74.006 },
        distanceKm: 5762,
        elapsedHours: 0.5,
        requiredSpeedKmh: 11524,
        strategy: 'block',
        actionTaken: 'blocked',
      });

      await expect(
        authService.login(loginDto, requestMeta),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow login gracefully when impossible travel check throws (fail-open)', async () => {
      impossibleTravelService.detectImpossibleTravel.mockRejectedValue(
        new Error('Geolocation service unavailable'),
      );

      const result = await authService.login(loginDto, requestMeta);

      expect(result.accessToken).toBe('access-token');
    });
  });

  describe('suspicious login detection integration', () => {
    const loginDto = { email: 'test@example.com', password: 'StrongPass1!' };

    beforeEach(() => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      sessionsService.createSession.mockResolvedValue({
        id: 'session-uuid',
        userId: 'uuid-123',
        tokenFamily: 'family-uuid',
        refreshTokenHash: 'hashed',
        deviceInfo: null,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        isRevoked: false,
        createdAt: new Date(),
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    });

    it('should call analyzeLoginFailure after failed password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      usersService.incrementFailedAttempts.mockResolvedValue({ failedAttempts: 1, lockedUntil: null });

      await expect(authService.login(loginDto, requestMeta)).rejects.toThrow(UnauthorizedException);

      expect(suspiciousLoginService.analyzeLoginFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'uuid-123',
          ipAddress: '127.0.0.1',
        }),
      );
    });

    it('should call analyzeLoginSuccess after successful login', async () => {
      await authService.login(loginDto, requestMeta);

      expect(suspiciousLoginService.analyzeLoginSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'uuid-123',
          ipAddress: '127.0.0.1',
        }),
      );
    });

    it('should not block login when analyzeLoginFailure throws (fail-open)', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      usersService.incrementFailedAttempts.mockResolvedValue({ failedAttempts: 1, lockedUntil: null });
      suspiciousLoginService.analyzeLoginFailure.mockRejectedValue(new Error('Detection service down'));

      await expect(authService.login(loginDto, requestMeta)).rejects.toThrow(UnauthorizedException);
    });

    it('should not block login when analyzeLoginSuccess throws (fail-open)', async () => {
      suspiciousLoginService.analyzeLoginSuccess.mockRejectedValue(new Error('Detection service down'));

      const result = await authService.login(loginDto, requestMeta);

      expect(result.accessToken).toBe('access-token');
    });
  });

  // ─── SCRUM-119: MFA enforcement for Admin/SUPERADMIN ─────────

  describe('MFA enforcement for admin roles (OWASP ASVS V2.7.2)', () => {
    const loginDto = { email: 'test@example.com', password: 'StrongPass1!' };

    beforeEach(() => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      sessionsService.createSession.mockResolvedValue(mockSession);
      sessionsService.updateSessionHash.mockResolvedValue(undefined);
    });

    it('should return mfaSetupRequired for ADMIN without MFA', async () => {
      const adminUser = { ...mockUser, role: Role.ADMIN, mfaEnabled: false };
      usersService.findByEmail.mockResolvedValue(adminUser);

      const result = await authService.login(loginDto, requestMeta);

      expect((result as any).mfaSetupRequired).toBe(true);
      expect((result as any).message).toContain('MFA setup is required');
      expect((result as any).accessToken).toBeUndefined();
    });

    it('should return mfaSetupRequired for SUPERADMIN without MFA', async () => {
      const superadminUser = { ...mockUser, role: Role.SUPERADMIN, mfaEnabled: false };
      usersService.findByEmail.mockResolvedValue(superadminUser);

      const result = await authService.login(loginDto, requestMeta);

      expect((result as any).mfaSetupRequired).toBe(true);
      expect((result as any).accessToken).toBeUndefined();
    });

    it('should return MFA challenge for ADMIN with MFA enabled', async () => {
      const adminWithMfa = { ...mockUser, role: Role.ADMIN, mfaEnabled: true };
      usersService.findByEmail.mockResolvedValue(adminWithMfa);
      jwtService.sign.mockReset();
      jwtService.sign.mockReturnValue('mfa-challenge-jwt');

      const result = await authService.login(loginDto, requestMeta);

      expect((result as any).mfaRequired).toBe(true);
      expect((result as any).mfaToken).toBeDefined();
      expect((result as any).mfaSetupRequired).toBeUndefined();
    });

    it('should return tokens normally for USER without MFA', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser); // Role.USER, mfaEnabled: false

      const result = await authService.login(loginDto, requestMeta);

      expect((result as any).accessToken).toBe('access-token');
      expect((result as any).mfaSetupRequired).toBeUndefined();
    });

    it('should log audit event with mfaSetupRequired metadata', async () => {
      const adminUser = { ...mockUser, role: Role.ADMIN, mfaEnabled: false };
      usersService.findByEmail.mockResolvedValue(adminUser);
      const auditService = (authService as any).auditService;

      await authService.login(loginDto, requestMeta, requestMeta);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ mfaSetupRequired: true, role: 'ADMIN' }),
        }),
      );
    });

    it('should still return mfaSetupRequired when audit log rejects (fire-and-forget)', async () => {
      const auditService = (authService as any).auditService;
      auditService.log.mockRejectedValue(new Error('Audit DB down'));
      const adminUser = { ...mockUser, role: Role.ADMIN, mfaEnabled: false };
      usersService.findByEmail.mockResolvedValue(adminUser);

      const result = await authService.login(loginDto, requestMeta);

      expect((result as any).mfaSetupRequired).toBe(true);
    });
  });
});
