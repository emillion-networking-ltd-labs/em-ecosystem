import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { SessionsService } from '../../sessions/sessions.service';
import { Role } from '../../users/enums/role.enum';
import { User } from '../../users/entities/user.entity';
import { OAuthCodeStore } from '../stores/oauth-code.store';
import { PasswordBreachService } from '../password-breach.service';
import { TrustedDeviceService } from '../trusted-device.service';
import { ImpossibleTravelService } from '../../geolocation/impossible-travel.service';
import { SuspiciousLoginService } from '../../security/suspicious-login.service';
import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { TokenDenyListService } from '../token-deny-list.service';
import { LoginSecurityService } from '../login-security.service';
import { TokenService } from '../token.service';
import { LoginService } from '../login.service';
import { OAuthAuthService } from '../oauth-auth.service';
import { EmailVerificationService } from '../email-verification.service';
import { PasswordResetService } from '../password-reset.service';
import { PasskeyService } from '../passkey.service';

// ─── Shared Fixtures ─────────────────────────────────────────

export const mockUser: User = {
  id: 'uuid-123',
  email: 'test@example.com',
  passwordHash: 'hashed-password',
  firstName: null,
  lastName: null,
  avatarUrl: null,
  avatarOriginalUrl: null,
  avatarCropData: null,
  role: Role.USER,
  emailVerified: true,
  pendingEmail: null,
  isActive: true,
  failedAttempts: 0,
  lockedUntil: null,
  lockoutCount: 0,
  mfaEnabled: false,
  mfaSecret: null,
  mfaRecoveryCodes: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const requestMeta = { ipAddress: '127.0.0.1', userAgent: 'test-agent' };

export const mockSession = {
  id: 'session-uuid',
  userId: 'uuid-123',
  tokenFamily: 'family-uuid',
  refreshTokenHash: 'hashed',
  deviceInfo: null,
  ipAddress: '127.0.0.1',
  userAgent: 'test-agent',
  isRevoked: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastUsedAt: new Date(),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
};

// ─── Module Factory ──────────────────────────────────────────

export interface AuthTestContext {
  authService: AuthService;
  usersService: jest.Mocked<UsersService>;
  sessionsService: jest.Mocked<SessionsService>;
  jwtService: jest.Mocked<JwtService>;
  oauthCodeStore: jest.Mocked<OAuthCodeStore>;
  passwordBreachService: jest.Mocked<PasswordBreachService>;
  trustedDeviceService: jest.Mocked<TrustedDeviceService>;
  impossibleTravelService: jest.Mocked<ImpossibleTravelService>;
  suspiciousLoginService: jest.Mocked<SuspiciousLoginService>;
  mailService: jest.Mocked<MailService>;
  prismaService: any;
  auditService: jest.Mocked<AuditService>;
  loginSecurityService: LoginSecurityService;
}

export async function createAuthTestModule(): Promise<AuthTestContext> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      AuthService,
      TokenService,
      LoginService,
      LoginSecurityService,
      OAuthAuthService,
      EmailVerificationService,
      PasswordResetService,
      {
        provide: UsersService,
        useValue: {
          findByEmail: jest.fn(),
          findById: jest.fn(),
          create: jest.fn(),
          incrementFailedAttempts: jest.fn(),
          resetFailedAttempts: jest.fn(),
          resetLockoutEscalation: jest.fn(),
          lockAccount: jest.fn(),
          findOrCreateByOAuth: jest.fn(),
        },
      },
      {
        provide: SessionsService,
        useValue: {
          createSession: jest.fn().mockResolvedValue(mockSession),
          findById: jest.fn(),
          rotateRefreshToken: jest.fn().mockResolvedValue(mockSession),
          revokeSession: jest.fn(),
          revokeAllUserSessions: jest.fn(),
          getActiveSessions: jest.fn(),
          updateSessionHash: jest.fn(),
          isSessionIdle: jest.fn().mockReturnValue(false),
          getActiveNonIdleSessions: jest.fn().mockResolvedValue([]),
          enforceSessionLimit: jest.fn().mockResolvedValue(undefined),
          cleanupIdleSessionsForUser: jest.fn().mockResolvedValue(0),
          revokeSessionDirect: jest.fn().mockResolvedValue(undefined),
          findPreviousActiveSessions: jest.fn().mockResolvedValue([]),
        },
      },
      {
        provide: JwtService,
        useValue: {
          sign: jest.fn(),
          verify: jest.fn(),
        },
      },
      {
        provide: OAuthCodeStore,
        useValue: {
          store: jest.fn(),
          exchange: jest.fn(),
        },
      },
      {
        provide: AuditService,
        useValue: {
          log: jest.fn().mockResolvedValue(undefined),
        },
      },
      {
        provide: PasswordBreachService,
        useValue: {
          isBreached: jest.fn().mockResolvedValue(false),
        },
      },
      {
        provide: PrismaService,
        useValue: {
          emailVerificationToken: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
          passwordResetToken: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
          },
          user: {
            update: jest.fn(),
          },
          session: {
            findMany: jest.fn().mockResolvedValue([]),
            update: jest.fn().mockResolvedValue(undefined),
          },
          oAuthAccount: {
            count: jest.fn().mockResolvedValue(0),
            deleteMany: jest.fn(),
          },
          $transaction: jest.fn().mockResolvedValue(undefined),
        },
      },
      {
        provide: MailService,
        useValue: {
          sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
          sendRegistrationAttemptNotification: jest
            .fn()
            .mockResolvedValue(undefined),
          sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
          sendLoginNotificationEmail: jest.fn().mockResolvedValue(undefined),
          sendEmailChangeVerificationEmail: jest
            .fn()
            .mockResolvedValue(undefined),
          sendEmailChangeRequestNotification: jest
            .fn()
            .mockResolvedValue(undefined),
          sendEmailChangedConfirmation: jest.fn().mockResolvedValue(undefined),
          sendAccountLockedEmail: jest.fn().mockResolvedValue(undefined),
          sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
        },
      },
      {
        provide: TrustedDeviceService,
        useValue: {
          isTrustedDevice: jest.fn().mockResolvedValue(false),
          revokeAllDevices: jest.fn().mockResolvedValue(0),
        },
      },
      {
        provide: ImpossibleTravelService,
        useValue: {
          detectImpossibleTravel: jest.fn().mockResolvedValue(null),
        },
      },
      {
        provide: SuspiciousLoginService,
        useValue: {
          analyzeLoginFailure: jest.fn().mockResolvedValue(undefined),
          analyzeLoginSuccess: jest.fn().mockResolvedValue(undefined),
        },
      },
      {
        provide: TokenDenyListService,
        useValue: {
          denyToken: jest.fn().mockResolvedValue(undefined),
          denyAllForUser: jest.fn().mockResolvedValue(undefined),
          isDenied: jest.fn().mockResolvedValue(false),
        },
      },
      {
        provide: ConfigService,
        useValue: {
          get: jest.fn((key: string) => {
            const config: Record<string, unknown> = {
              'auth.jwtSecret': 'test-jwt-secret-at-least-32-characters',
              'auth.jwtAccessExpiration': '15m',
              'auth.jwtRefreshExpiration': '12h',
              'auth.mfaAppName': 'EM NexaCore',
              'app.nodeEnv': 'test',
              'app.isProduction': false,
              'app.frontendUrl': 'http://localhost:3001',
            };
            return config[key];
          }),
        },
      },
    ],
  }).compile();

  return {
    authService: module.get<AuthService>(AuthService),
    usersService: module.get(UsersService),
    sessionsService: module.get(SessionsService),
    jwtService: module.get(JwtService),
    oauthCodeStore: module.get(OAuthCodeStore),
    passwordBreachService: module.get(PasswordBreachService),
    trustedDeviceService: module.get(TrustedDeviceService),
    impossibleTravelService: module.get(ImpossibleTravelService),
    suspiciousLoginService: module.get(SuspiciousLoginService),
    mailService: module.get(MailService),
    prismaService: module.get(PrismaService),
    auditService: module.get(AuditService),
    loginSecurityService: module.get(LoginSecurityService),
  };
}

