// WARNING: AUTH DOMAIN — changes require Jira ticket + owner approval (see workflow-standards.mdc §15 Auth Change-Control)

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { TokenDenyListService } from '../token-deny-list.service';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { SafeUser, toSafeUser } from '../../users/entities/user.entity';
import { ErrorMessages } from '../../common/constants/error-messages';
import { JWT_ISSUER, JWT_AUDIENCE } from '../constants/auth.constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenDenyListService: TokenDenyListService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('auth.jwtSecret')!,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<SafeUser> {
    // sessionId may be undefined for in-flight tokens minted before SCRUM-347
    // deployed. isDenied skips the session check when the value is missing —
    // legacy tokens validate as before until they expire (15 min TTL window).
    const isDenied = await this.tokenDenyListService.isDenied(
      payload.jti,
      payload.sub,
      payload.iat,
      payload.sessionId,
    );
    if (isDenied) {
      throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }
    if (!user.isActive) {
      throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }
    return toSafeUser(user);
  }
}
