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

  async sendPasswordChangeNotification(
    email: string,
    firstName?: string | null,
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Your EM NexaCore password was changed',
        template: 'password-changed',
        context: {
          name: firstName || email.split('@')[0],
          frontendUrl,
          changedAt: new Date().toISOString(),
          currentYear: new Date().getFullYear(),
        },
      });
      this.logger.log(`Password change notification sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password change notification to ${email}`,
        error,
      );
    }
  }

  async sendLoginNotificationEmail(
    email: string,
    ipAddress: string,
    userAgent: string | null,
    firstName?: string | null,
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const sessionsUrl = `${frontendUrl}/dashboard/security/sessions`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'New sign-in to your EM NexaCore account',
        template: 'login-notification',
        context: {
          name: firstName || email.split('@')[0],
          device: this.parseUserAgent(userAgent),
          ipAddress,
          loginTime: new Date().toISOString(),
          sessionsUrl,
          frontendUrl,
          currentYear: new Date().getFullYear(),
        },
      });
      this.logger.log(`Login notification email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send login notification email to ${email}`,
        error,
      );
    }
  }

  async sendEmailChangeVerificationEmail(
    newEmail: string,
    token: string,
    firstName?: string | null,
  ): Promise<void> {
    const apiUrl = process.env.API_URL || 'http://localhost:3000';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const verificationUrl = `${apiUrl}/auth/verify-email-change?token=${token}`;

    try {
      await this.mailerService.sendMail({
        to: newEmail,
        subject: 'Verify your new EM NexaCore email address',
        template: 'email-change-verification',
        context: {
          name: firstName || newEmail.split('@')[0],
          verificationUrl,
          frontendUrl,
          expiresIn: '24 hours',
          currentYear: new Date().getFullYear(),
        },
      });
      this.logger.log(`Email change verification sent to ${newEmail}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email change verification to ${newEmail}`,
        error,
      );
    }
  }

  async sendEmailChangeRequestNotification(
    oldEmail: string,
    newEmail: string,
    firstName?: string | null,
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    try {
      await this.mailerService.sendMail({
        to: oldEmail,
        subject: 'Email change requested for your EM NexaCore account',
        template: 'email-change-notification',
        context: {
          name: firstName || oldEmail.split('@')[0],
          newEmail,
          frontendUrl,
          requestedAt: new Date().toISOString(),
          currentYear: new Date().getFullYear(),
        },
      });
      this.logger.log(`Email change notification sent to ${oldEmail}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email change notification to ${oldEmail}`,
        error,
      );
    }
  }

  async sendEmailChangedConfirmation(
    oldEmail: string,
    newEmail: string,
    firstName?: string | null,
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    try {
      await this.mailerService.sendMail({
        to: oldEmail,
        subject: 'Your EM NexaCore email address was changed',
        template: 'email-changed-confirmation',
        context: {
          name: firstName || oldEmail.split('@')[0],
          newEmail,
          frontendUrl,
          changedAt: new Date().toISOString(),
          currentYear: new Date().getFullYear(),
        },
      });
      this.logger.log(`Email changed confirmation sent to ${oldEmail}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email changed confirmation to ${oldEmail}`,
        error,
      );
    }
  }

  async sendAccountDeletionConfirmation(
    email: string,
    firstName?: string | null,
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Your EM NexaCore account has been deleted',
        template: 'account-deleted',
        context: {
          name: firstName || email.split('@')[0],
          frontendUrl,
          deletedAt: new Date().toISOString(),
          currentYear: new Date().getFullYear(),
        },
      });
      this.logger.log(`Account deletion confirmation sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send account deletion confirmation to ${email}`,
        error,
      );
    }
  }

  async sendImpossibleTravelAlert(
    email: string,
    params: {
      firstName?: string | null;
      previousCity: string | null;
      previousCountry: string | null;
      currentCity: string | null;
      currentCountry: string | null;
      distanceKm: number;
      elapsedHours: number;
      requiredSpeedKmh: number;
      ipAddress: string;
      userAgent: string | null;
      actionTaken: 'allowed' | 'challenged' | 'blocked';
    },
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const sessionsUrl = `${frontendUrl}/dashboard/security/sessions`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Suspicious login detected on your EM NexaCore account',
        template: 'impossible-travel-alert',
        context: {
          name: params.firstName || email.split('@')[0],
          previousLocation: this.formatLocation(
            params.previousCity,
            params.previousCountry,
          ),
          currentLocation: this.formatLocation(
            params.currentCity,
            params.currentCountry,
          ),
          distanceKm: Math.round(params.distanceKm),
          elapsedTime: this.formatElapsedTime(params.elapsedHours),
          device: this.parseUserAgent(params.userAgent),
          ipAddress: params.ipAddress,
          actionTaken: params.actionTaken,
          wasBlocked: params.actionTaken === 'blocked',
          sessionsUrl,
          frontendUrl,
          currentYear: new Date().getFullYear(),
        },
      });
      this.logger.log(`Impossible travel alert sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send impossible travel alert to ${email}`,
        error,
      );
    }
  }

  private formatLocation(
    city: string | null,
    country: string | null,
  ): string {
    if (city && country) return `${city}, ${country}`;
    if (city) return city;
    if (country) return country;
    return 'Unknown location';
  }

  private formatElapsedTime(hours: number): string {
    if (hours < 1) return `${Math.round(hours * 60)} minutes`;
    return `${hours.toFixed(1)} hours`;
  }

  private parseUserAgent(ua: string | null): string {
    if (!ua) return 'Unknown device';

    let browser = 'Unknown browser';
    if (ua.includes('Edg/')) browser = 'Edge';
    else if (ua.includes('Chrome/')) browser = 'Chrome';
    else if (ua.includes('Firefox/')) browser = 'Firefox';
    else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';

    let os = 'Unknown OS';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS') || ua.includes('Macintosh')) os = 'macOS';
    else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    return `${browser} on ${os}`;
  }
}
