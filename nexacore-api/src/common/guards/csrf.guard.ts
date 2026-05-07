import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as crypto from 'crypto';
import { SKIP_CSRF_KEY } from '../decorators/skip-csrf.decorator';
import { SecurityConfig } from '../../security/security.config';
import { ErrorMessages } from '../constants/error-messages';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (SAFE_METHODS.has(request.method.toUpperCase())) {
      return true;
    }

    const skipCsrf = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipCsrf) {
      return true;
    }

    const cookieName = SecurityConfig.csrf.cookieName;
    const headerName = SecurityConfig.csrf.headerName;

    const cookieToken = request.cookies?.[cookieName] as string | undefined;
    const headerToken = request.headers[headerName] as string | undefined;

    if (!cookieToken || !headerToken) {
      throw new ForbiddenException(ErrorMessages.csrf.VALIDATION_FAILED);
    }

    if (!this.verifyToken(cookieToken)) {
      throw new ForbiddenException(ErrorMessages.csrf.VALIDATION_FAILED);
    }

    if (!this.timingSafeEqual(cookieToken, headerToken)) {
      throw new ForbiddenException(ErrorMessages.csrf.VALIDATION_FAILED);
    }

    return true;
  }

  private verifyToken(token: string): boolean {
    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [randomPart, signature] = parts;
    const secret = SecurityConfig.csrf.getSecret();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(randomPart)
      .digest('hex');

    return this.timingSafeEqual(signature, expectedSignature);
  }

  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    return crypto.timingSafeEqual(bufA, bufB);
  }

  static generateToken(): string {
    const secret = SecurityConfig.csrf.getSecret();
    const randomPart = crypto
      .randomBytes(SecurityConfig.csrf.tokenLength)
      .toString('hex');
    const signature = crypto
      .createHmac('sha256', secret)
      .update(randomPart)
      .digest('hex');
    return `${randomPart}.${signature}`;
  }
}
