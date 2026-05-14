// WARNING: AUTH DOMAIN — changes require Jira ticket + owner approval (see workflow-standards.mdc §15 Auth Change-Control)

import { Injectable, ForbiddenException } from '@nestjs/common';
import { ImpossibleTravelService } from '../geolocation/impossible-travel.service';
import { SuspiciousLoginService } from '../security/suspicious-login.service';
import { MailService } from '../mail/mail.service';
import { SessionsService } from '../sessions/sessions.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { ImpossibleTravelResult } from '../geolocation/interfaces/geolocation-result.interface';
import { ErrorMessages } from '../common/constants/error-messages';
import { createAuditLogger, AuditLogger } from './utils/audit-log.helper';

@Injectable()
export class LoginSecurityService {
  readonly logAudit: AuditLogger;

  constructor(
    private readonly impossibleTravelService: ImpossibleTravelService,
    private readonly suspiciousLoginService: SuspiciousLoginService,
    private readonly mailService: MailService,
    private readonly sessionsService: SessionsService,
    private readonly auditService: AuditService,
  ) {
    this.logAudit = createAuditLogger(this.auditService);
  }

  sendAccountLockedEmail(
    email: string,
    failedAttempts: number,
    lockoutMinutes: number,
    firstName?: string | null,
  ): void {
    this.mailService
      .sendAccountLockedEmail(email, failedAttempts, lockoutMinutes, firstName)
      .catch(() => {});
  }

  sendRegistrationAttemptNotification(
    email: string,
    firstName?: string | null,
  ): void {
    this.mailService
      .sendRegistrationAttemptNotification(email, firstName)
      .catch(() => {});
  }

  async checkImpossibleTravel(
    user: {
      id: string;
      email: string;
      firstName: string | null;
      mfaEnabled: boolean;
    },
    requestMeta: { ipAddress: string; userAgent?: string | null },
  ): Promise<ImpossibleTravelResult | null> {
    try {
      return await this.impossibleTravelService.detectImpossibleTravel({
        userId: user.id,
        ipAddress: requestMeta.ipAddress,
        email: user.email,
        firstName: user.firstName,
        userAgent: requestMeta.userAgent || null,
        mfaEnabled: user.mfaEnabled,
      });
    } catch {
      return null;
    }
  }

  handleTravelBlock(
    travelResult: ImpossibleTravelResult,
    userId: string,
    requestMeta: { ipAddress: string; userAgent?: string | null },
  ): void {
    this.logAudit(AuditAction.LOGIN_BLOCKED_TRAVEL, requestMeta, userId, {
      previousLocation: travelResult.previousLocation,
      currentLocation: travelResult.currentLocation,
      distanceKm: travelResult.distanceKm,
      elapsedHours: travelResult.elapsedHours,
      requiredSpeedKmh: travelResult.requiredSpeedKmh,
    });
    throw new ForbiddenException(ErrorMessages.auth.LOGIN_BLOCKED_SUSPICIOUS);
  }

  checkSuspiciousLoginSuccess(
    user: { id: string; email: string; firstName?: string | null },
    requestMeta: { ipAddress: string; userAgent?: string | null },
  ): void {
    this.suspiciousLoginService
      .analyzeLoginSuccess({
        userId: user.id,
        email: user.email,
        firstName: user.firstName ?? null,
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent ?? null,
        loginTime: new Date(),
      })
      .catch(() => {});
  }

  checkSuspiciousLoginFailure(
    userId: string | undefined,
    requestMeta: { ipAddress: string; userAgent?: string | null },
  ): void {
    if (!userId) return;
    this.suspiciousLoginService
      .analyzeLoginFailure({
        userId,
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent ?? null,
      })
      .catch(() => {});
  }

  async notifyIfNewDevice(
    user: { id: string; email: string; firstName: string | null },
    sessionId: string,
    requestMeta: { ipAddress: string; userAgent?: string | null },
  ): Promise<void> {
    const previousSessions =
      await this.sessionsService.findPreviousActiveSessions(user.id, sessionId);

    if (previousSessions.length === 0) return;

    const knownIp = previousSessions.some(
      (s) => s.ipAddress === requestMeta.ipAddress,
    );
    const knownUa = previousSessions.some(
      (s) => s.userAgent === (requestMeta.userAgent || null),
    );

    if (!knownIp || !knownUa) {
      await this.mailService.sendLoginNotificationEmail(
        user.email,
        requestMeta.ipAddress,
        requestMeta.userAgent || null,
        user.firstName,
      );
    }
  }
}
