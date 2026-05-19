import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { TenantRole } from '@prisma/client';
import { ErrorMessages } from '../../common/constants/error-messages';
import { TokenServiceV2 } from '../token.service.v2';

/**
 * Tests for TokenServiceV2 — SCRUM-492 / AUTH v2 + Tenancy v1 Phase 1.1.
 *
 * Mock-free: real JwtService + real TokenServiceV2 over a deterministic
 * test-only JwtModule.register configuration. Pure crypto; no DB, no Redis.
 */

const TEST_SECRET = 'test-secret-scrum-492-do-not-use-in-prod';
const ISSUER = 'nexacore-api';
const AUDIENCE = 'nexacore-api';

function baseInput() {
  return {
    userId: 'aaaa1111-aaaa-1111-aaaa-aaaa11111111',
    sessionId: 'bbbb2222-bbbb-2222-bbbb-bbbb22222222',
    tenantId: 'cccc3333-cccc-3333-cccc-cccc33333333',
    tenantRole: TenantRole.MEMBER,
    isPlatformAdmin: false,
  };
}

async function buildModule(
  signOpts: Partial<{
    expiresIn: string;
    issuer: string;
    audience: string;
  }> = {},
): Promise<{ service: TokenServiceV2; jwt: JwtService }> {
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [
      JwtModule.register({
        secret: TEST_SECRET,
        signOptions: {
          expiresIn: signOpts.expiresIn ?? '15m',
          issuer: signOpts.issuer ?? ISSUER,
          audience: signOpts.audience ?? AUDIENCE,
          algorithm: 'HS256',
        },
        verifyOptions: {
          issuer: ISSUER,
          audience: AUDIENCE,
          algorithms: ['HS256'],
        },
      }),
    ],
    providers: [TokenServiceV2],
  }).compile();
  return {
    service: moduleRef.get<TokenServiceV2>(TokenServiceV2),
    jwt: moduleRef.get<JwtService>(JwtService),
  };
}

