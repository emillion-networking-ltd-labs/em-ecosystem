import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { randomUUID } from 'crypto';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { GoogleStrategy } from './../src/auth/strategies/google.strategy';
import { GitHubStrategy } from './../src/auth/strategies/github.strategy';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { Role } from './../src/users/enums/role.enum';
import { Provider } from './../src/users/enums/provider.enum';

jest.setTimeout(30000);

/* ── Response types for type-safe assertions ─────────── */

interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  user: { email: string; role: string };
}

interface TokenPairResponse {
  accessToken: string;
  refreshToken: string;
}

interface ErrorBody {
  success: false;
  error: { message: string; code: string; statusCode: number };
}

interface ProfileResponse {
  email: string;
  role: string;
}

interface MessageResponse {
  message: string;
}

/* ── In-memory mock for PrismaService ────────────────── */

interface MockUser {
  id: string;
  email: string;
  passwordHash: string | null;
  role: Role;
  provider: Provider;
  providerId: string | null;
  emailVerified: boolean;
  failedAttempts: number;
  lockedUntil: Date | null;
  refreshToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function createMockPrisma(store: MockUser[]) {
  return {
    user: {
      findUnique: jest.fn(
        ({ where }: { where: { email?: string; id?: string } }) => {
          const found = where.email
            ? store.find((u) => u.email === where.email)
            : store.find((u) => u.id === where.id);
          return Promise.resolve(found ?? null);
        },
      ),
      create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
        if (store.some((u) => u.email === data.email)) {
          const err = new Error('Unique constraint') as Error & {
            code: string;
          };
          err.code = 'P2002';
          return Promise.reject(err);
        }
        const user: MockUser = {
          id: randomUUID(),
          email: data.email as string,
          passwordHash: (data.passwordHash as string) ?? null,
          role: Role.USER,
          provider: (data.provider as Provider) ?? Provider.LOCAL,
          providerId: (data.providerId as string) ?? null,
          emailVerified: (data.emailVerified as boolean) ?? false,
          failedAttempts: 0,
          lockedUntil: null,
          refreshToken: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        store.push(user);
        return Promise.resolve({ ...user });
      }),
      update: jest.fn(
        ({
          where,
          data,
        }: {
          where: { id: string };
          data: Record<string, unknown>;
        }) => {
          const user = store.find((u) => u.id === where.id);
          if (!user) return Promise.reject(new Error('Record not found'));

          for (const [key, val] of Object.entries(data)) {
            if (
              val &&
              typeof val === 'object' &&
              'increment' in (val as Record<string, unknown>)
            ) {
              (user as unknown as Record<string, number>)[key] += (
                val as { increment: number }
              ).increment;
            } else {
              (user as unknown as Record<string, unknown>)[key] = val;
            }
          }
          user.updatedAt = new Date();
          return Promise.resolve({ ...user });
        },
      ),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };
}

/* ── Tests ───────────────────────────────────────────── */

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  const store: MockUser[] = [];

  let userAccessToken: string;
  let userRefreshToken: string;
  let adminAccessToken: string;

  /** Typed shortcut for the HTTP server */
  const server = () => app.getHttpServer();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(createMockPrisma(store))
      .overrideProvider(GoogleStrategy)
      .useValue({})
      .overrideProvider(GitHubStrategy)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  /* ── Register ──────────────────────────────────────── */

