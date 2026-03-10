export const SecurityConfig = {
  cors: {
    getAllowedOrigins(): string[] {
      const originsEnv = process.env.CORS_ALLOWED_ORIGINS;
      if (originsEnv) {
        return originsEnv
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean);
      }
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      return [frontendUrl];
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Requested-With',
      'X-Device-Fingerprint',
    ],
    exposedHeaders: [
      'Retry-After',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
    credentials: true,
    maxAge: 86400,
  },

  csrf: {
    cookieName: '__csrf',
    headerName: 'x-csrf-token',
    tokenLength: 32,
    cookieOptions: {
      httpOnly: false,
      sameSite: 'strict' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 86400,
    },
    getSecret(): string {
      const secret = process.env.CSRF_SECRET;
      if (!secret || secret.length < 32) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error(
            'CSRF_SECRET must be set and at least 32 characters in production',
          );
        }
        return 'dev-csrf-secret-change-in-production-min32chars';
      }
      return secret;
    },
  },

  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin' as const,
    },
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
      'interest-cohort': [],
      accelerometer: [],
      gyroscope: [],
      magnetometer: [],
      usb: [],
      payment: [],
      autoplay: [],
    },
  },
} as const;
