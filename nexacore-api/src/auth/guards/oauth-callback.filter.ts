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
    const response = host.switchToHttp().getResponse<Response>();
    const frontendUrl = this.configService.get<string>('app.frontendUrl')!;

    if (exception instanceof HttpException) {
      this.logger.warn(`OAuth callback failed: ${exception.message}`);
    } else if (exception instanceof Error) {
      this.logger.warn(`OAuth callback failed: ${exception.message}`);
    } else {
      this.logger.warn('OAuth callback failed with unknown error');
    }

    const encoded = encodeURIComponent(
      ErrorMessages.auth.AUTHENTICATION_FAILED,
    );
    response.redirect(`${frontendUrl}/auth/callback?error=${encoded}`);
  }
}
