import { Injectable, Logger } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BRUTE_FORCE_WINDOW_MINUTES,
  BRUTE_FORCE_THRESHOLD,
  CREDENTIAL_STUFFING_THRESHOLD,
  UNUSUAL_HOURS_SAMPLE_SIZE,
  UNUSUAL_HOURS_STDDEV_THRESHOLD,
  UNUSUAL_HOURS_MIN_LOGINS,
} from './constants/suspicious-login.constants';

@Injectable()
export class SuspiciousLoginService {
  private readonly logger = new Logger(SuspiciousLoginService.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly mailService: MailService,
    private readonly prisma: PrismaService,
  ) {}

  async analyzeLoginFailure(params: {
    userId: string;
    ipAddress: string;
    userAgent?: string | null;
  }): Promise<void> {
    await Promise.all([
      this.checkBruteForce(params),
      this.checkCredentialStuffing(params),
    ]);
  }

  async analyzeLoginSuccess(params: {
    userId: string;
    email: string;
    firstName?: string | null;
    ipAddress: string;
    userAgent?: string | null;
    loginTime: Date;
  }): Promise<void> {
    await Promise.all([
      this.checkUnusualLoginHours({
        userId: params.userId,
        loginTime: params.loginTime,
      }),
      this.checkNewCountryLogin({
        userId: params.userId,
        email: params.email,
        firstName: params.firstName,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      }),
    ]);
  }

  private async checkBruteForce(params: {
    userId: string;
    ipAddress: string;
    userAgent?: string | null;
  }): Promise<void> {
    try {
      const failureCount = await this.auditService.countRecentActions({
        action: AuditAction.LOGIN_FAILURE,
        userId: params.userId,
        windowMinutes: BRUTE_FORCE_WINDOW_MINUTES,
      });

      if (failureCount < BRUTE_FORCE_THRESHOLD) return;

      const alreadyAlerted = await this.auditService.hasRecentAction({
        action: AuditAction.BRUTE_FORCE_DETECTED,
        userId: params.userId,
        windowMinutes: BRUTE_FORCE_WINDOW_MINUTES,
      });

      if (alreadyAlerted) return;

      this.auditService
        .log({
          action: AuditAction.BRUTE_FORCE_DETECTED,
          userId: params.userId,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          metadata: {
            failureCount,
            windowMinutes: BRUTE_FORCE_WINDOW_MINUTES,
            threshold: BRUTE_FORCE_THRESHOLD,
          },
        })
        .catch(() => {});

      const adminEmails = await this.getAdminEmails();
      if (adminEmails.length > 0) {
        this.mailService
          .sendSecurityAlertToAdmins(
            'Brute-Force Attack',
            {
              userId: params.userId,
              ipAddress: params.ipAddress,
              failureCount,
              timestamp: new Date(),
            },
            adminEmails,
          )
          .catch(() => {});
      }
    } catch (error) {
      this.logger.error('Brute-force detection failed', error);
    }
  }

  private async checkCredentialStuffing(params: {
    ipAddress: string;
    userAgent?: string | null;
  }): Promise<void> {
    try {
      const failureCount = await this.auditService.countRecentActionsByIp({
        action: AuditAction.LOGIN_FAILURE,
        ipAddress: params.ipAddress,
        windowMinutes: BRUTE_FORCE_WINDOW_MINUTES,
      });

      if (failureCount < CREDENTIAL_STUFFING_THRESHOLD) return;

      const alreadyAlerted = await this.auditService.hasRecentAction({
        action: AuditAction.CREDENTIAL_STUFFING_DETECTED,
        ipAddress: params.ipAddress,
        windowMinutes: BRUTE_FORCE_WINDOW_MINUTES,
      });

      if (alreadyAlerted) return;

      this.auditService
        .log({
          action: AuditAction.CREDENTIAL_STUFFING_DETECTED,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          metadata: {
            failureCount,
            windowMinutes: BRUTE_FORCE_WINDOW_MINUTES,
            threshold: CREDENTIAL_STUFFING_THRESHOLD,
          },
        })
        .catch(() => {});

      const adminEmails = await this.getAdminEmails();
      if (adminEmails.length > 0) {
        this.mailService
          .sendSecurityAlertToAdmins(
            'Credential Stuffing',
            {
              ipAddress: params.ipAddress,
              failureCount,
              timestamp: new Date(),
            },
            adminEmails,
          )
          .catch(() => {});
      }
    } catch (error) {
      this.logger.error('Credential stuffing detection failed', error);
    }
  }

