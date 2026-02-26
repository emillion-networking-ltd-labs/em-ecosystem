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
import { Role } from '../../users/enums/role.enum';
import { Provider } from '../../users/enums/provider.enum';
import { User } from '../../users/entities/user.entity';
import { OAuthProfile } from '../../common/interfaces/oauth-profile.interface';
import { OAuthCodeStore } from '../stores/oauth-code.store';

jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
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
    refreshToken: 'hashed-refresh-token',
    createdAt: new Date(),
    updatedAt: new Date(),
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
            updateRefreshToken: jest.fn(),
            incrementFailedAttempts: jest.fn(),
            resetFailedAttempts: jest.fn(),
            lockAccount: jest.fn(),
            findOrCreateByOAuth: jest.fn(),
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
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
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
        usersService.updateRefreshToken.mockResolvedValue(undefined);
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-value');
        jwtService.sign
          .mockReturnValueOnce('access-token-123')
          .mockReturnValueOnce('refresh-token-456');
      });

      it('should create a new user with hashed password and return JWT pair', async () => {
        const result = await authService.register(registerDto);

        expect(result.accessToken).toBe('access-token-123');
        expect(result.refreshToken).toBe('refresh-token-456');
        expect(result.user).toBeDefined();
      });

      it('should hash the password with bcrypt using 12 rounds', async () => {
        await authService.register(registerDto);

        expect(bcrypt.hash).toHaveBeenCalledWith('StrongPass1!', 12);
      });

      it('should return SafeUser without passwordHash or refreshToken', async () => {
        const result = await authService.register(registerDto);

        expect(result.user).not.toHaveProperty('passwordHash');
        expect(result.user).not.toHaveProperty('refreshToken');
        expect(result.user.email).toBe('test@example.com');
      });
    });

    describe('error cases', () => {
      it('should throw ConflictException when email already exists', async () => {
        usersService.findByEmail.mockResolvedValue(mockUser);

        await expect(authService.register(registerDto)).rejects.toThrow(
          ConflictException,
        );
      });
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'StrongPass1!' };

    describe('successful login', () => {
      beforeEach(() => {
        usersService.findByEmail.mockResolvedValue(mockUser);
        usersService.updateRefreshToken.mockResolvedValue(undefined);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
        jwtService.sign
          .mockReturnValueOnce('access-token')
          .mockReturnValueOnce('refresh-token');
      });

      it('should return JWT pair and SafeUser on valid credentials', async () => {
        const result = await authService.login(loginDto);

        expect(result.accessToken).toBe('access-token');
        expect(result.refreshToken).toBe('refresh-token');
        expect(result.user.email).toBe('test@example.com');
        expect(result.user).not.toHaveProperty('passwordHash');
      });

      it('should reset failed attempts on successful login when count > 0', async () => {
        usersService.findByEmail.mockResolvedValue({
          ...mockUser,
          failedAttempts: 3,
        });

        await authService.login(loginDto);

        expect(usersService.resetFailedAttempts).toHaveBeenCalledWith(
          'uuid-123',
        );
      });

      it('should not reset failed attempts when count is 0', async () => {
        await authService.login(loginDto);

        expect(usersService.resetFailedAttempts).not.toHaveBeenCalled();
      });
    });

    describe('error cases', () => {
      it('should throw UnauthorizedException when user not found', async () => {
        usersService.findByEmail.mockResolvedValue(null);

        await expect(authService.login(loginDto)).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('should throw ForbiddenException when account is locked', async () => {
        usersService.findByEmail.mockResolvedValue({
          ...mockUser,
          lockedUntil: new Date(Date.now() + 60000),
        });

        await expect(authService.login(loginDto)).rejects.toThrow(
          ForbiddenException,
        );
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

        await authService.login(loginDto);

        expect(usersService.resetFailedAttempts).toHaveBeenCalledWith(
          'uuid-123',
        );
      });

      it('should throw UnauthorizedException when user has no passwordHash (OAuth-only)', async () => {
        usersService.findByEmail.mockResolvedValue({
          ...mockUser,
          passwordHash: null,
        });

        await expect(authService.login(loginDto)).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('should throw UnauthorizedException on wrong password', async () => {
        usersService.findByEmail.mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);
        usersService.incrementFailedAttempts.mockResolvedValue({
          ...mockUser,
          failedAttempts: 1,
        });

        await expect(authService.login(loginDto)).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('should increment failed attempts on wrong password', async () => {
        usersService.findByEmail.mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);
        usersService.incrementFailedAttempts.mockResolvedValue({
          ...mockUser,
          failedAttempts: 1,
        });

        await expect(authService.login(loginDto)).rejects.toThrow();

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

        await expect(authService.login(loginDto)).rejects.toThrow(
          ForbiddenException,
        );
        expect(usersService.lockAccount).toHaveBeenCalledWith('uuid-123');
      });
    });
  });

  describe('refreshTokens', () => {
    it('should return new token pair on valid refresh token', async () => {
      jwtService.verify.mockReturnValue({ sub: 'uuid-123' });
      usersService.findById.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-refresh');
      usersService.updateRefreshToken.mockResolvedValue(undefined);
      jwtService.sign
        .mockReturnValueOnce('new-access')
        .mockReturnValueOnce('new-refresh');

      const result = await authService.refreshTokens('valid-refresh-token');

      expect(result.accessToken).toBe('new-access');
      expect(result.refreshToken).toBe('new-refresh');
    });

    it('should throw UnauthorizedException when token verification fails', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await expect(authService.refreshTokens('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      jwtService.verify.mockReturnValue({ sub: 'uuid-123' });
      usersService.findById.mockResolvedValue(null);

      await expect(authService.refreshTokens('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user has no stored refresh token', async () => {
      jwtService.verify.mockReturnValue({ sub: 'uuid-123' });
      usersService.findById.mockResolvedValue({
        ...mockUser,
        refreshToken: null,
      });

      await expect(authService.refreshTokens('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when refresh token does not match hash', async () => {
      jwtService.verify.mockReturnValue({ sub: 'uuid-123' });
      usersService.findById.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.refreshTokens('wrong-token')).rejects.toThrow(
        UnauthorizedException,
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
      refreshToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should find or create user and return JWT pair with SafeUser', async () => {
      usersService.findOrCreateByOAuth.mockResolvedValue(mockOAuthUser);
      usersService.updateRefreshToken.mockResolvedValue(undefined);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      jwtService.sign
        .mockReturnValueOnce('oauth-access-token')
        .mockReturnValueOnce('oauth-refresh-token');

      const result = await authService.validateOAuthUser(oauthProfile);

      expect(usersService.findOrCreateByOAuth).toHaveBeenCalledWith(
        oauthProfile,
      );
      expect(result.accessToken).toBe('oauth-access-token');
      expect(result.refreshToken).toBe('oauth-refresh-token');
      expect(result.user.email).toBe('oauth@example.com');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user).not.toHaveProperty('refreshToken');
    });

    it('should call generateTokens which stores hashed refresh token', async () => {
      usersService.findOrCreateByOAuth.mockResolvedValue(mockOAuthUser);
      usersService.updateRefreshToken.mockResolvedValue(undefined);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      jwtService.sign.mockReturnValue('token');

      await authService.validateOAuthUser(oauthProfile);

      expect(bcrypt.hash).toHaveBeenCalled();
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        'uuid-oauth',
        'hashed-refresh',
      );
    });
  });

  describe('generateOAuthCode', () => {
    it('should delegate to OAuthCodeStore.store and return the ephemeral code', () => {
      const payload = {
        accessToken: 'at',
        refreshToken: 'rt',
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
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
      oauthCodeStore.store.mockReturnValue('ephemeral-uuid');

      const code = authService.generateOAuthCode(payload);

      expect(oauthCodeStore.store).toHaveBeenCalledWith(payload);
      expect(code).toBe('ephemeral-uuid');
    });
  });

  describe('exchangeOAuthCode', () => {
    const mockPayload = {
      accessToken: 'at',
      refreshToken: 'rt',
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
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    it('should return tokens and user for a valid code', () => {
      oauthCodeStore.exchange.mockReturnValue(mockPayload);

      const result = authService.exchangeOAuthCode('valid-code');

      expect(oauthCodeStore.exchange).toHaveBeenCalledWith('valid-code');
      expect(result.accessToken).toBe('at');
      expect(result.refreshToken).toBe('rt');
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
    it('should invalidate refresh token by setting it to null', async () => {
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      await authService.logout('uuid-123');

      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        'uuid-123',
        null,
      );
    });
  });
});
