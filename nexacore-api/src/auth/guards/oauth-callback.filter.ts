import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

/**
 * Catches exceptions on OAuth callback routes and redirects to the frontend
 * with an error message instead of returning a JSON/HTML error response.
 */
@Catch()
export class OAuthCallbackFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    let message = 'Authentication failed';
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      message = typeof body === 'string' ? body : (body as any)?.message || message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const encoded = encodeURIComponent(message);
    response.redirect(`${frontendUrl}/auth/callback?error=${encoded}`);
  }
}
