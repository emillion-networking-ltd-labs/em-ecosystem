describe('validateProductionSecrets', () => {
  const originalEnv = process.env;

  const VALID_SECRETS = {
    JWT_SECRET: 'production-jwt-secret-at-least-32-characters-long',
    MFA_ENCRYPTION_KEY: 'production-mfa-key-at-least-32-characters-long',
    CSRF_SECRET: 'production-csrf-secret-at-least-32-chars-long',
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
    return require('../common/utils/validate-production-secrets').validateProductionSecrets;
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
      process.env.MFA_ENCRYPTION_KEY =
        'dev-mfa-key-change-in-production-32ch';

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
