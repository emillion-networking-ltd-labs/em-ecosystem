import { Test, TestingModule } from '@nestjs/testing';
import { AccountController } from '../account.controller';
import { AuthService } from '../auth.service';
import { TurnstileService } from '../../security/turnstile.service';
import { ConfigService } from '@nestjs/config';

describe('AccountController', () => {
  let controller: AccountController;
  let authService: jest.Mocked<AuthService>;

  const mockReq = {
    ip: '127.0.0.1',
    headers: { 'user-agent': 'test-agent' },
    cookies: {},
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            verifyEmail: jest.fn(),
            verifyEmailChange: jest.fn(),
            resendVerificationEmail: jest.fn(),
            resendVerificationByEmail: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
            validateResetToken: jest.fn(),
          },
        },
        {
          provide: TurnstileService,
          useValue: {
            verify: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                'app.frontendUrl': 'http://localhost:3001',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<AccountController>(AccountController);
    authService = module.get(AuthService);
  });

  // ─── Email Verification ─────────────────────────────────────

  describe('verifyEmail', () => {
    it('should redirect with success status on valid token', async () => {
      authService.verifyEmail.mockResolvedValue({ status: 'success' });
      const res = { redirect: jest.fn() };

      await controller.verifyEmail('valid-token', res as any);

      expect(authService.verifyEmail).toHaveBeenCalledWith('valid-token');
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('status=success'),
      );
    });

    it('should redirect with invalid status on missing token', async () => {
      const res = { redirect: jest.fn() };

      await controller.verifyEmail('', res as any);

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('status=invalid'),
      );
    });

    it('should redirect with invalid status on bad token', async () => {
      authService.verifyEmail.mockResolvedValue({ status: 'invalid' });
      const res = { redirect: jest.fn() };

      await controller.verifyEmail('bad-token', res as any);

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('status=invalid'),
      );
    });
  });

  describe('verifyEmailChange', () => {
    it('should redirect to frontend with status=invalid when no token provided', async () => {
      const res = { redirect: jest.fn() };

      await controller.verifyEmailChange('', res as any);

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('status=invalid'),
      );
    });

    it('should redirect to frontend with verification result status on success', async () => {
      authService.verifyEmailChange.mockResolvedValue({ status: 'success' });
      const res = { redirect: jest.fn() };

      await controller.verifyEmailChange('valid-token', res as any);

      expect(authService.verifyEmailChange).toHaveBeenCalledWith('valid-token');
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('status=success'),
      );
    });
  });

  describe('resendVerification', () => {
    it('should delegate to authService and return success message', async () => {
      authService.resendVerificationEmail.mockResolvedValue(undefined);
      const reqWithUser = { ...mockReq, user: { id: 'uuid-123' } };

      const result = await controller.resendVerification(reqWithUser);

      expect(authService.resendVerificationEmail).toHaveBeenCalledWith(
        'uuid-123',
      );
      expect(result).toEqual({ message: 'Verification email sent' });
    });
  });

  describe('resendVerificationPublic', () => {
    it('should delegate to authService and return generic message', async () => {
      authService.resendVerificationByEmail.mockResolvedValue(undefined);
      const dto = { email: 'test@example.com' };

      const result = await controller.resendVerificationPublic(dto);

      expect(authService.resendVerificationByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(result).toEqual({
        message:
          'If an account exists and needs verification, we have sent an email',
      });
    });
  });

  // ─── Password Reset ─────────────────────────────────────────

  describe('forgotPassword', () => {
    it('should delegate to authService and return success message', async () => {
      authService.forgotPassword.mockResolvedValue(undefined);
      const dto = { email: 'test@example.com' };

      const result = await controller.forgotPassword(dto);

      expect(authService.forgotPassword).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        message: 'If an account exists, a reset email has been sent',
      });
    });
  });

  describe('resetPassword', () => {
    it('should delegate to authService and return success message', async () => {
      authService.resetPassword.mockResolvedValue(undefined);
      const dto = { token: 'reset-token', newPassword: 'NewPass1!' };

      const result = await controller.resetPassword(dto, mockReq);

      expect(authService.resetPassword).toHaveBeenCalledWith(
        dto,
        expect.objectContaining({ ipAddress: '127.0.0.1' }),
      );
      expect(result).toEqual({ message: 'Password reset successfully' });
    });
  });

  describe('validateResetToken', () => {
    it('should delegate to authService and return validity', async () => {
      authService.validateResetToken.mockResolvedValue({ valid: true });

      const result = await controller.validateResetToken({
        token: 'some-token',
      });

      expect(authService.validateResetToken).toHaveBeenCalledWith('some-token');
      expect(result).toEqual({ valid: true });
    });
  });
});
