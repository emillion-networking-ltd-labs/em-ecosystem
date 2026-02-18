import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
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
      role: Role.USER,
      provider: Provider.LOCAL,
      providerId: null,
      emailVerified: false,
      failedAttempts: 0,
      lockedUntil: null,
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
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  describe('register', () => {
    const registerDto = { email: 'test@example.com', password: 'StrongPass1!' };

    it('should return the registration result on success', async () => {
      authService.register.mockResolvedValue(mockAuthResult);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result.accessToken).toBe('access-token-123');
    });

    it('should propagate ConflictException from service', async () => {
      authService.register.mockRejectedValue(
        new ConflictException('Email already registered'),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'StrongPass1!' };

    it('should return JWT pair and user on valid credentials', async () => {
      authService.login.mockResolvedValue(mockAuthResult);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result.accessToken).toBe('access-token-123');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should propagate UnauthorizedException on invalid credentials', async () => {
      authService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should propagate ForbiddenException when account is locked', async () => {
      authService.login.mockRejectedValue(
        new ForbiddenException('Account locked'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
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

      const result = await controller.refresh(refreshDto);

      expect(authService.refreshTokens).toHaveBeenCalledWith(
        'valid-refresh-token',
      );
      expect(result.accessToken).toBe('new-access');
    });

    it('should propagate UnauthorizedException on invalid refresh token', async () => {
      authService.refreshTokens.mockRejectedValue(
        new UnauthorizedException('Invalid or expired refresh token'),
      );

      await expect(controller.refresh(refreshDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should call authService.logout and return success message', async () => {
      authService.logout.mockResolvedValue(undefined);
      const req = { user: { id: 'uuid-123' } };

      const result = await controller.logout(req);

      expect(authService.logout).toHaveBeenCalledWith('uuid-123');
      expect(result.message).toBe('Logged out successfully');
    });
  });

  describe('googleAuthCallback', () => {
    it('should return redirect URL with tokens from OAuth result', () => {
      const req = {
        user: {
          accessToken: 'google-access',
          refreshToken: 'google-refresh',
          user: mockAuthResult.user,
        },
      };

      const result = controller.googleAuthCallback(req);

      expect(result.url).toBe(
        'http://localhost:3001/auth/callback?accessToken=google-access&refreshToken=google-refresh',
      );
    });
  });

  describe('githubAuthCallback', () => {
    it('should return redirect URL with tokens from OAuth result', () => {
      const req = {
        user: {
          accessToken: 'github-access',
          refreshToken: 'github-refresh',
          user: mockAuthResult.user,
        },
      };

      const result = controller.githubAuthCallback(req);

      expect(result.url).toBe(
        'http://localhost:3001/auth/callback?accessToken=github-access&refreshToken=github-refresh',
      );
    });
  });
});
