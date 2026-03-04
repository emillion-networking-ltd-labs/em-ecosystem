import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Res,
  Redirect,
  UnauthorizedException,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import {
  AuthService,
  CookieConfig,
  MfaChallengeResult,
  MfaSetupRequiredResult,
} from './auth.service';
import { TrustedDeviceService } from './trusted-device.service';
import { TrustDeviceDto } from './dto/trust-device.dto';
import { SessionsService } from '../sessions/sessions.service';
import { RefreshTokenPayload } from './interfaces/refresh-token-payload.interface';
import { AUTH_RATE_LIMITS } from './constants/auth.constants';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { OAuthExchangeDto } from './dto/oauth-exchange.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ValidateResetTokenDto } from './dto/validate-reset-token.dto';
import { ResendVerificationPublicDto } from './dto/resend-verification-public.dto';
import { ValidateResetTokenDto } from './dto/validate-reset-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GitHubAuthGuard } from './guards/github-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SkipCsrf } from '../common/decorators/skip-csrf.decorator';
import { CsrfGuard } from '../common/guards/csrf.guard';
import { SecurityConfig } from '../security/security.config';
import { Role } from '../users/enums/role.enum';
import { SafeUser } from '../users/entities/user.entity';
import { PermissionsService } from '../permissions/permissions.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionsService: SessionsService,
    private readonly jwtService: JwtService,
    private readonly permissionsService: PermissionsService,
    private readonly trustedDeviceService: TrustedDeviceService,
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

  private setCookie(res: Response, cookie: CookieConfig): void {
    res.cookie(cookie.name, cookie.value, cookie.options);
  }

  private getCurrentSessionId(req: any): string | undefined {
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) return undefined;
    try {
      const payload =
        this.jwtService.verify<RefreshTokenPayload>(refreshToken);
      return payload.sessionId;
    } catch {
      return undefined;
    }
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
  @Throttle({
    global: {
      ttl: AUTH_RATE_LIMITS.register.ttl,
      limit: AUTH_RATE_LIMITS.register.limit,
    },
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({
    status: 201,
    description: 'User registered — verification email sent',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async register(
    @Body() registerDto: RegisterDto,
    @Request() req: any,
  ) {
    const meta = this.extractRequestMeta(req);
    const result = await this.authService.register(registerDto, meta, meta);
    return { message: result.message, user: result.user };
  }

  @Post('login')
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
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const meta = this.extractRequestMeta(req);
    const fingerprint = req.headers?.['x-device-fingerprint'] || undefined;
    const result = await this.authService.login(loginDto, meta, meta, fingerprint);

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
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }
    const meta = this.extractRequestMeta(req);
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
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['refresh_token'];
    const meta = this.extractRequestMeta(req);
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
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const meta = this.extractRequestMeta(req);
    const clearCookie = await this.authService.logoutAll(req.user.id, meta);
    this.setCookie(res, clearCookie);
    return { message: 'All sessions revoked' };
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active sessions for current user' })
  @ApiResponse({ status: 200, description: 'Returns list of active sessions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSessions(@Request() req: any) {
    const currentSessionId = this.getCurrentSessionId(req);
    return this.sessionsService.getActiveSessions(req.user.id, currentSessionId);
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a specific session' })
  @ApiResponse({ status: 200, description: 'Session revoked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async revokeSession(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Request() req: any,
  ) {
    await this.sessionsService.revokeSession(sessionId, req.user.id);
    return { message: 'Session revoked' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Returns user profile with permissions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@Request() req: { user: SafeUser }) {
    const permissions =
      await this.permissionsService.getPermissionKeysForRole(req.user.role);
    return { ...req.user, permissions };
  }

  // ── Email Verification Endpoints ──

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email address via token from email link' })
  @ApiQuery({
    name: 'token',
    required: true,
    description: 'Verification token',
  })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with status' })
  async verifyEmail(
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    if (!token) {
      return res.redirect(`${frontendUrl}/verify-email?status=invalid`);
    }

    const result = await this.authService.verifyEmail(token);
    return res.redirect(`${frontendUrl}/verify-email?status=${result.status}`);
  }

  @Get('verify-email-change')
  @ApiOperation({ summary: 'Verify email change via token from email link' })
  @ApiQuery({
    name: 'token',
    required: true,
    description: 'Email change verification token',
  })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with status' })
  async verifyEmailChange(
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    if (!token) {
      return res.redirect(`${frontendUrl}/verify-email-change?status=invalid`);
    }

    const result = await this.authService.verifyEmailChange(token);
    return res.redirect(
      `${frontendUrl}/verify-email-change?status=${result.status}`,
    );
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend email verification link' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  @ApiResponse({
    status: 400,
    description: 'Email already verified or rate limited',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async resendVerification(@Request() req: any) {
    await this.authService.resendVerificationEmail(req.user.id);
    return { message: 'Verification email sent' };
  }

  @Post('resend-verification-public')
  @HttpCode(HttpStatus.OK)
  @SkipCsrf()
  @Throttle({
    global: { ttl: 900000, limit: 3 },
  })
  @ApiOperation({
    summary: 'Resend email verification (public, no auth required)',
  })
  @ApiResponse({
    status: 200,
    description: 'Generic success message (anti-enumeration)',
  })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async resendVerificationPublic(
    @Body() dto: ResendVerificationPublicDto,
  ) {
    await this.authService.resendVerificationByEmail(dto.email);
    return {
      message:
        'If an account exists and needs verification, we have sent an email',
    };
  }

  // ── Password Reset Endpoints ──

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @SkipCsrf()
  @Throttle({
    global: { ttl: 900000, limit: 3 },
  })
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({
    status: 200,
    description: 'Reset email sent (if account exists)',
  })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto);
    return { message: 'If an account exists, a reset email has been sent' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @SkipCsrf()
  @Throttle({ global: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: 'Reset password using token from email' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired token, or validation error',
  })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Request() req: any,
  ) {
    const meta = this.extractRequestMeta(req);
    await this.authService.resetPassword(dto, meta);
    return { message: 'Password reset successfully' };
  }

  @Post('validate-reset-token')
  @HttpCode(HttpStatus.OK)
  @SkipCsrf()
  @ApiOperation({
    summary: 'Validate a password reset token without consuming it',
  })
  @ApiResponse({ status: 200, description: 'Token validity status' })
  async validateResetToken(@Body() dto: ValidateResetTokenDto) {
    return this.authService.validateResetToken(dto.token);
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

  @Get('google')
  @Throttle({
    global: {
      ttl: AUTH_RATE_LIMITS.oauth.ttl,
      limit: AUTH_RATE_LIMITS.oauth.limit,
    },
  })
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google consent screen',
  })
  googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @SkipThrottle()
  @UseGuards(GoogleAuthGuard)
  @Redirect()
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend with ephemeral authorization code',
  })
  async googleAuthCallback(
    @Request()
    req: {
      user: { accessToken: string; user: SafeUser; cookie: CookieConfig };
    },
  ) {
    const code = await this.authService.generateOAuthCode(req.user);
    const frontendUrl = this.getValidatedFrontendUrl();
    return {
      url: `${frontendUrl}/auth/callback?code=${code}`,
    };
  }

  @Get('github')
  @Throttle({
    global: {
      ttl: AUTH_RATE_LIMITS.oauth.ttl,
      limit: AUTH_RATE_LIMITS.oauth.limit,
    },
  })
  @UseGuards(GitHubAuthGuard)
  @ApiOperation({ summary: 'Initiate GitHub OAuth login' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to GitHub authorization',
  })
  githubAuth() {
    // Guard redirects to GitHub
  }

  @Get('github/callback')
  @SkipThrottle()
  @UseGuards(GitHubAuthGuard)
  @Redirect()
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend with ephemeral authorization code',
  })
  async githubAuthCallback(
    @Request()
    req: {
      user: { accessToken: string; user: SafeUser; cookie: CookieConfig };
    },
  ) {
    const code = await this.authService.generateOAuthCode(req.user);
    const frontendUrl = this.getValidatedFrontendUrl();
    return {
      url: `${frontendUrl}/auth/callback?code=${code}`,
    };
  }

  @Post('oauth/exchange')
  @Throttle({
    global: {
      ttl: AUTH_RATE_LIMITS.oauth.ttl,
      limit: AUTH_RATE_LIMITS.oauth.limit,
    },
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange ephemeral OAuth code for tokens' })
  @ApiResponse({ status: 200, description: 'Tokens returned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired authorization code',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many exchange attempts — rate limited (10 req/60s per IP)',
  })
  async exchangeOAuthCode(
    @Body() dto: OAuthExchangeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.exchangeOAuthCode(dto.code);
    this.setCookie(res, result.cookie);
    return { accessToken: result.accessToken, user: result.user };
  }

  // ── Trusted Device Endpoints ──────────────────────────────────────

  @Post('trusted-devices')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ global: { ttl: 60_000, limit: 5 } })
  @ApiOperation({
    summary: 'Mark current device as trusted (skips MFA on future logins)',
  })
  @ApiResponse({ status: 201, description: 'Device trusted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async trustDevice(@Body() dto: TrustDeviceDto, @Request() req: any) {
    const meta = this.extractRequestMeta(req);
    const device = await this.trustedDeviceService.trustDevice(
      req.user.id,
      dto.fingerprint,
      meta.ipAddress,
      meta.userAgent,
    );
    return {
      id: device.id,
      deviceName: device.deviceName,
      expiresAt: device.expiresAt,
    };
  }

  @Get('trusted-devices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List trusted devices for current user' })
  @ApiResponse({ status: 200, description: 'List of trusted devices' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listTrustedDevices(@Request() req: any) {
    return this.trustedDeviceService.listTrustedDevices(req.user.id);
  }

  @Delete('trusted-devices')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all trusted devices' })
  @ApiResponse({ status: 200, description: 'All trusted devices revoked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async revokeAllTrustedDevices(@Request() req: any) {
    const count = await this.trustedDeviceService.revokeAllDevices(req.user.id);
    return { message: 'All trusted devices revoked', count };
  }

  @Delete('trusted-devices/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke trust for a specific device' })
  @ApiResponse({ status: 200, description: 'Device trust revoked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async revokeTrustedDevice(
    @Param('id', ParseUUIDPipe) deviceId: string,
    @Request() req: any,
  ) {
    await this.trustedDeviceService.revokeDevice(req.user.id, deviceId);
    return { message: 'Device trust revoked' };
  }

  private getValidatedFrontendUrl(): string {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const allowedUrls = (
      process.env.OAUTH_ALLOWED_REDIRECT_URLS || frontendUrl
    )
      .split(',')
      .map((u) => u.trim());

    if (!allowedUrls.includes(frontendUrl)) {
      throw new UnauthorizedException('Invalid redirect configuration');
    }

    return frontendUrl;
  }
}
