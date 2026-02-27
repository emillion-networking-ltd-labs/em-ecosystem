describe('SecurityConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function loadConfig() {
    // Re-import to get fresh config with current env
    return require('../security.config').SecurityConfig;
  }

  // ─── CORS ────────────────────────────────────────────────────

  describe('cors.getAllowedOrigins', () => {
    it('should parse CORS_ALLOWED_ORIGINS when set', () => {
      process.env.CORS_ALLOWED_ORIGINS = 'https://app.example.com, https://admin.example.com';

      const config = loadConfig();
      const origins = config.cors.getAllowedOrigins();

      expect(origins).toEqual([
        'https://app.example.com',
        'https://admin.example.com',
      ]);
    });

    it('should filter empty entries from CORS_ALLOWED_ORIGINS', () => {
      process.env.CORS_ALLOWED_ORIGINS = 'https://app.example.com,,, ';

      const config = loadConfig();
      const origins = config.cors.getAllowedOrigins();

      expect(origins).toEqual(['https://app.example.com']);
    });

    it('should use FRONTEND_URL when CORS_ALLOWED_ORIGINS is not set', () => {
      delete process.env.CORS_ALLOWED_ORIGINS;
      process.env.FRONTEND_URL = 'https://frontend.example.com';

      const config = loadConfig();
      const origins = config.cors.getAllowedOrigins();

      expect(origins).toEqual(['https://frontend.example.com']);
    });

    it('should default to localhost:3001 when no env vars are set', () => {
      delete process.env.CORS_ALLOWED_ORIGINS;
      delete process.env.FRONTEND_URL;

      const config = loadConfig();
      const origins = config.cors.getAllowedOrigins();

      expect(origins).toEqual(['http://localhost:3001']);
    });
  });

  // ─── CSRF ────────────────────────────────────────────────────

  describe('csrf.getSecret', () => {
    it('should return CSRF_SECRET when set and valid', () => {
      process.env.CSRF_SECRET = 'a'.repeat(32);

      const config = loadConfig();
      const secret = config.csrf.getSecret();

      expect(secret).toBe('a'.repeat(32));
    });

    it('should throw in production when CSRF_SECRET is not set', () => {
      delete process.env.CSRF_SECRET;
      process.env.NODE_ENV = 'production';

      const config = loadConfig();

      expect(() => config.csrf.getSecret()).toThrow(
        'CSRF_SECRET must be set and at least 32 characters in production',
      );
    });

    it('should throw in production when CSRF_SECRET is too short', () => {
      process.env.CSRF_SECRET = 'short';
      process.env.NODE_ENV = 'production';

      const config = loadConfig();

      expect(() => config.csrf.getSecret()).toThrow(
        'CSRF_SECRET must be set and at least 32 characters in production',
      );
    });

    it('should return dev default when CSRF_SECRET is not set in non-production', () => {
      delete process.env.CSRF_SECRET;
      process.env.NODE_ENV = 'development';

      const config = loadConfig();
      const secret = config.csrf.getSecret();

      expect(secret).toBe('dev-csrf-secret-change-in-production-min32chars');
    });
  });

  // ─── Helmet static config ────────────────────────────────────

  describe('helmet', () => {
    it('should have CSP directives with self defaults', () => {
      const config = loadConfig();

      expect(config.helmet.contentSecurityPolicy.directives.defaultSrc).toEqual(["'self'"]);
      expect(config.helmet.contentSecurityPolicy.directives.objectSrc).toEqual(["'none'"]);
    });

    it('should have HSTS maxAge of 1 year', () => {
      const config = loadConfig();

      expect(config.helmet.hsts.maxAge).toBe(31536000);
    });

    it('should deny all features in permissionsPolicy', () => {
      const config = loadConfig();
      const policy = config.helmet.permissionsPolicy;

      expect(policy.camera).toEqual([]);
      expect(policy.microphone).toEqual([]);
      expect(policy.geolocation).toEqual([]);
    });
  });
});
