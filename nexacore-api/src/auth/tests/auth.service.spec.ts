import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
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
import { AuditService } from '../../audit/audit.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let sessionsService: jest.Mocked<SessionsService>;
  let jwtService: jest.Mocked<JwtService>;
  let oauthCodeStore: jest.Mocked<OAuthCodeStore>;

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
    emailVerified: false,
    isActive: true,
    failedAttempts: 0,
    lockedUntil: null,
    lockoutCount: 0,
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
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    sessionsService = module.get(SessionsService);
    jwtService = module.get(JwtService);
    oauthCodeStore = module.get(OAuthCodeStore);
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
        jwtService.sign
          .mockReturnValueOnce('access-token-123')
          .mockReturnValueOnce('refresh-token-456');
        sessionsService.createSession.mockResolvedValue(mockSession);
        sessionsService.updateSessionHash.mockResolvedValue(undefined);
      });

      it('should create a new user with hashed password and return accessToken + cookie', async () => {
        const result = await authService.register(registerDto, requestMeta);

        expect(result.accessToken).toBe('access-token-123');
        expect(result.cookie).toBeDefined();
        expect(result.cookie.name).toBe('refresh_token');
        expect(result.user).toBeDefined();
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

      it('should create a session via SessionsService', async () => {
        await authService.register(registerDto, requestMeta);

        expect(sessionsService.createSession).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'uuid-123',
            ipAddress: '127.0.0.1',
          }),
        );
      });
    });

    describe('error cases', () => {
      it('should throw ConflictException when email already exists', async () => {
        usersService.findByEmail.mockResolvedValue(mockUser);

        await expect(
          authService.register(registerDto, requestMeta),
        ).rejects.toThrow(ConflictException);
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

        expect(usersService.resetFailedAttempts).toHaveBeenCalledWith(
          'uuid-123',
        );
      });

      it('should not reset failed attempts when count is 0', async () => {
        await authService.login(loginDto, requestMeta);

        expect(usersService.resetFailedAttempts).not.toHaveBeenCalled();
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

      it('should throw UnauthorizedException when user has no passwordHash (OAuth-only)', async () => {
        usersService.findByEmail.mockResolvedValue({
          ...mockUser,
          passwordHash: null,
        });
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        await expect(
          authService.login(loginDto, requestMeta),
        ).rejects.toThrow(UnauthorizedException);
        expect(bcrypt.compare).toHaveBeenCalled();
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
    it('should delegate to OAuthCodeStore.store and return the ephemeral code', () => {
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
      oauthCodeStore.store.mockReturnValue('ephemeral-uuid');

      const code = authService.generateOAuthCode(payload);

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

    it('should return accessToken, user, and cookie for a valid code', () => {
      oauthCodeStore.exchange.mockReturnValue(mockPayload);

      const result = authService.exchangeOAuthCode('valid-code');

      expect(oauthCodeStore.exchange).toHaveBeenCalledWith('valid-code');
      expect(result.accessToken).toBe('at');
      expect(result.cookie).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException for invalid or expired code', () => {
      oauthCodeStore.exchange.mockReturnValue(null);

      expect(() => authService.exchangeOAuthCode('invalid-code')).toThrow(
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
});