describe('TokenServiceV2', () => {
  describe('mintAccessToken → verifyAccessToken roundtrip', () => {
    it('preserves all input fields in the payload', async () => {
      const { service } = await buildModule();
      const input = baseInput();

      const token = service.mintAccessToken(input);
      const payload = service.verifyAccessToken(token);

      expect(payload.sub).toBe(input.userId);
      expect(payload.sessionId).toBe(input.sessionId);
      expect(payload.tenantId).toBe(input.tenantId);
      expect(payload.tenantRole).toBe(input.tenantRole);
      expect(payload.isPlatformAdmin).toBe(input.isPlatformAdmin);
    });

    it('returns a payload with exactly the 7 declared v2 keys (no email, no role)', async () => {
      const { service } = await buildModule();
      const token = service.mintAccessToken(baseInput());
      const payload = service.verifyAccessToken(token);

      const keys = Object.keys(payload).sort();
      expect(keys).toEqual(
        [
          'sub',
          'jti',
          'sessionId',
          'iat',
          'tenantId',
          'tenantRole',
          'isPlatformAdmin',
          'exp', // emitted by JwtService.sign; allowed
          'iss',
          'aud',
        ].sort(),
      );
      expect(payload).not.toHaveProperty('email');
      expect(payload).not.toHaveProperty('role');
    });

    it('iat is within ±2 seconds of now', async () => {
      const { service } = await buildModule();
      const token = service.mintAccessToken(baseInput());
      const payload = service.verifyAccessToken(token);
      const now = Math.floor(Date.now() / 1000);
      expect(Math.abs(payload.iat - now)).toBeLessThanOrEqual(2);
    });

    it('two consecutive mints produce distinct jti', async () => {
      const { service } = await buildModule();
      const input = baseInput();
      const a = service.verifyAccessToken(service.mintAccessToken(input));
      const b = service.verifyAccessToken(service.mintAccessToken(input));
      expect(a.jti).toBeTruthy();
      expect(b.jti).toBeTruthy();
      expect(a.jti).not.toBe(b.jti);
    });

    it('isPlatformAdmin=true round-trips', async () => {
      const { service } = await buildModule();
      const token = service.mintAccessToken({
        ...baseInput(),
        isPlatformAdmin: true,
      });
      const payload = service.verifyAccessToken(token);
      expect(payload.isPlatformAdmin).toBe(true);
    });
  });

  describe('TenantRole enum values round-trip', () => {
    it.each([
      TenantRole.OWNER,
      TenantRole.ADMIN,
      TenantRole.MEMBER,
      TenantRole.VIEWER,
      TenantRole.CUSTOM,
    ])('preserves TenantRole.%s through mint/verify', async (role) => {
      const { service } = await buildModule();
      const token = service.mintAccessToken({
        ...baseInput(),
        tenantRole: role,
      });
      const payload = service.verifyAccessToken(token);
      expect(payload.tenantRole).toBe(role);
    });
  });

  describe('verifyAccessToken — rejection paths', () => {
    it('rejects wrong signature (different secret)', async () => {
      const { service: primary } = await buildModule();
      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [
          JwtModule.register({
            secret: 'a-different-secret-1234567890',
            signOptions: {
              expiresIn: '15m',
              issuer: ISSUER,
              audience: AUDIENCE,
              algorithm: 'HS256',
            },
          }),
        ],
        providers: [TokenServiceV2],
      }).compile();
      const stranger = moduleRef.get<TokenServiceV2>(TokenServiceV2);

      const tokenWithWrongSecret = stranger.mintAccessToken(baseInput());

      expect(() => primary.verifyAccessToken(tokenWithWrongSecret)).toThrow(
        UnauthorizedException,
      );
    });

    it('rejects expired token', async () => {
      const { jwt: signerWithExpiredTtl } = await buildModule({
        expiresIn: '-1s',
      });
      const { service: primary } = await buildModule();

      const expiredPayload = {
        sub: 'u',
        jti: 'j',
        sessionId: 's',
        tenantId: 't',
        tenantRole: TenantRole.MEMBER,
        isPlatformAdmin: false,
      };
      const expiredToken = signerWithExpiredTtl.sign(expiredPayload);

      expect(() => primary.verifyAccessToken(expiredToken)).toThrow(
        UnauthorizedException,
      );
    });

    it('rejects wrong issuer', async () => {
      const { jwt: signerWithWrongIssuer } = await buildModule({
        issuer: 'different-issuer',
      });
      const { service: primary } = await buildModule();

      const wrongIssuerToken = signerWithWrongIssuer.sign({
        sub: 'u',
        jti: 'j',
        sessionId: 's',
        tenantId: 't',
        tenantRole: TenantRole.MEMBER,
        isPlatformAdmin: false,
      });

      expect(() => primary.verifyAccessToken(wrongIssuerToken)).toThrow(
        UnauthorizedException,
      );
    });

    it('rejects forged v1-shape payload (correct signature, wrong shape — missing tenantId)', async () => {
      const { service, jwt } = await buildModule();
      // Sign a v1-shape payload with the SAME secret + issuer + audience —
      // jwt.verify passes cryptographically, shape check must reject.
      const v1ForgedToken = jwt.sign({
        sub: 'u',
        email: 'forged@example.com',
        role: 'USER',
        jti: 'j',
        sessionId: 's',
      });

      expect(() => service.verifyAccessToken(v1ForgedToken)).toThrow(
        UnauthorizedException,
      );
    });

    it('rejects payload missing isPlatformAdmin', async () => {
      const { service, jwt } = await buildModule();
      const malformed = jwt.sign({
        sub: 'u',
        jti: 'j',
        sessionId: 's',
        tenantId: 't',
        tenantRole: TenantRole.MEMBER,
        // isPlatformAdmin missing
      });

      expect(() => service.verifyAccessToken(malformed)).toThrow(
        UnauthorizedException,
      );
    });

    it('rejects payload with non-boolean isPlatformAdmin', async () => {
      const { service, jwt } = await buildModule();
      const malformed = jwt.sign({
        sub: 'u',
        jti: 'j',
        sessionId: 's',
        tenantId: 't',
        tenantRole: TenantRole.MEMBER,
        isPlatformAdmin: 'true', // string, not boolean
      });

      expect(() => service.verifyAccessToken(malformed)).toThrow(
        UnauthorizedException,
      );
    });

    it('all failure modes throw the same generic message (no enumeration)', async () => {
      const { service } = await buildModule();
      try {
        service.verifyAccessToken('not.a.jwt');
        fail('expected UnauthorizedException');
      } catch (e) {
        expect((e as UnauthorizedException).message).toBe(
          ErrorMessages.auth.AUTHENTICATION_FAILED,
        );
      }
    });
  });

  describe('cross-instance verify', () => {
    it('a token minted by one TokenServiceV2 instance verifies in another (same JwtModule config)', async () => {
      const minter = await buildModule();
      const verifier = await buildModule();

      const token = minter.service.mintAccessToken(baseInput());
      const payload = verifier.service.verifyAccessToken(token);

      expect(payload.sub).toBe(baseInput().userId);
      expect(payload.tenantId).toBe(baseInput().tenantId);
    });
  });
});
