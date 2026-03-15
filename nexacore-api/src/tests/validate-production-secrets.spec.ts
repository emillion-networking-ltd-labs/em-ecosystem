describe('validateProductionSecrets', () => {
  const originalEnv = process.env;

  const VALID_SECRETS = {
    JWT_SECRET: 'production-jwt-secret-at-least-32-characters-long',
    MFA_ENCRYPTION_KEY: 'production-mfa-key-at-least-32-characters-long',
    CSRF_SECRET: 'production-csrf-secret-at-least-32-chars-long',
    GOOGLE_CALLBACK_URL: 'https://myapp.com/auth/google/callback',
    GITHUB_CALLBACK_URL: 'https://myapp.com/auth/github/callback',
    GOOGLE_CLIENT_SECRET: 'real-google-oauth-client-secret-value',
    GITHUB_CLIENT_SECRET: 'real-github-oauth-client-secret-value',
    SMTP_PASSWORD: 'real-smtp-password',
    REDIS_PASSWORD: 'real-redis-password',
    JWT_ACCESS_EXPIRATION: '15m',
    DATABASE_URL:
      'postgresql://user:pass@db.prod.com:5432/em_ecosystem?schema=public&sslmode=require',
  };

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
      ...VALID_SECRETS,
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function loadValidator(): () => void {
    return require('../common/utils/validate-production-secrets')
      .validateProductionSecrets;
  }

  // ─── Non-production bypass ──────────────────────────────────────

  it('should skip validation when NODE_ENV is not production', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.JWT_SECRET;
    delete process.env.MFA_ENCRYPTION_KEY;
    delete process.env.CSRF_SECRET;

    const validate = loadValidator();
    expect(() => validate()).not.toThrow();
  });

  // ─── JWT_SECRET ─────────────────────────────────────────────────

  describe('JWT_SECRET', () => {
    it('should throw when JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET;

      const validate = loadValidator();
      expect(() => validate()).toThrow('FATAL: JWT_SECRET');
    });

    it('should throw when JWT_SECRET is the dev default', () => {
      process.env.JWT_SECRET = 'default-dev-secret-change-in-production';

      const validate = loadValidator();
      expect(() => validate()).toThrow('FATAL: JWT_SECRET');
    });

    it('should throw when JWT_SECRET is shorter than 32 chars', () => {
      process.env.JWT_SECRET = 'short-secret';

      const validate = loadValidator();
      expect(() => validate()).toThrow('FATAL: JWT_SECRET');
    });
  });

  // ─── MFA_ENCRYPTION_KEY ─────────────────────────────────────────

  describe('MFA_ENCRYPTION_KEY', () => {
    it('should throw when MFA_ENCRYPTION_KEY is missing', () => {
      delete process.env.MFA_ENCRYPTION_KEY;

      const validate = loadValidator();
      expect(() => validate()).toThrow('FATAL: MFA_ENCRYPTION_KEY');
    });

    it('should throw when MFA_ENCRYPTION_KEY is the dev default', () => {
      process.env.MFA_ENCRYPTION_KEY = 'dev-mfa-key-change-in-production-32ch';

      const validate = loadValidator();
      expect(() => validate()).toThrow('FATAL: MFA_ENCRYPTION_KEY');
    });

    it('should throw when MFA_ENCRYPTION_KEY is shorter than 32 chars', () => {
      process.env.MFA_ENCRYPTION_KEY = 'short-key';

      const validate = loadValidator();
      expect(() => validate()).toThrow('FATAL: MFA_ENCRYPTION_KEY');
    });
  });

  // ─── CSRF_SECRET ────────────────────────────────────────────────

  describe('CSRF_SECRET', () => {
    it('should throw when CSRF_SECRET is missing', () => {
      delete process.env.CSRF_SECRET;

      const validate = loadValidator();
      expect(() => validate()).toThrow('FATAL: CSRF_SECRET');
    });

    it('should throw when CSRF_SECRET is the dev default', () => {
      process.env.CSRF_SECRET =
        'dev-csrf-secret-change-in-production-min32chars';

      const validate = loadValidator();
      expect(() => validate()).toThrow('FATAL: CSRF_SECRET');
    });

    it('should throw when CSRF_SECRET is shorter than 32 chars', () => {
      process.env.CSRF_SECRET = 'short-csrf-secret';

      const validate = loadValidator();
      expect(() => validate()).toThrow('FATAL: CSRF_SECRET');
    });
  });

  // ─── GOOGLE_CALLBACK_URL ───────────────────────────────────────

  describe('GOOGLE_CALLBACK_URL', () => {
    it('should throw when GOOGLE_CALLBACK_URL uses HTTP', () => {
      process.env.GOOGLE_CALLBACK_URL = 'http://myapp.com/auth/google/callback';

      const validate = loadValidator();
      expect(() => validate()).toThrow('FATAL: GOOGLE_CALLBACK_URL');
    });

    it('should not throw when GOOGLE_CALLBACK_URL is not set', () => {
      delete process.env.GOOGLE_CALLBACK_URL;

      const validate = loadValidator();
      expect(() => validate()).not.toThrow();
    });
  });

  // ─── GITHUB_CALLBACK_URL ───────────────────────────────────────

  describe('GITHUB_CALLBACK_URL', () => {
    it('should throw when GITHUB_CALLBACK_URL uses HTTP', () => {
      process.env.GITHUB_CALLBACK_URL = 'http://myapp.com/auth/github/callback';

      const validate = loadValidator();
      expect(() => validate()).toThrow('FATAL: GITHUB_CALLBACK_URL');
    });

    it('should not throw when GITHUB_CALLBACK_URL is not set', () => {
      delete process.env.GITHUB_CALLBACK_URL;

      const validate = loadValidator();
      expect(() => validate()).not.toThrow();
    });
  });

  // ─── JWT_ACCESS_EXPIRATION ─────────────────────────────────────

  describe('JWT_ACCESS_EXPIRATION', () => {
    it('should throw when JWT_ACCESS_EXPIRATION exceeds 15 minutes', () => {
      process.env.JWT_ACCESS_EXPIRATION = '30m';

      const validate = loadValidator();
      expect(() => validate()).toThrow('FATAL: JWT_ACCESS_EXPIRATION');
    });

    it('should throw when JWT_ACCESS_EXPIRATION is 1h', () => {
      process.env.JWT_ACCESS_EXPIRATION = '1h';

      const validate = loadValidator();
      expect(() => validate()).toThrow('FATAL: JWT_ACCESS_EXPIRATION');
    });

    it('should not throw when JWT_ACCESS_EXPIRATION is 15m', () => {
      process.env.JWT_ACCESS_EXPIRATION = '15m';

      const validate = loadValidator();
      expect(() => validate()).not.toThrow();
    });

    it('should not throw when JWT_ACCESS_EXPIRATION is not set', () => {
      delete process.env.JWT_ACCESS_EXPIRATION;

      const validate = loadValidator();
      expect(() => validate()).not.toThrow();
    });

    it('should throw when JWT_ACCESS_EXPIRATION has invalid format', () => {
      process.env.JWT_ACCESS_EXPIRATION = 'invalid';

      const validate = loadValidator();
      expect(() => validate()).toThrow('FATAL: JWT_ACCESS_EXPIRATION');
    });
  });

  // ─── DATABASE_URL ─────────────────────────────────────────────

  describe('DATABASE_URL', () => {
    it('should throw when DATABASE_URL is missing', () => {
      delete process.env.DATABASE_URL;

      const validate = loadValidator();
      expect(() => validate()).toThrow('FATAL: DATABASE_URL');
    });

    it('should throw when DATABASE_URL has no sslmode', () => {
      process.env.DATABASE_URL =
        'postgresql://user:pass@db:5432/em?schema=public';

      const validate = loadValidator();
      expect(() => validate()).toThrow(
        'FATAL: DATABASE_URL must include sslmode',
      );
    });

    it('should throw when sslmode=prefer (insecure)', () => {
      process.env.DATABASE_URL =
        'postgresql://user:pass@db:5432/em?schema=public&sslmode=prefer';

      const validate = loadValidator();
      expect(() => validate()).toThrow(
        'FATAL: DATABASE_URL must include sslmode',
      );
    });

    it('should throw when sslmode=disable (insecure)', () => {
      process.env.DATABASE_URL =
        'postgresql://user:pass@db:5432/em?schema=public&sslmode=disable';

      const validate = loadValidator();
      expect(() => validate()).toThrow(
        'FATAL: DATABASE_URL must include sslmode',
      );
    });

    it('should not throw when sslmode=require', () => {
      process.env.DATABASE_URL =
        'postgresql://user:pass@db:5432/em?schema=public&sslmode=require';

      const validate = loadValidator();
      expect(() => validate()).not.toThrow();
    });

    it('should not throw when sslmode=verify-ca', () => {
      process.env.DATABASE_URL =
        'postgresql://user:pass@db:5432/em?schema=public&sslmode=verify-ca';

      const validate = loadValidator();
      expect(() => validate()).not.toThrow();
    });

    it('should not throw when sslmode=verify-full', () => {
      process.env.DATABASE_URL =
        'postgresql://user:pass@db:5432/em?schema=public&sslmode=verify-full';

      const validate = loadValidator();
      expect(() => validate()).not.toThrow();
    });
  });

  // ─── GOOGLE_CLIENT_SECRET ─────────────────────────────────────

  describe('GOOGLE_CLIENT_SECRET', () => {
    it('should throw when GOOGLE_CLIENT_SECRET is missing', () => {
      delete process.env.GOOGLE_CLIENT_SECRET;

      const validate = loadValidator();
      expect(() => validate()).toThrow('FATAL: GOOGLE_CLIENT_SECRET');
    });

    it('should throw when GOOGLE_CLIENT_SECRET is the placeholder', () => {
      process.env.GOOGLE_CLIENT_SECRET = 'your-google-client-secret';

      const validate = loadValidator();
      expect(() => validate()).toThrow('FATAL: GOOGLE_CLIENT_SECRET');
    });

    it('should throw when GOOGLE_CLIENT_SECRET is shorter than 20 chars', () => {
      process.env.GOOGLE_CLIENT_SECRET = 'short';

      const validate = loadValidator();
      expect(() => validate()).toThrow('FATAL: GOOGLE_CLIENT_SECRET');
    });
  });

  // ─── GITHUB_CLIENT_SECRET ─────────────────────────────────────

  describe('GITHUB_CLIENT_SECRET', () => {
    it('should throw when GITHUB_CLIENT_SECRET is missing', () => {
      delete process.env.GITHUB_CLIENT_SECRET;

      const validate = loadValidator();
      expect(() => validate()).toThrow('FATAL: GITHUB_CLIENT_SECRET');
    });

    it('should throw when GITHUB_CLIENT_SECRET is the placeholder', () => {
      process.env.GITHUB_CLIENT_SECRET = 'your-github-client-secret';

      const validate = loadValidator();
      expect(() => validate()).toThrow('FATAL: GITHUB_CLIENT_SECRET');
    });

    it('should throw when GITHUB_CLIENT_SECRET is shorter than 20 chars', () => {
      process.env.GITHUB_CLIENT_SECRET = 'short';

      const validate = loadValidator();
      expect(() => validate()).toThrow('FATAL: GITHUB_CLIENT_SECRET');
    });
  });

  // ─── SMTP_PASSWORD ────────────────────────────────────────────

  describe('SMTP_PASSWORD', () => {
    it('should throw when SMTP_PASSWORD is missing', () => {
      delete process.env.SMTP_PASSWORD;

      const validate = loadValidator();
      expect(() => validate()).toThrow('FATAL: SMTP_PASSWORD');
    });

    it('should throw when SMTP_PASSWORD is empty', () => {
      process.env.SMTP_PASSWORD = '';

      const validate = loadValidator();
      expect(() => validate()).toThrow('FATAL: SMTP_PASSWORD');
    });
  });

  // ─── REDIS_PASSWORD ───────────────────────────────────────────

  describe('REDIS_PASSWORD', () => {
    it('should warn but not throw when REDIS_PASSWORD is empty', () => {
      process.env.REDIS_PASSWORD = '';
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const validate = loadValidator();
      expect(() => validate()).not.toThrow();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('REDIS_PASSWORD'),
      );

      warnSpy.mockRestore();
    });

    it('should not warn when REDIS_PASSWORD is set', () => {
      process.env.REDIS_PASSWORD = 'some-password';
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const validate = loadValidator();
      expect(() => validate()).not.toThrow();
      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });

  // ─── Valid case ─────────────────────────────────────────────────

  it('should not throw when all secrets are valid', () => {
    const validate = loadValidator();
    expect(() => validate()).not.toThrow();
  });

  // ─── Fail-fast order ────────────────────────────────────────────

  it('should throw for JWT_SECRET before checking MFA or CSRF', () => {
    delete process.env.JWT_SECRET;
    delete process.env.MFA_ENCRYPTION_KEY;
    delete process.env.CSRF_SECRET;

    const validate = loadValidator();
    expect(() => validate()).toThrow('FATAL: JWT_SECRET');
  });
});
