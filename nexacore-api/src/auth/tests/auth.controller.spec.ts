import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { AuditService } from '../../audit/audit.service';
import { Role } from '../../users/enums/role.enum';
import { Provider } from '../../users/enums/provider.enum';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthResult = {
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-456',
    user: {
      id: 'uuid-123',
      email: 'test@example.com',
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
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            refreshTokens: jest.fn(),
            logout: jest.fn(),
            generateOAuthCode: jest.fn().mockReturnValue('ephemeral-code-uuid'),
            exchangeOAuthCode: jest.fn(),
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

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  const mockReq = {
    ip: '127.0.0.1',
    headers: { 'user-agent': 'test-agent' },
  };

  const mockCtx = { ipAddress: '127.0.0.1', userAgent: 'test-agent' };

  describe('register', () => {
    const registerDto = { email: 'test@example.com', password: 'StrongPass1!' };

    it('should return the registration result on success', async () => {
      authService.register.mockResolvedValue(mockAuthResult);

      const result = await controller.register(registerDto, mockReq);

      expect(authService.register).toHaveBeenCalledWith(registerDto, mockCtx);
      expect(result.accessToken).toBe('access-token-123');
    });

    it('should propagate ConflictException from service', async () => {
      authService.register.mockRejectedValue(
        new ConflictException('Email already registered'),
      );

      await expect(controller.register(registerDto, mockReq)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'StrongPass1!' };

    it('should return JWT pair and user on valid credentials', async () => {
      authService.login.mockResolvedValue(mockAuthResult);

      const result = await controller.login(loginDto, mockReq);

      expect(authService.login).toHaveBeenCalledWith(loginDto, mockCtx);
      expect(result.accessToken).toBe('access-token-123');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should propagate UnauthorizedException on invalid credentials', async () => {
      authService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.login(loginDto, mockReq)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should propagate ForbiddenException when account is locked', async () => {
      authService.login.mockRejectedValue(
        new ForbiddenException('Account locked'),
      );

      await expect(controller.login(loginDto, mockReq)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('refresh', () => {
    const refreshDto = { refreshToken: 'valid-refresh-token' };

    it('should return new token pair on valid refresh token', async () => {
      authService.refreshTokens.mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });

      const result = await controller.refresh(refreshDto, mockReq);

      expect(authService.refreshTokens).toHaveBeenCalledWith(
        'valid-refresh-token',
        mockCtx,
      );
      expect(result.accessToken).toBe('new-access');
    });

    it('should propagate UnauthorizedException on invalid refresh token', async () => {
      authService.refreshTokens.mockRejectedValue(
        new UnauthorizedException('Invalid or expired refresh token'),
      );

      await expect(controller.refresh(refreshDto, mockReq)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should call authService.logout and return success message', async () => {
      authService.logout.mockResolvedValue(undefined);
      const req = {
        user: { id: 'uuid-123' },
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' },
      };

      const result = await controller.logout(req);

      expect(authService.logout).toHaveBeenCalledWith('uuid-123', mockCtx);
      expect(result.message).toBe('Logged out successfully');
    });
  });

  describe('getMe', () => {
    it('should return the user from the request', () => {
      const req = { user: mockAuthResult.user };

      const result = controller.getMe(req);

      expect(result).toBe(mockAuthResult.user);
    });
  });

  describe('getAdminDashboard', () => {
    it('should return admin access granted message', () => {
      const result = controller.getAdminDashboard();

      expect(result).toEqual({ message: 'Admin access granted' });
    });
  });

  describe('googleAuthCallback', () => {
    it('should return redirect URL with ephemeral code instead of tokens', () => {
      const req = {
        user: {
          accessToken: 'google-access',
          refreshToken: 'google-refresh',
          user: mockAuthResult.user,
        },
      };

      const result = controller.googleAuthCallback(req);

      expect(result.url).toBe(
        'http://localhost:3001/auth/callback?code=ephemeral-code-uuid',
      );
      expect(result.url).not.toContain('accessToken');
      expect(result.url).not.toContain('refreshToken');
      expect(authService.generateOAuthCode).toHaveBeenCalledWith(req.user);
    });
  });

  describe('githubAuthCallback', () => {
    it('should return redirect URL with ephemeral code instead of tokens', () => {
      const req = {
        user: {
          accessToken: 'github-access',
          refreshToken: 'github-refresh',
          user: mockAuthResult.user,
        },
      };

      const result = controller.githubAuthCallback(req);

      expect(result.url).toBe(
        'http://localhost:3001/auth/callback?code=ephemeral-code-uuid',
      );
      expect(result.url).not.toContain('accessToken');
      expect(result.url).not.toContain('refreshToken');
      expect(authService.generateOAuthCode).toHaveBeenCalledWith(req.user);
    });
  });

  describe('exchangeOAuthCode', () => {
    it('should return tokens and user for a valid code', () => {
      authService.exchangeOAuthCode.mockReturnValue(mockAuthResult);

      const result = controller.exchangeOAuthCode({ code: 'valid-code' });

      expect(authService.exchangeOAuthCode).toHaveBeenCalledWith('valid-code');
      expect(result.accessToken).toBe('access-token-123');
      expect(result.refreshToken).toBe('refresh-token-456');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should propagate UnauthorizedException for invalid code', () => {
      authService.exchangeOAuthCode.mockImplementation(() => {
        throw new UnauthorizedException(
          'Invalid or expired authorization code',
        );
      });

      expect(() =>
        controller.exchangeOAuthCode({ code: 'invalid-code' }),
      ).toThrow(UnauthorizedException);
    });
  });
});
