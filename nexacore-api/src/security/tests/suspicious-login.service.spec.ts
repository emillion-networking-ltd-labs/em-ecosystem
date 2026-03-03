import { Test, TestingModule } from '@nestjs/testing';
import { SuspiciousLoginService } from '../suspicious-login.service';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/enums/audit-action.enum';
import { MailService } from '../../mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('SuspiciousLoginService', () => {
  let service: SuspiciousLoginService;
  let auditService: {
    countRecentActions: jest.Mock;
    countRecentActionsByIp: jest.Mock;
    hasRecentAction: jest.Mock;
    log: jest.Mock;
  };
  let mailService: {
    sendSecurityAlertToAdmins: jest.Mock;
    sendNewCountryLoginAlert: jest.Mock;
  };
  let prisma: {
    auditLog: { findMany: jest.Mock };
    session: { findFirst: jest.Mock; findMany: jest.Mock };
    user: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    auditService = {
      countRecentActions: jest.fn().mockResolvedValue(0),
      countRecentActionsByIp: jest.fn().mockResolvedValue(0),
      hasRecentAction: jest.fn().mockResolvedValue(false),
      log: jest.fn().mockResolvedValue(undefined),
    };

    mailService = {
      sendSecurityAlertToAdmins: jest.fn().mockResolvedValue(undefined),
      sendNewCountryLoginAlert: jest.fn().mockResolvedValue(undefined),
    };

    prisma = {
      auditLog: { findMany: jest.fn().mockResolvedValue([]) },
      session: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
      },
      user: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuspiciousLoginService,
        { provide: AuditService, useValue: auditService },
        { provide: MailService, useValue: mailService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SuspiciousLoginService>(SuspiciousLoginService);
  });

  // ── Brute-Force Detection ──

  describe('checkBruteForce (via analyzeLoginFailure)', () => {
    const failureParams = {
      userId: 'user-1',
      ipAddress: '1.2.3.4',
      userAgent: 'Mozilla/5.0',
    };

    it('should not alert when failure count is below threshold', async () => {
      auditService.countRecentActions.mockResolvedValue(5);

      await service.analyzeLoginFailure(failureParams);

      expect(auditService.countRecentActions).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.LOGIN_FAILURE,
          userId: 'user-1',
        }),
      );
      expect(auditService.log).not.toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.BRUTE_FORCE_DETECTED }),
      );
    });

    it('should fire BRUTE_FORCE_DETECTED audit + admin email when threshold exceeded', async () => {
      auditService.countRecentActions.mockResolvedValue(12);
      auditService.hasRecentAction.mockResolvedValue(false);
      prisma.user.findMany.mockResolvedValue([
        { email: 'admin@test.com' },
        { email: 'super@test.com' },
      ]);

      await service.analyzeLoginFailure(failureParams);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.BRUTE_FORCE_DETECTED,
          userId: 'user-1',
          ipAddress: '1.2.3.4',
        }),
      );
      expect(mailService.sendSecurityAlertToAdmins).toHaveBeenCalledWith(
        'Brute-Force Attack',
        expect.objectContaining({
          userId: 'user-1',
          ipAddress: '1.2.3.4',
          failureCount: 12,
        }),
        ['admin@test.com', 'super@test.com'],
      );
    });

    it('should de-duplicate: no alert if BRUTE_FORCE_DETECTED already exists in window', async () => {
      auditService.countRecentActions.mockResolvedValue(12);
      auditService.hasRecentAction.mockResolvedValue(true);

      await service.analyzeLoginFailure(failureParams);

      expect(auditService.log).not.toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.BRUTE_FORCE_DETECTED }),
      );
      expect(mailService.sendSecurityAlertToAdmins).not.toHaveBeenCalled();
    });

    it('should not throw on internal error (fail-open)', async () => {
      auditService.countRecentActions.mockRejectedValue(new Error('DB error'));

      await expect(
        service.analyzeLoginFailure(failureParams),
      ).resolves.toBeUndefined();
    });

    it('should not send email when no admin users exist', async () => {
      auditService.countRecentActions.mockResolvedValue(12);
      auditService.hasRecentAction.mockResolvedValue(false);
      prisma.user.findMany.mockResolvedValue([]);

      await service.analyzeLoginFailure(failureParams);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.BRUTE_FORCE_DETECTED }),
      );
      expect(mailService.sendSecurityAlertToAdmins).not.toHaveBeenCalled();
    });
  });

  // ── Credential Stuffing Detection ──

  describe('checkCredentialStuffing (via analyzeLoginFailure)', () => {
    const failureParams = {
      userId: 'user-1',
      ipAddress: '1.2.3.4',
      userAgent: 'Mozilla/5.0',
    };

    it('should not alert when failure count from IP is below threshold', async () => {
      auditService.countRecentActionsByIp.mockResolvedValue(5);

      await service.analyzeLoginFailure(failureParams);

      expect(auditService.log).not.toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CREDENTIAL_STUFFING_DETECTED,
        }),
      );
    });

    it('should fire CREDENTIAL_STUFFING_DETECTED audit + admin email when threshold exceeded', async () => {
      auditService.countRecentActionsByIp.mockResolvedValue(25);
      auditService.hasRecentAction.mockResolvedValue(false);
      prisma.user.findMany.mockResolvedValue([{ email: 'admin@test.com' }]);

      await service.analyzeLoginFailure(failureParams);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CREDENTIAL_STUFFING_DETECTED,
          ipAddress: '1.2.3.4',
        }),
      );
      expect(mailService.sendSecurityAlertToAdmins).toHaveBeenCalledWith(
        'Credential Stuffing',
        expect.objectContaining({
          ipAddress: '1.2.3.4',
          failureCount: 25,
        }),
        ['admin@test.com'],
      );
    });

    it('should de-duplicate alerts', async () => {
      auditService.countRecentActionsByIp.mockResolvedValue(25);
      // First call for brute-force returns false, second for credential stuffing returns true
      auditService.hasRecentAction
        .mockResolvedValueOnce(false) // brute-force check
        .mockResolvedValueOnce(true); // credential stuffing check
      // Brute force threshold not met
      auditService.countRecentActions.mockResolvedValue(3);

      await service.analyzeLoginFailure(failureParams);

      expect(mailService.sendSecurityAlertToAdmins).not.toHaveBeenCalled();
    });

    it('should not throw on internal error (fail-open)', async () => {
      auditService.countRecentActionsByIp.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(
        service.analyzeLoginFailure(failureParams),
      ).resolves.toBeUndefined();
    });
  });

  // ── Unusual Login Hours Detection ──

  describe('checkUnusualLoginHours (via analyzeLoginSuccess)', () => {
    const successParams = {
      userId: 'user-1',
      email: 'user@test.com',
      firstName: 'John',
      ipAddress: '1.2.3.4',
      userAgent: 'Mozilla/5.0',
      loginTime: new Date('2026-03-03T03:00:00Z'), // 3 AM UTC
    };

    it('should skip when user has fewer than 5 logins (insufficient data)', async () => {
      prisma.auditLog.findMany.mockResolvedValue([
        { createdAt: new Date('2026-03-01T10:00:00Z') },
        { createdAt: new Date('2026-03-01T11:00:00Z') },
      ]);

      await service.analyzeLoginSuccess(successParams);

      expect(auditService.log).not.toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.UNUSUAL_LOGIN_HOURS }),
      );
    });

    it('should not flag when login is within normal hours', async () => {
      // All logins around 10 AM, current login at 10 AM
      const logins = Array.from({ length: 10 }, (_, i) => ({
        createdAt: new Date(`2026-03-0${(i % 9) + 1}T10:00:00Z`),
      }));
      prisma.auditLog.findMany.mockResolvedValue(logins);

      const normalParams = {
        ...successParams,
        loginTime: new Date('2026-03-03T10:00:00Z'),
      };

      await service.analyzeLoginSuccess(normalParams);

      expect(auditService.log).not.toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.UNUSUAL_LOGIN_HOURS }),
      );
    });

    it('should fire UNUSUAL_LOGIN_HOURS when login is far from mean', async () => {
      // All logins around 10 AM UTC (consistent pattern)
      const logins = Array.from({ length: 10 }, (_, i) => ({
        createdAt: new Date(`2026-02-${String(i + 10).padStart(2, '0')}T10:00:00Z`),
      }));
      prisma.auditLog.findMany.mockResolvedValue(logins);

      // Login at 3 AM — far from 10 AM mean
      await service.analyzeLoginSuccess(successParams);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.UNUSUAL_LOGIN_HOURS,
          userId: 'user-1',
        }),
      );
    });

    it('should not send email (audit only)', async () => {
      const logins = Array.from({ length: 10 }, (_, i) => ({
        createdAt: new Date(`2026-02-${String(i + 10).padStart(2, '0')}T10:00:00Z`),
      }));
      prisma.auditLog.findMany.mockResolvedValue(logins);

      await service.analyzeLoginSuccess(successParams);

      expect(mailService.sendSecurityAlertToAdmins).not.toHaveBeenCalled();
      expect(mailService.sendNewCountryLoginAlert).not.toHaveBeenCalled();
    });

    it('should not throw on internal error (fail-open)', async () => {
      prisma.auditLog.findMany.mockRejectedValue(new Error('DB error'));

      await expect(
        service.analyzeLoginSuccess(successParams),
      ).resolves.toBeUndefined();
    });
  });

  // ── New Country Login Detection ──

  describe('checkNewCountryLogin (via analyzeLoginSuccess)', () => {
    const successParams = {
      userId: 'user-1',
      email: 'user@test.com',
      firstName: 'John',
      ipAddress: '1.2.3.4',
      userAgent: 'Mozilla/5.0',
      loginTime: new Date(),
    };

    it('should not alert when country is null (no geo data)', async () => {
      prisma.session.findFirst.mockResolvedValue({ locationCountry: null });

      await service.analyzeLoginSuccess(successParams);

      expect(auditService.log).not.toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.NEW_COUNTRY_LOGIN }),
      );
    });

    it('should not alert when country has been seen before', async () => {
      prisma.session.findFirst.mockResolvedValue({ locationCountry: 'US' });
      prisma.session.findMany.mockResolvedValue([
        { locationCountry: 'US' },
        { locationCountry: 'US' },
        { locationCountry: 'GB' },
      ]);

      await service.analyzeLoginSuccess(successParams);

      expect(auditService.log).not.toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.NEW_COUNTRY_LOGIN }),
      );
    });

    it('should fire NEW_COUNTRY_LOGIN audit + user email when country is new', async () => {
      prisma.session.findFirst.mockResolvedValue({ locationCountry: 'JP' });
      prisma.session.findMany.mockResolvedValue([
        { locationCountry: 'US' },
        { locationCountry: 'GB' },
        { locationCountry: 'JP' }, // only once (current session)
      ]);

      await service.analyzeLoginSuccess(successParams);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.NEW_COUNTRY_LOGIN,
          userId: 'user-1',
          metadata: expect.objectContaining({
            newCountry: 'JP',
            previousCountries: ['US', 'GB'],
          }),
        }),
      );
      expect(mailService.sendNewCountryLoginAlert).toHaveBeenCalledWith(
        'user@test.com',
        expect.objectContaining({
          firstName: 'John',
          newCountry: 'JP',
          previousCountries: ['US', 'GB'],
          ipAddress: '1.2.3.4',
        }),
      );
    });

    it('should skip for first-ever login (no previous sessions with country data)', async () => {
      prisma.session.findFirst.mockResolvedValue({ locationCountry: 'US' });
      prisma.session.findMany.mockResolvedValue([
        { locationCountry: 'US' },
      ]);

      await service.analyzeLoginSuccess(successParams);

      expect(auditService.log).not.toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.NEW_COUNTRY_LOGIN }),
      );
    });

    it('should not throw on internal error (fail-open)', async () => {
      prisma.session.findFirst.mockRejectedValue(new Error('DB error'));

      await expect(
        service.analyzeLoginSuccess(successParams),
      ).resolves.toBeUndefined();
    });
  });

  // ── Orchestrators ──

  describe('analyzeLoginFailure', () => {
    it('should call both brute-force and credential stuffing checks', async () => {
      auditService.countRecentActions.mockResolvedValue(0);
      auditService.countRecentActionsByIp.mockResolvedValue(0);

      await service.analyzeLoginFailure({
        userId: 'user-1',
        ipAddress: '1.2.3.4',
      });

      expect(auditService.countRecentActions).toHaveBeenCalled();
      expect(auditService.countRecentActionsByIp).toHaveBeenCalled();
    });
  });

  describe('analyzeLoginSuccess', () => {
    it('should call both unusual hours and new country checks', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.session.findFirst.mockResolvedValue(null);

      await service.analyzeLoginSuccess({
        userId: 'user-1',
        email: 'user@test.com',
        firstName: 'John',
        ipAddress: '1.2.3.4',
        userAgent: null,
        loginTime: new Date(),
      });

      expect(prisma.auditLog.findMany).toHaveBeenCalled();
      expect(prisma.session.findFirst).toHaveBeenCalled();
    });
  });

  // ── Admin Email Query ──

  describe('getAdminEmails (via brute-force path)', () => {
    it('should fetch active ADMIN and SUPERADMIN emails', async () => {
      auditService.countRecentActions.mockResolvedValue(12);
      auditService.hasRecentAction.mockResolvedValue(false);
      prisma.user.findMany.mockResolvedValue([{ email: 'admin@test.com' }]);

      await service.analyzeLoginFailure({
        userId: 'user-1',
        ipAddress: '1.2.3.4',
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          role: { in: expect.arrayContaining(['ADMIN', 'SUPERADMIN']) },
          isActive: true,
        },
        select: { email: true },
      });
    });
  });
});
