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
});
