import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { TurnstileService } from './turnstile.service';

interface TurnstileRequest {
  body: { turnstileToken?: string };
  ip?: string;
  socket?: { remoteAddress?: string };
}

@Injectable()
export class TurnstileGuard implements CanActivate {
  constructor(private readonly turnstileService: TurnstileService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TurnstileRequest>();
    const token: string | undefined = request.body?.turnstileToken;

    if (!token) {
      throw new ForbiddenException('CAPTCHA verification required.');
    }

    const ip: string | undefined = request.ip || request.socket?.remoteAddress;
    const valid = await this.turnstileService.verify(token, ip);

    if (!valid) {
      throw new ForbiddenException(
        'CAPTCHA verification failed. Please try again.',
      );
    }

    return true;
  }
}