  describe('POST /auth/register', () => {
    it('201 — registers a new user', async () => {
      const res = await request(server())
        .post('/auth/register')
        .send({ email: 'user@test.com', password: 'SecureP@ss1' })
        .expect(201);

      const body = res.body as AuthTokenResponse;
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');
      expect(body.user).toMatchObject({
        email: 'user@test.com',
        role: 'USER',
      });
    });

    it('409 — rejects duplicate email', async () => {
      const res = await request(server())
        .post('/auth/register')
        .send({ email: 'user@test.com', password: 'AnotherP@ss1' })
        .expect(409);

      const body = res.body as ErrorBody;
      expect(body.error.code).toBe('CONFLICT');
    });

    it('400 — rejects invalid email', async () => {
      const res = await request(server())
        .post('/auth/register')
        .send({ email: 'bad-email', password: 'SecureP@ss1' })
        .expect(400);

      const body = res.body as ErrorBody;
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('400 — rejects weak password', async () => {
      const res = await request(server())
        .post('/auth/register')
        .send({ email: 'other@test.com', password: 'weak' })
        .expect(400);

      const body = res.body as ErrorBody;
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  /* ── Login ─────────────────────────────────────────── */

  describe('POST /auth/login', () => {
    it('200 — logs in with valid credentials', async () => {
      const res = await request(server())
        .post('/auth/login')
        .send({ email: 'user@test.com', password: 'SecureP@ss1' })
        .expect(200);

      const body = res.body as AuthTokenResponse;
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');
      expect(body.user.email).toBe('user@test.com');

      userAccessToken = body.accessToken;
      userRefreshToken = body.refreshToken;
    });

    it('401 — rejects wrong password', async () => {
      await request(server())
        .post('/auth/login')
        .send({ email: 'user@test.com', password: 'WrongP@ss1' })
        .expect(401);
    });

    it('401 — rejects non-existent user', async () => {
      await request(server())
        .post('/auth/login')
        .send({ email: 'ghost@test.com', password: 'SecureP@ss1' })
        .expect(401);
    });

    it('403 — rejects locked account', async () => {
      const user = store.find((u) => u.email === 'user@test.com')!;
      user.lockedUntil = new Date(Date.now() + 60_000);

      await request(server())
        .post('/auth/login')
        .send({ email: 'user@test.com', password: 'SecureP@ss1' })
        .expect(403);

      // Unlock for subsequent tests
      user.lockedUntil = null;
    });
  });

  /* ── Refresh ───────────────────────────────────────── */

  describe('POST /auth/refresh', () => {
    it('200 — refreshes tokens with valid refresh token', async () => {
      const res = await request(server())
        .post('/auth/refresh')
        .send({ refreshToken: userRefreshToken })
        .expect(200);

      const body = res.body as TokenPairResponse;
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');

      userAccessToken = body.accessToken;
      userRefreshToken = body.refreshToken;
    });

    it('401 — rejects invalid refresh token', async () => {
      await request(server())
        .post('/auth/refresh')
        .send({ refreshToken: 'totally.invalid.token' })
        .expect(401);
    });
  });

  /* ── Me ────────────────────────────────────────────── */

  describe('GET /auth/me', () => {
    it('200 — returns authenticated user profile', async () => {
      const res = await request(server())
        .get('/auth/me')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(200);

      const body = res.body as ProfileResponse;
      expect(body.email).toBe('user@test.com');
      expect(body).not.toHaveProperty('passwordHash');
      expect(body).not.toHaveProperty('refreshToken');
    });

    it('401 — rejects request without token', async () => {
      await request(server()).get('/auth/me').expect(401);
    });
  });

  /* ── Admin ─────────────────────────────────────────── */

  describe('GET /auth/admin', () => {
    beforeAll(async () => {
      // Register, promote to ADMIN in mock store, then login
      await request(server())
        .post('/auth/register')
        .send({ email: 'admin@test.com', password: 'AdminP@ss1' });

      store.find((u) => u.email === 'admin@test.com')!.role = Role.ADMIN;

      const res = await request(server())
        .post('/auth/login')
        .send({ email: 'admin@test.com', password: 'AdminP@ss1' });

      const body = res.body as AuthTokenResponse;
      adminAccessToken = body.accessToken;
    });

    it('200 — grants access with ADMIN role', async () => {
      const res = await request(server())
        .get('/auth/admin')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      const body = res.body as MessageResponse;
      expect(body.message).toBe('Admin access granted');
    });

    it('403 — denies access with USER role', async () => {
      await request(server())
        .get('/auth/admin')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(403);
    });

    it('401 — rejects request without token', async () => {
      await request(server()).get('/auth/admin').expect(401);
    });
  });

  /* ── Logout ────────────────────────────────────────── */

  describe('POST /auth/logout', () => {
    it('200 — logs out successfully', async () => {
      const res = await request(server())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(200);

      const body = res.body as MessageResponse;
      expect(body.message).toBe('Logged out successfully');
    });

    it('401 — rejects request without token', async () => {
      await request(server()).post('/auth/logout').expect(401);
    });
  });
});
