/**
 * E2E Test Setup — Comprehensive mock factory for auth integration tests.
 *
 * Provides an in-memory mock Prisma, mock Redis, mock MailService, and
 * a `createE2EApp()` factory that wires them into a NestJS test application
 * with all guards (CSRF, Turnstile, Throttler) disabled.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
// APP_GUARD is not used — we override specific guard classes instead
import { randomUUID } from 'crypto';
import * as crypto from 'crypto';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { GoogleStrategy } from '../../src/auth/strategies/google.strategy';
import { GitHubStrategy } from '../../src/auth/strategies/github.strategy';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { TurnstileService } from '../../src/security/turnstile.service';
import { PasswordBreachService } from '../../src/auth/password-breach.service';
import { MailService } from '../../src/mail/mail.service';
import { GeolocationService } from '../../src/geolocation/geolocation.service';
import { ImpossibleTravelService } from '../../src/geolocation/impossible-travel.service';
import { CustomThrottlerGuard } from '../../src/common/guards/custom-throttler.guard';
import { CsrfGuard } from '../../src/common/guards/csrf.guard';
import { TurnstileGuard } from '../../src/security/turnstile.guard';
import { REDIS_CLIENT } from '../../src/common/services/redis.constants';
import cookieParser from 'cookie-parser';

// ── In-memory store types ───────────────────────────────────────────

export interface MockUser {
  id: string;
  email: string;
  passwordHash: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: string;
  provider: string;
  providerId: string | null;
  emailVerified: boolean;
  pendingEmail: string | null;
  isActive: boolean;
  mfaEnabled: boolean;
  mfaSecret: string | null;
  mfaRecoveryCodes: string[];
  failedAttempts: number;
  lockoutCount: number;
  lockedUntil: Date | null;
  refreshToken: string | null;
  createdAt: Date;
  updatedAt: Date;
  oauthAccounts: { provider: string }[];
}

export interface MockSession {
  id: string;
  userId: string;
  tokenFamily: string;
  refreshTokenHash: string;
  deviceInfo: string | null;
  ipAddress: string;
  userAgent: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  latitude: number | null;
  longitude: number | null;
  isRevoked: boolean;
  lastUsedAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockEmailVerificationToken {
  id: string;
  tokenHash: string;
  userId: string;
  type: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
  user?: MockUser;
}

export interface MockPasswordResetToken {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
  user?: MockUser;
}

export interface MockOAuthAccount {
  id: string;
  userId: string;
  provider: string;
  providerId: string;
  createdAt: Date;
}

export interface MockAuditLog {
  id: string;
  action: string;
  userId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: unknown;
  createdAt: Date;
}

export interface MockStore {
  users: MockUser[];
  sessions: MockSession[];
  emailVerificationTokens: MockEmailVerificationToken[];
  passwordResetTokens: MockPasswordResetToken[];
  oauthAccounts: MockOAuthAccount[];
  auditLogs: MockAuditLog[];
}

// ── Mock Prisma Factory ─────────────────────────────────────────────

export function createMockStore(): MockStore {
  return {
    users: [],
    sessions: [],
    emailVerificationTokens: [],
    passwordResetTokens: [],
    oauthAccounts: [],
    auditLogs: [],
  };
}

function matchesWhere(
  record: Record<string, any>,
  where: Record<string, any>,
): boolean {
  for (const [key, val] of Object.entries(where)) {
    if (
      val &&
      typeof val === 'object' &&
      !Array.isArray(val) &&
      !(val instanceof Date)
    ) {
      if ('gt' in val) {
        if (!(record[key] > val.gt)) return false;
      }
      if ('gte' in val) {
        if (!(record[key] >= val.gte)) return false;
      }
      if ('lt' in val) {
        if (!(record[key] < val.lt)) return false;
      }
      if ('not' in val) {
        if (record[key] === val.not) return false;
      }
      if ('in' in val) {
        if (!val.in.includes(record[key])) return false;
      }
    } else {
      if (record[key] !== val) return false;
    }
  }
  return true;
}

export function createMockPrisma(store: MockStore) {
  const prisma = {
    user: {
      findUnique: jest.fn(({ where, include }: any) => {
        const user = where.email
          ? store.users.find((u) => u.email === where.email)
          : store.users.find((u) => u.id === where.id);
        if (!user) return Promise.resolve(null);
        const result = { ...user };
        if (include?.oauthAccounts) {
          (result as any).oauthAccounts = store.oauthAccounts
            .filter((oa) => oa.userId === user.id)
            .map((oa) => {
              if (include.oauthAccounts.select) {
                const selected: any = {};
                for (const key of Object.keys(include.oauthAccounts.select)) {
                  selected[key] = (oa as any)[key];
                }
                return selected;
              }
              return oa;
            });
        }
        return Promise.resolve(result);
      }),
      create: jest.fn(({ data }: any) => {
        if (store.users.some((u) => u.email === data.email)) {
          const err = new Error('Unique constraint') as Error & {
            code: string;
          };
          err.code = 'P2002';
          return Promise.reject(err);
        }
        const user: MockUser = {
          id: randomUUID(),
          email: data.email,
          passwordHash: data.passwordHash ?? null,
          firstName: data.firstName ?? null,
          lastName: data.lastName ?? null,
          avatarUrl: data.avatarUrl ?? null,
          role: data.role ?? 'USER',
          provider: data.provider ?? 'LOCAL',
          providerId: data.providerId ?? null,
          emailVerified: data.emailVerified ?? false,
          pendingEmail: data.pendingEmail ?? null,
          isActive: data.isActive ?? true,
          mfaEnabled: data.mfaEnabled ?? false,
          mfaSecret: data.mfaSecret ?? null,
          mfaRecoveryCodes: data.mfaRecoveryCodes ?? [],
          failedAttempts: 0,
          lockoutCount: 0,
          lockedUntil: null,
          refreshToken: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          oauthAccounts: [],
        };
        store.users.push(user);
        return Promise.resolve({ ...user });
      }),
      update: jest.fn(({ where, data }: any) => {
        const user = store.users.find((u) => u.id === where.id);
        if (!user) return Promise.reject(new Error('Record not found'));
        for (const [key, val] of Object.entries(data)) {
          if (
            val &&
            typeof val === 'object' &&
            'increment' in (val as Record<string, unknown>)
          ) {
            (user as any)[key] += (val as { increment: number }).increment;
          } else {
            (user as any)[key] = val;
          }
        }
        user.updatedAt = new Date();
        return Promise.resolve({ ...user });
      }),
      findMany: jest.fn(({ where, orderBy, skip, take }: any = {}) => {
        let results = [...store.users];
        if (where)
          results = results.filter((u) => matchesWhere(u as any, where));
        return Promise.resolve(results);
      }),
      count: jest.fn(({ where }: any = {}) => {
        let results = [...store.users];
        if (where)
          results = results.filter((u) => matchesWhere(u as any, where));
        return Promise.resolve(results.length);
      }),
    },

    session: {
      create: jest.fn(({ data }: any) => {
        const session: MockSession = {
          id: randomUUID(),
          userId: data.userId,
          tokenFamily: data.tokenFamily,
          refreshTokenHash: data.refreshTokenHash,
          deviceInfo: data.deviceInfo ?? null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent ?? null,
          locationCity: data.locationCity ?? null,
          locationCountry: data.locationCountry ?? null,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          isRevoked: false,
          lastUsedAt: new Date(),
          expiresAt: data.expiresAt,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        store.sessions.push(session);
        return Promise.resolve({ ...session });
      }),
      findUnique: jest.fn(({ where }: any) => {
        const session = store.sessions.find((s) => s.id === where.id);
        return Promise.resolve(session ? { ...session } : null);
      }),
      findFirst: jest.fn(({ where, orderBy }: any = {}) => {
        let results = [...store.sessions];
        if (where)
          results = results.filter((s) => matchesWhere(s as any, where));
        if (orderBy) {
          const key = Object.keys(orderBy)[0];
          const dir = orderBy[key];
          results.sort((a, b) => {
            const aVal = (a as any)[key];
            const bVal = (b as any)[key];
            if (aVal < bVal) return dir === 'asc' ? -1 : 1;
            if (aVal > bVal) return dir === 'asc' ? 1 : -1;
            return 0;
          });
        }
        return Promise.resolve(results[0] ?? null);
      }),
      findMany: jest.fn(({ where, orderBy, select }: any = {}) => {
        let results = [...store.sessions];
        if (where)
          results = results.filter((s) => matchesWhere(s as any, where));
        if (orderBy) {
          const key = Object.keys(orderBy)[0];
          const dir = orderBy[key];
          results.sort((a, b) => {
            const aVal = (a as any)[key];
            const bVal = (b as any)[key];
            if (aVal < bVal) return dir === 'asc' ? -1 : 1;
            if (aVal > bVal) return dir === 'asc' ? 1 : -1;
            return 0;
          });
        }
        if (select) {
          return Promise.resolve(
            results.map((s) => {
              const selected: any = {};
              for (const k of Object.keys(select)) {
                selected[k] = (s as any)[k];
              }
              return selected;
            }),
          );
        }
        return Promise.resolve(results);
      }),
      update: jest.fn(({ where, data }: any) => {
        const session = store.sessions.find((s) => s.id === where.id);
        if (!session) return Promise.reject(new Error('Session not found'));
        Object.assign(session, data);
        return Promise.resolve({ ...session });
      }),
      updateMany: jest.fn(({ where, data }: any) => {
        let count = 0;
        for (const session of store.sessions) {
          if (matchesWhere(session as any, where)) {
            Object.assign(session, data);
            count++;
          }
        }
        return Promise.resolve({ count });
      }),
    },

    emailVerificationToken: {
      create: jest.fn(({ data }: any) => {
        const token: MockEmailVerificationToken = {
          id: randomUUID(),
          tokenHash: data.tokenHash,
          userId: data.userId,
          type: data.type ?? 'REGISTRATION',
          expiresAt: data.expiresAt,
          usedAt: null,
          createdAt: new Date(),
        };
        store.emailVerificationTokens.push(token);
        return Promise.resolve({ ...token });
      }),
      findUnique: jest.fn(({ where, include }: any) => {
        const token = store.emailVerificationTokens.find(
          (t) => t.tokenHash === where.tokenHash,
        );
        if (!token) return Promise.resolve(null);
        const result = { ...token };
        if (include?.user) {
          result.user = store.users.find((u) => u.id === token.userId);
        }
        return Promise.resolve(result);
      }),
      findFirst: jest.fn(({ where, orderBy }: any) => {
        const results = store.emailVerificationTokens.filter((t) =>
          matchesWhere(t as any, where),
        );
        if (orderBy?.createdAt === 'desc') {
          results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        return Promise.resolve(results[0] ?? null);
      }),
      update: jest.fn(({ where, data }: any) => {
        const token = store.emailVerificationTokens.find(
          (t) => t.id === where.id,
        );
        if (!token) return Promise.reject(new Error('Token not found'));
        Object.assign(token, data);
        return Promise.resolve({ ...token });
      }),
    },

    passwordResetToken: {
      create: jest.fn(({ data }: any) => {
        const token: MockPasswordResetToken = {
          id: randomUUID(),
          tokenHash: data.tokenHash,
          userId: data.userId,
          expiresAt: data.expiresAt,
          usedAt: null,
          createdAt: new Date(),
        };
        store.passwordResetTokens.push(token);
        return Promise.resolve({ ...token });
      }),
      findUnique: jest.fn(({ where, include }: any) => {
        const token = store.passwordResetTokens.find(
          (t) => t.tokenHash === where.tokenHash,
        );
        if (!token) return Promise.resolve(null);
        const result = { ...token };
        if (include?.user) {
          result.user = store.users.find((u) => u.id === token.userId);
        }
        return Promise.resolve(result);
      }),
      update: jest.fn(({ where, data }: any) => {
        const token = store.passwordResetTokens.find(
          (t) => t.id === where.id || t.tokenHash === where.tokenHash,
        );
        if (!token) return Promise.reject(new Error('Token not found'));
        Object.assign(token, data);
        return Promise.resolve({ ...token });
      }),
      updateMany: jest.fn(({ where, data }: any) => {
        let count = 0;
        for (const token of store.passwordResetTokens) {
          if (matchesWhere(token as any, where)) {
            Object.assign(token, data);
            count++;
          }
        }
        return Promise.resolve({ count });
      }),
    },

    oAuthAccount: {
      findFirst: jest.fn(({ where }: any) => {
        const account = store.oauthAccounts.find((oa) =>
          matchesWhere(oa as any, where),
        );
        return Promise.resolve(account ? { ...account } : null);
      }),
      create: jest.fn(({ data }: any) => {
        const account: MockOAuthAccount = {
          id: randomUUID(),
          userId: data.userId,
          provider: data.provider,
          providerId: data.providerId,
          createdAt: new Date(),
        };
        store.oauthAccounts.push(account);
        return Promise.resolve({ ...account });
      }),
      count: jest.fn(({ where }: any) => {
        const count = store.oauthAccounts.filter((oa) =>
          matchesWhere(oa as any, where),
        ).length;
        return Promise.resolve(count);
      }),
      deleteMany: jest.fn(({ where }: any) => {
        const before = store.oauthAccounts.length;
        store.oauthAccounts = store.oauthAccounts.filter(
          (oa) => !matchesWhere(oa as any, where),
        );
        return Promise.resolve({ count: before - store.oauthAccounts.length });
      }),
    },

    auditLog: {
      create: jest.fn(({ data }: any) => {
        const log: MockAuditLog = {
          id: randomUUID(),
          action: data.action,
          userId: data.userId ?? null,
          ipAddress: data.ipAddress ?? null,
          userAgent: data.userAgent ?? null,
          metadata: data.metadata ?? null,
          createdAt: new Date(),
        };
        store.auditLogs.push(log);
        return Promise.resolve({ ...log });
      }),
      findMany: jest.fn(({ where, orderBy }: any = {}) => {
        let results = [...store.auditLogs];
        if (where)
          results = results.filter((l) => matchesWhere(l as any, where));
        return Promise.resolve(results);
      }),
      count: jest.fn(({ where }: any = {}) => {
        let results = [...store.auditLogs];
        if (where)
          results = results.filter((l) => matchesWhere(l as any, where));
        return Promise.resolve(results.length);
      }),
    },

    permission: {
      findMany: jest.fn(({ where }: any = {}) => {
        // Return empty — no seeded permissions needed for auth E2E
        return Promise.resolve([]);
      }),
      upsert: jest.fn(({ where, update, create }: any) => {
        return Promise.resolve({ id: randomUUID(), ...create });
      }),
    },

    rolePermission: {
      findMany: jest.fn(({ where, include }: any) => {
        return Promise.resolve([]);
      }),
      count: jest.fn(() => Promise.resolve(0)),
      createMany: jest.fn(({ data }: any) => {
        return Promise.resolve({ count: data?.length ?? 0 });
      }),
    },

    trustedDevice: {
      findMany: jest.fn(() => Promise.resolve([])),
      findFirst: jest.fn(() => Promise.resolve(null)),
      create: jest.fn(({ data }: any) =>
        Promise.resolve({ id: randomUUID(), ...data, createdAt: new Date() }),
      ),
      update: jest.fn(({ where, data }: any) =>
        Promise.resolve({ ...where, ...data }),
      ),
      updateMany: jest.fn(() => Promise.resolve({ count: 0 })),
      deleteMany: jest.fn(() => Promise.resolve({ count: 0 })),
      count: jest.fn(() => Promise.resolve(0)),
    },

    passkey: {
      findMany: jest.fn(() => Promise.resolve([])),
      findFirst: jest.fn(() => Promise.resolve(null)),
      create: jest.fn(({ data }: any) =>
        Promise.resolve({ id: randomUUID(), ...data }),
      ),
      update: jest.fn(({ where, data }: any) =>
        Promise.resolve({ ...where, ...data }),
      ),
      delete: jest.fn(() => Promise.resolve({})),
      count: jest.fn(() => Promise.resolve(0)),
    },

    $transaction: jest.fn(async (arg: any) => {
      if (typeof arg === 'function') {
        return arg(prisma);
      }
      // Array of promises
      return Promise.all(arg);
    }),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  return prisma;
}

// ── Mock Redis ──────────────────────────────────────────────────────

export function createMockRedis() {
  const data = new Map<string, { value: string; expiresAt?: number }>();

  return {
    get: jest.fn((key: string) => {
      const entry = data.get(key);
      if (!entry) return Promise.resolve(null);
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        data.delete(key);
        return Promise.resolve(null);
      }
      return Promise.resolve(entry.value);
    }),
    set: jest.fn((...args: any[]) => {
      const key = args[0] as string;
      const value = args[1] as string;
      let expiresAt: number | undefined;
      // Handle: set(key, value, 'EX', seconds) or set(key, value)
      if (args[2] === 'EX' && typeof args[3] === 'number') {
        expiresAt = Date.now() + args[3] * 1000;
      }
      data.set(key, { value, expiresAt });
      return Promise.resolve('OK');
    }),
    setex: jest.fn((key: string, seconds: number, value: string) => {
      data.set(key, { value, expiresAt: Date.now() + seconds * 1000 });
      return Promise.resolve('OK');
    }),
    del: jest.fn((...keys: string[]) => {
      let count = 0;
      for (const key of keys) {
        if (data.delete(key)) count++;
      }
      return Promise.resolve(count);
    }),
    keys: jest.fn((pattern: string) => {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      const matching = [...data.keys()].filter((k) => regex.test(k));
      return Promise.resolve(matching);
    }),
    quit: jest.fn(() => Promise.resolve('OK')),
    // Internal access for tests
    _data: data,
  };
}

// ── Mock MailService ────────────────────────────────────────────────

export interface CapturedEmail {
  type: string;
  to: string;
  args: any[];
}

export function createMockMailService() {
  const captured: CapturedEmail[] = [];

  return {
    captured,
    sendVerificationEmail: jest.fn(
      (email: string, token: string, firstName?: string) => {
        captured.push({
          type: 'verification',
          to: email,
          args: [email, token, firstName],
        });
        return Promise.resolve();
      },
    ),
    sendPasswordResetEmail: jest.fn(
      (email: string, token: string, firstName?: string) => {
        captured.push({
          type: 'password-reset',
          to: email,
          args: [email, token, firstName],
        });
        return Promise.resolve();
      },
    ),
    sendAccountLockedEmail: jest.fn((...args: any[]) => {
      captured.push({ type: 'account-locked', to: args[0], args });
      return Promise.resolve();
    }),
    sendLoginNotificationEmail: jest.fn((...args: any[]) => {
      captured.push({ type: 'login-notification', to: args[0], args });
      return Promise.resolve();
    }),
    sendRegistrationAttemptNotification: jest.fn((...args: any[]) => {
      captured.push({ type: 'registration-attempt', to: args[0], args });
      return Promise.resolve();
    }),
    sendEmailChangedConfirmation: jest.fn((...args: any[]) => {
      captured.push({ type: 'email-changed', to: args[0], args });
      return Promise.resolve();
    }),
    sendEmailChangeVerification: jest.fn((...args: any[]) => {
      captured.push({ type: 'email-change-verification', to: args[0], args });
      return Promise.resolve();
    }),
    sendSuspiciousLoginAlert: jest.fn((...args: any[]) => {
      captured.push({ type: 'suspicious-login', to: args[0], args });
      return Promise.resolve();
    }),
    sendImpossibleTravelAlert: jest.fn((...args: any[]) => {
      captured.push({ type: 'impossible-travel', to: args[0], args });
      return Promise.resolve();
    }),
    clear() {
      captured.length = 0;
    },
  };
}

// ── No-op Guard (replaces CSRF, Throttler) ──────────────────────────

class NoopGuard {
  canActivate() {
    return true;
  }
}

// ── App Factory ─────────────────────────────────────────────────────

export interface E2EContext {
  app: INestApplication;
  store: MockStore;
  mockPrisma: ReturnType<typeof createMockPrisma>;
  mockRedis: ReturnType<typeof createMockRedis>;
  mockMail: ReturnType<typeof createMockMailService>;
}

export async function createE2EApp(): Promise<E2EContext> {
  const store = createMockStore();
  const mockPrisma = createMockPrisma(store);
  const mockRedis = createMockRedis();
  const mockMail = createMockMailService();

  // Disable APP_GUARD guards at the prototype level (the only reliable way
  // since they're registered via { provide: APP_GUARD, useClass: X })
  jest.spyOn(CsrfGuard.prototype, 'canActivate').mockReturnValue(true);
  jest.spyOn(TurnstileGuard.prototype, 'canActivate').mockResolvedValue(true);
  jest
    .spyOn(CustomThrottlerGuard.prototype, 'handleRequest')
    .mockResolvedValue(true);

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(mockPrisma)
    .overrideProvider(REDIS_CLIENT)
    .useValue(mockRedis)
    .overrideProvider(MailService)
    .useValue(mockMail)
    .overrideProvider(TurnstileService)
    .useValue({ verify: jest.fn().mockResolvedValue({ success: true }) })
    .overrideProvider(PasswordBreachService)
    .useValue({ isBreached: jest.fn().mockResolvedValue(false) })
    .overrideProvider(GoogleStrategy)
    .useValue({})
    .overrideProvider(GitHubStrategy)
    .useValue({})
    .overrideProvider(GeolocationService)
    .useValue({
      lookupIp: jest.fn().mockReturnValue(null),
      isPrivateIp: jest.fn().mockReturnValue(true),
    })
    .overrideProvider(ImpossibleTravelService)
    .useValue({
      detectImpossibleTravel: jest.fn().mockResolvedValue(null),
    })
    .compile();

  const app = moduleFixture.createNestApplication();

  // Cookie parser — required for refresh token cookies
  app.use(cookieParser());

  // Match production pipeline
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.init();

  return { app, store, mockPrisma, mockRedis, mockMail };
}
