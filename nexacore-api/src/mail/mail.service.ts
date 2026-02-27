import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationEmail(
    email: string,
    token: string,
    firstName?: string | null,
  ): Promise<void> {
    const apiUrl = process.env.API_URL || 'http://localhost:3000';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const verificationUrl = `${apiUrl}/auth/verify-email?token=${token}`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Verify your EM NexaCore email address',
        template: 'verification',
        context: {
          name: firstName || email.split('@')[0],
          verificationUrl,
          frontendUrl,
          expiresIn: '24 hours',
          currentYear: new Date().getFullYear(),
        },
      });
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${email}`,
        error,
      );
      // Do not throw — registration should succeed even if email fails
    }
  }

  async sendPasswordResetEmail(
    email: string,
    token: string,
    firstName?: string | null,
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Reset your EM NexaCore password',
        template: 'password-reset',
        context: {
          name: firstName || email.split('@')[0],
          resetUrl,
          frontendUrl,
          expiresIn: '1 hour',
          currentYear: new Date().getFullYear(),
        },
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}`,
        error,
      );
      // Do not throw — always return 200 to prevent enumeration
    }
  }
}
