import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { TurnstileService } from './turnstile.service';
import { ErrorMessages } from '../common/constants/error-messages';

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
      throw new ForbiddenException(
        ErrorMessages.security.VERIFICATION_REQUIRED,
      );
    }

    const ip: string | undefined = request.ip || request.socket?.remoteAddress;
    const valid = await this.turnstileService.verify(token, ip);

    if (!valid) {
      throw new ForbiddenException(ErrorMessages.security.VERIFICATION_FAILED);
    }

    return true;
  }
}
