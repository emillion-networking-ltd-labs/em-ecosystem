import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { MfaService } from './mfa.service';
import { AuthService } from './auth.service';
import { AUTH_RATE_LIMITS } from './constants/auth.constants';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { MfaVerifySetupDto } from './dto/mfa-verify-setup.dto';
import { MfaVerifyLoginDto } from './dto/mfa-verify-login.dto';
import { MfaDisableDto } from './dto/mfa-disable.dto';
import { MfaRegenerateCodesDto } from './dto/mfa-regenerate-codes.dto';
import { SafeUser } from '../users/entities/user.entity';

@ApiTags('auth')
@Controller('auth/mfa')
export class MfaController {
  constructor(
    private readonly mfaService: MfaService,
    private readonly authService: AuthService,
  ) {}

  private extractRequestMeta(req: any): {
    ipAddress: string;
    userAgent: string | null;
  } {
    return {
      ipAddress: req.ip || req.socket?.remoteAddress || 'unknown',
      userAgent: req.headers?.['user-agent'] || null,
    };
  }

  @Post('setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({
    global: {
      ttl: AUTH_RATE_LIMITS.mfa.ttl,
      limit: AUTH_RATE_LIMITS.mfa.limit,
    },
  })
  @ApiOperation({ summary: 'Generate TOTP secret and QR code for MFA setup' })
  @ApiResponse({ status: 200, description: 'MFA setup data returned' })
  @ApiResponse({ status: 409, description: 'MFA is already enabled' })
  async setup(@Request() req: { user: SafeUser }) {
    return this.mfaService.setupMfa(req.user.id);
  }

  @Post('verify-setup')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({
    global: {
      ttl: AUTH_RATE_LIMITS.mfa.ttl,
      limit: AUTH_RATE_LIMITS.mfa.limit,
    },
  })
  @ApiOperation({ summary: 'Verify TOTP code and enable MFA' })
  @ApiResponse({ status: 200, description: 'MFA enabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid verification code' })
  async verifySetup(
    @Request() req: any,
    @Body() dto: MfaVerifySetupDto,
  ) {
    const meta = this.extractRequestMeta(req);
    await this.mfaService.verifySetup(req.user.id, dto.token, meta);
    return { message: 'MFA enabled successfully' };
  }

  @Post('verify-login')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    global: {
      ttl: AUTH_RATE_LIMITS.mfa.ttl,
      limit: AUTH_RATE_LIMITS.mfa.limit,
    },
  })
  @ApiOperation({ summary: 'Verify TOTP/recovery code during login' })
  @ApiResponse({ status: 200, description: 'MFA verified, tokens issued' })
  @ApiResponse({ status: 401, description: 'Invalid MFA code or token' })
  async verifyLogin(
    @Body() dto: MfaVerifyLoginDto,
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user } = await this.mfaService.verifyLoginCode(
      dto.mfaToken,
      dto.code,
      dto.recoveryCode,
    );

    const meta = this.extractRequestMeta(req);
    const result = await this.authService.generateTokensForMfa(user.id, meta);

    res.cookie(result.cookie.name, result.cookie.value, result.cookie.options);

    return { accessToken: result.accessToken, user: result.user };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({
    global: {
      ttl: AUTH_RATE_LIMITS.mfa.ttl,
      limit: AUTH_RATE_LIMITS.mfa.limit,
    },
  })
  @ApiOperation({ summary: 'Disable MFA (requires password confirmation)' })
  @ApiResponse({ status: 200, description: 'MFA disabled successfully' })
  @ApiResponse({ status: 400, description: 'MFA is not enabled' })
  @ApiResponse({ status: 401, description: 'Invalid password' })
  async disable(
    @Request() req: any,
    @Body() dto: MfaDisableDto,
  ) {
    const meta = this.extractRequestMeta(req);
    await this.mfaService.disableMfa(req.user.id, dto.password, meta);
    return { message: 'MFA disabled successfully' };
  }

  @Post('recovery-codes')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({
    global: {
      ttl: AUTH_RATE_LIMITS.mfa.ttl,
      limit: AUTH_RATE_LIMITS.mfa.limit,
    },
  })
  @ApiOperation({ summary: 'Regenerate recovery codes (requires password)' })
  @ApiResponse({ status: 200, description: 'New recovery codes generated' })
  async regenerateCodes(
    @Request() req: { user: SafeUser },
    @Body() dto: MfaRegenerateCodesDto,
  ) {
    const recoveryCodes = await this.mfaService.regenerateRecoveryCodes(
      req.user.id,
      dto.password,
    );
    return { recoveryCodes };
  }

  @Get('status')
  @Throttle({
    global: {
      ttl: AUTH_RATE_LIMITS.mfa.ttl,
      limit: AUTH_RATE_LIMITS.mfa.limit,
    },
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get MFA status and remaining recovery codes' })
  @ApiResponse({ status: 200, description: 'MFA status returned' })
  async status(@Request() req: { user: SafeUser }) {
    return this.mfaService.getMfaStatus(req.user.id);
  }
}
