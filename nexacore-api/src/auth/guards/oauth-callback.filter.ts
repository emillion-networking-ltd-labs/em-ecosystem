// WARNING: AUTH DOMAIN — changes require Jira ticket + owner approval (see workflow-standards.mdc §15 Auth Change-Control)

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { ErrorMessages } from '../../common/constants/error-messages';

/**
 * Catches exceptions on OAuth callback routes and redirects to the frontend
 * with a generic error message instead of returning a JSON/HTML error response.
 */
@Catch()
export class OAuthCallbackFilter implements ExceptionFilter {
  private readonly logger = new Logger(OAuthCallbackFilter.name);

  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const request = host.switchToHttp().getRequest<Request>();
    const response = host.switchToHttp().getResponse<Response>();
    const frontendUrl = this.configService.get<string>('app.frontendUrl')!;

    const isLinkFlow =
      request.oauthAction === 'link' ||
      (request.url && request.url.includes('/auth/link/'));
    const message =
      exception instanceof HttpException
        ? exception.message
        : exception instanceof Error
          ? exception.message
          : 'Unknown error';

    this.logger.warn(`OAuth callback failed: ${message}`);

    if (isLinkFlow) {
      // Link failure: redirect to profile with error (don't kill session)
      const isRateLimit =
        exception instanceof HttpException && exception.getStatus() === 429;
      const errorMsg = isRateLimit
        ? 'Too many requests. Please wait before trying again.'
        : 'This account is already linked to another user.';
      const encoded = encodeURIComponent(errorMsg);
      response.redirect(`${frontendUrl}/profile?link_error=${encoded}`);
    } else {
      // Login failure: redirect to auth callback with error
      const encoded = encodeURIComponent(
        ErrorMessages.auth.AUTHENTICATION_FAILED,
      );
      response.redirect(`${frontendUrl}/auth/callback?error=${encoded}`);
    }
  }
}