// ─── Passkey Test Helpers ───────────────────────────────────

export const mockPasskeyUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'test@example.com',
  passwordHash: '$2b$12$hashedpassword',
  firstName: null,
  lastName: null,
  avatarUrl: null,
  avatarOriginalUrl: null,
  avatarCropData: null,
  role: Role.USER,
  emailVerified: true,
  pendingEmail: null,
  isActive: true,
  failedAttempts: 0,
  lockedUntil: null,
  lockoutCount: 0,
  mfaEnabled: false,
  mfaSecret: null,
  mfaRecoveryCodes: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const mockPasskeyMeta = {
  ipAddress: '127.0.0.1',
  userAgent: 'test-agent',
};

export interface PasskeyTestContext {
  service: PasskeyService;
  usersService: jest.Mocked<Partial<UsersService>>;
  auditService: { log: jest.Mock };
  redis: { set: jest.Mock; get: jest.Mock; del: jest.Mock };
  prisma: {
    webAuthnCredential: {
      count: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
}

export function createPasskeyTestSetup(): PasskeyTestContext {
  const usersService: jest.Mocked<Partial<UsersService>> = {
    findById: jest.fn() as any,
    findByEmail: jest.fn() as any,
  };

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const redis = {
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn(),
    del: jest.fn().mockResolvedValue(1),
  };

  const prisma = {
    webAuthnCredential: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, any> = {
        'auth.jwtSecret': 'test-secret-that-is-at-least-32-characters-long',
        'auth.jwtAccessExpiration': '15m',
        'auth.jwtRefreshExpiration': '12h',
        'auth.sessionIdleTimeoutHours': 0.5,
        'auth.maxConcurrentSessions': 5,
        'auth.trustedDeviceTtlDays': 30,
        'auth.mfaAppName': 'EM NexaCore',
        'auth.webauthnRpId': 'localhost',
        'auth.webauthnRpName': 'EM NexaCore',
        'auth.webauthnOrigin': 'http://localhost:3001',
        'oauth.googleClientId': 'test-google-id',
        'oauth.googleClientSecret': 'test-google-secret',
        'oauth.googleCallbackUrl': 'http://localhost:3000/auth/google/callback',
        'oauth.githubClientId': 'test-github-id',
        'oauth.githubClientSecret': 'test-github-secret',
        'oauth.githubCallbackUrl': 'http://localhost:3000/auth/github/callback',
        'app.nodeEnv': 'test',
        'app.frontendUrl': 'http://localhost:3001',
        'app.oauthAllowedRedirectUrls': '',
        'app.isProduction': false,
      };
      return config[key];
    }),
  };

  const service = new PasskeyService(
    prisma as any,
    usersService as unknown as UsersService,
    auditService as any,
    redis as any,
    mockConfigService as unknown as ConfigService,
  );

  return { service, usersService, auditService, redis, prisma };
}
