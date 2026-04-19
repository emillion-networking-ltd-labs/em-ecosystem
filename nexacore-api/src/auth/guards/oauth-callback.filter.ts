import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
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
    const request = host.switchToHttp().getRequest();
    const response = host.switchToHttp().getResponse<Response>();
    const frontendUrl = this.configService.get<string>('app.frontendUrl')!;

    const isLinkFlow = request.oauthAction === 'link';
    const message =
      exception instanceof HttpException
        ? exception.message
        : exception instanceof Error
          ? exception.message
          : 'Unknown error';

    this.logger.warn(`OAuth callback failed: ${message}`);

    if (isLinkFlow) {
      // Link failure: redirect to profile with error (don't kill session)
      const encoded = encodeURIComponent(
        'Unable to link this provider. It may already be linked to another account.',
      );
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
