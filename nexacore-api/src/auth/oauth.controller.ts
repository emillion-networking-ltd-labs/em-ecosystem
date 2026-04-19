import {
  Controller,
  Post,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Res,
  Redirect,
  UnauthorizedException,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService, CookieConfig } from './auth.service';
import { setCookieFromConfig } from '../common/utils/cookie.util';
import {
  AUTH_RATE_LIMITS,
  OAUTH_CODE_COOKIE_MAX_AGE_MS,
} from './constants/auth.constants';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GitHubAuthGuard } from './guards/github-auth.guard';
import { OAuthCallbackFilter } from './guards/oauth-callback.filter';
import { OAuthLinkGuard } from './guards/oauth-link.guard';
import { OAuthLinkCodeStore } from './stores/oauth-link-code.store';
import { SkipCsrf } from '../common/decorators/skip-csrf.decorator';
import { SafeUser } from '../users/entities/user.entity';
import { ErrorMessages } from '../common/constants/error-messages';
import { NoCacheInterceptor } from '../common/interceptors/no-cache.interceptor';

@ApiTags('OAuth')
@UseInterceptors(NoCacheInterceptor)
@Controller('auth')
export class OAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly oauthLinkCodeStore: OAuthLinkCodeStore,
  ) {}

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
  @UseFilters(OAuthCallbackFilter)
  @Redirect()
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend with ephemeral code in httpOnly cookie',
  })
  async googleAuthCallback(
    @Request()
    req: {
      user: {
        accessToken: string;
        user: SafeUser;
        cookie: CookieConfig;
        oauthAction?: 'login' | 'created' | 'linked';
      };
    },
    @Res({ passthrough: true }) res: Response,
  ) {
    const code = await this.authService.generateOAuthCode(req.user);
    const frontendUrl = this.getValidatedFrontendUrl();
    this.setOAuthCodeCookie(res, code);
    return {
      url: `${frontendUrl}/auth/callback`,
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
  @UseFilters(OAuthCallbackFilter)
  @Redirect()
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend with ephemeral code in httpOnly cookie',
  })
  async githubAuthCallback(
    @Request()
    req: {
      user: {
        accessToken: string;
        user: SafeUser;
        cookie: CookieConfig;
        oauthAction?: 'login' | 'created' | 'linked';
      };
    },
    @Res({ passthrough: true }) res: Response,
  ) {
    const code = await this.authService.generateOAuthCode(req.user);
    const frontendUrl = this.getValidatedFrontendUrl();
    this.setOAuthCodeCookie(res, code);
    return {
      url: `${frontendUrl}/auth/callback`,
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
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired authorization code',
  })
  @ApiResponse({
    status: 429,
    description:
      'Too many exchange attempts — rate limited (10 req/60s per IP)',
  })
  async exchangeOAuthCode(
    @Request() req: { cookies?: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ) {
    const code = req.cookies?.['oauth_code'];
    if (!code) {
      throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }
    res.clearCookie('oauth_code', { path: '/' });
    const result = await this.authService.exchangeOAuthCode(code);
    setCookieFromConfig(res, result.cookie);
    return {
      accessToken: result.accessToken,
      user: result.user,
      ...(result.oauthAction &&
        result.oauthAction !== 'login' && { oauthAction: result.oauthAction }),
    };
  }

  // ── OAuth Link Endpoints ───────────────────────────────────────────

  @Post('link/code')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Generate short-lived code for OAuth account linking',
  })
  @ApiResponse({ status: 201, description: 'Link code generated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateLinkCode(@Request() req: { user: { id: string } }) {
    const code = await this.oauthLinkCodeStore.generate(req.user.id);
    return { code };
  }

  @Get('link/google')
  @Throttle({
    global: {
      ttl: AUTH_RATE_LIMITS.oauth.ttl,
      limit: AUTH_RATE_LIMITS.oauth.limit,
    },
  })
  @UseGuards(OAuthLinkGuard, GoogleAuthGuard)
  @UseFilters(OAuthCallbackFilter)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link Google account to authenticated user' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google consent screen',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — invalid or expired link code',
  })
  googleLinkAuth() {
    // OAuthLinkGuard validates link code and sets req.oauthAction='link' + req.user.id
    // GoogleAuthGuard then generates state with action=link and userId, redirects to Google
  }

  @Get('link/github')
  @Throttle({
    global: {
      ttl: AUTH_RATE_LIMITS.oauth.ttl,
      limit: AUTH_RATE_LIMITS.oauth.limit,
    },
  })
  @UseGuards(OAuthLinkGuard, GitHubAuthGuard)
  @UseFilters(OAuthCallbackFilter)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link GitHub account to authenticated user' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to GitHub authorization',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — invalid or expired link code',
  })
  githubLinkAuth() {
    // OAuthLinkGuard validates link code and sets req.oauthAction='link' + req.user.id
    // GitHubAuthGuard then generates state with action=link and userId, redirects to GitHub
  }

  private setOAuthCodeCookie(res: Response, code: string): void {
    res.cookie('oauth_code', code, {
      httpOnly: true,
      secure: this.configService.get<string>('app.nodeEnv') === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: OAUTH_CODE_COOKIE_MAX_AGE_MS,
    });
  }

  private getValidatedFrontendUrl(): string {
    const frontendUrl = this.configService.get<string>('app.frontendUrl')!;
    const allowedUrlsRaw = this.configService.get<string>(
      'app.oauthAllowedRedirectUrls',
    );
    const allowedUrls = (allowedUrlsRaw || frontendUrl)
      .split(',')
      .map((u) => u.trim());

    if (!allowedUrls.includes(frontendUrl)) {
      throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }

    return frontendUrl;
  }
}
