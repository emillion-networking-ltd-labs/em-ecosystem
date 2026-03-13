import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Res,
  UnauthorizedException,
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
import {
  AuthService,
  CookieConfig,
  MfaChallengeResult,
  MfaSetupRequiredResult,
} from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  AUTH_RATE_LIMITS,
  DEVICE_FINGERPRINT_HEADER,
  REFRESH_TOKEN_COOKIE_NAME,
} from './constants/auth.constants';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SkipCsrf } from '../common/decorators/skip-csrf.decorator';
import { CsrfGuard } from '../common/guards/csrf.guard';
import { TurnstileGuard } from '../security/turnstile.guard';
import { SecurityConfig } from '../security/security.config';
import { Role } from '../users/enums/role.enum';
import { SafeUser } from '../users/entities/user.entity';
import { PermissionsService } from '../permissions/permissions.service';
import { ErrorMessages } from '../common/constants/error-messages';
import { NoCacheInterceptor } from '../common/interceptors/no-cache.interceptor';
import { extractRequestMeta } from '../common/utils/request-meta';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@ApiTags('auth')
@UseInterceptors(NoCacheInterceptor)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly permissionsService: PermissionsService,
  ) {}

  private setCookie(res: Response, cookie: CookieConfig): void {
    res.cookie(cookie.name, cookie.value, cookie.options);
  }

  @Get('csrf-token')
  @SkipCsrf()
  @ApiOperation({ summary: 'Generate CSRF token and set cookie' })
  @ApiResponse({ status: 200, description: 'CSRF token issued' })
  getCsrfToken(@Res({ passthrough: true }) res: Response) {
    const token = CsrfGuard.generateToken();
    const { cookieOptions } = SecurityConfig.csrf;

    res.cookie(SecurityConfig.csrf.cookieName, token, {
      httpOnly: cookieOptions.httpOnly,
      sameSite: cookieOptions.sameSite,
      secure: cookieOptions.secure,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge * 1000,
    });

    return { csrfToken: token };
  }

  @Post('register')
  @UseGuards(TurnstileGuard)
  @Throttle({
    global: {
      ttl: AUTH_RATE_LIMITS.register.ttl,
      limit: AUTH_RATE_LIMITS.register.limit,
    },
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({
    status: 200,
    description: 'Registration request processed',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async register(
    @Body() registerDto: RegisterDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const meta = extractRequestMeta(req);
    const result = await this.authService.register(registerDto, meta, meta);
    return { message: result.message };
  }

  @Post('login')
  @UseGuards(TurnstileGuard)
  @Throttle({
    global: {
      ttl: AUTH_RATE_LIMITS.login.ttl,
      limit: AUTH_RATE_LIMITS.login.limit,
    },
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Account locked' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const meta = extractRequestMeta(req);
    const rawFingerprint = req.headers?.[DEVICE_FINGERPRINT_HEADER];
    const fingerprint = Array.isArray(rawFingerprint)
      ? rawFingerprint[0]
      : rawFingerprint;
    const result = await this.authService.login(
      loginDto,
      meta,
      meta,
      fingerprint,
    );

    // MFA challenge — don't set cookie, return challenge token
    if ('mfaRequired' in result) {
      return result as MfaChallengeResult;
    }

    // Admin without MFA — don't issue tokens, require MFA setup first
    if ('mfaSetupRequired' in result) {
      return result as MfaSetupRequiredResult;
    }

    this.setCookie(res, result.cookie);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('refresh')
  @Throttle({
    global: {
      ttl: AUTH_RATE_LIMITS.refresh.ttl,
      limit: AUTH_RATE_LIMITS.refresh.limit,
    },
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using httpOnly cookie' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async refresh(
    @Request() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
    if (!refreshToken) {
      throw new UnauthorizedException(ErrorMessages.auth.INVALID_REFRESH_TOKEN);
    }
    const meta = extractRequestMeta(req);
    const result = await this.authService.refreshTokens(
      refreshToken,
      meta,
      meta,
    );
    this.setCookie(res, result.cookie);
    return { accessToken: result.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate current session' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @Request() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
    const meta = extractRequestMeta(req);
    if (refreshToken) {
      const clearCookie = await this.authService.logout(refreshToken, meta);
      this.setCookie(res, clearCookie);
    } else {
      this.setCookie(res, this.authService.buildClearCookie());
    }
    return { message: 'Logged out successfully' };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all sessions' })
  @ApiResponse({ status: 200, description: 'All sessions revoked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logoutAll(
    @Request() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const meta = extractRequestMeta(req);
    const clearCookie = await this.authService.logoutAll(req.user.id, meta);
    this.setCookie(res, clearCookie);
    return { message: 'All sessions revoked' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns user profile with permissions',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@Request() req: { user: SafeUser }) {
    const permissions = await this.permissionsService.getPermissionKeysForRole(
      req.user.role,
    );
    return { ...req.user, permissions };
  }

  // ── Admin Endpoints ──

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Access admin dashboard (ADMIN role required)' })
  @ApiResponse({ status: 200, description: 'Admin access granted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — requires ADMIN role',
  })
  getAdminDashboard() {
    return { message: 'Admin access granted' };
  }
}
