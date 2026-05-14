// WARNING: AUTH DOMAIN — changes require Jira ticket + owner approval (see workflow-standards.mdc §15 Auth Change-Control)

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  ParseUUIDPipe,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';
import { SessionsService } from '../sessions/sessions.service';
import { TrustedDeviceService } from './trusted-device.service';
import { TrustDeviceDto } from './dto/trust-device.dto';
import { TrustedDeviceRevokeDto } from './dto/trusted-device-revoke.dto';
import { RevokeSessionDto } from './dto/revoke-session.dto';
import { RefreshTokenPayload } from './interfaces/refresh-token-payload.interface';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { NoCacheInterceptor } from '../common/interceptors/no-cache.interceptor';
import {
  REFRESH_TOKEN_COOKIE_NAME,
  THROTTLE_CONFIGS,
} from './constants/auth.constants';
import { extractRequestMeta } from '../common/utils/request-meta';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@ApiTags('Sessions')
@UseInterceptors(NoCacheInterceptor)
@Controller('auth')
export class SessionController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly trustedDeviceService: TrustedDeviceService,
    private readonly jwtService: JwtService,
  ) {}

  private getCurrentSessionId(req: AuthenticatedRequest): string | undefined {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME] as
      | string
      | undefined;
    if (!refreshToken) return undefined;
    try {
      const payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken);
      return payload.sessionId;
    } catch {
      return undefined;
    }
  }

  // ── Session Endpoints ──

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active sessions for current user' })
  @ApiResponse({ status: 200, description: 'Returns list of active sessions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSessions(@Request() req: AuthenticatedRequest) {
    const currentSessionId = this.getCurrentSessionId(req);
    return this.sessionsService.getActiveSessions(
      req.user.id,
      currentSessionId,
    );
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle(THROTTLE_CONFIGS.trustDevice)
  @ApiOperation({ summary: 'Revoke a specific session' })
  @ApiResponse({ status: 200, description: 'Session revoked' })
  @ApiResponse({ status: 400, description: 'Password required' })
  @ApiResponse({ status: 401, description: 'Invalid password' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async revokeSession(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Body() dto: RevokeSessionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    await this.sessionsService.revokeSessionWithReauth(
      sessionId,
      req.user.id,
      dto.password,
    );
    return { message: 'Session revoked' };
  }

  // ── Trusted Device Endpoints ──

  @Post('trusted-devices')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle(THROTTLE_CONFIGS.trustDevice)
  @ApiOperation({
    summary: 'Mark current device as trusted (skips MFA on future logins)',
  })
  @ApiResponse({ status: 201, description: 'Device trusted' })
  @ApiResponse({ status: 400, description: 'Password required' })
  @ApiResponse({ status: 401, description: 'Invalid password' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async trustDevice(
    @Body() dto: TrustDeviceDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const meta = extractRequestMeta(req);
    const device = await this.trustedDeviceService.trustDeviceWithReauth(
      req.user.id,
      dto.fingerprint,
      meta.ipAddress,
      meta.userAgent,
      dto.password,
    );
    return {
      id: device.id,
      deviceName: device.deviceName,
      expiresAt: device.expiresAt,
      alreadyTrusted: device.alreadyTrusted,
    };
  }

  @Get('trusted-devices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List trusted devices for current user' })
  @ApiResponse({ status: 200, description: 'List of trusted devices' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listTrustedDevices(@Request() req: AuthenticatedRequest) {
    return this.trustedDeviceService.listTrustedDevices(req.user.id);
  }

  @Delete('trusted-devices')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle(THROTTLE_CONFIGS.trustDevice)
  @ApiOperation({ summary: 'Revoke all trusted devices' })
  @ApiResponse({ status: 200, description: 'All trusted devices revoked' })
  @ApiResponse({ status: 400, description: 'Password required' })
  @ApiResponse({ status: 401, description: 'Invalid password' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async revokeAllTrustedDevices(
    @Body() dto: TrustedDeviceRevokeDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const count = await this.trustedDeviceService.revokeAllDevicesWithReauth(
      req.user.id,
      dto.password,
    );
    return { message: 'All trusted devices revoked', count };
  }

  @Delete('trusted-devices/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle(THROTTLE_CONFIGS.trustDevice)
  @ApiOperation({ summary: 'Revoke trust for a specific device' })
  @ApiResponse({ status: 200, description: 'Device trust revoked' })
  @ApiResponse({ status: 400, description: 'Password required' })
  @ApiResponse({ status: 401, description: 'Invalid password' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async revokeTrustedDevice(
    @Param('id', ParseUUIDPipe) deviceId: string,
    @Body() dto: TrustedDeviceRevokeDto,
    @Request() req: AuthenticatedRequest,
  ) {
    await this.trustedDeviceService.revokeDeviceWithReauth(
      req.user.id,
      deviceId,
      dto.password,
    );
    return { message: 'Device trust revoked' };
  }
}