  private async checkUnusualLoginHours(params: {
    userId: string;
    loginTime: Date;
  }): Promise<void> {
    try {
      const recentLogins = await this.prisma.auditLog.findMany({
        where: {
          action: AuditAction.LOGIN_SUCCESS as any,
          userId: params.userId,
        },
        orderBy: { createdAt: 'desc' },
        take: UNUSUAL_HOURS_SAMPLE_SIZE,
        select: { createdAt: true },
      });

      if (recentLogins.length < UNUSUAL_HOURS_MIN_LOGINS) return;

      const hours = recentLogins.map((l) => l.createdAt.getUTCHours());
      const currentHour = params.loginTime.getUTCHours();

      // Circular statistics for hours (handles midnight crossings)
      const sinSum = hours.reduce(
        (sum, h) => sum + Math.sin((h * Math.PI) / 12),
        0,
      );
      const cosSum = hours.reduce(
        (sum, h) => sum + Math.cos((h * Math.PI) / 12),
        0,
      );
      const meanAngle = Math.atan2(
        sinSum / hours.length,
        cosSum / hours.length,
      );
      const meanHour = ((meanAngle * 12) / Math.PI + 24) % 24;

      // Circular standard deviation
      const R = Math.sqrt(
        Math.pow(sinSum / hours.length, 2) + Math.pow(cosSum / hours.length, 2),
      );
      const circularVariance = 1 - R;
      const circularStdDev = Math.sqrt(-2 * Math.log(Math.max(R, 0.0001)));
      const stdDevHours = (circularStdDev * 12) / Math.PI;

      // Circular distance from mean
      const currentAngle = (currentHour * Math.PI) / 12;
      let angularDist = Math.abs(currentAngle - meanAngle);
      if (angularDist > Math.PI) angularDist = 2 * Math.PI - angularDist;
      const hourDist = (angularDist * 12) / Math.PI;

      if (
        stdDevHours > 0 &&
        hourDist / stdDevHours > UNUSUAL_HOURS_STDDEV_THRESHOLD
      ) {
        this.auditService
          .log({
            action: AuditAction.UNUSUAL_LOGIN_HOURS,
            userId: params.userId,
            metadata: {
              loginHour: currentHour,
              meanHour: Math.round(meanHour * 10) / 10,
              stdDevHours: Math.round(stdDevHours * 10) / 10,
              deviations: Math.round((hourDist / stdDevHours) * 10) / 10,
              sampleSize: hours.length,
            },
          })
          .catch(() => {});
      }
    } catch (error) {
      this.logger.error('Unusual login hours detection failed', error);
    }
  }

  private async checkNewCountryLogin(params: {
    userId: string;
    email: string;
    firstName?: string | null;
    ipAddress: string;
    userAgent?: string | null;
  }): Promise<void> {
    try {
      const latestSession = await this.prisma.session.findFirst({
        where: { userId: params.userId },
        orderBy: { createdAt: 'desc' },
        select: { locationCountry: true },
      });

      const currentCountry = latestSession?.locationCountry;
      if (!currentCountry) return;

      const previousSessions = await this.prisma.session.findMany({
        where: {
          userId: params.userId,
          locationCountry: { not: null },
        },
        distinct: ['locationCountry'],
        select: { locationCountry: true },
      });

      const previousCountries = previousSessions
        .map((s) => s.locationCountry!)
        .filter((c) => c !== currentCountry);

      // If no previous countries at all (first login with geo data), skip
      if (previousSessions.length <= 1) return;

      // If this country was already seen, skip
      const allCountries = previousSessions.map((s) => s.locationCountry!);
      const countryOccurrences = allCountries.filter(
        (c) => c === currentCountry,
      ).length;

      // If the current country appears only once (the session we just created), it's new
      if (countryOccurrences > 1) return;

      this.auditService
        .log({
          action: AuditAction.NEW_COUNTRY_LOGIN,
          userId: params.userId,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          metadata: {
            newCountry: currentCountry,
            previousCountries,
          },
        })
        .catch(() => {});

      this.mailService
        .sendNewCountryLoginAlert(params.email, {
          firstName: params.firstName,
          newCountry: currentCountry,
          previousCountries,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        })
        .catch(() => {});
    } catch (error) {
      this.logger.error('New country login detection failed', error);
    }
  }

  private async getAdminEmails(): Promise<string[]> {
    const admins = await this.prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPERADMIN'] as any },
        isActive: true,
      },
      select: { email: true },
    });
    return admins.map((a) => a.email);
  }
}
