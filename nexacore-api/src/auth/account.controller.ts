import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ValidateResetTokenDto } from './dto/validate-reset-token.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { VerifyEmailChangeDto } from './dto/verify-email-change.dto';
import { ResendVerificationPublicDto } from './dto/resend-verification-public.dto';
import { AUTH_RATE_LIMITS, THROTTLE_CONFIGS } from './constants/auth.constants';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SkipCsrf } from '../common/decorators/skip-csrf.decorator';
import { TurnstileGuard } from '../security/turnstile.guard';
import { NoCacheInterceptor } from '../common/interceptors/no-cache.interceptor';
import { extractRequestMeta } from '../common/utils/request-meta';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@ApiTags('Email Verification')
@UseInterceptors(NoCacheInterceptor)
@Controller('auth')
export class AccountController {
  constructor(private readonly authService: AuthService) {}

  // ── Email Verification Endpoints ──

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @SkipCsrf()
  @Throttle({
    global: {
      ttl: AUTH_RATE_LIMITS.verify_email.ttl,
      limit: AUTH_RATE_LIMITS.verify_email.limit,
    },
  })
  @ApiOperation({ summary: 'Verify email address via token (POST body)' })
  @ApiResponse({ status: 200, description: 'Verification result' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('verify-email-change')
  @HttpCode(HttpStatus.OK)
  @SkipCsrf()
  @Throttle({
    global: {
      ttl: AUTH_RATE_LIMITS.verify_email.ttl,
      limit: AUTH_RATE_LIMITS.verify_email.limit,
    },
  })
  @ApiOperation({ summary: 'Verify email change via token (POST body)' })
  @ApiResponse({ status: 200, description: 'Verification result' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async verifyEmailChange(@Body() dto: VerifyEmailChangeDto) {
    return this.authService.verifyEmailChange(dto.token);
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
  async resendVerification(@Request() req: AuthenticatedRequest) {
    await this.authService.resendVerificationEmail(req.user.id);
    return { message: 'Verification email sent' };
  }

  @Post('resend-verification-public')
  @UseGuards(TurnstileGuard)
  @HttpCode(HttpStatus.OK)
  @SkipCsrf()
  @Throttle(THROTTLE_CONFIGS.sensitiveAction)
  @ApiOperation({
    summary: 'Resend email verification (public, no auth required)',
  })
  @ApiResponse({
    status: 200,
    description: 'Generic success message (anti-enumeration)',
  })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async resendVerificationPublic(@Body() dto: ResendVerificationPublicDto) {
    await this.authService.resendVerificationByEmail(dto.email);
    return {
      message:
        'If an account exists and needs verification, we have sent an email',
    };
  }

  // ── Password Reset Endpoints ──

  @Post('forgot-password')
  @UseGuards(TurnstileGuard)
  @HttpCode(HttpStatus.OK)
  @SkipCsrf()
  @Throttle(THROTTLE_CONFIGS.sensitiveAction)
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
  @Throttle({
    global: {
      ttl: AUTH_RATE_LIMITS.reset_password.ttl,
      limit: AUTH_RATE_LIMITS.reset_password.limit,
    },
  })
  @ApiOperation({ summary: 'Reset password using token from email' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired token, or validation error',
  })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const meta = extractRequestMeta(req);
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
}
