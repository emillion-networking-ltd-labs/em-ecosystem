import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import { MailService } from '../mail.service';

describe('MailService', () => {
  let mailService: MailService;
  let mailerService: jest.Mocked<MailerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
    mailerService = module.get(MailerService);
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email with correct parameters', async () => {
      await mailService.sendVerificationEmail(
        'test@example.com',
        'test-token',
        'John',
      );

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Verify your EM NexaCore email address',
          template: 'verification',
          context: expect.objectContaining({
            name: 'John',
            expiresIn: '24 hours',
          }),
        }),
      );
    });

    it('should use email prefix as name when firstName is null', async () => {
      await mailService.sendVerificationEmail(
        'test@example.com',
        'test-token',
        null,
      );

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            name: 'test',
          }),
        }),
      );
    });

    it('should not throw when mailer fails', async () => {
      mailerService.sendMail.mockRejectedValueOnce(new Error('SMTP error'));

      await expect(
        mailService.sendVerificationEmail(
          'test@example.com',
          'test-token',
          null,
        ),
      ).resolves.toBeUndefined();
    });

    it('should include verification URL with API base', async () => {
      await mailService.sendVerificationEmail(
        'test@example.com',
        'abc123',
        null,
      );

      const call = mailerService.sendMail.mock.calls[0][0];
      expect(call.context.verificationUrl).toContain(
        '/auth/verify-email?token=abc123',
      );
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with correct parameters', async () => {
      await mailService.sendPasswordResetEmail(
        'test@example.com',
        'reset-token',
        'Jane',
      );

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Reset your EM NexaCore password',
          template: 'password-reset',
          context: expect.objectContaining({
            name: 'Jane',
            expiresIn: '1 hour',
          }),
        }),
      );
    });

    it('should include reset URL with frontend base', async () => {
      await mailService.sendPasswordResetEmail(
        'test@example.com',
        'xyz789',
        null,
      );

      const call = mailerService.sendMail.mock.calls[0][0];
      expect(call.context.resetUrl).toContain(
        '/reset-password?token=xyz789',
      );
    });

    it('should not throw when mailer fails', async () => {
      mailerService.sendMail.mockRejectedValueOnce(new Error('SMTP error'));

      await expect(
        mailService.sendPasswordResetEmail(
          'test@example.com',
          'reset-token',
          null,
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('sendLoginNotificationEmail', () => {
    it('should send login notification email with correct parameters', async () => {
      await mailService.sendLoginNotificationEmail(
        'test@example.com',
        '192.168.1.1',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Alice',
      );

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'New sign-in to your EM NexaCore account',
          template: 'login-notification',
          context: expect.objectContaining({
            name: 'Alice',
            ipAddress: '192.168.1.1',
            device: 'Chrome on Windows',
          }),
        }),
      );
    });

    it('should use email prefix as name when firstName is null', async () => {
      await mailService.sendLoginNotificationEmail(
        'test@example.com',
        '10.0.0.1',
        null,
        null,
      );

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            name: 'test',
            device: 'Unknown device',
          }),
        }),
      );
    });

    it('should not throw when mailer fails', async () => {
      mailerService.sendMail.mockRejectedValueOnce(new Error('SMTP error'));

      await expect(
        mailService.sendLoginNotificationEmail(
          'test@example.com',
          '10.0.0.1',
          null,
          null,
        ),
      ).resolves.toBeUndefined();
    });

    it('should parse common user agents into readable device strings', async () => {
      const cases = [
        { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36', expected: 'Chrome on Windows' },
        { ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15', expected: 'Safari on macOS' },
        { ua: 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/121.0', expected: 'Firefox on Linux' },
        { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36 Edg/120.0', expected: 'Edge on Windows' },
      ];

      for (const { ua, expected } of cases) {
        mailerService.sendMail.mockClear();
        await mailService.sendLoginNotificationEmail('a@b.com', '1.2.3.4', ua);
        const call = mailerService.sendMail.mock.calls[0][0];
        expect(call.context.device).toBe(expected);
      }
    });
  });

  describe('sendEmailChangeVerificationEmail', () => {
    it('should send email change verification email with correct parameters', async () => {
      await mailService.sendEmailChangeVerificationEmail(
        'new@example.com',
        'change-token',
        'John',
      );

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'new@example.com',
          subject: 'Verify your new EM NexaCore email address',
          template: 'email-change-verification',
          context: expect.objectContaining({
            name: 'John',
            expiresIn: '24 hours',
          }),
        }),
      );
    });

    it('should use email prefix as name when firstName is null', async () => {
      await mailService.sendEmailChangeVerificationEmail(
        'new@example.com',
        'change-token',
        null,
      );

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            name: 'new',
          }),
        }),
      );
    });

    it('should include verification URL with token', async () => {
      await mailService.sendEmailChangeVerificationEmail(
        'new@example.com',
        'abc123',
        null,
      );

      const call = mailerService.sendMail.mock.calls[0][0];
      expect(call.context.verificationUrl).toContain(
        '/auth/verify-email-change?token=abc123',
      );
    });

    it('should not throw when mailer fails', async () => {
      mailerService.sendMail.mockRejectedValueOnce(new Error('SMTP error'));

      await expect(
        mailService.sendEmailChangeVerificationEmail(
          'new@example.com',
          'change-token',
          null,
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('sendEmailChangeRequestNotification', () => {
    it('should send email change request notification with correct parameters', async () => {
      await mailService.sendEmailChangeRequestNotification(
        'old@example.com',
        'new@example.com',
        'Jane',
      );

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'old@example.com',
          subject: 'Email change requested for your EM NexaCore account',
          template: 'email-change-notification',
          context: expect.objectContaining({
            name: 'Jane',
            newEmail: 'new@example.com',
            requestedAt: expect.any(String),
          }),
        }),
      );
    });

    it('should not throw when mailer fails', async () => {
      mailerService.sendMail.mockRejectedValueOnce(new Error('SMTP error'));

      await expect(
        mailService.sendEmailChangeRequestNotification(
          'old@example.com',
          'new@example.com',
          null,
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('sendEmailChangedConfirmation', () => {
    it('should send email changed confirmation with correct parameters', async () => {
      await mailService.sendEmailChangedConfirmation(
        'old@example.com',
        'new@example.com',
        'Alice',
      );

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'old@example.com',
          subject: 'Your EM NexaCore email address was changed',
          template: 'email-changed-confirmation',
          context: expect.objectContaining({
            name: 'Alice',
            newEmail: 'new@example.com',
            changedAt: expect.any(String),
          }),
        }),
      );
    });

    it('should not throw when mailer fails', async () => {
      mailerService.sendMail.mockRejectedValueOnce(new Error('SMTP error'));

      await expect(
        mailService.sendEmailChangedConfirmation(
          'old@example.com',
          'new@example.com',
          null,
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('sendAccountDeletionConfirmation', () => {
    it('should send account deletion confirmation with correct parameters', async () => {
      await mailService.sendAccountDeletionConfirmation(
        'user@example.com',
        'John',
      );

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Your EM NexaCore account has been deleted',
          template: 'account-deleted',
          context: expect.objectContaining({
            name: 'John',
            deletedAt: expect.any(String),
          }),
        }),
      );
    });

    it('should not throw when mailer fails', async () => {
      mailerService.sendMail.mockRejectedValueOnce(new Error('SMTP error'));

      await expect(
        mailService.sendAccountDeletionConfirmation(
          'user@example.com',
          null,
        ),
      ).resolves.toBeUndefined();
    });
  });
});
