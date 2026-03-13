import { Test, TestingModule } from '@nestjs/testing';
import { AccountController } from '../account.controller';
import { AuthService } from '../auth.service';
import { TurnstileService } from '../../security/turnstile.service';

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
      ],
    }).compile();

    controller = module.get<AccountController>(AccountController);
    authService = module.get(AuthService);
  });

  // ─── Email Verification ─────────────────────────────────────

  describe('verifyEmail', () => {
    it('should return success status on valid token', async () => {
      authService.verifyEmail.mockResolvedValue({ status: 'success' });

      const result = await controller.verifyEmail({ token: 'valid-token' });

      expect(authService.verifyEmail).toHaveBeenCalledWith('valid-token');
      expect(result).toEqual({ status: 'success' });
    });

    it('should return invalid status on bad token', async () => {
      authService.verifyEmail.mockResolvedValue({ status: 'invalid' });

      const result = await controller.verifyEmail({ token: 'bad-token' });

      expect(result).toEqual({ status: 'invalid' });
    });
  });

  describe('verifyEmailChange', () => {
    it('should return success status on valid token', async () => {
      authService.verifyEmailChange.mockResolvedValue({ status: 'success' });

      const result = await controller.verifyEmailChange({
        token: 'valid-token',
      });

      expect(authService.verifyEmailChange).toHaveBeenCalledWith('valid-token');
      expect(result).toEqual({ status: 'success' });
    });

    it('should return invalid status on bad token', async () => {
      authService.verifyEmailChange.mockResolvedValue({ status: 'invalid' });

      const result = await controller.verifyEmailChange({
        token: 'bad-token',
      });

      expect(result).toEqual({ status: 'invalid' });
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
