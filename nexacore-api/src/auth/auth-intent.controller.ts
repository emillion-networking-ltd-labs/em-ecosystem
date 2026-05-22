// WARNING: AUTH DOMAIN — changes require Jira ticket + owner approval (see workflow-standards.mdc §15 Auth Change-Control)

/**
 * AuthIntentController — HTTP surface for v2 login orchestration.
 *
 * SCRUM-497 / AUTH v2 + Tenancy v1 Phase 2.2 (D-004).
 *
 * Hosts 2 endpoints:
 *   POST /auth/v2/intents              — create a new intent
 *   POST /auth/v2/intents/:id/advance  — apply the next state transition
 *
 * Feature flag (decision A): `assertEnabled()` checks `app.authIntentV2Enabled`
 * at the top of every method and throws NotFoundException if the flag is
 * false. This mimics "endpoint doesn't exist" so the v2 surface is invisible
 * to v1 clients until the flag is flipped on per environment.
 *
 * No @UseGuards — the intent IS the auth state. Authentication completes
 * inside the state machine; the controller is a thin adapter.
 *
 * Cookie posture mirrors AuthV2Controller (Phase 1.3): refresh_token_v2,
 * httpOnly + secure-in-prod + sameSite=strict + path=/.
 *
 * No failure-mode enumeration: AuthIntentService throws a single
 * UnauthorizedException(AUTHENTICATION_FAILED) for all auth failures; this
 * controller adds NotFoundException (intent not found OR flag off) and the
 * service-thrown GoneException (terminal-state replay).
 */

import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthIntentStatus } from '@prisma/client';
import { ErrorMessages } from '../common/constants/error-messages';
import { setCookieFromConfig } from '../common/utils/cookie.util';
import {
  AUTH_RATE_LIMITS,
  REFRESH_TOKEN_COOKIE_NAME_V2,
} from './constants/auth.constants';
import { AuthIntentService } from './auth-intent.service';
import { AdvanceAuthIntentDto } from './dto/advance-auth-intent.dto';
import { CreateAuthIntentDto } from './dto/create-auth-intent.dto';
import { AuthIntentResponseDto } from './dto/auth-intent-response.dto';

@ApiTags('Auth v2 — AuthIntent')
@Controller('auth/v2/intents')
export class AuthIntentController {
  private readonly isProduction: boolean;

  constructor(
    private readonly authIntentService: AuthIntentService,
    private readonly configService: ConfigService,
  ) {
    this.isProduction =
      this.configService.get<boolean>('app.isProduction') ?? false;
  }

  /**
   * Feature flag gate (plan decision A).
   * Single source of truth for "is v2 AuthIntent enabled in this environment?".
   * Returns 404 if disabled, mimicking "endpoint doesn't exist".
   */
  private assertEnabled(): void {
    const enabled =
      this.configService.get<boolean>('app.authIntentV2Enabled') ?? false;
    if (!enabled) {
      throw new NotFoundException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }
  }

  private computeNextStep(
    status: AuthIntentStatus,
  ): 'credentials' | 'mfa' | 'tenant_pick' | 'passkey' | null {
    switch (status) {
      case 'requires_credentials':
        return 'credentials';
      case 'requires_mfa':
        return 'mfa';
      case 'requires_tenant_pick':
        return 'tenant_pick';
      case 'requires_passkey':
        return 'passkey';
      default:
        return null;
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ global: AUTH_RATE_LIMITS.login })
  @ApiOperation({ summary: 'Create a new AuthIntent (v2 login orchestration)' })
  @ApiResponse({ status: 201, description: 'Intent created' })
  @ApiResponse({ status: 404, description: 'v2 AuthIntent disabled' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async create(
    @Req() req: Request,
    @Body() _dto: CreateAuthIntentDto, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<AuthIntentResponseDto> {
    this.assertEnabled();
    const intent = await this.authIntentService.createIntent({
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
    return {
      id: intent.id,
      status: intent.status,
      nextStep: this.computeNextStep(intent.status),
      expiresAt: intent.expiresAt,
    };
  }

  @Post(':id/advance')
  @HttpCode(HttpStatus.OK)
  @Throttle({ global: AUTH_RATE_LIMITS.login })
  @ApiOperation({ summary: 'Advance an AuthIntent state machine' })
  @ApiResponse({ status: 200, description: 'Intent advanced' })
  @ApiResponse({ status: 401, description: 'Authentication failed' })
  @ApiResponse({
    status: 404,
    description: 'Intent not found OR flag disabled',
  })
  @ApiResponse({ status: 410, description: 'Intent terminal (replay)' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async advance(
    @Param('id') id: string,
    @Body() dto: AdvanceAuthIntentDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthIntentResponseDto> {
    this.assertEnabled();
    const result = await this.authIntentService.advance(id, dto, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });

    if (result.status === 'succeeded') {
      setCookieFromConfig(res, {
        name: REFRESH_TOKEN_COOKIE_NAME_V2,
        value: result.refreshToken!,
        options: {
          httpOnly: true,
          secure: this.isProduction,
          sameSite: 'strict',
          path: '/',
          maxAge: Math.floor(result.refreshMaxAgeMs! / 1000),
        },
      });
      return {
        id: result.id,
        status: result.status,
        nextStep: null,
        expiresAt: result.expiresAt,
        accessToken: result.accessToken,
        user: result.user,
      };
    }

    return {
      id: result.id,
      status: result.status,
      nextStep: this.computeNextStep(result.status),
      expiresAt: result.expiresAt,
      availableTenantIds: result.availableTenantIds,
    };
  }
}
