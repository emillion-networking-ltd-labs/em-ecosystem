import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Res,
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
import type { Response } from 'express';
import { PasskeyService } from './passkey.service';
import { TokenService } from './token.service';
import { AUTH_RATE_LIMITS } from './constants/auth.constants';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PasskeyRegisterVerifyDto } from './dto/passkey-register-verify.dto';
import { PasskeyLoginOptionsDto } from './dto/passkey-login-options.dto';
import { PasskeyLoginVerifyDto } from './dto/passkey-login-verify.dto';
import { PasskeyRenameDto } from './dto/passkey-rename.dto';
import { PasskeyDeleteDto } from './dto/passkey-delete.dto';
import { SafeUser } from '../users/entities/user.entity';
import { NoCacheInterceptor } from '../common/interceptors/no-cache.interceptor';
import { extractRequestMeta } from '../common/utils/request-meta';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@ApiTags('auth')
@UseInterceptors(NoCacheInterceptor)
@Controller('auth/passkeys')
export class PasskeyController {
  constructor(
    private readonly passkeyService: PasskeyService,
    private readonly tokenService: TokenService,
  ) {}

  @Post('register/options')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({
    global: {
      ttl: AUTH_RATE_LIMITS.mfa.ttl,
      limit: AUTH_RATE_LIMITS.mfa.limit,
    },
  })
  @ApiOperation({ summary: 'Generate WebAuthn registration options' })
  @ApiResponse({ status: 201, description: 'Registration options returned' })
  @ApiResponse({ status: 400, description: 'Max passkeys reached' })
  async registerOptions(@Request() req: { user: SafeUser }) {
    return this.passkeyService.generateRegOptions(req.user.id);
  }

  @Post('register/verify')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({
    global: {
      ttl: AUTH_RATE_LIMITS.mfa.ttl,
      limit: AUTH_RATE_LIMITS.mfa.limit,
    },
  })
  @ApiOperation({ summary: 'Verify WebAuthn registration and store passkey' })
  @ApiResponse({ status: 201, description: 'Passkey registered successfully' })
  @ApiResponse({ status: 401, description: 'Verification failed' })
  async registerVerify(
    @Request() req: AuthenticatedRequest,
    @Body() dto: PasskeyRegisterVerifyDto,
  ) {
    const meta = extractRequestMeta(req);
    return this.passkeyService.verifyRegistration(
      req.user.id,
      dto.credential,
      dto.name,
      meta,
    );
  }

  @Post('login/options')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    global: {
      ttl: AUTH_RATE_LIMITS.login.ttl,
      limit: AUTH_RATE_LIMITS.login.limit,
    },
  })
  @ApiOperation({ summary: 'Generate WebAuthn authentication options' })
  @ApiResponse({ status: 200, description: 'Authentication options returned' })
  async loginOptions(@Body() dto: PasskeyLoginOptionsDto) {
    return this.passkeyService.generateAuthOptions(dto.email);
  }

  @Post('login/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    global: {
      ttl: AUTH_RATE_LIMITS.login.ttl,
      limit: AUTH_RATE_LIMITS.login.limit,
    },
  })
  @ApiOperation({ summary: 'Verify WebAuthn authentication and issue tokens' })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful, tokens issued',
  })
  @ApiResponse({ status: 401, description: 'Authentication failed' })
  @ApiResponse({ status: 403, description: 'Account deactivated' })
  async loginVerify(
    @Body() dto: PasskeyLoginVerifyDto,
    @Request() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const meta = extractRequestMeta(req);
    const userId = await this.passkeyService.verifyAuthentication(
      dto.challengeId,
      dto.credential,
      meta,
    );

    const result = await this.tokenService.generateTokensForMfa(userId, meta);

    res.cookie(result.cookie.name, result.cookie.value, result.cookie.options);

    return { accessToken: result.accessToken, user: result.user };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all passkeys for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Passkeys list returned' })
  async list(@Request() req: { user: SafeUser }) {
    return this.passkeyService.listPasskeys(req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rename a passkey' })
  @ApiResponse({ status: 200, description: 'Passkey renamed' })
  @ApiResponse({ status: 404, description: 'Passkey not found' })
  async rename(
    @Request() req: { user: SafeUser },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PasskeyRenameDto,
  ) {
    return this.passkeyService.renamePasskey(req.user.id, id, dto.name);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({
    global: {
      ttl: AUTH_RATE_LIMITS.mfa.ttl,
      limit: AUTH_RATE_LIMITS.mfa.limit,
    },
  })
  @ApiOperation({
    summary: 'Delete a passkey (password confirmation may be required)',
  })
  @ApiResponse({ status: 200, description: 'Passkey deleted' })
  @ApiResponse({ status: 400, description: 'Password required' })
  @ApiResponse({ status: 401, description: 'Invalid password' })
  @ApiResponse({ status: 404, description: 'Passkey not found' })
  async remove(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PasskeyDeleteDto,
  ) {
    const meta = extractRequestMeta(req);
    await this.passkeyService.deletePasskey(
      req.user.id,
      id,
      dto.password,
      meta,
    );
    return { message: 'Passkey deleted successfully' };
  }
}
