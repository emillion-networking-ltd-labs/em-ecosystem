// WARNING: AUTH DOMAIN — changes require Jira ticket + owner approval (see workflow-standards.mdc §15 Auth Change-Control)

/**
 * AuthV2Controller — first production HTTP surface for AUTH v2.
 *
 * SCRUM-494 / AUTH v2 + Tenancy v1 Phase 1.3.
 *
 * Hosts a single endpoint in Phase 1.3: POST /auth/v2/refresh. Exercises both
 * TokenServiceV2 (Phase 1.1 — access token mint) and SessionsServiceV2
 * (Phase 1.2 — opaque refresh rotation) end-to-end.
 *
 * Strangler-pattern transition: this is the moment v2 stops being internal
 * scaffolding and gains its first consumer. v1 endpoints unchanged.
 *
 * Security:
 *  - Cookie-only refresh token (httpOnly + secure-in-prod + sameSite=strict).
 *  - Distinct cookie name (refresh_token_v2) coexists with v1's refresh_token.
 *  - No failure-mode enumeration: ALL failures throw the same
 *    UnauthorizedException(AUTHENTICATION_FAILED).
 *  - No @UseGuards: refresh tokens ARE the authentication; access may be expired.
 *  - Rate-limited at AUTH_RATE_LIMITS.refresh (same as v1's /auth/refresh).
 *
 * Order-of-operations honesty: validateAndRotate commits atomically (Phase 1.2).
 * mintAccessToken runs AFTER tx commits. If mint throws → orphan rotation
 * (new refresh exists, no access returned). Acceptable per program §2.4;
 * client retries. Wrapping both in a single tx would violate the
 * "TokenServiceV2 doesn't touch DB" invariant.
 */

import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { SessionsServiceV2 } from '../sessions/sessions.service.v2';
import { ErrorMessages } from '../common/constants/error-messages';
import { setCookieFromConfig } from '../common/utils/cookie.util';
import {
  AUTH_RATE_LIMITS,
  REFRESH_TOKEN_COOKIE_NAME_V2,
} from './constants/auth.constants';
import { TokenServiceV2 } from './token.service.v2';
import { parseDurationMs } from './utils/parse-duration';

@ApiTags('Auth v2')
@Controller('auth/v2')
export class AuthV2Controller {
  private readonly isProduction: boolean;
  private readonly refreshMaxAgeMs: number;

  constructor(
    private readonly tokenServiceV2: TokenServiceV2,
    private readonly sessionsServiceV2: SessionsServiceV2,
    configService: ConfigService,
  ) {
    this.isProduction = configService.get<boolean>('app.isProduction') ?? false;
    const refreshExpiration = configService.get<string>(
      'auth.jwtRefreshExpiration',
    )!;
    this.refreshMaxAgeMs = parseDurationMs(refreshExpiration);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ global: AUTH_RATE_LIMITS.refresh })
  @ApiOperation({
    summary: 'Refresh v2 access token using httpOnly opaque refresh cookie',
  })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{
    accessToken: string;
    user: {
      id: string;
      tenantId: string;
      tenantRole: string;
      isPlatformAdmin: boolean;
    };
  }> {
    const cookies = (
      req as Request & {
        cookies?: Record<string, string | undefined>;
      }
    ).cookies;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const refreshToken: string | undefined =
      cookies?.[REFRESH_TOKEN_COOKIE_NAME_V2];
    if (!refreshToken) {
      throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }

    // validateAndRotate is atomic (Phase 1.2). Throws the generic
    // UnauthorizedException on ANY failure — caller never learns the reason.
    const rotated =
      await this.sessionsServiceV2.validateAndRotate(refreshToken);

    // Mint the new access token from the rotated session's canonical values.
    // If this throws (e.g., JwtModule misconfig), the rotation already
    // committed → orphan rotation. Client retries refresh — documented.
    const accessToken = this.tokenServiceV2.mintAccessToken({
      userId: rotated.userId,
      sessionId: rotated.sessionId,
      tenantId: rotated.tenantId,
      tenantRole: rotated.tenantRole,
      isPlatformAdmin: rotated.isPlatformAdmin,
    });

    // Set new refresh cookie. Same shape as v1's TokenService.buildRefreshCookie.
    setCookieFromConfig(res, {
      name: REFRESH_TOKEN_COOKIE_NAME_V2,
      value: rotated.refreshToken,
      options: {
        httpOnly: true,
        secure: this.isProduction,
        sameSite: 'strict',
        path: '/',
        maxAge: Math.floor(this.refreshMaxAgeMs / 1000),
      },
    });

    return {
      accessToken,
      user: {
        id: rotated.userId,
        tenantId: rotated.tenantId,
        tenantRole: rotated.tenantRole,
        isPlatformAdmin: rotated.isPlatformAdmin,
      },
    };
  }
}
